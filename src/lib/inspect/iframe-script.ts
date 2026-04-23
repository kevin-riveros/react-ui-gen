/**
 * Returns a self-contained <script> to inject into the preview iframe srcdoc.
 * Handles hover highlighting, click-to-select, and rectangle drag selection.
 * Communicates with the parent window via postMessage.
 *
 * The script is dormant by default and activated via postMessage:
 *   { type: 'inspect-mode', enabled: true }
 *
 * When a selection is made, the iframe freezes (no scroll, no hover) until
 * the parent sends { type: 'clear-selection' }.
 */
export function getSelectionScript(): string {
  return `<script>
(function() {
  let enabled = false;
  let frozen = false;
  let highlight = null;
  let tooltip = null;
  let dragRect = null;
  let dragStart = null;
  let isDragging = false;
  let savedOverflow = '';
  let savedPaddingRight = '';
  const DRAG_THRESHOLD = 5;

  // Target origin for every postMessage to the parent. The iframe loads via
  // srcdoc with \`sandbox="allow-scripts allow-same-origin ..."\`, so it
  // inherits the parent's origin — locking postMessage to that origin stops
  // any cross-origin parent (e.g. if the preview ever gets embedded
  // elsewhere) from eavesdropping on selection payloads.
  const PARENT_ORIGIN = window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : '*';
  function sendToParent(message) {
    window.parent.postMessage(message, PARENT_ORIGIN);
  }

  // ---- Overlay elements (only hover highlight + tooltip + drag rect) ----

  function createHighlight() {
    const el = document.createElement('div');
    el.id = '__inspect-highlight';
    Object.assign(el.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '2147483646',
      border: '2px solid #3b82f6', background: 'rgba(59,130,246,0.08)',
      borderRadius: '3px', transition: 'all 0.05s ease-out', display: 'none',
    });
    document.body.appendChild(el);
    return el;
  }

  function createTooltip() {
    const el = document.createElement('div');
    el.id = '__inspect-tooltip';
    Object.assign(el.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '2147483647',
      background: '#1e293b', color: '#f8fafc', fontSize: '11px',
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      padding: '3px 8px', borderRadius: '4px', display: 'none',
      whiteSpace: 'nowrap', maxWidth: '300px', overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
    document.body.appendChild(el);
    return el;
  }

  function createDragRect() {
    const el = document.createElement('div');
    el.id = '__inspect-drag-rect';
    Object.assign(el.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '2147483645',
      border: '2px dashed #3b82f6', background: 'rgba(59,130,246,0.06)',
      borderRadius: '2px', display: 'none',
    });
    document.body.appendChild(el);
    return el;
  }

  function ensureOverlays() {
    if (!highlight) highlight = createHighlight();
    if (!tooltip) tooltip = createTooltip();
    if (!dragRect) dragRect = createDragRect();
  }

  function hideHoverOverlays() {
    if (highlight) highlight.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
  }

  function hideAllOverlays() {
    hideHoverOverlays();
    if (dragRect) dragRect.style.display = 'none';
  }

  function removeOverlays() {
    [highlight, tooltip, dragRect].forEach(el => el?.remove());
    highlight = tooltip = dragRect = null;
  }

  // ---- Freeze / unfreeze ----

  function freeze() {
    frozen = true;
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = scrollbarWidth + 'px';
    }
    hideHoverOverlays();
  }

  function unfreeze() {
    frozen = false;
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPaddingRight;
  }

  // ---- Element data extraction ----

  function computeSelector(el) {
    var parts = [];
    var current = el;
    while (current && current !== document.body && current.id !== 'root') {
      var selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += '#' + current.id;
        parts.unshift(selector);
        break;
      }
      if (current.className && typeof current.className === 'string') {
        var classes = current.className.trim().split(/\\s+/).filter(Boolean).slice(0, 3);
        if (classes.length) selector += '.' + classes.join('.');
      }
      var parent = current.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(c) { return c.tagName === current.tagName; });
        if (siblings.length > 1) {
          var index = siblings.indexOf(current) + 1;
          selector += ':nth-child(' + index + ')';
        }
      }
      parts.unshift(selector);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  function getAncestors(el, levels) {
    var ancestors = [];
    var current = el.parentElement;
    var count = 0;
    while (current && current !== document.body && count < levels) {
      var desc = current.tagName.toLowerCase();
      if (current.className && typeof current.className === 'string') {
        var cls = current.className.trim().split(/\\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) desc += '.' + cls.join('.');
      }
      ancestors.push(desc);
      current = current.parentElement;
      count++;
    }
    return ancestors;
  }

  function extractElementData(el) {
    var rect = el.getBoundingClientRect();
    return {
      tagName: el.tagName.toLowerCase(),
      cssSelector: computeSelector(el),
      className: (typeof el.className === 'string' ? el.className : '').trim(),
      textContent: (el.textContent || '').trim().slice(0, 120),
      sourceFile: el.dataset ? el.dataset.sourceFile || null : null,
      sourceLine: el.dataset ? el.dataset.sourceLine || null : null,
      sourceComponent: el.dataset ? el.dataset.sourceComponent || null : null,
      boundingRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      ancestors: getAncestors(el, 3),
    };
  }

  function isInspectOverlay(el) {
    return el && el.id && el.id.startsWith('__inspect-');
  }

  function isContainerElement(el) {
    var count = 0;
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      if (isInspectOverlay(child)) continue;
      var r = child.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) count++;
      if (count > 1) return true;
    }
    return false;
  }

  function getDirectChildren(el) {
    var children = [];
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      if (isInspectOverlay(child)) continue;
      var r = child.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) children.push(child);
    }
    return children;
  }

  function getTargetElement(x, y) {
    var el = document.elementFromPoint(x, y);
    while (el && (el.nodeType !== 1 || isInspectOverlay(el))) {
      el = el.parentElement;
    }
    if (!el || el === document.body || el === document.documentElement) {
      return null;
    }
    return el;
  }

  // Find the nearest meaningful element when clicking on #root or empty areas
  function findNearestElement(x, y) {
    var el = getTargetElement(x, y);
    // If we got #root, find its nearest child container
    if (el && el.id === 'root') {
      var bestChild = null;
      var bestDist = Infinity;
      for (var i = 0; i < el.children.length; i++) {
        var child = el.children[i];
        if (isInspectOverlay(child)) continue;
        var r = child.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Distance from click point to element center
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
        if (dist < bestDist) {
          bestDist = dist;
          bestChild = child;
        }
      }
      return bestChild;
    }
    return el;
  }

  // ---- Highlight positioning ----

  function showHighlight(el) {
    if (!highlight) return;
    var rect = el.getBoundingClientRect();
    Object.assign(highlight.style, {
      display: 'block',
      top: rect.top + 'px', left: rect.left + 'px',
      width: rect.width + 'px', height: rect.height + 'px',
    });
  }

  function showTooltip(el) {
    if (!tooltip) return;
    var rect = el.getBoundingClientRect();
    var tag = el.tagName.toLowerCase();
    var comp = el.dataset ? el.dataset.sourceComponent : null;
    var isContainer = isContainerElement(el);
    var label = comp
      ? '<' + comp + '>' + (isContainer ? ' (section)' : '')
      : tag + (isContainer ? ' (section)' : '');
    tooltip.textContent = label;
    Object.assign(tooltip.style, {
      display: 'block',
      top: Math.max(0, rect.top - 24) + 'px',
      left: rect.left + 'px',
    });
  }

  // ---- Rectangle selection ----

  function getRectsIntersecting(rect) {
    var elements = [];
    var all = document.querySelectorAll('#root *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (isInspectOverlay(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.left < rect.right && r.right > rect.left &&
          r.top < rect.bottom && r.bottom > rect.top) {
        if (r.width < rect.width * 2 && r.height < rect.height * 2) {
          elements.push(el);
        }
      }
    }
    return elements;
  }

  // ---- Event handlers ----

  function onMouseMove(e) {
    if (frozen) return;

    if (isDragging && dragStart) {
      var dx = e.clientX - dragStart.x;
      var dy = e.clientY - dragStart.y;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        if (dragRect) {
          Object.assign(dragRect.style, {
            display: 'block',
            left: Math.min(dragStart.x, e.clientX) + 'px',
            top: Math.min(dragStart.y, e.clientY) + 'px',
            width: Math.abs(dx) + 'px',
            height: Math.abs(dy) + 'px',
          });
        }
        hideHoverOverlays();
        return;
      }
    }

    var el = getTargetElement(e.clientX, e.clientY);
    // Also highlight #root children when hovering root
    if (el && el.id === 'root') {
      el = findNearestElement(e.clientX, e.clientY);
    }
    if (el) {
      showHighlight(el);
      showTooltip(el);
      document.body.style.cursor = 'crosshair';
    } else {
      hideHoverOverlays();
      document.body.style.cursor = 'crosshair';
    }
  }

  function onMouseDown(e) {
    if (frozen) { e.preventDefault(); e.stopPropagation(); return; }
    e.preventDefault();
    e.stopPropagation();
    dragStart = { x: e.clientX, y: e.clientY };
    isDragging = true;
  }

  function onMouseUp(e) {
    if (frozen) { e.preventDefault(); e.stopPropagation(); return; }
    e.preventDefault();
    e.stopPropagation();

    if (!dragStart) return;

    var dx = Math.abs(e.clientX - dragStart.x);
    var dy = Math.abs(e.clientY - dragStart.y);
    var wasDrag = dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD;

    if (wasDrag) {
      // Rectangle drag selection
      var rect = {
        left: Math.min(dragStart.x, e.clientX),
        top: Math.min(dragStart.y, e.clientY),
        right: Math.max(dragStart.x, e.clientX),
        bottom: Math.max(dragStart.y, e.clientY),
      };
      var elements = getRectsIntersecting(rect);
      if (elements.length > 0) {
        var payload = {
          elements: elements.map(extractElementData),
          rect: {
            top: rect.top, left: rect.left,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
          },
        };
        sendToParent({ type: 'region-selected', payload: payload });
        freeze();
      }
    } else {
      // Single click
      var el = findNearestElement(e.clientX, e.clientY);
      if (el) {
        if (isContainerElement(el)) {
          var children = getDirectChildren(el);
          var allElements = [el].concat(children);
          var containerRect = el.getBoundingClientRect();
          var payload = {
            elements: allElements.map(extractElementData),
            rect: { top: containerRect.top, left: containerRect.left, width: containerRect.width, height: containerRect.height },
          };
          sendToParent({ type: 'region-selected', payload: payload });
        } else {
          sendToParent({ type: 'element-selected', payload: extractElementData(el) });
        }
        freeze();
      }
    }

    dragStart = null;
    isDragging = false;
    if (dragRect) dragRect.style.display = 'none';
  }

  function onClick(e) {
    if (enabled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onWheel(e) {
    if (frozen) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // ---- Enable / disable ----

  function enable() {
    if (enabled) return;
    enabled = true;
    frozen = false;
    ensureOverlays();
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('wheel', onWheel, { capture: true, passive: false });
    document.body.style.cursor = 'crosshair';
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    frozen = false;
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('mousedown', onMouseDown, true);
    document.removeEventListener('mouseup', onMouseUp, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('wheel', onWheel, true);
    document.body.style.cursor = '';
    document.body.style.overflow = savedOverflow || '';
    document.body.style.paddingRight = savedPaddingRight || '';
    hideAllOverlays();
    removeOverlays();
    dragStart = null;
    isDragging = false;
  }

  // Listen for messages from parent
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    if (e.data.type === 'inspect-mode') {
      if (e.data.enabled) enable(); else disable();
    }
    if (e.data.type === 'clear-selection') {
      unfreeze();
    }
  });
})();
</script>`;
}
