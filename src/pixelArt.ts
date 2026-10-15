import { Texture } from 'pixi.js';
import { GunKind, BuffKind } from './types';

// Helper tạo Pixi Texture từ HTML Canvas được vẽ theo phong cách Pixel Art
function createCanvasTexture(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx);

  const texture = Texture.from(canvas);
  texture.source.scaleMode = 'nearest';
  return texture;
}

export class PixelAssetManager {
  private static cache: Map<string, Texture> = new Map();

  // 1. Ô bàn cờ 48x48
  static getCellTexture(unlocked: boolean): Texture {
    const key = `cell_${unlocked}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createCanvasTexture(48, 48, (ctx) => {
      if (unlocked) {
        // Nền ô đá lâu đài
        ctx.fillStyle = '#222531';
        ctx.fillRect(0, 0, 48, 48);
        ctx.fillStyle = '#2f3447';
        ctx.fillRect(2, 2, 44, 44);

        // Viền góc ốc vít cơ khí
        ctx.fillStyle = '#474f6b';
        ctx.fillRect(4, 4, 3, 3);
        ctx.fillRect(41, 4, 3, 3);
        ctx.fillRect(4, 41, 3, 3);
        ctx.fillRect(41, 41, 3, 3);
      } else {
        // Ô bị khóa
        ctx.fillStyle = '#14151b';
        ctx.fillRect(0, 0, 48, 48);
        ctx.fillStyle = '#1a1b24';
        ctx.fillRect(2, 2, 44, 44);

        // Ký hiệu ổ khóa nhỏ ở giữa
        ctx.fillStyle = '#3a3d52';
        ctx.fillRect(20, 16, 8, 7);
        ctx.fillStyle = '#1a1b24';
        ctx.fillRect(22, 19, 4, 4);
        ctx.fillStyle = '#4a4d66';
        ctx.fillRect(18, 22, 12, 10);
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 2. Bánh Răng Cò (Trigger Gear) 40x40 - Số chấu N = level
  static getTriggerTexture(level: number): Texture {
    const key = `trigger_${level}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createCanvasTexture(40, 40, (ctx) => {
      const cx = 20, cy = 20;

      // Các chấu cò vươn ra mép 40x40
      ctx.fillStyle = '#d97706'; // Vàng đồng cổ điển
      for (let i = 0; i < level; i++) {
        const rad = (i * (360 / level) * Math.PI) / 180;
        const px = cx + Math.cos(rad) * 14;
        const py = cy + Math.sin(rad) * 14;

        // Vẽ răng / chấu cò
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rad);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-1, -1, 3, 3);
        ctx.restore();
      }

      // Thân đĩa tròn bánh răng
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();

      // Tâm trục bánh răng
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 3. Súng các loại 40x40
  static getGunTexture(kind: GunKind, level: number): Texture {
    const key = `gun_${kind}_${level}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createCanvasTexture(40, 40, (ctx) => {
      const cx = 20, cy = 20;

      // Đế súng kim loại
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 6, 28, 28);
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 8, 24, 24);

      // Thân và nòng súng tùy loại
      if (kind === 'PISTOL') {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(15, 14, 10, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(17, 8, 6, 12); // Nòng chĩa lên
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(18, 6, 4, 3); // Đầu nòng
      } else if (kind === 'CROSSBOW') {
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(17, 10, 6, 20);
        ctx.fillStyle = '#ca8a04';
        // Cánh cung
        ctx.fillRect(8, 12, 24, 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(18, 6, 4, 6); // Mũi tên
      } else if (kind === 'CRYO') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(13, 14, 14, 14);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(16, 7, 8, 12);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(18, 5, 4, 4); // Tinh thể băng
      } else if (kind === 'FLAMER') {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(13, 14, 14, 14);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(16, 8, 8, 12);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(17, 5, 6, 4); // Mồi lửa
      } else if (kind === 'SHOTGUN') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(12, 14, 16, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(14, 7, 5, 12); // 2 nòng súng
        ctx.fillRect(21, 7, 5, 12);
      } else if (kind === 'CANNON') {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(11, 14, 18, 16);
        ctx.fillStyle = '#44403c';
        ctx.fillRect(13, 6, 14, 12); // Nòng đại bác to
        ctx.fillStyle = '#78716c';
        ctx.fillRect(15, 4, 10, 3);
      } else { // TESLA
        ctx.fillStyle = '#6b21a8';
        ctx.fillRect(13, 15, 14, 14);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(17, 10, 6, 10);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(15, 6, 10, 5); // Cuộn cảm điện
      }

      // Huy hiệu Level ở góc dưới
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(26, 26, 12, 12);
      ctx.fillStyle = level >= 5 ? '#f59e0b' : '#38bdf8';
      ctx.fillRect(27, 27, 10, 10);
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 4. Bánh Răng Buff 40x40
  static getBuffTexture(kind: BuffKind, level: number): Texture {
    const key = `buff_${kind}_${level}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createCanvasTexture(40, 40, (ctx) => {
      const cx = 20, cy = 20;

      // Màu chủ đạo theo loại buff
      const colors = {
        DMG: { bg: '#7f1d1d', fg: '#ef4444', core: '#fee2e2' },
        SPEED: { bg: '#1e3a8a', fg: '#3b82f6', core: '#dbeafe' },
        FILL: { bg: '#14532d', fg: '#22c55e', core: '#dcfce7' },
        CRIT: { bg: '#713f12', fg: '#eab308', core: '#fef9c3' },
      }[kind];

      // Đĩa bánh răng
      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.fg;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      // Ký hiệu buff ở giữa
      ctx.fillStyle = colors.core;
      if (kind === 'DMG') {
        // Biểu tượng kiếm / xuyên
        ctx.fillRect(18, 12, 4, 16);
        ctx.fillRect(14, 16, 12, 4);
      } else if (kind === 'SPEED') {
        // Biểu tượng 2 mũi tên tua nhanh >>
        ctx.fillRect(14, 14, 5, 12);
        ctx.fillRect(21, 14, 5, 12);
      } else if (kind === 'FILL') {
        // Biểu tượng tia sấm nạp năng lượng
        ctx.fillRect(19, 11, 4, 8);
        ctx.fillRect(16, 17, 8, 4);
        ctx.fillRect(18, 20, 4, 9);
      } else {
        // Biểu tượng ngôi sao chí mạng
        ctx.fillRect(18, 12, 4, 16);
        ctx.fillRect(12, 18, 16, 4);
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 5. Quái vật
  static getEnemyTexture(type: 'NORMAL' | 'FAST' | 'TANK' | 'BOSS'): Texture {
    const key = `enemy_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = type === 'BOSS' ? 48 : (type === 'TANK' ? 32 : 24);
    const tex = createCanvasTexture(size, size, (ctx) => {
      const cx = size / 2, cy = size / 2;

      if (type === 'NORMAL') {
        // Yêu tinh Goblin pixel xanh lá
        ctx.fillStyle = '#15803d';
        ctx.fillRect(4, 4, 16, 16);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(6, 6, 12, 12);
        // Mắt đỏ dữ tợn
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(8, 8, 3, 3);
        ctx.fillRect(13, 8, 3, 3);
      } else if (type === 'FAST') {
        // Dơi quỷ / Sói tím chạy nhanh
        ctx.fillStyle = '#6b21a8';
        ctx.fillRect(4, 6, 16, 12);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(6, 8, 12, 8);
        // Mắt vàng
        ctx.fillStyle = '#facc15';
        ctx.fillRect(8, 10, 2, 2);
        ctx.fillRect(14, 10, 2, 2);
      } else if (type === 'TANK') {
        // Quái đá khổng lồ / Giáp sắt
        ctx.fillStyle = '#334155';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(6, 6, 20, 20);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(10, 11, 4, 4);
        ctx.fillRect(18, 11, 4, 4);
      } else { // BOSS
        // Ma vương rồng / Cỗ máy hắc ám to đùng
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(4, 4, 40, 40);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(6, 6, 36, 36);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(10, 10, 28, 28);
        // Sừng boss
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(8, 2, 6, 6);
        ctx.fillRect(34, 2, 6, 6);
        // Mắt rực lửa
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(14, 18, 6, 6);
        ctx.fillRect(28, 18, 6, 6);
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(16, 20, 2, 2);
        ctx.fillRect(30, 20, 2, 2);
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  // 6. Đạn (Bullet)
  static getBulletTexture(element: string): Texture {
    const key = `bullet_${element}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = createCanvasTexture(8, 12, (ctx) => {
      if (element === 'ICE') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(2, 0, 4, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, 2, 2, 8);
      } else if (element === 'FIRE') {
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(1, 0, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(2, 2, 4, 8);
      } else if (element === 'EXPLOSIVE') {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 2, 8, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(2, 4, 4, 4);
      } else { // NORMAL
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(2, 0, 4, 10);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(3, 2, 2, 6);
      }
    });

    this.cache.set(key, tex);
    return tex;
  }
}
