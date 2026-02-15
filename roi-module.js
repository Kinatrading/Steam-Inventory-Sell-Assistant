(() => {
const START_DELAY_MS = 400;

const CAPSULES = [
  {
    key: "contenders",
    label: "Contenders"
  },
  {
    key: "challengers",
    label: "Challengers"
  },
  {
    key: "legends",
    label: "Legends"
  }
];

const TOURNAMENTS = [
  { key: "bud2025", label: "Budapest 2025" },
  { key: "rmr2020", label: "RMR 2020" },
  { key: "antwerp2022", label: "Antwerp 2022" },
  { key: "aus2025", label: "Austin 2025" },
  { key: "cph2024", label: "Copenhagen 2024" },
  { key: "paris2023", label: "Paris 2023" },
  { key: "stockh2021", label: "Stockholm 2021" },
  { key: "rio2022", label: "Rio 2022" },
  { key: "sha2024", label: "Shanghai 2024" }
];

const BASE_URL_TEMPLATE =
  "https://steamcommunity.com/market/search/render/?query=&count=10&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=730&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=tag_crate_sticker_pack_{tournament}_{capsule}_collection&category_730_Tournament%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Type%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Rarity%5B%5D=tag_Rarity_Mythical&category_730_Rarity%5B%5D=tag_Rarity_Ancient&category_730_Rarity%5B%5D=tag_Rarity_Legendary";

const CONTENDERS_SIX_PAGES_TOURNAMENTS = new Set(["bud2025", "aus2025"]);
const CAPSULE_SEARCH_PAGES = 20;
const CAPSULE_SEARCH_URL =
  "https://steamcommunity.com/market/search/render/?query=capsule&count=10&search_descriptions=0&sort_column=price&sort_dir=asc&appid=730&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_Tournament%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Type%5B%5D=any&category_730_Weapon%5B%5D=any";
const RMR_BASE_SEARCH_URL =
  "https://steamcommunity.com/market/search/render/?query=rmr&start=0&count=10&search_descriptions=0&sort_column=price&sort_dir=desc&appid=730&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_Tournament%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Type%5B%5D=tag_CSGO_Type_WeaponCase&category_730_Weapon%5B%5D=any";

const TOURNAMENT_ALIASES = {
  bud2025: ["budapest 2025", "2025 budapest", "budapest"],
  rmr2020: ["rmr 2020", "2020 rmr", "rmr"],
  antwerp2022: ["antwerp 2022", "2022 antwerp", "antwerp"],
  aus2025: ["austin 2025", "2025 austin", "austin"],
  cph2024: ["copenhagen 2024", "2024 copenhagen", "copenhagen", "cph"],
  paris2023: ["paris 2023", "2023 paris", "paris"],
  stockh2021: ["stockholm 2021", "2021 stockholm", "stockholm"],
  rio2022: ["rio 2022", "2022 rio", "rio"],
  sha2024: ["shanghai 2024", "2024 shanghai", "shanghai"]
};
const BASE_STORAGE_KEY = "capsuleBaseList";
const BASE_STORAGE_TIMESTAMP_KEY = "capsuleBaseListUpdated";

const startButton = document.getElementById("start-button");
const baseButton = document.getElementById("base-button");
const statusEl = document.getElementById("status");
const cookieStatusEl = document.getElementById("cookie-status");
const exclude003Checkbox = document.getElementById("exclude-003");
const excludePriceThresholdInput = document.getElementById("exclude-price-threshold");

const DEFAULT_BASE_PRICE = 0.21;
const RARITY_CONFIG = {
  remarkable: {
    label: "Remarkable",
    color: "#8847ff",
    coefficient: 1 / 6.2,
    display: "1/6,2",
    total: 25161
  },
  exotic: {
    label: "Exotic",
    color: "#d32ce6",
    coefficient: 1 / 32,
    display: "1/32",
    total: 4875
  },
  gold: {
    label: "Gold",
    color: "#eb4b4b",
    coefficient: 1 / 156,
    display: "1/156",
    total: 1000
  }
};
const ROI_DIVISOR = 156000;
const STEAM_FEE = 0.135;
const STEAM_FEE_THRESHOLD = 0.17;
const STEAM_FEE_FLAT = 0.02;
const EXCLUDE_PRICE_DEFAULT = 0.03;
const EXCLUDE_PRICE_EPSILON = 0.0001;

const RARITY_BY_COLOR = Object.fromEntries(
  Object.entries(RARITY_CONFIG).map(([key, value]) => [value.color.toLowerCase(), key])
);

const listEls = {
  contenders: {
    remarkable: document.getElementById("contenders-remarkable-list"),
    exotic: document.getElementById("contenders-exotic-list"),
    gold: document.getElementById("contenders-gold-list")
  },
  challengers: {
    remarkable: document.getElementById("challengers-remarkable-list"),
    exotic: document.getElementById("challengers-exotic-list"),
    gold: document.getElementById("challengers-gold-list")
  },
  legends: {
    remarkable: document.getElementById("legends-remarkable-list"),
    exotic: document.getElementById("legends-exotic-list"),
    gold: document.getElementById("legends-gold-list")
  }
};

const labelEls = {
  contenders: {
    remarkable: document.getElementById("contenders-remarkable-label"),
    exotic: document.getElementById("contenders-exotic-label"),
    gold: document.getElementById("contenders-gold-label")
  },
  challengers: {
    remarkable: document.getElementById("challengers-remarkable-label"),
    exotic: document.getElementById("challengers-exotic-label"),
    gold: document.getElementById("challengers-gold-label")
  },
  legends: {
    remarkable: document.getElementById("legends-remarkable-label"),
    exotic: document.getElementById("legends-exotic-label"),
    gold: document.getElementById("legends-gold-label")
  }
};

const roiEls = {
  contenders: {
    value: document.querySelector("#contenders-roi .roi-value"),
    compare: document.querySelector("#contenders-roi .roi-compare")
  },
  challengers: {
    value: document.querySelector("#challengers-roi .roi-value"),
    compare: document.querySelector("#challengers-roi .roi-compare")
  },
  legends: {
    value: document.querySelector("#legends-roi .roi-value"),
    compare: document.querySelector("#legends-roi .roi-compare")
  }
};

const logOutputEl = document.getElementById("log-output");
const lastItemsByTournament = new Map();
const lastBasePricesByTournament = new Map();
let lastSelectedTournaments = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const pushLive = (message, level = "info") => {
  if (window.SteamSuiteBridge?.pushLiveLog) {
    window.SteamSuiteBridge.pushLiveLog(`ROI: ${message}`, level);
  }
};

const clearLists = () => {
  Object.values(listEls).forEach((capsuleLists) => {
    Object.values(capsuleLists).forEach((list) => {
      list.innerHTML = "";
    });
  });
  Object.values(labelEls).forEach((capsuleLabels) => {
    Object.entries(capsuleLabels).forEach(([rarityKey, labelEl]) => {
      labelEl.textContent = RARITY_CONFIG[rarityKey].label;
    });
  });
  Object.values(roiEls).forEach((roi) => {
    roi.value.textContent = "—";
    roi.compare.textContent = "—";
  });
};

const clearAll = () => {
  clearLists();
  logOutputEl.textContent = "";
};

const addItem = (listEl, { name, price, typeLabel, coefficient, coefficientDisplay }) => {
  const li = document.createElement("li");
  li.innerHTML = `<span class="item-name">${name}</span><span class="item-meta">${typeLabel} • ${coefficientDisplay}</span><span class="item-price">${price}</span>`;
  li.dataset.coefficient = coefficient;
  listEl.appendChild(li);
};

const parsePriceValue = (price) => {
  if (!price) {
    return null;
  }
  const normalized = price.replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
};

const extractRarityColor = (styleText) => {
  if (!styleText) {
    return null;
  }
  const matches = styleText.match(/#[0-9a-fA-F]{6}/g) || [];
  const color = matches.find((match) => RARITY_BY_COLOR[match.toLowerCase()]);
  return color ? color.toLowerCase() : null;
};

const parseResultsHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll(".market_listing_row"));

  return rows
    .map((row) => {
      const hashName = row.getAttribute("data-hash-name");
      const nameEl = row.querySelector(".market_listing_item_name");
      const salePriceEl = row.querySelector(".sale_price");
      const normalPriceEl = row.querySelector(".normal_price");
      const imageEl = row.querySelector(".market_listing_item_img");
      const styleText = imageEl?.getAttribute("style") || "";
      const rarityColor = extractRarityColor(styleText);
      const rarityKey = rarityColor ? RARITY_BY_COLOR[rarityColor] : null;

      const name = hashName || nameEl?.textContent?.trim();
      const typeSource = hashName || nameEl?.textContent?.trim();
      const price = salePriceEl?.textContent?.trim() || normalPriceEl?.textContent?.trim();
      const typeMatch = typeSource?.match(/\(([^)]+)\)/);
      const typeLabel = typeMatch?.[1] || "Unknown";
      const typeInfo = rarityKey ? RARITY_CONFIG[rarityKey] : null;
      const priceValue = parsePriceValue(price);

      if (!name || !price || !typeInfo || priceValue === null || !rarityKey) {
        return null;
      }

      return {
        name,
        price,
        priceValue,
        typeLabel,
        rarityKey,
        coefficient: typeInfo.coefficient,
        coefficientDisplay: typeInfo.display
      };
    })
    .filter(Boolean);
};

const buildUrls = (baseUrl, pages) =>
  Array.from({ length: pages }, (_, index) => {
    const start = index * 10;
    return `${baseUrl}&start=${start}`;
  });

const formatRoi = (value) => value.toFixed(4);
const formatPercent = (value) => `${value.toFixed(2)}%`;
const formatPrice = (value) => value.toFixed(2);

const appendLog = (lines) => {
  logOutputEl.textContent += `${lines.join("\n")}\n\n`;
  lines.forEach((line) => pushLive(line, "info"));
};

const loadBaseListFromStorage = () => {
  try {
    const raw = localStorage.getItem(BASE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
};

const saveBaseListToStorage = (list) => {
  localStorage.setItem(BASE_STORAGE_KEY, JSON.stringify(list));
  localStorage.setItem(BASE_STORAGE_TIMESTAMP_KEY, new Date().toISOString());
};

const buildCapsuleUrl = (tournamentKey, capsuleKey) =>
  BASE_URL_TEMPLATE.replace("{tournament}", tournamentKey).replace("{capsule}", capsuleKey);

const getCapsulePages = (capsuleKey, tournamentKey) => {
  if (capsuleKey === "contenders" && CONTENDERS_SIX_PAGES_TOURNAMENTS.has(tournamentKey)) {
    return 6;
  }
  return 3;
};

const getSelectedTournaments = () =>
  TOURNAMENTS.filter((tournament) => {
    const input = document.getElementById(`tournament-${tournament.key}`);
    return Boolean(input?.checked);
  });

const getExcludeThreshold = () => {
  const raw = excludePriceThresholdInput?.value?.replace(",", ".") ?? "";
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return EXCLUDE_PRICE_DEFAULT;
  }
  return parsed;
};

const isExcludedPricePoint = (price, threshold) =>
  price <= threshold + EXCLUDE_PRICE_EPSILON;

const getEffectivePrice = (price, excludePricePoint, threshold) =>
  excludePricePoint && isExcludedPricePoint(price, threshold) ? 0 : price;

const applySteamFee = (price) => {
  if (price > STEAM_FEE_THRESHOLD) {
    return price * (1 - STEAM_FEE);
  }
  return Math.max(price - STEAM_FEE_FLAT, 0);
};

const buildRoiSummary = (items, { excludePricePoint, basePrice, excludeThreshold }) => {
  const typeCounts = items.reduce(
    (acc, item) => {
      acc[item.rarityKey] += 1;
      return acc;
    },
    { remarkable: 0, exotic: 0, gold: 0 }
  );

  const contributions = {
    remarkable: 0,
    exotic: 0,
    gold: 0
  };

  const { total, totalAfterFee } = items.reduce(
    (acc, item) => {
      const perTypeTotal = RARITY_CONFIG[item.rarityKey]?.total;
      const typeCount = typeCounts[item.rarityKey];
      if (!perTypeTotal || typeCount === 0) {
        return acc;
      }
      const perItemCount = perTypeTotal / typeCount;
      const effectivePrice = getEffectivePrice(item.priceValue, excludePricePoint, excludeThreshold);
      const subtotal = effectivePrice * perItemCount;
      acc.contributions[item.rarityKey] += subtotal;
      acc.total += subtotal;
      acc.totalAfterFee += applySteamFee(effectivePrice) * perItemCount;
      return acc;
    },
    {
      total: 0,
      totalAfterFee: 0,
      contributions
    }
  );

  const roiBeforeFee = total / ROI_DIVISOR;
  const roiAfterFee = totalAfterFee / ROI_DIVISOR;
  const diff = ((roiAfterFee - basePrice) / basePrice) * 100;
  const diffLabel = diff >= 0 ? "більша" : "менша";
  const diffValue = Math.abs(diff);
  const feeAmount = roiBeforeFee - roiAfterFee;

  return {
    total,
    totalAfterFee,
    roiBeforeFee,
    roiAfterFee,
    feeAmount,
    contributions,
    typeCounts,
    compareText: `${formatPercent(diffValue)} ${diffLabel} за базу`
  };
};

const updateStatus = (message) => {
  statusEl.textContent = message;
  pushLive(message, "info");
};

const renderLogHeader = (tournaments = []) => {
  if (exclude003Checkbox?.checked) {
    const threshold = getExcludeThreshold();
    appendLog([`Опція: ціна ≤ ${threshold.toFixed(2)} = 0.00 (без комісії та повернення)`]);
  }
  if (tournaments.length > 0) {
    appendLog([`Турніри: ${tournaments.map((tournament) => tournament.label).join(", ")}`]);
  }
};

const getRarityLabels = (items) =>
  items.reduce(
    (acc, item) => {
      if (!acc[item.rarityKey]) {
        acc[item.rarityKey] = item.typeLabel;
      }
      return acc;
    },
    { remarkable: null, exotic: null, gold: null }
  );

const renderCapsuleSummary = (capsule, items, basePrice) => {
  const safeBasePrice =
    Number.isFinite(basePrice) && basePrice > 0 ? basePrice : DEFAULT_BASE_PRICE;
  const roiSummary = buildRoiSummary(items, {
    excludePricePoint: exclude003Checkbox?.checked,
    excludeThreshold: getExcludeThreshold(),
    basePrice: safeBasePrice
  });
  const rarityLabels = getRarityLabels(items);

  const roiEl = roiEls[capsule.key];
  roiEl.value.textContent = `${formatRoi(
    roiSummary.roiAfterFee
  )} (з врахуванням комісії стім: -13.5% >0.17, -0.02 ≤0.17)`;
  roiEl.compare.textContent = `${formatPrice(safeBasePrice)} • ${roiSummary.compareText}`;

  Object.entries(labelEls[capsule.key]).forEach(([rarityKey, labelEl]) => {
    labelEl.textContent = rarityLabels[rarityKey] || RARITY_CONFIG[rarityKey].label;
  });

  const remarkablePerItem =
    roiSummary.typeCounts.remarkable === 0
      ? 0
      : RARITY_CONFIG.remarkable.total / roiSummary.typeCounts.remarkable;
  const exoticPerItem =
    roiSummary.typeCounts.exotic === 0
      ? 0
      : RARITY_CONFIG.exotic.total / roiSummary.typeCounts.exotic;
  const goldPerItem =
    roiSummary.typeCounts.gold === 0
      ? 0
      : RARITY_CONFIG.gold.total / roiSummary.typeCounts.gold;

  const remarkableLabel = rarityLabels.remarkable || RARITY_CONFIG.remarkable.label;
  const exoticLabel = rarityLabels.exotic || RARITY_CONFIG.exotic.label;
  const goldLabel = rarityLabels.gold || RARITY_CONFIG.gold.label;

  const remarkableShareText =
    roiSummary.typeCounts.remarkable === 0
      ? "немає"
      : `${RARITY_CONFIG.remarkable.total} / ${roiSummary.typeCounts.remarkable} = ${remarkablePerItem.toFixed(4)} кожної`;
  const exoticShareText =
    roiSummary.typeCounts.exotic === 0
      ? "немає"
      : `${RARITY_CONFIG.exotic.total} / ${roiSummary.typeCounts.exotic} = ${exoticPerItem.toFixed(4)} кожної`;
  const goldShareText =
    roiSummary.typeCounts.gold === 0
      ? "немає"
      : `${RARITY_CONFIG.gold.total} / ${roiSummary.typeCounts.gold} = ${goldPerItem.toFixed(4)} кожної`;

  appendLog([
    `Капсула: ${capsule.label}`,
    `База капсули: ${formatPrice(safeBasePrice)}`,
    `${remarkableLabel}: ${roiSummary.typeCounts.remarkable} шт, частка ${remarkableShareText}`,
    `${exoticLabel}: ${roiSummary.typeCounts.exotic} шт, частка ${exoticShareText}`,
    `${goldLabel}: ${roiSummary.typeCounts.gold} шт, частка ${goldShareText}`,
    `Сума ${remarkableLabel}: ${roiSummary.contributions.remarkable.toFixed(4)}`,
    `Сума ${exoticLabel}: ${roiSummary.contributions.exotic.toFixed(4)}`,
    `Сума ${goldLabel}: ${roiSummary.contributions.gold.toFixed(4)}`,
    `Разом: ${roiSummary.total.toFixed(4)}`,
    `ROI до комісії: ${formatRoi(roiSummary.roiBeforeFee)}`,
    `Комісія Steam (-13.5% >0.17 або -0.02 ≤0.17): ${roiSummary.feeAmount.toFixed(4)}`,
    `ROI після комісії: ${formatRoi(roiSummary.roiAfterFee)}`,
    `Порівняння з базою ${formatPrice(safeBasePrice)}: ${roiSummary.compareText}`
  ]);
};

const refreshSummaries = () => {
  logOutputEl.textContent = "";
  renderLogHeader(lastSelectedTournaments);

  lastSelectedTournaments.forEach((tournament) => {
    const tournamentItems = lastItemsByTournament.get(tournament.key);
    if (!tournamentItems) {
      return;
    }
    appendLog([`Турнір: ${tournament.label}`]);
    CAPSULES.forEach((capsule) => {
      const items = tournamentItems.get(capsule.key);
      if (items) {
        const basePrice = lastBasePricesByTournament
          .get(tournament.key)
          ?.get(capsule.key);
        renderCapsuleSummary(capsule, items, basePrice);
      }
    });
  });

};

const parseCapsuleBaseHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll(".market_listing_row"));

  return rows
    .map((row) => {
      const hashName = row.getAttribute("data-hash-name")?.trim();
      const nameEl = row.querySelector(".market_listing_item_name");
      const salePriceEl = row.querySelector(".sale_price");
      const normalPriceEl = row.querySelector(".normal_price");
      const name = hashName || nameEl?.textContent?.trim();
      const price = salePriceEl?.textContent?.trim() || normalPriceEl?.textContent?.trim();
      const priceValue = parsePriceValue(price);

      if (!name || priceValue === null) {
        return null;
      }

      return { name, priceValue, price };
    })
    .filter(Boolean);
};

const isStickerCapsule = (name) => {
  const normalized = name.toLowerCase();
  const hasCapsule =
    normalized.includes("sticker capsule") ||
    normalized.includes("capsule") ||
    normalized.includes("капсула з наліпками") ||
    normalized.includes("наклейка капсула") ||
    normalized.includes("капсула") && normalized.includes("наліп");
  const isAutograph = normalized.includes("autograph") || normalized.includes("автограф");
  return hasCapsule && !isAutograph;
};

const appendCapsuleRowsFromUrl = async (url, items) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Accept-Language": "en-US,en;q=0.9",
      "X-Requested-With": "XMLHttpRequest"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} при завантаженні бази капсул`);
  }

  const data = await response.json();
  const rows = parseCapsuleBaseHtml(data.results_html || "");
  rows.forEach((row) => {
    items.push(row);
  });
};

const fetchCapsuleBaseList = async () => {
  const urls = buildUrls(CAPSULE_SEARCH_URL, CAPSULE_SEARCH_PAGES);
  const items = [];

  for (let index = 0; index < urls.length; index += 1) {
    updateStatus(`База капсул: сторінка ${index + 1} з ${urls.length}`);
    if (index > 0) {
      await sleep(START_DELAY_MS);
    }
    await appendCapsuleRowsFromUrl(urls[index], items);
  }

  updateStatus("База капсул: додатковий запит для RMR 2020");
  await appendCapsuleRowsFromUrl(RMR_BASE_SEARCH_URL, items);

  return items;
};

const collectBasePrices = async () => {
  baseButton.disabled = true;
  updateStatus("Збираємо базу капсул...");
  try {
    const cookies = await readSteamCookies();
    const cookieStatus = formatCookieStatus(cookies);
    cookieStatusEl.textContent = cookieStatus.message;
    cookieStatusEl.dataset.state = cookieStatus.ok ? "ok" : "error";

    if (!cookieStatus.ok) {
      updateStatus("Потрібна авторизація на Steam.");
      return;
    }

    const capsuleBaseList = await fetchCapsuleBaseList();
    if (!capsuleBaseList.length) {
      updateStatus("База капсул порожня. Спробуйте ще раз (Steam Market language: EN).");
      appendLog(["База капсул порожня — нові дані не збережено."]);
      return;
    }
    saveBaseListToStorage(capsuleBaseList);
    appendLog([
      `Базу капсул збережено: ${capsuleBaseList.length} позицій.`,
      `Оновлено: ${new Date().toLocaleString("uk-UA")}`
    ]);
    updateStatus("База капсул оновлена.");
  } catch (error) {
    updateStatus(`Помилка: ${error.message}`);
  } finally {
    baseButton.disabled = false;
  }
};

const buildBasePriceMap = (capsuleItems, tournaments) => {
  const map = new Map();
  const normalizedItems = capsuleItems.map((item) => ({
    ...item,
    nameLower: item.name.toLowerCase()
  }));

  tournaments.forEach((tournament) => {
    const tournamentMap = new Map();
    const aliases = TOURNAMENT_ALIASES[tournament.key] || [tournament.label.toLowerCase()];
    CAPSULES.forEach((capsule) => {
      const capsuleLower = capsule.label.toLowerCase();
      const match = normalizedItems.find(
        (item) =>
          aliases.some((alias) => item.nameLower.includes(alias)) &&
          item.nameLower.includes(capsuleLower)
      );
      tournamentMap.set(capsule.key, match?.priceValue ?? DEFAULT_BASE_PRICE);
    });
    map.set(tournament.key, tournamentMap);
  });

  return map;
};

const readSteamCookies = () =>
  new Promise((resolve) => {
    chrome.cookies.getAll({ domain: "steamcommunity.com" }, (cookies) => {
      const cookieMap = new Map(cookies.map((cookie) => [cookie.name, cookie.value]));
      resolve(cookieMap);
    });
  });

const formatCookieStatus = (cookies) => {
  const sessionId = cookies.get("sessionid");
  const steamLoginSecure = cookies.get("steamLoginSecure");
  const steamId = steamLoginSecure ? steamLoginSecure.split("%7C")[0] : null;

  if (!sessionId || !steamLoginSecure) {
    return {
      ok: false,
      message:
        "Не знайдено sessionid або steamLoginSecure. Переконайтесь, що ви залогінені на steamcommunity.com."
    };
  }

  return {
    ok: true,
    message: `Cookie OK. SteamID: ${steamId || "невідомо"}`
  };
};

const fetchCapsule = async (tournament, capsule, basePrice) => {
  const capsuleLists = listEls[capsule.key];
  const pages = getCapsulePages(capsule.key, tournament.key);
  const urls = buildUrls(buildCapsuleUrl(tournament.key, capsule.key), pages);
  const items = [];

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    updateStatus(
      `${tournament.label} • ${capsule.label}: сторінка ${index + 1} з ${urls.length}`
    );

    if (index > 0) {
      await sleep(START_DELAY_MS);
    }

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} для ${capsule.label}`);
    }

    const data = await response.json();
    const rows = parseResultsHtml(data.results_html || "");
    rows.forEach((row) => items.push(row));
  }

  items.forEach((item) => {
    const listEl = capsuleLists[item.rarityKey];
    if (listEl) {
      addItem(listEl, item);
    }
  });

  if (!lastItemsByTournament.has(tournament.key)) {
    lastItemsByTournament.set(tournament.key, new Map());
  }
  lastItemsByTournament.get(tournament.key).set(capsule.key, items);
  renderCapsuleSummary(capsule, items, basePrice);
  return items.length;
};

const startFetch = async () => {
  startButton.disabled = true;
  clearAll();
  const selectedTournaments = getSelectedTournaments();
  lastSelectedTournaments = selectedTournaments;
  renderLogHeader(selectedTournaments);
  updateStatus("Перевіряємо cookies...");

  try {
    const cookies = await readSteamCookies();
    const cookieStatus = formatCookieStatus(cookies);
    cookieStatusEl.textContent = cookieStatus.message;
    cookieStatusEl.dataset.state = cookieStatus.ok ? "ok" : "error";

    if (!cookieStatus.ok) {
      updateStatus("Потрібна авторизація на Steam.");
      return;
    }

    if (selectedTournaments.length === 0) {
      updateStatus("Оберіть хоча б один турнір для парсингу.");
      return;
    }

    const capsuleBaseList = loadBaseListFromStorage();
    if (!capsuleBaseList) {
      updateStatus("Спочатку натисніть “Зібрати базу для ROI”.");
      return;
    }
    if (capsuleBaseList.length === 0) {
      updateStatus("База капсул порожня. Оновіть базу ще раз.");
      return;
    }

    lastBasePricesByTournament.clear();
    const basePrices = buildBasePriceMap(capsuleBaseList, selectedTournaments);
    basePrices.forEach((value, key) => lastBasePricesByTournament.set(key, value));

    let totalCount = 0;

    lastItemsByTournament.clear();

    for (const tournament of selectedTournaments) {
      clearLists();
      appendLog([`Турнір: ${tournament.label}`]);
      const basePricesForTournament =
        lastBasePricesByTournament.get(tournament.key) || new Map();
      for (const capsule of CAPSULES) {
        const basePrice = basePricesForTournament.get(capsule.key);
        totalCount += await fetchCapsule(tournament, capsule, basePrice);
      }
    }

    updateStatus(`Готово. Знайдено позицій: ${totalCount}.`);
  } catch (error) {
    updateStatus(`Помилка: ${error.message}`);
  } finally {
    startButton.disabled = false;
  }
};

startButton.addEventListener("click", startFetch);
baseButton.addEventListener("click", collectBasePrices);
exclude003Checkbox?.addEventListener("change", () => {
  if (lastItemsByTournament.size > 0) {
    refreshSummaries();
  }
});

excludePriceThresholdInput?.addEventListener("input", () => {
  if (lastItemsByTournament.size > 0 && exclude003Checkbox?.checked) {
    refreshSummaries();
  }
});


window.SteamSuiteRoiModule = {
  startFetch,
  collectBasePrices,
  runFxRatesAnalyzer: async (options = {}) => {
    const fxModule = window.SteamSuiteRoiFxModule;
    if (!fxModule?.runSteamRatesAnalyzer) {
      throw new Error("ROI FX module is not loaded.");
    }
    return fxModule.runSteamRatesAnalyzer(options);
  }
};

readSteamCookies().then((cookies) => {
  const cookieStatus = formatCookieStatus(cookies);
  cookieStatusEl.textContent = cookieStatus.message;
  cookieStatusEl.dataset.state = cookieStatus.ok ? "ok" : "error";
});

})();
