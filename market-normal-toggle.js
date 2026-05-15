(() => {
  const QUALITY_PARAM = 'category_730_Quality';
  const NORMAL_TAG = 'tag_normal';
  const TOGGLE_ID = 'sisa-normal-toggle';
  const FLOAT_INFO_ID = 'sisa-float-info';
  const SKINS_DATA_URL = chrome.runtime.getURL('skins_compact.json');
  const NAV_EVENT = 'sisa:navigation-change';
  const FLOAT_RECALC_DEBOUNCE_MS = 180;
  const LISTING_TOKEN_POLL_MS = 500;

  let skinsCache = null;
  let renderTimer = null;
  let lastRenderedToken = '';

  function isMarketListingPage() {
    return location.hostname === 'steamcommunity.com' && location.pathname.includes('/market/listings/730/');
  }

  function buildNormalUrl() {
    const url = new URL(location.href);
    url.searchParams.set(QUALITY_PARAM, NORMAL_TAG);
    return url.toString();
  }

  function createButton() {
    const button = document.createElement('button');
    button.id = TOGGLE_ID;
    button.type = 'button';
    button.textContent = 'Перехід на normal';

    Object.assign(button.style, {
      position: 'fixed',
      top: '12px',
      left: '12px',
      zIndex: '999999',
      padding: '8px 12px',
      border: '1px solid #66c0f4',
      borderRadius: '6px',
      background: '#1b2838',
      color: '#c7d5e0',
      fontSize: '13px',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)'
    });

    button.addEventListener('mouseenter', () => {
      button.style.background = '#2a475e';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#1b2838';
    });

    button.addEventListener('click', () => {
      location.href = buildNormalUrl();
    });

    return button;
  }

  function createFloatInfoNode() {
    const info = document.createElement('div');
    info.id = FLOAT_INFO_ID;
    info.textContent = 'Float: завантаження...';

    Object.assign(info.style, {
      position: 'fixed',
      top: '52px',
      left: '12px',
      zIndex: '999999',
      padding: '8px 12px',
      border: '1px solid #3f5a6b',
      borderRadius: '6px',
      background: '#101822',
      color: '#c7d5e0',
      fontSize: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)'
    });

    return info;
  }

  function getNameFromPath() {
    const marker = '/market/listings/730/';
    const start = location.pathname.indexOf(marker);
    if (start === -1) return '';
    const encodedName = location.pathname.slice(start + marker.length);
    return decodeURIComponent(encodedName || '').trim();
  }

  function getListingTokenFromPath() {
    const marker = '/market/listings/730/';
    const start = location.pathname.indexOf(marker);
    if (start === -1) return '';
    return decodeURIComponent(location.pathname.slice(start + marker.length) || '').trim();
  }


  function normalizeListingToken(value) {
    return String(value || '').trim();
  }

  function getCurrentListingToken() {
    return normalizeListingToken(getListingTokenFromPath());
  }

  function getNameFromLink() {
    const listingLink = document.querySelector('a[href*="/market/listings/730/"]');
    return listingLink?.textContent?.trim() || '';
  }

  function resolveItemName() {
    return getNameFromPath() || getNameFromLink() || '';
  }

  async function loadFloatRange({ marketHashName, listingToken }) {
    if (!marketHashName && !listingToken) return null;

    if (!Array.isArray(skinsCache)) {
      const response = await fetch(SKINS_DATA_URL);
      if (!response.ok) {
        throw new Error(`skins-compact-json-http-${response.status}`);
      }
      skinsCache = await response.json();
    }
    const skins = skinsCache;
    const normalizedToken = String(listingToken || '').trim();
    const normalizedName = String(marketHashName || '').trim();

    let skin = null;
    if (normalizedToken) {
      skin = skins.find((item) => String(item?.gid || '').trim() === normalizedToken);
    }

    if (!skin && normalizedName) {
      skin = skins.find((item) => String(item?.name || '').trim() === normalizedName);
    }

    if (!skin) return null;

    const minFloat = Number(skin.min_float);
    const maxFloat = Number(skin.max_float);
    if (!Number.isFinite(minFloat) || !Number.isFinite(maxFloat)) {
      return null;
    }

    return { minFloat, maxFloat };
  }

  function scheduleFloatRender() {
    if (renderTimer) {
      clearTimeout(renderTimer);
    }
    renderTimer = setTimeout(() => {
      renderTimer = null;
      renderFloatRange();
    }, FLOAT_RECALC_DEBOUNCE_MS);
  }

  function installNavigationObserver() {
    const onListingMaybeChanged = () => {
      if (!isMarketListingPage()) {
        return;
      }

      const listingToken = getCurrentListingToken();
      if (!listingToken || listingToken === lastRenderedToken) {
        return;
      }

      lastRenderedToken = listingToken;
      scheduleFloatRender();
    };

    const originalPushState = history.pushState;
    history.pushState = function patchedPushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event(NAV_EVENT));
      return result;
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event(NAV_EVENT));
      return result;
    };

    window.addEventListener('popstate', onListingMaybeChanged);
    window.addEventListener(NAV_EVENT, onListingMaybeChanged);

    const listingNameNode = document.getElementById('largeiteminfo_item_name');
    if (listingNameNode) {
      const observer = new MutationObserver(onListingMaybeChanged);
      observer.observe(listingNameNode, { childList: true, subtree: true, characterData: true });
    }

    setInterval(onListingMaybeChanged, LISTING_TOKEN_POLL_MS);
    onListingMaybeChanged();
  }


  async function renderFloatRange() {
    const infoNode = document.getElementById(FLOAT_INFO_ID);
    if (!infoNode) return;

    try {
      const itemName = resolveItemName();
      const listingToken = getListingTokenFromPath();
      if (!itemName && !listingToken) {
        infoNode.textContent = 'Float: назву предмета не знайдено';
        return;
      }

      const range = await loadFloatRange({ marketHashName: itemName, listingToken });
      if (!range) {
        const label = itemName || listingToken;
        infoNode.textContent = `Float: для "${label}" немає даних`;
        return;
      }

      infoNode.textContent = `Float: min ${range.minFloat.toFixed(2)} / max ${range.maxFloat.toFixed(2)}`;
    } catch (error) {
      infoNode.textContent = 'Float: помилка завантаження';
      console.error('[SISA] float range error', error);
    }
  }

  function mountButton() {
    if (!isMarketListingPage()) {
      return;
    }

    if (document.getElementById(TOGGLE_ID)) {
      return;
    }

    document.body.appendChild(createButton());
    document.body.appendChild(createFloatInfoNode());
    installNavigationObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountButton, { once: true });
  } else {
    mountButton();
  }
})();
