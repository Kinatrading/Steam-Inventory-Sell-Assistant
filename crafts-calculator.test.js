const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeSkinName,
  detectWearLabel,
  buildItemIndex,
  getCraftBuckets,
  analyzeCrafts,
  analyzePositiveCrafts,
} = require('./crafts-calculator.js');

test('normalizeSkinName removes wear suffix', () => {
  assert.equal(normalizeSkinName('AUG | Commando Company (Field-Tested)'), 'AUG | Commando Company');
});

test('analyzePositiveCrafts finds profitable consumer->industrial craft', () => {
  const db = [
    {
      name: 'P250 | Sand Dune',
      min_float: 0,
      max_float: 0.8,
      rarity: 'Consumer Grade',
      collections_or_crates: ['Dust Collection'],
    },
    {
      name: 'Glock-18 | Candy Apple',
      min_float: 0,
      max_float: 0.3,
      rarity: 'Industrial Grade',
      collections_or_crates: ['Dust Collection'],
    },
  ];

  const inventory = Array.from({ length: 10 }).map((_, idx) => ({
    marketHashName: 'P250 | Sand Dune (Field-Tested)',
    floatValue: 0.18 + idx * 0.001,
    assetid: String(idx + 1),
  }));

  const results = analyzePositiveCrafts(inventory, buildItemIndex(db));

  assert.ok(results.length > 0);
  assert.equal(results[0].inputRarity, 'Consumer Grade');
  assert.equal(results[0].outputRarity, 'Industrial Grade');
  assert.ok(['Minimal Wear', 'Factory New'].includes(detectWearLabel(results[0].expectedFloat)));
});

test('analyzePositiveCrafts supports mixing different input skin names in one collection', () => {
  const db = [
    {
      name: 'P250 | Sand Dune',
      min_float: 0,
      max_float: 0.8,
      rarity: 'Consumer Grade',
      collections_or_crates: ['Dust Collection'],
    },
    {
      name: 'USP-S | Check Engine',
      min_float: 0,
      max_float: 0.7,
      rarity: 'Consumer Grade',
      collections_or_crates: ['Dust Collection'],
    },
    {
      name: 'Glock-18 | Candy Apple',
      min_float: 0,
      max_float: 0.3,
      rarity: 'Industrial Grade',
      collections_or_crates: ['Dust Collection'],
    },
  ];

  const inventory = [
    ...Array.from({ length: 5 }).map((_, idx) => ({
      marketHashName: 'P250 | Sand Dune (Field-Tested)',
      floatValue: 0.17 + idx * 0.001,
      assetid: `A${idx + 1}`,
    })),
    ...Array.from({ length: 5 }).map((_, idx) => ({
      marketHashName: 'USP-S | Check Engine (Field-Tested)',
      floatValue: 0.18 + idx * 0.001,
      assetid: `B${idx + 1}`,
    })),
  ];

  const results = analyzePositiveCrafts(inventory, buildItemIndex(db), { minDistinctNames: 2 });

  assert.ok(results.length > 0);
  assert.ok(results.some((row) => row.distinctInputNames >= 2));
});

test('analyzePositiveCrafts skips non-profitable quality transitions', () => {
  const db = [
    {
      name: 'P250 | Sand Dune',
      min_float: 0,
      max_float: 1,
      rarity: 'Consumer Grade',
      collections_or_crates: ['Dust Collection'],
    },
    {
      name: 'Glock-18 | Candy Apple',
      min_float: 0.4,
      max_float: 1,
      rarity: 'Industrial Grade',
      collections_or_crates: ['Dust Collection'],
    },
  ];

  const inventory = Array.from({ length: 10 }).map((_, idx) => ({
    marketHashName: 'P250 | Sand Dune (Factory New)',
    floatValue: 0.02 + idx * 0.001,
    assetid: String(idx + 1),
  }));

  const results = analyzePositiveCrafts(inventory, buildItemIndex(db));
  assert.equal(results.length, 0);
});


test('analyzeCrafts returns all outputs while analyzePositiveCrafts keeps only improved', () => {
  const db = [
    {
      name: 'P250 | Sand Dune',
      min_float: 0,
      max_float: 1,
      rarity: 'Consumer Grade',
      collections_or_crates: ['Dust Collection'],
    },
    {
      name: 'Glock-18 | Candy Apple',
      min_float: 0,
      max_float: 0.1,
      rarity: 'Industrial Grade',
      collections_or_crates: ['Dust Collection'],
    },
    {
      name: 'UMP-45 | Mudder',
      min_float: 0.9,
      max_float: 1,
      rarity: 'Industrial Grade',
      collections_or_crates: ['Dust Collection'],
    },
  ];

  const inventory = Array.from({ length: 10 }).map((_, idx) => ({
    marketHashName: 'P250 | Sand Dune (Factory New)',
    floatValue: 0.8 + idx * 0.001,
    assetid: String(idx + 1),
  }));

  const index = buildItemIndex(db);
  const allResults = analyzeCrafts(inventory, index);
  const positiveResults = analyzePositiveCrafts(inventory, index);

  assert.equal(allResults.length, 2);
  assert.equal(positiveResults.length, 1);
  assert.deepEqual(
    allResults.map((row) => row.expectedName).sort(),
    ['Glock-18 | Candy Apple', 'UMP-45 | Mudder']
  );
});


test('getCraftBuckets returns collection/rarity buckets with at least 10 items', () => {
  const db = [
    {
      name: 'P250 | Sand Dune',
      min_float: 0,
      max_float: 0.8,
      rarity: 'Consumer Grade',
      collections_or_crates: ['Dust Collection'],
    },
    {
      name: 'Glock-18 | Candy Apple',
      min_float: 0,
      max_float: 0.3,
      rarity: 'Industrial Grade',
      collections_or_crates: ['Dust Collection'],
    },
  ];

  const inventory = Array.from({ length: 10 }).map((_, idx) => ({
    marketHashName: 'P250 | Sand Dune (Field-Tested)',
    floatValue: 0.18 + idx * 0.001,
    assetid: String(idx + 1),
  }));

  const buckets = getCraftBuckets(inventory, buildItemIndex(db));
  assert.equal(buckets.length, 1);
  assert.equal(buckets[0].collection, 'Dust Collection');
  assert.equal(buckets[0].inputRarity, 'Consumer Grade');
  assert.equal(buckets[0].outputRarity, 'Industrial Grade');
  assert.deepEqual(buckets[0].itemNames, ['P250 | Sand Dune']);
});
