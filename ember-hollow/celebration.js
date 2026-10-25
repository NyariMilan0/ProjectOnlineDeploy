/* One bounded celebration batch for newly earned achievements. */
(function (root, factory) {
  'use strict';
  const Celebration = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = Celebration;
  if (root) root.EmberCelebration = Celebration;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  class EmberCelebration {
    constructor(options) {
      this.options = options || {};
      this.document = this.options.document || root.document;
      this.setTimeout = this.options.setTimeout || root.setTimeout.bind(root);
      this.clearTimeout = this.options.clearTimeout || root.clearTimeout.bind(root);
      this.layer = this.document.getElementById('celebration-layer');
      if (!this.layer) {
        this.layer = this.document.createElement('div');
        this.layer.id = 'celebration-layer'; this.document.body.appendChild(this.layer);
      }
      this.banner = null; this.particles = null; this.timer = null;
      this.items = new Map(); this.highlighted = new Set(); this.dead = false;
    }
    celebrate(achievements) {
      if (this.dead || !Array.isArray(achievements) || !achievements.length) return;
      let added = false;
      for (const achievement of achievements.slice(0, 64)) {
        if (!achievement || !achievement.id || this.items.has(achievement.id) || this.items.size >= 64) continue;
        this.items.set(achievement.id, { id: achievement.id, title: String(achievement.title || 'A new spark'), icon: achievement.icon || '★' });
        const card = this.document.getElementById('achievement-' + achievement.id);
        if (card) { card.classList.add('celebrating'); this.highlighted.add(card); }
        added = true;
      }
      if (!added) return;
      if (!this.banner) this._begin();
      this._update();
      if (this.timer !== null) this.clearTimeout(this.timer);
      this.timer = this.setTimeout(() => this.clear(), 2700);
    }
    _begin() {
      this.banner = this.document.createElement('div');
      this.banner.className = 'achievement-banner show';
      this.banner.setAttribute('role', 'status'); this.banner.setAttribute('aria-live', 'polite');
      this.icon = this.document.createElement('span'); this.icon.className = 'achievement-banner-icon'; this.icon.setAttribute('aria-hidden', 'true');
      const copy = this.document.createElement('div');
      this.kicker = this.document.createElement('div'); this.kicker.className = 'achievement-banner-kicker';
      this.title = this.document.createElement('div'); this.title.className = 'achievement-banner-title';
      this.subtitle = this.document.createElement('div'); this.subtitle.className = 'achievement-banner-subtitle';
      copy.append(this.kicker, this.title, this.subtitle); this.banner.append(this.icon, copy); this.layer.appendChild(this.banner);
      if (!(this.options.reducedMotion && this.options.reducedMotion())) {
        this.particles = this.document.createElement('div'); this.particles.className = 'achievement-confetti'; this.particles.setAttribute('aria-hidden', 'true');
        const colors = ['#f8cf80', '#eaa35b', '#b7cf9a', '#d7e8b4', '#f1dfa3'];
        for (let index = 0; index < 28; index++) {
          const particle = this.document.createElement('span'); particle.className = 'celebration-particle';
          particle.style.setProperty('--dx', ((index % 2 ? -1 : 1) * (55 + Math.random() * 270)).toFixed(0) + 'px');
          particle.style.setProperty('--dy', (220 + Math.random() * 320).toFixed(0) + 'px');
          particle.style.setProperty('--rotation', ((Math.random() - .5) * 720).toFixed(0) + 'deg');
          particle.style.setProperty('--delay', (index % 7 * .025).toFixed(3) + 's');
          particle.style.backgroundColor = colors[index % colors.length];
          this.particles.appendChild(particle);
        }
        this.layer.appendChild(this.particles);
      }
      if (this.options.sound) this.options.sound();
    }
    _update() {
      const items = [...this.items.values()], first = items[0];
      this.icon.textContent = first.icon;
      this.kicker.textContent = items.length === 1 ? 'ACHIEVEMENT UNLOCKED' : 'ACHIEVEMENTS UNLOCKED';
      this.title.textContent = first.title;
      this.subtitle.textContent = items.length > 1 ? '+' + (items.length - 1) + ' more spark' + (items.length === 2 ? '' : 's') + ' worth remembering' : 'A little milestone. A brighter fire.';
    }
    clear() {
      if (this.timer !== null) this.clearTimeout(this.timer);
      this.timer = null;
      if (this.banner) this.banner.remove();
      if (this.particles) this.particles.remove();
      this.banner = null; this.particles = null;
      this.highlighted.forEach(card => card.classList.remove('celebrating'));
      this.highlighted.clear(); this.items.clear();
    }
    dispose() { this.clear(); this.dead = true; }
  }
  return EmberCelebration;
});
