const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');
const skills = require('../skills.js');

const NOW = 1_800_000_000_000;
const near = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, actual + ' ≉ ' + expected);
function blueRun(extra) {
  const state = game.createState(NOW, 12345);
  Object.assign(state, { bellows: 4, sprites: 3, kiln: 2, draft: 1, blueUnlocked: true }, extra || {});
  return state;
}
function learn(state, ranks) {
  state.rebirthCount = Math.max(1, state.rebirthCount);
  state.skills = Object.assign({}, state.skills, ranks);
  state.skillRevision += 1;
  return state;
}

test('stage-two blue upgrades reveal through related purchases and stay hidden before Blue spark', () => {
  const state = blueRun({ blueUnlocked: false });
  for (const kind of ['blueEmbers', 'blueDouble', 'blueWisp', 'blueScatter']) assert.equal(game.isUpgradeVisible(state, kind), false, kind);
  state.blueUnlocked = true;
  for (const kind of ['blueEmbers', 'blueDouble', 'blueWisp', 'blueScatter']) assert.equal(game.isUpgradeVisible(state, kind), false, kind);
  state.blueChanceLevel = 1;
  assert.equal(game.isUpgradeVisible(state, 'blueEmbers'), true);
  assert.equal(game.isUpgradeVisible(state, 'blueScatter'), false);
  state.blueChanceLevel = 3; assert.equal(game.isUpgradeVisible(state, 'blueScatter'), true);
  state.blueYieldLevel = 1; assert.equal(game.isUpgradeVisible(state, 'blueDouble'), true);
  state.blueSiphon = 1; assert.equal(game.isUpgradeVisible(state, 'blueWisp'), true);
  // Wealth alone cannot buy a hidden upgrade.
  const hidden = blueRun({ blueFlames: 1e6, embers: 1e9 });
  assert.equal(game.buyUpgrade(hidden, 'blueWisp'), false);
  assert.equal(game.upgradeCurrency('blueScatter'), 'embers');
  assert.equal(game.upgradeCurrency('blueEmbers'), 'blueFlames');
});

test('Azure embers multiplies both clicks and automation by 25% per rank', () => {
  const state = blueRun({ blueChanceLevel: 1, blueFlames: 1000 });
  const click = game.clickPower(state), auto = game.autoRate(state);
  assert.equal(game.getUpgradeCost(state, 'blueEmbers'), 10);
  assert.equal(game.buyUpgrade(state, 'blueEmbers'), true);
  near(game.clickPower(state), click * 1.25);
  near(game.autoRate(state), auto * 1.25);
  assert.equal(state.blueFlames, 990);
  assert.equal(game.getUpgradeCost(state, 'blueEmbers'), Math.ceil(10 * 1.75));
});

test('Twin flicker doubles roughly its chance of drops and caps at 75% with Twin sparks', () => {
  const state = blueRun({ blueDouble: 10, blueYieldLevel: 0 });
  near(game.blueDoubleChance(state), .5);
  state.blueFlames = 0; state.lifetimeBlue = 0;
  // grantBlue is internal; automatic rolls exercise it through tick().
  state.blueSiphon = 100;
  game.tick(state, 1000); // 100k rolls at 1% → about 1,000 drops → about 1,500 blue flames.
  const ratio = state.blueFlames / state.blueDrops;
  assert.ok(ratio > 1.4 && ratio < 1.6, 'ratio ' + ratio);
  learn(state, { 'warm-memory': 1, 'lucky-embers': 1, 'blue-resonance': 2, 'twin-sparks': 5 });
  near(game.blueDoubleChance(state), .75);
  assert.equal(game.upgradeGain(state, 'blueDouble'), 0);
});

test('Blue wisp and Wisp friend speed up siphon rolls', () => {
  const state = blueRun({ blueSiphon: 4 });
  assert.equal(game.blueRollRate(state), 4);
  near(game.upgradeGain(state, 'blueWisp'), 2);
  state.blueWisp = 2; assert.equal(game.blueRollRate(state), 8);
  learn(state, { 'warm-memory': 1, 'forest-bond': 2, 'sprite-memory': 1, 'wisp-friend': 2 });
  assert.equal(game.blueRollRate(state), 12);
});

test('Spark scatter adds blue rolls to each manual click without changing ember gains', () => {
  const state = blueRun({ blueChanceLevel: 48 });
  assert.equal(game.clickRolls(state), 1);
  state.blueScatter = 9;
  assert.equal(game.clickRolls(state), 10);
  const power = game.clickPower(state);
  let earned = 0;
  for (let i = 0; i < 2000; i++) earned += game.click(state);
  near(earned, power * 2000, 1e-6);
  // 20,000 rolls at 25% → about 5,000 drops.
  assert.ok(state.blueDrops > 4600 && state.blueDrops < 5400, 'drops ' + state.blueDrops);
  assert.equal(game.clickRolls(blueRun({ blueUnlocked: false })), 0);
});

test('Azure insight discounts only blue-flame prices; Frugal fire stacks with Careful spending', () => {
  const state = blueRun({ blueChanceLevel: 2 });
  const emberCost = game.getUpgradeCost(state, 'bellows'), blueCost = game.getUpgradeCost(state, 'blueChance');
  learn(state, { 'warm-memory': 1, 'lucky-embers': 2, 'azure-insight': 5 });
  assert.equal(game.getUpgradeCost(state, 'bellows'), emberCost);
  assert.equal(game.getUpgradeCost(state, 'blueChance'), Math.ceil(Math.ceil(3 * Math.pow(1.65, 2)) * .75));
  learn(state, { 'patient-fire': 1, 'careful-spending': 5, 'frugal-fire': 5 });
  near(game.effects(state).costMultiplier, .8);
  assert.ok(blueCost > game.getUpgradeCost(state, 'blueChance'));
});

test('Flicker touch, Ember heart, Deep coals and Echo of lives change the displayed rates', () => {
  const state = blueRun({ charcoal: 2 });
  const kiln = game.productionRate(state, 'kiln');
  learn(state, { 'warm-memory': 1, 'forest-bond': 1, kilncraft: 2, 'deep-coals': 2 });
  near(game.productionRate(state, 'kiln'), kiln * 1.3 * (1 + .35 * 2) / 1.5, 1e-9);
  const base = game.baseClick(state);
  learn(state, { 'steady-hands': 2, 'ember-heart': 1, 'flicker-touch': 3 });
  near(game.clickPower(state), game.baseClick(state) + game.autoRate(state) * .03);
  assert.ok(game.baseClick(state) > base);
  const before = game.emberMultiplier(state);
  learn(state, { 'patient-fire': 3, 'rebirth-echo': 2 });
  state.rebirthCount = 5;
  near(game.emberMultiplier(state), before * (1 + .04 * 5));
});

test('rebirth grants every starting skill and carries Gathered moments embers', () => {
  const state = blueRun({ embers: 100000, blueFlames: 1000, blueEmbers: 3, blueDouble: 2, blueWisp: 1, blueScatter: 1, blueSiphon: 5 });
  learn(state, {
    'warm-memory': 3, 'blazing-start': 2, 'steady-hands': 1, 'bellows-memory': 1, 'kindling-memory': 2, 'hearthstone-memory': 1,
    'forest-bond': 2, 'sprite-memory': 1, kilncraft: 2, 'kiln-memory': 1, 'deep-coals': 1, 'charcoal-memory': 1,
    'lucky-embers': 1, 'blue-resonance': 1, 'spark-memory': 1, 'sapphire-start': 2, 'lens-memory': 3, 'siphon-memory': 1,
    'patient-fire': 1, 'careful-spending': 1, 'gathered-moments': 2
  });
  assert.equal(game.rebirth(state, NOW + 1000), 1);
  assert.equal(state.embers, 150 + 2000 + 10000);
  Object.entries({ bellows: 1, sprites: 1, kindling: 2, hearth: 1, kiln: 1, charcoal: 1, draft: 0,
    blueUnlocked: true, blueFlames: 50, blueChanceLevel: 3, blueSiphon: 1, blueYieldLevel: 0,
    blueEmbers: 0, blueDouble: 0, blueWisp: 0, blueScatter: 0 }).forEach(([field, value]) => assert.equal(state[field], value, field));
  assert.equal(state.bestKiln, 1); // starting kiln counts toward the best-kiln record
});

test('blue starting skills do nothing without An azure memory', () => {
  const state = blueRun({ blueFlames: 1000 });
  learn(state, { 'warm-memory': 1, 'lucky-embers': 1, 'blue-resonance': 1, 'sapphire-start': 5, 'lens-memory': 3, 'siphon-memory': 3 });
  game.rebirth(state, NOW);
  assert.equal(state.blueUnlocked, false); assert.equal(state.blueFlames, 0);
  assert.equal(state.blueChanceLevel, 0); assert.equal(state.blueSiphon, 0);
});

test('Deep sleep extends offline time beyond Long dreams', () => {
  const state = game.createState(NOW);
  learn(state, { 'warm-memory': 1, 'patient-fire': 2, 'long-dreams': 3, 'deep-sleep': 3 });
  assert.equal(game.offlineLimit(state), game.OFFLINE_LIMIT + 3 * 3600 + 3 * 7200);
});

test('stage-two levels save, load, sanitize, and older saves read them as zero', () => {
  const state = blueRun({ blueEmbers: 4, blueDouble: 3, blueWisp: 2, blueScatter: 1 });
  const loaded = game.restore(game.serialize(state, NOW), NOW).state;
  for (const field of ['blueEmbers', 'blueDouble', 'blueWisp', 'blueScatter']) assert.equal(loaded[field], state[field], field);
  const raw = JSON.parse(game.serialize(state, NOW));
  delete raw.blueEmbers; raw.blueDouble = 999; raw.blueWisp = -4; raw.blueScatter = 'x';
  const clean = game.sanitize(raw, NOW);
  assert.equal(clean.blueEmbers, 0); assert.equal(clean.blueDouble, 10); assert.equal(clean.blueWisp, 0); assert.equal(clean.blueScatter, 0);
  raw.blueUnlocked = false; raw.blueDouble = 5;
  assert.equal(game.sanitize(raw, NOW).blueDouble, 0);
});

test('every playable skill has reachable prerequisites and every prerequisite is learnable first', () => {
  const active = skills.definitions.filter(node => node.active);
  assert.equal(active.length, 30);
  const byId = new Map(active.map(node => [node.id, node]));
  for (const node of active) {
    for (const requirement of node.requires) {
      const target = byId.get(requirement.id);
      assert.ok(target, node.id + ' requires missing ' + requirement.id);
      assert.ok(requirement.level <= target.maxLevel, node.id + ' requirement exceeds max rank');
    }
  }
  // A player with endless currency can learn the whole tree in some order.
  const state = game.createState(NOW);
  Object.assign(state, { rebirthCount: 1, rebirthPoints: 1e12, blueFlames: 1e15 });
  let progress = true;
  while (progress) {
    progress = false;
    for (const node of active) while (game.buySkill(state, node.id)) progress = true;
  }
  for (const node of active) assert.equal(state.skills[node.id], node.maxLevel, node.id);
});

test('pacing guard: a greedy, always-clicking player cannot run income away or skip stage one', () => {
  const state = game.createState(NOW, 7);
  let seconds = 0, blueAt = null;
  while (seconds < 3 * 3600) {
    game.click(state); game.click(state); game.tick(state, 1); seconds++;
    for (let n = 0; n < 20; n++) {
      let best = null, bestCost = Infinity;
      for (const kind of game.UPGRADE_KINDS) {
        if (!game.isUpgradeVisible(state, kind)) continue;
        const cost = game.getUpgradeCost(state, kind), currency = game.upgradeCurrency(kind);
        if (!Number.isFinite(cost) || state[currency] < cost) continue;
        const weighted = currency === 'embers' ? cost : cost * 1000;
        if (weighted < bestCost) { bestCost = weighted; best = kind; }
      }
      if (!best) break;
      game.buyUpgrade(state, best);
    }
    if (state.blueUnlocked && blueAt === null) blueAt = seconds;
  }
  assert.ok(blueAt > 30 * 60, 'Blue spark reached after only ' + blueAt + 's');
  assert.ok(game.autoRate(state) < 1e7, 'automatic income ran away: ' + game.autoRate(state));
});
