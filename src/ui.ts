import { GameEngine, GUN_NAMES, GUN_TIERS, RARITY_CONFIGS } from './game';
import { GunKind, BuffKind, GameMode } from './types';
import { sound } from './audio';

export class UIManager {
  private game: GameEngine;
  private container: HTMLElement;
  private rootEl!: HTMLElement;
  private currentTab: 'SHOP' | 'EQUIPMENT' | 'WORLD' | 'TALENT' | 'MODES' = 'WORLD';
  private scale: number = 1;

  // Cache for DOM elements to update frequently
  private battleHudEl: HTMLElement | null = null;
  private waveTextEl: HTMLElement | null = null;
  private hpTextEl: HTMLElement | null = null;
  private hpBarFillEl: HTMLElement | null = null;
  private goldTextEl: HTMLElement | null = null;
  private rollBtnEl: HTMLButtonElement | null = null;
  private rollPriceEl: HTMLElement | null = null;
  private startWaveBtnEl: HTMLButtonElement | null = null;
  private speedBtnEl: HTMLButtonElement | null = null;

  constructor(game: GameEngine, container: HTMLElement) {
    this.game = game;
    this.container = container;
    this.injectStyles();
    this.initRoot();
    this.render();
  }

  public setScale(scale: number) {
    this.scale = scale;
    if (this.rootEl) {
      this.rootEl.style.transform = `scale(${scale})`;
    }
  }

  private initRoot() {
    // Remove existing ui-root if any
    const existing = document.getElementById('ui-root');
    if (existing) existing.remove();

    this.rootEl = document.createElement('div');
    this.rootEl.id = 'ui-root';
    this.rootEl.style.width = '720px';
    this.rootEl.style.height = '1280px';
    this.rootEl.style.position = 'absolute';
    this.rootEl.style.top = '0';
    this.rootEl.style.left = '0';
    this.rootEl.style.transformOrigin = 'top left';
    this.rootEl.style.pointerEvents = 'none'; // Canvas receives events unless on UI
    this.container.appendChild(this.rootEl);
  }

  public render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = '';

    if (this.game.inMenu) {
      this.rootEl.style.pointerEvents = 'auto';
      this.renderMainMenu();
    } else {
      this.rootEl.style.pointerEvents = 'none';
      this.renderBattleHUD();
    }
  }

  // ================= MAIN MENU RENDERER ================= //
  private renderMainMenu() {
    const menuEl = document.createElement('div');
    menuEl.className = 'main-menu-screen';

    // 1. TOP HEADER BAR
    menuEl.appendChild(this.createHeaderBar());

    // 2. SEASON PASS 117 BANNER
    menuEl.appendChild(this.createSeasonPassBar());

    // 3. TAB CONTENT
    const contentArea = document.createElement('div');
    contentArea.className = 'tab-content-area';

    switch (this.currentTab) {
      case 'WORLD':
        contentArea.appendChild(this.createWorldTab());
        break;
      case 'SHOP':
        contentArea.appendChild(this.createShopTab());
        break;
      case 'EQUIPMENT':
        contentArea.appendChild(this.createEquipmentTab());
        break;
      case 'TALENT':
        contentArea.appendChild(this.createTalentTab());
        break;
      case 'MODES':
        contentArea.appendChild(this.createModesTab());
        break;
    }
    menuEl.appendChild(contentArea);

    // 4. BOTTOM 5-TAB NAVIGATION BAR
    menuEl.appendChild(this.createBottomNavigationBar());

    this.rootEl.appendChild(menuEl);
  }

  // --- 1. TOP HEADER BAR ---
  private createHeaderBar(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'top-header-bar';

    const save = this.game.saveData;

    header.innerHTML = `
      <div class="level-badge">
        <div class="shield-icon">
          <svg viewBox="0 0 40 46" width="34" height="38">
            <polygon points="20,0 40,8 35,34 20,46 5,34 0,8" fill="url(#blue-grad)" stroke="#67e8f9" stroke-width="2.5"/>
            <defs>
              <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0284c7"/>
                <stop offset="100%" stop-color="#0369a1"/>
              </linearGradient>
            </defs>
          </svg>
          <span class="level-num">${save.playerLevel || 115}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" style="width: ${save.playerExp || 75}%;"></div>
        </div>
      </div>

      <div class="currency-pill energy-pill">
        <span class="pill-icon">⚡</span>
        <div class="pill-texts">
          <span class="pill-val">${save.energy || 7}/${save.maxEnergy || 20}</span>
          <span class="pill-timer">07:54</span>
        </div>
        <button class="pill-plus-btn" title="Nạp năng lượng">
          <img src="/assets/btn_plus.png" class="plus-pixel-icon" alt="+" />
        </button>
      </div>

      <div class="currency-pill gold-pill">
        <span class="pill-icon">🏹</span>
        <span class="pill-val">${(save.permanentGold || 121181022).toLocaleString()}</span>
        <button class="pill-plus-btn" title="Mua vàng">
          <img src="/assets/btn_plus.png" class="plus-pixel-icon" alt="+" />
        </button>
      </div>

      <div class="currency-pill gem-pill">
        <span class="pill-icon">💎</span>
        <span class="pill-val">${(save.diamonds || 6472).toLocaleString()}</span>
        <button class="pill-plus-btn" title="Nạp kim cương">
          <img src="/assets/btn_plus.png" class="plus-pixel-icon" alt="+" />
        </button>
      </div>

      <button class="menu-settings-btn" id="btn-settings" title="Cài đặt">
        <img src="/assets/btn_settings.png" class="settings-gear-img" alt="Cài đặt" />
      </button>
    `;

    header.querySelector('#btn-settings')?.addEventListener('click', () => {
      sound.playClick();
      alert('⚙ CÀI ĐẶT GAME:\n• Phiên bản: Gear Gun Castle (Archero Style)\n• Âm thanh: ĐANG BẬT\n• Nhà phát triển: Antigravity Game Engine');
    });

    return header;
  }

  // --- 2. SEASON PASS 117 BANNER ---
  private createSeasonPassBar(): HTMLElement {
    const banner = document.createElement('div');
    banner.className = 'season-pass-bar';

    banner.innerHTML = `
      <div class="hero-pink-badge">
        <div class="pink-avatar-emoji">🧙‍♀️</div>
        <div class="hero-lvl-chip">9</div>
      </div>

      <div class="pass-center">
        <div class="pass-laurel">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <circle cx="16" cy="16" r="14" fill="#d97706" stroke="#fde047" stroke-width="2"/>
            <path d="M10,16 L16,8 L22,16 L16,14 Z" fill="#ffffff"/>
            <path d="M12,22 L16,14 L20,22 Z" fill="#fef08a"/>
          </svg>
        </div>
        <div class="pass-title-row">
          <span class="pass-title">Season 117</span>
        </div>
        <div class="pass-progress-track">
          <div class="pass-progress-fill" style="width: 72%;"></div>
          <div class="pass-lvl-badge">30</div>
        </div>
      </div>

      <div class="pass-hero-preview">
        <div class="green-hero-circle">
          <span class="archer-emoji">🧝</span>
        </div>
      </div>
    `;

    banner.addEventListener('click', () => {
      sound.playClick();
      alert('🏆 BATTLE PASS SEASON 117:\n• Cấp độ hiện tại: 30/50\n• Thưởng cấp tiếp theo: 200 💎 Kim Cương & Trang Bị Hiếm!');
    });

    return banner;
  }

  // --- 3. WORLD TAB (ARCHERO MAIN STAGE REPLICA) ---
  private createWorldTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'world-tab-screen';

    const save = this.game.saveData;

    tab.innerHTML = `
      <!-- TOP STAGE BANNER -->
      <div class="stage-banner-header">
        <div class="stage-gift-icon">🎁</div>
        <div class="stage-title-col">
          <div class="stage-name">Hero50.Radiant Temple</div>
          <div class="stage-progress">Top Stage : ${save.highestCampaignStage * 10}/50</div>
        </div>
        <button class="stage-info-icon-btn" id="hotspot-info" title="Thông tin ải">
          <img src="/assets/btn_info.png" class="info-badge-img" alt="Info" />
        </button>
      </div>

      <!-- LEFT FLOATING BADGES -->
      <div class="left-badges-col">
        <button class="badge-item-btn" id="badge-octopus" title="Sự kiện Bạch tuộc">
          <img src="/assets/badge_octopus.png" class="badge-pixel-img" alt="Octopus"/>
          <span class="badge-timer-tag">2h 22m</span>
        </button>
        <button class="badge-item-btn" id="badge-island" title="Đảo kho báu">
          <img src="/assets/badge_island.png" class="badge-pixel-img" alt="Island"/>
          <span class="badge-timer-tag">Event</span>
        </button>
      </div>

      <!-- RIGHT FLOATING BADGES -->
      <div class="right-badges-col">
        <button class="badge-item-btn" id="badge-arena" title="Đấu trường PvP">
          <img src="/assets/badge_arena.png" class="badge-pixel-img" alt="Arena"/>
          <span class="badge-timer-tag">PvP</span>
        </button>
        <button class="badge-item-btn" id="badge-quest" title="Nhiệm vụ hàng ngày">
          <img src="/assets/badge_quest.png" class="badge-pixel-img" alt="Quests"/>
          <span class="badge-timer-tag">Daily</span>
        </button>
        <button class="badge-item-btn" id="badge-demon" title="Sự kiện Ma Vương">
          <img src="/assets/badge_demon.png" class="badge-pixel-img" alt="Demon"/>
          <span class="badge-timer-tag">01:59</span>
        </button>
        <button class="badge-item-btn" id="badge-wizard" title="Mèo phù thủy">
          <img src="/assets/badge_wizard.png" class="badge-pixel-img" alt="Wizard"/>
          <span class="badge-timer-tag">00:32</span>
        </button>
      </div>

      <!-- CENTER DISPLAY: SHRINE TEMPLE & MILESTONE CHEST -->
      <div class="center-stage-container">
        <div class="temple-ambient-glow"></div>
        <img src="/assets/shrine_temple.png" class="shrine-artwork-img" alt="Radiant Temple Shrine"/>

        <!-- WATER PLATFORM & MILESTONE CHEST -->
        <button class="milestone-chest-wrapper" id="milestone-chest" title="Rương cột mốc 50-40">
          <img src="/assets/chest_milestone.png" class="chest-artwork-img" alt="Milestone Chest"/>
          <div class="chest-target-chip">Reach 50-40</div>
        </button>
      </div>

      <!-- BOTTOM WORLD ACTION BAR -->
      <div class="world-action-bar">
        <button class="world-action-btn patrol-btn" id="btn-patrol" title="Hero Patrol">
          <img src="/assets/btn_patrol.png" class="action-btn-img" alt="Patrol"/>
        </button>

        <button class="world-action-btn play-btn" id="btn-play" title="Bắt đầu chiến đấu (⚡ x5)">
          <img src="/assets/btn_play.png" class="action-btn-img" alt="Play"/>
        </button>

        <button class="world-action-btn demon-btn" id="btn-demon-act" title="Nâng cấp Ma Thần">
          <img src="/assets/btn_demon.png" class="action-btn-img" alt="Demon"/>
        </button>

        <button class="world-action-btn expedition-btn" id="btn-expedition" title="Viễn chinh">
          <img src="/assets/btn_expedition.png" class="action-btn-img" alt="Expedition"/>
        </button>
      </div>
    `;

    // Click events
    tab.querySelector('#hotspot-info')?.addEventListener('click', () => {
      sound.playClick();
      alert(`📖 THÔNG TIN ẢI [Hero50.Radiant Temple]:\n• Cấp độ thử thách: 50 Wave\n• Kỷ lục hiện tại: ${save.highestCampaignStage * 10}/50\n• Thưởng qua ải: 1000 💎 + Rương Thần Thoại!`);
    });

    tab.querySelector('#badge-octopus')?.addEventListener('click', () => {
      sound.playClick();
      alert('🐙 SỰ KIỆN ĐẠI DƯƠNG: Săn quái nhận x2 Kim Cương trong 2H 22M nữa!');
    });

    tab.querySelector('#badge-island')?.addEventListener('click', () => {
      sound.playClick();
      alert('🏝 ĐẢO KHO BÁU BAY: Khám phá bí mật đảo trên không!');
    });

    tab.querySelector('#badge-arena')?.addEventListener('click', () => {
      sound.playClick();
      alert('🛡 ĐẤU TRƯỜNG ĐỈNH CAO PvP: Thách đấu người chơi khác!');
    });

    tab.querySelector('#badge-quest')?.addEventListener('click', () => {
      sound.playClick();
      alert('📋 NHIỆM VỤ HÀNG NGÀY:\n1. Bắn hạ 50 quái (42/50) -> Nhận 50 💎\n2. Roll súng 10 lần (10/10) -> ĐÃ HOÀN THÀNH (+200 💰)');
    });

    tab.querySelector('#badge-demon')?.addEventListener('click', () => {
      sound.playClick();
      alert('😈 SỰ KIỆN CHÚA QUỶ: Đánh bại Ma Vương nhận vũ khí Thiên Thạch!');
    });

    tab.querySelector('#badge-wizard')?.addEventListener('click', () => {
      sound.playClick();
      alert('🧙 MÈO PHÙ THỦY MAY MẮN: Tặng bùa may mắn khi vào trận!');
    });

    tab.querySelector('#milestone-chest')?.addEventListener('click', () => {
      sound.playMerge();
      alert('🎁 RƯƠNG CỘT MỐC 50-40:\nVượt ải 50-40 để mở khóa:\n+1000 💎 Kim Cương\n+10,000 💰 Vàng\n+1 Súng Thiên Thạch (Tier 5 Mythic)!');
    });

    tab.querySelector('#btn-patrol')?.addEventListener('click', () => {
      sound.playMerge();
      save.permanentGold += 250;
      this.game['saveGame']();
      alert('🏕 BẠN ĐÃ THU HOẠCH PHẦN THƯỞNG TUẦN TRA (HERO PATROL):\n+250 💰 Vàng vĩnh viễn!');
      this.render();
    });

    tab.querySelector('#btn-demon-act')?.addEventListener('click', () => {
      sound.playClick();
      alert('⚡ TÍNH NĂNG TĂNG TỐC MA THẦN: Tự động ghép súng thần tốc!');
    });

    tab.querySelector('#btn-expedition')?.addEventListener('click', () => {
      sound.playClick();
      alert('🧭 VIỄN CHINH (EXPEDITION): Chế độ thám hiểm vô tận 500 tầng đang mở!');
    });

    // PLAY BUTTON CLICK -> START BATTLE
    tab.querySelector('#btn-play')?.addEventListener('click', () => {
      if (save.energy < 5) {
        sound.playHit();
        alert('⚡ Không đủ Năng lượng! Cần ít nhất 5 ⚡ để xuất trận.');
        return;
      }
      save.energy -= 5;
      this.game['saveGame']();
      sound.playMerge();
      this.game.startBattle();
      this.render();
    });

    return tab;
  }

  // --- 4. SHOP TAB (GACHA & REWARDS) ---
  private createShopTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'shop-tab-screen scrollable-tab';

    const save = this.game.saveData;

    tab.innerHTML = `
      <div class="tab-header-title">
        <h2>🎰 CỬA HÀNG GACHA THẦN THOẠI</h2>
        <p>Mở hòm để MỞ KHÓA các loại súng Tier 2 - 5 và nhận thưởng vĩnh viễn!</p>
      </div>

      <!-- COMMON CHEST -->
      <div class="shop-card common-chest-card">
        <div class="card-glow"></div>
        <div class="card-icon">📦</div>
        <div class="card-body">
          <div class="card-title">HÒM BÁNH RĂNG CHIẾN BINH</div>
          <div class="card-desc">
            • Cơ hội mở khóa súng Tier 2 (Súng Băng CRYO, Đại Bác CANNON)<br/>
            • Nâng cấp súng hiện có + 100 - 300 Vàng
          </div>
          <button class="shop-buy-btn ${save.permanentGold >= 200 ? 'can-buy' : 'disabled'}" id="btn-buy-common">
            MỞ (200 💰)
          </button>
        </div>
      </div>

      <!-- ROYAL CHEST -->
      <div class="shop-card royal-chest-card">
        <div class="card-glow"></div>
        <div class="card-icon">👑</div>
        <div class="card-body">
          <div class="card-title">HÒM HOÀNG GIA THẦN THOẠI</div>
          <div class="card-desc">
            • <b>CHẮC CHẮN MỞ KHÓA SÚNG CAO CẤP TIER 2 - 5!</b><br/>
            (Súng Sét TESLA, Bắn Tỉa SNIPER, Minigun, Thiên Thạch METEOR)<br/>
            • Nâng cấp súng +2 Cấp & tặng 1000 💰 Vàng
          </div>
          <button class="shop-buy-btn royal-btn ${save.diamonds >= 60 ? 'can-buy' : 'disabled'}" id="btn-buy-royal">
            MỞ (60 💎)
          </button>
        </div>
      </div>

      <!-- DAILY FREE SUPPLY -->
      <div class="shop-card daily-card">
        <div class="card-icon">🎁</div>
        <div class="card-body">
          <div class="card-title">TIẾP TẾ CHIẾN ĐẤU MỖI NGÀY</div>
          <div class="card-desc">Nhận ngay +50 💎 Kim Cương và +500 💰 Vàng miễn phí!</div>
          <button class="shop-buy-btn free-btn" id="btn-claim-daily">
            NHẬN MIỄN PHÍ
          </button>
        </div>
      </div>
    `;

    tab.querySelector('#btn-buy-common')?.addEventListener('click', () => {
      this.executeGacha('COMMON');
    });

    tab.querySelector('#btn-buy-royal')?.addEventListener('click', () => {
      this.executeGacha('ROYAL');
    });

    tab.querySelector('#btn-claim-daily')?.addEventListener('click', () => {
      sound.playMerge();
      save.diamonds += 50;
      save.permanentGold += 500;
      this.game['saveGame']();
      alert('🎉 BẠN ĐÃ NHẬN TIẾP TẾ HÀNG NGÀY THÀNH CÔNG:\n+50 💎 Kim Cương\n+500 💰 Vàng Vĩnh Viễn!');
      this.render();
    });

    return tab;
  }

  // --- 5. EQUIPMENT TAB (TRANG BỊ 5 SÚNG & KHO SÚNG) ---
  private createEquipmentTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'equip-tab-screen scrollable-tab';

    const save = this.game.saveData;

    let activeSlotsHtml = '';
    for (let i = 0; i < 5; i++) {
      const g = save.equippedGuns[i];
      if (g) {
        const tier = GUN_TIERS[g];
        const rar = RARITY_CONFIGS[tier];
        activeSlotsHtml += `
          <div class="slot-box tier-border-${tier}" data-unequip-idx="${i}">
            <div class="slot-tier-tag" style="background:${rar.hex}">${rar.name}</div>
            <div class="slot-gun-name">${GUN_NAMES[g]}</div>
            <div class="slot-gun-lvl">Lv.${save.gunLevels[g] || 1}</div>
            <div class="slot-action-hint">Chạm để gỡ</div>
          </div>
        `;
      } else {
        activeSlotsHtml += `
          <div class="slot-box empty-slot">
            <span class="plus-icon">+</span>
            <span>Trống</span>
          </div>
        `;
      }
    }

    let buffSlotsHtml = '';
    for (let b = 0; b < 2; b++) {
      const buff = save.equippedBuffs[b];
      buffSlotsHtml += `
        <div class="slot-box buff-box">
          <div class="buff-badge">BUFF</div>
          <div class="buff-name">${buff || 'Trống'}</div>
        </div>
      `;
    }

    const allGuns: GunKind[] = [
      'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER',
      'CRYO', 'CANNON', 'TESLA', 'SNIPER', 'MINIGUN', 'METEOR'
    ];

    let inventoryHtml = '';
    allGuns.forEach(g => {
      const isUnlocked = save.unlockedGuns.includes(g);
      const isEquipped = save.equippedGuns.includes(g);
      const tier = GUN_TIERS[g];
      const rar = RARITY_CONFIGS[tier];
      const lvl = save.gunLevels[g] || 1;
      const upgradeCost = lvl * 40;
      const canUpgrade = save.permanentGold >= upgradeCost;

      inventoryHtml += `
        <div class="inv-card tier-border-${tier} ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="inv-card-header">
            <span class="inv-rarity-pill" style="background:${rar.hex}; color: #000">${rar.name} • TIER ${tier}</span>
            <span class="inv-lvl-text">${isUnlocked ? `Cấp ${lvl}` : '🔒'}</span>
          </div>
          <div class="inv-gun-title">${GUN_NAMES[g]}</div>
          <div class="inv-stats">${isUnlocked ? `+${(lvl - 1) * 15}% Sát Thương Súng` : 'Chưa sở hữu'}</div>
          
          <div class="inv-actions">
            ${isUnlocked ? `
              <button class="equip-toggle-btn ${isEquipped ? 'is-equipped' : 'can-equip'}" data-gun="${g}">
                ${isEquipped ? '✔ Đang Dùng' : '+ Trang Bị'}
              </button>
              <button class="upgrade-btn ${canUpgrade ? 'can-buy' : 'disabled'}" data-upgrade-gun="${g}">
                Nâng (${upgradeCost} 💰)
              </button>
            ` : `
              <div class="locked-hint">🔒 Mở qua Hòm Gacha trong Shop</div>
            `}
          </div>
        </div>
      `;
    });

    tab.innerHTML = `
      <div class="tab-header-title">
        <h2>🎒 ĐỘI HÌNH RA TRẬN (Tối đa 5 Súng & 2 Buff)</h2>
        <p>Trận đấu chỉ roll ra 5 súng & 2 buff này. Bấm vào súng trong kho để Trang bị/Tháo bỏ.</p>
      </div>

      <div class="loadout-container">
        <div class="equipped-guns-row">
          ${activeSlotsHtml}
        </div>
        <div class="equipped-buffs-row">
          ${buffSlotsHtml}
        </div>
      </div>

      <div class="tab-header-title" style="margin-top: 16px;">
        <h3>📦 KHO SÚNG BỘ SƯU TẬP (${save.unlockedGuns.length}/11 Đã Mở Khóa):</h3>
      </div>

      <div class="inventory-grid">
        ${inventoryHtml}
      </div>
    `;

    // Event handlers for equip/unequip/upgrade
    tab.querySelectorAll('[data-unequip-idx]').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).dataset.unequipIdx);
        if (save.equippedGuns.length > 1) {
          save.equippedGuns.splice(idx, 1);
          this.game['saveGame']();
          sound.playClick();
          this.render();
        } else {
          alert('Cần ít nhất 1 súng trong đội hình ra trận!');
        }
      });
    });

    tab.querySelectorAll('[data-gun]').forEach(el => {
      el.addEventListener('click', (e) => {
        const g = (e.currentTarget as HTMLElement).dataset.gun as GunKind;
        const isEquipped = save.equippedGuns.includes(g);
        if (isEquipped) {
          if (save.equippedGuns.length > 1) {
            save.equippedGuns = save.equippedGuns.filter(item => item !== g);
          } else {
            alert('Cần ít nhất 1 súng trong đội hình ra trận!');
            return;
          }
        } else {
          if (save.equippedGuns.length < 5) {
            save.equippedGuns.push(g);
          } else {
            save.equippedGuns.shift();
            save.equippedGuns.push(g);
          }
        }
        this.game['saveGame']();
        sound.playClick();
        this.render();
      });
    });

    tab.querySelectorAll('[data-upgrade-gun]').forEach(el => {
      el.addEventListener('click', (e) => {
        const g = (e.currentTarget as HTMLElement).dataset.upgradeGun as GunKind;
        const lvl = save.gunLevels[g] || 1;
        const cost = lvl * 40;
        if (save.permanentGold < cost) {
          sound.playHit();
          alert('Không đủ Vàng vĩnh viễn!');
          return;
        }
        save.permanentGold -= cost;
        save.gunLevels[g] = lvl + 1;
        this.game['saveGame']();
        sound.playMerge();
        this.render();
      });
    });

    return tab;
  }

  // --- 6. TALENT TAB ---
  private createTalentTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'talent-tab-screen scrollable-tab';

    const save = this.game.saveData;
    const talents = save.talents || { hpLevel: 0, armorLevel: 0, startGoldLevel: 0, bountyLevel: 0 };

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
        desc: (lvl) => `Giảm 5% sát thương nhận vào từ quái (Hiện tại: -${lvl * 5}%)`,
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
        desc: (lvl) => `Tăng +10% Vàng rơi ra khi diệt quái (Hiện tại: +${lvl * 10}%)`,
        cost: (lvl) => (lvl + 1) * 150,
        maxLvl: 10,
      },
    ];

    let cardsHtml = '';
    talentList.forEach(t => {
      const lvl = talents[t.key] || 0;
      const isMax = lvl >= t.maxLvl;
      const cost = t.cost(lvl);
      const canAfford = save.permanentGold >= cost && !isMax;

      cardsHtml += `
        <div class="talent-card">
          <div class="talent-info">
            <div class="talent-title">${t.title} [Cấp ${lvl}/${t.maxLvl}]</div>
            <div class="talent-desc">${t.desc(lvl)}</div>
            <div class="talent-progress">
              <div class="talent-fill" style="width: ${(lvl / t.maxLvl) * 100}%"></div>
            </div>
          </div>
          <button class="talent-btn ${isMax ? 'is-max' : (canAfford ? 'can-buy' : 'disabled')}" data-talent-key="${t.key}">
            ${isMax ? 'TỐI ĐA' : `NÂNG (${cost} 💰)`}
          </button>
        </div>
      `;
    });

    tab.innerHTML = `
      <div class="tab-header-title">
        <h2>🏛 THIÊN PHÚ THÀNH TRÌ (TALENT TREE)</h2>
        <p>Nâng cấp vĩnh viễn sức mạnh Thành Trì và Kinh tế bằng Vàng vĩnh viễn 💰</p>
      </div>

      <div class="talents-container">
        ${cardsHtml}
      </div>
    `;

    tab.querySelectorAll('[data-talent-key]').forEach(el => {
      el.addEventListener('click', (e) => {
        const key = (e.currentTarget as HTMLElement).dataset.talentKey as keyof typeof talents;
        const t = talentList.find(item => item.key === key)!;
        const lvl = talents[key] || 0;
        if (lvl >= t.maxLvl) return;
        const cost = t.cost(lvl);
        if (save.permanentGold < cost) {
          sound.playHit();
          alert('Không đủ Vàng vĩnh viễn!');
          return;
        }
        save.permanentGold -= cost;
        if (!save.talents) {
          save.talents = { hpLevel: 0, armorLevel: 0, startGoldLevel: 0, bountyLevel: 0 };
        }
        save.talents[key] = lvl + 1;
        this.game['saveGame']();
        sound.playMerge();
        this.render();
      });
    });

    return tab;
  }

  // --- 7. MODES TAB ---
  private createModesTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'modes-tab-screen scrollable-tab';

    const save = this.game.saveData;

    tab.innerHTML = `
      <div class="tab-header-title">
        <h2>⚔ CHỌN CHẾ ĐỘ CHIẾN ĐẤU & BẢN ĐỒ</h2>
        <p>Lựa chọn chế độ Campaign 10 Wave hoặc Sinh Tồn Vô Tận để săn quà khủng!</p>
      </div>

      <div class="mode-toggle-row">
        <button class="mode-toggle-btn ${this.game.gameMode === 'CAMPAIGN' ? 'active' : ''}" id="mode-camp">
          🛡 CHIẾN DỊCH (10 Wave)
        </button>
        <button class="mode-toggle-btn ${this.game.gameMode === 'SURVIVAL' ? 'active' : ''}" id="mode-surv">
          💀 SINH TỒN (Vô Tận)
        </button>
      </div>

      ${this.game.gameMode === 'CAMPAIGN' ? `
        <div class="map-cards-list">
          <div class="map-card ${save.selectedCampaignMap === 1 ? 'selected' : ''}" data-map-id="1">
            <div class="map-name">Map 1: Rừng Bánh Răng ${save.selectedCampaignMap === 1 ? '✔ (ĐANG CHỌN)' : ''}</div>
            <div class="map-desc">10 Wave • Độ khó tiêu chuẩn • Thích hợp tân binh</div>
          </div>

          <div class="map-card ${save.selectedCampaignMap === 2 ? 'selected' : ''} ${save.highestCampaignStage >= 2 ? '' : 'locked'}" data-map-id="2">
            <div class="map-name">Map 2: Thành Trì Thép ${save.highestCampaignStage >= 2 ? (save.selectedCampaignMap === 2 ? '✔ (ĐANG CHỌN)' : '') : '🔒 (Khóa)'}</div>
            <div class="map-desc">10 Wave • Quái Thiết Giáp +20% HP • Cần thắng Map 1</div>
          </div>

          <div class="map-card ${save.selectedCampaignMap === 3 ? 'selected' : ''} ${save.highestCampaignStage >= 3 ? '' : 'locked'}" data-map-id="3">
            <div class="map-name">Map 3: Núi Lửa Cơ Khí ${save.highestCampaignStage >= 3 ? (save.selectedCampaignMap === 3 ? '✔ (ĐANG CHỌN)' : '') : '🔒 (Khóa)'}</div>
            <div class="map-desc">10 Wave • Quái Nham Thạch +40% HP & Boss Lửa • Cần thắng Map 2</div>
          </div>
        </div>
      ` : `
        <div class="survival-banner-card">
          <div class="surv-title">💀 ĐẤU TRƯỜNG SINH TỒN VÔ TẬN</div>
          <div class="surv-desc">
            • Quái tràn ngập vô tận, cứ mỗi 10 Wave xuất hiện 1 Đại Trùm!<br/>
            • Càng sống lâu càng rơi nhiều Vàng 💰 và Kim Cương 💎!<br/>
            • Tinh hoa chiến thuật bánh răng thử thách giới hạn của bạn.
          </div>
          <div class="surv-record">🏆 KỶ LỤC CỦA BẠN: WAVE ${save.highestSurvivalWave}</div>
        </div>
      `}

      <button class="modes-launch-btn" id="btn-modes-launch">
        ⚔ XUẤT TRẬN NGAY (⚡ x5)
      </button>
    `;

    tab.querySelector('#mode-camp')?.addEventListener('click', () => {
      this.game.gameMode = 'CAMPAIGN';
      sound.playClick();
      this.render();
    });

    tab.querySelector('#mode-surv')?.addEventListener('click', () => {
      this.game.gameMode = 'SURVIVAL';
      sound.playClick();
      this.render();
    });

    tab.querySelectorAll('[data-map-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = Number((e.currentTarget as HTMLElement).dataset.mapId);
        if (id === 1 || save.highestCampaignStage >= id) {
          save.selectedCampaignMap = id;
          this.game['saveGame']();
          sound.playClick();
          this.render();
        }
      });
    });

    tab.querySelector('#btn-modes-launch')?.addEventListener('click', () => {
      if (save.energy < 5) {
        sound.playHit();
        alert('⚡ Không đủ Năng lượng! Cần ít nhất 5 ⚡.');
        return;
      }
      save.energy -= 5;
      this.game['saveGame']();
      sound.playMerge();
      this.game.startBattle();
      this.render();
    });

    return tab;
  }

  // --- 8. BOTTOM 5-TAB NAVIGATION BAR ---
  private createBottomNavigationBar(): HTMLElement {
    const nav = document.createElement('div');
    nav.className = 'bottom-nav-bar';

    const tabs: { key: 'SHOP' | 'EQUIPMENT' | 'WORLD' | 'TALENT' | 'MODES'; label: string; iconSrc: string; badge?: string }[] = [
      { key: 'SHOP', label: 'Shop', iconSrc: '/assets/tab_shop.png', badge: '67' },
      { key: 'EQUIPMENT', label: 'Trang Bị', iconSrc: '/assets/tab_equip.png', badge: 'New' },
      { key: 'WORLD', label: 'World', iconSrc: '/assets/tab_world.png' },
      { key: 'TALENT', label: 'Thiên Phú', iconSrc: '/assets/tab_talent.png' },
      { key: 'MODES', label: 'Chế Độ', iconSrc: '/assets/tab_modes.png' },
    ];

    tabs.forEach(t => {
      const isElevated = t.key === 'WORLD';
      const isActive = this.currentTab === t.key;

      const tabBtn = document.createElement('div');
      tabBtn.className = `nav-tab-item ${isElevated ? 'elevated-tab' : ''} ${isActive ? 'active-tab' : ''}`;

      tabBtn.innerHTML = `
        <div class="nav-tab-box">
          <img src="${t.iconSrc}" class="nav-tab-pixel-icon" alt="${t.label}"/>
          <div class="nav-tab-label">${t.label}</div>
          ${t.badge ? `<div class="nav-tab-badge">${t.badge}</div>` : ''}
        </div>
      `;

      tabBtn.addEventListener('click', () => {
        this.currentTab = t.key;
        sound.playClick();
        this.render();
      });

      nav.appendChild(tabBtn);
    });

    return nav;
  }

  // ================= IN-GAME BATTLE HUD ================= //
  private renderBattleHUD() {
    this.battleHudEl = document.createElement('div');
    this.battleHudEl.className = 'battle-hud-screen';

    const save = this.game.saveData;

    this.battleHudEl.innerHTML = `
      <!-- TOP HUD -->
      <div class="battle-top-bar">
        <button class="battle-menu-btn" id="btn-battle-back">🏰 Menu</button>
        
        <div class="battle-wave-badge" id="hud-wave-text">
          MAP ${save.selectedCampaignMap} - WAVE 1/10 (CHUẨN BỊ)
        </div>

        <button class="battle-speed-btn" id="btn-battle-speed">⏩ 1x</button>
      </div>

      <div class="battle-stats-bar">
        <div class="battle-hp-pill">
          <span class="hp-icon">❤️</span>
          <div class="hp-bar-track">
            <div class="hp-bar-fill" id="hud-hp-fill" style="width: 100%;"></div>
          </div>
          <span class="hp-text" id="hud-hp-text">HP: 100/100</span>
        </div>

        <div class="battle-gold-pill">
          <span class="gold-icon">💰</span>
          <span class="gold-text" id="hud-gold-text">$: 15</span>
        </div>
      </div>

      <!-- BOTTOM HUD -->
      <div class="battle-bottom-bar">
        <button class="chunky-roll-btn" id="btn-battle-roll">
          <div class="roll-btn-content">
            <span class="roll-icon">🎲</span>
            <span class="roll-label">ROLL SÚNG</span>
            <span class="roll-price" id="hud-roll-price">(2$)</span>
          </div>
        </button>

        <button class="chunky-wave-btn" id="btn-battle-start-wave">
          ⚔ BẮT ĐẦU VÁN 1
        </button>
      </div>
    `;

    // Cache elements
    this.waveTextEl = this.battleHudEl.querySelector('#hud-wave-text');
    this.hpTextEl = this.battleHudEl.querySelector('#hud-hp-text');
    this.hpBarFillEl = this.battleHudEl.querySelector('#hud-hp-fill');
    this.goldTextEl = this.battleHudEl.querySelector('#hud-gold-text');
    this.rollPriceEl = this.battleHudEl.querySelector('#hud-roll-price');
    this.rollBtnEl = this.battleHudEl.querySelector('#btn-battle-roll');
    this.startWaveBtnEl = this.battleHudEl.querySelector('#btn-battle-start-wave');
    this.speedBtnEl = this.battleHudEl.querySelector('#btn-battle-speed');

    // Button event listeners
    this.battleHudEl.querySelector('#btn-battle-back')?.addEventListener('click', () => {
      sound.playClick();
      this.game.returnToMainMenu();
      this.render();
    });

    this.rollBtnEl?.addEventListener('click', () => {
      this.game.rollItem();
      this.updateHudValues();
    });

    this.startWaveBtnEl?.addEventListener('click', () => {
      this.game.startWave();
      this.updateHudValues();
    });

    this.speedBtnEl?.addEventListener('click', () => {
      sound.playClick();
      this.game.gameSpeed = this.game.gameSpeed === 1 ? 2 : 1;
      if (this.speedBtnEl) {
        this.speedBtnEl.innerText = `⏩ ${this.game.gameSpeed}x`;
      }
    });

    this.rootEl.appendChild(this.battleHudEl);
    this.updateHudValues();
  }

  // Cập nhật giá trị HUD trong Game Loop (Zero Allocation)
  public updateHudValues() {
    if (this.game.inMenu || !this.battleHudEl) return;

    if (this.goldTextEl) {
      this.goldTextEl.innerText = `$: ${this.game.gold}`;
    }

    if (this.hpTextEl && this.hpBarFillEl) {
      this.hpTextEl.innerText = `HP: ${this.game.castleHp}/${this.game.maxCastleHp}`;
      const pct = Math.max(0, Math.min(100, (this.game.castleHp / this.game.maxCastleHp) * 100));
      this.hpBarFillEl.style.width = `${pct}%`;
    }

    if (this.waveTextEl) {
      this.waveTextEl.innerText = this.game.gameMode === 'CAMPAIGN'
        ? `MAP ${this.game.saveData.selectedCampaignMap} - WAVE ${this.game.wave}/${this.game.maxWave} ${this.game.isWaveActive ? '(CHIẾN ĐẤU)' : '(CHUẨN BỊ)'}`
        : `SINH TỒN - WAVE ${this.game.wave} ${this.game.isWaveActive ? '(CHIẾN ĐẤU)' : '(CHUẨN BỊ)'}`;
    }

    if (this.rollPriceEl) {
      this.rollPriceEl.innerText = `(${this.game.rollPrice}$)`;
    }

    if (this.rollBtnEl) {
      const canAfford = this.game.gold >= this.game.rollPrice;
      if (canAfford) {
        this.rollBtnEl.classList.remove('disabled');
      } else {
        this.rollBtnEl.classList.add('disabled');
      }
    }

    if (this.startWaveBtnEl) {
      if (this.game.isWaveActive) {
        this.startWaveBtnEl.innerText = `🌊 ĐANG ĐÁNH WAVE ${this.game.wave}...`;
        this.startWaveBtnEl.classList.add('in-wave');
      } else {
        this.startWaveBtnEl.innerText = `⚔ BẮT ĐẦU WAVE ${this.game.wave}`;
        this.startWaveBtnEl.classList.remove('in-wave');
      }
    }
  }

  // --- GACHA REWARD LOGIC ---
  private executeGacha(type: 'COMMON' | 'ROYAL') {
    const save = this.game.saveData;

    if (type === 'COMMON') {
      if (save.permanentGold < 200) {
        sound.playHit();
        alert('Không đủ Vàng vĩnh viễn (Cần 200 💰)!');
        return;
      }
      save.permanentGold -= 200;
    } else {
      if (save.diamonds < 60) {
        sound.playHit();
        alert('Không đủ Kim Cương (Cần 60 💎)!');
        return;
      }
      save.diamonds -= 60;
    }

    const allGuns: GunKind[] = [
      'PISTOL', 'CROSSBOW', 'SLINGSHOT', 'SHOTGUN', 'FLAMER',
      'CRYO', 'CANNON', 'TESLA', 'SNIPER', 'MINIGUN', 'METEOR'
    ];

    const lockedGuns = allGuns.filter(g => !save.unlockedGuns.includes(g));
    const unlockChance = type === 'ROYAL' ? 0.9 : 0.45;

    if (lockedGuns.length > 0 && Math.random() < unlockChance) {
      let pickedGun: GunKind;
      if (type === 'ROYAL') {
        const highTierLocked = lockedGuns.filter(g => GUN_TIERS[g] >= 3);
        pickedGun = highTierLocked.length > 0
          ? highTierLocked[Math.floor(Math.random() * highTierLocked.length)]
          : lockedGuns[Math.floor(Math.random() * lockedGuns.length)];
      } else {
        pickedGun = lockedGuns[Math.floor(Math.random() * lockedGuns.length)];
      }

      save.unlockedGuns.push(pickedGun);
      save.gunLevels[pickedGun] = 1;
      const tier = GUN_TIERS[pickedGun];
      const rarity = RARITY_CONFIGS[tier];

      sound.playMerge();
      alert(`🎉 CHÚC MỪNG BẠN ĐÃ MỞ KHÓA SÚNG MỚI!\n\n[${GUN_NAMES[pickedGun]}]\n• Phẩm chất: Tier ${tier} (${rarity.name})\n• Đã thêm vào Kho Súng Trang Bị!`);
    } else {
      const myGuns = save.unlockedGuns;
      const g = myGuns[Math.floor(Math.random() * myGuns.length)];
      const bonusLvl = type === 'ROYAL' ? 2 : 1;
      save.gunLevels[g] = (save.gunLevels[g] || 1) + bonusLvl;
      const bonusGold = type === 'ROYAL' ? 1000 : 200;
      save.permanentGold += bonusGold;

      sound.playMerge();
      alert(`🎉 PHẦN THƯỞNG HÒM GACHA:\n• Nâng cấp [${GUN_NAMES[g]}] +${bonusLvl} Cấp (Hiện Lv.${save.gunLevels[g]})!\n• Tặng kèm +${bonusGold} 💰 Vàng vĩnh viễn!`);
    }

    this.game['saveGame']();
    this.render();
  }

  // ================= CSS STYLES INJECTION ================= //
  private injectStyles() {
    if (document.getElementById('ui-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'ui-styles';
    styleEl.textContent = `
      * {
        box-sizing: border-box;
        user-select: none;
        -webkit-user-select: none;
      }

      #ui-root {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        color: #ffffff;
        overflow: hidden;
      }

      /* MAIN MENU SCREEN */
      .main-menu-screen {
        width: 100%;
        height: 100%;
        position: relative;
        background: #060814;
        display: flex;
        flex-direction: column;
      }

      /* TOP HEADER BAR */
      .top-header-bar {
        position: absolute;
        top: 12px;
        left: 0;
        right: 0;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        z-index: 100;
      }

      .level-badge {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .shield-icon {
        position: relative;
        width: 36px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .level-num {
        position: absolute;
        font-size: 15px;
        font-weight: 900;
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      }

      .exp-bar {
        width: 60px;
        height: 18px;
        background: #0f172a;
        border: 2px solid #0284c7;
        border-radius: 6px;
        overflow: hidden;
        padding: 2px;
      }

      .exp-fill {
        height: 100%;
        background: linear-gradient(90deg, #0284c7, #38bdf8);
        border-radius: 3px;
      }

      .currency-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid #334155;
        border-radius: 12px;
        padding: 4px 10px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      }

      .energy-pill { border-color: #22c55e; }
      .energy-pill .pill-val { color: #86efac; font-weight: 800; font-size: 14px; }
      .energy-pill .pill-timer { font-size: 9px; color: #a7f3d0; font-weight: bold; }

      .gold-pill { border-color: #f59e0b; }
      .gold-pill .pill-val { color: #fde047; font-weight: 800; font-size: 14px; }

      .gem-pill { border-color: #10b981; }
      .gem-pill .pill-val { color: #6ee7b7; font-weight: 800; font-size: 14px; }

      .pill-plus-btn {
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.1s ease;
      }

      .pill-plus-btn:hover {
        transform: scale(1.15);
      }

      .pill-plus-btn:active {
        transform: scale(0.9);
      }

      .plus-pixel-icon {
        width: 20px;
        height: 20px;
        object-fit: contain;
        image-rendering: pixelated;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
      }

      .menu-settings-btn {
        width: 44px;
        height: 44px;
        background: transparent;
        border: none;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.15s ease;
      }

      .menu-settings-btn:hover {
        transform: rotate(45deg) scale(1.1);
        filter: brightness(1.2);
      }

      .menu-settings-btn:active {
        transform: rotate(90deg) scale(0.92);
      }

      .settings-gear-img {
        width: 40px;
        height: 40px;
        object-fit: contain;
        image-rendering: pixelated;
        filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));
      }

      /* SEASON PASS 117 BAR */
      .season-pass-bar {
        position: absolute;
        top: 76px;
        left: 20px;
        right: 20px;
        height: 52px;
        background: #1c1917;
        border: 2px solid #b45309;
        border-radius: 12px;
        display: flex;
        align-items: center;
        padding: 0 12px;
        cursor: pointer;
        z-index: 90;
        box-shadow: 0 6px 16px rgba(0,0,0,0.6);
      }

      .hero-pink-badge {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2.5px solid #f472b6;
        background: radial-gradient(circle, #f472b6 0%, #db2777 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
        margin-right: 8px;
        box-shadow: 0 0 10px rgba(244, 114, 182, 0.4);
      }

      .pink-avatar-emoji {
        font-size: 24px;
        line-height: 1;
        user-select: none;
      }

      .hero-lvl-chip {
        position: absolute;
        bottom: -4px;
        right: -4px;
        background: #7e22ce;
        border: 1.5px solid #f472b6;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 10px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pass-center {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }

      .pass-laurel {
        position: absolute;
        left: 4px;
        top: -6px;
      }

      .pass-title-row {
        margin-bottom: 2px;
      }

      .pass-title {
        font-size: 13px;
        font-weight: 900;
        color: #fde047;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      }

      .pass-progress-track {
        position: relative;
        width: 82%;
        height: 18px;
        background: #0f172a;
        border: 1.5px solid #0284c7;
        border-radius: 9px;
        overflow: visible;
      }

      .pass-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #0284c7, #38bdf8);
        border-radius: 8px;
        box-shadow: 0 0 10px #38bdf8;
      }

      .pass-lvl-badge {
        position: absolute;
        left: -8px;
        top: -4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #7c2d12;
        border: 2px solid #fde047;
        font-size: 12px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .green-hero-circle {
        width: 38px;
        height: 38px;
        background: #15803d;
        border: 2px solid #4ade80;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      /* TAB CONTENT AREA */
      .tab-content-area {
        position: absolute;
        top: 138px;
        bottom: 115px;
        left: 0;
        right: 0;
        overflow: hidden;
      }

      .scrollable-tab {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        padding: 16px 20px;
      }

      /* WORLD TAB STYLES */
      .world-tab-screen {
        width: 100%;
        height: 100%;
        position: relative;
        background: radial-gradient(circle at 50% 38%, #1e1b4b 0%, #0f172a 45%, #030712 100%);
        overflow: hidden;
      }

      /* TOP STAGE BANNER */
      .stage-banner-header {
        position: absolute;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        width: 520px;
        height: 56px;
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border: 2px solid #ca8a04;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.6), inset 0 1px 2px rgba(254, 240, 138, 0.3);
        z-index: 50;
      }

      .stage-gift-icon {
        font-size: 26px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
      }

      .stage-title-col {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .stage-name {
        font-size: 16px;
        font-weight: 900;
        color: #fde047;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        letter-spacing: 0.5px;
      }

      .stage-progress {
        font-size: 11px;
        font-weight: 800;
        color: #94a3b8;
      }

      .stage-info-icon-btn {
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease, filter 0.15s ease;
      }

      .stage-info-icon-btn:hover {
        transform: scale(1.18);
        filter: brightness(1.2);
      }

      .stage-info-icon-btn:active {
        transform: scale(0.9);
      }

      .info-badge-img {
        width: 34px;
        height: 34px;
        object-fit: contain;
        image-rendering: pixelated;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
      }

      /* SIDE FLOATING BADGES */
      .left-badges-col {
        position: absolute;
        left: 20px;
        top: 90px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        z-index: 40;
      }

      .right-badges-col {
        position: absolute;
        right: 20px;
        top: 80px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 40;
      }

      .badge-item-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0;
        position: relative;
        transition: transform 0.15s ease, filter 0.15s ease;
      }

      .badge-item-btn:hover {
        transform: scale(1.12);
        filter: brightness(1.15);
      }

      .badge-item-btn:active {
        transform: scale(0.92);
      }

      .badge-pixel-img {
        width: 64px;
        height: 64px;
        object-fit: contain;
        image-rendering: pixelated;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.7));
      }

      .badge-timer-tag {
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid #eab308;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 900;
        color: #fde047;
        padding: 1px 6px;
        margin-top: -6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      }

      /* CENTER STAGE CONTAINER */
      .center-stage-container {
        position: absolute;
        top: 75px;
        left: 0;
        right: 0;
        bottom: 125px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

      .temple-ambient-glow {
        position: absolute;
        width: 440px;
        height: 440px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(254, 240, 138, 0.22) 0%, rgba(56, 189, 248, 0.15) 45%, transparent 70%);
        filter: blur(28px);
        animation: templePulse 4s ease-in-out infinite alternate;
        pointer-events: none;
      }

      @keyframes templePulse {
        0% { transform: scale(0.95); opacity: 0.8; }
        100% { transform: scale(1.1); opacity: 1; }
      }

      .shrine-artwork-img {
        width: 320px;
        height: 320px;
        object-fit: contain;
        image-rendering: pixelated;
        filter: drop-shadow(0 16px 32px rgba(0,0,0,0.9));
        animation: shrineHover 3.5s ease-in-out infinite alternate;
        pointer-events: auto;
      }

      @keyframes shrineHover {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-10px); }
      }

      /* WATER & MILESTONE CHEST */
      .milestone-chest-wrapper {
        position: relative;
        margin-top: 10px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0;
        pointer-events: auto;
        transition: transform 0.15s ease;
      }

      .milestone-chest-wrapper:hover {
        transform: scale(1.08);
      }

      .milestone-chest-wrapper:active {
        transform: scale(0.94);
      }

      .chest-artwork-img {
        width: 96px;
        height: 96px;
        object-fit: contain;
        image-rendering: pixelated;
        filter: drop-shadow(0 6px 14px rgba(0,0,0,0.7));
      }

      .chest-target-chip {
        background: linear-gradient(180deg, #ca8a04 0%, #854d0e 100%);
        border: 1.5px solid #fef08a;
        border-radius: 12px;
        padding: 3px 12px;
        font-size: 11px;
        font-weight: 900;
        color: #ffffff;
        margin-top: -10px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      }

      /* BOTTOM WORLD ACTION BAR */
      .world-action-bar {
        position: absolute;
        bottom: 14px;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 0 20px;
        z-index: 60;
      }

      .world-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: transform 0.12s ease, filter 0.12s ease;
      }

      .world-action-btn:hover {
        transform: translateY(-4px) scale(1.03);
        filter: brightness(1.1);
      }

      .world-action-btn:active {
        transform: translateY(2px) scale(0.96);
      }

      .patrol-btn .action-btn-img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        image-rendering: pixelated;
      }

      .play-btn .action-btn-img {
        width: 220px;
        height: 88px;
        object-fit: contain;
        image-rendering: pixelated;
        filter: drop-shadow(0 8px 20px rgba(234, 179, 8, 0.45));
      }

      .demon-btn .action-btn-img {
        width: 72px;
        height: 88px;
        object-fit: contain;
        image-rendering: pixelated;
      }

      .expedition-btn .action-btn-img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        image-rendering: pixelated;
      }

      /* BOTTOM NAVIGATION BAR (5 TABS) */
      .bottom-nav-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 115px;
        background: #0f172a;
        border-top: 2px solid #334155;
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        padding-bottom: 12px;
        z-index: 100;
        box-shadow: 0 -6px 20px rgba(0,0,0,0.6);
      }

      .nav-tab-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        position: relative;
        transition: transform 0.15s ease;
      }

      .nav-tab-item:active { transform: scale(0.92); }

      .nav-tab-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }

      .nav-tab-pixel-icon {
        width: 44px;
        height: 44px;
        object-fit: contain;
        image-rendering: pixelated;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
      }

      .nav-tab-label {
        font-size: 12px;
        font-weight: 800;
        color: #94a3b8;
        margin-top: 2px;
      }

      .active-tab .nav-tab-label { color: #38bdf8; }

      .nav-tab-badge {
        position: absolute;
        top: -4px;
        right: -8px;
        background: #ef4444;
        border: 2px solid #ffffff;
        border-radius: 10px;
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 900;
        color: #ffffff;
      }

      .elevated-tab {
        transform: translateY(-16px);
      }

      .elevated-tab .nav-tab-box {
        background: #1e293b;
        border: 3px solid #f59e0b;
        border-radius: 16px;
        padding: 8px 18px;
        box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
      }

      .elevated-tab .nav-tab-pixel-icon { width: 50px; height: 50px; }
      .elevated-tab .nav-tab-label { color: #fde047; font-size: 13px; font-weight: 900; }

      /* TAB GENERAL STYLES */
      .tab-header-title h2 { font-size: 20px; color: #facc15; font-weight: 900; margin-bottom: 4px; }
      .tab-header-title h3 { font-size: 17px; color: #38bdf8; font-weight: 800; margin-bottom: 4px; }
      .tab-header-title p { font-size: 13px; color: #94a3b8; line-height: 18px; }

      /* SHOP CARDS */
      .shop-card {
        margin-top: 14px;
        border-radius: 16px;
        padding: 18px;
        display: flex;
        gap: 16px;
        align-items: center;
        position: relative;
        overflow: hidden;
        border: 2px solid;
      }

      .common-chest-card {
        background: #1e293b;
        border-color: #38bdf8;
      }

      .royal-chest-card {
        background: linear-gradient(135deg, #2e1065, #4c1d95);
        border-color: #facc15;
      }

      .daily-card {
        background: #064e3b;
        border-color: #34d399;
      }

      .card-icon { font-size: 48px; }
      .card-body { flex: 1; }
      .card-title { font-size: 17px; font-weight: 900; color: #ffffff; margin-bottom: 4px; }
      .card-desc { font-size: 12px; color: #cbd5e1; line-height: 18px; margin-bottom: 10px; }

      .shop-buy-btn {
        padding: 10px 24px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 900;
        color: #ffffff;
        border: 2px solid;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
      }

      .can-buy { background: #0284c7; border-color: #7dd3fc; }
      .royal-btn.can-buy { background: #9333ea; border-color: #fde047; }
      .free-btn { background: #059669; border-color: #6ee7b7; }
      .disabled { background: #475569; border-color: #64748b; cursor: not-allowed; opacity: 0.6; }

      /* LOADOUT SLOTS */
      .loadout-container {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }

      .equipped-guns-row {
        display: flex;
        gap: 8px;
        flex: 1;
      }

      .equipped-buffs-row {
        display: flex;
        gap: 8px;
      }

      .slot-box {
        flex: 1;
        height: 80px;
        background: #1e293b;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        border: 2.5px solid;
      }

      .slot-tier-tag {
        position: absolute;
        top: 4px;
        font-size: 9px;
        font-weight: 900;
        padding: 1px 4px;
        border-radius: 4px;
      }

      .slot-gun-name { font-size: 11px; font-weight: 800; color: #ffffff; margin-top: 10px; text-align: center; }
      .slot-gun-lvl { font-size: 10px; font-weight: 900; color: #facc15; }
      .slot-action-hint { font-size: 8px; color: #ef4444; }

      .empty-slot { border-color: #334155; border-style: dashed; color: #64748b; font-size: 11px; font-weight: bold; }
      .buff-box { border-color: #facc15; background: #312e81; width: 68px; }
      .buff-badge { font-size: 9px; font-weight: 900; color: #facc15; }
      .buff-name { font-size: 12px; font-weight: 800; color: #ffffff; }

      /* TIER BORDERS */
      .tier-border-1 { border-color: #f8fafc; }
      .tier-border-2 { border-color: #38bdf8; }
      .tier-border-3 { border-color: #c084fc; }
      .tier-border-4 { border-color: #facc15; }
      .tier-border-5 { border-color: #ef4444; }

      /* INVENTORY GRID */
      .inventory-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 12px;
      }

      .inv-card {
        background: #1e293b;
        border-radius: 12px;
        padding: 12px;
        border: 2px solid;
      }

      .inv-card.locked { opacity: 0.5; background: #0f172a; }

      .inv-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .inv-rarity-pill {
        font-size: 9px;
        font-weight: 900;
        padding: 1px 6px;
        border-radius: 4px;
      }

      .inv-lvl-text { font-size: 12px; font-weight: 800; color: #facc15; }
      .inv-gun-title { font-size: 14px; font-weight: 900; color: #ffffff; }
      .inv-stats { font-size: 11px; color: #94a3b8; margin: 4px 0 8px; }

      .inv-actions { display: flex; gap: 6px; }

      .equip-toggle-btn {
        flex: 1;
        padding: 6px;
        border-radius: 6px;
        border: none;
        font-size: 11px;
        font-weight: 900;
        cursor: pointer;
        color: white;
      }

      .is-equipped { background: #16a34a; }
      .can-equip { background: #0284c7; }

      .upgrade-btn {
        padding: 6px 10px;
        border-radius: 6px;
        border: none;
        font-size: 11px;
        font-weight: 900;
        cursor: pointer;
        color: white;
      }

      .locked-hint { font-size: 11px; font-weight: bold; color: #ef4444; }

      /* TALENTS */
      .talents-container { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }

      .talent-card {
        background: #1e293b;
        border: 2px solid #475569;
        border-radius: 14px;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .talent-info { flex: 1; }
      .talent-title { font-size: 15px; font-weight: 900; color: #38bdf8; margin-bottom: 4px; }
      .talent-desc { font-size: 12px; color: #cbd5e1; margin-bottom: 8px; }
      .talent-progress { width: 100%; height: 10px; background: #0f172a; border-radius: 5px; overflow: hidden; }
      .talent-fill { height: 100%; background: #22c55e; }

      .talent-btn {
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 900;
        color: white;
        border: 2px solid;
        cursor: pointer;
      }

      .is-max { background: #334155; border-color: #64748b; }

      /* MODES */
      .mode-toggle-row { display: flex; gap: 12px; margin: 14px 0; }
      .mode-toggle-btn {
        flex: 1;
        padding: 14px;
        border-radius: 12px;
        background: #1e293b;
        border: 2px solid #475569;
        color: white;
        font-size: 15px;
        font-weight: 900;
        cursor: pointer;
      }

      .mode-toggle-btn.active {
        background: #059669;
        border-color: #34d399;
      }

      .map-cards-list { display: flex; flex-direction: column; gap: 10px; }
      .map-card {
        background: #1e293b;
        border: 2px solid #475569;
        border-radius: 12px;
        padding: 14px 18px;
        cursor: pointer;
      }

      .map-card.selected { background: #1e3a8a; border-color: #38bdf8; }
      .map-card.locked { opacity: 0.5; cursor: not-allowed; }
      .map-name { font-size: 16px; font-weight: 900; color: #facc15; }
      .map-desc { font-size: 12px; color: #94a3b8; margin-top: 4px; }

      .survival-banner-card {
        background: #1e1b4b;
        border: 2.5px solid #818cf8;
        border-radius: 14px;
        padding: 20px;
      }

      .surv-title { font-size: 20px; font-weight: 900; color: #facc15; margin-bottom: 8px; }
      .surv-desc { font-size: 13px; color: #e0e7ff; line-height: 22px; margin-bottom: 14px; }
      .surv-record { font-size: 16px; font-weight: 900; color: #34d399; }

      .modes-launch-btn {
        width: 100%;
        margin-top: 18px;
        padding: 16px;
        border-radius: 14px;
        background: #16a34a;
        border: 3px solid #4ade80;
        color: white;
        font-size: 20px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 6px 16px rgba(0,0,0,0.5);
      }

      /* IN-GAME BATTLE HUD */
      .battle-hud-screen {
        width: 100%;
        height: 100%;
        position: relative;
        pointer-events: none;
      }

      .battle-top-bar {
        position: absolute;
        top: 16px;
        left: 16px;
        right: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        pointer-events: auto;
      }

      .battle-menu-btn, .battle-speed-btn {
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid #38bdf8;
        border-radius: 10px;
        color: white;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
      }

      .battle-wave-badge {
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid #facc15;
        border-radius: 12px;
        padding: 6px 16px;
        font-size: 14px;
        font-weight: 900;
        color: #facc15;
      }

      .battle-stats-bar {
        position: absolute;
        top: 70px;
        left: 16px;
        right: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        pointer-events: auto;
      }

      .battle-hp-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid #ef4444;
        border-radius: 12px;
        padding: 6px 12px;
        width: 220px;
      }

      .hp-bar-track {
        flex: 1;
        height: 14px;
        background: #334155;
        border-radius: 7px;
        overflow: hidden;
      }

      .hp-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #ef4444, #f87171);
        transition: width 0.2s ease;
      }

      .hp-text { font-size: 11px; font-weight: 800; color: #fee2e2; }

      .battle-gold-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid #f59e0b;
        border-radius: 12px;
        padding: 6px 14px;
      }

      .gold-text { font-size: 15px; font-weight: 900; color: #fde047; }

      /* BATTLE BOTTOM BAR */
      .battle-bottom-bar {
        position: absolute;
        bottom: 24px;
        left: 20px;
        right: 20px;
        height: 84px;
        display: flex;
        gap: 16px;
        pointer-events: auto;
      }

      .chunky-roll-btn {
        flex: 1;
        background: linear-gradient(180deg, #b45309, #78350f);
        border: 3.5px solid #fde047;
        border-radius: 18px;
        color: white;
        cursor: pointer;
        box-shadow: 0 6px 0 #451a03, 0 10px 20px rgba(0,0,0,0.6);
        transition: transform 0.1s ease, box-shadow 0.1s ease;
      }

      .chunky-roll-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #451a03, 0 4px 10px rgba(0,0,0,0.6);
      }

      .chunky-roll-btn.disabled {
        background: #475569;
        border-color: #64748b;
        box-shadow: 0 4px 0 #334155;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .roll-btn-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .roll-icon { font-size: 26px; }
      .roll-label { font-size: 18px; font-weight: 900; }
      .roll-price { font-size: 15px; font-weight: 900; color: #fde047; }

      .chunky-wave-btn {
        flex: 1.2;
        background: linear-gradient(180deg, #16a34a, #14532d);
        border: 3.5px solid #4ade80;
        border-radius: 18px;
        color: white;
        font-size: 20px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 6px 0 #052e16, 0 10px 20px rgba(0,0,0,0.6);
        transition: transform 0.1s ease, box-shadow 0.1s ease;
      }

      .chunky-wave-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #052e16, 0 4px 10px rgba(0,0,0,0.6);
      }

        .chunky-wave-btn.in-wave {
        background: #334155;
        border-color: #64748b;
        box-shadow: 0 4px 0 #1e293b;
        cursor: not-allowed;
      }

      /* RESULT MODAL OVERLAY */
      .result-modal-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.88);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
        pointer-events: auto;
      }

      .result-modal-card {
        width: 580px;
        background: #0f172a;
        border: 4px solid;
        border-radius: 24px;
        padding: 34px 28px;
        text-align: center;
        box-shadow: 0 12px 48px rgba(0,0,0,0.9);
      }

      .win-card { border-color: #facc15; }
      .lose-card { border-color: #ef4444; }

      .result-title { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
      .win-card .result-title { color: #facc15; }
      .lose-card .result-title { color: #ef4444; }

      .result-subtitle { font-size: 15px; color: #cbd5e1; line-height: 22px; margin-bottom: 24px; }

      .result-rewards-box {
        background: rgba(30, 41, 59, 0.8);
        border: 2px solid #475569;
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 28px;
      }

      .rewards-heading { font-size: 13px; font-weight: 800; color: #94a3b8; margin-bottom: 12px; }
      .reward-pill { font-size: 18px; font-weight: 900; margin: 6px 0; }
      .gold-rew { color: #fde047; }
      .dia-rew { color: #6ee7b7; }

      .result-return-btn {
        width: 100%;
        padding: 16px;
        border-radius: 16px;
        background: #2563eb;
        border: 3px solid #60a5fa;
        color: white;
        font-size: 20px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
      }
    `;

    document.head.appendChild(styleEl);
  }

  public showResultModal(isWin: boolean, waveReached: number, earnedGold: number, earnedDia: number) {
    const modal = document.createElement('div');
    modal.className = 'result-modal-overlay';
    modal.innerHTML = `
      <div class="result-modal-card ${isWin ? 'win-card' : 'lose-card'}">
        <div class="result-title">${isWin ? '🏆 CHIẾN THẮNG TOÀN DIỆN!' : '💀 THÀNH TRÌ THẤT THỦ!'}</div>
        <div class="result-subtitle">
          Chế độ: ${this.game.gameMode === 'CAMPAIGN' ? `Chiến Dịch (Map ${this.game.saveData.selectedCampaignMap})` : 'Sinh Tồn Vô Tận'}<br/>
          Đã vượt qua: Wave ${waveReached}
        </div>

        <div class="result-rewards-box">
          <div class="rewards-heading">PHẦN THƯỞNG NHẬN ĐƯỢC:</div>
          <div class="reward-pill gold-rew">+${earnedGold} 💰 Vàng Vĩnh Viễn</div>
          <div class="reward-pill dia-rew">+${earnedDia} 💎 Kim Cương</div>
        </div>

        <button class="result-return-btn" id="btn-result-return">
          🏰 VỀ MÀN HÌNH CHÍNH
        </button>
      </div>
    `;

    modal.querySelector('#btn-result-return')?.addEventListener('click', () => {
      sound.playClick();
      modal.remove();
      this.game.returnToMainMenu();
      this.render();
    });

    this.rootEl.appendChild(modal);
  }
}
