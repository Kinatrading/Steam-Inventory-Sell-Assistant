import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHistogram, chooseBid} from '../histogram.js';
import {reconcileRow} from '../core.js';

test('34 highest, max 40 and step 1 creates 35; cap is never exceeded', () => {
  assert.equal(chooseBid(4000, 100, [{price: 3400}]), 3500);
  assert.equal(chooseBid(4000, 100, [{price: 4100}]), 4000);
  assert.equal(chooseBid(4000, 1, [{price: 3400}]), 3401);
  assert.equal(chooseBid(4000, 100, []), 100);
  assert.equal(chooseBid(29, 100, []), 29);
});
test('normalizes cumulative graph to sorted quantities for top-three levels', () => {
  const levels = normalizeHistogram({success: 1, highest_buy_order: '3400', buy_order_graph: [[32, 20], [34, 2], [33, 7], [31, 100]]});
  assert.deepEqual(levels.slice(0, 3), [{price: 3400, quantity: 2}, {price: 3300, quantity: 5}, {price: 3200, quantity: 13}]);
});
test('rejects incomplete, malformed, contradictory and nonmonotonic books', () => {
  for (const patch of [{success: 0}, {highest_buy_order: null}, {highest_buy_order: 3500}, {buy_order_graph: [[34, 5], [33, 2]]}, {buy_order_graph: [[34, false]]}, {buy_order_graph: [[null, 2]]}, {buy_order_graph: []}]) {
    assert.throws(() => normalizeHistogram({success: 1, highest_buy_order: '3400', buy_order_graph: [[34, 2]], ...patch}));
  }
  assert.deepEqual(normalizeHistogram({success: true, highest_buy_order: '0', buy_order_graph: []}), []);
});
test('replenishment reprices after cancel and submits full quantity at 35, not max 40', async () => {
  const row = {id: 'r', appid: 730, name: 'skin', price: '40', quantity: 10};
  const own = {id: '123', appid: 730, name: 'skin', remaining: 2}, calls = [], pending = new Map(); let quotes = 0, result;
  const h = {row, snapshot: {orders: [own]}, threshold: 2, bidStep: '1', allowed: async () => true,
    journal: {get: async id => pending.get(id), set: async (id, value) => pending.set(id, value), clear: async id => pending.delete(id)}, report: async data => {result = data;},
    api: {quote: async () => {calls.push('histogram'); return [{price: ++quotes === 1 ? 3900 : 3400, quantity: 3}];}, cancel: async () => calls.push('cancel'), snapshot: async () => ({orders: []}), create: async (_, total) => {calls.push(total); return {success: 1, buy_orderid: '456'};}}
  };
  await reconcileRow(h); assert.deepEqual(calls, ['histogram', 'cancel', 'histogram', 35000]); assert.equal(result.unitPrice, 3500); assert.equal(result.topLevels[0].price, 3400);
  calls.length = 0; h.api.quote = async () => {throw new Error('bad histogram');};
  await assert.rejects(reconcileRow(h), /bad histogram/); assert.deepEqual(calls, []);
});
