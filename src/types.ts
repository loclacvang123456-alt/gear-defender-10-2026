// Định nghĩa kiểu dữ liệu cho Gear Gun Castle (High-Res 720x1280)

export type ItemType = 'TRIGGER' | 'GUN' | 'BUFF' | 'RANDOM';

export type GunKind = 
  // Tier 1: Thường
  | 'PISTOL' 
  | 'CROSSBOW' 
  | 'SLINGSHOT' 
  | 'SHOTGUN' 
  | 'FLAMER' 
  | 'POISON' 
  | 'WIND' 
  | 'BOUNTY'
  // Tier 2: Hiếm
  | 'CRYO' 
  | 'CANNON' 
  | 'THORN' 
  | 'SACRIFICE' 
  | 'BERSERKER' 
  | 'IRON' 
  | 'MINE' 
  | 'AURA_SPEED'
  // Tier 3: Sử thi
  | 'TESLA' 
  | 'SNIPER' 
  | 'MYSTERY' 
  | 'MIMIC' 
  | 'SUMMONER' 
  | 'COMBO' 
  | 'BLIZZARD' 
  | 'MAGNET' 
  | 'AURA_DMG'
  // Tier 4: Huyền thoại
  | 'MINIGUN' 
  | 'TYPHOON' 
  | 'NUCLEAR' 
  | 'ASSASSIN' 
  | 'LASER' 
  | 'CHAINSAW' 
  | 'TIME' 
  | 'AURA_CRIT'
  // Tier 5: Thần thoại
  | 'METEOR' 
  | 'SOLAR' 
  | 'LUNAR' 
  | 'HOLY' 
  | 'BLACKHOLE' 
  | 'PRISM' 
  | 'AURA_ENERGY';

export type BuffKind = 'DMG' | 'SPEED' | 'FILL' | 'CRIT';

export type EnemyKind =
  | 'SWARM'
  | 'RUNNER'
  | 'NORMAL'
  | 'SHIELD'
  | 'BOMBER'
  | 'TANK'
  | 'ELITE'
  | 'MINIBOSS'
  | 'BOSS';

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
  rangeType: 'LANE' | 'SPREAD' | 'GLOBAL' | 'SHORT' | 'AURA';
  recoilOffset: number;
  turretAngle: number; // Góc xoay của nòng súng (Radian) chĩa thẳng vào quái
  gearAngle: number; // Góc xoay hiện tại của đế bánh răng súng (Radian)
  gearTargetAngle: number; // Góc mục tiêu cần quay tới
  shotCounter?: number; // Số phát bắn đã tích lũy (cho MYSTERY biến hình)
  auraPulseTimer?: number;

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
  isBlocked?: boolean; // Ô bị đá cản trở không thể đặt súng
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
  element: 'NORMAL' | 'ICE' | 'FIRE' | 'ELECTRIC' | 'EXPLOSIVE' | 'MYSTERY' | 'POISON' | 'HOLY' | 'LASER' | 'BOUNTY' | 'BLACKHOLE' | 'SAW' | 'WIND' | 'NUCLEAR' | 'TYPHOON' | 'MAGNET' | 'THORN' | 'PRISM' | 'MINE';
  active: boolean;
  radius: number;
  angle: number;
  scale?: number;
  rotation?: number;
  rotationSpeed?: number;
  customText?: string;
  bouncesLeft?: number;
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

export interface FireZone {
  x: number;
  y: number;
  radius: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  tickTimer: number;
}

export interface BlackHoleZone {
  x: number;
  y: number;
  radius: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  tickTimer: number;
}

export interface NuclearCrater {
  x: number;
  y: number;
  radius: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  tickTimer: number;
}

export interface Landmine {
  id: number;
  x: number;
  y: number;
  damage: number;
  radius: number;
  active: boolean;
}

export interface ThornField {
  x: number;
  y: number;
  radius: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  tickTimer: number;
}

export interface StasisField {
  x: number;
  y: number;
  radius: number;
  lifetime: number;
  maxLifetime: number;
}

export interface FallingMeteor {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number;
  speed: number;
  damage: number;
  radius: number;
  active: boolean;
}

export interface HolyCross {
  id: number;
  x: number;
  y: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  tickTimer: number;
  radius: number;
  fallProgress: number;
}

export interface LaserBeam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  color: number;
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
  poisonTimer?: number;
  freezeTimer?: number;
  confuseTimer?: number; // Bị nhiễm phóng xạ nguyên tử quay lại cắn quái khác!
  bleedTimer?: number;
  stasisTimer?: number;
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

export interface QuestProgress {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  rewardMedals: number;
  rewardGold?: number;
  rewardDia?: number;
  claimed: boolean;
}

export interface BattlePassData {
  points: number; // Tích lũy huân chương 🎖️ từ Quest & Battle
  claimedFree: number[]; // Các mốc đã nhận hàng miễn phí [1, 2, ...]
  claimedAd: number[]; // Các mốc đã nhận hàng xem quảng cáo [1, 2, ...]
}

export interface CastleTalentState {
  hpLevel: number;
  armorLevel: number;
  startGoldLevel: number;
  bountyLevel: number;
  turretDmgLevel?: number;
  atkSpeedLevel?: number;
  critRateLevel?: number;
  critDmgLevel?: number;
  regenLevel?: number;
  thornsLevel?: number;
  freezeBoostLevel?: number;
  energyLevel?: number;
  shieldLevel?: number;
  luckyDropLevel?: number;
}

export type Language = 'en' | 'vi';

export interface UserSaveData {
  saveVersion?: number;
  language?: Language;
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
  selectedCampaignMap: number; // 1 to 7
  highestCampaignStage: number;
  highestSurvivalWave: number;
  talents?: CastleTalentState;
  battlePass?: BattlePassData;
  quests?: QuestProgress[];
  shopRoyalAdProgress?: number;
  hasSeenTutorial?: boolean;
  tutorialStep?: TutorialStep;
}

export type TutorialStep =
  | 'BATTLE_ROLL'
  | 'BATTLE_MERGE'
  | 'BATTLE_START'
  | 'BATTLE_PLAYING'
  | 'LOBBY_SHOP'
  | 'SHOP_BUY'
  | 'LOBBY_EQUIP'
  | 'EQUIP_GUN'
  | 'COMPLETED';

