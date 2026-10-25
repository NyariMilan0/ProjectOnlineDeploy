/* Credits are immediate; rendering, effects, and saving run on separate budgets. */
(function () {
  'use strict';
  const Game = window.EmberGame;
  const Achievements = window.EmberAchievements;
  const Dom = window.EmberDom;
  const SAVE_KEY = 'ember-hollow-save-v1'; // Preserve and migrate existing saves.
  const BACKUP_KEY = 'ember-hollow-save-backup';
  const PREIMPORT_KEY = 'ember-hollow-save-before-import'; // kept until the next import, for "Undo last import"
  const SaveCode = window.EmberSaveCode;
  // Render tiers (ms): counters every tick, cards and panels a few times a second,
  // achievement progress once a second. Purchases and other events force a full render.
  const MEDIUM_RENDER_MS = 250, SLOW_RENDER_MS = 1000, BACKUP_EVERY_MS = 60000;
  const AUDIO_KEY = 'ember-hollow-sound';
  const SETTINGS_KEY = 'ember-hollow-settings-v1';
  let preferences = { sound: false, reducedMotion: false, compact: true, music: true, musicVolume: 20, buyAmount: '1' };
  const BUY_AMOUNTS = ['1', '10', 'max'];
  const EMBER_KINDS = ['bellows', 'kindling', 'sprite', 'hearth', 'kiln', 'charcoal', 'brazier', 'forge', 'beacon', 'draft'];
  const PRODUCER_NAMES = { sprite: 'ember sprite', kiln: 'ember kiln', brazier: 'coal brazier', forge: 'smithy forge', beacon: 'ember beacon' };
  // Value passed to Game.bulkQuote / Game.buyBulk.
  function buyAmount() { return preferences.buyAmount === 'max' ? 'max' : Number(preferences.buyAmount); }
  // Short note fragment for multi-level quotes: " · +10 levels".
  function levelsNote(quote) { return quote.count > 1 ? ' · +' + quote.count + ' levels' : ''; }
  let panels = null;
  const elements = new Map();
  const $ = id => {
    if (!elements.has(id)) elements.set(id, document.getElementById(id));
    return elements.get(id);
  };
  function text(id, value) { Dom.text($(id), value); }
  const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  function format(value) {
    if (!Number.isFinite(value)) return 'MAX';
    if (!preferences.compact) return formatter.format(value);
    if (value < 1000) return formatter.format(value);
    const units = ['', 'K', 'M', 'B', 'T', 'Q'];
    const unit = Math.min(units.length - 1, Math.floor(Math.log10(value) / 3));
    return formatter.format(value / Math.pow(1000, unit)) + units[unit];
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new window.EmberScene($('forest'));
  scene.setReducedMotion(reducedMotion.matches);
  reducedMotion.addEventListener('change', event => scene.setReducedMotion(event.matches || preferences.reducedMotion));
  let storageAvailable = true, saved = null, soundEnabled = false, recoveredFromBackup = false;
  function isUsableSave(raw) {
    try {
      const parsed = JSON.parse(raw);
      return !!parsed && typeof parsed === 'object' && typeof parsed.version === 'number' && parsed.version >= 1 && parsed.version <= Game.VERSION;
    } catch (_) { return false; }
  }
  try {
    saved = localStorage.getItem(SAVE_KEY);
    // A damaged main save falls back to the rolling backup instead of a fresh start.
    if (saved !== null && !isUsableSave(saved)) {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup && isUsableSave(backup)) { saved = backup; recoveredFromBackup = true; }
    }
    soundEnabled = localStorage.getItem(AUDIO_KEY) === 'on';
    let settings = null;
    try { settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); } catch (_) { /* Ignore damaged preferences. */ }
    preferences.sound = soundEnabled;
    if (settings && typeof settings === 'object') {
      preferences = { sound: settings.sound === true, reducedMotion: settings.reducedMotion === true, compact: settings.compact !== false, music: settings.music !== false, musicVolume: typeof settings.musicVolume === 'number' && Number.isFinite(settings.musicVolume) ? Math.min(100, Math.max(0, settings.musicVolume)) : 20, buyAmount: BUY_AMOUNTS.includes(settings.buyAmount) ? settings.buyAmount : '1' };
      soundEnabled = preferences.sound;
    }
  } catch (_) { storageAvailable = false; }
  scene.setReducedMotion(reducedMotion.matches || preferences.reducedMotion);
  const audio = new window.EmberAudio();
  audio.setPreferences(preferences); audio.setHidden(document.hidden);
  const celebration = new window.EmberCelebration({ reducedMotion: () => reducedMotion.matches || preferences.reducedMotion, sound: () => audio.play('achievement') });
  let audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true; audio.unlock();
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  const restored = Game.restore(saved, Date.now());
  let state = restored.state;
  let lastTime = performance.now();
  let saveDirty = true, uiDirty = true;
  let pendingManual = 0, pendingAuto = 0, pendingClickCount = 0;
  let pendingBlue = 0;
  let sampledClicks = 0, clickRate = 0, sampleStartedAt = lastTime;
  let lastEffectAt = -Infinity, lastAudioAt = -Infinity;
  let lastSpriteLevel = -1, lastKilnLevel = -1, buttonReleaseAt = 0;
  let lastBlueState = '';
  let lastMediumAt = -Infinity, lastSlowAt = -Infinity, lastBackupAt = -Infinity, loopErrorShown = false;
  let cardsPending = false, progressPending = false; // deferred tiers still owed a refresh
  let lastAutomateAt = performance.now();
  let toastTimer, toastActive = false;
  const toastQueue = [], achievementNodes = new Map(), knownAchievements = new Set();

  function showNextToast() {
    if (toastActive || !toastQueue.length) return;
    toastActive = true;
    $('toast').textContent = toastQueue.shift();
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      $('toast').classList.remove('visible'); toastActive = false;
      if (toastQueue.length) showNextToast();
    }, 3200);
  }
  function toast(message) {
    if (toastQueue.length < 4 && !toastQueue.includes(message)) toastQueue.push(message);
    showNextToast();
  }
  function sound(kind, now) {
    if (!soundEnabled || now - lastAudioAt < 100) return;
    lastAudioAt = now;
    audio.play(kind);
  }
  function floating(amount, automatic, count, blue) {
    if (reducedMotion.matches || preferences.reducedMotion || document.hidden || amount <= 0) return;
    const layer = $('float-layer');
    if (layer.childElementCount >= 12) return;
    const float = document.createElement('span');
    float.className = 'floating-ember' + (blue ? ' blue' : automatic ? ' auto' : '');
    float.textContent = '+' + format(amount) + (count > 1 ? ' · ' + count + ' clicks' : '');
    float.style.marginLeft = (Math.random() * 36 - 18) + 'px';
    layer.appendChild(float);
    setTimeout(() => float.remove(), 1050);
  }
  function save(force) {
    if (!storageAvailable || (!force && !saveDirty)) return;
    try {
      const snapshot = Game.serialize(state, Date.now());
      localStorage.setItem(SAVE_KEY, snapshot);
      const now = performance.now();
      if (now - lastBackupAt >= BACKUP_EVERY_MS) { lastBackupAt = now; localStorage.setItem(BACKUP_KEY, snapshot); }
      saveDirty = false;
      text('save-message', 'Progress saved on this device');
    } catch (_) {
      storageAvailable = false;
      text('save-message', 'Saving unavailable · keep this tab open');
      toast('This browser cannot save progress. Keep the tab open to continue playing.');
    }
  }
  function upgradeDisplay(type, level) {
    const visible = Game.isUpgradeVisible(state, type);
    Dom.hidden($(type + '-card'), !visible);
    if (!visible) return; // Hidden cards need no further updates.
    const quote = Game.bulkQuote(state, type, buyAmount()), cost = quote.cost, maxed = quote.maxed;
    const canBuy = quote.affordable, button = $('buy-' + type);
    Dom.disabled(button, !canBuy);
    text(type + '-cost', maxed ? 'MAX' : format(cost));
    text(type + '-level', PRODUCER_NAMES[type] && level === 0 ? 'NOT OWNED' : 'LV. ' + format(level));
    Dom.bar($(type + '-progress'), maxed ? 1 : state.embers / cost);
    text(type + '-note', maxed ? 'Fully upgraded' : (canBuy ? 'Ready when you are' : format(Math.max(0, cost - state.embers)) + ' more embers to go') + levelsNote(quote));
    Dom.toggle($(type + '-card'), 'affordable', canBuy);
    const names = Object.assign({ bellows: 'bellows', kindling: 'dry kindling', hearth: 'stone hearth', charcoal: 'charcoal', draft: 'chimney draft' }, PRODUCER_NAMES);
    const label = maxed ? 'Fully upgraded' : (type === 'sprite' && level === 0 ? 'Bind ember sprite' : type === 'kiln' && level === 0 ? 'Build ember kiln' : 'Upgrade ' + names[type]) + (quote.count > 1 ? ' by ' + quote.count + ' levels' : '') + ' for ' + format(cost) + ' embers';
    Dom.attr(button, 'aria-label', label);
    if (PRODUCER_NAMES[type]) {
      text(type + '-rate', format(Game.productionRate(state, type)));
      text(type + '-gain', maxed ? 'MAX' : '+' + format(Game.upgradeGain(state, type)));
    }
    if (type === 'bellows') {
      const gain = Game.upgradeGain(state, type);
      text('bellows-benefit', '+' + format(gain) + ' ember' + (gain === 1 ? '' : 's') + ' per click');
    }
    if (type === 'sprite') {
      text('sprite-action', level === 0 ? 'BIND SPRITE' : 'UPGRADE SPRITE');
      text('sprite-description', level === 0 ? 'Bind one companion · starts at 0.5 ember/sec' : 'One companion, growing stronger with each upgrade.');
    }
    if (type === 'kindling') text('kindling-benefit', '+20% base click strength per rank · +' + format(Game.upgradeGain(state, type)) + ' per click now');
    if (type === 'hearth') text('hearth-benefit', '+15% base automatic output per rank · +' + format(Game.upgradeGain(state, type)) + '/sec now');
    if (type === 'charcoal') text('charcoal-benefit', '+25% base kiln output per rank · +' + format(Game.upgradeGain(state, type)) + '/sec now');
    if (type === 'draft') text('draft-benefit', '+10% base ember production per rank, from clicks and automation');
    if (type === 'kiln') text('kiln-action', level === 0 ? 'BUILD KILN' : 'UPGRADE KILN');
    if (type === 'brazier' || type === 'forge' || type === 'beacon') text(type + '-action', level === 0 ? 'BUILD' : 'UPGRADE');
  }
  function buildAchievements() {
    const grid = $('achievements-grid');
    Achievements.definitions.forEach(definition => {
      const card = document.createElement('article');
      card.className = 'achievement-card'; card.id = 'achievement-' + definition.id;
      const icon = document.createElement('span');
      icon.className = 'achievement-icon'; icon.textContent = definition.icon; icon.setAttribute('aria-hidden', 'true');
      const info = document.createElement('div'); info.className = 'achievement-info';
      const title = document.createElement('h3'); title.textContent = definition.title;
      const description = document.createElement('p'); description.textContent = definition.description;
      const progress = document.createElement('div'); progress.className = 'achievement-progress';
      const track = document.createElement('div'); track.className = 'achievement-track'; track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span'); track.appendChild(fill);
      const value = document.createElement('span'); value.className = 'achievement-value';
      const status = document.createElement('span'); status.className = 'achievement-state';
      progress.append(value, status); info.append(title, description, progress, track); card.append(icon, info); grid.appendChild(card);
      achievementNodes.set(definition.id, { card, fill, value, status, unlocked: null });
    });
  }
  function renderAchievements(announce, full) {
    const evaluated = Achievements.evaluate(state), newUnlocks = [];
    let unlockedCount = 0, discoveredCount = 0;
    evaluated.forEach(achievement => {
      const nodes = achievementNodes.get(achievement.id), unlocked = achievement.unlocked;
      if (unlocked) {
        unlockedCount++;
        if (!knownAchievements.has(achievement.id) && announce) newUnlocks.push(achievement);
        knownAchievements.add(achievement.id);
      }
      let discovered = true;
      if (achievement.stat === 'bestSprites') discovered = Game.isUpgradeVisible(state, 'sprite');
      if (achievement.stat === 'bestKiln') discovered = Game.isUpgradeVisible(state, 'kiln');
      if (achievement.stat === 'lifetimeBlue' || achievement.stat === 'blueDrops') discovered = Game.isBlueStageVisible(state);
      if (achievement.stat === 'rebirthCount' || achievement.stat === 'totalRebirthPoints' || achievement.stat === 'skillRanks') discovered = Game.isRebirthVisible(state);
      if (achievement.stat === 'lifetimeAsh' || achievement.stat === 'autoRebirths') discovered = Game.isGroveVisible(state);
      if (achievement.stat === 'totalEarned' && achievement.target > 1000000) discovered = state.totalEarned >= achievement.target / 100;
      const shown = discovered || unlocked;
      Dom.hidden(nodes.card, !shown);
      if (shown) discoveredCount++;
      // Unlock state changes immediately; moving progress numbers wait for the slow tier.
      const statusChanged = nodes.unlocked !== unlocked;
      if (!shown || (!full && !statusChanged)) return;
      nodes.unlocked = unlocked;
      const progressText = format(Math.min(achievement.target, achievement.progress)) + ' / ' + format(achievement.target);
      Dom.toggle(nodes.card, 'unlocked', unlocked);
      Dom.bar(nodes.fill, achievement.progress / achievement.target);
      Dom.text(nodes.value, progressText);
      Dom.text(nodes.status, unlocked ? 'UNLOCKED' : 'IN PROGRESS');
      Dom.attr(nodes.card, 'aria-label', achievement.title + ': ' + (unlocked ? 'unlocked' : progressText));
    });
    text('journey-count', unlockedCount + ' / ' + discoveredCount + ' discovered');
    if (newUnlocks.length) celebration.celebrate(newUnlocks);
  }
  // announce: celebrate new unlocks. force: run every tier now (after purchases, loads, settings).
  function render(announce, force) {
    const now = performance.now();
    renderCounters();
    cardsPending = true; progressPending = true;
    if (force || now - lastMediumAt >= MEDIUM_RENDER_MS) {
      lastMediumAt = now; cardsPending = false;
      const full = force || now - lastSlowAt >= SLOW_RENDER_MS;
      if (full) { lastSlowAt = now; progressPending = false; }
      renderCards(announce, full);
    }
    uiDirty = false;
  }
  function renderCounters() {
    const power = Game.clickPower(state);
    text('embers', format(state.embers)); text('click-power', format(power));
    text('click-plural', power === 1 ? '' : 's'); text('auto-rate', format(Game.autoRate(state)));
    text('button-gain', '+' + format(power)); text('manual-clicks', format(state.manualClicks));
    text('lifetime-embers', format(state.totalEarned)); text('click-rate', clickRate.toFixed(1));
    Dom.attr($('stoke-scene'), 'aria-label', 'Stoke the fire to earn ' + format(power) + ' ember' + (power === 1 ? '' : 's'));
    if (panels) panels.renderCounters();
  }
  function renderCards(announce, full) {
    text('fire-status', state.kiln > 0 ? 'One little companion. A kiln full of warmth.' : state.sprites > 0 ? 'Your little companion is tending the fire.' : 'Just you, a small fire, and the first spark.');
    // Only the open workshop tab is redrawn on routine ticks.
    if (full || !$('workshop-panel-embers').hidden) EMBER_KINDS.forEach(type => upgradeDisplay(type, state[type === 'sprite' ? 'sprites' : type]));
    text('discovery-hint', state.bellows === 0 && state.sprites === 0 ? 'Upgrade your bellows to discover more.' : state.sprites === 0 ? 'Bind a companion to keep the fire growing while you rest.' : state.kiln === 0 ? 'A little company opens the way to a stronger hearth.' : state.charcoal === 0 ? 'Better fuel will carry the fire further.' : state.draft === 0 ? 'A steady draft could reveal a different kind of spark.' : !state.blueUnlocked ? 'The next stage awaits at 100K embers.' : 'A rare blue spark. A new path forward.');
    text('stage-label', state.blueUnlocked ? 'STAGE 2 · THE AZURE' : 'STAGE 1 · THE HEARTH');
    if (lastSpriteLevel !== state.sprites) { scene.setSprites(state.sprites); lastSpriteLevel = state.sprites; }
    if (lastKilnLevel !== state.kiln) { scene.setKiln(state.kiln); lastKilnLevel = state.kiln; }
    const blueState = state.blueUnlocked + ':' + (state.blueFlames >= 1000);
    if (lastBlueState !== blueState) { scene.setBlue(state.blueUnlocked, state.blueFlames); lastBlueState = blueState; }
    renderAchievements(announce, full);
    if (panels) panels.render(false);
  }
  function settle(now) {
    const elapsed = Math.max(0, (now - lastTime) / 1000); lastTime = now;
    const blueBefore = state.blueFlames;
    const earned = Game.tick(state, Math.min(elapsed, Game.offlineLimit(state)));
    if (elapsed > 0) saveDirty = true;
    if (earned > 0) { pendingAuto += earned; uiDirty = true; }
    if (state.blueFlames > blueBefore) { pendingBlue += state.blueFlames - blueBefore; uiDirty = true; saveDirty = true; }
    return earned;
  }
  function flushEffects(now) {
    if (now - lastEffectAt < 100) return;
    const hasManual = pendingClickCount > 0, hasAuto = pendingAuto >= .5 && now - lastEffectAt >= 500;
    const hasBlue = pendingBlue > 0;
    if (!hasManual && !hasAuto && !hasBlue) return;
    lastEffectAt = now;
    if (hasManual) {
      floating(pendingManual, false, pendingClickCount); pendingManual = 0; pendingClickCount = 0;
      sound('click', now); $('stoke-button').classList.add('is-stoked'); buttonReleaseAt = now + 80;
    } else if (hasAuto) { floating(pendingAuto, true, 0); pendingAuto = 0; }
    if (hasBlue) { floating(pendingBlue, false, 0, true); pendingBlue = 0; }
    scene.stoke();
  }
  function stoke() {
    // No save, canvas draw, layout read, timer, or DOM mutation in this hot path.
    const blueBefore = state.blueFlames;
    pendingManual += Game.click(state); pendingClickCount++; sampledClicks++;
    pendingBlue += state.blueFlames - blueBefore;
    uiDirty = true; saveDirty = true;
  }
  function buy(type) {
    const now = performance.now(); settle(now); // Apply elapsed time at the old rate first.
    const bought = Game.buyBulk(state, type, buyAmount());
    if (!bought) { render(false, true); return; }
    saveDirty = true; render(true, true); sound('buy', now); scene.stoke(); save(true);
    if (bought > 1) toast('Bought ' + bought + ' levels.');
    if (Game.GROVE_KINDS.includes(type)) {
      const grove = { seedling: 'Cinder seedling', ashTree: 'Ashwood tree', emberOak: 'Ember oak', fertileAsh: 'Fertile ash', blueLoam: 'Blue loam',
        canopy: 'Warm canopy', stewardEmber: 'Ember steward', stewardBlue: 'Blue steward', rebirthKeeper: 'Rebirth keeper' };
      toast(type === 'rebirthKeeper' ? 'The rebirth keeper is ready. Switch on auto-rebirth in the grove when you want it.'
        : grove[type] + (type.startsWith('steward') ? ' now acts every ' + Game.stewardInterval(state[type]) + ' s.' : ' grows. Ash: ' + format(Game.ashRate(state)) + '/sec.'));
      return;
    }
    const names = { kindling: 'Dry kindling', hearth: 'Stone hearth', charcoal: 'Charcoal', draft: 'Chimney draft' };
    const built = { brazier: 'Your coal brazier', forge: 'Your smithy forge', beacon: 'Your ember beacon' };
    const boosted = { blueGlow: 'Blue glow', cobaltBellows: 'Cobalt bellows', azureKiln: 'Azure kiln' };
    if (built[type]) { toast(built[type] + ' now produces ' + format(Game.productionRate(state, type)) + ' embers/sec.'); return; }
    if (boosted[type]) { toast(boosted[type] + ' upgraded to level ' + state[type] + '.'); return; }
    toast(names[type] ? names[type] + ' upgraded. The fire grows stronger.' : type === 'bellows' ? 'Bellows upgraded. Now +' + format(Game.clickPower(state)) + ' per click.' : type === 'sprite' || type === 'kiln' ? (type === 'sprite' ? 'Your sprite' : 'Your kiln') + ' now produces ' + format(Game.productionRate(state, type)) + ' embers/sec.' : type === 'blueUnlock' ? 'Blue flames awakened. Every manual click now has a ' + format(Game.blueChance(state) * 100) + '% chance.' : type === 'blueChance' ? 'Blue-flame chance increased to ' + format(Game.blueChance(state) * 100) + '%.' : type === 'blueYield' ? 'Blue-flame drops now give ' + format(Game.blueYield(state)) + ' each.' : type === 'blueEmbers' ? 'Azure embers: +' + format(state.blueEmbers * 25) + '% ember production.' : type === 'blueDouble' ? 'Twin flicker: ' + format(Game.blueDoubleChance(state) * 100) + '% of drops are doubled.' : type === 'blueWisp' ? 'Blue wisp upgraded. ' + format(Game.blueRollRate(state)) + ' automatic rolls/sec.' : type === 'blueScatter' ? 'Spark scatter: ' + format(Game.clickRolls(state)) + ' blue rolls per click.' : 'Blue siphon upgraded. ' + format(Game.blueRollRate(state)) + ' automatic rolls/sec.');
  }
  function updateSound() {
    $('sound-toggle').innerHTML = '<span aria-hidden="true">♫</span> Sound ' + (soundEnabled ? 'on' : 'off');
    $('sound-toggle').setAttribute('aria-pressed', String(soundEnabled));
    $('music-toggle').innerHTML = '<span aria-hidden="true">♪</span> Music ' + (preferences.music ? 'on' : 'off');
    $('music-toggle').setAttribute('aria-pressed', String(preferences.music));
  }
  // Clicks are credited on pointerdown: it fires immediately and never gets lost when
  // the pointer drifts between press and release. Real mouse clicks (detail > 0) were
  // already counted; keyboard activation and scripted clicks (detail 0) still count.
  let unmatchedPointerAt = -Infinity; // a pointer press whose click has not arrived yet
  function pointerStoke(event) {
    if (event.button !== 0 && event.button !== undefined) return;
    unmatchedPointerAt = performance.now(); stoke();
  }
  function clickStoke(event) {
    const fromPointer = (event && event.detail > 0) || performance.now() - unmatchedPointerAt < 1000;
    unmatchedPointerAt = -Infinity;
    if (!fromPointer) stoke();
  }
  ['stoke-button', 'stoke-scene'].forEach(id => {
    $(id).addEventListener('pointerdown', pointerStoke);
    $(id).addEventListener('click', clickStoke);
  });
  EMBER_KINDS.forEach(type => $('buy-' + type).addEventListener('click', () => buy(type)));
  $('sound-toggle').addEventListener('click', () => {
    changeSettings({ sound: !soundEnabled }); sound('buy', performance.now());
  });
  $('music-toggle').addEventListener('click', () => { unlockAudio(); changeSettings({ music: !preferences.music }); });
  $('help-button').addEventListener('click', () => $('help-dialog').showModal());
  function clearRunEffects() {
    pendingManual = 0; pendingAuto = 0; pendingBlue = 0; pendingClickCount = 0; sampledClicks = 0; clickRate = 0;
    sampleStartedAt = lastTime; buttonReleaseAt = 0;
    $('stoke-button').classList.remove('is-stoked');
    $('float-layer').textContent = '';
    celebration.clear();
  }
  function updateBuyAmount() {
    BUY_AMOUNTS.forEach(amount => {
      const selected = preferences.buyAmount === amount;
      Dom.attr($('buy-amount-' + amount), 'aria-checked', String(selected));
      Dom.toggle($('buy-amount-' + amount), 'selected', selected);
    });
  }
  BUY_AMOUNTS.forEach(amount => $('buy-amount-' + amount).addEventListener('click', () => changeSettings({ buyAmount: amount })));
  function changeSettings(changes) {
    preferences = Object.assign({}, preferences, changes);
    soundEnabled = preferences.sound;
    audio.setPreferences(preferences);
    scene.setReducedMotion(reducedMotion.matches || preferences.reducedMotion);
    document.body.classList.toggle('reduced-motion', preferences.reducedMotion);
    updateSound(); updateBuyAmount();
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences)); localStorage.setItem(AUDIO_KEY, soundEnabled ? 'on' : 'off'); } catch (_) {}
    uiDirty = true; render(false, true);
  }
  function fullReset() {
    state = Game.createState(Date.now()); lastTime = performance.now();
    clearRunEffects(); knownAchievements.clear();
    clearTimeout(toastTimer); toastQueue.length = 0; toastActive = false; $('toast').classList.remove('visible');
    changeSettings({ sound: false, reducedMotion: false, compact: true, music: true, musicVolume: 20, buyAmount: '1' });
    saveDirty = true; render(false, true); save(true); toast('All progress reset. A fresh beginning.'); $('stoke-button').focus();
  }
  function rebirth() {
    settle(performance.now());
    const points = Game.rebirth(state, Date.now());
    if (!points) return;
    lastTime = performance.now(); clearRunEffects(); saveDirty = true;
    render(true, true); save(true); toast('Rebirth complete. +' + format(points) + ' permanent point' + (points === 1 ? '' : 's') + '.');
  }
  // ----- Save export / import -----
  function exportCode() {
    settle(performance.now()); save(true);
    return SaveCode.encode(Game.serialize(state, Date.now()));
  }
  function describeSave(parsed) {
    const preview = Game.sanitize(parsed, Date.now());
    const ranks = Object.values(preview.skills).reduce((sum, rank) => sum + rank, 0);
    let when = '';
    try { if (parsed.savedAt) when = ' Saved ' + new Date(parsed.savedAt).toLocaleString() + '.'; } catch (_) {}
    return format(preview.totalEarned) + ' embers earned, ' + format(preview.rebirthCount) + ' rebirth' + (preview.rebirthCount === 1 ? '' : 's') +
      ', ' + ranks + ' skill rank' + (ranks === 1 ? '' : 's') + '.' + when;
  }
  function hasPreImport() {
    try { return !!localStorage.getItem(PREIMPORT_KEY); } catch (_) { return false; }
  }
  function importSave(parsed, message) {
    settle(performance.now());
    try { localStorage.setItem(PREIMPORT_KEY, Game.serialize(state, Date.now())); } catch (_) {}
    // An imported save continues from now: no offline windfall for the time since it was exported.
    state = Game.restore(Object.assign({}, parsed, { savedAt: Date.now() }), Date.now()).state;
    lastTime = performance.now(); clearRunEffects(); knownAchievements.clear();
    saveDirty = true; render(false, true); save(true);
    toast(message || 'Save imported. Your previous progress can be restored with “Undo last import” in Settings.');
  }
  function undoImport() {
    let previous = null;
    try { previous = localStorage.getItem(PREIMPORT_KEY); } catch (_) {}
    if (!previous || !isUsableSave(previous)) { toast('There is no earlier progress to restore.'); return; }
    importSave(JSON.parse(previous), 'Restored the progress from before your last import.');
  }
  function buySkill(id) {
    settle(performance.now());
    if (!Game.buySkill(state, id)) { render(false, true); return; }
    saveDirty = true; render(true, true); save(true);
    toast('Permanent skill learned: ' + window.EmberSkills.definitions.find(skill => skill.id === id).title + '.');
  }
  document.addEventListener('keydown', event => {
    unlockAudio();
    if (event.code !== 'Space' || document.querySelector('dialog[open]')) return;
    if (event.target.closest('button, input, textarea, select, a, [contenteditable]')) return;
    event.preventDefault(); if (!event.repeat) stoke();
  });
  document.addEventListener('visibilitychange', () => {
    audio.setHidden(document.hidden);
    if (document.hidden) { settle(performance.now()); save(true); }
    else {
      let resumed = false;
      if (storageAvailable) {
        try {
          const stored = localStorage.getItem(SAVE_KEY);
          if (stored) {
            const away = Game.restore(stored, Date.now()); state = away.state; resumed = true;
            if (away.offlineEarned >= 1 || away.offlineBlue > 0) toast('Welcome back. +' + format(away.offlineEarned) + ' embers' + (away.offlineBlue > 0 ? ' and ' + format(away.offlineBlue) + ' blue flames.' : '.'));
          }
        } catch (_) {}
      }
      if (!resumed) settle(performance.now());
      lastTime = performance.now(); lastAutomateAt = lastTime; sampleStartedAt = lastTime; sampledClicks = 0; clickRate = 0;
      pendingAuto = 0; pendingManual = 0; pendingBlue = 0; pendingClickCount = 0; render(true, true); save(true);
    }
  });
  window.addEventListener('pagehide', () => {
    audio.setHidden(true);
    // The hidden snapshot already anchors offline earnings; do not overwrite it.
    if (!document.hidden) { settle(performance.now()); save(true); }
  });
  // Stage-3 helpers. At most one steward activation per call; an automatic rebirth is
  // handled exactly like a manual one.
  function runAutomation(now) {
    const seconds = Math.max(0, (now - lastAutomateAt) / 1000); lastAutomateAt = now;
    const events = Game.automate(state, seconds, Date.now());
    if (events.rebirth) {
      lastTime = performance.now(); clearRunEffects(); saveDirty = true;
      render(true, true); save(true);
      toast('The rebirth keeper began a new life. +' + format(events.rebirth) + ' permanent point' + (events.rebirth === 1 ? '' : 's') + '.');
    } else if (events.embers || events.blue) {
      saveDirty = true; render(true, true);
    }
  }
  function changeAutomation(changes) {
    Game.setAutomation(state, changes); saveDirty = true; render(false, true); save(true);
  }
  function tickLoop() {
    if (document.hidden) return;
    const now = performance.now(); settle(now);
    runAutomation(now);
    if (now - sampleStartedAt >= 1000) {
      clickRate = sampledClicks * 1000 / (now - sampleStartedAt); sampledClicks = 0; sampleStartedAt = now; uiDirty = true;
    }
    flushEffects(now);
    if (buttonReleaseAt && now >= buttonReleaseAt) { $('stoke-button').classList.remove('is-stoked'); buttonReleaseAt = 0; }
    if (uiDirty || (cardsPending && now - lastMediumAt >= MEDIUM_RENDER_MS) || (progressPending && now - lastSlowAt >= SLOW_RENDER_MS)) render(true, false);
  }
  // One failing frame must never stop the game: log it once and keep ticking.
  setInterval(() => {
    try { tickLoop(); } catch (error) {
      if (!loopErrorShown) { loopErrorShown = true; try { console.error('Ember Hollow frame error', error); } catch (_) {} }
    }
  }, 50);
  setInterval(() => { if (!document.hidden) save(false); }, 2000);
  buildAchievements();
  panels = new window.EmberPanels({ state: () => state, buyAmount, automation: changeAutomation, exportCode, describeSave, importSave: parsed => importSave(parsed), undoImport, hasPreImport, preferences: () => preferences, format, toast, buy, buySkill, rebirth, fullReset, settings: changeSettings, settle: () => settle(performance.now()), save: () => save(true) });
  document.body.classList.toggle('reduced-motion', preferences.reducedMotion);
  render(false, true); updateSound(); updateBuyAmount();
  if (recoveredFromBackup) toast('Your latest save was damaged, so the most recent backup was restored.');
  if (!storageAvailable) text('save-message', 'Saving unavailable · keep this tab open');
  else save(true); // Consume the offline award once and persist migrated data.
  if (restored.offlineEarned >= 1 || restored.offlineBlue > 0) setTimeout(() => toast('Welcome back. +' + format(restored.offlineEarned) + ' embers' + (restored.offlineBlue > 0 ? ' and ' + format(restored.offlineBlue) + ' blue flames.' : '.')), 600);
})();
