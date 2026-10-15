// Định nghĩa kiểu dữ liệu cho Gear Gun Castle

export type ItemType = 'TRIGGER' | 'GUN' | 'BUFF' | 'RANDOM';

export type GunKind = 'PISTOL' | 'CROSSBOW' | 'CRYO' | 'FLAMER' | 'SHOTGUN' | 'CANNON' | 'TESLA';

export type BuffKind = 'DMG' | 'SPEED' | 'FILL' | 'CRIT';

export interface GridItem {
  id: string;
  type: ItemType;
  level: number; // 1 to 5
  tier: number; // 1 to 5

  // Dành riêng cho GUN
  gunKind?: GunKind;
  fill: number; // 0.0 to 1.0
  fillPerHit: number;
  damage: number;
  rangeType: 'LANE' | 'SPREAD' | 'GLOBAL' | 'SHORT';
  recoilOffset: number; // Visual juice

  // Dành riêng cho TRIGGER (Cò)
  angle: number; // Góc hiện tại (độ: 0 - 360)
  rotationSpeed: number; // Vòng / giây (ví dụ 1.5)
  lastHitAngle: number[]; // Lưu các mốc đã trigger

  // Dành riêng cho BUFF
  buffKind?: BuffKind;

  // Dành riêng cho RANDOM
  hitCount?: number;
}

export interface GridCell {
  col: number; // 0 to 4
  row: number; // 0 to 4
  unlocked: boolean;
  item: GridItem | null;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;
  element: 'NORMAL' | 'ICE' | 'FIRE' | 'ELECTRIC' | 'EXPLOSIVE';
  active: boolean;
  radius: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  lane: number; // 0 to 4
  maxHp: number;
  hp: number;
  speed: number;
  isBoss: boolean;
  isElite: boolean;
  active: boolean;
  width: number;
  height: number;
  slowTimer: number;
  burnTimer: number;
  hitFlashTimer: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number;
  active: boolean;
}
