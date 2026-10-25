/* Original, quietly looping fireside score. Audio starts only after a gesture. */
(function (root, factory) {
  'use strict';
  const Audio = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = Audio;
  if (root) root.EmberAudio = Audio;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const STEP_SECONDS = 60 / 76 / 2;
  const MELODY = [
    57, null, 60, 64, 62, null, 60, 57,
    60, null, 64, 67, 64, 62, 60, null,
    57, 60, null, 62, 64, null, 60, 57,
    55, null, 59, 62, 60, 59, 57, null,
    57, null, 60, 64, 67, null, 64, 62,
    60, 64, null, 67, 64, 62, 60, null,
    57, null, 60, 62, 64, 60, 57, null,
    55, 59, null, 62, 60, 59, 57, null
  ];
  const BASS = [45, 48, 41, 43, 45, 48, 41, 43];
  const midi = note => 440 * Math.pow(2, (note - 69) / 12);

  class EmberAudio {
    constructor(environment) {
      this.environment = environment || {};
      this.preferences = { music: true, musicVolume: 20, sound: false };
      this.context = null;
      this.musicBus = null;
      this.soundBus = null;
      this.unlocked = false;
      this.hidden = false;
      this.dead = false;
      this.timer = null;
      this.step = 0;
      this.nextTime = 0;
      this.stepsScheduled = 0;
      this.voices = new Set();
      this.lastClickAt = -Infinity;
      this.setInterval = this.environment.setInterval || root.setInterval.bind(root);
      this.clearInterval = this.environment.clearInterval || root.clearInterval.bind(root);
    }
    setPreferences(preferences) {
      if (this.dead || !preferences) return;
      for (const key of ['music', 'sound']) {
        if (typeof preferences[key] === 'boolean') this.preferences[key] = preferences[key];
      }
      if (typeof preferences.musicVolume === 'number' && Number.isFinite(preferences.musicVolume)) {
        this.preferences.musicVolume = Math.max(0, Math.min(100, preferences.musicVolume));
      }
      if (this.context) {
        this._gain(this.musicBus, this.preferences.music ? this.preferences.musicVolume / 100 * .18 : 0);
        this._gain(this.soundBus, this.preferences.sound ? .045 : 0);
      }
      if (!this.preferences.sound) this._stopVoices('sound');
      this._syncMusic();
    }
    unlock() {
      if (this.dead) return;
      this.unlocked = true;
      if (this.preferences.music || this.preferences.sound) this._ensureContext();
      if (this.context && this.context.state === 'suspended') {
        try { Promise.resolve(this.context.resume()).catch(() => {}); } catch (_) {}
      }
      this._syncMusic();
    }
    setHidden(hidden) {
      if (this.dead) return;
      this.hidden = Boolean(hidden);
      if (this.hidden) this._stopVoices('sound');
      this._syncMusic();
    }
    _gain(bus, value) {
      if (!bus) return;
      const time = this.context.currentTime;
      bus.gain.cancelScheduledValues(time);
      bus.gain.setTargetAtTime(value, time, .025);
    }
    _ensureContext() {
      if (this.context) return true;
      const AudioContext = this.environment.AudioContext || root.AudioContext || root.webkitAudioContext;
      if (!AudioContext || !this.unlocked || this.dead) return false;
      try {
        this.context = new AudioContext();
        this.musicBus = this.context.createGain();
        this.soundBus = this.context.createGain();
        this.musicBus.gain.setValueAtTime(this.preferences.musicVolume / 100 * .18, this.context.currentTime);
        this.soundBus.gain.setValueAtTime(this.preferences.sound ? .045 : 0, this.context.currentTime);
        this.musicBus.connect(this.context.destination);
        this.soundBus.connect(this.context.destination);
        return true;
      } catch (_) {
        this.context = null;
        return false;
      }
    }
    _syncMusic() {
      const wantsMusic = this.unlocked && !this.dead && !this.hidden && this.preferences.music && this.preferences.musicVolume > 0;
      if (!wantsMusic || !this._ensureContext()) {
        if (this.timer !== null) this.clearInterval(this.timer);
        this.timer = null;
        this._stopVoices('music');
        return;
      }
      if (this.timer !== null) return;
      if (this.context.state === 'suspended') {
        try { Promise.resolve(this.context.resume()).catch(() => {}); } catch (_) {}
      }
      this.nextTime = this.context.currentTime + .04;
      this._pump();
      this.timer = this.setInterval(() => this._pump(), 100);
    }
    _pump() {
      if (this.dead || this.hidden || !this.context || !this.preferences.music) return;
      const now = this.context.currentTime;
      // A stalled tab resumes the score, rather than scheduling its missed notes.
      if (this.nextTime < now - .5) this.nextTime = now + .025;
      let budget = 4;
      while (this.nextTime < now + .35 && budget-- > 0) {
        const index = this.step % MELODY.length;
        const bar = Math.floor(index / 8);
        const note = MELODY[index];
        if (note !== null) this._note(note, this.nextTime, STEP_SECONDS * .78, 'triangle', .25, 'music');
        if (index % 4 === 0) this._note(BASS[bar], this.nextTime, STEP_SECONDS * 2.4, 'sine', .2, 'music');
        if (index % 8 === 0) {
          this._note(BASS[bar] + 12, this.nextTime, STEP_SECONDS * 7.6, 'triangle', .045, 'music');
          this._note(BASS[bar] + 19, this.nextTime + .015, STEP_SECONDS * 7.5, 'triangle', .035, 'music');
        }
        this.step = (this.step + 1) % MELODY.length;
        this.stepsScheduled++;
        this.nextTime += STEP_SECONDS;
      }
    }
    _note(note, time, duration, type, volume, channel) {
      if (!this.context || this.voices.size >= 24 || this.dead) return;
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(midi(note), time);
      envelope.gain.setValueAtTime(.0001, time);
      envelope.gain.linearRampToValueAtTime(volume, time + Math.min(.025, duration / 5));
      envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
      oscillator.connect(envelope);
      envelope.connect(channel === 'music' ? this.musicBus : this.soundBus);
      const voice = { oscillator, envelope, channel };
      this.voices.add(voice);
      oscillator.onended = () => this._cleanup(voice);
      oscillator.start(time);
      oscillator.stop(time + duration + .02);
    }
    _cleanup(voice) {
      this.voices.delete(voice);
      try { voice.oscillator.disconnect(); voice.envelope.disconnect(); } catch (_) {}
      voice.oscillator.onended = null;
    }
    _stopVoices(channel) {
      for (const voice of [...this.voices]) {
        if (channel && voice.channel !== channel) continue;
        try { voice.oscillator.stop(this.context.currentTime); } catch (_) {}
        this._cleanup(voice);
      }
    }
    play(kind) {
      if (this.dead || this.hidden || !this.unlocked || !this.preferences.sound || !this._ensureContext()) return;
      const now = this.context.currentTime;
      if (kind === 'click') {
        if (now - this.lastClickAt < .085) return;
        this.lastClickAt = now;
        this._note(55, now, .085, 'triangle', .22, 'sound');
      } else if (kind === 'achievement') {
        [60, 64, 67, 72].forEach((note, index) => this._note(note, now + index * .09, .28, 'triangle', .22, 'sound'));
      } else {
        this._note(64, now, .15, 'triangle', .25, 'sound');
        this._note(72, now + .1, .22, 'triangle', .2, 'sound');
      }
    }
    status() {
      return { unlocked: this.unlocked, playing: this.timer !== null, voices: this.voices.size, stepsScheduled: this.stepsScheduled, step: this.step };
    }
    dispose() {
      if (this.dead) return;
      this.dead = true;
      if (this.timer !== null) this.clearInterval(this.timer);
      this.timer = null;
      this._stopVoices();
      if (this.context) {
        try { this.musicBus.disconnect(); this.soundBus.disconnect(); Promise.resolve(this.context.close()).catch(() => {}); } catch (_) {}
      }
    }
  }
  return EmberAudio;
});
