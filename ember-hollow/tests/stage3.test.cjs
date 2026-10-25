const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');
const NOW = 1_800_000_000_000;
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, a + ' ≉ ' + b);
function grove(extra) {
  const state = game.createState(NOW, 11);
  Object.assign(state, { rebirthCount: 2, totalRebirthPoints: 2 }, extra || {});
  return state;
}

test('the grove opens at the second rebirth and the first seedling is free', () => {
  const early = game.createState(NOW, 1); early.rebirthCount = 1;
  assert.equal(game.isGroveVisible(early), false);
  for (const kind of game.GROVE_KINDS) assert.equal(game.isUpgradeVisible(early, kind), false, kind);
  const state = grove();
  assert.equal(game.isGroveVisible(state), true);
  assert.equal(game.getUpgradeCost(state, 'seedling'), 0);
  assert.equal(game.buyUpgrade(state, 'seedling'), true);
  assert.equal(state.seedling, 1); assert.equal(state.ash, 0);
  assert.equal(game.getUpgradeCost(state, 'seedling'), Math.ceil(10 * 1.8));
  near(game.ashRate(state), .1 * 1.1); // 0.1 base × (1 + 5% per rebirth × 2)
});

test('later grove items reveal step by step', () => {
  const state = grove();
  const shown = () => game.GROVE_KINDS.filter(kind => game.isUpgradeVisible(state, kind));
  assert.deepEqual(shown(), ['seedling', 'fertileAsh']);
  state.seedling = 5; assert.deepEqual(shown(), ['seedling', 'ashTree', 'fertileAsh', 'stewardEmber']);
  state.ashTree = 1; assert.ok(shown().includes('blueLoam') && shown().includes('stewardBlue') && !shown().includes('emberOak'));
  state.ashTree = 5; assert.ok(shown().includes('emberOak'));
  state.emberOak = 1; assert.ok(shown().includes('canopy') && shown().includes('rebirthKeeper'));
});

test('ash accrues while away, is boosted by canopy, and never resets on rebirth', () => {
  const state = grove({ seedling: 10, ashTree: 2, canopy: 2, blueUnlocked: true, blueFlames: 5000 });
  const rate = game.ashRate(state);
  near(rate, (game.groveRate(state, 'seedling') + game.groveRate(state, 'ashTree') + game.groveRate(state, 'emberOak')));
  const saved = game.serialize(state, NOW);
  const restored = game.restore(saved, NOW + 3600 * 1000);
  near(restored.state.ash, rate * 3600, 1e-6);
  near(restored.state.lifetimeAsh, rate * 3600, 1e-6);
  const before = { ash: restored.state.ash, seedling: 10, ashTree: 2, canopy: 2 };
  assert.ok(game.rebirth(restored.state, NOW) > 0);
  for (const [field, value] of Object.entries(before)) near(restored.state[field], value, 1e-6);
});

test('grove gifts boost the earlier stages', () => {
  const state = grove({ bellows: 4, sprites: 3, blueUnlocked: true, blueYieldLevel: 2 });
  const click = game.clickPower(state), auto = game.autoRate(state), drop = game.blueYield(state);
  state.fertileAsh = 2; state.blueLoam = 3;
  near(game.clickPower(state), click * 1.5);
  near(game.autoRate(state), auto * 1.5);
  near(game.blueYield(state), drop * 1.6);
  // Grove prices ignore run discounts from skills.
  state.skills = { 'warm-memory': 1, 'patient-fire': 1, 'careful-spending': 5 }; state.skillRevision++;
  assert.equal(game.getUpgradeCost(state, 'fertileAsh'), Math.ceil(50 * Math.pow(2.6, 2)));
});

test('the ember steward buys at its interval, can be switched off, and never bursts after a pause', () => {
  const state = grove({ embers: 5000, stewardEmber: 1 });
  assert.equal(game.stewardInterval(1), 5); assert.equal(game.stewardInterval(5), 1);
  assert.equal(game.automate(state, 4, NOW).embers, 0);
  const events = game.automate(state, 1, NOW);
  assert.ok(events.embers > 0); assert.ok(state.bellows > 0);
  const spent = 5000 - state.embers;
  assert.ok(spent > 0);
  game.setAutomation(state, { autoEmber: false });
  state.embers = 1e6;
  assert.equal(game.automate(state, 60, NOW).embers, 0);
  game.setAutomation(state, { autoEmber: true });
  // A ten-minute pause gives one activation, not 120.
  const after = game.automate(state, 600, NOW);
  assert.ok(after.embers > 0 && after.embers <= 25);
});

test('the blue steward never spends more than a quarter of held blue flames on one purchase', () => {
  const state = grove({ blueUnlocked: true, blueFlames: 100, stewardBlue: 5, autoEmber: false, embers: 0 });
  const events = game.automate(state, 1, NOW);
  assert.ok(events.blue > 0);
  // Cobalt lens costs 3, 5, 9, 14, 23...: each purchase must have been ≤ 25% of the balance at the time.
  assert.ok(state.blueFlames >= 100 * .75 ** events.blue - 1e-9);
  const poor = grove({ blueUnlocked: true, blueFlames: 11, stewardBlue: 5 });
  assert.equal(game.automate(poor, 1, NOW).blue, 0); // the cheapest (3) is more than 25% of 11
  // Ember-priced blue items (Blue spark, siphon) only need to be affordable.
  const unlock = grove({ draft: 1, embers: 150000, stewardBlue: 1 });
  game.automate(unlock, 5, NOW);
  assert.equal(unlock.blueUnlocked, true);
});

test('the rebirth keeper waits for the chosen number of points and counts its rebirths', () => {
  const state = grove({ rebirthKeeper: 1, blueUnlocked: true, blueFlames: 3500, totalRebirthPoints: 0 });
  assert.equal(game.automate(state, 1, NOW).rebirth, 0); // keeper hired but switched off by default
  game.setAutomation(state, { autoRebirth: true, autoRebirthTarget: 3 });
  assert.equal(game.automate(state, 1, NOW).rebirth, 0); // 3,500 buys only 2 points (1,000 + 2,000)
  state.blueFlames = 7000;
  assert.equal(game.automate(state, 1, NOW).rebirth, 3);
  assert.equal(state.autoRebirths, 1); assert.equal(state.rebirthCount, 3); assert.equal(state.blueFlames, 0);
  game.setAutomation(state, { autoRebirthTarget: -5 }); assert.equal(state.autoRebirthTarget, 1);
  game.setAutomation(state, { autoRebirthTarget: 99999 }); assert.equal(state.autoRebirthTarget, 1000);
});

test('grove and automation fields save, load, sanitize, and default for older saves', () => {
  const state = grove({ ash: 123.5, lifetimeAsh: 999, seedling: 7, canopy: 2, stewardEmber: 3, rebirthKeeper: 1, autoEmber: false, autoRebirth: true, autoRebirthTarget: 4, autoRebirths: 2 });
  const loaded = game.restore(game.serialize(state, NOW), NOW).state;
  for (const field of ['ash', 'lifetimeAsh', 'seedling', 'canopy', 'stewardEmber', 'rebirthKeeper', 'autoEmber', 'autoRebirth', 'autoRebirthTarget', 'autoRebirths']) assert.equal(loaded[field], state[field], field);
  const raw = JSON.parse(game.serialize(state, NOW));
  for (const field of ['ash', 'seedling', 'autoEmber', 'autoRebirth', 'autoRebirthTarget']) delete raw[field];
  raw.stewardBlue = 77; raw.canopy = -3;
  const clean = game.sanitize(raw, NOW);
  assert.equal(clean.ash, 0); assert.equal(clean.seedling, 0); assert.equal(clean.autoEmber, true); assert.equal(clean.autoRebirth, false);
  assert.equal(clean.autoRebirthTarget, 1); assert.equal(clean.stewardBlue, 5); assert.equal(clean.canopy, 0);
});

test('pacing guard: the grove is a slow layer, not an instant win', () => {
  const state = grove();
  game.buyUpgrade(state, 'seedling');
  let seconds = 0, emberSteward = null, keeper = null;
  while (seconds < 12 * 3600) {
    game.tick(state, 10); seconds += 10;
    for (let n = 0; n < 10; n++) {
      let best = null, bestCost = Infinity;
      for (const kind of game.GROVE_KINDS) {
        if (!game.isUpgradeVisible(state, kind)) continue;
        const cost = game.getUpgradeCost(state, kind);
        if (Number.isFinite(cost) && cost <= state.ash && cost < bestCost) { bestCost = cost; best = kind; }
      }
      if (!best) break; game.buyUpgrade(state, best);
    }
    if (state.stewardEmber && emberSteward === null) emberSteward = seconds;
    if (state.rebirthKeeper && keeper === null) keeper = seconds;
  }
  assert.ok(emberSteward > 5 * 60 && emberSteward < 90 * 60, 'ember steward at ' + emberSteward + 's');
  assert.ok(keeper > 90 * 60, 'rebirth keeper at ' + keeper + 's');
  assert.ok(state.fertileAsh < 20, 'fertile ash maxed within 12 hours');
  assert.ok(game.ashRate(state) < 1e6);
});
