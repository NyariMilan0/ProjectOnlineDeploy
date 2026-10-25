/* Save codes: a portable text form of a save, for moving progress between browsers
 * or keeping a copy outside the browser. Format: "EMBER1:" + base64(JSON save).
 * Plain JSON (starting with "{") is accepted too. */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EmberSaveCode = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const PREFIX = 'EMBER1:';
  const MAX_LENGTH = 200000; // generous; a real save is a few kB
  function toBase64(text) {
    if (typeof Buffer !== 'undefined') return Buffer.from(text, 'utf8').toString('base64');
    return root.btoa(unescape(encodeURIComponent(text)));
  }
  function fromBase64(text) {
    if (!/^[A-Za-z0-9+/=\s]+$/.test(text)) throw new Error('This save code contains characters that do not belong in one.');
    const clean = text.replace(/\s+/g, '');
    if (typeof Buffer !== 'undefined') return Buffer.from(clean, 'base64').toString('utf8');
    return decodeURIComponent(escape(root.atob(clean)));
  }
  function encode(saveJson) {
    if (typeof saveJson !== 'string') saveJson = JSON.stringify(saveJson);
    return PREFIX + toBase64(saveJson);
  }
  // Returns the parsed save object, or throws an Error with a player-friendly message.
  function decode(input, maxVersion) {
    const text = String(input == null ? '' : input).trim();
    if (!text) throw new Error('Paste a save code or choose a save file first.');
    if (text.length > MAX_LENGTH) throw new Error('That is far too long to be an Ember Hollow save.');
    let json;
    if (text.startsWith('{')) json = text;
    else if (text.startsWith(PREFIX)) {
      try { json = fromBase64(text.slice(PREFIX.length)); } catch (error) { throw new Error(error.message.startsWith('This save') ? error.message : 'This save code is damaged or incomplete.'); }
    } else throw new Error('This does not look like an Ember Hollow save code (it should start with ' + PREFIX + ').');
    let parsed;
    try { parsed = JSON.parse(json); } catch (_) { throw new Error('This save code is damaged or incomplete.'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || typeof parsed.version !== 'number') throw new Error('This is not an Ember Hollow save.');
    if (parsed.version < 1 || (maxVersion && parsed.version > maxVersion)) throw new Error('This save comes from a newer version of the game. Update the game files first.');
    return parsed;
  }
  function fileName(date) {
    const d = date || new Date();
    const pad = n => String(n).padStart(2, '0');
    return 'ember-hollow-save-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.txt';
  }
  return Object.freeze({ PREFIX, encode, decode, fileName });
});
