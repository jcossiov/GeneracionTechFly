// src/audio.js
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.musicTimer = null;
    this.musicStep = 0;
    this._musicVolume = 0.35;
    this._sfxVolume = 0.6;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.gain.value = this._musicVolume;
      this.sfxGain.gain.value = this._sfxVolume;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch (e) {
      this.ctx = null;
    }
  }

  setMusicVolume(v) {
    this._musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setSfxVolume(v) {
    this._sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  _tone(freq, dur, type = 'square', gain = 0.2, dest = null, slide = null) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(1, slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _noise(dur, gain = 0.3, filterFreq = 800) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(filterFreq, t);
    filt.frequency.exponentialRampToValueAtTime(100, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur);
  }

  shoot(level = 1) {
    this.ensure();
    const base = 620 + level * 90;
    this._tone(base, 0.075, 'square', 0.11, null, base * 0.48);
  }
  hit() {
    this.ensure();
    this._tone(240, 0.055, 'square', 0.14, null, 130);
  }
  damage() {
    this.ensure();
    this._noise(0.25, 0.35, 600);
    this._tone(120, 0.2, 'sawtooth', 0.2, null, 60);
  }
  explode(big = false) {
    this.ensure();
    this._noise(big ? 0.55 : 0.3, big ? 0.5 : 0.35, big ? 1200 : 900);
    if (big) this._tone(60, 0.45, 'sine', 0.25, null, 30);
  }
  powerup() {
    this.ensure();
    [523, 659, 784].forEach((f, i) => setTimeout(() => this._tone(f, 0.12, 'sine', 0.18), i * 85));
  }
  gateSpawn() {
    this.ensure();
    [440, 587].forEach((f, i) => setTimeout(() => this._tone(f, 0.11, 'triangle', 0.14), i * 90));
  }
  gateSuccess() {
    this.ensure();
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 0.14, 'triangle', 0.22), i * 75));
  }
  gateFail() {
    this.ensure();
    [220, 165].forEach((f, i) => setTimeout(() => this._tone(f, 0.18, 'sawtooth', 0.2), i * 110));
  }
  levelup() {
    this.ensure();
    [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 0.15, 'triangle', 0.2), i * 100));
  }
  boss() {
    this.ensure();
    this._tone(85, 0.65, 'sawtooth', 0.26, null, 40);
  }
  bossOverclock() {
    this.ensure();
    [140, 210, 280].forEach((f, i) => setTimeout(() => this._tone(f, 0.18, 'sawtooth', 0.22), i * 95));
  }
  ui() {
    this.ensure();
    this._tone(880, 0.05, 'sine', 0.12);
  }

  startMusic() {
    this.ensure();
    if (!this.ctx || this.musicTimer) return;
    this.musicOn = true;
    const melody = [
      392, 0, 440, 0, 523, 0, 587, 0, 523, 0, 440, 0, 392, 0, 330, 0,
      262, 0, 330, 0, 392, 0, 440, 0, 392, 0, 330, 0, 294, 0, 330, 0,
    ];
    const bass = [131, 131, 165, 165, 196, 196, 165, 165, 131, 131, 123, 123, 110, 110, 123, 123];
    const stepDur = 0.17;
    this.musicStep = 0;
    const schedule = () => {
      if (!this.ctx || !this.musicOn) return;
      const t = this.ctx.currentTime;
      const i = this.musicStep % melody.length;
      const m = melody[i];
      if (m) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = m;
        g.gain.setValueAtTime(0.0, t);
        g.gain.linearRampToValueAtTime(0.08, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 0.9);
        o.connect(g);
        g.connect(this.musicGain);
        o.start(t);
        o.stop(t + stepDur);
      }
      const j = Math.floor(this.musicStep / 2) % bass.length;
      const b = bass[j];
      const o2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      o2.type = 'sine';
      o2.frequency.value = b;
      g2.gain.setValueAtTime(0.12, t);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 2);
      o2.connect(g2);
      g2.connect(this.musicGain);
      o2.start(t);
      o2.stop(t + stepDur * 2);
      this.musicStep++;
    };
    this.musicTimer = setInterval(schedule, stepDur * 1000);
    schedule();
  }

  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  resumeMusic() {
    this.musicOn = true;
    if (!this.musicTimer) this.startMusic();
  }
}
