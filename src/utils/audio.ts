/**
 * Web Audio API based Relaxing Sound Synthesizer for "Scribble to Art"
 * Requires zero external audio files and runs completely client-side.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private ambientInterval: number | null = null;
  private isAmbientPlaying: boolean = false;
  private lastStrokeSoundTime: number = 0;

  constructor() {
    // Load persisted preferences
    try {
      const savedSound = localStorage.getItem('scribble_sound_enabled');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';

      const savedMusic = localStorage.getItem('scribble_music_enabled');
      if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
    } catch {
      // ignore
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(val: boolean) {
    this.soundEnabled = val;
    try {
      localStorage.setItem('scribble_sound_enabled', String(val));
    } catch {
      // ignore
    }
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    try {
      localStorage.setItem('scribble_music_enabled', String(val));
    } catch {
      // ignore
    }
    if (!val) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
  }

  /**
   * Subtle, textured soft brush / pencil sound while drawing
   */
  public playStrokeSound() {
    if (!this.soundEnabled) return;
    const now = Date.now();
    // Throttle to avoid audio buffer saturation
    if (now - this.lastStrokeSoundTime < 65) return;
    this.lastStrokeSoundTime = now;

    try {
      this.initContext();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 850 + Math.random() * 400;
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.015, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Audio context error guard
    }
  }

  /**
   * Soft wooden pop / click for undo, redo, and tool clicks
   */
  public playClick(pitch: number = 520) {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, t + 0.06);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // ignore
    }
  }

  /**
   * Gentle completion chime / harp arpeggio (C5, E5, G5, B5, C6)
   */
  public playCompletionChime() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const frequencies = [523.25, 659.25, 783.99, 987.77, 1046.5]; // C5, E5, G5, B5, C6
      const baseTime = this.ctx.currentTime;

      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = baseTime + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 1.7);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Frame reveal chime (warm deep chime)
   */
  public playFrameReveal() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const freqs = [392.0, 587.33, 880.0]; // G4, D5, A5
      const baseTime = this.ctx.currentTime;

      freqs.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, baseTime);

        gain.gain.setValueAtTime(0, baseTime);
        gain.gain.linearRampToValueAtTime(0.09, baseTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, baseTime + 2.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(baseTime);
        osc.stop(baseTime + 2.3);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Continuous peaceful generative ambient music
   * (Subtle warm pad + spaced pentatonic singing bell notes)
   */
  public startAmbient() {
    if (!this.musicEnabled || this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;

    const playAmbientChord = () => {
      if (!this.musicEnabled || !this.isAmbientPlaying) return;
      try {
        this.initContext();
        if (!this.ctx) return;

        // F pentatonic notes (F3, A3, C4, D4, F4, G4)
        const scale = [174.61, 220.0, 261.63, 293.66, 349.23, 392.0, 523.25];
        const randomNote = scale[Math.floor(Math.random() * scale.length)];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(randomNote, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.025, t + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 4.8);
      } catch {
        // ignore
      }
    };

    playAmbientChord();
    this.ambientInterval = window.setInterval(playAmbientChord, 4500);
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientInterval !== null) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
