'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const EmberAudio = require('../audio.js');

function openAudio() {
  const timers = new Map(), contexts = [];
  let nextId = 1;
  class Parameter {
    constructor() { this.value = 0; this.events = []; }
    cancelScheduledValues(time) { this.events.push({ kind: 'cancel', time }); }
    setValueAtTime(value, time) { this.value = value; this.events.push({ kind: 'set', value, time }); }
    setTargetAtTime(value, time, constant) { this.value = value; this.events.push({ kind: 'target', value, time, constant }); }
    linearRampToValueAtTime(value, time) { this.events.push({ kind: 'linear', value, time }); }
    exponentialRampToValueAtTime(value, time) { this.events.push({ kind: 'exponential', value, time }); }
  }
  class Gain {
    constructor() { this.gain = new Parameter(); this.connected = false; }
    connect(target) { this.connected = true; this.target = target; }
    disconnect() { this.connected = false; }
  }
  class Oscillator {
    constructor(context) { this.context = context; this.frequency = new Parameter(); this.connected = false; this.onended = null; this.ended = false; }
    connect(target) { this.connected = true; this.target = target; }
    disconnect() { this.connected = false; }
    start(time) { this.startTime = time; }
    stop(time) { this.stopTime = time; }
  }
  class Context {
    constructor() { contexts.push(this); this.currentTime = 0; this.state = 'running'; this.destination = {}; this.oscillators = []; this.gains = []; this.closed = false; }
    createGain() { const gain = new Gain(); this.gains.push(gain); return gain; }
    createOscillator() { const oscillator = new Oscillator(this); this.oscillators.push(oscillator); return oscillator; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    close() { this.closed = true; return Promise.resolve(); }
    advance(seconds) {
      this.currentTime += seconds;
      this.oscillators.forEach(oscillator => {
        if (!oscillator.ended && oscillator.stopTime <= this.currentTime) {
          oscillator.ended = true;
          if (oscillator.onended) oscillator.onended();
        }
      });
    }
  }
  const audio = new EmberAudio({ AudioContext: Context,
    setInterval: callback => { const id = nextId++; timers.set(id, callback); return id; },
    clearInterval: id => timers.delete(id)
  });
  const advance = seconds => {
    for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += .1) {
      contexts.forEach(context => context.advance(Math.min(.1, seconds - elapsed)));
      [...timers.values()].forEach(callback => callback());
    }
  };
  return { audio, timers, contexts, advance };
}

test('music never creates an audio context or scheduler before a user gesture', () => {
  const h = openAudio();
  h.audio.setPreferences({ music: true, musicVolume: 20, sound: true });
  h.audio.setHidden(false); h.audio.play('achievement');
  assert.equal(h.contexts.length, 0); assert.equal(h.timers.size, 0);
  h.audio.unlock();
  assert.equal(h.contexts.length, 1); assert.equal(h.timers.size, 1);
  assert.equal(h.audio.status().playing, true);
  assert.ok(h.audio.status().voices > 0);
  h.audio.dispose();
});

test('volume, mute, visibility and repeated preference changes keep exactly one music scheduler', () => {
  const h = openAudio(); h.audio.unlock();
  for (let index = 0; index < 100; index++) { h.audio.unlock(); h.audio.setPreferences({ music: true, musicVolume: 20 }); }
  assert.equal(h.timers.size, 1);
  h.audio.setPreferences({ musicVolume: 70 });
  assert.ok(Math.abs(h.contexts[0].gains[0].gain.value - .126) < 1e-12);
  h.audio.setPreferences({ musicVolume: 0 });
  assert.equal(h.timers.size, 0); assert.equal(h.audio.status().voices, 0);
  h.audio.setPreferences({ musicVolume: 20 });
  assert.equal(h.timers.size, 1);
  h.audio.setHidden(true);
  assert.equal(h.timers.size, 0); assert.equal(h.audio.status().voices, 0);
  h.audio.setHidden(false); assert.equal(h.timers.size, 1);
  h.audio.setPreferences({ music: false });
  assert.equal(h.timers.size, 0); assert.equal(h.audio.status().playing, false);
  assert.ok(h.contexts[0].oscillators.every(oscillator => !oscillator.connected));
  h.audio.dispose();
});

test('the original melody loops while voices and scheduling work remain bounded', () => {
  const h = openAudio(); h.audio.unlock();
  let maximumVoices = 0;
  for (let second = 0; second < 60; second++) { h.advance(1); maximumVoices = Math.max(maximumVoices, h.audio.status().voices); }
  assert.ok(h.audio.status().stepsScheduled > 128, 'a minute should cross the 64-step loop more than twice');
  assert.ok(h.audio.status().step >= 0 && h.audio.status().step < 64);
  assert.ok(maximumVoices <= 24, 'ended notes must be disconnected instead of accumulating');
  const before = h.audio.status().stepsScheduled;
  h.contexts[0].advance(1e7);
  [...h.timers.values()].forEach(callback => callback());
  assert.ok(h.audio.status().stepsScheduled - before <= 4, 'a delayed timer must not replay millions of missed notes');
  assert.ok(h.contexts[0].oscillators.filter(oscillator => oscillator.connected).every(oscillator => oscillator.startTime <= h.contexts[0].currentTime + .365));
  h.audio.dispose();
});

test('interaction sounds are independent of music and repeated clicks cannot flood audio nodes', () => {
  const h = openAudio(); h.audio.setPreferences({ music: false, sound: true }); h.audio.unlock();
  assert.equal(h.timers.size, 0);
  for (let index = 0; index < 10000; index++) h.audio.play('click');
  assert.equal(h.audio.status().voices, 1);
  h.advance(.2); h.audio.play('click');
  assert.equal(h.audio.status().voices, 1);
  h.audio.play('achievement'); assert.equal(h.audio.status().voices, 5);
  h.audio.setPreferences({ sound: false }); assert.equal(h.audio.status().voices, 0);
  h.audio.play('achievement'); assert.equal(h.audio.status().voices, 0);
  h.audio.dispose();
  assert.equal(h.contexts[0].closed, true); assert.equal(h.timers.size, 0);
  h.audio.unlock(); h.audio.play('buy'); assert.equal(h.audio.status().voices, 0);
});
