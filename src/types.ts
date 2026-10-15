// Định nghĩa kiểu dữ liệu cho Gear Gun Castle (High-Res 720x1280)

export type ItemType = 'TRIGGER' | 'GUN' | 'BUFF' | 'RANDOM';

export type GunKind = 
  | 'PISTOL' 
  | 'CROSSBOW' 
  | 'SLINGSHOT' 
  | 'CRYO' 
  | 'FLAMER' 
  | 'SHOTGUN' 
  | 'CANNON' 
  | 'TESLA' 
  | 'SNIPER' 
  | 'MINIGUN' 
  | 'METEOR';

export type BuffKind = 'DMG' | 'SPEED' | 'FILL' | 'CRIT';

export type EnemyKind = 'SWARM' | 'RUNNER' | 'NORMAL' | 'TANK' | 'ELITE' | 'BOSS';

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
  recoilOffset: number;
  turretAngle: number; // Góc xoay của nòng súng (Radian) chĩa thẳng vào quái
  gearAngle: number; // Góc xoay hiện tại của đế bánh răng súng (Radian)
  gearTargetAngle: number; // Góc mục tiêu cần quay tới (tăng đúng 90 độ = PI/2 mỗi lần gõ)

  // Dành riêng cho TRIGGER (Cò)
  angle: number; // Góc hiện tại (độ: 0 - 360)
  rotationSpeed: number; // Vòng / giây
  lastHitAngle: number[];

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
  gunKind: GunKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;
  element: 'NORMAL' | 'ICE' | 'FIRE' | 'ELECTRIC' | 'EXPLOSIVE';
  active: boolean;
  radius: number;
  angle: number;
  scale?: number;
}

export interface LightningBolt {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  chainX?: number;
  chainY?: number;
  lifetime: number;
  maxLifetime: number;
  color: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: number;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
}

export interface VisualSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  size: number;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  maxHp: number;
  hp: number;
  speed: number;
  isBoss: boolean;
  isElite: boolean;
  bounty: number; // Tiền thưởng khi hạ gục (quái càng khó càng nhiều tiền)
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

export type GameMode = 'CAMPAIGN' | 'SURVIVAL';

export interface UserSaveData {
  saveVersion?: number;
  diamonds: number;
  permanentGold: number;
  energy: number;
  maxEnergy: number;
  playerLevel: number;
  playerExp: number;
  unlockedGuns: GunKind[];
  equippedGuns: GunKind[]; // Tối đa 5 súng
  equippedBuffs: BuffKind[]; // Tối đa 2 buff
  gunLevels: Record<GunKind, number>; // Level nâng cấp vĩnh viễn (0 = Chưa mở khóa, 1-10)
  selectedCampaignMap: number; // 1, 2, 3
  highestCampaignStage: number;
  highestSurvivalWave: number;
  talents?: {
    hpLevel: number;
    armorLevel: number;
    startGoldLevel: number;
    bountyLevel: number;
  };
}
