'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const achievements = require('../achievements.js');
const find = (state, id) => achievements.evaluate(state).find(item => item.id === id);

test('manual achievements use exact click thresholds, independently of earned currency', () => {
  assert.equal(find({ manualClicks: 99, totalEarned: 1e6 }, 'hundred-clicks').unlocked, false);
  assert.equal(find({ manualClicks: 100 }, 'hundred-clicks').unlocked, true);
  assert.equal(find({ manualClicks: 999 }, 'thousand-clicks').unlocked, false);
  assert.equal(find({ manualClicks: 1000 }, 'thousand-clicks').unlocked, true);
});

test('ember goals track lifetime earnings at the exact 1000 and 10000 boundaries', () => {
  for (const [target, id] of [[1000, 'thousand-embers'], [10000, 'ten-thousand-embers']]) {
    assert.equal(find({ totalEarned: target - .01, embers: 1e6 }, id).unlocked, false);
    assert.equal(find({ totalEarned: target, embers: 0 }, id).unlocked, true);
  }
});

test('spending blue flames or resetting run upgrades keeps lifetime achievements', () => {
  const state = {
    blueFlames: 0, lifetimeBlue: 1000, rebirthCount: 1, totalRebirthPoints: 5,
    rebirthPoints: 0, bellows: 0, sprites: 1, kiln: 0,
    bestBellows: 10, bestSprites: 5, bestKiln: 1
  };
  for (const id of ['first-blue', 'hundred-blue', 'thousand-blue', 'first-rebirth', 'five-rebirth-points', 'first-bellows', 'tenth-bellows', 'sprite-five', 'first-kiln']) {
    assert.equal(find(state, id).unlocked, true, id + ' should remain unlocked');
  }
});

test('old saves still evaluate upgrade goals through their original fields', () => {
  const oldSave = { bellows: 10, sprites: 5, kiln: 1 };
  for (const id of ['first-bellows', 'tenth-bellows', 'sprite-five', 'first-kiln']) {
    assert.equal(find(oldSave, id).unlocked, true);
  }
  assert.equal(find({ bestBellows: 0, bellows: 10 }, 'tenth-bellows').unlocked, true);
});

test('blue and rebirth goals require lifetime counters and reject invalid values', () => {
  assert.equal(find({ blueFlames: 1e6, lifetimeBlue: 0 }, 'first-blue').unlocked, false);
  assert.equal(find({ lifetimeBlue: .99 }, 'first-blue').unlocked, false);
  assert.equal(find({ lifetimeBlue: 1 }, 'first-blue').unlocked, true);
  assert.equal(find({ totalRebirthPoints: 4, rebirthPoints: 100 }, 'five-rebirth-points').unlocked, false);
  for (const state of [null, undefined, { manualClicks: NaN, totalEarned: Infinity, lifetimeBlue: -1, rebirthCount: '5' }]) {
    assert.equal(achievements.evaluate(state).some(item => item.unlocked), false);
  }
  assert.equal(achievements.definitions.length, 34);
  assert.equal(Object.isFrozen(achievements.definitions), true);
});
