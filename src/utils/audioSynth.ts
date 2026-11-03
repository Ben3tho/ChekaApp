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

  // Dramatic Shock sound ("Eeeh Mungu wangu / Dun dun dunnn")
  public playShock() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [160, 220, 311];
    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.5);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  // Reward / Daily Streak / Level up cheerful chime
  public playReward() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  // Pop sound alias
  public playPop() {
    this.playBoing();
  }

  // Victory sound alias
  public playVictory() {
    this.playReward();
  }

  // Universal key-based player
  public playSoundByKey(key: string) {
    switch (key) {
      case 'vine_boom':
        this.playVineBoom();
        break;
      case 'laugh':
        this.playLaugh();
        break;
      case 'rimshot':
        this.playRimshot();
        break;
      case 'bruh':
        this.playBruh();
        break;
      case 'sad_trombone':
        this.playSadTrombone();
        break;
      case 'boing':
        this.playBoing();
        break;
      case 'shock':
        this.playShock();
        break;
      case 'reward':
        this.playReward();
        break;
      default:
        this.playLikeSound();
        break;
    }
  }
}

export const memeAudio = new MemeAudioEngine();

export interface SoundReaction {
  id: string;
  name: string;
  nameSw: string;
  emoji: string;
  badgeColor: string;
  soundKey: string;
}

export const MEME_SOUND_REACTIONS: SoundReaction[] = [
  { id: 'vine_boom', name: 'Vine Boom', nameSw: 'Kishindo (Boom)', emoji: '💥', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30', soundKey: 'vine_boom' },
  { id: 'laugh', name: 'Babu Laugh', nameSw: 'Kicheko Cha Babu', emoji: '🤣', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30', soundKey: 'laugh' },
  { id: 'rimshot', name: 'Ba-Dum Tss', nameSw: 'Ngoma & Sahani', emoji: '🥁', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', soundKey: 'rimshot' },
  { id: 'bruh', name: 'Bruh / Eeiish', nameSw: 'Aiseee (Bruh)', emoji: '🤦‍♂️', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', soundKey: 'bruh' },
  { id: 'sad_trombone', name: 'Sad Trombone', nameSw: 'Nimekwisha (Wah)', emoji: '🎺', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30', soundKey: 'sad_trombone' },
  { id: 'boing', name: 'Cartoon Boing', nameSw: 'Kuruka (Boing)', emoji: '🦘', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', soundKey: 'boing' },
  { id: 'shock', name: 'Dramatic Shock', nameSw: 'Mshangao (Eeeh!)', emoji: '😱', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30', soundKey: 'shock' },
  { id: 'reward', name: 'Cheer / Win', nameSw: 'Sarafu / Ushindi', emoji: '🎉', badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30', soundKey: 'reward' },
];
