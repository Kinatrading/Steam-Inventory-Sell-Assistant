import {chooseBid} from './histogram.js';
export const DEFAULT_CONFIG = {enabled: false, interval: 5, threshold: 2, bidStep: '1.00', country: 'CZ', rows: [], account: null, currency: null};

export function priceMinor(value) {
  const text = String(value).trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Ціна: додатне число, максимум 2 знаки після коми.');
  const [whole, fraction = ''] = text.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error('Некоректна ціна.');
  return result;
}

export function validateConfig(input) {
  const interval = Number(input.interval), threshold = Number(input.threshold);
  if (!Number.isInteger(interval) || interval < 1 || interval > 1440) throw new Error('Інтервал: від 1 до 1440 хвилин.');
  if (![1, 2].includes(threshold)) throw new Error('Поріг: 1 або 2 штуки.');
  const bidStep = String(input.bidStep ?? DEFAULT_CONFIG.bidStep), country = String(input.country ?? DEFAULT_CONFIG.country).trim().toUpperCase();
  priceMinor(bidStep);
  if (!/^[A-Z]{2}$/.test(country)) throw new Error('Країна histogram: дволітерний код, наприклад CZ.');
  if (!Array.isArray(input.rows) || input.rows.length > 200) throw new Error('Максимум 200 рядків.');
  const keys = new Set(), ids = new Set();
  const rows = input.rows.map(row => {
    const name = String(row.name || '').trim(), appid = Number(row.appid), quantity = Number(row.quantity);
    if (!name || name.length > 250 || !Number.isInteger(appid) || appid < 1) throw new Error('Потрібні App ID та точна назва Steam.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error('Кількість: від 1 до 1000.');
    const price = priceMinor(row.price);
    if (!Number.isSafeInteger(price * quantity)) throw new Error('Завелика загальна сума.');
    const key = `${appid}:${name}`, id = String(row.id || '');
    if (!id || ids.has(id) || keys.has(key)) throw new Error('Дублікати предметів або рядків заборонені.');
    keys.add(key); ids.add(id);
    return {id, name, appid, quantity, price: String(row.price).replace(',', '.'), active: row.active !== false};
  });
  return {interval, threshold, bidStep, country, rows};
}

export function planOrder(row, orders, threshold) {
  const matches = orders.filter(o => o.appid === row.appid && o.name === row.name);
  if (matches.length > 1) throw new Error('Кілька ордерів на один предмет. Перевір Steam вручну.');
  const order = matches[0];
  if (!order) return {kind: 'create'};
  if (!Number.isInteger(order.remaining) || order.remaining < 1 || !/^\d+$/.test(order.id)) throw new Error('Некоректний стан ордера.');
  const effectiveThreshold = Math.min(threshold, row.quantity - 1);
  if (order.remaining <= effectiveThreshold) return {kind: 'replace', order};
  return {kind: 'keep', order};
}

export async function reconcileRow({row, snapshot, threshold, bidStep = DEFAULT_CONFIG.bidStep, api, journal, allowed, report}) {
  const intent = await journal.get(row.id);
  // An interrupted create can have filled immediately: absence is not proof of failure.
  if (intent?.phase === 'create') throw new Error('Невизначений результат створення. Перевір ордер/покупки у Steam та розблокуй рядок.');
  const plan = planOrder(row, snapshot.orders, threshold);
  let levels = await api.quote();
  let unitPrice = chooseBid(priceMinor(row.price), priceMinor(bidStep), levels);
  const quoteState = () => ({topLevels: levels.slice(0, 3), quoteAt: Date.now(), nextUnitPrice: unitPrice});
  if (plan.kind === 'keep') return report({...quoteState(), remaining: plan.order.remaining, status: 'Ордер активний', orderId: plan.order.id});
  if (!await allowed()) return;
  if (plan.kind === 'replace') {
    await journal.set(row.id, {phase: 'cancel', orderId: plan.order.id});
    await api.cancel(plan.order.id);
    // Always verify cancellation from a fresh authoritative snapshot before creating.
    const fresh = await api.snapshot();
    if (fresh.orders.some(o => o.id === plan.order.id)) throw new Error('Скасування ще не підтверджено Steam.');
    if (fresh.orders.some(o => o.appid === row.appid && o.name === row.name)) throw new Error('У Steam вже є інший ордер на цей предмет.');
    // Price from a fresh book AFTER cancellation: do not deliberately outbid our old order.
    levels = await api.quote();
    unitPrice = chooseBid(priceMinor(row.price), priceMinor(bidStep), levels);
  }
  if (!await allowed()) return;
  await journal.set(row.id, {phase: 'create', at: Date.now()});
  const result = await api.create(row, unitPrice * row.quantity);
  if (result.need_confirmation) throw new Error('Steam потребує підтвердження. Перевір Steam та розблокуй рядок після завершення.');
  if (result.success !== 1 || !/^\d+$/.test(String(result.buy_orderid || ''))) {
    if (result.success !== 1 && result.definiteFailure) await journal.clear(row.id);
    throw new Error(result.message || 'Steam не підтвердив створення ордера.');
  }
  await journal.clear(row.id);
  return report({...quoteState(), unitPrice, remaining: null, status: 'Ордер створено; залишок після виконання — на наступній перевірці', orderId: String(result.buy_orderid)});
}
