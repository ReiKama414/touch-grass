import { ThemeMode } from '../types/scene';

/**
 * Procedural Web Audio API Nature Soundscape Generator
 * Synthesizes:
 * 1. Continuous soft wind rustling through grass (dual-band modulated pink/brown noise)
 * 2. Gentle daytime birdsong (harmonic FM chirps at organic intervals)
 * 3. Nighttime cricket chorus (rhythmic high-frequency stridulation bursts)
 *
 * Requires zero external audio assets and never throws 404/decode errors.
 */
export class NatureSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private dayGain: GainNode | null = null;
  private nightGain: GainNode | null = null;
  private isEnabled = false;
  private mode: ThemeMode = 'day';
  private loopTimer: number | null = null;

  public toggle(enable?: boolean): boolean {
    const next = enable !== undefined ? enable : !this.isEnabled;
    if (next && !this.ctx) {
      this.initContext();
    }
    this.isEnabled = next;

    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended' && this.isEnabled) {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.isEnabled ? 0.55 : 0.0001, now, 0.45);
    }
    return this.isEnabled;
  }

  public setMode(mode: ThemeMode): void {
    this.mode = mode;
    if (!this.ctx || !this.dayGain || !this.nightGain) return;
    const now = this.ctx.currentTime;
    this.dayGain.gain.cancelScheduledValues(now);
    this.nightGain.gain.cancelScheduledValues(now);
    this.dayGain.gain.setTargetAtTime(mode === 'day' ? 1.0 : 0.05, now, 0.8);
    this.nightGain.gain.setTargetAtTime(mode === 'night' ? 1.0 : 0.0, now, 0.8);
  }

  public triggerRustle(intensity: number): void {
    if (!this.isEnabled || !this.ctx || !this.windGain) return;
    const now = this.ctx.currentTime;
    const boost = Math.min(0.38, 0.16 + intensity * 0.18);
    this.windGain.gain.setTargetAtTime(boost, now, 0.08);
    this.windGain.gain.setTargetAtTime(0.16, now + 0.18, 0.45);
  }

  private initContext(): void {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    const now = this.ctx.currentTime;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.connect(this.ctx.destination);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.16, now);
    this.windGain.connect(this.masterGain);

    this.dayGain = this.ctx.createGain();
    this.dayGain.gain.setValueAtTime(this.mode === 'day' ? 1.0 : 0.05, now);
    this.dayGain.connect(this.masterGain);

    this.nightGain = this.ctx.createGain();
    this.nightGain.gain.setValueAtTime(this.mode === 'night' ? 1.0 : 0.0, now);
    this.nightGain.connect(this.masterGain);

    // Create 4-second pink noise buffer for soft meadow wind
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(420, now);
    windFilter.Q.setValueAtTime(1.4, now);

    // Slow LFO modulating wind filter frequency to mimic sweeping gusts
    const windLfo = this.ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.setValueAtTime(0.14, now);
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.setValueAtTime(210, now);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    noiseSource.connect(windFilter);
    windFilter.connect(this.windGain);

    noiseSource.start(now);
    windLfo.start(now);

    // Periodic ambient bird & cricket scheduling
    this.loopTimer = window.setInterval(() => {
      if (!this.isEnabled || !this.ctx || this.ctx.state !== 'running') return;
      if (this.mode === 'day') {
        if (Math.random() < 0.55) {
          this.scheduleBirdChirp();
        }
      } else {
        this.scheduleCricketPulse();
      }
    }, 1600);
  }

  private scheduleBirdChirp(): void {
    if (!this.ctx || !this.dayGain) return;
    const now = this.ctx.currentTime + Math.random() * 0.4;
    const notes = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < notes; i++) {
      const t0 = now + i * (0.14 + Math.random() * 0.08);
      const dur = 0.09 + Math.random() * 0.06;
      const baseFreq = 2100 + Math.random() * 1100;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t0);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (1.18 + Math.random() * 0.15), t0 + dur * 0.55);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, t0 + dur);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(0.028, t0 + dur * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      if (panner) {
        panner.pan.setValueAtTime((Math.random() - 0.5) * 1.4, t0);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.dayGain);
      } else {
        osc.connect(gain);
        gain.connect(this.dayGain);
      }

      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
  }

  private scheduleCricketPulse(): void {
    if (!this.ctx || !this.nightGain) return;
    const now = this.ctx.currentTime + Math.random() * 0.25;
    const pulses = 3 + Math.floor(Math.random() * 3);
    const freq = 3950 + Math.random() * 320;

    for (let i = 0; i < pulses; i++) {
      const t0 = now + i * 0.055;
      const dur = 0.032;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(0.016, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.connect(gain);
      gain.connect(this.nightGain);

      osc.start(t0);
      osc.stop(t0 + dur + 0.01);
    }
  }

  public dispose(): void {
    if (this.loopTimer !== null) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
