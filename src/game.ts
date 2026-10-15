import { Container, Graphics, Sprite, Text, TextStyle, Rectangle, FederatedPointerEvent } from 'pixi.js';
import { GridCell, GridItem, Bullet, Enemy, GunKind, BuffKind, EnemyKind, GameMode, UserSaveData, LightningBolt, Shockwave, VisualSpark } from './types';
import { PixelAssetManager } from './pixelArt';
import { sound } from './audio';

const DEFAULT_SAVE: UserSaveData = {
  saveVersion: 2,
  diamonds: 6472,
  permanentGold: 12118,
  energy: 20,
  maxEnergy: 20,
  playerLevel: 115,
  playerExp: 75,
  unlockedGuns: ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'],
  equippedGuns: ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'],
  equippedBuffs: ['DMG', 'SPEED'],
  gunLevels: {
    PISTOL: 1,
    CROSSBOW: 1,
    SLINGSHOT: 1,
    SHOTGUN: 1,
    FLAMER: 1,
    CRYO: 0,
    CANNON: 0,
    TESLA: 0,
    SNIPER: 0,
    MINIGUN: 0,
    METEOR: 0,
  },
  selectedCampaignMap: 1,
  highestCampaignStage: 1,
  highestSurvivalWave: 0,
  talents: {
    hpLevel: 0,
    armorLevel: 0,
    startGoldLevel: 0,
    bountyLevel: 0,
  },
};

// Phân loại Tier súng cố định (Weapon Rarity):
// Tier 1: PISTOL, CROSSBOW, SLINGSHOT, SHOTGUN, FLAMER -> Vòng hollow TRẮNG (5 súng cơ bản người chơi cầm ban đầu)
// Tier 2: CRYO, CANNON -> Vòng hollow XANH (Roll Gacha)
// Tier 3: TESLA, SNIPER -> Vòng hollow TÍM (Roll Gacha)
// Tier 4: MINIGUN -> Vòng hollow VÀNG (Roll Gacha)
// Tier 5: METEOR -> Vòng hollow ĐỎ (Roll Gacha)
export const GUN_TIERS: Record<GunKind, number> = {
  PISTOL: 1,
  CROSSBOW: 1,
  SLINGSHOT: 1,
  SHOTGUN: 1,
  FLAMER: 1,
  CRYO: 2,
  CANNON: 2,
  TESLA: 3,
  SNIPER: 3,
  MINIGUN: 4,
  METEOR: 5,
};

export function getGunTier(kind: GunKind): number {
  return GUN_TIERS[kind] || 1;
}

export const GUN_NAMES: Record<GunKind, string> = {
  PISTOL: 'SÚNG LỤC',
  CROSSBOW: 'NỎ THÉP',
  SLINGSHOT: 'NÁ CAO SU',
  CRYO: 'SÚNG BĂNG',
  FLAMER: 'SÚNG LỬA',
  SHOTGUN: 'SHOTGUN',
  CANNON: 'ĐẠI BÁC BOM',
  TESLA: 'SÚNG SÉT',
  SNIPER: 'BẮN TỈA BÁO THÙ',
  MINIGUN: 'MINIGUN 6 NÒNG',
  METEOR: 'BÁNH RĂNG THIÊN THẠCH',
};

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
    name: 'THƯỜNG',
    color: 0xf8fafc,
    hex: '#f8fafc',
  },
  2: {
    tier: 2,
    name: 'HIẾM',
    color: 0x3b82f6,
    hex: '#38bdf8',
  },
  3: {
    tier: 3,
    name: 'SỬ THI',
    color: 0xa855f7,
    hex: '#c084fc',
  },
  4: {
    tier: 4,
    name: 'HUYỀN THOẠI',
    color: 0xfacc15,
    hex: '#facc15',
  },
  5: {
    tier: 5,
    name: 'THẦN THOẠI',
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

    this.initBackground();
    this.initGrid();
    this.initWall();
    this.initObjectPools();
    this.initTooltip();
    this.initUI();
    this.initTrashZone();
    this.initGlobalDragListeners();
    this.initMainMenu();
    this.initResultModal();
    this.showMainMenu();
  }

  private initBackground() {
    const bg = new Graphics();
    bg.rect(0, 0, 720, this.WALL_Y);
    bg.fill({ color: 0x0c0f17 });

    for (let x = 60; x < 720; x += 120) {
      bg.rect(x, 0, 1, this.WALL_Y);
      bg.fill({ color: 0x1e2638, alpha: 0.5 });
    }
    for (let y = 60; y < this.WALL_Y; y += 120) {
      bg.rect(0, y, 720, 1);
      bg.fill({ color: 0x1e2638, alpha: 0.5 });
    }

    bg.rect(0, this.WALL_Y, 720, 1280 - this.WALL_Y);
    bg.fill({ color: 0x08090e });

    this.bgContainer.addChild(bg);
  }

  private initWall() {
    const wall = new Graphics();
    wall.rect(0, this.WALL_Y - 16, 720, 20);
    wall.fill({ color: 0x334155 });
    wall.rect(0, this.WALL_Y - 24, 720, 8);
    wall.fill({ color: 0x64748b });

    for (let x = 0; x < 720; x += 48) {
      wall.rect(x, this.WALL_Y - 32, 24, 12);
      wall.fill({ color: 0x94a3b8 });
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

        // 1. Ánh sáng vàng dịu phủ kín ô (Soft amber glow fill)
        mergeHighlightG.roundRect(4, 4, 88, 88, 6).fill({ color: 0xfef08a, alpha: 0.22 });

        // 2. Viền hào quang vàng neon tỏa rộng (Vibrant gold outer glow)
        mergeHighlightG.roundRect(2, 2, 92, 92, 6).stroke({ color: 0xfde047, width: 6, alpha: 0.75 });

        // 3. Viền neon trắng - vàng kim sắc nét (Crisp white/gold inner line)
        mergeHighlightG.roundRect(3, 3, 90, 90, 5).stroke({ color: 0xffffff, width: 2.5, alpha: 0.95 });

        // 4. Bốn góc L-Bracket dày và sáng rực rỡ kèm chốt sáng
        // Góc trên - trái
        mergeHighlightG.moveTo(2, 22).lineTo(2, 2).lineTo(22, 2).stroke({ color: 0xffffff, width: 4.5 });
        mergeHighlightG.rect(2, 2, 7, 7).fill({ color: 0xfffbeb });
        // Góc trên - phải
        mergeHighlightG.moveTo(74, 2).lineTo(94, 2).lineTo(94, 22).stroke({ color: 0xffffff, width: 4.5 });
        mergeHighlightG.rect(87, 2, 7, 7).fill({ color: 0xfffbeb });
        // Góc dưới - trái
        mergeHighlightG.moveTo(2, 74).lineTo(2, 94).lineTo(22, 94).stroke({ color: 0xffffff, width: 4.5 });
        mergeHighlightG.rect(2, 87, 7, 7).fill({ color: 0xfffbeb });
        // Góc dưới - phải
        mergeHighlightG.moveTo(74, 94).lineTo(94, 94).lineTo(94, 74).stroke({ color: 0xffffff, width: 4.5 });
        mergeHighlightG.rect(87, 87, 7, 7).fill({ color: 0xfffbeb });

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

        slotCont.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation();
          const cell = this.grid[r][c];
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
        fontSize: 18,
        fill: '#facc15',
        fontWeight: 'bold',
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
        wordWrapWidth: 248,
        lineHeight: 20,
      }
    });
    this.tooltipDescText.x = 16;
    this.tooltipDescText.y = 96;
    this.tooltipContainer.addChild(this.tooltipDescText);

    this.tooltipHintText = new Text({
      text: '• Chạm vị trí khác để đóng',
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
      text: '🗑 THẢ VÀO ĐỂ BÁN\n(+50% VÀNG)',
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

    this.waveText = new Text({ text: '⚙ WAVE 1/10 (CHUẨN BỊ)', style: { ...textStyle, fontSize: 17, fill: '#60a5fa' } });
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
      text: '🎲 ROLL (2$)\n(Súng / Cò / Buff)',
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
      text: '⚔ BẮT ĐẦU VÁN 1',
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
      text: 'TỐC ĐỘ: x1',
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
      this.speedBtnText.text = `TỐC ĐỘ: x${this.gameSpeed}`;
      sound.playClick();
    });
    this.uiContainer.addChild(speedBtn);

    // Tip hướng dẫn
    this.tipText = new Text({
      text: '💡 Súng xoay 360° bắn quái. Kéo món để thấy ô có thể Merge hoặc Bán!',
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

    this.prepPhase = false;
    this.isWaveActive = true;
    this.enemiesToSpawn = 8 + this.wave * 4;
    this.spawnTimer = 0;

    this.drawStartWaveBtn(false);
    this.startWaveBtnText.text = `ĐANG CHIẾN WAVE ${this.wave}`;
    this.waveText.text = `WAVE ${this.wave}/${this.maxWave}`;
    this.waveText.style.fill = '#f8fafc';

    sound.playMerge();
    this.addFloatingText(360, 200, `WAVE ${this.wave} BẮT ĐẦU!`, '#4ade80');
  }

  public updateRollButtonState() {
    const canAfford = this.gold >= this.rollPrice;
    if (this.lastRollPriceDisplayed !== this.rollPrice) {
      this.lastRollPriceDisplayed = this.rollPrice;
      this.rollBtnText.text = `🎲 ROLL (${this.rollPrice}$)\n(Súng / Cò / Buff)`;
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
      this.addFloatingText(130, 1050, 'Không đủ vàng!', '#ef4444');
      return;
    }

    const emptyCell = this.getRandomEmptyUnlockedCell();
    if (!emptyCell) {
      sound.playClick();
      this.addFloatingText(130, 1050, 'Hết ô trống!', '#ef4444');
      return;
    }

    this.gold -= this.rollPrice;
    this.rollCount++;
    // TĂNG GIÁ ROLL ĐỀU ĐẶN SAU MỖI LẦN MUA (KHÔNG GIỚI HẠN TRẦN 12$)
    this.rollPrice = 2 + this.rollCount * 2;
    this.updateRollButtonState();

    const rollType = Math.random();
    if (rollType < 0.60) {
      // Chỉ xuất hiện trong danh sách 5 súng người chơi đã trang bị!
      const pool = (this.saveData.equippedGuns && this.saveData.equippedGuns.length > 0)
        ? this.saveData.equippedGuns
        : (['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'] as GunKind[]);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      emptyCell.item = this.createGun(chosen, 1);
    } else if (rollType < 0.85) {
      emptyCell.item = this.createTrigger(1);
    } else {
      // Chỉ xuất hiện trong danh sách 2 buff đã trang bị!
      const buffPool = (this.saveData.equippedBuffs && this.saveData.equippedBuffs.length > 0)
        ? this.saveData.equippedBuffs
        : (['DMG', 'SPEED'] as BuffKind[]);
      const chosen = buffPool[Math.floor(Math.random() * buffPool.length)];
      emptyCell.item = this.createBuff(chosen, 1);
    }

    this.syncSlotView(emptyCell.col, emptyCell.row);
    this.triggerSpawnFX(emptyCell.col, emptyCell.row, emptyCell.item);
  }

  private getRandomEmptyUnlockedCell(): GridCell | null {
    const available: GridCell[] = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c].unlocked && this.grid[r][c].item === null) {
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

    if (!item) {
      view.itemContainer.visible = false;
      view.tierFrameG.visible = false;
      return;
    }

    view.itemContainer.visible = true;
    view.itemContainer.alpha = 1.0;

    // 1. VÒNG HOLLOW VUÔNG CỐ ĐỊNH THEO LOẠI MÓN ĐỒ (KHÔNG ĐỔI KHI NÂNG LEVEL):
    let frameColor: number = 0xf8fafc;
    if (item.type === 'GUN') {
      const gunTier = item.gunKind ? getGunTier(item.gunKind) : (item.tier || 1);
      frameColor = RARITY_CONFIGS[gunTier].color;
    } else if (item.type === 'TRIGGER') {
      frameColor = 0xf59e0b; // Đồng thau Steampunk vàng cam cố định cho Cò (Không đổi khi lên level)
    } else if (item.type === 'BUFF') {
      const buffColors: Record<BuffKind, number> = {
        DMG: 0xef4444,    // Đỏ Sát thương
        SPEED: 0x3b82f6,  // Xanh Lam Tốc độ
        FILL: 0x22c55e,   // Xanh lá Siêu nạp
        CRIT: 0xfacc15,   // Vàng Kim Chí mạng
      };
      frameColor = (item.buffKind && buffColors[item.buffKind]) ? buffColors[item.buffKind] : 0x38bdf8;
    }

    // VÒNG HOLLOW VUÔNG (Cố định không đổi khi nâng Level):
    view.tierFrameG.visible = true;
    view.tierFrameG.clear();

    // 1. Khung hollow vuông bo góc nhẹ 6px bao quanh toàn bộ ô
    view.tierFrameG.roundRect(4, 4, 88, 88, 6);
    view.tierFrameG.stroke({ width: 3.5, color: frameColor, alpha: 0.95 });

    // 2. Lớp phát quang mỏng theo màu cố định bên trong ô
    view.tierFrameG.roundRect(6, 6, 84, 84, 5);
    view.tierFrameG.fill({ color: frameColor, alpha: 0.08 });

    // 3. 4 Chấu góc vuông cơ khí (Corner Brackets) sáng trắng sắc nét
    view.tierFrameG.moveTo(2, 16); view.tierFrameG.lineTo(2, 2); view.tierFrameG.lineTo(16, 2);
    view.tierFrameG.moveTo(80, 2); view.tierFrameG.lineTo(94, 2); view.tierFrameG.lineTo(94, 16);
    view.tierFrameG.moveTo(2, 80); view.tierFrameG.lineTo(2, 94); view.tierFrameG.lineTo(16, 94);
    view.tierFrameG.moveTo(80, 94); view.tierFrameG.lineTo(94, 94); view.tierFrameG.lineTo(94, 80);
    view.tierFrameG.stroke({ width: 2, color: 0xffffff, alpha: 0.75 });

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
      view.lvlText.text = `x${item.level}`;
      view.lvlText.style.fill = '#fde047';
      view.lvlText.style.fontSize = 22;
    } else if (item.type === 'GUN') {
      // ĐẾ BÁNH RĂNG CÔNG NGHIỆP: CHÍNH BẢN THÂN ASSET TỰ VẼ MÀU THEO LEVEL 1 -> 5
      view.itemContainer.zIndex = 5;
      view.baseSprite.texture = PixelAssetManager.getGunBaseTexture(item.level);
      view.baseSprite.anchor.set(0.5);
      view.baseSprite.x = 40;
      view.baseSprite.y = 40;
      view.baseSprite.scale.set(1.0);
      view.baseSprite.rotation = item.gearAngle || 0;

      // NÒNG SÚNG XOAY 360 ĐỘ: CHÍNH BẢN THÂN ASSET TỰ VẼ MÀU THEO LEVEL 1 -> 5, TO HƠN 20%
      view.barrelSprite.visible = true;
      view.barrelSprite.texture = PixelAssetManager.getGunBarrelTexture(item.gunKind!, item.level);
      view.barrelSprite.rotation = item.turretAngle;
      view.barrelSprite.scale.set(1.2); // Nòng súng to hơn rõ rệt
      view.barrelSprite.tint = 0xffffff; // KHÔNG DÙNG OVERLAY TINT

      view.fillG.visible = true;
      view.lvlText.text = `${item.level}`;
      view.lvlText.style.fill = lvlHex;
      view.lvlText.style.fontSize = 20;
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
        this.trashText.text = `🗑 THẢ ĐỂ BÁN\n+${sellPrice}$ VÀNG`;
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
            this.slotViews[r][c].highlightG.visible = (c === col && r === row);
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
          this.addFloatingText(135, 1060, `+${sellPrice}$ ĐÃ BÁN!`, '#22c55e');
        } else {
          // THẢ VÀO Ô BÀN CỜ
          const dropCol = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
          const dropRow = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);

          if (dropCol >= 0 && dropCol < this.COLS && dropRow >= 0 && dropRow < this.ROWS) {
            const targetCell = this.grid[dropRow][dropCol];
            const sourceCell = this.grid[origRow][origCol];

            if (dropCol === origCol && dropRow === origRow) {
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

              const canMerge =
                dest.type === drag.type &&
                dest.level === drag.level &&
                dest.level < 5 &&
                ((dest.type === 'GUN' && dest.gunKind === drag.gunKind) ||
                 (dest.type === 'BUFF' && dest.buffKind === drag.buffKind) ||
                 (dest.type === 'TRIGGER'));

              if (canMerge) {
                const nextLevel = dest.level + 1;
                if (dest.type === 'GUN') {
                  targetCell.item = this.createGun(dest.gunKind!, nextLevel);
                } else if (dest.type === 'TRIGGER') {
                  targetCell.item = this.createTrigger(nextLevel);
                } else if (dest.type === 'BUFF') {
                  targetCell.item = this.createBuff(dest.buffKind!, nextLevel);
                }

                sourceCell.item = null;
                this.syncSlotView(dropCol, dropRow);
                this.syncSlotView(origCol, origRow);
                this.triggerUpgradeFX(dropCol, dropRow, nextLevel, dest.gunKind || dest.type);
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
          const canMerge =
            dest.type === dragItem.type &&
            dest.level === dragItem.level &&
            dest.level < 5 &&
            ((dest.type === 'GUN' && dest.gunKind === dragItem.gunKind) ||
             (dest.type === 'BUFF' && dest.buffKind === dragItem.buffKind) ||
             (dest.type === 'TRIGGER'));

          this.slotViews[r][c].mergeHighlightG.visible = canMerge;
        } else {
          this.slotViews[r][c].mergeHighlightG.visible = false;
        }
      }
    }
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
    let label = '+1 MÓN';
    let hexColor = '#38bdf8';

    if (item.type === 'GUN' && item.gunKind) {
      const tier = getGunTier(item.gunKind);
      const rarity = RARITY_CONFIGS[tier];
      mainColor = rarity.color;
      hexColor = rarity.hex;
      label = `+ ${GUN_NAMES[item.gunKind] || 'SÚNG'}`;
    } else if (item.type === 'TRIGGER') {
      mainColor = 0xf59e0b;
      hexColor = '#f59e0b';
      label = '+ BỘ CÒ XOAY';
    } else if (item.type === 'BUFF') {
      const buffNames: Record<BuffKind, { name: string; color: number; hex: string }> = {
        DMG: { name: '+ BUFF CÔNG', color: 0xef4444, hex: '#ef4444' },
        SPEED: { name: '+ BUFF TỐC', color: 0x3b82f6, hex: '#3b82f6' },
        FILL: { name: '+ BUFF NẠP', color: 0x22c55e, hex: '#22c55e' },
        CRIT: { name: '+ BUFF CHÍ MẠNG', color: 0xfacc15, hex: '#facc15' },
      };
      const info = buffNames[item.buffKind || 'DMG'];
      mainColor = info.color;
      hexColor = info.hex;
      label = info.name;
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

    // 6. Floating Text siêu kích thích
    this.addFloatingText(centerX, centerY - 32, `★ NÂNG CẤP LV.${nextLevel} ★`, fxHex);

    // 7. SFX âm thanh thăng cấp theo bậc Level kích thích
    sound.playMerge(lvl);
  }

  private updateSlotAnimations(dt: number) {
    this.animTime += dt;
    const mergePulse = 0.82 + 0.18 * Math.sin(this.animTime * 10);
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const view = this.slotViews[r][c];
        if (view.popScale > 1.0) {
          view.popScale = Math.max(1.0, view.popScale - 3.2 * dt);
          view.itemContainer.scale.set(view.popScale);
        }
        if (view.mergeHighlightG.visible) {
          view.mergeHighlightG.alpha = mergePulse;
        }
      }
    }
  }

  // ================= TOOLTIP BÊN CẠNH SÚNG (KHÔNG OVERLAY, TỰ TRÁNH BỊ KHUẤT) ================= //

  public showTooltipAt(item: GridItem, col: number, row: number) {
    const cellX = this.GRID_X + col * this.CELL_SIZE;
    const cellY = this.GRID_Y + row * this.CELL_SIZE;

    const tipW = 280;
    const tipH = 180;

    let targetX: number;
    if (col >= 3) {
      targetX = cellX - tipW - 12;
    } else {
      targetX = cellX + this.CELL_SIZE + 12;
    }

    targetX = Math.max(16, Math.min(targetX, 720 - tipW - 16));
    let targetY = Math.max(70, Math.min(cellY - 30, 1050 - tipH));

    this.tooltipContainer.x = targetX;
    this.tooltipContainer.y = targetY;

    const gunTier = (item.type === 'GUN' && item.gunKind) ? getGunTier(item.gunKind) : (item.tier || 1);
    const tierRarity = RARITY_CONFIGS[gunTier];

    this.tooltipCard.clear();
    this.tooltipCard.roundRect(0, 0, tipW, tipH, 10);
    this.tooltipCard.fill({ color: 0x13151f, alpha: 0.96 });
    this.tooltipCard.stroke({ color: tierRarity.color, width: 2.5 });

    let name = '';
    let stats = '';
    let desc = '';

    if (item.type === 'TRIGGER') {
      name = `BÁNH RĂNG CÒ Lv${item.level}`;
      const hitsPerSec = (item.level * item.rotationSpeed).toFixed(1);
      stats = `• Dạng: Nẫy bánh cóc cơ khí\n• Số chấu: ${item.level} nẫy\n• Tốc độ: ${hitsPerSec} hit/s`;
      desc = `Các nẫy xoay gõ vào súng lân cận, làm xoay đế bánh răng và nạp đạn cho súng.`;
    } else if (item.type === 'GUN') {
      name = `[TIER ${gunTier} • ${tierRarity.name}] ${GUN_NAMES[item.gunKind!] || 'SÚNG'} Lv.${item.level}`;
      const hitsNeeded = Math.ceil(1.0 / item.fillPerHit);
      stats = `• Sát thương: ${item.damage} DMG\n• Cần nạp: ${hitsNeeded} lần gõ (1 viên)\n• Xoay 360° tự động ngắm quái`;

      const effects: Record<GunKind, string> = {
        PISTOL: 'Bắn tia plasma thẳng chính xác vào quái.',
        CROSSBOW: 'Mũi tên xuyên qua 1 quái đầu tiên.',
        SLINGSHOT: 'Bắn đá văng lùi quái về sau.',
        CRYO: 'Làm chậm quái 40% trong 2 giây.',
        FLAMER: 'Thiêu đốt quái liên tục trong 3 giây.',
        SHOTGUN: 'Bắn chùm 3 tia cực mạnh.',
        CANNON: 'Bắn đạn pháo phát nổ lan AOE.',
        TESLA: 'Giật sét chuyền 3 mục tiêu.',
        SNIPER: 'Bắn đạn công phá cực mạnh tầm xa.',
        MINIGUN: 'Xả đạn liên thanh tốc độ cao.',
        METEOR: 'Triệu hồi mảnh thiên thạch hủy diệt.',
      };
      desc = effects[item.gunKind!];
    } else if (item.type === 'BUFF') {
      const buffNames: Record<BuffKind, string> = {
        DMG: 'BUFF SÁT THƯƠNG',
        SPEED: 'BUFF TỐC ĐỘ CÒ',
        FILL: 'BUFF SIÊU NẠP',
        CRIT: 'BUFF CHÍ MẠNG',
      };
      name = `${buffNames[item.buffKind!]} Lv.${item.level}`;
      if (item.buffKind === 'DMG') stats = `• Tăng +${item.level * 20}% Sát thương súng kề`;
      if (item.buffKind === 'SPEED') stats = `• Tăng +${item.level * 20}% Tốc độ xoay Cò kề`;
      if (item.buffKind === 'FILL') stats = `• Tăng +${item.level * 15}% Tốc độ nạp súng kề`;
      if (item.buffKind === 'CRIT') stats = `• Tăng +${item.level * 10}% Tỉ lệ bạo kích`;
      desc = `Tác dụng lên 4 ô kề cạnh (Trên, Dưới, Trái, Phải).`;
    }

    this.tooltipTitleText.text = name;
    this.tooltipTitleText.style.fill = tierRarity.hex;
    this.tooltipStatsText.text = stats;
    this.tooltipDescText.text = desc;

    this.tooltipContainer.visible = true;
    sound.playClick();
  }

  public hideTooltip() {
    this.tooltipContainer.visible = false;
  }

  // ================= AUTO-AIM & GAME ENGINE LOOP ================= //

  public update(rawDt: number) {
    if (this.inMenu) return;
    if (this.isGameOver || this.isVictory) return;

    const dt = Math.min(rawDt, 0.1) * this.gameSpeed;

    this.updateTriggers(dt);
    this.updateGunsAndAim(dt);
    this.updateSlotAnimations(dt);

    if (this.isWaveActive) {
      this.updateWave(dt);
    }

    this.updateBullets(dt);
    this.updateSpecialFX(dt);
    this.updateFloatingTexts(dt);
    this.updateScreenShake(dt);

    this.goldText.text = `$: ${this.gold}`;
    this.hpText.text = `HP THÀNH: ${this.castleHp}/${this.maxCastleHp}`;
    this.updateRollButtonState();

    this.renderActiveEntities();
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

          const fillW = Math.min(60, Math.floor(item.fill * 60));
          view.fillG.clear();
          view.fillG.rect(10, 68, 64, 8);
          view.fillG.fill({ color: 0x0f172a });
          view.fillG.rect(12, 70, fillW, 4);
          view.fillG.fill({ color: item.fill >= 0.9 ? 0xfacc15 : 0x38bdf8 });
        }
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
    });

    const isCrit = Math.random() < critChance;
    const finalDmg = Math.round(gun.damage * dmgMultiplier * (isCrit ? 2.0 : 1.0));
    const gunKind = gun.gunKind || 'PISTOL';

    // Âm thanh riêng biệt chuẩn xác từng loại súng!
    sound.playGunShot(gunKind);

    // Lóe sáng viền súng và đầu nòng
    const flashCol = this.getMuzzleFlashColor(gunKind);
    this.addMuzzleFlash(gunX + Math.cos(angle) * 34, gunY + Math.sin(angle) * 34, flashCol);

    // SÚNG SÉT TESLA: Bắn tia sét thực giật lan trực tiếp và thay đổi nhánh rung giật liên tục
    if (gunKind === 'TESLA') {
      if (target) {
        target.hp -= finalDmg;
        target.hitFlashTimer = 0.14;
        this.addShockwave(target.x, target.y, 35, 0x38bdf8);
        this.addSparks(target.x, target.y, 8, 0x38bdf8, 160);
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

        if (chainTarget) {
          const chainDmg = Math.round(finalDmg * 0.7);
          chainTarget.hp -= chainDmg;
          chainTarget.hitFlashTimer = 0.14;
          this.addShockwave(chainTarget.x, chainTarget.y, 30, 0x38bdf8);
          this.addSparks(chainTarget.x, chainTarget.y, 6, 0x38bdf8, 140);
          this.addFloatingText(chainTarget.x, chainTarget.y - 18, `${chainDmg} ⚡`, '#a855f7');
          if (chainTarget.hp <= 0) this.killEnemy(chainTarget);

          this.lightningBolts.push({
            x1: gunX,
            y1: gunY,
            x2: target.x,
            y2: target.y,
            chainX: chainTarget.x,
            chainY: chainTarget.y,
            color: 0x38bdf8,
            lifetime: 0.18,
            maxLifetime: 0.18,
          });
        } else {
          this.lightningBolts.push({
            x1: gunX,
            y1: gunY,
            x2: target.x,
            y2: target.y,
            color: 0x38bdf8,
            lifetime: 0.18,
            maxLifetime: 0.18,
          });
        }
      }
      return;
    }

    // BÁNH RĂNG THIÊN THẠCH METEOR: Quả thiên thạch khổng lồ bay tới phát nổ hủy diệt diện rộng
    if (gunKind === 'METEOR') {
      const vx = Math.cos(angle) * 850;
      const vy = Math.sin(angle) * 850;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, 1, 'EXPLOSIVE', angle, 'METEOR', 1.3);
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

    // SÚNG PHUN LỬA FLAMER: 2 quả cầu lửa bốc khói cuồn cuộn bay tới
    if (gunKind === 'FLAMER') {
      [-0.08, 0.08].forEach(off => {
        const a = angle + off;
        this.spawnBullet(
          gunX, gunY,
          Math.cos(a) * 580,
          Math.sin(a) * 580,
          Math.round(finalDmg * 0.6),
          4, 'FIRE', a, 'FLAMER', 1.1
        );
      });
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

    // MINIGUN: Xả liên thanh
    if (gunKind === 'MINIGUN') {
      const spray = (Math.random() - 0.5) * 0.08;
      const a = angle + spray;
      this.spawnBullet(gunX, gunY, Math.cos(a) * 920, Math.sin(a) * 920, finalDmg, 1, 'NORMAL', a, 'MINIGUN', 0.9);
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
  ) {
    this.bullets.push({
      id: this.nextId++,
      gunKind,
      x,
      y,
      vx,
      vy,
      damage,
      pierce,
      element,
      active: true,
      radius: gunKind === 'METEOR' ? 18 : (gunKind === 'CANNON' || gunKind === 'FLAMER' ? 14 : 10),
      angle,
      scale,
    });
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
      if (e.slowTimer > 0) {
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
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
      }

      const dx = e.targetX - e.x;
      const dy = e.targetY - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        e.x += (dx / dist) * currentSpeed * dt * 0.4;
      }
      e.y += currentSpeed * dt;

      if (e.y >= this.WALL_Y - 20) {
        e.active = false;
        const dmg = e.isBoss ? 30 : (e.isElite ? 15 : 8);
        this.castleHp = Math.max(0, this.castleHp - dmg);
        this.trauma = Math.min(1.0, this.trauma + 0.4);
        sound.playExplode();
        this.addFloatingText(e.x, this.WALL_Y - 30, `-${dmg} HP`, '#ef4444');

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

    // Phân loại quái theo wave (Càng về sau càng nhiều quái khó, ít quái dễ)
    const isBoss = (this.gameMode === 'CAMPAIGN' && this.wave === this.maxWave && this.enemiesToSpawn === 0) ||
                   (this.gameMode === 'SURVIVAL' && this.wave % 10 === 0 && this.enemiesToSpawn === 0);

    let kind: EnemyKind = 'NORMAL';
    const roll = Math.random();

    if (isBoss) {
      kind = 'BOSS';
    } else if (this.wave === 1) {
      // Wave 1: Quái dễ chiếm đa số
      kind = roll < 0.60 ? 'RUNNER' : (roll < 0.85 ? 'SWARM' : 'NORMAL');
    } else if (this.wave === 2) {
      kind = roll < 0.45 ? 'RUNNER' : (roll < 0.75 ? 'NORMAL' : 'SWARM');
    } else if (this.wave <= 4) {
      // Bắt đầu xuất hiện TANK
      kind = roll < 0.35 ? 'NORMAL' : (roll < 0.65 ? 'RUNNER' : 'TANK');
    } else if (this.wave <= 6) {
      // Giảm quái dễ, tăng TANK và ELITE
      kind = roll < 0.20 ? 'NORMAL' : (roll < 0.60 ? 'TANK' : 'ELITE');
    } else if (this.wave <= 9) {
      // Quái khó áp đảo (Tank, Elite)
      kind = roll < 0.10 ? 'NORMAL' : (roll < 0.55 ? 'TANK' : 'ELITE');
    } else {
      // Wave 10+ (Survival / Late Wave): Toàn Tank, Elite, Runner cực nhanh
      kind = roll < 0.40 ? 'TANK' : (roll < 0.80 ? 'ELITE' : 'RUNNER');
    }

    let hpMultiplier = 1.0;
    let speed = 60;
    let bounty = 3;
    let width = 48;
    let height = 48;

    if (kind === 'SWARM') {
      hpMultiplier = 0.55;
      speed = 95;
      bounty = 2;
      width = 36;
      height = 36;
    } else if (kind === 'RUNNER') {
      hpMultiplier = 0.80;
      speed = 105;
      bounty = 3;
      width = 44;
      height = 44;
    } else if (kind === 'NORMAL') {
      hpMultiplier = 1.0;
      speed = 60;
      bounty = 4;
    } else if (kind === 'TANK') {
      hpMultiplier = 3.6;
      speed = 36;
      bounty = 10;
      width = 64;
      height = 64;
    } else if (kind === 'ELITE') {
      hpMultiplier = 5.8;
      speed = 50;
      bounty = 20;
      width = 64;
      height = 64;
    } else if (kind === 'BOSS') {
      hpMultiplier = 18.0;
      speed = 28;
      bounty = 60;
      width = 96;
      height = 96;
    }

    const mapScale = this.saveData.selectedCampaignMap === 3 ? 1.4 : (this.saveData.selectedCampaignMap === 2 ? 1.2 : 1.0);
    const baseHp = 32 * Math.pow(1.18, this.wave - 1) * mapScale;
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
      isElite: kind === 'ELITE',
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
    this.gold += e.bounty;
    sound.playExplode();
    this.addShockwave(e.x, e.y, e.isBoss ? 80 : 36, e.isBoss ? 0xa855f7 : 0xfacc15);
    this.addSparks(e.x, e.y, e.isBoss ? 18 : 8, e.isBoss ? 0xa855f7 : 0xfacc15, 180);
    this.addFloatingText(e.x, e.y, `+${e.bounty}$`, '#facc15');
  }

  private onWaveClear() {
    this.isWaveActive = false;
    this.prepPhase = true;

    const waveBonus = 10 + this.wave * 2;
    this.gold += waveBonus;
    sound.playMerge();
    this.addFloatingText(360, 300, `QUA WAVE ${this.wave}! +${waveBonus}$`, '#4ade80');

    if (this.gameMode === 'CAMPAIGN' && this.wave >= this.maxWave) {
      this.isVictory = true;
      this.showResultModal(true, this.wave);
      return;
    }

    this.wave++;
    this.drawStartWaveBtn(true);
    this.startWaveBtnText.text = `⚔ BẮT ĐẦU VÁN ${this.wave}`;
    this.tipText.text = `Chuẩn bị xong ấn BẮT ĐẦU VÁN ${this.wave}`;
    this.tipText.style.fill = '#facc15';
    this.waveText.text = this.gameMode === 'CAMPAIGN' 
      ? `MAP ${this.saveData.selectedCampaignMap} - WAVE ${this.wave}/${this.maxWave} (CHUẨN BỊ)`
      : `SINH TỒN - WAVE ${this.wave} (CHUẨN BỊ)`;
    this.waveText.style.fill = '#60a5fa';
  }

  private onGameOver() {
    this.isGameOver = true;
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
        b.active = false;
        continue;
      }

      for (const e of this.enemies) {
        if (!e.active) continue;

        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const hitDist = b.radius + e.width / 2;

        if (dx * dx + dy * dy <= hitDist * hitDist) {
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

          e.hp -= b.damage;
          e.hitFlashTimer = 0.08;
          sound.playHit();
          this.addFloatingText(e.x + (Math.random() * 24 - 12), e.y - 16, `${b.damage}`, '#ffffff');

          if (b.gunKind === 'CRYO' || b.element === 'ICE') {
            e.slowTimer = 3.0;
            this.addShockwave(b.x, b.y, 35, 0x38bdf8);
            this.addSparks(b.x, b.y, 6, 0x38bdf8, 140);
          } else if (b.gunKind === 'FLAMER' || b.element === 'FIRE') {
            e.burnTimer = 3.5;
            this.addSparks(b.x, b.y, 5, 0xf97316, 120);
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
    for (let i = 0; i < this.enemyPool.length; i++) {
      const view = this.enemyPool[i];
      if (i < activeEnemiesCount) {
        const e = this.enemies[i];
        view.container.visible = true;
        view.container.x = e.x;
        view.container.y = e.y;

        view.sprite.texture = PixelAssetManager.getEnemyTexture(e.kind);

        if (e.hitFlashTimer > 0) {
          view.sprite.tint = 0xffffff;
        } else if (e.slowTimer > 0) {
          view.sprite.tint = 0x38bdf8;
        } else if (e.burnTimer > 0) {
          view.sprite.tint = 0xf97316;
        } else {
          view.sprite.tint = 0xffffff;
        }

        const barW = e.width;
        view.hpBg.clear();
        view.hpBg.rect(-barW / 2, -e.height / 2 - 10, barW, 6);
        view.hpBg.fill({ color: 0x000000 });

        const hpRatio = Math.max(0, e.hp / e.maxHp);
        view.hpFill.clear();
        view.hpFill.rect(-barW / 2, -e.height / 2 - 10, barW * hpRatio, 6);
        view.hpFill.fill({ color: e.isBoss ? 0xa855f7 : 0xef4444 });
      } else {
        view.container.visible = false;
      }
    }

    const activeBulletsCount = this.bullets.length;
    for (let i = 0; i < this.bulletPool.length; i++) {
      const view = this.bulletPool[i];
      if (i < activeBulletsCount) {
        const b = this.bullets[i];
        view.sprite.visible = true;
        view.sprite.x = b.x;
        view.sprite.y = b.y;
        view.sprite.rotation = b.angle + Math.PI / 2;
        view.sprite.texture = PixelAssetManager.getProjectileTexture(b.gunKind);
        view.sprite.scale.set(b.scale || 1.0);
      } else {
        view.sprite.visible = false;
      }
    }
  }

  public createGun(kind: GunKind, level: number): GridItem {
    const baseDamageMap: Record<GunKind, number> = {
      PISTOL: 18,
      CROSSBOW: 28,
      SLINGSHOT: 16,
      CRYO: 22,
      FLAMER: 20,
      SHOTGUN: 48,
      CANNON: 75,
      TESLA: 45,
      SNIPER: 140,
      MINIGUN: 24,
      METEOR: 280,
    };

    const fillPerHitMap: Record<GunKind, number> = {
      PISTOL: 0.50,
      CROSSBOW: 0.34,
      SLINGSHOT: 0.50,
      CRYO: 0.34,
      FLAMER: 0.34,
      SHOTGUN: 0.25,
      CANNON: 0.25,
      TESLA: 0.25,
      SNIPER: 0.16,
      MINIGUN: 0.50,
      METEOR: 0.12,
    };

    const rangeTypeMap: Record<GunKind, 'LANE' | 'SPREAD' | 'GLOBAL' | 'SHORT'> = {
      PISTOL: 'LANE',
      CROSSBOW: 'LANE',
      SLINGSHOT: 'SPREAD',
      CRYO: 'LANE',
      FLAMER: 'LANE',
      SHOTGUN: 'SHORT',
      CANNON: 'LANE',
      TESLA: 'GLOBAL',
      SNIPER: 'GLOBAL',
      MINIGUN: 'LANE',
      METEOR: 'GLOBAL',
    };

    const permanentLvl = (this.saveData && this.saveData.gunLevels && this.saveData.gunLevels[kind]) || 1;
    const upgradeMult = 1 + (permanentLvl - 1) * 0.15;
    const dmg = Math.round(baseDamageMap[kind] * upgradeMult * Math.pow(1.8, level - 1));
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
    return {
      id: `trigger_${Date.now()}_${Math.random()}`,
      type: 'TRIGGER',
      level,
      tier,
      angle: 0,
      rotationSpeed: 0.8,
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
        if (!parsed.saveVersion || parsed.saveVersion < 2) {
          data.saveVersion = 2;
          data.unlockedGuns = ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'];
          data.equippedGuns = ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'];
          data.gunLevels = {
            PISTOL: 1,
            CROSSBOW: 1,
            SLINGSHOT: 1,
            SHOTGUN: 1,
            FLAMER: 1,
            CRYO: 0,
            CANNON: 0,
            TESLA: 0,
            SNIPER: 0,
            MINIGUN: 0,
            METEOR: 0,
          };
        } else {
          if (!data.unlockedGuns || data.unlockedGuns.length === 0) {
            data.unlockedGuns = ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'];
          }
          data.equippedGuns = data.equippedGuns.filter(g => data.unlockedGuns.includes(g));
          if (data.equippedGuns.length === 0) {
            data.equippedGuns = ['PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER'];
          }
        }
        data.talents = data.talents || {
          hpLevel: 0,
          armorLevel: 0,
          startGoldLevel: 0,
          bountyLevel: 0,
        };
        return data;
      }
    } catch (e) {}
    return { ...DEFAULT_SAVE };
  }

  private saveGame() {
    try {
      localStorage.setItem('gear_gun_castle_save', JSON.stringify(this.saveData));
    } catch (e) {}
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
      alert('⚙ CÀI ĐẶT:\n• Âm thanh: Đang BẬT\n• Phiên bản: Gear Gun Castle (Archero Edition)\n• Tác giả: Antigravity Game Engine');
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
      alert(`📖 THÔNG TIN ẢI [Radiant Temple]:\n• Bản đồ hiện tại: Map ${this.saveData.selectedCampaignMap}\n• Ải cao nhất đã chinh phục: ${this.saveData.highestCampaignStage * 10}/50\n• Thưởng qua ải: 1000 💎 + Hòm Hoàng Gia`);
    });
    stageBanner.addChild(infoBtn);
    worldCont.addChild(stageBanner);

    // 2. Các Phù Hiệu Nổi Bên Trái (Left Side Floating Badges)
    // Badge 1: Bạch tuộc tím + Đồng hồ 2H 22M
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
      alert('🐙 SỰ KIỆN ĐẠI DƯƠNG: Săn quái nhận gấp đôi Kim Cương trong 2H 22M nữa!');
    });
    worldCont.addChild(octCont);

    // Badge 2: Hòn đảo bay shortcut
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
      alert('🏝 ĐẢO KHO BÁU BAY: Khám phá bí ẩn đảo trên không!');
    });
    worldCont.addChild(islandCont);

    // 3. Các Phù Hiệu Nổi Bên Phải (Right Side Floating Badges)
    const rightBadges: { kind: 'ARENA' | 'QUEST' | 'DEMON' | 'WIZARD'; y: number; timer?: string; hasDot?: boolean; label: string }[] = [
      { kind: 'ARENA', y: 280, hasDot: true, label: 'Đấu Trường Đỉnh Cao PvP' },
      { kind: 'QUEST', y: 370, label: 'Nhiệm Vụ Hàng Ngày (Nhận 300 💰)' },
      { kind: 'DEMON', y: 460, timer: '4D 12H', label: 'Vương Miện Chúa Quỷ (Sự Kiện Đặc Biệt)' },
      { kind: 'WIZARD', y: 550, timer: '4D 2H', label: 'Mèo Phù Thủy May Mắn' },
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
      alert('🎁 RƯƠNG THẦN THOẠI CỘT MỐC:\n• Hoàn thành Wave 50-40 để mở khóa:\n  +1000 💎 Kim Cương\n  +10,000 💰 Vàng\n  +1 Vũ Khí THIÊN THẠCH (Tier 5 Mythic)!');
    });
    worldCont.addChild(chestCont);

    // 6. Thanh Nút Thao Tác Bên Dưới (Action Buttons Bar)
    const actionY = 1045;

    // Nút 1: Hero Patrol (Bên trái)
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
      alert(`🎁 BẠN ĐÃ THU HOẠCH PHẦN THƯỞNG TUẦN TRA (HERO PATROL):\n+${bonusGold} 💰 Vàng vĩnh viễn!`);
    });
    worldCont.addChild(patrolCont);

    // Nút 2: NÚT PLAY 3D CHUNKY KHỔNG LỒ (Chính giữa)
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
        sound.playHit();
        alert('⚡ Không đủ Năng lượng! Cần ít nhất 5 ⚡ để xuất trận. Hãy chờ hồi phục.');
        return;
      }

      this.saveData.energy -= 5;
      this.saveGame();
      sound.playMerge();
      this.startBattle();
    });
    worldCont.addChild(playCont);

    // Nút 3: Nút Demon Tím Nhanh (Right-Center)
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
      alert('⚡ TÍNH NĂNG TĂNG TỐC: Tự động ghép súng thần tốc!');
    });
    worldCont.addChild(demonBtnCont);

    // Nút 4: Nút Viễn Chinh Expedition (Bên Phải)
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
      alert('🧭 VIỄN CHINH (EXPEDITION):\nChế độ leo tháp 500 tầng đang mở, nhận thần khí bánh răng!');
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
      alert('🎉 BẠN ĐÃ NHẬN THÀNH CÔNG:\n+50 💎 Kim Cương\n+500 💰 Vàng Vĩnh Viễn!');
      this.renderMainMenu();
    });
    dailyCard.addChild(dBtn);
    cont.addChild(dailyCard);

    this.mainMenuContainer.addChild(cont);
  }

  // Hàm xử lý Roll Gacha mở khóa súng & nâng cấp
  private rollGachaReward(type: 'COMMON' | 'ROYAL') {
    if (type === 'COMMON') {
      if (this.saveData.permanentGold < 200) {
        sound.playHit();
        alert('Không đủ Vàng vĩnh viễn (Cần 200 💰)! Hãy vượt các Wave để thu thập thêm.');
        return;
      }
      this.saveData.permanentGold -= 200;
    } else {
      if (this.saveData.diamonds < 60) {
        sound.playHit();
        alert('Không đủ Kim Cương (Cần 60 💎)!');
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
      // Ưu tiên mở súng cao cấp khi roll Royal
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
      alert(`🎉 CHÚC MỪNG BẠN ĐÃ MỞ KHÓA SÚNG MỚI!\n\n[${GUN_NAMES[pickedGun]}]\n• Phẩm chất: Tier ${tier} (${rarity.name})\n• Đã thêm vào Kho Súng Trang Bị!`);
    } else {
      // Nâng cấp cấp độ súng đã sở hữu
      const myGuns = this.saveData.unlockedGuns;
      const g = myGuns[Math.floor(Math.random() * myGuns.length)];
      const bonusLvl = type === 'ROYAL' ? 2 : 1;
      this.saveData.gunLevels[g] = (this.saveData.gunLevels[g] || 1) + bonusLvl;
      const bonusGold = type === 'ROYAL' ? 1000 : 200;
      this.saveData.permanentGold += bonusGold;

      sound.playMerge();
      alert(`🎉 PHẦN THƯỞNG HÒM GACHA:\n• Nâng cấp [${GUN_NAMES[g]}] +${bonusLvl} Cấp (Hiện Lv.${this.saveData.gunLevels[g]})!\n• Tặng kèm +${bonusGold} 💰 Vàng vĩnh viễn!`);
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
            alert('Bạn phải giữ lại ít nhất 1 loại súng ra trận!');
          }
        });
      } else {
        const emptyTxt = new Text({
          text: '+\nTrống',
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
              alert('Cần ít nhất 1 súng trong đội hình!');
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
        { id: 1, name: 'Map 1: Rừng Bánh Răng', desc: '10 Wave • Độ khó chuẩn • Quái cơ bản', unlocked: true },
        { id: 2, name: 'Map 2: Thành Trì Thép', desc: '10 Wave • Quái Thiết Giáp +20% HP', unlocked: this.saveData.highestCampaignStage >= 2 },
        { id: 3, name: 'Map 3: Núi Lửa Cơ Khí', desc: '10 Wave • Quái Nham Thạch +40% HP & Boss Lửa', unlocked: this.saveData.highestCampaignStage >= 3 },
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
          text: mp.name + (mp.unlocked ? (isSelected ? ' (ĐANG CHỌN)' : '') : ' 🔒 (Khóa)'),
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
        text: '💀 ĐẤU TRƯỜNG SINH TỒN VÔ TẬN',
        style: { fontFamily: this.FONT_FAMILY, fontSize: 22, fill: '#facc15', fontWeight: 'bold' }
      });
      survTitle.anchor.set(0.5);
      survTitle.x = 324;
      survTitle.y = 45;
      survCont.addChild(survTitle);

      const survDesc = new Text({
        text: '• Quái tràn ngập vô tận, cứ mỗi 10 Wave sẽ xuất hiện 1 Đại Trùm!\n• Càng sống lâu càng rơi nhiều Vàng 💰 và Kim Cương 💎!\n• Tinh hoa chiến thuật bánh răng thử thách giới hạn của bạn.',
        style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#e0e7ff', lineHeight: 28 }
      });
      survDesc.x = 36;
      survDesc.y = 90;
      survCont.addChild(survDesc);

      const highWaveText = new Text({
        text: `🏆 KỶ LỤC CỦA BẠN: WAVE ${this.saveData.highestSurvivalWave}`,
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
        sound.playHit();
        alert('⚡ Không đủ Năng lượng! Cần ít nhất 5 ⚡.');
        return;
      }
      this.saveData.energy -= 5;
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

  // --- QUẢN LÝ BẮT ĐẦU VÁN & VỀ MÀN HÌNH CHÍNH ---
  public startBattle() {
    this.inMenu = false;
    this.mainMenuContainer.visible = false;
    this.resultModalContainer.visible = false;
    if (this.uiManager) {
      this.uiManager.render();
    }

    this.isGameOver = false;
    this.isVictory = false;
    this.isWaveActive = false;
    this.prepPhase = true;

    this.wave = 1;
    this.maxWave = this.gameMode === 'CAMPAIGN' ? 10 : 999;
    this.maxCastleHp = 100 + (this.saveData.talents?.hpLevel || 0) * 50;
    this.castleHp = this.maxCastleHp;
    this.gold = 15 + (this.saveData.talents?.startGoldLevel || 0) * 5;
    this.rollCount = 0;
    this.rollPrice = 2;

    // Xóa quái & đạn cũ
    this.enemies.forEach(e => e.active = false);
    this.enemies = [];
    this.bullets.forEach(b => b.active = false);
    this.bullets = [];

    // Xóa bàn cờ cũ
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        this.grid[r][c].item = null;
      }
    }

    // 1 Cò Lv1 ở giữa (2, 2)
    this.grid[2][2].item = this.createTrigger(1);

    // 1 Súng ngẫu nhiên từ danh sách 5 súng đã trang bị
    const pool: GunKind[] = (this.saveData.equippedGuns && this.saveData.equippedGuns.length > 0)
      ? this.saveData.equippedGuns
      : (['PISTOL'] as GunKind[]);
    const starterGun = pool[Math.floor(Math.random() * pool.length)];
    this.grid[1][2].item = this.createGun(starterGun, 1);

    this.syncAllGridSlots();

    this.drawStartWaveBtn(true);
    this.startWaveBtnText.text = '⚔ BẮT ĐẦU VÁN 1';
    this.waveText.text = this.gameMode === 'CAMPAIGN'
      ? `MAP ${this.saveData.selectedCampaignMap} - WAVE 1/10 (CHUẨN BỊ)`
      : 'SINH TỒN - WAVE 1 (CHUẨN BỊ)';
    this.goldText.text = `$: ${this.gold}`;
    this.hpText.text = `HP THÀNH: ${this.castleHp}/${this.maxCastleHp}`;
  }

  public returnToMainMenu() {
    this.saveGame();
    this.enemies.forEach(e => e.active = false);
    this.enemies = [];
    this.bullets.forEach(b => b.active = false);
    this.bullets = [];
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
    // Tính toán phần thưởng vĩnh viễn
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

    this.saveData.permanentGold += earnedGold;
    this.saveData.diamonds += earnedDia;
    this.saveGame();

    if (this.uiManager) {
      this.uiManager.showResultModal(isWin, waveReached, earnedGold, earnedDia);
      return;
    }

    this.resultModalContainer.removeChildren();
    this.resultModalContainer.visible = true;

    // Overlay mờ
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
      text: isWin ? '🏆 CHIẾN THẮNG TOÀN DIỆN!' : '💀 THÀNH TRÌ THẤT THỦ!',
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
      text: `Chế độ: ${this.gameMode === 'CAMPAIGN' ? `Chiến Dịch (Map ${this.saveData.selectedCampaignMap})` : 'Sinh Tồn Vô Tận'}\nĐã vượt qua: Wave ${waveReached}\n\nPHẦN THƯỞNG NHẬN ĐƯỢC:\n+${earnedGold}$ Vàng Vĩnh Viễn 💰\n+${earnedDia} Kim Cương 💎`,
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

    // Nút VỀ MÀN HÌNH CHÍNH
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
      text: '🏰 VỀ MÀN HÌNH CHÍNH',
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
