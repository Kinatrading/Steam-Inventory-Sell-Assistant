const $ = id => document.getElementById(id);
let config, rt, dirty = false;
const WEARS = ['', 'Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
async function send(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({type, ...payload});
  if (!response?.ok) throw new Error(response?.error || 'Немає відповіді розширення.');
  return response;
}
function message(text, error = false) {$('status').textContent = text; $('status').className = error ? 'error' : '';}
function markDirty() {dirty = true; $('save').textContent = 'Зберегти зміни •';}
function input(value, className, type = 'text') {
  const el = document.createElement('input'); el.value = value; el.className = className; el.type = type;
  if (type === 'number') {el.min = '1'; el.step = className === 'price' ? '0.01' : '1';}
  el.addEventListener('input', markDirty); return el;
}
function readRows() {
  return [...$('rows').children].map(tr => ({id: tr.dataset.id, appid: Number(tr.querySelector('.appid').value), name: tr.querySelector('.name').value.trim(), price: tr.querySelector('.price').value, quantity: Number(tr.querySelector('.quantity').value), active: tr.querySelector('.active').checked}));
}
function renderRows(rows) {
  $('rows').replaceChildren();
  for (const row of rows) {
    const tr = document.createElement('tr'); tr.dataset.id = row.id;
    const active = input('', 'active', 'checkbox'); active.checked = row.active !== false;
    const appid = input(row.appid, 'appid', 'number'), name = input(row.name, 'name');
    name.placeholder = 'AK-47 | Redline (Field-Tested)';
    const wear = document.createElement('select'); wear.className = 'wear';
    for (const value of WEARS) {const option = document.createElement('option'); option.value = value; option.textContent = value || 'Без зношення'; wear.append(option);}
    const syncWear = () => {wear.value = WEARS.find(w => w && name.value.endsWith(` (${w})`)) || '';}; syncWear();
    name.addEventListener('input', syncWear);
    wear.addEventListener('change', () => {name.value = name.value.replace(/ \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/, '') + (wear.value ? ` (${wear.value})` : ''); markDirty();});
    const price = input(row.price, 'price', 'number'), quantity = input(row.quantity, 'quantity', 'number'); quantity.max = '1000';
    const status = document.createElement('div'); status.className = 'row-status';
    const remove = document.createElement('button'); remove.textContent = '×'; remove.className = 'remove'; remove.title = 'Видалити з таблиці; ордер у Steam залишиться';
    remove.addEventListener('click', () => {if (rt?.pending[row.id]) return message('Спочатку перевір і розблокуй незавершену операцію цього рядка.', true); tr.remove(); markDirty(); updateCount();});
    for (const el of [active, appid, name, wear, price, quantity, status, remove]) {const td = document.createElement('td'); td.append(el); tr.append(td);}
    $('rows').append(tr);
  }
  updateCount(); renderRuntime();
}
function updateCount() {$('count').textContent = $('rows').children.length; $('empty').hidden = !!$('rows').children.length;}
function renderRuntime() {
  if (!rt) return;
  for (const tr of $('rows').children) {
    const status = tr.querySelector('.row-status'), result = rt.rows?.[tr.dataset.id]; status.replaceChildren();
    if (result) {
      const strong = document.createElement('strong'); strong.textContent = result.remaining == null ? '—' : `${result.remaining} шт.`; status.append(strong, document.createElement('br'), result.status, document.createElement('br'), new Date(result.checked).toLocaleTimeString('uk-UA'));
    } else status.textContent = 'Ще не перевірено';
    if (rt.pending?.[tr.dataset.id]?.phase === 'create') {
      const unlock = document.createElement('button'); unlock.textContent = 'Розблокувати';
      unlock.onclick = () => act(async () => {
        if (!confirm('Перевір ордери та історію покупок у Steam. Створення могло успішно завершитися навіть без відповіді. Розблокувати цей рядок після ручної перевірки?')) return;
        await send('unlock', {id: tr.dataset.id}); await refresh();
      }); status.append(document.createElement('br'), unlock);
    }
  }
}
async function save() {
  await send('save', {config: {interval: Number($('interval').value), threshold: Number($('threshold').value), rows: readRows()}});
  dirty = false; $('save').textContent = 'Зберегти таблицю';
}
async function refresh() {
  const state = await send('state'); config = state.config; rt = state.runtime;
  $('enabled').checked = config.enabled;
  if (!dirty) {$('interval').value = config.interval; $('threshold').value = config.threshold;}
  $('check').disabled = !config.enabled || rt.busy;
  renderRuntime();
  const currency = config.currency ? ` · валюта Steam #${config.currency} · акаунт ${config.account}` : '';
  message((rt.error || (rt.busy ? 'Перевірка ордерів…' : config.enabled ? `Автооновлення ввімкнене · кожні ${config.interval} хв.` : 'Автооновлення вимкнене')) + currency + (rt.lastCheck ? ` · остання перевірка ${new Date(rt.lastCheck).toLocaleString('uk-UA')}` : ''), !!rt.error);
}
async function act(fn) {try {await fn();} catch (error) {message(error.message, true);}}
$('add').onclick = () => {const rows = readRows(); rows.push({id: crypto.randomUUID(), appid: 730, name: '', price: '', quantity: 10, active: true}); renderRows(rows); markDirty();};
$('save').onclick = () => act(async () => {await save(); await refresh();});
$('interval').oninput = markDirty; $('threshold').onchange = markDirty;
$('enabled').onchange = () => act(async () => {
  const enabled = $('enabled').checked;
  $('enabled').disabled = true;
  try {if (enabled) {await save(); await send('start');} else await send('stop');}
  finally {$('enabled').disabled = false; await refresh();}
});
$('check').onclick = () => act(async () => {if (dirty) await save(); await send('check'); await refresh();});
await act(async () => {await refresh(); renderRows(config.rows);});
chrome.storage.onChanged.addListener((changes, area) => {if (area === 'local' && (changes.runtime || changes.config)) void act(refresh);});
