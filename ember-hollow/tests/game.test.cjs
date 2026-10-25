'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');
const NOW = 1700000000000;
const near = (actual, expected, epsilon = 1e-7) => assert.ok(Math.abs(actual - expected) <= epsilon, actual + ' should be within ' + epsilon + ' of ' + expected);

// Producer-specific tests prepare only their prerequisite ownership; progression
// tests below exercise real purchases in order.
function spriteState() { const state = game.createState(NOW); state.bellows = 1; state.sprites = 1; return state; }

test('starts without a sprite or passive income and manual bellows still add exactly one', () => {
  const state = game.createState(NOW);
  assert.equal(state.version, 4);
  assert.equal(state.embers, 0);
  assert.equal(state.sprites, 0);
  assert.equal(game.productionRate(state, 'sprite'), 0);
  assert.equal(game.tick(state, 30), 0);
  for (let i = 0; i < 15; i++) game.click(state);
  assert.equal(game.buyUpgrade(state, 'bellows'), true);
  assert.equal(state.embers, 0);
  assert.equal(game.clickPower(state), 2);
  assert.equal(game.click(state), 2);
  assert.equal(state.manualClicks, 16);
  assert.equal(state.totalEarned, 17);
  assert.equal(game.getUpgradeCost(state, 'bellows'), 24);
  assert.equal(game.autoRate(state), 0, 'click upgrades do not unlock passive income');
});

test('the first sprite is an item unlock and later levels grow their gains more slowly than their cost', () => {
  const state = game.createState(NOW);
  state.bellows = 1; state.embers = 1000;
  const expected = [[60, 0.5, .5], [102, 0.55, 1.05], [174, 0.61, 1.66]];
  expected.forEach(([cost, gain, rate], index) => {
    assert.equal(game.getUpgradeCost(state, 'sprite'), cost);
    assert.equal(game.upgradeGain(state, 'sprite'), gain);
    assert.equal(game.buyUpgrade(state, 'sprite'), true);
    assert.equal(state.sprites, index + 1);
    near(game.productionRate(state, 'sprite'), rate);
  });
  state.bellows = 80;
  near(game.autoRate(state), 1.66);
  near(game.tick(state, 0.5), .83);
});

test('the kiln is a more expensive and stronger automation tier after the sprite', () => {
  const state = spriteState();
  assert.equal(state.kiln, 0);
  assert.equal(game.productionRate(state, 'kiln'), 0);
  assert.equal(game.getUpgradeCost(state, 'kiln'), 600);
  assert.equal(game.upgradeGain(state, 'kiln'), 10);
  assert.equal(game.buyUpgrade(state, 'kiln'), false);
  state.embers = 2000;
  assert.equal(game.buyUpgrade(state, 'kiln'), true);
  assert.equal(state.kiln, 1);
  assert.equal(state.sprites, 1);
  assert.equal(game.autoRate(state), 10.5);
  assert.equal(game.getUpgradeCost(state, 'kiln'), 1140);
  assert.equal(game.upgradeGain(state, 'kiln'), 11);
  assert.equal(game.buyUpgrade(state, 'kiln'), true);
  assert.equal(game.productionRate(state, 'kiln'), 21);
  assert.equal(game.autoRate(state), 21.5);
});

test('fractional frame income matches one long tick and can afford exact-boundary prices', () => {
  const small = spriteState(), large = spriteState();
  for (let i = 0; i < 1500; i++) game.tick(small, 0.02);
  game.tick(large, 30);
  near(small.embers, large.embers);
  near(small.totalEarned, 15);
  near(small.playedSeconds, 30);
  small.bellows = 0;
  assert.equal(game.buyUpgrade(small, 'bellows'), true);
  near(small.embers, 0);
  const notEnough = game.createState(NOW); notEnough.embers = 14.999;
  assert.equal(game.buyUpgrade(notEnough, 'bellows'), false);
});

test('fractional resources survive saves and offline income requires an owned producer', () => {
  const state = spriteState(); game.tick(state, 0.25);
  const saved = game.serialize(state, NOW), restored = game.restore(saved, NOW + 500);
  assert.equal(restored.offlineEarned, 0.25);
  assert.equal(restored.state.embers, 0.375);
  assert.equal(restored.state.totalEarned, 0.375);
  const long = game.restore(saved, NOW + 48 * 60 * 60 * 1000);
  assert.equal(long.offlineSeconds, 28800);
  assert.equal(long.offlineEarned, 14400);
  assert.equal(long.state.embers, 14400.125);
  assert.equal(long.state.savedAt, NOW + 48 * 60 * 60 * 1000);
  const fresh = game.restore(game.serialize(game.createState(NOW), NOW), NOW + 48 * 3600000);
  assert.equal(fresh.offlineEarned, 0);
  assert.equal(fresh.state.sprites, 0);
});

test('version one saves preserve resources, click counts, and sprite ownership levels', () => {
  const legacy = { version: 1, embers: 123, bellows: 4, sprites: 3, totalEarned: 9876, manualClicks: 234, playedSeconds: 12, autoClicks: 20, autoProgress: 2, savedAt: NOW };
  const restored = game.restore(JSON.stringify(legacy), NOW);
  assert.equal(restored.state.version, 4);
  assert.equal(restored.state.embers, 123);
  assert.equal(restored.state.bellows, 4);
  assert.equal(restored.state.sprites, 3);
  assert.equal(restored.state.kiln, 0);
  assert.equal(restored.state.totalEarned, 9876);
  assert.equal(restored.state.manualClicks, 234);
  assert.equal(restored.offlineEarned, 0);
  assert.equal(game.restore({ ...legacy, sprites: 0 }, NOW).state.sprites, 0);
  near(game.restore(legacy, NOW + 1000).offlineEarned, 1.66);
});

test('invalid saves, missing timestamps, future timestamps, and invalid ticks grant no windfall', () => {
  for (const saved of ['{broken', null, [], { version: 999, embers: 1000 }, { version: 2, embers: 2 }, { version: 1, sprites: 1 }]) assert.equal(game.restore(saved, NOW).offlineEarned, 0);
  assert.equal(game.restore({ version: 999, embers: 1000 }, NOW).state.embers, 0);
  const future = game.createState(NOW + 5000);
  assert.equal(game.restore(future, NOW).offlineEarned, 0);
  for (const seconds of [NaN, Infinity, -1, '3', null, 0]) assert.equal(game.tick(future, seconds), 0);
  assert.equal(future.embers, 0);
  assert.throws(() => game.getUpgradeCost(future, 'unknown'), /Unknown upgrade/);
  assert.throws(() => game.productionRate(future, 'unknown'), /Unknown producer/);
});

test('untrusted values and saturated resources stay finite while producers have valid caps', () => {
  const state = game.sanitize({ version: 4, embers: 1e100, bellows: 1e100, sprites: -20, kiln: 1e100, kindling: 1e100, hearth: -5, charcoal: Infinity, draft: 8.9, totalEarned: Infinity, manualClicks: NaN, playedSeconds: Infinity }, NOW);
  assert.equal(state.embers, Number.MAX_SAFE_INTEGER);
  assert.equal(state.bellows, game.MAX_LEVEL);
  assert.equal(state.sprites, 0);
  assert.equal(state.kiln, game.MAX_LEVEL);
  assert.equal(state.kindling, 25); assert.equal(state.hearth, 0); assert.equal(state.charcoal, 0); assert.equal(state.draft, 8);
  assert.equal(state.totalEarned, Number.MAX_SAFE_INTEGER);
  assert.equal(state.manualClicks, 0);
  assert.equal(game.click(state), 0); assert.equal(game.tick(state, 100), 0);
  assert.equal(game.getUpgradeCost(state, 'bellows'), Infinity);
  assert.equal(game.getUpgradeCost(state, 'kiln'), Infinity);
  assert.equal(game.upgradeGain(state, 'kiln'), 0);
  state.sprites = game.MAX_LEVEL;
  assert.equal(game.getUpgradeCost(state, 'sprite'), Infinity);
  assert.ok(Number.isFinite(game.autoRate(state)));
});

test('a 100000-click burst keeps exact credits without unlocking hidden items by wealth alone', () => {
  const state = game.createState(NOW);
  for (let i = 0; i < 100000; i++) game.click(state);
  assert.equal(state.manualClicks, 100000); assert.equal(state.embers, 100000); assert.equal(state.totalEarned, 100000);
  assert.equal(game.buyUpgrade(state, 'sprite'), false);
  assert.equal(game.buyUpgrade(state, 'bellows'), true);
  assert.equal(game.buyUpgrade(state, 'sprite'), true);
  assert.equal(game.buyUpgrade(state, 'kiln'), true);
  assert.equal(state.manualClicks, 100000);
  assert.equal(state.totalEarned, 100000, 'spending keeps lifetime earnings');
  assert.equal(state.embers, 99325);
});

test('manual and lifetime counters distinguish clicking from owned automatic production', () => {
  const state = spriteState(); state.bellows = 0;
  for (let i = 0; i < 99; i++) game.click(state);
  game.tick(state, 2);
  assert.equal(state.manualClicks, 99); assert.equal(state.totalEarned, 100);
  game.click(state); game.tick(state, 1798);
  assert.equal(state.totalEarned, 1000);
  assert.equal(game.buyUpgrade(state, 'kiln'), true);
  assert.equal(state.totalEarned, 1000); assert.equal(state.manualClicks, 100);
  game.tick(state, 9000 / game.autoRate(state)); near(state.totalEarned, 10000);
});
