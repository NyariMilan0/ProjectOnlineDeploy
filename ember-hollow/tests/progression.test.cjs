'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');
const skills = require('../skills.js');
const NOW = 1700000000000;
const near = (actual, expected, epsilon = 1e-7) => assert.ok(Math.abs(actual - expected) < epsilon, actual + ' should equal ' + expected);
function rich() { const state = game.createState(NOW, 1); state.embers = 1e9; state.blueFlames = 1e9; return state; }
function permanentState() {
  const state = rich(); state.rebirthCount = 1; state.rebirthPoints = 1000; state.totalRebirthPoints = 1000; return state;
}

test('the permanent catalog has 100 positions, 30 real skills, and disabled future nodes', () => {
  assert.equal(skills.definitions.length, 100);
  assert.equal(new Set(skills.definitions.map(node => node.id)).size, 100);
  assert.equal(skills.definitions.filter(node => node.active).length, 30);
  assert.equal(skills.branches.length, 4);
  for (const branch of skills.branches) assert.equal(skills.definitions.filter(node => node.branch === branch.id).length, 25);
  const state = permanentState();
  const future = skills.definitions.find(node => !node.active);
  assert.equal(game.getSkillInfo(state, future.id).canBuy, false);
  assert.equal(game.buySkill(state, future.id), false);
});

test('blue flames unlock for 100000 embers and begin at exactly1% per manual click', () => {
  const state = game.createState(NOW, 1), seed = state.rngState;
  for (let index = 0; index < 100000; index++) game.click(state);
  assert.equal(state.rngState, seed, 'locked blue flames must not roll');
  assert.equal(state.blueFlames, 0);
  assert.equal(game.blueChance(state), 0);
  assert.equal(game.buyUpgrade(state, 'blueSiphon'), false);
  assert.equal(game.upgradeCurrency('blueUnlock'), 'embers');
  assert.equal(game.getUpgradeCost(state, 'blueUnlock'), 100000);
  state.draft = 1;
  assert.equal(game.buyUpgrade(state, 'blueUnlock'), true);
  assert.equal(state.embers, 0);
  assert.equal(game.blueChance(state), .01);
  assert.equal(game.blueYield(state), 1);
  assert.equal(game.getUpgradeCost(state, 'blueUnlock'), Infinity);
  assert.equal(game.buyUpgrade(state, 'blueUnlock'), false);
  game.click(state); // Seed1's first roll is less than1%.
  assert.equal(state.blueFlames, 1);
  assert.equal(state.lifetimeBlue, 1);
  assert.equal(state.blueDrops, 1);
});

test('seeded blue rolls are reproducible and approximate their advertised chance', () => {
  const a = game.createState(NOW, 12345), b = game.createState(NOW, 12345);
  a.blueUnlocked = b.blueUnlocked = true;
  for (let index = 0; index < 100000; index++) { game.click(a); game.click(b); }
  assert.equal(a.blueFlames, b.blueFlames);
  assert.equal(a.rngState, b.rngState);
  assert.ok(a.blueDrops > 850 && a.blueDrops < 1150, '100k1% rolls should land near1000 drops');
  assert.equal(a.manualClicks, 100000);
  assert.equal(a.runClicks, 100000);
  assert.equal(a.embers, 100000);
});

test('chance and yield upgrades spend only blue flames and improve the advertised values', () => {
  const state = rich(); state.blueUnlocked = true; state.blueFlames = 100;
  const fire = state.embers;
  assert.equal(game.upgradeCurrency('blueChance'), 'blueFlames');
  assert.equal(game.getUpgradeCost(state, 'blueChance'), 3);
  assert.equal(game.buyUpgrade(state, 'blueChance'), true);
  assert.equal(state.blueFlames, 97);
  assert.equal(state.embers, fire);
  near(game.blueChance(state), .015);
  assert.equal(game.getUpgradeCost(state, 'blueChance'), 5);
  assert.equal(game.buyUpgrade(state, 'blueYield'), true);
  assert.equal(state.blueFlames, 92);
  assert.equal(game.blueYield(state), 1.25);
  assert.equal(state.totalBlueSpent, 8);
  state.blueChanceLevel = 48;
  assert.equal(game.blueChance(state), .25);
  assert.equal(game.getUpgradeCost(state, 'blueChance'), Infinity);
  assert.equal(game.buyUpgrade(state, 'blueChance'), false);
});

test('blue siphons roll offline without granting manual clicks or looping every frame', () => {
  const state = rich(); state.blueUnlocked = true;
  assert.equal(game.buyUpgrade(state, 'blueSiphon'), true);
  assert.equal(game.blueRollRate(state), 1);
  state.blueChanceLevel = 48; state.blueSiphon = 100; state.blueFlames = 0;
  const before = state.manualClicks;
  const result = game.restore(game.serialize(state, NOW), NOW + 48 * 3600000);
  assert.equal(result.offlineSeconds, 28800);
  assert.equal(result.state.manualClicks, before);
  assert.ok(result.offlineBlue > 700000 && result.offlineBlue < 740000);
  assert.equal(result.state.blueFlames, result.offlineBlue);
  assert.equal(result.state.lifetimeBlue, result.offlineBlue);
  const savedAgain = game.serialize(result.state, NOW + 48 * 3600000);
  assert.equal(game.restore(savedAgain, NOW + 48 * 3600000).offlineBlue, 0);
});

test('fractional auto roll progress and random state survive a save exactly', () => {
  const state = game.createState(NOW, 1); state.blueUnlocked = true; state.blueSiphon = 1;
  game.tick(state, .75);
  assert.equal(state.blueDrops, 0);
  const resumed = game.restore(game.serialize(state, NOW), NOW + 250).state;
  assert.equal(resumed.blueDrops, 1);
  assert.equal(resumed.blueRollProgress, 0);
  const uninterrupted = game.createState(NOW, 1); uninterrupted.blueUnlocked = true; uninterrupted.blueSiphon = 1;
  game.tick(uninterrupted, 1);
  assert.equal(resumed.rngState, uninterrupted.rngState);
  assert.equal(resumed.blueFlames, uninterrupted.blueFlames);
});

test('rebirth points use cumulative exponentially increasing global thresholds', () => {
  const state = game.createState(NOW);
  state.blueFlames = 999;
  assert.equal(game.getRebirthInfo(state).points, 0);
  assert.equal(game.getRebirthInfo(state).nextThreshold, 1000);
  assert.equal(game.rebirth(state, NOW), 0);
  state.blueFlames = 1500;
  assert.deepEqual(game.getRebirthInfo(state), { points: 1, cost: 1000, nextCost: 2000, nextThreshold: 3000, remaining: 1500, canRebirth: true });
  state.blueFlames = 3000;
  assert.equal(game.getRebirthInfo(state).points, 2);
  assert.equal(game.rebirth(state, NOW), 2);
  assert.equal(state.rebirthPoints, 2);
  assert.equal(state.totalRebirthPoints, 2);
  assert.equal(game.getRebirthInfo(state).nextThreshold, 4000);
  state.blueFlames = 4000;
  assert.equal(game.rebirth(state, NOW), 1);
  assert.equal(state.totalRebirthPoints, 3);
  assert.equal(game.getRebirthInfo(state).nextThreshold, 8000);
});

test('rebirth resets run currency and upgrades but preserves lifetime records and purchased skills', () => {
  const state = permanentState(); state.totalRebirthPoints = 0;
  assert.equal(game.buySkill(state, 'warm-memory'), true);
  assert.equal(state.embers, 1e9, 'a starter perk must not grant its currency in the current run');
  assert.equal(game.buySkill(state, 'steady-hands'), true);
  assert.equal(game.buySkill(state, 'bellows-memory'), true);
  state.bellows = 1; state.draft = 1;
  assert.equal(game.buyUpgrade(state, 'blueUnlock'), true);
  assert.equal(game.buyUpgrade(state, 'sprite'), true);
  assert.equal(game.buyUpgrade(state, 'kiln'), true);
  assert.equal(game.buyUpgrade(state, 'blueChance'), true);
  state.blueFlames = 1000; state.lifetimeBlue = 2000;
  game.click(state); game.tick(state, 10);
  const lifetime = state.totalEarned, clicks = state.manualClicks, played = state.playedSeconds, blueLifetime = state.lifetimeBlue;
  const pointsBefore = state.rebirthPoints;
  assert.equal(game.rebirth(state, NOW + 10000), 1);
  assert.equal(state.embers, 50);
  assert.equal(state.blueFlames, 0);
  assert.equal(state.bellows, 1);
  assert.equal(state.sprites, 0);
  assert.equal(state.kiln, 0);
  assert.equal(state.blueUnlocked, false);
  assert.equal(state.blueChanceLevel, 0);
  assert.equal(state.blueSiphon, 0);
  assert.equal(state.runClicks, 0);
  assert.equal(state.runSeconds, 0);
  assert.equal(state.runEmbers, 50);
  assert.equal(state.manualClicks, clicks);
  assert.equal(state.playedSeconds, played);
  assert.equal(state.totalEarned, lifetime + 50);
  assert.equal(state.lifetimeBlue, blueLifetime);
  assert.equal(state.rebirthPoints, pointsBefore + 1);
  assert.equal(state.skills['warm-memory'], 1);
  assert.equal(state.skills['steady-hands'], 1);
  near(game.clickPower(state), 2.3);
  assert.equal(state.bestKiln, 1);
  assert.equal(state.bestSprites, 1);
});

test('permanent skills enforce rebirth, prerequisites, both currencies, and rank caps', () => {
  const state = rich(); state.rebirthPoints = 1000;
  assert.equal(game.buySkill(state, 'warm-memory'), false);
  state.rebirthCount = 1;
  assert.equal(game.buySkill(state, 'steady-hands'), false);
  assert.equal(game.buySkill(state, 'warm-memory'), true);
  assert.equal(game.getSkillInfo(state, 'warm-memory').pointCost, 2);
  assert.equal(game.buySkill(state, 'steady-hands'), true);
  near(game.clickPower(state), 1.15);
  const previousBlue = state.blueFlames;
  assert.equal(game.buySkill(state, 'steady-hands'), true);
  assert.equal(previousBlue - state.blueFlames, 16);
  near(game.clickPower(state), 1.3, 1e-9);
  for (let rank = 2; rank < 5; rank++) assert.equal(game.buySkill(state, 'steady-hands'), true);
  assert.equal(game.getSkillInfo(state, 'steady-hands').maxed, true);
  assert.equal(game.buySkill(state, 'steady-hands'), false);
  const poor = permanentState(); poor.blueFlames = 0;
  game.buySkill(poor, 'warm-memory');
  assert.equal(game.buySkill(poor, 'forest-bond'), false);
  assert.equal(game.getSkillInfo(poor, 'forest-bond').blueCost, 5);
});

test('saved permanent effects, extended offline time, and malformed skill values sanitize safely', () => {
  const state = permanentState();
  state.sprites = 1;
  game.buySkill(state, 'warm-memory'); game.buySkill(state, 'patient-fire'); game.buySkill(state, 'patient-fire');
  game.buySkill(state, 'long-dreams'); game.buySkill(state, 'careful-spending');
  assert.equal(game.offlineLimit(state), 32400);
  near(game.autoRate(state), .6);
  assert.equal(game.getUpgradeCost(state, 'sprite'), 100);
  const loaded = game.restore(game.serialize(state, NOW), NOW + 48 * 3600000);
  assert.equal(loaded.offlineSeconds, 32400);
  near(game.autoRate(loaded.state), .6);
  assert.equal(loaded.state.skills['long-dreams'], 1);
  const malformed = game.sanitize({ ...state, skills: { 'steady-hands': 1e100, 'warm-memory': 2, 'blue-resonance': 5, 'azure-future-4': 10 }, rebirthPoints: Infinity, blueChanceLevel: -4, rngState: 0 }, NOW);
  assert.equal(malformed.skills['steady-hands'], 5);
  assert.equal(malformed.skills['blue-resonance'], undefined);
  assert.equal(malformed.skills['azure-future-4'], undefined);
  assert.equal(malformed.blueChanceLevel, 0);
  assert.equal(malformed.rngState, 1);
  assert.ok(Number.isFinite(game.clickPower(malformed)));
});

test('a full reset creates genuinely empty overall progress, and v2 saves migrate without a blue windfall', () => {
  const old = { version: 2, embers: 123.5, bellows: 2, sprites: 3, kiln: 4, totalEarned: 9000, manualClicks: 100, playedSeconds: 40, savedAt: NOW };
  const migrated = game.restore(old, NOW).state;
  assert.equal(migrated.version, 4); assert.equal(migrated.embers, 123.5); assert.equal(migrated.kiln, 4);
  assert.equal(migrated.runEmbers, 9000); assert.equal(migrated.runClicks, 100);
  assert.equal(migrated.bestKiln, 4); assert.equal(migrated.blueFlames, 0); assert.equal(migrated.lifetimeBlue, 0);
  const reset = game.createState(NOW);
  for (const field of ['embers', 'blueFlames', 'totalEarned', 'manualClicks', 'playedSeconds', 'lifetimeBlue', 'rebirthPoints', 'totalRebirthPoints', 'rebirthCount']) assert.equal(reset[field], 0);
  assert.deepEqual(reset.skills, {});
  assert.equal(reset.sprites, 0);
});

