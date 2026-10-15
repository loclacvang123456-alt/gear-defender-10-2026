import { Texture } from 'pixi.js';
import { GunKind, BuffKind, EnemyKind } from './types';

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

  // 2. Bánh Răng Cò (Trigger Pawl Lever) 150x150 - Cánh nẫy cơ khí to lớn, vươn dài 62px chạm khít vào bánh răng kề
  static getTriggerTexture(level: number): Texture {
    const key = `trigger_hires_v2_${level}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(150, 150, (ctx) => {
      const cx = 75, cy = 75;

      // Các tay nẫy cơ khí vươn dài (Pawl Arms)
      for (let i = 0; i < level; i++) {
        const rad = (i * (360 / level) * Math.PI) / 180;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);

        // Thân cánh tay nẫy bằng đồng thau dày dặn, vươn dài từ r=16 ra r=65
        // Bản ngoài (Shadow & Outline)
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(14, -8);
        ctx.lineTo(46, -12);
        ctx.lineTo(65, -4); // Mỏ nẫy vát nhọn chạm khít vào răng của bánh răng kề!
        ctx.lineTo(61, 8);
        ctx.lineTo(44, 10);
        ctx.lineTo(14, 8);
        ctx.closePath();
        ctx.fill();

        // Mặt trên cánh nẫy (Gradient kim loại mạ vàng đồng)
        const armGrad = ctx.createLinearGradient(16, 0, 65, 0);
        armGrad.addColorStop(0, '#d97706');
        armGrad.addColorStop(0.5, '#f59e0b');
        armGrad.addColorStop(0.9, '#fef08a');
        armGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = armGrad;
        ctx.beginPath();
        ctx.moveTo(16, -6);
        ctx.lineTo(45, -9);
        ctx.lineTo(62, -3); // Mỏ gạt cơ học
        ctx.lineTo(58, 6);
        ctx.lineTo(43, 7);
        ctx.lineTo(16, 6);
        ctx.closePath();
        ctx.fill();

        // Rãnh dẫn hướng gia cường lực đẩy trên cánh nẫy
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(48, 0);
        ctx.stroke();

        // 2 Đinh tán thép gia cường tại khớp nối
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(30, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(29, -1, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(46, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(45, -1, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Đĩa xoay trung tâm chịu lực (Central Flywheel Disc)
      const discGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 26);
      discGrad.addColorStop(0, '#f59e0b');
      discGrad.addColorStop(0.7, '#b45309');
      discGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();

      // Vành đệm kim loại nổi
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.stroke();

      // 4 Đinh tán đối xứng trên đĩa trung tâm
      for (let j = 0; j < 4; j++) {
        const da = (j * Math.PI) / 2;
        const dx = cx + Math.cos(da) * 16;
        const dy = cy + Math.sin(da) * 16;
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(dx - 0.7, dy - 0.7, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Trục ổ bi thép ở giữa
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 3. Đế Súng (BÁNH RĂNG CÔNG NGHIỆP 10 RĂNG BẢN TO) 96x96 - HOÀN TOÀN ĐỒNG TÂM 100%
  static getGunBaseTexture(tier: number): Texture {
    const key = `gun_base_gear_hires_v4_${tier}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(96, 96, (ctx) => {
      const cx = 48, cy = 48;

      // Bảng màu chuẩn Rarity Gaming: 1 Trắng, 2 Xanh, 3 Tím, 4 Vàng, 5 Đỏ
      const gearMainColors = ['#94a3b8', '#2563eb', '#7e22ce', '#d97706', '#dc2626'];
      const gearRimColors = ['#f8fafc', '#60a5fa', '#c084fc', '#fde047', '#f87171'];
      const gearInnerColors = ['#475569', '#1d4ed8', '#581c87', '#92400e', '#991b1b'];
      const gearGrooveColors = ['#ffffff', '#93c5fd', '#e9d5ff', '#fef08a', '#fecaca'];

      const colorIdx = Math.min(Math.max(0, tier - 1), 4);
      const mainCol = gearMainColors[colorIdx];
      const rimCol = gearRimColors[colorIdx];
      const innerCol = gearInnerColors[colorIdx];
      const grooveCol = gearGrooveColors[colorIdx];

      const numTeeth = 10;
      const rRoot = 32;
      const rOuter = 42;

      // 1. Vẽ 10 răng bản to hình thang (đồng tâm tuyệt đối cx, cy)
      ctx.fillStyle = mainCol;
      ctx.beginPath();
      for (let i = 0; i < numTeeth; i++) {
        const theta = (i * 2 * Math.PI) / numTeeth;
        const aRootLeft = theta - 0.22;
        const aCrestLeft = theta - 0.12;
        const aCrestRight = theta + 0.12;
        const aRootRight = theta + 0.22;

        const p0x = cx + Math.cos(aRootLeft) * rRoot;
        const p0y = cy + Math.sin(aRootLeft) * rRoot;

        const p1x = cx + Math.cos(aCrestLeft) * rOuter;
        const p1y = cy + Math.sin(aCrestLeft) * rOuter;

        const p2x = cx + Math.cos(aCrestRight) * rOuter;
        const p2y = cy + Math.sin(aCrestRight) * rOuter;

        const p3x = cx + Math.cos(aRootRight) * rRoot;
        const p3y = cy + Math.sin(aRootRight) * rRoot;

        if (i === 0) ctx.moveTo(p0x, p0y);
        else ctx.lineTo(p0x, p0y);
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
      }
      ctx.closePath();
      ctx.fill();

      // Viền kim loại nổi sắc nét quanh các răng
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 2. Vành tròn thân bánh răng (đồng tâm cx, cy)
      ctx.fillStyle = innerCol;
      ctx.beginPath();
      ctx.arc(cx, cy, 31, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = rimCol;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Vành rãnh kim loại đồng tâm nổi màu Rarity
      ctx.strokeStyle = grooveCol;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.stroke();

      // Viền tương phản cho rãnh bạc
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 27.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 22.5, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Lỗ rỗng xuyên tâm lớn (Center Bore) ở giữa (đồng tâm cx, cy)
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Vòng bạc nhỏ trong lòng lỗ tâm
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.stroke();

      // Khớp trục xoay ở giữa
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
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
      } else if (kind === 'TESLA') {
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
      } else if (kind === 'SLINGSHOT') {
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-4, -18, 8, 18);
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-11, -32);
        ctx.lineTo(-4, -18);
        ctx.lineTo(4, -18);
        ctx.lineTo(11, -32);
        ctx.stroke();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-11, -32);
        ctx.lineTo(0, -22);
        ctx.lineTo(11, -32);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, -22, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'SNIPER') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-4, -44, 8, 44);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-2, -42, 4, 42);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-5, -46, 10, 5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-7, -26, 14, 8);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-5, -24, 10, 4);
      } else if (kind === 'MINIGUN') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-8, -32, 16, 32);
        for (let b = 0; b < 6; b++) {
          const ba = (b * Math.PI) / 3;
          const bx = Math.cos(ba) * 5;
          const by = -20 + Math.sin(ba) * 3;
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-9, -36, 18, 4);
      } else { // METEOR
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-10, -32, 20, 32);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-7, -30, 14, 30);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, -16, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(-12, -32);
        ctx.lineTo(12, -32);
        ctx.lineTo(8, -36);
        ctx.lineTo(-8, -36);
        ctx.closePath();
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
  static getEnemyTexture(type: EnemyKind | string): Texture {
    const key = `enemy_hires_v4_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = type === 'BOSS' ? 96 : (type === 'TANK' || type === 'ELITE' ? 64 : (type === 'SWARM' ? 36 : 48));
    const tex = createHighResTexture(size, size, (ctx) => {
      const cx = size / 2, cy = size / 2;

      if (type === 'SWARM') {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 2, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'RUNNER' || type === 'FAST') {
        ctx.fillStyle = '#7e22ce';
        safeEllipse(ctx, cx, cy, 18, 12);
        ctx.fill();

        ctx.fillStyle = '#c084fc';
        safeEllipse(ctx, cx, cy, 14, 8);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 2, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'NORMAL') {
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

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx - 10, cy - 12, 3, 0, Math.PI * 2);
        ctx.arc(cx + 10, cy - 12, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'ELITE') {
        ctx.fillStyle = '#ca8a04';
        safeRoundRect(ctx, cx - 24, cy - 24, 48, 48, 12);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#854d0e';
        safeRoundRect(ctx, cx - 18, cy - 18, 36, 36, 8);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 4, 4, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy - 4, 4, 0, Math.PI * 2);
        ctx.fill();
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

  // 7. Đạn đặc trưng riêng biệt cho từng loại trong 11 súng (Unique Projectiles)
  static getProjectileTexture(kind: GunKind): Texture {
    const key = `projectile_v2_${kind}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    let width = 24;
    let height = 36;
    if (kind === 'METEOR') { width = 48; height = 48; }
    else if (kind === 'SNIPER') { width = 16; height = 48; }
    else if (kind === 'CANNON') { width = 32; height = 32; }
    else if (kind === 'FLAMER') { width = 32; height = 40; }
    else if (kind === 'SLINGSHOT') { width = 28; height = 28; }

    const tex = createHighResTexture(width, height, (ctx) => {
      const cx = width / 2;
      const cy = height / 2;

      ctx.save();

      switch (kind) {
        case 'PISTOL': { // Tia plasma xanh ngọc
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#38bdf8');
          grad.addColorStop(1, '#0369a1');
          ctx.fillStyle = grad;
          safeEllipse(ctx, cx, cy, 5, 13);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          safeEllipse(ctx, cx, cy - 4, 2.5, 6);
          ctx.fill();
          break;
        }

        case 'CROSSBOW': { // Mũi tên nỏ thép có ngạnh & cánh lông đỏ
          // Thân gỗ
          ctx.fillStyle = '#78350f';
          ctx.fillRect(cx - 2, cy - 10, 4, 22);

          // Mũi tên kim loại hình tam giác có ngạnh
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(cx, cy - 16);
          ctx.lineTo(cx + 6, cy - 8);
          ctx.lineTo(cx + 3, cy - 6);
          ctx.lineTo(cx - 3, cy - 6);
          ctx.lineTo(cx - 6, cy - 8);
          ctx.closePath();
          ctx.fill();

          // Cánh lông đuôi đỏ
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(cx - 2, cy + 8);
          ctx.lineTo(cx - 6, cy + 15);
          ctx.lineTo(cx - 2, cy + 13);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(cx + 2, cy + 8);
          ctx.lineTo(cx + 6, cy + 15);
          ctx.lineTo(cx + 2, cy + 13);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'SLINGSHOT': { // Viên đá cuội gồ ghề
          ctx.fillStyle = '#57534e';
          ctx.beginPath();
          ctx.moveTo(cx - 7, cy - 9);
          ctx.lineTo(cx + 8, cy - 8);
          ctx.lineTo(cx + 11, cy + 2);
          ctx.lineTo(cx + 5, cy + 10);
          ctx.lineTo(cx - 6, cy + 9);
          ctx.lineTo(cx - 10, cy - 1);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#a8a29e';
          ctx.beginPath();
          ctx.arc(cx - 3, cy - 3, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'CRYO': { // Mũi giáo băng sắc nhọn hình thoi
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.4, '#bae6fd');
          grad.addColorStop(1, '#0284c7');
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.moveTo(cx, cy - 16);
          ctx.lineTo(cx + 7, cy);
          ctx.lineTo(cx, cy + 16);
          ctx.lineTo(cx - 7, cy);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx, cy - 14);
          ctx.lineTo(cx + 2, cy);
          ctx.lineTo(cx, cy + 14);
          ctx.lineTo(cx - 2, cy);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'FLAMER': { // Quả cầu lửa cuồn cuộn
          const grad = ctx.createRadialGradient(cx, cy - 2, 2, cx, cy, 14);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#fef08a');
          grad.addColorStop(0.6, '#f97316');
          grad.addColorStop(1, '#b91c1c');
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.arc(cx, cy - 2, 12, 0, Math.PI * 2);
          ctx.fill();

          // Đuôi lửa bập bùng
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy);
          ctx.lineTo(cx - 4, cy + 16);
          ctx.lineTo(cx, cy + 8);
          ctx.lineTo(cx + 4, cy + 16);
          ctx.lineTo(cx + 10, cy);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'SHOTGUN': { // Chùm 3 viên đạn chì lớn kèm khói
          const pellets = [[cx, cy - 6], [cx - 6, cy + 4], [cx + 6, cy + 4]];
          pellets.forEach(([px, py]) => {
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(px - 1, py - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }

        case 'CANNON': { // Quả đại bác bom tròn vỏ gang có ngòi nổ cháy sáng
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.arc(cx, cy + 2, 11, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#78716c';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Cổ ngòi & tia lửa ngòi nổ
          ctx.fillStyle = '#a8a29e';
          ctx.fillRect(cx - 2, cy - 12, 4, 4);

          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(cx, cy - 12, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(cx, cy - 12, 1.8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'TESLA': { // Quả cầu plasma điện từ tích điện
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(cx, cy, 9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'SNIPER': { // Viên đạn xuyên giáp vonfram đỏ rực siêu dài
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.2, '#f87171');
          grad.addColorStop(0.8, '#dc2626');
          grad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.moveTo(cx, cy - 20);
          ctx.lineTo(cx + 4, cy - 12);
          ctx.lineTo(cx + 3, cy + 20);
          ctx.lineTo(cx - 3, cy + 20);
          ctx.lineTo(cx - 4, cy - 12);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'MINIGUN': { // Đạn đồng vàng rực có vệt nhiệt
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#fde047');
          grad.addColorStop(0.8, '#eab308');
          grad.addColorStop(1, '#ca8a04');
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.moveTo(cx, cy - 11);
          ctx.lineTo(cx + 3.5, cy - 6);
          ctx.lineTo(cx + 3, cy + 11);
          ctx.lineTo(cx - 3, cy + 11);
          ctx.lineTo(cx - 3.5, cy - 6);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'METEOR': { // Bánh răng thiên thạch nham thạch khổng lồ
          // Lửa bao quanh
          const auraGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 22);
          auraGrad.addColorStop(0, '#ea580c');
          auraGrad.addColorStop(0.6, '#dc2626');
          auraGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.fill();

          // Lõi đá đen núi lửa
          ctx.fillStyle = '#292524';
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.fill();

          // Các khe nứt dung nham vàng rực
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy - 4);
          ctx.lineTo(cx - 2, cy + 2);
          ctx.lineTo(cx + 8, cy - 3);
          ctx.moveTo(cx - 2, cy + 2);
          ctx.lineTo(cx + 4, cy + 8);
          ctx.stroke();
          break;
        }
      }

      ctx.restore();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 8. Texture nút bấm phong cách Steampunk Máy Móc Đinh Tán (Brass Machinery UI)
  static getSteampunkButtonTexture(w: number, h: number, theme: 'GOLD' | 'GREEN' | 'RED' | 'BLUE' = 'GOLD'): Texture {
    const key = `sp_btn_${w}_${h}_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(w, h, (ctx) => {
      // 1. Viền ngoài sắt đặc đen đúc
      ctx.fillStyle = '#1c1917';
      safeRoundRect(ctx, 0, 0, w, h, 10);
      ctx.fill();

      // 2. Viền kim loại mạ đồng thau / thép
      const borderColors = {
        GOLD: { border: '#b45309', fill1: '#d97706', fill2: '#78350f', highlight: '#fef08a' },
        GREEN: { border: '#15803d', fill1: '#16a34a', fill2: '#14532d', highlight: '#86efac' },
        RED: { border: '#b91c1c', fill1: '#dc2626', fill2: '#7f1d1d', highlight: '#fca5a5' },
        BLUE: { border: '#1d4ed8', fill1: '#2563eb', fill2: '#1e3a8a', highlight: '#93c5fd' },
      }[theme];

      ctx.fillStyle = borderColors.border;
      safeRoundRect(ctx, 3, 3, w - 6, h - 6, 8);
      ctx.fill();

      // 3. Mặt nút có gradient kim loại máy móc
      const grad = ctx.createLinearGradient(0, 5, 0, h - 5);
      grad.addColorStop(0, borderColors.fill1);
      grad.addColorStop(1, borderColors.fill2);
      ctx.fillStyle = grad;
      safeRoundRect(ctx, 6, 6, w - 12, h - 12, 6);
      ctx.fill();

      // Đường highlight trên cùng tạo độ bóng 3D
      ctx.fillStyle = borderColors.highlight;
      safeRoundRect(ctx, 8, 8, w - 16, 3, 1);
      ctx.fill();

      // 4 Đinh tán đồng máy móc ở 4 góc
      const rivets = [
        [12, 12],
        [w - 12, 12],
        [12, h - 12],
        [w - 12, h - 12],
      ];
      rivets.forEach(([rx, ry]) => {
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(rx - 0.8, ry - 0.8, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 9. Vạch cảnh báo nguy hiểm công nghiệp (Hazard Warning Stripes cho Thùng Rác)
  static getHazardZoneTexture(w: number, h: number): Texture {
    const key = `hazard_zone_${w}_${h}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(w, h, (ctx) => {
      // Nền đen sắt
      ctx.fillStyle = '#1c1917';
      safeRoundRect(ctx, 0, 0, w, h, 12);
      ctx.fill();

      // Vùng kẻ sọc vàng - đen
      ctx.save();
      safeRoundRect(ctx, 5, 5, w - 10, h - 10, 8);
      ctx.clip();

      ctx.fillStyle = '#7f1d1d'; // Nền đỏ thẫm lò thiêu hủy
      ctx.fillRect(0, 0, w, h);

      // Kẻ sọc xiên chéo màu vàng cảnh báo
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 8;
      for (let x = -h; x < w + h; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }
      ctx.restore();

      // Viền đinh tán bảo vệ ngoài
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      safeRoundRect(ctx, 3, 3, w - 6, h - 6, 9);
      ctx.stroke();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 10. Fallback getBulletTexture
  static getBulletTexture(element: string): Texture {
    return this.getProjectileTexture('PISTOL');
  }
}

