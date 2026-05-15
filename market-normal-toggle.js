(() => {
  const QUALITY_PARAM = 'category_730_Quality';
  const NORMAL_TAG = 'tag_normal';
  const TOGGLE_ID = 'sisa-normal-toggle';

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

  function mountButton() {
    if (!isMarketListingPage()) {
      return;
    }

    if (document.getElementById(TOGGLE_ID)) {
      return;
    }

    document.body.appendChild(createButton());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountButton, { once: true });
  } else {
    mountButton();
  }
})();
