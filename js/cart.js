/* ==========================================================================
   NOIRÉ — shopping bag + product overlay
   Frontend-only cart, persisted to localStorage. No payment backend by
   design — checkout resolves to a confirmation state, never a fake charge.
   ========================================================================== */
window.NOIRE = window.NOIRE || {};

NOIRE.cart = (function () {
  const { qs, qsa, formatPrice, trapFocus } = NOIRE.utils;
  const STORAGE_KEY = 'noire_bag_v1';

  let items = []; // [{ id, size, qty }]
  let releaseFocusTrap = null;
  let releaseProductFocusTrap = null;
  let lastFocused = null;

  // ---- persistence ------------------------------------------------------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      items = raw ? JSON.parse(raw) : [];
    } catch (e) {
      items = [];
    }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable — cart still works in-memory */ }
  }

  // ---- mutations ----------------------------------------------------------
  function add(id, size, qty = 1) {
    const existing = items.find((i) => i.id === id && i.size === size);
    if (existing) existing.qty += qty;
    else items.push({ id, size, qty });
    persist();
    render();
  }
  function updateQty(id, size, qty) {
    const item = items.find((i) => i.id === id && i.size === size);
    if (!item) return;
    item.qty = qty;
    if (item.qty <= 0) items = items.filter((i) => !(i.id === id && i.size === size));
    persist();
    render();
  }
  function remove(id, size) {
    items = items.filter((i) => !(i.id === id && i.size === size));
    persist();
    render();
  }

  function subtotal() {
    return items.reduce((sum, i) => {
      const p = NOIRE.products.getById(i.id);
      return sum + (p ? p.price * i.qty : 0);
    }, 0);
  }
  function count() {
    return items.reduce((sum, i) => sum + i.qty, 0);
  }

  // ---- drawer render --------------------------------------------------
  function render() {
    const body = qs('#cartBody');
    const bagCount = qs('#bagCount');
    const subtotalEl = qs('#cartSubtotal');
    const checkoutBtn = qs('#checkoutBtn');
    if (bagCount) bagCount.textContent = count();
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal());
    if (checkoutBtn) checkoutBtn.disabled = items.length === 0;

    if (!body) return;
    if (!items.length) {
      body.innerHTML = '<p class="cart-drawer__empty">Your bag is empty.</p>';
      return;
    }
    body.innerHTML = items.map((i) => {
      const p = NOIRE.products.getById(i.id);
      if (!p) return '';
      return `
      <div class="cart-item" data-id="${i.id}" data-size="${i.size}">
        <div class="cart-item__media"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
        <div>
          <h3 class="cart-item__name">${p.name}</h3>
          <p class="cart-item__meta">Size ${i.size} · ${p.material}</p>
          <div class="cart-item__row">
            <div class="cart-item__qty">
              <button type="button" data-qty="dec" aria-label="Decrease quantity">−</button>
              <span>${i.qty}</span>
              <button type="button" data-qty="inc" aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-item__price font-display">${formatPrice(p.price * i.qty)}</span>
          </div>
          <button type="button" class="cart-item__remove" data-remove>Remove</button>
        </div>
      </div>`;
    }).join('');
  }

  function bindDrawerEvents() {
    const body = qs('#cartBody');
    if (!body) return;
    body.addEventListener('click', (e) => {
      const row = e.target.closest('.cart-item');
      if (!row) return;
      const { id, size } = row.dataset;
      if (e.target.closest('[data-qty="inc"]')) {
        const item = items.find((i) => i.id === id && i.size === size);
        updateQty(id, size, item.qty + 1);
      } else if (e.target.closest('[data-qty="dec"]')) {
        const item = items.find((i) => i.id === id && i.size === size);
        updateQty(id, size, item.qty - 1);
      } else if (e.target.closest('[data-remove]')) {
        remove(id, size);
      }
    });
  }

  // ---- drawer open/close ------------------------------------------------
  function openDrawer() {
    lastFocused = document.activeElement;
    qs('#cartDrawer').classList.add('is-open');
    qs('#backdrop').classList.add('is-open');
    qs('#cartDrawer').setAttribute('aria-hidden', 'false');
    releaseFocusTrap = trapFocus(qs('#cartDrawer'));
    document.body.classList.add('scroll-lock');
    NOIRE.anim && NOIRE.anim.lockScroll && NOIRE.anim.lockScroll(true);
    const closeBtn = qs('#cartClose');
    if (closeBtn) closeBtn.focus();
  }
  function closeDrawer() {
    qs('#cartDrawer').classList.remove('is-open');
    qs('#backdrop').classList.remove('is-open');
    if (releaseFocusTrap) releaseFocusTrap();
    NOIRE.anim && NOIRE.anim.lockScroll && NOIRE.anim.lockScroll(false);
    if (lastFocused) lastFocused.focus();
  }

  // ---- checkout (frontend-only, no payment) ------------------------------
  function checkout() {
    const status = qs('#cartStatus');
    if (!items.length || !status) return;
    status.textContent = 'Checkout integration ready.';
    const btn = qs('#checkoutBtn');
    btn.disabled = true;
    setTimeout(() => { btn.disabled = items.length === 0; }, 1800);
  }

  // ---- product overlay ----------------------------------------------------
  let selectedSize = null;
  let currentProductId = null;

  function renderOverlay(id) {
    const p = NOIRE.products.getById(id);
    if (!p) return;
    currentProductId = id;
    selectedSize = null;
    const target = qs('#productOverlayContent');
    target.innerHTML = `
      <div class="product-overlay__media reveal-media">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-overlay__info">
        <span class="eyebrow product-overlay__eyebrow">Look ${p.index} — ${p.category}</span>
        <h2 class="product-overlay__name">${p.name}</h2>
        <p class="product-overlay__price font-display">${formatPrice(p.price)}</p>
        <p class="product-overlay__desc">${p.description}</p>
        <div class="product-overlay__block">
          <h4>Material</h4>
          <p class="product-overlay__material">${p.material}</p>
        </div>
        <div class="product-overlay__block">
          <h4>Size</h4>
          <div class="size-grid" id="sizeGrid" role="group" aria-label="Select size">
            ${p.sizes.map((s) => `<button type="button" data-size="${s}">${s}</button>`).join('')}
          </div>
        </div>
        <div class="product-overlay__actions">
          <button class="btn-solid product-overlay__addbag" id="addBagBtn" disabled>Select a size</button>
          <p class="product-overlay__hint" id="addBagHint"></p>
        </div>
      </div>
    `;

    qsa('[data-size]', target).forEach((btn) => {
      btn.addEventListener('click', () => {
        qsa('[data-size]', target).forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selectedSize = btn.dataset.size;
        const addBtn = qs('#addBagBtn');
        addBtn.disabled = false;
        addBtn.textContent = 'Add to Bag →';
      });
    });

    qs('#addBagBtn').addEventListener('click', () => {
      if (!selectedSize) return;
      add(currentProductId, selectedSize, 1);
      const hint = qs('#addBagHint');
      hint.textContent = `Added — Size ${selectedSize}.`;
      NOIRE.anim && NOIRE.anim.pulseBagIcon && NOIRE.anim.pulseBagIcon();
      setTimeout(() => { if (hint) hint.textContent = ''; }, 2600);
    });
  }

  function openOverlay(id) {
    lastFocused = document.activeElement;
    renderOverlay(id);
    const overlay = qs('#productOverlay');
    overlay.classList.add('is-open');
    overlay.scrollTop = 0;
    releaseProductFocusTrap = trapFocus(overlay);
    NOIRE.anim && NOIRE.anim.lockScroll && NOIRE.anim.lockScroll(true);
    qs('#productClose').focus();
  }
  function closeOverlay() {
    qs('#productOverlay').classList.remove('is-open');
    if (releaseProductFocusTrap) releaseProductFocusTrap();
    NOIRE.anim && NOIRE.anim.lockScroll && NOIRE.anim.lockScroll(false);
    if (lastFocused) lastFocused.focus();
  }

  function init() {
    load();
    render();
    bindDrawerEvents();

    qs('#bagToggle').addEventListener('click', openDrawer);
    qs('#cartClose').addEventListener('click', closeDrawer);
    qs('#backdrop').addEventListener('click', () => {
      closeDrawer();
      closeOverlay();
    });
    qs('#checkoutBtn').addEventListener('click', checkout);
    qs('#productClose').addEventListener('click', closeOverlay);

    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-open-product]');
      if (opener) {
        e.preventDefault();
        openOverlay(opener.dataset.openProduct);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (qs('#productOverlay').classList.contains('is-open')) closeOverlay();
      else if (qs('#cartDrawer').classList.contains('is-open')) closeDrawer();
    });
  }

  return { init, add, openOverlay, closeOverlay, openDrawer, closeDrawer, count, subtotal };
})();
