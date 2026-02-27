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
const CRAFTS_PRICE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CRAFTS_PRICE_CACHE_KEY = 'steam-suite:crafts-price-cache-v1';

const ui = {
  statusPill: document.getElementById('statusPill'),
  parseInventoryBtn: document.getElementById('parseInventoryBtn'),
  toggleGroupingBtn: document.getElementById('toggleGroupingBtn'),
  checkAllPricesBtn: document.getElementById('checkAllPricesBtn'),
  craftsInventorySourceInput: document.getElementById('craftsInventorySourceInput'),
  craftsInventorySourceLabel: document.getElementById('craftsInventorySourceLabel'),
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
  craftsModuleBtn: document.getElementById('craftsModuleBtn'),
  roiModuleBtn: document.getElementById('roiModuleBtn'),
  ratesModuleBtn: document.getElementById('ratesModuleBtn'),
  inventoryModuleContent: document.getElementById('inventoryModuleContent'),
  craftsModuleContent: document.getElementById('craftsModuleContent'),
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
  craftsTitle: document.getElementById('craftsTitle'),
  craftsSubtitle: document.getElementById('craftsSubtitle'),
  craftsItemsTitle: document.getElementById('craftsItemsTitle'),
  craftsRefreshBtn: document.getElementById('craftsRefreshBtn'),
  checkCraftsBtn: document.getElementById('checkCraftsBtn'),
  checkCraftPricesBtn: document.getElementById('checkCraftPricesBtn'),
  checkCraftStepUpPricesBtn: document.getElementById('checkCraftStepUpPricesBtn'),
  craftsMeta: document.getElementById('craftsMeta'),
  craftsTable: document.getElementById('craftsTable'),
  craftsResultsTitle: document.getElementById('craftsResultsTitle'),
  craftsResultsTable: document.getElementById('craftsResultsTable'),
  craftsVariantsTitle: document.getElementById('craftsVariantsTitle'),
  craftsVariantsTable: document.getElementById('craftsVariantsTable'),
  craftsInterestingTitle: document.getElementById('craftsInterestingTitle'),
  craftsInterestingTable: document.getElementById('craftsInterestingTable'),
  craftsStepUpTitle: document.getElementById('craftsStepUpTitle'),
  craftsStepUpTable: document.getElementById('craftsStepUpTable'),
  exportCraftsItemsCsvBtn: document.getElementById('exportCraftsItemsCsvBtn'),
  exportCraftsResultsCsvBtn: document.getElementById('exportCraftsResultsCsvBtn'),
  exportCraftsVariantsCsvBtn: document.getElementById('exportCraftsVariantsCsvBtn'),
  exportCraftsInterestingCsvBtn: document.getElementById('exportCraftsInterestingCsvBtn'),
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
  craftsItems: [],
  craftsItemsDbIndex: null,
  craftsBestResults: [],
  craftsAllResults: [],
  craftsMarketMetaIndex: null,
  craftsPriceByBucket: new Map(),
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
    hintDescriptionCrafts: 'Модуль “Крафти” показує тільки предмети інвентарю, де знайдено float.',
    hintDescriptionRoi: 'Кнопка “Зібрати базу для ROI” завантажує ціни капсул. Для фільтра дешевих наліпок вкажіть свій поріг ціни у валюті акаунта.',
    hintDescriptionRates: 'Модуль “Курс” рахує курси Steam по валютах (USD-якір) через itemordershistogram.',
    mainTitleInventory: 'Steam Inventory Sell Assistant',
    mainTitleCrafts: 'Steam Crafts Assistant',
    mainTitleRoi: 'Steam ROI Assistant',
    mainTitleRates: 'Steam Currency Assistant',
    mainSubtitle: 'Зібрати інвентар → згрупувати/розгрупувати → перевірити ціну → виставити.',
    controlsTitle: 'Керування',
    parseInventoryBtn: 'Спарсити інвентар',
    groupBtn: 'Згрупувати',
    ungroupBtn: 'Розгрупувати',
    checkAllPricesBtn: 'Оновити ціни (всі)',
    craftsInventorySourceLabel: 'Джерело інвентарю (SteamID / profiles URL / inventory URL)',
    craftsInventorySourcePlaceholder: 'https://steamcommunity.com/profiles/7656xxxxxxxxxxxxxx',
    craftsInventorySourceInvalid: 'Некоректне джерело інвентарю. Вкажіть SteamID, profiles URL або inventory URL.',
    inventoryModuleBtn: 'Inventory',
    craftsModuleBtn: 'Крафти',
    roiModuleBtn: 'ROI',
    ratesModuleBtn: 'Курс',
    craftsTitle: 'Крафти',
    craftsSubtitle: 'Список предметів з інвентарю, в яких знайдено float.',
    craftsItemsTitle: 'Предмети для крафту',
    craftsRefreshBtn: 'Оновити список',
    checkCraftsBtn: 'Перевірити крафти',
    checkCraftPricesBtn: 'Перевірити ціни',
    checkCraftStepUpPricesBtn: 'Перевірити ціни +1 крок',
    craftsResultsTitle: 'Найкращі плюсові крафти',
    craftsVariantsTitle: 'Можливі крафти і результати',
    craftsInterestingTitle: 'Крафти на цікаві числа',
    craftsStepUpTitle: 'Підрахунок апгрейду якості (+1 крок)',
    craftsMeta: '{count} предметів',
    craftsNoData: 'Немає предметів з float. Спарсіть інвентар.',
    craftsResultsNoData: 'Немає плюсових крафтів. Потрібно щонайменше 10 предметів однієї рідкості в межах колекції.',
    craftsVariantsNoData: 'Немає крафтів для відображення.',
    craftsInterestingNoData: 'Немає крафтів з цікавими float.',
    craftsStepUpNoData: 'Немає комбінацій для апгрейду якості на +1 крок.',
    exportCsv: 'Зберегти CSV',
    craftsPricesMissingMeta: 'База для маркет-тегів не завантажена. Перевірте crafts-market-meta.json.',
    craftsResultsMissingDb: 'База колекцій не завантажена. Перевірте data/items_simplified.json.',
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
    hintDescriptionCrafts: 'The “Crafts” module shows only inventory items where float is available.',
    hintDescriptionRoi: '“Collect ROI base” loads capsule prices. Use the price threshold field in your account currency to exclude cheap stickers.',
    hintDescriptionRates: 'The “Rates” module calculates Steam currency rates (USD anchor) via itemordershistogram.',
    mainTitleInventory: 'Steam Inventory Sell Assistant',
    mainTitleCrafts: 'Steam Crafts Assistant',
    mainTitleRoi: 'Steam ROI Assistant',
    mainTitleRates: 'Steam Currency Assistant',
    mainSubtitle: 'Collect inventory → group/ungroup → check prices → list items.',
    controlsTitle: 'Controls',
    parseInventoryBtn: 'Parse inventory',
    groupBtn: 'Group',
    ungroupBtn: 'Ungroup',
    checkAllPricesBtn: 'Refresh prices (all)',
    craftsInventorySourceLabel: 'Inventory source (SteamID / profiles URL / inventory URL)',
    craftsInventorySourcePlaceholder: 'https://steamcommunity.com/profiles/7656xxxxxxxxxxxxxx',
    craftsInventorySourceInvalid: 'Invalid inventory source. Provide SteamID, profiles URL, or inventory URL.',
    inventoryModuleBtn: 'Inventory',
    craftsModuleBtn: 'Crafts',
    roiModuleBtn: 'ROI',
    ratesModuleBtn: 'Rates',
    craftsTitle: 'Crafts',
    craftsSubtitle: 'List of inventory items that have a float value.',
    craftsItemsTitle: 'Craft items',
    craftsRefreshBtn: 'Refresh list',
    checkCraftsBtn: 'Check crafts',
    checkCraftPricesBtn: 'Check prices',
    checkCraftStepUpPricesBtn: 'Check prices +1 step',
    craftsResultsTitle: 'Best profitable crafts',
    craftsVariantsTitle: 'Possible crafts and outcomes',
    craftsInterestingTitle: 'Crafts for interesting numbers',
    craftsStepUpTitle: 'Quality step-up calculator (+1 tier)',
    craftsMeta: '{count} items',
    craftsNoData: 'No float items yet. Parse inventory first.',
    craftsResultsNoData: 'No profitable crafts found. You need at least 10 items of one rarity within a collection.',
    craftsVariantsNoData: 'No crafts to display yet.',
    craftsInterestingNoData: 'No crafts with interesting float outputs.',
    craftsStepUpNoData: 'No combinations found for +1 quality step-up.',
    exportCsv: 'Export CSV',
    craftsPricesMissingMeta: 'Market tags metadata is not loaded. Check crafts-market-meta.json.',
    craftsResultsMissingDb: 'Collection database is not loaded. Check data/items_simplified.json.',
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
  if (state.activeModule === 'crafts') return `${baseKey}Crafts`;
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
  if (ui.craftsInventorySourceInput) {
    ui.craftsInventorySourceInput.placeholder = t('craftsInventorySourcePlaceholder');
  }
  if (ui.craftsInventorySourceLabel) {
    ui.craftsInventorySourceLabel.textContent = t('craftsInventorySourceLabel');
  }
  ui.inventoryModuleBtn.textContent = t('inventoryModuleBtn');
  ui.craftsModuleBtn.textContent = t('craftsModuleBtn');
  ui.roiModuleBtn.textContent = t('roiModuleBtn');
  ui.ratesModuleBtn.textContent = t('ratesModuleBtn');
  updateInventoryTitle();
  ui.inventorySearchInput.placeholder = t('searchPlaceholder');
  ui.sortColumnLabel.textContent = t('sortColumnLabel');
  ui.sortDirectionLabel.textContent = t('sortDirectionLabel');
  updateSortControlsText();
  ui.logsTitle.textContent = t('logsTitle');
  ui.craftsTitle.textContent = t('craftsTitle');
  ui.craftsSubtitle.textContent = t('craftsSubtitle');
  if (ui.craftsItemsTitle) ui.craftsItemsTitle.textContent = t('craftsItemsTitle');
  ui.craftsRefreshBtn.textContent = t('craftsRefreshBtn');
  if (ui.checkCraftsBtn) ui.checkCraftsBtn.textContent = t('checkCraftsBtn');
  if (ui.checkCraftPricesBtn) ui.checkCraftPricesBtn.textContent = t('checkCraftPricesBtn');
  if (ui.checkCraftStepUpPricesBtn) ui.checkCraftStepUpPricesBtn.textContent = t('checkCraftStepUpPricesBtn');
  if (ui.craftsResultsTitle) ui.craftsResultsTitle.textContent = t('craftsResultsTitle');
  if (ui.craftsVariantsTitle) ui.craftsVariantsTitle.textContent = t('craftsVariantsTitle');
  if (ui.craftsInterestingTitle) ui.craftsInterestingTitle.textContent = t('craftsInterestingTitle');
  if (ui.craftsStepUpTitle) ui.craftsStepUpTitle.textContent = t('craftsStepUpTitle');
  if (ui.exportCraftsItemsCsvBtn) ui.exportCraftsItemsCsvBtn.textContent = t('exportCsv');
  if (ui.exportCraftsResultsCsvBtn) ui.exportCraftsResultsCsvBtn.textContent = t('exportCsv');
  if (ui.exportCraftsVariantsCsvBtn) ui.exportCraftsVariantsCsvBtn.textContent = t('exportCsv');
  if (ui.exportCraftsInterestingCsvBtn) ui.exportCraftsInterestingCsvBtn.textContent = t('exportCsv');
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
  renderCraftsResultsTable();
  renderCraftsVariantsTable();
  renderCraftsInterestingTable();
  renderCraftsStepUpTable();
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


function parseInventorySourceInput(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return { steamId: null, inventoryUrl: null, sourceType: 'account' };

  const fromDigits = value.match(/^(\d{17})$/)?.[1];
  if (fromDigits) return { steamId: fromDigits, inventoryUrl: null, sourceType: 'custom' };

  const fromProfile = value.match(/\/profiles\/(\d{17})/i)?.[1];
  if (fromProfile) return { steamId: fromProfile, inventoryUrl: null, sourceType: 'custom' };

  const fromInventory = value.match(/\/inventory\/(\d{17})\/+730\/2/i)?.[1];
  if (fromInventory) {
    const inventoryUrl = value.startsWith('http') ? value : `https://${value.replace(/^\/+/, '')}`;
    return { steamId: fromInventory, inventoryUrl, sourceType: 'custom' };
  }

  return { steamId: null, inventoryUrl: null, sourceType: 'invalid' };
}

function buildInventoryUrlWithParams(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    parsed.searchParams.set('l', parsed.searchParams.get('l') || 'ukrainian');
    parsed.searchParams.set('count', parsed.searchParams.get('count') || '1000');
    parsed.searchParams.set('preserve_bbcode', parsed.searchParams.get('preserve_bbcode') || '1');
    parsed.searchParams.set('raw_asset_properties', parsed.searchParams.get('raw_asset_properties') || '1');
    return parsed.toString();
  } catch {
    return baseUrl;
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

async function fetchInventoryWithFallbacks(steamId, customInventoryUrl = null) {
  const variants = [
    new URLSearchParams({ l: 'ukrainian', count: '1000', preserve_bbcode: '1', raw_asset_properties: '1' }),
    new URLSearchParams({ l: 'english', count: '1000', preserve_bbcode: '1', raw_asset_properties: '1' }),
    new URLSearchParams({ count: '1000', raw_asset_properties: '1' }),
    new URLSearchParams(),
  ];

  let lastResponse = null;

  for (let index = 0; index < variants.length; index += 1) {
    const params = variants[index];
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const label = index === 0 ? 'inventory' : `inventory-fallback-${index}`;

    const inventoryUrl = customInventoryUrl && index === 0
      ? buildInventoryUrlWithParams(customInventoryUrl)
      : `https://steamcommunity.com/inventory/${steamId}/${APP_ID}/${CONTEXT_ID}${suffix}`;

    const response = await steamFetchWithBackoff(
      {
        url: inventoryUrl,
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

async function parseInventory(sourceInputValue = '') {
  const source = parseInventorySourceInput(sourceInputValue || '');

  if (source.sourceType === 'invalid') {
    log(t('craftsInventorySourceInvalid'), 'error');
    setStatus(t('craftsInventorySourceInvalid'), 'danger');
    return;
  }

  if (source.steamId) {
    state.steamId = source.steamId;
    log(`SteamID для інвентарю: ${state.steamId} (custom source)`, 'info');
  } else {
    try {
      await resolveSteamId();
    } catch (error) {
      log(error.message, 'error');
      setStatus('Немає SteamID', 'danger');
      return;
    }
  }

  setStatus(`Парсинг інвентарю (${state.steamId})...`, 'warning');
  const response = await fetchInventoryWithFallbacks(state.steamId, source.inventoryUrl);

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

  state.craftsItems = state.inventory.filter((item) => Number.isFinite(item.floatValue));
  state.craftsBestResults = [];
  state.craftsAllResults = [];
  renderTable();
  renderCraftsTable();
  renderCraftsResultsTable();
  renderCraftsVariantsTable();
  renderCraftsInterestingTable();
  renderCraftsStepUpTable();
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


function rarityIdToMarketTag(rarityId = '') {
  const normalized = String(rarityId || '').replace(/^rarity_/, '');
  if (!normalized) return null;
  const token = normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('_');
  return token ? `tag_Rarity_${token}` : null;
}

function collectionIdToMarketTag(collectionId = '') {
  const raw = String(collectionId || '').trim();
  if (!raw) return null;
  if (raw.startsWith('tag_set_')) return raw;

  const normalized = raw
    .replace(/^collection-/, '')
    .replace(/^tag_/, '')
    .replace(/-/g, '_');

  if (!normalized.startsWith('set_')) return null;
  return `tag_${normalized}`;
}


function applyCraftInputPrices(inputRows = []) {
  let updated = 0;
  inputRows.forEach((row) => {
    const marketHashName = row?.marketHashName;
    const priceCents = Number(row?.priceCents);
    if (!marketHashName || !Number.isFinite(priceCents) || priceCents <= 0) return;

    const nextPrice = centsToPrice(priceCents);
    const existing = state.priceByHash.get(marketHashName) || {};
    const existingSell = Number(existing.lowestSell);
    const shouldUpdate = !Number.isFinite(existingSell) || nextPrice < existingSell;
    if (!shouldUpdate) return;

    state.priceByHash.set(marketHashName, {
      ...existing,
      lowestSell: nextPrice,
      lowestSellRaw: String(priceCents),
    });
    updated += 1;
  });
  return updated;
}


function normalizeMarketHashName(marketHashName = '') {
  return String(marketHashName)
    .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/i, '')
    .trim();
}

function buildLowestSellByBaseNameIndex() {
  const byBaseName = new Map();
  state.priceByHash.forEach((marketData, marketHashName) => {
    const baseName = normalizeMarketHashName(marketHashName);
    if (!baseName) return;
    const lowestSell = Number(marketData?.lowestSell);
    if (!Number.isFinite(lowestSell) || lowestSell <= 0) return;

    const existing = Number(byBaseName.get(baseName));
    if (!Number.isFinite(existing) || lowestSell < existing) {
      byBaseName.set(baseName, lowestSell);
    }
  });
  return byBaseName;
}

function parseMarketSearchResults(resultsHtml = '') {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(resultsHtml || ''), 'text/html');
  const rows = [];
  doc.querySelectorAll('.market_listing_searchresult').forEach((row) => {
    const marketHashName = row.getAttribute('data-hash-name') || '';
    const priceNode = row.querySelector('.market_listing_their_price .normal_price[data-price]');
    const rawPrice = Number(priceNode?.getAttribute('data-price'));
    if (!marketHashName || !Number.isFinite(rawPrice) || rawPrice <= 0) return;
    rows.push({ marketHashName, priceCents: Math.round(rawPrice) });
  });
  return rows;
}

function buildMarketSearchUrl({ collectionTag, rarityTag, start = 0, count = 10 }) {
  const normalizedCollection = String(collectionTag || '').trim();
  const normalizedRarity = String(rarityTag || '').trim();
  if (!normalizedCollection) throw new Error('collection-tag-missing');
  if (!normalizedRarity) throw new Error('rarity-tag-missing');

  const pairs = [
    ['query', ''],
    ['start', String(start)],
    ['count', String(count)],
    ['search_descriptions', '0'],
    ['sort_column', 'price'],
    ['sort_dir', 'asc'],
    ['appid', '730'],
    ['category_730_ItemSet[]', normalizedCollection],
    ['category_730_ProPlayer[]', 'any'],
    ['category_730_StickerCapsule[]', 'any'],
    ['category_730_Tournament[]', 'any'],
    ['category_730_TournamentTeam[]', 'any'],
    ['category_730_Type[]', 'any'],
    ['category_730_Weapon[]', 'any'],
    ['category_730_Quality[]', 'tag_normal'],
    ['category_730_Rarity[]', normalizedRarity],
  ];

  const query = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return `https://steamcommunity.com/market/search/render/?${query}`;
}

function resolveCollectionTagForBucket(bucket, metaIndex) {
  const byNameTag = metaIndex.collectionTagByName.get(bucket.collection);
  const tagVotes = new Map();

  (bucket.itemNames || []).forEach((itemName) => {
    const entry = metaIndex.byName.get(itemName);
    if (!entry) return;
    (Array.isArray(entry.collections) ? entry.collections : []).forEach((collection) => {
      if (collection?.name !== bucket.collection) return;
      const tag = collectionIdToMarketTag(collection.id);
      if (!tag) return;
      tagVotes.set(tag, (tagVotes.get(tag) || 0) + 1);
    });
  });

  const votedTag = Array.from(tagVotes.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return votedTag || byNameTag || null;
}

function loadCraftsPriceCache() {
  try {
    const raw = localStorage.getItem(CRAFTS_PRICE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCraftsPriceCache(cacheObj) {
  try {
    localStorage.setItem(CRAFTS_PRICE_CACHE_KEY, JSON.stringify(cacheObj || {}));
  } catch {
    // ignore storage errors
  }
}

function isCraftPriceCacheEntryFresh(entry) {
  const checkedAt = Number(entry?.checkedAt || 0);
  if (!Number.isFinite(checkedAt) || checkedAt <= 0) return false;
  return (Date.now() - checkedAt) < CRAFTS_PRICE_CACHE_TTL_MS;
}

async function fetchMarketRowsByCollectionAndRarity({ collectionTag, rarityTag }) {
  const collected = [];
  const count = 10;
  let start = 0;
  let total = null;

  while (total === null || start < total) {
    const url = buildMarketSearchUrl({ collectionTag, rarityTag, start, count });
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    if (!payload?.success) throw new Error('market-search-failed');

    const rows = parseMarketSearchResults(payload.results_html || '');
    collected.push(...rows);

    const totalCount = Number(payload.total_count);
    total = Number.isFinite(totalCount) ? totalCount : collected.length;
    start += Number(payload.pagesize || count) || count;

    if (!rows.length) break;
  }

  return collected;
}


async function loadCraftsMarketMetaDb() {
  try {
    const response = await fetch(chrome.runtime.getURL('crafts-market-meta.json'));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const byName = new Map();
    const rarityTagByName = new Map();
    const collectionTagByName = new Map();

    (Array.isArray(data) ? data : []).forEach((entry) => {
      if (!entry?.name) return;
      byName.set(entry.name, entry);

      if (entry?.rarityName && entry?.rarityId) {
        const rarityTag = rarityIdToMarketTag(entry.rarityId);
        if (rarityTag) rarityTagByName.set(entry.rarityName, rarityTag);
      }

      (Array.isArray(entry.collections) ? entry.collections : []).forEach((collection) => {
        if (!collection?.name || !collection?.id) return;
        const collectionTag = collectionIdToMarketTag(collection.id);
        if (collectionTag) collectionTagByName.set(collection.name, collectionTag);
      });
    });

    state.craftsMarketMetaIndex = { byName, rarityTagByName, collectionTagByName };
    log(`Базу маркет-мета завантажено: ${byName.size} записів.`, 'info');
  } catch (error) {
    state.craftsMarketMetaIndex = null;
    log(`Не вдалося завантажити базу маркет-мета: ${error.message}`, 'warn');
  }
}

async function checkCraftPrices() {
  if (!state.craftsItemsDbIndex || !window.SteamCraftCalculator) {
    setStatus(t('craftsResultsMissingDb'), 'danger');
    return;
  }
  if (!state.craftsMarketMetaIndex) {
    setStatus(t('craftsPricesMissingMeta'), 'danger');
    return;
  }

  const buckets = window.SteamCraftCalculator.getCraftBuckets(state.craftsItems || [], state.craftsItemsDbIndex);
  if (!buckets.length) {
    state.craftsPriceByBucket = new Map();
    renderCraftsResultsTable();
    renderCraftsVariantsTable();
    renderCraftsInterestingTable();
    renderCraftsStepUpTable();
    setStatus(t('craftsResultsNoData'), 'warning');
    return;
  }

  setStatus('Перевірка цін крафтів…', 'warning');
  const priceByBucket = new Map();
  const cache = loadCraftsPriceCache();
  let cacheHits = 0;
  let fetched = 0;

  for (const bucket of buckets) {
    const key = `${bucket.collection}__${bucket.inputRarity}`;
    const collectionTag = resolveCollectionTagForBucket(bucket, state.craftsMarketMetaIndex);
    const inputRarityTag = state.craftsMarketMetaIndex.rarityTagByName.get(bucket.inputRarity);
    const outputRarityTag = state.craftsMarketMetaIndex.rarityTagByName.get(bucket.outputRarity);

    if (!collectionTag || !inputRarityTag || !outputRarityTag) {
      log(`Пропуск крафту ${bucket.collection} / ${bucket.inputRarity}: не знайдено market теги.`, 'warn');
      continue;
    }

    const cacheEntry = cache[key];
    const sameTags = cacheEntry
      && cacheEntry.collectionTag === collectionTag
      && cacheEntry.inputRarityTag === inputRarityTag
      && cacheEntry.outputRarityTag === outputRarityTag;
    if (sameTags && isCraftPriceCacheEntryFresh(cacheEntry) && cacheEntry.value) {
      const cachedValue = cacheEntry.value;
      applyCraftInputPrices(cachedValue.inputRows || []);
      priceByBucket.set(key, cachedValue);
      cacheHits += 1;
      continue;
    }

    try {
      fetched += 1;
      log(`Крафт ціни: ${bucket.collection} -> collection tag ${collectionTag}, rarity ${inputRarityTag}`, 'info');
      const inputRows = await fetchMarketRowsByCollectionAndRarity({ collectionTag, rarityTag: inputRarityTag });
      const outputRows = await fetchMarketRowsByCollectionAndRarity({ collectionTag, rarityTag: outputRarityTag });
      applyCraftInputPrices(inputRows);
      const inputPrices = inputRows.map((row) => row.priceCents).filter((price) => Number.isFinite(price) && price > 0).sort((a, b) => a - b);
      const outputPrices = outputRows.map((row) => row.priceCents).filter((price) => Number.isFinite(price) && price > 0);
      const outputPricesByName = {};
      outputRows.forEach((entry) => {
        const baseName = normalizeMarketHashName(entry.marketHashName);
        const price = Number(entry.priceCents);
        if (!baseName || !Number.isFinite(price) || price <= 0) return;
        if (!Number.isFinite(outputPricesByName[baseName]) || price < outputPricesByName[baseName]) {
          outputPricesByName[baseName] = price;
        }
      });

      if (inputPrices.length < 10 || !outputPrices.length) continue;

      const inputCostCents = inputPrices.slice(0, 10).reduce((sum, price) => sum + price, 0);
      const expectedOutputCents = Math.round(outputPrices.reduce((sum, price) => sum + price, 0) / outputPrices.length);

      const value = {
        inputCostCents,
        expectedOutputCents,
        expectedProfitCents: expectedOutputCents - inputCostCents,
        inputRowsCount: inputRows.length,
        outputRowsCount: outputRows.length,
        inputRows: inputRows.map((row) => ({ marketHashName: row.marketHashName, priceCents: row.priceCents })),
        outputPricesByName,
      };

      priceByBucket.set(key, value);
      cache[key] = {
        checkedAt: Date.now(),
        collectionTag,
        inputRarityTag,
        outputRarityTag,
        value,
      };
    } catch (error) {
      log(`Ціни крафту ${bucket.collection} / ${bucket.inputRarity}: ${error.message}`, 'warn');
    }
  }

  saveCraftsPriceCache(cache);
  state.craftsPriceByBucket = priceByBucket;
  renderCraftsTable();
  renderCraftsResultsTable();
  renderCraftsVariantsTable();
  renderCraftsInterestingTable();
  renderCraftsStepUpTable();
  setStatus(`Ціни перевірено: ${priceByBucket.size} колекцій (cache: ${cacheHits}, нові: ${fetched}).`, 'success');
}

async function checkCraftStepUpPrices() {
  if (!state.craftsItemsDbIndex || !window.SteamCraftCalculator) {
    setStatus(t('craftsResultsMissingDb'), 'danger');
    return;
  }
  if (!state.craftsMarketMetaIndex) {
    setStatus(t('craftsPricesMissingMeta'), 'danger');
    return;
  }

  const rows = buildCraftsStepUpRows();
  if (!rows.length) {
    setStatus(t('craftsStepUpNoData'), 'warning');
    renderCraftsStepUpTable();
    return;
  }

  const requestMap = new Map();
  rows.forEach((entry) => {
    const collectionTag = resolveCollectionTagForBucket({
      collection: entry.collection,
      itemNames: entry.inputNames || [],
    }, state.craftsMarketMetaIndex);
    const rarityTag = state.craftsMarketMetaIndex.rarityTagByName.get(entry.nextStepRarity);
    if (!collectionTag || !rarityTag) return;

    const key = `${entry.collection}__${entry.nextStepRarity}`;
    if (!requestMap.has(key)) {
      requestMap.set(key, {
        key,
        collection: entry.collection,
        nextStepRarity: entry.nextStepRarity,
        collectionTag,
        rarityTag,
      });
    }
  });

  const requests = Array.from(requestMap.values());
  if (!requests.length) {
    setStatus(t('craftsStepUpNoData'), 'warning');
    return;
  }

  let done = 0;
  let updated = 0;
  setStatus(`Перевірка цін +1 крок… ${done}/${requests.length}`, 'warning');

  for (const request of requests) {
    try {
      const marketRows = await fetchMarketRowsByCollectionAndRarity({
        collectionTag: request.collectionTag,
        rarityTag: request.rarityTag,
      });
      updated += applyCraftInputPrices(marketRows || []);
    } catch (error) {
      log(`Ціни +1 крок ${request.collection} / ${request.nextStepRarity}: ${error.message}`, 'warn');
    }

    done += 1;
    setStatus(`Перевірка цін +1 крок… ${done}/${requests.length}`, 'warning');
  }

  renderCraftsStepUpTable();
  setStatus(`Ціни +1 крок перевірено: ${done} наборів (оновлено цін: ${updated}).`, 'success');
}

async function loadCraftsItemsDb() {
  try {
    const response = await fetch(chrome.runtime.getURL('calc1-main/extension/data/items_simplified.json'));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.craftsItemsDbIndex = window.SteamCraftCalculator?.buildItemIndex(data || []);
    log(`Базу крафтів завантажено: ${Array.isArray(data) ? data.length : 0} записів.`, 'info');
  } catch (error) {
    state.craftsItemsDbIndex = null;
    log(`Не вдалося завантажити базу крафтів: ${error.message}`, 'warn');
  }
}

function runCraftsCheck() {
  if (!state.craftsItemsDbIndex || !window.SteamCraftCalculator) {
    state.craftsBestResults = [];
    state.craftsAllResults = [];
    renderCraftsResultsTable(t('craftsResultsMissingDb'));
    renderCraftsVariantsTable(t('craftsResultsMissingDb'));
    renderCraftsInterestingTable(t('craftsResultsMissingDb'));
    renderCraftsStepUpTable(t('craftsResultsMissingDb'));
    return;
  }

  state.craftsAllResults = window.SteamCraftCalculator.analyzeCrafts
    ? window.SteamCraftCalculator.analyzeCrafts(
      state.craftsItems || [],
      state.craftsItemsDbIndex
    )
    : window.SteamCraftCalculator.analyzePositiveCrafts(
      state.craftsItems || [],
      state.craftsItemsDbIndex
    );

  state.craftsBestResults = window.SteamCraftCalculator.analyzePositiveCrafts(
    state.craftsItems || [],
    state.craftsItemsDbIndex
  );

  renderCraftsResultsTable();
  renderCraftsVariantsTable();
  renderCraftsInterestingTable();
  renderCraftsStepUpTable();

  if (!state.craftsAllResults.length) {
    renderCraftsVariantsTable();
    renderCraftsInterestingTable();
    renderCraftsStepUpTable();
    log('Крафти: не знайдено комбінацій.', 'warn');
    return;
  }

  log(
    `Крафти: знайдено ${state.craftsAllResults.length} комбінацій (плюсових: ${state.craftsBestResults.length}).`,
    'info'
  );
}


function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCraftVariants(rows = []) {
  const groups = new Map();
  rows.forEach((row) => {
    const usedIds = (row.usedItems || []).map((entry) => entry.assetid || '').filter(Boolean).sort();
    const comboKey = `${row.collection}__${row.inputRarity}__${usedIds.join('|')}`;
    if (!groups.has(comboKey)) {
      const bucketKey = `${row.collection}__${row.inputRarity}`;
      const pricing = state.craftsPriceByBucket.get(bucketKey);
      const inputFloatsTip = (row.usedItems || [])
        .map((entry) => `${entry.name}: ${Number(entry.floatValue || 0).toFixed(6)}`)
        .join('\n');
      groups.set(comboKey, {
        key: comboKey,
        collection: row.collection,
        inputRarity: row.inputRarity,
        outputRarity: row.outputRarity,
        inputNames: row.inputNames || [],
        inputFloatsTip,
        avgInputPercent: row.avgInputPercent,
        avgInputFloat: row.avgInputFloat,
        inputWearBest: row.inputWearBest,
        inputWearWorst: row.inputWearWorst,
        usedItems: row.usedItems || [],
        inputCostCents: pricing?.inputCostCents ?? null,
        outputs: [],
      });
    }

    const group = groups.get(comboKey);
    const bucketKey = `${row.collection}__${row.inputRarity}`;
    const pricing = state.craftsPriceByBucket.get(bucketKey);
    const outputPricesByName = pricing?.outputPricesByName || {};
    const outputPriceCents = Number(outputPricesByName[row.expectedName]);

    group.outputs.push({
      name: row.expectedName,
      expectedFloat: row.expectedFloat,
      expectedWear: row.expectedWear,
      priceCents: Number.isFinite(outputPriceCents) ? outputPriceCents : null,
    });
  });

  const variants = Array.from(groups.values()).map((group) => {
    const equalChance = group.outputs.length ? 1 / group.outputs.length : 0;
    const expectedOutputCents = group.outputs.length
      ? Math.round(group.outputs.reduce((sum, entry) => sum + (entry.priceCents || 0), 0) / group.outputs.length)
      : null;
    const outputReturnPercent = Number.isFinite(group.inputCostCents) && group.inputCostCents > 0 && Number.isFinite(expectedOutputCents)
      ? (expectedOutputCents / group.inputCostCents) * 100
      : null;

    return {
      ...group,
      outputs: group.outputs,
      expectedOutputCents,
      profitCents: Number.isFinite(group.inputCostCents) && Number.isFinite(expectedOutputCents)
        ? expectedOutputCents - group.inputCostCents
        : null,
      chanceEach: equalChance,
      outputReturnPercent,
    };
  });

  variants.sort((a, b) => {
    const returnA = Number.isFinite(a.outputReturnPercent) ? a.outputReturnPercent : -Infinity;
    const returnB = Number.isFinite(b.outputReturnPercent) ? b.outputReturnPercent : -Infinity;
    if (returnA !== returnB) return returnB - returnA;
    const profitA = Number.isFinite(a.profitCents) ? a.profitCents : -Infinity;
    const profitB = Number.isFinite(b.profitCents) ? b.profitCents : -Infinity;
    if (profitA !== profitB) return profitB - profitA;
    return a.collection.localeCompare(b.collection, 'uk');
  });

  return variants;
}


function formatFullFloat(value) {
  const floatValue = Number(value);
  if (!Number.isFinite(floatValue)) return '—';
  const raw = String(value);
  if (raw && !raw.includes('e') && !raw.includes('E')) return raw;
  return floatValue.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
}

function getInterestingFloatReasons(value) {
  const floatValue = Number(value);
  if (!Number.isFinite(floatValue) || floatValue < 0) return [];

  const reasons = [];
  const fullFloat = formatFullFloat(floatValue);
  const decimal = fullFloat.split('.')[1] || '';

  if (floatValue <= 0.009) reasons.push('≤0.009');
  const repeatMatch = decimal.match(/(\d)\1{4,}/);
  if (repeatMatch && Number(repeatMatch.index) <= 2) reasons.push('repeat x5 (start<=3)');

  for (let index = 0; index <= Math.min(2, decimal.length - 5); index += 1) {
    const chunk = decimal.slice(index, index + 5);
    if (chunk === '12345' || chunk === '23456') {
      reasons.push(`pattern ${chunk} (start<=3)`);
      break;
    }
  }

  if (floatValue >= 0.07 && floatValue <= 0.072) reasons.push('0.07-0.072');
  if (floatValue >= 0.15 && floatValue <= 0.152) reasons.push('0.15-0.152');
  if (/^0\.\d0000\d*$/.test(fullFloat)) reasons.push('x.10000 / x.20000');
  return Array.from(new Set(reasons));
}

function buildInterestingCraftVariants(variants = []) {
  return variants
    .map((variant) => {
      const interestingOutputs = (variant.outputs || [])
        .map((entry) => {
          const reasons = getInterestingFloatReasons(entry.expectedFloat);
          return reasons.length ? { ...entry, reasons } : null;
        })
        .filter(Boolean);

      if (!interestingOutputs.length) return null;
      return {
        ...variant,
        interestingOutputs,
      };
    })
    .filter(Boolean);
}


function buildCraftsStepUpRows() {
  if (!state.craftsItemsDbIndex || !window.SteamCraftCalculator) return [];

  const wearOrder = Array.isArray(window.SteamCraftCalculator.WEAR_ORDER)
    ? window.SteamCraftCalculator.WEAR_ORDER
    : ['Battle-Scarred', 'Well-Worn', 'Field-Tested', 'Minimal Wear', 'Factory New'];

  const variants = buildCraftVariants(state.craftsAllResults || []);
  const rows = [];

  variants.forEach((variant) => {
    const avgInputPercent = Number(variant.avgInputPercent);
    if (!Number.isFinite(avgInputPercent) || avgInputPercent < 0 || avgInputPercent > 1) return;

    const comboItems = Array.isArray(variant.usedItems) ? variant.usedItems : [];
    if (comboItems.length !== 10) return;

    (variant.outputs || []).forEach((firstOutput) => {
      const firstWearRank = wearOrder.indexOf(firstOutput.expectedWear);
      if (firstWearRank < 0) return;

      const nextStepRarity = window.SteamCraftCalculator.getNextRarity(variant.outputRarity);
      if (!nextStepRarity) return;

      const secondOutputsDb = state.craftsItemsDbIndex.byCollectionRarity?.get(`${variant.collection}__${nextStepRarity}`) || [];
      const nextStepOutputs = secondOutputsDb
        .map((item) => {
          const span = Number(item.max_float) - Number(item.min_float);
          if (!Number.isFinite(span) || span <= 0) return null;
          const floatValue = Number(item.min_float) + (span * avgInputPercent);
          const wear = window.SteamCraftCalculator.detectWearLabel(floatValue);
          if (!wear) return null;
          const wearRank = wearOrder.indexOf(wear);
          if (wearRank <= firstWearRank) return null;
          return {
            name: item.name,
            floatValue,
            wear,
            wearDelta: wearRank - firstWearRank,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a.wearDelta !== b.wearDelta) return b.wearDelta - a.wearDelta;
          return a.floatValue - b.floatValue;
        });

      if (!nextStepOutputs.length) return;

      const noteMilSpec001 = variant.outputRarity === 'Industrial Grade' && nextStepRarity === 'Mil-Spec Grade'
        && nextStepOutputs.some((entry) => entry.floatValue <= 0.01);

      rows.push({
        collection: variant.collection,
        inputRarity: variant.inputRarity,
        outputRarity: variant.outputRarity,
        nextStepRarity,
        inputNames: variant.inputNames || [],
        inputFloatsTip: variant.inputFloatsTip || '',
        usedItems: comboItems,
        firstOutputName: firstOutput.name,
        firstOutputFloat: firstOutput.expectedFloat,
        firstOutputWear: firstOutput.expectedWear,
        firstOutputPriceCents: Number(firstOutput.priceCents),
        nextStepOutputs,
        noteMilSpec001,
        needMore: 9,
      });
    });
  });

  rows.sort((a, b) => {
    if (a.nextStepOutputs.length !== b.nextStepOutputs.length) return b.nextStepOutputs.length - a.nextStepOutputs.length;
    if (a.firstOutputFloat !== b.firstOutputFloat) return a.firstOutputFloat - b.firstOutputFloat;
    return a.collection.localeCompare(b.collection, 'uk');
  });

  return rows;
}

function renderCraftsStepUpTable(forcedMessage = '') {
  if (!ui.craftsStepUpTable) return;

  const rows = buildCraftsStepUpRows();
  const lowestSellByBaseName = buildLowestSellByBaseNameIndex();
  if (ui.craftsStepUpTitle) {
    ui.craftsStepUpTitle.textContent = `${t('craftsStepUpTitle')} (${rows.length})`;
  }

  if (!rows.length) {
    ui.craftsStepUpTable.innerHTML = `<tbody><tr><td>${forcedMessage || t('craftsStepUpNoData')}</td></tr></tbody>`;
    return;
  }

  ui.craftsStepUpTable.innerHTML = `
    <thead><tr><th>Колекція</th><th>Готовий вхід (10 скінів)</th><th>Результат крафту #1</th><th>Якщо додати ще 9 таких (крафт #2)</th><th>Ціни</th><th>Нотатка</th></tr></thead>
    <tbody>${rows.map((entry) => {
      const firstPriceFromState = Number(lowestSellByBaseName.get(entry.firstOutputName));
      const firstPrice = Number.isFinite(firstPriceFromState)
        ? formatPrice(firstPriceFromState)
        : (Number.isFinite(entry.firstOutputPriceCents) ? formatPrice(entry.firstOutputPriceCents / 100) : '—');
      const nextStepText = entry.nextStepOutputs
        .map((next) => `${next.name} (${formatFullFloat(next.floatValue)} • ${next.wear})`)
        .join(' • ');
      const nextStepTip = `Крафт #2:\n10x ${entry.firstOutputName} (${formatFullFloat(entry.firstOutputFloat)})\nМожливі виходи:\n${entry.nextStepOutputs.map((next) => `${next.name} => ${formatFullFloat(next.floatValue)} (${next.wear})`).join('\n')}`;
      const inputTip = `Використано вже готову комбінацію з 10 скінів:\n${entry.inputFloatsTip || entry.usedItems.map((item) => `${item.name}: ${formatFullFloat(item.floatValue)}`).join('\n')}`;
      const nextStepPrices = entry.nextStepOutputs
        .map((next) => {
          const lowestSell = Number(lowestSellByBaseName.get(next.name));
          return `${next.name}: ${Number.isFinite(lowestSell) ? formatPrice(lowestSell) : '—'}`;
        })
        .join(' • ');
      const note = entry.noteMilSpec001 ? 'Mil-Spec ≤ 0.01' : '';
      return `<tr>
        <td>${escapeHtml(entry.collection)}<br><small>${escapeHtml(entry.inputRarity)} → ${escapeHtml(entry.outputRarity)} → ${escapeHtml(entry.nextStepRarity)}</small></td>
        <td class="input-names-tip" title="${escapeHtml(inputTip)}">${escapeHtml(entry.inputNames.join(' • '))}<br><small>10/10 готово</small></td>
        <td>${escapeHtml(entry.firstOutputName)}<br><small>${escapeHtml(formatFullFloat(entry.firstOutputFloat))} • ${escapeHtml(entry.firstOutputWear)} • ціна: ${escapeHtml(firstPrice)}</small></td>
        <td class="input-names-tip" title="${escapeHtml(nextStepTip)}">${escapeHtml(nextStepText)}<br><small>додати ще: ${entry.needMore}</small></td>
        <td><small>${escapeHtml(nextStepPrices)}</small></td>
        <td>${escapeHtml(note)}</td>
      </tr>`;
    }).join('')}</tbody>
  `;
}

function renderCraftsVariantsTable(forcedMessage = '') {
  if (!ui.craftsVariantsTable) return;

  const variants = buildCraftVariants(state.craftsAllResults || []);
  if (ui.craftsVariantsTitle) {
    ui.craftsVariantsTitle.textContent = `${t('craftsVariantsTitle')} (${variants.length})`;
  }
  if (!variants.length) {
    ui.craftsVariantsTable.innerHTML = `<tbody><tr><td>${forcedMessage || t('craftsVariantsNoData')}</td></tr></tbody>`;
    return;
  }

  ui.craftsVariantsTable.innerHTML = `
    <thead><tr><th>Колекція</th><th>Вхід</th><th>Назва input</th><th>Ціна входу</th><th>Очік. вихід</th><th>Очік. % виходу</th><th>P/L</th><th>Результати</th></tr></thead>
    <tbody>${variants.map((variant, index) => {
      const rowId = `craft-variant-${index}`;
      const outputsPreview = variant.outputs.slice(0, 3).map((entry) => escapeHtml(entry.name)).join(' • ');
      const outputsMore = variant.outputs.length > 3 ? ` +${variant.outputs.length - 3}` : '';
      const detailsRows = variant.outputs.map((entry) => {
        const chance = variant.chanceEach * 100;
        const price = Number.isFinite(entry.priceCents) ? formatPrice(entry.priceCents / 100) : '—';
        return `<tr><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(formatFullFloat(entry.expectedFloat))}</td><td>${escapeHtml(entry.expectedWear)}</td><td>${chance.toFixed(2)}%</td><td>${price}</td></tr>`;
      }).join('');

      const namesText = `${variant.inputNames.slice(0, 3).join(' • ')}${variant.inputNames.length > 3 ? ' …' : ''}`;
      const safeTooltip = escapeHtml(variant.inputFloatsTip);
      const inputCost = Number.isFinite(variant.inputCostCents) ? formatPrice(variant.inputCostCents / 100) : '—';
      const expected = Number.isFinite(variant.expectedOutputCents) ? formatPrice(variant.expectedOutputCents / 100) : '—';
      const outputPercent = Number.isFinite(variant.outputReturnPercent) ? `${variant.outputReturnPercent.toFixed(2)}%` : '—';
      const profit = Number.isFinite(variant.profitCents) ? formatPrice(variant.profitCents / 100) : '—';

      return `
        <tr class="craft-variant-row" data-target="${rowId}">
          <td>${escapeHtml(variant.collection)}</td>
          <td>${escapeHtml(variant.inputRarity)} → ${escapeHtml(variant.outputRarity)}</td>
          <td class="input-names-tip" title="${safeTooltip}">${escapeHtml(namesText)}</td>
          <td>${inputCost}</td>
          <td>${expected}</td>
          <td>${outputPercent}</td>
          <td>${profit}</td>
          <td>${outputsPreview}${outputsMore}</td>
        </tr>
        <tr id="${rowId}" class="craft-variant-details hidden"><td colspan="8"><table class="inventory-table"><thead><tr><th>Можливий скін</th><th>Очік. float</th><th>Wear</th><th>Шанс</th><th>Ціна</th></tr></thead><tbody>${detailsRows}</tbody></table></td></tr>
      `;
    }).join('')}</tbody>
  `;

  ui.craftsVariantsTable.querySelectorAll('.craft-variant-row').forEach((row) => {
    row.addEventListener('click', () => {
      const targetId = row.getAttribute('data-target');
      const detailsRow = ui.craftsVariantsTable.querySelector(`#${targetId}`);
      if (detailsRow) detailsRow.classList.toggle('hidden');
    });
  });
}

function renderCraftsInterestingTable(forcedMessage = '') {
  if (!ui.craftsInterestingTable) return;

  const allVariants = buildCraftVariants(state.craftsAllResults || []);
  const interestingVariants = buildInterestingCraftVariants(allVariants);
  if (ui.craftsInterestingTitle) {
    ui.craftsInterestingTitle.textContent = `${t('craftsInterestingTitle')} (${interestingVariants.length})`;
  }

  if (!interestingVariants.length) {
    ui.craftsInterestingTable.innerHTML = `<tbody><tr><td>${forcedMessage || t('craftsInterestingNoData')}</td></tr></tbody>`;
    return;
  }

  ui.craftsInterestingTable.innerHTML = `
    <thead><tr><th>Колекція</th><th>Вхід</th><th>Назва input</th><th>Ціна входу</th><th>Очік. вихід</th><th>Очік. % виходу</th><th>Цікавих результатів</th></tr></thead>
    <tbody>${interestingVariants.map((variant, index) => {
      const rowId = `craft-interesting-${index}`;
      const namesText = `${variant.inputNames.slice(0, 3).join(' • ')}${variant.inputNames.length > 3 ? ' …' : ''}`;
      const safeTooltip = escapeHtml(variant.inputFloatsTip);
      const inputCost = Number.isFinite(variant.inputCostCents) ? formatPrice(variant.inputCostCents / 100) : '—';
      const expected = Number.isFinite(variant.expectedOutputCents) ? formatPrice(variant.expectedOutputCents / 100) : '—';
      const outputPercent = Number.isFinite(variant.outputReturnPercent) ? `${variant.outputReturnPercent.toFixed(2)}%` : '—';

      const detailsRows = variant.interestingOutputs.map((entry) => {
        const chance = variant.chanceEach * 100;
        const price = Number.isFinite(entry.priceCents) ? formatPrice(entry.priceCents / 100) : '—';
        return `<tr><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(formatFullFloat(entry.expectedFloat))}</td><td>${escapeHtml(entry.expectedWear)}</td><td>${escapeHtml(entry.reasons.join(', '))}</td><td>${chance.toFixed(2)}%</td><td>${price}</td></tr>`;
      }).join('');

      return `
        <tr class="craft-variant-row" data-target="${rowId}">
          <td>${escapeHtml(variant.collection)}</td>
          <td>${escapeHtml(variant.inputRarity)} → ${escapeHtml(variant.outputRarity)}</td>
          <td class="input-names-tip" title="${safeTooltip}">${escapeHtml(namesText)}</td>
          <td>${inputCost}</td>
          <td>${expected}</td>
          <td>${outputPercent}</td>
          <td>${variant.interestingOutputs.length}</td>
        </tr>
        <tr id="${rowId}" class="craft-variant-details hidden"><td colspan="7"><table class="inventory-table"><thead><tr><th>Можливий скін</th><th>Очік. float</th><th>Wear</th><th>Причина</th><th>Шанс</th><th>Ціна</th></tr></thead><tbody>${detailsRows}</tbody></table></td></tr>
      `;
    }).join('')}</tbody>
  `;

  ui.craftsInterestingTable.querySelectorAll('.craft-variant-row').forEach((row) => {
    row.addEventListener('click', () => {
      const targetId = row.getAttribute('data-target');
      const detailsRow = ui.craftsInterestingTable.querySelector(`#${targetId}`);
      if (detailsRow) detailsRow.classList.toggle('hidden');
    });
  });
}

function escapeCsv(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function exportTableToCsv(tableElement, filename, { excludeDetails = false } = {}) {
  if (!tableElement) return;
  const headers = Array.from(tableElement.querySelectorAll('thead th')).map((th) => th.textContent.trim());
  const rows = [];

  Array.from(tableElement.querySelectorAll('tbody tr')).forEach((tr) => {
    if (excludeDetails && tr.classList.contains('craft-variant-details')) return;
    if (tr.querySelector('td[colspan]')) return;
    const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent);
    if (!cells.length) return;
    rows.push(cells);
  });

  if (!headers.length || !rows.length) {
    log('CSV: немає даних для експорту.', 'warn');
    return;
  }

  const csvLines = [headers, ...rows].map((row) => row.map(escapeCsv).join(','));
  const blob = new Blob([`${csvLines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function renderCraftsResultsTable(forcedMessage = '') {
  const rows = state.craftsBestResults || [];

  if (!ui.craftsResultsTable) return;

  if (!rows.length) {
    ui.craftsResultsTable.innerHTML = `<tbody><tr><td>${forcedMessage || t('craftsResultsNoData')}</td></tr></tbody>`;
    return;
  }

  ui.craftsResultsTable.innerHTML = `
    <thead><tr><th>Колекція</th><th>Вхід</th><th>Назви input</th><th>Вихід</th><th>Результат</th><th>Float</th><th>Wear</th><th>Items в колекції</th><th>Avg input float</th><th>Витрати (10 input)</th><th>Очік. вихід</th><th>P/L</th></tr></thead>
    <tbody>${rows.slice(0, 150).map((row) => {
      const bucketKey = `${row.collection}__${row.inputRarity}`;
      const pricing = state.craftsPriceByBucket.get(bucketKey);
      const inputCost = pricing ? formatPrice(pricing.inputCostCents / 100) : '—';
      const outputValue = pricing ? formatPrice(pricing.expectedOutputCents / 100) : '—';
      const profit = pricing ? formatPrice(pricing.expectedProfitCents / 100) : '—';
      return `<tr><td>${row.collection}</td><td>${row.inputRarity} (${row.inputWearWorst}…${row.inputWearBest})</td><td>${row.inputNames.slice(0, 3).join(' • ')}${row.inputNames.length > 3 ? ' …' : ''} (${row.distinctInputNames})</td><td>${row.outputRarity}</td><td>${row.expectedName}</td><td>${escapeHtml(formatFullFloat(row.expectedFloat))}</td><td>${row.expectedWear}</td><td>${row.inputItemsCount}</td><td>${escapeHtml(formatFullFloat(row.avgInputFloat))}</td><td>${inputCost}</td><td>${outputValue}</td><td>${profit}</td></tr>`;
    }).join('')}</tbody>
  `;
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

function renderCraftsTable() {
  const rows = (state.craftsItems || []).slice().sort((a, b) => {
    if (a.marketHashName === b.marketHashName) return (a.floatValue || 0) - (b.floatValue || 0);
    return a.marketHashName.localeCompare(b.marketHashName, 'uk');
  });

  ui.craftsMeta.textContent = t('craftsMeta', { count: rows.length });

  if (!rows.length) {
    ui.craftsTable.innerHTML = `<tbody><tr><td>${t('craftsNoData')}</td></tr></tbody>`;
    return;
  }

  ui.craftsTable.innerHTML = `
    <thead><tr><th>${t('item')}</th><th>assetid</th><th>float</th><th>price</th></tr></thead>
    <tbody>${rows.map((row) => {
      const marketData = state.priceByHash.get(row.marketHashName) || {};
      const inputPrice = Number.isFinite(marketData.lowestSell) ? formatPrice(marketData.lowestSell) : '--';
      return `<tr><td>${row.marketHashName}</td><td>${row.assetid}</td><td>${Number(row.floatValue).toFixed(6)}</td><td>${inputPrice}</td></tr>`;
    }).join('')}</tbody>
  `;
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
  if (moduleKey === 'crafts') {
    state.activeModule = 'crafts';
  } else if (moduleKey === 'roi') {
    state.activeModule = 'roi';
  } else if (moduleKey === 'rates') {
    state.activeModule = 'rates';
  } else {
    state.activeModule = 'inventory';
  }

  ui.inventoryModuleBtn.classList.toggle('active', state.activeModule === 'inventory');
  ui.craftsModuleBtn.classList.toggle('active', state.activeModule === 'crafts');
  ui.roiModuleBtn.classList.toggle('active', state.activeModule === 'roi');
  ui.ratesModuleBtn.classList.toggle('active', state.activeModule === 'rates');
  ui.inventoryModuleContent.classList.toggle('hidden', state.activeModule !== 'inventory');
  ui.craftsModuleContent.classList.toggle('hidden', state.activeModule !== 'crafts');
  ui.roiModuleContent.classList.toggle('hidden', state.activeModule !== 'roi');
  ui.ratesModuleContent.classList.toggle('hidden', state.activeModule !== 'rates');
  ui.hintDescription.textContent = t(getModuleLocalizationKey('hintDescription'));
  ui.mainTitle.textContent = t(getModuleLocalizationKey('mainTitle'));

  if (state.activeModule === 'crafts') {
    renderCraftsTable();
  }

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
  ui.parseInventoryBtn.addEventListener('click', () => parseInventory(''));
  ui.checkAllPricesBtn.addEventListener('click', checkAllPrices);
  ui.inventoryModuleBtn.addEventListener('click', () => setActiveModule('inventory'));
  ui.craftsModuleBtn.addEventListener('click', () => setActiveModule('crafts'));
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
  ui.craftsRefreshBtn.addEventListener('click', () => parseInventory(ui.craftsInventorySourceInput?.value || ''));
  ui.checkCraftsBtn?.addEventListener('click', runCraftsCheck);
  ui.checkCraftPricesBtn?.addEventListener('click', checkCraftPrices);
  ui.checkCraftStepUpPricesBtn?.addEventListener('click', checkCraftStepUpPrices);
  ui.exportCraftsItemsCsvBtn?.addEventListener('click', () => {
    exportTableToCsv(ui.craftsTable, `crafts-items-${Date.now()}.csv`);
  });
  ui.exportCraftsResultsCsvBtn?.addEventListener('click', () => {
    exportTableToCsv(ui.craftsResultsTable, `crafts-results-${Date.now()}.csv`);
  });
  ui.exportCraftsVariantsCsvBtn?.addEventListener('click', () => {
    exportTableToCsv(ui.craftsVariantsTable, `crafts-variants-${Date.now()}.csv`, { excludeDetails: true });
  });
  ui.exportCraftsInterestingCsvBtn?.addEventListener('click', () => {
    exportTableToCsv(ui.craftsInterestingTable, `crafts-interesting-${Date.now()}.csv`, { excludeDetails: true });
  });
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
  await Promise.all([loadItemNameIds(), loadCraftsItemsDb(), loadCraftsMarketMetaDb()]);
  bindEvents();
  populateSortColumns();
  applyLocalization();
  setActiveModule('inventory');
  renderRatesTables();
  renderCraftsTable();
  renderCraftsResultsTable();
  renderCraftsVariantsTable();
  renderCraftsInterestingTable();
  renderCraftsStepUpTable();
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
