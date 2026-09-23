/* ==========================================================================
   NOIRÉ — animation system
   Smooth scroll (Lenis) + all GSAP/ScrollTrigger orchestration. One
   registered plugin, one Lenis instance, reusable helpers — not hundreds of
   independent tweens.
   ========================================================================== */
window.NOIRE = window.NOIRE || {};

NOIRE.anim = (function () {
  const { qs, qsa, prefersReducedMotion } = NOIRE.utils;
  const reduced = prefersReducedMotion();
  let lenis = null;

  gsap.registerPlugin(ScrollTrigger);

  // shared easing/duration family — used by the hero entrance AND every
  // scroll reveal below, so the whole site reads as one motion language
  const REVEAL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const REVEAL_Y = 48;

  // Establish every entrance-hidden state through GSAP itself (see
  // animations.css note above the .split-line__inner rule — a CSS-authored
  // starting transform desyncs from a GSAP tween meant to animate it back)
  // BEFORE the preloader finishes, so nothing flashes into view unstyled.
  const HERO_ENTRANCE_TARGETS = '.site-nav__mark, .hero__meta[data-reveal], .hero__cta[data-reveal], .hero__scrollcue[data-reveal]';
  if (!reduced) {
    gsap.set('.split-line__inner', { yPercent: 110 });
    gsap.set(HERO_ENTRANCE_TARGETS, { autoAlpha: 0, y: REVEAL_Y });
    gsap.set('#heroImg', { autoAlpha: 0, scale: 1.06 });
  }

  /* ---------------------------------------------------------------- */
  /* smooth scroll                                                     */
  /* ---------------------------------------------------------------- */
  function initLenis() {
    if (reduced) return;
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function lockScroll(shouldLock) {
    document.documentElement.classList.toggle('scroll-locked', shouldLock);
    if (lenis) {
      if (shouldLock) lenis.stop(); else lenis.start();
    } else {
      document.body.style.overflow = shouldLock ? 'hidden' : '';
    }
  }

  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: 0 });
    else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------------------------------------------------------------- */
  /* custom cursor                                                     */
  /* ---------------------------------------------------------------- */
  function initCursor() {
    const cursor = qs('#cursor');
    const label = qs('#cursorLabel');
    if (!cursor) return;
    if (window.matchMedia('(hover: none)').matches) { document.body.classList.add('no-custom-cursor'); return; }

    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

    window.addEventListener('mousemove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      armIdleWatchdog();
    });

    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));

    const STATES = ['is-view', 'is-link', 'is-enter', 'is-drag'];
    function setState(state, text) {
      STATES.forEach((s) => cursor.classList.remove(s));
      if (state) cursor.classList.add(state);
      label.textContent = text || '';
    }

    // Failsafe: the badge state (VIEW/LINK/ENTER) is only ever correct for
    // whatever element was under the pointer at the last mousemove. Scrolling
    // moves the page under a stationary pointer without firing mousemove, so
    // without this the badge can go stale — stuck "VIEW" over content that
    // scrolled into a completely different element underneath it. Reset on
    // every scroll and let the next real mousemove re-evaluate it.
    let scrollResetRAF = null;
    window.addEventListener('scroll', () => {
      setState(null);
      if (scrollResetRAF) return;
      scrollResetRAF = requestAnimationFrame(() => { scrollResetRAF = null; });
    }, { passive: true });

    // Failsafe: if the pointer goes idle for a while with no movement, drop
    // any hover state so the badge never lingers frozen on screen.
    let idleTimer = null;
    function armIdleWatchdog() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setState(null), 2200);
    }
    armIdleWatchdog();

    document.addEventListener('mouseover', (e) => {
      const viewEl = e.target.closest('[data-cursor="view"], .journal-card, .store-card, .material-tile, .lookbook__stage img');
      const enterEl = e.target.closest('[data-cursor="enter"]');
      const linkEl = e.target.closest('[data-cursor="link"], a, button');
      if (viewEl) setState('is-view', 'View');
      else if (enterEl) setState('is-enter', 'Enter');
      else if (linkEl) setState('is-link');
      else setState(null);
    });
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget || !(e.relatedTarget instanceof Element)) return;
      if (!e.relatedTarget.closest('[data-cursor], a, button, .journal-card, .store-card, .material-tile')) setState(null);
    });
  }

  function pulseBagIcon() {
    const el = qs('#bagCount');
    if (!el) return;
    gsap.fromTo(el, { scale: 1 }, { scale: 1.5, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });
  }

  /* ---------------------------------------------------------------- */
  /* nav                                                                */
  /* ---------------------------------------------------------------- */
  function initNav() {
    const nav = qs('#siteNav');
    if (!nav) return;
    let lastY = 0;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        nav.classList.toggle('is-scrolled', self.scroll() > 20);
        const goingDown = self.direction === 1;
        // near the top the nav always stays put; direction-based hide/show
        // only kicks in once scrolled far enough that the hero is behind us
        nav.style.transform = self.scroll() > 200 && goingDown ? 'translateY(-100%)' : 'translateY(0)';
      },
    });
  }

  /* ---------------------------------------------------------------- */
  /* text mask reveal (line-by-line)                                   */
  /* ---------------------------------------------------------------- */
  function initMaskReveals() {
    qsa('.split-line__inner').forEach((el, i) => {
      const parent = el.closest('section, .lookbook__stage');
      const isHero = el.closest('.hero');
      if (isHero) return; // handled by the entrance timeline
      gsap.to(el, {
        yPercent: 0,
        duration: 1.1,
        ease: REVEAL_EASE,
        overwrite: 'auto', // defensive: guarantees a clean final state even
        // if a resize/refresh ever re-evaluates this trigger mid-flight
        scrollTrigger: { trigger: parent || el, start: 'top 78%', once: true },
        delay: i % 6 * 0.06,
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* generic fade-up reveals                                           */
  /* ---------------------------------------------------------------- */
  function initFadeReveals() {
    // covers every data-reveal element sitewide: section kickers, headlines,
    // paragraphs, and (via the data-reveal added in HTML/products.js)
    // collection rows, product/journal cards, material swatches, footer
    // columns — one system, one easing family, reveals once and never
    // re-hides on scroll back up.
    const els = qsa('[data-reveal]');
    if (reduced) { els.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; }); return; }
    ScrollTrigger.batch(els, {
      start: 'top 88%',
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: REVEAL_EASE, stagger: 0.08, overwrite: 'auto' }),
      once: true,
    });
  }

  /* ---------------------------------------------------------------- */
  /* parallax layers (data-speed)                                      */
  /* ---------------------------------------------------------------- */
  function initParallax() {
    if (reduced) return;
    qsa('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 1;
      const distance = (speed - 1) * 260;
      gsap.fromTo(el, { yPercent: -distance / 4 }, {
        yPercent: distance / 4,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* hero entrance — one staggered slide-up sequence, ~100ms apart:     */
  /* nav bar, logo, kicker, FORM, IN MOTION, hero image, CTA, scroll cue */
  /* ---------------------------------------------------------------- */
  function heroEntrance() {
    const STEP = 0.1;
    const tl = gsap.timeline({ delay: 0.1 });
    let t = 0;
    tl.to('#siteNav', { y: 0, duration: 0.8, ease: 'power3.out' }, t);
    t += STEP;
    tl.to('.site-nav__mark', { autoAlpha: 1, y: 0, duration: 0.7, ease: REVEAL_EASE }, t);
    t += STEP;
    tl.to('.hero__meta[data-reveal]', { autoAlpha: 1, y: 0, duration: 0.7, ease: REVEAL_EASE }, t);
    t += STEP;
    tl.to('#heroLine1', { yPercent: 0, duration: 0.9, ease: REVEAL_EASE }, t);
    t += STEP;
    tl.to('#heroLine2', { yPercent: 0, duration: 0.9, ease: REVEAL_EASE }, t);
    t += STEP;
    tl.to('#heroImg', { scale: 1, autoAlpha: 1, duration: 1.3, ease: 'power2.out' }, t);
    t += STEP;
    tl.to('.hero__cta[data-reveal]', { autoAlpha: 1, y: 0, duration: 0.7, ease: REVEAL_EASE }, t);
    t += STEP;
    tl.to('.hero__scrollcue[data-reveal]', { autoAlpha: 1, y: 0, duration: 0.7, ease: REVEAL_EASE }, t);
    return tl;
  }

  /* ---------------------------------------------------------------- */
  /* hero mouse parallax (subtle)                                      */
  /* ---------------------------------------------------------------- */
  function initHeroMouse() {
    if (reduced) return;
    const hero = qs('#hero');
    const img = qs('#heroImg');
    if (!hero || !img) return;
    const moveX = gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power3' });
    const moveY = gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power3' });
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      moveX(px * 26);
      moveY(py * 18);
    });
    hero.addEventListener('mouseleave', () => { moveX(0); moveY(0); });
  }

  /* ---------------------------------------------------------------- */
  /* product row cursor-follow frame                                   */
  /* ---------------------------------------------------------------- */
  function initProductRows() {
    qsa('.product-row').forEach((row) => {
      const frame = qs('.product-row__frame', row);
      if (!frame || reduced) return;
      row.addEventListener('mousemove', (e) => {
        const r = row.getBoundingClientRect();
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(frame, { yPercent: -50 + py * 22, duration: 0.5, ease: 'power3.out' });
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* lookbook — pinned moment + click/keyboard driven slides            */
  /* ---------------------------------------------------------------- */
  function initLookbook() {
    const stage = qs('#lookbookStage');
    const slides = qsa('.lookbook__slide', stage);
    const indexBtns = qsa('#lookbookIndex button');
    const label = qs('#lookbookLabel');
    const garment = qs('#lookbookGarment');
    const current = qs('#lookbookCurrent');
    const total = slides.length;
    const garments = ['Noiré Coat — Wool / Silk', 'Structured Jacket — Wool Gabardine', 'Slip Dress — Silk Charmeuse', 'Double-Breasted Blazer — Wool / Cashmere'];
    let idx = 0;

    function go(next) {
      idx = (next + total) % total;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      indexBtns.forEach((b, i) => b.classList.toggle('is-active', i === idx));
      label.textContent = `Look ${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      garment.textContent = garments[idx];
      current.textContent = String(idx + 1).padStart(2, '0');
    }

    qs('#lookbookNext').addEventListener('click', () => go(idx + 1));
    qs('#lookbookPrev').addEventListener('click', () => go(idx - 1));
    indexBtns.forEach((b, i) => b.addEventListener('click', () => go(i)));
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(idx + 1);
      if (e.key === 'ArrowLeft') go(idx - 1);
    });

    // pinned moment: the stage holds its position through a scroll dwell,
    // giving the visitor room to click through looks without the page racing on.
    if (!reduced) {
      ScrollTrigger.create({
        trigger: stage,
        start: 'top top+=92',
        end: '+=120%',
        pin: true,
        pinSpacing: true,
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* film overlay — editorial image-sequence "player"                  */
  /* ---------------------------------------------------------------- */
  function initFilm() {
    const openBtn = qs('#playFilm');
    const overlay = qs('#filmOverlay');
    const frame = qs('#filmFrame');
    const progressWrap = qs('#filmProgress');
    const caption = qs('#filmCaption');
    const closeBtn = qs('#filmClose');
    if (!openBtn || !overlay) return;

    const sequence = [
      { src: 'assets/images/photos/photo-04-film-crew.jpg', label: 'Sequence 01 — Entrance' },
      { src: 'assets/images/photos/photo-09-fur-coat.jpg', label: 'Sequence 02 — Silhouette' },
      { src: 'assets/images/photos/photo-08-blazer-flowers.jpg', label: 'Sequence 03 — Movement' },
      { src: 'assets/images/photos/photo-06-suit-couple.jpg', label: 'Sequence 04 — Close' },
    ];
    let i = 0;
    let timer = null;

    frame.innerHTML = sequence.map((s, n) => `<div class="film-overlay__slide${n === 0 ? ' is-active' : ''}"><img src="${s.src}" alt="${s.label}"></div>`).join('');
    progressWrap.innerHTML = sequence.map(() => '<span></span>').join('');
    const slideEls = qsa('.film-overlay__slide', frame);
    const barEls = qsa('span', progressWrap);

    function show(n) {
      i = n % sequence.length;
      slideEls.forEach((el, idx) => el.classList.toggle('is-active', idx === i));
      barEls.forEach((el, idx) => {
        el.classList.toggle('is-done', idx < i);
        el.classList.toggle('is-active', idx === i);
      });
      caption.textContent = sequence[i].label;
      clearTimeout(timer);
      timer = setTimeout(() => show(i + 1), 3400);
    }

    function open() {
      overlay.classList.add('is-open');
      lockScroll(true);
      show(0);
      closeBtn.focus();
    }
    function close() {
      overlay.classList.remove('is-open');
      clearTimeout(timer);
      lockScroll(false);
      openBtn.focus();
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    frame.addEventListener('click', () => show(i + 1));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  }

  /* ---------------------------------------------------------------- */
  /* loader — 5s hold with a real 0→100 progress readout, body scroll  */
  /* locked throughout so nothing can be scrolled mid-load              */
  /* ---------------------------------------------------------------- */
  function runLoader(done) {
    const loader = qs('#loader');
    if (!loader) { done(); return; }
    lockScroll(true);

    function finish() {
      lockScroll(false);
      loader.remove();
      done();
    }

    if (reduced) { finish(); return; }

    const fill = qs('#loaderFill');
    const percent = qs('#loaderPercent');
    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl.fromTo('.loader__mark', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0)
      .to(counter, {
        v: 100,
        duration: 4.2,
        ease: 'power1.inOut',
        onUpdate: () => {
          const n = Math.round(counter.v);
          if (fill) fill.style.width = n + '%';
          if (percent) percent.textContent = n + '%';
        },
      }, 0.3)
      .to(loader, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, '+=0.2');
    // total: 0.3s mark-in + 4.2s count + a beat + 0.6s fade ≈ 5s
  }

  /* ---------------------------------------------------------------- */
  function init() {
    initLenis();
    initCursor();
    initNav();
    initMaskReveals();
    initFadeReveals();
    initParallax();
    initHeroMouse();
    initProductRows();
    initLookbook();
    initFilm();
    runLoader(() => {
      heroEntrance();
      ScrollTrigger.refresh();
    });
  }

  return { init, lockScroll, scrollTo, pulseBagIcon };
})();
