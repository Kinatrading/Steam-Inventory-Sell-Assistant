(() => {
  const DEFAULT_CONFIG = Object.freeze({
    itemNameId: 1,
    country: "UA",
    language: "ukrainian",
    attempts: 4,
    baseDelayMs: 300,
    maxConcurrency: 1,
    retryBaseMs: 1200,
  });

  const CURRENCIES = Object.freeze([
    [1, "USD"], [2, "GBP"], [3, "EUR"], [4, "CHF"], [5, "RUB"], [6, "PLN"], [7, "BRL"], [8, "JPY"], [9, "NOK"],
    [10, "IDR"], [11, "MYR"], [12, "PHP"], [13, "SGD"], [14, "THB"], [15, "VND"], [16, "KRW"],
    [18, "UAH"], [19, "MXN"], [20, "CAD"], [21, "AUD"], [22, "NZD"], [23, "CNY"], [24, "INR"], [25, "CLP"],
    [26, "PEN"], [27, "COP"], [28, "ZAR"], [29, "HKD"], [30, "TWD"], [31, "SAR"], [32, "AED"],
    [35, "ILS"], [37, "KZT"], [38, "KWD"], [39, "QAR"], [40, "CRC"], [41, "UYU"],
  ]);

  const LOCAL_PRICES = Object.freeze({
    USD: 0.25, GBP: 0.18, EUR: 0.25, RUB: 20, BRL: 1.35, JPY: 39, NOK: 2.5,
    IDR: 4099, MYR: 1, PHP: 15, SGD: 0.35, THB: 8, VND: 6500, KRW: 370,
    UAH: 11, MXN: 4.49, CAD: 0.35, AUD: 0.35, NZD: 0.42, PLN: 0.9, CHF: 0.2,
    AED: 1, CLP: 222, CNY: 2, COP: 1000, PEN: 0.85, SAR: 0.95, TWD: 8,
    HKD: 2, ZAR: 4.19, INR: 23, CRC: 130, ILS: 0.85, KWD: 0.08, QAR: 0.89,
    UYU: 10, KZT: 130,
  });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const toUrl = ({ country, language, currencyId, itemNameId }) => {
    const url = new URL("https://steamcommunity.com/market/itemordershistogram");
    url.searchParams.set("country", country);
    url.searchParams.set("language", language);
    url.searchParams.set("currency", String(currencyId));
    url.searchParams.set("item_nameid", String(itemNameId));
    return url.toString();
  };

  const pickPriceUnits = (json) => {
    const scale = Number(json.price_scale) || 100;
    const lowestSellRaw = json.lowest_sell_order == null ? null : Number(json.lowest_sell_order);
    const highestBuyRaw = json.highest_buy_order == null ? null : Number(json.highest_buy_order);
    const raw = Number.isFinite(lowestSellRaw) ? lowestSellRaw : highestBuyRaw;

    if (!Number.isFinite(raw)) {
      return { raw: null, major: null, scale, lowestSellRaw, highestBuyRaw };
    }

    return { raw, major: raw / scale, scale, lowestSellRaw, highestBuyRaw };
  };

  async function fetchHistogram({ url, attempts, retryBaseMs, baseDelayMs, logger }) {
    for (let i = 0; i < attempts; i += 1) {
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 429) {
        const backoff = retryBaseMs * (i + 1);
        logger?.(`429 rate limit, retry in ${backoff}ms`, "warn");
        await sleep(backoff);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (baseDelayMs > 0) {
        await sleep(baseDelayMs);
      }
      return data;
    }

    throw new Error("Too many 429 responses");
  }

  async function mapWithConcurrency(items, worker, maxConcurrency = 1) {
    const results = new Array(items.length);
    let cursor = 0;

    async function runner() {
      while (cursor < items.length) {
        const current = cursor;
        cursor += 1;
        results[current] = await worker(items[current], current);
      }
    }

    const workerCount = Math.min(Math.max(maxConcurrency, 1), items.length || 1);
    await Promise.all(Array.from({ length: workerCount }, () => runner()));
    return results;
  }

  function buildSteamRates(rows) {
    const usdRow = rows.find((row) => row.code === "USD" && Number.isFinite(row.pickedMajor));
    if (!usdRow) {
      throw new Error("No USD anchor fetched. Open Steam logged in and retry.");
    }

    const usdPrice = usdRow.pickedMajor;
    const steamRates = {};

    for (const row of rows) {
      if (!Number.isFinite(row.pickedMajor)) continue;
      steamRates[row.code] = row.pickedMajor / usdPrice;
    }

    return steamRates;
  }

  function buildComparison(localPrices, steamRates) {
    const usdLocal = Number(localPrices.USD);
    if (!Number.isFinite(usdLocal) || usdLocal <= 0) {
      throw new Error("localPrices.USD must be a positive number.");
    }

    return Object.entries(localPrices)
      .map(([code, localPrice]) => {
        const rate = steamRates[code];
        if (!Number.isFinite(rate) || rate <= 0) return null;

        const usdEquivalent = code === "USD" ? localPrice : localPrice / rate;

        return {
          code,
          localPrice,
          steamRate_1usd_to_cur: +rate.toFixed(6),
          usdEquivalent: +usdEquivalent.toFixed(6),
          cheaperVsUSD_pct: +(((usdLocal - usdEquivalent) / usdLocal) * 100).toFixed(2),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.usdEquivalent - b.usdEquivalent);
  }

  async function runSteamRatesAnalyzer(options = {}) {
    const config = {
      ...DEFAULT_CONFIG,
      ...options,
      currencies: options.currencies || CURRENCIES,
      localPrices: options.localPrices || LOCAL_PRICES,
    };

    const logger = config.logger || ((message) => console.log(`[steam-rates] ${message}`));
    const requestParams = {
      country: config.country,
      language: config.language,
      itemNameId: config.itemNameId,
    };

    logger("Fetching Steam histogram prices...");

    const rows = await mapWithConcurrency(
      config.currencies,
      async ([currencyId, code]) => {
        const url = toUrl({ ...requestParams, currencyId });

        try {
          const data = await fetchHistogram({
            url,
            attempts: config.attempts,
            retryBaseMs: config.retryBaseMs,
            baseDelayMs: config.baseDelayMs,
            logger,
          });
          const price = pickPriceUnits(data);

          return {
            id: currencyId,
            code,
            ok: data.success === 1,
            scale: price.scale,
            lowestSellRaw: price.lowestSellRaw,
            highestBuyRaw: price.highestBuyRaw,
            pickedMajor: price.major,
            error: null,
          };
        } catch (error) {
          return {
            id: currencyId,
            code,
            ok: false,
            scale: null,
            lowestSellRaw: null,
            highestBuyRaw: null,
            pickedMajor: null,
            error: String(error),
          };
        }
      },
      config.maxConcurrency
    );

    const steamRates = buildSteamRates(rows);

    const rateTable = Object.entries(steamRates)
      .map(([code, rate]) => ({
        code,
        steam_rate_per_1usd: +rate.toFixed(6),
      }))
      .sort((a, b) => a.steam_rate_per_1usd - b.steam_rate_per_1usd);

    const comparisonTable = buildComparison(config.localPrices, steamRates);

    logger("Done ✅");

    return {
      rows,
      steamRates,
      rateTable,
      comparisonTable,
      config,
    };
  }

  window.SteamSuiteRoiFxModule = {
    runSteamRatesAnalyzer,
    constants: {
      CURRENCIES,
      LOCAL_PRICES,
      DEFAULT_CONFIG,
    },
  };
})();
