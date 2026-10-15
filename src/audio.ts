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

  // Tiếng ghép súng MERGE thăng cấp cực kỳ kích thích theo bậc Tier Rarity
  playMerge(tier: number = 2) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const clampedTier = Math.min(5, Math.max(2, tier));

    // 1. TIER 2: HIẾM (Xanh) - Chuông ngọc thánh thót 3 nốt
    if (clampedTier === 2) {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.05);
        gain.gain.setValueAtTime(0.2, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.18);
      });
      return;
    }

    // 2. TIER 3: SỬ THI (Tím) - Hợp âm huyền bí 4 nốt vang vọng
    if (clampedTier === 3) {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + i * 0.045);
        gain.gain.setValueAtTime(0.24, t + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.045);
        osc.stop(t + i * 0.045 + 0.24);

        // Hài âm lấp lánh (Shimmer overtone)
        const shimmer = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(freq * 2, t + i * 0.045);
        sGain.gain.setValueAtTime(0.08, t + i * 0.045);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.18);
        shimmer.connect(sGain);
        sGain.connect(this.ctx.destination);
        shimmer.start(t + i * 0.045);
        shimmer.stop(t + i * 0.045 + 0.2);
      });
      return;
    }

    // 3. TIER 4: HUYỀN THOẠI (Vàng Kim) - Kèn đồng hoàng gia 5 nốt + Sub Kick
    if (clampedTier === 4) {
      // Sub-punch khai màn
      const sub = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(90, t);
      sub.frequency.exponentialRampToValueAtTime(30, t + 0.2);
      sGain.gain.setValueAtTime(0.35, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      sub.connect(sGain);
      sGain.connect(this.ctx.destination);
      sub.start(t);
      sub.stop(t + 0.22);

      // Fanfare vàng rực rỡ
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + i * 0.04);
        gain.gain.setValueAtTime(0.2, t + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.04);
        osc.stop(t + i * 0.04 + 0.3);

        const bell = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq * 1.5, t + i * 0.04);
        bGain.gain.setValueAtTime(0.12, t + i * 0.04);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.25);
        bell.connect(bGain);
        bGain.connect(this.ctx.destination);
        bell.start(t + i * 0.04);
        bell.stop(t + i * 0.04 + 0.26);
      });
      return;
    }

    // 4. TIER 5: THẦN THOẠI (Đỏ) - Khúc khải hoàn tối thượng cực đỉnh chấn động
    // Sub-bass rung màn hình
    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(120, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.35);
    sGain.gain.setValueAtTime(0.45, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    sub.connect(sGain);
    sGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 0.38);

    // 6 Nốt Arpeggio thần thánh
    [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.045);
      gain.gain.setValueAtTime(0.24, t + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.045);
      osc.stop(t + i * 0.045 + 0.42);

      const sparkle = this.ctx.createOscillator();
      const spGain = this.ctx.createGain();
      sparkle.type = 'triangle';
      sparkle.frequency.setValueAtTime(freq * 2, t + i * 0.045);
      spGain.gain.setValueAtTime(0.15, t + i * 0.045);
      spGain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.35);
      sparkle.connect(spGain);
      spGain.connect(this.ctx.destination);
      sparkle.start(t + i * 0.045);
      sparkle.stop(t + i * 0.045 + 0.38);
    });
  }

  // Tiếng máy cơ khí quay xúc xắc + vật phẩm xuất hiện thần thánh (Roll & Spawn SFX)
  playRollSpawn() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Tiếng cơ khí bánh cóc gõ nhịp nhanh (Ratchet click)
    [0, 0.035, 0.07].forEach((delay, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + idx * 120, t + delay);
      osc.frequency.exponentialRampToValueAtTime(140, t + delay + 0.03);
      gain.gain.setValueAtTime(0.18, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + delay);
      osc.stop(t + delay + 0.035);
    });

    // 2. Tiếng xả khí nén nhẹ (Steam release puff)
    const noise = this.createNoiseBuffer(0.12);
    if (noise) {
      const src = this.ctx.createBufferSource();
      src.buffer = noise;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t + 0.06);
      filter.Q.setValueAtTime(3.0, t + 0.06);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(t + 0.06);
      src.stop(t + 0.19);
    }

    // 3. Chuông ngân vật phẩm thần kỳ xuất hiện (Magic spawn chime arpeggio: C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + 0.09 + idx * 0.04);
      gain.gain.setValueAtTime(0.22, t + 0.09 + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09 + idx * 0.04 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + 0.09 + idx * 0.04);
      osc.stop(t + 0.09 + idx * 0.04 + 0.3);

      // Thêm harmonic lấp lánh nhẹ
      const shimmer = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(freq * 2, t + 0.09 + idx * 0.04);
      sGain.gain.setValueAtTime(0.08, t + 0.09 + idx * 0.04);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09 + idx * 0.04 + 0.2);
      shimmer.connect(sGain);
      sGain.connect(this.ctx.destination);
      shimmer.start(t + 0.09 + idx * 0.04);
      shimmer.stop(t + 0.09 + idx * 0.04 + 0.22);
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
