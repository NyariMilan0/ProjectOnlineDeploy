'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const game = require('../game.js');
const achievements = require('../achievements.js');
const skills = require('../skills.js');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const panelSource = fs.readFileSync(path.join(__dirname, '..', 'panels.js'), 'utf8');
const domSource = fs.readFileSync(path.join(__dirname, '..', 'dom.js'), 'utf8');
const saveCodeSource = fs.readFileSync(path.join(__dirname, '..', 'savecode.js'), 'utf8');
const SAVE_KEY = 'ember-hollow-save-v1';
const SETTINGS_KEY = 'ember-hollow-settings-v1';
const NOW = 1700000000000;
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, actual + ' should equal ' + expected);

// Exercise actual app and panel event boundaries with deterministic time and
// native-dialog equivalents. Game logic and the skill catalog remain real.
function openApp(saved, preferences) {
  const elements = new Map(), intervals = new Map(), timeouts = new Map();
  const documentEvents = new Map(), windowEvents = new Map(), writes = [];
  const storage = new Map(saved === undefined ? [] : [[SAVE_KEY, JSON.stringify(saved)]]);
  if (preferences) storage.set(SETTINGS_KEY, typeof preferences === 'string' ? preferences : JSON.stringify(preferences));
  let now = 0, nextTimer = 1, scene, audio, celebration;
  const domWrites = { text: 0, attribute: 0, hidden: 0, style: 0 };
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag; this.children = []; this.events = new Map();
      this.attributes = new Map(); this.disabled = false;
      const style = {};
      this.style = new Proxy(style, { set: (target, key, value) => { domWrites.style++; target[key] = value; return true; } });
      this.open = false; this.returnValue = ''; this._text = ''; this.value = '';
      this.checked = false; this._hidden = false;
      const classes = new Set();
      this.classList = {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name),
        toggle: (name, force) => {
          const enabled = force === undefined ? !classes.has(name) : force;
          if (enabled) classes.add(name); else classes.delete(name);
          return enabled;
        }
      };
    }
    set id(value) { this._id = value; elements.set(value, this); }
    get id() { return this._id; }
    set hidden(value) { domWrites.hidden++; this._hidden = value; }
    get hidden() { return this._hidden; }
    set textContent(value) { domWrites.text++; this._text = String(value); this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    get childElementCount() { return this.children.length; }
    append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); }
    appendChild(child) { this.append(child); return child; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
    addEventListener(type, callback) { this.events.set(type, callback); }
    setAttribute(name, value) { domWrites.attribute++; this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    showModal() { this.open = true; }
    close(value) {
      if (value !== undefined) this.returnValue = value;
      this.open = false; this.events.get('close')?.({ target: this });
    }
    click() { if (!this.disabled) this.events.get('click')?.({ target: this }); }
    focus() {}
    closest() { return null; }
  }
  const element = id => {
    if (!elements.has(id)) { const node = new Element(); node.id = id; }
    return elements.get(id);
  };
  const document = {
    hidden: false, body: new Element('body'), getElementById: element,
    createElement: tag => new Element(tag),
    addEventListener: (type, callback) => documentEvents.set(type, callback),
    querySelector: () => [...elements.values()].find(node => node.open) || null
  };
  class Scene {
    constructor() { scene = this; this.stokes = 0; this.spriteUpdates = 0; this.kilnUpdates = 0; this.blueUpdates = 0; }
    setReducedMotion(value) { this.reducedMotion = value; }
    setSprites(value) { this.spriteUpdates++; this.spriteLevel = value; }
    setKiln() { this.kilnUpdates++; }
    setBlue() { this.blueUpdates++; }
    stoke() { this.stokes++; }
  }
  class Audio {
    constructor() { audio = this; this.unlocks = 0; this.plays = []; this.hidden = []; this.preferences = null; }
    setPreferences(value) { this.preferences = JSON.parse(JSON.stringify(value)); }
    unlock() { this.unlocks++; }
    setHidden(value) { this.hidden.push(value); }
    play(kind) { this.plays.push(kind); }
  }
  class Celebration {
    constructor(options) { celebration = this; this.options = options; this.batches = []; this.clears = 0; }
    celebrate(items) { this.batches.push(JSON.parse(JSON.stringify(items))); }
    clear() { this.clears++; }
  }
  const window = {
    EmberGame: game, EmberAchievements: achievements, EmberSkills: skills, EmberScene: Scene,
    EmberAudio: Audio, EmberCelebration: Celebration,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    btoa: text => Buffer.from(text, 'binary').toString('base64'),
    atob: text => Buffer.from(text, 'base64').toString('binary'),
    addEventListener: (type, callback) => windowEvents.set(type, callback)
  };
  const context = vm.createContext({
    window, document,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => { storage.set(key, value); writes.push({ key, value }); },
      removeItem: key => storage.delete(key)
    },
    performance: { now: () => now }, Date: { now: () => NOW + now },
    setInterval: (callback, delay) => { intervals.set(delay, callback); return nextTimer++; },
    setTimeout: (callback, delay) => { const id = nextTimer++; timeouts.set(id, { callback, delay }); return id; },
    clearTimeout: id => timeouts.delete(id)
  });
  vm.runInContext(domSource, context, { filename: 'dom.js' });
  vm.runInContext(saveCodeSource, context, { filename: 'savecode.js' });
  vm.runInContext(panelSource, context, { filename: 'panels.js' });
  vm.runInContext(appSource, context, { filename: 'app.js' });
  return {
    element, scene, audio, celebration, writes, document,
    domWrites: () => Object.assign({}, domWrites),
    saved: () => JSON.parse(storage.get(SAVE_KEY)),
    settings: () => JSON.parse(storage.get(SETTINGS_KEY) || 'null'),
    advance: ms => { now += ms; },
    click: id => element(id).click(),
    pointer: () => documentEvents.get('pointerdown')?.(),
    key: (code = 'KeyA') => documentEvents.get('keydown')?.({ code, repeat: false, target: element('keyboard-target'), preventDefault() {} }),
    input: (id, value) => { element(id).value = value; element(id).events.get('input')?.({ target: element(id) }); },
    change: (id, checked) => { element(id).checked = checked; element(id).events.get('change')?.({ target: element(id) }); },
    frame: (ms = 50) => { now += ms; intervals.get(50)(); },
    autosave: () => intervals.get(2000)(),
    hide: () => { document.hidden = true; documentEvents.get('visibilitychange')(); },
    show: () => { document.hidden = false; documentEvents.get('visibilitychange')(); },
    pagehide: () => windowEvents.get('pagehide')(),
    timeoutCount: () => timeouts.size
  };
}
function veteranSave() {
  return Object.assign(game.createState(NOW, 123), {
    embers: 5432, blueFlames: 777, blueUnlocked: true, bellows: 3, sprites: 4, kiln: 2,
    totalEarned: 123456, manualClicks: 4321, playedSeconds: 6789, lifetimeBlue: 4567,
    runEmbers: 43210, runBlue: 2222, runClicks: 1234, runSeconds: 456,
    rebirthCount: 2, totalRebirthPoints: 5, rebirthPoints: 2,
    skills: { 'warm-memory': 1, 'steady-hands': 1 }
  });
}

test('10000 alternating fire clicks are all credited while effects and saving are batched', () => {
  const app = openApp();
  const initialWrites = app.writes.length, initialTimers = app.timeoutCount();
  const initialSceneUpdates = app.scene.spriteUpdates + app.scene.kilnUpdates + app.scene.blueUpdates;
  for (let index = 0; index < 10000; index++) app.click(index % 2 ? 'stoke-button' : 'stoke-scene');
  assert.equal(app.writes.length, initialWrites);
  assert.equal(app.timeoutCount(), initialTimers);
  assert.equal(app.scene.stokes, 0);
  assert.equal(app.element('manual-clicks').textContent, '0');
  app.frame();
  assert.equal(app.element('manual-clicks').textContent, '10K');
  assert.equal(app.scene.stokes, 1);
  assert.equal(app.element('float-layer').childElementCount, 1);
  assert.equal(app.scene.spriteUpdates + app.scene.kilnUpdates + app.scene.blueUpdates, initialSceneUpdates);
  assert.equal(app.writes.length, initialWrites);
  app.autosave();
  const state = app.saved();
  assert.equal(app.writes.length, initialWrites + 1);
  assert.equal(state.manualClicks, 10000);
  near(state.embers, 10000); near(state.totalEarned, 10000);
  app.frame(250); // Achievement cards refresh on the 4 Hz card tier, not every tick.
  assert.ok(app.element('achievement-hundred-clicks').classList.contains('unlocked'));
  assert.ok(app.element('achievement-ten-thousand-embers').classList.contains('unlocked'));
});

test('hiding before a render persists every click and background pagehide preserves offline time', () => {
  const app = openApp();
  for (let index = 0; index < 321; index++) app.click('stoke-scene');
  app.hide();
  assert.equal(app.saved().manualClicks, 321); assert.equal(app.saved().embers, 321);
  assert.equal(app.saved().savedAt, NOW);
  const hiddenWriteCount = app.writes.length;
  app.advance(6000); app.pagehide();
  assert.equal(app.writes.length, hiddenWriteCount);
  assert.equal(app.saved().savedAt, NOW);
  app.show();
  assert.equal(app.saved().manualClicks, 321); assert.equal(app.saved().embers, 321);
  assert.equal(app.saved().savedAt, NOW + 6000);
});

test('startup migrates a version-one save in place and consumes its offline award once', () => {
  const app = openApp({ version: 1, embers: 42, sprites: 3, bellows: 2, manualClicks: 123, totalEarned: 4321, savedAt: NOW - 2000 });
  const migrated = app.saved();
  assert.equal(migrated.version, game.VERSION); assert.equal(migrated.version, 4);
  assert.equal(migrated.sprites, 3); assert.equal(migrated.kiln, 0);
  assert.equal(migrated.bellows, 2); assert.equal(migrated.manualClicks, 123);
  near(migrated.embers, 45.32); near(migrated.totalEarned, 4324.32);
  assert.equal(migrated.savedAt, NOW); assert.equal(app.element('sprite-level').textContent, 'LV. 3');
  app.hide(); app.show(); near(app.saved().embers, 45.32);
});

test('wrong reset text and Escape preserve every lifetime, rebirth, skill, and preference value', () => {
  const preferences = { sound: true, reducedMotion: true, compact: false };
  const app = openApp(veteranSave(), preferences), before = app.saved();
  app.click('reset-button'); app.input('reset-confirm', 'reset');
  assert.equal(app.element('confirm-full-reset').disabled, true);
  app.element('reset-dialog').close('reset'); // Even an invalid form result is guarded.
  assert.deepEqual(app.saved(), before); assert.deepEqual(app.settings(), preferences);
  app.click('reset-button'); app.input('reset-confirm', 'RESET');
  assert.equal(app.element('confirm-full-reset').disabled, false);
  assert.equal(app.element('reset-dialog').returnValue, 'cancel');
  app.element('reset-dialog').close(); // Native Escape retains 'cancel'.
  assert.deepEqual(app.saved(), before); assert.deepEqual(app.settings(), preferences);
});

test('confirmed full reset clears both currencies, permanent progress, records, and preferences', () => {
  const app = openApp(veteranSave(), { sound: true, reducedMotion: true, compact: false });
  app.click('settings-button'); app.click('full-reset-button'); app.input('reset-confirm', 'RESET');
  app.element('reset-dialog').close('reset');
  const reset = app.saved();
  for (const key of ['embers', 'blueFlames', 'bellows', 'kiln', 'totalEarned', 'manualClicks', 'playedSeconds', 'lifetimeBlue', 'runEmbers', 'runBlue', 'runClicks', 'runSeconds', 'rebirthPoints', 'totalRebirthPoints', 'rebirthCount', 'bestBellows', 'bestKiln']) {
    assert.equal(reset[key], 0, key);
  }
  assert.equal(reset.sprites, 0); assert.equal(reset.blueUnlocked, false);
  assert.deepEqual(reset.skills, {});
  assert.deepEqual(app.settings(), { sound: false, reducedMotion: false, compact: true, music: true, musicVolume: 20, buyAmount: '1' });
  assert.equal(app.scene.reducedMotion, false);
  assert.equal(app.element('settings-dialog').open, false);
  assert.equal(app.element('achievement-hundred-clicks').classList.contains('unlocked'), false);
  // A previously confirmed reset must not make a later Escape reset new clicks.
  for (let index = 0; index < 3; index++) app.click('stoke-button');
  app.click('reset-button'); app.element('reset-dialog').close(); app.hide();
  assert.equal(app.saved().manualClicks, 3); assert.equal(app.saved().embers, 3);
});

test('closing the rebirth dialog without confirming preserves the current run', () => {
  const initial = Object.assign(game.createState(NOW, 123), { embers: 123, blueFlames: 1000, lifetimeBlue: 1000, blueUnlocked: true });
  const app = openApp(initial), before = app.saved();
  app.click('rebirth-button'); assert.equal(app.element('rebirth-dialog').open, true);
  assert.equal(app.element('rebirth-dialog').returnValue, 'cancel');
  app.element('rebirth-dialog').close();
  assert.deepEqual(app.saved(), before);
});

test('first confirmed rebirth at 1000 blue resets its run and retains lifetime records', () => {
  const initial = Object.assign(game.createState(NOW, 123), {
    embers: 123, bellows: 4, sprites: 3, kiln: 2, blueFlames: 1000, lifetimeBlue: 1000, blueUnlocked: true,
    totalEarned: 5000, manualClicks: 100, playedSeconds: 60, runEmbers: 5000, runBlue: 1000, runClicks: 100, runSeconds: 60
  });
  const app = openApp(initial);
  app.click('rebirth-button'); app.element('rebirth-dialog').close('confirm');
  const after = app.saved();
  for (const key of ['embers', 'blueFlames', 'bellows', 'kiln', 'runEmbers', 'runBlue', 'runClicks', 'runSeconds']) assert.equal(after[key], 0, key);
  assert.equal(after.sprites, 0); assert.equal(after.blueUnlocked, false);
  assert.equal(after.totalEarned, 5000); assert.equal(after.manualClicks, 100);
  assert.equal(after.lifetimeBlue, 1000); assert.equal(after.playedSeconds, 60);
  assert.equal(after.rebirthCount, 1); assert.equal(after.totalRebirthPoints, 1); assert.equal(after.rebirthPoints, 1);
  assert.equal(game.getRebirthInfo(after).nextCost, 2000);
  assert.ok(app.element('achievement-first-rebirth').classList.contains('unlocked'));
});

test('later rebirth keeps learned skills and applies starter bonuses only to the new run', () => {
  const initial = veteranSave();
  initial.totalRebirthPoints = 1; initial.rebirthCount = 1; initial.rebirthPoints = 0;
  initial.skills = { 'warm-memory': 1 }; initial.blueFlames = 2000;
  const app = openApp(initial);
  app.click('rebirth-button'); app.element('rebirth-dialog').close('confirm');
  const after = app.saved();
  assert.deepEqual(after.skills, { 'warm-memory': 1 });
  assert.equal(after.embers, 100); assert.equal(after.runEmbers, 100); // Warm memory: 100 starting embers per rank
  assert.equal(after.rebirthPoints, 1); assert.equal(after.totalRebirthPoints, 2);
  assert.equal(after.rebirthCount, 2); assert.equal(after.blueFlames, 0);
  assert.equal(after.totalEarned, initial.totalEarned + 100);
  assert.equal(after.manualClicks, initial.manualClicks);
});

test('changing settings does not discard pending click credits or current progress', () => {
  const app = openApp();
  for (let index = 0; index < 123; index++) app.click('stoke-button');
  app.click('settings-button'); app.change('motion-setting', true); app.change('numbers-setting', false); app.change('sound-setting', true);
  app.click('save-button');
  assert.equal(app.saved().manualClicks, 123); assert.equal(app.saved().embers, 123);
  assert.deepEqual(app.settings(), { sound: true, reducedMotion: true, compact: false, music: true, musicVolume: 20, buyAmount: '1' });
  assert.equal(app.scene.reducedMotion, true);
  assert.equal(app.document.body.classList.contains('reduced-motion'), true);
});

test('damaged settings fall back to defaults while existing progress and new clicks still save', () => {
  const initial = Object.assign(game.createState(NOW, 123), { embers: 42, totalEarned: 42, manualClicks: 7 });
  const app = openApp(initial, '{damaged preferences');
  assert.equal(app.saved().embers, 42);
  assert.equal(app.saved().manualClicks, 7);
  app.click('settings-button');
  assert.equal(app.element('sound-setting').checked, false);
  assert.equal(app.element('motion-setting').checked, false);
  assert.equal(app.element('numbers-setting').checked, true);
  for (let index = 0; index < 17; index++) app.click('stoke-button');
  app.hide();
  assert.equal(app.saved().manualClicks, 24);
  assert.equal(app.saved().embers, 59);
  assert.equal(app.saved().totalEarned, 59);
  assert.equal(app.element('save-message').textContent, 'Progress saved on this device');
});

test('a blue-flame click burst credits deterministic drops without per-click rendering or saves', () => {
  const initial = game.createState(NOW, 123); initial.blueUnlocked = true;
  const expected = game.restore(initial, NOW).state;
  const app = openApp(initial), initialWrites = app.writes.length, initialTimers = app.timeoutCount();
  for (let index = 0; index < 10000; index++) { app.click('stoke-scene'); game.click(expected); }
  assert.equal(app.writes.length, initialWrites); assert.equal(app.timeoutCount(), initialTimers); assert.equal(app.scene.stokes, 0);
  app.hide();
  assert.equal(app.saved().manualClicks, 10000); assert.equal(app.saved().embers, 10000);
  assert.ok(app.saved().blueFlames > 0); assert.equal(app.saved().blueFlames, expected.blueFlames);
  assert.equal(app.saved().lifetimeBlue, expected.lifetimeBlue);
});

test('idle frames write nothing to the page and click bursts stay within a small write budget', () => {
  const app = openApp();
  app.frame(1000); app.frame(1000); // let every render tier settle
  const before = app.domWrites();
  for (let index = 0; index < 40; index++) app.frame(50); // two idle seconds, no automation yet
  const idle = app.domWrites();
  assert.deepEqual(idle, before, 'idle frames must not touch the page');
  // 20 frames of rapid clicking (500 clicks per frame = 10,000 clicks/sec).
  for (let frame = 0; frame < 20; frame++) {
    for (let index = 0; index < 500; index++) app.click('stoke-button');
    app.frame(50);
  }
  const busy = app.domWrites();
  const perFrame = key => (busy[key] - idle[key]) / 20;
  assert.ok(perFrame('attribute') <= 12, 'attribute writes per frame: ' + perFrame('attribute'));
  assert.ok(perFrame('hidden') <= 2, 'hidden toggles per frame: ' + perFrame('hidden'));
  assert.ok(perFrame('text') <= 30, 'text writes per frame: ' + perFrame('text'));
  assert.ok(perFrame('style') <= 12, 'style writes per frame: ' + perFrame('style'));
  assert.equal(app.element('manual-clicks').textContent, '10K');
});

test('the game core credits a million clicks quickly', () => {
  const state = game.createState(NOW, 1);
  Object.assign(state, { bellows: 10, kindling: 3, blueUnlocked: true, blueChanceLevel: 10, blueScatter: 3 });
  const started = process.hrtime.bigint();
  for (let index = 0; index < 1000000; index++) game.click(state);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  assert.equal(state.manualClicks, 1000000);
  assert.ok(ms < 3000, 'one million clicks took ' + ms.toFixed(0) + 'ms');
});

test('the buy-amount switch is remembered and MAX buys many levels in one press', () => {
  const app = openApp({ ...game.createState(NOW, 5), embers: 1000, savedAt: NOW });
  app.click('buy-amount-max');
  assert.equal(app.settings().buyAmount, 'max');
  assert.equal(app.element('buy-amount-max').getAttribute('aria-checked'), 'true');
  assert.equal(app.element('buy-amount-1').getAttribute('aria-checked'), 'false');
  assert.match(app.element('bellows-note').textContent, /\+\d+ levels/);
  app.click('buy-bellows');
  const saved = app.saved();
  assert.ok(saved.bellows >= 5, 'bought ' + saved.bellows + ' levels');
  assert.ok(saved.embers < game.getUpgradeCost(game.sanitize(saved, NOW), 'bellows'));
  app.click('buy-amount-10');
  assert.equal(app.settings().buyAmount, '10');
  assert.equal(app.element('buy-bellows').disabled, true);
});

test('export produces a code that imports elsewhere, and the previous progress can be restored', () => {
  const source = openApp(veteranSave());
  source.click('export-open');
  const code = source.element('export-code').value;
  assert.ok(code.startsWith('EMBER1:'));
  assert.equal(source.element('export-dialog').open, true);

  const target = openApp({ ...game.createState(NOW, 9), embers: 77, manualClicks: 12, savedAt: NOW });
  target.click('import-open');
  assert.equal(target.element('import-confirm').disabled, true);
  target.input('import-code', 'definitely not a save');
  assert.equal(target.element('import-confirm').disabled, true);
  assert.match(target.element('import-status').textContent, /does not look like/);
  target.input('import-code', code);
  assert.equal(target.element('import-confirm').disabled, false);
  assert.match(target.element('import-status').textContent, /Save found: .*2 rebirths/);
  target.click('import-confirm');
  const imported = target.saved();
  assert.equal(imported.manualClicks, 4321); assert.equal(imported.rebirthCount, 2);
  assert.deepEqual(imported.skills, { 'warm-memory': 1, 'steady-hands': 1 });
  assert.equal(target.element('import-dialog').open, false);
  // No offline windfall: the imported save continues from the moment of import.
  assert.equal(imported.savedAt, NOW);

  target.click('undo-import');
  const restored = target.saved();
  assert.equal(restored.manualClicks, 12); assert.equal(restored.embers, 77);
});

test('skills appear only once their prerequisites are learned, and related skills highlight', () => {
  const app = openApp(veteranSave()); // warm-memory 1, steady-hands 1, two rebirths
  app.click('tree-button');
  const shown = id => !app.element('skill-' + id).hidden;
  const chipsOf = id => app.element('skill-' + id).children.find(child => child.className === 'skill-requires').children.map(chip => chip.textContent);
  // Discovered: the root, learned skills, and skills whose prerequisites are all met.
  for (const id of ['warm-memory', 'steady-hands', 'bellows-memory', 'forest-bond', 'lucky-embers', 'patient-fire']) assert.ok(shown(id), id + ' should show');
  // Hidden: anything with an unmet prerequisite — there is no switch to reveal them.
  for (const id of ['ember-heart', 'blazing-start', 'kilncraft', 'charcoal-memory', 'deep-sleep']) assert.ok(!shown(id), id + ' should be hidden');
  assert.equal(app.element('planned-toggle').events.size, 0);
  assert.match(app.element('tree-discovered').textContent, /^6 of 30 skills discovered/);
  assert.deepEqual(chipsOf('steady-hands'), ['✓ Warm memory 1']);
  assert.deepEqual(chipsOf('forest-bond'), ['✓ Warm memory 1 · Kindling']);
  assert.deepEqual(chipsOf('warm-memory'), ['Starting point · no prerequisites']);
  const opens = id => app.element('skill-' + id).children.find(child => child.className === 'skill-unlocks').textContent;
  assert.equal(opens('warm-memory'), 'Opens: Steady hands, Forest bond, Lucky embers, Patient fire, 1 undiscovered skill');
  assert.equal(opens('steady-hands'), 'Opens: Familiar tools, 1 undiscovered skill');
  app.element('skill-steady-hands').events.get('pointerenter')();
  assert.ok(app.element('skill-warm-memory').classList.contains('is-prereq'));
  assert.ok(app.element('skill-bellows-memory').classList.contains('is-unlocks'));
  app.element('skill-steady-hands').events.get('pointerleave')();
  assert.ok(!app.element('skill-warm-memory').classList.contains('is-prereq'));
});


test('the ash grove tab appears at the second rebirth and its helpers run from the main loop', () => {
  const base = { ...game.createState(NOW, 21), rebirthCount: 1, savedAt: NOW };
  const early = openApp(base);
  assert.equal(early.element('workshop-tab-grove').hidden, true);

  const app = openApp({ ...base, rebirthCount: 2, totalRebirthPoints: 2, embers: 5000 });
  assert.equal(app.element('workshop-tab-grove').hidden, false);
  app.click('workshop-tab-grove');
  assert.equal(app.element('workshop-panel-grove').hidden, false);
  assert.equal(app.element('workshop-panel-embers').hidden, true);
  assert.equal(app.element('seedling-cost').textContent, 'FREE');
  app.click('buy-seedling');
  assert.equal(app.saved().seedling, 1);
  assert.equal(app.element('stewardEmber-card').hidden, true);

  // A hired ember steward buys from the ember workshop on its own.
  const helped = openApp({ ...base, rebirthCount: 2, embers: 5000, seedling: 5, stewardEmber: 1 });
  helped.click('workshop-tab-grove');
  assert.equal(helped.element('toggle-autoEmber').getAttribute('aria-pressed'), 'true');
  helped.frame(5000);
  helped.autosave();
  assert.ok(helped.saved().bellows > 0, 'steward bought bellows');
  helped.click('toggle-autoEmber');
  assert.equal(helped.saved().autoEmber, false);
  assert.equal(helped.element('toggle-autoEmber').getAttribute('aria-pressed'), 'false');

  // The rebirth keeper rebirths when switched on and enough points are available.
  const kept = openApp({ ...base, rebirthCount: 2, emberOak: 1, rebirthKeeper: 1, blueUnlocked: true, blueFlames: 1000, lifetimeBlue: 1000 });
  kept.click('workshop-tab-grove');
  kept.input('keeper-target', '1'); kept.element('keeper-target').events.get('change')({ target: kept.element('keeper-target') });
  kept.click('toggle-autoRebirth');
  assert.equal(kept.saved().autoRebirth, true);
  kept.frame(50);
  const after = kept.saved();
  assert.equal(after.rebirthCount, 3); assert.equal(after.autoRebirths, 1); assert.equal(after.blueFlames, 0);
  assert.match(kept.element('toast').textContent, /rebirth keeper began a new life/);
});
