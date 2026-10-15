import { Container, Graphics, Sprite, Text, TextStyle, Rectangle, FederatedPointerEvent } from 'pixi.js';
import { GridCell, GridItem, Bullet, Enemy, FloatingText, GunKind, BuffKind } from './types';
import { PixelAssetManager } from './pixelArt';
import { sound } from './audio';

export class GameEngine {
  public stage: Container;

  // Lưới lâu đài
  public readonly COLS = 5;
  public readonly ROWS = 5;
  public readonly CELL_SIZE = 48;
  public readonly GRID_X = 60; // (360 - 240) / 2 = 60
  public readonly GRID_Y = 264;
  public readonly WALL_Y = 258;

  public grid: GridCell[][] = [];

  // Hệ thống Entity
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  public floatingTexts: FloatingText[] = [];

  // Containers hiển thị
  private bgContainer: Container;
  private wallContainer: Container;
  private gridContainer: Container;
  private enemyContainer: Container;
  private bulletContainer: Container;
  private fxContainer: Container;
  private uiContainer: Container;
  private dragContainer: Container;
  private infoModalContainer: Container;

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

  // Pooling ID
  private nextId: number = 1;

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
    this.infoModalContainer = new Container();

    this.stage.addChild(this.bgContainer);
    this.stage.addChild(this.enemyContainer);
    this.stage.addChild(this.wallContainer);
    this.stage.addChild(this.bulletContainer);
    this.stage.addChild(this.gridContainer);
    this.stage.addChild(this.dragContainer);
    this.stage.addChild(this.fxContainer);
    this.stage.addChild(this.uiContainer);
    this.stage.addChild(this.infoModalContainer);

    this.initBackground();
    this.initGrid();
    this.initWall();
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

    // Vùng lâu đài phía dưới
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

  // Khởi tạo lưới 5x5: MỞ HẾT TẤT CẢ 25 Ô!
  private initGrid() {
    for (let r = 0; r < this.ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        this.grid[r][c] = {
          col: c,
          row: r,
          unlocked: true,
          item: null,
        };
      }
    }

    // 1. Cò Lv1 ở chính giữa (2, 2)
    this.grid[2][2].item = this.createTrigger(1);

    // 2. Cho 1 SÚNG NGẪU NHIÊN ngay đầu game ở ô phía trên Cò (2, 1)
    const starterGuns: GunKind[] = ['PISTOL', 'CROSSBOW', 'CRYO', 'FLAMER', 'SHOTGUN'];
    const randomGun = starterGuns[Math.floor(Math.random() * starterGuns.length)];
    this.grid[1][2].item = this.createGun(randomGun, 1);
  }

  // Tạo súng theo định nghĩa cân bằng
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

  // Khởi tạo HUD & Điều khiển (Fix triệt để lỗi hit area nửa trên/nửa dưới của nút)
  private initUI() {
    const textStyle = new TextStyle({
      fontFamily: 'monospace',
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
    this.waveText.x = 8;
    this.waveText.y = 10;
    this.uiContainer.addChild(this.waveText);

    this.hpText = new Text({ text: 'HP: 100/100', style: { ...textStyle, fill: '#4ade80' } });
    this.hpText.x = 180;
    this.hpText.y = 10;
    this.uiContainer.addChild(this.hpText);

    this.goldText = new Text({ text: '$: 12', style: { ...textStyle, fill: '#facc15' } });
    this.goldText.x = 295;
    this.goldText.y = 10;
    this.uiContainer.addChild(this.goldText);

    // 2. Bottom Controls Container
    const botBar = new Graphics();
    botBar.rect(0, 515, 360, 125);
    botBar.fill({ color: 0x0d0e15 });
    this.uiContainer.addChild(botBar);

    // ================= NÚT ROLL (Gom cả nền + chữ vào Container, text eventMode = 'none') ================= //
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
    this.rollBtnText.eventMode = 'none'; // ĐỂ EVENT XUYÊN QUA TEXT 100%
    this.rollBtnContainer.addChild(this.rollBtnText);

    this.rollBtnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this.onRollClicked();
    });
    this.uiContainer.addChild(this.rollBtnContainer);

    // ================= NÚT BẮT ĐẦU VÁN (START WAVE) ================= //
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
    this.startWaveBtnText.eventMode = 'none'; // ĐỂ EVENT XUYÊN QUA TEXT
    this.startWaveBtnContainer.addChild(this.startWaveBtnText);

    this.startWaveBtnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this.onStartWaveClicked();
    });
    this.uiContainer.addChild(this.startWaveBtnContainer);

    // Nút TUA NHANH x1 / x2 (x = 12, y = 585)
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
      this.gameSpeed = this.gameSpeed === 1.0 ? 2.0 : 1.0;
      this.speedBtnText.text = `TỐC: x${this.gameSpeed}`;
      sound.playClick();
    });
    this.uiContainer.addChild(speedBtn);

    // Tip hướng dẫn
    this.tipText = new Text({
      text: 'Ấn vào món để XEM CHỈ SỐ. Giữ để KÉO.',
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

  // ================= ROLL: CHO CÒ VÀO RANDOM CÙNG SÚNG & BUFF ================= //

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

    // Roll pool: 60% Súng, 25% Cò, 15% Buff
    const rollType = Math.random();
    if (rollType < 0.60) {
      const guns: GunKind[] = ['PISTOL', 'CROSSBOW', 'CRYO', 'FLAMER', 'SHOTGUN', 'CANNON', 'TESLA'];
      const chosen = guns[Math.floor(Math.random() * guns.length)];
      emptyCell.item = this.createGun(chosen, 1);
    } else if (rollType < 0.85) {
      // 25% ra Bánh Răng Cò!
      emptyCell.item = this.createTrigger(1);
    } else {
      // 15% ra Buff
      const buffs: BuffKind[] = ['DMG', 'SPEED', 'FILL', 'CRIT'];
      const chosen = buffs[Math.floor(Math.random() * buffs.length)];
      emptyCell.item = this.createBuff(chosen, 1);
    }

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

  // ================= TÁCH BẠCH 2 HÀNH VI: CLICK (XEM INFO) VS DRAG (KÉO MERGE) ================= //

  private initGlobalDragListeners() {
    this.stage.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.pointerDownItem) return;

      const dist = Math.hypot(e.global.x - this.pointerDownX, e.global.y - this.pointerDownY);

      // Nếu di chuyển quá 6px -> Kích hoạt chế độ KÉO (DRAG)
      if (dist > 6 && !this.isDragging) {
        this.isDragging = true;
        this.dragGhost = this.createItemDisplay(this.pointerDownItem, e.global.x - 20, e.global.y - 20, false);
        this.dragGhost.alpha = 0.9;
        this.dragContainer.addChild(this.dragGhost);
      }

      if (this.isDragging && this.dragGhost) {
        this.dragGhost.x = e.global.x - 20;
        this.dragGhost.y = e.global.y - 20;

        const col = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
        const row = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);
        if (col >= 0 && col < this.COLS && row >= 0 && row < this.ROWS) {
          this.hoverCol = col;
          this.hoverRow = row;
        } else {
          this.hoverCol = -1;
          this.hoverRow = -1;
        }
      }
    });

    const handlePointerUp = (e: FederatedPointerEvent) => {
      if (!this.pointerDownItem) return;

      if (!this.isDragging) {
        // HÀNH VI 1: CLICK / TAP -> HIỆN BẢNG THÔNG TIN CHI TIẾT
        this.showItemInfo(this.pointerDownItem);
      } else {
        // HÀNH VI 2: DRAG & DROP -> DI CHUYỂN, MERGE HOẶC SWAP
        const dropCol = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
        const dropRow = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);

        const origCol = this.pointerDownCol;
        const origRow = this.pointerDownRow;

        if (dropCol >= 0 && dropCol < this.COLS && dropRow >= 0 && dropRow < this.ROWS) {
          const targetCell = this.grid[dropRow][dropCol];
          const sourceCell = this.grid[origRow][origCol];

          if (dropCol === origCol && dropRow === origRow) {
            // Thả tại chỗ cũ
          } else if (targetCell.item === null) {
            // 1. Ô đích trống -> Di chuyển
            targetCell.item = this.pointerDownItem;
            sourceCell.item = null;
            sound.playClick();
          } else {
            // 2. Ô đích đã có món
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
              // MERGE!
              if (dest.type === 'GUN') {
                targetCell.item = this.createGun(dest.gunKind!, dest.level + 1);
              } else if (dest.type === 'TRIGGER') {
                targetCell.item = this.createTrigger(dest.level + 1);
              } else if (dest.type === 'BUFF') {
                targetCell.item = this.createBuff(dest.buffKind!, dest.level + 1);
              }

              sourceCell.item = null;
              sound.playMerge();
              this.addFloatingText(
                this.GRID_X + dropCol * this.CELL_SIZE + 24,
                this.GRID_Y + dropRow * this.CELL_SIZE + 24,
                `MERGE Lv${targetCell.item!.level}!`,
                '#facc15'
              );
            } else {
              // SWAP!
              targetCell.item = drag;
              sourceCell.item = dest;
              sound.playClick();
            }
          }
        }
      }

      // Dọn dẹp drag state
      this.pointerDownItem = null;
      this.pointerDownCol = -1;
      this.pointerDownRow = -1;
      this.isDragging = false;
      this.hoverCol = -1;
      this.hoverRow = -1;

      if (this.dragGhost) {
        this.dragGhost.destroy({ children: true });
        this.dragGhost = null;
      }
    };

    this.stage.on('pointerup', handlePointerUp);
    this.stage.on('pointerupoutside', handlePointerUp);
  }

  private onItemPointerDown(e: FederatedPointerEvent, item: GridItem, col: number, row: number) {
    this.pointerDownItem = item;
    this.pointerDownCol = col;
    this.pointerDownRow = row;
    this.pointerDownX = e.global.x;
    this.pointerDownY = e.global.y;
    this.isDragging = false;
  }

  // ================= BẢNG THÔNG TIN CHI TIẾT (INFO MODAL POPUP) ================= //

  public showItemInfo(item: GridItem) {
    this.infoModalContainer.removeChildren();

    // Backdrop làm mờ nhẹ
    const backdrop = new Graphics();
    backdrop.rect(0, 0, 360, 640);
    backdrop.fill({ color: 0x000000, alpha: 0.65 });
    backdrop.eventMode = 'static';
    backdrop.on('pointerdown', (e) => {
      e.stopPropagation();
      this.closeItemInfo();
    });
    this.infoModalContainer.addChild(backdrop);

    // Card popup (w: 320, h: 220)
    const card = new Graphics();
    const cx = 20, cy = 160;
    card.roundRect(cx, cy, 320, 220, 8);
    card.fill({ color: 0x181a24 });
    card.stroke({ color: 0x38bdf8, width: 2 });
    card.eventMode = 'static';
    card.on('pointerdown', (e) => e.stopPropagation());
    this.infoModalContainer.addChild(card);

    // Tiêu đề & Thông tin
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fill: '#facc15',
      fontWeight: 'bold',
    });

    const bodyStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: '#e2e8f0',
      lineHeight: 18,
    });

    let name = '';
    let stats = '';
    let desc = '';

    if (item.type === 'TRIGGER') {
      name = `BÁNH RĂNG CÒ - CẤP ${item.level}`;
      const hitsPerSec = (item.level * item.rotationSpeed).toFixed(1);
      stats = `• Tốc độ quay: ${item.rotationSpeed} vòng/giây\n• Số chấu cò: ${item.level} chấu\n• Tần suất gõ: ${hitsPerSec} hit/giây vào 4 ô kề`;
      desc = `Tác dụng: Động cơ quay liên tục, gõ vào súng lân cận (Trên, Dưới, Trái, Phải) để súng tích đạn và bắn.`;
    } else if (item.type === 'GUN') {
      const names: Record<GunKind, string> = {
        PISTOL: 'SÚNG LỤC (PISTOL)',
        CROSSBOW: 'NỎ THÉP (CROSSBOW)',
        CRYO: 'SÚNG BĂNG (CRYO)',
        FLAMER: 'SÚNG LỬA (FLAMER)',
        SHOTGUN: 'SHOTGUN TẦM GẦN',
        CANNON: 'ĐẠI BÁC BOM (CANNON)',
        TESLA: 'SÚNG SÉT (TESLA)',
      };
      name = `${names[item.gunKind!]} - CẤP ${item.level}`;
      const hitsNeeded = Math.ceil(1.0 / item.fillPerHit);
      stats = `• Sát thương: ${item.damage} DMG\n• Cần nạp: ${hitsNeeded} lần gõ (Fill +${Math.round(item.fillPerHit * 100)}%/hit)\n• Kiểu bắn: ${item.rangeType}`;

      const effects: Record<GunKind, string> = {
        PISTOL: 'Bắn đều đặn thẳng theo làn diệt quái phía trước.',
        CROSSBOW: 'Mũi tên thép sắc bén xuyên qua 1 kẻ địch đầu tiên.',
        CRYO: 'Bắn đạn băng làm chậm quái 40% trong 2 giây.',
        FLAMER: 'Đốt cháy kẻ địch, gây sát thương thiêu đốt liên tục.',
        SHOTGUN: 'Bắn chùm 3 tia uy lực cực lớn chặn quái sát chân tường.',
        CANNON: 'Bắn đạn pháo phát nổ lan AOE bán kính 1 ô xung quanh.',
        TESLA: 'Phóng tia sét giật chuyền qua 3 mục tiêu toàn chiến trường.',
      };
      desc = `Hiệu ứng: ${effects[item.gunKind!]}`;
    } else if (item.type === 'BUFF') {
      const buffNames: Record<BuffKind, string> = {
        DMG: 'BUFF SÁT THƯƠNG (ĐỎ)',
        SPEED: 'BUFF TỐC ĐỘ CÒ (LAM)',
        FILL: 'BUFF SIÊU NẠP (LỤC)',
        CRIT: 'BUFF CHÍ MẠNG (VÀNG)',
      };
      name = `${buffNames[item.buffKind!]} - CẤP ${item.level}`;
      if (item.buffKind === 'DMG') stats = `• Tăng +${item.level * 20}% Sát thương cho súng 4 ô kề`;
      if (item.buffKind === 'SPEED') stats = `• Tăng +${item.level * 20}% Tốc độ xoay cho Cò 4 ô kề`;
      if (item.buffKind === 'FILL') stats = `• Tăng +${item.level * 15}% Fill/hit cho súng 4 ô kề`;
      if (item.buffKind === 'CRIT') stats = `• Tăng +${item.level * 10}% Tỉ lệ bạo kích (x2 DMG)`;
      desc = `Tác dụng: Đặt cạnh súng hoặc cò để khuếch đại sức mạnh liên tục.`;
    }

    // Add Icon to
    const iconContainer = this.createItemDisplay(item, cx + 18, cy + 18, false);
    iconContainer.scale.set(1.2);
    this.infoModalContainer.addChild(iconContainer);

    const nameText = new Text({ text: name, style: titleStyle });
    nameText.x = cx + 76;
    nameText.y = cy + 18;
    this.infoModalContainer.addChild(nameText);

    const statsText = new Text({ text: stats, style: { ...bodyStyle, fill: '#38bdf8' } });
    statsText.x = cx + 76;
    statsText.y = cy + 40;
    this.infoModalContainer.addChild(statsText);

    const descText = new Text({
      text: desc,
      style: { ...bodyStyle, wordWrap: true, wordWrapWidth: 280, fill: '#cbd5e1' }
    });
    descText.x = cx + 20;
    descText.y = cy + 105;
    this.infoModalContainer.addChild(descText);

    // Nút [ĐÓNG]
    const closeBtn = new Container();
    closeBtn.x = cx + 95;
    closeBtn.y = cy + 168;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';

    const closeBg = new Graphics();
    closeBg.roundRect(0, 0, 130, 36, 4);
    closeBg.fill({ color: 0xef4444 });
    closeBg.stroke({ color: 0xf87171, width: 1.5 });
    closeBtn.addChild(closeBg);

    const closeText = new Text({
      text: '✕ ĐÓNG',
      style: { ...titleStyle, fontSize: 12, fill: '#ffffff' }
    });
    closeText.anchor.set(0.5);
    closeText.x = 65;
    closeText.y = 18;
    closeText.eventMode = 'none';
    closeBtn.addChild(closeText);

    closeBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.closeItemInfo();
    });
    this.infoModalContainer.addChild(closeBtn);

    sound.playClick();
  }

  public closeItemInfo() {
    this.infoModalContainer.removeChildren();
  }

  // ================= GAME LOOP ================= //

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

    this.renderGrid();
    this.renderEnemies();
    this.renderBullets();
    this.renderFloatingTexts();
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
        if (item && item.type === 'GUN' && item.recoilOffset > 0) {
          item.recoilOffset = Math.max(0, item.recoilOffset - 24 * dt);
        }
      }
    }
  }

  // Quản lý Wave & Quái (Đảm bảo quái đầu tiên của wave 1 luôn đi ở hàng giữa)
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
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 30 * dt;
      ft.lifetime -= dt;
      if (ft.lifetime <= 0) {
        ft.active = false;
      }
    }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.active);
  }

  public addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: this.nextId++,
      x,
      y,
      text,
      color,
      lifetime: 0.8,
      active: true,
    });
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

  // ================= RENDER GRID ================= //

  private renderGrid() {
    this.gridContainer.removeChildren();

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const cell = this.grid[r][c];
        const cellX = this.GRID_X + c * this.CELL_SIZE;
        const cellY = this.GRID_Y + r * this.CELL_SIZE;

        const cellSprite = new Sprite(PixelAssetManager.getCellTexture(cell.unlocked));
        cellSprite.x = cellX;
        cellSprite.y = cellY;
        this.gridContainer.addChild(cellSprite);

        if (this.isDragging && this.hoverCol === c && this.hoverRow === r) {
          const hl = new Graphics();
          hl.rect(cellX + 2, cellY + 2, 44, 44);
          hl.stroke({ color: 0xfacc15, width: 2 });
          this.gridContainer.addChild(hl);
        }

        if (cell.item) {
          const isBeingDragged = this.isDragging && this.pointerDownItem === cell.item;
          const itemDisplay = this.createItemDisplay(cell.item, cellX + 4, cellY + 4, true, c, r);
          if (isBeingDragged) {
            itemDisplay.alpha = 0.35;
          }
          this.gridContainer.addChild(itemDisplay);
        }
      }
    }
  }

  private createItemDisplay(
    item: GridItem,
    x: number,
    y: number,
    isInteractive: boolean = false,
    col: number = -1,
    row: number = -1
  ): Container {
    const container = new Container();
    container.x = x;
    container.y = y - (item.recoilOffset || 0);

    if (isInteractive) {
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.hitArea = new Rectangle(0, 0, 40, 40);
      container.on('pointerdown', (e: FederatedPointerEvent) => {
        e.stopPropagation();
        this.onItemPointerDown(e, item, col, row);
      });
    }

    if (item.type === 'TRIGGER') {
      const sprite = new Sprite(PixelAssetManager.getTriggerTexture(item.level));
      sprite.anchor.set(0.5);
      sprite.x = 20;
      sprite.y = 20;
      sprite.rotation = (item.angle * Math.PI) / 180;
      container.addChild(sprite);

      const lvlText = new Text({
        text: `x${item.level}`,
        style: { fontFamily: 'monospace', fontSize: 10, fill: '#fef08a', fontWeight: 'bold' }
      });
      lvlText.x = 24;
      lvlText.y = 26;
      lvlText.eventMode = 'none';
      container.addChild(lvlText);
    } else if (item.type === 'GUN') {
      const sprite = new Sprite(PixelAssetManager.getGunTexture(item.gunKind!, item.level));
      container.addChild(sprite);

      const fillG = new Graphics();
      fillG.rect(4, 34, 32, 4);
      fillG.fill({ color: 0x0f172a });

      const fillW = Math.min(30, Math.floor(item.fill * 30));
      fillG.rect(5, 35, fillW, 2);
      fillG.fill({ color: item.fill >= 0.9 ? 0xfacc15 : 0x38bdf8 });
      container.addChild(fillG);

      const lvlText = new Text({
        text: `${item.level}`,
        style: { fontFamily: 'monospace', fontSize: 9, fill: '#ffffff', fontWeight: 'bold' }
      });
      lvlText.x = 28;
      lvlText.y = 25;
      lvlText.eventMode = 'none';
      container.addChild(lvlText);
    } else if (item.type === 'BUFF') {
      const sprite = new Sprite(PixelAssetManager.getBuffTexture(item.buffKind!, item.level));
      container.addChild(sprite);

      const lvlText = new Text({
        text: `${item.level}`,
        style: { fontFamily: 'monospace', fontSize: 9, fill: '#ffffff', fontWeight: 'bold' }
      });
      lvlText.x = 28;
      lvlText.y = 25;
      lvlText.eventMode = 'none';
      container.addChild(lvlText);
    }

    return container;
  }

  // ================= RENDER QUÁI VẬT & ĐẠN ================= //

  private renderEnemies() {
    this.enemyContainer.removeChildren();

    for (const e of this.enemies) {
      const type = e.isBoss ? 'BOSS' : (e.isElite ? 'TANK' : 'NORMAL');
      const sprite = new Sprite(PixelAssetManager.getEnemyTexture(type));
      sprite.anchor.set(0.5);
      sprite.x = e.x;
      sprite.y = e.y;

      if (e.hitFlashTimer > 0) {
        sprite.tint = 0xffffff;
      } else if (e.slowTimer > 0) {
        sprite.tint = 0x38bdf8;
      } else if (e.burnTimer > 0) {
        sprite.tint = 0xf97316;
      }

      this.enemyContainer.addChild(sprite);

      const hpG = new Graphics();
      const barW = e.width;
      hpG.rect(e.x - barW / 2, e.y - e.height / 2 - 6, barW, 3);
      hpG.fill({ color: 0x000000 });

      const hpRatio = Math.max(0, e.hp / e.maxHp);
      hpG.rect(e.x - barW / 2, e.y - e.height / 2 - 6, barW * hpRatio, 3);
      hpG.fill({ color: e.isBoss ? 0xa855f7 : 0xef4444 });
      this.enemyContainer.addChild(hpG);
    }
  }

  private renderBullets() {
    this.bulletContainer.removeChildren();

    for (const b of this.bullets) {
      const sprite = new Sprite(PixelAssetManager.getBulletTexture(b.element));
      sprite.anchor.set(0.5);
      sprite.x = b.x;
      sprite.y = b.y;
      this.bulletContainer.addChild(sprite);
    }
  }

  private renderFloatingTexts() {
    this.fxContainer.removeChildren();

    for (const ft of this.floatingTexts) {
      const text = new Text({
        text: ft.text,
        style: {
          fontFamily: 'monospace',
          fontSize: 11,
          fill: ft.color,
          fontWeight: 'bold',
          stroke: { color: 0x000000, width: 2 },
        }
      });
      text.anchor.set(0.5);
      text.x = ft.x;
      text.y = ft.y;
      this.fxContainer.addChild(text);
    }
  }
}
