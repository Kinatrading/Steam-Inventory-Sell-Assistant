// Adapted from slab/extension/background.js runBuyFlow() and public Inventory
// Assistant's runInSteamTab(): MAIN-world session, credentialed form POST.
export async function steamOperation(operation, args = {}) {
  const tabs = await chrome.tabs.query({url: 'https://steamcommunity.com/market*'});
  let tab = tabs.find(t => t.status === 'complete');
  if (!tab) {
    tab = await chrome.tabs.create({url: 'https://steamcommunity.com/market/', active: false});
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {chrome.tabs.onUpdated.removeListener(listener); reject(new Error('Steam-вкладка не завантажилася.'));}, 20000);
      const listener = (id, info) => {if (id === tab.id && info.status === 'complete') {clearTimeout(timer); chrome.tabs.onUpdated.removeListener(listener); resolve();}};
      chrome.tabs.onUpdated.addListener(listener);
      chrome.tabs.get(tab.id).then(t => {if (t.status === 'complete') listener(t.id, {status: 'complete'});}, reject);
    });
  }
  const [execution] = await chrome.scripting.executeScript({target: {tabId: tab.id}, world: 'MAIN', args: [operation, args], func: runSteamOperation});
  if (!execution?.result?.ok) throw new Error(execution?.result?.error || 'Немає відповіді Steam.');
  return execution.result.data;
}

// Self-contained because Chrome serializes this function into the Steam page.
export async function runSteamOperation(operation, args) {
  try {
    const request = async (path, fields) => {
      const response = await fetch(path, {method: fields ? 'POST' : 'GET', credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(18000), ...(fields ? {
        headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
        body: new URLSearchParams(fields).toString()
      } : {})});
      if (response.status === 429) throw new Error('Steam 429: забагато запитів. Наступна спроба через 20 хвилин.');
      if (!response.ok) throw new Error(`Steam HTTP ${response.status}`);
      if (new URL(response.url).pathname.includes('/login')) throw new Error('Увійди у Steam.');
      return response.text();
    };
    const html = await request('/market/?l=english');
    const steamid = html.match(/g_steamID\s*=\s*["'](\d+)["']/)?.[1];
    const sessionid = html.match(/g_sessionID\s*=\s*["']([^"']+)["']/)?.[1];
    const walletRaw = html.match(/(?:var\s+)?g_rgWalletInfo\s*=\s*(\{[^;]*\})\s*;/)?.[1];
    const wallet = walletRaw ? JSON.parse(walletRaw) : null;
    const currency = Number(wallet?.wallet_currency);
    if (!steamid || !sessionid || !Number.isInteger(currency) || currency < 1) throw new Error('Увійди у Steam з доступним гаманцем і маркетом.');
    if (args.account && (args.account !== steamid || args.currency !== currency)) throw new Error('Steam-акаунт або валюта змінилися. Вимкни автооновлення і прив’яжи поточний акаунт.');
    if (operation === 'histogram') {
      let itemNameId = args.itemNameId;
      if (!Number.isSafeInteger(itemNameId) || itemNameId <= 0) {
        const listing = await request(`/market/listings/${args.row.appid}/${encodeURIComponent(args.row.name)}?l=english`);
        itemNameId = Number(listing.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/)?.[1]);
      }
      if (!Number.isSafeInteger(itemNameId) || itemNameId <= 0) throw new Error('Для предмета не знайдено item_nameid.');
      // ItemFinder buildAddedItemsOrderRequest contract; always actual wallet currency.
      const query = new URLSearchParams({country: args.country || 'CZ', language: 'english', currency: String(currency), item_nameid: String(itemNameId)});
      return {ok: true, data: JSON.parse(await request('/market/itemordershistogram?' + query))};
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const container = doc.querySelector('#mybuyorders');
    if (!container) throw new Error('Steam не повернув повний список buy orders. Запис заборонено.');
    const orders = [...container.querySelectorAll('[id^="mybuyorder_"], [id^="market_buyorder_"]')].map(el => {
      const id = el.id.match(/(?:mybuyorder|market_buyorder)_(\d+)/)?.[1];
      const link = el.querySelector('a[href*="/market/listings/"]');
      const match = link && new URL(link.href, location.origin).pathname.match(/^\/market\/listings\/(\d+)\/(.+)$/);
      const quantity = el.querySelector('.market_listing_buyorder_qty .market_listing_price, .market_listing_buyorder_qty');
      const rawQuantity = quantity?.textContent.trim();
      if (!id || !match || !/^\d[\d,\s]*$/.test(rawQuantity || '')) throw new Error('Невідомий формат рядка buy order.');
      const remaining = Number(rawQuantity.replace(/[,\s]/g, ''));
      if (!Number.isInteger(remaining) || remaining < 1) throw new Error('Невідомий залишок buy order.');
      return {id, appid: Number(match[1]), name: decodeURIComponent(match[2]), remaining};
    });
    // Never interpret an unrecognized/nonempty container as an empty order list.
    const visibleRows = container.querySelectorAll('.market_listing_row');
    if (visibleRows.length !== orders.length) throw new Error('Список ордерів розпізнано не повністю.');
    const countText = doc.querySelector('#my_market_buyorders_number')?.textContent.trim();
    const count = countText?.replace(/[(),\s]/g, '');
    if (!/^\d+$/.test(count || '') || Number(count) !== orders.length) throw new Error('Список ордерів неповний або відсутній лічильник.');
    if (container.querySelector('.market_paging')) throw new Error('Пагінований список ордерів: потрібна ручна перевірка.');
    const snapshot = {account: steamid, currency, orders};
    if (operation === 'snapshot') return {ok: true, data: snapshot};
    if (!args.account) throw new Error('Спочатку прив’яжи Steam-акаунт.');
    let path, fields;
    if (operation === 'cancel') {
      if (!orders.some(o => o.id === args.orderId && o.appid === args.row.appid && o.name === args.row.name)) {
        return {ok: true, data: {success: 1}}; // Filled/disappeared since snapshot: nothing to cancel.
      }
      path = '/market/cancelbuyorder/'; fields = {sessionid, buy_orderid: args.orderId};
    } else if (operation === 'create') {
      if (orders.some(o => o.appid === args.row.appid && o.name === args.row.name)) throw new Error('Ордер уже існує.');
      path = '/market/createbuyorder/';
      // slab's original form used currency=3 and quantity=1. Keep its form
      // contract, with actual wallet currency and configured batch total.
      fields = {sessionid, currency: String(currency), appid: String(args.row.appid), market_hash_name: args.row.name, price_total: String(args.total), quantity: String(args.row.quantity), confirmation: 0};
    } else throw new Error('Невідома операція.');
    const data = JSON.parse(await request(path, fields));
    // A create failure can be ambiguous; keep its journal until the user checks Steam.
    if (operation === 'cancel' && Number(data.success) !== 1) throw new Error(data.message || 'Steam не підтвердив скасування.');
    return {ok: true, data};
  } catch (error) {return {ok: false, error: error.message};}
}
