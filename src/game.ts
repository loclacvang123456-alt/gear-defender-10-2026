import { Container, Graphics, Sprite, Text, TextStyle, Rectangle, FederatedPointerEvent } from 'pixi.js';
import { GridCell, GridItem, Bullet, Enemy, GunKind, BuffKind, EnemyKind, GameMode, UserSaveData, LightningBolt, Shockwave, VisualSpark } from './types';
import { PixelAssetManager } from './pixelArt';
import { sound } from './audio';

const DEFAULT_SAVE: UserSaveData = {
  diamonds: 60,
  permanentGold: 150,
  equippedGuns: ['PISTOL', 'CROSSBOW', 'CRYO', 'FLAMER', 'SHOTGUN'],
  equippedBuffs: ['DMG', 'SPEED'],
  gunLevels: {
    PISTOL: 1,
    CROSSBOW: 1,
    SLINGSHOT: 1,
    CRYO: 1,
    FLAMER: 1,
    SHOTGUN: 1,
    CANNON: 1,
    TESLA: 1,
    SNIPER: 1,
    MINIGUN: 1,
    METEOR: 1,
  },
  selectedCampaignMap: 1,
  highestCampaignStage: 1,
  highestSurvivalWave: 0,
};

// Phân loại Tier súng cố định (Weapon Rarity):
// Tier 1: PISTOL, CROSSBOW, SLINGSHOT -> Vòng hollow TRẮNG
// Tier 2: CRYO, FLAMER, SHOTGUN -> Vòng hollow XANH
// Tier 3: CANNON, TESLA, SNIPER -> Vòng hollow TÍM
// Tier 4: MINIGUN -> Vòng hollow VÀNG
// Tier 5: METEOR -> Vòng hollow ĐỎ
export const GUN_TIERS: Record<GunKind, number> = {
  PISTOL: 1,
  CROSSBOW: 1,
  SLINGSHOT: 1,
  CRYO: 2,
  FLAMER: 2,
  SHOTGUN: 2,
  CANNON: 3,
  TESLA: 3,
  SNIPER: 3,
  MINIGUN: 4,
  METEOR: 5,
};

export function getGunTier(kind: GunKind): number {
  return GUN_TIERS[kind] || 1;
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
  private menuTab: 'BATTLE' | 'LOADOUT' | 'WORKSHOP' = 'BATTLE';
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
    this.gridContainer.addChild(this.gridBgLayer);
    this.gridContainer.addChild(this.gridItemsLayer);

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

        // VIỀN VÀNG PHÁT SÁNG CHO NHỮNG Ô CÓ THỂ MERGE ĐƯỢC
        const mergeHighlightG = new Graphics();
        mergeHighlightG.rect(2, 2, 92, 92);
        mergeHighlightG.stroke({ color: 0xfacc15, width: 4 });
        // 4 góc tam giác viền vàng kim
        mergeHighlightG.rect(2, 2, 14, 14).fill({ color: 0xfef08a, alpha: 0.8 });
        mergeHighlightG.rect(80, 2, 14, 14).fill({ color: 0xfef08a, alpha: 0.8 });
        mergeHighlightG.rect(2, 80, 14, 14).fill({ color: 0xfef08a, alpha: 0.8 });
        mergeHighlightG.rect(80, 80, 14, 14).fill({ color: 0xfef08a, alpha: 0.8 });
        mergeHighlightG.visible = false;
        slotCont.addChild(mergeHighlightG);

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

  public onRollClicked() {
    if (this.gold < this.rollPrice) {
      this.addFloatingText(130, 1050, 'Không đủ vàng!', '#ef4444');
      return;
    }

    const emptyCell = this.getRandomEmptyUnlockedCell();
    if (!emptyCell) {
      this.addFloatingText(130, 1050, 'Hết ô trống!', '#ef4444');
      return;
    }

    this.gold -= this.rollPrice;
    this.rollCount++;
    // TĂNG GIÁ ROLL ĐỀU ĐẶN SAU MỖI LẦN MUA (KHÔNG GIỚI HẠN TRẦN 12$)
    this.rollPrice = 2 + this.rollCount * 2;
    this.rollBtnText.text = `🎲 ROLL (${this.rollPrice}$)\n(Súng / Cò / Buff)`;

    const rollType = Math.random();
    if (rollType < 0.60) {
      // Chỉ xuất hiện trong danh sách 5 súng người chơi đã trang bị!
      const pool = (this.saveData.equippedGuns && this.saveData.equippedGuns.length > 0)
        ? this.saveData.equippedGuns
        : (['PISTOL', 'CROSSBOW', 'CRYO', 'FLAMER', 'SHOTGUN'] as GunKind[]);
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
    sound.playClick();
    this.addFloatingText(
      this.GRID_X + emptyCell.col * this.CELL_SIZE + 48,
      this.GRID_Y + emptyCell.row * this.CELL_SIZE + 48,
      '+1 MÓN',
      '#60a5fa'
    );
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
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const view = this.slotViews[r][c];
        if (view.popScale > 1.0) {
          view.popScale = Math.max(1.0, view.popScale - 3.2 * dt);
          view.itemContainer.scale.set(view.popScale);
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
      const names: Record<GunKind, string> = {
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
      name = `[TIER ${gunTier} • ${tierRarity.name}] ${names[item.gunKind!]} Lv.${item.level}`;
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
      if (raw) return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
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

    // 1. Nền Steampunk kim loại tối
    const bg = new Graphics();
    bg.rect(0, 0, 720, 1280);
    bg.fill({ color: 0x090b10 });
    this.mainMenuContainer.addChild(bg);

    // Họa tiết trang trí bánh răng nền
    const decor = new Graphics();
    decor.circle(360, 200, 260);
    decor.stroke({ color: 0x1e293b, width: 2 });
    decor.circle(360, 200, 180);
    decor.stroke({ color: 0x1e293b, width: 1.5 });
    this.mainMenuContainer.addChild(decor);

    // 2. Header & Currency
    const titleText = new Text({
      text: 'GEAR GUN CASTLE',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 34,
        fill: '#facc15',
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 4 },
      }
    });
    titleText.anchor.set(0.5);
    titleText.x = 360;
    titleText.y = 45;
    this.mainMenuContainer.addChild(titleText);

    const subText = new Text({
      text: 'CỖ MÁY THÀNH TRÌ BÁNH RĂNG',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 14,
        fill: '#38bdf8',
        fontWeight: 'bold',
        letterSpacing: 2,
      }
    });
    subText.anchor.set(0.5);
    subText.x = 360;
    subText.y = 80;
    this.mainMenuContainer.addChild(subText);

    // Huy hiệu tiền tệ
    const currencyCont = new Container();
    currencyCont.x = 360;
    currencyCont.y = 115;

    const curText = new Text({
      text: `💎 ${this.saveData.diamonds} KIM CƯƠNG   |   💰 ${this.saveData.permanentGold}$ VÀNG`,
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 16,
        fill: '#f8fafc',
        fontWeight: 'bold',
      }
    });
    curText.anchor.set(0.5);
    currencyCont.addChild(curText);
    this.mainMenuContainer.addChild(currencyCont);

    // 3. Navigation Tabs
    const tabs: { key: 'BATTLE' | 'LOADOUT' | 'WORKSHOP'; label: string }[] = [
      { key: 'BATTLE', label: '🗺 BẢN ĐỒ' },
      { key: 'LOADOUT', label: '🎒 TRANG BỊ' },
      { key: 'WORKSHOP', label: '🎰 XƯỞNG & GACHA' },
    ];

    tabs.forEach((tab, idx) => {
      const tabBtn = new Container();
      tabBtn.x = 24 + idx * 228;
      tabBtn.y = 150;
      tabBtn.eventMode = 'static';
      tabBtn.cursor = 'pointer';
      tabBtn.hitArea = new Rectangle(0, 0, 216, 48);

      const isActive = this.menuTab === tab.key;
      const tabBg = new Graphics();
      tabBg.roundRect(0, 0, 216, 48, 8);
      tabBg.fill({ color: isActive ? 0x2563eb : 0x1e293b });
      tabBg.stroke({ color: isActive ? 0x60a5fa : 0x334155, width: 2 });
      tabBtn.addChild(tabBg);

      const tabText = new Text({
        text: tab.label,
        style: {
          fontFamily: this.FONT_FAMILY,
          fontSize: 15,
          fill: isActive ? '#ffffff' : '#94a3b8',
          fontWeight: 'bold',
        }
      });
      tabText.anchor.set(0.5);
      tabText.x = 108;
      tabText.y = 24;
      tabBtn.addChild(tabText);

      tabBtn.on('pointerdown', () => {
        this.menuTab = tab.key;
        sound.playClick();
        this.renderMainMenu();
      });

      this.mainMenuContainer.addChild(tabBtn);
    });

    // 4. Nội dung theo từng Tab
    if (this.menuTab === 'BATTLE') {
      this.renderBattleTab();
    } else if (this.menuTab === 'LOADOUT') {
      this.renderLoadoutTab();
    } else if (this.menuTab === 'WORKSHOP') {
      this.renderWorkshopTab();
    }
  }

  // --- TAB 1: BATTLE & MAP SELECT ---
  private renderBattleTab() {
    // Mode Buttons: Campaign vs Survival
    const modeContainer = new Container();
    modeContainer.x = 36;
    modeContainer.y = 215;

    const modes: { mode: GameMode; label: string }[] = [
      { mode: 'CAMPAIGN', label: '🛡 CHIẾN DỊCH (10 Wave)' },
      { mode: 'SURVIVAL', label: '💀 SINH TỒN (Vô Tận)' },
    ];

    modes.forEach((m, idx) => {
      const btn = new Container();
      btn.x = idx * 330;
      btn.y = 0;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.hitArea = new Rectangle(0, 0, 318, 54);

      const isCurrent = this.gameMode === m.mode;
      const bg = new Graphics();
      bg.roundRect(0, 0, 318, 54, 10);
      bg.fill({ color: isCurrent ? 0x059669 : 0x1e293b });
      bg.stroke({ color: isCurrent ? 0x34d399 : 0x475569, width: 2 });
      btn.addChild(bg);

      const text = new Text({
        text: m.label,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#ffffff', fontWeight: 'bold' }
      });
      text.anchor.set(0.5);
      text.x = 159;
      text.y = 27;
      btn.addChild(text);

      btn.on('pointerdown', () => {
        this.gameMode = m.mode;
        sound.playClick();
        this.renderMainMenu();
      });

      modeContainer.addChild(btn);
    });

    this.mainMenuContainer.addChild(modeContainer);

    // Chi tiết chế độ
    if (this.gameMode === 'CAMPAIGN') {
      const mapContainer = new Container();
      mapContainer.x = 36;
      mapContainer.y = 290;

      const maps = [
        { id: 1, name: 'Map 1: Rừng Bánh Răng', desc: '10 Wave • Độ khó chuẩn', unlocked: true },
        { id: 2, name: 'Map 2: Thành Trì Thép', desc: '10 Wave • Quái Thiết Giáp +20% HP', unlocked: this.saveData.highestCampaignStage >= 2 },
        { id: 3, name: 'Map 3: Núi Lửa Cơ Khí', desc: '10 Wave • Quái Nham Thạch +40% HP', unlocked: this.saveData.highestCampaignStage >= 3 },
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
          text: mp.name + (mp.unlocked ? '' : ' 🔒 (Khóa)'),
          style: { fontFamily: this.FONT_FAMILY, fontSize: 18, fill: mp.unlocked ? '#facc15' : '#64748b', fontWeight: 'bold' }
        });
        nameTxt.x = 24;
        nameTxt.y = 20;
        card.addChild(nameTxt);

        const descTxt = new Text({
          text: mp.desc,
          style: { fontFamily: this.FONT_FAMILY, fontSize: 14, fill: '#94a3b8' }
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

      this.mainMenuContainer.addChild(mapContainer);
    } else {
      // Survival Info Banner
      const survCont = new Container();
      survCont.x = 36;
      survCont.y = 290;

      const survBg = new Graphics();
      survBg.roundRect(0, 0, 648, 330, 16);
      survBg.fill({ color: 0x1e1b4b });
      survBg.stroke({ color: 0x818cf8, width: 3 });
      survCont.addChild(survBg);

      const survTitle = new Text({
        text: '💀 ĐẤU TRƯỜNG SINH TỒN VÔ TẬN',
        style: { fontFamily: this.FONT_FAMILY, fontSize: 24, fill: '#facc15', fontWeight: 'bold' }
      });
      survTitle.anchor.set(0.5);
      survTitle.x = 324;
      survTitle.y = 50;
      survCont.addChild(survTitle);

      const survDesc = new Text({
        text: '• Quái tràn ngập vô tận, cứ mỗi 10 Wave sẽ xuất hiện 1 Đại Trùm!\n• Càng sống lâu càng rơi nhiều Vàng 💰 và Kim Cương 💎!\n• Tinh hoa chiến thuật bánh răng thử thách giới hạn của bạn.',
        style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#e0e7ff', lineHeight: 28 }
      });
      survDesc.x = 36;
      survDesc.y = 100;
      survCont.addChild(survDesc);

      const highWaveText = new Text({
        text: `🏆 KỶ LỤC CỦA BẠN: WAVE ${this.saveData.highestSurvivalWave}`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 22, fill: '#34d399', fontWeight: 'bold' }
      });
      highWaveText.anchor.set(0.5);
      highWaveText.x = 324;
      highWaveText.y = 265;
      survCont.addChild(highWaveText);

      this.mainMenuContainer.addChild(survCont);
    }

    // Preview Đội hình trang bị (5 súng & 2 buff)
    const loadoutPreview = new Container();
    loadoutPreview.x = 36;
    loadoutPreview.y = 660;

    const previewBg = new Graphics();
    previewBg.roundRect(0, 0, 648, 180, 12);
    previewBg.fill({ color: 0x0f172a });
    previewBg.stroke({ color: 0x334155, width: 2 });
    loadoutPreview.addChild(previewBg);

    const prevTitle = new Text({
      text: '🎒 ĐỘI HÌNH RA TRẬN (Chỉ roll ra 5 súng & 2 buff này):',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#38bdf8', fontWeight: 'bold' }
    });
    prevTitle.x = 20;
    prevTitle.y = 16;
    loadoutPreview.addChild(prevTitle);

    // 5 Súng
    this.saveData.equippedGuns.forEach((g, i) => {
      const gCont = new Container();
      gCont.x = 24 + i * 86;
      gCont.y = 54;

      const gBg = new Graphics();
      gBg.roundRect(0, 0, 76, 76, 8);
      gBg.fill({ color: 0x1e293b });
      gBg.stroke({ color: 0x60a5fa, width: 2 });
      gCont.addChild(gBg);

      const sp = new Sprite(PixelAssetManager.getGunBarrelTexture(g, 1));
      sp.anchor.set(0.5);
      sp.x = 38;
      sp.y = 38;
      gCont.addChild(sp);

      const lvl = new Text({
        text: `Lv.${this.saveData.gunLevels[g] || 1}`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 12, fill: '#facc15', fontWeight: 'bold' }
      });
      lvl.anchor.set(0.5);
      lvl.x = 38;
      lvl.y = 62;
      gCont.addChild(lvl);

      loadoutPreview.addChild(gCont);
    });

    // 2 Buff
    this.saveData.equippedBuffs.forEach((b, i) => {
      const bCont = new Container();
      bCont.x = 464 + i * 86;
      bCont.y = 54;

      const bBg = new Graphics();
      bBg.roundRect(0, 0, 76, 76, 8);
      bBg.fill({ color: 0x1e293b });
      bBg.stroke({ color: 0xfacc15, width: 2 });
      bCont.addChild(bBg);

      const sp = new Sprite(PixelAssetManager.getBuffTexture(b, 1));
      sp.anchor.set(0.5);
      sp.x = 38;
      sp.y = 38;
      bCont.addChild(sp);

      const bName = new Text({
        text: b,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 12, fill: '#ffffff', fontWeight: 'bold' }
      });
      bName.anchor.set(0.5);
      bName.x = 38;
      bName.y = 62;
      bCont.addChild(bName);

      loadoutPreview.addChild(bCont);
    });

    this.mainMenuContainer.addChild(loadoutPreview);

    // Nút BẮT ĐẦU CHIẾN ĐẤU
    const startBattleBtn = new Container();
    startBattleBtn.x = 120;
    startBattleBtn.y = 1080;
    startBattleBtn.eventMode = 'static';
    startBattleBtn.cursor = 'pointer';
    startBattleBtn.hitArea = new Rectangle(0, 0, 480, 84);

    const sBtnBg = new Graphics();
    sBtnBg.roundRect(0, 0, 480, 84, 16);
    sBtnBg.fill({ color: 0x16a34a });
    sBtnBg.stroke({ color: 0x4ade80, width: 4 });
    startBattleBtn.addChild(sBtnBg);

    const sBtnText = new Text({
      text: '⚔ BẮT ĐẦU CHIẾN ĐẤU',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 26, fill: '#ffffff', fontWeight: 'bold' }
    });
    sBtnText.anchor.set(0.5);
    sBtnText.x = 240;
    sBtnText.y = 42;
    startBattleBtn.addChild(sBtnText);

    startBattleBtn.on('pointerdown', () => {
      sound.playMerge();
      this.startBattle();
    });

    this.mainMenuContainer.addChild(startBattleBtn);
  }

  // --- TAB 2: LOADOUT (CHỌN 5 SÚNG & 2 BUFF) ---
  private renderLoadoutTab() {
    const cont = new Container();
    cont.x = 36;
    cont.y = 210;

    const title = new Text({
      text: `CHỌN 5 LOẠI SÚNG VÀ 2 LOẠI BUFF RA TRẬN\n(Đã chọn: ${this.saveData.equippedGuns.length}/5 Súng  |  ${this.saveData.equippedBuffs.length}/2 Buff)`,
      style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#facc15', fontWeight: 'bold', align: 'center', lineHeight: 24 }
    });
    title.anchor.set(0.5, 0);
    title.x = 324;
    title.y = 0;
    cont.addChild(title);

    const allGuns: GunKind[] = [
      'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'CRYO', 'FLAMER',
      'SHOTGUN', 'CANNON', 'TESLA', 'SNIPER', 'MINIGUN', 'METEOR'
    ];

    const gunNames: Record<GunKind, string> = {
      PISTOL: 'Súng Lục',
      CROSSBOW: 'Nỏ Thép',
      SLINGSHOT: 'Ná Cao Su',
      CRYO: 'Súng Băng',
      FLAMER: 'Súng Lửa',
      SHOTGUN: 'Shotgun',
      CANNON: 'Đại Bác',
      TESLA: 'Súng Sét',
      SNIPER: 'Súng Ngắm',
      MINIGUN: 'Minigun',
      METEOR: 'Thiên Thạch',
    };

    allGuns.forEach((g, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);

      const card = new Container();
      card.x = col * 330;
      card.y = 60 + row * 92;
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.hitArea = new Rectangle(0, 0, 318, 80);

      const isEquipped = this.saveData.equippedGuns.includes(g);
      const bg = new Graphics();
      bg.roundRect(0, 0, 318, 80, 10);
      bg.fill({ color: isEquipped ? 0x14532d : 0x1e293b });
      bg.stroke({ color: isEquipped ? 0x4ade80 : 0x475569, width: isEquipped ? 3 : 1.5 });
      card.addChild(bg);

      const icon = new Sprite(PixelAssetManager.getGunBarrelTexture(g, 1));
      icon.anchor.set(0.5);
      icon.x = 42;
      icon.y = 40;
      card.addChild(icon);

      const nameTxt = new Text({
        text: `${gunNames[g]} (Lv.${this.saveData.gunLevels[g] || 1})`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#ffffff', fontWeight: 'bold' }
      });
      nameTxt.x = 88;
      nameTxt.y = 16;
      card.addChild(nameTxt);

      const statusTxt = new Text({
        text: isEquipped ? '✔ ĐÃ TRANG BỊ' : '+ BẤM ĐỂ CHỌN',
        style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: isEquipped ? '#86efac' : '#94a3b8' }
      });
      statusTxt.x = 88;
      statusTxt.y = 44;
      card.addChild(statusTxt);

      card.on('pointerdown', () => {
        if (isEquipped) {
          if (this.saveData.equippedGuns.length > 1) {
            this.saveData.equippedGuns = this.saveData.equippedGuns.filter(item => item !== g);
          }
        } else {
          if (this.saveData.equippedGuns.length < 5) {
            this.saveData.equippedGuns.push(g);
          } else {
            // Thay thế súng cuối
            this.saveData.equippedGuns.shift();
            this.saveData.equippedGuns.push(g);
          }
        }
        this.saveGame();
        sound.playClick();
        this.renderMainMenu();
      });

      cont.addChild(card);
    });

    // 4 Buffs
    const buffCont = new Container();
    buffCont.y = 660;

    const buffTitle = new Text({
      text: 'CHỌN 2 LOẠI BUFF:',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#38bdf8', fontWeight: 'bold' }
    });
    buffTitle.x = 0;
    buffCont.addChild(buffTitle);

    const allBuffs: BuffKind[] = ['DMG', 'SPEED', 'FILL', 'CRIT'];
    const buffNames: Record<BuffKind, string> = {
      DMG: 'Buff DMG',
      SPEED: 'Buff Tốc',
      FILL: 'Buff Nạp',
      CRIT: 'Buff Crit',
    };

    allBuffs.forEach((b, i) => {
      const bCard = new Container();
      bCard.x = i * 164;
      bCard.y = 36;
      bCard.eventMode = 'static';
      bCard.cursor = 'pointer';
      bCard.hitArea = new Rectangle(0, 0, 154, 76);

      const isEquipped = this.saveData.equippedBuffs.includes(b);
      const bBg = new Graphics();
      bBg.roundRect(0, 0, 154, 76, 8);
      bBg.fill({ color: isEquipped ? 0x713f12 : 0x1e293b });
      bBg.stroke({ color: isEquipped ? 0xfacc15 : 0x475569, width: isEquipped ? 3 : 1.5 });
      bCard.addChild(bBg);

      const bTxt = new Text({
        text: `${buffNames[b]}\n${isEquipped ? '✔ DÙNG' : '+ CHỌN'}`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 14, fill: '#ffffff', align: 'center', fontWeight: 'bold', lineHeight: 20 }
      });
      bTxt.anchor.set(0.5);
      bTxt.x = 77;
      bTxt.y = 38;
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

      buffCont.addChild(bCard);
    });

    cont.addChild(buffCont);
    this.mainMenuContainer.addChild(cont);
  }

  // --- TAB 3: WORKSHOP & GACHA ---
  private renderWorkshopTab() {
    const cont = new Container();
    cont.x = 36;
    cont.y = 215;

    // 1. Gacha Machine Card
    const gachaCard = new Container();
    const gBg = new Graphics();
    gBg.roundRect(0, 0, 648, 170, 14);
    gBg.fill({ color: 0x312e81 });
    gBg.stroke({ color: 0x818cf8, width: 3 });
    gachaCard.addChild(gBg);

    const gTitle = new Text({
      text: '🎰 VÒNG QUAY BÁNH RĂNG THẦN BÍ (25 💎)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 20, fill: '#facc15', fontWeight: 'bold' }
    });
    gTitle.x = 24;
    gTitle.y = 20;
    gachaCard.addChild(gTitle);

    const gDesc = new Text({
      text: 'Quay ngẫu nhiên: Nhận 100 - 350$ Vàng vĩnh viễn hoặc Nâng Cấp Miễn Phí 1 Súng!',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 14, fill: '#c7d2fe' }
    });
    gDesc.x = 24;
    gDesc.y = 56;
    gachaCard.addChild(gDesc);

    // Nút Gacha
    const gBtn = new Container();
    gBtn.x = 24;
    gBtn.y = 96;
    gBtn.eventMode = 'static';
    gBtn.cursor = 'pointer';
    gBtn.hitArea = new Rectangle(0, 0, 240, 50);

    const gBtnBg = new Graphics();
    gBtnBg.roundRect(0, 0, 240, 50, 8);
    gBtnBg.fill({ color: 0x4f46e5 });
    gBtnBg.stroke({ color: 0xa5b4fc, width: 2 });
    gBtn.addChild(gBtnBg);

    const gBtnTxt = new Text({
      text: 'QUAY NGAY (25 💎)',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#ffffff', fontWeight: 'bold' }
    });
    gBtnTxt.anchor.set(0.5);
    gBtnTxt.x = 120;
    gBtnTxt.y = 25;
    gBtn.addChild(gBtnTxt);

    gBtn.on('pointerdown', () => {
      if (this.saveData.diamonds < 25) {
        sound.playHit();
        alert('Không đủ Kim Cương! Hãy chiến thắng các ván để nhận thêm Kim Cương.');
        return;
      }

      this.saveData.diamonds -= 25;
      const isUpgrade = Math.random() < 0.4;

      if (isUpgrade) {
        const allGuns: GunKind[] = [
          'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'CRYO', 'FLAMER',
          'SHOTGUN', 'CANNON', 'TESLA', 'SNIPER', 'MINIGUN', 'METEOR'
        ];
        const g = allGuns[Math.floor(Math.random() * allGuns.length)];
        this.saveData.gunLevels[g] = (this.saveData.gunLevels[g] || 1) + 1;
        sound.playMerge();
        alert(`🎉 CHÚC MỪNG: Bạn nhận được nâng cấp vĩnh viễn cho [${g}] lên Lv.${this.saveData.gunLevels[g]}!`);
      } else {
        const rewardGold = 100 + Math.floor(Math.random() * 250);
        this.saveData.permanentGold += rewardGold;
        sound.playMerge();
        alert(`🎉 CHÚC MỪNG: Bạn trúng thưởng +${rewardGold}$ Vàng vĩnh viễn!`);
      }

      this.saveGame();
      this.renderMainMenu();
    });

    gachaCard.addChild(gBtn);
    cont.addChild(gachaCard);

    // 2. Danh sách nâng cấp súng
    const upTitle = new Text({
      text: '🔧 NÂNG CẤP SỨNG VĨNH VIỄN (+15% SÁT THƯƠNG / CẤP):',
      style: { fontFamily: this.FONT_FAMILY, fontSize: 16, fill: '#38bdf8', fontWeight: 'bold' }
    });
    upTitle.y = 195;
    cont.addChild(upTitle);

    const allGuns: GunKind[] = [
      'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'CRYO', 'FLAMER',
      'SHOTGUN', 'CANNON', 'TESLA', 'SNIPER', 'MINIGUN', 'METEOR'
    ];

    allGuns.forEach((g, idx) => {
      const row = idx;
      const uCard = new Container();
      uCard.y = 230 + row * 62;

      const bg = new Graphics();
      bg.roundRect(0, 0, 648, 54, 8);
      bg.fill({ color: 0x1e293b });
      bg.stroke({ color: 0x334155, width: 1.5 });
      uCard.addChild(bg);

      const lvl = this.saveData.gunLevels[g] || 1;
      const cost = lvl * 30;

      const nameTxt = new Text({
        text: `${g} (Cấp ${lvl}) • +${(lvl - 1) * 15}% DMG`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 15, fill: '#ffffff', fontWeight: 'bold' }
      });
      nameTxt.x = 20;
      nameTxt.y = 16;
      uCard.addChild(nameTxt);

      const upBtn = new Container();
      upBtn.x = 440;
      upBtn.y = 8;
      upBtn.eventMode = 'static';
      upBtn.cursor = 'pointer';
      upBtn.hitArea = new Rectangle(0, 0, 190, 38);

      const canBuy = this.saveData.permanentGold >= cost;
      const btnBg = new Graphics();
      btnBg.roundRect(0, 0, 190, 38, 6);
      btnBg.fill({ color: canBuy ? 0x16a34a : 0x475569 });
      upBtn.addChild(btnBg);

      const btnTxt = new Text({
        text: `NÂNG (${cost}$)`,
        style: { fontFamily: this.FONT_FAMILY, fontSize: 13, fill: '#ffffff', fontWeight: 'bold' }
      });
      btnTxt.anchor.set(0.5);
      btnTxt.x = 95;
      btnTxt.y = 19;
      upBtn.addChild(btnTxt);

      upBtn.on('pointerdown', () => {
        if (this.saveData.permanentGold < cost) {
          sound.playHit();
          alert('Không đủ Vàng vĩnh viễn!');
          return;
        }

        this.saveData.permanentGold -= cost;
        this.saveData.gunLevels[g] = lvl + 1;
        this.saveGame();
        sound.playMerge();
        this.renderMainMenu();
      });

      uCard.addChild(upBtn);
      cont.addChild(uCard);
    });

    this.mainMenuContainer.addChild(cont);
  }

  // --- QUẢN LÝ BẮT ĐẦU VÁN & VỀ MÀN HÌNH CHÍNH ---
  public startBattle() {
    this.inMenu = false;
    this.mainMenuContainer.visible = false;
    this.resultModalContainer.visible = false;

    this.isGameOver = false;
    this.isVictory = false;
    this.isWaveActive = false;
    this.prepPhase = true;

    this.wave = 1;
    this.maxWave = this.gameMode === 'CAMPAIGN' ? 10 : 999;
    this.castleHp = this.maxCastleHp;
    this.gold = 15;
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
  }

  // --- MODAL KẾT THÚC VÁN ĐẤU (THẮNG / THUA) ---
  private initResultModal() {
    this.resultModalContainer.visible = false;
    this.resultModalContainer.eventMode = 'static';
    this.resultModalContainer.hitArea = new Rectangle(0, 0, 720, 1280);
  }

  private showResultModal(isWin: boolean, waveReached: number) {
    this.resultModalContainer.removeChildren();
    this.resultModalContainer.visible = true;

    // Overlay mờ
    const mask = new Graphics();
    mask.rect(0, 0, 720, 1280);
    mask.fill({ color: 0x000000, alpha: 0.85 });
    this.resultModalContainer.addChild(mask);

    // Khung bảng kết quả
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
