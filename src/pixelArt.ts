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

  // 2. Bánh Răng Cò (Trigger Gear) 80x80
  static getTriggerTexture(level: number): Texture {
    const key = `trigger_hires_${level}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(80, 80, (ctx) => {
      const cx = 40, cy = 40;

      for (let i = 0; i < level; i++) {
        const rad = (i * (360 / level) * Math.PI) / 180;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);

        const armGrad = ctx.createLinearGradient(0, 0, 36, 0);
        armGrad.addColorStop(0, '#d97706');
        armGrad.addColorStop(1, '#fbbf24');
        ctx.fillStyle = armGrad;
        safeRoundRect(ctx, 14, -6, 24, 12, 3);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(36, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      const discGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 26);
      discGrad.addColorStop(0, '#b45309');
      discGrad.addColorStop(0.7, '#78350f');
      discGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 21, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 3. Bệ Tháp Súng (Base) 80x80
  static getGunBaseTexture(tier: number): Texture {
    const key = `gun_base_hires_${tier}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(80, 80, (ctx) => {
      const cx = 40, cy = 40;

      const baseColors = ['#334155', '#1e3a5f', '#3b1d54', '#5c3111', '#5c1122'];
      const borderColors = ['#64748b', '#38bdf8', '#c084fc', '#fbbf24', '#f43f5e'];

      const colorIdx = Math.min(tier - 1, 4);

      ctx.fillStyle = baseColors[colorIdx];
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const rad = (i * 60 * Math.PI) / 180;
        const x = cx + Math.cos(rad) * 34;
        const y = cy + Math.sin(rad) * 34;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = borderColors[colorIdx];
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
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
