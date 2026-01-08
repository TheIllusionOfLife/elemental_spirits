class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private beatCount: number = 0;

  constructor() {
    try {
      window.addEventListener('click', () => this.init(), { once: true });
      window.addEventListener('touchstart', () => this.init(), { once: true });
    } catch (e) {
      console.error("Audio support missing");
    }
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5; // Master volume
    this.masterGain.connect(this.ctx.destination);
  }

  // Create a reverb-like decay sound
  playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.5, vol: number = 0.1, attack: number = 0.01) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    
    // Add slight random detune for organic feel
    const detune = (Math.random() - 0.5) * 10;
    osc.detune.setValueAtTime(detune, this.ctx.currentTime);
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    // Envelope - softer attack/decay for glassy feel
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playKick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(120, t); // Punchier kick
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.15);
  }

  playSnare() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    
    // Noise
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    // Tone body
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start();
    osc.start();
    osc.stop(t + 0.1);
    noise.stop(t + 0.1);
  }

  playHiHat() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playSelect() {
    this.playTone(880, 'sine', 0.15, 0.1);
  }

  playConnect(index: number) {
    // Pentatonic scale (C Major Pentatonic) for pleasant linking
    const baseFreqs = [261.63, 293.66, 329.63, 392.00, 440.00]; // C D E G A
    const octave = Math.floor(index / 5);
    const note = baseFreqs[index % 5] * Math.pow(2, octave);
    
    this.playTone(note, 'sine', 0.4, 0.2, 0.02);
    setTimeout(() => {
        this.playTone(note * 2, 'sine', 0.2, 0.05, 0.05);
    }, 10);
  }

  playMatch(count: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const base = 261.63; // C4
    const notes = [base, base * 1.25, base * 1.5]; // C, E, G
    
    // Whoosh sound
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(3000, t + 0.3);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    // Chord
    notes.forEach((f, i) => {
        setTimeout(() => this.playTone(f * (1 + count * 0.1), 'sine', 0.6, 0.15, 0.05), i * 40);
    });
  }

  playExplosion() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Boom
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(150, t);
    osc1.frequency.exponentialRampToValueAtTime(0.01, t + 0.6);
    gain1.gain.setValueAtTime(1.0, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start();
    osc1.stop(t + 0.6);

    // Sparkle
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((f, i) => {
        this.playTone(f, 'sine', 0.8, 0.2, 0.05);
    });
  }

  playLevelUp() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.6, 0.2), i * 100);
    });
  }

  playFeverStart() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(1760, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.3);
  }

  // Pop BGM: Upbeat, Major Scale, 120bpm feel
  playBGM(isFever: boolean = false) {
    if (!this.ctx || this.bgmInterval) return;
    
    // Progression: C - G - Am - F (Classic Pop)
    // C4=261.6, G3=196.0, A3=220.0, F3=174.6
    const roots = [261.63, 196.00, 220.00, 174.61]; 
    // Melody notes (Pentatonic): C5, D5, E5, G5, A5
    const melodyNotes = [523.25, 587.33, 659.25, 783.99, 880.00];

    const tickRate = isFever ? 180 : 250; // ms per 8th note

    const tick = () => {
        this.beatCount++;
        const step = this.beatCount % 8; // 8 steps per bar (4/4 time with 8th notes)
        const barIndex = Math.floor(this.beatCount / 8) % 4;
        const currentRoot = roots[barIndex];

        // Drums: Kick on 1 & 3, Snare on 2 & 4
        if (step === 0 || step === 4) {
            this.playKick();
        }
        if (step === 2 || step === 6) {
            this.playSnare();
        }
        // Fever adds extra hi-hats
        if (isFever && (step % 2 === 1)) {
            this.playHiHat();
        }

        // Bass: Pulse on root
        if (step === 0 || step === 3 || step === 5) {
            this.playTone(currentRoot / 2, 'square', 0.15, 0.15, 0.01);
        }

        // Chords: Stabs on beat 1
        if (step === 0) {
             this.playTone(currentRoot, 'triangle', 0.4, 0.05, 0.02);
             this.playTone(currentRoot * 1.5, 'triangle', 0.4, 0.05, 0.02);
        }

        // Melody: Random upbeat notes
        // Play more frequently in fever
        if ((step % 2 === 0) && Math.random() > (isFever ? 0.2 : 0.4)) {
            const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
            this.playTone(note, 'sine', 0.15, 0.08, 0.01);
        }
    };

    tick(); 
    this.bgmInterval = window.setInterval(tick, tickRate);
  }

  stopBGM() {
    if (this.bgmInterval) {
        clearInterval(this.bgmInterval);
        this.bgmInterval = null;
    }
  }

  setFeverBGM(active: boolean) {
      this.stopBGM();
      this.playBGM(active);
  }
}

export const audio = new SoundManager();