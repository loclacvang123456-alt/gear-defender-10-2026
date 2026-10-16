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

  // 3. Đế Súng (BÁNH RĂNG CÔNG NGHIỆP 10 RĂNG BẢN TO) 96x96 - ASSET CHUYỂN MÀU THEO LEVEL 1 -> 5
  static getGunBaseTexture(level: number = 1): Texture {
    const lvl = Math.min(5, Math.max(1, level));
    const key = `gun_base_gear_v2_${lvl}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(96, 96, (ctx) => {
      const cx = 48, cy = 48;

      // Bảng màu Đế Bánh Răng: Tông kim loại máy móc vừa vặn (không quá tối làm khó nhìn, không quá sáng làm lẫn màu súng)
      // Viền kim loại và đỉnh răng sáng bóng (viền sáng hơn) giúp các răng bánh răng nổi bật rõ nét khi xoay
      const gearMainColors = ['#475569', '#2d4564', '#4a3861', '#6b522b', '#663232'];
      const gearRimColors = ['#94a3b8', '#60a5fa', '#c084fc', '#fde047', '#f87171'];
      const gearInnerColors = ['#334155', '#1e3048', '#332446', '#4d391b', '#481e1e'];
      const gearGrooveColors = ['#64748b', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];
      const gearCrestColors = ['#cbd5e1', '#93c5fd', '#e9d5ff', '#fef08a', '#fca5a5'];
      const gearOutlineColors = ['#1e293b', '#111c2e', '#1e122b', '#2a1b08', '#2a0c0c'];

      const colorIdx = lvl - 1;
      const mainCol = gearMainColors[colorIdx];
      const rimCol = gearRimColors[colorIdx];
      const innerCol = gearInnerColors[colorIdx];
      const grooveCol = gearGrooveColors[colorIdx];
      const crestCol = gearCrestColors[colorIdx];
      const outlineCol = gearOutlineColors[colorIdx];

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
      ctx.strokeStyle = outlineCol;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Viền đỉnh răng sáng rực (Tooth Crest Highlights) giúp nhận diện rõ từng răng bánh răng
      ctx.strokeStyle = crestCol;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i < numTeeth; i++) {
        const theta = (i * 2 * Math.PI) / numTeeth;
        const aCrestLeft = theta - 0.12;
        const aCrestRight = theta + 0.12;
        const p1x = cx + Math.cos(aCrestLeft) * rOuter;
        const p1y = cy + Math.sin(aCrestLeft) * rOuter;
        const p2x = cx + Math.cos(aCrestRight) * rOuter;
        const p2y = cy + Math.sin(aCrestRight) * rOuter;
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
      }
      ctx.stroke();

      // 2. Vành tròn thân bánh răng (đồng tâm cx, cy)
      ctx.fillStyle = innerCol;
      ctx.beginPath();
      ctx.arc(cx, cy, 31, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = rimCol;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // 3. Vành rãnh kim loại đồng tâm nổi màu Rarity
      ctx.strokeStyle = grooveCol;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.stroke();

      // Viền sáng tương phản nổi cho rãnh kim loại
      ctx.strokeStyle = rimCol;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 27.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 22.5, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Lỗ rỗng xuyên tâm lớn (Center Bore) ở giữa (đồng tâm cx, cy)
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = rimCol;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Vòng bạc nhỏ sáng trong lòng lỗ tâm
      ctx.strokeStyle = crestCol;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.stroke();

      // Khớp trục xoay ở giữa
      ctx.fillStyle = mainCol;
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

  // 4. Nòng Súng Xoay Độc Lập 80x80 (Tâm tại 40, 40) - ASSET CHUYỂN MÀU THEO LEVEL 1 -> 5
  static getGunBarrelTexture(kind: GunKind, level: number = 1): Texture {
    const lvl = Math.min(5, Math.max(1, level));
    const key = `gun_barrel_hires_lvl_${kind}_${lvl}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    // Ưu tiên load trực tiếp Asset Pixel Art chất lượng cao vẽ từ Aseprite
    try {
      const img = new Image();
      img.src = `/assets/gun_${kind.toLowerCase()}.png`;
      const tex = Texture.from(img);
      if (tex) {
        this.cache.set(key, tex);
        return tex;
      }
    } catch {
      // fallback to procedural canvas
    }

    const tex = createHighResTexture(80, 80, (ctx) => {
      const cx = 40, cy = 40;

      // Bảng màu kim loại của chính Asset thay đổi theo Level:
      // Level 1: Thép mộc xám bạc cổ điển
      // Level 2: Hợp kim tôi xanh năng lượng
      // Level 3: Hắc diện thạch cổ ngữ tím
      // Level 4: Hoàng kim vương giả
      // Level 5: Hỏa ngục thần thoại đỏ rực
      const palettes = [
        { body: '#475569', accent: '#64748b', highlight: '#cbd5e1', core: '#f8fafc' },
        { body: '#1e293b', accent: '#2563eb', highlight: '#60a5fa', core: '#38bdf8' },
        { body: '#1e1b4b', accent: '#7e22ce', highlight: '#c084fc', core: '#e879f9' },
        { body: '#292524', accent: '#d97706', highlight: '#fde047', core: '#ffffff' },
        { body: '#18181b', accent: '#b91c1c', highlight: '#ef4444', core: '#fef08a' },
      ];
      const pal = palettes[lvl - 1];

      ctx.save();
      ctx.translate(cx, cy);

      if (kind === 'PISTOL') {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-6, -30, 12, 30);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-4, -28, 8, 28);
        ctx.fillStyle = pal.highlight;
        ctx.fillRect(-5, -34, 10, 5);
        ctx.fillStyle = pal.core;
        ctx.fillRect(-2, -33, 4, 3);
      } else if (kind === 'CROSSBOW') {
        ctx.fillStyle = lvl === 1 ? '#854d0e' : pal.body;
        ctx.fillRect(-4, -30, 8, 30);
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, -10, 24, Math.PI * 0.8, Math.PI * 2.2);
        ctx.stroke();
        ctx.fillStyle = pal.highlight;
        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.lineTo(-6, -26);
        ctx.lineTo(6, -26);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = pal.core;
        ctx.beginPath();
        ctx.arc(0, -28, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'CRYO') {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-7, -28, 14, 28);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-4, -26, 8, 26);
        ctx.fillStyle = pal.highlight;
        ctx.beginPath();
        ctx.moveTo(0, -38);
        ctx.lineTo(-7, -26);
        ctx.lineTo(7, -26);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = pal.core;
        ctx.beginPath();
        ctx.arc(0, -24, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'FLAMER') {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-8, -26, 16, 26);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-5, -24, 10, 24);
        ctx.fillStyle = pal.highlight;
        ctx.beginPath();
        ctx.moveTo(-9, -26);
        ctx.lineTo(9, -26);
        ctx.lineTo(13, -34);
        ctx.lineTo(-13, -34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = pal.core;
        ctx.fillRect(-6, -36, 12, 3);
      } else if (kind === 'SHOTGUN') {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-9, -30, 7, 30);
        ctx.fillRect(2, -30, 7, 30);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-7, -28, 4, 28);
        ctx.fillRect(4, -28, 4, 28);
        ctx.fillStyle = pal.highlight;
        ctx.fillRect(-10, -34, 20, 5);
        ctx.fillStyle = pal.core;
        ctx.fillRect(-6, -34, 2, 2);
        ctx.fillRect(5, -34, 2, 2);
      } else if (kind === 'CANNON') {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-12, -32, 24, 32);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-9, -30, 18, 30);
        ctx.fillStyle = pal.highlight;
        ctx.beginPath();
        ctx.arc(0, -32, 14, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = pal.core;
        ctx.fillRect(-5, -36, 10, 4);
      } else if (kind === 'TESLA') {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-6, -26, 12, 26);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-3, -24, 6, 24);
        ctx.strokeStyle = pal.highlight;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -12, 14, 0, Math.PI * 2);
        ctx.arc(0, -22, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = pal.highlight;
        ctx.beginPath();
        ctx.arc(0, -34, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.core;
        ctx.beginPath();
        ctx.arc(0, -34, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'SLINGSHOT') {
        ctx.fillStyle = lvl === 1 ? '#854d0e' : pal.body;
        ctx.fillRect(-4, -18, 8, 18);
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-11, -32);
        ctx.lineTo(-4, -18);
        ctx.lineTo(4, -18);
        ctx.lineTo(11, -32);
        ctx.stroke();
        ctx.strokeStyle = pal.highlight;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-11, -32);
        ctx.lineTo(0, -22);
        ctx.lineTo(11, -32);
        ctx.stroke();
        ctx.fillStyle = pal.core;
        ctx.beginPath();
        ctx.arc(0, -22, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'SNIPER') {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-4, -44, 8, 44);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-2, -42, 4, 42);
        ctx.fillStyle = pal.highlight;
        ctx.fillRect(-5, -46, 10, 5);
        ctx.fillStyle = pal.body;
        ctx.fillRect(-7, -26, 14, 8);
        ctx.fillStyle = pal.core;
        ctx.fillRect(-5, -24, 10, 4);
      } else if (kind === 'MINIGUN') {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-8, -32, 16, 32);
        for (let b = 0; b < 6; b++) {
          const ba = (b * Math.PI) / 3;
          const bx = Math.cos(ba) * 5;
          const by = -20 + Math.sin(ba) * 3;
          ctx.fillStyle = pal.accent;
          ctx.beginPath();
          ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = pal.highlight;
        ctx.fillRect(-9, -36, 18, 4);
      } else { // METEOR
        ctx.fillStyle = pal.body;
        ctx.fillRect(-10, -32, 20, 32);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-7, -30, 14, 30);
        ctx.fillStyle = pal.highlight;
        ctx.beginPath();
        ctx.arc(0, -16, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.core;
        ctx.beginPath();
        ctx.arc(0, -16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(-12, -32);
        ctx.lineTo(12, -32);
        ctx.lineTo(8, -36);
        ctx.lineTo(-8, -36);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = pal.body;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.highlight;
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
  static getSteampunkButtonTexture(w: number, h: number, theme: 'GOLD' | 'GREEN' | 'RED' | 'BLUE' | 'DISABLED' = 'GOLD'): Texture {
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
        DISABLED: { border: '#334155', fill1: '#1e293b', fill2: '#0f172a', highlight: '#475569' },
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

        ctx.fillStyle = theme === 'DISABLED' ? '#64748b' : '#fde047';
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

  // ================= MAIN MENU HABBY / ARCHERO STYLE ASSETS ================= //

  // 11. Đền Thờ Ánh Sáng Thần Thoại 3D (Radiant Temple Shrine) - Centerpiece
  static getRadiantTempleTexture(w: number = 480, h: number = 460): Texture {
    const key = `radiant_temple_${w}_${h}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(w, h, (ctx) => {
      const cx = w / 2;

      // 1. Vùng nước phản chiếu & sương mù huyền bí bên dưới
      const waterGrad = ctx.createRadialGradient(cx, 380, 40, cx, 380, 220);
      waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      waterGrad.addColorStop(0.5, 'rgba(30, 27, 75, 0.45)');
      waterGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.ellipse(cx, 380, 220, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vòng sóng nước phản quang nhẹ
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(cx, 390, 180, 42, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Bệ trụ tròn đá cẩm thạch trắng (Cylindrical White Shrine Drum Base)
      const baseCy = 290;
      const baseRx = 175;
      const baseRy = 55;
      const drumH = 75;

      // Thành trụ đứng (Drum sides)
      const drumGrad = ctx.createLinearGradient(cx - baseRx, baseCy, cx + baseRx, baseCy);
      drumGrad.addColorStop(0, '#cbd5e1');
      drumGrad.addColorStop(0.2, '#f8fafc');
      drumGrad.addColorStop(0.5, '#ffffff');
      drumGrad.addColorStop(0.8, '#f1f5f9');
      drumGrad.addColorStop(1, '#94a3b8');

      ctx.fillStyle = drumGrad;
      ctx.beginPath();
      ctx.moveTo(cx - baseRx, baseCy);
      ctx.lineTo(cx - baseRx, baseCy + drumH);
      ctx.ellipse(cx, baseCy + drumH, baseRx, baseRy, 0, 0, Math.PI, false);
      ctx.lineTo(cx + baseRx, baseCy);
      ctx.ellipse(cx, baseCy, baseRx, baseRy, 0, 0, Math.PI, true);
      ctx.fill();

      // Viền vàng trang trí đáy trụ
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(cx, baseCy + drumH, baseRx - 2, baseRy, 0, 0, Math.PI, false);
      ctx.stroke();

      // Các gờ rãnh vàng thẳng đứng (Vertical Gold Flutings)
      const fluteCols = [-120, -75, -25, 25, 75, 120];
      fluteCols.forEach(fx => {
        const xPos = cx + fx;
        ctx.fillStyle = '#b45309';
        ctx.fillRect(xPos - 3, baseCy + 14, 6, drumH - 14);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(xPos - 1, baseCy + 14, 2, drumH - 14);
      });

      // Vành đai lan can vàng viền quanh bệ (Golden Balustrade Trim)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(cx, baseCy, baseRx, baseRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, baseCy - 1, baseRx - 1, baseRy - 1, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Mặt sàn đài phun / sân khấu trung tâm (Polished Radiant Floor)
      const floorGrad = ctx.createRadialGradient(cx, baseCy, 10, cx, baseCy, baseRx - 12);
      floorGrad.addColorStop(0, '#f43f5e'); // Đỏ hồng thạch anh lấp lánh
      floorGrad.addColorStop(0.65, '#be185d'); // Hồng tím quý phái
      floorGrad.addColorStop(1, '#831843'); // Viền sẫm phản chiếu
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.ellipse(cx, baseCy, baseRx - 8, baseRy - 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2 Bục thờ vàng nhỏ trên sân khấu (Golden Altars)
      // Bục trái
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(cx - 65, baseCy + 4, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8'; // Tinh thể xanh sáng
      ctx.beginPath();
      ctx.ellipse(cx - 65, baseCy + 2, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bục phải
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(cx + 65, baseCy + 12, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a'; // Tinh thể vàng sáng
      ctx.beginPath();
      ctx.ellipse(cx + 65, baseCy + 10, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Hào quang vàng thiêng liêng tỏa sau cổng vòm (Divine Backlight Aura)
      const auraGrad = ctx.createRadialGradient(cx, 160, 20, cx, 160, 150);
      auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      auraGrad.addColorStop(0.4, 'rgba(250, 204, 21, 0.65)');
      auraGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.25)');
      auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(cx, 160, 140, 150, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tia hào quang tỏa nan quạt
      ctx.save();
      ctx.translate(cx, 160);
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.lineWidth = 3;
      for (let a = -Math.PI * 0.8; a <= -Math.PI * 0.2; a += 0.18) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 45, Math.sin(a) * 45);
        ctx.lineTo(Math.cos(a) * 135, Math.sin(a) * 135);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Cổng Vòm Cánh Thiên Thần Trắng (Winged Archway Structure)
      // Khối vòm vòm cong lớn trắng tuyết
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx - 150, baseCy);
      // Vòm cong lên tới đỉnh cánh
      ctx.bezierCurveTo(cx - 165, 120, cx - 110, 60, cx, 65);
      ctx.bezierCurveTo(cx + 110, 60, cx + 165, 120, cx + 150, baseCy);
      // Mặt trong vòm
      ctx.bezierCurveTo(cx + 105, 145, cx + 75, 110, cx, 110);
      ctx.bezierCurveTo(cx - 75, 110, cx - 105, 145, cx - 150, baseCy);
      ctx.closePath();
      ctx.fill();

      // Đổ bóng 3D cho các lớp cánh thiên thần
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Viền vàng óng ánh viền cánh
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 146, baseCy - 6);
      ctx.bezierCurveTo(cx - 160, 125, cx - 108, 66, cx, 71);
      ctx.bezierCurveTo(cx + 108, 66, cx + 160, 125, cx + 146, baseCy - 6);
      ctx.stroke();

      // 6. Cửa Kính Màu Nhà Thờ Lộng Lẫy (Stained Glass Cathedral Window)
      const windowX = cx - 55;
      const windowY = 125;
      const windowW = 110;
      const windowH = 150;

      // Khung vòm cửa kính
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(windowX, windowY + windowH);
      ctx.lineTo(windowX, windowY + 45);
      ctx.quadraticCurveTo(windowX, windowY, cx, windowY);
      ctx.quadraticCurveTo(windowX + windowW, windowY, windowX + windowW, windowY + 45);
      ctx.lineTo(windowX + windowW, windowY + windowH);
      ctx.closePath();
      ctx.clip();

      // Nền kính màu tím hoa cà
      const glassGrad = ctx.createLinearGradient(windowX, windowY, windowX, windowY + windowH);
      glassGrad.addColorStop(0, '#f43f5e');
      glassGrad.addColorStop(0.5, '#ec4899');
      glassGrad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(windowX, windowY, windowW, windowH);

      // Thánh giá vàng phát sáng rực rỡ ở tâm kính
      ctx.fillStyle = '#fef08a';
      // Trục dọc
      ctx.fillRect(cx - 7, windowY + 20, 14, windowH - 30);
      // Trục ngang
      ctx.fillRect(cx - 36, windowY + 58, 72, 14);

      // Kính màu cyan & vàng hình thoi góc
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(windowX + 12, windowY + 80);
      ctx.lineTo(windowX + 24, windowY + 68);
      ctx.lineTo(windowX + 36, windowY + 80);
      ctx.lineTo(windowX + 24, windowY + 92);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(windowX + windowW - 36, windowY + 80);
      ctx.lineTo(windowX + windowW - 24, windowY + 68);
      ctx.lineTo(windowX + windowW - 12, windowY + 80);
      ctx.lineTo(windowX + windowW - 24, windowY + 92);
      ctx.closePath();
      ctx.fill();

      // Đường viền chì nối kính (Lead Came)
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(windowX, windowY + 45);
      ctx.lineTo(windowX + windowW, windowY + 45);
      ctx.moveTo(windowX, windowY + 105);
      ctx.lineTo(windowX + windowW, windowY + 105);
      ctx.stroke();

      ctx.restore();

      // Viền vàng bao quanh khung cửa sổ
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(windowX, windowY + windowH);
      ctx.lineTo(windowX, windowY + 45);
      ctx.quadraticCurveTo(windowX, windowY, cx, windowY);
      ctx.quadraticCurveTo(windowX + windowW, windowY, windowX + windowW, windowY + 45);
      ctx.lineTo(windowX + windowW, windowY + windowH);
      ctx.stroke();

      // 7. Biểu tượng Thiên Thần / Đại bàng vàng ở đỉnh vòm (Crown Finial)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx, 40);
      ctx.lineTo(cx - 18, 65);
      ctx.lineTo(cx - 6, 68);
      ctx.lineTo(cx, 88);
      ctx.lineTo(cx + 6, 68);
      ctx.lineTo(cx + 18, 65);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, 55, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 12. Icons Cho 5 Tab Thanh Điều Hướng Đáy (Bottom Navigation Icons)
  static getBottomTabIcon(tab: 'SHOP' | 'EQUIPMENT' | 'WORLD' | 'TALENT' | 'MODES', size: number = 56): Texture {
    const key = `bottom_tab_icon_${tab}_${size}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(size, size, (ctx) => {
      const cx = size / 2;
      const cy = size / 2;

      switch (tab) {
        case 'SHOP': { // RƯƠNG VÀNG GACHA (Treasure Chest với ổ khóa ngọc đỏ)
          const w = size * 0.72;
          const h = size * 0.58;
          const x = cx - w / 2;
          const y = cy - h / 2 + 2;

          // Thân rương vàng
          ctx.fillStyle = '#d97706';
          safeRoundRect(ctx, x, y + h * 0.38, w, h * 0.62, 5);
          ctx.fill();

          // Nắp rương hình bán trụ
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.ellipse(cx, y + h * 0.38, w / 2, h * 0.38, 0, Math.PI, 0, false);
          ctx.fill();

          // Nẹp viền vàng kim
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3.5;
          ctx.strokeRect(x + 2, y + h * 0.38, w - 4, h * 0.62 - 2);

          // Bản lề và ổ khóa ruby
          ctx.fillStyle = '#ef4444'; // Ngọc ruby đỏ
          safeRoundRect(ctx, cx - 6, y + h * 0.28, 12, 14, 3);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Lỗ khóa vàng
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(cx, y + h * 0.35, 2.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'EQUIPMENT': { // GIÁP NGỰC HIỆP SĨ THÉP (Armor Chestplate)
          const w = size * 0.70;
          const h = size * 0.70;
          const x = cx - w / 2;
          const y = cy - h / 2;

          // Giáp ngực thép xanh đậm
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 4);
          ctx.lineTo(x + w - 10, y + 4);
          ctx.lineTo(x + w, y + 18);
          ctx.lineTo(x + w - 8, y + h - 8);
          ctx.lineTo(cx, y + h);
          ctx.lineTo(x + 8, y + h - 8);
          ctx.lineTo(x, y + 18);
          ctx.closePath();
          ctx.fill();

          // Đai giáp & nẹp vàng
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Cầu vai thép (Pauldrons)
          ctx.fillStyle = '#64748b';
          safeRoundRect(ctx, x - 2, y + 2, 14, 18, 4);
          ctx.fill();
          safeRoundRect(ctx, x + w - 12, y + 2, 14, 18, 4);
          ctx.fill();

          // Tâm ngực phát quang
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(cx, cy - 2, 6, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'WORLD': { // BẢN ĐỒ KHO BÁU CUỘN (World Map Parchment với dấu X đỏ)
          const w = size * 0.76;
          const h = size * 0.65;
          const x = cx - w / 2;
          const y = cy - h / 2;

          // Giấy da cổ màu vàng kem
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.moveTo(x + 4, y);
          ctx.bezierCurveTo(x + w * 0.3, y - 3, x + w * 0.7, y + 3, x + w - 4, y);
          ctx.lineTo(x + w, y + h);
          ctx.bezierCurveTo(x + w * 0.7, y + h - 3, x + w * 0.3, y + h + 3, x, y + h);
          ctx.closePath();
          ctx.fill();

          // Viền giấy cháy sém
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Đường chấm đứt nét hải trình
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(x + 10, y + h - 10);
          ctx.quadraticCurveTo(cx - 2, cy + 4, cx + 8, cy - 4);
          ctx.stroke();
          ctx.setLineDash([]);

          // Dấu X kho báu màu đỏ rực
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx + 4, cy - 10);
          ctx.lineTo(cx + 18, cy + 4);
          ctx.moveTo(cx + 18, cy - 10);
          ctx.lineTo(cx + 4, cy + 4);
          ctx.stroke();
          break;
        }

        case 'TALENT': { // TẤM ĐÁ LỤC GIÁC MŨI TÊN THĂNG CẤP (Talent Hexagon Up)
          const r = size * 0.38;

          // Lục giác đá xám sẫm
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();

          // Viền đồng vàng dày
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Mũi tên vàng chỉ lên
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.55);
          ctx.lineTo(cx + r * 0.45, cy + 2);
          ctx.lineTo(cx + r * 0.20, cy + 2);
          ctx.lineTo(cx + r * 0.20, cy + r * 0.52);
          ctx.lineTo(cx - r * 0.20, cy + r * 0.52);
          ctx.lineTo(cx - r * 0.20, cy + 2);
          ctx.lineTo(cx - r * 0.45, cy + 2);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'MODES': { // BIA BẮN CUNG TÂM ĐỎ (Target Bullseye)
          const maxR = size * 0.38;

          // Vòng ngoài cùng đỏ
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
          ctx.fill();

          // Vòng trắng
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, maxR * 0.72, 0, Math.PI * 2);
          ctx.fill();

          // Vòng tâm đỏ
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(cx, cy, maxR * 0.44, 0, Math.PI * 2);
          ctx.fill();

          // Điểm vàng tâm bia
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(cx, cy, maxR * 0.18, 0, Math.PI * 2);
          ctx.fill();

          // 2 Mũi tên bắt chéo góc sau bia
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(cx - maxR * 1.05, cy - maxR * 1.05);
          ctx.lineTo(cx + maxR * 1.05, cy + maxR * 1.05);
          ctx.stroke();

          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.moveTo(cx + maxR * 1.15, cy + maxR * 1.15);
          ctx.lineTo(cx + maxR * 0.9, cy + maxR * 1.25);
          ctx.lineTo(cx + maxR * 1.25, cy + maxR * 0.9);
          ctx.closePath();
          ctx.fill();
          break;
        }
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 13. Rương Kho Báu Trên Mặt Nước (Milestone Chest: Reach 50-40)
  static getMilestoneChestTexture(w: number = 88, h: number = 74): Texture {
    const key = `milestone_chest_${w}_${h}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(w, h, (ctx) => {
      const cx = w / 2;
      const cy = h / 2;

      // Bóng rương dưới nước
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, h - 8, w * 0.42, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Thân rương tím hoàng gia
      ctx.fillStyle = '#7e22ce';
      safeRoundRect(ctx, 8, 30, w - 16, 36, 6);
      ctx.fill();

      // Nắp rương vòm tím
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.ellipse(cx, 30, (w - 16) / 2, 20, 0, Math.PI, 0, false);
      ctx.fill();

      // Nẹp viền vàng kim loại
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 30, w - 20, 34);

      ctx.beginPath();
      ctx.ellipse(cx, 30, (w - 20) / 2, 18, 0, Math.PI, 0, false);
      ctx.stroke();

      // Ổ khóa vàng ở chính giữa
      ctx.fillStyle = '#fde047';
      safeRoundRect(ctx, cx - 8, 26, 16, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.arc(cx, 33, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 14. Nút Bấm Hành Động 3D (3D Chunky Play Button, Hero Patrol, Expedition)
  static getChunkyPlayButtonTexture(w: number = 270, h: number = 96): Texture {
    const key = `chunky_play_btn_${w}_${h}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(w, h, (ctx) => {
      // 1. Khối đế tối màu tạo bóng 3D dày (3D Drop extrusion)
      ctx.fillStyle = '#92400e';
      safeRoundRect(ctx, 0, 8, w, h - 8, 16);
      ctx.fill();

      // 2. Viền ngoài vàng cam đậm
      ctx.fillStyle = '#b45309';
      safeRoundRect(ctx, 0, 0, w, h - 8, 16);
      ctx.fill();

      // 3. Mặt nút vàng rực sáng (Glossy Gold Face)
      const grad = ctx.createLinearGradient(0, 4, 0, h - 14);
      grad.addColorStop(0, '#fde047');
      grad.addColorStop(0.3, '#facc15');
      grad.addColorStop(0.85, '#eab308');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      safeRoundRect(ctx, 4, 4, w - 8, h - 16, 13);
      ctx.fill();

      // 4. Lớp phản chiếu ánh sáng trắng trên cùng (Top Glare)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      safeRoundRect(ctx, 8, 8, w - 16, (h - 24) * 0.38, 9);
      ctx.fill();
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 15. Nút Hero Patrol & Expedition (Nút vuông bo góc có họa tiết 3D)
  static getFeatureButtonTexture(w: number = 110, h: number = 92, theme: 'SAND' | 'MAP' | 'PURPLE' = 'SAND'): Texture {
    const key = `feat_btn_${w}_${h}_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(w, h, (ctx) => {
      const cx = w / 2;

      // Bóng 3D đáy
      ctx.fillStyle = '#0f172a';
      safeRoundRect(ctx, 0, 6, w, h - 6, 12);
      ctx.fill();

      if (theme === 'SAND') {
        // Nền xanh nước biển / sa bàn cát
        ctx.fillStyle = '#0284c7';
        safeRoundRect(ctx, 0, 0, w, h - 6, 12);
        ctx.fill();

        // Khối sa bàn 3D màu vàng cát ở giữa
        ctx.fillStyle = '#eab308';
        safeRoundRect(ctx, 12, 10, w - 24, 44, 8);
        ctx.fill();
        ctx.fillStyle = '#ca8a04';
        safeRoundRect(ctx, 12, 40, w - 24, 14, 4);
        ctx.fill();

        // Các gò đồi nhỏ trên sa bàn
        ctx.fillStyle = '#854d0e';
        ctx.beginPath();
        ctx.arc(cx - 16, 26, 6, 0, Math.PI * 2);
        ctx.arc(cx + 12, 32, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (theme === 'PURPLE') {
        // Nút nâng cấp tím sẫm (Up Arrow + Demon Horns)
        ctx.fillStyle = '#4c1d95';
        safeRoundRect(ctx, 0, 0, w, h - 6, 12);
        ctx.fill();

        // Viền neon tím
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        safeRoundRect(ctx, 3, 3, w - 6, h - 12, 9);
        ctx.stroke();

        // Mũi tên tím sáng chỉ lên
        ctx.fillStyle = '#e879f9';
        ctx.beginPath();
        ctx.moveTo(cx, 16);
        ctx.lineTo(cx + 16, 32);
        ctx.lineTo(cx + 7, 32);
        ctx.lineTo(cx + 7, 44);
        ctx.lineTo(cx - 7, 44);
        ctx.lineTo(cx - 7, 32);
        ctx.lineTo(cx - 16, 32);
        ctx.closePath();
        ctx.fill();

        // Đầu quái vật sừng tím ở dưới
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(cx, 62, 12, 0, Math.PI * 2);
        ctx.fill();
        // Sừng
        ctx.beginPath();
        ctx.moveTo(cx - 12, 58);
        ctx.lineTo(cx - 20, 48);
        ctx.lineTo(cx - 8, 54);
        ctx.moveTo(cx + 12, 58);
        ctx.lineTo(cx + 20, 48);
        ctx.lineTo(cx + 8, 54);
        ctx.stroke();
      } else {
        // Nút Expedition (Bản đồ + Kính lúp)
        ctx.fillStyle = '#0284c7';
        safeRoundRect(ctx, 0, 0, w, h - 6, 12);
        ctx.fill();

        // Tấm bản đồ cuộn
        ctx.fillStyle = '#fef3c7';
        safeRoundRect(ctx, 16, 10, w - 32, 44, 6);
        ctx.fill();

        // Kính lúp đồng (Magnifying Glass)
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx - 4, 30, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 5, 38);
        ctx.lineTo(cx + 16, 48);
        ctx.stroke();

        // Dấu X đỏ trong kính lúp
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 8, 26);
        ctx.lineTo(cx, 34);
        ctx.moveTo(cx, 26);
        ctx.lineTo(cx - 8, 34);
        ctx.stroke();
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 16. Huy Hiệu Sự Kiện Bên Cạnh Màn Hình (Side Event Badges)
  static getSideBadgeTexture(kind: 'OCTOPUS' | 'PATROL_FLOAT' | 'ARENA' | 'QUEST' | 'DEMON' | 'WIZARD', size: number = 64): Texture {
    const key = `side_badge_${kind}_${size}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createHighResTexture(size, size, (ctx) => {
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.44;

      switch (kind) {
        case 'OCTOPUS': { // Bạch tuộc đỏ cam (Octopus event)
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(cx, cy - 4, r * 0.72, Math.PI, 0, false);
          ctx.lineTo(cx + r * 0.72, cy + 6);
          // Tua rua
          for (let i = 0; i < 4; i++) {
            const tx = cx + (i - 1.5) * 8;
            ctx.lineTo(tx, cy + 14);
          }
          ctx.lineTo(cx - r * 0.72, cy + 6);
          ctx.closePath();
          ctx.fill();

          // 2 Mắt to
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx - 6, cy - 4, 4, 0, Math.PI * 2);
          ctx.arc(cx + 6, cy - 4, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(cx - 6, cy - 4, 2, 0, Math.PI * 2);
          ctx.arc(cx + 6, cy - 4, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'PATROL_FLOAT': { // Hòn đảo mini bay lơ lửng (Floating Island)
          // Khối cỏ xanh trên đảo
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.ellipse(cx, cy - 2, r * 0.85, r * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Khối đất nâu bên dưới
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.82, cy - 2);
          ctx.lineTo(cx, cy + r * 0.95);
          ctx.lineTo(cx + r * 0.82, cy - 2);
          ctx.closePath();
          ctx.fill();

          // Ngôi nhà nhỏ trên đảo
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(cx - 6, cy - 14, 12, 10);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy - 14);
          ctx.lineTo(cx, cy - 22);
          ctx.lineTo(cx + 8, cy - 14);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'ARENA': { // Khiên tím đôi cánh vàng (Purple Winged Shield)
          ctx.fillStyle = '#6b21a8';
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.75, cy - r * 0.65);
          ctx.lineTo(cx + r * 0.75, cy - r * 0.65);
          ctx.lineTo(cx + r * 0.65, cy + r * 0.2);
          ctx.lineTo(cx, cy + r * 0.85);
          ctx.lineTo(cx - r * 0.65, cy + r * 0.2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Cung tên vàng ở giữa khiên
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 10, -Math.PI * 0.6, Math.PI * 0.6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy);
          ctx.lineTo(cx + 8, cy);
          ctx.stroke();
          break;
        }

        case 'QUEST': { // Bảng kẹp nhiệm vụ (Clipboard)
          ctx.fillStyle = '#f8fafc';
          safeRoundRect(ctx, cx - r * 0.65, cy - r * 0.75, r * 1.3, r * 1.5, 5);
          ctx.fill();

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Kẹp kim loại ở trên
          ctx.fillStyle = '#f59e0b';
          safeRoundRect(ctx, cx - 10, cy - r * 0.88, 20, 8, 3);
          ctx.fill();

          // Các dòng chữ nhiệm vụ
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(cx - 12, cy - 6, 24, 3);
          ctx.fillRect(cx - 12, cy + 2, 24, 3);
          ctx.fillRect(cx - 12, cy + 10, 16, 3);
          break;
        }

        case 'DEMON': { // Vương miện ác ma đen tím (Demon Lord Helm)
          ctx.fillStyle = '#4c0519';
          ctx.beginPath();
          ctx.arc(cx, cy + 2, r * 0.65, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 3;
          ctx.stroke();

          // 2 Sừng ác ma nhô cao
          ctx.fillStyle = '#be123c';
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy - 4);
          ctx.lineTo(cx - 20, cy - 24);
          ctx.lineTo(cx - 4, cy - 10);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(cx + 10, cy - 4);
          ctx.lineTo(cx + 20, cy - 24);
          ctx.lineTo(cx + 4, cy - 10);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'WIZARD': { // Mèo phù thủy (Wizard Cat)
          // Mũ phù thủy xanh
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.moveTo(cx, cy - 24);
          ctx.lineTo(cx + 16, cy - 2);
          ctx.lineTo(cx - 16, cy - 2);
          ctx.closePath();
          ctx.fill();

          // Vành mũ
          ctx.beginPath();
          ctx.ellipse(cx, cy - 2, 22, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mặt mèo vàng bên dưới
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(cx, cy + 10, 12, 0, Math.PI * 2);
          ctx.fill();

          // Mắt mèo
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx - 4, cy + 8, 2.5, 0, Math.PI * 2);
          ctx.arc(cx + 4, cy + 8, 2.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    });

    this.cache.set(key, tex);
    return tex;
  }
}


