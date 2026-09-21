/* ==========================================================================
   NOIRÉ — bootstrap
   ========================================================================== */
(function () {
  const { qs, qsa } = NOIRE.utils;

  function initNewsletter() {
    const form = qs('#newsletterForm');
    if (!form) return;
    const msg = qs('#newsletterMsg');
    const input = qs('#newsletterEmail');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!valid) {
        msg.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }
      msg.textContent = `Thank you — ${value} has been added to the list.`;
      form.reset();
    });
  }

  function initAnchorScroll() {
    qsa('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = qs(id);
        if (!target) return;
        e.preventDefault();
        NOIRE.anim.scrollTo(target);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    NOIRE.products.init();
    NOIRE.cart.init();
    NOIRE.anim.init();
    initNewsletter();
    initAnchorScroll();
  });
})();
