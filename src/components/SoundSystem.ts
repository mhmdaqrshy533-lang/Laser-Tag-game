/**
 * SoundSystem.ts
 * Procedural synthesizer for the Cyber Military sovereign sound design.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private marchInterval: any = null;
  private isMarchPlaying = false;
  private mainGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.mainGain = this.ctx.createGain();
      this.mainGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.mainGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  private ensureUnlocked() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playAlarm() {
    this.ensureUnlocked();
    if (!this.ctx || !this.mainGain) return;
    const now = this.ctx.currentTime;

    // Dual-oscillator alarm beep (pulsing red military warning)
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.3;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.25);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.mainGain);

      osc.start(t);
      osc.stop(t + 0.26);
    }
  }

  playWeaponCharge() {
    this.ensureUnlocked();
    if (!this.ctx || !this.mainGain) return;
    const now = this.ctx.currentTime;
    const duration = 1.2;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + duration);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(122, now);
    osc2.frequency.exponentialRampToValueAtTime(1210, now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.mainGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  }

  playClick() {
    this.ensureUnlocked();
    if (!this.ctx || !this.mainGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.mainGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playSelect() {
    this.ensureUnlocked();
    if (!this.ctx || !this.mainGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.mainGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  startMilitaryMarch() {
    this.ensureUnlocked();
    if (this.isMarchPlaying || !this.ctx || !this.mainGain) return;
    this.isMarchPlaying = true;

    let step = 0;
    const tempo = 110; // BPM
    const stepDuration = 60 / tempo / 2; // Eighth notes

    const playBeat = () => {
      if (!this.ctx || !this.mainGain) return;
      const now = this.ctx.currentTime;

      // Pulse 1: Low heavy tactical kick drum (rhythmic march)
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.mainGain);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      // Pulse 2: Military snare/noise accent on step 2 and 6
      if (step % 4 === 2) {
        const noise = this.ctx.createOscillator(); // Simple pitch snap for military cadence
        const gain = this.ctx.createGain();
        noise.type = "triangle";
        noise.frequency.setValueAtTime(220, now);
        noise.frequency.linearRampToValueAtTime(350, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        noise.connect(gain);
        gain.connect(this.mainGain);
        noise.start(now);
        noise.stop(now + 0.09);
      }

      // Pulse 3: Cybernetic dark drone synth (every 16 steps, play epic brass chord notes)
      if (step % 16 === 0 || step % 16 === 6 || step % 16 === 12) {
        const chordNotes = [110, 130.81, 164.81, 220]; // Minor epic military pad
        const baseFreq = step % 16 === 12 ? 146.83 : (step % 16 === 6 ? 130.81 : 110);
        
        const oscDrone = this.ctx.createOscillator();
        const gainDrone = this.ctx.createGain();
        oscDrone.type = "sawtooth";
        oscDrone.frequency.setValueAtTime(baseFreq, now);
        oscDrone.frequency.linearRampToValueAtTime(baseFreq * 1.02, now + stepDuration * 3);
        
        gainDrone.gain.setValueAtTime(0.001, now);
        gainDrone.gain.linearRampToValueAtTime(0.04, now + 0.2);
        gainDrone.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 3);
        
        // Lowpass filter for dark rumble
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(350, now);
        
        oscDrone.connect(filter);
        filter.connect(gainDrone);
        gainDrone.connect(this.mainGain);
        
        oscDrone.start(now);
        oscDrone.stop(now + stepDuration * 3);
      }

      step = (step + 1) % 32;
    };

    this.marchInterval = setInterval(playBeat, stepDuration * 1000);
  }

  stopMilitaryMarch() {
    if (this.marchInterval) {
      clearInterval(this.marchInterval);
      this.marchInterval = null;
    }
    this.isMarchPlaying = false;
  }
}

export const sound = new SoundSystem();
