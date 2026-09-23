/* ==========================================================================
   NOIRÉ — product data + collection / storefront rendering
   ========================================================================== */
window.NOIRE = window.NOIRE || {};

NOIRE.products = (function () {
  const { formatPrice, qs } = NOIRE.utils;

  const DATA = [
    {
      id: 'noire-coat',
      index: '01',
      name: 'Noiré Coat',
      category: 'Outerwear',
      material: 'Wool / Silk',
      price: 1850,
      description: 'A single-breasted coat cut from double-faced wool, finished with a silk lining and hand-set shoulder line. Structured without excess.',
      image: 'assets/images/photos/photo-09-fur-coat.jpg',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    },
    {
      id: 'structured-jacket',
      index: '02',
      name: 'Structured Jacket',
      category: 'Outerwear',
      material: 'Wool Gabardine',
      price: 1240,
      description: 'A boxed jacket with a squared shoulder and concealed closure, built for architectural volume rather than fit.',
      image: 'assets/images/photos/photo-08-blazer-flowers.jpg',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    },
    {
      id: 'tailored-trouser',
      index: '03',
      name: 'Tailored Trouser',
      category: 'Tailoring',
      material: 'Wool / Mohair',
      price: 680,
      description: 'A high-rise, straight-leg trouser in a wool-mohair blend with a permanent center crease and clean waistband.',
      image: 'assets/images/photos/photo-11-cream-trouser.jpg',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    },
    {
      id: 'slip-dress',
      index: '04',
      name: 'Slip Dress',
      category: 'Dresses',
      material: 'Silk Charmeuse',
      price: 1120,
      description: 'A bias-cut slip dress in liquid silk charmeuse, falling from a single seam at the shoulder.',
      image: 'assets/images/photos/photo-07-silk-dress.jpg',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    },
    {
      id: 'db-blazer',
      index: '05',
      name: 'Double-Breasted Blazer',
      category: 'Tailoring',
      material: 'Wool / Cashmere',
      price: 1560,
      description: 'A double-breasted blazer in a wool-cashmere blend, with a longline body and peaked lapel drawn from menswear tailoring.',
      image: 'assets/images/photos/photo-06-suit-couple.jpg',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    },
    {
      id: 'pleated-skirt',
      index: '06',
      name: 'Pleated Midi Skirt',
      category: 'Skirts',
      material: 'Wool Crêpe',
      price: 790,
      description: 'A knife-pleated midi skirt in fluid wool crêpe, engineered to hold its line in motion.',
      image: 'assets/images/photos/photo-10-pleated-skirt.jpg',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    },
  ];

  function getById(id) {
    return DATA.find((p) => p.id === id);
  }

  function renderCollectionRows(container) {
    if (!container) return;
    container.innerHTML = DATA.map((p) => `
      <div class="product-row" data-product-id="${p.id}">
        <button class="product-row__btn" data-open-product="${p.id}" aria-label="View ${p.name}"></button>
        <span class="product-row__index font-display">${p.index}</span>
        <h3 class="product-row__name" data-cursor="view">${p.name}</h3>
        <div class="product-row__info">
          <span class="product-row__material">${p.material}</span>
          <span class="product-row__price font-display">${formatPrice(p.price)}</span>
          <span class="product-row__view">View →</span>
        </div>
        <div class="product-row__frame">
          <img src="${p.image}" alt="" loading="lazy">
        </div>
      </div>
    `).join('');
  }

  function renderStorefrontRail(container) {
    if (!container) return;
    container.innerHTML = DATA.map((p) => `
      <a href="#" class="store-card" data-open-product="${p.id}" data-cursor="view">
        <div class="store-card__media">
          <span class="store-card__tag">${p.category}</span>
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>
        <div class="store-card__info">
          <div>
            <h3 class="store-card__name">${p.name}</h3>
            <span class="store-card__cat">${p.material}</span>
          </div>
          <span class="store-card__price font-display">${formatPrice(p.price)}</span>
        </div>
        <span class="store-card__view">View Product →</span>
      </a>
    `).join('');
  }

  function init() {
    renderCollectionRows(qs('#collectionList'));
    renderStorefrontRail(qs('#storefrontRail'));
  }

  return { DATA, getById, init };
})();
