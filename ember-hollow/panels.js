/* Dialogs and progression panels; all purchases use the tested game economy. */
(function () {
  'use strict';
  const BLUE_KINDS = ['blueUnlock', 'blueChance', 'blueYield', 'blueEmbers', 'blueDouble', 'blueSiphon', 'blueWisp', 'blueScatter'];
  const GROVE_KINDS = ['seedling', 'ashTree', 'emberOak', 'fertileAsh', 'blueLoam', 'canopy', 'stewardEmber', 'stewardBlue', 'rebirthKeeper'];
  const GROVE_LABELS = { seedling: 'Grow cinder seedling', ashTree: 'Grow ashwood tree', emberOak: 'Grow ember oak', fertileAsh: 'Scatter fertile ash',
    blueLoam: 'Enrich blue loam', canopy: 'Grow warm canopy', stewardEmber: 'Upgrade ember steward', stewardBlue: 'Upgrade blue steward', rebirthKeeper: 'Hire rebirth keeper' };
  const TABS = ['embers', 'blue', 'grove'];
  const CURRENCY_NAMES = { embers: 'embers', blueFlames: 'blue flames', ash: 'ash' };
  const BLUE_LABELS = { blueUnlock: 'Unlock blue flames', blueChance: 'Upgrade blue flame chance', blueYield: 'Upgrade blue flame yield',
    blueSiphon: 'Upgrade blue siphon', blueEmbers: 'Upgrade azure embers', blueDouble: 'Upgrade twin flicker', blueWisp: 'Upgrade blue wisp', blueScatter: 'Upgrade spark scatter' };
  class EmberPanels {
    constructor(options) {
      this.options = options;
      this.Game = window.EmberGame;
      this.Skills = window.EmberSkills;
      this.Dom = window.EmberDom;
      this.nodes = new Map();
      this.$ = id => document.getElementById(id);
      this.bind();
      this.buildTree();
    }
    text(id, value) { this.Dom.text(this.$(id), value); }
    open(id) { this.render(true); this.$(id).showModal(); this.render(true); }
    bind() {
      const o = this.options;
      this.$('settings-button').addEventListener('click', () => this.open('settings-dialog'));
      this.$('stats-button').addEventListener('click', () => this.open('stats-dialog'));
      this.$('tree-button').addEventListener('click', () => this.open('skill-dialog'));
      this.$('sound-setting').addEventListener('change', event => o.settings({ sound: event.target.checked }));
      this.$('music-setting').addEventListener('change', event => o.settings({ music: event.target.checked }));
      this.$('music-volume').addEventListener('input', event => o.settings({ musicVolume: Math.min(100, Math.max(0, Number(event.target.value) || 0)) }));
      this.$('motion-setting').addEventListener('change', event => o.settings({ reducedMotion: event.target.checked }));
      this.$('numbers-setting').addEventListener('change', event => o.settings({ compact: event.target.checked }));
      this.$('save-button').addEventListener('click', () => { o.settle(); o.save(); o.toast('Progress saved.'); });
      this.$('full-reset-button').addEventListener('click', () => this.openReset());
      this.bindTransfer();
      this.$('reset-button').addEventListener('click', () => this.openReset());
      this.$('reset-confirm').addEventListener('input', () => {
        this.$('confirm-full-reset').disabled = this.$('reset-confirm').value !== 'RESET';
      });
      this.$('reset-dialog').addEventListener('close', () => {
        if (this.$('reset-dialog').returnValue !== 'reset' || this.$('reset-confirm').value !== 'RESET') return;
        ['settings-dialog', 'stats-dialog', 'skill-dialog', 'rebirth-dialog'].forEach(id => {
          if (this.$(id).open) this.$(id).close('cancel');
        });
        o.fullReset();
      });
      this.$('rebirth-button').addEventListener('click', () => {
        o.settle();
        if (!this.Game.getRebirthInfo(o.state()).canRebirth) return;
        this.$('rebirth-dialog').returnValue = 'cancel';
        this.open('rebirth-dialog');
      });
      this.$('rebirth-dialog').addEventListener('close', () => {
        if (this.$('rebirth-dialog').returnValue === 'confirm') o.rebirth();
      });
      this.$('planned-toggle').addEventListener('change', event => {
        this.$('skill-branches').classList.toggle('future-nodes-shown', event.target.checked);
      });
      BLUE_KINDS.concat(GROVE_KINDS).forEach(kind => {
        this.$('buy-' + kind).addEventListener('click', () => o.buy(kind));
      });
      TABS.forEach(tab => this.$('workshop-tab-' + tab).addEventListener('click', () => this.selectTab(tab)));
      // Native arrow-key tab navigation is explicit so the workshop stays usable by keyboard.
      TABS.forEach(name => this.$('workshop-tab-' + name).addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const open = TABS.filter(tab => !this.$('workshop-tab-' + tab).hidden), index = open.indexOf(name);
        const target = event.key === 'Home' ? open[0] : event.key === 'End' ? open[open.length - 1]
          : open[(index + (event.key === 'ArrowRight' ? 1 : open.length - 1)) % open.length];
        this.selectTab(target); this.$('workshop-tab-' + target).focus();
      }));
      // Automation switches and the rebirth keeper's target.
      [['autoEmber', 'Ember steward'], ['autoBlue', 'Blue steward'], ['autoRebirth', 'Auto-rebirth']].forEach(([field]) => {
        this.$('toggle-' + field).addEventListener('click', () => o.automation({ [field]: !o.state()[field] }));
      });
      this.$('keeper-target').addEventListener('change', event => o.automation({ autoRebirthTarget: event.target.value }));
    }
    // ----- Save export / import dialogs -----
    bindTransfer() {
      const o = this.options, SaveCode = window.EmberSaveCode;
      this.pendingImport = null;
      this.$('export-open').addEventListener('click', () => {
        this.$('export-code').value = o.exportCode();
        this.status('export-status', '', '');
        this.$('export-dialog').showModal();
        try { this.$('export-code').select(); } catch (_) {}
      });
      this.$('export-copy').addEventListener('click', () => this.copyCode());
      this.$('export-download').addEventListener('click', () => this.downloadCode());
      this.$('import-open').addEventListener('click', () => {
        this.pendingImport = null;
        this.$('import-code').value = '';
        try { this.$('import-file').value = ''; } catch (_) {}
        this.$('import-confirm').disabled = true;
        this.status('import-status', '', '');
        this.$('import-dialog').showModal();
      });
      this.$('import-code').addEventListener('input', () => this.checkImport(this.$('import-code').value));
      this.$('import-file').addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (file.size > 200000) { this.checkImport(''); this.status('import-status', 'That file is far too large to be a save.', 'error'); return; }
        file.text().then(text => { this.$('import-code').value = text.trim(); this.checkImport(text); })
          .catch(() => this.status('import-status', 'That file could not be read.', 'error'));
      });
      this.$('import-confirm').addEventListener('click', () => {
        if (!this.pendingImport) return;
        const save = this.pendingImport; this.pendingImport = null;
        this.$('import-dialog').close('cancel');
        if (this.$('settings-dialog').open) this.$('settings-dialog').close('cancel');
        o.importSave(save);
      });
      this.$('undo-import').addEventListener('click', () => {
        if (this.$('settings-dialog').open) this.$('settings-dialog').close('cancel');
        o.undoImport();
      });
      this.SaveCode = SaveCode;
    }
    status(id, message, kind) {
      const node = this.$(id);
      node.textContent = message;
      node.classList.toggle('error', kind === 'error');
      node.classList.toggle('ok', kind === 'ok');
    }
    checkImport(text) {
      try {
        const parsed = this.SaveCode.decode(text, this.Game.VERSION);
        this.pendingImport = parsed;
        this.status('import-status', 'Save found: ' + this.options.describeSave(parsed), 'ok');
        this.$('import-confirm').disabled = false;
      } catch (error) {
        this.pendingImport = null;
        this.status('import-status', text.trim() ? error.message : '', 'error');
        this.$('import-confirm').disabled = true;
      }
    }
    copyCode() {
      const field = this.$('export-code'), code = field.value;
      const manual = () => {
        try { field.select(); } catch (_) {}
        let copied = false;
        try { copied = document.execCommand && document.execCommand('copy'); } catch (_) {}
        this.status('export-status', copied ? 'Copied to the clipboard.' : 'The code is selected — press Ctrl+C (or Cmd+C) to copy it.', copied ? 'ok' : '');
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => this.status('export-status', 'Copied to the clipboard.', 'ok'), manual);
          return;
        }
      } catch (_) {}
      manual();
    }
    downloadCode() {
      try {
        const name = this.SaveCode.fileName(new Date());
        const url = URL.createObjectURL(new Blob([this.$('export-code').value + '\n'], { type: 'text/plain' }));
        const link = document.createElement('a');
        link.href = url; link.download = name; link.hidden = true;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        this.status('export-status', 'Downloaded ' + name + '.', 'ok');
      } catch (_) {
        this.status('export-status', 'This browser blocked the download. Copy the code instead.', 'error');
      }
    }
    selectTab(tab) {
      TABS.forEach(name => {
        const selected = name === tab;
        this.$('workshop-tab-' + name).setAttribute('aria-selected', String(selected));
        this.$('workshop-tab-' + name).tabIndex = selected ? 0 : -1;
        this.$('workshop-panel-' + name).hidden = !selected;
      });
      if (tab !== 'embers') this.render(true);
      if (this.options.tabChanged) this.options.tabChanged(tab);
    }
    openReset() {
      this.$('reset-dialog').returnValue = 'cancel';
      this.$('reset-confirm').value = '';
      this.$('confirm-full-reset').disabled = true;
      this.open('reset-dialog');
    }
    buildTree() {
      const root = this.$('skill-branches');
      this.Skills.branches.forEach(branch => {
        const column = document.createElement('section'); column.className = 'skill-branch';
        const heading = document.createElement('h3'); heading.textContent = branch.title;
        const description = document.createElement('p'); description.className = 'branch-description'; description.textContent = branch.description;
        column.append(heading, description);
        this.Skills.definitions.filter(skill => skill.branch === branch.id).forEach(skill => {
          const node = document.createElement('article'); node.id = 'skill-' + skill.id;
          node.className = 'skill-node' + (skill.active ? '' : ' future');
          const title = document.createElement('h4'); title.className = 'skill-title'; title.textContent = skill.title;
          const level = document.createElement('span'); level.className = 'skill-level';
          const detail = document.createElement('p'); detail.className = 'skill-description'; detail.textContent = skill.description;
          const cost = document.createElement('p'); cost.className = 'skill-cost';
          const reason = document.createElement('p'); reason.className = 'skill-reason';
          // Real prerequisites, each marked as met or not, plus what this skill opens up.
          const requires = document.createElement('ul'); requires.className = 'skill-requires';
          requires.setAttribute('aria-label', 'Prerequisites');
          const chips = skill.requires.map(requirement => {
            const target = this.Skills.definitions.find(node => node.id === requirement.id);
            const chip = document.createElement('li'); chip.className = 'skill-chip';
            chip.textContent = target.title + ' ' + requirement.level + (target.branch !== skill.branch ? ' · ' + this.branchTitle(target.branch) : '');
            requires.appendChild(chip);
            return { chip, requirement, label: chip.textContent };
          });
          if (skill.active && !chips.length) {
            const root = document.createElement('li'); root.className = 'skill-chip root'; root.textContent = 'Starting point · no prerequisites';
            requires.appendChild(root);
          }
          const opens = this.Skills.definitions.filter(other => other.active && other.requires.some(r => r.id === skill.id));
          const unlocks = document.createElement('p'); unlocks.className = 'skill-unlocks';
          unlocks.textContent = opens.length ? 'Opens: ' + opens.map(other => other.title).join(', ') : '';
          const button = document.createElement('button'); button.type = 'button'; button.className = 'skill-buy buy-button';
          button.disabled = true; button.textContent = skill.active ? 'LEARN SKILL' : 'FUTURE SKILL';
          if (skill.active) button.addEventListener('click', () => this.options.buySkill(skill.id));
          if (skill.active) node.append(title, level, detail, requires, unlocks, cost, reason, button);
          else node.append(title, level, detail, cost, reason, button);
          column.appendChild(node);
          this.nodes.set(skill.id, { node, level, cost, reason, button, chips, signature: '' });
          if (skill.active) {
            node.tabIndex = -1;
            const on = () => this.highlight(skill.id, true), off = () => this.highlight(skill.id, false);
            node.addEventListener('pointerenter', on); node.addEventListener('pointerleave', off);
            node.addEventListener('focusin', on); node.addEventListener('focusout', off);
          }
        });
        root.appendChild(column);
      });
    }
    branchTitle(id) { const branch = this.Skills.branches.find(item => item.id === id); return branch ? branch.title : id; }
    // Hovering or focusing a skill lights up what it needs and what it opens.
    highlight(id, on) {
      const skill = this.Skills.definitions.find(node => node.id === id);
      const mark = (targetId, name) => { const nodes = this.nodes.get(targetId); if (nodes) nodes.node.classList.toggle(name, on); };
      mark(id, 'is-focus');
      skill.requires.forEach(requirement => mark(requirement.id, 'is-prereq'));
      this.Skills.definitions.forEach(other => { if (other.requires.some(r => r.id === id)) mark(other.id, 'is-unlocks'); });
    }
    upgrade(kind, state) {
      const Game = this.Game, f = this.options.format;
      const amount = this.options.buyAmount ? this.options.buyAmount() : 1;
      const quote = Game.bulkQuote(state, kind, amount), cost = quote.cost, maxed = quote.maxed;
      const currency = Game.upgradeCurrency(kind), blue = currency === 'blueFlames';
      const levels = quote.count > 1 ? ' · +' + quote.count + ' levels' : '';
      const level = Game.upgradeLevel(state, kind);
      const visible = Game.isUpgradeVisible(state, kind), Dom = this.Dom;
      Dom.hidden(this.$(kind + '-card'), !visible);
      if (!visible) return;
      const locked = kind.startsWith('blue') && kind !== 'blueUnlock' && !state.blueUnlocked;
      const noun = CURRENCY_NAMES[currency];
      const affordable = !locked && quote.affordable;
      const button = this.$('buy-' + kind);
      Dom.disabled(button, !affordable);
      this.text(kind + '-cost', maxed ? 'MAX' : cost === 0 ? 'FREE' : f(cost));
      this.text(kind + '-level', kind === 'blueUnlock' ? state.blueUnlocked ? 'UNLOCKED' : 'LOCKED' : 'LV. ' + level);
      this.text(kind + '-note', locked ? 'Unlock blue flames first' : maxed ? kind === 'blueUnlock' ? 'A rare spark can now appear' : 'Fully upgraded' : (affordable ? 'Ready when you are' : f(Math.max(0, cost - state[currency])) + ' more ' + noun) + levels);
      Dom.bar(this.$(kind + '-progress'), maxed ? 1 : state[currency] / cost);
      Dom.toggle(this.$(kind + '-card'), 'affordable', affordable);
      const label = (BLUE_LABELS[kind] || GROVE_LABELS[kind]) + (maxed ? ': complete' : (quote.count > 1 ? ' by ' + quote.count + ' levels' : '') + ' for ' + (cost === 0 ? 'free' : f(cost) + ' ' + noun));
      Dom.attr(button, 'aria-label', label);
      this.text('blueUnlock-action', state.blueUnlocked ? 'UNLOCKED' : 'AWAKEN BLUE FLAMES');
    }
    renderGrove(s) {
      const Game = this.Game, f = this.options.format, Dom = this.Dom;
      GROVE_KINDS.forEach(kind => this.upgrade(kind, s));
      ['seedling', 'ashTree', 'emberOak'].forEach(kind => {
        this.text(kind + '-benefit', 'Now ' + f(Game.groveRate(s, kind)) + ' ash/sec · next level +' + f(Game.upgradeGain(s, kind)));
      });
      this.text('seedling-action', s.seedling ? 'GROW' : 'PLANT');
      this.text('fertileAsh-benefit', '+' + f(s.fertileAsh * 25) + '% ember production · +25% per rank');
      this.text('blueLoam-benefit', '+' + f(s.blueLoam * 20) + '% blue flames per drop · +20% per rank');
      this.text('canopy-benefit', '+' + f(s.canopy * 25) + '% ash production · +25% per rank');
      const steward = (kind, field, name) => {
        const rank = s[kind], interval = Game.stewardInterval(rank);
        this.text(kind + '-benefit', rank ? 'Acts every ' + interval + ' s' + (rank < 5 ? ' · next rank every ' + Game.stewardInterval(rank + 1) + ' s' : ' · fastest') : name === 'Blue steward'
          ? 'Buys blue upgrades, never more than 25% of your blue flames at once' : 'Buys the cheapest ember upgrade every 5 s');
        this.text(kind + '-action', rank ? 'TRAIN' : 'HIRE');
        this.text(kind + '-status', rank ? (s[field] ? 'Working' : 'Resting') : 'Not hired yet');
        const toggle = this.$('toggle-' + field);
        Dom.disabled(toggle, !rank);
        Dom.attr(toggle, 'aria-pressed', String(!!(rank && s[field])));
        this.Dom.text(toggle, name + ': ' + (rank && s[field] ? 'ON' : 'OFF'));
      };
      steward('stewardEmber', 'autoEmber', 'Ember steward');
      steward('stewardBlue', 'autoBlue', 'Blue steward');
      const keeper = s.rebirthKeeper > 0, toggle = this.$('toggle-autoRebirth');
      this.text('rebirthKeeper-action', keeper ? 'HIRED' : 'HIRE');
      this.text('rebirthKeeper-status', keeper ? (s.autoRebirth ? 'Watching for ' + s.autoRebirthTarget + '+ points' : 'Resting') : 'Not hired yet');
      Dom.disabled(toggle, !keeper);
      Dom.disabled(this.$('keeper-target'), !keeper);
      Dom.attr(toggle, 'aria-pressed', String(keeper && s.autoRebirth));
      Dom.text(toggle, 'Auto-rebirth: ' + (keeper && s.autoRebirth ? 'ON' : 'OFF'));
      const field = this.$('keeper-target');
      if (document.activeElement !== field && String(field.value) !== String(s.autoRebirthTarget)) field.value = String(s.autoRebirthTarget);
    }
    time(seconds) {
      const whole = Math.floor(Math.max(0, seconds || 0));
      return Math.floor(whole / 3600) + 'h ' + Math.floor(whole % 3600 / 60) + 'm ' + whole % 60 + 's';
    }
    // Cheap numbers shown in the header bars; called every tick.
    renderCounters() {
      const s = this.options.state(), Game = this.Game, f = this.options.format;
      if (Game.isGroveVisible(s)) { this.text('ash-amount', f(s.ash)); this.text('ash-rate', f(Game.ashRate(s))); }
      if (!Game.isBlueStageVisible(s)) return;
      this.text('blue-flames', f(s.blueFlames));
      this.text('blue-chance', f(Game.blueChance(s) * 100) + '%');
      this.text('blue-yield', f(Game.blueYield(s)));
      this.text('rebirth-points', f(s.rebirthPoints));
    }
    render(force) {
      const o = this.options, s = o.state(), Game = this.Game, f = o.format, Dom = this.Dom;
      const blueVisible = Game.isBlueStageVisible(s);
      Dom.hidden(this.$('blue-resource-bar'), !blueVisible);
      const groveVisible = Game.isGroveVisible(s);
      Dom.hidden(this.$('workshop-tab-blue'), !blueVisible);
      Dom.hidden(this.$('workshop-tab-grove'), !groveVisible);
      Dom.hidden(this.$('rebirth-panel'), !Game.isRebirthVisible(s));
      // A tab that disappears (full reset) falls back to the ember workshop.
      if ((!blueVisible && !this.$('workshop-panel-blue').hidden) || (!groveVisible && !this.$('workshop-panel-grove').hidden)) this.selectTab('embers');
      this.renderCounters();
      // The blue workshop is only drawn while its tab is open (or when forced).
      if (force || !this.$('workshop-panel-blue').hidden) BLUE_KINDS.forEach(kind => this.upgrade(kind, s));
      if (groveVisible && (force || !this.$('workshop-panel-grove').hidden)) this.renderGrove(s);
      this.text('blueChance-benefit', f(Game.blueChance(s) * 100) + '% chance · +0.5 percentage points per rank');
      this.text('blueYield-benefit', f(Game.blueYield(s)) + ' blue per drop · ×1.25 per rank');
      this.text('blueSiphon-benefit', f(Game.blueRollRate(s)) + ' automatic rolls/sec · +1 base roll per rank');
      this.text('blueEmbers-benefit', '+' + f((s.blueEmbers || 0) * 25) + '% ember production · +25% per rank');
      this.text('blueDouble-benefit', f(Game.blueDoubleChance(s) * 100) + '% doubled drops · +5% per rank');
      this.text('blueWisp-benefit', '+' + f((s.blueWisp || 0) * 50) + '% siphon speed · +' + f(Game.upgradeGain(s, 'blueWisp')) + ' rolls/sec next');
      this.text('blueScatter-benefit', f(Game.clickRolls(s)) + ' blue rolls per click · +1 per rank');
      const info = Game.getRebirthInfo(s);
      Dom.disabled(this.$('rebirth-button'), !info.canRebirth);
      this.text('rebirth-offer', info.points ? '+' + f(info.points) + ' rebirth point' + (info.points === 1 ? '' : 's') + ' available' : 'Gather ' + f(info.remaining) + ' more blue flames');
      this.text('rebirth-next-cost', f(info.nextThreshold));
      this.text('rebirth-requirement', 'Next point costs ' + f(info.nextCost) + ' blue flames more. Each marginal cost doubles.');
      Dom.bar(this.$('rebirth-progress'), s.blueFlames / Math.max(1, info.nextThreshold));
      if (force || this.$('rebirth-dialog').open) {
        this.text('rebirth-confirm-points', f(info.points)); this.text('rebirth-confirm-cost', f(info.cost)); this.text('rebirth-confirm-next', f(info.nextCost));
      }
      const preferences = o.preferences();
      if (force || this.$('settings-dialog').open) {
        Dom.hidden(this.$('undo-import'), !(o.hasPreImport && o.hasPreImport()));
        this.$('sound-setting').checked = preferences.sound;
        this.$('music-setting').checked = preferences.music;
        this.$('music-volume').value = String(preferences.musicVolume);
        this.text('music-volume-value', preferences.musicVolume + '%');
        this.$('motion-setting').checked = preferences.reducedMotion;
        this.$('numbers-setting').checked = preferences.compact;
      }
      if (force || this.$('stats-dialog').open) {
        const values = {
          'stat-run-embers': f(s.runEmbers), 'stat-run-blue': f(s.runBlue), 'stat-run-clicks': f(s.runClicks), 'stat-run-time': this.time(s.runSeconds),
          'stat-life-embers': f(s.totalEarned), 'stat-life-blue': f(s.lifetimeBlue), 'stat-life-clicks': f(s.manualClicks), 'stat-life-time': this.time(s.playedSeconds),
          'stat-rebirths': f(s.rebirthCount), 'stat-rp-total': f(s.totalRebirthPoints), 'stat-automatic': f(Game.autoRate(s)) + ' / sec',
          'stat-blue-chance': f(Game.blueChance(s) * 100) + '%', 'stat-blue-yield': f(Game.blueYield(s)), 'stat-blue-rolls': f(Game.blueRollRate(s)) + ' / sec',
          'stat-blue-click-rolls': f(Game.clickRolls(s)), 'stat-blue-double': f(Game.blueDoubleChance(s) * 100) + '%',
          'stat-ash-rate': f(Game.ashRate(s)) + ' / sec', 'stat-ash-life': f(s.lifetimeAsh), 'stat-auto-rebirths': f(s.autoRebirths),
          'stat-skills': Object.values(s.skills).reduce((sum, rank) => sum + rank, 0)
        };
        Object.entries(values).forEach(([id, value]) => this.text(id, value));
      }
      if (force || this.$('skill-dialog').open) {
        this.text('tree-points', f(s.rebirthPoints)); this.text('tree-blue', f(s.blueFlames));
        this.text('tree-unlocked-note', s.rebirthCount > 0 ? 'Permanent skills survive every rebirth. Starter bonuses apply on your next rebirth.' : 'Preview the tree. Complete your first rebirth to learn permanent skills.');
        this.Skills.definitions.forEach(skill => {
          const nodes = this.nodes.get(skill.id);
          if (!skill.active) {
            if (nodes.signature) return;
            nodes.signature = 'future'; nodes.level.textContent = 'PLANNED';
            nodes.cost.textContent = 'A future branch of the hollow.'; nodes.reason.textContent = 'Not available in this version.'; return;
          }
          const item = Game.getSkillInfo(s, skill.id);
          const met = nodes.chips.map(entry => (s.skills[entry.requirement.id] || 0) >= entry.requirement.level ? 1 : 0).join('');
          const signature = [item.level, item.maxed, item.blueCost, item.pointCost, item.lockedReason, item.canBuy, o.preferences().compact, met].join('|');
          if (nodes.signature === signature) return;
          nodes.signature = signature;
          nodes.level.textContent = 'RANK ' + item.level + ' / ' + item.maxLevel;
          nodes.cost.textContent = item.maxed ? 'Fully learned' : f(item.pointCost) + ' RP' + (item.blueCost ? ' + ' + f(item.blueCost) + ' blue flames' : ' · no blue-flame cost');
          const missingPrereq = met.includes('0') && !item.maxed;
          nodes.reason.textContent = item.lockedReason && missingPrereq && /^Requires .* rank/.test(item.lockedReason) ? 'Learn the ○ prerequisites first.' : item.lockedReason || (item.canBuy ? 'Ready to learn' : 'Gather the listed currencies');
          nodes.button.disabled = !item.canBuy;
          nodes.chips.forEach((entry, index) => {
            const ok = met[index] === '1';
            entry.chip.classList.toggle('met', ok);
            entry.chip.textContent = (ok ? '✓ ' : '○ ') + entry.label;
          });
          nodes.button.textContent = item.maxed ? 'MASTERED' : item.level ? 'UPGRADE SKILL' : 'LEARN SKILL';
          nodes.button.setAttribute('aria-label', skill.title + (item.maxed ? ': mastered' : ' rank ' + (item.level + 1) + ' for ' + f(item.pointCost) + ' rebirth points and ' + f(item.blueCost) + ' blue flames'));
          nodes.node.classList.toggle('purchased', item.level > 0); nodes.node.classList.toggle('maxed', item.maxed); nodes.node.classList.toggle('locked', !!item.lockedReason);
        });
      }
    }
  }
  window.EmberPanels = EmberPanels;
})();
