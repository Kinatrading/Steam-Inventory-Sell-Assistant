const RATE_LIMIT_MINUTES = [3, 10];
const APP_ID = '730';
const CONTEXT_ID = '2';
const MARKET_CONFIG = {
  country: 'CZ',
  currency: '3',
  language: 'english',
};
const APP_BUILD = '2026-02-11-4';
const PRICE_HISTORY_URL = 'https://steamcommunity.com/market/pricehistory';
const PRICE_HISTORY_RANGE_DAYS = 30;

const ui = {
  statusPill: document.getElementById('statusPill'),
  parseInventoryBtn: document.getElementById('parseInventoryBtn'),
  toggleGroupingBtn: document.getElementById('toggleGroupingBtn'),
  checkAllPricesBtn: document.getElementById('checkAllPricesBtn'),
  openRoiModuleBtn: document.getElementById('openRoiModuleBtn'),
  inventoryMeta: document.getElementById('inventoryMeta'),
  inventoryTableHead: document.getElementById('inventoryTableHead'),
  inventoryTableBody: document.getElementById('inventoryTableBody'),
  inventorySearchInput: document.getElementById('inventorySearchInput'),
  inventorySortColumn: document.getElementById('inventorySortColumn'),
  inventorySortDirection: document.getElementById('inventorySortDirection'),
  sortColumnLabel: document.getElementById('sortColumnLabel'),
  sortDirectionLabel: document.getElementById('sortDirectionLabel'),
  logList: document.getElementById('logList'),
  liveLogList: document.getElementById('liveLogList'),
  brandDescription: document.getElementById('brandDescription'),
  languageLabel: document.getElementById('languageLabel'),
  hintTitle: document.getElementById('hintTitle'),
  hintDescription: document.getElementById('hintDescription'),
  mainSubtitle: document.getElementById('mainSubtitle'),
  controlsTitle: document.getElementById('controlsTitle'),
  inventoryTitle: document.getElementById('inventoryTitle'),
  inventoryTotals: document.getElementById('inventoryTotals'),
  logsTitle: document.getElementById('logsTitle'),
  langUkBtn: document.getElementById('langUkBtn'),
  langEnBtn: document.getElementById('langEnBtn'),
  inventoryModuleBtn: document.getElementById('inventoryModuleBtn'),
  roiModuleBtn: document.getElementById('roiModuleBtn'),
  ratesModuleBtn: document.getElementById('ratesModuleBtn'),
  inventoryModuleContent: document.getElementById('inventoryModuleContent'),
  roiModuleContent: document.getElementById('roiModuleContent'),
  ratesModuleContent: document.getElementById('ratesModuleContent'),
  mainTitle: document.getElementById('mainTitle'),
  ratesTitle: document.getElementById('ratesTitle'),
  ratesSubtitle: document.getElementById('ratesSubtitle'),
  ratesResultTitle: document.getElementById('ratesResultTitle'),
  ratesTable1Title: document.getElementById('ratesTable1Title'),
  ratesTable2Title: document.getElementById('ratesTable2Title'),
  ratesRunBtn: document.getElementById('ratesRunBtn'),
  ratesStatus: document.getElementById('ratesStatus'),
  ratesItemNameIdInput: document.getElementById('ratesItemNameIdInput'),
  ratesCountryInput: document.getElementById('ratesCountryInput'),
  ratesLanguageInput: document.getElementById('ratesLanguageInput'),
  ratesConcurrencyInput: document.getElementById('ratesConcurrencyInput'),
  ratesTable: document.getElementById('ratesTable'),
  ratesCompareTable: document.getElementById('ratesCompareTable'),
  priceHistoryModal: document.getElementById('priceHistoryModal'),
  priceHistoryTitle: document.getElementById('priceHistoryTitle'),
  priceHistorySubtitle: document.getElementById('priceHistorySubtitle'),
  priceHistoryStatus: document.getElementById('priceHistoryStatus'),
  priceHistoryChart: document.getElementById('priceHistoryChart'),
  closePriceHistory: document.getElementById('closePriceHistory'),
  resetHistoryZoom: document.getElementById('resetHistoryZoom'),
  noiseFilterToggle: document.getElementById('noiseFilterToggle'),
  historyTopPrices: document.getElementById('historyTopPrices'),
  historyTotalVolume: document.getElementById('historyTotalVolume'),
  historyRangeLabel: document.getElementById('historyRangeLabel'),
  forecastQuantity: document.getElementById('forecastQuantity'),
  forecastDays: document.getElementById('forecastDays'),
  forecastResult: document.getElementById('forecastResult'),
  priceHistoryRangeButtons: document.querySelectorAll('[data-history-range]'),
};

const state = {
  inventory: [],
  itemNameIds: new Map(),
  steamId: null,
  groupedMode: false,
  priceByHash: new Map(),
  marketCurrencyInitialized: false,
  language: 'uk',
  searchQuery: '',
  sortColumn: 'marketHashName',
  sortDirection: 'asc',
  activeModule: 'inventory',
  ratesResult: null,
  currentHistory: null,
  currentHistoryRange: 'recent',
};

const CURRENCY_SYMBOLS = {
  1: '$',
  2: '£',
  3: '€',
  5: '₽',
  18: '₴',
};

const I18N = {
  uk: {
    statusPrefix: 'Status',
    idle: 'Idle',
    brandDescription: 'Парсинг інвентарю, трейдбан, ціни market buy/sell та продаж.',
    languageLabel: 'Мова',
    hintTitle: 'Підказка',
    hintDescriptionInventory: 'Масовий лістинг виконується з паузою 250ms між кожним sellitem.',
    hintDescriptionRoi: 'Кнопка “Зібрати базу для ROI” завантажує ціни капсул. Для фільтра дешевих наліпок вкажіть свій поріг ціни у валюті акаунта.',
    hintDescriptionRates: 'Модуль “Курс” рахує курси Steam по валютах (USD-якір) через itemordershistogram.',
    mainTitleInventory: 'Steam Inventory Sell Assistant',
    mainTitleRoi: 'Steam ROI Assistant',
    mainTitleRates: 'Steam Currency Assistant',
    mainSubtitle: 'Зібрати інвентар → згрупувати/розгрупувати → перевірити ціну → виставити.',
    controlsTitle: 'Керування',
    parseInventoryBtn: 'Спарсити інвентар',
    groupBtn: 'Згрупувати',
    ungroupBtn: 'Розгрупувати',
    checkAllPricesBtn: 'Оновити ціни (всі)',
    inventoryModuleBtn: 'Inventory',
    roiModuleBtn: 'ROI',
    ratesModuleBtn: 'Курс',
    ratesTitle: 'Курс валют (Steam)',
    ratesSubtitle: 'Порівняння цін по валютах через itemordershistogram. розрахунок різниці купівлі турнірних капсул з магазину кс2, доллар як 0',
    ratesRunBtn: 'Запустити курс',
    ratesResultTitle: 'Результат',
    ratesTable1Title: 'Steam rates (1 USD = X CUR)',
    ratesTable2Title: 'Local prices → USD',
    ratesWaiting: 'Очікування запуску…',
    ratesRunning: 'Розрахунок курсу...',
    ratesDone: 'Готово',
    ratesNoData: 'Немає даних. Запустіть аналіз.',
    ratesModuleMissing: 'ROI FX модуль не завантажений.',
    ratesInvalidItemNameId: 'item_nameid має бути більше 0.',
    inventoryTitle: 'Інвентар',
    inventoryTotals: 'buy: {highest} • sell: {lowest}',
    searchPlaceholder: 'Пошук по назві (наприклад, Sur)...',
    sortColumnLabel: 'Стовпець',
    sortDirectionLabel: 'Порядок',
    sortDirectionAZ: 'А-Я / 0-9',
    sortDirectionZA: 'Я-А / 9-0',
    logsTitle: 'Логи',
    rowsMeta: '{rows} рядків / {items} предметів',
    severalStickers: 'Кілька варіантів наліпок ({count})',
    noTradeban: 'без tradeban',
    no: 'Ні',
    hasTradeban: 'Є tradeban',
    item: 'Предмет',
    group: 'Група',
    quantity: 'Кількість',
    stickers: 'Наліпки / брелоки',
    listing: 'Лістинг',
    currency: 'валюта',
    actions: 'Дії',
    history: 'Історія',
    updatePrice: 'Оновити ціну',
    historyButton: 'Перевірити історію предмета',
    sell: 'Виставити',
    historyLoading: 'Завантаження історії…',
    historyEmpty: 'Немає даних для відображення.',
    historyRecent: 'Останні 30 днів (по днях)',
    historyFull: 'Історичні дані за весь час (по днях)',
    historyLoadFailed: 'Не вдалося отримати історію.',
    providePrice: 'Вкажіть валідну ціну лістингу (мінімум 0.03).',
    provideQty: 'Вкажіть валідну кількість (мінімум 1).',
    done: 'Готово',
  },
  en: {
    statusPrefix: 'Status',
    idle: 'Idle',
    brandDescription: 'Inventory parsing, trade ban status, market buy/sell prices, and listing.',
    languageLabel: 'Language',
    hintTitle: 'Hint',
    hintDescriptionInventory: 'Bulk listing runs with a 250ms delay between each sellitem call.',
    hintDescriptionRoi: '“Collect ROI base” loads capsule prices. Use the price threshold field in your account currency to exclude cheap stickers.',
    hintDescriptionRates: 'The “Rates” module calculates Steam currency rates (USD anchor) via itemordershistogram.',
    mainTitleInventory: 'Steam Inventory Sell Assistant',
    mainTitleRoi: 'Steam ROI Assistant',
    mainTitleRates: 'Steam Currency Assistant',
    mainSubtitle: 'Collect inventory → group/ungroup → check prices → list items.',
    controlsTitle: 'Controls',
    parseInventoryBtn: 'Parse inventory',
    groupBtn: 'Group',
    ungroupBtn: 'Ungroup',
    checkAllPricesBtn: 'Refresh prices (all)',
    inventoryModuleBtn: 'Inventory',
    roiModuleBtn: 'ROI',
    ratesModuleBtn: 'Rates',
    ratesTitle: 'Steam currency rates',
    ratesSubtitle: 'Cross-currency comparison via itemordershistogram. Tournament capsule buy-difference from CS2 store, dollar as 0.',
    ratesRunBtn: 'Run rates',
    ratesResultTitle: 'Result',
    ratesTable1Title: 'Steam rates (1 USD = X CUR)',
    ratesTable2Title: 'Local prices → USD',
    ratesWaiting: 'Waiting for run…',
    ratesRunning: 'Calculating rates...',
    ratesDone: 'Done',
    ratesNoData: 'No data yet. Run analysis first.',
    ratesModuleMissing: 'ROI FX module is not loaded.',
    ratesInvalidItemNameId: 'item_nameid must be greater than 0.',
    inventoryTitle: 'Inventory',
    inventoryTotals: 'buy: {highest} • sell: {lowest}',
    searchPlaceholder: 'Search by name (e.g. Sur)...',
    sortColumnLabel: 'Column',
    sortDirectionLabel: 'Order',
    sortDirectionAZ: 'A-Z / 0-9',
    sortDirectionZA: 'Z-A / 9-0',
    logsTitle: 'Logs',
    rowsMeta: '{rows} rows / {items} items',
    severalStickers: 'Multiple sticker variants ({count})',
    noTradeban: 'no tradeban',
    no: 'No',
    hasTradeban: 'Tradeban',
    item: 'Item',
    group: 'Group',
    quantity: 'Quantity',
    stickers: 'Stickers / charms',
    listing: 'Listing',
    currency: 'currency',
    actions: 'Actions',
    history: 'History',
    updatePrice: 'Refresh price',
    historyButton: 'Check item history',
    sell: 'List',
    historyLoading: 'Loading history…',
    historyEmpty: 'No data to display.',
    historyRecent: 'Last 30 days (daily)',
    historyFull: 'Full history (daily)',
    historyLoadFailed: 'Failed to load history.',
    providePrice: 'Provide a valid listing price (minimum 0.03).',
    provideQty: 'Provide a valid quantity (minimum 1).',
    done: 'Done',
  },
};


const CURRENCY_CODE_DESCRIPTIONS = {
  USD: 'USD / долар США',
  GBP: 'GBP / фунт Великобританії',
  EUR: 'EUR / євро Європейського Союзу',
  CHF: 'CHF / швейцарський франк',
  RUB: 'RUB / російський рубль',
  PLN: 'PLN / польський злотий',
  BRL: 'BRL / бразильський реал',
  JPY: 'JPY / японська єна',
  NOK: 'NOK / норвезька крона',
  IDR: 'IDR / індонезійська рупія',
  MYR: 'MYR / малайзійський рингіт',
  PHP: 'PHP / філіппінське песо',
  SGD: 'SGD / сингапурський долар',
  THB: 'THB / тайський бат',
  VND: 'VND / в’єтнамський донг',
  KRW: 'KRW / південнокорейський вон',
  UAH: 'UAH / українська гривня',
  MXN: 'MXN / мексиканське песо',
  CAD: 'CAD / канадський долар',
  AUD: 'AUD / австралійський долар',
  NZD: 'NZD / новозеландський долар',
  CNY: 'CNY / китайський юань',
  INR: 'INR / індійська рупія',
  CLP: 'CLP / чилійське песо',
  PEN: 'PEN / перуанський соль',
  COP: 'COP / колумбійське песо',
  ZAR: 'ZAR / південноафриканський ренд',
  HKD: 'HKD / гонконгський долар',
  TWD: 'TWD / новий тайванський долар',
  SAR: 'SAR / саудівський ріал',
  AED: 'AED / дірхам ОАЕ',
  ILS: 'ILS / новий ізраїльський шекель',
  KZT: 'KZT / казахстанський теньге',
  KWD: 'KWD / кувейтський динар',
  QAR: 'QAR / катарський ріал',
  CRC: 'CRC / костариканський колон',
  UYU: 'UYU / уругвайське песо',
};

function formatCurrencyCodeLabel(code) {
  const normalizedCode = String(code || '').toUpperCase();
  return CURRENCY_CODE_DESCRIPTIONS[normalizedCode] || normalizedCode;
}

const SORT_COLUMNS = [
  { key: 'marketHashName', type: 'text', labelKey: 'item' },
  { key: 'groupText', type: 'text', labelKey: 'group' },
  { key: 'quantity', type: 'number', labelKey: 'quantity' },
  { key: 'floatValue', type: 'number', label: 'Float' },
  { key: 'stickersText', type: 'text', labelKey: 'stickers' },
  { key: 'tradeBanOrder', type: 'number', label: 'Tradeban' },
  { key: 'highestBuy', type: 'number', label: 'highest_buy_order' },
  { key: 'lowestSell', type: 'number', label: 'lowest_sell_order' },
];

function t(key, vars = {}) {
  const dict = I18N[state.language] || I18N.uk;
  let value = dict[key] ?? I18N.uk[key] ?? key;
  for (const [name, v] of Object.entries(vars)) value = value.replace(`{${name}}`, String(v));
  return value;
}

function updateLanguageSwitcher() {
  ui.langUkBtn.classList.toggle('active', state.language === 'uk');
  ui.langEnBtn.classList.toggle('active', state.language === 'en');
}

function calculateInventoryTotals() {
  let highestTotal = 0;
  let lowestTotal = 0;
  let hasHighest = false;
  let hasLowest = false;

  for (const item of state.inventory) {
    const quantity = Number.isFinite(item.amount) ? item.amount : 1;
    const marketData = state.priceByHash.get(item.marketHashName) || {};

    if (Number.isFinite(marketData.highestBuy)) {
      highestTotal += marketData.highestBuy * quantity;
      hasHighest = true;
    }

    if (Number.isFinite(marketData.lowestSell)) {
      lowestTotal += marketData.lowestSell * quantity;
      hasLowest = true;
    }
  }

  return {
    highest: hasHighest ? formatPrice(highestTotal) : '--',
    lowest: hasLowest ? formatPrice(lowestTotal) : '--',
    hasAny: hasHighest || hasLowest,
  };
}

function updateInventoryTitle() {
  ui.inventoryTitle.textContent = t('inventoryTitle');

  if (!ui.inventoryTotals) return;

  const totals = calculateInventoryTotals();
  ui.inventoryTotals.textContent = totals.hasAny
    ? t('inventoryTotals', { highest: totals.highest, lowest: totals.lowest })
    : '';
}

function getModuleLocalizationKey(baseKey) {
  if (state.activeModule === 'roi') return `${baseKey}Roi`;
  if (state.activeModule === 'rates') return `${baseKey}Rates`;
  return `${baseKey}Inventory`;
}

function applyLocalization() {
  document.documentElement.lang = state.language;
  ui.brandDescription.textContent = t('brandDescription');
  ui.languageLabel.textContent = t('languageLabel');
  ui.hintTitle.textContent = t('hintTitle');
  ui.hintDescription.textContent = t(getModuleLocalizationKey('hintDescription'));
  ui.mainTitle.textContent = t(getModuleLocalizationKey('mainTitle'));
  ui.mainSubtitle.textContent = t('mainSubtitle');
  ui.controlsTitle.textContent = t('controlsTitle');
  ui.parseInventoryBtn.textContent = t('parseInventoryBtn');
  ui.checkAllPricesBtn.textContent = t('checkAllPricesBtn');
  ui.inventoryModuleBtn.textContent = t('inventoryModuleBtn');
  ui.roiModuleBtn.textContent = t('roiModuleBtn');
  ui.ratesModuleBtn.textContent = t('ratesModuleBtn');
  updateInventoryTitle();
  ui.inventorySearchInput.placeholder = t('searchPlaceholder');
  ui.sortColumnLabel.textContent = t('sortColumnLabel');
  ui.sortDirectionLabel.textContent = t('sortDirectionLabel');
  updateSortControlsText();
  ui.logsTitle.textContent = t('logsTitle');
  ui.ratesTitle.textContent = t('ratesTitle');
  ui.ratesSubtitle.textContent = t('ratesSubtitle');
  ui.ratesRunBtn.textContent = t('ratesRunBtn');
  ui.ratesResultTitle.textContent = t('ratesResultTitle');
  ui.ratesTable1Title.textContent = t('ratesTable1Title');
  ui.ratesTable2Title.textContent = t('ratesTable2Title');
  if (!state.ratesResult) {
    ui.ratesStatus.textContent = t('ratesWaiting');
  }
  updateLanguageSwitcher();
}

function setLanguage(language) {
  state.language = language === 'en' ? 'en' : 'uk';
  applyLocalization();
  setActiveModule(state.activeModule);
  populateSortColumns();
  renderTable();
}

function updateSortControlsText() {
  const ascOption = ui.inventorySortDirection?.querySelector('option[value="asc"]');
  const descOption = ui.inventorySortDirection?.querySelector('option[value="desc"]');
  if (ascOption) ascOption.textContent = t('sortDirectionAZ');
  if (descOption) descOption.textContent = t('sortDirectionZA');
}

function populateSortColumns() {
  if (!ui.inventorySortColumn) return;
  ui.inventorySortColumn.innerHTML = SORT_COLUMNS.map((column) => {
    const label = column.labelKey ? t(column.labelKey) : column.label;
    return `<option value="${column.key}">${label}</option>`;
  }).join('');
  ui.inventorySortColumn.value = state.sortColumn;
}

function getCurrencySymbol() {
  const currencyId = Number(MARKET_CONFIG.currency);
  return CURRENCY_SYMBOLS[currencyId] || '';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function formatPrice(price) {
  if (!Number.isFinite(price)) return '--';
  return `${getCurrencySymbol()}${price.toFixed(2)}`;
}

function centsToPrice(valueInCents) {
  const cents = Number(valueInCents);
  if (!Number.isFinite(cents)) return null;
  return cents / 100;
}

function log(message, level = 'info') {
  const now = new Date();
  const text = `[${now.toLocaleTimeString()}] ${message}`;

  const row = document.createElement('div');
  row.className = `log-entry ${level}`;
  row.textContent = text;
  ui.logList.prepend(row);

  const liveRow = document.createElement('div');
  liveRow.className = `live-log-entry ${level}`;
  liveRow.textContent = message;
  ui.liveLogList.prepend(liveRow);

  if (ui.logList.childElementCount > 200) ui.logList.removeChild(ui.logList.lastChild);
  if (ui.liveLogList.childElementCount > 80) ui.liveLogList.removeChild(ui.liveLogList.lastChild);
}

function setStatus(text, variant = '') {
  ui.statusPill.textContent = `${t('statusPrefix')}: ${text}`;
  ui.statusPill.classList.remove('success', 'warning', 'danger');
  if (variant) ui.statusPill.classList.add(variant);
}

function setHistoryModalVisibility(isVisible) {
  if (!ui.priceHistoryModal) return;
  ui.priceHistoryModal.classList.toggle('is-visible', isVisible);
  ui.priceHistoryModal.setAttribute('aria-hidden', String(!isVisible));
  document.body.classList.toggle('modal-open', isVisible);
}

function setChartStatus(message) {
  if (!ui.priceHistoryStatus) return;
  ui.priceHistoryStatus.textContent = message || '';
}

function parsePriceHistoryDate(raw) {
  if (!raw) return null;
  let cleaned = String(raw).replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\s*\+(\d+)$/, ' GMT+$1');
  cleaned = cleaned.replace(/(\d{1,2}):(\s*GMT)/, '$1:00$2');
  cleaned = cleaned.replace(/(\d{1,2}):\s*$/, '$1:00');
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePriceValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const numeric = Number.parseFloat(value.replace(',', '.'));
  return Number.isNaN(numeric) ? null : numeric;
}

function formatDateLabel(date, includeYear = false) {
  if (!(date instanceof Date)) return '--';
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

function formatVolumeLabel(value) {
  if (!Number.isFinite(value)) return '--';
  return new Intl.NumberFormat('uk-UA').format(Math.round(value));
}

function getRangeLabel(points) {
  if (!points.length) return '--';
  const startDate = points[0]?.date;
  const endDate = points[points.length - 1]?.date;
  if (!startDate || !endDate) return '--';
  return `${formatDateLabel(startDate, state.currentHistoryRange === 'full')} — ${formatDateLabel(endDate, state.currentHistoryRange === 'full')}`;
}

let historyChartState = null;
let historySelectionState = null;
let currentViewRange = null;

function reduceNoisePoints(points) {
  if (!ui.noiseFilterToggle?.checked || points.length < 5) return points;
  const prices = points.map((point) => point.price).filter(Number.isFinite);
  if (!prices.length) return points;

  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor((sorted.length - 1) * 0.25)] ?? sorted[0];
  const q3 = sorted[Math.floor((sorted.length - 1) * 0.75)] ?? sorted[sorted.length - 1];
  const iqr = q3 - q1;
  if (!Number.isFinite(iqr) || iqr === 0) return points;

  const lower = q1 - iqr * 1.5;
  const upper = q3 + iqr * 1.5;
  return points.filter((point) => point.price >= lower && point.price <= upper);
}

function getBasePoints() {
  if (!state.currentHistory) return [];
  const points = state.currentHistoryRange === 'full' ? state.currentHistory.full : state.currentHistory.recent;
  return reduceNoisePoints(points);
}

function getViewPoints(points) {
  if (!currentViewRange || !points.length) return points;
  const start = Math.max(0, Math.min(currentViewRange.start, points.length - 1));
  const end = Math.max(start, Math.min(currentViewRange.end, points.length - 1));
  return points.slice(start, end + 1);
}

function updateHistoryInsights() {
  const points = getViewPoints(getBasePoints());

  if (!ui.historyTopPrices) return;
  ui.historyTopPrices.innerHTML = '';

  if (!points.length) {
    ui.historyTopPrices.innerHTML = '<li>Недостатньо даних.</li>';
    if (ui.historyTotalVolume) ui.historyTotalVolume.textContent = '--';
    if (ui.historyRangeLabel) ui.historyRangeLabel.textContent = '--';
    return;
  }

  const buckets = new Map();
  points.forEach((point) => {
    const key = Number.isFinite(point.price) ? point.price.toFixed(2) : null;
    if (!key) return;
    const current = buckets.get(key) || { price: point.price, volume: 0 };
    current.volume += Number.isFinite(point.volume) ? point.volume : 0;
    buckets.set(key, current);
  });

  const top = [...buckets.values()].sort((a, b) => b.volume - a.volume).slice(0, 3);
  if (!top.length) {
    ui.historyTopPrices.innerHTML = '<li>Недостатньо даних.</li>';
  } else {
    top.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.price.toFixed(2)} • ${formatVolumeLabel(item.volume)} продажів`;
      ui.historyTopPrices.appendChild(li);
    });
  }

  const totalVolume = points.reduce((sum, point) => sum + (Number.isFinite(point.volume) ? point.volume : 0), 0);
  if (ui.historyTotalVolume) ui.historyTotalVolume.textContent = formatVolumeLabel(totalVolume);
  if (ui.historyRangeLabel) ui.historyRangeLabel.textContent = getRangeLabel(points);
}

function updateForecastResult() {
  if (!ui.forecastResult) return;

  const points = getViewPoints(getBasePoints());
  if (!points.length) {
    ui.forecastResult.textContent = 'Немає історії для оцінки.';
    return;
  }

  const quantity = Number(ui.forecastQuantity?.value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    ui.forecastResult.textContent = 'Вкажіть кількість позицій.';
    return;
  }

  const days = Number(ui.forecastDays?.value);
  if (!Number.isFinite(days) || days <= 0) {
    ui.forecastResult.textContent = 'Вкажіть кількість днів історії.';
    return;
  }

  const endDate = points[points.length - 1]?.date;
  if (!(endDate instanceof Date)) {
    ui.forecastResult.textContent = 'Немає історії для оцінки.';
    return;
  }

  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const rangePoints = points.filter((point) => point.date >= startDate && point.date <= endDate);
  const totalVolume = rangePoints.reduce((sum, point) => sum + (Number.isFinite(point.volume) ? point.volume : 0), 0);
  if (totalVolume <= 0) {
    ui.forecastResult.textContent = 'Недостатньо обсягу продажів за обраний період.';
    return;
  }

  const avgPerDay = totalVolume / days;
  const estimatedDays = quantity / avgPerDay;
  ui.forecastResult.textContent = `≈ ${estimatedDays.toFixed(1)} днів (середній обсяг ${avgPerDay.toFixed(1)} / день)`;
}

function drawHistoryChart(points) {
  const canvas = ui.priceHistoryChart;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.clientWidth || 880;
  const height = canvas.height || 320;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  if (!points.length) {
    setChartStatus('Немає даних для відображення.');
    historyChartState = null;
    return;
  }

  const padding = { top: 18, right: 52, bottom: 30, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const prices = points.map((point) => point.price).filter(Number.isFinite);
  const volumes = points.map((point) => point.volume).filter(Number.isFinite);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const maxVolume = Math.max(...volumes, 1);
  const priceRange = Math.max(maxPrice - minPrice, 0.01);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;

  ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
  points.forEach((point, index) => {
    const x = padding.left + stepX * index;
    const barHeight = (point.volume / maxVolume) * chartHeight;
    ctx.fillRect(x - Math.max(1, stepX * 0.22), padding.top + chartHeight - barHeight, Math.max(2, stepX * 0.44), barHeight);
  });

  ctx.strokeStyle = 'rgba(96, 165, 250, 0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = padding.left + stepX * index;
    const y = padding.top + ((maxPrice - point.price) / priceRange) * chartHeight;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#93c5fd';
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${maxPrice.toFixed(2)}`, 6, padding.top + 4);
  ctx.fillText(`${minPrice.toFixed(2)}`, 6, padding.top + chartHeight);

  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(maxVolume)}`, width - 6, padding.top + 4);
  ctx.fillText('0', width - 6, padding.top + chartHeight);

  const firstDate = points[0]?.date;
  const lastDate = points[points.length - 1]?.date;
  ctx.textAlign = 'left';
  if (firstDate) ctx.fillText(formatDateLabel(firstDate, state.currentHistoryRange === 'full'), padding.left, height - 8);
  ctx.textAlign = 'right';
  if (lastDate) ctx.fillText(formatDateLabel(lastDate, state.currentHistoryRange === 'full'), width - padding.right, height - 8);

  historyChartState = {
    points,
    padding,
    width,
    height,
    chartWidth,
    chartHeight,
    viewOffset: currentViewRange?.start || 0,
  };

  if (historySelectionState?.active && historySelectionState.startX !== null && historySelectionState.currentX !== null) {
    const minX = Math.max(padding.left, Math.min(historySelectionState.startX, historySelectionState.currentX));
    const maxX = Math.min(width - padding.right, Math.max(historySelectionState.startX, historySelectionState.currentX));
    if (maxX - minX > 2) {
      ctx.fillStyle = 'rgba(96, 165, 250, 0.15)';
      ctx.fillRect(minX, padding.top, maxX - minX, chartHeight);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
      ctx.strokeRect(minX, padding.top, maxX - minX, chartHeight);
    }
  }

  setChartStatus('');
}

function renderHistoryChart() {
  if (!state.currentHistory) {
    setChartStatus('Немає даних для відображення.');
    drawHistoryChart([]);
    updateHistoryInsights();
    updateForecastResult();
    return;
  }

  const basePoints = getBasePoints();
  const viewPoints = getViewPoints(basePoints);
  drawHistoryChart(viewPoints);
  updateHistoryInsights();
  updateForecastResult();
}

function setHistoryRange(range) {
  state.currentHistoryRange = range;
  ui.priceHistoryRangeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.historyRange === range);
  });
  if (ui.priceHistorySubtitle) {
    ui.priceHistorySubtitle.textContent = range === 'recent' ? 'Останні 30 днів (по днях)' : 'Історичні дані за весь час (по днях)';
  }
  currentViewRange = null;
  if (state.currentHistory) {
    renderHistoryChart();
  }
}

async function loadPriceHistory(marketHashName) {
  const params = new URLSearchParams({ appid: APP_ID, market_hash_name: marketHashName });
  const response = await steamFetch({
    url: `${PRICE_HISTORY_URL}/?${params.toString()}`,
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response?.ok || !response?.data?.success || !Array.isArray(response.data.prices)) {
    throw new Error('Не вдалося отримати історію.');
  }

  const points = response.data.prices
    .map((entry) => {
      const [dateRaw, priceRaw, volumeRaw] = entry;
      const date = parsePriceHistoryDate(dateRaw);
      const price = parsePriceValue(priceRaw);
      const volume = Number.parseInt(String(volumeRaw).replace(/[^\d]/g, ''), 10);
      if (!date || !Number.isFinite(price)) return null;
      return { date, price, volume: Number.isFinite(volume) ? volume : 0 };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (!points.length) {
    throw new Error('Немає даних про історію.');
  }

  const since = new Date(Date.now() - PRICE_HISTORY_RANGE_DAYS * 24 * 60 * 60 * 1000);
  return {
    full: points,
    recent: points.filter((point) => point.date >= since),
  };
}

async function openHistoryModal(marketHashName) {
  setHistoryModalVisibility(true);
  if (ui.priceHistoryTitle) ui.priceHistoryTitle.textContent = marketHashName;
  setChartStatus('Завантаження історії…');
  state.currentHistory = null;
  currentViewRange = null;
  historySelectionState = null;
  setHistoryRange('recent');

  try {
    state.currentHistory = await loadPriceHistory(marketHashName);
    renderHistoryChart();
  } catch (error) {
    setChartStatus(error instanceof Error ? error.message : 'Не вдалося отримати історію.');
  }
}

function closeHistoryModal() {
  setHistoryModalVisibility(false);
}

function resetHistoryZoom() {
  currentViewRange = null;
  historySelectionState = null;
  renderHistoryChart();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function xToIndex(x, pointsLength) {
  if (!historyChartState || pointsLength <= 1) return 0;
  const { padding, chartWidth, width } = historyChartState;
  const clampedX = clamp(x, padding.left, width - padding.right);
  const ratio = (clampedX - padding.left) / chartWidth;
  return Math.round(ratio * (pointsLength - 1));
}

function handleSelectionStart(event) {
  if (!historyChartState || !state.currentHistory) return;
  const rect = ui.priceHistoryChart.getBoundingClientRect();
  const startX = event.clientX - rect.left;
  historySelectionState = { active: true, startX, currentX: startX };
  renderHistoryChart();
}

function handleSelectionMove(event) {
  if (!historySelectionState?.active || !historyChartState) return;
  const rect = ui.priceHistoryChart.getBoundingClientRect();
  historySelectionState.currentX = event.clientX - rect.left;
  renderHistoryChart();
}

function handleSelectionEnd() {
  if (!historySelectionState?.active || !historyChartState || !state.currentHistory) {
    historySelectionState = null;
    return;
  }

  const basePoints = getBasePoints();
  const visibleLength = historyChartState.points?.length || basePoints.length;
  const offset = historyChartState.viewOffset || 0;
  const startIndex = xToIndex(historySelectionState.startX, visibleLength) + offset;
  const endIndex = xToIndex(historySelectionState.currentX, visibleLength) + offset;
  const minIndex = clamp(Math.min(startIndex, endIndex), 0, basePoints.length - 1);
  const maxIndex = clamp(Math.max(startIndex, endIndex), 0, basePoints.length - 1);

  if (maxIndex - minIndex >= 2) {
    currentViewRange = { start: minIndex, end: maxIndex };
  }

  historySelectionState = null;
  renderHistoryChart();
}

async function findOrOpenSteamTab() {
  const tabs = await chrome.tabs.query({ url: 'https://steamcommunity.com/*' });
  if (tabs.length > 0) return tabs[0];

  const tab = await chrome.tabs.create({
    url: 'https://steamcommunity.com/market',
    active: false,
  });

  await new Promise((resolve) => {
    const listener = (tabId, info) => {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

  return tab;
}

async function runInSteamTab(func, args = []) {
  const tab = await findOrOpenSteamTab();
  if (!tab?.id) throw new Error(state.language === 'en' ? 'Failed to find or open a Steam tab.' : 'Не вдалося знайти або відкрити вкладку Steam.');

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    args,
    func,
  });

  return result?.result;
}

async function steamFetch(request) {
  return runInSteamTab(
    async (req) => {
      try {
        const res = await fetch(req.url, {
          method: req.method || 'GET',
          credentials: 'include',
          headers: req.headers || {},
          body: req.body,
        });

        const payload = { ok: res.ok, status: res.status, statusText: res.statusText, data: null };

        if (req.responseType === 'text') {
          payload.data = await res.text();
          return payload;
        }

        const rawText = await res.text();
        if (!rawText) return payload;

        try {
          payload.data = JSON.parse(rawText);
        } catch {
          payload.data = null;
        }

        return payload;
      } catch (error) {
        return { ok: false, status: 0, statusText: error.message, data: null };
      }
    },
    [request]
  );
}

async function steamFetchWithBackoff(request, label) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await steamFetch(request);
    if (response?.status !== 429) return response;

    if (attempt < RATE_LIMIT_MINUTES.length) {
      const waitMin = RATE_LIMIT_MINUTES[attempt];
      setStatus(`429 (${label}): чекаємо ${waitMin} хв`, 'warning');
      log(`${label}: отримано 429. Пауза ${waitMin} хв.`, 'warn');
      await delay(waitMin * 60 * 1000);
    }
  }

  setStatus(`429 (${label}) повторюється`, 'danger');
  log(`${label}: 429 отримано тричі. Запит зупинено.`, 'error');
  return { ok: false, status: 429, data: null };
}

async function steamFetch(request) {
  return runInSteamTab(
    async (req) => {
      try {
        const res = await fetch(req.url, {
          method: req.method || 'GET',
          credentials: 'include',
          headers: req.headers || {},
          body: req.body,
        });
        const payload = { ok: res.ok, status: res.status, statusText: res.statusText };
        if (req.responseType === 'text') {
          payload.data = await res.text();
        } else {
          payload.data = await res.json();
        }
        return payload;
      } catch (error) {
        return { ok: false, status: 0, statusText: error.message, data: null };
      }
    },
    [request]
  );
}


async function resolveMarketCurrency() {
  const data = await runInSteamTab(() => {
    const cookie = document.cookie || '';
    const currency = cookie.match(/(?:^|; )steamCurrencyId=(\d+)/)?.[1] || null;
    return { currency };
  });

  const detectedCurrency = String(data?.currency || '').trim();
  if (!/^\d+$/.test(detectedCurrency)) {
    if (!state.marketCurrencyInitialized) {
      log(`steamCurrencyId не знайдено в cookie, використовую дефолтну валюту: ${MARKET_CONFIG.currency}.`, 'warn');
      state.marketCurrencyInitialized = true;
    }
    return;
  }

  if (MARKET_CONFIG.currency !== detectedCurrency) {
    MARKET_CONFIG.currency = detectedCurrency;
    state.marketCurrencyInitialized = true;
    log(`Валюту оновлено з cookie Steam: steamCurrencyId=${MARKET_CONFIG.currency}.`, 'info');
    renderTable();
    return;
  }

  if (!state.marketCurrencyInitialized) {
    log(`Валюта з cookie Steam: steamCurrencyId=${MARKET_CONFIG.currency}.`, 'info');
    state.marketCurrencyInitialized = true;
  }
}

async function resolveSteamId() {
  const data = await runInSteamTab(() => {
    const fromGlobal = window.g_steamID || window.g_steamid || null;
    if (fromGlobal && /^\d{17}$/.test(String(fromGlobal))) return { steamId: String(fromGlobal) };

    const cookie = document.cookie || '';
    const secureRaw = cookie.match(/(?:^|; )steamLoginSecure=([^;]+)/)?.[1] || '';
    const decoded = decodeURIComponent(secureRaw);
    const fromCookie = decoded.match(/^(\d{17})(?:\|\||%7C%7C)/)?.[1] || decoded.match(/(\d{17})/)?.[1] || null;
    if (fromCookie) return { steamId: fromCookie };

    const profileLink = document.querySelector('a[href*="/profiles/"]')?.getAttribute('href') || '';
    const fromLink = profileLink.match(/\/profiles\/(\d{17})/)?.[1] || null;
    return { steamId: fromLink || null };
  });

  if (!data?.steamId) {
    throw new Error('Не вдалося визначити SteamID. Відкрий Steam (market/profile) під потрібним акаунтом.');
  }

  state.steamId = data.steamId;
  log(`SteamID для інвентарю: ${state.steamId}`, 'info');
}

function parseTradeBan(description) {
  const ownerDescriptions = Array.isArray(description?.owner_descriptions) ? description.owner_descriptions : [];
  const text = ownerDescriptions.map((entry) => entry?.value || '').join(' | ');
  if (!text) return { hasTradeBan: false, tradeBanText: t('no') };

  const hasBan = /Tradable After|tradable|обмін|недоступний/i.test(text);
  if (!hasBan) return { hasTradeBan: false, tradeBanText: t('no') };

  const dateMatch = text.match(/(\d{1,2}\s+[A-Za-z]+\s+\d{4}[^|<]*)/);
  return { hasTradeBan: true, tradeBanText: dateMatch ? dateMatch[1].trim() : t('hasTradeban') };
}

function extractStickersAndCharms(description) {
  const descriptions = Array.isArray(description?.descriptions) ? description.descriptions : [];

  const infoBlocks = descriptions
    .filter((entry) => {
      const name = String(entry?.name || '');
      const value = String(entry?.value || '');
      return /(sticker|charm|keychain)_info/i.test(name) || /id\s*=\s*["'](?:sticker|charm|keychain)_info/i.test(value);
    })
    .map((entry) => String(entry?.value || ''));

  const lines = infoBlocks
    .map((html) => {
      const cleanHtml = html.replace(/<br\s*\/?\s*>/gi, ' | ');
      const text = cleanHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return text.replace(/^Sticker:\s*/i, '');
    })
    .filter(Boolean)
    .filter((line) => !/This sticker can be applied|Souvenir Charm featuring a highlight/i.test(line));

  return lines.length ? lines.join(' | ') : '--';
}

function extractFloatFromDescription(description) {
  const descriptions = Array.isArray(description?.descriptions) ? description.descriptions : [];
  for (const entry of descriptions) {
    const value = String(entry?.value || '');
    const match = value.match(/float\s*[:=]\s*(0\.\d+)/i);
    if (match) return Number(match[1]);
  }
  return null;
}

function buildAssetFloatMap(assetPropertiesList) {
  return new Map(
    assetPropertiesList
      .map((entry) => {
        const assetId = String(entry?.assetid || '');
        const properties = Array.isArray(entry?.asset_properties) ? entry.asset_properties : [];
        const floatProp = properties.find((prop) => Number(prop?.propertyid) === 2 && prop?.float_value != null);
        const floatValue = Number.parseFloat(floatProp?.float_value);
        if (!assetId || !Number.isFinite(floatValue)) return null;
        return [assetId, floatValue];
      })
      .filter(Boolean)
  );
}

async function fetchInventoryWithFallbacks(steamId) {
  const variants = [
    new URLSearchParams({ l: 'english', count: '2000' }),
    new URLSearchParams({ count: '2000' }),
    new URLSearchParams(),
  ];

  let lastResponse = null;

  for (let index = 0; index < variants.length; index += 1) {
    const params = variants[index];
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const label = index === 0 ? 'inventory' : `inventory-fallback-${index}`;

    const response = await steamFetchWithBackoff(
      {
        url: `https://steamcommunity.com/inventory/${steamId}/${APP_ID}/${CONTEXT_ID}${suffix}`,
        method: 'GET',
        headers: { Accept: 'application/json' },
        responseType: 'json',
      },
      label
    );

    lastResponse = response;

    if (response?.ok && response?.data?.assets && response?.data?.descriptions) {
      if (index > 0) {
        log(`Інвентар завантажено через fallback #${index} (${params.toString() || 'без параметрів'}).`, 'warn');
      }
      return response;
    }

    if (response?.status !== 400) break;

    log(`Інвентар 400 для варіанту #${index} (${params.toString() || 'без параметрів'}), пробуємо далі...`, 'warn');
  }

  return lastResponse;
}

async function parseInventory() {
  try {
    await resolveSteamId();
  } catch (error) {
    log(error.message, 'error');
    setStatus('Немає SteamID', 'danger');
    return;
  }

  setStatus(`Парсинг інвентарю (${state.steamId})...`, 'warning');
  const response = await fetchInventoryWithFallbacks(state.steamId);

  if (!response?.ok || !response?.data?.assets || !response?.data?.descriptions) {
    log(`Інвентар не завантажено: ${response?.status || 'unknown'}`, 'error');
    setStatus('Помилка інвентарю', 'danger');
    return;
  }

  const assets = Array.isArray(response.data.assets) ? response.data.assets : [];
  const descriptions = Array.isArray(response.data.descriptions) ? response.data.descriptions : [];
  const assetPropertiesList = Array.isArray(response.data.asset_properties) ? response.data.asset_properties : [];
  const byClass = new Map(descriptions.map((d) => [`${d.classid}_${d.instanceid}`, d]));
  const assetFloatMap = buildAssetFloatMap(assetPropertiesList);

  state.inventory = assets
    .map((asset) => {
      const description = byClass.get(`${asset.classid}_${asset.instanceid}`) || null;
      if (!description?.market_hash_name) return null;
      const trade = parseTradeBan(description);
      const assetId = String(asset.assetid);
      return {
        assetid: assetId,
        amount: Number(asset.amount || '1'),
        marketHashName: description.market_hash_name,
        stickersText: extractStickersAndCharms(description),
        floatValue: assetFloatMap.get(assetId) ?? extractFloatFromDescription(description),
        hasTradeBan: trade.hasTradeBan,
        tradeBanText: trade.tradeBanText,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.marketHashName === b.marketHashName) return Number(a.hasTradeBan) - Number(b.hasTradeBan);
      return a.marketHashName.localeCompare(b.marketHashName, 'uk');
    });

  renderTable();
  setStatus('Інвентар готовий', 'success');
  log(`Інвентар зібрано: ${state.inventory.length} предметів.`, 'info');
}

function getSortColumnConfig() {
  return SORT_COLUMNS.find((column) => column.key === state.sortColumn) || SORT_COLUMNS[0];
}

function getSortableRowValue(row, columnKey) {
  const marketData = state.priceByHash.get(row.marketHashName) || {};
  if (columnKey === 'groupText') {
    return `${row.marketHashName} ${row.hasTradeBan ? 'tradeban' : t('noTradeban')}`;
  }
  if (columnKey === 'tradeBanOrder') {
    return row.hasTradeBan ? 1 : 0;
  }
  if (columnKey === 'highestBuy') {
    return Number.isFinite(marketData.highestBuy) ? marketData.highestBuy : null;
  }
  if (columnKey === 'lowestSell') {
    return Number.isFinite(marketData.lowestSell) ? marketData.lowestSell : null;
  }
  return row[columnKey];
}

function applySearchAndSort(rows) {
  const query = state.searchQuery.trim().toLocaleLowerCase();
  const filteredRows = !query
    ? rows
    : rows.filter((row) => row.marketHashName.toLocaleLowerCase().includes(query));

  const sortColumn = getSortColumnConfig();
  const directionFactor = state.sortDirection === 'desc' ? -1 : 1;

  return filteredRows.slice().sort((a, b) => {
    const left = getSortableRowValue(a, sortColumn.key);
    const right = getSortableRowValue(b, sortColumn.key);

    if (sortColumn.type === 'number') {
      const leftNum = Number.isFinite(left) ? left : Number.NEGATIVE_INFINITY;
      const rightNum = Number.isFinite(right) ? right : Number.NEGATIVE_INFINITY;
      if (leftNum === rightNum) {
        return a.marketHashName.localeCompare(b.marketHashName, 'uk') * directionFactor;
      }
      return (leftNum - rightNum) * directionFactor;
    }

    const leftText = String(left || '').toLocaleLowerCase();
    const rightText = String(right || '').toLocaleLowerCase();
    const textCompare = leftText.localeCompare(rightText, 'uk');
    if (textCompare === 0) return Number(a.hasTradeBan) - Number(b.hasTradeBan);
    return textCompare * directionFactor;
  });
}

function getRenderedRows() {
  if (!state.groupedMode) {
    const rows = state.inventory.map((item) => ({
      id: item.assetid,
      marketHashName: item.marketHashName,
      hasTradeBan: item.hasTradeBan,
      tradeBanText: item.tradeBanText,
      floatValue: item.floatValue,
      stickersText: item.stickersText,
      quantity: 1,
      items: [item],
    }));
    return applySearchAndSort(rows);
  }

  const grouped = new Map();
  for (const item of state.inventory) {
    const key = `${item.marketHashName}__${item.hasTradeBan ? '1' : '0'}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        marketHashName: item.marketHashName,
        hasTradeBan: item.hasTradeBan,
        tradeBanText: item.tradeBanText,
        quantity: 0,
        items: [],
        floatValues: [],
        stickers: new Set(),
      });
    }
    const g = grouped.get(key);
    g.quantity += 1;
    g.items.push(item);
    if (Number.isFinite(item.floatValue)) g.floatValues.push(item.floatValue);
    if (item.stickersText && item.stickersText !== '--') g.stickers.add(item.stickersText);
  }

  const rows = Array.from(grouped.values())
    .map((g) => ({
      id: g.id,
      marketHashName: g.marketHashName,
      hasTradeBan: g.hasTradeBan,
      tradeBanText: g.tradeBanText,
      quantity: g.quantity,
      items: g.items,
      floatValue: g.floatValues.length ? Math.min(...g.floatValues) : null,
      stickersText:
        g.stickers.size <= 1
          ? (Array.from(g.stickers)[0] || '--')
          : t('severalStickers', { count: g.stickers.size }),
    }))
    .sort((a, b) => {
      if (a.marketHashName === b.marketHashName) return Number(a.hasTradeBan) - Number(b.hasTradeBan);
      return a.marketHashName.localeCompare(b.marketHashName, 'uk');
    });

  return applySearchAndSort(rows);
}

async function checkPriceForHash(marketHashName) {
  await resolveMarketCurrency();
  const itemNameId = state.itemNameIds.get(marketHashName);
  const priceOverviewParams = new URLSearchParams({
    appid: APP_ID,
    country: MARKET_CONFIG.country,
    currency: MARKET_CONFIG.currency,
    market_hash_name: marketHashName,
  });

  const priceOverviewResponse = await steamFetch({
    url: `https://steamcommunity.com/market/priceoverview/?${priceOverviewParams.toString()}`,
    method: 'GET',
    headers: { Accept: 'application/json' },
    responseType: 'json',
  });

  let lowestFromOverview = null;
  if (priceOverviewResponse?.ok && priceOverviewResponse?.data?.success) {
    lowestFromOverview = centsToPrice(Math.round((Number.parseFloat(String(priceOverviewResponse.data.lowest_price || '').replace(',', '.').replace(/[^\d.]/g, '')) || 0) * 100));
  }

  if (!itemNameId) {
    state.priceByHash.set(marketHashName, {
      highestBuy: null,
      lowestSell: lowestFromOverview,
      highestBuyRaw: null,
      lowestSellRaw: null,
    });
    renderTable();
    return;
  }

  const histogramParams = new URLSearchParams({
    country: MARKET_CONFIG.country,
    language: MARKET_CONFIG.language,
    currency: MARKET_CONFIG.currency,
    item_nameid: String(itemNameId),
  });

  const histogramResponse = await steamFetch({
    url: `https://steamcommunity.com/market/itemordershistogram?${histogramParams.toString()}`,
    method: 'GET',
    headers: { Accept: 'application/json' },
    responseType: 'json',
  });

  if (priceOverviewResponse?.status === 429 && histogramResponse?.status === 429) {
    log(`Price check fail (${marketHashName}): 429 на priceoverview і itemordershistogram.`, 'error');
    setStatus(`429 для ${marketHashName} (обидва джерела)`, 'danger');
    return;
  }

  if (!histogramResponse?.ok || !histogramResponse?.data?.success) {
    if (priceOverviewResponse?.status === 429) {
      log(`Histogram fail (${marketHashName}): ${histogramResponse?.status || 'unknown'}`, 'warn');
    }
    state.priceByHash.set(marketHashName, {
      highestBuy: null,
      lowestSell: lowestFromOverview,
      highestBuyRaw: null,
      lowestSellRaw: null,
    });
    renderTable();
    return;
  }

  const highestBuyRaw = histogramResponse.data.highest_buy_order;
  const lowestSellRaw = histogramResponse.data.lowest_sell_order;

  state.priceByHash.set(marketHashName, {
    highestBuy: centsToPrice(highestBuyRaw),
    lowestSell: centsToPrice(lowestSellRaw),
    highestBuyRaw,
    lowestSellRaw,
  });

  renderTable();
}

async function checkAllPrices() {
  if (!state.inventory.length) {
    log('Спочатку спарсьте інвентар.', 'warn');
    return;
  }

  setStatus('Оновлення цін (всі)...', 'warning');
  const uniqueHashes = Array.from(new Set(state.inventory.map((item) => item.marketHashName)));

  for (const marketHashName of uniqueHashes) {
    await checkPriceForHash(marketHashName);
    await delay(250);
  }

  setStatus('Ціни оновлено', 'success');
  log(`Оновлено ціни для ${uniqueHashes.length} груп market_hash_name.`, 'info');
}

async function loadItemNameIds() {
  try {
    const response = await fetch(chrome.runtime.getURL('cs2.json'));
    const data = await response.json();
    state.itemNameIds = new Map(Object.entries(data || {}));
    log(`cs2.json завантажено: ${state.itemNameIds.size} item_nameid мапінгів.`, 'info');
  } catch (error) {
    state.itemNameIds = new Map();
    log(`Не вдалося завантажити cs2.json: ${error.message}`, 'warn');
  }
}

async function listItemForSaleByAssetId(assetid, priceValue) {
  const result = await runInSteamTab(
    async (payload) => {
      const sessionId =
        window.g_sessionID ||
        document.cookie.match(/(?:^|; )sessionid=([^;]+)/)?.[1] ||
        null;

      if (!sessionId) {
        return { ok: false, status: 0, error: 'sessionid-missing' };
      }

      const form = new URLSearchParams({
        sessionid: sessionId,
        appid: payload.appid,
        contextid: payload.contextid,
        assetid: payload.assetid,
        amount: '1',
        price: String(payload.netPrice),
      });

      const response = await fetch('https://steamcommunity.com/market/sellitem/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: form.toString(),
      });

      const text = await response.text();
      return { ok: response.ok, status: response.status, text };
    },
    [
      {
        appid: APP_ID,
        contextid: CONTEXT_ID,
        assetid,
        netPrice: Math.ceil((priceValue * 100) / 1.15),
      },
    ]
  );

  if (!result?.ok) return { ok: false, message: `HTTP ${result?.status || 'unknown'} ${result?.error || ''}`.trim() };

  let parsed = null;
  try {
    parsed = JSON.parse(result.text || '{}');
  } catch {
    parsed = null;
  }

  if (parsed?.success === false) {
    return { ok: false, message: parsed.message || 'unknown' };
  }

  return { ok: true };
}

async function listMultipleItems(rowData, quantity, priceValue) {
  if (rowData.hasTradeBan) {
    log(`Пропуск ${rowData.marketHashName}: є tradeban.`, 'warn');
    return;
  }

  const sellableItems = rowData.items.filter((item) => !item.hasTradeBan);
  if (!sellableItems.length) {
    log(`Немає доступних предметів для продажу: ${rowData.marketHashName}`, 'warn');
    return;
  }

  const requested = Math.max(1, Math.floor(quantity));
  const countToSell = Math.min(requested, sellableItems.length);

  if (requested > sellableItems.length) {
    log(`Запитано ${requested}, доступно лише ${sellableItems.length} (${rowData.marketHashName}).`, 'warn');
  }

  setStatus(`Sell x${countToSell}: ${rowData.marketHashName}`, 'warning');

  for (let index = 0; index < countToSell; index += 1) {
    const item = sellableItems[index];
    const result = await listItemForSaleByAssetId(item.assetid, priceValue);

    if (!result.ok) {
      log(`sellitem fail (${rowData.marketHashName}, #${index + 1}): ${result.message}`, 'error');
      continue;
    }

    log(`Виставлено (${index + 1}/${countToSell}): ${rowData.marketHashName} за ${formatPrice(priceValue)}.`, 'info');
    await delay(250);
  }

  setStatus(t('done'), 'success');
}

function renderRatesTables() {
  if (!state.ratesResult) {
    ui.ratesTable.innerHTML = `<tbody><tr><td>${t('ratesNoData')}</td></tr></tbody>`;
    ui.ratesCompareTable.innerHTML = `<tbody><tr><td>${t('ratesNoData')}</td></tr></tbody>`;
    return;
  }

  const rateRows = state.ratesResult.rateTable || [];
  const compareRows = state.ratesResult.comparisonTable || [];

  ui.ratesTable.innerHTML = `
    <thead><tr><th>code</th><th>steam_rate_per_1usd</th></tr></thead>
    <tbody>${rateRows.map((row) => `<tr><td>${formatCurrencyCodeLabel(row.code)}</td><td>${row.steam_rate_per_1usd}</td></tr>`).join('')}</tbody>
  `;

  ui.ratesCompareTable.innerHTML = `
    <thead><tr><th>code</th><th>localPrice</th><th>usdEquivalent</th><th>cheaperVsUSD_pct</th></tr></thead>
    <tbody>${compareRows.map((row) => `<tr><td>${formatCurrencyCodeLabel(row.code)}</td><td>${row.localPrice}</td><td>${row.usdEquivalent}</td><td>${row.cheaperVsUSD_pct}%</td></tr>`).join('')}</tbody>
  `;
}

async function runRatesModule() {
  const fxModule = window.SteamSuiteRoiFxModule;
  if (!fxModule?.runSteamRatesAnalyzer) {
    ui.ratesStatus.textContent = t('ratesModuleMissing');
    log(t('ratesModuleMissing'), 'error');
    return;
  }

  const itemNameId = Number.parseInt(ui.ratesItemNameIdInput.value, 10);
  if (!Number.isFinite(itemNameId) || itemNameId < 1) {
    ui.ratesStatus.textContent = t('ratesInvalidItemNameId');
    return;
  }

  const country = (ui.ratesCountryInput.value || 'UA').trim() || 'UA';
  const language = (ui.ratesLanguageInput.value || 'ukrainian').trim() || 'ukrainian';
  const maxConcurrencyRaw = Number.parseInt(ui.ratesConcurrencyInput.value, 10);
  const maxConcurrency = Number.isFinite(maxConcurrencyRaw)
    ? Math.min(Math.max(maxConcurrencyRaw, 1), 10)
    : 1;

  ui.ratesRunBtn.disabled = true;
  ui.ratesStatus.textContent = t('ratesRunning');

  try {
    state.ratesResult = await fxModule.runSteamRatesAnalyzer({
      itemNameId,
      country,
      language,
      maxConcurrency,
    });

    renderRatesTables();
    ui.ratesStatus.textContent = `${t('ratesDone')}: ${state.ratesResult.rateTable.length} rates`;
    log(`Курс: розрахунок завершено (${state.ratesResult.rateTable.length} валют).`, 'info');
  } catch (error) {
    ui.ratesStatus.textContent = String(error?.message || error);
    log(`Курс: помилка ${String(error?.message || error)}`, 'error');
  } finally {
    ui.ratesRunBtn.disabled = false;
  }
}

function setActiveModule(moduleKey) {
  if (moduleKey === 'roi') {
    state.activeModule = 'roi';
  } else if (moduleKey === 'rates') {
    state.activeModule = 'rates';
  } else {
    state.activeModule = 'inventory';
  }

  ui.inventoryModuleBtn.classList.toggle('active', state.activeModule === 'inventory');
  ui.roiModuleBtn.classList.toggle('active', state.activeModule === 'roi');
  ui.ratesModuleBtn.classList.toggle('active', state.activeModule === 'rates');
  ui.inventoryModuleContent.classList.toggle('hidden', state.activeModule !== 'inventory');
  ui.roiModuleContent.classList.toggle('hidden', state.activeModule !== 'roi');
  ui.ratesModuleContent.classList.toggle('hidden', state.activeModule !== 'rates');
  ui.hintDescription.textContent = t(getModuleLocalizationKey('hintDescription'));
  ui.mainTitle.textContent = t(getModuleLocalizationKey('mainTitle'));

  if (state.activeModule === 'rates') {
    renderRatesTables();
  }

  ui.liveLogList.innerHTML = '';
}


function updateGroupingButton() {
  ui.toggleGroupingBtn.textContent = state.groupedMode ? t('ungroupBtn') : t('groupBtn');
}

function renderTable() {
  updateInventoryTitle();
  const rows = getRenderedRows();
  const showQuantity = state.groupedMode;

  ui.inventoryTableHead.innerHTML = `
    <tr>
      <th>${t('item')}</th>
      <th>${t('group')}</th>
      ${showQuantity ? `<th>${t('quantity')}</th>` : ''}
      <th>Float</th>
      <th>${t('stickers')}</th>
      <th>Tradeban</th>
      <th>highest_buy_order</th>
      <th>lowest_sell_order</th>
      <th>${t('history')}</th>
      <th>${t('listing')} (${getCurrencySymbol() || t('currency')})</th>
      <th>${t('actions')}</th>
    </tr>
  `;

  ui.inventoryTableBody.innerHTML = '';

  for (const rowData of rows) {
    const row = document.createElement('tr');
    const group = `${rowData.marketHashName} • ${rowData.hasTradeBan ? 'tradeban' : t('noTradeban')}`;
    const marketData = state.priceByHash.get(rowData.marketHashName) || {};

    const highestBuyText = Number.isFinite(marketData.highestBuy)
      ? `${formatPrice(marketData.highestBuy)} ${marketData.highestBuyRaw != null ? `<span class="muted">(${marketData.highestBuyRaw})</span>` : ''}`
      : '--';

    const lowestSellText = Number.isFinite(marketData.lowestSell)
      ? `${formatPrice(marketData.lowestSell)} ${marketData.lowestSellRaw != null ? `<span class="muted">(${marketData.lowestSellRaw})</span>` : ''}`
      : '--';

    row.innerHTML = `
      <td>${rowData.marketHashName}</td>
      <td class="muted">${group}</td>
      ${showQuantity ? `<td>${rowData.quantity}</td>` : ''}
      <td>${Number.isFinite(rowData.floatValue) ? rowData.floatValue.toFixed(6) : '--'}</td>
      <td>${rowData.stickersText}</td>
      <td><span class="badge ${rowData.hasTradeBan ? 'danger' : 'ok'}">${rowData.tradeBanText}</span></td>
      <td>${highestBuyText}</td>
      <td>${lowestSellText}</td>
      <td>
        <button class="ghost history-button" type="button">${t('historyButton')}</button>
      </td>
      <td>
        <div class="listing-inputs">
          <input class="qty-input" type="number" min="1" step="1" value="1" />
          <input class="price-input" type="number" step="0.01" min="0.03" placeholder="0.50" />
        </div>
      </td>
      <td class="cell-actions">
        <button class="secondary check-price">${t('updatePrice')}</button>
        <button class="primary sell-item" ${rowData.hasTradeBan ? 'disabled' : ''}>${t('sell')}</button>
      </td>
    `;

    row.querySelector('.check-price').addEventListener('click', async () => {
      setStatus(`Price check: ${rowData.marketHashName}`, 'warning');
      await checkPriceForHash(rowData.marketHashName);
      setStatus(t('done'), 'success');
    });

    row.querySelector('.history-button')?.addEventListener('click', () => {
      openHistoryModal(rowData.marketHashName);
    });

    row.querySelector('.sell-item')?.addEventListener('click', async () => {
      const qtyValue = Number(row.querySelector('.qty-input').value);
      const priceValue = Number(row.querySelector('.price-input').value);

      if (!Number.isFinite(priceValue) || priceValue < 0.03) {
        log(t('providePrice'), 'error');
        return;
      }

      if (!Number.isFinite(qtyValue) || qtyValue < 1) {
        log(t('provideQty'), 'error');
        return;
      }

      await listMultipleItems(rowData, qtyValue, priceValue);
    });

    ui.inventoryTableBody.appendChild(row);
  }

  ui.inventoryMeta.textContent = t('rowsMeta', { rows: rows.length, items: state.inventory.length });
  updateGroupingButton();
}

function bindEvents() {
  ui.parseInventoryBtn.addEventListener('click', parseInventory);
  ui.checkAllPricesBtn.addEventListener('click', checkAllPrices);
  ui.inventoryModuleBtn.addEventListener('click', () => setActiveModule('inventory'));
  ui.roiModuleBtn.addEventListener('click', () => setActiveModule('roi'));
  ui.ratesModuleBtn.addEventListener('click', () => setActiveModule('rates'));
  ui.toggleGroupingBtn.addEventListener('click', () => {
    state.groupedMode = !state.groupedMode;
    renderTable();
  });
  ui.langUkBtn.addEventListener('click', () => setLanguage('uk'));
  ui.langEnBtn.addEventListener('click', () => setLanguage('en'));
  ui.inventorySearchInput.addEventListener('input', (event) => {
    state.searchQuery = event.target.value || '';
    renderTable();
  });
  ui.inventorySortColumn.addEventListener('change', (event) => {
    state.sortColumn = event.target.value || 'marketHashName';
    renderTable();
  });
  ui.inventorySortDirection.addEventListener('change', (event) => {
    state.sortDirection = event.target.value === 'desc' ? 'desc' : 'asc';
    renderTable();
  });
  ui.ratesRunBtn.addEventListener('click', runRatesModule);
  ui.closePriceHistory?.addEventListener('click', closeHistoryModal);
  ui.resetHistoryZoom?.addEventListener('click', resetHistoryZoom);
  ui.noiseFilterToggle?.addEventListener('change', () => {
    currentViewRange = null;
    renderHistoryChart();
  });
  ui.forecastQuantity?.addEventListener('input', updateForecastResult);
  ui.forecastDays?.addEventListener('input', updateForecastResult);
  ui.priceHistoryModal?.addEventListener('click', (event) => {
    if (event.target?.dataset?.close) closeHistoryModal();
  });
  ui.priceHistoryRangeButtons.forEach((button) => {
    button.addEventListener('click', () => setHistoryRange(button.dataset.historyRange));
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && ui.priceHistoryModal?.classList.contains('is-visible')) {
      closeHistoryModal();
    }
  });
  window.addEventListener('resize', () => {
    if (ui.priceHistoryModal?.classList.contains('is-visible')) {
      renderHistoryChart();
    }
  });

  ui.priceHistoryChart?.addEventListener('mousedown', handleSelectionStart);
  ui.priceHistoryChart?.addEventListener('mousemove', handleSelectionMove);
  ui.priceHistoryChart?.addEventListener('mouseup', handleSelectionEnd);
  ui.priceHistoryChart?.addEventListener('mouseleave', handleSelectionEnd);
}


(async function init() {
  await loadItemNameIds();
  bindEvents();
  populateSortColumns();
  applyLocalization();
  setActiveModule('inventory');
  renderRatesTables();
  await resolveMarketCurrency();
  renderTable();
  setStatus(t('idle'));
  log(`Режим автономний (${APP_BUILD}): запити йдуть з активної Steam-вкладки (cookies/session як у основному розширенні).`, 'info');

  window.SteamSuiteBridge = {
    setActiveModule,
    runRatesModule,
    pushLiveLog(message, level = 'info') {
      const liveRow = document.createElement('div');
      liveRow.className = `live-log-entry ${level}`;
      liveRow.textContent = message;
      ui.liveLogList.prepend(liveRow);
      if (ui.liveLogList.childElementCount > 80) ui.liveLogList.removeChild(ui.liveLogList.lastChild);
    },
  };
})();
