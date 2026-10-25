(function (root, factory) {
  'use strict';
  const catalog = typeof module === 'object' && module.exports ? require('./skills.js') : root.EmberSkills;
  const api = factory(catalog);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EmberGame = api;
})(typeof window !== 'undefined' ? window : null, function (Skills) {
  'use strict';
  const VERSION = 4, MAX = Number.MAX_SAFE_INTEGER, MAX_LEVEL = 100;
  const OFFLINE_LIMIT = 8 * 60 * 60, PURCHASE_EPSILON = 1e-8;
  const UPGRADES = Object.freeze({
    bellows: { field: 'bellows', baseCost: 15, multiplier: 1.55, currency: 'embers', maxLevel: 100 },
    sprite: { field: 'sprites', baseCost: 60, multiplier: 1.7, currency: 'embers', gainBase: .5, gainGrowth: 1.1, maxLevel: 100 },
    kiln: { field: 'kiln', baseCost: 600, multiplier: 1.9, currency: 'embers', gainBase: 10, gainGrowth: 1.1, maxLevel: 100 },
    kindling: { field: 'kindling', baseCost: 150, multiplier: 1.75, currency: 'embers', maxLevel: 25 },
    hearth: { field: 'hearth', baseCost: 1000, multiplier: 1.8, currency: 'embers', maxLevel: 25 },
    charcoal: { field: 'charcoal', baseCost: 7500, multiplier: 1.85, currency: 'embers', maxLevel: 25 },
    draft: { field: 'draft', baseCost: 20000, multiplier: 1.95, currency: 'embers', maxLevel: 25 },
    blueUnlock: { field: 'blueUnlocked', baseCost: 100000, multiplier: 1, currency: 'embers', maxLevel: 1 },
    blueChance: { field: 'blueChanceLevel', baseCost: 3, multiplier: 1.65, currency: 'blueFlames', maxLevel: 48 },
    blueYield: { field: 'blueYieldLevel', baseCost: 5, multiplier: 1.7, currency: 'blueFlames', maxLevel: 100 },
    blueSiphon: { field: 'blueSiphon', baseCost: 25000, multiplier: 2.3, currency: 'embers', maxLevel: 100 },
    blueEmbers: { field: 'blueEmbers', baseCost: 10, multiplier: 1.75, currency: 'blueFlames', maxLevel: 25 },
    blueDouble: { field: 'blueDouble', baseCost: 25, multiplier: 1.9, currency: 'blueFlames', maxLevel: 10 },
    blueWisp: { field: 'blueWisp', baseCost: 40, multiplier: 1.85, currency: 'blueFlames', maxLevel: 20 },
    blueScatter: { field: 'blueScatter', baseCost: 250000, multiplier: 2.2, currency: 'embers', maxLevel: 10 },
    // Stage 3 — the Ash Grove. Bought with ash; never reset by rebirth.
    seedling: { field: 'seedling', baseCost: 10, multiplier: 1.8, currency: 'ash', gainBase: .1, gainGrowth: 1.05, maxLevel: 100, firstFree: true },
    ashTree: { field: 'ashTree', baseCost: 500, multiplier: 2.0, currency: 'ash', gainBase: 5, gainGrowth: 1.05, maxLevel: 100 },
    emberOak: { field: 'emberOak', baseCost: 25000, multiplier: 2.2, currency: 'ash', gainBase: 120, gainGrowth: 1.05, maxLevel: 100 },
    fertileAsh: { field: 'fertileAsh', baseCost: 50, multiplier: 2.6, currency: 'ash', maxLevel: 20 },
    blueLoam: { field: 'blueLoam', baseCost: 200, multiplier: 2.6, currency: 'ash', maxLevel: 20 },
    canopy: { field: 'canopy', baseCost: 1000, multiplier: 2.6, currency: 'ash', maxLevel: 20 },
    stewardEmber: { field: 'stewardEmber', baseCost: 100, multiplier: 3, currency: 'ash', maxLevel: 5 },
    stewardBlue: { field: 'stewardBlue', baseCost: 2000, multiplier: 3, currency: 'ash', maxLevel: 5 },
    rebirthKeeper: { field: 'rebirthKeeper', baseCost: 20000, multiplier: 1, currency: 'ash', maxLevel: 1 }
  });
  const GROVE = ['seedling', 'ashTree', 'emberOak', 'fertileAsh', 'blueLoam', 'canopy', 'stewardEmber', 'stewardBlue', 'rebirthKeeper'];
  const GROVE_UNLOCK_REBIRTHS = 2;
  const STEWARD_SHARE = .25; // the blue steward spends at most this share of held blue flames per purchase
  const STAGE2 = ['blueEmbers', 'blueDouble', 'blueWisp', 'blueScatter'];
  const skillById = new Map(Skills.definitions.map(definition => [definition.id, definition]));
  const effectCache = new WeakMap();
  function integer(value, fallback, upper) {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(upper === undefined ? MAX : upper, Math.max(0, Math.floor(value))) : fallback;
  }
  function amount(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.min(MAX, Math.max(0, value)) : fallback;
  }
  function timestamp(value) { return integer(value, Date.now()); }
  function add(a, b) { return Math.min(MAX, a + b); }
  function upgrade(kind) {
    const config = UPGRADES[kind];
    if (!config) throw new TypeError('Unknown upgrade: ' + kind);
    return config;
  }
  const costs = {}, gains = {}, rates = {};
  Object.keys(UPGRADES).forEach(kind => {
    const config = UPGRADES[kind], first = 0;
    costs[kind] = []; gains[kind] = [];
    for (let level = first; level < config.maxLevel; level++) {
      const cost = Math.min(MAX, Math.ceil(config.baseCost * Math.pow(config.multiplier, level - first)));
      costs[kind][level] = config.firstFree && level === 0 ? 0 : cost;
      // Producer gains grow with each level, but more slowly than prices, so every
      // further level takes a little longer to pay for itself and income cannot run away.
      const gain = kind === 'bellows' ? 1 : config.gainBase ? Math.round(config.gainBase * Math.pow(config.gainGrowth, level) * 100) / 100 : kind === 'blueChance' ? .005 : kind === 'blueYield' ? 1.25 : 1;
      gains[kind][level] = gain;
      if (config.gainBase) { rates[kind] = rates[kind] || [0]; rates[kind][level + 1] = add(rates[kind][level], gain); }
    }
  });
  function createState(nowMs, seed) {
    const now = timestamp(nowMs);
    return {
      version: VERSION, embers: 0, bellows: 0, sprites: 0, kiln: 0,
      kindling: 0, hearth: 0, charcoal: 0, draft: 0,
      blueFlames: 0, blueUnlocked: false, blueChanceLevel: 0, blueYieldLevel: 0, blueSiphon: 0,
      blueEmbers: 0, blueDouble: 0, blueWisp: 0, blueScatter: 0,
      ash: 0, lifetimeAsh: 0, seedling: 0, ashTree: 0, emberOak: 0, fertileAsh: 0, blueLoam: 0, canopy: 0,
      stewardEmber: 0, stewardBlue: 0, rebirthKeeper: 0,
      autoEmber: true, autoBlue: true, autoRebirth: false, autoRebirthTarget: 1, autoRebirths: 0,
      stewardEmberProgress: 0, stewardBlueProgress: 0,
      totalEarned: 0, manualClicks: 0, playedSeconds: 0, lifetimeBlue: 0, blueDrops: 0,
      upgradesPurchased: 0, totalBlueSpent: 0, bestBellows: 0, bestSprites: 0, bestKiln: 0,
      runEmbers: 0, runBlue: 0, runClicks: 0, runSeconds: 0,
      rebirthPoints: 0, totalRebirthPoints: 0, rebirthCount: 0, skills: {}, skillRevision: 0,
      rngState: (integer(seed, (now ^ 0x9e3779b9) >>> 0, 0xffffffff) >>> 0) || 1,
      blueRollProgress: 0, savedAt: now
    };
  }
  function sanitize(input, nowMs) {
    const clean = createState(nowMs);
    if (!input || typeof input !== 'object' || Array.isArray(input) || ![1, 2, 3, VERSION].includes(input.version)) return clean;
    clean.embers = amount(input.embers, 0);
    clean.bellows = integer(input.bellows, 0, MAX_LEVEL);
    clean.sprites = integer(input.sprites, input.version < VERSION ? 1 : 0, MAX_LEVEL);
    clean.kiln = input.version >= 2 ? integer(input.kiln, 0, MAX_LEVEL) : 0;
    if (input.version >= VERSION) {
      for (const field of ['kindling', 'hearth', 'charcoal', 'draft']) clean[field] = integer(input[field], 0, 25);
    }
    clean.totalEarned = Math.max(clean.embers, amount(input.totalEarned, 0));
    clean.manualClicks = integer(input.manualClicks, 0);
    clean.playedSeconds = amount(input.playedSeconds, 0);
    clean.savedAt = integer(input.savedAt, clean.savedAt);
    clean.bestBellows = Math.max(clean.bellows, integer(input.bestBellows, clean.bellows, MAX_LEVEL));
    clean.bestSprites = Math.max(clean.sprites, integer(input.bestSprites, clean.sprites, MAX_LEVEL));
    clean.bestKiln = Math.max(clean.kiln, integer(input.bestKiln, clean.kiln, MAX_LEVEL));
    if (input.version < 3) {
      clean.runEmbers = clean.totalEarned; clean.runClicks = clean.manualClicks; clean.runSeconds = clean.playedSeconds;
      return clean;
    }
    clean.blueUnlocked = input.blueUnlocked === true;
    clean.blueChanceLevel = clean.blueUnlocked ? integer(input.blueChanceLevel, 0, 48) : 0;
    clean.blueYieldLevel = clean.blueUnlocked ? integer(input.blueYieldLevel, 0, MAX_LEVEL) : 0;
    clean.blueSiphon = clean.blueUnlocked ? integer(input.blueSiphon, 0, MAX_LEVEL) : 0;
    // Stage-two upgrades were added without a save-version bump: missing fields read as 0.
    STAGE2.forEach(kind => { clean[kind] = clean.blueUnlocked ? integer(input[kind], 0, UPGRADES[kind].maxLevel) : 0; });
    clean.blueFlames = amount(input.blueFlames, 0);
    clean.lifetimeBlue = Math.max(clean.blueFlames, amount(input.lifetimeBlue, 0));
    for (const field of ['blueDrops', 'upgradesPurchased']) clean[field] = integer(input[field], 0);
    clean.totalBlueSpent = amount(input.totalBlueSpent, 0);
    clean.runEmbers = Math.min(clean.totalEarned, amount(input.runEmbers, 0));
    clean.runBlue = Math.min(clean.lifetimeBlue, amount(input.runBlue, 0));
    clean.runClicks = Math.min(clean.manualClicks, integer(input.runClicks, 0));
    clean.runSeconds = Math.min(clean.playedSeconds, amount(input.runSeconds, 0));
    clean.rebirthPoints = integer(input.rebirthPoints, 0);
    clean.totalRebirthPoints = Math.max(clean.rebirthPoints, integer(input.totalRebirthPoints, 0));
    clean.rebirthCount = integer(input.rebirthCount, 0);
    // Stage-three grove fields (added without a save-version bump; missing fields read as defaults).
    clean.ash = amount(input.ash, 0);
    clean.lifetimeAsh = Math.max(clean.ash, amount(input.lifetimeAsh, 0));
    GROVE.forEach(kind => { clean[kind] = integer(input[kind], 0, UPGRADES[kind].maxLevel); });
    clean.autoEmber = input.autoEmber !== false; clean.autoBlue = input.autoBlue !== false; clean.autoRebirth = input.autoRebirth === true;
    clean.autoRebirthTarget = Math.max(1, integer(input.autoRebirthTarget, 1, 1000));
    clean.autoRebirths = integer(input.autoRebirths, 0);
    for (const field of ['stewardEmberProgress', 'stewardBlueProgress']) clean[field] = Math.min(10, amount(input[field], 0));
    if (clean.rebirthCount && input.skills && typeof input.skills === 'object' && !Array.isArray(input.skills)) {
      Skills.definitions.forEach(definition => {
        if (!definition.active) return;
        const level = integer(input.skills[definition.id], 0, definition.maxLevel);
        if (level) clean.skills[definition.id] = level;
      });
      // Remove orphaned children in malformed saves while preserving valid purchases.
      let changed = true;
      while (changed) {
        changed = false;
        Skills.definitions.forEach(definition => {
          if (clean.skills[definition.id] && definition.requires.some(requirement => (clean.skills[requirement.id] || 0) < requirement.level)) {
            delete clean.skills[definition.id]; changed = true;
          }
        });
      }
    }
    clean.rngState = (integer(input.rngState, clean.rngState, 0xffffffff) >>> 0) || 1;
    clean.blueRollProgress = clean.blueUnlocked ? Math.min(1 - Number.EPSILON, amount(input.blueRollProgress, 0)) : 0;
    return clean;
  }
  function effects(state) {
    const cached = effectCache.get(state);
    if (cached && cached.skills === state.skills && cached.revision === state.skillRevision) return cached.value;
    const rank = id => integer(state.skills && state.skills[id], 0, 5);
    const value = Object.freeze({
      emberHeart: 1 + .25 * rank('ember-heart'),
      flickerTouch: .01 * rank('flicker-touch'),
      rebirthEcho: .02 * rank('rebirth-echo'),
      charcoalBonus: .05 * rank('deep-coals'),
      siphonMultiplier: 1 + .25 * rank('wisp-friend'),
      blueCostMultiplier: 1 - .05 * rank('azure-insight'),
      doubleBonus: .05 * rank('twin-sparks'),
      carryFraction: .05 * rank('gathered-moments'),
      startingKindling: rank('kindling-memory'),
      startingHearth: rank('hearthstone-memory'),
      startingKiln: rank('kiln-memory'),
      startingCharcoal: rank('charcoal-memory'),
      startingLens: rank('lens-memory'),
      startingSiphon: rank('siphon-memory'),
      startingBlue: 25 * rank('sapphire-start'),
      clickMultiplier: 1 + .15 * rank('steady-hands'),
      spriteMultiplier: 1 + .15 * rank('forest-bond'),
      kilnMultiplier: 1 + .15 * rank('kilncraft'),
      autoMultiplier: 1 + .1 * rank('patient-fire'),
      blueChanceBonus: .0025 * rank('lucky-embers'),
      blueYieldMultiplier: 1 + .2 * rank('blue-resonance'),
      costMultiplier: 1 - .02 * rank('careful-spending') - .02 * rank('frugal-fire'),
      offlineBonus: 3600 * rank('long-dreams') + 7200 * rank('deep-sleep'),
      startingEmbers: 50 * rank('warm-memory') + 1000 * rank('blazing-start'),
      startingBellows: rank('bellows-memory'),
      startingSprites: rank('sprite-memory'),
      startingBlueUnlocked: rank('spark-memory') > 0
    });
    effectCache.set(state, { skills: state.skills, revision: state.skillRevision, value: value });
    return value;
  }
  function offlineLimit(state) { return OFFLINE_LIMIT + effects(state).offlineBonus; }
  // One multiplier for everything that boosts both clicks and automation.
  function emberMultiplier(state) {
    const effect = effects(state);
    return (1 + .1 * (state.draft || 0)) * (1 + .25 * (state.blueEmbers || 0)) * effect.emberHeart * (1 + effect.rebirthEcho * (state.rebirthCount || 0)) *
      (1 + .25 * (state.fertileAsh || 0));
  }
  function charcoalPerRank(state) { return .25 + effects(state).charcoalBonus; }
  function baseClick(state) {
    return Math.min(MAX, (1 + state.bellows) * (1 + .2 * (state.kindling || 0)) * emberMultiplier(state) * effects(state).clickMultiplier);
  }
  function productionRate(state, kind) {
    if (kind !== 'sprite' && kind !== 'kiln') throw new TypeError('Unknown producer: ' + kind);
    const effect = effects(state), level = kind === 'sprite' ? state.sprites : state.kiln;
    return Math.min(MAX, rates[kind][level] * effect.autoMultiplier * (1 + .15 * (state.hearth || 0)) * emberMultiplier(state) *
      (kind === 'sprite' ? effect.spriteMultiplier : effect.kilnMultiplier * (1 + charcoalPerRank(state) * (state.charcoal || 0))));
  }
  function autoRate(state) { return add(productionRate(state, 'sprite'), productionRate(state, 'kiln')); }
  // Flicker touch adds a slice of automatic production to every manual click.
  function clickPower(state) { return Math.min(MAX, baseClick(state) + autoRate(state) * effects(state).flickerTouch); }
  function blueChance(state) { return state.blueUnlocked ? Math.min(.25, .01 + .005 * state.blueChanceLevel + effects(state).blueChanceBonus) : 0; }
  function blueYield(state) { return Math.min(MAX, Math.pow(1.25, state.blueYieldLevel) * effects(state).blueYieldMultiplier * (1 + .2 * (state.blueLoam || 0))); }
  // ----- Stage 3: the Ash Grove -----
  function isGroveVisible(state) {
    return !!((state.rebirthCount || 0) >= GROVE_UNLOCK_REBIRTHS || state.lifetimeAsh > 0 || state.seedling > 0);
  }
  function groveRate(state, kind) {
    const level = state[kind] || 0;
    return Math.min(MAX, rates[kind][level] * (1 + .25 * (state.canopy || 0)) * (1 + .05 * (state.rebirthCount || 0)));
  }
  function ashRate(state) { return groveRate(state, 'seedling') + groveRate(state, 'ashTree') + groveRate(state, 'emberOak'); }
  function stewardInterval(rank) { return rank > 0 ? 6 - Math.min(5, rank) : Infinity; }
  function blueDoubleChance(state) { return state.blueUnlocked ? Math.min(.75, .05 * (state.blueDouble || 0) + effects(state).doubleBonus) : 0; }
  function blueRollRate(state) { return state.blueUnlocked ? state.blueSiphon * (1 + .5 * (state.blueWisp || 0)) * effects(state).siphonMultiplier : 0; }
  function clickRolls(state) { return state.blueUnlocked ? 1 + (state.blueScatter || 0) : 0; }
  function grant(state, value) {
    const earned = Math.min(MAX - state.embers, Math.max(0, value));
    state.embers = add(state.embers, earned); state.totalEarned = add(state.totalEarned, earned); state.runEmbers = add(state.runEmbers, earned);
    return earned;
  }
  function grantBlue(state, successes) {
    if (!successes) return 0;
    const doubled = sampleDrops(state, successes, blueDoubleChance(state));
    const earned = Math.min(MAX - state.blueFlames, (successes + doubled) * blueYield(state));
    state.blueFlames = add(state.blueFlames, earned); state.lifetimeBlue = add(state.lifetimeBlue, earned); state.runBlue = add(state.runBlue, earned);
    state.blueDrops = add(state.blueDrops, successes);
    return earned;
  }
  function random(state) {
    let value = state.rngState | 0;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    state.rngState = value >>> 0;
    return (state.rngState + .5) / 4294967296;
  }
  function sampleDrops(state, trials, chance) {
    if (trials <= 0 || chance <= 0) return 0;
    if (chance >= 1) return trials;
    if (trials <= 128) {
      let successes = 0;
      for (let i = 0; i < trials; i++) if (random(state) < chance) successes++;
      return successes;
    }
    // Skip failed trials for rare events; otherwise approximate a large binomial
    // in bounded time. Offline production never loops through hours of ticks.
    if (trials * chance < 30) {
      let successes = 0, position = 0;
      const divisor = Math.log1p(-chance);
      while (position < trials) {
        position += Math.floor(Math.log(random(state)) / divisor) + 1;
        if (position <= trials) successes++;
      }
      return successes;
    }
    const normal = Math.sqrt(-2 * Math.log(random(state))) * Math.cos(2 * Math.PI * random(state));
    return Math.max(0, Math.min(trials, Math.round(trials * chance + normal * Math.sqrt(trials * chance * (1 - chance)))));
  }
  function click(state) {
    state.manualClicks = add(state.manualClicks, 1); state.runClicks = add(state.runClicks, 1);
    const earned = grant(state, clickPower(state));
    if (state.blueUnlocked) grantBlue(state, sampleDrops(state, clickRolls(state), blueChance(state)));
    return earned;
  }
  function upgradeCurrency(kind) { return upgrade(kind).currency; }
  function upgradeLevel(state, kind) { return kind === 'blueUnlock' ? Number(!!state.blueUnlocked) : state[upgrade(kind).field] || 0; }
  function isBlueStageVisible(state) {
    return !!(state.blueUnlocked || state.draft > 0 || state.lifetimeBlue > 0 || state.rebirthCount > 0);
  }
  function isRebirthVisible(state) { return !!(state.blueUnlocked || state.lifetimeBlue > 0 || state.rebirthCount > 0); }
  function isUpgradeVisible(state, kind) {
    upgrade(kind); // Keep unknown upgrade handling consistent with the purchase API.
    if (kind === 'bellows') return true;
    if (GROVE.includes(kind)) {
      if (!isGroveVisible(state)) return false;
      if (state[kind] > 0) return true;
      if (kind === 'seedling' || kind === 'fertileAsh') return true;
      if (kind === 'ashTree' || kind === 'stewardEmber') return state.seedling >= 5;
      if (kind === 'blueLoam' || kind === 'stewardBlue') return state.ashTree > 0;
      if (kind === 'emberOak') return state.ashTree >= 5;
      if (kind === 'canopy' || kind === 'rebirthKeeper') return state.emberOak > 0 || state.stewardBlue > 0;
      return false;
    }
    if (STAGE2.includes(kind)) {
      if (!state.blueUnlocked) return false;
      if (state[kind] > 0) return true;
      if (kind === 'blueEmbers') return state.blueChanceLevel > 0 || state.blueYieldLevel > 0;
      if (kind === 'blueDouble') return state.blueYieldLevel > 0;
      if (kind === 'blueWisp') return state.blueSiphon > 0;
      return state.blueChanceLevel >= 3; // blueScatter
    }
    if (kind.startsWith('blue') && kind !== 'blueUnlock') return state.blueUnlocked;
    const owned = kind === 'sprite' ? state.sprites : state[UPGRADES[kind].field];
    // Existing purchases remain visible when loading older saves.
    if (owned > 0 || owned === true) return true;
    if (kind === 'sprite' || kind === 'kindling') return state.bellows > 0 || state.sprites > 0 || state.kiln > 0;
    if (kind === 'kiln' || kind === 'hearth') return state.sprites > 0;
    if (kind === 'charcoal') return state.kiln > 0;
    if (kind === 'draft') return state.charcoal > 0;
    if (kind === 'blueUnlock') return isBlueStageVisible(state);
    return state.blueUnlocked;
  }
  function getUpgradeCost(state, kind) {
    const config = upgrade(kind), level = kind === 'blueUnlock' ? Number(state.blueUnlocked) : state[config.field];
    if (level >= config.maxLevel || (kind === 'blueChance' && blueChance(state) >= .25)) return Infinity;
    if (config.currency === 'ash') return costs[kind][level]; // grove prices ignore run discounts; the first seedling is free
    const effect = effects(state);
    return Math.max(1, Math.ceil(costs[kind][level] * effect.costMultiplier * (config.currency === 'blueFlames' ? effect.blueCostMultiplier : 1)));
  }
  function upgradeGain(state, kind) {
    const config = upgrade(kind), level = kind === 'blueUnlock' ? Number(state.blueUnlocked) : state[config.field];
    if (level >= config.maxLevel) return 0;
    const effect = effects(state);
    const ember = emberMultiplier(state);
    if (kind === 'bellows') return Math.min(MAX, (1 + .2 * (state.kindling || 0)) * ember * effect.clickMultiplier);
    if (kind === 'sprite') return Math.min(MAX, gains[kind][level] * effect.autoMultiplier * effect.spriteMultiplier * (1 + .15 * (state.hearth || 0)) * ember);
    if (kind === 'kiln') return Math.min(MAX, gains[kind][level] * effect.autoMultiplier * effect.kilnMultiplier * (1 + charcoalPerRank(state) * (state.charcoal || 0)) * (1 + .15 * (state.hearth || 0)) * ember);
    if (kind === 'kindling') return baseClick(state) * .2 / (1 + .2 * state.kindling);
    if (kind === 'hearth') return autoRate(state) * .15 / (1 + .15 * state.hearth);
    if (kind === 'charcoal') return productionRate(state, 'kiln') * charcoalPerRank(state) / (1 + charcoalPerRank(state) * state.charcoal);
    if (kind === 'draft') return baseClick(state) * .1 / (1 + .1 * state.draft);
    if (kind === 'blueEmbers') return .25; // +25 percentage points of ember production
    if (kind === 'blueDouble') return Math.max(0, Math.min(.05, .75 - blueDoubleChance(state)));
    if (kind === 'blueWisp') return state.blueSiphon * .5 * effect.siphonMultiplier;
    if (kind === 'blueScatter') return 1;
    if (kind === 'seedling' || kind === 'ashTree' || kind === 'emberOak') return Math.min(MAX, gains[kind][level] * (1 + .25 * (state.canopy || 0)) * (1 + .05 * (state.rebirthCount || 0)));
    if (kind === 'fertileAsh') return .5;
    if (kind === 'blueLoam') return .2;
    if (kind === 'canopy') return ashRate(state) * .25 / (1 + .25 * state.canopy);
    if (kind === 'stewardEmber' || kind === 'stewardBlue') return level === 0 ? stewardInterval(1) : stewardInterval(level) - stewardInterval(level + 1);
    if (kind === 'blueChance') return Math.max(0, Math.min(.005, .25 - blueChance(state)));
    return gains[kind][level];
  }
  function buyUpgrade(state, kind) {
    const config = upgrade(kind);
    if (!isUpgradeVisible(state, kind)) return false;
    const cost = getUpgradeCost(state, kind);
    if (!Number.isFinite(cost) || state[config.currency] + PURCHASE_EPSILON < cost) return false;
    state[config.currency] = Math.max(0, state[config.currency] - cost);
    if (config.currency === 'blueFlames') state.totalBlueSpent = add(state.totalBlueSpent, cost);
    if (kind === 'blueUnlock') state.blueUnlocked = true;
    else state[config.field] += 1;
    state.upgradesPurchased = add(state.upgradesPurchased, 1);
    state.bestBellows = Math.max(state.bestBellows, state.bellows);
    state.bestSprites = Math.max(state.bestSprites, state.sprites);
    state.bestKiln = Math.max(state.bestKiln, state.kiln);
    return true;
  }
  // Bulk buying. amount is 1, 10, or 'max'. A quote never mutates the real state: it
  // prices successive levels on a scratch copy, so caps and skill discounts apply exactly.
  //   1 / 10 → the next min(amount, levels left) levels; affordable only if all of them are.
  //   'max'  → as many levels as the balance covers; if none, the next single level.
  function bulkQuote(state, kind, amount) {
    const config = upgrade(kind), currency = config.currency;
    const want = amount === 'max' ? Infinity : kind === 'blueUnlock' ? 1 : Math.max(1, Math.floor(Number(amount) || 1));
    const scratch = Object.assign({}, state);
    let count = 0, cost = 0;
    while (count < want) {
      const next = getUpgradeCost(scratch, kind);
      if (!Number.isFinite(next)) break;
      if (amount === 'max' && cost + next > state[currency] + PURCHASE_EPSILON) break;
      cost += next; count++;
      if (kind === 'blueUnlock') { scratch.blueUnlocked = true; break; }
      scratch[config.field] += 1;
    }
    if (amount === 'max' && count === 0) {
      const next = getUpgradeCost(state, kind);
      return { count: Number.isFinite(next) ? 1 : 0, cost: next, affordable: false, maxed: !Number.isFinite(next), currency: currency };
    }
    return { count: count, cost: count ? cost : Infinity, affordable: count > 0 && state[currency] + PURCHASE_EPSILON >= cost,
      maxed: count === 0, currency: currency };
  }
  function buyBulk(state, kind, amount) {
    if (!isUpgradeVisible(state, kind)) return 0;
    const quote = bulkQuote(state, kind, amount);
    if (!quote.affordable) return 0;
    let bought = 0;
    for (let i = 0; i < quote.count; i++) { if (!buyUpgrade(state, kind)) break; bought++; }
    return bought;
  }
  function tick(state, seconds) {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return 0;
    const elapsed = Math.min(seconds, offlineLimit(state));
    state.playedSeconds = add(state.playedSeconds, elapsed); state.runSeconds = add(state.runSeconds, elapsed);
    const earned = grant(state, Math.min(MAX, autoRate(state) * elapsed));
    const trialProgress = state.blueRollProgress + elapsed * blueRollRate(state);
    const trials = Math.floor(trialProgress + 1e-9);
    state.blueRollProgress = Math.max(0, trialProgress - trials);
    if (trials) grantBlue(state, sampleDrops(state, trials, blueChance(state)));
    const ash = Math.min(MAX - state.ash, ashRate(state) * elapsed);
    if (ash > 0) { state.ash = add(state.ash, ash); state.lifetimeAsh = add(state.lifetimeAsh, ash); }
    return earned;
  }
  function getRebirthInfo(state) {
    let points = 0, cost = 0;
    let nextCost = 1000 * Math.pow(2, state.totalRebirthPoints);
    while (Number.isFinite(nextCost) && nextCost <= MAX && cost + nextCost <= state.blueFlames + PURCHASE_EPSILON) {
      cost += nextCost; points++; nextCost *= 2;
    }
    const nextThreshold = Number.isFinite(nextCost) && nextCost <= MAX && cost + nextCost <= MAX ? cost + nextCost : Infinity;
    return { points: points, cost: cost, nextCost: nextCost <= MAX ? nextCost : Infinity, nextThreshold: nextThreshold,
      remaining: Math.max(0, nextThreshold - state.blueFlames), canRebirth: points > 0 };
  }
  function rebirth(state, nowMs) {
    const quote = getRebirthInfo(state);
    if (!quote.canRebirth) return 0;
    state.rebirthPoints = add(state.rebirthPoints, quote.points); state.totalRebirthPoints = add(state.totalRebirthPoints, quote.points);
    state.rebirthCount = add(state.rebirthCount, 1);
    const effect = effects(state), carried = Math.floor(state.embers * effect.carryFraction);
    const blueStart = effect.startingBlueUnlocked;
    Object.assign(state, { embers: 0, bellows: effect.startingBellows, sprites: effect.startingSprites, kiln: effect.startingKiln,
      kindling: effect.startingKindling, hearth: effect.startingHearth, charcoal: effect.startingCharcoal, draft: 0,
      blueFlames: blueStart ? effect.startingBlue : 0, blueUnlocked: blueStart,
      blueChanceLevel: blueStart ? effect.startingLens : 0, blueYieldLevel: 0, blueSiphon: blueStart ? effect.startingSiphon : 0,
      blueEmbers: 0, blueDouble: 0, blueWisp: 0, blueScatter: 0,
      runEmbers: 0, runBlue: 0, runClicks: 0, runSeconds: 0, blueRollProgress: 0, savedAt: timestamp(nowMs) });
    grant(state, effect.startingEmbers + carried);
    state.bestBellows = Math.max(state.bestBellows, state.bellows); state.bestSprites = Math.max(state.bestSprites, state.sprites);
    state.bestKiln = Math.max(state.bestKiln, state.kiln);
    return quote.points;
  }
  // ----- Automation (stage 3). Runs while the game is open; offline progress is unchanged. -----
  const EMBER_AUTO = ['bellows', 'kindling', 'sprite', 'hearth', 'kiln', 'charcoal', 'draft'];
  const BLUE_AUTO = ['blueUnlock', 'blueChance', 'blueYield', 'blueEmbers', 'blueDouble', 'blueSiphon', 'blueWisp', 'blueScatter'];
  // One steward activation: buy the cheapest allowed upgrade repeatedly (up to 25 purchases).
  function stewardPass(state, kinds, allowed) {
    let bought = 0;
    while (bought < 25) {
      let best = null, bestCost = Infinity;
      for (const kind of kinds) {
        if (!isUpgradeVisible(state, kind)) continue;
        const cost = getUpgradeCost(state, kind), currency = UPGRADES[kind].currency;
        if (!Number.isFinite(cost) || state[currency] + PURCHASE_EPSILON < cost || !allowed(kind, cost, currency)) continue;
        // Compare across currencies by share of the balance it would use.
        const weight = cost / Math.max(1, state[currency]);
        if (weight < bestCost) { bestCost = weight; best = kind; }
      }
      if (!best || !buyUpgrade(state, best)) break;
      bought++;
    }
    return bought;
  }
  function automate(state, seconds, nowMs) {
    const events = { embers: 0, blue: 0, rebirth: 0 };
    if (!(seconds > 0) || !isGroveVisible(state)) return events;
    const step = Math.min(seconds, 10);
    const run = (rankField, progressField, enabled, pass) => {
      const rank = state[rankField], interval = stewardInterval(rank);
      if (!rank || !enabled) { state[progressField] = 0; return 0; }
      state[progressField] = Math.min(interval, state[progressField] + step);
      if (state[progressField] + 1e-9 < interval) return 0;
      state[progressField] = 0; // at most one activation per call, so a long pause never bursts
      return pass();
    };
    events.embers = run('stewardEmber', 'stewardEmberProgress', state.autoEmber, () => stewardPass(state, EMBER_AUTO, () => true));
    events.blue = run('stewardBlue', 'stewardBlueProgress', state.autoBlue, () => stewardPass(state, BLUE_AUTO,
      (kind, cost, currency) => currency !== 'blueFlames' || cost <= state.blueFlames * STEWARD_SHARE + PURCHASE_EPSILON));
    if (state.rebirthKeeper > 0 && state.autoRebirth) {
      const quote = getRebirthInfo(state);
      if (quote.canRebirth && quote.points >= state.autoRebirthTarget) {
        events.rebirth = rebirth(state, nowMs);
        if (events.rebirth) state.autoRebirths = add(state.autoRebirths, 1);
      }
    }
    return events;
  }
  function setAutomation(state, changes) {
    if (!changes || typeof changes !== 'object') return;
    for (const field of ['autoEmber', 'autoBlue', 'autoRebirth']) if (typeof changes[field] === 'boolean') state[field] = changes[field];
    if (changes.autoRebirthTarget !== undefined) state.autoRebirthTarget = Math.max(1, integer(Number(changes.autoRebirthTarget), state.autoRebirthTarget, 1000));
  }
  function getSkillInfo(state, id) {
    const definition = skillById.get(id);
    if (!definition) throw new TypeError('Unknown skill: ' + id);
    const level = integer(state.skills[id], 0, definition.maxLevel), maxed = definition.active && level >= definition.maxLevel;
    const blueCost = maxed ? Infinity : Math.ceil(definition.baseBlueCost * Math.pow(1.6, level));
    const pointCost = maxed ? Infinity : Math.ceil(definition.basePointCost * Math.pow(1.5, level));
    let lockedReason = '';
    if (!definition.active) lockedReason = 'Planned skill — not available yet.';
    else if (state.rebirthCount < 1) lockedReason = 'Rebirth once to unlock permanent skills.';
    else if (maxed) lockedReason = 'Fully learned.';
    else {
      const missing = definition.requires.find(requirement => (state.skills[requirement.id] || 0) < requirement.level);
      if (missing) lockedReason = 'Requires ' + skillById.get(missing.id).title + ' rank ' + missing.level + '.';
      else if (state.rebirthPoints < pointCost) lockedReason = 'Requires ' + pointCost + ' rebirth point' + (pointCost === 1 ? '' : 's') + '.';
      else if (state.blueFlames + PURCHASE_EPSILON < blueCost) lockedReason = 'Requires ' + blueCost + ' blue flames.';
    }
    return Object.assign({}, definition, { level: level, maxed: maxed, blueCost: blueCost, pointCost: pointCost,
      lockedReason: lockedReason, canBuy: !lockedReason });
  }
  function buySkill(state, id) {
    const info = getSkillInfo(state, id);
    if (!info.canBuy) return false;
    state.rebirthPoints -= info.pointCost; state.blueFlames = Math.max(0, state.blueFlames - info.blueCost);
    state.totalBlueSpent = add(state.totalBlueSpent, info.blueCost);
    state.skills[id] = info.level + 1; state.skillRevision = add(state.skillRevision, 1);
    effectCache.delete(state);
    return true;
  }
  function serialize(state, nowMs) { state.savedAt = timestamp(nowMs); return JSON.stringify(sanitize(state, state.savedAt)); }
  function restore(json, nowMs) {
    const now = timestamp(nowMs);
    let parsed = null;
    try { parsed = typeof json === 'string' ? JSON.parse(json) : json; } catch (_) {}
    const state = sanitize(parsed, now);
    const offlineSeconds = Math.min(offlineLimit(state), Math.max(0, (now - state.savedAt) / 1000));
    const beforeBlue = state.blueFlames, offlineEarned = tick(state, offlineSeconds);
    state.savedAt = now;
    return { state: state, offlineEarned: offlineEarned, offlineBlue: state.blueFlames - beforeBlue, offlineSeconds: offlineSeconds };
  }
  return Object.freeze({ VERSION, OFFLINE_LIMIT, MAX_LEVEL, createState, sanitize, effects, offlineLimit,
    click, clickPower, baseClick, emberMultiplier, productionRate, autoRate, blueChance, blueYield, blueRollRate, blueDoubleChance, clickRolls,
    upgradeCurrency, upgradeLevel, bulkQuote, buyBulk,
    isGroveVisible, groveRate, ashRate, stewardInterval, automate, setAutomation, GROVE_KINDS: Object.freeze(GROVE.slice()), GROVE_UNLOCK_REBIRTHS, STEWARD_SHARE, UPGRADE_KINDS: Object.freeze(Object.keys(UPGRADES)), getUpgradeCost, upgradeGain, isUpgradeVisible, isBlueStageVisible, isRebirthVisible, buyUpgrade, tick, getRebirthInfo, rebirth,
    getSkillInfo, buySkill, serialize, restore });
});
