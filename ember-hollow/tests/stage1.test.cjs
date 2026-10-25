'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');
const NOW = 1700000000000;
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, actual + ' should equal ' + expected);

function wealthy() { const state = game.createState(NOW, 1); state.embers = 1e9; return state; }

test('discoveries appear through ownership and hidden upgrades cannot be bought through wealth alone', () => {
  const state = wealthy();
  assert.equal(game.isUpgradeVisible(state, 'bellows'), true);
  for (const kind of ['sprite', 'kindling', 'kiln', 'hearth', 'charcoal', 'draft', 'blueUnlock']) {
    assert.equal(game.isUpgradeVisible(state, kind), false, kind + ' should be hidden');
    assert.equal(game.buyUpgrade(state, kind), false, kind + ' must reject hidden purchases');
  }
  assert.equal(game.isBlueStageVisible(state), false); assert.equal(game.isRebirthVisible(state), false);
  assert.equal(game.buyUpgrade(state, 'bellows'), true);
  assert.equal(game.isUpgradeVisible(state, 'sprite'), true); assert.equal(game.isUpgradeVisible(state, 'kindling'), true);
  assert.equal(game.isUpgradeVisible(state, 'kiln'), false);
  assert.equal(game.buyUpgrade(state, 'sprite'), true);
  assert.equal(state.sprites, 1); assert.equal(game.productionRate(state, 'sprite'), .5);
  assert.equal(game.isUpgradeVisible(state, 'kiln'), true); assert.equal(game.isUpgradeVisible(state, 'hearth'), true);
  assert.equal(game.isUpgradeVisible(state, 'charcoal'), false);
  assert.equal(game.buyUpgrade(state, 'kiln'), true);
  assert.equal(game.isUpgradeVisible(state, 'charcoal'), true); assert.equal(game.isUpgradeVisible(state, 'draft'), false);
  assert.equal(game.buyUpgrade(state, 'charcoal'), true);
  assert.equal(game.isUpgradeVisible(state, 'draft'), true);
  assert.equal(game.isBlueStageVisible(state), false);
  assert.equal(game.buyUpgrade(state, 'draft'), true);
  assert.equal(game.isBlueStageVisible(state), true); assert.equal(game.isUpgradeVisible(state, 'blueUnlock'), true);
  assert.equal(game.getUpgradeCost(state, 'blueUnlock'), 100000);
  assert.equal(game.buyUpgrade(state, 'blueUnlock'), true);
  assert.equal(game.isRebirthVisible(state), true);
});

test('blue discovery rejects insufficient 100k balances and advanced blue cards need the unlock', () => {
  const state = wealthy(); state.draft = 1; state.embers = 99999;
  state.blueFlames = 1e6;
  for (const kind of ['blueChance', 'blueYield', 'blueSiphon']) {
    assert.equal(game.isUpgradeVisible(state, kind), false);
    assert.equal(game.buyUpgrade(state, kind), false);
  }
  assert.equal(game.buyUpgrade(state, 'blueUnlock'), false);
  state.embers = 100000;
  assert.equal(game.buyUpgrade(state, 'blueUnlock'), true);
  assert.equal(state.embers, 0); assert.equal(game.blueChance(state), .01);
  assert.equal(game.isUpgradeVisible(state, 'blueChance'), true);
});

test('four flame-stage upgrades give the displayed marginal gains without coupling click strength to sprites', () => {
  const state = wealthy(); state.bellows = 1; state.sprites = 1; state.kiln = 1;
  near(game.clickPower(state), 2); near(game.autoRate(state), 10.5);
  let before = game.clickPower(state), gain = game.upgradeGain(state, 'kindling');
  near(gain, .4); assert.equal(game.buyUpgrade(state, 'kindling'), true);
  near(game.clickPower(state) - before, gain); near(game.autoRate(state), 10.5);
  before = game.autoRate(state); gain = game.upgradeGain(state, 'hearth');
  near(gain, 1.575); assert.equal(game.buyUpgrade(state, 'hearth'), true);
  near(game.autoRate(state) - before, gain); near(game.clickPower(state), 2.4);
  before = game.productionRate(state, 'kiln'); gain = game.upgradeGain(state, 'charcoal');
  near(gain, 2.875); assert.equal(game.buyUpgrade(state, 'charcoal'), true);
  near(game.productionRate(state, 'kiln') - before, gain); near(game.productionRate(state, 'sprite'), .575);
  const clicks = game.clickPower(state), auto = game.autoRate(state); gain = game.upgradeGain(state, 'draft');
  assert.equal(game.buyUpgrade(state, 'draft'), true);
  near(game.clickPower(state) - clicks, gain); near(game.clickPower(state), clicks * 1.1); near(game.autoRate(state), auto * 1.1);
  before = game.clickPower(state); gain = game.upgradeGain(state, 'bellows');
  assert.equal(game.buyUpgrade(state, 'bellows'), true); near(game.clickPower(state) - before, gain);
  before = game.productionRate(state, 'sprite'); gain = game.upgradeGain(state, 'sprite');
  assert.equal(game.buyUpgrade(state, 'sprite'), true); near(game.productionRate(state, 'sprite') - before, gain);
});

test('version three saves retain blue progression, rebirth records, permanent skills, and owned items', () => {
  const old = { version: 3, embers: 321, sprites: 3, kiln: 2, bellows: 4, blueUnlocked: true,
    blueFlames: 42.5, blueChanceLevel: 2, blueYieldLevel: 3, blueSiphon: 4, lifetimeBlue: 987,
    rebirthPoints: 2, totalRebirthPoints: 4, rebirthCount: 2, skills: { 'warm-memory': 1, 'forest-bond': 1 },
    totalEarned: 123456, manualClicks: 678, playedSeconds: 321, runEmbers: 999, runBlue: 20, runClicks: 50, runSeconds: 60,
    savedAt: NOW, rngState: 1234, blueRollProgress: .75 };
  const state = game.restore(old, NOW).state;
  assert.equal(state.version, 4);
  for (const field of ['embers', 'sprites', 'kiln', 'bellows', 'blueUnlocked', 'blueFlames', 'blueChanceLevel', 'blueYieldLevel', 'blueSiphon', 'lifetimeBlue', 'rebirthPoints', 'totalRebirthPoints', 'rebirthCount', 'totalEarned', 'manualClicks', 'playedSeconds', 'runEmbers', 'runBlue', 'runClicks', 'runSeconds', 'rngState', 'blueRollProgress']) assert.equal(state[field], old[field], field);
  assert.deepEqual(state.skills, old.skills);
  for (const field of ['kindling', 'hearth', 'charcoal', 'draft']) assert.equal(state[field], 0);
  assert.equal(game.isBlueStageVisible(state), true); assert.equal(game.isUpgradeVisible(state, 'kiln'), true);
  near(game.productionRate(state, 'sprite'), 1.66 * 1.15 * 1.15); // Forest bond × Warm memory
});

test('new stage levels persist through saves and reset on rebirth without a free sprite', () => {
  const state = wealthy(); Object.assign(state, { bellows: 2, sprites: 2, kiln: 1, kindling: 3, hearth: 4, charcoal: 2, draft: 1, blueUnlocked: true, blueFlames: 1000, lifetimeBlue: 1000 });
  const loaded = game.restore(game.serialize(state, NOW), NOW).state;
  for (const field of ['kindling', 'hearth', 'charcoal', 'draft']) assert.equal(loaded[field], state[field]);
  assert.equal(game.rebirth(loaded, NOW), 1);
  for (const field of ['bellows', 'sprites', 'kiln', 'kindling', 'hearth', 'charcoal', 'draft', 'blueFlames']) assert.equal(loaded[field], 0);
  assert.equal(game.autoRate(loaded), 0); assert.equal(game.clickPower(loaded), 1);
  assert.equal(game.isUpgradeVisible(loaded, 'kiln'), false);
  assert.equal(game.isBlueStageVisible(loaded), true, 'reborn players retain knowledge of the blue stage');
});

test('a permanent sprite starter grants the unlock only on the next rebirth', () => {
  const state = wealthy(); state.rebirthCount = 1; state.rebirthPoints = 100; state.totalRebirthPoints = 0; state.blueFlames = 1000;
  assert.equal(game.buySkill(state, 'warm-memory'), true);
  assert.equal(game.buySkill(state, 'forest-bond'), true);
  assert.equal(game.buySkill(state, 'forest-bond'), true);
  assert.equal(game.buySkill(state, 'sprite-memory'), true);
  assert.equal(state.sprites, 0); assert.equal(game.autoRate(state), 0);
  state.blueFlames = 1000;
  assert.equal(game.rebirth(state, NOW), 1);
  assert.equal(state.sprites, 1); near(game.productionRate(state, 'sprite'), .5 * 1.3 * 1.15);
  assert.equal(game.isUpgradeVisible(state, 'kiln'), true);
});
