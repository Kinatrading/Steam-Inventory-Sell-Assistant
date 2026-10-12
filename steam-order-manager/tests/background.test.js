import test from 'node:test';
import assert from 'node:assert/strict';

const row = {id: 'r1', appid: 730, name: 'Example (Factory New)', price: '0.29', quantity: 10, active: true};
const event = () => ({listeners: [], addListener(fn) {this.listeners.push(fn);}, removeListener(fn) {this.listeners = this.listeners.filter(f => f !== fn);}});
const defer = () => {let resolve; const promise = new Promise(r => {resolve = r;}); return {promise, resolve};};
async function setup(config = {}, runtime = {}) {
  const data = {config: {enabled: false, interval: 5, threshold: 2, account: '76561198000000000', currency: 3, rows: [row], ...config}, runtime: {rows: {}, pending: {}, cursor: 0, ...runtime}};
  const alarms = new Map(), calls = [];
  let transport = async operation => operation === 'snapshot' ? {account: data.config.account, currency: 3, orders: []} : operation === 'histogram' ? {success: 1, highest_buy_order: '28', buy_order_graph: [[0.28, 2]]} : {success: 1, buy_orderid: '987'};
  globalThis.fetch = async () => ({ok: true, json: async () => ({[row.name]: 12345})});
  const chrome = {
    storage: {local: {get: async key => ({[key]: structuredClone(data[key])}), set: async patch => Object.assign(data, structuredClone(patch))}},
    alarms: {get: async name => alarms.get(name), create: async (name, props) => alarms.set(name, props), clear: async name => alarms.delete(name), onAlarm: event()},
    action: {onClicked: event()},
    runtime: {id: 'test', getURL: path => `chrome-extension://test/${path}`, onMessage: event(), onStartup: event(), onInstalled: event()},
    tabs: {query: async () => [{id: 1, status: 'complete'}]},
    scripting: {executeScript: async request => {calls.push(request.args[0]); return [{result: {ok: true, data: await transport(...request.args)}}];}}
  };
  globalThis.chrome = chrome;
  await import(`../background.js?test=${Math.random()}`);
  await new Promise(resolve => setImmediate(resolve));
  const send = message => new Promise(resolve => chrome.runtime.onMessage.listeners[0](message, {id: 'test', url: chrome.runtime.getURL('dashboard.html')}, resolve));
  return {data, chrome, alarms, calls, send, setTransport: value => {transport = value;}};
}
test('MV3 persisted schedules, controls and financial journal', async t => {
  await t.test('restores enabled alarm and leaves disabled installs idle', async () => {
    const off = await setup(); assert.equal(off.alarms.size, 0);
    const on = await setup({enabled: true}); assert.equal(on.alarms.get('order-refresh').periodInMinutes, 5);
  });
  await t.test('manual check while disabled never reads or writes Steam', async () => {
    const h = await setup(); await h.send({type: 'check'}); await new Promise(resolve => setImmediate(resolve)); assert.equal(h.calls.length, 0);
  });
  await t.test('stop while initial snapshot is in flight wins over start', async () => {
    const h = await setup(), gate = defer(), entered = defer();
    h.setTransport(async () => {entered.resolve(); return gate.promise;});
    const start = h.send({type: 'start'}); await entered.promise;
    assert.equal((await h.send({type: 'stop'})).ok, true);
    gate.resolve({account: '76561198000000000', currency: 3, orders: []}); await start;
    assert.equal(h.data.config.enabled, false); assert.equal(h.alarms.size, 0); assert.deepEqual(h.calls, ['snapshot']);
  });
  await t.test('pending creation cannot be removed or edited through save', async () => {
    const h = await setup({}, {pending: {r1: {phase: 'create'}}});
    for (const rows of [[], [{...row, price: '0.30'}]]) {
      const result = await h.send({type: 'save', config: {interval: 5, threshold: 2, rows}}); assert.equal(result.ok, false);
    }
    assert.equal((await h.send({type: 'unlock', id: 'r1'})).ok, true);
    assert.equal((await h.send({type: 'save', config: {interval: 5, threshold: 2, rows: []}})).ok, true);
  });
  await t.test('successful cycle creates full total once and records status', async () => {
    const h = await setup({enabled: true}); await h.send({type: 'check'});
    for (let i = 0; i < 30 && !h.data.runtime.lastCheck; i++) await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(h.calls, ['snapshot', 'histogram', 'create']); assert.equal(h.data.runtime.rows.r1.orderId, '987');
    assert.deepEqual(h.data.runtime.pending, {}); assert.equal(h.data.runtime.busy, false);
  });
  await t.test('429 persists cooldown and a subsequent alarm makes no requests', async () => {
    const h = await setup({enabled: true}); h.setTransport(async () => {throw new Error('Steam 429');});
    await h.send({type: 'check'});
    for (let i = 0; i < 30 && !h.data.runtime.cooldownUntil; i++) await new Promise(resolve => setImmediate(resolve));
    assert.ok(h.data.runtime.cooldownUntil > Date.now()); await new Promise(resolve => setImmediate(resolve));
    await h.send({type: 'check'}); await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(h.calls, ['snapshot']);
  });
});
