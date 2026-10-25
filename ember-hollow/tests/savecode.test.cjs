const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');
const SaveCode = require('../savecode.js');
const NOW = 1_800_000_000_000;

test('a save code round-trips a full save exactly', () => {
  const state = game.createState(NOW, 3);
  Object.assign(state, { embers: 1234.5, bellows: 7, sprites: 3, blueUnlocked: true, blueFlames: 42, rebirthCount: 2,
    totalRebirthPoints: 3, rebirthPoints: 1, skills: { 'warm-memory': 2 }, totalEarned: 99999 });
  const json = game.serialize(state, NOW);
  const code = SaveCode.encode(json);
  assert.ok(code.startsWith('EMBER1:'));
  assert.ok(/^[A-Za-z0-9+/=:A-Z1]+$/.test(code));
  assert.deepEqual(SaveCode.decode(code, game.VERSION), JSON.parse(json));
  // Whitespace and line breaks from e-mail or chat are tolerated; raw JSON files work too.
  assert.deepEqual(SaveCode.decode('  ' + code.slice(0, 20) + '\n' + code.slice(20) + '\n', game.VERSION), JSON.parse(json));
  assert.deepEqual(SaveCode.decode(json, game.VERSION), JSON.parse(json));
});

test('bad save codes are rejected with a clear message', () => {
  const cases = [
    ['', /Paste a save code/],
    ['hello there', /does not look like an Ember Hollow save code/],
    ['EMBER1:%%%%', /characters that do not belong/],
    ['EMBER1:' + Buffer.from('{not json').toString('base64'), /damaged or incomplete/],
    ['EMBER1:' + Buffer.from('[1,2,3]').toString('base64'), /not an Ember Hollow save/],
    ['{"version": 99, "embers": 5}', /newer version/],
    ['x'.repeat(300000), /far too long/]
  ];
  for (const [input, message] of cases) assert.throws(() => SaveCode.decode(input, game.VERSION), message, input.slice(0, 30));
});

test('save file names carry the date', () => {
  assert.equal(SaveCode.fileName(new Date(2026, 9, 5)), 'ember-hollow-save-2026-10-05.txt');
});
