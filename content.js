(() => {
  const SELECTOR = '.css-1wgtcp0-LSMatchScoreAndRedCardsContainer';
  const PROCESSED_FLAG = 'data-frosted-added';

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    .frosted-overlay {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: auto;
      background: rgba(255,255,255,0.18);
      -webkit-backdrop-filter: blur(6px);
      backdrop-filter: blur(6px);
      transition: opacity 200ms ease, transform 200ms ease;
      opacity: 1;
      border-radius: inherit;
      z-index: 2147483646;
    }
    .frosted-overlay.fading-out {
      opacity: 0;
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);

  function addFrostedEffect(el) {
    if (!el || el.hasAttribute(PROCESSED_FLAG)) return;
    el.setAttribute(PROCESSED_FLAG, 'true');

    const style = getComputedStyle(el);
    if (style.position === 'static') {
      el.style.position = 'relative';
    }

    const overlay = document.createElement('div');
    overlay.className = 'frosted-overlay';

    overlay.addEventListener('click', () => {
      overlay.classList.add('fading-out');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    });

    el.appendChild(overlay);
  }

  function scanAndApply(root = document) {
    root.querySelectorAll(SELECTOR).forEach(addFrostedEffect);
  }

  // Initial scan
  scanAndApply();

  // Observe the entire document for changes (lazy loaded)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches && node.matches(SELECTOR)) {
            addFrostedEffect(node);
          }
          if (node.querySelectorAll) scanAndApply(node);
        }
      } else if (m.type === 'attributes' && m.target.matches(SELECTOR)) {
        addFrostedEffect(m.target);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
})();

