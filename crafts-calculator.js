(function initCraftCalculator(globalScope) {
  const RARITY_ORDER = [
    'Consumer Grade',
    'Industrial Grade',
    'Mil-Spec Grade',
    'Restricted',
    'Classified',
    'Covert',
  ];

  const WEAR_ORDER = [
    'Battle-Scarred',
    'Well-Worn',
    'Field-Tested',
    'Minimal Wear',
    'Factory New',
  ];

  const WEAR_LIMITS = [
    { label: 'Factory New', max: 0.07 },
    { label: 'Minimal Wear', max: 0.15 },
    { label: 'Field-Tested', max: 0.38 },
    { label: 'Well-Worn', max: 0.45 },
    { label: 'Battle-Scarred', max: 1 },
  ];

  function detectWearLabel(floatValue) {
    const numeric = Number(floatValue);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) return null;
    const found = WEAR_LIMITS.find((entry) => numeric <= entry.max);
    return found ? found.label : null;
  }

  function normalizeSkinName(marketHashName = '') {
    return String(marketHashName)
      .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/i, '')
      .trim();
  }

  function getNextRarity(rarity) {
    const idx = RARITY_ORDER.indexOf(rarity);
    if (idx === -1 || idx === RARITY_ORDER.length - 1) return null;
    return RARITY_ORDER[idx + 1];
  }

  function getWearScore(wearLabel) {
    const idx = WEAR_ORDER.indexOf(wearLabel);
    return idx === -1 ? -1 : idx;
  }

  function buildItemIndex(itemsDb = []) {
    const byName = new Map();
    const byCollectionRarity = new Map();

    for (const item of itemsDb) {
      if (!item?.name) continue;
      byName.set(item.name, item);
      const collections = Array.isArray(item.collections_or_crates) ? item.collections_or_crates : [];
      for (const collection of collections) {
        const key = `${collection}__${item.rarity}`;
        if (!byCollectionRarity.has(key)) byCollectionRarity.set(key, []);
        byCollectionRarity.get(key).push(item);
      }
    }

    return { byName, byCollectionRarity };
  }

  function calcAveragePercent(items) {
    if (!items.length) return null;
    let sum = 0;
    for (const item of items) {
      const span = item.max_float - item.min_float;
      if (!Number.isFinite(span) || span <= 0) return null;
      const percent = (item.floatValue - item.min_float) / span;
      if (!Number.isFinite(percent) || percent < 0 || percent > 1) return null;
      sum += percent;
    }
    return sum / items.length;
  }

  function getExpectedOutputFloat(avgPercent, outputItem) {
    const span = outputItem.max_float - outputItem.min_float;
    return outputItem.min_float + (span * avgPercent);
  }

  function combinationsOfTen(items, maxCombinations = 4000) {
    const result = [];
    const chosen = [];
    const targetSize = 10;

    if (items.length < targetSize) return result;

    function walk(start) {
      if (result.length >= maxCombinations) return;
      if (chosen.length === targetSize) {
        result.push(chosen.slice());
        return;
      }

      const needed = targetSize - chosen.length;
      for (let i = start; i <= items.length - needed; i += 1) {
        chosen.push(items[i]);
        walk(i + 1);
        chosen.pop();
        if (result.length >= maxCombinations) return;
      }
    }

    walk(0);
    return result;
  }


  function getDistinctInputNames(combo) {
    return Array.from(new Set(combo.map((item) => normalizeSkinName(item.marketHashName || item.baseName || '')))).filter(Boolean);
  }

  function annotateInventoryItems(inventoryItems, itemsDbIndex) {
    const annotated = [];

    for (const invItem of inventoryItems) {
      const baseName = normalizeSkinName(invItem.marketHashName);
      const dbItem = itemsDbIndex.byName.get(baseName);
      if (!dbItem) continue;
      if (!RARITY_ORDER.includes(dbItem.rarity)) continue;
      if (!Number.isFinite(invItem.floatValue)) continue;

      const wearLabel = detectWearLabel(invItem.floatValue);
      if (!wearLabel) continue;

      annotated.push({
        ...invItem,
        ...dbItem,
        baseName,
        wearLabel,
      });
    }

    return annotated;
  }


  function getCraftBuckets(inventoryItems, itemsDbIndex) {
    const annotated = annotateInventoryItems(inventoryItems, itemsDbIndex);
    const buckets = new Map();

    for (const item of annotated) {
      for (const collection of item.collections_or_crates || []) {
        const key = `${collection}__${item.rarity}`;
        if (!buckets.has(key)) {
          buckets.set(key, { collection, inputRarity: item.rarity, items: [] });
        }
        buckets.get(key).items.push(item);
      }
    }

    return Array.from(buckets.values())
      .filter((bucket) => bucket.items.length >= 10)
      .map((bucket) => {
        const outputRarity = getNextRarity(bucket.inputRarity);
        return {
          collection: bucket.collection,
          inputRarity: bucket.inputRarity,
          outputRarity,
          inputItemsCount: bucket.items.length,
          itemNames: Array.from(new Set(bucket.items.map((item) => item.baseName).filter(Boolean))),
        };
      })
      .filter((bucket) => Boolean(bucket.outputRarity));
  }

  function analyzeCrafts(inventoryItems, itemsDbIndex, options = {}) {
    const maxCombinationsPerBucket = Number.isFinite(options.maxCombinationsPerBucket)
      ? Math.max(1, Math.floor(options.maxCombinationsPerBucket))
      : 4000;
    const allowMixedNames = options.allowMixedNames !== false;
    const minDistinctNames = Number.isFinite(options.minDistinctNames)
      ? Math.max(1, Math.floor(options.minDistinctNames))
      : 1;
    const requireQualityImprovement = options.requireQualityImprovement === true;

    const annotated = annotateInventoryItems(inventoryItems, itemsDbIndex);

    const byCollectionAndRarity = new Map();
    for (const item of annotated) {
      for (const collection of item.collections_or_crates || []) {
        const key = `${collection}__${item.rarity}`;
        if (!byCollectionAndRarity.has(key)) byCollectionAndRarity.set(key, []);
        byCollectionAndRarity.get(key).push(item);
      }
    }

    const rows = [];

    for (const [bucketKey, bucketItems] of byCollectionAndRarity) {
      if (bucketItems.length < 10) continue;

      const [collection, inputRarity] = bucketKey.split('__');
      const outputRarity = getNextRarity(inputRarity);
      if (!outputRarity) continue;

      const outputs = itemsDbIndex.byCollectionRarity.get(`${collection}__${outputRarity}`) || [];
      if (!outputs.length) continue;

      const combos = combinationsOfTen(bucketItems, maxCombinationsPerBucket);

      for (const combo of combos) {
        const distinctNames = getDistinctInputNames(combo);
        if (!allowMixedNames && distinctNames.length > 1) continue;
        if (distinctNames.length < minDistinctNames) continue;

        const avgPercent = calcAveragePercent(combo);
        if (!Number.isFinite(avgPercent)) continue;

        const inputWearScore = combo.reduce((maxScore, item) => Math.max(maxScore, getWearScore(item.wearLabel)), -1);
        const avgInputFloat = combo.reduce((acc, item) => acc + item.floatValue, 0) / combo.length;

        for (const output of outputs) {
          const expectedFloat = getExpectedOutputFloat(avgPercent, output);
          const outputWear = detectWearLabel(expectedFloat);
          if (!outputWear) continue;

          const outputWearScore = getWearScore(outputWear);
          const qualityImproved = outputWearScore > inputWearScore;
          if (requireQualityImprovement && !qualityImproved) continue;

          rows.push({
            collection,
            inputRarity,
            outputRarity,
            inputItemsCount: bucketItems.length,
            comboSize: combo.length,
            distinctInputNames: distinctNames.length,
            inputNames: distinctNames,
            avgInputFloat,
            avgInputPercent: avgPercent,
            expectedName: output.name,
            expectedFloat,
            expectedWear: outputWear,
            expectedWearScore: outputWearScore,
            inputWearWorst: combo.reduce((worst, item) => {
              if (!worst) return item.wearLabel;
              return getWearScore(item.wearLabel) < getWearScore(worst) ? item.wearLabel : worst;
            }, null),
            inputWearBest: combo.reduce((best, item) => {
              if (!best) return item.wearLabel;
              return getWearScore(item.wearLabel) > getWearScore(best) ? item.wearLabel : best;
            }, null),
            usedItems: combo.map((entry) => ({
              name: entry.marketHashName,
              floatValue: entry.floatValue,
              wearLabel: entry.wearLabel,
              assetid: entry.assetid,
            })),
          });
        }
      }
    }

    rows.sort((a, b) => {
      if (a.expectedWearScore !== b.expectedWearScore) return b.expectedWearScore - a.expectedWearScore;
      if (a.inputRarity !== b.inputRarity) return RARITY_ORDER.indexOf(a.inputRarity) - RARITY_ORDER.indexOf(b.inputRarity);
      if (a.expectedFloat !== b.expectedFloat) return a.expectedFloat - b.expectedFloat;
      return a.collection.localeCompare(b.collection, 'uk');
    });

    return rows;
  }

  function analyzePositiveCrafts(inventoryItems, itemsDbIndex, options = {}) {
    return analyzeCrafts(inventoryItems, itemsDbIndex, {
      ...options,
      requireQualityImprovement: true,
    });
  }

  const api = {
    RARITY_ORDER,
    WEAR_ORDER,
    detectWearLabel,
    normalizeSkinName,
    getNextRarity,
    buildItemIndex,
    getCraftBuckets,
    analyzeCrafts,
    analyzePositiveCrafts,
    analyzeIndustrialCrafts: (inventoryItems, itemsDbIndex) => analyzeCrafts(inventoryItems, itemsDbIndex),
  };

  globalScope.SteamCraftCalculator = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
