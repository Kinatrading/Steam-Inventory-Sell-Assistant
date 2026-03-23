const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateGrossFromNet,
  calculateNetFromGross,
  calculateGrossFromNetCents,
  calculateNetFromGrossCents,
} = require('./steam-market-fees.js');

test('calculateGrossFromNet keeps 600 net at 690 gross for CS2 fees', () => {
  assert.equal(calculateGrossFromNet(600), 690);
});

test('calculateNetFromGross converts 600 gross to the exact Steam net amount', () => {
  assert.equal(calculateNetFromGross(600), 521.75);
});

test('minimum net 0.01 becomes minimum gross 0.03', () => {
  assert.equal(calculateGrossFromNet(0.01), 0.03);
  assert.equal(calculateNetFromGross(0.03), 0.01);
});

test('unreachable gross values normalize down to the nearest exact Steam buyer-pay amount', () => {
  const netCents = calculateNetFromGrossCents(22);
  assert.equal(netCents, 19);
  assert.equal(calculateGrossFromNetCents(netCents), 21);
});

test('gross to net to gross is stable for reachable buyer-pay values in the checked range', () => {
  for (let grossCents = 3; grossCents <= 2000; grossCents += 1) {
    const netCents = calculateNetFromGrossCents(grossCents);
    assert.ok(Number.isFinite(netCents), `missing net for gross ${grossCents}`);
    const canonicalGrossCents = calculateGrossFromNetCents(netCents);
    assert.ok(canonicalGrossCents <= grossCents, `canonical gross must not exceed requested gross ${grossCents}`);
    if (canonicalGrossCents === grossCents) {
      assert.equal(calculateNetFromGrossCents(canonicalGrossCents), netCents);
    }
  }
});
