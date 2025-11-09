// content.js
(() => {
  const SELECTOR = '.css-1wgtcp0-LSMatchScoreAndRedCardsContainer';
  const PROCESSED_FLAG = 'data-frosted-added';

  // Insert minimal CSS for overlay animations (so we don't create separate css file)
  const style = document.createElement('style');
  style.textContent = `
    .frosted-overlay {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: auto;
      background: rgba(255,255,255,0.18); /* 半透明底色，搭配 backdrop-filter */
      -webkit-backdrop-filter: blur(6px);
      backdrop-filter: blur(6px);
      transition: opacity 220ms ease, transform 220ms ease;
      opacity: 1;
      border-radius: inherit; /* 尝试跟随目标元素的圆角 */
      z-index: 2147483646; /* 非常靠前，避免被页面其他元素覆盖；若冲突可调小 */
    }
    .frosted-overlay.fading-out {
      opacity: 0;
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);

  // Create overlay element for a target element
  function createOverlayFor(target) {
    if (!target || !(target instanceof Element)) return null;
    if (target.hasAttribute(PROCESSED_FLAG)) return null;
    // Mark processed
    target.setAttribute(PROCESSED_FLAG, 'true');

    // Ensure target is positioned (so absolute overlay can align)
    const computed = window.getComputedStyle(target);
    const origPosition = target.style.position || '';
    if (computed.position === 'static' || !computed.position) {
      // set position: relative so overlay absolute works
      target.style.position = 'relative';
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'frosted-overlay';
    overlay.setAttribute('role', 'button');
    overlay.setAttribute('aria-label', '点击以移除毛玻璃效果');

    // Make overlay not capture focus by default but clickable
    overlay.tabIndex = -1;

    // Append overlay as last child so it sits on top
    target.appendChild(overlay);

    // Clicking removes (fade out then DOM remove)
    function removeOverlay() {
      overlay.classList.add('fading-out');
      overlay.style.pointerEvents = 'none'; // avoid double clicks
      overlay.addEventListener('transitionend', () => {
        try { overlay.remove(); } catch (e) {}
      }, { once: true });
    }

    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      removeOverlay();
    });

    // Also remove overlay if the target is removed from DOM
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.removedNodes) {
          if (node === target) {
            try {
              overlay.remove();
            } catch (e) {}
            mo.disconnect();
            return;
          }
        }
      }
    });
    // Observe the parent node for removals
    if (target.parentNode) mo.observe(target.parentNode, { childList: true });

    return overlay;
  }

  // Find existing elements and add overlays
  function processExisting() {
    const nodes = document.querySelectorAll(SELECTOR);
    nodes.forEach((n) => {
      try { createOverlayFor(n); } catch (e) { console.error('frosted ext: create overlay failed', e); }
    });
  }

  // Observe document for new matching elements
  function observeForNew() {
    const docObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // check added nodes
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          // If the added node itself matches
          if (node.matches && node.matches(SELECTOR)) {
            createOverlayFor(node);
          }
          // If descendants match
          const found = node.querySelectorAll ? node.querySelectorAll(SELECTOR) : [];
          for (const f of found) {
            createOverlayFor(f);
          }
        }
        // Also handle attribute changes that may change classes
        if (m.type === 'attributes' && m.target instanceof Element) {
          const t = m.target;
          if (t.matches && t.matches(SELECTOR) && !t.hasAttribute(PROCESSED_FLAG)) {
            createOverlayFor(t);
          }
        }
      }
    });

    docObserver.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // Kick off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      processExisting();
      observeForNew();
    });
  } else {
    processExisting();
    observeForNew();
  }

  // Optional: expose a debug function on window to re-scan (for dev)
  window.__frostedOverlay_rescan = () => { processExisting(); };
})();

