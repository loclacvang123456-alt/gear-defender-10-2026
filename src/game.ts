import { Container, Graphics, Sprite, Text, TextStyle, Rectangle, FederatedPointerEvent } from 'pixi.js';
import { GridCell, GridItem, Bullet, Enemy, GunKind, BuffKind, EnemyKind, GameMode, UserSaveData, Language, LightningBolt, Shockwave, VisualSpark, FireZone, BlackHoleZone, FallingMeteor, NuclearCrater, Landmine, ThornField, StasisField, HolyCross, LaserBeam, TutorialStep } from './types';
import { PixelAssetManager } from './pixelArt';
import { sound } from './audio';
import { adService } from './adService';
import { GunDetailInfo, GUN_NAMES_EN, GUN_NAMES_VI, GUN_DETAILS_EN, GUN_DETAILS_VI, getGunName, getGunDetail, getLanguage, setLanguage, t, TranslationKey } from './i18n';

const DEFAULT_SAVE: UserSaveData = {
  saveVersion: 3,
  language: 'en',
  diamonds: 6472,
  permanentGold: 12118,
  energy: 999,
  maxEnergy: 999,
  playerLevel: 115,
  playerExp: 75,
  unlockedGuns: [
    'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER',
    'MYSTERY', 'MIMIC', 'AURA_DMG', 'AURA_SPEED', 'NUCLEAR', 'SACRIFICE'
  ],
  equippedGuns: ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'],
  equippedBuffs: ['DMG', 'SPEED'],
  gunLevels: {
    // Tier 1: Thường
    PISTOL: 1,
    CROSSBOW: 1,
    SLINGSHOT: 1,
    SHOTGUN: 1,
    FLAMER: 1,
    POISON: 0,
    WIND: 0,
    BOUNTY: 0,
    // Tier 2: Hiếm
    CRYO: 0,
    CANNON: 0,
    THORN: 0,
    SACRIFICE: 1,
    BERSERKER: 0,
    IRON: 0,
    MINE: 0,
    AURA_SPEED: 1,
    // Tier 3: Sử thi
    TESLA: 0,
    SNIPER: 0,
    MYSTERY: 1,
    MIMIC: 1,
    SUMMONER: 0,
    COMBO: 0,
    BLIZZARD: 0,
    MAGNET: 0,
    AURA_DMG: 1,
    // Tier 4: Huyền thoại
    MINIGUN: 0,
    TYPHOON: 0,
    NUCLEAR: 1,
    ASSASSIN: 0,
    LASER: 0,
    CHAINSAW: 0,
    TIME: 0,
    AURA_CRIT: 0,
    // Tier 5: Thần thoại
    METEOR: 0,
    SOLAR: 0,
    LUNAR: 0,
    HOLY: 0,
    BLACKHOLE: 0,
    PRISM: 0,
    AURA_ENERGY: 0,
  },
  selectedCampaignMap: 1,
  highestCampaignStage: 1,
  highestSurvivalWave: 0,
  talents: {
    hpLevel: 0,
    armorLevel: 0,
    startGoldLevel: 0,
    bountyLevel: 0,
    turretDmgLevel: 0,
    atkSpeedLevel: 0,
    critRateLevel: 0,
    critDmgLevel: 0,
    regenLevel: 0,
    thornsLevel: 0,
    freezeBoostLevel: 0,
    energyLevel: 0,
    shieldLevel: 0,
    luckyDropLevel: 0,
  },
  battlePass: {
    points: 120,
    claimedFree: [],
    claimedAd: [],
  },
  quests: [
    { id: 'kill_monsters', title: 'Monster Hunter', desc: 'Defeat 40 enemy monsters in battles', target: 40, current: 0, rewardMedals: 60, rewardGold: 300, claimed: false },
    { id: 'clear_waves', title: 'Wave Survivor', desc: 'Survive 6 waves of invasion', target: 6, current: 0, rewardMedals: 80, rewardDia: 25, claimed: false },
    { id: 'roll_weapons', title: 'Arsenal Crafter', desc: 'Roll weapons 8 times during battle', target: 8, current: 0, rewardMedals: 50, rewardGold: 200, claimed: false },
    { id: 'upgrade_guns', title: 'Master Gunsmith', desc: 'Upgrade any weapon level in Equipment', target: 1, current: 0, rewardMedals: 50, rewardGold: 250, claimed: false },
    { id: 'roll_talent', title: 'Castle Alchemist', desc: 'Roll a random Castle Talent buff', target: 1, current: 0, rewardMedals: 70, rewardDia: 20, claimed: false },
    { id: 'open_chest', title: 'Treasure Seeker', desc: 'Open any chest in the Shop', target: 1, current: 0, rewardMedals: 60, rewardGold: 200, claimed: false },
    { id: 'win_campaign', title: 'Realm Defender', desc: 'Reach Wave 10 on any Campaign stage', target: 10, current: 0, rewardMedals: 100, rewardDia: 40, claimed: false },
  ],
  shopRoyalAdProgress: 0,
  hasSeenTutorial: false,
  tutorialStep: 'BATTLE_ROLL',
};

// Phân loại Tier súng cố định (Weapon Rarity):
// Tier 1: Thường (Common) - Vòng trắng
// Tier 2: Hiếm (Rare) - Vòng xanh lam
// Tier 3: Sử thi (Epic) - Vòng tím
// Tier 4: Huyền thoại (Legendary) - Vòng vàng
// Tier 5: Thần thoại (Mythic) - Vòng đỏ
export const GUN_TIERS: Record<GunKind, number> = {
  // Tier 1
  PISTOL: 1,
  CROSSBOW: 1,
  SLINGSHOT: 1,
  SHOTGUN: 1,
  FLAMER: 1,
  POISON: 1,
  WIND: 1,
  BOUNTY: 1,
  // Tier 2
  CRYO: 2,
  CANNON: 2,
  THORN: 2,
  SACRIFICE: 2,
  BERSERKER: 2,
  IRON: 2,
  MINE: 2,
  AURA_SPEED: 2,
  // Tier 3
  TESLA: 3,
  SNIPER: 3,
  MYSTERY: 3,
  MIMIC: 3,
  SUMMONER: 3,
  COMBO: 3,
  BLIZZARD: 3,
  MAGNET: 3,
  AURA_DMG: 3,
  // Tier 4
  MINIGUN: 4,
  TYPHOON: 4,
  NUCLEAR: 4,
  ASSASSIN: 4,
  LASER: 4,
  CHAINSAW: 4,
  TIME: 4,
  AURA_CRIT: 4,
  // Tier 5
  METEOR: 5,
  SOLAR: 5,
  LUNAR: 5,
  HOLY: 5,
  BLACKHOLE: 5,
  PRISM: 5,
  AURA_ENERGY: 5,
};

export function getGunTier(kind: GunKind): number {
  return GUN_TIERS[kind] || 1;
}

export type { GunDetailInfo };
export const GUN_NAMES: Record<GunKind, string> = { ...GUN_NAMES_EN };
export const GUN_DETAILS: Record<GunKind, GunDetailInfo> = { ...GUN_DETAILS_EN };

export function syncLocalizedGunData(lang: Language = 'en') {
  for (const k of Object.keys(GUN_NAMES_EN) as GunKind[]) {
    GUN_NAMES[k] = getGunName(k, lang);
    GUN_DETAILS[k] = getGunDetail(k, lang);
  }
}

// Bảng màu chuẩn Rarity Gaming trên mạng:
// 1: Trắng (Common) | 2: Xanh (Rare) | 3: Tím (Epic) | 4: Vàng (Legendary) | 5: Đỏ (Mythic)
export interface RarityConfig {
  tier: number;
  name: string;
  color: number;
  hex: string;
}

export const RARITY_CONFIGS: Record<number, RarityConfig> = {
  1: {
    tier: 1,
    name: 'COMMON',
    color: 0xf8fafc,
    hex: '#f8fafc',
  },
  2: {
    tier: 2,
    name: 'RARE',
    color: 0x3b82f6,
    hex: '#38bdf8',
  },
  3: {
    tier: 3,
    name: 'EPIC',
    color: 0xa855f7,
    hex: '#c084fc',
  },
  4: {
    tier: 4,
    name: 'LEGENDARY',
    color: 0xfacc15,
    hex: '#facc15',
  },
  5: {
    tier: 5,
    name: 'MYTHIC',
    color: 0xef4444,
    hex: '#ef4444',
  },
};

// Quản lý View cố định cho từng ô 96x96 (Zero Allocation)
interface GridSlotView {
  container: Container;
  cellSprite: Sprite;
  highlightG: Graphics;
  mergeHighlightG: Graphics; // Viền vàng kim phát sáng khi có thể MERGE
  tierFrameG: Graphics; // Vòng hollow vuông thể hiện Tier súng (1 Trắng, 2 Xanh, 3 Tím, 4 Vàng, 5 Đỏ)
  obstacleSprite: Sprite; // Chướng ngại vật đá cản trở
  itemContainer: Container;
  baseSprite: Sprite; // Đế bánh răng kim loại xoay khi Cò gõ
  barrelSprite: Sprite; // Nòng súng xoay 360 độ tự động ngắm quái
  fillG: Graphics;
  lvlText: Text;
  popScale: number; // Scale nảy nổ bung khi merge súng (1.38 -> 1.0)
}

interface EnemyView {
  container: Container;
  sprite: Sprite;
  hpBg: Graphics;
  hpFill: Graphics;
  active: boolean;
}

interface BulletView {
  sprite: Sprite;
  active: boolean;
}

interface FloatingTextView {
  text: Text;
  active: boolean;
  lifetime: number;
}

export class GameEngine {
  public stage: Container;

  // Lưu trữ dữ liệu & Chế độ chơi (Menu / Lobby / Workshop)
  public saveData: UserSaveData;
  public gameMode: GameMode = 'CAMPAIGN';
  public inMenu: boolean = true;
  private mainMenuContainer!: Container;
  private menuTab: 'SHOP' | 'EQUIPMENT' | 'WORLD' | 'TALENT' | 'MODES' = 'WORLD';
  private resultModalContainer!: Container;
  public isPaused: boolean = false;
  public tutorialStep: TutorialStep = 'BATTLE_ROLL';

  // Lưới lâu đài 5x5 chuẩn High-Res (720 x 1280)
  public readonly COLS = 5;
  public readonly ROWS = 5;
  public readonly CELL_SIZE = 96; // Mỗi ô to 96px
  public readonly GRID_X = 120; // (720 - 480) / 2 = 120
  public readonly GRID_Y = 560;
  public readonly WALL_Y = 540;

  public grid: GridCell[][] = [];
  private slotViews: GridSlotView[][] = [];

  // Object Pools
  private enemyPool: EnemyView[] = [];
  private bulletPool: BulletView[] = [];
  private floatingTextPool: FloatingTextView[] = [];

  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];

  // Layer containers
  private bgContainer: Container;
  private wallContainer: Container;
  private gridContainer: Container;
  private gridBgLayer!: Container;
  private gridItemsLayer!: Container;
  private gridHighlightLayer!: Container;
  private animTime: number = 0;
  private enemyContainer: Container;
  private bulletContainer: Container;
  private fxContainer: Container;
  private uiContainer: Container;
  private dragContainer: Container;
  private tooltipContainer: Container;

  // Ô Thùng Rác (Bán món đồ khi đang kéo)
  private trashContainer!: Container;
  private trashBg!: Sprite;
  private trashText!: Text;

  // Tooltip Popover (Hiện cạnh súng)
  private tooltipCard!: Graphics;
  private tooltipTitleText!: Text;
  private tooltipStatsText!: Text;
  private tooltipDescText!: Text;
  private tooltipHintText!: Text;

  // Click vs Drag phân biệt
  private pointerDownItem: GridItem | null = null;
  private pointerDownCol: number = -1;
  private pointerDownRow: number = -1;
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;
  private isDragging: boolean = false;
  private dragGhost: Container | null = null;
  private hoverCol: number = -1;
  private hoverRow: number = -1;

  // Kinh tế & Tiến trình
  public gold: number = 15;
  public castleHp: number = 100;
  public maxCastleHp: number = 100;
  public castleShield: number = 0;
  public wave: number = 1;
  public maxWave: number = 10;
  public isWaveActive: boolean = false;
  public prepPhase: boolean = true;
  public spawnTimer: number = 0;
  public enemiesToSpawn: number = 0;
  public rollPrice: number = 2;
  public rollCount: number = 0;
  public gameSpeed: number = 1.0;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;

  // Screen shake
  public trauma: number = 0;

  // Combo count (Súng COMBO phong cách Random Dice)
  public comboCount: number = 0;

  // UI Components
  private goldText!: Text;
  private waveText!: Text;
  private hpText!: Text;
  private rollBtnContainer!: Container;
  private rollBtnBg!: Sprite;
  private rollBtnText!: Text;
  private lastCanAffordRoll: boolean | null = null;
  private lastRollPriceDisplayed: number = -1;
  private startWaveBtnContainer!: Container;
  private startWaveBtnBg!: Sprite;
  private startWaveBtnText!: Text;
  private speedBtnText!: Text;
  private tipText!: Text;

  // FX Special: Sét giật liên tục, Sóng nổ lan, Mảnh văng, Lóe viền nòng
  private lightningBolts: LightningBolt[] = [];
  private shockwaves: Shockwave[] = [];
  private visualSparks: VisualSpark[] = [];
  private fireZones: FireZone[] = [];
  private blackHoleZones: BlackHoleZone[] = [];
  private fallingMeteors: FallingMeteor[] = [];
  private nuclearCraters: NuclearCrater[] = [];
  private landmines: Landmine[] = [];
  private thornFields: ThornField[] = [];
  private stasisFields: StasisField[] = [];
  private holyCrosses: HolyCross[] = [];
  private laserBeams: LaserBeam[] = [];
  private muzzleFlashes: { x: number; y: number; radius: number; color: number; lifetime: number }[] = [];
  private fxGraphics!: Graphics;

  private nextId: number = 1;
  private readonly FONT_FAMILY = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif';

  constructor() {
    this.stage = new Container();
    this.stage.eventMode = 'static';
    this.stage.hitArea = new Rectangle(0, 0, 720, 1280);

    this.bgContainer = new Container();
    this.enemyContainer = new Container();
    this.wallContainer = new Container();
    this.bulletContainer = new Container();
    this.gridContainer = new Container();
    this.dragContainer = new Container();
    this.fxContainer = new Container();
    this.uiContainer = new Container();
    this.tooltipContainer = new Container();
    this.saveData = this.loadSaveData();
    this.tutorialStep = this.saveData.tutorialStep || (this.saveData.hasSeenTutorial ? 'COMPLETED' : 'BATTLE_ROLL');
    adService.registerGameInstance(this);

    this.mainMenuContainer = new Container();
    this.resultModalContainer = new Container();

    this.stage.addChild(this.bgContainer);
    this.stage.addChild(this.enemyContainer);
    this.stage.addChild(this.wallContainer);
    this.stage.addChild(this.gridContainer);
    this.stage.addChild(this.bulletContainer);
    this.stage.addChild(this.fxContainer);
    this.stage.addChild(this.dragContainer);
    this.stage.addChild(this.uiContainer);
    this.stage.addChild(this.tooltipContainer);
    this.stage.addChild(this.resultModalContainer);
    this.stage.addChild(this.mainMenuContainer);

    this.fxGraphics = new Graphics();
    this.fxContainer.addChild(this.fxGraphics);

    const initialMapId = this.saveData?.selectedCampaignMap || 1;
    this.initBackground(initialMapId);
    this.initGrid();
    this.initWall(initialMapId);
    this.initObjectPools();
    this.initTooltip();
    this.initUI();
    this.initTrashZone();
    this.initGlobalDragListeners();
    this.initMainMenu();
    this.initResultModal();
    this.showMainMenu();
  }

  private initBackground(mapId: number = 1) {
    this.bgContainer.removeChildren();
    const bg = new Graphics();
    const lanes = [160, 360, 560];

    if (mapId === 2) {
      // ==================== BẢN ĐỒ 2: BĂNG TUYẾT (SNOW & ICE) ====================
      // 1. Cánh đồng tuyết trắng tinh
      bg.rect(0, 0, 720, this.WALL_Y).fill({ color: 0xf8fafc });

      // Dải tuyết phủ xen kẽ
      const stripeH = 54;
      for (let y = 0; y < this.WALL_Y; y += stripeH * 2) {
        bg.rect(0, y, 720, stripeH).fill({ color: 0xe2e8f0 });
      }

      // 3 Làn đường sông băng trơn trượt
      for (const lx of lanes) {
        bg.roundRect(lx - 42, 0, 84, this.WALL_Y, 12).fill({ color: 0xbfdbfe });
        bg.rect(lx - 36, 0, 72, this.WALL_Y).fill({ color: 0x93c5fd });
        bg.rect(lx - 22, 0, 44, this.WALL_Y).fill({ color: 0x60a5fa });

        // Tinh thể băng lát dọc đường
        for (let py = 24; py < this.WALL_Y - 20; py += 44) {
          const offset = ((py / 44) % 2 === 0) ? -12 : 10;
          bg.roundRect(lx + offset - 11, py, 22, 14, 6).fill({ color: 0x38bdf8 });
          bg.roundRect(lx + offset - 10, py + 1, 19, 10, 5).fill({ color: 0xe0f2fe });
          bg.roundRect(lx - offset - 7, py + 18, 15, 10, 4).fill({ color: 0x0284c7 });
        }
      }

      // Tinh thể tuyết & khối băng lấp lánh rải trên nền tuyết
      for (let i = 0; i < 60; i++) {
        const gx = ((i * 137 + 29) % 640) + 40;
        const gy = ((i * 89 + 73) % (this.WALL_Y - 120)) + 76;
        if (lanes.some((lx) => Math.abs(gx - lx) < 48)) continue;

        // Bông tuyết 4 cánh phát sáng
        bg.moveTo(gx - 6, gy).lineTo(gx + 6, gy).stroke({ color: 0x38bdf8, width: 2 });
        bg.moveTo(gx, gy - 6).lineTo(gx, gy + 6).stroke({ color: 0x38bdf8, width: 2 });
        bg.circle(gx, gy, 2).fill({ color: 0xffffff });

        // Gò tuyết nhỏ
        if (i % 2 === 0) {
          bg.ellipse(gx + 8, gy + 8, 10, 5).fill({ color: 0xffffff, alpha: 0.9 });
          bg.ellipse(gx + 8, gy + 9, 10, 3).fill({ color: 0xdbeafe, alpha: 0.8 });
        }
      }

      // Rừng thông phủ tuyết trắng xóa phía trên và hai bên sườn
      for (let x = -10; x <= 730; x += 46) {
        const r = (x % 92 === 0) ? 30 : 25;
        bg.circle(x, 18, r + 4).fill({ color: 0x1e293b });
        bg.circle(x, 14, r).fill({ color: 0x0284c7 });
        bg.circle(x - 4, 10, r * 0.72).fill({ color: 0x38bdf8 });
        bg.circle(x - 6, 7, r * 0.45).fill({ color: 0xffffff }); // Chỏm tuyết phủ
      }
      for (let y = 68; y < this.WALL_Y - 30; y += 64) {
        bg.circle(10, y + 4, 22).fill({ color: 0x1e293b });
        bg.circle(10, y, 20).fill({ color: 0x0284c7 });
        bg.circle(14, y - 4, 14).fill({ color: 0xffffff });

        bg.circle(710, y + 4, 22).fill({ color: 0x1e293b });
        bg.circle(710, y, 20).fill({ color: 0x0284c7 });
        bg.circle(706, y - 4, 14).fill({ color: 0xffffff });
      }

      // Sân gạch đá phủ băng lạnh (Courtyard)
      const courtyardY = this.WALL_Y;
      const courtyardH = 1280 - courtyardY;
      bg.rect(0, courtyardY, 720, courtyardH).fill({ color: 0x0f172a });

      const brickW = 72;
      const brickH = 36;
      const iceBrickPalette = [0x1e293b, 0x334155, 0x1e3a5f, 0x243c5a];
      for (let row = 0, by = courtyardY; by < 1280; row++, by += brickH) {
        const xOffset = (row % 2 === 1) ? -brickW / 2 : 0;
        for (let col = 0, bx = xOffset; bx < 720; col++, bx += brickW) {
          const colorIdx = (row * 7 + col * 13) % iceBrickPalette.length;
          bg.roundRect(bx + 2, by + 2, brickW - 4, brickH - 4, 5).fill({ color: iceBrickPalette[colorIdx] });
          bg.roundRect(bx + 3, by + 3, brickW - 6, 4, 2).fill({ color: 0x38bdf8, alpha: 0.35 });
        }
      }

      // Đuốc lửa băng ma thuật xanh ngọc
      const torchYList = [680, 910];
      for (const ty of torchYList) {
        for (const tx of [56, 664]) {
          bg.roundRect(tx - 24, ty - 24, 48, 48, 10).fill({ color: 0x0f172a });
          bg.roundRect(tx - 20, ty - 20, 40, 40, 8).fill({ color: 0x1e3a5f });
          bg.circle(tx, ty, 42).fill({ color: 0x0284c7, alpha: 0.2 });
          bg.circle(tx, ty, 24).fill({ color: 0x38bdf8, alpha: 0.3 });
          bg.circle(tx, ty, 12).fill({ color: 0x0f172a });
          bg.circle(tx, ty, 9).fill({ color: 0x0284c7 });
          bg.circle(tx, ty - 1, 5.5).fill({ color: 0xe0f2fe });
        }
      }

      // Khung bàn cờ viền băng pha lê
      const gx = this.GRID_X;
      const gy = this.GRID_Y;
      const gw = this.COLS * this.CELL_SIZE;
      const gh = this.ROWS * this.CELL_SIZE;

      bg.roundRect(gx - 18, gy - 12, gw + 36, gh + 30, 18).fill({ color: 0x020617, alpha: 0.75 });
      bg.roundRect(gx - 14, gy - 14, gw + 28, gh + 28, 16).fill({ color: 0x7dd3fc });
      bg.roundRect(gx - 11, gy - 11, gw + 22, gh + 22, 14).fill({ color: 0x0369a1 });
      bg.roundRect(gx - 4, gy - 4, gw + 8, gh + 8, 10).fill({ color: 0x0f172a });

      const corners = [
        [gx - 12, gy - 12],
        [gx + gw - 16, gy - 12],
        [gx - 12, gy + gh - 16],
        [gx + gw - 16, gy + gh - 16],
      ];
      for (const [cx, cy] of corners) {
        bg.roundRect(cx, cy, 28, 28, 6).fill({ color: 0x0284c7 });
        bg.roundRect(cx + 2, cy + 2, 24, 24, 5).fill({ color: 0x38bdf8 });
        bg.circle(cx + 14, cy + 14, 4).fill({ color: 0xffffff });
      }

    } else if (mapId === 3) {
      // ==================== BẢN ĐỒ 3: SA MẠC CÁT VÀNG (DESERT & DUNES) ====================
      // 1. Cồn cát vàng rực rỡ
      bg.rect(0, 0, 720, this.WALL_Y).fill({ color: 0xfef08a });

      // Các đợt sóng cồn cát uốn lượn
      const stripeH = 54;
      for (let y = 0; y < this.WALL_Y; y += stripeH * 2) {
        bg.rect(0, y, 720, stripeH).fill({ color: 0xfde047 });
      }

      // 3 Con đường cát nung & đá sa thạch đỏ
      for (const lx of lanes) {
        bg.roundRect(lx - 42, 0, 84, this.WALL_Y, 12).fill({ color: 0xb45309 });
        bg.rect(lx - 36, 0, 72, this.WALL_Y).fill({ color: 0xd97706 });
        bg.rect(lx - 22, 0, 44, this.WALL_Y).fill({ color: 0x92400e });

        // Đá sa thạch lát đường
        for (let py = 24; py < this.WALL_Y - 20; py += 44) {
          const offset = ((py / 44) % 2 === 0) ? -12 : 10;
          bg.roundRect(lx + offset - 11, py, 22, 14, 6).fill({ color: 0x78350f });
          bg.roundRect(lx + offset - 10, py + 1, 19, 10, 5).fill({ color: 0xfde047 });
          bg.roundRect(lx - offset - 7, py + 18, 15, 10, 4).fill({ color: 0xb45309 });
        }
      }

      // Cây xương rồng Saguaro & đá sa mạc rải trên cồn cát
      for (let i = 0; i < 45; i++) {
        const gx = ((i * 137 + 29) % 640) + 40;
        const gy = ((i * 89 + 73) % (this.WALL_Y - 120)) + 76;
        if (lanes.some((lx) => Math.abs(gx - lx) < 48)) continue;

        if (i % 2 === 0) {
          // Cây xương rồng Cartoon Saguaro với 2 nhánh uốn lên
          bg.roundRect(gx - 4, gy - 18, 8, 24, 4).fill({ color: 0x15803d });
          bg.roundRect(gx - 3, gy - 17, 6, 22, 3).fill({ color: 0x22c55e });
          bg.rect(gx - 11, gy - 8, 7, 4).fill({ color: 0x15803d });
          bg.roundRect(gx - 11, gy - 14, 4, 10, 2).fill({ color: 0x22c55e });
          bg.rect(gx + 4, gy - 5, 7, 4).fill({ color: 0x15803d });
          bg.roundRect(gx + 7, gy - 12, 4, 10, 2).fill({ color: 0x22c55e });
          bg.circle(gx, gy - 19, 2.5).fill({ color: 0xf43f5e });
        } else {
          // Tảng đá phong hóa sa mạc
          bg.roundRect(gx - 7, gy - 4, 14, 8, 3).fill({ color: 0xb45309 });
          bg.roundRect(gx - 6, gy - 3, 11, 5, 2).fill({ color: 0xfde047 });
        }
      }

      // Vách đá hẻm núi sa thạch (Sandstone Bluffs) phía trên & 2 bên
      for (let x = -10; x <= 730; x += 46) {
        const r = (x % 92 === 0) ? 30 : 25;
        bg.circle(x, 18, r + 4).fill({ color: 0x78350f });
        bg.circle(x, 14, r).fill({ color: 0xb45309 });
        bg.circle(x - 4, 10, r * 0.72).fill({ color: 0xd97706 });
        bg.circle(x - 6, 7, r * 0.4).fill({ color: 0xfde047 });
      }
      for (let y = 68; y < this.WALL_Y - 30; y += 64) {
        bg.circle(10, y + 4, 22).fill({ color: 0x78350f });
        bg.circle(10, y, 20).fill({ color: 0xb45309 });
        bg.circle(14, y - 4, 12).fill({ color: 0xd97706 });

        bg.circle(710, y + 4, 22).fill({ color: 0x78350f });
        bg.circle(710, y, 20).fill({ color: 0xb45309 });
        bg.circle(706, y - 4, 12).fill({ color: 0xd97706 });
      }

      // Sân gạch gốm Terracotta & sa thạch cổ
      const courtyardY = this.WALL_Y;
      const courtyardH = 1280 - courtyardY;
      bg.rect(0, courtyardY, 720, courtyardH).fill({ color: 0x291809 });

      const brickW = 72;
      const brickH = 36;
      const desertBrickPalette = [0x451a03, 0x78350f, 0x9a3412, 0xb45309];
      for (let row = 0, by = courtyardY; by < 1280; row++, by += brickH) {
        const xOffset = (row % 2 === 1) ? -brickW / 2 : 0;
        for (let col = 0, bx = xOffset; bx < 720; col++, bx += brickW) {
          const colorIdx = (row * 7 + col * 13) % desertBrickPalette.length;
          bg.roundRect(bx + 2, by + 2, brickW - 4, brickH - 4, 5).fill({ color: desertBrickPalette[colorIdx] });
          bg.roundRect(bx + 3, by + 3, brickW - 6, 4, 2).fill({ color: 0xfde047, alpha: 0.35 });
        }
      }

      // Đuốc lửa mặt trời rực cháy
      const torchYList = [680, 910];
      for (const ty of torchYList) {
        for (const tx of [56, 664]) {
          bg.roundRect(tx - 24, ty - 24, 48, 48, 10).fill({ color: 0x291809 });
          bg.roundRect(tx - 20, ty - 20, 40, 40, 8).fill({ color: 0x78350f });
          bg.circle(tx, ty, 42).fill({ color: 0xf59e0b, alpha: 0.28 });
          bg.circle(tx, ty, 24).fill({ color: 0xfacc15, alpha: 0.35 });
          bg.circle(tx, ty, 12).fill({ color: 0x451a03 });
          bg.circle(tx, ty, 9).fill({ color: 0xd97706 });
          bg.circle(tx, ty - 1, 5.5).fill({ color: 0xfef08a });
        }
      }

      // Khung bàn cờ chạm trổ đá hoàng kim Sa Mạc
      const gx = this.GRID_X;
      const gy = this.GRID_Y;
      const gw = this.COLS * this.CELL_SIZE;
      const gh = this.ROWS * this.CELL_SIZE;

      bg.roundRect(gx - 18, gy - 12, gw + 36, gh + 30, 18).fill({ color: 0x1c0c03, alpha: 0.8 });
      bg.roundRect(gx - 14, gy - 14, gw + 28, gh + 28, 16).fill({ color: 0xf59e0b });
      bg.roundRect(gx - 11, gy - 11, gw + 22, gh + 22, 14).fill({ color: 0xb45309 });
      bg.roundRect(gx - 4, gy - 4, gw + 8, gh + 8, 10).fill({ color: 0x451a03 });

      const corners = [
        [gx - 12, gy - 12],
        [gx + gw - 16, gy - 12],
        [gx - 12, gy + gh - 16],
        [gx + gw - 16, gy + gh - 16],
      ];
      for (const [cx, cy] of corners) {
        bg.roundRect(cx, cy, 28, 28, 6).fill({ color: 0xb45309 });
        bg.roundRect(cx + 2, cy + 2, 24, 24, 5).fill({ color: 0xfacc15 });
        bg.circle(cx + 14, cy + 14, 4).fill({ color: 0x78350f });
      }

    } else if (mapId === 4) {
      // ==================== BẢN ĐỒ 4: NÚI LỬA DUNG NHAM (MAGMA CITADEL) ====================
      bg.rect(0, 0, 720, this.WALL_Y).fill({ color: 0x1c1917 });
      const stripeH = 54;
      for (let y = 0; y < this.WALL_Y; y += stripeH * 2) {
        bg.rect(0, y, 720, stripeH).fill({ color: 0x292524 });
      }

      for (const lx of lanes) {
        bg.roundRect(lx - 42, 0, 84, this.WALL_Y, 12).fill({ color: 0x7f1d1d });
        bg.rect(lx - 36, 0, 72, this.WALL_Y).fill({ color: 0xd97706 });
        bg.rect(lx - 22, 0, 44, this.WALL_Y).fill({ color: 0xef4444 });

        for (let py = 24; py < this.WALL_Y - 20; py += 44) {
          const offset = ((py / 44) % 2 === 0) ? -12 : 10;
          bg.roundRect(lx + offset - 11, py, 22, 14, 6).fill({ color: 0xb45309 });
          bg.roundRect(lx + offset - 10, py + 1, 19, 10, 5).fill({ color: 0xfef08a });
          bg.roundRect(lx - offset - 7, py + 18, 15, 10, 4).fill({ color: 0xf97316 });
        }
      }

      // Tro bụi, tàn lửa & đá núi lửa
      for (let i = 0; i < 50; i++) {
        const gx = ((i * 137 + 29) % 640) + 40;
        const gy = ((i * 89 + 73) % (this.WALL_Y - 120)) + 76;
        if (lanes.some((lx) => Math.abs(gx - lx) < 48)) continue;

        bg.circle(gx, gy, 3).fill({ color: i % 2 === 0 ? 0xfacc15 : 0xef4444 });
        bg.circle(gx + 4, gy - 6, 2).fill({ color: 0xfde047, alpha: 0.8 });
      }

      // Sân gạch đá bazan nung nóng
      const courtyardY = this.WALL_Y;
      const courtyardH = 1280 - courtyardY;
      bg.rect(0, courtyardY, 720, courtyardH).fill({ color: 0x18181b });

      const brickW = 72, brickH = 36;
      const magmaPalette = [0x18181b, 0x27272a, 0x450a0a, 0x7f1d1d];
      for (let row = 0, by = courtyardY; by < 1280; row++, by += brickH) {
        const xOffset = (row % 2 === 1) ? -brickW / 2 : 0;
        for (let col = 0, bx = xOffset; bx < 720; col++, bx += brickW) {
          const colorIdx = (row * 7 + col * 13) % magmaPalette.length;
          bg.roundRect(bx + 2, by + 2, brickW - 4, brickH - 4, 5).fill({ color: magmaPalette[colorIdx] });
          bg.roundRect(bx + 3, by + 3, brickW - 6, 4, 2).fill({ color: 0xef4444, alpha: 0.35 });
        }
      }

      // Đuốc lửa dung nham
      for (const ty of [680, 910]) {
        for (const tx of [56, 664]) {
          bg.roundRect(tx - 24, ty - 24, 48, 48, 10).fill({ color: 0x1c1917 });
          bg.roundRect(tx - 20, ty - 20, 40, 40, 8).fill({ color: 0x7f1d1d });
          bg.circle(tx, ty, 42).fill({ color: 0xef4444, alpha: 0.3 });
          bg.circle(tx, ty, 24).fill({ color: 0xf97316, alpha: 0.4 });
          bg.circle(tx, ty - 1, 6).fill({ color: 0xfef08a });
        }
      }

      // Khung bàn cờ dung nham
      const gx = this.GRID_X, gy = this.GRID_Y, gw = this.COLS * this.CELL_SIZE, gh = this.ROWS * this.CELL_SIZE;
      bg.roundRect(gx - 18, gy - 12, gw + 36, gh + 30, 18).fill({ color: 0x18181b, alpha: 0.85 });
      bg.roundRect(gx - 14, gy - 14, gw + 28, gh + 28, 16).fill({ color: 0xef4444 });
      bg.roundRect(gx - 11, gy - 11, gw + 22, gh + 22, 14).fill({ color: 0x7f1d1d });
      bg.roundRect(gx - 4, gy - 4, gw + 8, gh + 8, 10).fill({ color: 0x1c1917 });

    } else if (mapId === 5) {
      // ==================== BẢN ĐỒ 5: TÀN TÍCH NEON CYBERPUNK (CYBER RUINS) ====================
      bg.rect(0, 0, 720, this.WALL_Y).fill({ color: 0x030712 });
      const stripeH = 54;
      for (let y = 0; y < this.WALL_Y; y += stripeH * 2) {
        bg.rect(0, y, 720, stripeH).fill({ color: 0x0f172a });
      }

      for (const lx of lanes) {
        bg.roundRect(lx - 42, 0, 84, this.WALL_Y, 12).fill({ color: 0x083344 });
        bg.rect(lx - 36, 0, 72, this.WALL_Y).fill({ color: 0x06b6d4 });
        bg.rect(lx - 22, 0, 44, this.WALL_Y).fill({ color: 0x38bdf8 });

        for (let py = 24; py < this.WALL_Y - 20; py += 44) {
          bg.roundRect(lx - 8, py, 16, 12, 4).fill({ color: 0xec4899 });
          bg.roundRect(lx - 6, py + 2, 12, 8, 3).fill({ color: 0x67e8f9 });
        }
      }

      // Hạt photon & vi mạch phát sáng
      for (let i = 0; i < 45; i++) {
        const gx = ((i * 137 + 29) % 640) + 40;
        const gy = ((i * 89 + 73) % (this.WALL_Y - 120)) + 76;
        if (lanes.some((lx) => Math.abs(gx - lx) < 48)) continue;
        bg.rect(gx - 4, gy - 4, 8, 8).fill({ color: i % 2 === 0 ? 0x06b6d4 : 0xd946ef });
        bg.circle(gx, gy, 2).fill({ color: 0xffffff });
      }

      // Sân gạch carbon công nghệ cao
      const courtyardY = this.WALL_Y;
      const courtyardH = 1280 - courtyardY;
      bg.rect(0, courtyardY, 720, courtyardH).fill({ color: 0x020617 });

      const brickW = 72, brickH = 36;
      const cyberPalette = [0x0f172a, 0x1e1b4b, 0x1e293b, 0x0f766e];
      for (let row = 0, by = courtyardY; by < 1280; row++, by += brickH) {
        const xOffset = (row % 2 === 1) ? -brickW / 2 : 0;
        for (let col = 0, bx = xOffset; bx < 720; col++, bx += brickW) {
          const colorIdx = (row * 7 + col * 13) % cyberPalette.length;
          bg.roundRect(bx + 2, by + 2, brickW - 4, brickH - 4, 4).fill({ color: cyberPalette[colorIdx] });
          bg.roundRect(bx + 3, by + 3, brickW - 6, 3, 1).fill({ color: 0x06b6d4, alpha: 0.4 });
        }
      }

      // Trụ năng lượng Plasma Neon
      for (const ty of [680, 910]) {
        for (const tx of [56, 664]) {
          bg.roundRect(tx - 24, ty - 24, 48, 48, 10).fill({ color: 0x030712 });
          bg.circle(tx, ty, 38).fill({ color: 0x06b6d4, alpha: 0.3 });
          bg.circle(tx, ty, 20).fill({ color: 0xd946ef, alpha: 0.45 });
          bg.circle(tx, ty, 7).fill({ color: 0x67e8f9 });
        }
      }

      const gx = this.GRID_X, gy = this.GRID_Y, gw = this.COLS * this.CELL_SIZE, gh = this.ROWS * this.CELL_SIZE;
      bg.roundRect(gx - 18, gy - 12, gw + 36, gh + 30, 18).fill({ color: 0x020617, alpha: 0.9 });
      bg.roundRect(gx - 14, gy - 14, gw + 28, gh + 28, 16).fill({ color: 0x06b6d4 });
      bg.roundRect(gx - 11, gy - 11, gw + 22, gh + 22, 14).fill({ color: 0x0f172a });
      bg.roundRect(gx - 4, gy - 4, gw + 8, gh + 8, 10).fill({ color: 0x1e1b4b });

    } else if (mapId === 6) {
      // ==================== BẢN ĐỒ 6: NGHĨA ĐỊA U LINH (SHADOW CRYPT) ====================
      bg.rect(0, 0, 720, this.WALL_Y).fill({ color: 0x0f051d });
      const stripeH = 54;
      for (let y = 0; y < this.WALL_Y; y += stripeH * 2) {
        bg.rect(0, y, 720, stripeH).fill({ color: 0x1e1035 });
      }

      for (const lx of lanes) {
        bg.roundRect(lx - 42, 0, 84, this.WALL_Y, 12).fill({ color: 0x2e1065 });
        bg.rect(lx - 36, 0, 72, this.WALL_Y).fill({ color: 0x581c87 });
        bg.rect(lx - 22, 0, 44, this.WALL_Y).fill({ color: 0x3b0764 });

        for (let py = 24; py < this.WALL_Y - 20; py += 44) {
          bg.circle(lx, py + 8, 5).fill({ color: 0x4ade80 });
          bg.circle(lx, py + 8, 2.5).fill({ color: 0xffffff });
        }
      }

      // Đom đóm ma trơi & bia mộ rải rác
      for (let i = 0; i < 40; i++) {
        const gx = ((i * 137 + 29) % 640) + 40;
        const gy = ((i * 89 + 73) % (this.WALL_Y - 120)) + 76;
        if (lanes.some((lx) => Math.abs(gx - lx) < 48)) continue;
        bg.ellipse(gx, gy, 8, 14).fill({ color: 0x334155 }); // Bia mộ
        bg.circle(gx + 10, gy - 8, 3).fill({ color: 0x4ade80, alpha: 0.8 }); // Ma trơi
      }

      const courtyardY = this.WALL_Y;
      const courtyardH = 1280 - courtyardY;
      bg.rect(0, courtyardY, 720, courtyardH).fill({ color: 0x0f0a1c });

      const brickW = 72, brickH = 36;
      const shadowPalette = [0x1e1035, 0x2e1065, 0x1e1b4b, 0x3b0764];
      for (let row = 0, by = courtyardY; by < 1280; row++, by += brickH) {
        const xOffset = (row % 2 === 1) ? -brickW / 2 : 0;
        for (let col = 0, bx = xOffset; bx < 720; col++, bx += brickW) {
          const colorIdx = (row * 7 + col * 13) % shadowPalette.length;
          bg.roundRect(bx + 2, by + 2, brickW - 4, brickH - 4, 5).fill({ color: shadowPalette[colorIdx] });
          bg.roundRect(bx + 3, by + 3, brickW - 6, 4, 2).fill({ color: 0xa855f7, alpha: 0.3 });
        }
      }

      // Đuốc ma trơi xanh lá
      for (const ty of [680, 910]) {
        for (const tx of [56, 664]) {
          bg.roundRect(tx - 24, ty - 24, 48, 48, 10).fill({ color: 0x0f051d });
          bg.circle(tx, ty, 38).fill({ color: 0x16a34a, alpha: 0.25 });
          bg.circle(tx, ty, 20).fill({ color: 0x4ade80, alpha: 0.4 });
          bg.circle(tx, ty, 6).fill({ color: 0xdcfce7 });
        }
      }

      const gx = this.GRID_X, gy = this.GRID_Y, gw = this.COLS * this.CELL_SIZE, gh = this.ROWS * this.CELL_SIZE;
      bg.roundRect(gx - 18, gy - 12, gw + 36, gh + 30, 18).fill({ color: 0x0a0514, alpha: 0.9 });
      bg.roundRect(gx - 14, gy - 14, gw + 28, gh + 28, 16).fill({ color: 0xa855f7 });
      bg.roundRect(gx - 11, gy - 11, gw + 22, gh + 22, 14).fill({ color: 0x3b0764 });
      bg.roundRect(gx - 4, gy - 4, gw + 8, gh + 8, 10).fill({ color: 0x0f051d });

    } else if (mapId === 7) {
      // ==================== BẢN ĐỒ 7: THÁNH ĐỊA THIÊN GIỚI (CELESTIAL SANCTUARY) ====================
      bg.rect(0, 0, 720, this.WALL_Y).fill({ color: 0x38bdf8 });
      const stripeH = 54;
      for (let y = 0; y < this.WALL_Y; y += stripeH * 2) {
        bg.rect(0, y, 720, stripeH).fill({ color: 0x7dd3fc });
      }

      for (const lx of lanes) {
        bg.roundRect(lx - 42, 0, 84, this.WALL_Y, 12).fill({ color: 0xfef08a });
        bg.rect(lx - 36, 0, 72, this.WALL_Y).fill({ color: 0xfacc15 });
        bg.rect(lx - 22, 0, 44, this.WALL_Y).fill({ color: 0xffffff });

        for (let py = 24; py < this.WALL_Y - 20; py += 44) {
          bg.circle(lx, py + 8, 6).fill({ color: 0xf59e0b });
          bg.circle(lx, py + 8, 3).fill({ color: 0xffffff });
        }
      }

      // Mây trắng bồng bềnh & ánh hào quang
      for (let i = 0; i < 40; i++) {
        const gx = ((i * 137 + 29) % 640) + 40;
        const gy = ((i * 89 + 73) % (this.WALL_Y - 120)) + 76;
        if (lanes.some((lx) => Math.abs(gx - lx) < 48)) continue;
        bg.ellipse(gx, gy, 18, 9).fill({ color: 0xffffff, alpha: 0.85 });
      }

      const courtyardY = this.WALL_Y;
      const courtyardH = 1280 - courtyardY;
      bg.rect(0, courtyardY, 720, courtyardH).fill({ color: 0x0284c7 });

      const brickW = 72, brickH = 36;
      const celestialPalette = [0xf8fafc, 0xf1f5f9, 0xe2e8f0, 0xfef9c3];
      for (let row = 0, by = courtyardY; by < 1280; row++, by += brickH) {
        const xOffset = (row % 2 === 1) ? -brickW / 2 : 0;
        for (let col = 0, bx = xOffset; bx < 720; col++, bx += brickW) {
          const colorIdx = (row * 7 + col * 13) % celestialPalette.length;
          bg.roundRect(bx + 2, by + 2, brickW - 4, brickH - 4, 5).fill({ color: celestialPalette[colorIdx] });
          bg.roundRect(bx + 3, by + 3, brickW - 6, 4, 2).fill({ color: 0xfacc15, alpha: 0.45 });
        }
      }

      // Đuốc thánh thiên giới
      for (const ty of [680, 910]) {
        for (const tx of [56, 664]) {
          bg.roundRect(tx - 24, ty - 24, 48, 48, 10).fill({ color: 0x0284c7 });
          bg.circle(tx, ty, 38).fill({ color: 0xfacc15, alpha: 0.3 });
          bg.circle(tx, ty, 20).fill({ color: 0x38bdf8, alpha: 0.45 });
          bg.circle(tx, ty, 7).fill({ color: 0xffffff });
        }
      }

      const gx = this.GRID_X, gy = this.GRID_Y, gw = this.COLS * this.CELL_SIZE, gh = this.ROWS * this.CELL_SIZE;
      bg.roundRect(gx - 18, gy - 12, gw + 36, gh + 30, 18).fill({ color: 0x0f172a, alpha: 0.8 });
      bg.roundRect(gx - 14, gy - 14, gw + 28, gh + 28, 16).fill({ color: 0xfacc15 });
      bg.roundRect(gx - 11, gy - 11, gw + 22, gh + 22, 14).fill({ color: 0x0284c7 });
      bg.roundRect(gx - 4, gy - 4, gw + 8, gh + 8, 10).fill({ color: 0xf8fafc });

    } else {
      // ==================== BẢN ĐỒ 1: ĐỒNG CỎ RỪNG BÁCH THẢO (DEFAULT) ====================
      bg.rect(0, 0, 720, this.WALL_Y).fill({ color: 0x4ade80 });

      const stripeH = 54;
      for (let y = 0; y < this.WALL_Y; y += stripeH * 2) {
        bg.rect(0, y, 720, stripeH).fill({ color: 0x38c96b });
      }

      for (const lx of lanes) {
        bg.roundRect(lx - 42, 0, 84, this.WALL_Y, 12).fill({ color: 0x22c55e });
        bg.rect(lx - 36, 0, 72, this.WALL_Y).fill({ color: 0xd6b886 });
        bg.rect(lx - 22, 0, 44, this.WALL_Y).fill({ color: 0xc8a673 });

        for (let py = 24; py < this.WALL_Y - 20; py += 44) {
          const offset = ((py / 44) % 2 === 0) ? -12 : 10;
          bg.roundRect(lx + offset - 11, py, 22, 14, 6).fill({ color: 0xb08d57 });
          bg.roundRect(lx + offset - 10, py + 1, 19, 10, 5).fill({ color: 0xe5cca0 });
          bg.roundRect(lx - offset - 7, py + 18, 15, 10, 4).fill({ color: 0xb8945f });
        }
      }

      for (let i = 0; i < 68; i++) {
        const gx = ((i * 137 + 29) % 640) + 40;
        const gy = ((i * 89 + 73) % (this.WALL_Y - 120)) + 76;
        if (lanes.some((lx) => Math.abs(gx - lx) < 48)) continue;

        bg.moveTo(gx, gy)
          .lineTo(gx - 5, gy - 9)
          .moveTo(gx, gy)
          .lineTo(gx, gy - 11)
          .moveTo(gx, gy)
          .lineTo(gx + 5, gy - 9)
          .stroke({ color: 0x15803d, width: 2.5 });

        if (i % 3 === 0) {
          const petalColor = i % 6 === 0 ? 0xffffff : (i % 9 === 0 ? 0xfbcfe8 : 0xfef08a);
          const fx = gx + 10;
          const fy = gy - 4;
          bg.circle(fx - 3, fy, 3).fill({ color: petalColor });
          bg.circle(fx + 3, fy, 3).fill({ color: petalColor });
          bg.circle(fx, fy - 3, 3).fill({ color: petalColor });
          bg.circle(fx, fy + 3, 3).fill({ color: petalColor });
          bg.circle(fx, fy, 2.5).fill({ color: 0xf59e0b });
        }
      }

      for (let x = -10; x <= 730; x += 46) {
        const r = (x % 92 === 0) ? 30 : 25;
        bg.circle(x, 18, r + 4).fill({ color: 0x14532d });
        bg.circle(x, 14, r).fill({ color: 0x15803d });
        bg.circle(x - 4, 10, r * 0.72).fill({ color: 0x22c55e });
        bg.circle(x - 6, 7, r * 0.4).fill({ color: 0x86efac });
      }
      for (let y = 68; y < this.WALL_Y - 30; y += 64) {
        bg.circle(10, y + 4, 22).fill({ color: 0x14532d });
        bg.circle(10, y, 20).fill({ color: 0x16a34a });
        bg.circle(14, y - 4, 12).fill({ color: 0x4ade80 });

        bg.circle(710, y + 4, 22).fill({ color: 0x14532d });
        bg.circle(710, y, 20).fill({ color: 0x16a34a });
        bg.circle(706, y - 4, 12).fill({ color: 0x4ade80 });
      }

      const courtyardY = this.WALL_Y;
      const courtyardH = 1280 - courtyardY;
      bg.rect(0, courtyardY, 720, courtyardH).fill({ color: 0x1e293b });

      const brickW = 72;
      const brickH = 36;
      const brickPalette = [0x334155, 0x3b495e, 0x475569, 0x2d3a4d];
      for (let row = 0, by = courtyardY; by < 1280; row++, by += brickH) {
        const xOffset = (row % 2 === 1) ? -brickW / 2 : 0;
        for (let col = 0, bx = xOffset; bx < 720; col++, bx += brickW) {
          const colorIdx = (row * 7 + col * 13) % brickPalette.length;
          bg.roundRect(bx + 2, by + 2, brickW - 4, brickH - 4, 5).fill({ color: brickPalette[colorIdx] });
          bg.roundRect(bx + 3, by + 3, brickW - 6, 4, 2).fill({ color: 0x64748b, alpha: 0.45 });
        }
      }

      const torchYList = [680, 910];
      for (const ty of torchYList) {
        for (const tx of [56, 664]) {
          bg.roundRect(tx - 24, ty - 24, 48, 48, 10).fill({ color: 0x1e293b });
          bg.roundRect(tx - 20, ty - 20, 40, 40, 8).fill({ color: 0x64748b });
          bg.circle(tx, ty, 42).fill({ color: 0xf97316, alpha: 0.16 });
          bg.circle(tx, ty, 24).fill({ color: 0xfbbf24, alpha: 0.28 });
          bg.circle(tx, ty, 12).fill({ color: 0x1e293b });
          bg.circle(tx, ty, 9).fill({ color: 0xea580c });
          bg.circle(tx, ty - 1, 5.5).fill({ color: 0xfde047 });
        }
      }

      const gx = this.GRID_X;
      const gy = this.GRID_Y;
      const gw = this.COLS * this.CELL_SIZE;
      const gh = this.ROWS * this.CELL_SIZE;

      bg.roundRect(gx - 18, gy - 12, gw + 36, gh + 30, 18).fill({ color: 0x0f172a, alpha: 0.75 });
      bg.roundRect(gx - 14, gy - 14, gw + 28, gh + 28, 16).fill({ color: 0x94a3b8 });
      bg.roundRect(gx - 11, gy - 11, gw + 22, gh + 22, 14).fill({ color: 0x475569 });
      bg.roundRect(gx - 4, gy - 4, gw + 8, gh + 8, 10).fill({ color: 0x1e293b });

      const corners = [
        [gx - 12, gy - 12],
        [gx + gw - 16, gy - 12],
        [gx - 12, gy + gh - 16],
        [gx + gw - 16, gy + gh - 16],
      ];
      for (const [cx, cy] of corners) {
        bg.roundRect(cx, cy, 28, 28, 6).fill({ color: 0xb45309 });
        bg.roundRect(cx + 2, cy + 2, 24, 24, 5).fill({ color: 0xfacc15 });
        bg.circle(cx + 14, cy + 14, 4).fill({ color: 0x78350f });
      }
    }

    this.bgContainer.addChild(bg);
  }

  private initWall(mapId: number = 1) {
    this.wallContainer.removeChildren();
    const wall = new Graphics();
    const wy = this.WALL_Y; // 540

    if (mapId === 2) {
      // ==================== TƯỜNG THÀNH BĂNG TUYẾT (FROST CITADEL) ====================
      wall.rect(0, wy - 52, 720, 16).fill({ color: 0x0c4a6e, alpha: 0.5 }); // Bóng tường trên nền tuyết

      wall.rect(0, wy - 44, 720, 52).fill({ color: 0x0f172a });
      wall.rect(0, wy - 41, 720, 46).fill({ color: 0x334155 });
      wall.rect(0, wy - 41, 720, 8).fill({ color: 0xbae6fd }); // Viền băng lạnh
      wall.rect(0, wy - 6, 720, 11).fill({ color: 0x1e293b });

      for (let x = 0; x < 720; x += 60) {
        wall.rect(x + 2, wy - 31, 56, 12).fill({ color: 0x475569 });
        wall.rect(x + 22, wy - 17, 56, 10).fill({ color: 0x1e3a5f });
      }

      // Răng cưa phủ tuyết trắng xóa & nhũ băng rủ xuống
      for (let x = 112; x < 600; x += 48) {
        wall.roundRect(x - 2, wy - 60, 34, 24, 5).fill({ color: 0x0f172a });
        wall.roundRect(x, wy - 58, 30, 20, 4).fill({ color: 0x64748b });
        wall.roundRect(x - 1, wy - 62, 32, 9, 4).fill({ color: 0xffffff }); // Chỏm tuyết
        wall.roundRect(x + 12, wy - 47, 6, 10, 2).fill({ color: 0x0284c7 });
        wall.moveTo(x + 4, wy - 36).lineTo(x + 9, wy - 36).lineTo(x + 6.5, wy - 26).fill({ color: 0xe0f2fe });
        wall.moveTo(x + 18, wy - 36).lineTo(x + 23, wy - 36).lineTo(x + 20.5, wy - 29).fill({ color: 0xbae6fd });
      }

      // Cổng vòm kim loại băng giá
      wall.roundRect(314, wy - 42, 92, 46, 14).fill({ color: 0x0f172a });
      wall.roundRect(318, wy - 38, 84, 40, 12).fill({ color: 0x1e3a5f });
      wall.roundRect(324, wy - 32, 72, 34, 10).fill({ color: 0x0c4a6e });
      for (let gx = 336; gx <= 384; gx += 12) {
        wall.rect(gx, wy - 30, 3, 32).fill({ color: 0x38bdf8 });
      }
      wall.roundRect(344, wy - 48, 32, 14, 4).fill({ color: 0x0284c7 });
      wall.roundRect(346, wy - 46, 28, 10, 3).fill({ color: 0x7dd3fc });

      // 2 Tháp canh phủ tuyết dày
      for (const tx of [8, 604]) {
        wall.roundRect(tx - 3, wy - 74, 114, 84, 12).fill({ color: 0x0f172a });
        wall.roundRect(tx, wy - 71, 108, 78, 10).fill({ color: 0x334155 });
        wall.roundRect(tx + 4, wy - 67, 100, 12, 4).fill({ color: 0x64748b });

        for (let mx = tx + 2; mx < tx + 100; mx += 36) {
          wall.roundRect(mx - 2, wy - 86, 30, 20, 4).fill({ color: 0x0f172a });
          wall.roundRect(mx, wy - 84, 26, 16, 3).fill({ color: 0x64748b });
          wall.roundRect(mx - 1, wy - 89, 28, 9, 4).fill({ color: 0xffffff });
          wall.moveTo(mx + 8, wy - 68).lineTo(mx + 14, wy - 68).lineTo(mx + 11, wy - 58).fill({ color: 0xe0f2fe });
        }

        const sx = tx + 54;
        const sy = wy - 32;
        wall.circle(sx, sy, 20).fill({ color: 0x0f172a });
        wall.circle(sx, sy, 17).fill({ color: 0x38bdf8 });
        wall.circle(sx, sy, 13).fill({ color: 0x0284c7 });
        wall.rect(sx - 2.5, sy - 11, 5, 22).fill({ color: 0xffffff });
        wall.rect(sx - 11, sy - 2.5, 22, 5).fill({ color: 0xffffff });
      }

    } else if (mapId === 3) {
      // ==================== TƯỜNG THÀNH SA THẠCH SA MẠC (DESERT CITADEL) ====================
      wall.rect(0, wy - 52, 720, 16).fill({ color: 0x451a03, alpha: 0.5 }); // Bóng tường sa mạc

      wall.rect(0, wy - 44, 720, 52).fill({ color: 0x291809 });
      wall.rect(0, wy - 41, 720, 46).fill({ color: 0x9a3412 });
      wall.rect(0, wy - 41, 720, 8).fill({ color: 0xf59e0b });
      wall.rect(0, wy - 6, 720, 11).fill({ color: 0x451a03 });

      for (let x = 0; x < 720; x += 60) {
        wall.rect(x + 2, wy - 31, 56, 12).fill({ color: 0xb45309 });
        wall.rect(x + 22, wy - 17, 56, 10).fill({ color: 0x78350f });
      }

      for (let x = 112; x < 600; x += 48) {
        wall.roundRect(x - 2, wy - 60, 34, 24, 5).fill({ color: 0x291809 });
        wall.roundRect(x, wy - 58, 30, 20, 4).fill({ color: 0xb45309 });
        wall.roundRect(x + 2, wy - 56, 26, 6, 2).fill({ color: 0xfde047 });
        wall.roundRect(x + 12, wy - 47, 6, 10, 2).fill({ color: 0x1c0c03 });
      }

      wall.roundRect(314, wy - 42, 92, 46, 14).fill({ color: 0x291809 });
      wall.roundRect(318, wy - 38, 84, 40, 12).fill({ color: 0x78350f });
      wall.roundRect(324, wy - 32, 72, 34, 10).fill({ color: 0x451a03 });
      for (let gx = 336; gx <= 384; gx += 12) {
        wall.rect(gx, wy - 30, 3, 32).fill({ color: 0xd97706 });
      }
      wall.roundRect(344, wy - 48, 32, 14, 4).fill({ color: 0x9a3412 });
      wall.roundRect(346, wy - 46, 28, 10, 3).fill({ color: 0xfacc15 });

      for (const tx of [8, 604]) {
        wall.roundRect(tx - 3, wy - 74, 114, 84, 12).fill({ color: 0x291809 });
        wall.roundRect(tx, wy - 71, 108, 78, 10).fill({ color: 0x9a3412 });
        wall.roundRect(tx + 4, wy - 67, 100, 12, 4).fill({ color: 0xd97706 });

        for (let mx = tx + 2; mx < tx + 100; mx += 36) {
          wall.roundRect(mx - 2, wy - 86, 30, 20, 4).fill({ color: 0x291809 });
          wall.roundRect(mx, wy - 84, 26, 16, 3).fill({ color: 0xb45309 });
          wall.roundRect(mx + 2, wy - 82, 22, 5, 2).fill({ color: 0xfde047 });
        }

        const sx = tx + 54;
        const sy = wy - 32;
        wall.circle(sx, sy, 20).fill({ color: 0x291809 });
        wall.circle(sx, sy, 17).fill({ color: 0xf59e0b });
        wall.circle(sx, sy, 13).fill({ color: 0x78350f });
        wall.circle(sx, sy, 8).fill({ color: 0xfacc15 });
        wall.rect(sx - 2, sy - 12, 4, 24).fill({ color: 0xfef08a });
        wall.rect(sx - 12, sy - 2, 24, 4).fill({ color: 0xfef08a });
      }

    } else if (mapId === 4) {
      // ==================== TƯỜNG THÀNH BAZAN DUNG NHAM (MAGMA CITADEL) ====================
      wall.rect(0, wy - 52, 720, 16).fill({ color: 0x450a0a, alpha: 0.5 });
      wall.rect(0, wy - 44, 720, 52).fill({ color: 0x18181b });
      wall.rect(0, wy - 41, 720, 46).fill({ color: 0x27272a });
      wall.rect(0, wy - 41, 720, 8).fill({ color: 0xef4444 });
      wall.rect(0, wy - 6, 720, 11).fill({ color: 0x7f1d1d });

      for (let x = 112; x < 600; x += 48) {
        wall.roundRect(x - 2, wy - 60, 34, 24, 5).fill({ color: 0x18181b });
        wall.roundRect(x, wy - 58, 30, 20, 4).fill({ color: 0x3f3f46 });
        wall.roundRect(x + 2, wy - 56, 26, 6, 2).fill({ color: 0xf97316 });
      }

      for (const tx of [8, 604]) {
        wall.roundRect(tx - 3, wy - 74, 114, 84, 12).fill({ color: 0x18181b });
        wall.roundRect(tx, wy - 71, 108, 78, 10).fill({ color: 0x27272a });
        wall.roundRect(tx + 4, wy - 67, 100, 12, 4).fill({ color: 0xef4444 });
      }

    } else if (mapId === 5) {
      // ==================== TƯỜNG PHÒNG THỦ NEON CYBERPUNK (CYBER RUINS) ====================
      wall.rect(0, wy - 52, 720, 16).fill({ color: 0x083344, alpha: 0.6 });
      wall.rect(0, wy - 44, 720, 52).fill({ color: 0x020617 });
      wall.rect(0, wy - 41, 720, 46).fill({ color: 0x0f172a });
      wall.rect(0, wy - 41, 720, 8).fill({ color: 0x06b6d4 });
      wall.rect(0, wy - 6, 720, 11).fill({ color: 0xec4899 });

      for (let x = 112; x < 600; x += 48) {
        wall.roundRect(x - 2, wy - 60, 34, 24, 5).fill({ color: 0x020617 });
        wall.roundRect(x, wy - 58, 30, 20, 4).fill({ color: 0x1e293b });
        wall.roundRect(x + 2, wy - 56, 26, 6, 2).fill({ color: 0x38bdf8 });
      }

      for (const tx of [8, 604]) {
        wall.roundRect(tx - 3, wy - 74, 114, 84, 12).fill({ color: 0x020617 });
        wall.roundRect(tx, wy - 71, 108, 78, 10).fill({ color: 0x0f172a });
        wall.roundRect(tx + 4, wy - 67, 100, 12, 4).fill({ color: 0x06b6d4 });
      }

    } else if (mapId === 6) {
      // ==================== TƯỜNG THÀNH GOTHIC U LINH (SHADOW CRYPT) ====================
      wall.rect(0, wy - 52, 720, 16).fill({ color: 0x1e1035, alpha: 0.6 });
      wall.rect(0, wy - 44, 720, 52).fill({ color: 0x0f051d });
      wall.rect(0, wy - 41, 720, 46).fill({ color: 0x1e1035 });
      wall.rect(0, wy - 41, 720, 8).fill({ color: 0xa855f7 });
      wall.rect(0, wy - 6, 720, 11).fill({ color: 0x4ade80 });

      for (let x = 112; x < 600; x += 48) {
        wall.roundRect(x - 2, wy - 60, 34, 24, 5).fill({ color: 0x0a0514 });
        wall.roundRect(x, wy - 58, 30, 20, 4).fill({ color: 0x2e1065 });
        wall.roundRect(x + 2, wy - 56, 26, 6, 2).fill({ color: 0x4ade80 });
      }

      for (const tx of [8, 604]) {
        wall.roundRect(tx - 3, wy - 74, 114, 84, 12).fill({ color: 0x0a0514 });
        wall.roundRect(tx, wy - 71, 108, 78, 10).fill({ color: 0x1e1035 });
        wall.roundRect(tx + 4, wy - 67, 100, 12, 4).fill({ color: 0x7c3aed });
      }

    } else if (mapId === 7) {
      // ==================== TƯỜNG THÀNH THIÊN GIỚI (CELESTIAL SANCTUARY) ====================
      wall.rect(0, wy - 52, 720, 16).fill({ color: 0x0284c7, alpha: 0.5 });
      wall.rect(0, wy - 44, 720, 52).fill({ color: 0x0f172a });
      wall.rect(0, wy - 41, 720, 46).fill({ color: 0xf8fafc });
      wall.rect(0, wy - 41, 720, 8).fill({ color: 0xfacc15 });
      wall.rect(0, wy - 6, 720, 11).fill({ color: 0x38bdf8 });

      for (let x = 112; x < 600; x += 48) {
        wall.roundRect(x - 2, wy - 60, 34, 24, 5).fill({ color: 0x0f172a });
        wall.roundRect(x, wy - 58, 30, 20, 4).fill({ color: 0xf1f5f9 });
        wall.roundRect(x + 2, wy - 56, 26, 6, 2).fill({ color: 0xfacc15 });
      }

      for (const tx of [8, 604]) {
        wall.roundRect(tx - 3, wy - 74, 114, 84, 12).fill({ color: 0x0f172a });
        wall.roundRect(tx, wy - 71, 108, 78, 10).fill({ color: 0xf8fafc });
        wall.roundRect(tx + 4, wy - 67, 100, 12, 4).fill({ color: 0xfacc15 });
      }

    } else {
      // ==================== TƯỜNG THÀNH ĐÁ KHỐI TRUYỀN THỐNG (DEFAULT - FOREST) ====================
      wall.rect(0, wy - 52, 720, 16).fill({ color: 0x14532d, alpha: 0.5 });

      wall.rect(0, wy - 44, 720, 52).fill({ color: 0x1e293b });
      wall.rect(0, wy - 41, 720, 46).fill({ color: 0x64748b });
      wall.rect(0, wy - 41, 720, 8).fill({ color: 0x94a3b8 });
      wall.rect(0, wy - 6, 720, 11).fill({ color: 0x334155 });

      for (let x = 0; x < 720; x += 60) {
        wall.rect(x + 2, wy - 31, 56, 12).fill({ color: 0x78879e });
        wall.rect(x + 22, wy - 17, 56, 10).fill({ color: 0x526077 });
      }

      for (let x = 112; x < 600; x += 48) {
        wall.roundRect(x - 2, wy - 60, 34, 24, 5).fill({ color: 0x1e293b });
        wall.roundRect(x, wy - 58, 30, 20, 4).fill({ color: 0x94a3b8 });
        wall.roundRect(x + 2, wy - 56, 26, 6, 2).fill({ color: 0xe2e8f0 });
        wall.roundRect(x + 12, wy - 47, 6, 10, 2).fill({ color: 0x0f172a });
      }

      wall.roundRect(314, wy - 42, 92, 46, 14).fill({ color: 0x1e293b });
      wall.roundRect(318, wy - 38, 84, 40, 12).fill({ color: 0x475569 });
      wall.roundRect(324, wy - 32, 72, 34, 10).fill({ color: 0x78350f });
      for (let gx = 336; gx <= 384; gx += 12) {
        wall.rect(gx, wy - 30, 3, 32).fill({ color: 0x1e293b });
      }
      wall.roundRect(344, wy - 48, 32, 14, 4).fill({ color: 0xb45309 });
      wall.roundRect(346, wy - 46, 28, 10, 3).fill({ color: 0xfacc15 });

      for (const tx of [8, 604]) {
        wall.roundRect(tx - 3, wy - 74, 114, 84, 12).fill({ color: 0x1e293b });
        wall.roundRect(tx, wy - 71, 108, 78, 10).fill({ color: 0x64748b });
        wall.roundRect(tx + 4, wy - 67, 100, 12, 4).fill({ color: 0x94a3b8 });

        for (let mx = tx + 2; mx < tx + 100; mx += 36) {
          wall.roundRect(mx - 2, wy - 86, 30, 20, 4).fill({ color: 0x1e293b });
          wall.roundRect(mx, wy - 84, 26, 16, 3).fill({ color: 0xcbd5e1 });
          wall.roundRect(mx + 2, wy - 82, 22, 5, 2).fill({ color: 0xffffff });
        }

        const sx = tx + 54;
        const sy = wy - 32;
        wall.circle(sx, sy, 20).fill({ color: 0x1e293b });
        wall.circle(sx, sy, 17).fill({ color: 0xfacc15 });
        wall.circle(sx, sy, 13).fill({ color: 0x2563eb });
        wall.rect(sx - 2.5, sy - 11, 5, 22).fill({ color: 0xfde047 });
        wall.rect(sx - 11, sy - 2.5, 22, 5).fill({ color: 0xfde047 });
      }
    }

    this.wallContainer.addChild(wall);
  }

  // Khởi tạo Lưới 5x5 cố định (96x96 per cell)
  private initGrid() {
    this.gridBgLayer = new Container();
    this.gridItemsLayer = new Container();
    this.gridItemsLayer.sortableChildren = true; // Cò nẫy vươn dài (zIndex 10) luôn vẽ trên bánh răng và súng
    this.gridHighlightLayer = new Container(); // Layer viền nổi trên cùng, không bị che khuất bởi súng hay bánh răng
    this.gridContainer.addChild(this.gridBgLayer);
    this.gridContainer.addChild(this.gridItemsLayer);
    this.gridContainer.addChild(this.gridHighlightLayer);

    for (let r = 0; r < this.ROWS; r++) {
      this.grid[r] = [];
      this.slotViews[r] = [];

      for (let c = 0; c < this.COLS; c++) {
        this.grid[r][c] = {
          col: c,
          row: r,
          unlocked: true,
          item: null,
        };

        const cellX = this.GRID_X + c * this.CELL_SIZE;
        const cellY = this.GRID_Y + r * this.CELL_SIZE;

        const slotCont = new Container();
        slotCont.x = cellX;
        slotCont.y = cellY;
        slotCont.eventMode = 'static';
        slotCont.cursor = 'pointer';
        slotCont.hitArea = new Rectangle(0, 0, this.CELL_SIZE, this.CELL_SIZE);

        const cellSprite = new Sprite(PixelAssetManager.getCellTexture(true));
        slotCont.addChild(cellSprite);

        // Highlight viền hover vị trí thả
        const highlightG = new Graphics();
        highlightG.rect(4, 4, 88, 88);
        highlightG.stroke({ color: 0x38bdf8, width: 3 });
        highlightG.visible = false;
        slotCont.addChild(highlightG);

        // VIỀN VÀNG PHÁT SÁNG CHO NHỮNG Ô CÓ THỂ MERGE ĐƯỢC (Nổi trên cùng, viền sáng rực rỡ, không bị khuất)
        const mergeHighlightG = new Graphics();
        mergeHighlightG.x = cellX;
        mergeHighlightG.y = cellY;
        mergeHighlightG.eventMode = 'none';
        mergeHighlightG.visible = false;
        this.gridHighlightLayer.addChild(mergeHighlightG);

        // VÒNG HOLLOW VUÔNG THỂ HIỆN TIER CỦA SÚNG (1 Trắng, 2 Xanh, 3 Tím, 4 Vàng, 5 Đỏ)
        const tierFrameG = new Graphics();
        tierFrameG.visible = false;
        slotCont.addChild(tierFrameG);

        this.gridBgLayer.addChild(slotCont);

        const itemContainer = new Container();
        itemContainer.pivot.set(40, 40);
        itemContainer.position.set(cellX + 48, cellY + 48);
        itemContainer.visible = false;
        itemContainer.eventMode = 'none';

        // Bệ tháp bánh răng xoay quanh tâm (anchor 0.5)
        const baseSprite = new Sprite();
        baseSprite.anchor.set(0.5);
        baseSprite.x = 40;
        baseSprite.y = 40;
        itemContainer.addChild(baseSprite);

        // Nòng súng xoay 360 độ tự động ngắm quái (To hơn 20% nổi bật trên nền bánh răng)
        const barrelSprite = new Sprite();
        barrelSprite.anchor.set(0.5);
        barrelSprite.x = 40;
        barrelSprite.y = 40;
        barrelSprite.scale.set(1.2);
        itemContainer.addChild(barrelSprite);

        // Thanh Fill Bar
        const fillG = new Graphics();
        itemContainer.addChild(fillG);

        // Chữ Level to rõ ràng, viền đen dày dễ nhìn từ xa
        const lvlText = new Text({
          text: '',
          style: {
            fontFamily: this.FONT_FAMILY,
            fontSize: 22,
            fill: '#ffffff',
            fontWeight: '900',
            stroke: { color: 0x000000, width: 4.5 },
          }
        });
        lvlText.anchor.set(0.5);
        lvlText.x = 64;
        lvlText.y = 62;
        lvlText.eventMode = 'none';
        itemContainer.addChild(lvlText);

        this.gridItemsLayer.addChild(itemContainer);

        const obstacleSprite = new Sprite(PixelAssetManager.getObstacleRockTexture());
        obstacleSprite.anchor.set(0.5);
        obstacleSprite.x = 48;
        obstacleSprite.y = 48;
        obstacleSprite.visible = false;
        slotCont.addChild(obstacleSprite);

        slotCont.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation();
          const cell = this.grid[r][c];
          if (cell.isBlocked) {
            sound.playHit();
            this.addFloatingText(cellX + 48, cellY + 30, 'BLOCKED BY ROCK!', '#f87171');
            return;
          }
          if (cell.item) {
            this.onItemPointerDown(e, cell.item, c, r);
          } else {
            this.hideTooltip();
          }
        });

        this.slotViews[r][c] = {
          container: slotCont,
          cellSprite,
          highlightG,
          mergeHighlightG,
          tierFrameG,
          obstacleSprite,
          itemContainer,
          baseSprite,
          barrelSprite,
          fillG,
          lvlText,
          popScale: 1.0,
        };
      }
    }

    // 1 Cò Lv1 ở giữa (2, 2)
    this.grid[2][2].item = this.createTrigger(1);

    // 1 Súng ngẫu nhiên ở trên Cò (2, 1)
    const starterGuns: GunKind[] = ['PISTOL', 'CROSSBOW', 'CRYO', 'FLAMER', 'SHOTGUN'];
    const randomGun = starterGuns[Math.floor(Math.random() * starterGuns.length)];
    this.grid[1][2].item = this.createGun(randomGun, 1);

    this.syncAllGridSlots();
  }

  private initObjectPools() {
    for (let i = 0; i < 30; i++) {
      const cont = new Container();
      cont.visible = false;

      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      cont.addChild(sprite);

      const hpBg = new Graphics();
      cont.addChild(hpBg);

      const hpFill = new Graphics();
      cont.addChild(hpFill);

      this.enemyContainer.addChild(cont);
      this.enemyPool.push({ container: cont, sprite, hpBg, hpFill, active: false });
    }

    for (let i = 0; i < 60; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.bulletContainer.addChild(sprite);
      this.bulletPool.push({ sprite, active: false });
    }

    for (let i = 0; i < 30; i++) {
      const text = new Text({
        text: '',
        style: {
          fontFamily: this.FONT_FAMILY,
          fontSize: 18,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: 0x000000, width: 3 },
        }
      });
      text.anchor.set(0.5);
      text.visible = false;
      this.fxContainer.addChild(text);
      this.floatingTextPool.push({ text, active: false, lifetime: 0 });
    }
  }

  // Tooltip Popover (Hiện cạnh súng)
  private initTooltip() {
    this.tooltipContainer.visible = false;
    this.tooltipContainer.eventMode = 'static';
    this.tooltipContainer.on('pointerdown', (e) => e.stopPropagation());

    this.tooltipCard = new Graphics();
    this.tooltipContainer.addChild(this.tooltipCard);

    this.tooltipTitleText = new Text({
      text: '',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 17,
        fill: '#facc15',
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: 278,
        lineHeight: 22,
      }
    });
    this.tooltipTitleText.x = 16;
    this.tooltipTitleText.y = 14;
    this.tooltipContainer.addChild(this.tooltipTitleText);

    this.tooltipStatsText = new Text({
      text: '',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 15,
        fill: '#38bdf8',
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: 278,
        lineHeight: 22,
      }
    });
    this.tooltipStatsText.x = 16;
    this.tooltipStatsText.y = 44;
    this.tooltipContainer.addChild(this.tooltipStatsText);

    this.tooltipDescText = new Text({
      text: '',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 14,
        fill: '#e2e8f0',
        wordWrap: true,
        wordWrapWidth: 276,
        lineHeight: 20,
      }
    });
    this.tooltipDescText.x = 16;
    this.tooltipDescText.y = 96;
    this.tooltipContainer.addChild(this.tooltipDescText);

    this.tooltipHintText = new Text({
      text: t('hud_tap_outside'),
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 12,
        fill: '#94a3b8',
        fontStyle: 'italic',
      }
    });
    this.tooltipHintText.x = 16;
    this.tooltipHintText.y = 152;
    this.tooltipContainer.addChild(this.tooltipHintText);
  }

  // Khởi tạo Ô Thùng Rác (Trash Zone) phong cách Dieselpunk cảnh báo nguy hiểm
  private initTrashZone() {
    this.trashContainer = new Container();
    this.trashContainer.x = 20;
    this.trashContainer.y = 1080;
    this.trashContainer.visible = false; // Chỉ hiện khi đang kéo món đồ!
    this.trashContainer.eventMode = 'none';

    this.trashBg = new Sprite(PixelAssetManager.getHazardZoneTexture(230, 84));
    this.drawTrashBg(false);
    this.trashContainer.addChild(this.trashBg);

    const trashIcon = new Sprite(PixelAssetManager.getTrashIconTexture());
    trashIcon.x = 18;
    trashIcon.y = 10;
    this.trashContainer.addChild(trashIcon);

    this.trashText = new Text({
      text: t('hud_trash_ready'),
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 16,
        fill: '#fef08a',
        fontWeight: 'bold',
        align: 'left',
        lineHeight: 22,
        stroke: { color: 0x000000, width: 3 },
      }
    });
    this.trashText.x = 88;
    this.trashText.y = 20;
    this.trashContainer.addChild(this.trashText);

    this.uiContainer.addChild(this.trashContainer);
  }

  private drawTrashBg(isHover: boolean) {
    this.trashBg.alpha = isHover ? 1.0 : 0.85;
    this.trashBg.tint = isHover ? 0xffffff : 0xdddddd;
  }

  // UI & Buttons - Phong cách Steampunk Máy Móc Đinh Tán
  private initUI() {
    const textStyle = new TextStyle({
      fontFamily: this.FONT_FAMILY,
      fontSize: 20,
      fill: '#f8fafc',
      fontWeight: 'bold',
    });

    // 1. Top HUD - Tấm đồng Steampunk đinh tán
    const topBar = new Graphics();
    topBar.rect(0, 0, 720, 56);
    topBar.fill({ color: 0x181512, alpha: 0.98 });
    topBar.stroke({ color: 0xb45309, width: 2.5 });
    topBar.rect(0, 52, 720, 4);
    topBar.fill({ color: 0xd97706 });
    for (let x = 20; x < 720; x += 90) {
      topBar.circle(x, 28, 3.5);
      topBar.fill({ color: 0x451a03 });
      topBar.circle(x - 0.8, 27.2, 1.2);
      topBar.fill({ color: 0xfef08a });
    }
    this.uiContainer.addChild(topBar);

    this.waveText = new Text({ text: `⚙ ${t('hud_wave', 1, 10)} (${t('hud_prep')})`, style: { ...textStyle, fontSize: 17, fill: '#60a5fa' } });
    this.waveText.x = 20;
    this.waveText.y = 15;
    this.uiContainer.addChild(this.waveText);

    this.hpText = new Text({ text: '🛡 HP: 100/100', style: { ...textStyle, fontSize: 17, fill: '#4ade80' } });
    this.hpText.x = 330;
    this.hpText.y = 15;
    this.uiContainer.addChild(this.hpText);

    this.goldText = new Text({ text: '💰 $: 15', style: { ...textStyle, fontSize: 19, fill: '#facc15' } });
    this.goldText.x = 590;
    this.goldText.y = 15;
    this.uiContainer.addChild(this.goldText);

    // 2. Bottom Controls - Khung máy móc hơi nước công nghiệp
    const botBar = new Graphics();
    botBar.rect(0, 1060, 720, 220);
    botBar.fill({ color: 0x11131a });
    botBar.stroke({ color: 0x78350f, width: 3 });
    botBar.rect(0, 1060, 720, 4);
    botBar.fill({ color: 0xb45309 });
    this.uiContainer.addChild(botBar);

    // Nút ROLL Steampunk (w = 230, h = 84)
    this.rollBtnContainer = new Container();
    this.rollBtnContainer.x = 20;
    this.rollBtnContainer.y = 1080;
    this.rollBtnContainer.eventMode = 'static';
    this.rollBtnContainer.cursor = 'pointer';
    this.rollBtnContainer.hitArea = new Rectangle(0, 0, 230, 84);

    this.rollBtnBg = new Sprite(PixelAssetManager.getSteampunkButtonTexture(230, 84, 'BLUE'));
    this.rollBtnContainer.addChild(this.rollBtnBg);

    this.rollBtnText = new Text({
      text: t('hud_roll_btn'),
      style: { ...textStyle, fontSize: 17, fill: '#ffffff', align: 'center', stroke: { color: 0x000000, width: 3 } }
    });
    this.rollBtnText.anchor.set(0.5);
    this.rollBtnText.x = 115;
    this.rollBtnText.y = 42;
    this.rollBtnText.eventMode = 'none';
    this.rollBtnContainer.addChild(this.rollBtnText);

    this.rollBtnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hideTooltip();
      this.onRollClicked();
    });
    this.uiContainer.addChild(this.rollBtnContainer);
    this.updateRollButtonState();

    // Nút BẮT ĐẦU VÁN Steampunk (w = 430, h = 84)
    this.startWaveBtnContainer = new Container();
    this.startWaveBtnContainer.x = 270;
    this.startWaveBtnContainer.y = 1080;
    this.startWaveBtnContainer.eventMode = 'static';
    this.startWaveBtnContainer.cursor = 'pointer';
    this.startWaveBtnContainer.hitArea = new Rectangle(0, 0, 430, 84);

    this.startWaveBtnBg = new Sprite(PixelAssetManager.getSteampunkButtonTexture(430, 84, 'GREEN'));
    this.drawStartWaveBtn(true);
    this.startWaveBtnContainer.addChild(this.startWaveBtnBg);

    this.startWaveBtnText = new Text({
      text: t('hud_start_wave', 1),
      style: { ...textStyle, fontSize: 23, fill: '#ffffff', align: 'center', fontWeight: 'bold', stroke: { color: 0x000000, width: 4 } }
    });
    this.startWaveBtnText.anchor.set(0.5);
    this.startWaveBtnText.x = 215;
    this.startWaveBtnText.y = 42;
    this.startWaveBtnText.eventMode = 'none';
    this.startWaveBtnContainer.addChild(this.startWaveBtnText);

    this.startWaveBtnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hideTooltip();
      this.onStartWaveClicked();
    });
    this.uiContainer.addChild(this.startWaveBtnContainer);

    // Nút TUA NHANH x1 / x2 Steampunk (y = 1185)
    const speedBtn = new Container();
    speedBtn.x = 20;
    speedBtn.y = 1185;
    speedBtn.eventMode = 'static';
    speedBtn.cursor = 'pointer';
    speedBtn.hitArea = new Rectangle(0, 0, 160, 52);

    const speedBg = new Sprite(PixelAssetManager.getSteampunkButtonTexture(160, 52, 'GOLD'));
    speedBtn.addChild(speedBg);

    this.speedBtnText = new Text({
      text: t('hud_speed', this.gameSpeed),
      style: { ...textStyle, fontSize: 16, fill: '#fef08a', stroke: { color: 0x000000, width: 3 } }
    });
    this.speedBtnText.anchor.set(0.5);
    this.speedBtnText.x = 80;
    this.speedBtnText.y = 26;
    this.speedBtnText.eventMode = 'none';
    speedBtn.addChild(this.speedBtnText);

    speedBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hideTooltip();
      this.gameSpeed = this.gameSpeed === 1.0 ? 2.0 : 1.0;
      this.speedBtnText.text = t('hud_speed', this.gameSpeed);
      sound.playClick();
    });
    this.uiContainer.addChild(speedBtn);

    // Tip hướng dẫn
    this.tipText = new Text({
      text: t('hud_tip'),
      style: { ...textStyle, fontSize: 14, fill: '#facc15' }
    });
    this.tipText.x = 200;
    this.tipText.y = 1200;
    this.tipText.eventMode = 'none';
    this.uiContainer.addChild(this.tipText);
  }

  private drawStartWaveBtn(isActive: boolean) {
    this.startWaveBtnBg.texture = PixelAssetManager.getSteampunkButtonTexture(430, 84, isActive ? 'GREEN' : 'GOLD');
    this.startWaveBtnBg.alpha = isActive ? 1.0 : 0.65;
  }

  public onStartWaveClicked() {
    if (this.isWaveActive) return;

    if (this.tutorialStep === 'BATTLE_START') {
      this.tutorialStep = 'BATTLE_PLAYING';
      this.saveData.tutorialStep = 'BATTLE_PLAYING';
      this.enemiesToSpawn = 5;
      if (this.uiManager) {
        this.uiManager.hideTutorialOverlay();
      }
    } else {
      this.enemiesToSpawn = 10 + this.wave * 3;
    }

    this.prepPhase = false;
    this.isWaveActive = true;
    this.spawnTimer = 0;

    const isBoss = (this.gameMode === 'CAMPAIGN' && this.wave === 10) || (this.gameMode === 'SURVIVAL' && this.wave % 10 === 0);
    sound.playBGM(isBoss ? 'BOSS' : 'BATTLE');

    this.drawStartWaveBtn(false);
    this.startWaveBtnText.text = `WAVE ${this.wave} IN PROGRESS`;
    this.waveText.text = `WAVE ${this.wave}/${this.maxWave}`;
    this.waveText.style.fill = '#f8fafc';

    sound.playMerge();
    this.addFloatingText(360, 200, `WAVE ${this.wave} STARTED!`, '#4ade80');
  }

  public updateRollButtonState() {
    const canAfford = this.gold >= this.rollPrice;
    if (this.lastRollPriceDisplayed !== this.rollPrice) {
      this.lastRollPriceDisplayed = this.rollPrice;
      this.rollBtnText.text = `🎲 ROLL (${this.rollPrice}$)\n(Weapon / Trigger / Buff)`;
    }
    if (this.lastCanAffordRoll !== canAfford) {
      this.lastCanAffordRoll = canAfford;
      if (canAfford) {
        this.rollBtnBg.texture = PixelAssetManager.getSteampunkButtonTexture(230, 84, 'BLUE');
        this.rollBtnContainer.alpha = 1.0;
        this.rollBtnText.style.fill = '#ffffff';
        this.rollBtnContainer.cursor = 'pointer';
      } else {
        this.rollBtnBg.texture = PixelAssetManager.getSteampunkButtonTexture(230, 84, 'DISABLED');
        this.rollBtnContainer.alpha = 0.52;
        this.rollBtnText.style.fill = '#94a3b8';
        this.rollBtnContainer.cursor = 'not-allowed';
      }
    }
  }

  public onRollClicked() {
    if (this.gold < this.rollPrice) {
      sound.playClick();
      this.addFloatingText(130, 1050, 'Not enough gold!', '#ef4444');
      return;
    }

    if (this.tutorialStep === 'BATTLE_ROLL') {
      this.gold -= this.rollPrice;
      this.rollCount++;
      this.rollPrice = 2 + this.rollCount * 2;
      this.updateRollButtonState();
      this.addQuestProgress('roll_weapons', 1);

      const starterGun = this.grid[1][2]?.item?.gunKind || 'PISTOL';
      const cell = this.grid[1][1];
      cell.item = this.createGun(starterGun, 1);
      this.syncSlotView(1, 1);
      this.triggerSpawnFX(1, 1, cell.item);
      this.tutorialStep = 'BATTLE_MERGE';
      this.saveData.tutorialStep = 'BATTLE_MERGE';
      if (this.uiManager) {
        this.uiManager.showTutorialMerge(1, 1, 2, 1);
      }
      return;
    }

    const emptyCell = this.getRandomEmptyUnlockedCell();
    if (!emptyCell) {
      sound.playClick();
      this.addFloatingText(130, 1050, 'Board is full!', '#ef4444');
      return;
    }

    this.gold -= this.rollPrice;
    this.rollCount++;
    // TĂNG GIÁ ROLL ĐỀU ĐẶN SAU MỖI LẦN MUA (KHÔNG GIỚI HẠN TRẦN 12$)
    this.rollPrice = 2 + this.rollCount * 2;
    this.updateRollButtonState();
    this.addQuestProgress('roll_weapons', 1);

    const rollType = Math.random();
    const luckyLvl = Math.random() < ((this.saveData.talents?.luckyDropLevel || 0) * 0.06) ? 2 : 1;
    if (rollType < 0.70) {
      // Chỉ xuất hiện trong danh sách 5 súng & trụ người chơi đã trang bị!
      const pool = (this.saveData.equippedGuns && this.saveData.equippedGuns.length > 0)
        ? this.saveData.equippedGuns
        : (['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'] as GunKind[]);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      emptyCell.item = this.createGun(chosen, luckyLvl);
      if (luckyLvl > 1) this.addFloatingText(emptyCell.col * 110 + 100, emptyCell.row * 110 + 600, 'LUCKY Lv.2! 🍀', '#facc15');
    } else {
      emptyCell.item = this.createTrigger(luckyLvl);
      if (luckyLvl > 1) this.addFloatingText(emptyCell.col * 110 + 100, emptyCell.row * 110 + 600, 'LUCKY Lv.2! 🍀', '#facc15');
    }

    this.syncSlotView(emptyCell.col, emptyCell.row);
    this.triggerSpawnFX(emptyCell.col, emptyCell.row, emptyCell.item);
  }

  private getRandomEmptyUnlockedCell(): GridCell | null {
    const available: GridCell[] = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c].unlocked && !this.grid[r][c].isBlocked && this.grid[r][c].item === null) {
          available.push(this.grid[r][c]);
        }
      }
    }
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  // ================= ĐỒNG BỘ HIỂN THỊ CÁC Ô (ZERO ALLOCATION) ================= //

  private syncSlotView(col: number, row: number) {
    const cell = this.grid[row][col];
    const view = this.slotViews[row][col];
    const item = cell.item;

    view.obstacleSprite.visible = !!cell.isBlocked;

    if (cell.isBlocked) {
      view.itemContainer.visible = false;
      view.tierFrameG.visible = false;
      view.cellSprite.tint = 0x64748b;
      return;
    }

    if (!item) {
      view.itemContainer.visible = false;
      view.tierFrameG.visible = false;
      view.cellSprite.tint = 0xffffff;
      return;
    }

    view.itemContainer.visible = true;
    view.itemContainer.alpha = 1.0;

    // BẢNG MÀU RARITY CHO TOÀN BỘ Ô GẠCH & VIỀN PHÁT SÁNG
    let frameColor: number = 0xf8fafc;
    let glowColor: number = 0x94a3b8;
    let tileTint: number = 0xe2e8f0;

    if (item.type === 'GUN') {
      const gunTier = item.gunKind ? getGunTier(item.gunKind) : (item.tier || 1);
      const tierStyles: Record<number, { tint: number; glow: number; border: number }> = {
        1: { tint: 0xe2e8f0, glow: 0x94a3b8, border: 0xf8fafc }, // Common: Bạc / Xám sáng
        2: { tint: 0x60a5fa, glow: 0x0284c7, border: 0x38bdf8 }, // Rare: Lam ngọc phát sáng
        3: { tint: 0xc084fc, glow: 0x7e22ce, border: 0xe9d5ff }, // Epic: Tím thạch anh
        4: { tint: 0xfde047, glow: 0xd97706, border: 0xfef08a }, // Legendary: Vàng kim rực rỡ
        5: { tint: 0xf87171, glow: 0xb91c1c, border: 0xfecaca }, // Mythic: Đỏ hỏa ngục
      };
      const st = tierStyles[gunTier] || tierStyles[1];
      frameColor = st.border;
      glowColor = st.glow;
      tileTint = st.tint;
    } else if (item.type === 'TRIGGER') {
      frameColor = 0xfde047;
      glowColor = 0xb45309;
      tileTint = 0xfbbf24; // Đồng thau vàng cam Steampunk
    } else if (item.type === 'BUFF') {
      const buffStyles: Record<BuffKind, { tint: number; glow: number; border: number }> = {
        DMG: { tint: 0xf87171, glow: 0xb91c1c, border: 0xfca5a5 },
        SPEED: { tint: 0x60a5fa, glow: 0x1d4ed8, border: 0x93c5fd },
        FILL: { tint: 0x4ade80, glow: 0x15803d, border: 0x86efac },
        CRIT: { tint: 0xfde047, glow: 0xb45309, border: 0xfef08a },
      };
      const st = (item.buffKind && buffStyles[item.buffKind]) ? buffStyles[item.buffKind] : buffStyles.DMG;
      frameColor = st.border;
      glowColor = st.glow;
      tileTint = st.tint;
    }

    // 1. Biến toàn bộ ô gạch nền thành màu Rarity:
    view.cellSprite.tint = tileTint;

    // 2. Vẽ phiến gạch đá phát sáng rực rỡ theo màu Rarity (tierFrameG):
    view.tierFrameG.visible = true;
    view.tierFrameG.clear();

    // 2.1 Lớp màu nền phát sáng phủ trọn phiến gạch (luminous tile plate fill)
    view.tierFrameG.roundRect(2, 2, 92, 92, 8).fill({ color: glowColor, alpha: 0.35 });
    view.tierFrameG.roundRect(4, 4, 88, 88, 6).fill({ color: frameColor, alpha: 0.20 });

    // 2.2 Vòng tròn ổ trục bánh răng ở giữa sáng rực
    view.tierFrameG.circle(48, 48, 38).fill({ color: glowColor, alpha: 0.32 });
    view.tierFrameG.circle(48, 48, 24).fill({ color: frameColor, alpha: 0.25 });
    view.tierFrameG.circle(48, 48, 38).stroke({ width: 2, color: frameColor, alpha: 0.65 });

    // 2.3 Viền khung gạch nổi sáng chói (3D bevelled glowing rim)
    view.tierFrameG.roundRect(2, 2, 92, 92, 8).stroke({ width: 1.5, color: 0xffffff, alpha: 0.70 });
    view.tierFrameG.roundRect(3, 3, 90, 90, 7).stroke({ width: 3.5, color: frameColor, alpha: 1.0 });

    // 2.4 Dải bóng kính trên đỉnh phiến gạch tạo cảm giác khối ngọc sáng bóng
    view.tierFrameG.roundRect(6, 5, 84, 4, 2).fill({ color: 0xffffff, alpha: 0.55 });

    // 2.5 4 Chấu góc vuông cơ khí mạ kim loại sắc nét
    view.tierFrameG.moveTo(2, 18); view.tierFrameG.lineTo(2, 2).lineTo(18, 2);
    view.tierFrameG.moveTo(78, 2); view.tierFrameG.lineTo(94, 2).lineTo(94, 18);
    view.tierFrameG.moveTo(2, 78); view.tierFrameG.lineTo(2, 94).lineTo(18, 94);
    view.tierFrameG.moveTo(78, 94); view.tierFrameG.lineTo(94, 94); view.tierFrameG.lineTo(94, 78);
    view.tierFrameG.stroke({ width: 2.5, color: 0xffffff, alpha: 0.95 });

    // 4 đinh tán góc sáng bóng
    view.tierFrameG.circle(8, 8, 2.5).fill({ color: 0xffffff });
    view.tierFrameG.circle(88, 8, 2.5).fill({ color: 0xffffff });
    view.tierFrameG.circle(8, 88, 2.5).fill({ color: 0xffffff });
    view.tierFrameG.circle(88, 88, 2.5).fill({ color: 0xffffff });

    const lvlColors = ['#f8fafc', '#38bdf8', '#c084fc', '#facc15', '#ef4444'];
    const lvlHex = lvlColors[Math.min(5, Math.max(1, item.level)) - 1];

    if (item.type === 'TRIGGER') {
      view.itemContainer.zIndex = 10; // Cò nẫy luôn nằm trên bánh răng
      view.baseSprite.texture = PixelAssetManager.getTriggerTexture(item.level);
      view.baseSprite.anchor.set(0.5);
      view.baseSprite.x = 40;
      view.baseSprite.y = 40;
      view.baseSprite.scale.set(1.0);
      view.baseSprite.rotation = (item.angle * Math.PI) / 180;
      view.barrelSprite.visible = false;
      view.fillG.visible = false;
      view.lvlText.x = 64;
      view.lvlText.y = 62;
      view.lvlText.text = `x${item.level}`;
      view.lvlText.style.fill = '#fde047';
      view.lvlText.style.fontSize = 22;
    } else if (item.type === 'GUN') {
      const isAura = item.gunKind && (item.gunKind.startsWith('AURA_') || item.gunKind === 'LUNAR');
      view.itemContainer.zIndex = 5;

      if (isAura) {
        // TRỤ HÀO QUANG AURA: BỆ ĐÁ CỔ NGỮ PHÁP THUẬT, HOÀN TOÀN KHÔNG BÁNH RĂNG
        view.baseSprite.texture = PixelAssetManager.getTotemBaseTexture(item.gunKind!, item.level);
        view.baseSprite.anchor.set(0.5);
        view.baseSprite.x = 40;
        view.baseSprite.y = 40;
        view.baseSprite.scale.set(1.0);
        view.baseSprite.rotation = 0; // Đứng yên uy nghi, không xoay bánh răng

        view.barrelSprite.visible = false;

        // TRỤ AURA PHÁT TÁC DỤNG LIÊN TỤC, KHÔNG CÓ NẠP ĐẠN BẮN SÚNG NÊN ẨN THANH NĂNG LƯỢNG
        view.fillG.visible = false;
      } else {
        // SÚNG CHIẾN ĐẤU CƠ KHÍ: ĐẾ BÁNH RĂNG XOAY TRUYỀN ĐỘNG NẠP ĐẠN
        view.baseSprite.texture = PixelAssetManager.getGunBaseTexture(item.level);
        view.baseSprite.anchor.set(0.5);
        view.baseSprite.x = 40;
        view.baseSprite.y = 40;
        view.baseSprite.scale.set(1.0);
        view.baseSprite.rotation = item.gearAngle || 0;

        view.barrelSprite.visible = true;
        view.barrelSprite.texture = PixelAssetManager.getGunBarrelTexture(item.gunKind!, item.level);
        view.barrelSprite.rotation = item.turretAngle;
        view.barrelSprite.scale.set(1.2);
        view.barrelSprite.tint = 0xffffff;

        view.fillG.visible = true;
        this.drawGunEnergyBar(view.fillG, item);
      }

      view.lvlText.x = 68;
      view.lvlText.y = 10;
      view.lvlText.text = `Lv${item.level}`;
      view.lvlText.style.fill = lvlHex;
      view.lvlText.style.fontSize = 19;
    } else if (item.type === 'BUFF') {
      view.itemContainer.zIndex = 5;
      view.baseSprite.texture = PixelAssetManager.getBuffTexture(item.buffKind!, item.level);
      view.baseSprite.anchor.set(0.5);
      view.baseSprite.x = 40;
      view.baseSprite.y = 40;
      view.baseSprite.scale.set(1.0);
      view.baseSprite.rotation = 0;
      view.barrelSprite.visible = false;
      view.fillG.visible = false;
      view.lvlText.x = 64;
      view.lvlText.y = 62;
      view.lvlText.text = `Lv${item.level}`;
      view.lvlText.style.fill = '#ffffff';
      view.lvlText.style.fontSize = 20;
    }
  }

  private syncAllGridSlots() {
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        this.syncSlotView(c, r);
      }
    }
  }

  // ================= KÉO THẢ, MERGE HIGHLIGHT VÀ BÁN THÙNG RÁC ================= //

  private initGlobalDragListeners() {
    this.stage.on('pointerdown', () => {
      this.hideTooltip();
    });

    this.stage.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.pointerDownItem) return;

      const dist = Math.hypot(e.global.x - this.pointerDownX, e.global.y - this.pointerDownY);

      if (dist > 10 && !this.isDragging) {
        this.isDragging = true;
        this.hideTooltip();
        this.slotViews[this.pointerDownRow][this.pointerDownCol].itemContainer.alpha = 0.35;

        // HIỂN THỊ Ô THÙNG RÁC ĐỎ
        const sellPrice = this.getSellPrice(this.pointerDownItem);
        this.trashText.text = t('hud_trash_val', sellPrice);
        this.trashContainer.visible = true;

        // PHÁT SÁNG VIỀN VÀNG CÁC Ô CÓ THỂ MERGE ĐƯỢC
        this.highlightMergeableSlots(this.pointerDownItem);

        this.dragGhost = this.createItemDisplayGhost(this.pointerDownItem);
        this.dragContainer.addChild(this.dragGhost);
      }

      if (this.isDragging && this.dragGhost) {
        this.dragGhost.x = e.global.x - 40;
        this.dragGhost.y = e.global.y - 40;

        // Kiểm tra hover vào vùng Thùng Rác (x: 20..250, y: 1080..1164)
        const isHoverTrash = (e.global.x >= 20 && e.global.x <= 250 && e.global.y >= 1080 && e.global.y <= 1164);
        this.drawTrashBg(isHoverTrash);

        const col = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
        const row = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);

        for (let r = 0; r < this.ROWS; r++) {
          for (let c = 0; c < this.COLS; c++) {
            this.slotViews[r][c].highlightG.visible = (c === col && r === row && !this.grid[r][c].isBlocked);
          }
        }
      }
    });

    const finishDrag = (e: FederatedPointerEvent) => {
      if (!this.pointerDownItem) return;

      // Tắt toàn bộ highlight
      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          this.slotViews[r][c].highlightG.visible = false;
          this.slotViews[r][c].mergeHighlightG.visible = false;
        }
      }

      // Tắt ô thùng rác
      this.trashContainer.visible = false;
      this.drawTrashBg(false);

      if (!this.isDragging) {
        // CLICK -> HIỆN BẢNG THÔNG TIN CẠNH SÚNG
        this.showTooltipAt(this.pointerDownItem, this.pointerDownCol, this.pointerDownRow);
      } else {
        const origCol = this.pointerDownCol;
        const origRow = this.pointerDownRow;

        // KIỂM TRA THẢ VÀO THÙNG RÁC ĐỂ BÁN
        const isDropInTrash = (e.global.x >= 20 && e.global.x <= 250 && e.global.y >= 1080 && e.global.y <= 1164);
        if (isDropInTrash) {
          const sellPrice = this.getSellPrice(this.pointerDownItem);
          this.grid[origRow][origCol].item = null;
          this.gold += sellPrice;
          this.syncSlotView(origCol, origRow);
          sound.playExplode();
          this.addFloatingText(135, 1060, `+${sellPrice}$ SOLD!`, '#22c55e');
        } else {
          // DROP TO BOARD CELL
          const dropCol = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
          const dropRow = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);

          if (dropCol >= 0 && dropCol < this.COLS && dropRow >= 0 && dropRow < this.ROWS) {
            const targetCell = this.grid[dropRow][dropCol];
            const sourceCell = this.grid[origRow][origCol];

            if (targetCell.isBlocked) {
              sound.playHit();
              this.addFloatingText(this.GRID_X + dropCol * this.CELL_SIZE + 48, this.GRID_Y + dropRow * this.CELL_SIZE + 30, 'BLOCKED BY ROCK!', '#f87171');
              this.slotViews[origRow][origCol].itemContainer.alpha = 1.0;
            } else if (dropCol === origCol && dropRow === origRow) {
              // Giữ nguyên
            } else if (targetCell.item === null) {
              targetCell.item = this.pointerDownItem;
              sourceCell.item = null;
              this.syncSlotView(dropCol, dropRow);
              this.syncSlotView(origCol, origRow);
              sound.playClick();
            } else {
              const dest = targetCell.item;
              const drag = this.pointerDownItem;

              const isMimic = (dest.type === 'GUN' && drag.type === 'GUN') && (dest.gunKind === 'MIMIC' || drag.gunKind === 'MIMIC');
              const canMerge =
                dest.level === drag.level &&
                dest.level < 5 &&
                (isMimic ||
                 (dest.type === drag.type &&
                  ((dest.type === 'GUN' && dest.gunKind === drag.gunKind) ||
                   (dest.type === 'BUFF' && dest.buffKind === drag.buffKind) ||
                   (dest.type === 'TRIGGER'))));

              if (canMerge) {
                const nextLevel = dest.level + 1;
                if (dest.type === 'GUN') {
                  let targetKind = dest.gunKind!;
                  if (isMimic) {
                    const partnerKind = dest.gunKind === 'MIMIC' ? drag.gunKind! : dest.gunKind!;
                    if (partnerKind === 'MIMIC') {
                      // Ghép 2 súng MIMIC cùng cấp -> Nâng cấp thành chính MIMIC cấp sao cao hơn (không ngẫu nhiên)!
                      targetKind = 'MIMIC';
                    } else {
                      targetKind = partnerKind;
                    }
                  } else {
                    if (dest.gunKind === 'NUCLEAR' && drag.gunKind === 'NUCLEAR') {
                      this.triggerNuclearExplosion();
                    }
                    if (dest.gunKind === 'SACRIFICE' && drag.gunKind === 'SACRIFICE') {
                      const spBonus = 60 * nextLevel;
                      this.gold += spBonus;
                      this.goldText.text = `$: ${this.gold}`;
                      this.updateRollButtonState();
                      this.addFloatingText(dropCol * this.CELL_SIZE + this.GRID_X + 48, dropRow * this.CELL_SIZE + this.GRID_Y, `+${spBonus} SP! 💰`, '#facc15');
                    }
                    if (dest.gunKind === 'SUMMONER' && drag.gunKind === 'SUMMONER') {
                      this.triggerSummonerSpawn();
                    }
                    if (dest.gunKind === 'ASSASSIN' && drag.gunKind === 'ASSASSIN') {
                      this.triggerAssassinUpgrade(dropCol, dropRow);
                    }
                    if (dest.gunKind === 'COMBO' && drag.gunKind === 'COMBO') {
                      this.comboCount = (this.comboCount || 0) + 1;
                      this.addFloatingText(dropCol * this.CELL_SIZE + this.GRID_X + 48, dropRow * this.CELL_SIZE + this.GRID_Y, `COMBO x${this.comboCount}! 🔥`, '#ef4444');
                    }
                  }
                  targetCell.item = this.createGun(targetKind, nextLevel);
                } else if (dest.type === 'TRIGGER') {
                  targetCell.item = this.createTrigger(nextLevel);
                } else if (dest.type === 'BUFF') {
                  targetCell.item = this.createBuff(dest.buffKind!, nextLevel);
                }

                sourceCell.item = null;
                this.syncSlotView(dropCol, dropRow);
                this.syncSlotView(origCol, origRow);
                this.triggerUpgradeFX(dropCol, dropRow, nextLevel, dest.gunKind || dest.type);

                if (this.tutorialStep === 'BATTLE_MERGE') {
                  this.tutorialStep = 'BATTLE_START';
                  this.saveData.tutorialStep = 'BATTLE_START';
                  if (this.uiManager) {
                    this.uiManager.showTutorialBattleStart();
                  }
                }
              } else {
                targetCell.item = drag;
                sourceCell.item = dest;
                this.syncSlotView(dropCol, dropRow);
                this.syncSlotView(origCol, origRow);
                sound.playClick();
              }
            }
          }

          this.slotViews[origRow][origCol].itemContainer.alpha = 1.0;
        }
      }

      this.pointerDownItem = null;
      this.pointerDownCol = -1;
      this.pointerDownRow = -1;
      this.isDragging = false;

      if (this.dragGhost) {
        this.dragGhost.destroy({ children: true });
        this.dragGhost = null;
      }
    };

    this.stage.on('pointerup', finishDrag);
    this.stage.on('pointerupoutside', finishDrag);
  }

  // Bật viền vàng cho tất cả các ô có thể merge với món đang kéo
  private highlightMergeableSlots(dragItem: GridItem) {
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const dest = this.grid[r][c].item;
        if (dest && dest !== dragItem) {
          const isMimic = (dest.type === 'GUN' && dragItem.type === 'GUN') && (dest.gunKind === 'MIMIC' || dragItem.gunKind === 'MIMIC');
          const canMerge =
            dest.level === dragItem.level &&
            dest.level < 5 &&
            (isMimic ||
             (dest.type === dragItem.type &&
              ((dest.type === 'GUN' && dest.gunKind === dragItem.gunKind) ||
               (dest.type === 'BUFF' && dest.buffKind === dragItem.buffKind) ||
               (dest.type === 'TRIGGER'))));

          this.slotViews[r][c].mergeHighlightG.visible = canMerge;
          if (canMerge) {
            this.drawMergeHighlight(this.slotViews[r][c].mergeHighlightG, this.animTime);
          }
        } else {
          this.slotViews[r][c].mergeHighlightG.visible = false;
        }
      }
    }
  }

  // Hiệu ứng Bom Hạt Nhân khi merge 2 súng NUCLEAR
  private triggerNuclearExplosion() {
    this.trauma = 1.0;
    sound.playExplode();
    this.addShockwave(360, 480, 500, 0xfacc15);
    this.addSparks(360, 480, 36, 0xf97316, 380);

    for (const e of this.enemies) {
      if (!e.active) continue;
      if (e.isBoss || e.isElite) {
        const dmg = Math.round(e.maxHp * 0.25);
        e.hp -= dmg;
        this.addFloatingText(e.x, e.y, `-${dmg} ☢️`, '#ef4444');
        if (e.hp <= 0) this.killEnemy(e);
      } else {
        this.killEnemy(e);
      }
    }
  }

  // Triệu hồi thêm súng khi merge 2 súng SUMMONER
  private triggerSummonerSpawn() {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (!this.grid[r][c].isBlocked && this.grid[r][c].item === null) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length > 0) {
      const pick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const pool: GunKind[] = this.saveData.equippedGuns && this.saveData.equippedGuns.length > 0 ? this.saveData.equippedGuns : ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      this.grid[pick.r][pick.c].item = this.createGun(chosen, 1);
      this.syncSlotView(pick.c, pick.r);
      this.triggerSpawnFX(pick.c, pick.r, this.grid[pick.r][pick.c].item!);
      this.addFloatingText(pick.c * this.CELL_SIZE + this.GRID_X + 48, pick.r * this.CELL_SIZE + this.GRID_Y, 'SUMMONED! ✨', '#38bdf8');
    }
  }

  // Nâng cấp ngẫu nhiên 1 súng đồng minh khi merge 2 súng ASSASSIN
  private triggerAssassinUpgrade(exceptCol: number, exceptRow: number) {
    const upgradable: { r: number; c: number; item: GridItem }[] = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (r === exceptRow && c === exceptCol) continue;
        const it = this.grid[r][c].item;
        if (it && it.type === 'GUN' && it.level < 5) {
          upgradable.push({ r, c, item: it });
        }
      }
    }
    if (upgradable.length > 0) {
      const target = upgradable[Math.floor(Math.random() * upgradable.length)];
      const nextLevel = target.item.level + 1;
      this.grid[target.r][target.c].item = this.createGun(target.item.gunKind!, nextLevel);
      this.syncSlotView(target.c, target.r);
      this.triggerUpgradeFX(target.c, target.r, nextLevel, target.item.gunKind!);
      this.addFloatingText(target.c * this.CELL_SIZE + this.GRID_X + 48, target.r * this.CELL_SIZE + this.GRID_Y, 'ASSASSIN UPGRADE! 🎯', '#a855f7');
    }
  }

  // Súng Mystery tự động biến hóa sau 10 phát bắn
  private transformMysteryGun(col: number, row: number, gun: GridItem) {
    const pool: GunKind[] = this.saveData.equippedGuns && this.saveData.equippedGuns.length > 0 ? this.saveData.equippedGuns : ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'];
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const nextLvl = Math.random() < 0.3 ? Math.min(5, gun.level + 1) : gun.level;
    this.grid[row][col].item = this.createGun(chosen, nextLvl);
    this.syncSlotView(col, row);
    this.triggerUpgradeFX(col, row, nextLvl, chosen);
    this.addFloatingText(col * this.CELL_SIZE + this.GRID_X + 48, row * this.CELL_SIZE + this.GRID_Y, `TRANSFORM: ${GUN_NAMES[chosen]}! 🎲`, '#fde047');
  }

  // Đếm số lượng súng cùng loại trên sân (dành cho SOLAR, LUNAR)
  public countGunsOnGrid(kind: GunKind): number {
    let count = 0;
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const it = this.grid[r][c].item;
        if (it && it.type === 'GUN' && it.gunKind === kind) count++;
      }
    }
    return count;
  }

  // Vẽ ô có thể MERGE: sáng vàng hẳn ra + tia flare aura + icon tròn có dấu cộng ở giữa
  private drawMergeHighlight(g: Graphics, time: number) {
    g.clear();

    const cx = 48;
    const cy = 48;
    const pulse = 0.5 + 0.5 * Math.sin(time * 8);

    // 1. NỀN VÀNG SÁNG RỰC RỠ PHỦ TRỌN Ô GẠCH
    g.roundRect(2, 2, 92, 92, 8).fill({ color: 0xfacc15, alpha: 0.50 + 0.20 * pulse });
    g.roundRect(5, 5, 86, 86, 6).fill({ color: 0xfef08a, alpha: 0.35 + 0.15 * pulse });
    g.circle(cx, cy, 38).fill({ color: 0xfde047, alpha: 0.40 + 0.20 * pulse });

    // 2. TIA FLARE AURA TỎA RA TỪ TÂM (8 tia sáng xoay nhẹ quanh tâm)
    const baseAngle = time * 2.5;
    for (let i = 0; i < 8; i++) {
      const angle = baseAngle + (i * Math.PI) / 4;
      const isMajor = i % 2 === 0;
      const rayLen = isMajor ? (42 + 6 * Math.sin(time * 12 + i)) : (34 + 4 * Math.cos(time * 12 + i));
      const endX = cx + Math.cos(angle) * rayLen;
      const endY = cy + Math.sin(angle) * rayLen;

      g.moveTo(cx, cy).lineTo(endX, endY);
      g.stroke({
        width: isMajor ? 4.5 : 2.5,
        color: isMajor ? 0xffffff : 0xfde047,
        alpha: 0.85 + 0.15 * pulse,
      });

      g.circle(endX, endY, isMajor ? 3.5 : 2).fill({
        color: 0xffffff,
        alpha: 0.9,
      });
    }

    // 3. VIỀN VÀNG & TRẮNG CHÓI LỌI KÈM CHỐT GÓC
    g.roundRect(2, 2, 92, 92, 8).stroke({ color: 0xffffff, width: 3.5 });
    g.roundRect(4, 4, 88, 88, 6).stroke({ color: 0xfacc15, width: 2.5, alpha: 0.95 });

    const cornerSize = 18;
    g.moveTo(2, cornerSize).lineTo(2, 2).lineTo(cornerSize, 2).stroke({ color: 0xffffff, width: 5 });
    g.moveTo(94 - cornerSize, 2).lineTo(94, 2).lineTo(94, cornerSize).stroke({ color: 0xffffff, width: 5 });
    g.moveTo(2, 94 - cornerSize).lineTo(2, 94).lineTo(cornerSize, 94).stroke({ color: 0xffffff, width: 5 });
    g.moveTo(94 - cornerSize, 94).lineTo(94, 94).lineTo(94, 94 - cornerSize).stroke({ color: 0xffffff, width: 5 });

    // 4. ICON TRÒN CÓ DẤU CỘNG Ở CHÍNH GIỮA (Biểu tượng Merge Upgrade)
    const iconScale = 1.0 + 0.08 * Math.sin(time * 10);
    const rIcon = 20 * iconScale;

    // Hào quang ngoài của icon tròn
    g.circle(cx, cy, rIcon + 5).fill({ color: 0xfde047, alpha: 0.65 });
    g.circle(cx, cy, rIcon + 2).stroke({ color: 0xffffff, width: 2, alpha: 0.85 });

    // Vành viền tối bảo vệ độ tương phản
    g.circle(cx, cy, rIcon).fill({ color: 0x1e293b });
    g.circle(cx, cy, rIcon).stroke({ color: 0x1e293b, width: 3 });

    // Vòng tròn màu xanh lá nâng cấp rực rỡ
    g.circle(cx, cy, rIcon - 2).fill({ color: 0x22c55e });
    g.circle(cx, cy, rIcon - 2).stroke({ color: 0x86efac, width: 2.5 });

    // DẤU CỘNG '+' TRẮNG SẮC NÉT Ở CHÍNH GIỮA ICON
    const barLen = 10 * iconScale;
    const barThick = 4 * iconScale;
    g.roundRect(cx - barLen, cy - barThick / 2, barLen * 2, barThick, 2).fill({ color: 0xffffff });
    g.roundRect(cx - barThick / 2, cy - barLen, barThick, barLen * 2, 2).fill({ color: 0xffffff });
  }

  private getSellPrice(item: GridItem): number {
    return Math.max(1, Math.round(2 * Math.pow(1.8, item.level - 1)));
  }

  private onItemPointerDown(e: FederatedPointerEvent, item: GridItem, col: number, row: number) {
    this.pointerDownItem = item;
    this.pointerDownCol = col;
    this.pointerDownRow = row;
    this.pointerDownX = e.global.x;
    this.pointerDownY = e.global.y;
    this.isDragging = false;
  }

  private createItemDisplayGhost(item: GridItem): Container {
    const cont = new Container();
    if (item.type === 'TRIGGER') {
      const sp = new Sprite(PixelAssetManager.getTriggerTexture(item.level));
      sp.anchor.set(0.5);
      sp.x = 40;
      sp.y = 40;
      sp.rotation = (item.angle * Math.PI) / 180;
      cont.addChild(sp);
    } else if (item.type === 'GUN') {
      const base = new Sprite(PixelAssetManager.getGunBaseTexture(item.level));
      base.anchor.set(0.5);
      base.x = 40;
      base.y = 40;
      base.rotation = item.gearAngle || 0;
      cont.addChild(base);

      const barrel = new Sprite(PixelAssetManager.getGunBarrelTexture(item.gunKind!, item.level));
      barrel.anchor.set(0.5);
      barrel.x = 40;
      barrel.y = 40;
      barrel.rotation = item.turretAngle;
      barrel.tint = 0xffffff;
      cont.addChild(barrel);
    } else if (item.type === 'BUFF') {
      const sp = new Sprite(PixelAssetManager.getBuffTexture(item.buffKind!, item.level));
      sp.anchor.set(0.5);
      sp.x = 40;
      sp.y = 40;
      cont.addChild(sp);
    }
    cont.alpha = 0.88;
    return cont;
  }

  // ================= HIỆU ỨNG VFX / SFX XUẤT HIỆN KHI BẤM ROLL SÚNG ================= //

  private triggerSpawnFX(col: number, row: number, item: GridItem) {
    const centerX = this.GRID_X + col * this.CELL_SIZE + 48;
    const centerY = this.GRID_Y + row * this.CELL_SIZE + 48;

    // 1. Bung scale ô slot (1.35x rồi co về mượt mà)
    this.slotViews[row][col].popScale = 1.35;

    // 2. Xác định màu sắc chủ đạo theo loại món xuất hiện
    let mainColor = 0x38bdf8;
    let label = t('float_weapon');
    let hexColor = '#38bdf8';

    if (item.type === 'GUN' && item.gunKind) {
      const tier = getGunTier(item.gunKind);
      const rarity = RARITY_CONFIGS[tier];
      mainColor = rarity.color;
      hexColor = rarity.hex;
      label = `+ ${GUN_NAMES[item.gunKind] || t('float_weapon')}`;
    } else if (item.type === 'TRIGGER') {
      mainColor = 0xf59e0b;
      hexColor = '#f59e0b';
      label = t('float_trigger');
    } else if (item.type === 'BUFF') {
      const buffKeys: Record<BuffKind, { key: TranslationKey; color: number; hex: string }> = {
        DMG: { key: 'float_might', color: 0xef4444, hex: '#ef4444' },
        SPEED: { key: 'float_haste', color: 0x3b82f6, hex: '#3b82f6' },
        FILL: { key: 'float_reload', color: 0x22c55e, hex: '#22c55e' },
        CRIT: { key: 'float_crit', color: 0xfacc15, hex: '#facc15' },
      };
      const info = buffKeys[item.buffKind || 'DMG'];
      mainColor = info.color;
      hexColor = info.hex;
      label = t(info.key);
    }

    // 3. Shockwave lan tỏa kép (vòng màu chính + vòng trắng bên trong)
    this.addShockwave(centerX, centerY, 72, mainColor);
    this.addShockwave(centerX, centerY, 44, 0xffffff);

    // 4. Mưa tia lửa máy móc và tinh thể sáng bùng nổ
    this.addSparks(centerX, centerY, 20, mainColor, 220);
    this.addSparks(centerX, centerY, 12, 0xffffff, 160);

    // 5. Lóe sáng chớp vàng tại tâm ô
    this.addMuzzleFlash(centerX, centerY, mainColor);

    // 6. Rung nhẹ màn hình tạo cảm giác lực
    this.trauma = Math.min(1.0, this.trauma + 0.12);

    // 7. Floating Text thông báo tên món đồ xuất hiện
    this.addFloatingText(centerX, centerY - 28, label, hexColor);

    // 8. SFX âm thanh gacha cơ khí + chuông ngân vật phẩm xuất hiện
    sound.playRollSpawn();
  }

  // ================= HIỆU ỨNG VFX / SFX THĂNG CẤP MERGE TIER CỰC ĐỈNH ================= //

  private triggerUpgradeFX(col: number, row: number, nextLevel: number, label: string) {
    const lvl = Math.min(5, Math.max(1, nextLevel));
    const lvlColors = [0xf8fafc, 0x3b82f6, 0xa855f7, 0xfacc15, 0xef4444];
    const lvlHexes = ['#f8fafc', '#38bdf8', '#c084fc', '#facc15', '#ef4444'];
    const fxColor = lvlColors[lvl - 1];
    const fxHex = lvlHexes[lvl - 1];
    const centerX = this.GRID_X + col * this.CELL_SIZE + 48;
    const centerY = this.GRID_Y + row * this.CELL_SIZE + 48;

    // 1. Pop scale animation on slot view (bung to 1.38x rồi co lại tạo cảm giác đã tay)
    this.slotViews[row][col].popScale = 1.38;

    // 2. Shockwaves mở rộng theo màu Level mới
    this.addShockwave(centerX, centerY, 80, fxColor);
    this.addShockwave(centerX, centerY, 48, 0xffffff);

    // 3. Pháo hoa pháo sáng mảnh vỡ tung tóe
    this.addSparks(centerX, centerY, 28, fxColor, 240);
    this.addSparks(centerX, centerY, 14, 0xffffff, 180);

    // 4. Lóe sáng viền nòng Muzzle Flash tại tâm
    this.addMuzzleFlash(centerX, centerY, fxColor);

    // 5. Rung chấn màn hình theo cấp độ
    this.trauma = Math.min(1.0, this.trauma + 0.10 * lvl);

    // 6. Floating Text
    this.addFloatingText(centerX, centerY - 32, `★ UPGRADE LV.${nextLevel} ★`, fxHex);

    // 7. SFX âm thanh thăng cấp theo bậc Level kích thích
    sound.playMerge(lvl);
  }

  private updateSlotAnimations(dt: number) {
    this.animTime += dt;
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const view = this.slotViews[r][c];
        if (view.popScale > 1.0) {
          view.popScale = Math.max(1.0, view.popScale - 3.2 * dt);
          view.itemContainer.scale.set(view.popScale);
        }
        if (view.mergeHighlightG.visible) {
          this.drawMergeHighlight(view.mergeHighlightG, this.animTime);
        }
      }
    }
  }

  // ================= TOOLTIP BÊN CẠNH SÚNG (KHÔNG OVERLAY, TỰ TRÁNH BỊ KHUẤT) ================= //

  public showTooltipAt(item: GridItem, col: number, row: number) {
    const cellX = this.GRID_X + col * this.CELL_SIZE;
    const cellY = this.GRID_Y + row * this.CELL_SIZE;

    const gunTier = (item.type === 'GUN' && item.gunKind) ? getGunTier(item.gunKind) : (item.tier || 1);
    const tierRarity = RARITY_CONFIGS[gunTier];

    let name = '';
    let stats = '';
    let desc = '';

    if (item.type === 'TRIGGER') {
      name = `TRIGGER GEAR Lv.${item.level}`;
      const hitsPerSec = (item.level * item.rotationSpeed).toFixed(1);
      stats = `• Type: Rotating Ratchet Trigger\n• Cogs: ${item.level} teeth (${hitsPerSec} hits/s)`;
      desc = `Strikes adjacent weapons to drive reload gears.`;
    } else if (item.type === 'GUN') {
      const isAura = item.gunKind && (item.gunKind.startsWith('AURA_') || item.gunKind === 'LUNAR');
      name = `[TIER ${gunTier} • ${tierRarity.name}] ${GUN_NAMES[item.gunKind!] || 'WEAPON'} Lv.${item.level}`;

      if (isAura) {
        if (item.gunKind === 'AURA_SPEED') {
          stats = `• Aura Totem (Passive)\n• +30% Adjacent Trigger Speed`;
          desc = `Accelerates reload of 4 adjacent cells (Up, Down, Left, Right).`;
        } else if (item.gunKind === 'AURA_DMG') {
          stats = `• Aura Totem (Passive)\n• +30% Adjacent Weapon DMG`;
          desc = `Boosts damage of 4 adjacent cells (Up, Down, Left, Right).`;
        } else if (item.gunKind === 'AURA_CRIT') {
          stats = `• Aura Totem (Passive)\n• +20% Crit & +25% DMG`;
          desc = `Boosts critical strikes of 4 adjacent cells.`;
        } else if (item.gunKind === 'AURA_ENERGY') {
          stats = `• Aura Totem (Passive)\n• Generates +${4 * item.level} SP per trigger hit`;
          desc = `Generates SP economy to upgrade weapons.`;
        } else if (item.gunKind === 'LUNAR') {
          stats = `• Mythic Totem (Active at 1, 4, 9 weapons)\n• +100% Damage & Attack Speed`;
          desc = `Doubles combat power of all adjacent weapons.`;
        } else {
          stats = `• Support Aura Totem (Passive)`;
          desc = GUN_DETAILS[item.gunKind!]?.mechanic || 'Supports adjacent ally weapons.';
        }
      } else {
        const hitsNeeded = Math.ceil(1.0 / item.fillPerHit);
        stats = `• Damage: ${item.damage} DMG\n• Ammo: ${hitsNeeded} trigger hits (1 bullet)\n• 360° Auto-targeting`;
        desc = GUN_DETAILS[item.gunKind!]?.mechanic || 'Combat weapon defending the castle.';
      }
    } else if (item.type === 'BUFF') {
      const buffNames: Record<BuffKind, string> = {
        DMG: 'MIGHT (DMG BUFF)',
        SPEED: 'HASTE (SPEED BUFF)',
        FILL: 'OVERCHARGE (RELOAD BUFF)',
        CRIT: 'CRIT (CRIT BUFF)',
      };
      name = `${buffNames[item.buffKind!]} Lv.${item.level}`;
      if (item.buffKind === 'DMG') {
        stats = `• +${item.level * 20}% Adjacent Weapon DMG`;
        desc = `Empowers 4 adjacent cells (Up, Down, Left, Right).`;
      } else if (item.buffKind === 'SPEED') {
        stats = `• +${item.level * 20}% Adjacent Trigger Speed`;
        desc = `Accelerates rotation of 4 adjacent cells.`;
      } else if (item.buffKind === 'FILL') {
        stats = `• +${item.level * 15}% Adjacent Reload Speed`;
        desc = `Rapid ammo reload for 4 adjacent cells.`;
      } else if (item.buffKind === 'CRIT') {
        stats = `• +${item.level * 10}% Critical Strike Chance`;
        desc = `Boosts crit rate for 4 adjacent cells.`;
      }
    }

    this.tooltipTitleText.text = name;
    this.tooltipTitleText.style.fill = tierRarity.hex;
    this.tooltipStatsText.text = stats;
    this.tooltipDescText.text = desc;

    // Sắp xếp các đoạn text theo thứ tự tự động, tuyệt đối không bao giờ chồng đè lên nhau
    this.tooltipTitleText.x = 16;
    this.tooltipTitleText.y = 14;

    this.tooltipStatsText.x = 16;
    this.tooltipStatsText.y = this.tooltipTitleText.y + this.tooltipTitleText.height + 8;

    this.tooltipDescText.x = 16;
    this.tooltipDescText.y = this.tooltipStatsText.y + this.tooltipStatsText.height + 8;

    this.tooltipHintText.x = 16;
    this.tooltipHintText.y = this.tooltipDescText.y + this.tooltipDescText.height + 10;

    const tipW = 310;
    const tipH = Math.max(160, this.tooltipHintText.y + this.tooltipHintText.height + 14);

    this.tooltipCard.clear();
    this.tooltipCard.roundRect(0, 0, tipW, tipH, 12);
    this.tooltipCard.fill({ color: 0x13151f, alpha: 0.96 });
    this.tooltipCard.stroke({ color: tierRarity.color, width: 2.5 });

    let targetX: number;
    if (col >= 3) {
      targetX = cellX - tipW - 12;
    } else {
      targetX = cellX + this.CELL_SIZE + 12;
    }

    targetX = Math.max(16, Math.min(targetX, 720 - tipW - 16));
    let targetY = Math.max(70, Math.min(cellY - 30, 1080 - tipH));

    this.tooltipContainer.x = targetX;
    this.tooltipContainer.y = targetY;

    this.tooltipContainer.visible = true;
    sound.playClick();
  }

  public hideTooltip() {
    this.tooltipContainer.visible = false;
  }

  // ================= AUTO-AIM & GAME ENGINE LOOP ================= //

  public update(rawDt: number) {
    if (this.inMenu) return;
    if (this.isPaused) return;
    if (this.isGameOver || this.isVictory) return;

    const dt = Math.min(rawDt, 0.1) * this.gameSpeed;

    this.updateTriggers(dt);
    this.updateGunsAndAim(dt);
    this.updateSlotAnimations(dt);
    this.updateAuraTotems(dt);

    if (this.isWaveActive) {
      this.updateWave(dt);
    }

    this.updateBullets(dt);
    this.updateFireZones(dt);
    this.updateBlackHoleZones(dt);
    this.updateFallingMeteors(dt);
    this.updateNuclearCraters(dt);
    this.updateLandmines(dt);
    this.updateThornFields(dt);
    this.updateStasisFields(dt);
    this.updateHolyCrosses(dt);
    this.updateLaserBeams(dt);
    this.updateSpecialFX(dt);
    this.updateFloatingTexts(dt);
    this.updateScreenShake(dt);

    this.goldText.text = `$: ${this.gold}`;
    this.hpText.text = `CASTLE HP: ${this.castleHp}/${this.maxCastleHp}`;
    this.updateRollButtonState();

    this.renderActiveEntities();
  }

  // Định kỳ mỗi 2 giây, các Trụ Aura tự động phát xung hào quang hỗ trợ (hoạt động độc lập, không cần bánh răng)
  private auraPulseTimer: number = 0;
  private updateAuraTotems(dt: number) {
    if (!this.isWaveActive) return;
    this.auraPulseTimer += dt;
    if (this.auraPulseTimer >= 2.0) {
      this.auraPulseTimer = 0;
      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          const item = this.grid[r][c].item;
          if (item && item.type === 'GUN' && item.gunKind && (item.gunKind.startsWith('AURA_') || item.gunKind === 'LUNAR')) {
            const kind = item.gunKind;
            const cellX = c * this.CELL_SIZE + this.GRID_X + 48;
            const cellY = r * this.CELL_SIZE + this.GRID_Y + 48;
            const auraColor = kind === 'AURA_DMG' ? 0xef4444 : (kind === 'AURA_SPEED' ? 0x38bdf8 : (kind === 'AURA_CRIT' ? 0xf59e0b : (kind === 'LUNAR' ? 0xc084fc : 0x10b981)));
            this.addShockwave(cellX, cellY, 60, auraColor);
            this.addSparks(cellX, cellY, 6, auraColor, 90);

            if (kind === 'AURA_ENERGY') {
              const spGain = 4 * item.level;
              this.gold += spGain;
              this.goldText.text = `$: ${this.gold}`;
              this.updateRollButtonState();
              this.addFloatingText(cellX, cellY - 20, `+${spGain} SP! 💎`, '#10b981');
            }
          }
        }
      }
    }
  }

  // Cò quay truyền động cơ khí trực tiếp:
  // - Bánh răng CHỈ xoay trong khoảng thời gian chấu Cò thực sự chạm vào bánh răng [-20°, +20°].
  // - Cò đi qua một cái là DỪNG XOAY ngay lập tức (triệt tiêu hoàn toàn quán tính).
  // - Bánh răng quay ĐÚNG CHIỀU (Cò quay thuận chiều kim đồng hồ -> Bánh răng quay ngược chiều kim đồng hồ).
  // - Khi quét hết 40° tiếp xúc, bánh răng xoay đúng 90° (PI/2 rad).
  private updateTriggers(dt: number) {
    const HALF_CONTACT_DEG = 20; // Vùng tiếp xúc cơ học 40 độ
    const GEAR_RATIO = (Math.PI / 2) / ((HALF_CONTACT_DEG * 2) * (Math.PI / 180)); // 2.25

    const cardinalDirs = [
      { dir: 'RIGHT', cardinalAngle: 0, dc: 1, dr: 0 },
      { dir: 'DOWN', cardinalAngle: 90, dc: 0, dr: 1 },
      { dir: 'LEFT', cardinalAngle: 180, dc: -1, dr: 0 },
      { dir: 'UP', cardinalAngle: 270, dc: 0, dr: -1 },
    ];

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const item = this.grid[r][c].item;
        if (!item || item.type !== 'TRIGGER') continue;

        let speedMultiplier = 1.0;
        this.getAdjacentCells(c, r).forEach(adj => {
          if (adj.item && adj.item.type === 'BUFF' && adj.item.buffKind === 'SPEED') {
            speedMultiplier += 0.20 * adj.item.level;
          }
          if (adj.item && adj.item.type === 'GUN' && adj.item.gunKind === 'AURA_SPEED') {
            speedMultiplier += 0.30 * adj.item.level;
          }
        });

        // Cò quay theo chiều kim đồng hồ (angle tăng dần)
        const speedDeg = item.rotationSpeed * speedMultiplier * 360;
        const dAngleDeg = speedDeg * dt;
        const prevAngle = item.angle;
        item.angle = (item.angle + dAngleDeg) % 360;

        // Xoay nẫy Cò theo chiều kim đồng hồ
        this.slotViews[r][c].baseSprite.rotation = (item.angle * Math.PI) / 180;

        const bladesCount = item.level;
        const bladeStep = 360 / bladesCount;

        for (let b = 0; b < bladesCount; b++) {
          const bladeAngle = (item.angle + b * bladeStep) % 360;
          const prevBladeAngle = (prevAngle + b * bladeStep) % 360;

          for (let d = 0; d < 4; d++) {
            const card = cardinalDirs[d];
            const targetCol = c + card.dc;
            const targetRow = r + card.dr;
            if (targetCol < 0 || targetCol >= this.COLS || targetRow < 0 || targetRow >= this.ROWS) continue;

            const targetCell = this.grid[targetRow][targetCol];
            if (!targetCell || !targetCell.item || targetCell.item.type !== 'GUN') continue;

            const gunItem = targetCell.item;
            // BỎ QUA TRỤ HÀO QUANG AURA: Cò không tiếp xúc va chạm bánh răng với Trụ Aura
            if (gunItem.gunKind && (gunItem.gunKind.startsWith('AURA_') || gunItem.gunKind === 'LUNAR')) continue;

            const gunView = this.slotViews[targetRow][targetCol];

            // Góc tương đối của nẫy so với hướng bánh răng [-180, 180)
            const diffPrev = ((prevBladeAngle - card.cardinalAngle + 540) % 360) - 180;
            const diffCurr = diffPrev + dAngleDeg;

            // Đoạn quét trong vùng tiếp xúc [-HALF_CONTACT_DEG, +HALF_CONTACT_DEG]
            const contactStart = Math.max(diffPrev, -HALF_CONTACT_DEG);
            const contactEnd = Math.min(diffCurr, HALF_CONTACT_DEG);

            if (contactStart < contactEnd) {
              const sweepDeg = contactEnd - contactStart;
              // QUAY ĐÚNG CHIỀU VÀ CHỈ QUAY KHI CHẠM:
              // Cò quay thuận chiều kim đồng hồ -> Bánh răng quay NGƯỢC chiều kim đồng hồ
              const dGearRad = -(sweepDeg * (Math.PI / 180)) * GEAR_RATIO;
              gunItem.gearAngle = (gunItem.gearAngle || 0) + dGearRad;
              gunView.baseSprite.rotation = gunItem.gearAngle;
            }

            // Khi chấu Cò vừa rời khỏi điểm chạm (+HALF_CONTACT_DEG): Dừng xoay ngay & nạp đạn
            if (diffPrev < HALF_CONTACT_DEG && diffCurr >= HALF_CONTACT_DEG) {
              this.onTriggerReleaseGun(targetCol, targetRow, gunItem);
            }
          }
        }
      }
    }
  }

  // Khi chấu Cò rời khỏi răng súng: nhả chấu, nạp đạn & kích hoạt bắn nếu đầy
  private onTriggerReleaseGun(targetCol: number, targetRow: number, item: GridItem) {
    let fillMultiplier = 1.0;
    this.getAdjacentCells(targetCol, targetRow).forEach(adj => {
      if (adj.item && adj.item.type === 'BUFF' && adj.item.buffKind === 'FILL') {
        fillMultiplier += 0.15 * adj.item.level;
      }
    });

    item.fill += item.fillPerHit * fillMultiplier;
    item.recoilOffset = 0;

    sound.playClick();

    if (item.fill >= 1.0) {
      item.fill -= 1.0;
      if (this.isWaveActive || this.enemies.length > 0) {
        this.fireGunTowardsTarget(targetCol, targetRow, item);
      }
    }
  }

  private updateGunsAndAim(dt: number) {
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const item = this.grid[r][c].item;
        const view = this.slotViews[r][c];

        if (item && item.type === 'GUN') {
          const gunWorldX = this.GRID_X + c * this.CELL_SIZE + 48;
          const gunWorldY = this.GRID_Y + r * this.CELL_SIZE + 48;

          let target = this.findBestTarget(gunWorldX, gunWorldY);

          if (target) {
            const dx = target.x - gunWorldX;
            const dy = target.y - gunWorldY;
            const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
            item.turretAngle = targetAngle;
            view.barrelSprite.rotation = targetAngle;
          }

          this.drawGunEnergyBar(view.fillG, item);
        }
      }
    }
  }

  // Vẽ thanh năng lượng của súng TO, DÀY, SÁNG RÕ có chia vạch nhịp gõ
  private drawGunEnergyBar(fillG: Graphics, item: GridItem) {
    const ratio = Math.min(1, Math.max(0, item.fill));
    const isReadySoon = ratio >= 0.85;

    fillG.clear();

    // 1. Khung viền ngoài tối dày nổi khối (x: -3..83, y: 63..82 -> rộng 86px, cao 19px)
    fillG.roundRect(-3, 63, 86, 19, 8);
    fillG.fill({ color: 0x090d16 });
    fillG.stroke({
      width: 2.5,
      color: isReadySoon ? 0xfacc15 : 0x475569,
    });

    // 2. Rãnh nền tối bên trong (x: 0..80, y: 66..79 -> rộng 80px, cao 13px)
    fillG.roundRect(0, 66, 80, 13, 5);
    fillG.fill({ color: 0x1e293b });

    // 3. Thanh năng lượng phát sáng (tối đa 78px x 11px)
    if (ratio > 0.01) {
      const maxW = 78;
      const fillW = Math.max(8, Math.round(ratio * maxW));
      const mainColor = isReadySoon ? 0xfacc15 : 0x22d3ee;
      const shineColor = isReadySoon ? 0xfef9c3 : 0xa5f3fc;

      fillG.roundRect(1, 67, fillW, 11, 4);
      fillG.fill({ color: mainColor });

      // Dải bóng kính phía trên giúp thanh năng lượng căng tròn 3D
      fillG.roundRect(2, 68, Math.max(4, fillW - 2), 4, 2);
      fillG.fill({ color: shineColor, alpha: 0.9 });
    }

    // 4. Vạch chia số nhịp gõ cần nạp (giúp nhìn rõ từng nấc năng lượng)
    const totalHits = Math.round(1 / (item.fillPerHit || 0.5));
    if (totalHits >= 2 && totalHits <= 8) {
      for (let i = 1; i < totalHits; i++) {
        const tx = Math.round((i / totalHits) * 78) + 1;
        fillG.rect(tx - 1, 66, 2, 13).fill({ color: 0x090d16, alpha: 0.75 });
      }
    }
  }

  private findBestTarget(gunX: number, gunY: number): Enemy | null {
    if (this.enemies.length === 0) return null;

    let bestEnemy: Enemy | null = null;
    let maxDangerScore = -999999;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.active) continue;

      const dist = Math.hypot(e.x - gunX, e.y - gunY);
      const dangerScore = e.y * 2 - dist * 0.5;

      if (dangerScore > maxDangerScore) {
        maxDangerScore = dangerScore;
        bestEnemy = e;
      }
    }

    return bestEnemy;
  }

  private fireGunTowardsTarget(col: number, row: number, gun: GridItem) {
    const gunX = this.GRID_X + col * this.CELL_SIZE + 48;
    const gunY = this.GRID_Y + row * this.CELL_SIZE + 48;

    let target = this.findBestTarget(gunX, gunY);

    let angle = -Math.PI / 2;
    if (target) {
      angle = Math.atan2(target.y - gunY, target.x - gunX);
    }

    let dmgMultiplier = 1.0;
    let critChance = 0.05;

    this.getAdjacentCells(col, row).forEach(adj => {
      if (adj.item && adj.item.type === 'BUFF') {
        if (adj.item.buffKind === 'DMG') dmgMultiplier += 0.20 * adj.item.level;
        if (adj.item.buffKind === 'CRIT') critChance += 0.10 * adj.item.level;
      }
      // Hào quang từ các Trụ Aura
      if (adj.item && adj.item.type === 'GUN') {
        if (adj.item.gunKind === 'AURA_DMG') dmgMultiplier += 0.30 * adj.item.level;
        if (adj.item.gunKind === 'AURA_CRIT') {
          critChance += 0.20;
          dmgMultiplier += 0.25;
        }
        if (adj.item.gunKind === 'LUNAR') {
          const lunarCount = this.countGunsOnGrid('LUNAR');
          if (lunarCount === 1 || lunarCount === 4 || lunarCount === 9) {
            dmgMultiplier += 1.0 * adj.item.level;
          } else {
            dmgMultiplier += 0.25 * adj.item.level;
          }
        }
      }
    });

    const isCrit = Math.random() < critChance;
    const finalDmg = Math.round(gun.damage * dmgMultiplier * (isCrit ? 2.0 : 1.0));
    const gunKind = gun.gunKind || 'PISTOL';

    // CÁC LOẠI TRỤ HÀO QUANG (AURA SUPPORT): Không bắn đạn, phát xung hào quang hỗ trợ
    if (gunKind.startsWith('AURA_') || gunKind === 'LUNAR') {
      const auraColor = gunKind === 'AURA_DMG' ? 0xef4444 : (gunKind === 'AURA_SPEED' ? 0x38bdf8 : (gunKind === 'AURA_CRIT' ? 0xf59e0b : 0x10b981));
      this.addShockwave(gunX, gunY, 55, auraColor);
      this.addSparks(gunX, gunY, 8, auraColor, 120);
      if (gunKind === 'AURA_ENERGY') {
        const spGain = 4 * gun.level;
        this.gold += spGain;
        this.goldText.text = `$: ${this.gold}`;
        this.updateRollButtonState();
        this.addFloatingText(gunX, gunY - 20, `+${spGain} SP! 💎`, '#10b981');
      }
      return;
    }

    // Âm thanh riêng biệt chuẩn xác từng loại súng!
    sound.playGunShot(gunKind);

    // Lóe sáng viền súng và đầu nòng
    const flashCol = this.getMuzzleFlashColor(gunKind);
    this.addMuzzleFlash(gunX + Math.cos(angle) * 34, gunY + Math.sin(angle) * 34, flashCol);

    // SÚNG BÍ ẨN MYSTERY (?): Bắn đạn dấu hỏi, tích lũy 10 phát bắn tự động biến hình!
    if (gunKind === 'MYSTERY') {
      gun.shotCounter = (gun.shotCounter || 0) + 1;
      this.addFloatingText(gunX, gunY - 18, `${gun.shotCounter}/10 ❓`, '#c084fc');
      const vx = Math.cos(angle) * 750;
      const vy = Math.sin(angle) * 750;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'MYSTERY', angle, 'MYSTERY', 1.25);
      if (gun.shotCounter >= 10) {
        this.transformMysteryGun(col, row, gun);
      }
      return;
    }

    // SÚNG COMBO: Tăng sát thương theo điểm combo toàn trận
    if (gunKind === 'COMBO') {
      const comboMult = 1 + (this.comboCount || 0) * 0.15;
      const cDmg = Math.round(finalDmg * comboMult);
      const vx = Math.cos(angle) * 820;
      const vy = Math.sin(angle) * 820;
      this.spawnBullet(gunX, gunY, vx, vy, cDmg, 1, 'NORMAL', angle, 'COMBO', 1.1);
      return;
    }

    // SÚNG CUỒNG NỘ BERSERKER: Thành càng mất máu súng bắn càng đau
    if (gunKind === 'BERSERKER') {
      const missingHpRatio = 1 - Math.max(0, this.castleHp) / this.maxCastleHp;
      const bDmg = Math.round(finalDmg * (1 + missingHpRatio * 2.0));
      const vx = Math.cos(angle) * 850;
      const vy = Math.sin(angle) * 850;
      this.spawnBullet(gunX, gunY, vx, vy, bDmg, 1, 'NORMAL', angle, 'BERSERKER', 1.15);
      return;
    }

    // SÚNG THÁI DƯƠNG SOLAR: Kích hoạt khi có đúng 1, 4 hoặc 9 súng Solar trên sân (x5 Sát Thương)
    if (gunKind === 'SOLAR') {
      const solarCount = this.countGunsOnGrid('SOLAR');
      const isSolarActive = solarCount === 1 || solarCount === 4 || solarCount === 9;
      const sDmg = isSolarActive ? finalDmg * 5 : finalDmg;
      const vx = Math.cos(angle) * 980;
      const vy = Math.sin(angle) * 980;
      const b = this.spawnBullet(gunX, gunY, vx, vy, sDmg, isSolarActive ? 4 : 2, 'FIRE', angle, 'SOLAR', isSolarActive ? 1.7 : 1.35);
      b.radius = isSolarActive ? 22 : 16;
      this.addShockwave(gunX + Math.cos(angle) * 25, gunY + Math.sin(angle) * 25, isSolarActive ? 55 : 35, 0xfacc15);
      this.addSparks(gunX, gunY, 12, 0xf97316, 180);
      return;
    }

    // SÚNG THÁNH QUANG HOLY: Triệu hồi 3 Thánh Giá Ánh Sáng cắm thẳng vào kẻ địch gây sát thương lớn và tỏa aura liên tục
    if (gunKind === 'HOLY') {
      this.summonHolyCrosses(gunX, gunY, target, finalDmg);
      return;
    }

    // SÚNG BÃO TUYẾT BLIZZARD: Triệu hồi bão tuyết đóng băng toàn bộ quái trên sân
    if (gunKind === 'BLIZZARD') {
      this.addShockwave(360, 400, 420, 0xbae6fd);
      this.addShockwave(360, 400, 260, 0x38bdf8);
      this.addSparks(360, 400, 32, 0x38bdf8, 220);
      for (const e of this.enemies) {
        if (!e.active) continue;
        e.freezeTimer = 1.6;
        e.hp -= finalDmg;
        this.addSparks(e.x, e.y, 4, 0xbae6fd, 80);
        if (e.hp <= 0) this.killEnemy(e);
      }
      return;
    }

    // SÚNG ĐỘC POISON: Bắn axit độc lây lan
    if (gunKind === 'POISON') {
      const vx = Math.cos(angle) * 750;
      const vy = Math.sin(angle) * 750;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'POISON', angle, 'POISON', 1.1);
      return;
    }

    // SÚNG GIÓ LỐC WIND: Đẩy lùi quái
    if (gunKind === 'WIND') {
      const vx = Math.cos(angle) * 800;
      const vy = Math.sin(angle) * 800;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 2, 'WIND', angle, 'WIND', 1.15);
      return;
    }

    // SÚNG THỢ SĂN BOUNTY: Bắn đạn tiền xu
    if (gunKind === 'BOUNTY') {
      const vx = Math.cos(angle) * 800;
      const vy = Math.sin(angle) * 800;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'BOUNTY', angle, 'BOUNTY', 1.05);
      return;
    }

    // SÚNG NGUYÊN TỬ NUCLEAR: Phóng đầu đạn hạt nhân cực nặng tạo miệng hố phóng xạ
    if (gunKind === 'NUCLEAR') {
      const vx = Math.cos(angle) * 520;
      const vy = Math.sin(angle) * 520;
      this.spawnBullet(gunX, gunY, vx, vy, Math.round(finalDmg * 1.6), 1, 'NUCLEAR', angle, 'NUCLEAR', 1.45);
      this.addShockwave(gunX + Math.cos(angle) * 35, gunY + Math.sin(angle) * 35, 45, 0x84cc16);
      this.addSparks(gunX, gunY, 10, 0xa3e635, 140);
      return;
    }

    // SÚNG LASER: Tia năng lượng quang học siêu thanh xuyên thủng toàn bộ chiến trường
    if (gunKind === 'LASER') {
      this.fireLaserBeam(gunX, gunY, angle, finalDmg);
      return;
    }

    // SÚNG MÌN MINE: Thả mìn cảm ứng nổ tung trên đường đi của quái
    if (gunKind === 'MINE') {
      let targetX = gunX + Math.cos(angle) * 230;
      let targetY = gunY + Math.sin(angle) * 230;
      if (target) {
        targetX = target.x + (Math.random() * 40 - 20);
        targetY = target.y + (Math.random() * 40 - 20);
      }
      this.spawnLandmine(Math.max(50, Math.min(670, targetX)), Math.max(100, Math.min(820, targetY)), Math.round(finalDmg * 2.2));
      this.addShockwave(gunX, gunY, 32, 0xef4444);
      return;
    }

    // SÚNG GAI THORN: Bắn chông gai tạo bãi gai độc làm chậm và gây chảy máu
    if (gunKind === 'THORN') {
      const vx = Math.cos(angle) * 800;
      const vy = Math.sin(angle) * 800;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'THORN', angle, 'THORN', 1.2);
      return;
    }

    // SÚNG CUỒNG PHONG TYPHOON: Lốc xoáy cuồng nộ khổng lồ cuốn phăng kẻ địch
    if (gunKind === 'TYPHOON') {
      const vx = Math.cos(angle) * 850;
      const vy = Math.sin(angle) * 850;
      const b = this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 5, 'TYPHOON', angle, 'TYPHOON', 1.65);
      b.radius = 24;
      b.rotationSpeed = 26;
      this.addShockwave(gunX + Math.cos(angle) * 20, gunY + Math.sin(angle) * 20, 36, 0x38bdf8);
      return;
    }

    // SÚNG THỜI GIAN TIME: Vòng ngưng đọng thời gian làm chậm kẻ địch
    if (gunKind === 'TIME') {
      let targetX = 360;
      let targetY = 360;
      if (target) {
        targetX = target.x;
        targetY = target.y;
      }
      this.spawnStasisField(targetX, targetY, 95, 4.0);
      this.addShockwave(gunX, gunY, 38, 0x06b6d4);
      return;
    }

    // SÚNG TỪ TRƯỜNG MAGNET: Khối cầu nam châm hút tụ quái và phá hủy giáp sắt
    if (gunKind === 'MAGNET') {
      const vx = Math.cos(angle) * 750;
      const vy = Math.sin(angle) * 750;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'MAGNET', angle, 'MAGNET', 1.25);
      return;
    }

    // SÚNG ÁM SÁT ASSASSIN: Triệu hồi Lưỡi Trảm Hư Không tử thần giáng thẳng xuống đầu mục tiêu mạnh nhất
    if (gunKind === 'ASSASSIN') {
      let bossTarget = this.enemies.find(e => e.active && (e.isBoss || e.isElite)) || target;
      if (bossTarget) {
        const assassinDmg = Math.round(finalDmg * 3.2);
        bossTarget.hp -= assassinDmg;
        bossTarget.hitFlashTimer = 0.20;
        this.addShockwave(bossTarget.x, bossTarget.y, 65, 0x9333ea);
        this.addShockwave(bossTarget.x, bossTarget.y, 40, 0xc084fc);
        this.addSparks(bossTarget.x, bossTarget.y, 22, 0xc084fc, 240);
        this.addFloatingText(bossTarget.x, bossTarget.y - 30, `⚔️ ASSASSIN CRIT! ${assassinDmg}`, '#c084fc');
        this.trauma = Math.min(1.0, this.trauma + 0.35);
        if (bossTarget.hp <= 0) this.killEnemy(bossTarget);
      }
      return;
    }

    // SÚNG HIẾN TẾ SACRIFICE: Bắn ra huyết thạch, tăng sát thương khi thành mất máu
    if (gunKind === 'SACRIFICE') {
      const vx = Math.cos(angle) * 820;
      const vy = Math.sin(angle) * 820;
      const missingRatio = 1 - Math.max(0, this.castleHp) / this.maxCastleHp;
      const sacDmg = Math.round(finalDmg * (1.3 + missingRatio * 1.5));
      this.spawnBullet(gunX, gunY, vx, vy, sacDmg, 2, 'NORMAL', angle, 'SACRIFICE', 1.2);
      return;
    }

    // SÚNG CƯA MÁY CHAINSAW: Đại cưa sắt nảy bật liên tục xé rách kẻ địch
    if (gunKind === 'CHAINSAW') {
      const vx = Math.cos(angle) * 780;
      const vy = Math.sin(angle) * 780;
      const b = this.spawnBullet(gunX, gunY, vx, vy, Math.round(finalDmg * 1.25), 6, 'SAW', angle, 'CHAINSAW', 1.5);
      b.radius = 20;
      b.rotationSpeed = 28;
      b.bouncesLeft = 3;
      this.addShockwave(gunX, gunY, 32, 0xef4444);
      return;
    }

    // SÚNG HỐ ĐEN BLACKHOLE: Phóng quả cầu kỳ dị chân trời sự kiện
    if (gunKind === 'BLACKHOLE') {
      const vx = Math.cos(angle) * 650;
      const vy = Math.sin(angle) * 650;
      const b = this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'BLACKHOLE', angle, 'BLACKHOLE', 1.5);
      b.radius = 22;
      this.addShockwave(gunX, gunY, 38, 0x9333ea);
      return;
    }

    // SÚNG LĂNG KÍNH PRISM: Phân tách chùm 5 tia tinh thể quang phổ cầu vồng
    if (gunKind === 'PRISM') {
      const offsets = [-0.22, -0.11, 0, 0.11, 0.22];
      offsets.forEach(off => {
        const a = angle + off;
        const spd = 900 + (Math.random() - 0.5) * 50;
        const b = this.spawnBullet(gunX, gunY, Math.cos(a) * spd, Math.sin(a) * spd, Math.round(finalDmg * 0.65), 2, 'NORMAL', a, 'PRISM', 1.25);
        b.radius = 14;
      });
      this.addShockwave(gunX + Math.cos(angle) * 20, gunY + Math.sin(angle) * 20, 35, 0xf472b6);
      return;
    }

    // SÚNG THIẾT GIÁP IRON: Sát thương giáp
    if (gunKind === 'IRON') {
      const vx = Math.cos(angle) * 900;
      const vy = Math.sin(angle) * 900;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 2, 'NORMAL', angle, 'IRON', 1.15);
      return;
    }

    // SÚNG SÉT TESLA: Sét giáng thẳng từ tầng mây bầu trời xuống đầu quái vật, giật lan sang quái lân cận
    if (gunKind === 'TESLA') {
      if (target) {
        target.hp -= finalDmg;
        target.hitFlashTimer = 0.14;
        this.addShockwave(target.x, target.y, 45, 0x38bdf8);
        this.addSparks(target.x, target.y, 10, 0x38bdf8, 160);
        this.addFloatingText(target.x, target.y - 18, `${finalDmg} ⚡`, '#38bdf8');
        if (target.hp <= 0) this.killEnemy(target);

        // Giật lan sang quái gần nhất
        let chainTarget: Enemy | null = null;
        for (const other of this.enemies) {
          if (!other.active || other === target) continue;
          const cDist = Math.hypot(other.x - target.x, other.y - target.y);
          if (cDist <= 180) {
            chainTarget = other;
            break;
          }
        }

        const skyX = target.x + (Math.random() * 40 - 20);
        const skyY = -30;

        if (chainTarget) {
          const chainDmg = Math.round(finalDmg * 0.7);
          chainTarget.hp -= chainDmg;
          chainTarget.hitFlashTimer = 0.14;
          this.addShockwave(chainTarget.x, chainTarget.y, 35, 0x38bdf8);
          this.addSparks(chainTarget.x, chainTarget.y, 8, 0x38bdf8, 140);
          this.addFloatingText(chainTarget.x, chainTarget.y - 18, `${chainDmg} ⚡`, '#a855f7');
          if (chainTarget.hp <= 0) this.killEnemy(chainTarget);

          this.lightningBolts.push({
            x1: skyX,
            y1: skyY,
            x2: target.x,
            y2: target.y,
            chainX: chainTarget.x,
            chainY: chainTarget.y,
            color: 0x38bdf8,
            lifetime: 0.20,
            maxLifetime: 0.20,
          });
        } else {
          this.lightningBolts.push({
            x1: skyX,
            y1: skyY,
            x2: target.x,
            y2: target.y,
            color: 0x38bdf8,
            lifetime: 0.20,
            maxLifetime: 0.20,
          });
        }
      }
      return;
    }

    // SÚNG THIÊN THẠCH METEOR: Gọi thiên thạch khổng lồ từ ngoài vũ trụ lao xé toạc bầu trời đè bẹp kẻ địch!
    if (gunKind === 'METEOR') {
      let targetX = 360;
      let targetY = 320;
      if (target) {
        targetX = target.x;
        targetY = target.y;
      } else {
        const activeEnemies = this.enemies.filter(e => e.active);
        if (activeEnemies.length > 0) {
          targetX = activeEnemies[0].x;
          targetY = activeEnemies[0].y;
        }
      }
      this.spawnFallingMeteor(targetX, targetY, finalDmg);
      return;
    }

    // SHOTGUN: Chùm 5 viên đạn chì tỏa rộng
    if (gunKind === 'SHOTGUN') {
      const offsets = [-0.24, -0.12, 0, 0.12, 0.24];
      offsets.forEach(off => {
        const a = angle + off;
        const spd = 780 + (Math.random() - 0.5) * 60;
        this.spawnBullet(
          gunX, gunY,
          Math.cos(a) * spd,
          Math.sin(a) * spd,
          Math.round(finalDmg * 0.45),
          1, 'NORMAL', a, 'SHOTGUN', 0.95
        );
      });
      return;
    }

    // SÚNG PHUN LỬA FLAMER: Bắn 1 quả cầu lửa cuồn cuộn bay thẳng tới mục tiêu
    if (gunKind === 'FLAMER') {
      const vx = Math.cos(angle) * 650;
      const vy = Math.sin(angle) * 650;
      this.spawnBullet(
        gunX, gunY,
        vx, vy,
        finalDmg,
        1, 'FIRE', angle, 'FLAMER', 1.35
      );
      return;
    }

    // SÚNG BẮN TỈA SNIPER: Đạn siêu thanh tốc độ cao xuyên giáp 4 quái
    if (gunKind === 'SNIPER') {
      const vx = Math.cos(angle) * 1600;
      const vy = Math.sin(angle) * 1600;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 4, 'NORMAL', angle, 'SNIPER', 1.2);
      return;
    }

    // NỎ THÉP CROSSBOW: Mũi tên sắt xuyên 3 quái
    if (gunKind === 'CROSSBOW') {
      const vx = Math.cos(angle) * 850;
      const vy = Math.sin(angle) * 850;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 3, 'NORMAL', angle, 'CROSSBOW', 1.0);
      return;
    }

    // ĐẠI BÁC BOM CANNON: Đạn pháo nổ lan
    if (gunKind === 'CANNON') {
      const vx = Math.cos(angle) * 650;
      const vy = Math.sin(angle) * 650;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'EXPLOSIVE', angle, 'CANNON', 1.1);
      return;
    }

    // NÁ CAO SU SLINGSHOT: Bắn đá cuội văng lùi
    if (gunKind === 'SLINGSHOT') {
      const vx = Math.cos(angle) * 720;
      const vy = Math.sin(angle) * 720;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'NORMAL', angle, 'SLINGSHOT', 1.0);
      return;
    }

    // MINIGUN: Xả bão đạn vonfram siêu thanh liên tục
    if (gunKind === 'MINIGUN') {
      const spreads = [-0.06, 0, 0.06];
      for (const sp of spreads) {
        const a = angle + sp;
        const spd = 1100 + (Math.random() - 0.5) * 80;
        const b = this.spawnBullet(gunX, gunY, Math.cos(a) * spd, Math.sin(a) * spd, Math.round(finalDmg * 0.45), 1, 'NORMAL', a, 'MINIGUN', 1.1);
        b.radius = 12;
      }
      this.addShockwave(gunX + Math.cos(angle) * 20, gunY + Math.sin(angle) * 20, 30, 0xfde047);
      this.addSparks(gunX, gunY, 6, 0xfacc15, 160);
      return;
    }

    // SÚNG BĂNG CRYO:
    if (gunKind === 'CRYO') {
      const vx = Math.cos(angle) * 780;
      const vy = Math.sin(angle) * 780;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'ICE', angle, 'CRYO', 1.0);
      return;
    }

    // Mặc định: SÚNG LỤC PISTOL
    const vx = Math.cos(angle) * 800;
    const vy = Math.sin(angle) * 800;
    this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'NORMAL', angle, 'PISTOL', 1.0);
  }

  private getMuzzleFlashColor(kind?: GunKind): number {
    switch (kind) {
      case 'TESLA': return 0x38bdf8;
      case 'CRYO': return 0xbae6fd;
      case 'FLAMER': return 0xf97316;
      case 'METEOR': return 0xef4444;
      case 'CANNON': return 0xf59e0b;
      case 'SHOTGUN': return 0xfbbf24;
      case 'SNIPER': return 0xe2e8f0;
      case 'MINIGUN': return 0xfde047;
      case 'CROSSBOW': return 0x60a5fa;
      case 'SLINGSHOT': return 0xd97706;
      case 'MYSTERY': return 0xc084fc;
      case 'MIMIC': return 0x38bdf8;
      case 'NUCLEAR': return 0xfacc15;
      case 'POISON': return 0x22c55e;
      case 'HOLY': return 0xfef08a;
      case 'BLACKHOLE': return 0x9333ea;
      case 'PRISM': return 0xf472b6;
      case 'SOLAR': return 0xf97316;
      case 'COMBO': return 0xef4444;
      case 'LASER': return 0x06b6d4;
      case 'MINE': return 0xef4444;
      case 'THORN': return 0x22c55e;
      case 'TYPHOON': return 0x38bdf8;
      case 'TIME': return 0x06b6d4;
      case 'CHAINSAW': return 0xef4444;
      case 'MAGNET': return 0x6366f1;
      case 'ASSASSIN': return 0xc084fc;
      case 'SACRIFICE': return 0xb91c1c;
      default: return 0xfacc15;
    }
  }

  private spawnBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    pierce: number,
    element: any,
    angle: number,
    gunKind: GunKind = 'PISTOL',
    scale: number = 1.0
  ): Bullet {
    const critRate = 0.05 + (this.saveData?.talents?.critRateLevel || 0) * 0.03;
    const isCrit = Math.random() < critRate;
    let finalDamage = damage;
    if (isCrit) {
      const critMult = 1.5 + (this.saveData?.talents?.critDmgLevel || 0) * 0.20;
      finalDamage = Math.round(damage * critMult);
    }

    const bullet: Bullet = {
      id: this.nextId++,
      gunKind,
      x,
      y,
      vx,
      vy,
      damage: finalDamage,
      pierce,
      element,
      active: true,
      radius: gunKind === 'NUCLEAR' ? 24 : (gunKind === 'METEOR' ? 18 : (gunKind === 'CANNON' || gunKind === 'FLAMER' || gunKind === 'TYPHOON' || gunKind === 'CHAINSAW' ? 14 : 10)),
      angle,
      scale: isCrit ? scale * 1.25 : scale,
    };
    this.bullets.push(bullet);
    return bullet;
  }

  private updateWave(dt: number) {
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.5, 1.6 - this.wave * 0.1);

    if (this.enemiesToSpawn > 0 && this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.enemiesToSpawn--;
      this.spawnRandomEnemy();
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.active) continue;

      let currentSpeed = e.speed;
      if (e.stasisTimer && e.stasisTimer > 0) {
        e.stasisTimer -= dt;
        currentSpeed *= 0.25;
      }
      if (e.freezeTimer && e.freezeTimer > 0) {
        e.freezeTimer -= dt;
        currentSpeed = 0;
      } else if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        currentSpeed *= 0.6;
      }
      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.hp -= 16 * dt;
        if (e.hp <= 0) {
          this.killEnemy(e);
          continue;
        }
      }
      if (e.bleedTimer && e.bleedTimer > 0) {
        e.bleedTimer -= dt;
        e.hp -= 22 * dt;
        if (e.hp <= 0) {
          this.killEnemy(e);
          continue;
        }
      }
      if (e.poisonTimer && e.poisonTimer > 0) {
        e.poisonTimer -= dt;
        e.hp -= 24 * dt;
        if (e.hp <= 0) {
          this.triggerAoeExplosion(e.x, e.y, 80, 30, 0x22c55e);
          this.addFloatingText(e.x, e.y, 'POISON BURST! ☠️', '#22c55e');
          this.killEnemy(e);
          continue;
        }
      }
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
      }

      // HIỆU ỨNG PHÓNG XẠ NGUYÊN TỬ: Địch bị nhiễm xạ quay ngược lại cắn xé đồng bọn!
      if (e.confuseTimer && e.confuseTimer > 0) {
        e.confuseTimer -= dt;
        // Quay đầu đi ngược về sau (xa khỏi thành trì)
        e.y = Math.max(70, e.y - currentSpeed * dt * 0.85);

        // Tìm 1 quái bạn lân cận trong phạm vi để cắn xé
        for (const other of this.enemies) {
          if (!other.active || other === e) continue;
          const edist = Math.hypot(other.x - e.x, other.y - e.y);
          if (edist <= 48) {
            const biteDmg = Math.max(3, Math.round(e.maxHp * 0.12));
            other.hp -= biteDmg;
            other.hitFlashTimer = 0.12;
            other.confuseTimer = Math.max(other.confuseTimer || 0, 2.5); // Cắn lây nhiễm phóng xạ sang bạn!
            this.addFloatingText(other.x, other.y - 18, `MUTANT BITE! ☣️ -${biteDmg}`, '#84cc16');
            this.addSparks(other.x, other.y, 6, 0x84cc16, 120);
            if (other.hp <= 0) this.killEnemy(other);
            break;
          }
        }
      } else {
        const dx = e.targetX - e.x;
        const dy = e.targetY - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          e.x += (dx / dist) * currentSpeed * dt * 0.4;
        }
        e.y += currentSpeed * dt;
      }

      if (e.y >= this.WALL_Y - 20) {
        e.active = false;
        const dmg = e.isBoss ? 35 : (e.kind === 'MINIBOSS' ? 22 : (e.kind === 'BOMBER' ? 18 : (e.isElite ? 15 : 8)));
        const armorRed = Math.min(0.70, (this.saveData.talents?.armorLevel || 0) * 0.04);
        let finalDmg = Math.max(1, Math.round(dmg * (1 - armorRed)));

        // Gai phản đòn (Thorns)
        const thorns = (this.saveData.talents?.thornsLevel || 0) * 25;
        if (thorns > 0) {
          this.addFloatingText(e.x, this.WALL_Y - 50, `-${thorns} 🌵 THORNS`, '#f97316');
        }

        // Khiên hộ mệnh (Shield Barrier)
        if (this.castleShield > 0) {
          if (this.castleShield >= finalDmg) {
            this.castleShield -= finalDmg;
            this.addFloatingText(360, this.WALL_Y - 40, `BLOCKED -${finalDmg} 🛡️`, '#38bdf8');
            finalDmg = 0;
          } else {
            finalDmg -= this.castleShield;
            this.addFloatingText(360, this.WALL_Y - 40, `SHIELD BROKEN 🛡️`, '#38bdf8');
            this.castleShield = 0;
          }
        }

        if (finalDmg > 0) {
          this.castleHp = Math.max(0, this.castleHp - finalDmg);
          this.addFloatingText(e.x, this.WALL_Y - 30, `-${finalDmg} HP`, '#ef4444');
        }
        this.trauma = Math.min(1.0, this.trauma + (e.kind === 'BOMBER' ? 0.5 : 0.4));
        sound.playExplode();
        if (e.kind === 'BOMBER') {
          this.addShockwave(e.x, this.WALL_Y - 20, 80, 0xef4444);
        }

        if (this.castleHp <= 0) {
          this.onGameOver();
        }
      }
    }

    this.enemies = this.enemies.filter(e => e.active);

    if (this.enemiesToSpawn === 0 && this.enemies.length === 0) {
      this.onWaveClear();
    }
  }

  private spawnRandomEnemy() {
    const x = 80 + Math.random() * 560;
    const y = 60;
    const targetX = 120 + Math.random() * 480;
    const targetY = this.WALL_Y;

    // Trùm cuối (Mega Boss) ở Wave 25 (hoặc mỗi 10 wave trong Sinh Tồn)
    const isMegaBoss = (this.gameMode === 'CAMPAIGN' && this.wave === this.maxWave && this.enemiesToSpawn === 0) ||
                       (this.gameMode === 'SURVIVAL' && this.wave % 10 === 0 && this.enemiesToSpawn === 0);

    // Mini Boss mỗi 5 Wave (Wave 5, 10, 15, 20)
    const isMiniBoss = !isMegaBoss && (
      (this.gameMode === 'CAMPAIGN' && this.wave % 5 === 0 && this.enemiesToSpawn === 0) ||
      (this.gameMode === 'SURVIVAL' && this.wave % 5 === 0 && this.enemiesToSpawn === 0)
    );

    let kind: EnemyKind = 'NORMAL';
    const roll = Math.random();

    if (isMegaBoss) {
      kind = 'BOSS';
    } else if (isMiniBoss) {
      kind = 'MINIBOSS';
    } else if (this.wave === 1) {
      kind = roll < 0.50 ? 'SWARM' : (roll < 0.85 ? 'RUNNER' : 'NORMAL');
    } else if (this.wave <= 3) {
      kind = roll < 0.35 ? 'SWARM' : (roll < 0.70 ? 'RUNNER' : 'NORMAL');
    } else if (this.wave <= 5) {
      // Bắt đầu có SHIELD che chắn đạn
      kind = roll < 0.30 ? 'NORMAL' : (roll < 0.55 ? 'RUNNER' : (roll < 0.80 ? 'SHIELD' : 'TANK'));
    } else if (this.wave <= 9) {
      // Xuất hiện BOMBER nổ tự sát
      kind = roll < 0.20 ? 'NORMAL' : (roll < 0.45 ? 'SHIELD' : (roll < 0.70 ? 'BOMBER' : (roll < 0.90 ? 'TANK' : 'ELITE')));
    } else if (this.wave <= 14) {
      kind = roll < 0.25 ? 'SHIELD' : (roll < 0.50 ? 'BOMBER' : (roll < 0.75 ? 'TANK' : (roll < 0.90 ? 'ELITE' : 'RUNNER')));
    } else if (this.wave <= 19) {
      kind = roll < 0.20 ? 'SHIELD' : (roll < 0.45 ? 'BOMBER' : (roll < 0.75 ? 'TANK' : 'ELITE'));
    } else if (this.wave <= 24) {
      kind = roll < 0.15 ? 'SHIELD' : (roll < 0.40 ? 'BOMBER' : (roll < 0.70 ? 'ELITE' : 'TANK'));
    } else {
      // Wave 25 (Quái hộ tống Mega Boss)
      kind = roll < 0.40 ? 'ELITE' : (roll < 0.70 ? 'TANK' : 'BOMBER');
    }

    let hpMultiplier = 1.0;
    let speed = 65;
    let bounty = 4;
    let width = 72;
    let height = 72;

    if (kind === 'SWARM') {
      hpMultiplier = 0.55;
      speed = 100;
      bounty = 2;
      width = 56;
      height = 56;
    } else if (kind === 'RUNNER') {
      hpMultiplier = 0.75;
      speed = 115;
      bounty = 3;
      width = 66;
      height = 66;
    } else if (kind === 'NORMAL') {
      hpMultiplier = 1.0;
      speed = 65;
      bounty = 4;
      width = 74;
      height = 74;
    } else if (kind === 'SHIELD') {
      hpMultiplier = 2.2;
      speed = 50;
      bounty = 8;
      width = 82;
      height = 82;
    } else if (kind === 'BOMBER') {
      hpMultiplier = 1.4;
      speed = 90;
      bounty = 7;
      width = 76;
      height = 76;
    } else if (kind === 'TANK') {
      hpMultiplier = 3.8;
      speed = 38;
      bounty = 12;
      width = 96;
      height = 96;
    } else if (kind === 'ELITE') {
      hpMultiplier = 6.2;
      speed = 52;
      bounty = 22;
      width = 104;
      height = 104;
    } else if (kind === 'MINIBOSS') {
      hpMultiplier = 10.0;
      speed = 32;
      bounty = 45;
      width = 126;
      height = 126;
    } else if (kind === 'BOSS') {
      hpMultiplier = 22.0;
      speed = 25;
      bounty = 100;
      width = 156;
      height = 156;
    }

    const mapScale = this.saveData.selectedCampaignMap === 3 ? 1.6 : (this.saveData.selectedCampaignMap === 2 ? 1.3 : 1.0);
    const baseHp = (45 + this.wave * 12) * Math.pow(1.14, this.wave - 1) * mapScale;
    const finalHp = Math.round(baseHp * hpMultiplier);

    this.enemies.push({
      id: this.nextId++,
      kind,
      x,
      y,
      targetX,
      targetY,
      hp: finalHp,
      maxHp: finalHp,
      speed,
      isBoss: kind === 'BOSS',
      isElite: kind === 'ELITE' || kind === 'MINIBOSS',
      bounty,
      active: true,
      width,
      height,
      slowTimer: 0,
      burnTimer: 0,
      hitFlashTimer: 0,
    });
  }

  private killEnemy(e: Enemy) {
    e.active = false;
    const bountyBonus = 1 + (this.saveData.talents?.bountyLevel || 0) * 0.08;
    const finalBounty = Math.round(e.bounty * bountyBonus);
    this.gold += finalBounty;
    this.addBattlePassPoints(1);
    this.addQuestProgress('kill_monsters', 1);

    sound.playExplode();
    const isMega = e.kind === 'BOSS';
    const isMini = e.kind === 'MINIBOSS';
    this.addShockwave(e.x, e.y, isMega ? 85 : (isMini ? 60 : 36), isMega ? 0xa855f7 : (isMini ? 0xf97316 : 0xfacc15));
    this.addSparks(e.x, e.y, isMega ? 20 : (isMini ? 14 : 8), isMega ? 0xa855f7 : (isMini ? 0xf97316 : 0xfacc15), 180);
    this.addFloatingText(e.x, e.y, `+${finalBounty}$`, '#facc15');

    // Quái Bomber nổ tự sát khi bị tiêu diệt, gây sát thương lan ra xung quanh
    if (e.kind === 'BOMBER') {
      this.triggerAoeExplosion(e.x, e.y, 90, Math.round(e.maxHp * 0.35), 0xef4444);
      this.trauma = Math.min(1.0, this.trauma + 0.3);
    }
  }

  private onWaveClear() {
    this.isWaveActive = false;
    this.prepPhase = true;

    this.addBattlePassPoints(10);
    this.addQuestProgress('clear_waves', 1);
    if (this.wave >= 10) {
      this.addQuestProgress('win_campaign', 1);
    }

    const waveBonus = 10 + this.wave * 2;
    this.gold += waveBonus;
    sound.playMerge();
    this.addFloatingText(360, 300, `WAVE ${this.wave} CLEARED! +${waveBonus}$`, '#4ade80');

    // Tự động sửa chữa thành trì (Regen Talent)
    const regen = (this.saveData.talents?.regenLevel || 0) * 15;
    if (regen > 0 && this.castleHp < this.maxCastleHp) {
      this.castleHp = Math.min(this.maxCastleHp, this.castleHp + regen);
      this.addFloatingText(360, this.WALL_Y + 40, `+${regen} HP REPAIRED 🔧`, '#4ade80');
    }

    if (this.gameMode === 'CAMPAIGN' && this.wave >= this.maxWave) {
      this.isVictory = true;
      sound.pauseBGM();
      sound.playVictory();
      this.showResultModal(true, this.wave);
      return;
    }

    this.wave++;
    const nextIsBoss = (this.gameMode === 'CAMPAIGN' && this.wave === 10) || (this.gameMode === 'SURVIVAL' && this.wave % 10 === 0);
    if (!nextIsBoss) {
      sound.playBGM('BATTLE');
    }
    this.drawStartWaveBtn(true);
    this.startWaveBtnText.text = `⚔ START WAVE ${this.wave}`;
    this.tipText.text = `Ready? Tap START WAVE ${this.wave}`;
    this.tipText.style.fill = '#facc15';
    this.waveText.text = this.gameMode === 'CAMPAIGN' 
      ? `STAGE ${this.saveData.selectedCampaignMap} - WAVE ${this.wave}/${this.maxWave} (PREP)`
      : `SURVIVAL - WAVE ${this.wave} (PREP)`;
    this.waveText.style.fill = '#60a5fa';
  }

  private onGameOver() {
    this.isGameOver = true;
    sound.pauseBGM();
    sound.playExplode();
    this.showResultModal(false, this.wave);
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!b.active) continue;

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.y < 30 || b.y > 1280 || b.x < 10 || b.x > 710) {
        if (b.bouncesLeft && b.bouncesLeft > 0 && (b.x <= 15 || b.x >= 705)) {
          b.vx = -b.vx;
          b.bouncesLeft--;
          this.addSparks(b.x, b.y, 6, 0xe2e8f0, 100);
          continue;
        }
        if (b.gunKind === 'FLAMER') {
          this.spawnFireZone(Math.max(40, Math.min(680, b.x)), Math.max(70, b.y), 70, b.damage, 3.5);
          this.addShockwave(b.x, b.y, 45, 0xf97316);
          this.addSparks(b.x, b.y, 10, 0xf97316, 140);
        } else if (b.gunKind === 'NUCLEAR') {
          this.spawnNuclearCrater(Math.max(60, Math.min(660, b.x)), Math.max(90, Math.min(780, b.y)), 115, b.damage, 6.0);
        } else if (b.gunKind === 'THORN') {
          this.spawnThornField(Math.max(50, Math.min(670, b.x)), Math.max(80, Math.min(800, b.y)), 65, b.damage, 4.5);
        } else if (b.gunKind === 'SOLAR') {
          this.triggerAoeExplosion(b.x, b.y, 85, b.damage, 0xfacc15);
          this.spawnFireZone(b.x, b.y, 70, Math.round(b.damage * 0.4), 2.5);
        }
        b.active = false;
        continue;
      }

      if (b.gunKind === 'BLACKHOLE') {
        for (const e of this.enemies) {
          if (!e.active) continue;
          const dist = Math.hypot(e.x - b.x, e.y - b.y);
          if (dist < 120) {
            e.x += (b.x - e.x) * 0.04;
            e.y += (b.y - e.y) * 0.04;
          }
        }
      }

      for (const e of this.enemies) {
        if (!e.active) continue;

        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const hitDist = b.radius + e.width / 2;

        if (dx * dx + dy * dy <= hitDist * hitDist) {
          // NUCLEAR: Nổ bom nguyên tử cực lớn & tạo hố lõm đất nhiễm phóng xạ
          if (b.gunKind === 'NUCLEAR' || b.element === 'NUCLEAR') {
            this.spawnNuclearCrater(b.x, b.y, 115, b.damage, 6.0);
            b.active = false;
            break;
          }
          // THORN: Bãi gai độc
          if (b.gunKind === 'THORN' || b.element === 'THORN') {
            this.spawnThornField(b.x, b.y, 65, b.damage, 4.5);
            b.active = false;
            break;
          }
          // FLAMER: Cầu lửa nổ & tạo vùng đất rực cháy thiêu đốt quái
          if (b.gunKind === 'FLAMER') {
            this.spawnFireZone(b.x, b.y, 70, b.damage, 3.5);
            this.addShockwave(b.x, b.y, 45, 0xf97316);
            this.addSparks(b.x, b.y, 14, 0xf97316, 160);
            sound.playHit();
            b.active = false;
            break;
          }
          // CANNON: Nổ bom diện rộng AOE
          if (b.gunKind === 'CANNON') {
            this.triggerAoeExplosion(b.x, b.y, 85, b.damage, 0xf97316);
            this.trauma = Math.min(1.0, this.trauma + 0.25);
            b.active = false;
            break;
          }
          // METEOR: Thiên thạch nổ hủy diệt khổng lồ
          if (b.gunKind === 'METEOR') {
            this.triggerAoeExplosion(b.x, b.y, 115, b.damage, 0xef4444);
            this.trauma = Math.min(1.0, this.trauma + 0.40);
            b.active = false;
            break;
          }
          // SOLAR: Cầu lửa Thái Dương nổ tung rực sáng & bùng cháy bãi dung nham
          if (b.gunKind === 'SOLAR') {
            this.triggerAoeExplosion(b.x, b.y, 85, b.damage, 0xfacc15);
            this.spawnFireZone(b.x, b.y, 70, Math.round(b.damage * 0.4), 2.5);
            this.trauma = Math.min(1.0, this.trauma + 0.20);
            b.active = false;
            break;
          }

          let finalDamage = b.damage;
          if (b.gunKind === 'IRON' && (e.kind === 'SHIELD' || e.kind === 'TANK')) {
            finalDamage = Math.round(b.damage * 2.5);
            this.addFloatingText(e.x, e.y - 32, 'ARMOR PIERCE x2.5! ⚙️', '#facc15');
          } else if (e.kind === 'SHIELD') {
            finalDamage = Math.max(1, Math.round(b.damage * 0.5));
            this.addFloatingText(e.x, e.y - 32, 'STEEL SHIELD -50%', '#38bdf8');
          }

          e.hp -= finalDamage;
          e.hitFlashTimer = 0.08;
          sound.playHit();
          this.addFloatingText(e.x + (Math.random() * 24 - 12), e.y - 16, `${finalDamage}`, e.kind === 'SHIELD' ? '#7dd3fc' : '#ffffff');

          if (b.gunKind === 'CRYO' || b.element === 'ICE') {
            e.slowTimer = 3.0;
            this.addShockwave(b.x, b.y, 35, 0x38bdf8);
            this.addSparks(b.x, b.y, 6, 0x38bdf8, 140);
          } else if (b.element === 'FIRE') {
            e.burnTimer = 3.5;
            this.addSparks(b.x, b.y, 5, 0xf97316, 120);
          } else if (b.gunKind === 'POISON' || b.element === 'POISON') {
            e.poisonTimer = 3.5;
            this.addSparks(b.x, b.y, 6, 0x22c55e, 140);
          } else if (b.gunKind === 'WIND' || b.element === 'WIND' || b.gunKind === 'TYPHOON' || b.element === 'TYPHOON') {
            e.y = Math.max(70, e.y - (b.gunKind === 'TYPHOON' ? 95 : 70));
            this.addShockwave(b.x, b.y, 45, 0x67e8f9);
          } else if (b.gunKind === 'CHAINSAW' || b.element === 'SAW') {
            e.bleedTimer = 3.0;
            this.addSparks(b.x, b.y, 8, 0xef4444, 150);
            this.addFloatingText(e.x, e.y - 14, 'BLEED! 🩸', '#ef4444');
          } else if (b.gunKind === 'LASER' || b.element === 'LASER') {
            this.addShockwave(b.x, b.y, 35, 0x06b6d4);
            this.addSparks(b.x, b.y, 6, 0x22d3ee, 140);
          } else if (b.gunKind === 'BOUNTY' || b.element === 'BOUNTY') {
            e.bounty = Math.round(e.bounty * 1.5);
            this.addFloatingText(e.x, e.y - 20, '+50% SP! 💰', '#facc15');
            this.addSparks(b.x, b.y, 5, 0xfacc15, 120);
          } else if (b.gunKind === 'BLACKHOLE' || b.element === 'BLACKHOLE') {
            this.spawnBlackHoleZone(b.x, b.y, 125, b.damage, 3.5);
          } else if (b.gunKind === 'MAGNET') {
            this.addShockwave(b.x, b.y, 85, 0x6366f1);
            for (const o of this.enemies) {
              if (o.active && Math.hypot(o.x - b.x, o.y - b.y) < 170) {
                o.x += (b.x - o.x) * 0.55;
                if (b.y < o.y) {
                  o.y += (b.y - o.y) * 0.45;
                }
              }
            }
          } else if (b.gunKind === 'SLINGSHOT') {
            e.y = Math.max(80, e.y - 20); // Đẩy lùi
            this.addSparks(b.x, b.y, 5, 0xa8a29e, 140);
          } else {
            this.addSparks(b.x, b.y, 4, 0xfde047, 120);
          }

          if (e.hp <= 0) {
            this.killEnemy(e);
          }

          b.pierce--;
          if (b.pierce <= 0) {
            b.active = false;
            break;
          }
        }
      }
    }

    this.bullets = this.bullets.filter(b => b.active);
  }

  private updateScreenShake(dt: number) {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - 1.5 * dt);
      const shake = this.trauma * this.trauma;
      this.stage.x = (Math.random() * 2 - 1) * 12 * shake;
      this.stage.y = (Math.random() * 2 - 1) * 8 * shake;
    } else {
      this.stage.x = 0;
      this.stage.y = 0;
    }
  }

  private addMuzzleFlash(x: number, y: number, color: number) {
    this.muzzleFlashes.push({
      x,
      y,
      radius: 18,
      color,
      lifetime: 0.08,
    });
  }

  private addShockwave(x: number, y: number, maxRadius: number, color: number) {
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius,
      color,
      alpha: 1.0,
      lifetime: 0.22,
      maxLifetime: 0.22,
    });
  }

  private addSparks(x: number, y: number, count: number, color: number, speed: number = 140) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.6 + Math.random() * 0.8);
      const lt = 0.25 + Math.random() * 0.2;
      this.visualSparks.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        alpha: 1.0,
        size: 3 + Math.random() * 3,
        lifetime: lt,
        maxLifetime: lt,
      });
    }
  }

  private spawnFireZone(x: number, y: number, radius: number, damage: number, duration: number = 3.5) {
    this.fireZones.push({
      x,
      y,
      radius,
      damage,
      lifetime: duration,
      maxLifetime: duration,
      tickTimer: 0.05,
    });
  }

  private updateFireZones(dt: number) {
    for (let i = this.fireZones.length - 1; i >= 0; i--) {
      const fz = this.fireZones[i];
      fz.lifetime -= dt;
      if (fz.lifetime <= 0) {
        this.fireZones.splice(i, 1);
        continue;
      }

      fz.tickTimer -= dt;
      if (fz.tickTimer <= 0) {
        fz.tickTimer = 0.25; // 4 nhịp sát thương mỗi giây

        for (const e of this.enemies) {
          if (!e.active) continue;
          const dist = Math.hypot(e.x - fz.x, e.y - fz.y);
          if (dist <= fz.radius + e.width * 0.35) {
            const tickDmg = Math.max(1, Math.round(fz.damage * 0.28));
            e.hp -= tickDmg;
            e.hitFlashTimer = 0.08;
            e.burnTimer = 2.0;

            this.addFloatingText(
              e.x + (Math.random() * 20 - 10),
              e.y - 14,
              `${tickDmg} 🔥`,
              '#f97316'
            );

            if (e.hp <= 0) {
              this.killEnemy(e);
            }
          }
        }

        // Tán tia lửa bốc lên định kỳ
        this.addSparks(
          fz.x + (Math.random() - 0.5) * fz.radius,
          fz.y + (Math.random() - 0.5) * (fz.radius * 0.6),
          2,
          0xfacc15,
          60
        );
      }
    }
  }

  private spawnBlackHoleZone(x: number, y: number, radius: number, damage: number, duration: number = 3.5) {
    this.blackHoleZones.push({
      x,
      y,
      radius,
      damage,
      lifetime: duration,
      maxLifetime: duration,
      tickTimer: 0.05,
    });
    this.addShockwave(x, y, radius, 0xa855f7);
    this.addSparks(x, y, 16, 0xc084fc, 180);
  }

  private updateBlackHoleZones(dt: number) {
    for (let i = this.blackHoleZones.length - 1; i >= 0; i--) {
      const bh = this.blackHoleZones[i];
      bh.lifetime -= dt;
      if (bh.lifetime <= 0) {
        this.blackHoleZones.splice(i, 1);
        continue;
      }

      // Mỗi frame: Hút địch trong bán kính vào tâm + làm chậm cực mạnh (KHÔNG kéo về phía thành!)
      for (const e of this.enemies) {
        if (!e.active) continue;
        const dx = bh.x - e.x;
        const dy = bh.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= bh.radius + e.width * 0.4) {
          // Làm chậm cực mạnh (giảm tốc độ di chuyển)
          e.freezeTimer = Math.max(e.freezeTimer || 0, 0.4);

          // Hút ngang vào tâm hố đen
          e.x += (dx / Math.max(dist, 1)) * Math.min(dist, 110 * dt);

          // Hút dọc: NẾU quái ở phía dưới hố đen (gần thành hơn), KÉO NGƯỢC LÊN XA THÀNH!
          // NẾU quái ở phía trên hố đen, hãm chặt tại chỗ, TUYỆT ĐỐI KHÔNG KÉO LAO VỀ PHÍA THÀNH
          if (dy < 0) {
            e.y += (dy / Math.max(dist, 1)) * Math.min(dist, 130 * dt); // Kéo giật lùi về sau ra xa thành!
          } else {
            e.y += (dy / Math.max(dist, 1)) * Math.min(dist, 12 * dt); // Hãm chặt tại rìa hố đen
          }
        }
      }

      // Mỗi 0.25s: Gây sát thương nghiền nát liên tục
      bh.tickTimer -= dt;
      if (bh.tickTimer <= 0) {
        bh.tickTimer = 0.25; // 4 nhịp sát thương mỗi giây

        for (const e of this.enemies) {
          if (!e.active) continue;
          const dist = Math.hypot(e.x - bh.x, e.y - bh.y);
          if (dist <= bh.radius + e.width * 0.4) {
            const tickDmg = Math.max(1, Math.round(bh.damage * 0.35));
            e.hp -= tickDmg;
            e.hitFlashTimer = 0.08;

            this.addFloatingText(
              e.x + (Math.random() * 20 - 10),
              e.y - 14,
              `${tickDmg} 🕳️`,
              '#c084fc'
            );

            if (e.hp <= 0) {
              this.killEnemy(e);
            }
          }
        }
      }
    }
  }

  private spawnNuclearCrater(x: number, y: number, radius: number, damage: number, duration: number = 6.0) {
    this.nuclearCraters.push({
      x,
      y,
      radius,
      damage,
      lifetime: duration,
      maxLifetime: duration,
      tickTimer: 0.05,
    });
    this.addShockwave(x, y, radius * 1.5, 0xfacc15);
    this.addShockwave(x, y, radius * 0.9, 0x84cc16);
    this.addSparks(x, y, 28, 0x84cc16, 260);
    this.addSparks(x, y, 20, 0xfacc15, 220);
    this.trauma = Math.min(1.0, this.trauma + 0.85);
    sound.playExplode();

    // Sát thương nổ ban đầu cực mạnh + nhiễm phóng xạ cho toàn bộ quái trong phạm vi
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist <= radius * 1.25) {
        const blastDmg = Math.round(damage * 1.6 * (1 - (dist / (radius * 1.5)) * 0.4));
        e.hp -= blastDmg;
        e.hitFlashTimer = 0.15;
        e.confuseTimer = 5.0; // Nhiễm phóng xạ!
        this.addFloatingText(e.x, e.y - 20, `${blastDmg} ☢️ NUKE!`, '#84cc16');
        if (e.hp <= 0) this.killEnemy(e);
      }
    }
  }

  private updateNuclearCraters(dt: number) {
    for (let i = this.nuclearCraters.length - 1; i >= 0; i--) {
      const nc = this.nuclearCraters[i];
      nc.lifetime -= dt;
      if (nc.lifetime <= 0) {
        this.nuclearCraters.splice(i, 1);
        continue;
      }

      nc.tickTimer -= dt;
      if (nc.tickTimer <= 0) {
        nc.tickTimer = 0.3; // Radiation DoT tick

        for (const e of this.enemies) {
          if (!e.active) continue;
          const dist = Math.hypot(e.x - nc.x, e.y - nc.y);
          if (dist <= nc.radius + e.width * 0.35) {
            const radDmg = Math.max(1, Math.round(nc.damage * 0.32));
            e.hp -= radDmg;
            e.hitFlashTimer = 0.08;
            e.confuseTimer = 4.5; // Giữ trạng thái nhiễm xạ quay lại cắn nhau!
            this.addFloatingText(e.x + (Math.random() * 20 - 10), e.y - 14, `${radDmg} ☢️`, '#a3e635');
            if (e.hp <= 0) this.killEnemy(e);
          }
        }

        // Bọt khí phóng xạ nổi lên
        this.addSparks(
          nc.x + (Math.random() - 0.5) * nc.radius * 1.2,
          nc.y + (Math.random() - 0.5) * nc.radius * 0.8,
          2,
          0x84cc16,
          80
        );
      }
    }
  }

  private spawnLandmine(x: number, y: number, damage: number) {
    this.landmines.push({
      id: this.nextId++,
      x,
      y,
      damage,
      radius: 42,
      active: true,
    });
    this.addSparks(x, y, 6, 0xef4444, 90);
  }

  private updateLandmines(dt: number) {
    for (let i = this.landmines.length - 1; i >= 0; i--) {
      const lm = this.landmines[i];
      if (!lm.active) {
        this.landmines.splice(i, 1);
        continue;
      }

      for (const e of this.enemies) {
        if (!e.active) continue;
        const dist = Math.hypot(e.x - lm.x, e.y - lm.y);
        if (dist <= lm.radius) {
          lm.active = false;
          this.triggerAoeExplosion(lm.x, lm.y, 95, lm.damage, 0xef4444);
          this.addShockwave(lm.x, lm.y, 75, 0xf97316);
          this.addFloatingText(lm.x, lm.y - 15, 'MINE BOOM! 💥', '#ef4444');
          this.trauma = Math.min(1.0, this.trauma + 0.35);
          sound.playExplode();
          break;
        }
      }
    }
  }

  private spawnThornField(x: number, y: number, radius: number, damage: number, duration: number = 4.5) {
    this.thornFields.push({
      x,
      y,
      radius,
      damage,
      lifetime: duration,
      maxLifetime: duration,
      tickTimer: 0.1,
    });
    this.addShockwave(x, y, radius, 0x15803d);
    this.addSparks(x, y, 10, 0x22c55e, 100);
  }

  private updateThornFields(dt: number) {
    for (let i = this.thornFields.length - 1; i >= 0; i--) {
      const tf = this.thornFields[i];
      tf.lifetime -= dt;
      if (tf.lifetime <= 0) {
        this.thornFields.splice(i, 1);
        continue;
      }

      for (const e of this.enemies) {
        if (!e.active) continue;
        const dist = Math.hypot(e.x - tf.x, e.y - tf.y);
        if (dist <= tf.radius) {
          e.slowTimer = Math.max(e.slowTimer, 0.5);
        }
      }

      tf.tickTimer -= dt;
      if (tf.tickTimer <= 0) {
        tf.tickTimer = 0.35;
        for (const e of this.enemies) {
          if (!e.active) continue;
          const dist = Math.hypot(e.x - tf.x, e.y - tf.y);
          if (dist <= tf.radius) {
            const thornDmg = Math.max(1, Math.round(tf.damage * 0.25));
            e.hp -= thornDmg;
            e.bleedTimer = 2.0;
            e.hitFlashTimer = 0.08;
            this.addFloatingText(e.x, e.y - 10, `${thornDmg} 🌵`, '#16a34a');
            if (e.hp <= 0) this.killEnemy(e);
          }
        }
      }
    }
  }

  private spawnStasisField(x: number, y: number, radius: number, duration: number = 4.0) {
    this.stasisFields.push({
      x,
      y,
      radius,
      lifetime: duration,
      maxLifetime: duration,
    });
    this.addShockwave(x, y, radius, 0x06b6d4);
    this.addSparks(x, y, 14, 0x22d3ee, 120);
  }

  private updateStasisFields(dt: number) {
    for (let i = this.stasisFields.length - 1; i >= 0; i--) {
      const sf = this.stasisFields[i];
      sf.lifetime -= dt;
      if (sf.lifetime <= 0) {
        this.stasisFields.splice(i, 1);
        continue;
      }

      for (const e of this.enemies) {
        if (!e.active) continue;
        const dist = Math.hypot(e.x - sf.x, e.y - sf.y);
        if (dist <= sf.radius) {
          e.stasisTimer = Math.max(e.stasisTimer || 0, 0.4);
        }
      }
    }
  }

  // --- TRIỆU HỒI 3 THÁNH GIÁ ÁNH SÁNG (HOLY CROSSES) ---
  private summonHolyCrosses(gunX: number, gunY: number, primaryTarget: Enemy | null, baseDamage: number) {
    sound.playGunShot('HOLY');
    this.addShockwave(gunX, gunY, 45, 0xfef08a);
    this.addSparks(gunX, gunY, 14, 0xfef08a, 200);

    const targetPositions: { x: number; y: number }[] = [];
    const activeEnemies = this.enemies.filter(e => e.active);

    if (primaryTarget && primaryTarget.active) {
      targetPositions.push({ x: primaryTarget.x, y: primaryTarget.y });
      const otherEnemies = activeEnemies
        .filter(e => e !== primaryTarget)
        .sort((a, b) => {
          const distA = Math.hypot(a.x - primaryTarget.x, a.y - primaryTarget.y);
          const distB = Math.hypot(b.x - primaryTarget.x, b.y - primaryTarget.y);
          return distA - distB;
        });

      if (otherEnemies.length >= 2) {
        targetPositions.push({ x: otherEnemies[0].x, y: otherEnemies[0].y });
        targetPositions.push({ x: otherEnemies[1].x, y: otherEnemies[1].y });
      } else if (otherEnemies.length === 1) {
        targetPositions.push({ x: otherEnemies[0].x, y: otherEnemies[0].y });
        targetPositions.push({ x: primaryTarget.x + (Math.random() * 60 - 30), y: primaryTarget.y + 45 });
      } else {
        targetPositions.push({ x: primaryTarget.x - 45, y: primaryTarget.y + 25 });
        targetPositions.push({ x: primaryTarget.x + 45, y: primaryTarget.y - 25 });
      }
    } else if (activeEnemies.length > 0) {
      for (let i = 0; i < Math.min(3, activeEnemies.length); i++) {
        targetPositions.push({ x: activeEnemies[i].x, y: activeEnemies[i].y });
      }
      while (targetPositions.length < 3) {
        const base = targetPositions[0];
        targetPositions.push({ x: base.x + (Math.random() * 80 - 40), y: base.y + (Math.random() * 60 - 30) });
      }
    } else {
      targetPositions.push({ x: 360, y: 320 });
      targetPositions.push({ x: 300, y: 360 });
      targetPositions.push({ x: 420, y: 360 });
    }

    // Triệu hồi đúng 3 Thánh Giá Ánh Sáng
    for (let cIdx = 0; cIdx < 3; cIdx++) {
      const pos = targetPositions[cIdx];
      const cross: HolyCross = {
        id: this.nextId++,
        x: Math.max(50, Math.min(670, pos.x)),
        y: Math.max(90, Math.min(840, pos.y)),
        damage: baseDamage,
        lifetime: 3.5,
        maxLifetime: 3.5,
        tickTimer: 0.25,
        radius: 85,
        fallProgress: 0,
      };
      this.holyCrosses.push(cross);

      // Cột sóng chấn động thần thánh
      this.addShockwave(cross.x, cross.y, cross.radius * 1.3, 0xfacc15);
      this.addShockwave(cross.x, cross.y, cross.radius * 0.75, 0xffffff);
      this.addSparks(cross.x, cross.y, 18, 0xfef08a, 240);

      // Sát thương cắm kiếm ban đầu cực mạnh (% max HP)
      for (const e of this.enemies) {
        if (!e.active) continue;
        const dist = Math.hypot(e.x - cross.x, e.y - cross.y);
        if (dist <= cross.radius * 0.8) {
          const impactDmg = Math.round(baseDamage * 1.8 + e.maxHp * 0.08);
          e.hp -= impactDmg;
          e.hitFlashTimer = 0.16;
          this.addFloatingText(e.x + (Math.random() * 20 - 10), e.y - 25, `${impactDmg} ✝️ HOLY SMITE!`, '#fef08a');
          if (e.hp <= 0) this.killEnemy(e);
        }
      }
    }

    this.trauma = Math.min(1.0, this.trauma + 0.40);
  }

  private updateHolyCrosses(dt: number) {
    for (let i = this.holyCrosses.length - 1; i >= 0; i--) {
      const hc = this.holyCrosses[i];
      hc.lifetime -= dt;
      if (hc.lifetime <= 0) {
        this.holyCrosses.splice(i, 1);
        continue;
      }

      if (hc.fallProgress < 1.0) {
        hc.fallProgress = Math.min(1.0, hc.fallProgress + dt * 6.5);
      }

      hc.tickTimer -= dt;
      if (hc.tickTimer <= 0) {
        hc.tickTimer = 0.25;

        // Aura sát thương thiêu đốt liên tục
        for (const e of this.enemies) {
          if (!e.active) continue;
          const dist = Math.hypot(e.x - hc.x, e.y - hc.y);
          if (dist <= hc.radius + e.width * 0.3) {
            const auraDmg = Math.max(1, Math.round(hc.damage * 0.32 + e.maxHp * 0.015));
            e.hp -= auraDmg;
            e.hitFlashTimer = 0.06;
            this.addFloatingText(e.x + (Math.random() * 20 - 10), e.y - 12, `${auraDmg} ✝️`, '#fde047');
            if (e.hp <= 0) this.killEnemy(e);
          }
        }

        // Bụi ánh sáng thần thánh bay lên
        this.addSparks(
          hc.x + (Math.random() - 0.5) * hc.radius,
          hc.y + (Math.random() - 0.5) * hc.radius * 0.65,
          2,
          0xffffff,
          90
        );
      }
    }
  }

  // --- TIA NĂNG LƯỢNG QUANG HỌC (OPTICAL LASER BEAM) ---
  private fireLaserBeam(gunX: number, gunY: number, angle: number, damage: number) {
    const beamDist = 1300;
    const x2 = gunX + Math.cos(angle) * beamDist;
    const y2 = gunY + Math.sin(angle) * beamDist;

    this.laserBeams.push({
      x1: gunX,
      y1: gunY,
      x2,
      y2,
      damage,
      lifetime: 0.22,
      maxLifetime: 0.22,
      color: 0x06b6d4,
    });

    sound.playGunShot('LASER');
    this.addShockwave(gunX + Math.cos(angle) * 30, gunY + Math.sin(angle) * 30, 42, 0x06b6d4);
    this.addSparks(gunX, gunY, 12, 0x22d3ee, 180);

    // Sát thương toàn bộ kẻ địch cắt ngang qua tia laser
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dist = this.distPointToSegment(e.x, e.y, gunX, gunY, x2, y2);
      if (dist <= e.width / 2 + 18) {
        const laserDmg = Math.round(damage * 1.5);
        e.hp -= laserDmg;
        e.hitFlashTimer = 0.16;
        this.addSparks(e.x, e.y, 8, 0x06b6d4, 180);
        this.addFloatingText(e.x + (Math.random() * 20 - 10), e.y - 18, `${laserDmg} ⚡ LASER`, '#38bdf8');
        if (e.hp <= 0) this.killEnemy(e);
      }
    }
    this.trauma = Math.min(1.0, this.trauma + 0.25);
  }

  private updateLaserBeams(dt: number) {
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const lb = this.laserBeams[i];
      lb.lifetime -= dt;
      if (lb.lifetime <= 0) {
        this.laserBeams.splice(i, 1);
      }
    }
  }

  private distPointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY);
  }

  private spawnFallingMeteor(targetX: number, targetY: number, damage: number) {
    const startX = targetX - 140 + (Math.random() * 60 - 30);
    const startY = -140;
    this.fallingMeteors.push({
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      progress: 0,
      speed: 1.85, // Rơi trong khoảng ~0.54s
      damage,
      radius: 30, // Khối thiên thạch khổng lồ
      active: true,
    });
    sound.playGunShot('METEOR');
    // Báo động hồng tâm tại điểm va chạm
    this.addShockwave(targetX, targetY, 65, 0xef4444);
  }

  private updateFallingMeteors(dt: number) {
    for (let i = this.fallingMeteors.length - 1; i >= 0; i--) {
      const m = this.fallingMeteors[i];
      if (!m.active) {
        this.fallingMeteors.splice(i, 1);
        continue;
      }

      m.progress += dt * m.speed;
      m.currentX = m.startX + (m.targetX - m.startX) * m.progress;
      m.currentY = m.startY + (m.targetY - m.startY) * m.progress;

      // Nhả tàn tro và tia lửa trên đường lao xuống
      if (Math.random() < 0.7) {
        this.addSparks(m.currentX, m.currentY, 3, 0xf97316, 110);
        this.addSparks(m.currentX, m.currentY, 2, 0xfde047, 80);
      }

      if (m.progress >= 1.0) {
        m.active = false;
        // Va chạm hủy diệt mặt đất!
        this.triggerAoeExplosion(m.targetX, m.targetY, 150, m.damage, 0xef4444);
        // Để lại vùng đất bốc cháy thiêu đốt trong 4 giây
        this.spawnFireZone(m.targetX, m.targetY, 120, Math.round(m.damage * 0.45), 4.0);

        this.addShockwave(m.targetX, m.targetY, 170, 0xf97316);
        this.addShockwave(m.targetX, m.targetY, 95, 0xfde047);
        this.addSparks(m.targetX, m.targetY, 32, 0xfde047, 280);
        this.trauma = Math.min(1.0, this.trauma + 0.65); // Rung chuyển màn hình dữ dội
        this.fallingMeteors.splice(i, 1);
      }
    }
  }

  private triggerAoeExplosion(x: number, y: number, radius: number, damage: number, color: number) {
    this.addShockwave(x, y, radius, color);
    this.addSparks(x, y, 16, color, 220);
    sound.playExplode();
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist <= radius) {
        const falloff = 1.0 - (dist / radius) * 0.4;
        const finalDmg = Math.round(damage * falloff);
        e.hp -= finalDmg;
        e.hitFlashTimer = 0.12;
        this.addFloatingText(e.x, e.y - 14, `${finalDmg}`, color === 0xef4444 ? '#ef4444' : '#f97316');
        if (e.hp <= 0) {
          this.killEnemy(e);
        }
      }
    }
  }

  private drawJaggedLightning(g: Graphics, x1: number, y1: number, x2: number, y2: number, color: number, alpha: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 5) return;

    const segments = Math.max(4, Math.floor(dist / 22));
    const nx = -dy / dist;
    const ny = dx / dist;

    const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const jitter = (Math.random() * 2 - 1) * 16 * (1 - Math.abs(t - 0.5) * 0.8);
      points.push({
        x: x1 + dx * t + nx * jitter,
        y: y1 + dy * t + ny * jitter,
      });
    }
    points.push({ x: x2, y: y2 });

    // Outer glow
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.stroke({ width: 4.5, color, alpha: alpha * 0.75 });

    // Inner bright core
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.stroke({ width: 1.8, color: 0xffffff, alpha: Math.min(1.0, alpha * 1.2) });
  }

  private updateSpecialFX(dt: number) {
    this.fxGraphics.clear();

    // 0. Vùng đất rực lửa thiêu đốt (Fire Zones)
    for (let i = 0; i < this.fireZones.length; i++) {
      const fz = this.fireZones[i];
      const progress = fz.lifetime / fz.maxLifetime;
      const alpha = Math.min(1.0, progress * 1.5);
      const pulse = 1.0 + Math.sin(Date.now() * 0.008 + i * 2) * 0.08;

      // Quầng nhiệt đỏ rực phía ngoài
      this.fxGraphics.circle(fz.x, fz.y, fz.radius * pulse);
      this.fxGraphics.fill({ color: 0xef4444, alpha: alpha * 0.24 });
      this.fxGraphics.stroke({ width: 2.5, color: 0xf97316, alpha: alpha * 0.65 });

      // Lớp lửa cam nóng ở giữa
      this.fxGraphics.circle(fz.x, fz.y, fz.radius * 0.7 * pulse);
      this.fxGraphics.fill({ color: 0xf97316, alpha: alpha * 0.42 });

      // Lõi lửa vàng rực sáng ở tâm
      this.fxGraphics.circle(fz.x, fz.y, fz.radius * 0.35 * pulse);
      this.fxGraphics.fill({ color: 0xfde047, alpha: alpha * 0.6 });

      // Đốm lửa ngẫu nhiên bập bùng
      for (let f = 0; f < 3; f++) {
        const fa = (Date.now() * 0.005 + f * 2.1) % (Math.PI * 2);
        const fr = (fz.radius * 0.45) * Math.sin(Date.now() * 0.003 + f);
        const fx = fz.x + Math.cos(fa) * fr;
        const fy = fz.y + Math.sin(fa) * (fr * 0.7);
        this.fxGraphics.circle(fx, fy, 4 * pulse);
        this.fxGraphics.fill({ color: 0xffffff, alpha: alpha * 0.75 });
      }
    }

    // 0.5. Vùng Hố Đen Vũ Trụ (Black Hole Zones)
    for (let i = 0; i < this.blackHoleZones.length; i++) {
      const bh = this.blackHoleZones[i];
      const progress = bh.lifetime / bh.maxLifetime;
      const alpha = Math.min(1.0, progress * 1.6);
      const now = Date.now() * 0.004;

      // 1. Quầng biến dạng không-thời gian ngoài cùng (Gravitational distortion aura)
      const outerPulse = 1.0 + Math.sin(now * 2 + i) * 0.06;
      this.fxGraphics.circle(bh.x, bh.y, bh.radius * outerPulse);
      this.fxGraphics.fill({ color: 0x581c87, alpha: alpha * 0.22 });
      this.fxGraphics.stroke({ width: 2.2, color: 0xa855f7, alpha: alpha * 0.65 });

      // 2. Đĩa bồi tụ xoáy (Accretion Disk) - 2 vòng xoắn neon cyan & purple
      for (let ring = 0; ring < 2; ring++) {
        const ringRad = bh.radius * (0.65 + ring * 0.22);
        this.fxGraphics.circle(bh.x, bh.y, ringRad);
        this.fxGraphics.stroke({
          width: 2.0,
          color: ring === 0 ? 0xc084fc : 0x38bdf8,
          alpha: alpha * 0.45
        });
      }

      // Hạt plasma xoay quanh chân trời sự kiện
      for (let p = 0; p < 6; p++) {
        const angle = now * (3 + (p % 2)) + (p * Math.PI) / 3;
        const dist = bh.radius * (0.4 + (p % 3) * 0.2);
        const px = bh.x + Math.cos(angle) * dist;
        const py = bh.y + Math.sin(angle) * (dist * 0.65); // Nghiêng góc 3D
        this.fxGraphics.circle(px, py, 3);
        this.fxGraphics.fill({ color: p % 2 === 0 ? 0x38bdf8 : 0xf472b6, alpha: alpha * 0.85 });
      }

      // 3. Vòng phát sáng lượng tử (Photon Sphere)
      this.fxGraphics.circle(bh.x, bh.y, bh.radius * 0.32);
      this.fxGraphics.stroke({ width: 3.5, color: 0xe879f9, alpha: alpha * 0.9 });

      // 4. Lõi hắc ám chân trời sự kiện (Singularity / Event Horizon - Đen thẳm)
      this.fxGraphics.circle(bh.x, bh.y, bh.radius * 0.28);
      this.fxGraphics.fill({ color: 0x070312, alpha: alpha * 0.98 });
    }

    // 0.6. Hố Bom Hạt Nhân Phóng Xạ (Radioactive Nuclear Craters)
    for (let i = 0; i < this.nuclearCraters.length; i++) {
      const nc = this.nuclearCraters[i];
      const progress = nc.lifetime / nc.maxLifetime;
      const alpha = Math.min(1.0, progress * 1.5);
      const pulse = 1.0 + Math.sin(Date.now() * 0.007 + i) * 0.05;

      // 1. Viền đất cháy sém đen lõm hình chảo
      this.fxGraphics.ellipse(nc.x, nc.y, nc.radius * 1.15 * pulse, nc.radius * 0.85 * pulse);
      this.fxGraphics.fill({ color: 0x18181b, alpha: alpha * 0.88 });
      this.fxGraphics.stroke({ width: 3.5, color: 0x3f3f46, alpha: alpha * 0.95 });

      // 2. Lòng chảo hồ phóng xạ huỳnh quang màu xanh chuối neon
      this.fxGraphics.ellipse(nc.x, nc.y, nc.radius * 0.8, nc.radius * 0.58);
      this.fxGraphics.fill({ color: 0x365314, alpha: alpha * 0.78 });
      this.fxGraphics.stroke({ width: 2.8, color: 0x84cc16, alpha: alpha * 0.9 });

      // 3. Khe nứt nứt toác phát sáng phóng xạ
      for (let crack = 0; crack < 4; crack++) {
        const ca = (crack * Math.PI) / 2 + 0.35;
        const cx1 = nc.x + Math.cos(ca) * (nc.radius * 0.18);
        const cy1 = nc.y + Math.sin(ca) * (nc.radius * 0.12);
        const cx2 = nc.x + Math.cos(ca) * (nc.radius * 0.72);
        const cy2 = nc.y + Math.sin(ca) * (nc.radius * 0.48);
        this.fxGraphics.moveTo(cx1, cy1);
        this.fxGraphics.lineTo(cx2, cy2);
        this.fxGraphics.stroke({ width: 2.2, color: 0xa3e635, alpha: alpha * 0.9 });
      }

      // 4. Lõi tâm hố phóng xạ rực sáng
      this.fxGraphics.ellipse(nc.x, nc.y, nc.radius * 0.35, nc.radius * 0.25);
      this.fxGraphics.fill({ color: 0xbef264, alpha: alpha * 0.85 });
    }

    // 0.7. Bãi Gai Độc (Thorn Bramble Fields)
    for (let i = 0; i < this.thornFields.length; i++) {
      const tf = this.thornFields[i];
      const progress = tf.lifetime / tf.maxLifetime;
      const alpha = Math.min(1.0, progress * 1.4);
      this.fxGraphics.circle(tf.x, tf.y, tf.radius);
      this.fxGraphics.fill({ color: 0x14532d, alpha: alpha * 0.35 });
      this.fxGraphics.stroke({ width: 2.0, color: 0x22c55e, alpha: alpha * 0.75 });

      for (let s = 0; s < 6; s++) {
        const sa = (s * Math.PI) / 3;
        const sx = tf.x + Math.cos(sa) * (tf.radius * 0.7);
        const sy = tf.y + Math.sin(sa) * (tf.radius * 0.7);
        this.fxGraphics.circle(sx, sy, 3.5);
        this.fxGraphics.fill({ color: 0x86efac, alpha: alpha * 0.9 });
      }
    }

    // 0.75. Bãi Mìn Cảm Ứng (Landmines)
    for (let i = 0; i < this.landmines.length; i++) {
      const lm = this.landmines[i];
      if (!lm.active) continue;
      const blink = Math.sin(Date.now() * 0.015 + i) > 0;

      this.fxGraphics.circle(lm.x, lm.y, 11);
      this.fxGraphics.fill({ color: 0x334155, alpha: 0.95 });
      this.fxGraphics.stroke({ width: 2.0, color: 0x64748b, alpha: 0.9 });

      for (let horn = 0; horn < 4; horn++) {
        const ha = (horn * Math.PI) / 2;
        this.fxGraphics.circle(lm.x + Math.cos(ha) * 11, lm.y + Math.sin(ha) * 11, 2.5);
        this.fxGraphics.fill({ color: 0x94a3b8, alpha: 1.0 });
      }

      this.fxGraphics.circle(lm.x, lm.y, 4.5);
      this.fxGraphics.fill({ color: blink ? 0xef4444 : 0x7f1d1d, alpha: 1.0 });
    }

    // 0.78. Vùng Dị Thường Thời Gian (Stasis Chrono Fields)
    for (let i = 0; i < this.stasisFields.length; i++) {
      const sf = this.stasisFields[i];
      const progress = sf.lifetime / sf.maxLifetime;
      const alpha = Math.min(1.0, progress * 1.5);
      const now = Date.now() * 0.002;

      this.fxGraphics.circle(sf.x, sf.y, sf.radius);
      this.fxGraphics.fill({ color: 0x083344, alpha: alpha * 0.32 });
      this.fxGraphics.stroke({ width: 2.5, color: 0x06b6d4, alpha: alpha * 0.75 });

      const handA = now * 3;
      this.fxGraphics.moveTo(sf.x, sf.y);
      this.fxGraphics.lineTo(sf.x + Math.cos(handA) * (sf.radius * 0.75), sf.y + Math.sin(handA) * (sf.radius * 0.75));
      this.fxGraphics.stroke({ width: 2.0, color: 0x22d3ee, alpha: alpha * 0.85 });
    }

    // 0.8. Thiên Thạch Rơi (Falling Meteors from the Sky)
    for (let i = 0; i < this.fallingMeteors.length; i++) {
      const m = this.fallingMeteors[i];
      if (!m.active) continue;

      // 1. Hồng tâm cảnh báo nổ rực lửa trên mặt đất
      const groundPulse = 1.0 + Math.sin(Date.now() * 0.025) * 0.15;
      this.fxGraphics.circle(m.targetX, m.targetY, m.radius * 1.5 * groundPulse);
      this.fxGraphics.fill({ color: 0xef4444, alpha: 0.25 });
      this.fxGraphics.stroke({ width: 2.5, color: 0xf97316, alpha: 0.8 });

      this.fxGraphics.circle(m.targetX, m.targetY, m.radius * 0.6);
      this.fxGraphics.fill({ color: 0xfde047, alpha: 0.5 });

      // 2. Vệt đuôi lửa sao chổi bốc cháy dữ dội từ bầu trời
      const dx = m.startX - m.targetX;
      const dy = m.startY - m.targetY;
      const angle = Math.atan2(dy, dx);
      const tailLen = 110;

      for (let t = 0; t < 5; t++) {
        const segDist = (t / 4) * tailLen;
        const segX = m.currentX + Math.cos(angle) * segDist;
        const segY = m.currentY + Math.sin(angle) * segDist;
        const segRad = m.radius * (1.2 - (t / 5) * 0.8);
        this.fxGraphics.circle(segX, segY, segRad);
        this.fxGraphics.fill({
          color: t === 0 ? 0xfef08a : (t < 3 ? 0xf97316 : 0xef4444),
          alpha: 0.85 - t * 0.15
        });
      }

      // 3. Khối thiên thạch khổng lồ đỏ rực
      // Quầng lửa ngoài
      this.fxGraphics.circle(m.currentX, m.currentY, m.radius * 1.4);
      this.fxGraphics.fill({ color: 0xef4444, alpha: 0.45 });

      // Lớp đá macma
      this.fxGraphics.circle(m.currentX, m.currentY, m.radius);
      this.fxGraphics.fill({ color: 0x7c2d12, alpha: 0.95 });
      this.fxGraphics.stroke({ width: 3.0, color: 0xf97316, alpha: 0.9 });

      // Lõi dung nham nóng sáng
      this.fxGraphics.circle(m.currentX, m.currentY, m.radius * 0.55);
      this.fxGraphics.fill({ color: 0xfde047, alpha: 1.0 });
    }

    // 0.85. Thánh Giá Ánh Sáng (Holy Crosses of Divine Light & Radiating Aura)
    const nowTime = Date.now() * 0.005;
    for (let i = 0; i < this.holyCrosses.length; i++) {
      const hc = this.holyCrosses[i];
      const progress = hc.lifetime / hc.maxLifetime;
      const alpha = Math.min(1.0, progress * 1.6);
      const pulse = 1.0 + Math.sin(nowTime * 4 + hc.id) * 0.08;

      // 1. Cột ánh sáng thiên giới rọi từ đỉnh trời (Heavenly Light Beam)
      this.fxGraphics.rect(hc.x - 8, 0, 16, hc.y);
      this.fxGraphics.fill({ color: 0xffffff, alpha: alpha * 0.12 });
      this.fxGraphics.rect(hc.x - 3, 0, 6, hc.y);
      this.fxGraphics.fill({ color: 0xfef08a, alpha: alpha * 0.25 });

      // 2. Vầng hào quang thánh địa tỏa ra liên tục trên mặt đất (Radiating Divine Aura)
      const auraWave = ((Date.now() * 0.003 + hc.id * 0.3) % 1.0);
      this.fxGraphics.ellipse(hc.x, hc.y, hc.radius * pulse, hc.radius * 0.65 * pulse);
      this.fxGraphics.fill({ color: 0xfef08a, alpha: alpha * 0.22 });
      this.fxGraphics.stroke({ width: 2.5, color: 0xfacc15, alpha: alpha * 0.85 });

      // Vòng sóng hào quang nở rộng liên tục
      this.fxGraphics.ellipse(hc.x, hc.y, hc.radius * auraWave, hc.radius * 0.65 * auraWave);
      this.fxGraphics.stroke({ width: 1.8, color: 0xffffff, alpha: (1 - auraWave) * alpha * 0.75 });

      // Cổ tự / rune ánh sáng xoay quanh vành hào quang
      for (let r = 0; r < 6; r++) {
        const ra = (r * Math.PI) / 3 + nowTime * 0.6;
        const rx = hc.x + Math.cos(ra) * (hc.radius * 0.85);
        const ry = hc.y + Math.sin(ra) * (hc.radius * 0.55);
        this.fxGraphics.circle(rx, ry, 3.5);
        this.fxGraphics.fill({ color: 0xffffff, alpha: alpha * 0.9 });
        this.fxGraphics.circle(rx, ry, 1.8);
        this.fxGraphics.fill({ color: 0xfacc15, alpha: alpha });
      }

      // 3. Thánh Giá Thần Thánh bằng ánh sáng có ĐẦU NHỌN CẮM XUỐNG ĐẤT/ĐỊCH
      const dropY = (1 - hc.fallProgress) * -160;
      const crossBaseX = hc.x;
      const crossBaseY = hc.y + dropY;

      // Vòng hào quang mặt trời (Sun Halo) tại điểm giao cắt
      const crossCenterY = crossBaseY - 32;
      this.fxGraphics.circle(crossBaseX, crossCenterY, 14 * pulse);
      this.fxGraphics.stroke({ width: 2.5, color: 0xfde047, alpha: alpha * 0.95 });
      this.fxGraphics.circle(crossBaseX, crossCenterY, 8);
      this.fxGraphics.fill({ color: 0xffffff, alpha: alpha * 0.45 });

      // Thanh ngang thánh giá
      this.fxGraphics.roundRect(crossBaseX - 22, crossCenterY - 4.5, 44, 9, 2);
      this.fxGraphics.fill({ color: 0xfef08a, alpha: alpha * 0.95 });
      this.fxGraphics.stroke({ width: 1.8, color: 0xeab308, alpha: alpha });

      // Lõi thanh ngang phát sáng trắng
      this.fxGraphics.rect(crossBaseX - 18, crossCenterY - 2, 36, 4);
      this.fxGraphics.fill({ color: 0xffffff, alpha: alpha });

      // Thanh dọc: Thân trên thẳng, Thân dưới vát nhọn sắc bén CẮM XUỐNG
      this.fxGraphics.poly([
        crossBaseX - 5, crossCenterY - 26,
        crossBaseX + 5, crossCenterY - 26,
        crossBaseX + 5, crossBaseY - 14,
        crossBaseX, crossBaseY, // ĐẦU NHỌN SẮC CẮM XUỐNG
        crossBaseX - 5, crossBaseY - 14
      ]);
      this.fxGraphics.fill({ color: 0xfef08a, alpha: alpha * 0.95 });
      this.fxGraphics.stroke({ width: 2.0, color: 0xeab308, alpha: alpha });

      // Lõi sáng trắng dọc thanh
      this.fxGraphics.poly([
        crossBaseX - 2, crossCenterY - 23,
        crossBaseX + 2, crossCenterY - 23,
        crossBaseX + 2, crossBaseY - 12,
        crossBaseX, crossBaseY - 2,
        crossBaseX - 2, crossBaseY - 12
      ]);
      this.fxGraphics.fill({ color: 0xffffff, alpha: alpha });

      // Viên ngọc linh hồn rực sáng ở tâm giao nhau
      this.fxGraphics.circle(crossBaseX, crossCenterY, 4);
      this.fxGraphics.fill({ color: 0xffffff, alpha: alpha });
      this.fxGraphics.circle(crossBaseX, crossCenterY, 2);
      this.fxGraphics.fill({ color: 0xfacc15, alpha: alpha });
    }

    // 0.86. Tia Laser Quang Học (Continuous Optical Laser Beams)
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const lb = this.laserBeams[i];
      const progress = lb.lifetime / lb.maxLifetime;

      // 1. Quầng sáng plasma ngoài
      this.fxGraphics.moveTo(lb.x1, lb.y1);
      this.fxGraphics.lineTo(lb.x2, lb.y2);
      this.fxGraphics.stroke({ width: 18 * progress, color: lb.color, alpha: progress * 0.45 });

      // 2. Chùm tia trung tâm sáng chói
      this.fxGraphics.moveTo(lb.x1, lb.y1);
      this.fxGraphics.lineTo(lb.x2, lb.y2);
      this.fxGraphics.stroke({ width: 7 * progress, color: 0x38bdf8, alpha: progress * 0.85 });

      // 3. Lõi laser photon trắng cực hạn
      this.fxGraphics.moveTo(lb.x1, lb.y1);
      this.fxGraphics.lineTo(lb.x2, lb.y2);
      this.fxGraphics.stroke({ width: 3 * progress, color: 0xffffff, alpha: progress });

      // Điểm lóe đầu nòng
      this.fxGraphics.circle(lb.x1, lb.y1, 10 * progress);
      this.fxGraphics.fill({ color: 0x06b6d4, alpha: progress * 0.75 });
      this.fxGraphics.circle(lb.x1, lb.y1, 5 * progress);
      this.fxGraphics.fill({ color: 0xffffff, alpha: progress });
    }

    // 1. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.lifetime -= dt;
      if (sw.lifetime <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = 1 - sw.lifetime / sw.maxLifetime;
      sw.radius = sw.maxRadius * progress;
      sw.alpha = 1 - progress;
      this.fxGraphics.circle(sw.x, sw.y, sw.radius);
      this.fxGraphics.stroke({ width: 3, color: sw.color, alpha: sw.alpha });
    }

    // 2. Muzzle Flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const mf = this.muzzleFlashes[i];
      mf.lifetime -= dt;
      if (mf.lifetime <= 0) {
        this.muzzleFlashes.splice(i, 1);
        continue;
      }
      const alpha = mf.lifetime / 0.08;
      this.fxGraphics.circle(mf.x, mf.y, mf.radius);
      this.fxGraphics.fill({ color: mf.color, alpha: alpha * 0.85 });
      this.fxGraphics.circle(mf.x, mf.y, mf.radius * 0.5);
      this.fxGraphics.fill({ color: 0xffffff, alpha });
    }

    // 3. Sparks & Debris
    for (let i = this.visualSparks.length - 1; i >= 0; i--) {
      const sp = this.visualSparks[i];
      sp.lifetime -= dt;
      if (sp.lifetime <= 0) {
        this.visualSparks.splice(i, 1);
        continue;
      }
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 120 * dt; // Gravity
      sp.alpha = sp.lifetime / sp.maxLifetime;

      this.fxGraphics.rect(sp.x - sp.size / 2, sp.y - sp.size / 2, sp.size, sp.size);
      this.fxGraphics.fill({ color: sp.color, alpha: sp.alpha });
    }

    // 4. Jagged Lightning Bolts (Anim giật liên tục re-render ngẫu nhiên mỗi frame)
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const lb = this.lightningBolts[i];
      lb.lifetime -= dt;
      if (lb.lifetime <= 0) {
        this.lightningBolts.splice(i, 1);
        continue;
      }
      const alpha = lb.lifetime / lb.maxLifetime;
      this.drawJaggedLightning(this.fxGraphics, lb.x1, lb.y1, lb.x2, lb.y2, lb.color, alpha);
      if (lb.chainX !== undefined && lb.chainY !== undefined) {
        this.drawJaggedLightning(this.fxGraphics, lb.x2, lb.y2, lb.chainX, lb.chainY, 0xa855f7, alpha);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = 0; i < this.floatingTextPool.length; i++) {
      const ft = this.floatingTextPool[i];
      if (!ft.active) continue;

      ft.text.y -= 45 * dt;
      ft.lifetime -= dt;
      if (ft.lifetime <= 0) {
        ft.active = false;
        ft.text.visible = false;
      }
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string) {
    let slot = this.floatingTextPool.find(ft => !ft.active);
    if (!slot) slot = this.floatingTextPool[0];

    slot.active = true;
    slot.lifetime = 0.85;
    slot.text.text = text;
    slot.text.style.fill = color;
    slot.text.x = x;
    slot.text.y = y;
    slot.text.visible = true;
  }

  private getAdjacentCells(col: number, row: number): GridCell[] {
    const res: GridCell[] = [];
    const offsets = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dc, dr] of offsets) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < this.COLS && nr >= 0 && nr < this.ROWS) {
        res.push(this.grid[nr][nc]);
      }
    }
    return res;
  }

  private renderActiveEntities() {
    const activeEnemiesCount = this.enemies.length;
    while (this.enemyPool.length < activeEnemiesCount) {
      const cont = new Container();
      cont.visible = false;
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      cont.addChild(sprite);
      const hpBg = new Graphics();
      cont.addChild(hpBg);
      const hpFill = new Graphics();
      cont.addChild(hpFill);
      this.enemyContainer.addChild(cont);
      this.enemyPool.push({ container: cont, sprite, hpBg, hpFill, active: false });
    }

    for (let i = 0; i < this.enemyPool.length; i++) {
      const view = this.enemyPool[i];
      if (i < activeEnemiesCount) {
        const e = this.enemies[i];
        view.container.visible = true;
        view.container.x = e.x;
        view.container.y = e.y;

        view.sprite.texture = PixelAssetManager.getEnemyTexture(e.kind);
        view.sprite.width = e.width;
        view.sprite.height = e.height;

        if (e.hitFlashTimer > 0) {
          view.sprite.tint = 0xffffff;
        } else if (e.confuseTimer && e.confuseTimer > 0) {
          view.sprite.tint = 0x84cc16; // Neon radioactive lime green!
          view.sprite.rotation = Math.sin(Date.now() * 0.02 + e.id) * 0.25;
        } else if (e.slowTimer > 0 || (e.freezeTimer && e.freezeTimer > 0) || (e.stasisTimer && e.stasisTimer > 0)) {
          view.sprite.tint = 0x38bdf8;
          view.sprite.rotation = 0;
        } else if (e.burnTimer > 0) {
          view.sprite.tint = 0xf97316;
          view.sprite.rotation = 0;
        } else if (e.poisonTimer && e.poisonTimer > 0) {
          view.sprite.tint = 0x22c55e;
          view.sprite.rotation = 0;
        } else if (e.bleedTimer && e.bleedTimer > 0) {
          view.sprite.tint = 0xf43f5e;
          view.sprite.rotation = 0;
        } else {
          view.sprite.tint = 0xffffff;
          view.sprite.rotation = 0;
        }

        const barW = Math.max(e.width * 0.85, 48);
        view.hpBg.clear();
        view.hpBg.rect(-barW / 2, -e.height / 2 - 12, barW, 8);
        view.hpBg.fill({ color: 0x000000, alpha: 0.85 });

        const hpRatio = Math.max(0, e.hp / e.maxHp);
        view.hpFill.clear();
        view.hpFill.rect(-barW / 2, -e.height / 2 - 12, barW * hpRatio, 8);
        const hpColor = e.isBoss ? 0xa855f7 : (e.kind === 'MINIBOSS' ? 0xf97316 : (e.kind === 'SHIELD' ? 0x38bdf8 : 0xef4444));
        view.hpFill.fill({ color: hpColor });
      } else {
        view.container.visible = false;
      }
    }

    const activeBulletsCount = this.bullets.length;
    while (this.bulletPool.length < activeBulletsCount) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.bulletContainer.addChild(sprite);
      this.bulletPool.push({ sprite, active: false });
    }

    for (let i = 0; i < this.bulletPool.length; i++) {
      const view = this.bulletPool[i];
      if (i < activeBulletsCount) {
        const b = this.bullets[i];
        view.sprite.visible = true;
        view.sprite.x = b.x;
        view.sprite.y = b.y;
        if (b.rotationSpeed) {
          b.rotation = (b.rotation || 0) + b.rotationSpeed * 0.016;
          view.sprite.rotation = b.rotation;
        } else {
          view.sprite.rotation = b.angle + Math.PI / 2;
        }
        view.sprite.texture = PixelAssetManager.getProjectileTexture(b.gunKind);
        view.sprite.scale.set(b.scale || 1.0);
      } else {
        view.sprite.visible = false;
      }
    }
  }

  public createGun(kind: GunKind, level: number): GridItem {
    const baseDamageMap: Record<GunKind, number> = {
      // Tier 1
      PISTOL: 18,
      CROSSBOW: 28,
      SLINGSHOT: 16,
      SHOTGUN: 48,
      FLAMER: 20,
      POISON: 18,
      WIND: 16,
      BOUNTY: 15,
      // Tier 2
      CRYO: 22,
      CANNON: 75,
      THORN: 24,
      SACRIFICE: 20,
      BERSERKER: 32,
      IRON: 35,
      MINE: 60,
      AURA_SPEED: 0,
      // Tier 3
      TESLA: 45,
      SNIPER: 140,
      MYSTERY: 12,
      MIMIC: 15,
      SUMMONER: 35,
      COMBO: 30,
      BLIZZARD: 40,
      MAGNET: 30,
      AURA_DMG: 0,
      // Tier 4
      MINIGUN: 24,
      TYPHOON: 22,
      NUCLEAR: 110,
      ASSASSIN: 90,
      LASER: 35,
      CHAINSAW: 55,
      TIME: 40,
      AURA_CRIT: 0,
      // Tier 5
      METEOR: 280,
      SOLAR: 95,
      LUNAR: 0,
      HOLY: 80,
      BLACKHOLE: 120,
      PRISM: 70,
      AURA_ENERGY: 0,
    };

    const fillPerHitMap: Record<GunKind, number> = {
      // Tier 1
      PISTOL: 0.50,
      CROSSBOW: 0.34,
      SLINGSHOT: 0.50,
      SHOTGUN: 0.25,
      FLAMER: 0.34,
      POISON: 0.34,
      WIND: 0.34,
      BOUNTY: 0.50,
      // Tier 2
      CRYO: 0.34,
      CANNON: 0.25,
      THORN: 0.34,
      SACRIFICE: 0.34,
      BERSERKER: 0.34,
      IRON: 0.34,
      MINE: 0.25,
      AURA_SPEED: 0,
      // Tier 3
      TESLA: 0.25,
      SNIPER: 0.16,
      MYSTERY: 0.50,
      MIMIC: 0.50,
      SUMMONER: 0.25,
      COMBO: 0.34,
      BLIZZARD: 0.20,
      MAGNET: 0.25,
      AURA_DMG: 0,
      // Tier 4
      MINIGUN: 0.50,
      TYPHOON: 0.50,
      NUCLEAR: 0.20,
      ASSASSIN: 0.20,
      LASER: 0.34,
      CHAINSAW: 0.25,
      TIME: 0.25,
      AURA_CRIT: 0,
      // Tier 5
      METEOR: 0.12,
      SOLAR: 0.25,
      LUNAR: 0,
      HOLY: 0.20,
      BLACKHOLE: 0.15,
      PRISM: 0.25,
      AURA_ENERGY: 0,
    };

    const rangeTypeMap: Record<GunKind, 'LANE' | 'SPREAD' | 'GLOBAL' | 'SHORT' | 'AURA'> = {
      // Tier 1
      PISTOL: 'LANE',
      CROSSBOW: 'LANE',
      SLINGSHOT: 'SPREAD',
      SHOTGUN: 'SHORT',
      FLAMER: 'LANE',
      POISON: 'LANE',
      WIND: 'LANE',
      BOUNTY: 'LANE',
      // Tier 2
      CRYO: 'LANE',
      CANNON: 'LANE',
      THORN: 'LANE',
      SACRIFICE: 'LANE',
      BERSERKER: 'LANE',
      IRON: 'LANE',
      MINE: 'SPREAD',
      AURA_SPEED: 'AURA',
      // Tier 3
      TESLA: 'GLOBAL',
      SNIPER: 'GLOBAL',
      MYSTERY: 'GLOBAL',
      MIMIC: 'LANE',
      SUMMONER: 'LANE',
      COMBO: 'LANE',
      BLIZZARD: 'GLOBAL',
      MAGNET: 'GLOBAL',
      AURA_DMG: 'AURA',
      // Tier 4
      MINIGUN: 'LANE',
      TYPHOON: 'LANE',
      NUCLEAR: 'GLOBAL',
      ASSASSIN: 'GLOBAL',
      LASER: 'GLOBAL',
      CHAINSAW: 'SPREAD',
      TIME: 'GLOBAL',
      AURA_CRIT: 'AURA',
      // Tier 5
      METEOR: 'GLOBAL',
      SOLAR: 'GLOBAL',
      LUNAR: 'AURA',
      HOLY: 'GLOBAL',
      BLACKHOLE: 'GLOBAL',
      PRISM: 'SPREAD',
      AURA_ENERGY: 'AURA',
    };

    const permanentLvl = (this.saveData && this.saveData.gunLevels && this.saveData.gunLevels[kind]) || 1;
    const upgradeMult = 1 + (permanentLvl - 1) * 0.15;
    const turretBonus = 1 + (this.saveData?.talents?.turretDmgLevel || 0) * 0.06;
    const dmg = Math.round(baseDamageMap[kind] * upgradeMult * turretBonus * Math.pow(1.8, level - 1));
    const tier = getGunTier(kind);

    return {
      id: `gun_${Date.now()}_${Math.random()}`,
      type: 'GUN',
      level,
      tier,
      gunKind: kind,
      fill: 0,
      fillPerHit: fillPerHitMap[kind],
      damage: dmg,
      rangeType: rangeTypeMap[kind],
      recoilOffset: 0,
      turretAngle: -Math.PI / 2,
      gearAngle: 0,
      gearTargetAngle: 0, // Quay đúng 90 độ mỗi lần nẫy gõ
      angle: 0,
      rotationSpeed: 0,
      lastHitAngle: [],
    };
  }

  public createTrigger(level: number): GridItem {
    const tier = Math.min(5, Math.max(1, level));
    const speedBonus = 1 + (this.saveData?.talents?.atkSpeedLevel || 0) * 0.05;
    return {
      id: `trigger_${Date.now()}_${Math.random()}`,
      type: 'TRIGGER',
      level,
      tier,
      angle: 0,
      rotationSpeed: 0.8 * speedBonus,
      lastHitAngle: [],
      fill: 0,
      fillPerHit: 0,
      damage: 0,
      rangeType: 'LANE',
      recoilOffset: 0,
      turretAngle: 0,
      gearAngle: 0,
      gearTargetAngle: 0,
    };
  }

  public createBuff(kind: BuffKind, level: number): GridItem {
    const tier = Math.min(5, Math.max(1, level));
    return {
      id: `buff_${Date.now()}_${Math.random()}`,
      type: 'BUFF',
      level,
      tier,
      buffKind: kind,
      angle: 0,
      rotationSpeed: 0,
      lastHitAngle: [],
      fill: 0,
      fillPerHit: 0,
      damage: 0,
      rangeType: 'LANE',
      recoilOffset: 0,
      turretAngle: 0,
      gearAngle: 0,
      gearTargetAngle: 0,
    };
  }

  // ================= META PROGRESSION, SAVE DATA & MAIN MENU ================= //

  private loadSaveData(): UserSaveData {
    try {
      const raw = localStorage.getItem('gear_gun_castle_save');
      if (raw) {
        const parsed = JSON.parse(raw);
        const data: UserSaveData = { ...DEFAULT_SAVE, ...parsed };
        data.gunLevels = { ...DEFAULT_SAVE.gunLevels, ...(parsed.gunLevels || {}) };
        if (!parsed.saveVersion || parsed.saveVersion < 3) {
          data.saveVersion = 3;
          const newStarters: GunKind[] = [
            'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER',
            'MYSTERY', 'MIMIC', 'AURA_DMG', 'AURA_SPEED', 'NUCLEAR', 'SACRIFICE'
          ];
          newStarters.forEach(g => {
            if (!data.unlockedGuns.includes(g)) data.unlockedGuns.push(g);
            if (!data.gunLevels[g] || data.gunLevels[g] < 1) data.gunLevels[g] = 1;
          });
        }
        if (!data.unlockedGuns || data.unlockedGuns.length === 0) {
          data.unlockedGuns = ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'];
        }
        data.equippedGuns = (data.equippedGuns || []).filter(g => data.unlockedGuns.includes(g));
        if (data.equippedGuns.length === 0) {
          data.equippedGuns = ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'];
        }
        data.talents = {
          hpLevel: 0,
          armorLevel: 0,
          startGoldLevel: 0,
          bountyLevel: 0,
          turretDmgLevel: 0,
          atkSpeedLevel: 0,
          critRateLevel: 0,
          critDmgLevel: 0,
          regenLevel: 0,
          thornsLevel: 0,
          freezeBoostLevel: 0,
          energyLevel: 0,
          shieldLevel: 0,
          luckyDropLevel: 0,
          ...(data.talents || {})
        };
        data.battlePass = data.battlePass || {
          points: 120,
          claimedFree: [],
          claimedAd: []
        };
        if (!data.quests || data.quests.length === 0) {
          data.quests = [
            { id: 'kill_monsters', title: 'Monster Hunter', desc: 'Defeat 40 enemy monsters in battles', target: 40, current: 0, rewardMedals: 60, rewardGold: 300, claimed: false },
            { id: 'clear_waves', title: 'Wave Survivor', desc: 'Survive 6 waves of invasion', target: 6, current: 0, rewardMedals: 80, rewardDia: 25, claimed: false },
            { id: 'roll_weapons', title: 'Arsenal Crafter', desc: 'Roll weapons 8 times during battle', target: 8, current: 0, rewardMedals: 50, rewardGold: 200, claimed: false },
            { id: 'upgrade_guns', title: 'Master Gunsmith', desc: 'Upgrade any weapon level in Equipment', target: 1, current: 0, rewardMedals: 50, rewardGold: 250, claimed: false },
            { id: 'roll_talent', title: 'Castle Alchemist', desc: 'Roll a random Castle Talent buff', target: 1, current: 0, rewardMedals: 70, rewardDia: 20, claimed: false },
            { id: 'open_chest', title: 'Treasure Seeker', desc: 'Open any chest in the Shop', target: 1, current: 0, rewardMedals: 60, rewardGold: 200, claimed: false },
            { id: 'win_campaign', title: 'Realm Defender', desc: 'Reach Wave 10 on any Campaign stage', target: 10, current: 0, rewardMedals: 100, rewardDia: 40, claimed: false },
          ];
        }
        data.shopRoyalAdProgress = data.shopRoyalAdProgress || 0;
        // DEV HACK: Luôn Full Năng Lượng để test game không bao giờ hết
        data.energy = 999;
        data.maxEnergy = 999;
        data.language = (parsed.language === 'vi') ? 'vi' : 'en';
        setLanguage(data.language);
        syncLocalizedGunData(data.language);
        return data;
      }
    } catch (e) {}
    const fallback = { ...DEFAULT_SAVE, energy: 999, maxEnergy: 999, language: 'en' as Language };
    setLanguage('en');
    syncLocalizedGunData('en');
    return fallback;
  }

  public setGameLanguage(lang: Language) {
    this.saveData.language = lang;
    this.saveGame();
    setLanguage(lang);
    syncLocalizedGunData(lang);
    if (this.trashText) this.trashText.text = t('hud_trash_ready');
    if (this.tooltipHintText) this.tooltipHintText.text = t('hud_tap_outside');
    if (this.rollBtnText) this.rollBtnText.text = t('hud_roll_btn');
    if (this.startWaveBtnText) this.startWaveBtnText.text = t('hud_start_wave', this.wave);
    if (this.speedBtnText) this.speedBtnText.text = t('hud_speed', this.gameSpeed);
    if (this.tipText) this.tipText.text = t('hud_tip');
    if (this.uiManager) this.uiManager.render();
  }

  public saveGame() {
    try {
      localStorage.setItem('gear_gun_castle_save', JSON.stringify(this.saveData));
    } catch (e) {}
  }

  public addBattlePassPoints(points: number) {
    if (!this.saveData.battlePass) {
      this.saveData.battlePass = { points: 0, claimedFree: [], claimedAd: [] };
    }
    this.saveData.battlePass.points += points;
    this.saveGame();
  }

  public addQuestProgress(questId: string, amount: number = 1) {
    if (!this.saveData.quests) return;
    const q = this.saveData.quests.find(item => item.id === questId);
    if (q && !q.claimed) {
      q.current = Math.min(q.target, q.current + amount);
      this.saveGame();
    }
  }

  private initMainMenu() {
    this.mainMenuContainer.eventMode = 'static';
    this.mainMenuContainer.hitArea = new Rectangle(0, 0, 720, 1280);
    this.renderMainMenu();
  }

  public showMainMenu() {
    this.inMenu = true;
    this.mainMenuContainer.visible = true;
    this.resultModalContainer.visible = false;
    this.renderMainMenu();
  }

  private renderMainMenu() {
    this.mainMenuContainer.removeChildren();

    // 1. Nền Xanh Tối Huyền Bí / Vũ Trụ (Deep Cosmic Indigo Navy)
    const bg = new Graphics();
    bg.rect(0, 0, 720, 1280);
    bg.fill({ color: 0x060814 });
    this.mainMenuContainer.addChild(bg);

    // Hào quang sương mù tím - xanh giữa màn hình
    const nebula = new Graphics();
    nebula.ellipse(360, 480, 320, 260);
    nebula.fill({ color: 0x1e1b4b, alpha: 0.55 });
    this.mainMenuContainer.addChild(nebula);

    // 2. Thanh Trạng Thái Trên Cùng (Top Status Header Bar)
    this.renderHeaderBar();

    // 3. Banner Mùa Giải Season 117 (Battle Pass Bar)
    this.renderSeasonPassBar();

    // 4. Nội Dung Từng Tab
    if (this.menuTab === 'WORLD') {
      this.renderWorldTab();
    } else if (this.menuTab === 'SHOP') {
      this.renderShopTab();
    } else if (this.menuTab === 'EQUIPMENT') {
      this.renderEquipmentTab();
    } else if (this.menuTab === 'TALENT') {
      this.renderTalentTab();
    } else if (this.menuTab === 'MODES') {
      this.renderModesTab();
    }

    // 5. Thanh Điều Hướng Đáy 5 Tab (Bottom Navigation Bar)
    this.renderBottomNavigationBar();
  }

  // --- HEADER BAR TRÊN CÙNG: LEVEL 115, ENERGY ⚡ 7/20, GOLD, GEMS, MENU ☰ ---
  private renderHeaderBar() {
    const header = new Container();
    header.y = 12;

    // 1. Huy hiệu Level người chơi (Blue Hexagon Shield + EXP Bar)
    const lvlShield = new Graphics();
    const cx = 56, cy = 40, r = 24;
    lvlShield.moveTo(cx, cy - r);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      lvlShield.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    lvlShield.closePath();
    lvlShield.fill({ color: 0x0284c7 });
    lvlShield.stroke({ color: 0x7dd3fc, width: 3.5 });
    header.addChild(lvlShield);

    const lvlNum = new Text({
      text: `${this.saveData.playerLevel || 115}`,
      style: { fontFamily: this.FONT_FAMILY, fontSize: 18, fill: '#ffffff', fontWeight: 'bold' }
    });
    lvlNum.anchor.set(0.5);
    lvlNum.x = cx;
    lvlNum.y = cy;
    header.addChild(lvlNum);

    // Thanh EXP cạnh Level
    const expBar = new Graphics();
    expBar.roundRect(84, 28, 90, 24, 6);
    expBar.fill({ color: 0x0f172a });
    expBar.stroke({ color: 0x0369a1, width: 2 });
    const expFillW = Math.round(86 * ((this.saveData.playerExp || 75) / 100));
    expBar.roundRect(86, 30, expFillW, 20, 5);
    expBar.fill({ color: 0x38bdf8 });
    header.addChild(expBar);

    // 2. Năng lượng Sét (⚡ 7/20 + timer)
    const energyPill = new Container();
    energyPill.x = 188;
    energyPill.y = 20;

    const eBg = new Graphics();
    eBg.roundRect(0, 0, 115, 40, 8);
    eBg.fill({ color: 0x0f172a });
    eBg.stroke({ color: 0x22c55e, width: 2 });
    energyPill.addChild(eBg);

    const eText = new Text({
      text: `⚡ ${this.saveData.energy || 7}/${this.saveData.maxEnergy || 20}`,
      style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#ffffff', fontWeight: 'bold' }
    });
    eText.anchor.set(0.5, 0);
    eText.x = 57;
    eText.y = 5;
    energyPill.addChild(eText);

    const eTimer = new Text({
      text: '07:54',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 10, fill: '#86efac', fontWeight: 'bold' }
    });
    eTimer.anchor.set(0.5, 0);
    eTimer.x = 57;
    eTimer.y = 23;
    energyPill.addChild(eTimer);
    header.addChild(energyPill);

    // 3. Vàng Vĩnh Viễn (🏹 Gold)
    const goldPill = new Container();
    goldPill.x = 312;
    goldPill.y = 20;

    const gBg = new Graphics();
    gBg.roundRect(0, 0, 160, 40, 8);
    gBg.fill({ color: 0x0f172a });
    gBg.stroke({ color: 0xf59e0b, width: 2 });
    goldPill.addChild(gBg);

    const gText = new Text({
      text: `🏹 ${this.saveData.permanentGold || 121181022}`,
      style: { fontFamily: this.FONT_FAMILY, fontSize: 14, fill: '#fde047', fontWeight: 'bold' }
    });
    gText.anchor.set(0.5);
    gText.x = 80;
    gText.y = 20;
    goldPill.addChild(gText);
    header.addChild(goldPill);

    // 4. Kim Cương (💎 Gems)
    const diaPill = new Container();
    diaPill.x = 480;
    diaPill.y = 20;

    const dBg = new Graphics();
    dBg.roundRect(0, 0, 130, 40, 8);
    dBg.fill({ color: 0x0f172a });
    dBg.stroke({ color: 0x10b981, width: 2 });
    diaPill.addChild(dBg);

    const dText = new Text({
      text: `💎 ${this.saveData.diamonds || 6472}`,
      style: { fontFamily: this.FONT_FAMILY, fontSize: 14, fill: '#6ee7b7', fontWeight: 'bold' }
    });
    dText.anchor.set(0.5);
    dText.x = 65;
    dText.y = 20;
    diaPill.addChild(dText);
    header.addChild(diaPill);

    // 5. Nút Menu Hamburger ☰ (Góc trên cùng bên phải)
    const menuBtn = new Container();
    menuBtn.x = 642;
    menuBtn.y = 18;
    menuBtn.eventMode = 'static';
    menuBtn.cursor = 'pointer';
    menuBtn.hitArea = new Rectangle(0, 0, 52, 44);

    const mBg = new Graphics();
    mBg.roundRect(0, 0, 52, 44, 10);
    mBg.fill({ color: 0x0284c7 });
    mBg.stroke({ color: 0x38bdf8, width: 2.5 });
    mBg.rect(10, 11, 32, 4).fill({ color: 0xffffff });
    mBg.rect(10, 20, 32, 4).fill({ color: 0xffffff });
    mBg.rect(10, 29, 32, 4).fill({ color: 0xffffff });
    menuBtn.addChild(mBg);

    menuBtn.on('pointerdown', () => {
      sound.playClick();
      if (this.uiManager) {
        this.uiManager.showSettingsModal();
      } else {
        alert('⚙ SETTINGS:\n• Sound: ON\n• Version: Gear Gun Castle (Archero Edition)\n• Engine: Antigravity Game Engine');
      }
    });
    header.addChild(menuBtn);

    this.mainMenuContainer.addChild(header);
  }

  // --- BANNER MÙA GIẢI SEASON 117 (BATTLE PASS BAR) ---
  private renderSeasonPassBar() {
    const sCont = new Container();
    sCont.x = 360;
    sCont.y = 100;

    const w = 680, h = 50;

    const sBg = new Graphics();
    sBg.roundRect(-w / 2, -h / 2, w, h, 10);
    sBg.fill({ color: 0x1c1917 });
    sBg.stroke({ color: 0xb45309, width: 2.5 });
    sCont.addChild(sBg);

    const shield = new Graphics();
    shield.roundRect(-w / 2 + 8, -h / 2 + 5, 48, 40, 6);
    shield.fill({ color: 0xd97706 });
    shield.stroke({ color: 0xfde047, width: 2 });
    shield.moveTo(-w / 2 + 20, -h / 2 + 15).lineTo(-w / 2 + 44, -h / 2 + 35).stroke({ color: 0xffffff, width: 2 });
    sCont.addChild(shield);

    const sTitle = new Text({
      text: 'Season 117',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#f8fafc', fontWeight: 'bold' }
    });
    sTitle.anchor.set(0.5, 1);
    sTitle.x = 0;
    sTitle.y = -5;
    sCont.addChild(sTitle);

    const progBg = new Graphics();
    progBg.roundRect(-160, 2, 340, 18, 6);
    progBg.fill({ color: 0x0f172a });
    progBg.stroke({ color: 0x0284c7, width: 1.5 });
    progBg.roundRect(-158, 4, 260, 14, 4);
    progBg.fill({ color: 0x0284c7 });
    sCont.addChild(progBg);

    const lvl30 = new Graphics();
    lvl30.circle(-160, 11, 14);
    lvl30.fill({ color: 0x7c2d12 });
    lvl30.stroke({ color: 0xfde047, width: 2.5 });
    sCont.addChild(lvl30);

    const lvl30Txt = new Text({
      text: '30',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 12, fill: '#ffffff', fontWeight: 'bold' }
    });
    lvl30Txt.anchor.set(0.5);
    lvl30Txt.x = -160;
    lvl30Txt.y = 11;
    sCont.addChild(lvl30Txt);

    const heroAv = new Graphics();
    heroAv.circle(w / 2 - 35, 0, 20);
    heroAv.fill({ color: 0x16a34a });
    heroAv.stroke({ color: 0x4ade80, width: 2.5 });
    sCont.addChild(heroAv);

    const pinkAv = new Graphics();
    pinkAv.circle(-w / 2 - 12, 0, 22);
    pinkAv.fill({ color: 0xf472b6 });
    pinkAv.stroke({ color: 0xffffff, width: 3 });
    pinkAv.circle(-w / 2 - 2, 14, 8);
    pinkAv.fill({ color: 0x7e22ce });
    sCont.addChild(pinkAv);

    const pinkTxt = new Text({
      text: '9',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 10, fill: '#ffffff', fontWeight: 'bold' }
    });
    pinkTxt.anchor.set(0.5);
    pinkTxt.x = -w / 2 - 2;
    pinkTxt.y = 14;
    sCont.addChild(pinkTxt);

    this.mainMenuContainer.addChild(sCont);
  }

  // --- THANH ĐIỀU HƯỚNG ĐÁY 5 TAB CHUẨN ARCHERO (BOTTOM NAVIGATION BAR) ---
  private renderBottomNavigationBar() {
    const navBar = new Container();
    navBar.y = 1155;

    const barBg = new Graphics();
    barBg.rect(0, 0, 720, 125);
    barBg.fill({ color: 0xe2e8f0 });
    barBg.stroke({ color: 0x94a3b8, width: 2 });
    navBar.addChild(barBg);

    const tabs: { key: 'SHOP' | 'EQUIPMENT' | 'WORLD' | 'TALENT' | 'MODES'; label: string; badge?: string }[] = [
      { key: 'SHOP', label: 'Shop', badge: '67' },
      { key: 'EQUIPMENT', label: 'Trang Bị', badge: 'New' },
      { key: 'WORLD', label: 'World' },
      { key: 'TALENT', label: 'Thiên Phú' },
      { key: 'MODES', label: 'Chế Độ' },
    ];

    const tabWidth = 720 / 5;

    tabs.forEach((tab, idx) => {
      const tabCont = new Container();
      const isActive = this.menuTab === tab.key;
      const isElevated = tab.key === 'WORLD';

      tabCont.x = idx * tabWidth;
      tabCont.y = isElevated ? -16 : 0;
      tabCont.eventMode = 'static';
      tabCont.cursor = 'pointer';
      tabCont.hitArea = new Rectangle(0, 0, tabWidth, 125);

      if (isElevated) {
        const elevBg = new Graphics();
        elevBg.roundRect(8, 0, tabWidth - 16, 115, 12);
        elevBg.fill({ color: isActive ? 0xffedd5 : 0xf1f5f9 });
        elevBg.stroke({ color: isActive ? 0xf97316 : 0xcbd5e1, width: 3 });
        tabCont.addChild(elevBg);
      }

      const iconSize = isElevated ? 58 : 52;
      const icon = new Sprite(PixelAssetManager.getBottomTabIcon(tab.key, iconSize));
      icon.anchor.set(0.5);
      icon.x = tabWidth / 2;
      icon.y = isElevated ? 42 : 46;
      tabCont.addChild(icon);

      const labelTxt = new Text({
        text: tab.label,
        style: {
          fontFamily: this.FONT_FAMILY,
          fontSize: isElevated ? 13 : 11,
          fill: isActive ? '#0f172a' : '#64748b',
          fontWeight: 'bold',
        }
      });
      labelTxt.anchor.set(0.5);
      labelTxt.x = tabWidth / 2;
      labelTxt.y = isElevated ? 82 : 86;
      tabCont.addChild(labelTxt);

      if (tab.badge) {
        const badgeCont = new Container();
        badgeCont.x = tabWidth / 2 + 18;
        badgeCont.y = 20;

        const badgeG = new Graphics();
        const bw = tab.badge === 'New' ? 34 : 24;
        badgeG.roundRect(-bw / 2, -10, bw, 20, 10);
        badgeG.fill({ color: 0xef4444 });
        badgeG.stroke({ color: 0xffffff, width: 2 });
        badgeCont.addChild(badgeG);

        const bText = new Text({
          text: tab.badge,
          style: { fontFamily: this.FONT_FAMILY, fontSize: 10, fill: '#ffffff', fontWeight: '900' }
        });
        bText.anchor.set(0.5);
        badgeCont.addChild(bText);
        tabCont.addChild(badgeCont);
      }

      tabCont.on('pointerdown', () => {
        this.menuTab = tab.key;
        sound.playClick();
        this.renderMainMenu();
      });

      navBar.addChild(tabCont);
    });

    this.mainMenuContainer.addChild(navBar);
  }

  // ================= TAB 1: WORLD (HABBY ARCHERO REPLICA) ================= //
  private renderWorldTab() {
    const worldCont = new Container();

    // 1. Stage Title Banner ở trên cùng (Hero50.Radiant Temple | Top Stage : 31/50)
    const stageBanner = new Container();
    stageBanner.x = 360;
    stageBanner.y = 175;

    const bannerW = 460, bannerH = 54;
    const sBg = new Graphics();
    sBg.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 12);
    sBg.fill({ color: 0x18181b, alpha: 0.9 });
    sBg.stroke({ color: 0xeab308, width: 2.5 });
    stageBanner.addChild(sBg);

    // Icon hộp quà 🎁 bên trái
    const giftG = new Graphics();
    giftG.rect(-bannerW / 2 + 16, -16, 32, 32);
    giftG.fill({ color: 0xef4444 });
    giftG.stroke({ color: 0xfacc15, width: 2 });
    giftG.rect(-bannerW / 2 + 16, -3, 32, 6).fill({ color: 0xfacc15 });
    giftG.rect(-bannerW / 2 + 29, -16, 6, 32).fill({ color: 0xfacc15 });
    stageBanner.addChild(giftG);

    // Tên Ải trung tâm
    const stageName = new Text({
      text: `Hero50.Radiant Temple`,
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 19,
        fill: '#ffffff',
        fontWeight: 'bold',
        stroke: { color: '#000000', width: 3 },
      }
    });
    stageName.anchor.set(0.5, 1);
    stageName.x = 8;
    stageName.y = 1;
    stageBanner.addChild(stageName);

    // Tiến độ ải (Top Stage : 31/50)
    const stageSub = new Text({
      text: `Top Stage : ${this.saveData.highestCampaignStage * 10}/50`,
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 13,
        fill: '#94a3b8',
        fontWeight: 'bold',
      }
    });
    stageSub.anchor.set(0.5, 0);
    stageSub.x = 8;
    stageSub.y = 5;
    stageBanner.addChild(stageSub);

    // Nút Thông tin ℹ bên phải
    const infoBtn = new Container();
    infoBtn.x = bannerW / 2 - 32;
    infoBtn.y = 0;
    infoBtn.eventMode = 'static';
    infoBtn.cursor = 'pointer';
    const infoG = new Graphics();
    infoG.circle(0, 0, 16);
    infoG.fill({ color: 0x3b82f6 });
    infoG.stroke({ color: 0x93c5fd, width: 2 });
    infoBtn.addChild(infoG);
    const infoTxt = new Text({
      text: 'i',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#ffffff', fontWeight: 'bold' }
    });
    infoTxt.anchor.set(0.5);
    infoBtn.addChild(infoTxt);
    infoBtn.on('pointerdown', () => {
      sound.playClick();
      alert(`📖 STAGE INFO [Radiant Temple]:\n• Current Map: Stage ${this.saveData.selectedCampaignMap}\n• Highest Stage Reached: ${this.saveData.highestCampaignStage * 10}/50\n• Clear Reward: 1000 💎 + Royal Chest`);
    });
    stageBanner.addChild(infoBtn);
    worldCont.addChild(stageBanner);

    // 2. Left Side Floating Badges
    const octCont = new Container();
    octCont.x = 52;
    octCont.y = 300;
    octCont.eventMode = 'static';
    octCont.cursor = 'pointer';
    const octSp = new Sprite(PixelAssetManager.getSideBadgeTexture('OCTOPUS', 56));
    octSp.anchor.set(0.5);
    octCont.addChild(octSp);

    const octTimeG = new Graphics();
    octTimeG.roundRect(-30, 26, 60, 18, 5);
    octTimeG.fill({ color: 0x0284c7 });
    octTimeG.stroke({ color: 0x7dd3fc, width: 1.5 });
    octCont.addChild(octTimeG);
    const octTimeTxt = new Text({
      text: '2H 22M',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 10, fill: '#ffffff', fontWeight: 'bold' }
    });
    octTimeTxt.anchor.set(0.5);
    octTimeTxt.x = 0;
    octTimeTxt.y = 35;
    octCont.addChild(octTimeTxt);
    octCont.on('pointerdown', () => {
      sound.playClick();
      alert('🐙 OCEAN EVENT: Double Diamonds from monster hunting for the next 2H 22M!');
    });
    worldCont.addChild(octCont);

    // Badge 2: Floating Island shortcut
    const islandCont = new Container();
    islandCont.x = 52;
    islandCont.y = 415;
    islandCont.eventMode = 'static';
    islandCont.cursor = 'pointer';
    const islSp = new Sprite(PixelAssetManager.getSideBadgeTexture('PATROL_FLOAT', 56));
    islSp.anchor.set(0.5);
    islandCont.addChild(islSp);
    islandCont.on('pointerdown', () => {
      sound.playClick();
      alert('🏝 SKY TREASURE ISLAND: Explore the floating sky island!');
    });
    worldCont.addChild(islandCont);

    // 3. Right Side Floating Badges
    const rightBadges: { kind: 'ARENA' | 'QUEST' | 'DEMON' | 'WIZARD'; y: number; timer?: string; hasDot?: boolean; label: string }[] = [
      { kind: 'ARENA', y: 280, hasDot: true, label: 'Apex PvP Arena' },
      { kind: 'QUEST', y: 370, label: 'Daily Quests (Get 300 💰)' },
      { kind: 'DEMON', y: 460, timer: '4D 12H', label: 'Demon Lord Crown (Special Event)' },
      { kind: 'WIZARD', y: 550, timer: '4D 2H', label: 'Lucky Wizard Cat' },
    ];

    rightBadges.forEach(b => {
      const bCont = new Container();
      bCont.x = 668;
      bCont.y = b.y;
      bCont.eventMode = 'static';
      bCont.cursor = 'pointer';

      const sp = new Sprite(PixelAssetManager.getSideBadgeTexture(b.kind, 50));
      sp.anchor.set(0.5);
      bCont.addChild(sp);

      if (b.hasDot) {
        const dot = new Graphics();
        dot.circle(18, -18, 6);
        dot.fill({ color: 0xef4444 });
        dot.stroke({ color: 0xffffff, width: 2 });
        bCont.addChild(dot);
      }

      if (b.timer) {
        const tBg = new Graphics();
        tBg.roundRect(-26, 22, 52, 16, 4);
        tBg.fill({ color: 0x0f172a, alpha: 0.9 });
        tBg.stroke({ color: 0x64748b, width: 1.2 });
        bCont.addChild(tBg);

        const tTxt = new Text({
          text: b.timer,
          style: { fontFamily: this.FONT_FAMILY, fontSize: 9, fill: '#facc15', fontWeight: 'bold' }
        });
        tTxt.anchor.set(0.5);
        tTxt.x = 0;
        tTxt.y = 30;
        bCont.addChild(tTxt);
      }

      bCont.on('pointerdown', () => {
        sound.playClick();
        alert(`✨ ${b.label}!`);
      });

      worldCont.addChild(bCont);
    });

    // 4. Đền Thờ 3D Trung Tâm (Radiant Temple)
    const templeCont = new Container();
    templeCont.x = 360;
    templeCont.y = 520;

    // Vầng hào quang thánh đường tỏa sáng phía sau
    const halo = new Graphics();
    halo.ellipse(0, -20, 200, 160);
    halo.fill({ color: 0xfef08a, alpha: 0.18 });
    halo.ellipse(0, -20, 140, 110);
    halo.fill({ color: 0xffffff, alpha: 0.25 });
    templeCont.addChild(halo);

    const templeSp = new Sprite(PixelAssetManager.getRadiantTempleTexture(460, 370));
    templeSp.anchor.set(0.5);
    templeCont.addChild(templeSp);
    worldCont.addChild(templeCont);

    // 5. Mặt nước & Rương Cột Mốc (Milestone Chest on Dark Water)
    const waterLevel = 750;
    const waterG = new Graphics();
    // Vùng nước tối huyền ảo phản chiếu
    waterG.ellipse(360, 840, 310, 120);
    waterG.fill({ color: 0x0f172a, alpha: 0.75 });
    // Vòng sóng nước
    waterG.ellipse(360, 840, 260, 80);
    waterG.stroke({ color: 0x38bdf8, width: 2, alpha: 0.4 });
    waterG.ellipse(360, 850, 180, 50);
    waterG.stroke({ color: 0x60a5fa, width: 1.5, alpha: 0.3 });
    worldCont.addChild(waterG);

    // Rương Cột Mốc Tím Vàng (Milestone Chest)
    const chestCont = new Container();
    chestCont.x = 360;
    chestCont.y = 835;
    chestCont.eventMode = 'static';
    chestCont.cursor = 'pointer';

    const chestSp = new Sprite(PixelAssetManager.getMilestoneChestTexture(120, 85));
    chestSp.anchor.set(0.5);
    chestCont.addChild(chestSp);

    // Huy hiệu "Reach 50-40" dưới rương
    const reachBadge = new Graphics();
    reachBadge.roundRect(-60, 36, 120, 26, 8);
    reachBadge.fill({ color: 0x4c1d95 });
    reachBadge.stroke({ color: 0xfacc15, width: 2 });
    chestCont.addChild(reachBadge);

    const reachTxt = new Text({
      text: 'Reach 50-40',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#fef08a', fontWeight: 'bold' }
    });
    reachTxt.anchor.set(0.5);
    reachTxt.x = 0;
    reachTxt.y = 49;
    chestCont.addChild(reachTxt);

    chestCont.on('pointerdown', () => {
      sound.playMerge();
      alert('🎁 MILESTONE MYTHIC CHEST:\n• Complete Wave 50-40 to unlock:\n  +1000 💎 Diamonds\n  +10,000 💰 Gold\n  +1 METEOR SHOWER Weapon (Tier 5 Mythic)!');
    });
    worldCont.addChild(chestCont);

    // 6. Action Buttons Bar
    const actionY = 1045;

    // Button 1: Hero Patrol
    const patrolCont = new Container();
    patrolCont.x = 85;
    patrolCont.y = actionY;
    patrolCont.eventMode = 'static';
    patrolCont.cursor = 'pointer';

    const patrolSp = new Sprite(PixelAssetManager.getFeatureButtonTexture(100, 100, 'SAND'));
    patrolSp.anchor.set(0.5);
    patrolCont.addChild(patrolSp);

    const patrolTxt = new Text({
      text: 'Hero Patrol\n04:12:00',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 11, fill: '#ffffff', align: 'center', fontWeight: 'bold', lineHeight: 14 }
    });
    patrolTxt.anchor.set(0.5);
    patrolTxt.x = 0;
    patrolTxt.y = 22;
    patrolCont.addChild(patrolTxt);

    patrolCont.on('pointerdown', () => {
      sound.playMerge();
      const bonusGold = 250;
      this.saveData.permanentGold += bonusGold;
      this.saveGame();
      this.renderMainMenu();
      alert(`🎁 PATROL REWARDS HARVESTED (HERO PATROL):\n+${bonusGold} 💰 Permanent Gold!`);
    });
    worldCont.addChild(patrolCont);

    // Button 2: Chunky Play Button
    const playCont = new Container();
    playCont.x = 330;
    playCont.y = actionY;
    playCont.eventMode = 'static';
    playCont.cursor = 'pointer';

    const playSp = new Sprite(PixelAssetManager.getChunkyPlayButtonTexture(255, 95));
    playSp.anchor.set(0.5);
    playCont.addChild(playSp);

    playCont.on('pointerdown', () => {
      if (this.saveData.energy < 5) {
        this.saveData.energy = 999;
      }
      this.saveGame();
      sound.playMerge();
      this.startBattle();
    });
    worldCont.addChild(playCont);

    // Button 3: Fast Auto Merge
    const demonBtnCont = new Container();
    demonBtnCont.x = 515;
    demonBtnCont.y = actionY;
    demonBtnCont.eventMode = 'static';
    demonBtnCont.cursor = 'pointer';

    const demonSp = new Sprite(PixelAssetManager.getFeatureButtonTexture(72, 95, 'PURPLE'));
    demonSp.anchor.set(0.5);
    demonBtnCont.addChild(demonSp);

    demonBtnCont.on('pointerdown', () => {
      sound.playClick();
      alert('⚡ SPEED UP: Auto fast merge unlocked!');
    });
    worldCont.addChild(demonBtnCont);

    // Button 4: Expedition
    const expCont = new Container();
    expCont.x = 635;
    expCont.y = actionY;
    expCont.eventMode = 'static';
    expCont.cursor = 'pointer';

    const expSp = new Sprite(PixelAssetManager.getFeatureButtonTexture(100, 100, 'MAP'));
    expSp.anchor.set(0.5);
    expCont.addChild(expSp);

    const expTxt = new Text({
      text: 'Expedition',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 11, fill: '#ffffff', align: 'center', fontWeight: 'bold' }
    });
    expTxt.anchor.set(0.5);
    expTxt.x = 0;
    expTxt.y = 24;
    expCont.addChild(expTxt);

    expCont.on('pointerdown', () => {
      sound.playClick();
      alert('🧭 EXPEDITION:\n500-Floor Tower climb is now open! Earn sacred gear cogs!');
    });
    worldCont.addChild(expCont);

    this.mainMenuContainer.addChild(worldCont);
  }

  // ================= TAB 2: SHOP & GACHA CHESTS ================= //
  private renderShopTab() {
    const cont = new Container();
    cont.x = 36;
    cont.y = 175;

    const title = new Text({
      text: '🎰 CỬA HÀNG VẬT PHẨM & RÚT HÒM GACHA',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 22, fill: '#facc15', fontWeight: 'bold' }
    });
    cont.addChild(title);

    const sub = new Text({
      text: 'Mở hòm để MỞ KHÓA các loại súng Tier 2 -> Tier 5 và nhận Vàng/Kim Cương vĩnh viễn!',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#94a3b8' }
    });
    sub.y = 30;
    cont.addChild(sub);

    // 1. Hòm Chiến Binh Bạc (Common Gear Chest - 200 Gold)
    const commonCard = new Container();
    commonCard.y = 65;

    const cBg = new Graphics();
    cBg.roundRect(0, 0, 648, 205, 14);
    cBg.fill({ color: 0x1e293b });
    cBg.stroke({ color: 0x38bdf8, width: 2.5 });
    commonCard.addChild(cBg);

    const cTitle = new Text({
      text: '📦 HÒM BÁNH RĂNG CHIẾN BINH (200 💰)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 18, fill: '#38bdf8', fontWeight: 'bold' }
    });
    cTitle.x = 24;
    cTitle.y = 18;
    commonCard.addChild(cTitle);

    const cDesc = new Text({
      text: '• Cơ hội mở khóa súng Tier 2 (Súng Băng CRYO, Đại Bác CANNON)!\n• Hoặc nâng cấp vĩnh viễn +1 Cấp cho súng bạn đang sở hữu.\n• Nhận 100 - 300 Vàng thưởng.',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#cbd5e1', lineHeight: 22 }
    });
    cDesc.x = 24;
    cDesc.y = 52;
    commonCard.addChild(cDesc);

    const cBtn = new Container();
    cBtn.x = 24;
    cBtn.y = 138;
    cBtn.eventMode = 'static';
    cBtn.cursor = 'pointer';
    cBtn.hitArea = new Rectangle(0, 0, 260, 48);

    const cBtnBg = new Graphics();
    cBtnBg.roundRect(0, 0, 260, 48, 8);
    cBtnBg.fill({ color: this.saveData.permanentGold >= 200 ? 0x0284c7 : 0x475569 });
    cBtnBg.stroke({ color: 0x7dd3fc, width: 2 });
    cBtn.addChild(cBtnBg);

    const cBtnTxt = new Text({
      text: 'MỞ HÒM (200 💰)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#ffffff', fontWeight: 'bold' }
    });
    cBtnTxt.anchor.set(0.5);
    cBtnTxt.x = 130;
    cBtnTxt.y = 24;
    cBtn.addChild(cBtnTxt);

    cBtn.on('pointerdown', () => {
      this.rollGachaReward('COMMON');
    });
    commonCard.addChild(cBtn);
    cont.addChild(commonCard);

    // 2. Hòm Hoàng Gia Thần Thoại (Royal Mythic Chest - 60 Gems)
    const royalCard = new Container();
    royalCard.y = 290;

    const rBg = new Graphics();
    rBg.roundRect(0, 0, 648, 225, 14);
    rBg.fill({ color: 0x2e1065 });
    rBg.stroke({ color: 0xfacc15, width: 3 });
    royalCard.addChild(rBg);

    const rTitle = new Text({
      text: '👑 HÒM HOÀNG GIA THẦN THOẠI (60 💎)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 18, fill: '#facc15', fontWeight: 'bold' }
    });
    rTitle.x = 24;
    rTitle.y = 18;
    royalCard.addChild(rTitle);

    const rDesc = new Text({
      text: '• CHẮC CHẮN MỞ KHÓA SÚNG CAO CẤP TIER 2 - 5!\n  (Súng Sét TESLA, Bắn Tỉa SNIPER, Minigun, Thiên Thạch METEOR)\n• Nếu đã mở hết, nhận ngay Nâng Cấp +2 Cấp cho súng huyền thoại!\n• Nhận thêm 1,000 💰 Vàng vĩnh viễn.',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#f3e8ff', lineHeight: 22 }
    });
    rDesc.x = 24;
    rDesc.y = 52;
    royalCard.addChild(rDesc);

    const rBtn = new Container();
    rBtn.x = 24;
    rBtn.y = 158;
    rBtn.eventMode = 'static';
    rBtn.cursor = 'pointer';
    rBtn.hitArea = new Rectangle(0, 0, 260, 48);

    const rBtnBg = new Graphics();
    rBtnBg.roundRect(0, 0, 260, 48, 8);
    rBtnBg.fill({ color: this.saveData.diamonds >= 60 ? 0x9333ea : 0x475569 });
    rBtnBg.stroke({ color: 0xfde047, width: 2 });
    rBtn.addChild(rBtnBg);

    const rBtnTxt = new Text({
      text: 'MỞ HÒM (60 💎)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#ffffff', fontWeight: 'bold' }
    });
    rBtnTxt.anchor.set(0.5);
    rBtnTxt.x = 130;
    rBtnTxt.y = 24;
    rBtn.addChild(rBtnTxt);

    rBtn.on('pointerdown', () => {
      this.rollGachaReward('ROYAL');
    });
    royalCard.addChild(rBtn);
    cont.addChild(royalCard);

    // 3. Quà Tặng Miễn Phí Mỗi Ngày (Daily Supply)
    const dailyCard = new Container();
    dailyCard.y = 535;

    const dBg = new Graphics();
    dBg.roundRect(0, 0, 648, 140, 14);
    dBg.fill({ color: 0x064e3b });
    dBg.stroke({ color: 0x34d399, width: 2 });
    dailyCard.addChild(dBg);

    const dTitle = new Text({
      text: '🎁 TIẾP TẾ CHIẾN ĐẤU MỖI NGÀY (MIỄN PHÍ)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 17, fill: '#34d399', fontWeight: 'bold' }
    });
    dTitle.x = 24;
    dTitle.y = 16;
    dailyCard.addChild(dTitle);

    const dDesc = new Text({
      text: 'Nhận ngay +50 💎 Kim Cương và +500 💰 Vàng để tiếp sức người chơi!',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#a7f3d0' }
    });
    dDesc.x = 24;
    dDesc.y = 48;
    dailyCard.addChild(dDesc);

    const dBtn = new Container();
    dBtn.x = 24;
    dBtn.y = 80;
    dBtn.eventMode = 'static';
    dBtn.cursor = 'pointer';
    dBtn.hitArea = new Rectangle(0, 0, 260, 42);

    const dBtnBg = new Graphics();
    dBtnBg.roundRect(0, 0, 260, 42, 8);
    dBtnBg.fill({ color: 0x059669 });
    dBtnBg.stroke({ color: 0x6ee7b7, width: 2 });
    dBtn.addChild(dBtnBg);

    const dBtnTxt = new Text({
      text: 'NHẬN QUÀ MIỄN PHÍ',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 14, fill: '#ffffff', fontWeight: 'bold' }
    });
    dBtnTxt.anchor.set(0.5);
    dBtnTxt.x = 130;
    dBtnTxt.y = 21;
    dBtn.addChild(dBtnTxt);

    dBtn.on('pointerdown', () => {
      this.saveData.diamonds += 50;
      this.saveData.permanentGold += 500;
      this.saveGame();
      sound.playMerge();
      alert('🎉 REWARD CLAIMED SUCCESSFULLY:\n+50 💎 Diamonds\n+500 💰 Permanent Gold!');
      this.renderMainMenu();
    });
    dailyCard.addChild(dBtn);
    cont.addChild(dailyCard);

    this.mainMenuContainer.addChild(cont);
  }

  // Roll Gacha rewards for weapons & upgrades
  private rollGachaReward(type: 'COMMON' | 'ROYAL') {
    if (type === 'COMMON') {
      if (this.saveData.permanentGold < 200) {
        sound.playHit();
        alert('Not enough permanent Gold (Need 200 💰)! Clear more waves to earn gold.');
        return;
      }
      this.saveData.permanentGold -= 200;
    } else {
      if (this.saveData.diamonds < 60) {
        sound.playHit();
        alert('Not enough Diamonds (Need 60 💎)!');
        return;
      }
      this.saveData.diamonds -= 60;
    }

    const allGuns: GunKind[] = [
      'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER',
      'CRYO', 'CANNON', 'TESLA', 'SNIPER', 'MINIGUN', 'METEOR'
    ];

    const lockedGuns = allGuns.filter(g => !this.saveData.unlockedGuns.includes(g));
    const unlockChance = type === 'ROYAL' ? 0.9 : 0.45;

    if (lockedGuns.length > 0 && Math.random() < unlockChance) {
      // Prioritize high tier weapons when rolling Royal
      let pickedGun: GunKind;
      if (type === 'ROYAL') {
        const highTierLocked = lockedGuns.filter(g => GUN_TIERS[g] >= 3);
        pickedGun = highTierLocked.length > 0
          ? highTierLocked[Math.floor(Math.random() * highTierLocked.length)]
          : lockedGuns[Math.floor(Math.random() * lockedGuns.length)];
      } else {
        pickedGun = lockedGuns[Math.floor(Math.random() * lockedGuns.length)];
      }

      this.saveData.unlockedGuns.push(pickedGun);
      this.saveData.gunLevels[pickedGun] = 1;
      const tier = GUN_TIERS[pickedGun];
      const rarity = RARITY_CONFIGS[tier];

      sound.playMerge();
      alert(`🎉 CONGRATULATIONS! NEW WEAPON UNLOCKED!\n\n[${GUN_NAMES[pickedGun]}]\n• Rarity: Tier ${tier} (${rarity.name})\n• Added to your Arsenal!`);
    } else {
      // Upgrade existing owned weapon
      const myGuns = this.saveData.unlockedGuns;
      const g = myGuns[Math.floor(Math.random() * myGuns.length)];
      const bonusLvl = type === 'ROYAL' ? 2 : 1;
      this.saveData.gunLevels[g] = (this.saveData.gunLevels[g] || 1) + bonusLvl;
      const bonusGold = type === 'ROYAL' ? 1000 : 200;
      this.saveData.permanentGold += bonusGold;

      sound.playMerge();
      alert(`🎉 CHEST REWARD:\n• Upgraded [${GUN_NAMES[g]}] +${bonusLvl} Level (Now Lv.${this.saveData.gunLevels[g]})!\n• Bonus: +${bonusGold} 💰 Permanent Gold!`);
    }

    this.saveGame();
    this.renderMainMenu();
  }

  // ================= TAB 3: EQUIPMENT (TRANG BỊ 5 SÚNG & KHO SÚNG) ================= //
  private renderEquipmentTab() {
    const cont = new Container();
    cont.x = 36;
    cont.y = 175;

    // 1. Tiêu đề Đội hình ra trận
    const title = new Text({
      text: `🎒 ĐỘI HÌNH RA TRẬN (${this.saveData.equippedGuns.length}/5 Súng  |  ${this.saveData.equippedBuffs.length}/2 Buff)`,
      style: { fontFamily: this.FONT_FAMILY, fontSize: 18, fill: '#facc15', fontWeight: 'bold' }
    });
    cont.addChild(title);

    const sub = new Text({
      text: 'Trong trận chiến, Bánh Răng & Roll chỉ xuất hiện 5 Súng & 2 Buff này!',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#94a3b8' }
    });
    sub.y = 26;
    cont.addChild(sub);

    // 2. Hàng 5 Súng Đã Trang Bị
    const equippedRow = new Container();
    equippedRow.y = 55;

    for (let i = 0; i < 5; i++) {
      const slot = new Container();
      slot.x = i * 86;

      const gKind = this.saveData.equippedGuns[i];
      const tier = gKind ? GUN_TIERS[gKind] : 1;
      const rar = RARITY_CONFIGS[tier];

      const sBg = new Graphics();
      sBg.roundRect(0, 0, 80, 80, 10);
      sBg.fill({ color: gKind ? 0x1e293b : 0x0f172a });
      sBg.stroke({ color: gKind ? rar.color : 0x334155, width: 2.5 });
      slot.addChild(sBg);

      if (gKind) {
        const sp = new Sprite(PixelAssetManager.getGunBarrelTexture(gKind, this.saveData.gunLevels[gKind] || 1));
        sp.anchor.set(0.5);
        sp.x = 40;
        sp.y = 38;
        slot.addChild(sp);

        const lvlTxt = new Text({
          text: `Lv.${this.saveData.gunLevels[gKind] || 1}`,
          style: { fontFamily: this.FONT_FAMILY, fontSize: 11, fill: '#facc15', fontWeight: 'bold' }
        });
        lvlTxt.anchor.set(0.5);
        lvlTxt.x = 40;
        lvlTxt.y = 65;
        slot.addChild(lvlTxt);

        slot.eventMode = 'static';
        slot.cursor = 'pointer';
        slot.on('pointerdown', () => {
          if (this.saveData.equippedGuns.length > 1) {
            this.saveData.equippedGuns.splice(i, 1);
            this.saveGame();
            sound.playClick();
            this.renderMainMenu();
          } else {
            alert('You must keep at least 1 weapon equipped in battle!');
          }
        });
      } else {
        const emptyTxt = new Text({
          text: '+\nEmpty',
          style: { fontFamily: this.FONT_FAMILY, fontSize: 12, fill: '#64748b', align: 'center', fontWeight: 'bold' }
        });
        emptyTxt.anchor.set(0.5);
        emptyTxt.x = 40;
        emptyTxt.y = 40;
        slot.addChild(emptyTxt);
      }

      equippedRow.addChild(slot);
    }

    // 2 Buff Đã Trang Bị (Góc Phải)
    for (let b = 0; b < 2; b++) {
      const bSlot = new Container();
      bSlot.x = 470 + b * 86;

      const bKind = this.saveData.equippedBuffs[b];
      const bBg = new Graphics();
      bBg.roundRect(0, 0, 80, 80, 10);
      bBg.fill({ color: bKind ? 0x312e81 : 0x0f172a });
      bBg.stroke({ color: bKind ? 0xfacc15 : 0x334155, width: 2.5 });
      bSlot.addChild(bBg);

      if (bKind) {
        const sp = new Sprite(PixelAssetManager.getBuffTexture(bKind, 1));
        sp.anchor.set(0.5);
        sp.x = 40;
        sp.y = 36;
        bSlot.addChild(sp);

        const bTxt = new Text({
          text: bKind,
          style: { fontFamily: this.FONT_FAMILY, fontSize: 11, fill: '#ffffff', fontWeight: 'bold' }
        });
        bTxt.anchor.set(0.5);
        bTxt.x = 40;
        bTxt.y = 65;
        bSlot.addChild(bTxt);
      }

      equippedRow.addChild(bSlot);
    }

    cont.addChild(equippedRow);

    // 3. Kho Súng Tổng Thể (Inventory: 11 Loại Súng)
    const invTitle = new Text({
      text: `📦 BỘ SƯU TẬP SÚNG (${this.saveData.unlockedGuns.length}/11 Đã Mở Khóa):`,
      style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#38bdf8', fontWeight: 'bold' }
    });
    invTitle.y = 155;
    cont.addChild(invTitle);

    const allGuns: GunKind[] = [
      'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER',
      'CRYO', 'CANNON', 'TESLA', 'SNIPER', 'MINIGUN', 'METEOR'
    ];

    allGuns.forEach((g, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);

      const card = new Container();
      card.x = col * 330;
      card.y = 190 + row * 82;
      card.hitArea = new Rectangle(0, 0, 318, 74);

      const isUnlocked = this.saveData.unlockedGuns.includes(g);
      const isEquipped = this.saveData.equippedGuns.includes(g);
      const tier = GUN_TIERS[g];
      const rar = RARITY_CONFIGS[tier];
      const lvl = this.saveData.gunLevels[g] || 1;

      const bg = new Graphics();
      bg.roundRect(0, 0, 318, 74, 10);
      bg.fill({ color: isUnlocked ? (isEquipped ? 0x14532d : 0x1e293b) : 0x0f172a });
      bg.stroke({ color: isUnlocked ? rar.color : 0x334155, width: isEquipped ? 3 : 1.5 });
      card.addChild(bg);

      // Icon súng
      const icon = new Sprite(PixelAssetManager.getGunBarrelTexture(g, lvl));
      icon.anchor.set(0.5);
      icon.x = 40;
      icon.y = 37;
      if (!isUnlocked) icon.alpha = 0.4;
      card.addChild(icon);

      // Tên súng & Tier
      const nameTxt = new Text({
        text: `${GUN_NAMES[g]} ${isUnlocked ? `Lv.${lvl}` : '🔒'}`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 14, fill: isUnlocked ? rar.hex : '#64748b', fontWeight: 'bold' }
      });
      nameTxt.x = 80;
      nameTxt.y = 12;
      card.addChild(nameTxt);

      const tierTxt = new Text({
        text: `Tier ${tier} [${rar.name}]`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 11, fill: isUnlocked ? '#94a3b8' : '#475569' }
      });
      tierTxt.x = 80;
      tierTxt.y = 32;
      card.addChild(tierTxt);

      if (isUnlocked) {
        // Nút Trang Bị / Tháo Gỡ
        const eqBtn = new Container();
        eqBtn.x = 210;
        eqBtn.y = 16;
        eqBtn.eventMode = 'static';
        eqBtn.cursor = 'pointer';
        eqBtn.hitArea = new Rectangle(0, 0, 95, 42);

        const btnBg = new Graphics();
        btnBg.roundRect(0, 0, 95, 42, 6);
        btnBg.fill({ color: isEquipped ? 0x16a34a : 0x0284c7 });
        btnBg.stroke({ color: isEquipped ? 0x4ade80 : 0x38bdf8, width: 1.5 });
        eqBtn.addChild(btnBg);

        const btnTxt = new Text({
          text: isEquipped ? 'ĐANG DÙNG\n(Gỡ)' : '+ TRANG BỊ',
          style: { fontFamily: this.FONT_FAMILY, fontSize: 11, fill: '#ffffff', align: 'center', fontWeight: 'bold' }
        });
        btnTxt.anchor.set(0.5);
        btnTxt.x = 47;
        btnTxt.y = 21;
        eqBtn.addChild(btnTxt);

        eqBtn.on('pointerdown', () => {
          if (isEquipped) {
            if (this.saveData.equippedGuns.length > 1) {
              this.saveData.equippedGuns = this.saveData.equippedGuns.filter(item => item !== g);
            } else {
              alert('You must keep at least 1 weapon in your loadout!');
              return;
            }
          } else {
            if (this.saveData.equippedGuns.length < 5) {
              this.saveData.equippedGuns.push(g);
            } else {
              this.saveData.equippedGuns.shift();
              this.saveData.equippedGuns.push(g);
            }
          }
          this.saveGame();
          sound.playClick();
          this.renderMainMenu();
        });

        card.addChild(eqBtn);
      } else {
        const lockTxt = new Text({
          text: '🔒 Quay Gacha\nđể mở khóa',
          style: { fontFamily: this.FONT_FAMILY, fontSize: 11, fill: '#ef4444', align: 'center', fontWeight: 'bold' }
        });
        lockTxt.x = 210;
        lockTxt.y = 18;
        card.addChild(lockTxt);
      }

      cont.addChild(card);
    });

    // 4. Chọn 2 Buff bên dưới
    const buffSection = new Container();
    buffSection.y = 695;

    const bTitle = new Text({
      text: '✨ CHỌN 2 LOẠI BUFF RA TRẬN:',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#facc15', fontWeight: 'bold' }
    });
    buffSection.addChild(bTitle);

    const allBuffs: BuffKind[] = ['DMG', 'SPEED', 'FILL', 'CRIT'];
    const bNames: Record<BuffKind, string> = {
      DMG: 'Buff Sát Thương',
      SPEED: 'Buff Tốc Độ Cò',
      FILL: 'Buff Nạp Năng Lượng',
      CRIT: 'Buff Bạo Kích',
    };

    allBuffs.forEach((b, i) => {
      const bCard = new Container();
      bCard.x = i * 164;
      bCard.y = 30;
      bCard.eventMode = 'static';
      bCard.cursor = 'pointer';
      bCard.hitArea = new Rectangle(0, 0, 154, 60);

      const isEquipped = this.saveData.equippedBuffs.includes(b);
      const bBg = new Graphics();
      bBg.roundRect(0, 0, 154, 60, 8);
      bBg.fill({ color: isEquipped ? 0x713f12 : 0x1e293b });
      bBg.stroke({ color: isEquipped ? 0xfacc15 : 0x475569, width: isEquipped ? 2.5 : 1.5 });
      bCard.addChild(bBg);

      const bTxt = new Text({
        text: `${bNames[b]}\n${isEquipped ? '✔ ĐÃ CHỌN' : '+ DÙNG'}`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 12, fill: '#ffffff', align: 'center', fontWeight: 'bold', lineHeight: 18 }
      });
      bTxt.anchor.set(0.5);
      bTxt.x = 77;
      bTxt.y = 30;
      bCard.addChild(bTxt);

      bCard.on('pointerdown', () => {
        if (isEquipped) {
          if (this.saveData.equippedBuffs.length > 1) {
            this.saveData.equippedBuffs = this.saveData.equippedBuffs.filter(item => item !== b);
          }
        } else {
          if (this.saveData.equippedBuffs.length < 2) {
            this.saveData.equippedBuffs.push(b);
          } else {
            this.saveData.equippedBuffs.shift();
            this.saveData.equippedBuffs.push(b);
          }
        }
        this.saveGame();
        sound.playClick();
        this.renderMainMenu();
      });

      buffSection.addChild(bCard);
    });

    cont.addChild(buffSection);
    this.mainMenuContainer.addChild(cont);
  }

  // ================= TAB 4: TALENT (THIÊN PHÚ THÀNH TRÌ) ================= //
  private renderTalentTab() {
    const cont = new Container();
    cont.x = 36;
    cont.y = 175;

    const title = new Text({
      text: '🏛 THIÊN PHÚ THÀNH TRÌ (TALENT TREE)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 22, fill: '#facc15', fontWeight: 'bold' }
    });
    cont.addChild(title);

    const sub = new Text({
      text: 'Nâng cấp vĩnh viễn sức mạnh Thành Trì và Kinh tế bằng Vàng vĩnh viễn 💰',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#94a3b8' }
    });
    sub.y = 30;
    cont.addChild(sub);

    const talents = this.saveData.talents || {
      hpLevel: 0,
      armorLevel: 0,
      startGoldLevel: 0,
      bountyLevel: 0,
    };

    const talentList: {
      key: keyof typeof talents;
      title: string;
      desc: (lvl: number) => string;
      cost: (lvl: number) => number;
      maxLvl: number;
    }[] = [
      {
        key: 'hpLevel',
        title: '❤️ MÁU THÀNH TRÌ (FORTRESS HP)',
        desc: (lvl) => `Tăng +50 Máu tối đa mỗi cấp (Hiện tại: +${lvl * 50} HP)`,
        cost: (lvl) => (lvl + 1) * 80,
        maxLvl: 20,
      },
      {
        key: 'armorLevel',
        title: '🛡 GIÁP THÉP KIÊN CỐ (ARMOR)',
        desc: (lvl) => `Giảm 5% sát thương nhận vào từ quái mỗi cấp (Hiện tại: -${lvl * 5}%)`,
        cost: (lvl) => (lvl + 1) * 100,
        maxLvl: 10,
      },
      {
        key: 'startGoldLevel',
        title: '💰 NGÂN KHỐ KHỞI ĐIỂM (STARTING GOLD)',
        desc: (lvl) => `Tăng +5 Vàng mỗi khi bắt đầu ván mới (Hiện tại: +${lvl * 5} Vàng)`,
        cost: (lvl) => (lvl + 1) * 120,
        maxLvl: 10,
      },
      {
        key: 'bountyLevel',
        title: '🎯 THỢ SĂN TIỀN THƯỞNG (BOUNTY)',
        desc: (lvl) => `Tăng +10% Vàng rơi ra khi hạ gục quái (Hiện tại: +${lvl * 10}%)`,
        cost: (lvl) => (lvl + 1) * 150,
        maxLvl: 10,
      },
    ];

    talentList.forEach((t, idx) => {
      const card = new Container();
      card.y = 65 + idx * 135;

      const lvl = talents[t.key] || 0;
      const isMax = lvl >= t.maxLvl;
      const cost = t.cost(lvl);
      const canAfford = this.saveData.permanentGold >= cost && !isMax;

      const bg = new Graphics();
      bg.roundRect(0, 0, 648, 120, 14);
      bg.fill({ color: 0x1e293b });
      bg.stroke({ color: 0x475569, width: 2 });
      card.addChild(bg);

      const tTitle = new Text({
        text: `${t.title} [Cấp ${lvl}/${t.maxLvl}]`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#38bdf8', fontWeight: 'bold' }
      });
      tTitle.x = 20;
      tTitle.y = 16;
      card.addChild(tTitle);

      const tDesc = new Text({
        text: t.desc(lvl),
        style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#cbd5e1' }
      });
      tDesc.x = 20;
      tDesc.y = 44;
      card.addChild(tDesc);

      // Thanh tiến trình nhỏ
      const barBg = new Graphics();
      barBg.roundRect(20, 75, 360, 18, 5);
      barBg.fill({ color: 0x0f172a });
      const fillW = Math.round(360 * (lvl / t.maxLvl));
      if (fillW > 0) {
        barBg.roundRect(20, 75, fillW, 18, 5);
        barBg.fill({ color: 0x22c55e });
      }
      card.addChild(barBg);

      // Nút Nâng Cấp
      const upBtn = new Container();
      upBtn.x = 440;
      upBtn.y = 35;
      upBtn.eventMode = 'static';
      upBtn.cursor = canAfford ? 'pointer' : 'not-allowed';
      upBtn.hitArea = new Rectangle(0, 0, 190, 52);

      const uBg = new Graphics();
      uBg.roundRect(0, 0, 190, 52, 10);
      uBg.fill({ color: isMax ? 0x334155 : (canAfford ? 0x16a34a : 0x475569) });
      uBg.stroke({ color: isMax ? 0x64748b : (canAfford ? 0x4ade80 : 0x64748b), width: 2 });
      upBtn.addChild(uBg);

      const uTxt = new Text({
        text: isMax ? 'TỐI ĐA' : `NÂNG (${cost} 💰)`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 14, fill: '#ffffff', fontWeight: 'bold' }
      });
      uTxt.anchor.set(0.5);
      uTxt.x = 95;
      uTxt.y = 26;
      upBtn.addChild(uTxt);

      if (canAfford) {
        upBtn.on('pointerdown', () => {
          this.saveData.permanentGold -= cost;
          if (!this.saveData.talents) {
            this.saveData.talents = { hpLevel: 0, armorLevel: 0, startGoldLevel: 0, bountyLevel: 0 };
          }
          this.saveData.talents[t.key] = lvl + 1;
          this.saveGame();
          sound.playMerge();
          this.renderMainMenu();
        });
      }

      card.addChild(upBtn);
      cont.addChild(card);
    });

    this.mainMenuContainer.addChild(cont);
  }

  // ================= TAB 5: MODES (CHỌN CHẾ ĐỘ & BẢN ĐỒ CHIẾN ĐẤU) ================= //
  private renderModesTab() {
    const cont = new Container();
    cont.x = 36;
    cont.y = 175;

    // Chuyển đổi giữa Chiến Dịch & Sinh Tồn
    const modeTabs: { mode: GameMode; label: string }[] = [
      { mode: 'CAMPAIGN', label: '🛡 CHIẾN DỊCH (10 Wave)' },
      { mode: 'SURVIVAL', label: '💀 SINH TỒN (Vô Tận)' },
    ];

    modeTabs.forEach((m, idx) => {
      const btn = new Container();
      btn.x = idx * 330;
      btn.y = 0;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.hitArea = new Rectangle(0, 0, 318, 52);

      const isCurrent = this.gameMode === m.mode;
      const bg = new Graphics();
      bg.roundRect(0, 0, 318, 52, 10);
      bg.fill({ color: isCurrent ? 0x059669 : 0x1e293b });
      bg.stroke({ color: isCurrent ? 0x34d399 : 0x475569, width: 2 });
      btn.addChild(bg);

      const text = new Text({
        text: m.label,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#ffffff', fontWeight: 'bold' }
      });
      text.anchor.set(0.5);
      text.x = 159;
      text.y = 26;
      btn.addChild(text);

      btn.on('pointerdown', () => {
        this.gameMode = m.mode;
        sound.playClick();
        this.renderMainMenu();
      });

      cont.addChild(btn);
    });

    // Danh sách bản đồ
    if (this.gameMode === 'CAMPAIGN') {
      const mapContainer = new Container();
      mapContainer.y = 75;

      const maps = [
        { id: 1, name: 'Stage 1: Gear Forest', desc: '10 Waves • Standard Difficulty • Base Invaders', unlocked: true },
        { id: 2, name: 'Stage 2: Iron Citadel', desc: '10 Waves • Armored Invaders +20% HP', unlocked: this.saveData.highestCampaignStage >= 2 },
        { id: 3, name: 'Stage 3: Magma Crater', desc: '10 Waves • Molten Fiends +40% HP & Fire Boss', unlocked: this.saveData.highestCampaignStage >= 3 },
      ];

      maps.forEach((mp, idx) => {
        const card = new Container();
        card.y = idx * 115;
        card.eventMode = 'static';
        card.cursor = mp.unlocked ? 'pointer' : 'not-allowed';
        card.hitArea = new Rectangle(0, 0, 648, 100);

        const isSelected = this.saveData.selectedCampaignMap === mp.id;
        const bg = new Graphics();
        bg.roundRect(0, 0, 648, 100, 12);
        bg.fill({ color: isSelected ? 0x1e3a8a : (mp.unlocked ? 0x1e293b : 0x0f172a) });
        bg.stroke({ color: isSelected ? 0x38bdf8 : (mp.unlocked ? 0x475569 : 0x334155), width: isSelected ? 3 : 1.5 });
        card.addChild(bg);

        const nameTxt = new Text({
          text: mp.name + (mp.unlocked ? (isSelected ? ' (SELECTED)' : '') : ' 🔒 (Locked)'),
          style: { fontFamily: this.FONT_FAMILY, fontSize: 17, fill: mp.unlocked ? '#facc15' : '#64748b', fontWeight: 'bold' }
        });
        nameTxt.x = 24;
        nameTxt.y = 20;
        card.addChild(nameTxt);

        const descTxt = new Text({
          text: mp.desc,
          style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#94a3b8' }
        });
        descTxt.x = 24;
        descTxt.y = 56;
        card.addChild(descTxt);

        if (mp.unlocked) {
          card.on('pointerdown', () => {
            this.saveData.selectedCampaignMap = mp.id;
            this.saveGame();
            sound.playClick();
            this.renderMainMenu();
          });
        }

        mapContainer.addChild(card);
      });

      cont.addChild(mapContainer);
    } else {
      // Survival info card
      const survCont = new Container();
      survCont.y = 75;

      const survBg = new Graphics();
      survBg.roundRect(0, 0, 648, 330, 16);
      survBg.fill({ color: 0x1e1b4b });
      survBg.stroke({ color: 0x818cf8, width: 3 });
      survCont.addChild(survBg);

      const survTitle = new Text({
        text: '💀 ENDLESS SURVIVAL ARENA',
        style: { fontFamily: this.FONT_FAMILY, fontSize: 22, fill: '#facc15', fontWeight: 'bold' }
      });
      survTitle.anchor.set(0.5);
      survTitle.x = 324;
      survTitle.y = 45;
      survCont.addChild(survTitle);

      const survDesc = new Text({
        text: '• Endless invasion waves, with a Colossal Boss appearing every 10 Waves!\n• The longer you survive, the more Gold 💰 and Diamonds 💎 you earn!\n• Master gear linkages to push your tactical limits.',
        style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#e0e7ff', lineHeight: 28 }
      });
      survDesc.x = 36;
      survDesc.y = 90;
      survCont.addChild(survDesc);

      const highWaveText = new Text({
        text: `🏆 BEST RECORD: WAVE ${this.saveData.highestSurvivalWave}`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 20, fill: '#34d399', fontWeight: 'bold' }
      });
      highWaveText.anchor.set(0.5);
      highWaveText.x = 324;
      highWaveText.y = 265;
      survCont.addChild(highWaveText);

      cont.addChild(survCont);
    }

    // Nút Bắt Đầu Xuất Trận
    const startBtn = new Container();
    startBtn.x = 84;
    startBtn.y = 520;
    startBtn.eventMode = 'static';
    startBtn.cursor = 'pointer';
    startBtn.hitArea = new Rectangle(0, 0, 480, 72);

    const sBtnBg = new Graphics();
    sBtnBg.roundRect(0, 0, 480, 72, 14);
    sBtnBg.fill({ color: 0x16a34a });
    sBtnBg.stroke({ color: 0x4ade80, width: 3 });
    startBtn.addChild(sBtnBg);

    const sBtnTxt = new Text({
      text: '⚔ XUẤT TRẬN NGAY (⚡ x5)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 22, fill: '#ffffff', fontWeight: 'bold' }
    });
    sBtnTxt.anchor.set(0.5);
    sBtnTxt.x = 240;
    sBtnTxt.y = 36;
    startBtn.addChild(sBtnTxt);

    startBtn.on('pointerdown', () => {
      if (this.saveData.energy < 5) {
        this.saveData.energy = 999;
      }
      this.saveGame();
      sound.playMerge();
      this.startBattle();
    });

    cont.addChild(startBtn);
    this.mainMenuContainer.addChild(cont);
  }

  public uiManager?: any;
  public setUIManager(ui: any) {
    this.uiManager = ui;
    this.uiContainer.visible = false;
    this.mainMenuContainer.visible = false;
    this.resultModalContainer.visible = false;
  }

  public startWave() {
    this.onStartWaveClicked();
  }

  public rollItem() {
    this.onRollClicked();
  }

  public startTutorial() {
    this.tutorialStep = 'BATTLE_ROLL';
    this.saveData.hasSeenTutorial = false;
    this.saveData.tutorialStep = 'BATTLE_ROLL';
    this.gameMode = 'CAMPAIGN';
    this.saveData.selectedCampaignMap = 1;
    this.startBattle();
  }

  // --- QUẢN LÝ BẮT ĐẦU VÁN & VỀ MÀN HÌNH CHÍNH ---
  public startBattle() {
    this.inMenu = false;
    this.isPaused = false;
    this.mainMenuContainer.visible = false;
    this.resultModalContainer.visible = false;
    if (this.uiManager) {
      this.uiManager.render();
    }
    const currentMapId = this.gameMode === 'CAMPAIGN' ? (this.saveData.selectedCampaignMap || 1) : 1;
    this.initBackground(currentMapId);
    this.initWall(currentMapId);

    this.isGameOver = false;
    this.isVictory = false;
    this.isWaveActive = false;
    this.prepPhase = true;

    this.wave = 1;
    const isTutorialMatch = !this.saveData.hasSeenTutorial || this.tutorialStep === 'BATTLE_ROLL';
    if (isTutorialMatch) {
      this.tutorialStep = 'BATTLE_ROLL';
      this.saveData.tutorialStep = 'BATTLE_ROLL';
      this.maxWave = 1;
    } else {
      this.maxWave = this.gameMode === 'CAMPAIGN' ? 25 : 999;
    }
    this.maxCastleHp = 100 + (this.saveData.talents?.hpLevel || 0) * 50;
    this.castleHp = this.maxCastleHp;
    this.castleShield = (this.saveData.talents?.shieldLevel || 0) * 80;
    this.gold = 15 + (this.saveData.talents?.startGoldLevel || 0) * 10;
    this.rollCount = 0;
    this.rollPrice = 2;

    // Xóa quái & đạn cũ
    this.enemies.forEach(e => e.active = false);
    this.enemies = [];
    this.bullets.forEach(b => b.active = false);
    this.bullets = [];
    this.fireZones = [];
    this.blackHoleZones = [];
    this.fallingMeteors = [];
    this.nuclearCraters = [];
    this.landmines = [];
    this.thornFields = [];
    this.stasisFields = [];
    this.holyCrosses = [];
    this.laserBeams = [];

    // Xóa bàn cờ cũ & reset chướng ngại vật
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        this.grid[r][c].item = null;
        this.grid[r][c].isBlocked = false;
      }
    }

    // Cài đặt ô chướng ngại vật đá theo Map chiến dịch (7 maps)
    if (this.gameMode === 'CAMPAIGN') {
      const mapId = this.saveData.selectedCampaignMap || 1;
      let blockedCoords: [number, number][] = [];
      if (mapId === 1) {
        blockedCoords = [[0, 0]];
      } else if (mapId === 2) {
        blockedCoords = [[0, 1], [3, 3], [4, 0]];
      } else if (mapId === 3) {
        blockedCoords = [[0, 0], [0, 4], [4, 0], [4, 4]];
      } else if (mapId === 4) {
        blockedCoords = [[1, 1], [1, 3], [3, 1], [3, 3]];
      } else if (mapId === 5) {
        blockedCoords = [[0, 2], [2, 0], [2, 4], [4, 2]];
      } else if (mapId === 6) {
        blockedCoords = [[0, 0], [0, 4], [4, 0], [4, 4], [2, 1]];
      } else if (mapId >= 7) {
        blockedCoords = [[1, 0], [1, 4], [3, 0], [3, 4]];
      }

      for (const [br, bc] of blockedCoords) {
        if (this.grid[br] && this.grid[br][bc]) {
          this.grid[br][bc].isBlocked = true;
        }
      }
    }

    // 1 Cò Lv1 ở giữa (2, 2)
    this.grid[2][2].item = this.createTrigger(1);

    // 1 Súng ngẫu nhiên từ danh sách 5 súng đã trang bị (trong tutorial luôn là PISTOL)
    const pool: GunKind[] = (this.saveData.equippedGuns && this.saveData.equippedGuns.length > 0)
      ? this.saveData.equippedGuns
      : (['PISTOL'] as GunKind[]);
    const starterGun = isTutorialMatch ? 'PISTOL' : pool[Math.floor(Math.random() * pool.length)];
    this.grid[1][2].item = this.createGun(starterGun, 1);

    this.syncAllGridSlots();

    this.drawStartWaveBtn(true);
    this.startWaveBtnText.text = '⚔ START WAVE 1';
    this.waveText.text = this.gameMode === 'CAMPAIGN'
      ? `STAGE ${this.saveData.selectedCampaignMap} - WAVE 1/${this.maxWave} (PREP)`
      : 'SURVIVAL - WAVE 1 (PREP)';
    this.goldText.text = `$: ${this.gold}`;
    this.hpText.text = `CASTLE HP: ${this.castleHp}/${this.maxCastleHp}`;

    const isBoss = (this.gameMode === 'CAMPAIGN' && this.wave === 10) || (this.gameMode === 'SURVIVAL' && this.wave % 10 === 0);
    sound.playBGM(isBoss ? 'BOSS' : 'BATTLE');

    if (isTutorialMatch && this.uiManager) {
      setTimeout(() => {
        this.uiManager?.showTutorialRoll();
      }, 100);
    }
  }

  public returnToMainMenu() {
    this.isPaused = false;
    this.saveGame();
    sound.playBGM('MENU');
    this.enemies.forEach(e => e.active = false);
    this.enemies = [];
    this.bullets.forEach(b => b.active = false);
    this.bullets = [];
    this.fireZones = [];
    this.blackHoleZones = [];
    this.fallingMeteors = [];
    this.nuclearCraters = [];
    this.landmines = [];
    this.thornFields = [];
    this.stasisFields = [];
    this.holyCrosses = [];
    this.laserBeams = [];
    this.showMainMenu();
    if (this.uiManager) {
      this.uiManager.render();
    }
  }

  // --- MODAL KẾT THÚC VÁN ĐẤU (THẮNG / THUA) ---
  private initResultModal() {
    this.resultModalContainer.visible = false;
    this.resultModalContainer.eventMode = 'static';
    this.resultModalContainer.hitArea = new Rectangle(0, 0, 720, 1280);
  }

  private showResultModal(isWin: boolean, waveReached: number) {
    // Permanent rewards calculation
    let earnedGold = 0;
    let earnedDia = 0;

    if (isWin) {
      earnedGold = 120;
      earnedDia = 25;
      if (this.gameMode === 'CAMPAIGN') {
        this.saveData.highestCampaignStage = Math.max(
          this.saveData.highestCampaignStage,
          this.saveData.selectedCampaignMap + 1
        );
      }
    } else {
      earnedGold = Math.max(10, waveReached * 12);
      earnedDia = Math.max(2, Math.floor(waveReached * 1.5));
      if (this.gameMode === 'SURVIVAL') {
        this.saveData.highestSurvivalWave = Math.max(
          this.saveData.highestSurvivalWave,
          waveReached
        );
      }
    }

    if (this.tutorialStep === 'BATTLE_PLAYING') {
      this.tutorialStep = 'LOBBY_SHOP';
      this.saveData.tutorialStep = 'LOBBY_SHOP';
    }

    this.saveData.permanentGold += earnedGold;
    this.saveData.diamonds += earnedDia;
    this.saveGame();

    if (this.uiManager) {
      this.uiManager.showResultModal(isWin, waveReached, earnedGold, earnedDia);
      return;
    }

    this.resultModalContainer.removeChildren();
    this.resultModalContainer.visible = true;

    // Overlay mask
    const mask = new Graphics();
    mask.rect(0, 0, 720, 1280);
    mask.fill({ color: 0x000000, alpha: 0.85 });
    const card = new Container();
    card.x = 60;
    card.y = 340;

    const bg = new Graphics();
    bg.roundRect(0, 0, 600, 480, 20);
    bg.fill({ color: 0x0f172a });
    bg.stroke({ color: isWin ? 0xfacc15 : 0xef4444, width: 4 });
    card.addChild(bg);

    const title = new Text({
      text: isWin ? '🏆 VICTORY!' : '💀 DEFEAT!',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 28,
        fill: isWin ? '#facc15' : '#ef4444',
        fontWeight: 'bold',
      }
    });
    title.anchor.set(0.5);
    title.x = 300;
    title.y = 60;
    card.addChild(title);

    const info = new Text({
      text: `Mode: ${this.gameMode === 'CAMPAIGN' ? `Campaign (Stage ${this.saveData.selectedCampaignMap})` : 'Endless Survival'}\nWave Reached: Wave ${waveReached}\n\nREWARDS:\n+${earnedGold}$ Permanent Gold 💰\n+${earnedDia} Diamonds 💎`,
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 18,
        fill: '#f8fafc',
        align: 'center',
        lineHeight: 28,
      }
    });
    info.anchor.set(0.5, 0);
    info.x = 300;
    info.y = 120;
    card.addChild(info);

    // Button MAIN MENU
    const returnBtn = new Container();
    returnBtn.x = 100;
    returnBtn.y = 360;
    returnBtn.eventMode = 'static';
    returnBtn.cursor = 'pointer';
    returnBtn.hitArea = new Rectangle(0, 0, 400, 72);

    const rBg = new Graphics();
    rBg.roundRect(0, 0, 400, 72, 12);
    rBg.fill({ color: 0x2563eb });
    rBg.stroke({ color: 0x60a5fa, width: 3 });
    returnBtn.addChild(rBg);

    const rTxt = new Text({
      text: '🏰 MAIN MENU',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 22, fill: '#ffffff', fontWeight: 'bold' }
    });
    rTxt.anchor.set(0.5);
    rTxt.x = 200;
    rTxt.y = 36;
    returnBtn.addChild(rTxt);

    returnBtn.on('pointerdown', () => {
      sound.playClick();
      this.returnToMainMenu();
    });

    card.addChild(returnBtn);
    this.resultModalContainer.addChild(card);
  }
}
