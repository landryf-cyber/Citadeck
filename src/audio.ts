/**
 * Son entièrement synthétisé (WebAudio) : une nappe d'ambiance par ère et des retours doux.
 * Aucun fichier audio.
 */

interface EraSound {
  root: number;
  scale: number[];
  drone: OscillatorType;
  droneGain: number;
  droneCut: number;
  noiseFreq: number;
  noiseQ: number;
  noiseGain: number;
  voice: 'flute' | 'lyre' | 'bell' | 'piano' | 'glass';
  every: [number, number];
  octave: number;
}

const ERAS: EraSound[] = [
  // pierre : flûte lointaine, feu, vent grave
  { root: 110, scale: [0, 3, 5, 7, 10], drone: 'sine', droneGain: 0.1, droneCut: 300, noiseFreq: 420, noiseQ: 0.6, noiseGain: 0.035, voice: 'flute', every: [2.6, 5.5], octave: 2 },
  // antiquité : lyre, vent chaud
  { root: 146.83, scale: [0, 1, 4, 5, 7, 8, 10], drone: 'triangle', droneGain: 0.07, droneCut: 520, noiseFreq: 900, noiseQ: 0.4, noiseGain: 0.02, voice: 'lyre', every: [1.1, 2.8], octave: 1 },
  // moyen âge : cloches, bourdon à la quinte
  { root: 130.81, scale: [0, 2, 3, 5, 7, 9, 10], drone: 'sawtooth', droneGain: 0.035, droneCut: 380, noiseFreq: 300, noiseQ: 0.8, noiseGain: 0.016, voice: 'bell', every: [2.8, 5.2], octave: 2 },
  // industrie : bourdon sourd, machines, piano
  { root: 98, scale: [0, 2, 3, 5, 7, 8, 10], drone: 'sawtooth', droneGain: 0.05, droneCut: 240, noiseFreq: 180, noiseQ: 1.2, noiseGain: 0.045, voice: 'piano', every: [1.6, 3.4], octave: 2 },
  // espace : verre, souffle froid
  { root: 164.81, scale: [0, 2, 4, 6, 7, 9, 11], drone: 'sine', droneGain: 0.08, droneCut: 900, noiseFreq: 3200, noiseQ: 0.5, noiseGain: 0.008, voice: 'glass', every: [0.9, 2.6], octave: 2 },
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private echo!: DelayNode;
  private echoGain!: GainNode;
  private noiseBuf!: AudioBuffer;
  private layer: { gain: GainNode; stop: () => void } | null = null;
  private era = -1;
  private wantEra = 0;
  private timer = 0;
  private nextNote = 0;
  private nextBeat = 0;
  private nextMachine = 0;
  private nextCrackle = 0;
  private danger = 0;
  private crisis = false;
  private dead = false;
  enabled = true;
  volume = 0.7;

  /** À appeler sur un geste de l'utilisateur (politique d'autoplay). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(c.destination);
    this.music = c.createGain();
    this.music.gain.value = 0.85;
    this.music.connect(this.master);
    this.sfx = c.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);
    // écho doux partagé
    this.echo = c.createDelay(1.5);
    this.echo.delayTime.value = 0.38;
    const fb = c.createGain();
    fb.gain.value = 0.34;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    this.echoGain = c.createGain();
    this.echoGain.gain.value = 0.5;
    this.echo.connect(lp).connect(fb).connect(this.echo);
    lp.connect(this.echoGain).connect(this.music);
    // bruit
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.04 * w) / 1.04;
      d[i] = w * 0.5 + last * 6;
    }
    this.startEra(this.wantEra);
    this.timer = window.setInterval(() => this.tick(), 120);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this.enabled) void this.ctx.resume();
    });
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.applyVolume();
  }

  setVolume(v: number): void {
    this.volume = v;
    this.applyVolume();
  }

  private applyVolume(): void {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.08);
  }

  setEra(era: number): void {
    this.wantEra = era;
    this.dead = false;
    if (this.ctx && era !== this.era) this.startEra(era);
  }

  setTension(danger: number, crisis: boolean): void {
    this.danger = danger;
    this.crisis = crisis;
  }

  // ------------------------------------------------------------------ ambiance

  private startEra(era: number): void {
    const c = this.ctx;
    if (!c) return;
    const now = c.currentTime;
    if (this.layer) {
      const old = this.layer;
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setTargetAtTime(0, now, 0.9);
      setTimeout(() => old.stop(), 5000);
    }
    this.era = era;
    const e = ERAS[era];
    const g = c.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(1, now + 0.3, 1.2);
    g.connect(this.music);
    const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
    // bourdon : fondamentale + quinte, légèrement désaccordées
    const cut = c.createBiquadFilter();
    cut.type = 'lowpass';
    cut.frequency.value = e.droneCut;
    cut.Q.value = 0.7;
    const dg = c.createGain();
    dg.gain.value = e.droneGain;
    cut.connect(dg).connect(g);
    for (const [mult, det] of [[0.5, -4], [0.5, 5], [0.75, 0], [1, 3]] as [number, number][]) {
      const o = c.createOscillator();
      o.type = e.drone;
      o.frequency.value = e.root * mult;
      o.detune.value = det;
      o.connect(cut);
      o.start();
      nodes.push(o);
    }
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = c.createGain();
    lg.gain.value = e.droneCut * 0.35;
    lfo.connect(lg).connect(cut.frequency);
    lfo.start();
    nodes.push(lfo);
    // souffle
    const n = c.createBufferSource();
    n.buffer = this.noiseBuf;
    n.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = e.noiseFreq;
    bp.Q.value = e.noiseQ;
    const ng = c.createGain();
    ng.gain.value = e.noiseGain;
    const nl = c.createOscillator();
    nl.frequency.value = 0.11;
    const nlg = c.createGain();
    nlg.gain.value = e.noiseGain * 0.6;
    nl.connect(nlg).connect(ng.gain);
    nl.start();
    n.connect(bp).connect(ng).connect(g);
    n.start();
    nodes.push(n, nl);
    this.layer = {
      gain: g,
      stop: () => {
        for (const x of nodes) {
          try {
            x.stop();
          } catch {
            /* déjà arrêté */
          }
        }
        g.disconnect();
      },
    };
    this.nextNote = now + 1.5;
  }

  private freq(e: EraSound, degree: number, octave: number): number {
    const n = e.scale.length;
    const oct = Math.floor(degree / n);
    const semi = e.scale[((degree % n) + n) % n] + 12 * (oct + octave);
    return e.root * Math.pow(2, semi / 12);
  }

  private voice(kind: EraSound['voice'], f: number, t: number, vol: number, dest: AudioNode): void {
    const c = this.ctx!;
    const g = c.createGain();
    g.connect(dest);
    g.connect(this.echo);
    const mk = (type: OscillatorType, freq: number, gain: number, a: number, d: number) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const og = c.createGain();
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(gain * vol, t + a);
      og.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + a + d + 0.05);
      return o;
    };
    switch (kind) {
      case 'flute': {
        const o = mk('sine', f, 0.16, 0.25, 2.2);
        const vib = c.createOscillator();
        vib.frequency.value = 4.6;
        const vg = c.createGain();
        vg.gain.value = f * 0.006;
        vib.connect(vg).connect(o.frequency);
        vib.start(t);
        vib.stop(t + 2.6);
        mk('triangle', f * 2, 0.02, 0.3, 1.2);
        break;
      }
      case 'lyre':
        mk('triangle', f, 0.17, 0.004, 1.4);
        mk('sine', f * 2, 0.05, 0.004, 0.7);
        mk('sine', f * 3, 0.018, 0.004, 0.35);
        break;
      case 'bell':
        mk('sine', f, 0.13, 0.006, 3.6);
        mk('sine', f * 2.76, 0.045, 0.004, 2.0);
        mk('sine', f * 5.4, 0.016, 0.003, 0.9);
        break;
      case 'piano':
        mk('triangle', f, 0.14, 0.006, 1.7);
        mk('sine', f * 2.01, 0.04, 0.006, 0.9);
        mk('sine', f * 0.5, 0.05, 0.01, 1.6);
        break;
      case 'glass':
        mk('sine', f, 0.11, 0.02, 2.6);
        mk('sine', f * 2, 0.04, 0.02, 1.8);
        mk('sine', f * 3.01, 0.012, 0.01, 1.1);
        break;
    }
  }

  private noiseHit(t: number, freq: number, q: number, vol: number, dur: number, dest: AudioNode, type: BiquadFilterType = 'bandpass', sweepTo?: number): void {
    const c = this.ctx!;
    const n = c.createBufferSource();
    n.buffer = this.noiseBuf;
    n.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g).connect(dest);
    n.start(t, Math.random() * 1.5);
    n.stop(t + dur + 0.05);
  }

  private thump(t: number, f0: number, vol: number, dur = 0.3): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.music);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private tick(): void {
    const c = this.ctx;
    if (!c || c.state !== 'running' || this.era < 0) return;
    const now = c.currentTime;
    const e = ERAS[this.era];
    if (this.dead) return;
    // notes éparses
    if (now >= this.nextNote - 0.15) {
      const t = Math.max(now, this.nextNote);
      const deg = Math.floor(Math.random() * (e.scale.length + 3)) - (this.crisis ? 2 : 0);
      const vol = this.crisis ? 0.75 : 1;
      this.voice(e.voice, this.freq(e, deg, e.octave - 1), t, vol, this.music);
      if (Math.random() < 0.35) this.voice(e.voice, this.freq(e, deg + 2 + (Math.random() < 0.5 ? 2 : 0), e.octave - 1), t + (e.voice === 'bell' ? 0.6 : 0.22), vol * 0.7, this.music);
      const [a, b] = e.every;
      this.nextNote = t + (a + Math.random() * (b - a)) * (this.crisis ? 0.7 : 1);
    }
    // crépitement du feu (pierre)
    if (this.era === 0 && now >= this.nextCrackle) {
      this.noiseHit(now, 1800 + Math.random() * 2500, 2, 0.03 + Math.random() * 0.03, 0.03 + Math.random() * 0.04, this.music, 'bandpass');
      this.nextCrackle = now + 0.05 + Math.random() * 0.5;
    }
    // machines (industrie)
    if (this.era === 3 && now >= this.nextMachine - 0.15) {
      const t = Math.max(now, this.nextMachine);
      this.noiseHit(t, 240, 3, 0.05, 0.09, this.music, 'bandpass');
      this.noiseHit(t + 0.3, 900, 5, 0.018, 0.05, this.music, 'bandpass');
      this.thump(t, 62, 0.07, 0.18);
      this.nextMachine = t + 0.6;
    }
    // battement de cœur quand une jauge est en danger
    const tension = Math.max(this.danger, this.crisis ? 0.7 : 0);
    if (tension > 0.05 && now >= this.nextBeat - 0.15) {
      const t = Math.max(now, this.nextBeat);
      const vol = 0.09 + 0.14 * tension;
      this.thump(t, 58, vol, 0.26);
      this.thump(t + 0.17, 50, vol * 0.7, 0.3);
      this.nextBeat = t + (this.crisis ? 0.86 : 1.18);
    }
  }

  // ------------------------------------------------------------------ retours

  private ready(): AudioContext | null {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return null;
    return this.ctx;
  }

  private era_(): EraSound {
    return ERAS[Math.max(0, this.era)];
  }

  swipe(side: 'left' | 'right'): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.noiseHit(t, side === 'left' ? 1700 : 900, 0.9, 0.11, 0.2, this.sfx, 'bandpass', side === 'left' ? 500 : 2600);
    const e = this.era_();
    this.voice(e.voice === 'flute' ? 'lyre' : e.voice, this.freq(e, side === 'left' ? 0 : 2, e.octave), t + 0.02, 0.5, this.sfx);
  }

  cardIn(): void {
    const c = this.ready();
    if (!c) return;
    this.noiseHit(c.currentTime, 2600, 1.5, 0.04, 0.06, this.sfx, 'highpass');
  }

  /** Une petite note par jauge touchée : montante ou descendante. */
  gauge(index: number, up: boolean, big: boolean, delay = 0): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime + 0.1 + delay;
    const base = [330, 392, 494, 587][index] ?? 440;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * (up ? 1.26 : 0.79), t + 0.16);
    const g = c.createGain();
    const v = big ? 0.11 : 0.07;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(this.sfx);
    g.connect(this.echo);
    o.start(t);
    o.stop(t + 0.35);
  }

  ui(): void {
    const c = this.ready();
    if (!c) return;
    const e = this.era_();
    this.voice('lyre', this.freq(e, 4, e.octave), c.currentTime, 0.35, this.sfx);
  }

  crisisHit(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.thump(t, 90, 0.5, 0.9);
    this.thump(t + 0.32, 70, 0.4, 1.0);
    this.noiseHit(t, 160, 0.7, 0.2, 1.4, this.sfx, 'lowpass');
    const e = this.era_();
    this.voice('bell', this.freq(e, 0, e.octave - 2), t, 1.2, this.sfx);
    this.voice('bell', this.freq(e, 0, e.octave - 2) * 1.059, t + 0.05, 0.8, this.sfx);
  }

  reward(): void {
    const c = this.ready();
    if (!c) return;
    const e = this.era_();
    [0, 2, 4].forEach((d, i) => this.voice('lyre', this.freq(e, d, e.octave), c.currentTime + i * 0.09, 0.6, this.sfx));
  }

  wonder(): void {
    const c = this.ready();
    if (!c) return;
    const e = this.era_();
    [0, 2, 4, 7, 9].forEach((d, i) => this.voice('bell', this.freq(e, d, e.octave - 1), c.currentTime + i * 0.13, 0.8, this.sfx));
  }

  eraShift(toEra: number): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.noiseHit(t, 200, 0.6, 0.12, 3.2, this.sfx, 'bandpass', 5000);
    const e = ERAS[toEra];
    [0, 4, 7, 9].forEach((d, i) => this.voice(e.voice, this.freq(e, d, e.octave - 1), t + 1.1 + i * 0.28, 0.9, this.sfx));
  }

  defeat(): void {
    const c = this.ready();
    if (!c) return;
    this.dead = true;
    const t = c.currentTime;
    const e = this.era_();
    [4, 3, 1, 0, -3].forEach((d, i) => this.voice('bell', this.freq(e, d, e.octave - 2), t + i * 0.55, 0.9, this.sfx));
    this.thump(t, 70, 0.4, 1.6);
    if (this.layer) this.layer.gain.gain.setTargetAtTime(0.25, t, 1.5);
  }

  victory(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    const root = 196;
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.voice('bell', root * Math.pow(2, s / 12), t + i * 0.16, 0.8, this.sfx));
  }

  /** Trois coups de maillet : le procès s'ouvre. */
  gavel(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    [0, 0.22, 0.44].forEach((d, i) => {
      this.thump(t + d, 180 - i * 10, 0.35, 0.18);
      this.noiseHit(t + d, 1400, 1.2, 0.06, 0.08, this.sfx, 'bandpass');
    });
  }

  /** Un accord de verre, grave : des ruines, des revenants. */
  mystery(): void {
    const c = this.ready();
    if (!c) return;
    const e = this.era_();
    [0, 3, 7].forEach((d, i) => this.voice('glass', this.freq(e, d, e.octave - 1), c.currentTime + i * 0.18, 1.4, this.sfx));
  }

  /** Relance la nappe après une fin de partie. */
  revive(): void {
    this.dead = false;
    if (this.ctx && this.layer) this.layer.gain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.6);
  }
}
