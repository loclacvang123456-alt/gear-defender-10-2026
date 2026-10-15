import { Texture } from 'pixi.js';
import { GunKind, BuffKind } from './types';

// Helper vẽ Rounded Rectangle an toàn 100% trên mọi trình duyệt
function safeRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Helper vẽ Ellipse an toàn 100% trên mọi trình duyệt
function safeEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(cx, cy);
  ctx.scale(rx, ry);
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.restore();
}

function createHighResTexture(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  drawFn(ctx);

  const texture = Texture.from(canvas);
  return texture;
}

export class PixelAssetManager {
  private static cache: Map<string, Texture> = new Map();

  // 1. Ô bàn cờ 96x96
  static getCellTexture(unlocked: boolean): Texture {
    const key = `cell_hires_${unlocked}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(96, 96, (ctx) => {
      if (unlocked) {
        const grad = ctx.createLinearGradient(0, 0, 96, 96);
        grad.addColorStop(0, '#282d3c');
        grad.addColorStop(1, '#1e2230');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 96, 96);

        ctx.fillStyle = '#181b26';
        ctx.fillRect(4, 4, 88, 88);

        ctx.fillStyle = '#222736';
        ctx.fillRect(6, 6, 84, 84);

        const bolts = [[10, 10], [86, 10], [10, 86], [86, 86]];
        bolts.forEach(([bx, by]) => {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(bx - 1, by - 1, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.strokeStyle = '#2f384d';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(16, 16, 64, 64);
      } else {
        ctx.fillStyle = '#11131a';
        ctx.fillRect(0, 0, 96, 96);
        ctx.fillStyle = '#171922';
        ctx.fillRect(4, 4, 88, 88);
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 2. Bánh Răng Cò (Trigger Gear) 80x80 - Thiết kế dạng CÁI NẪY BÁNH RĂNG (Ratchet / Pawl Lever)
  static getTriggerTexture(level: number): Texture {
    const key = `trigger_hires_${level}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(80, 80, (ctx) => {
      const cx = 40, cy = 40;

      // Các mỏ nẫy bánh răng cơ khí (Pawls)
      for (let i = 0; i < level; i++) {
        const rad = (i * (360 / level) * Math.PI) / 180;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);

        // Cánh nẫy cong dạng mỏ móc cơ học
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(26, -9);
        ctx.lineTo(38, -3); // Đỉnh mỏ nẫy nhô ra ngoài
        ctx.lineTo(34, 4);
        ctx.lineTo(20, 5);
        ctx.lineTo(12, 4);
        ctx.closePath();
        ctx.fill();

        const pawlGrad = ctx.createLinearGradient(12, 0, 38, 0);
        pawlGrad.addColorStop(0, '#f59e0b');
        pawlGrad.addColorStop(1, '#fef08a');
        ctx.fillStyle = pawlGrad;
        ctx.beginPath();
        ctx.moveTo(14, -2);
        ctx.lineTo(25, -7);
        ctx.lineTo(36, -2);
        ctx.lineTo(32, 2);
        ctx.lineTo(18, 3);
        ctx.closePath();
        ctx.fill();

        // Đinh tán chốt khớp nẫy
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(22, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Đĩa xoay trung tâm của bộ nẫy
      const discGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 22);
      discGrad.addColorStop(0, '#d97706');
      discGrad.addColorStop(0.8, '#78350f');
      discGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();

      // Vòng đệm kim loại mạ vàng
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Tâm trục ổ bi
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 3. Đế Súng (BÁNH RĂNG KIM LOẠI 12 RĂNG CƯA) 80x80
  static getGunBaseTexture(tier: number): Texture {
    const key = `gun_base_gear_hires_${tier}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(80, 80, (ctx) => {
      const cx = 40, cy = 40;

      const baseColors = ['#475569', '#1e3a8a', '#581c87', '#78350f', '#831843'];
      const gearRimColors = ['#94a3b8', '#38bdf8', '#c084fc', '#facc15', '#fb7185'];
      const innerColors = ['#334155', '#172554', '#3b0764', '#451a03', '#4c0519'];

      const colorIdx = Math.min(tier - 1, 4);

      // Vẽ Bánh Răng 12 răng cưa cơ khí
      const numTeeth = 12;
      const rInner = 28;
      const rOuter = 37;

      ctx.fillStyle = baseColors[colorIdx];
      ctx.beginPath();
      for (let i = 0; i < numTeeth; i++) {
        const a0 = (i * 2 * Math.PI) / numTeeth;
        const a1 = a0 + Math.PI / numTeeth * 0.35;
        const a2 = a0 + Math.PI / numTeeth * 0.65;
        const a3 = ((i + 1) * 2 * Math.PI) / numTeeth;

        // Điểm chân răng
        const x0 = cx + Math.cos(a0) * rInner;
        const y0 = cy + Math.sin(a0) * rInner;
        // Điểm đỉnh răng 1
        const x1 = cx + Math.cos(a1) * rOuter;
        const y1 = cy + Math.sin(a1) * rOuter;
        // Điểm đỉnh răng 2
        const x2 = cx + Math.cos(a2) * rOuter;
        const y2 = cy + Math.sin(a2) * rOuter;
        // Điểm chân răng kế
        const x3 = cx + Math.cos(a3) * rInner;
        const y3 = cy + Math.sin(a3) * rInner;

        if (i === 0) ctx.moveTo(x0, y0);
        else ctx.lineTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
      }
      ctx.closePath();
      ctx.fill();

      // Viền kim loại nổi
      ctx.strokeStyle = gearRimColors[colorIdx];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vành trong bánh răng
      ctx.fillStyle = innerColors[colorIdx];
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();

      // 4 Lỗ khoét giảm trọng lượng cơ khí
      for (let j = 0; j < 4; j++) {
        const holeAngle = (j * Math.PI) / 2;
        const hx = cx + Math.cos(holeAngle) * 16;
        const hy = cy + Math.sin(holeAngle) * 16;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = gearRimColors[colorIdx];
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Trục xoay nòng súng ở giữa
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 3.5. Icon Thùng Rác (Bán món đồ) 64x64
  static getTrashIconTexture(): Texture {
    const key = `trash_icon_hires`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(64, 64, (ctx) => {
      const cx = 32, cy = 32;

      // Nắp thùng rác mở nghiêng
      ctx.save();
      ctx.translate(cx, cy - 10);
      ctx.rotate(-0.25);
      ctx.fillStyle = '#ffffff';
      safeRoundRect(ctx, -18, -4, 36, 6, 2);
      ctx.fill();
      // Quai nắp
      ctx.fillRect(-6, -9, 12, 5);
      ctx.restore();

      // Thân thùng rác
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy - 6);
      ctx.lineTo(cx + 15, cy - 6);
      ctx.lineTo(cx + 12, cy + 20);
      ctx.lineTo(cx - 12, cy + 20);
      ctx.closePath();
      ctx.fill();

      // 3 Vạch gân dập nổi trên thân
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 8, cy - 2, 3, 18);
      ctx.fillRect(cx - 1.5, cy - 2, 3, 18);
      ctx.fillRect(cx + 5, cy - 2, 3, 18);
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 4. Nòng Súng Xoay Độc Lập 80x80 (Tâm tại 40, 40)
  static getGunBarrelTexture(kind: GunKind, level: number): Texture {
    const key = `gun_barrel_hires_${kind}_${level}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(80, 80, (ctx) => {
      const cx = 40, cy = 40;

      ctx.save();
      ctx.translate(cx, cy);

      if (kind === 'PISTOL') {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-6, -30, 12, 30);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-4, -28, 8, 28);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-5, -34, 10, 5);
      } else if (kind === 'CROSSBOW') {
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-4, -30, 8, 30);
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, -10, 24, Math.PI * 0.8, Math.PI * 2.2);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.lineTo(-6, -26);
        ctx.lineTo(6, -26);
        ctx.closePath();
        ctx.fill();
      } else if (kind === 'CRYO') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-7, -28, 14, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-4, -26, 8, 26);
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(0, -38);
        ctx.lineTo(-7, -26);
        ctx.lineTo(7, -26);
        ctx.closePath();
        ctx.fill();
      } else if (kind === 'FLAMER') {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-8, -26, 16, 26);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-5, -24, 10, 24);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-9, -26);
        ctx.lineTo(9, -26);
        ctx.lineTo(13, -34);
        ctx.lineTo(-13, -34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-6, -36, 12, 3);
      } else if (kind === 'SHOTGUN') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(-9, -30, 7, 30);
        ctx.fillRect(2, -30, 7, 30);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-7, -28, 4, 28);
        ctx.fillRect(4, -28, 4, 28);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-10, -34, 20, 5);
      } else if (kind === 'CANNON') {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-12, -32, 24, 32);
        ctx.fillStyle = '#44403c';
        ctx.fillRect(-9, -30, 18, 30);
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.arc(0, -32, 14, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-5, -36, 10, 4);
      } else { // TESLA
        ctx.fillStyle = '#6b21a8';
        ctx.fillRect(-6, -26, 12, 26);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-3, -24, 6, 24);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -12, 14, 0, Math.PI * 2);
        ctx.arc(0, -22, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(0, -34, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -34, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 5. Bánh Răng Buff 80x80
  static getBuffTexture(kind: BuffKind, level: number): Texture {
    const key = `buff_hires_${kind}_${level}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(80, 80, (ctx) => {
      const cx = 40, cy = 40;

      const colors = {
        DMG: { bg: '#7f1d1d', fg: '#ef4444', core: '#fee2e2', glow: '#f87171' },
        SPEED: { bg: '#1e3a8a', fg: '#3b82f6', core: '#dbeafe', glow: '#60a5fa' },
        FILL: { bg: '#14532d', fg: '#22c55e', core: '#dcfce7', glow: '#4ade80' },
        CRIT: { bg: '#713f12', fg: '#eab308', core: '#fef9c3', glow: '#fde047' },
      }[kind];

      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.fg;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = colors.core;
      if (kind === 'DMG') {
        ctx.fillRect(cx - 3, cy - 16, 6, 32);
        ctx.fillRect(cx - 10, cy - 4, 20, 6);
      } else if (kind === 'SPEED') {
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy - 10);
        ctx.lineTo(cx - 2, cy);
        ctx.lineTo(cx - 12, cy + 10);
        ctx.moveTo(cx + 2, cy - 10);
        ctx.lineTo(cx + 12, cy);
        ctx.lineTo(cx + 2, cy + 10);
        ctx.strokeStyle = colors.core;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (kind === 'FILL') {
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy - 16);
        ctx.lineTo(cx - 6, cy);
        ctx.lineTo(cx + 2, cy);
        ctx.lineTo(cx - 4, cy + 16);
        ctx.lineTo(cx + 8, cy - 2);
        ctx.lineTo(cx, cy - 2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(cx, cy - 16);
        ctx.lineTo(cx + 5, cy - 5);
        ctx.lineTo(cx + 16, cy);
        ctx.lineTo(cx + 5, cy + 5);
        ctx.lineTo(cx, cy + 16);
        ctx.lineTo(cx - 5, cy + 5);
        ctx.lineTo(cx - 16, cy);
        ctx.lineTo(cx - 5, cy - 5);
        ctx.closePath();
        ctx.fill();
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 6. Quái vật
  static getEnemyTexture(type: 'NORMAL' | 'FAST' | 'TANK' | 'BOSS'): Texture {
    const key = `enemy_hires_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = type === 'BOSS' ? 96 : (type === 'TANK' ? 64 : 48);
    const tex = createHighResTexture(size, size, (ctx) => {
      const cx = size / 2, cy = size / 2;

      if (type === 'NORMAL') {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 3, 3.5, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 5, cy + 6, 3, 4);
        ctx.fillRect(cx + 2, cy + 6, 3, 4);
      } else if (type === 'FAST') {
        ctx.fillStyle = '#6b21a8';
        safeEllipse(ctx, cx, cy, 20, 14);
        ctx.fill();

        ctx.fillStyle = '#c084fc';
        safeEllipse(ctx, cx, cy, 15, 10);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 2, 3, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'TANK') {
        ctx.fillStyle = '#1e293b';
        safeRoundRect(ctx, cx - 26, cy - 26, 52, 52, 8);
        ctx.fill();

        ctx.fillStyle = '#475569';
        safeRoundRect(ctx, cx - 22, cy - 22, 44, 44, 6);
        ctx.fill();

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.strokeRect(cx - 16, cy - 16, 32, 32);

        ctx.fillStyle = '#fb923c';
        ctx.fillRect(cx - 10, cy - 6, 6, 6);
        ctx.fillRect(cx + 4, cy - 6, 6, 6);
      } else { // BOSS
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy - 24);
        ctx.lineTo(cx - 36, cy - 42);
        ctx.lineTo(cx - 16, cy - 32);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 24, cy - 24);
        ctx.lineTo(cx + 36, cy - 42);
        ctx.lineTo(cx + 16, cy - 32);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx - 12, cy - 4, 6, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx - 12, cy - 4, 3, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 7. Đạn Plasma
  static getBulletTexture(element: string): Texture {
    const key = `bullet_hires_${element}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(16, 24, (ctx) => {
      const cx = 8, cy = 12;

      if (element === 'ICE') {
        const grad = ctx.createLinearGradient(0, 0, 0, 24);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#0284c7');
        ctx.fillStyle = grad;
        safeEllipse(ctx, cx, cy, 4, 10);
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (element === 'FIRE') {
        const grad = ctx.createLinearGradient(0, 0, 0, 24);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(1, '#ea580c');
        ctx.fillStyle = grad;
        safeEllipse(ctx, cx, cy, 5, 10);
        ctx.fill();
      } else if (element === 'EXPLOSIVE') {
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (element === 'ELECTRIC') {
        ctx.fillStyle = '#a855f7';
        safeEllipse(ctx, cx, cy, 4, 10);
        ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(cx - 2, cy - 8, 4, 16);
      } else { // NORMAL
        const grad = ctx.createLinearGradient(0, 0, 0, 24);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#3b82f6');
        ctx.fillStyle = grad;
        safeEllipse(ctx, cx, cy, 4, 9);
        ctx.fill();
      }
    });

    this.cache.set(key, tex);
    return tex;
  }
}
