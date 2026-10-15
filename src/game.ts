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
  public readonly GRID_X = 60; // (360 - 5 * 48) / 2 = 60
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

  // Kéo thả
  private draggedItem: GridItem | null = null;
  private dragOriginCol: number = -1;
  private dragOriginRow: number = -1;
  private dragGhost: Container | null = null;
  private hoverCol: number = -1;
  private hoverRow: number = -1;

  // Kinh tế & Tiến trình
  public gold: number = 12; // Khởi đầu 12$ thoải mái roll
  public castleHp: number = 100;
  public maxCastleHp: number = 100;
  public wave: number = 1;
  public maxWave: number = 10;
  public isWaveActive: boolean = false; // Bắt đầu ở Prep Phase!
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
  private rollBtnText!: Text;
  private gearBtnText!: Text;
  private startWaveBtn!: Graphics;
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

    this.stage.addChild(this.bgContainer);
    this.stage.addChild(this.enemyContainer);
    this.stage.addChild(this.wallContainer);
    this.stage.addChild(this.bulletContainer);
    this.stage.addChild(this.gridContainer);
    this.stage.addChild(this.dragContainer);
    this.stage.addChild(this.fxContainer);
    this.stage.addChild(this.uiContainer);

    this.initBackground();
    this.initGrid();
    this.initWall();
    this.initUI();
    this.initGlobalDragListeners();
  }

  // Khởi tạo nền
  private initBackground() {
    const bg = new Graphics();
    // Vùng quái phía trên
    bg.rect(0, 0, 360, this.WALL_Y);
    bg.fill({ color: 0x111318 });

    // Vẽ 5 làn quái dọc
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
          unlocked: true, // Không khóa ô nào hết!
          item: null,
        };
      }
    }

    // ĐẦU GAME CHỈ CÓ ĐÚNG 1 CÒ Ở CHÍNH GIỮA (2, 2) - KHÔNG CÓ SÚNG SẴN
    this.grid[2][2].item = this.createTrigger(1);
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

  // Khởi tạo HUD & Điều khiển
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

    // 2. Bottom Controls (y = 515 -> 640)
    const botBar = new Graphics();
    botBar.rect(0, 515, 360, 125);
    botBar.fill({ color: 0x0d0e15 });
    this.uiContainer.addChild(botBar);

    // Nút ROLL (x = 10, w = 96)
    const rollBtn = new Graphics();
    rollBtn.roundRect(10, 525, 96, 48, 6);
    rollBtn.fill({ color: 0x1d4ed8 });
    rollBtn.stroke({ color: 0x60a5fa, width: 2 });
    rollBtn.eventMode = 'static';
    rollBtn.cursor = 'pointer';
    rollBtn.on('pointerdown', () => this.onRollClicked());
    this.uiContainer.addChild(rollBtn);

    this.rollBtnText = new Text({ text: '🎲 ROLL\n  2$', style: { ...textStyle, fontSize: 11, align: 'center' } });
    this.rollBtnText.x = 30;
    this.rollBtnText.y = 533;
    this.uiContainer.addChild(this.rollBtnText);

    // Nút +CÒ (x = 114, w = 96)
    const gearBtn = new Graphics();
    gearBtn.roundRect(114, 525, 96, 48, 6);
    gearBtn.fill({ color: 0xb45309 });
    gearBtn.stroke({ color: 0xfbbf24, width: 2 });
    gearBtn.eventMode = 'static';
    gearBtn.cursor = 'pointer';
    gearBtn.on('pointerdown', () => this.onAddTriggerClicked());
    this.uiContainer.addChild(gearBtn);

    this.gearBtnText = new Text({ text: '⚙ +CÒ\n 15$', style: { ...textStyle, fontSize: 11, align: 'center' } });
    this.gearBtnText.x = 138;
    this.gearBtnText.y = 533;
    this.uiContainer.addChild(this.gearBtnText);

    // Nút BẮT ĐẦU VÁN (START WAVE) (x = 218, w = 132)
    this.startWaveBtn = new Graphics();
    this.drawStartWaveBtn(true);
    this.startWaveBtn.eventMode = 'static';
    this.startWaveBtn.cursor = 'pointer';
    this.startWaveBtn.on('pointerdown', () => this.onStartWaveClicked());
    this.uiContainer.addChild(this.startWaveBtn);

    this.startWaveBtnText = new Text({
      text: '⚔ BẮT ĐẦU\n  VÁN 1',
      style: { ...textStyle, fontSize: 12, fill: '#ffffff', align: 'center', fontWeight: 'bold' }
    });
    this.startWaveBtnText.x = 238;
    this.startWaveBtnText.y = 533;
    this.uiContainer.addChild(this.startWaveBtnText);

    // Nút TUA NHANH x1 / x2 (x = 10, y = 582)
    const speedBtn = new Graphics();
    speedBtn.roundRect(10, 582, 85, 30, 4);
    speedBtn.fill({ color: 0x334155 });
    speedBtn.stroke({ color: 0x64748b, width: 1 });
    speedBtn.eventMode = 'static';
    speedBtn.cursor = 'pointer';
    speedBtn.on('pointerdown', () => {
      this.gameSpeed = this.gameSpeed === 1.0 ? 2.0 : 1.0;
      this.speedBtnText.text = `TỐC: x${this.gameSpeed}`;
      sound.playClick();
    });
    this.uiContainer.addChild(speedBtn);

    this.speedBtnText = new Text({ text: 'TỐC: x1', style: { ...textStyle, fontSize: 10 } });
    this.speedBtnText.x = 20;
    this.speedBtnText.y = 589;
    this.uiContainer.addChild(this.speedBtnText);

    // Dòng thông báo hướng dẫn
    this.tipText = new Text({
      text: 'Set up súng quanh Cò rồi bấm BẮT ĐẦU',
      style: { ...textStyle, fontSize: 9.5, fill: '#facc15' }
    });
    this.tipText.x = 104;
    this.tipText.y = 590;
    this.uiContainer.addChild(this.tipText);
  }

  private drawStartWaveBtn(isActive: boolean) {
    this.startWaveBtn.clear();
    this.startWaveBtn.roundRect(218, 525, 132, 48, 6);
    if (isActive) {
      this.startWaveBtn.fill({ color: 0x16a34a });
      this.startWaveBtn.stroke({ color: 0x4ade80, width: 2 });
    } else {
      this.startWaveBtn.fill({ color: 0x3f3f46 });
      this.startWaveBtn.stroke({ color: 0x71717a, width: 1 });
    }
  }

  // ================= BẮT ĐẦU VÁN ================= //

  public onStartWaveClicked() {
    if (this.isWaveActive) return; // Đang đánh thì không ấn lại

    this.prepPhase = false;
    this.isWaveActive = true;
    this.enemiesToSpawn = 8 + this.wave * 4;
    this.spawnTimer = 0;

    this.drawStartWaveBtn(false);
    this.startWaveBtnText.text = `ĐANG CHIẾN\nWAVE ${this.wave}`;
    this.tipText.text = 'Kéo đè 2 món giống nhau = MERGE';
    this.tipText.style.fill = '#94a3b8';
    this.waveText.text = `WAVE ${this.wave}/${this.maxWave}`;
    this.waveText.style.fill = '#f8fafc';

    sound.playMerge();
    this.addFloatingText(180, 100, `WAVE ${this.wave} BẮT ĐẦU!`, '#4ade80');
  }

  // ================= ROLL & MUA CÒ ================= //

  public onRollClicked() {
    if (this.gold < this.rollPrice) {
      this.addFloatingText(58, 515, 'Không đủ vàng!', '#ef4444');
      return;
    }

    const emptyCell = this.getRandomEmptyUnlockedCell();
    if (!emptyCell) {
      this.addFloatingText(58, 515, 'Hết ô trống!', '#ef4444');
      return;
    }

    this.gold -= this.rollPrice;
    this.rollCount++;
    this.rollPrice = Math.min(2 + Math.floor(this.rollCount * 0.7), 12);
    this.rollBtnText.text = `🎲 ROLL\n  ${this.rollPrice}$`;

    // Roll ra ngẫu nhiên súng hoặc buff
    const rollType = Math.random();
    if (rollType < 0.75) {
      const guns: GunKind[] = ['PISTOL', 'CROSSBOW', 'CRYO', 'FLAMER', 'SHOTGUN'];
      const chosen = guns[Math.floor(Math.random() * guns.length)];
      emptyCell.item = this.createGun(chosen, 1);
    } else {
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

  public onAddTriggerClicked() {
    const price = 15;
    if (this.gold < price) {
      this.addFloatingText(160, 515, 'Cần 15$!', '#ef4444');
      return;
    }

    const emptyCell = this.getRandomEmptyUnlockedCell();
    if (!emptyCell) {
      this.addFloatingText(160, 515, 'Hết ô trống!', '#ef4444');
      return;
    }

    this.gold -= price;
    emptyCell.item = this.createTrigger(1);
    sound.playClick();
    this.addFloatingText(
      this.GRID_X + emptyCell.col * this.CELL_SIZE + 24,
      this.GRID_Y + emptyCell.row * this.CELL_SIZE + 24,
      '+CÒ MỚI',
      '#f59e0b'
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

  // ================= HỆ THỐNG KÉO THẢ PIXI NATIVE CHUẨN XÁC 100% ================= //

  private initGlobalDragListeners() {
    this.stage.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.draggedItem || !this.dragGhost) return;

      // Cập nhật vị trí ghost theo tọa độ Pixi Stage chuẩn (0..360, 0..640)
      this.dragGhost.x = e.global.x - 20;
      this.dragGhost.y = e.global.y - 20;

      // Tính ô đang hover
      const col = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
      const row = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);
      if (col >= 0 && col < this.COLS && row >= 0 && row < this.ROWS) {
        this.hoverCol = col;
        this.hoverRow = row;
      } else {
        this.hoverCol = -1;
        this.hoverRow = -1;
      }
    });

    const finishDrag = (e: FederatedPointerEvent) => {
      if (!this.draggedItem) return;

      const dropCol = Math.floor((e.global.x - this.GRID_X) / this.CELL_SIZE);
      const dropRow = Math.floor((e.global.y - this.GRID_Y) / this.CELL_SIZE);

      const origCol = this.dragOriginCol;
      const origRow = this.dragOriginRow;

      // Kiểm tra hợp lệ bên trong bàn cờ 5x5
      if (dropCol >= 0 && dropCol < this.COLS && dropRow >= 0 && dropRow < this.ROWS) {
        const targetCell = this.grid[dropRow][dropCol];
        const sourceCell = this.grid[origRow][origCol];

        if (dropCol === origCol && dropRow === origRow) {
          // Thả lại chỗ cũ -> giữ nguyên
        } else if (targetCell.item === null) {
          // 1. Ô đích trống -> Di chuyển
          targetCell.item = this.draggedItem;
          sourceCell.item = null;
          sound.playClick();
        } else {
          // 2. Ô đích đã có món
          const dest = targetCell.item;
          const drag = this.draggedItem;

          const canMerge =
            dest.type === drag.type &&
            dest.level === drag.level &&
            dest.level < 5 &&
            ((dest.type === 'GUN' && dest.gunKind === drag.gunKind) ||
             (dest.type === 'BUFF' && dest.buffKind === drag.buffKind) ||
             (dest.type === 'TRIGGER'));

          if (canMerge) {
            // MERGE LÊN LEVEL + 1
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
            // KHÁC LOẠI HOẶC KHÁC LEVEL -> ĐỔI CHỖ (SWAP)
            targetCell.item = drag;
            sourceCell.item = dest;
            sound.playClick();
          }
        }
      }

      // Dọn dẹp trạng thái drag
      this.draggedItem = null;
      this.dragOriginCol = -1;
      this.dragOriginRow = -1;
      this.hoverCol = -1;
      this.hoverRow = -1;

      if (this.dragGhost) {
        this.dragGhost.destroy({ children: true });
        this.dragGhost = null;
      }
    };

    this.stage.on('pointerup', finishDrag);
    this.stage.on('pointerupoutside', finishDrag);
  }

  // Khi click/chạm vào một món đồ
  private onItemPointerDown(e: FederatedPointerEvent, item: GridItem, col: number, row: number) {
    this.draggedItem = item;
    this.dragOriginCol = col;
    this.dragOriginRow = row;

    if (this.dragGhost) {
      this.dragGhost.destroy({ children: true });
      this.dragGhost = null;
    }

    // Tạo ghost bám theo tay
    this.dragGhost = this.createItemDisplay(item, e.global.x - 20, e.global.y - 20, false);
    this.dragGhost.alpha = 0.9;
    this.dragContainer.addChild(this.dragGhost);
  }

  // ================= GAME LOOP ================= //

  public update(rawDt: number) {
    if (this.isGameOver || this.isVictory) return;

    const dt = Math.min(rawDt, 0.1) * this.gameSpeed;

    // 1. Cập nhật xoay Bánh Răng Cò
    this.updateTriggers(dt);

    // 2. Cập nhật hồi giật súng
    this.updateGuns(dt);

    // 3. Cập nhật Wave (chỉ khi wave đang active)
    if (this.isWaveActive) {
      this.updateWave(dt);
    }

    // 4. Cập nhật Đạn
    this.updateBullets(dt);

    // 5. Cập nhật Floating Texts
    this.updateFloatingTexts(dt);

    // 6. Cập nhật Rung màn hình
    this.updateScreenShake(dt);

    // 7. Cập nhật HUD text
    this.goldText.text = `$: ${this.gold}`;
    this.hpText.text = `HP: ${this.castleHp}/${this.maxCastleHp}`;

    // Render Grid & Entities
    this.renderGrid();
    this.renderEnemies();
    this.renderBullets();
    this.renderFloatingTexts();
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
        // Chỉ bắn khi wave đang đánh hoặc có quái
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

  // Cập nhật Wave & Quái
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

    // Khi hết quái trong wave
    if (this.enemiesToSpawn === 0 && this.enemies.length === 0) {
      this.onWaveClear();
    }
  }

  private spawnRandomEnemy() {
    const lane = Math.floor(Math.random() * 5);
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

  // Kết thúc Wave -> Chuyển về Prep Phase để người chơi sắp xếp tiếp!
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

    // Tăng wave và cho người chơi bấm nút khi đã sẵn sàng
    this.wave++;
    this.drawStartWaveBtn(true);
    this.startWaveBtnText.text = `⚔ BẮT ĐẦU\n  VÁN ${this.wave}`;
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

        // Sprite ô bàn cờ
        const cellSprite = new Sprite(PixelAssetManager.getCellTexture(cell.unlocked));
        cellSprite.x = cellX;
        cellSprite.y = cellY;
        this.gridContainer.addChild(cellSprite);

        // Highlight ô đang hover khi kéo thả
        if (this.draggedItem && this.hoverCol === c && this.hoverRow === r) {
          const hl = new Graphics();
          hl.rect(cellX + 2, cellY + 2, 44, 44);
          hl.stroke({ color: 0xfacc15, width: 2 });
          this.gridContainer.addChild(hl);
        }

        // Nếu ô có item
        if (cell.item) {
          const isBeingDragged = this.draggedItem === cell.item;
          const itemDisplay = this.createItemDisplay(cell.item, cellX + 4, cellY + 4, true, c, r);
          if (isBeingDragged) {
            itemDisplay.alpha = 0.35; // Làm mờ ô gốc khi đang kéo đi
          }
          this.gridContainer.addChild(itemDisplay);
        }
      }
    }
  }

  // Tạo container hiển thị cho 1 món đồ
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
      container.cursor = 'grab';
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
      container.addChild(lvlText);
    } else if (item.type === 'GUN') {
      const sprite = new Sprite(PixelAssetManager.getGunTexture(item.gunKind!, item.level));
      container.addChild(sprite);

      // Thanh fill nạp đạn
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

      // Thanh HP
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
