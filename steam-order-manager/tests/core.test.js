import test from 'node:test';
import assert from 'node:assert/strict';
import {priceMinor, validateConfig, planOrder, reconcileRow, DEFAULT_CONFIG} from '../core.js';

const row = {id: 'one', appid: 730, name: 'AK-47 | Redline (Field-Tested)', price: '1.15', quantity: 10, active: true};
const order = {id: '123', appid: 730, name: row.name, remaining: 2};
function harness(orders = []) {
  const pending = new Map(), calls = [], reports = [];
  return {
    row, threshold: 2, snapshot: {orders}, pending, calls, reports,
    allowed: async () => true,
    journal: {get: async id => pending.get(id), set: async (id, intent) => pending.set(id, intent), clear: async id => pending.delete(id)},
    report: async data => reports.push(data),
    api: {quote: async () => [{price: 114, quantity: 10}], cancel: async id => calls.push(['cancel', id]), snapshot: async () => ({orders: []}), create: async (item, total) => {calls.push(['create', item.quantity, total]); return {success: 1, buy_orderid: '456'};}}
  };
}
test('automation defaults off; interval and full Steam identity validation', () => {
  assert.equal(DEFAULT_CONFIG.enabled, false);
  assert.equal(validateConfig({interval: 5, threshold: 2, rows: [row]}).rows[0].name, row.name);
  for (const patch of [{interval: 0}, {threshold: 3}, {rows: [row, {...row, id: 'two'}]}, {rows: [{...row, quantity: 1.5}]}, {rows: [{...row, price: '0'}]}]) assert.throws(() => validateConfig({interval: 5, threshold: 2, rows: [row], ...patch}));
});
test('decimal money is exact, no float multiplication or rounding up', () => {
  assert.equal(priceMinor('1,15'), 115); assert.equal(priceMinor('0.29') * 10, 290);
  for (const value of ['1.001', '-1', 'NaN', 'Infinity', '0', '1e3']) assert.throws(() => priceMinor(value));
});
test('orders above threshold are kept; qualities/apps matched exactly', () => {
  assert.equal(planOrder(row, [{...order, remaining: 3}], 2).kind, 'keep');
  assert.equal(planOrder(row, [{...order, name: 'AK-47 | Redline (Minimal Wear)'}], 2).kind, 'create');
  assert.equal(planOrder(row, [{...order, appid: 570}], 2).kind, 'create');
  assert.throws(() => planOrder(row, [order, {...order, id: '124'}], 2));
});
test('1/2-unit targets do not churn untouched orders', () => {
  assert.equal(planOrder({...row, quantity: 1}, [{...order, remaining: 1}], 2).kind, 'keep');
  assert.equal(planOrder({...row, quantity: 2}, order ? [{...order, remaining: 2}] : [], 2).kind, 'keep');
  assert.equal(planOrder({...row, quantity: 2}, [{...order, remaining: 1}], 2).kind, 'replace');
});
test('missing order creates table quantity at total unit price × quantity', async () => {
  const h = harness(); await reconcileRow(h);
  assert.deepEqual(h.calls, [['create', 10, 1150]]); assert.equal(h.pending.size, 0);
  assert.equal(h.reports[0].remaining, null); // Creation can immediately fill: do not invent remaining.
});
test('1 or 2 remaining cancels, verifies disappearance, then creates full quantity', async () => {
  for (const remaining of [1, 2]) {const h = harness([{...order, remaining}]); await reconcileRow(h); assert.deepEqual(h.calls, [['cancel', '123'], ['create', 10, 1150]]);}
});
test('failed or unconfirmed cancellation never creates', async () => {
  const h = harness([order]); h.api.cancel = async () => {throw new Error('timeout');};
  await assert.rejects(reconcileRow(h), /timeout/); assert.equal(h.calls.length, 0);
  const h2 = harness([order]); h2.api.snapshot = async () => ({orders: [order]});
  await assert.rejects(reconcileRow(h2), /Скасування/); assert.deepEqual(h2.calls, [['cancel', '123']]);
});
test('new competing order discovered after cancel prevents duplicate creation', async () => {
  const h = harness([order]); h.api.snapshot = async () => ({orders: [{...order, id: '999'}]});
  await assert.rejects(reconcileRow(h), /інший ордер/); assert.equal(h.calls.length, 1);
});
test('disable before dispatch or after cancellation stops further writes', async () => {
  const h = harness(); h.allowed = async () => false; await reconcileRow(h); assert.equal(h.calls.length, 0);
  const h2 = harness([order]); let checks = 0; h2.allowed = async () => ++checks === 1;
  await reconcileRow(h2); assert.deepEqual(h2.calls, [['cancel', '123']]);
});
test('ambiguous create remains blocked across restart even if no active order', async () => {
  const h = harness(); h.api.create = async () => {h.calls.push(['create']); throw new Error('lost response');};
  await assert.rejects(reconcileRow(h), /lost response/); assert.equal(h.pending.get(row.id).phase, 'create');
  await assert.rejects(reconcileRow(h), /Невизначений/); assert.equal(h.calls.length, 1);
});
test('confirmation required and malformed success stay blocked', async () => {
  for (const response of [{need_confirmation: true}, {success: 1}, {success: 0, message: 'No funds'}]) {
    const h = harness(); h.api.create = async () => response; await assert.rejects(reconcileRow(h)); assert.equal(h.pending.get(row.id).phase, 'create');
  }
});
test('cancel journal recovers from snapshot after worker restart', async () => {
  const h = harness(); h.pending.set(row.id, {phase: 'cancel', orderId: '123'});
  await reconcileRow(h); assert.deepEqual(h.calls, [['create', 10, 1150]]); assert.equal(h.pending.size, 0);
});
