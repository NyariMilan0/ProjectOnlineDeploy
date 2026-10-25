'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const EmberCelebration = require('../celebration.js');
function openCelebration(reducedMotion = false) {
  const ids = new Map(), timers = new Map(); let nextId = 1, chimes = 0;
  class Element {
    constructor() { this.children = []; this.className = ''; this.attributes = new Map(); this.textContent = ''; this.style = { setProperty(name, value) { this[name] = value; } }; this.classes = new Set(); this.classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name), contains: name => this.classes.has(name) }; }
    set id(value) { this._id = value; ids.set(value, this); }
    get id() { return this._id; }
    append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); }
    appendChild(child) { this.append(child); return child; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  }
  const document = { body: new Element(), getElementById: id => ids.get(id) || null, createElement: () => new Element() };
  const layer = new Element(); layer.id = 'celebration-layer'; document.body.appendChild(layer);
  const card = id => { const element = new Element(); element.id = 'achievement-' + id; return element; };
  const controller = new EmberCelebration({ document, reducedMotion: () => reducedMotion, sound: () => chimes++,
    setTimeout: (callback, delay) => { const id = nextId++; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id)
  });
  return { controller, layer, timers, card, chimes: () => chimes,
    finish: () => { const pending = [...timers.entries()]; pending.forEach(([id, timer]) => { timers.delete(id); timer.callback(); }); }
  };
}

test('an achievement earns one accessible banner, a bounded pixel burst and a temporary card highlight', () => {
  const h = openCelebration(), card = h.card('warm-hands');
  const item = Object.freeze({ id: 'warm-hands', title: 'Warm hands', icon: '◆' });
  h.controller.celebrate(Object.freeze([item]));
  assert.equal(h.layer.children.length, 2);
  assert.equal(h.controller.banner.attributes.get('role'), 'status');
  assert.equal(h.controller.banner.attributes.get('aria-live'), 'polite');
  assert.equal(h.controller.title.textContent, 'Warm hands');
  assert.equal(h.controller.particles.children.length, 28);
  assert.equal(h.timers.size, 1); assert.equal(h.chimes(), 1);
  assert.equal(card.classList.contains('celebrating'), true);
  h.finish();
  assert.equal(h.layer.children.length, 0); assert.equal(h.timers.size, 0);
  assert.equal(card.classList.contains('celebrating'), false);
  assert.equal(item.title, 'Warm hands');
});

test('many simultaneous achievements merge into one celebration without adding particles or timers', () => {
  const h = openCelebration();
  const burst = Array.from({ length: 1000 }, (_, index) => ({ id: String(index), title: 'Spark ' + index }));
  h.controller.celebrate(burst);
  for (let index = 0; index < 100; index++) h.controller.celebrate(burst);
  assert.equal(h.layer.children.length, 2);
  assert.equal(h.controller.particles.children.length, 28);
  assert.equal(h.controller.items.size, 64);
  assert.equal(h.timers.size, 1); assert.equal(h.chimes(), 1);
  assert.equal(h.controller.kicker.textContent, 'ACHIEVEMENTS UNLOCKED');
  assert.match(h.controller.subtitle.textContent, /63 more/);
  h.controller.clear();
  h.controller.celebrate([{ id: '0', title: 'A fresh start' }]);
  assert.equal(h.chimes(), 2, 'clearing permits a new game to celebrate the same achievement again');
  h.controller.dispose(); assert.equal(h.timers.size, 0);
});

test('reduced motion keeps the achievement announcement but omits confetti', () => {
  const h = openCelebration(true);
  h.controller.celebrate([{ id: 'first', title: 'First spark' }]);
  assert.equal(h.layer.children.length, 1);
  assert.equal(h.controller.particles, null);
  assert.equal(h.controller.title.textContent, 'First spark');
  assert.equal(h.chimes(), 1);
  h.controller.dispose();
  assert.equal(h.layer.children.length, 0); assert.equal(h.timers.size, 0);
  h.controller.celebrate([{ id: 'later', title: 'Ignored after disposal' }]);
  assert.equal(h.layer.children.length, 0);
});
