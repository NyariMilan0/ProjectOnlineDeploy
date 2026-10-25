const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');
const NOW = 1_800_000_000_000;
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e * Math.max(1, Math.abs(b)), a + ' ≉ ' + b);

test('the brazier, forge and beacon reveal in a chain and add to automatic production', () => {
  const state = game.createState(NOW, 1);
  Object.assign(state, { bellows: 1, sprites: 1, embers: 1e7 });
  for (const kind of ['brazier', 'forge', 'beacon']) assert.equal(game.isUpgradeVisible(state, kind), false, kind);
  state.kiln = 1;
  assert.equal(game.isUpgradeVisible(state, 'brazier'), true); assert.equal(game.isUpgradeVisible(state, 'forge'), false);
  const before = game.autoRate(state);
  assert.equal(game.getUpgradeCost(state, 'brazier'), 4000);
  assert.equal(game.upgradeGain(state, 'brazier'), 35);
  assert.equal(game.buyUpgrade(state, 'brazier'), true);
  near(game.autoRate(state), before + 35);
  assert.equal(game.isUpgradeVisible(state, 'forge'), true);
  assert.equal(game.buyUpgrade(state, 'forge'), true); assert.equal(game.isUpgradeVisible(state, 'beacon'), true);
  assert.equal(game.buyUpgrade(state, 'beacon'), true);
  near(game.productionRate(state, 'forge'), 180); near(game.productionRate(state, 'beacon'), 700);
  // Hearth boosts every structure; rebirth clears them.
  state.hearth = 2;
  near(game.productionRate(state, 'beacon'), 700 * 1.3);
  state.blueFlames = 1000; state.blueUnlocked = true;
  game.rebirth(state, NOW);
  assert.deepEqual([state.brazier, state.forge, state.beacon], [0, 0, 0]);
});

test('blue-boosted upgrades cost embers and scale with blue progress', () => {
  const state = game.createState(NOW, 1);
  Object.assign(state, { bellows: 4, sprites: 3, kiln: 2, blueUnlocked: true, blueChanceLevel: 2, blueYieldLevel: 1, blueSiphon: 1, embers: 1e7 });
  for (const kind of ['blueGlow', 'cobaltBellows', 'azureKiln']) assert.equal(game.upgradeCurrency(kind), 'embers');
  // Blue glow: +5% ember production per rank per 100 blue held, counting up to 1,000.
  const click = game.clickPower(state), auto = game.autoRate(state);
  state.blueGlow = 2; state.blueFlames = 300;
  near(game.autoRate(state), auto * 1.3); near(game.clickPower(state), click * 1.3);
  state.blueFlames = 5000; near(game.blueGlowMultiplier(state), 2);
  state.blueGlow = 0; state.blueFlames = 0;
  // Cobalt bellows: +2% clicks per rank for each blue upgrade level owned this life (here 4).
  state.cobaltBellows = 3; near(game.clickPower(state), click * (1 + .02 * 3 * 4)); near(game.autoRate(state), auto);
  state.cobaltBellows = 0;
  // Azure kiln: up to +50% automatic production per rank at 1,000 blue found this life.
  state.azureKiln = 2; state.runBlue = 500; near(game.autoRate(state), auto * 1.5);
  state.runBlue = 4000; near(game.autoRate(state), auto * 2); near(game.clickPower(state), click);
  // Reveal rules and rebirth reset.
  const fresh = game.createState(NOW, 1); fresh.blueUnlocked = true;
  assert.equal(game.isUpgradeVisible(fresh, 'blueGlow'), true);
  assert.equal(game.isUpgradeVisible(fresh, 'cobaltBellows'), false); fresh.blueChanceLevel = 1; assert.equal(game.isUpgradeVisible(fresh, 'cobaltBellows'), true);
  assert.equal(game.isUpgradeVisible(fresh, 'azureKiln'), false); fresh.blueSiphon = 1; assert.equal(game.isUpgradeVisible(fresh, 'azureKiln'), true);
  state.blueFlames = 1000; state.blueGlow = 4; game.rebirth(state, NOW);
  assert.deepEqual([state.blueGlow, state.cobaltBellows, state.azureKiln], [0, 0, 0]);
});

test('Warm memory gives a percentage bonus to all ember production and a 100-ember start per rank', () => {
  const state = game.createState(NOW, 1);
  Object.assign(state, { bellows: 3, sprites: 2, kiln: 1, rebirthCount: 1, rebirthPoints: 50, blueFlames: 1e6 });
  const click = game.clickPower(state), auto = game.autoRate(state);
  game.buySkill(state, 'warm-memory'); game.buySkill(state, 'warm-memory');
  near(game.clickPower(state), click * 1.3); near(game.autoRate(state), auto * 1.3);
  state.blueFlames = 1000; state.totalRebirthPoints = 0; state.blueUnlocked = true;
  game.rebirth(state, NOW);
  assert.equal(state.embers, 200);
});

test('stewards also buy the new structures and blue-boosted upgrades; new fields survive saves', () => {
  const state = game.createState(NOW, 1);
  Object.assign(state, { rebirthCount: 2, seedling: 5, stewardEmber: 5, autoBlue: false, bellows: 30, sprites: 20, kiln: 6, embers: 2e5 });
  for (let i = 0; i < 40; i++) game.automate(state, 1, NOW);
  assert.ok(state.brazier > 0, 'ember steward builds braziers');
  const blue = game.createState(NOW, 1);
  Object.assign(blue, { rebirthCount: 2, ashTree: 1, stewardBlue: 5, autoEmber: false, blueUnlocked: true, embers: 1e6, blueFlames: 0 });
  game.automate(blue, 1, NOW); // cheapest first: a Blue siphon (100K), then Blue glow (150K)
  assert.ok(blue.blueSiphon >= 1 && blue.blueGlow >= 1, 'blue steward buys ember-priced blue items');
  Object.assign(state, { forge: 3, beacon: 2, blueUnlocked: true, blueGlow: 4, cobaltBellows: 2, azureKiln: 1 });
  const loaded = game.restore(game.serialize(state, NOW), NOW).state;
  for (const field of ['brazier', 'forge', 'beacon', 'blueGlow', 'cobaltBellows', 'azureKiln']) assert.equal(loaded[field], state[field], field);
});
