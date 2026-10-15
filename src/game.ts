import { Container, Graphics, Sprite, Text, TextStyle, Rectangle, FederatedPointerEvent } from 'pixi.js';
import { GridCell, GridItem, Bullet, Enemy, GunKind, BuffKind } from './types';
import { PixelAssetManager } from './pixelArt';
import { sound } from './audio';

// Quản lý View cố định cho từng ô 96x96 (Zero Allocation)
interface GridSlotView {
  container: Container;
  cellSprite: Sprite;
  highlightG: Graphics;
  mergeHighlightG: Graphics; // Viền vàng kim phát sáng khi có thể MERGE
  itemContainer: Container;
  baseSprite: Sprite; // Đế bánh răng kim loại xoay khi Cò gõ
  barrelSprite: Sprite; // Nòng súng xoay 360 độ tự động ngắm quái
  fillG: Graphics;
  lvlText: Text;
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
  private enemyContainer: Container;
  private bulletContainer: Container;
  private fxContainer: Container;
  private uiContainer: Container;
  private dragContainer: Container;
  private tooltipContainer: Container;

  // Ô Thùng Rác (Bán món đồ khi đang kéo)
  private trashContainer!: Container;
  private trashBg!: Graphics;
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
  private rollBtnBg!: Graphics;
  private rollBtnText!: Text;
  private startWaveBtnContainer!: Container;
  private startWaveBtnBg!: Graphics;
  private startWaveBtnText!: Text;
  private speedBtnText!: Text;
  private tipText!: Text;

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

    this.stage.addChild(this.bgContainer);
    this.stage.addChild(this.enemyContainer);
    this.stage.addChild(this.wallContainer);
    this.stage.addChild(this.bulletContainer);
    this.stage.addChild(this.gridContainer);
    this.stage.addChild(this.dragContainer);
    this.stage.addChild(this.fxContainer);
    this.stage.addChild(this.uiContainer);
    this.stage.addChild(this.tooltipContainer);

    this.initBackground();
    this.initGrid();
    this.initWall();
    this.initObjectPools();
    this.initTooltip();
    this.initUI();
    this.initTrashZone();
    this.initGlobalDragListeners();
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

        const itemContainer = new Container();
        itemContainer.x = 8;
        itemContainer.y = 8;
        itemContainer.visible = false;

        // Bệ tháp bánh răng xoay quanh tâm (anchor 0.5)
        const baseSprite = new Sprite();
        baseSprite.anchor.set(0.5);
        baseSprite.x = 40;
        baseSprite.y = 40;
        itemContainer.addChild(baseSprite);

        // Nòng súng xoay 360 độ tự động ngắm quái
        const barrelSprite = new Sprite();
        barrelSprite.anchor.set(0.5);
        barrelSprite.x = 40;
        barrelSprite.y = 40;
        itemContainer.addChild(barrelSprite);

        // Thanh Fill Bar
        const fillG = new Graphics();
        itemContainer.addChild(fillG);

        const lvlText = new Text({
          text: '',
          style: {
            fontFamily: this.FONT_FAMILY,
            fontSize: 16,
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 3 },
          }
        });
        lvlText.x = 52;
        lvlText.y = 48;
        lvlText.eventMode = 'none';
        itemContainer.addChild(lvlText);

        slotCont.addChild(itemContainer);
        this.gridContainer.addChild(slotCont);

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
          itemContainer,
          baseSprite,
          barrelSprite,
          fillG,
          lvlText,
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

  // Khởi tạo Ô Thùng Rác (Trash Zone) màu đỏ để bán món đồ khi đang kéo
  private initTrashZone() {
    this.trashContainer = new Container();
    this.trashContainer.x = 20;
    this.trashContainer.y = 1080;
    this.trashContainer.visible = false; // Chỉ hiện khi đang kéo món đồ!
    this.trashContainer.eventMode = 'none';

    this.trashBg = new Graphics();
    this.drawTrashBg(false);
    this.trashContainer.addChild(this.trashBg);

    const trashIcon = new Sprite(PixelAssetManager.getTrashIconTexture());
    trashIcon.x = 18;
    trashIcon.y = 10;
    this.trashContainer.addChild(trashIcon);

    this.trashText = new Text({
      text: '🗑 THẢ VÀO ĐỂ BÁN\n+2$ VÀNG',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 16,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'left',
        lineHeight: 22,
      }
    });
    this.trashText.x = 88;
    this.trashText.y = 20;
    this.trashContainer.addChild(this.trashText);

    this.uiContainer.addChild(this.trashContainer);
  }

  private drawTrashBg(isHover: boolean) {
    this.trashBg.clear();
    this.trashBg.roundRect(0, 0, 230, 84, 12);
    if (isHover) {
      this.trashBg.fill({ color: 0xef4444 });
      this.trashBg.stroke({ color: 0xfef08a, width: 4 });
    } else {
      this.trashBg.fill({ color: 0xb91c1c });
      this.trashBg.stroke({ color: 0xf87171, width: 3 });
    }
  }

  // UI & Buttons
  private initUI() {
    const textStyle = new TextStyle({
      fontFamily: this.FONT_FAMILY,
      fontSize: 20,
      fill: '#f8fafc',
      fontWeight: 'bold',
    });

    // 1. Top HUD
    const topBar = new Graphics();
    topBar.rect(0, 0, 720, 56);
    topBar.fill({ color: 0x090a0f, alpha: 0.95 });
    this.uiContainer.addChild(topBar);

    this.waveText = new Text({ text: 'WAVE 1/10 (CHUẨN BỊ)', style: { ...textStyle, fontSize: 18, fill: '#60a5fa' } });
    this.waveText.x = 16;
    this.waveText.y = 14;
    this.uiContainer.addChild(this.waveText);

    this.hpText = new Text({ text: 'HP THÀNH: 100/100', style: { ...textStyle, fontSize: 18, fill: '#4ade80' } });
    this.hpText.x = 340;
    this.hpText.y = 14;
    this.uiContainer.addChild(this.hpText);

    this.goldText = new Text({ text: '$: 15', style: { ...textStyle, fontSize: 20, fill: '#facc15' } });
    this.goldText.x = 610;
    this.goldText.y = 14;
    this.uiContainer.addChild(this.goldText);

    // 2. Bottom Controls
    const botBar = new Graphics();
    botBar.rect(0, 1060, 720, 220);
    botBar.fill({ color: 0x0d0e15 });
    this.uiContainer.addChild(botBar);

    // Nút ROLL (w = 230, h = 84)
    this.rollBtnContainer = new Container();
    this.rollBtnContainer.x = 20;
    this.rollBtnContainer.y = 1080;
    this.rollBtnContainer.eventMode = 'static';
    this.rollBtnContainer.cursor = 'pointer';
    this.rollBtnContainer.hitArea = new Rectangle(0, 0, 230, 84);

    this.rollBtnBg = new Graphics();
    this.rollBtnBg.roundRect(0, 0, 230, 84, 12);
    this.rollBtnBg.fill({ color: 0x1d4ed8 });
    this.rollBtnBg.stroke({ color: 0x60a5fa, width: 3 });
    this.rollBtnContainer.addChild(this.rollBtnBg);

    this.rollBtnText = new Text({
      text: '🎲 ROLL (2$)\n(Súng / Cò / Buff)',
      style: { ...textStyle, fontSize: 18, align: 'center' }
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

    // Nút BẮT ĐẦU VÁN (w = 430, h = 84)
    this.startWaveBtnContainer = new Container();
    this.startWaveBtnContainer.x = 270;
    this.startWaveBtnContainer.y = 1080;
    this.startWaveBtnContainer.eventMode = 'static';
    this.startWaveBtnContainer.cursor = 'pointer';
    this.startWaveBtnContainer.hitArea = new Rectangle(0, 0, 430, 84);

    this.startWaveBtnBg = new Graphics();
    this.drawStartWaveBtn(true);
    this.startWaveBtnContainer.addChild(this.startWaveBtnBg);

    this.startWaveBtnText = new Text({
      text: '⚔ BẮT ĐẦU VÁN 1',
      style: { ...textStyle, fontSize: 24, fill: '#ffffff', align: 'center', fontWeight: 'bold' }
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

    // Nút TUA NHANH x1 / x2 (y = 1185)
    const speedBtn = new Container();
    speedBtn.x = 20;
    speedBtn.y = 1185;
    speedBtn.eventMode = 'static';
    speedBtn.cursor = 'pointer';
    speedBtn.hitArea = new Rectangle(0, 0, 160, 52);

    const speedBg = new Graphics();
    speedBg.roundRect(0, 0, 160, 52, 8);
    speedBg.fill({ color: 0x334155 });
    speedBg.stroke({ color: 0x64748b, width: 2 });
    speedBtn.addChild(speedBg);

    this.speedBtnText = new Text({ text: 'TỐC ĐỘ: x1', style: { ...textStyle, fontSize: 16 } });
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
    this.startWaveBtnBg.clear();
    this.startWaveBtnBg.roundRect(0, 0, 430, 84, 12);
    if (isActive) {
      this.startWaveBtnBg.fill({ color: 0x16a34a });
      this.startWaveBtnBg.stroke({ color: 0x4ade80, width: 3 });
    } else {
      this.startWaveBtnBg.fill({ color: 0x3f3f46 });
      this.startWaveBtnBg.stroke({ color: 0x71717a, width: 2 });
    }
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
    this.rollPrice = Math.min(2 + Math.floor(this.rollCount * 0.7), 12);
    this.rollBtnText.text = `🎲 ROLL (${this.rollPrice}$)\n(Súng / Cò / Buff)`;

    const rollType = Math.random();
    if (rollType < 0.60) {
      const guns: GunKind[] = ['PISTOL', 'CROSSBOW', 'CRYO', 'FLAMER', 'SHOTGUN', 'CANNON', 'TESLA'];
      const chosen = guns[Math.floor(Math.random() * guns.length)];
      emptyCell.item = this.createGun(chosen, 1);
    } else if (rollType < 0.85) {
      emptyCell.item = this.createTrigger(1);
    } else {
      const buffs: BuffKind[] = ['DMG', 'SPEED', 'FILL', 'CRIT'];
      const chosen = buffs[Math.floor(Math.random() * buffs.length)];
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
      return;
    }

    view.itemContainer.visible = true;
    view.itemContainer.alpha = 1.0;

    if (item.type === 'TRIGGER') {
      view.baseSprite.texture = PixelAssetManager.getTriggerTexture(item.level);
      view.baseSprite.anchor.set(0.5);
      view.baseSprite.x = 40;
      view.baseSprite.y = 40;
      view.baseSprite.rotation = (item.angle * Math.PI) / 180;
      view.barrelSprite.visible = false;
      view.fillG.visible = false;
      view.lvlText.text = `x${item.level}`;
      view.lvlText.style.fill = '#fef08a';
    } else if (item.type === 'GUN') {
      // ĐẾ BÁNH RĂNG KIM LOẠI
      view.baseSprite.texture = PixelAssetManager.getGunBaseTexture(item.tier);
      view.baseSprite.anchor.set(0.5);
      view.baseSprite.x = 40;
      view.baseSprite.y = 40;
      view.baseSprite.rotation = item.gearAngle || 0;

      // NÒNG SÚNG XOAY 360 ĐỘ
      view.barrelSprite.visible = true;
      view.barrelSprite.texture = PixelAssetManager.getGunBarrelTexture(item.gunKind!, item.level);
      view.barrelSprite.rotation = item.turretAngle;

      view.fillG.visible = true;
      view.lvlText.text = `${item.level}`;
      view.lvlText.style.fill = '#ffffff';
    } else if (item.type === 'BUFF') {
      view.baseSprite.texture = PixelAssetManager.getBuffTexture(item.buffKind!, item.level);
      view.baseSprite.anchor.set(0.5);
      view.baseSprite.x = 40;
      view.baseSprite.y = 40;
      view.baseSprite.rotation = 0;
      view.barrelSprite.visible = false;
      view.fillG.visible = false;
      view.lvlText.text = `${item.level}`;
      view.lvlText.style.fill = '#ffffff';
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
                if (dest.type === 'GUN') {
                  targetCell.item = this.createGun(dest.gunKind!, dest.level + 1);
                } else if (dest.type === 'TRIGGER') {
                  targetCell.item = this.createTrigger(dest.level + 1);
                } else if (dest.type === 'BUFF') {
                  targetCell.item = this.createBuff(dest.buffKind!, dest.level + 1);
                }

                sourceCell.item = null;
                this.syncSlotView(dropCol, dropRow);
                this.syncSlotView(origCol, origRow);
                sound.playMerge();
                this.addFloatingText(
                  this.GRID_X + dropCol * this.CELL_SIZE + 48,
                  this.GRID_Y + dropRow * this.CELL_SIZE + 48,
                  `MERGE Lv${targetCell.item!.level}!`,
                  '#facc15'
                );
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
      const base = new Sprite(PixelAssetManager.getGunBaseTexture(item.tier));
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

    this.tooltipCard.clear();
    this.tooltipCard.roundRect(0, 0, tipW, tipH, 10);
    this.tooltipCard.fill({ color: 0x13151f, alpha: 0.96 });
    this.tooltipCard.stroke({ color: 0x38bdf8, width: 2 });

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
        CRYO: 'SÚNG BĂNG',
        FLAMER: 'SÚNG LỬA',
        SHOTGUN: 'SHOTGUN',
        CANNON: 'ĐẠI BÁC BOM',
        TESLA: 'SÚNG SÉT',
      };
      name = `${names[item.gunKind!]} Lv${item.level}`;
      const hitsNeeded = Math.ceil(1.0 / item.fillPerHit);
      stats = `• Sát thương: ${item.damage} DMG\n• Cần nạp: ${hitsNeeded} lần gõ (1 viên)\n• Xoay 360° tự động ngắm quái`;

      const effects: Record<GunKind, string> = {
        PISTOL: 'Bắn tia plasma thẳng chính xác vào quái.',
        CROSSBOW: 'Mũi tên xuyên qua 1 quái đầu tiên.',
        CRYO: 'Làm chậm quái 40% trong 2 giây.',
        FLAMER: 'Thiêu đốt quái liên tục trong 3 giây.',
        SHOTGUN: 'Bắn chùm 3 tia cực mạnh.',
        CANNON: 'Bắn đạn pháo phát nổ lan AOE.',
        TESLA: 'Giật sét chuyền 3 mục tiêu.',
      };
      desc = effects[item.gunKind!];
    } else if (item.type === 'BUFF') {
      const buffNames: Record<BuffKind, string> = {
        DMG: 'BUFF SÁT THƯƠNG',
        SPEED: 'BUFF TỐC ĐỘ CÒ',
        FILL: 'BUFF SIÊU NẠP',
        CRIT: 'BUFF CHÍ MẠNG',
      };
      name = `${buffNames[item.buffKind!]} Lv${item.level}`;
      if (item.buffKind === 'DMG') stats = `• Tăng +${item.level * 20}% Sát thương súng kề`;
      if (item.buffKind === 'SPEED') stats = `• Tăng +${item.level * 20}% Tốc độ xoay Cò kề`;
      if (item.buffKind === 'FILL') stats = `• Tăng +${item.level * 15}% Tốc độ nạp súng kề`;
      if (item.buffKind === 'CRIT') stats = `• Tăng +${item.level * 10}% Tỉ lệ bạo kích`;
      desc = `Tác dụng lên 4 ô kề cạnh (Trên, Dưới, Trái, Phải).`;
    }

    this.tooltipTitleText.text = name;
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
    if (this.isGameOver || this.isVictory) return;

    const dt = Math.min(rawDt, 0.1) * this.gameSpeed;

    this.updateTriggers(dt);
    this.updateGunsAndAim(dt);

    if (this.isWaveActive) {
      this.updateWave(dt);
    }

    this.updateBullets(dt);
    this.updateFloatingTexts(dt);
    this.updateScreenShake(dt);

    this.goldText.text = `$: ${this.gold}`;
    this.hpText.text = `HP THÀNH: ${this.castleHp}/${this.maxCastleHp}`;

    this.renderActiveEntities();
  }

  private updateTriggers(dt: number) {
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

        const prevAngle = item.angle;
        const speedDeg = item.rotationSpeed * speedMultiplier * 360;
        item.angle = (item.angle + speedDeg * dt) % 360;

        // Xoay nẫy Cò
        this.slotViews[r][c].baseSprite.rotation = (item.angle * Math.PI) / 180;

        const cardinalAngles = [
          { dir: 'RIGHT', angle: 0, dc: 1, dr: 0 },
          { dir: 'DOWN', angle: 90, dc: 0, dr: 1 },
          { dir: 'LEFT', angle: 180, dc: -1, dr: 0 },
          { dir: 'UP', angle: 270, dc: 0, dr: -1 },
        ];

        const bladesCount = item.level;
        const bladeStep = 360 / bladesCount;

        for (let b = 0; b < bladesCount; b++) {
          const bladeAngle = (item.angle + b * bladeStep) % 360;
          const prevBladeAngle = (prevAngle + b * bladeStep) % 360;

          cardinalAngles.forEach(card => {
            if (this.angleCrossed(prevBladeAngle, bladeAngle, card.angle)) {
              this.triggerHit(c + card.dc, r + card.dr);
            }
          });
        }
      }
    }
  }

  private angleCrossed(prev: number, curr: number, target: number): boolean {
    if (prev <= curr) {
      return prev < target && target <= curr;
    } else {
      return prev < target || target <= curr;
    }
  }

  // Khi Cò chạm vào súng: ĐẾ BÁNH RĂNG CỦA SÚNG CŨNG XOAY ĂN KHỚP
  private triggerHit(targetCol: number, targetRow: number) {
    if (targetCol < 0 || targetCol >= this.COLS || targetRow < 0 || targetRow >= this.ROWS) return;

    const targetCell = this.grid[targetRow][targetCol];
    if (!targetCell || !targetCell.item) return;

    const item = targetCell.item;

    if (item.type === 'GUN') {
      let fillMultiplier = 1.0;
      this.getAdjacentCells(targetCol, targetRow).forEach(adj => {
        if (adj.item && adj.item.type === 'BUFF' && adj.item.buffKind === 'FILL') {
          fillMultiplier += 0.15 * adj.item.level;
        }
      });

      item.fill += item.fillPerHit * fillMultiplier;
      item.recoilOffset = 6;

      // ĐẾ BÁNH RĂNG CỦA SÚNG XOAY 30 ĐỘ MỖI LẦN CÒ GÕ!
      item.gearAngle = (item.gearAngle + Math.PI / 6) % (Math.PI * 2);
      this.slotViews[targetRow][targetCol].baseSprite.rotation = item.gearAngle;

      sound.playClick();

      if (item.fill >= 1.0) {
        item.fill -= 1.0;
        if (this.isWaveActive || this.enemies.length > 0) {
          this.fireGunTowardsTarget(targetCol, targetRow, item);
        }
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

          if (item.recoilOffset > 0) {
            item.recoilOffset = Math.max(0, item.recoilOffset - 36 * dt);
          }
          view.itemContainer.y = 8 - item.recoilOffset;

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

    const bulletSpeed = 750;
    sound.playShoot(gun.tier);

    if (gun.rangeType === 'SPREAD') {
      [-0.2, 0, 0.2].forEach(offset => {
        const a = angle + offset;
        this.spawnBullet(
          gunX, gunY,
          Math.cos(a) * bulletSpeed,
          Math.sin(a) * bulletSpeed,
          Math.round(finalDmg * 0.7),
          1, 'NORMAL', a
        );
      });
    } else {
      const vx = Math.cos(angle) * bulletSpeed;
      const vy = Math.sin(angle) * bulletSpeed;
      const pierce = gun.gunKind === 'CROSSBOW' ? 2 : 1;
      this.spawnBullet(gunX, gunY, vx, vy, finalDmg, pierce, this.getGunElement(gun.gunKind), angle);
    }
  }

  private getGunElement(kind?: GunKind): 'NORMAL' | 'ICE' | 'FIRE' | 'ELECTRIC' | 'EXPLOSIVE' {
    if (kind === 'CRYO') return 'ICE';
    if (kind === 'FLAMER') return 'FIRE';
    if (kind === 'CANNON') return 'EXPLOSIVE';
    if (kind === 'TESLA') return 'ELECTRIC';
    return 'NORMAL';
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number, damage: number, pierce: number, element: any, angle: number) {
    this.bullets.push({
      id: this.nextId++,
      x,
      y,
      vx,
      vy,
      damage,
      pierce,
      element,
      active: true,
      radius: 10,
      angle,
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

    const isBossWave = this.wave === this.maxWave && this.enemiesToSpawn === 0;
    const isElite = !isBossWave && Math.random() < 0.2;

    const baseHp = 35 * Math.pow(1.22, this.wave - 1);
    let hp = baseHp;
    let speed = 55 + Math.random() * 20;

    if (isBossWave) {
      hp = baseHp * 6;
      speed = 35;
    } else if (isElite) {
      hp = baseHp * 2.2;
      speed = 45;
    }

    this.enemies.push({
      id: this.nextId++,
      x,
      y,
      targetX,
      targetY,
      hp: Math.round(hp),
      maxHp: Math.round(hp),
      speed,
      isBoss: isBossWave,
      isElite,
      active: true,
      width: isBossWave ? 96 : (isElite ? 64 : 48),
      height: isBossWave ? 96 : (isElite ? 64 : 48),
      slowTimer: 0,
      burnTimer: 0,
      hitFlashTimer: 0,
    });
  }

  private killEnemy(e: Enemy) {
    e.active = false;
    const reward = e.isBoss ? 25 : (e.isElite ? 6 : 2);
    this.gold += reward;
    sound.playExplode();
    this.addFloatingText(e.x, e.y, `+${reward}$`, '#facc15');
  }

  private onWaveClear() {
    this.isWaveActive = false;
    this.prepPhase = true;

    const waveBonus = 10 + this.wave * 2;
    this.gold += waveBonus;
    sound.playMerge();
    this.addFloatingText(360, 300, `QUA WAVE ${this.wave}! +${waveBonus}$`, '#4ade80');

    if (this.wave >= this.maxWave) {
      this.isVictory = true;
      this.addFloatingText(360, 360, 'CHIẾN THẮNG TOÀN DIỆN!', '#facc15');
      this.drawStartWaveBtn(false);
      this.startWaveBtnText.text = 'THẮNG CUỘC!';
      return;
    }

    this.wave++;
    this.drawStartWaveBtn(true);
    this.startWaveBtnText.text = `⚔ BẮT ĐẦU VÁN ${this.wave}`;
    this.tipText.text = `Chuẩn bị xong ấn BẮT ĐẦU VÁN ${this.wave}`;
    this.tipText.style.fill = '#facc15';
    this.waveText.text = `WAVE ${this.wave}/${this.maxWave} (CHUẨN BỊ)`;
    this.waveText.style.fill = '#60a5fa';
  }

  private onGameOver() {
    this.isGameOver = true;
    sound.playExplode();
    this.addFloatingText(360, 360, 'THÀNH BỊ PHÁ HỦY!', '#ef4444');
    this.drawStartWaveBtn(false);
    this.startWaveBtnText.text = 'THUA RỒI!';
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
          e.hp -= b.damage;
          e.hitFlashTimer = 0.08;
          sound.playHit();
          this.addFloatingText(e.x + (Math.random() * 24 - 12), e.y - 16, `${b.damage}`, '#ffffff');

          if (b.element === 'ICE') e.slowTimer = 2.0;
          if (b.element === 'FIRE') e.burnTimer = 3.0;

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

        const type = e.isBoss ? 'BOSS' : (e.isElite ? 'TANK' : 'NORMAL');
        view.sprite.texture = PixelAssetManager.getEnemyTexture(type);

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
        view.sprite.texture = PixelAssetManager.getBulletTexture(b.element);
      } else {
        view.sprite.visible = false;
      }
    }
  }

  public createGun(kind: GunKind, level: number): GridItem {
    const baseDamageMap: Record<GunKind, number> = {
      PISTOL: 18,
      CROSSBOW: 26,
      CRYO: 20,
      FLAMER: 18,
      SHOTGUN: 48,
      CANNON: 70,
      TESLA: 42,
    };

    const fillPerHitMap: Record<GunKind, number> = {
      PISTOL: 0.50,
      CROSSBOW: 0.34,
      CRYO: 0.34,
      FLAMER: 0.34,
      SHOTGUN: 0.25,
      CANNON: 0.25,
      TESLA: 0.25,
    };

    const rangeTypeMap: Record<GunKind, 'LANE' | 'SPREAD' | 'GLOBAL' | 'SHORT'> = {
      PISTOL: 'LANE',
      CROSSBOW: 'LANE',
      CRYO: 'LANE',
      FLAMER: 'LANE',
      SHOTGUN: 'SPREAD',
      CANNON: 'LANE',
      TESLA: 'GLOBAL',
    };

    const dmg = Math.round(baseDamageMap[kind] * Math.pow(1.8, level - 1));

    return {
      id: `gun_${Date.now()}_${Math.random()}`,
      type: 'GUN',
      level,
      tier: kind === 'PISTOL' || kind === 'CROSSBOW' ? 1 : (kind === 'CANNON' || kind === 'TESLA' ? 3 : 2),
      gunKind: kind,
      fill: 0,
      fillPerHit: fillPerHitMap[kind],
      damage: dmg,
      rangeType: rangeTypeMap[kind],
      recoilOffset: 0,
      turretAngle: -Math.PI / 2,
      gearAngle: 0, // Đế bánh răng súng xoay khi cò gõ
      angle: 0,
      rotationSpeed: 0,
      lastHitAngle: [],
    };
  }

  public createTrigger(level: number): GridItem {
    return {
      id: `trigger_${Date.now()}_${Math.random()}`,
      type: 'TRIGGER',
      level,
      tier: 1,
      angle: 0,
      rotationSpeed: 1.5,
      lastHitAngle: [],
      fill: 0,
      fillPerHit: 0,
      damage: 0,
      rangeType: 'LANE',
      recoilOffset: 0,
      turretAngle: 0,
      gearAngle: 0,
    };
  }

  public createBuff(kind: BuffKind, level: number): GridItem {
    return {
      id: `buff_${Date.now()}_${Math.random()}`,
      type: 'BUFF',
      level,
      tier: 2,
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
    };
  }
}
