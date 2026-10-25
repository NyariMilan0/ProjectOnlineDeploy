const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');
const NOW = 1_800_000_000_000;

function sumOfSingles(state, kind, levels) {
  const copy = JSON.parse(game.serialize(state, NOW)); const scratch = game.sanitize(copy, NOW);
  scratch[game.upgradeCurrency(kind)] = 1e15; let total = 0;
  for (let i = 0; i < levels; i++) { total += game.getUpgradeCost(scratch, kind); game.buyUpgrade(scratch, kind); }
  return total;
}

test('a x10 quote prices exactly ten single purchases and needs all ten to be affordable', () => {
  const state = game.createState(NOW, 1);
  const quote = game.bulkQuote(state, 'bellows', 10);
  assert.equal(quote.count, 10);
  assert.equal(quote.cost, sumOfSingles(state, 'bellows', 10));
  state.embers = quote.cost - 1;
  assert.equal(game.bulkQuote(state, 'bellows', 10).affordable, false);
  assert.equal(game.buyBulk(state, 'bellows', 10), 0);
  assert.equal(state.bellows, 0);
  state.embers = quote.cost;
  assert.equal(game.buyBulk(state, 'bellows', 10), 10);
  assert.equal(state.bellows, 10); assert.ok(state.embers < 1e-6);
  assert.equal(state.upgradesPurchased, 10);
});

test('MAX buys as many levels as the balance covers and quotes one level when none are affordable', () => {
  const state = game.createState(NOW, 1);
  assert.deepEqual([game.bulkQuote(state, 'bellows', 'max').count, game.bulkQuote(state, 'bellows', 'max').affordable], [1, false]);
  state.embers = 1000;
  const quote = game.bulkQuote(state, 'bellows', 'max');
  assert.equal(quote.affordable, true);
  assert.ok(quote.cost <= 1000);
  assert.ok(quote.cost + game.getUpgradeCost(Object.assign({}, state, { bellows: quote.count }), 'bellows') > 1000);
  assert.equal(game.buyBulk(state, 'bellows', 'max'), quote.count);
  near(state.embers, 1000 - quote.cost);
});

test('bulk buying respects level caps, the 25% chance cap, one-time unlocks and hidden cards', () => {
  const capped = game.createState(NOW, 1);
  Object.assign(capped, { bellows: 1, kindling: 23, embers: 1e15 });
  assert.equal(game.bulkQuote(capped, 'kindling', 10).count, 2);
  assert.equal(game.buyBulk(capped, 'kindling', 'max'), 2);
  assert.equal(game.bulkQuote(capped, 'kindling', 'max').maxed, true);
  const blue = game.createState(NOW, 1);
  Object.assign(blue, { blueUnlocked: true, blueChanceLevel: 45, blueFlames: 1e15 });
  assert.equal(game.buyBulk(blue, 'blueChance', 10), 3);
  near(game.blueChance(blue), .25);
  const unlock = game.createState(NOW, 1);
  Object.assign(unlock, { draft: 1, embers: 1e7 });
  assert.equal(game.bulkQuote(unlock, 'blueUnlock', 10).count, 1);
  assert.equal(game.buyBulk(unlock, 'blueUnlock', 'max'), 1);
  assert.equal(unlock.embers, 1e7 - 100000);
  const hidden = game.createState(NOW, 1); hidden.embers = 1e9;
  assert.equal(game.buyBulk(hidden, 'kiln', 'max'), 0);
});

test('quotes never change the real state', () => {
  const state = game.createState(NOW, 1);
  Object.assign(state, { bellows: 3, sprites: 2, embers: 5e5 });
  const before = game.serialize(state, NOW);
  for (const amount of [1, 10, 'max']) for (const kind of ['bellows', 'sprite', 'kiln', 'kindling']) game.bulkQuote(state, kind, amount);
  assert.equal(game.serialize(state, NOW), before);
});

function near(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-6, actual + ' ≉ ' + expected); }
