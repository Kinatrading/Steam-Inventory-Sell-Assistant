// Narrow adaptation of ItemFinder added_items_order_source.js histogramAsOrderbook.
// Steam graph depth is cumulative, while each displayed level needs its own quantity.
export function normalizeHistogram(data) {
  if (![1, true].includes(data?.success) || !Array.isArray(data.buy_order_graph)) throw new Error('Некоректна відповідь itemordershistogram.');
  const cumulativeByPrice = new Map();
  for (const level of data.buy_order_graph) {
    if (!Array.isArray(level) || !['number', 'string'].includes(typeof level[0]) || !['number', 'string'].includes(typeof level[1]) || String(level[0]).trim() === '' || String(level[1]).trim() === '') throw new Error('Некоректний рівень histogram.');
    const price = Math.round((Number(level[0]) + Number.EPSILON) * 100), cumulative = Number(level[1]);
    if (!Number.isSafeInteger(price) || price <= 0 || !Number.isSafeInteger(cumulative) || cumulative < 0 || level[1] === null || level[1] === '') throw new Error('Некоректний рівень histogram.');
    cumulativeByPrice.set(price, Math.max(cumulativeByPrice.get(price) || 0, cumulative));
  }
  let previous = 0;
  const levels = [];
  for (const [price, cumulative] of [...cumulativeByPrice].sort(([a], [b]) => b - a)) {
    if (cumulative < previous) throw new Error('Некоректна накопичувальна кількість histogram.');
    const quantity = cumulative - previous;
    if (quantity > 0) levels.push({price, quantity});
    previous = cumulative;
  }
  if (!['number', 'string'].includes(typeof data.highest_buy_order) || String(data.highest_buy_order).trim() === '') throw new Error('Неповний histogram.');
  const highest = Number(data.highest_buy_order);
  if (!Number.isSafeInteger(highest) || highest < 0 || highest !== (levels[0]?.price || 0)) throw new Error('Неповний або суперечливий histogram.');
  return levels;
}

export function chooseBid(maxPrice, step, levels) {
  const highest = levels[0]?.price || 0;
  const bid = Math.min(maxPrice, highest + step);
  if (!Number.isSafeInteger(bid) || bid <= 0) throw new Error('Некоректна розрахована ціна.');
  return bid;
}
