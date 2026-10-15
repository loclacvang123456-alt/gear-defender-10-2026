import { Container, Graphics, Sprite, Text, TextStyle, Rectangle, FederatedPointerEvent } from 'pixi.js';
import { GridCell, GridItem, Bullet, Enemy, FloatingText, GunKind, BuffKind } from './types';
import { PixelAssetManager } from './pixelArt';
import { sound } from './audio';

// Kiểu quản lý View cố định cho từng ô trong lưới 5x5 (Zero-Allocation)
interface GridSlotView {
  container: Container;
  cellSprite: Sprite;
  highlightG: Graphics;
  itemContainer: Container;
  itemSprite: Sprite;
  fillG: Graphics;
  lvlText: Text;
}

// Kiểu quản lý Object Pool cho Enemy
interface EnemyView {
  container: Container;
  sprite: Sprite;
  hpBg: Graphics;
  hpFill: Graphics;
  active: boolean;
}

// Kiểu quản lý Object Pool cho Bullet
interface BulletView {
  sprite: Sprite;
  active: boolean;
}

// Kiểu quản lý Object Pool cho Floating Text
interface FloatingTextView {
  text: Text;
  active: boolean;
  lifetime: number;
}

export class GameEngine {
  public stage: Container;

  // Lưới lâu đài 5x5
  public readonly COLS = 5;
  public readonly ROWS = 5;
  public readonly CELL_SIZE = 48;
  public readonly GRID_X = 60; // (360 - 240) / 2 = 60
  public readonly GRID_Y = 264;
  public readonly WALL_Y = 258;

  public grid: GridCell[][] = [];

  // Mảng View cố định của 25 ô (Không bao giờ recreate)
  private slotViews: GridSlotView[][] = [];

  // Object Pools (Zero GC, không giật lag, không crash)
  private enemyPool: EnemyView[] = [];
  private bulletPool: BulletView[] = [];
  private floatingTextPool: FloatingTextView[] = [];

  // Dữ liệu Entity logic
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];

  // Containers phân lớp hiển thị
  private bgContainer: Container;
  private wallContainer: Container;
  private gridContainer: Container;
  private enemyContainer: Container;
  private bulletContainer: Container;
  private fxContainer: Container;
  private uiContainer: Container;
  private dragContainer: Container;
  private tooltipContainer: Container;

  // Tooltip Popover (Hiện cạnh súng)
  private tooltipCard!: Graphics;
  private tooltipTitleText!: Text;
  private tooltipStatsText!: Text;
  private tooltipDescText!: Text;
  private tooltipHintText!: Text;
  private currentInspectedItem: GridItem | null = null;

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
  public gold: number = 12;
  public castleHp: number = 100;
  public maxCastleHp: number = 100;
  public wave: number = 1;
  public maxWave: number = 10;
  public isWaveActive: boolean = false;
  public prepPhase: boolean = true;
  public spawnTimer: number = 0;
  public enemiesToSpawn: number = 0;
  public isFirstEnemyOfWave1: boolean = true;
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

  // Font chung hiện đại, sắc nét, dễ nhìn
  private readonly FONT_FAMILY = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif';

  constructor() {
    this.stage = new Container();
    this.stage.eventMode = 'static';
    this.stage.hitArea = new Rectangle(0, 0, 360, 640);

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
    this.initGlobalDragListeners();
  }

  // Khởi tạo nền
  private initBackground() {
    const bg = new Graphics();
    bg.rect(0, 0, 360, this.WALL_Y);
    bg.fill({ color: 0x111318 });

    // 5 làn quái dọc
    for (let i = 0; i < 5; i++) {
      const lx = this.GRID_X + i * this.CELL_SIZE;
      bg.rect(lx, 0, this.CELL_SIZE, this.WALL_Y);
      bg.fill({ color: i % 2 === 0 ? 0x141822 : 0x181c26 });

      bg.rect(lx, 0, 1, this.WALL_Y);
      bg.fill({ color: 0x242a38, alpha: 0.6 });
    }

    // Lâu đài phía dưới
    bg.rect(0, this.WALL_Y, 360, 640 - this.WALL_Y);
    bg.fill({ color: 0x0c0d12 });

    this.bgContainer.addChild(bg);
  }

  // Khởi tạo tường thành
  private initWall() {
    const wall = new Graphics();
    wall.rect(0, this.WALL_Y - 8, 360, 10);
    wall.fill({ color: 0x475569 });
    wall.rect(0, this.WALL_Y - 12, 360, 4);
    wall.fill({ color: 0x94a3b8 });

    for (let x = 0; x < 360; x += 24) {
      wall.rect(x, this.WALL_Y - 16, 12, 6);
      wall.fill({ color: 0x64748b });
    }

    this.wallContainer.addChild(wall);
  }

  // Khởi tạo Lưới 5x5 cố định (Zero Allocation - Khởi tạo View 1 lần duy nhất)
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

        // Sprite ô bàn cờ
        const cellSprite = new Sprite(PixelAssetManager.getCellTexture(true));
        slotCont.addChild(cellSprite);

        // Highlight viền hover
        const highlightG = new Graphics();
        highlightG.rect(2, 2, 44, 44);
        highlightG.stroke({ color: 0xfacc15, width: 2 });
        highlightG.visible = false;
        slotCont.addChild(highlightG);

        // Container cho Item
        const itemContainer = new Container();
        itemContainer.x = 4;
        itemContainer.y = 4;
        itemContainer.visible = false;

        const itemSprite = new Sprite();
        itemContainer.addChild(itemSprite);

        const fillG = new Graphics();
        itemContainer.addChild(fillG);

        const lvlText = new Text({
          text: '',
          style: {
            fontFamily: this.FONT_FAMILY,
            fontSize: 10,
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 },
          }
        });
        lvlText.x = 26;
        lvlText.y = 24;
        lvlText.eventMode = 'none';
        itemContainer.addChild(lvlText);

        slotCont.addChild(itemContainer);
        this.gridContainer.addChild(slotCont);

        // Bắt sự kiện pointerdown trên slot
        slotCont.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation();
          const cell = this.grid[r][c];
          if (cell.item) {
            this.onItemPointerDown(e, cell.item, c, r);
          } else {
            // Click ô trống -> Đóng tooltip
            this.hideTooltip();
          }
        });

        this.slotViews[r][c] = {
          container: slotCont,
          cellSprite,
          highlightG,
          itemContainer,
          itemSprite,
          fillG,
          lvlText,
        };
      }
    }

    // 1. Cò Lv1 ở chính giữa (2, 2)
    this.grid[2][2].item = this.createTrigger(1);

    // 2. Cho 1 Súng ngẫu nhiên ở ngay trên Cò (2, 1)
    const starterGuns: GunKind[] = ['PISTOL', 'CROSSBOW', 'CRYO', 'FLAMER', 'SHOTGUN'];
    const randomGun = starterGuns[Math.floor(Math.random() * starterGuns.length)];
    this.grid[1][2].item = this.createGun(randomGun, 1);

    // Đồng bộ hiển thị ban đầu
    this.syncAllGridSlots();
  }

  // Khởi tạo Object Pools (Tránh Major GC và Memory Leak)
  private initObjectPools() {
    // 1. Pool Enemy (25 con)
    for (let i = 0; i < 25; i++) {
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

    // 2. Pool Bullet (50 viên)
    for (let i = 0; i < 50; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.bulletContainer.addChild(sprite);
      this.bulletPool.push({ sprite, active: false });
    }

    // 3. Pool Floating Text (25 nhãn)
    for (let i = 0; i < 25; i++) {
      const text = new Text({
        text: '',
        style: {
          fontFamily: this.FONT_FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: 0x000000, width: 2 },
        }
      });
      text.anchor.set(0.5);
      text.visible = false;
      this.fxContainer.addChild(text);
      this.floatingTextPool.push({ text, active: false, lifetime: 0 });
    }
  }

  // Khởi tạo Tooltip Popover (Hiện bên cạnh súng, không overlay)
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
        fontSize: 11,
        fill: '#facc15',
        fontWeight: 'bold',
      }
    });
    this.tooltipTitleText.x = 10;
    this.tooltipTitleText.y = 8;
    this.tooltipContainer.addChild(this.tooltipTitleText);

    this.tooltipStatsText = new Text({
      text: '',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 10,
        fill: '#38bdf8',
        fontWeight: 'bold',
        lineHeight: 14,
      }
    });
    this.tooltipStatsText.x = 10;
    this.tooltipStatsText.y = 26;
    this.tooltipContainer.addChild(this.tooltipStatsText);

    this.tooltipDescText = new Text({
      text: '',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 9.5,
        fill: '#e2e8f0',
        wordWrap: true,
        wordWrapWidth: 150,
        lineHeight: 13,
      }
    });
    this.tooltipDescText.x = 10;
    this.tooltipDescText.y = 56;
    this.tooltipContainer.addChild(this.tooltipDescText);

    this.tooltipHintText = new Text({
      text: '• Chạm chỗ khác để đóng',
      style: {
        fontFamily: this.FONT_FAMILY,
        fontSize: 8.5,
        fill: '#94a3b8',
        fontStyle: 'italic',
      }
    });
    this.tooltipHintText.x = 10;
    this.tooltipHintText.y = 102;
    this.tooltipContainer.addChild(this.tooltipHintText);
  }

  // Khởi tạo HUD & Điều khiển (Font hiện đại, nút bấm chuẩn xác 100%)
  private initUI() {
    const textStyle = new TextStyle({
      fontFamily: this.FONT_FAMILY,
      fontSize: 12,
      fill: '#f8fafc',
      fontWeight: 'bold',
    });

    // 1. Top HUD
    const topBar = new Graphics();
    topBar.rect(0, 0, 360, 34);
    topBar.fill({ color: 0x090a0f, alpha: 0.95 });
    this.uiContainer.addChild(topBar);

    this.waveText = new Text({ text: 'WAVE 1/10 (CHUẨN BỊ)', style: { ...textStyle, fontSize: 11, fill: '#60a5fa' } });
    this.waveText.x = 10;
    this.waveText.y = 8;
    this.uiContainer.addChild(this.waveText);

    this.hpText = new Text({ text: 'HP: 100/100', style: { ...textStyle, fill: '#4ade80' } });
    this.hpText.x = 180;
    this.hpText.y = 8;
    this.uiContainer.addChild(this.hpText);

    this.goldText = new Text({ text: '$: 12', style: { ...textStyle, fill: '#facc15' } });
    this.goldText.x = 295;
    this.goldText.y = 8;
    this.uiContainer.addChild(this.goldText);

    // 2. Bottom Controls
    const botBar = new Graphics();
    botBar.rect(0, 515, 360, 125);
    botBar.fill({ color: 0x0d0e15 });
    this.uiContainer.addChild(botBar);

    // Nút ROLL
    this.rollBtnContainer = new Container();
    this.rollBtnContainer.x = 12;
    this.rollBtnContainer.y = 525;
    this.rollBtnContainer.eventMode = 'static';
    this.rollBtnContainer.cursor = 'pointer';
    this.rollBtnContainer.hitArea = new Rectangle(0, 0, 126, 50);

    this.rollBtnBg = new Graphics();
    this.rollBtnBg.roundRect(0, 0, 126, 50, 6);
    this.rollBtnBg.fill({ color: 0x1d4ed8 });
    this.rollBtnBg.stroke({ color: 0x60a5fa, width: 2 });
    this.rollBtnContainer.addChild(this.rollBtnBg);

    this.rollBtnText = new Text({
      text: '🎲 ROLL (2$)\n(Súng/Cò/Buff)',
      style: { ...textStyle, fontSize: 11, align: 'center' }
    });
    this.rollBtnText.anchor.set(0.5);
    this.rollBtnText.x = 63;
    this.rollBtnText.y = 25;
    this.rollBtnText.eventMode = 'none';
    this.rollBtnContainer.addChild(this.rollBtnText);

    this.rollBtnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hideTooltip();
      this.onRollClicked();
    });
    this.uiContainer.addChild(this.rollBtnContainer);

    // Nút BẮT ĐẦU VÁN (START WAVE)
    this.startWaveBtnContainer = new Container();
    this.startWaveBtnContainer.x = 146;
    this.startWaveBtnContainer.y = 525;
    this.startWaveBtnContainer.eventMode = 'static';
    this.startWaveBtnContainer.cursor = 'pointer';
    this.startWaveBtnContainer.hitArea = new Rectangle(0, 0, 202, 50);

    this.startWaveBtnBg = new Graphics();
    this.drawStartWaveBtn(true);
    this.startWaveBtnContainer.addChild(this.startWaveBtnBg);

    this.startWaveBtnText = new Text({
      text: '⚔ BẮT ĐẦU VÁN 1',
      style: { ...textStyle, fontSize: 13, fill: '#ffffff', align: 'center', fontWeight: 'bold' }
    });
    this.startWaveBtnText.anchor.set(0.5);
    this.startWaveBtnText.x = 101;
    this.startWaveBtnText.y = 25;
    this.startWaveBtnText.eventMode = 'none';
    this.startWaveBtnContainer.addChild(this.startWaveBtnText);

    this.startWaveBtnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hideTooltip();
      this.onStartWaveClicked();
    });
    this.uiContainer.addChild(this.startWaveBtnContainer);

    // Nút TUA NHANH x1 / x2
    const speedBtn = new Container();
    speedBtn.x = 12;
    speedBtn.y = 585;
    speedBtn.eventMode = 'static';
    speedBtn.cursor = 'pointer';
    speedBtn.hitArea = new Rectangle(0, 0, 85, 30);

    const speedBg = new Graphics();
    speedBg.roundRect(0, 0, 85, 30, 4);
    speedBg.fill({ color: 0x334155 });
    speedBg.stroke({ color: 0x64748b, width: 1 });
    speedBtn.addChild(speedBg);

    this.speedBtnText = new Text({ text: 'TỐC: x1', style: { ...textStyle, fontSize: 10 } });
    this.speedBtnText.anchor.set(0.5);
    this.speedBtnText.x = 42;
    this.speedBtnText.y = 15;
    this.speedBtnText.eventMode = 'none';
    speedBtn.addChild(this.speedBtnText);

    speedBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hideTooltip();
      this.gameSpeed = this.gameSpeed === 1.0 ? 2.0 : 1.0;
      this.speedBtnText.text = `TỐC: x${this.gameSpeed}`;
      sound.playClick();
    });
    this.uiContainer.addChild(speedBtn);

    // Tip hướng dẫn
    this.tipText = new Text({
      text: 'Ấn súng để xem thông số. Giữ để kéo merge.',
      style: { ...textStyle, fontSize: 9.5, fill: '#facc15' }
    });
    this.tipText.x = 108;
    this.tipText.y = 593;
    this.tipText.eventMode = 'none';
    this.uiContainer.addChild(this.tipText);
  }

  private drawStartWaveBtn(isActive: boolean) {
    this.startWaveBtnBg.clear();
    this.startWaveBtnBg.roundRect(0, 0, 202, 50, 6);
    if (isActive) {
      this.startWaveBtnBg.fill({ color: 0x16a34a });
      this.startWaveBtnBg.stroke({ color: 0x4ade80, width: 2 });
    } else {
      this.startWaveBtnBg.fill({ color: 0x3f3f46 });
      this.startWaveBtnBg.stroke({ color: 0x71717a, width: 1 });
    }
  }

  // ================= BẮT ĐẦU VÁN ================= //

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
    this.addFloatingText(180, 100, `WAVE ${this.wave} BẮT ĐẦU!`, '#4ade80');
  }

  // ================= ROLL ================= //

  public onRollClicked() {
    if (this.gold < this.rollPrice) {
      this.addFloatingText(75, 515, 'Không đủ vàng!', '#ef4444');
      return;
    }

    const emptyCell = this.getRandomEmptyUnlockedCell();
    if (!emptyCell) {
      this.addFloatingText(75, 515, 'Hết ô trống!', '#ef4444');
      return;
    }

    this.gold -= this.rollPrice;
    this.rollCount++;
    this.rollPrice = Math.min(2 + Math.floor(this.rollCount * 0.7), 12);
    this.rollBtnText.text = `🎲 ROLL (${this.rollPrice}$)\n(Súng/Cò/Buff)`;

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
      this.GRID_X + emptyCell.col * this.CELL_SIZE + 24,
      this.GRID_Y + emptyCell.row * this.CELL_SIZE + 24,
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
      view.itemSprite.texture = PixelAssetManager.getTriggerTexture(item.level);
      view.itemSprite.anchor.set(0.5);
      view.itemSprite.x = 20;
      view.itemSprite.y = 20;
      view.itemSprite.rotation = (item.angle * Math.PI) / 180;
      view.fillG.visible = false;
      view.lvlText.text = `x${item.level}`;
      view.lvlText.style.fill = '#fef08a';
    } else if (item.type === 'GUN') {
      view.itemSprite.texture = PixelAssetManager.getGunTexture(item.gunKind!, item.level);
      view.itemSprite.anchor.set(0);
      view.itemSprite.x = 0;
      view.itemSprite.y = 0;
      view.itemSprite.rotation = 0;
      view.fillG.visible = true;
      view.lvlText.text = `${item.level}`;
      view.lvlText.style.fill = '#ffffff';
    } else if (item.type === 'BUFF') {
      view.itemSprite.texture = PixelAssetManager.getBuffTexture(item.buffKind!, item.level);
      view.itemSprite.anchor.set(0);
      view.itemSprite.x = 0;
      view.itemSprite.y = 0;
      view.itemSprite.rotation = 0;
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

  // ================= KÉO THẢ & CLICK (PHÂN BIỆT RÕ RÀNG) ================= //

  private initGlobalDragListeners() {
    // Chạm ra ngoài sân -> Ẩn Tooltip
    this.stage.on('pointerdown', () => {
      this.hideTooltip();
    });

    this.stage.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.pointerDownItem) return;

      const dist = Math.hypot(e.global.x - this.pointerDownX, e.global.y - this.pointerDownY);

      if (dist > 6 && !this.isDragging) {
        this.isDragging = true;
        this.hideTooltip();

        // Ẩn mờ ô gốc
        this.slotViews[this.pointerDownRow][this.pointerDownCol].itemContainer.alpha = 0.35;

        // Tạo ghost sprite theo tay
        this.dragGhost = this.createItemDisplayGhost(this.pointerDownItem);
        this.dragContainer.addChild(this.dragGhost);
      }

      if (this.isDragging && this.dragGhost) {
        this.dragGhost.x = e.global.x - 20;
        this.dragGhost.y = e.global.y - 20;

        const col = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
        const row = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);

        // Cập nhật highlight hover
        for (let r = 0; r < this.ROWS; r++) {
          for (let c = 0; c < this.COLS; c++) {
            this.slotViews[r][c].highlightG.visible = (c === col && r === row);
          }
        }
      }
    });

    const finishDrag = (e: FederatedPointerEvent) => {
      if (!this.pointerDownItem) return;

      // Xóa toàn bộ highlight
      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          this.slotViews[r][c].highlightG.visible = false;
        }
      }

      if (!this.isDragging) {
        // HÀNH VI 1: CLICK / TAP -> HIỆN TOOLTIP CẠNH SÚNG!
        this.showTooltipAt(this.pointerDownItem, this.pointerDownCol, this.pointerDownRow);
      } else {
        // HÀNH VI 2: THẢ DRAG -> DI CHUYỂN, MERGE HOẶC SWAP
        const dropCol = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
        const dropRow = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);

        const origCol = this.pointerDownCol;
        const origRow = this.pointerDownRow;

        if (dropCol >= 0 && dropCol < this.COLS && dropRow >= 0 && dropRow < this.ROWS) {
          const targetCell = this.grid[dropRow][dropCol];
          const sourceCell = this.grid[origRow][origCol];

          if (dropCol === origCol && dropRow === origRow) {
            // Giữ nguyên
          } else if (targetCell.item === null) {
            // Di chuyển
            targetCell.item = this.pointerDownItem;
            sourceCell.item = null;
            this.syncSlotView(dropCol, dropRow);
            this.syncSlotView(origCol, origRow);
            sound.playClick();
          } else {
            // Merge hoặc Swap
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
                this.GRID_X + dropCol * this.CELL_SIZE + 24,
                this.GRID_Y + dropRow * this.CELL_SIZE + 24,
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

        // Khôi phục hiển thị ô gốc
        this.slotViews[origRow][origCol].itemContainer.alpha = 1.0;
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
      sp.x = 20;
      sp.y = 20;
      sp.rotation = (item.angle * Math.PI) / 180;
      cont.addChild(sp);
    } else if (item.type === 'GUN') {
      const sp = new Sprite(PixelAssetManager.getGunTexture(item.gunKind!, item.level));
      cont.addChild(sp);
    } else if (item.type === 'BUFF') {
      const sp = new Sprite(PixelAssetManager.getBuffTexture(item.buffKind!, item.level));
      cont.addChild(sp);
    }
    cont.alpha = 0.88;
    return cont;
  }

  // ================= TOOLTIP BÊN CẠNH SÚNG (KHÔNG OVERLAY, TỰ TRÁNH BỊ KHUẤT) ================= //

  public showTooltipAt(item: GridItem, col: number, row: number) {
    this.currentInspectedItem = item;

    const cellX = this.GRID_X + col * this.CELL_SIZE;
    const cellY = this.GRID_Y + row * this.CELL_SIZE;

    const tipW = 168;
    const tipH = 122;

    // Tính vị trí thông minh: Nếu ô ở nửa phải sân -> đặt sang trái; nếu ở nửa trái -> đặt sang phải
    let targetX: number;
    if (col >= 3) {
      targetX = cellX - tipW - 6;
    } else {
      targetX = cellX + this.CELL_SIZE + 6;
    }

    // Đảm bảo không tràn viền màn hình (x: 6..354, y: 38..510)
    targetX = Math.max(8, Math.min(targetX, 360 - tipW - 8));
    let targetY = Math.max(42, Math.min(cellY - 20, 510 - tipH));

    this.tooltipContainer.x = targetX;
    this.tooltipContainer.y = targetY;

    // Vẽ lại card tooltip
    this.tooltipCard.clear();
    this.tooltipCard.roundRect(0, 0, tipW, tipH, 6);
    this.tooltipCard.fill({ color: 0x13151f, alpha: 0.96 });
    this.tooltipCard.stroke({ color: 0x38bdf8, width: 1.5 });

    let name = '';
    let stats = '';
    let desc = '';

    if (item.type === 'TRIGGER') {
      name = `BÁNH RĂNG CÒ Lv${item.level}`;
      const hitsPerSec = (item.level * item.rotationSpeed).toFixed(1);
      stats = `• Số chấu: ${item.level} chấu\n• Tốc độ: ${hitsPerSec} hit/s (4 hướng)`;
      desc = `Động cơ xoay gõ vào súng lân cận để nạp thanh năng lượng.`;
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
      stats = `• Sát thương: ${item.damage} DMG\n• Cần nạp: ${hitsNeeded} lần gõ (1 viên)`;

      const effects: Record<GunKind, string> = {
        PISTOL: 'Bắn thẳng đều đặn theo làn.',
        CROSSBOW: 'Mũi tên xuyên qua 1 quái đầu tiên.',
        CRYO: 'Làm chậm quái 40% trong 2s.',
        FLAMER: 'Thiêu đốt quái liên tục 3s.',
        SHOTGUN: 'Bắn chùm 3 tia cực mạnh.',
        CANNON: 'Bắn đạn nổ AOE xung quanh.',
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
      if (item.buffKind === 'DMG') stats = `• Tăng +${item.level * 20}% Sát thương súng`;
      if (item.buffKind === 'SPEED') stats = `• Tăng +${item.level * 20}% Tốc độ xoay Cò`;
      if (item.buffKind === 'FILL') stats = `• Tăng +${item.level * 15}% Tốc độ nạp súng`;
      if (item.buffKind === 'CRIT') stats = `• Tăng +${item.level * 10}% Tỉ lệ chí mạng`;
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
    this.currentInspectedItem = null;
  }

  // ================= GAME ENGINE UPDATE LOOP (ZERO GC) ================= //

  public update(rawDt: number) {
    if (this.isGameOver || this.isVictory) return;

    const dt = Math.min(rawDt, 0.1) * this.gameSpeed;

    this.updateTriggers(dt);
    this.updateGuns(dt);

    if (this.isWaveActive) {
      this.updateWave(dt);
    }

    this.updateBullets(dt);
    this.updateFloatingTexts(dt);
    this.updateScreenShake(dt);

    this.goldText.text = `$: ${this.gold}`;
    this.hpText.text = `HP: ${this.castleHp}/${this.maxCastleHp}`;

    // Cập nhật Render nhanh in-place
    this.renderActiveEntities();
  }

  // Cập nhật Cò và gõ 4 hướng
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

        // Cập nhật góc quay của Sprite Cò trực tiếp (In-place)
        this.slotViews[r][c].itemSprite.rotation = (item.angle * Math.PI) / 180;

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
      item.recoilOffset = 4;
      sound.playClick();

      if (item.fill >= 1.0) {
        item.fill -= 1.0;
        if (this.isWaveActive || this.enemies.length > 0) {
          this.fireGun(targetCol, targetRow, item);
        }
      }
    }
  }

  private fireGun(col: number, row: number, gun: GridItem) {
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

    const spawnX = this.GRID_X + col * this.CELL_SIZE + this.CELL_SIZE / 2;
    const spawnY = this.GRID_Y + row * this.CELL_SIZE + 8;

    sound.playShoot(gun.tier);

    if (gun.rangeType === 'LANE' || gun.rangeType === 'SHORT') {
      this.spawnBullet(spawnX, spawnY, 0, -380, finalDmg, gun.gunKind === 'CROSSBOW' ? 2 : 1, this.getGunElement(gun.gunKind));
    } else if (gun.rangeType === 'SPREAD') {
      this.spawnBullet(spawnX, spawnY, 0, -360, finalDmg, 1, 'NORMAL');
      this.spawnBullet(spawnX, spawnY, -90, -340, Math.round(finalDmg * 0.7), 1, 'NORMAL');
      this.spawnBullet(spawnX, spawnY, 90, -340, Math.round(finalDmg * 0.7), 1, 'NORMAL');
    } else {
      this.spawnBullet(spawnX, spawnY, 0, -420, finalDmg, 3, 'ELECTRIC');
    }
  }

  private getGunElement(kind?: GunKind): 'NORMAL' | 'ICE' | 'FIRE' | 'ELECTRIC' | 'EXPLOSIVE' {
    if (kind === 'CRYO') return 'ICE';
    if (kind === 'FLAMER') return 'FIRE';
    if (kind === 'CANNON') return 'EXPLOSIVE';
    if (kind === 'TESLA') return 'ELECTRIC';
    return 'NORMAL';
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number, damage: number, pierce: number, element: any) {
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
      radius: 6,
    });
  }

  private updateGuns(dt: number) {
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const item = this.grid[r][c].item;
        const view = this.slotViews[r][c];
        if (item && item.type === 'GUN') {
          if (item.recoilOffset > 0) {
            item.recoilOffset = Math.max(0, item.recoilOffset - 24 * dt);
          }
          view.itemContainer.y = 4 - item.recoilOffset;

          // Cập nhật thanh Fill in-place
          const fillW = Math.min(30, Math.floor(item.fill * 30));
          view.fillG.clear();
          view.fillG.rect(4, 34, 32, 4);
          view.fillG.fill({ color: 0x0f172a });
          view.fillG.rect(5, 35, fillW, 2);
          view.fillG.fill({ color: item.fill >= 0.9 ? 0xfacc15 : 0x38bdf8 });
        }
      }
    }
  }

  // Quản lý Wave
  private updateWave(dt: number) {
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.6, 1.8 - this.wave * 0.1);

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
        e.hp -= 8 * dt;
        if (e.hp <= 0) {
          this.killEnemy(e);
          continue;
        }
      }
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
      }

      e.y += currentSpeed * dt;

      if (e.y >= this.WALL_Y - 10) {
        e.active = false;
        const dmg = e.isBoss ? 30 : (e.isElite ? 15 : 8);
        this.castleHp = Math.max(0, this.castleHp - dmg);
        this.trauma = Math.min(1.0, this.trauma + 0.4);
        sound.playExplode();
        this.addFloatingText(e.x, this.WALL_Y - 20, `-${dmg} HP`, '#ef4444');

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
    let lane = Math.floor(Math.random() * 5);

    // QUÁI ĐẦU TIÊN CỦA WAVE 1 LUÔN LUÔN ĐI Ở HÀNG GIỮA (LANE = 2)
    if (this.wave === 1 && this.isFirstEnemyOfWave1) {
      lane = 2;
      this.isFirstEnemyOfWave1 = false;
    }

    const x = this.GRID_X + lane * this.CELL_SIZE + this.CELL_SIZE / 2;
    const y = 35;

    const isBossWave = this.wave === this.maxWave && this.enemiesToSpawn === 0;
    const isElite = !isBossWave && Math.random() < 0.2;

    const baseHp = 28 * Math.pow(1.22, this.wave - 1);
    let hp = baseHp;
    let speed = 36 + Math.random() * 12;

    if (isBossWave) {
      hp = baseHp * 6;
      speed = 22;
    } else if (isElite) {
      hp = baseHp * 2.2;
      speed = 30;
    }

    this.enemies.push({
      id: this.nextId++,
      x,
      y,
      lane,
      hp: Math.round(hp),
      maxHp: Math.round(hp),
      speed,
      isBoss: isBossWave,
      isElite,
      active: true,
      width: isBossWave ? 48 : (isElite ? 32 : 24),
      height: isBossWave ? 48 : (isElite ? 32 : 24),
      slowTimer: 0,
      burnTimer: 0,
      hitFlashTimer: 0,
    });
  }

  private killEnemy(e: Enemy) {
    e.active = false;
    const reward = e.isBoss ? 20 : (e.isElite ? 5 : 2);
    this.gold += reward;
    sound.playExplode();
    this.addFloatingText(e.x, e.y, `+${reward}$`, '#facc15');
  }

  private onWaveClear() {
    this.isWaveActive = false;
    this.prepPhase = true;

    const waveBonus = 8 + this.wave * 2;
    this.gold += waveBonus;
    sound.playMerge();
    this.addFloatingText(180, 160, `QUA WAVE ${this.wave}! +${waveBonus}$`, '#4ade80');

    if (this.wave >= this.maxWave) {
      this.isVictory = true;
      this.addFloatingText(180, 200, 'CHIẾN THẮNG!', '#facc15');
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
    this.addFloatingText(180, 200, 'THÀNH BỊ PHÁ HỦY!', '#ef4444');
    this.drawStartWaveBtn(false);
    this.startWaveBtnText.text = 'THUA RỒI!';
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!b.active) continue;

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.y < 30 || b.y > 640 || b.x < 20 || b.x > 340) {
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
          this.addFloatingText(e.x + (Math.random() * 16 - 8), e.y - 10, `${b.damage}`, '#ffffff');

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
      this.stage.x = (Math.random() * 2 - 1) * 8 * shake;
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

      ft.text.y -= 30 * dt;
      ft.lifetime -= dt;
      if (ft.lifetime <= 0) {
        ft.active = false;
        ft.text.visible = false;
      }
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string) {
    // Lấy 1 slot rảnh trong pool
    let slot = this.floatingTextPool.find(ft => !ft.active);
    if (!slot) {
      slot = this.floatingTextPool[0];
    }

    slot.active = true;
    slot.lifetime = 0.8;
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

  // ================= CẬP NHẬT RENDER ENTITY (DÙNG OBJECT POOL - ZERO ALLOCATION) ================= //

  private renderActiveEntities() {
    // 1. Render Quái vật qua Pool
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

        // Thanh HP in-place
        const barW = e.width;
        view.hpBg.clear();
        view.hpBg.rect(-barW / 2, -e.height / 2 - 6, barW, 3);
        view.hpBg.fill({ color: 0x000000 });

        const hpRatio = Math.max(0, e.hp / e.maxHp);
        view.hpFill.clear();
        view.hpFill.rect(-barW / 2, -e.height / 2 - 6, barW * hpRatio, 3);
        view.hpFill.fill({ color: e.isBoss ? 0xa855f7 : 0xef4444 });
      } else {
        view.container.visible = false;
      }
    }

    // 2. Render Đạn qua Pool
    const activeBulletsCount = this.bullets.length;
    for (let i = 0; i < this.bulletPool.length; i++) {
      const view = this.bulletPool[i];
      if (i < activeBulletsCount) {
        const b = this.bullets[i];
        view.sprite.visible = true;
        view.sprite.x = b.x;
        view.sprite.y = b.y;
        view.sprite.texture = PixelAssetManager.getBulletTexture(b.element);
      } else {
        view.sprite.visible = false;
      }
    }
  }

  public createGun(kind: GunKind, level: number): GridItem {
    const baseDamageMap: Record<GunKind, number> = {
      PISTOL: 14,
      CROSSBOW: 20,
      CRYO: 16,
      FLAMER: 15,
      SHOTGUN: 40,
      CANNON: 55,
      TESLA: 35,
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
      SHOTGUN: 'SHORT',
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
    };
  }
}
