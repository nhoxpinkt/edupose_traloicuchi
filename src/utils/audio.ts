// Cute Educational Web Audio API Synthesizer & BGM Engine
// 100% self-generated sounds - zero external audio assets required

class CuteAudioEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public bgmEnabled: boolean = true;

  public get enabled(): boolean {
    return this.sfxEnabled;
  }

  public set enabled(val: boolean) {
    this.sfxEnabled = val;
  }

  // BGM playback state
  private isBgmPlaying: boolean = false;
  private bgmTimeoutId: any = null;
  private bgmMasterGain: GainNode | null = null;
  private bgmNoteIndex: number = 0;

  // Initialize or resume AudioContext
  public initContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // ----------------------------------------------------
  // CUTE ADORABLE BACKGROUND MUSIC (BGM)
  // Generates a soft, lofi music-box / xylophone melody
  // ----------------------------------------------------
  public startBgm(): void {
    if (this.isBgmPlaying || !this.bgmEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isBgmPlaying = true;

    // Master gain for BGM (soft background volume)
    if (!this.bgmMasterGain) {
      this.bgmMasterGain = ctx.createGain();
      this.bgmMasterGain.gain.setValueAtTime(0.12, ctx.currentTime);
      this.bgmMasterGain.connect(ctx.destination);
    }

    this.playNextBgmNote();
  }

  public stopBgm(): void {
    this.isBgmPlaying = false;
    if (this.bgmTimeoutId) {
      clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
  }

  public toggleBgm(): boolean {
    if (this.isBgmPlaying) {
      this.bgmEnabled = false;
      this.stopBgm();
      return false;
    } else {
      this.bgmEnabled = true;
      this.startBgm();
      return true;
    }
  }

  private playNextBgmNote(): void {
    if (!this.isBgmPlaying || !this.bgmEnabled || !this.ctx || !this.bgmMasterGain) return;

    // Cute relaxing pentatonic melody pattern (C major / A minor pentatonic: C, D, E, G, A, C)
    const melody: { note: number; duration: number; rest: number }[] = [
      { note: 523.25, duration: 0.18, rest: 260 }, // C5
      { note: 587.33, duration: 0.16, rest: 260 }, // D5
      { note: 659.25, duration: 0.22, rest: 520 }, // E5
      { note: 587.33, duration: 0.16, rest: 260 }, // D5
      { note: 523.25, duration: 0.24, rest: 520 }, // C5
      { note: 783.99, duration: 0.24, rest: 520 }, // G5
      { note: 659.25, duration: 0.22, rest: 520 }, // E5

      { note: 880.00, duration: 0.22, rest: 320 }, // A5
      { note: 783.99, duration: 0.20, rest: 320 }, // G5
      { note: 659.25, duration: 0.22, rest: 420 }, // E5
      { note: 523.25, duration: 0.18, rest: 260 }, // C5
      { note: 587.33, duration: 0.20, rest: 260 }, // D5
      { note: 523.25, duration: 0.35, rest: 750 }, // C5 (rest phrase)
    ];

    const current = melody[this.bgmNoteIndex % melody.length];
    this.bgmNoteIndex++;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft music-box chime character (sine + low-passed triangle)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(current.note, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + current.duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmMasterGain);

      osc.start(now);
      osc.stop(now + current.duration + 0.05);
    } catch {}

    this.bgmTimeoutId = setTimeout(() => {
      this.playNextBgmNote();
    }, current.rest);
  }

  // ----------------------------------------------------
  // SOUND EFFECTS (SFX)
  // ----------------------------------------------------

  // 1. Correct Answer: Sparkling joyful victory arpeggio + bell chime
  public playCorrect(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.45);
    });

    // Shimmer sparkle overlay
    setTimeout(() => {
      if (!ctx) return;
      const t = ctx.currentTime;
      const chime = ctx.createOscillator();
      const cGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(1567.98, t); // G6
      cGain.gain.setValueAtTime(0.15, t);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      chime.connect(cGain);
      cGain.connect(ctx.destination);
      chime.start(t);
      chime.stop(t + 0.5);
    }, 280);
  }

  // 2. Wrong Answer: Cute, gentle cartoon wobble (encouraging, not harsh)
  public playWrong(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(170, now + 0.18);
    osc.frequency.linearRampToValueAtTime(130, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 3. Countdown Tick: Crisp cute woodblock / clock tap
  public playTick(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 4. Gesture Holding Tick: Ascending cute bubble pop as progress bar fills
  public playHoldTick(progressPercent: number): void {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch scales from 400Hz up to 900Hz
    const freq = 400 + (progressPercent / 100) * 500;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 5. Gesture Locked: Clear crystal ding confirming answer
  public playLock(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12); // G6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 6. Button Click / Tap: Soft cute water-drop pop
  public playClick(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.04);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 7. Victory Fanfare: Glorious game finish melody
  public playFanfare(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.12, t: 0.0 },   // C5
      { f: 523.25, d: 0.12, t: 0.14 },  // C5
      { f: 523.25, d: 0.12, t: 0.28 },  // C5
      { f: 659.25, d: 0.22, t: 0.42 },  // E5
      { f: 783.99, d: 0.22, t: 0.68 },  // G5
      { f: 1046.5, d: 0.65, t: 0.94 },  // C6
      { f: 1318.5, d: 0.85, t: 1.10 },  // E6
    ];

    notes.forEach(({ f, d, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0, now + t);
      gain.gain.linearRampToValueAtTime(0.24, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d + 0.05);
    });
  }
}

export const sounds = new CuteAudioEngine();
