# Inventory Test — Steam Inventory Sell Assistant

## 🇺🇦 Українською

### Що це
`інвентар тест` — окреме MV3-розширення для Google Chrome, яке працює зі Steam Community Market для CS2 (`appid=730`, `contextid=2`).

Розширення допомагає:
- зібрати інвентар акаунта,
- побачити трейдбан/без трейдбану окремо,
- перевірити `highest_buy_order` та `lowest_sell_order`,
- вручну або масово виставити предмети на продаж (`sellitem`).

### Основні можливості
- Парсинг інвентарю Steam (до 2000 предметів за запит).
- Групування / розгрупування по `market_hash_name` з окремим поділом `tradeban / без tradeban`.
- Показ float:
  - основне джерело — `asset_properties` (`propertyid=2`, `float_value`),
  - fallback — пошук float у текстових описах.
- Показ наліпок/брелоків (`sticker_info`, `charm_info`, `keychain_info`) без службових рядків.
- Оновлення цін:
  - `priceoverview` для швидкого `lowest_price`,
  - `itemordershistogram` для `highest_buy_order`/`lowest_sell_order` (через `item_nameid` з `cs2.json`).
- Масовий лістинг із затримкою `250ms` між POST-запитами `sellitem`.
- Обробка rate limit `429`: backoff на 3 хв, потім 10 хв.
- Локалізація UI: перемикач **UA / EN** прямо в інтерфейсі.

### Встановлення
1. Відкрийте `chrome://extensions`.
2. Увімкніть **Developer mode**.
3. Натисніть **Load unpacked**.
4. Виберіть папку `інвентар тест`.
5. Відкрийте сторінку розширення (popup/app) і Steam-вкладку з авторизованим акаунтом.

### Як працює технічно
Розширення працює автономно, без залежності від бекенда:
- мережеві запити виконуються з контексту активної Steam-вкладки через `chrome.scripting.executeScript`,
- використовуються поточні Steam cookies/session активного логіну,
- SteamID визначається в такому порядку:
  1. `window.g_steamID` / `window.g_steamid`,
  2. cookie `steamLoginSecure`,
  3. посилання профілю `/profiles/<steamid64>`.

Для продажу (`sellitem`) береться:
- `g_sessionID` або cookie `sessionid` із тієї ж Steam-вкладки.

### Куди відправляються запити
Розширення відправляє запити тільки на `https://steamcommunity.com`:

- Інвентар:
  - `GET /inventory/{steamId}/730/2?l=english&count=2000`
  - fallback-варіанти: `?count=2000`, далі без параметрів
- Швидка ціна:
  - `GET /market/priceoverview?appid=730&country=CZ&currency=<id>&market_hash_name=<name>`
- Market histogram:
  - `GET /market/itemordershistogram?country=CZ&language=english&currency=<id>&item_nameid=<id>`
- Продаж:
  - `POST /market/sellitem/`

### Які дані використовуються
- З інвентаря Steam API:
  - `assets` (assetid, amount),
  - `descriptions` (market_hash_name, owner_descriptions, descriptions),
  - `asset_properties` (float).
- З cookies Steam:
  - `steamCurrencyId` (визначення валюти),
  - `steamLoginSecure` (SteamID fallback),
  - `sessionid` (sellitem fallback).
- З локального файлу розширення:
  - `cs2.json` (мапа `market_hash_name -> item_nameid`).

### Логи і статуси
- Права панель: загальний статус дій.
- Live-панель: короткий стрім останніх подій.
- Logs: детальніші записи, включно з помилками та попередженнями.

---

## 🇬🇧 English

### What it is
`інвентар тест` is a standalone MV3 Chrome extension for CS2 Steam inventory workflows (`appid=730`, `contextid=2`).

It helps you:
- parse your inventory,
- separate tradable vs trade-banned items,
- check market buy/sell levels,
- list items (single or bulk) via Steam Market.

### Key features
- Steam inventory parsing (up to 2000 items per request).
- Group / ungroup mode by `market_hash_name`, split by `tradeban / no tradeban`.
- Float extraction:
  - primary source: `asset_properties` (`propertyid=2`, `float_value`),
  - fallback: float parsing from text descriptions.
- Sticker/charm extraction from `sticker_info`, `charm_info`, `keychain_info`.
- Price refresh:
  - `priceoverview` for quick `lowest_price`,
  - `itemordershistogram` for `highest_buy_order` and `lowest_sell_order` (via `item_nameid` from `cs2.json`).
- Bulk listing with `250ms` pause between `sellitem` requests.
- HTTP `429` backoff strategy: wait 3 min, then 10 min.
- Built-in UI localization switcher: **UA / EN**.

### Installation
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `інвентар тест` folder.
5. Open the extension app and keep a logged-in Steam tab available.

### How it works
The extension is backend-free and executes Steam requests in the active Steam tab context:
- requests are run through `chrome.scripting.executeScript`,
- current Steam cookies/session are reused,
- SteamID resolution order:
  1. `window.g_steamID` / `window.g_steamid`,
  2. `steamLoginSecure` cookie,
  3. `/profiles/<steamid64>` profile link fallback.

For listing (`sellitem`), session data is taken from:
- `g_sessionID` or `sessionid` cookie from the same Steam tab.

### Request destinations
All requests are sent to `https://steamcommunity.com` only:
- `GET /inventory/{steamId}/730/2?...`
- `GET /market/priceoverview?...`
- `GET /market/itemordershistogram?...`
- `POST /market/sellitem/`

### Data sources
- Steam inventory API response fields:
  - `assets`,
  - `descriptions`,
  - `asset_properties`.
- Steam cookies:
  - `steamCurrencyId`,
  - `steamLoginSecure`,
  - `sessionid`.
- Local extension file:
  - `cs2.json` (`market_hash_name -> item_nameid`).

### Logging
- Status badge: current action state.
- Live panel: short event stream.
- Logs panel: detailed info/warn/error entries.

## ROI FX module (new)

Added `roi-fx-module.js` as an optimized standalone module for ROI-related `itemordershistogram` multi-currency analysis.

### Quick usage in Steam tab console
```js
const result = await window.SteamSuiteRoiFxModule.runSteamRatesAnalyzer({
  itemNameId: 1,
  country: "UA",
  language: "ukrainian",
  maxConcurrency: 1
});

console.table(result.rows);
console.table(result.rateTable);
console.table(result.comparisonTable);

// or via ROI module bridge:
const same = await window.SteamSuiteRoiModule.runFxRatesAnalyzer({ itemNameId: 1 });
```

### Improvements vs single-loop script
- Concurrency control (`maxConcurrency`) to reduce total runtime.
- Built-in retry/backoff for `429` responses.
- Safer parsing for `price_scale`, `lowest_sell_order`, `highest_buy_order`.
- Returns structured tables (`rows`, `rateTable`, `comparisonTable`) for reuse in UI.


### Модуль “Курс”
- У sidebar додано третій модуль **Курс** (поряд з Inventory і ROI).
- Модуль викликає `window.SteamSuiteRoiFxModule.runSteamRatesAnalyzer(...)` і показує 2 таблиці: Steam rates та Local→USD.
- Доступний запуск через кнопку `Запустити курс` з параметрами `item_nameid`, `country`, `language`, `maxConcurrency`.

- Підзаголовок модуля “Курс валют (Steam)” доповнено: «розрахунок різниці купівлі турнірних капсул з магазину кс2, доллар як 0».
