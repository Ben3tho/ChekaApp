/**
 * Web Audio API synthesizer for hilarious meme sound effects.
 * 100% self-contained, no external network audio dependency issues.
 */

class MemeAudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Classic Rimshot ("Ba-dum tss!")
  public playRimshot() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Drum hit 1 ("Ba")
    this.playDrumHit(now, 180, 0.08);

    // Drum hit 2 ("dum")
    this.playDrumHit(now + 0.12, 140, 0.1);

    // Cymbal splash ("tss!")
    this.playCymbal(now + 0.25, 0.4);
  }

  private playDrumHit(startTime: number, freq: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(30, startTime + duration);

    gain.gain.setValueAtTime(0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playCymbal(startTime: number, duration: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration);
  }

  // Vine Boom (Heavy low sub-bass explosion)
  public playVineBoom() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.7);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  // Boing Cartoon Spring
  public playBoing() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Comedic Swahili / African Laugh Burst
  public playLaugh() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Series of 5 rapid cheerful pitch bursts ("He-he-he-ha-ha!")
    const pitches = [320, 360, 310, 380, 420];
    pitches.forEach((freq, idx) => {
      const burstTime = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, burstTime);
      osc.frequency.linearRampToValueAtTime(freq - 40, burstTime + 0.08);

      gain.gain.setValueAtTime(0.35, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.01, burstTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(burstTime);
      osc.stop(burstTime + 0.1);
    });
  }

  // Bruh / Oh No Voice Synthesizer
  public playBruh() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Sad Trombone (Wah wah wah waaaah)
  public playSadTrombone() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 246.94, delay: 0, dur: 0.25 }, // B3
      { freq: 233.08, delay: 0.3, dur: 0.25 }, // Bb3
      { freq: 220.00, delay: 0.6, dur: 0.25 }, // A3
      { freq: 207.65, delay: 0.9, dur: 0.6 } // Ab3 slide
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, now + n.delay);
      if (n.dur > 0.4) {
        osc.frequency.exponentialRampToValueAtTime(n.freq - 30, now + n.delay + n.dur);
      }

      gain.gain.setValueAtTime(0.2, now + n.delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.delay + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.delay);
      osc.stop(now + n.delay + n.dur);
    });
  }

  // Heart like burst sound
  public playLikeSound() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const memeAudio = new MemeAudioEngine();
