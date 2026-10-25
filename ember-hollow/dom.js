/* Guarded DOM writes. Every helper compares against the last value it wrote and
 * touches the page only when something actually changed. Re-setting an
 * attribute to the same value still invalidates styles for the whole page, so
 * all rendering goes through these helpers. */
(function (root) {
  'use strict';
  const written = new WeakMap();
  function memo(element) {
    let entry = written.get(element);
    if (!entry) { entry = Object.create(null); written.set(element, entry); }
    return entry;
  }
  function changed(element, key, value) {
    if (!element) return false;
    const entry = memo(element);
    if (entry[key] === value) return false;
    entry[key] = value;
    return true;
  }
  const Dom = {
    text(element, value) {
      const output = String(value);
      if (changed(element, 'text', output)) element.textContent = output;
    },
    // Reading these properties is cheap (no layout), so compare with the live
    // value; that stays correct even if other code changed the element.
    hidden(element, value) {
      const flag = !!value;
      if (element && element.hidden !== flag) element.hidden = flag;
    },
    disabled(element, value) {
      const flag = !!value;
      if (element && element.disabled !== flag) element.disabled = flag;
    },
    attr(element, name, value) {
      const output = String(value);
      if (element && element.getAttribute(name) !== output) element.setAttribute(name, output);
    },
    toggle(element, name, value) {
      const flag = !!value;
      if (element && element.classList.contains(name) !== flag) element.classList.toggle(name, flag);
    },
    // Progress bars scale on the compositor instead of changing width, so
    // updating them never triggers a page layout. Values are rounded to 0.5%.
    bar(element, fraction) {
      const clamped = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
      const step = Math.round(clamped * 200) / 200;
      if (changed(element, 'bar', step)) element.style.transform = 'scaleX(' + step + ')';
    },
    // Forget cached values (used after a full reset rebuilds displays).
    forget(element) { if (element) written.delete(element); }
  };
  root.EmberDom = Object.freeze(Dom);
})(typeof window !== 'undefined' ? window : globalThis);
