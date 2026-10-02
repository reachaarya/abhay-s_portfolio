// A tiny generative lo-fi beat built entirely with the Web Audio API.
// No audio files needed: drums, chords, bass, melody and vinyl crackle are all synthesized.

export const BPM = 84;

const CHORDS = [
  { notes: [53, 57, 60, 64, 67], bass: 41 }, // Fmaj9
  { notes: [52, 55, 59, 62, 66], bass: 40 }, // Em9
  { notes: [50, 53, 57, 60, 64], bass: 38 }, // Dm9
  { notes: [48, 52, 55, 59, 62], bass: 36 }, // Cmaj9
];
const MELODY = [72, 74, 76, 79, 81, 84];
const KICK = [0, 7, 10];
const SNARE = [4, 12];

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class LofiPlayer {
  constructor() {
    this.playing = false;
    this.ctx = null;
    this.level = 0;
  }

  init() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());

    this.master = ctx.createGain();
    this.master.gain.value = 0;

    const warm = ctx.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 3800;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.freq = new Uint8Array(this.analyser.frequencyBinCount);

    this.master.connect(warm).connect(comp).connect(this.analyser).connect(ctx.destination);

    // Shared noise buffer for drums + crackle
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // Melody echo
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = (60 / BPM) * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    const delayOut = ctx.createGain();
    delayOut.gain.value = 0.4;
    this.delay.connect(fb).connect(this.delay);
    this.delay.connect(delayOut).connect(this.master);

    this.crackle();
  }

  crackle() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const g = ctx.createGain();
    g.gain.value = 0.012;
    src.connect(hp).connect(g).connect(this.master);
    src.start();
  }

  async toggle() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.playing ? this.stop() : this.start();
    return this.playing;
  }

  start() {
    const t = this.ctx.currentTime;
    this.playing = true;
    this.step = 0;
    this.nextTime = t + 0.08;
    this.startTime = this.nextTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.85, t, 0.4);
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.25);
  }

  /** Current position in beats (quarter notes), or null when silent. */
  getBeat() {
    if (!this.playing || !this.ctx) return null;
    return Math.max(0, (this.ctx.currentTime - this.startTime) * (BPM / 60));
  }

  /** Smoothed 0..1 loudness for UI meters. */
  getLevel() {
    if (!this.ctx || !this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.freq);
    let s = 0;
    for (let i = 0; i < 32; i++) s += this.freq[i];
    const v = s / (32 * 255);
    this.level += (v - this.level) * 0.3;
    return this.level;
  }

  getBands(n = 5) {
    if (!this.ctx || !this.analyser) return new Array(n).fill(0);
    this.analyser.getByteFrequencyData(this.freq);
    const out = [];
    const size = Math.floor(48 / n);
    for (let b = 0; b < n; b++) {
      let s = 0;
      for (let i = 0; i < size; i++) s += this.freq[b * size + i + 1];
      out.push(s / (size * 255));
    }
    return out;
  }

  schedule() {
    const sixteenth = 60 / BPM / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      // lazy swing on off-16ths
      const swing = this.step % 2 ? sixteenth * 0.18 : 0;
      this.playStep(this.step, this.nextTime + swing);
      this.nextTime += sixteenth;
      this.step++;
    }
  }

  playStep(step, t) {
    const s = step % 16;
    const bar = Math.floor(step / 16) % 4;
    const chord = CHORDS[bar];
    const barLen = (60 / BPM) * 4;

    if (KICK.includes(s)) this.kick(t);
    if (SNARE.includes(s)) this.snare(t);
    if (s % 2 === 0) this.hat(t, s % 4 === 2 ? 0.09 : 0.05);
    if (s === 0) {
      this.pad(chord.notes, t, barLen);
      this.bass(chord.bass, t, barLen * 0.45);
    }
    if (s === 8) this.bass(chord.bass + 7, t, barLen * 0.3);
    if ((s === 3 || s === 6 || s === 11 || s === 14) && Math.random() < 0.55) {
      this.pluck(MELODY[Math.floor(Math.random() * MELODY.length)], t);
    }
  }

  env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  kick(t) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    this.env(g, t, 0.9, 0.004, 0.38);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.45);
  }

  snare(t) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1700;
    bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    this.env(g, t, 0.32, 0.003, 0.2);
    n.connect(bp).connect(g).connect(this.master);
    n.start(t, Math.random());
    n.stop(t + 0.25);

    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 185;
    const og = this.ctx.createGain();
    this.env(og, t, 0.18, 0.002, 0.09);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + 0.12);
  }

  hat(t, vol) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    this.env(g, t, vol, 0.002, 0.045);
    n.connect(hp).connect(g).connect(this.master);
    n.start(t, Math.random());
    n.stop(t + 0.07);
  }

  pad(notes, t, len) {
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700, t);
    lp.frequency.linearRampToValueAtTime(1500, t + len * 0.5);
    lp.frequency.linearRampToValueAtTime(800, t + len);
    lp.connect(this.master);
    notes.forEach((m, i) => {
      [-7, 7].forEach((detune) => {
        const o = this.ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = mtof(m);
        o.detune.value = detune;
        const g = this.ctx.createGain();
        const start = t + i * 0.025; // gentle strum
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.045, start + 0.12);
        g.gain.setValueAtTime(0.045, start + len * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, start + len);
        o.connect(g).connect(lp);
        o.start(start);
        o.stop(start + len + 0.05);
      });
    });
  }

  bass(m, t, len) {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = mtof(m);
    const g = this.ctx.createGain();
    this.env(g, t, 0.38, 0.02, len);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + len + 0.1);
  }

  pluck(m, t) {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = mtof(m);
    const g = this.ctx.createGain();
    this.env(g, t, 0.12, 0.005, 0.5);
    o.connect(g);
    g.connect(this.master);
    g.connect(this.delay);
    o.start(t);
    o.stop(t + 0.6);
  }
}
