import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from 'linkedom';
import {runSteamOperation} from '../steam.js';

const account = '76561198000000000';
const row = {appid: 730, name: 'AK-47 | Redline (Field-Tested)', quantity: 10};
const auth = {account, currency: 3, row};
const listing = `<div class="market_listing_row" id="mybuyorder_123"><a href="https://steamcommunity.com/market/listings/730/${encodeURIComponent(row.name)}">item</a><div class="market_listing_buyorder_qty"><span class="market_listing_price">2</span></div></div>`;
function fixture({rows = listing, count = '1', identity = account, currency = 3, container = true} = {}) {
  return `<html><script>g_steamID = "${identity}"; g_sessionID = "session"; var g_rgWalletInfo = {"wallet_currency":${currency}};</script><span id="my_market_buyorders_number">${count}</span>${container ? `<div id="mybuyorders">${rows}</div>` : ''}</html>`;
}
function mock(html, response = {success: 1, buy_orderid: '456'}) {
  const calls = []; globalThis.DOMParser = DOMParser; globalThis.location = {origin: 'https://steamcommunity.com'};
  globalThis.fetch = async (path, options) => {calls.push({path, options}); return {status: 200, ok: true, url: `https://steamcommunity.com${path}`, text: async () => options.method === 'GET' ? html : JSON.stringify(response)};};
  return calls;
}
test('Steam HTML parsing and writes fail closed', async t => {
  await t.test('reads encoded market name and quantity from fresh server HTML', async () => {
    mock(fixture()); const result = await runSteamOperation('snapshot', auth);
    assert.equal(result.ok, true); assert.deepEqual(result.data.orders, [{id: '123', appid: 730, name: row.name, remaining: 2}]);
  });
  await t.test('rejects account/currency changes, partial rows and absent authenticated list', async () => {
    for (const html of [fixture({identity: '76561198000000001'}), fixture({currency: 1}), fixture({container: false}), fixture({rows: ''}), fixture({count: ''}), fixture({rows: '<div class="market_listing_row">unknown</div>'})]) {
      const calls = mock(html); const result = await runSteamOperation('create', {...auth, total: 1150});
      assert.equal(result.ok, false); assert.equal(calls.length, 1);
    }
  });
  await t.test('creates correct form only after complete empty authenticated snapshot', async () => {
    const calls = mock(fixture({rows: '', count: '(0)'}));
    assert.equal((await runSteamOperation('create', {...auth, total: 1150})).ok, true);
    const form = new URLSearchParams(calls[1].options.body);
    assert.equal(calls[1].path, '/market/createbuyorder/');
    for (const [field, value] of Object.entries({sessionid: 'session', currency: '3', appid: '730', market_hash_name: row.name, price_total: '1150', quantity: '10'})) assert.equal(form.get(field), value);
    assert.equal(calls[1].options.credentials, 'include');
  });
  await t.test('existing item prevents create; cancel touches only exact selected order', async () => {
    let calls = mock(fixture()); assert.equal((await runSteamOperation('create', {...auth, total: 1150})).ok, false); assert.equal(calls.length, 1);
    calls = mock(fixture()); assert.equal((await runSteamOperation('cancel', {...auth, orderId: '123'})).ok, true); assert.equal(new URLSearchParams(calls[1].options.body).get('buy_orderid'), '123');
    calls = mock(fixture()); await runSteamOperation('cancel', {...auth, orderId: '999'}); assert.equal(calls.length, 1);
  });
  await t.test('Steam failure and confirmation payload do not become success', async () => {
    for (const payload of [{success: 0, message: 'failure'}, {need_confirmation: true}]) {mock(fixture({rows: '', count: '0'}), payload); assert.deepEqual((await runSteamOperation('create', {...auth, total: 1150})).data, payload);}
    mock(fixture(), {success: 0}); assert.equal((await runSteamOperation('cancel', {...auth, orderId: '123'})).ok, false);
  });
  await t.test('429 and malformed JSON abort operations', async () => {
    globalThis.fetch = async () => ({status: 429, ok: false}); assert.match((await runSteamOperation('snapshot', auth)).error, /429/);
    const calls = mock(fixture({rows: '', count: '0'}));
    const original = globalThis.fetch; globalThis.fetch = async (...args) => {const result = await original(...args); if (args[1].method === 'POST') result.text = async () => 'bad'; return result;};
    assert.equal((await runSteamOperation('create', {...auth, total: 1150})).ok, false); assert.equal(calls.length, 2);
  });
});
