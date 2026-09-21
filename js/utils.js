/* ==========================================================================
   NOIRÉ — utils
   Small shared helpers. Everything lives under window.NOIRE to keep the
   global namespace clean and the module load order explicit.
   ========================================================================== */
window.NOIRE = window.NOIRE || {};

NOIRE.utils = (function () {
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  function debounce(fn, wait = 150) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function formatPrice(n) {
    return '$' + n.toLocaleString('en-US');
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function trapFocus(container) {
    const focusable = qsa('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', container);
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  }

  return { qs, qsa, clamp, lerp, debounce, formatPrice, prefersReducedMotion, trapFocus };
})();
