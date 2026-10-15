import { GunKind } from './types';

// Web Audio Retro Synthesizer - Không cần file âm thanh ngoài
class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Helper tạo buffer tiếng ồn (Noise) cho lửa, nổ, đạn pháo
  private createNoiseBuffer(duration: number = 0.15): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Tiếng bánh răng gõ "tách"
  playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Điều phối âm thanh chuẩn xác cho từng loại trong 11 súng
  playGunShot(kind: GunKind) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    switch (kind) {
      case 'PISTOL': { // Tia plasma năng lượng cao "píu!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.09);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.1);
        break;
      }

      case 'CROSSBOW': { // Tiếng dây cung nảy "bật / phụp!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.13);
        break;
      }

      case 'SLINGSHOT': { // Tiếng ná cao su nảy đá "tưng / bốp!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.09);
        break;
      }

      case 'CRYO': { // Tiếng pha lê băng kết tinh "keng / rít lạnh!"
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(1400, t);
        osc1.frequency.exponentialRampToValueAtTime(950, t + 0.14);
        osc2.frequency.setValueAtTime(2100, t);
        osc2.frequency.exponentialRampToValueAtTime(1300, t + 0.14);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(t + 0.15);
        osc2.stop(t + 0.15);
        break;
      }

      case 'FLAMER': { // Tiếng lửa phun phụt "phùuuu / xèo xèo!"
        const noise = this.createNoiseBuffer(0.18);
        if (noise) {
          const src = this.ctx.createBufferSource();
          src.buffer = noise;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(600, t);
          filter.Q.setValueAtTime(1.5, t);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.24, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          src.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          src.start();
          src.stop(t + 0.19);
        }
        break;
      }

      case 'SHOTGUN': { // Tiếng shotgun uy lực giòn giã "ĐÙNG!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.16);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.17);

        const noise = this.createNoiseBuffer(0.12);
        if (noise) {
          const src = this.ctx.createBufferSource();
          src.buffer = noise;
          const nGain = this.ctx.createGain();
          nGain.gain.setValueAtTime(0.22, t);
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          src.connect(nGain);
          nGain.connect(this.ctx.destination);
          src.start();
          src.stop(t + 0.13);
        }
        break;
      }

      case 'CANNON': { // Tiếng đại bác nổ trầm vang "BÙM BOOM!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.32);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.35);

        const noise = this.createNoiseBuffer(0.22);
        if (noise) {
          const src = this.ctx.createBufferSource();
          src.buffer = noise;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, t);
          const nGain = this.ctx.createGain();
          nGain.gain.setValueAtTime(0.3, t);
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          src.connect(filter);
          filter.connect(nGain);
          nGain.connect(this.ctx.destination);
          src.start();
          src.stop(t + 0.23);
        }
        break;
      }

      case 'TESLA': { // Tiếng sét giật đanh thép "Zzzzaap / khẹt khẹt!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.setValueAtTime(1200, t + 0.03);
        osc.frequency.setValueAtTime(450, t + 0.06);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.14);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.15);
        break;
      }

      case 'SNIPER': { // Tiếng đạn tỉa xé gió siêu thanh "CHÁT / ĐÙNG!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1600, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
        gain.gain.setValueAtTime(0.38, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.19);
        break;
      }

      case 'MINIGUN': { // Tiếng súng 6 nòng liên thanh đanh thép "cắc cắc cắc!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.05);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.06);
        break;
      }

      case 'METEOR': { // Tiếng thiên thạch giáng trần rung chuyển đất trời "ẦM ẦM BOOM!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.45);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.48);

        const noise = this.createNoiseBuffer(0.35);
        if (noise) {
          const src = this.ctx.createBufferSource();
          src.buffer = noise;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320, t);
          const nGain = this.ctx.createGain();
          nGain.gain.setValueAtTime(0.4, t);
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          src.connect(filter);
          filter.connect(nGain);
          nGain.connect(this.ctx.destination);
          src.start();
          src.stop(t + 0.36);
        }
        break;
      }

      default: {
        this.playShoot(1);
        break;
      }
    }
  }

  // Tiếng súng bắn cơ bản (fallback)
  playShoot(tier: number = 1) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = tier >= 3 ? 'sawtooth' : 'square';
    const startFreq = 600 + tier * 80;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  // Tiếng đạn trúng quái "bụp"
  playHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  // Tiếng ghép súng MERGE "ting ting!"
  playMerge() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.18, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.14);
    });
  }

  // Tiếng nổ quái chết / Boss hit
  playExplode() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }
}

export const sound = new SoundController();
