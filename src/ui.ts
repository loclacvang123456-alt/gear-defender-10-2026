import { GameEngine, GUN_NAMES, GUN_TIERS, RARITY_CONFIGS, GUN_DETAILS } from './game';
import { GunKind, BuffKind, GameMode, CastleTalentState, QuestProgress, BattlePassData, Language } from './types';
import { sound } from './audio';
import { adService } from './adService';
import { t, getLanguage, TranslationKey } from './i18n';

export interface CampaignMapInfo {
  id: number;
  name: string;
  icon: string;
  desc: string;
  heroImg: string;
}

export const CAMPAIGN_MAPS: CampaignMapInfo[] = [
  { id: 1, name: 'Green Forest', icon: '🌲', desc: 'Verdant Woods', heroImg: '/assets/stage_diorama_forest.png' },
  { id: 2, name: 'Frozen Peaks', icon: '❄️', desc: 'Snowy Mountains', heroImg: '/assets/stage_diorama_snow.png' },
  { id: 3, name: 'Golden Dunes', icon: '🏜️', desc: 'Scorching Desert', heroImg: '/assets/stage_diorama_desert.png' },
  { id: 4, name: 'Magma Citadel', icon: '🌋', desc: 'Volcano Caldera', heroImg: '/assets/stage_diorama_volcano.png' },
  { id: 5, name: 'Cyber Ruins', icon: '⚡', desc: 'Synthwave Metropolis', heroImg: '/assets/stage_diorama_cyber.png' },
  { id: 6, name: 'Shadow Crypt', icon: '💀', desc: 'Cursed Graveyard', heroImg: '/assets/stage_diorama_shadow.png' },
  { id: 7, name: 'Celestial Sanctuary', icon: '✨', desc: 'High Heavens', heroImg: '/assets/stage_diorama_celestial.png' },
];

export function getCampaignMapInfo(id: number): CampaignMapInfo {
  const map = CAMPAIGN_MAPS[id - 1] || CAMPAIGN_MAPS[0];
  const lang = getLanguage();
  if (lang === 'vi') {
    return {
      ...map,
      name: t(('map_' + id + '_name') as TranslationKey),
      desc: t(('map_' + id + '_desc') as TranslationKey),
    };
  }
  return map;
}

export interface CastleTalentItem {
  key: keyof CastleTalentState;
  name: string;
  icon: string;
  tier: number; // 1: Common, 2: Rare, 3: Epic, 4: Legendary, 5: Mythic
  color: string;
  glowColor: string;
  maxLvl: number;
  stat: (lvl: number) => string;
  bonusText: (lvl: number) => string;
  shortExplain: string;
}

export const TALENT_REGISTRY: CastleTalentItem[] = [
  // Tier 1: Common (Green / Emerald)
  { key: 'hpLevel', name: 'CASTLE HP', icon: '❤️', tier: 1, color: '#22c55e', glowColor: '#86efac', maxLvl: 25, stat: (lvl) => `+${lvl * 50} HP`, bonusText: (lvl) => `+50 Castle Max HP (Lv.${lvl})`, shortExplain: 'Reinforces castle wall durability and structure' },
  { key: 'startGoldLevel', name: 'TREASURY', icon: '💰', tier: 1, color: '#22c55e', glowColor: '#86efac', maxLvl: 15, stat: (lvl) => `+${lvl * 10} $`, bonusText: (lvl) => `+10 Starting Battlefield Gold (Lv.${lvl})`, shortExplain: 'Provides extra starting gold at battle outset' },
  { key: 'bountyLevel', name: 'BOUNTY', icon: '🎯', tier: 1, color: '#22c55e', glowColor: '#86efac', maxLvl: 15, stat: (lvl) => `+${lvl * 8}% $`, bonusText: (lvl) => `+8% Enemy Monster Bounty (Lv.${lvl})`, shortExplain: 'Earns more gold for every defeated monster' },
  { key: 'regenLevel', name: 'REPAIR', icon: '🔧', tier: 1, color: '#22c55e', glowColor: '#86efac', maxLvl: 15, stat: (lvl) => `+${lvl * 15} HP/w`, bonusText: (lvl) => `Repairs +15 HP after every Wave (Lv.${lvl})`, shortExplain: 'Automatically restores castle health post-wave' },

  // Tier 2: Rare (Cyan / Sky)
  { key: 'armorLevel', name: 'IRON ARMOR', icon: '🛡️', tier: 2, color: '#06b6d4', glowColor: '#67e8f9', maxLvl: 15, stat: (lvl) => `-${lvl * 4}% DMG`, bonusText: (lvl) => `Reduces enemy damage taken by 4% (Lv.${lvl})`, shortExplain: 'Absorbs and mitigates attacks hitting the wall' },
  { key: 'turretDmgLevel', name: 'SIEGE POWER', icon: '💥', tier: 2, color: '#06b6d4', glowColor: '#67e8f9', maxLvl: 20, stat: (lvl) => `+${lvl * 6}% DMG`, bonusText: (lvl) => `+6% All Weapon Damage (Lv.${lvl})`, shortExplain: 'Powers up the firepower of all mounted weapons' },
  { key: 'atkSpeedLevel', name: 'OVERCLOCK', icon: '⚙️', tier: 2, color: '#06b6d4', glowColor: '#67e8f9', maxLvl: 15, stat: (lvl) => `+${lvl * 5}% SPD`, bonusText: (lvl) => `+5% Gear Spin & Reload Speed (Lv.${lvl})`, shortExplain: 'Accelerates gear rotation and weapon firing' },
  { key: 'freezeBoostLevel', name: 'PERMAFROST', icon: '❄️', tier: 2, color: '#06b6d4', glowColor: '#67e8f9', maxLvl: 15, stat: (lvl) => `+${lvl * 15}% ICE`, bonusText: (lvl) => `+15% Slow & Freeze Duration (Lv.${lvl})`, shortExplain: 'Prolongs freezing effects on invaded monsters' },

  // Tier 3: Epic (Purple / Magenta)
  { key: 'critRateLevel', name: 'DEADLY EYE', icon: '🎯', tier: 3, color: '#a855f7', glowColor: '#d8b4fe', maxLvl: 15, stat: (lvl) => `+${lvl * 3}% CRIT`, bonusText: (lvl) => `+3% Critical Strike Chance (Lv.${lvl})`, shortExplain: 'Increases chance of landing lethal critical shots' },
  { key: 'critDmgLevel', name: 'CRIT IMPACT', icon: '⚡', tier: 3, color: '#a855f7', glowColor: '#d8b4fe', maxLvl: 15, stat: (lvl) => `+${lvl * 20}% CDMG`, bonusText: (lvl) => `+20% Critical Damage Multiplier (Lv.${lvl})`, shortExplain: 'Multiplies devastation dealt on critical hits' },
  { key: 'thornsLevel', name: 'SPIKED WALL', icon: '🌵', tier: 3, color: '#a855f7', glowColor: '#d8b4fe', maxLvl: 15, stat: (lvl) => `${lvl * 25} DMG`, bonusText: (lvl) => `Reflects 25 Thorn Damage to attackers (Lv.${lvl})`, shortExplain: 'Retaliates damage when monsters strike the wall' },

  // Tier 4: Legendary (Gold / Amber)
  { key: 'shieldLevel', name: 'AEGIS SHIELD', icon: '🔮', tier: 4, color: '#f59e0b', glowColor: '#fde047', maxLvl: 10, stat: (lvl) => `${lvl * 80} SHIELD`, bonusText: (lvl) => `80 HP Barrier Shield at battle start (Lv.${lvl})`, shortExplain: 'Projects protective energy barrier absorbing damage' },
  { key: 'energyLevel', name: 'AETHER CORE', icon: '✨', tier: 4, color: '#f59e0b', glowColor: '#fde047', maxLvl: 10, stat: (lvl) => `+${lvl * 10} SP`, bonusText: (lvl) => `+10 Starting SP Energy (Lv.${lvl})`, shortExplain: 'Grants starting tactical energy for abilities' },

  // Tier 5: Mythic (Crimson / Flame)
  { key: 'luckyDropLevel', name: 'HAND OF MIDAS', icon: '🍀', tier: 5, color: '#ef4444', glowColor: '#fca5a5', maxLvl: 10, stat: (lvl) => `+${lvl * 6}% TIER`, bonusText: (lvl) => `+6% Chance to roll instant Lv.2 gun (Lv.${lvl})`, shortExplain: 'Divine fortune rolls high-tier guns directly' },
];

export function getTalentItem(item: CastleTalentItem): CastleTalentItem {
  const lang = getLanguage();
  if (lang === 'vi') {
    const viNames: Record<string, { name: string; explain: string; bonus: (lvl: number) => string }> = {
      hpLevel: { name: 'MÁU THÀNH TRÌ', explain: 'Tăng độ bền vững và máu tối đa cho thành lũy', bonus: (lvl) => `+50 Máu Tối Đa Thành (Cấp ${lvl})` },
      startGoldLevel: { name: 'NGÂN KHỐ', explain: 'Cung cấp thêm Vàng chiến đấu ngay khi bắt đầu ván', bonus: (lvl) => `+10 Vàng Khởi Đầu (Cấp ${lvl})` },
      bountyLevel: { name: 'TIỀN THƯỞNG', explain: 'Tăng thêm Vàng thu được khi tiêu diệt quái vật', bonus: (lvl) => `+8% Vàng Rơi Ra Từ Quái (Cấp ${lvl})` },
      regenLevel: { name: 'HỒI PHỤC', explain: 'Tự động sửa chữa phục hồi máu sau mỗi Đợt Wave', bonus: (lvl) => `Hồi phục +15 Máu sau mỗi Đợt (Cấp ${lvl})` },
      armorLevel: { name: 'GIÁP THÉP', explain: 'Hấp thụ và giảm sát thương quái đánh vào cổng thành', bonus: (lvl) => `Giảm 4% sát thương nhận vào (Cấp ${lvl})` },
      turretDmgLevel: { name: 'HỎA LỰC', explain: 'Tăng cường sát thương của toàn bộ vũ khí trên thành', bonus: (lvl) => `+6% Sát Thương Mọi Vũ Khí (Cấp ${lvl})` },
      atkSpeedLevel: { name: 'GIA TỐC CÒ', explain: 'Tăng tốc độ xoay bánh răng và nạp đạn nhanh hơn', bonus: (lvl) => `+5% Tốc Độ Bánh Răng & Bắn (Cấp ${lvl})` },
      freezeBoostLevel: { name: 'BĂNG GIÁ', explain: 'Kéo dài thời gian làm chậm và đóng băng quái vật', bonus: (lvl) => `+15% Thời Gian Đóng Băng (Cấp ${lvl})` },
      critRateLevel: { name: 'MẮT TỬ THẦN', explain: 'Tăng tỉ lệ bắn trúng điểm yếu gây đòn chí mạng', bonus: (lvl) => `+3% Tỉ Lệ Bạo Kích (Cấp ${lvl})` },
      critDmgLevel: { name: 'SỨC BẠO KÍCH', explain: 'Nhân bội sát thương tàn phá khi bắn trúng chí mạng', bonus: (lvl) => `+20% Sát Thương Bạo Kích (Cấp ${lvl})` },
      thornsLevel: { name: 'TƯỜNG CHÔNG', explain: 'Phản đòn sát thương chông gai khi quái đánh vào thành', bonus: (lvl) => `Phản lại 25 Sát Thương Chông (Cấp ${lvl})` },
      shieldLevel: { name: 'KHIÊN NĂNG LƯỢNG', explain: 'Tạo lớp khiên chắn năng lượng hấp thụ sát thương đầu trận', bonus: (lvl) => `Lớp Khiên 80 HP đầu trận (Cấp ${lvl})` },
      energyLevel: { name: 'LÕI NĂNG LƯỢNG', explain: 'Cung cấp thêm Năng Lượng SP chiến đấu đầu trận', bonus: (lvl) => `+10 Năng Lượng SP Ban Đầu (Cấp ${lvl})` },
      luckyDropLevel: { name: 'TAY VÀNG MIDAS', explain: 'May mắn quay ra thẳng súng Cấp 2 ngay từ đầu', bonus: (lvl) => `+6% Cơ Hội Roll Ra Súng Cấp 2 (Cấp ${lvl})` },
    };
    const vi = viNames[item.key as string];
    if (vi) {
      return {
        ...item,
        name: vi.name,
        shortExplain: vi.explain,
        bonusText: vi.bonus,
      };
    }
  }
  return item;
}

export interface BattlePassMilestone {
  level: number;
  reqPoints: number;
  freeReward: {
    icon: string;
    text: string;
    grant: (save: any, game: GameEngine) => void;
  };
  vipReward: {
    icon: string;
    text: string;
    grant: (save: any, game: GameEngine) => void;
  };
}

export const BATTLE_PASS_MILESTONES: BattlePassMilestone[] = [
  {
    level: 1,
    reqPoints: 50,
    freeReward: {
      icon: '💰',
      text: '+300 Gold',
      grant: (save) => { save.permanentGold += 300; }
    },
    vipReward: {
      icon: '👑',
      text: '+1,200 💰 & +30 💎',
      grant: (save) => { save.permanentGold += 1200; save.diamonds += 30; }
    }
  },
  {
    level: 2,
    reqPoints: 120,
    freeReward: {
      icon: '💎',
      text: '+25 Gems',
      grant: (save) => { save.diamonds += 25; }
    },
    vipReward: {
      icon: '📦',
      text: '+100 💎 & Bronze Chest',
      grant: (save, game) => { save.diamonds += 100; (game['uiManager'] as any)?.executeGacha('COMMON', true); }
    }
  },
  {
    level: 3,
    reqPoints: 220,
    freeReward: {
      icon: '💰',
      text: '+600 Gold',
      grant: (save) => { save.permanentGold += 600; }
    },
    vipReward: {
      icon: '💰',
      text: '+2,500 💰 & +50 💎',
      grant: (save) => { save.permanentGold += 2500; save.diamonds += 50; }
    }
  },
  {
    level: 4,
    reqPoints: 350,
    freeReward: {
      icon: '📦',
      text: 'Bronze Chest',
      grant: (save, game) => { (game['uiManager'] as any)?.executeGacha('COMMON', true); }
    },
    vipReward: {
      icon: '💥',
      text: '+150 💎 & Nuclear Cannon',
      grant: (save) => {
        save.diamonds += 150;
        if (!save.unlockedGuns.includes('NUCLEAR')) save.unlockedGuns.push('NUCLEAR');
        save.gunLevels['NUCLEAR'] = (save.gunLevels['NUCLEAR'] || 1) + 1;
      }
    }
  },
  {
    level: 5,
    reqPoints: 500,
    freeReward: {
      icon: '💎',
      text: '+50 Gems',
      grant: (save) => { save.diamonds += 50; }
    },
    vipReward: {
      icon: '👑',
      text: 'Royal Chest + 500 💰',
      grant: (save, game) => { save.permanentGold += 500; (game['uiManager'] as any)?.executeGacha('ROYAL', true); }
    }
  },
  {
    level: 6,
    reqPoints: 700,
    freeReward: {
      icon: '💰',
      text: '+1,000 Gold',
      grant: (save) => { save.permanentGold += 1000; }
    },
    vipReward: {
      icon: '💎',
      text: '+4,000 💰 & +100 💎',
      grant: (save) => { save.permanentGold += 4000; save.diamonds += 100; }
    }
  },
  {
    level: 7,
    reqPoints: 950,
    freeReward: {
      icon: '💎',
      text: '+80 Gems',
      grant: (save) => { save.diamonds += 80; }
    },
    vipReward: {
      icon: '👑',
      text: 'Royal Chest + 200 💎',
      grant: (save, game) => { save.diamonds += 200; (game['uiManager'] as any)?.executeGacha('ROYAL', true); }
    }
  },
  {
    level: 8,
    reqPoints: 1250,
    freeReward: {
      icon: '💰',
      text: '+2,000 Gold',
      grant: (save) => { save.permanentGold += 2000; }
    },
    vipReward: {
      icon: '⚡',
      text: '+6,000 💰 & Assassin Sniper',
      grant: (save) => {
        save.permanentGold += 6000;
        if (!save.unlockedGuns.includes('ASSASSIN')) save.unlockedGuns.push('ASSASSIN');
        save.gunLevels['ASSASSIN'] = (save.gunLevels['ASSASSIN'] || 1) + 1;
      }
    }
  },
  {
    level: 9,
    reqPoints: 1600,
    freeReward: {
      icon: '💎',
      text: '+120 Gems',
      grant: (save) => { save.diamonds += 120; }
    },
    vipReward: {
      icon: '👑',
      text: '+500 💎 & 2x Royal Chests',
      grant: (save, game) => {
        save.diamonds += 500;
        (game['uiManager'] as any)?.executeGacha('ROYAL', true);
        (game['uiManager'] as any)?.executeGacha('ROYAL', true);
      }
    }
  },
  {
    level: 10,
    reqPoints: 2000,
    freeReward: {
      icon: '🎁',
      text: 'Royal Chest + 3,000 💰',
      grant: (save, game) => {
        save.permanentGold += 3000;
        (game['uiManager'] as any)?.executeGacha('ROYAL', true);
      }
    },
    vipReward: {
      icon: '🌟',
      text: 'METEOR SHOWER + 1,000 💎',
      grant: (save) => {
        save.diamonds += 1000;
        save.permanentGold += 10000;
        if (!save.unlockedGuns.includes('METEOR')) save.unlockedGuns.push('METEOR');
        save.gunLevels['METEOR'] = (save.gunLevels['METEOR'] || 1) + 2;
      }
    }
  }
];

let activeUiManager: UIManager | null = null;

export function showInGameAlert(message: string, title: string = 'NOTICE', icon: string = '🔔') {
  if (activeUiManager) {
    activeUiManager.showAlertModal(message, title, icon);
  } else {
    const fallback = document.createElement('div');
    fallback.style.position = 'fixed';
    fallback.style.top = '50%';
    fallback.style.left = '50%';
    fallback.style.transform = 'translate(-50%, -50%)';
    fallback.style.background = '#0f172a';
    fallback.style.border = '3px solid #f59e0b';
    fallback.style.color = '#ffffff';
    fallback.style.padding = '22px 28px';
    fallback.style.borderRadius = '16px';
    fallback.style.zIndex = '999999';
    fallback.style.boxShadow = '0 10px 40px rgba(0,0,0,0.85)';
    fallback.style.textAlign = 'center';
    fallback.style.whiteSpace = 'pre-line';
    fallback.innerText = message;
    document.body.appendChild(fallback);
    setTimeout(() => fallback.remove(), 2500);
  }
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 10_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (num || 0).toLocaleString();
}

export class UIManager {
  private game: GameEngine;
  private container: HTMLElement;
  private rootEl!: HTMLElement;
  private currentTab: 'SHOP' | 'EQUIPMENT' | 'WORLD' | 'TALENT' | 'MODES' = 'WORLD';
  private selectedGunTier: number | 'ALL' = 'ALL';
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
  private tutorialOverlayEl: HTMLElement | null = null;

  constructor(game: GameEngine, container: HTMLElement) {
    this.game = game;
    this.container = container;
    activeUiManager = this;

    // OVERRIDE WINDOW.ALERT: Custom sleek modal instead of native browser popup
    window.alert = (msg: any) => {
      const text = String(msg ?? '');
      let title = 'NOTICE';
      let icon = '🔔';
      if (text.includes('SETTINGS') || text.includes('CÀI ĐẶT')) { title = 'SETTINGS'; icon = '⚙'; }
      else if (text.includes('BATTLE PASS')) { title = 'BATTLE PASS'; icon = '🏅'; }
      else if (text.includes('CONGRATULATIONS') || text.includes('UNLOCKED') || text.includes('CHÚC MỪNG') || text.includes('MỞ KHÓA')) { title = 'CONGRATULATIONS!'; icon = '🎉'; }
      else if (text.includes('HARVEST') || text.includes('SUPPLY') || text.includes('REWARD') || text.includes('THU HOẠCH') || text.includes('TIẾP TẾ') || text.includes('NHẬN THÀNH CÔNG')) { title = 'REWARDS'; icon = '🎁'; }
      else if (text.includes('Not enough') || text.includes('Must keep') || text.includes('Không đủ') || text.includes('phải giữ lại')) { title = 'ATTENTION'; icon = '⚠️'; }
      else if (text.includes('EVENT') || text.includes('SỰ KIỆN')) { title = 'SPECIAL EVENT'; icon = '🔥'; }
      else if (text.includes('EXPEDITION') || text.includes('VIỄN CHINH')) { title = 'EXPEDITION'; icon = '🧭'; }
      else if (text.includes('SPEED UP') || text.includes('TĂNG TỐC')) { title = 'AUTO MERGE'; icon = '⚡'; }
      else if (text.includes('HACK') || text.includes('CHEAT')) { title = 'DEV HACK'; icon = '⚡'; }
      this.showAlertModal(text, title, icon);
    };

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

    // 1. TOP HEADER BAR (CLEAN & MINIMAL)
    menuEl.appendChild(this.createHeaderBar());

    // 2. TAB CONTENT
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

    // 3. BOTTOM 5-TAB NAVIGATION BAR
    menuEl.appendChild(this.createBottomNavigationBar());

    this.rootEl.appendChild(menuEl);

    // KÍCH HOẠT HƯỚNG DẪN TẠI LOBBY KHI ĐẾN BƯỚC TƯƠNG ỨNG
    if (this.game.tutorialStep === 'LOBBY_SHOP') {
      setTimeout(() => this.showTutorialLobbyShop(), 120);
    } else if (this.game.tutorialStep === 'SHOP_BUY' && this.currentTab === 'SHOP') {
      setTimeout(() => this.showTutorialShopBuy(), 120);
    } else if (this.game.tutorialStep === 'LOBBY_EQUIP') {
      setTimeout(() => this.showTutorialLobbyEquip(), 120);
    } else if (this.game.tutorialStep === 'EQUIP_GUN' && this.currentTab === 'EQUIPMENT') {
      setTimeout(() => this.showTutorialEquipGun(), 120);
    }
  }

  // --- 1. TOP HEADER BAR (kid-friendly: big avatar, 2 currencies, settings) ---
  private createHeaderBar(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'top-header-bar';

    const save = this.game.saveData;
    const level = save.playerLevel || 1;

    header.innerHTML = `
      <button class="kid-avatar" id="header-level" aria-label="Profile">
        <span class="kid-avatar-star">⭐</span>
        <span class="kid-avatar-lv">${level}</span>
      </button>

      <div class="kid-currencies">
        <button class="kid-coin" id="pill-gold" aria-label="Gold">
          <img src="/assets/icon_gold.png" class="kid-currency-img" alt="" />
          <span class="kid-coin-val">${formatCompactNumber(save.permanentGold || 0)}</span>
        </button>
        <button class="kid-coin gem" id="pill-gem" aria-label="Diamonds">
          <img src="/assets/icon_gem.png" class="kid-currency-img" alt="" />
          <span class="kid-coin-val">${formatCompactNumber(save.diamonds || 0)}</span>
        </button>
      </div>

      <button class="kid-round-btn" id="btn-settings" aria-label="Settings">
        <img src="/assets/btn_settings.png" alt="" />
      </button>
    `;

    const goShop = () => {
      this.currentTab = 'SHOP';
      this.render();
    };

    header.querySelector('#header-level')?.addEventListener('click', () => {
      this.showGameModal({
        title: `Lv. ${level}`,
        icon: '⭐',
        items: [
          { label: t('profile_exp'), value: `${save.playerExp || 0}/100`, icon: '📈' },
          { label: t('profile_highest_stage'), value: `${save.highestCampaignStage * 10}/50`, icon: '🏆', highlight: true },
          { label: t('profile_weapons'), value: `${save.unlockedGuns.length}/40`, icon: '🔫' }
        ]
      });
    });

    header.querySelector('#pill-gold')?.addEventListener('click', () => {
      this.showGameModal({
        title: 'Gold',
        iconImg: '/assets/icon_gold.png',
        items: [{ label: 'Gold', value: (save.permanentGold || 0).toLocaleString(), icon: '💰', highlight: true }],
        actionText: '🛒 SHOP',
        onAction: goShop
      });
    });

    header.querySelector('#pill-gem')?.addEventListener('click', () => {
      this.showGameModal({
        title: 'Diamonds',
        iconImg: '/assets/icon_gem.png',
        items: [{ label: 'Diamonds', value: (save.diamonds || 0).toLocaleString(), icon: '💎', highlight: true }],
        actionText: '🛒 SHOP',
        onAction: goShop
      });
    });

    header.querySelector('#btn-settings')?.addEventListener('click', () => {
      this.showSettingsModal();
    });

    return header;
  }

  // --- 2. WORLD TAB (HOME: castle + stage switcher + giant PLAY button) ---
  private createWorldTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'world-tab-screen';

    const save = this.game.saveData;
    const maps = CAMPAIGN_MAPS;
    const currentMapId = Math.min(maps.length, Math.max(1, save.selectedCampaignMap || 1));
    const currentMap = getCampaignMapInfo(currentMapId);
    const isLocked = currentMapId > (save.highestCampaignStage || 1);

    const sideBtn = (id: string, img: string, label: string, dot = false) => `
      <button class="kid-side-btn" id="${id}" aria-label="${label}">
        <img src="${img}" alt="" />
        ${dot ? '<span class="kid-dot"></span>' : ''}
      </button>`;

    tab.innerHTML = `
      <div class="kid-cloud c1"></div>
      <div class="kid-cloud c2"></div>
      <div class="kid-cloud c3"></div>
      <div class="kid-hills"></div>

      <button class="kid-stage-ribbon" id="hotspot-info" aria-label="Stage Info">
        <span class="kid-stage-icon">${currentMap.icon}</span>
        <span class="kid-stage-text">${t('stage')} ${currentMapId}</span>
      </button>

      <div class="kid-side-col left">
        ${sideBtn('badge-quest', '/assets/badge_quest.png', t('quests'), true)}
        ${sideBtn('badge-pass', '/assets/pass_laurel.png', t('pass'), true)}
        ${sideBtn('btn-guide', '/assets/btn_info.png', t('guide'))}
      </div>
      <div class="kid-side-col right">
        ${sideBtn('btn-patrol', '/assets/shop_pack_daily.png', t('harvest'), true)}
        ${sideBtn('milestone-chest', '/assets/chest_milestone.png', t('chest'))}
      </div>

      <img src="${currentMap.heroImg}" class="kid-hero-art" alt="${currentMap.name}" />

      <!-- STAGE SELECTOR -->
      <div class="kid-stage-switch-row">
        <button class="kid-stage-arrow-btn ${currentMapId <= 1 ? 'disabled' : ''}" id="btn-stage-prev" aria-label="Previous Stage">◀</button>
        <button class="kid-stage-card ${isLocked ? 'locked' : ''}" id="btn-stage-card" aria-label="Stage Info">
          <span class="kid-stage-card-icon">${currentMap.icon}</span>
          <div class="kid-stage-card-text">
            <span class="kid-stage-card-title">${t('stage')} ${currentMapId}</span>
            <span class="kid-stage-card-name">${currentMap.name}${isLocked ? ' 🔒' : ''}</span>
          </div>
        </button>
        <button class="kid-stage-arrow-btn ${currentMapId >= maps.length ? 'disabled' : ''}" id="btn-stage-next" aria-label="Next Stage">▶</button>
      </div>

      <button class="kid-play-btn" id="btn-play" aria-label="Battle">
        <span class="kid-play-icon">▶</span>
        <span>${t('battle')}</span>
      </button>
    `;

    const play = () => {
      if (isLocked) {
        sound.playHit();
        this.showGameModal({
          title: `Stage ${currentMapId} Locked!`,
          icon: '🔒',
          items: [{ label: 'Requirement', value: `Clear Stage ${currentMapId - 1} to unlock`, icon: '⚔️', highlight: true }],
          actionText: 'GOT IT'
        });
        return;
      }
      if (!save.hasSeenTutorial) {
        this.game.startTutorial();
        return;
      }
      if (save.energy < 5) save.energy = 999;
      this.game['saveGame']();
      sound.playMerge();
      this.game.startBattle();
      this.render();
    };

    // Stage switch prev
    tab.querySelector('#btn-stage-prev')?.addEventListener('click', () => {
      if (currentMapId > 1) {
        save.selectedCampaignMap = currentMapId - 1;
        this.game['saveGame']();
        sound.playClick();
        this.render();
      }
    });

    // Stage switch next
    tab.querySelector('#btn-stage-next')?.addEventListener('click', () => {
      if (currentMapId < maps.length) {
        save.selectedCampaignMap = currentMapId + 1;
        this.game['saveGame']();
        sound.playClick();
        this.render();
      }
    });

    // Stage details modal
    const showStageDetails = () => {
      this.showGameModal({
        title: `Stage ${currentMapId} • ${currentMap.name}`,
        icon: currentMap.icon,
        items: [
          { label: 'Map', value: currentMap.desc, icon: '🗺️' },
          { label: 'Status', value: isLocked ? 'Locked 🔒' : 'Ready for Battle ✔', icon: isLocked ? '🔒' : '⚔️', highlight: !isLocked },
          { label: 'Record', value: `${(save.highestCampaignStage || 1) * 10}/25 Waves`, icon: '🏆', highlight: true }
        ],
        actionText: isLocked ? '🔒 LOCKED' : '▶ BATTLE NOW',
        onAction: () => {
          if (!isLocked) play();
        }
      });
    };

    tab.querySelector('#hotspot-info')?.addEventListener('click', showStageDetails);
    tab.querySelector('#btn-stage-card')?.addEventListener('click', showStageDetails);

    tab.querySelector('#badge-quest')?.addEventListener('click', () => {
      this.showQuestsModal();
    });

    tab.querySelector('#badge-pass')?.addEventListener('click', () => {
      this.showBattlePassModal();
    });

    tab.querySelector('#btn-guide')?.addEventListener('click', () => {
      this.showHowToPlayModal();
    });

    tab.querySelector('#btn-patrol')?.addEventListener('click', () => {
      save.permanentGold += 250;
      this.game['saveGame']();
      sound.playMerge();
      this.showGameModal({
        title: 'Daily Harvest',
        iconImg: '/assets/shop_pack_daily.png',
        items: [{ label: 'Gold', value: '+250', icon: '💰', highlight: true }],
        actionText: 'OK',
        onAction: () => this.render()
      });
    });

    tab.querySelector('#milestone-chest')?.addEventListener('click', () => {
      this.showGameModal({
        title: 'Milestone Chest',
        iconImg: '/assets/chest_milestone.png',
        items: [
          { label: 'Diamonds', value: '+1,000', icon: '💎', highlight: true },
          { label: 'Gold', value: '+10K', icon: '💰', highlight: true },
          { label: 'Weapon', value: 'Meteor Shower', icon: '☄️', highlight: true }
        ],
        actionText: '▶ BATTLE',
        onAction: play
      });
    });

    tab.querySelector('#btn-play')?.addEventListener('click', play);

    return tab;
  }

  // --- 4. SHOP TAB (KID-FRIENDLY BIG CHEST CARDS + WATCH AD OPTIONS) ---
  private createShopTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'shop-tab-screen scrollable-tab';

    const save = this.game.saveData;
    const royalAdCount = save.shopRoyalAdProgress || 0;

    tab.innerHTML = `
      <div class="kid-shop-list">
        <!-- COMMON CHEST -->
        <div class="kid-shop-card bronze">
          <button class="kid-shop-icon-btn" id="info-common" aria-label="Bronze Chest Info">
            <img src="/assets/shop_chest_bronze.png" alt="" />
            <span class="kid-info-badge">?</span>
          </button>
          <div class="kid-shop-body">
            <div class="kid-shop-title">${t('shop_bronze_title')}</div>
            <div class="kid-chip-row">
              <span class="kid-chip">${t('shop_chip_weapons')}</span>
              <span class="kid-chip">💰 +200</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="kid-buy-btn blue ${save.permanentGold >= 200 ? '' : 'disabled'}" id="btn-buy-common">
                <span>200</span>
                <span>💰</span>
              </button>
              <button class="kid-shop-ad-btn bronze" id="btn-ad-common">
                <img src="/assets/icon_ad_tv.png" class="ad-tv-img" alt="" />
                <span>${t('shop_claim_free')} (1/1)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ROYAL CHEST -->
        <div class="kid-shop-card royal">
          <button class="kid-shop-icon-btn" id="info-royal" aria-label="Royal Chest Info">
            <img src="/assets/shop_chest_royal.png" alt="" />
            <span class="kid-info-badge">?</span>
          </button>
          <div class="kid-shop-body">
            <div class="kid-shop-title">${t('shop_royal_title')}</div>
            <div class="kid-chip-row">
              <span class="kid-chip gold">${t('shop_chip_vip_weapons')}</span>
              <span class="kid-chip gold">💰 +1K</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="kid-buy-btn purple ${save.diamonds >= 60 ? '' : 'disabled'}" id="btn-buy-royal">
                <span>60</span>
                <span>💎</span>
              </button>
              <button class="kid-shop-ad-btn royal" id="btn-ad-royal">
                <img src="/assets/icon_ad_tv.png" class="ad-tv-img" alt="" />
                <span>${t('shop_claim_free')} (${royalAdCount}/3)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- FREE AD GOLD PACK -->
        <div class="kid-shop-card daily">
          <div class="kid-shop-icon-btn">
            <img src="/assets/icon_gold.png" alt="" />
          </div>
          <div class="kid-shop-body">
            <div class="kid-shop-title">${t('shop_gold_pack')}</div>
            <div class="kid-chip-row">
              <span class="kid-chip">💰 +500 ${t('shop_gold')}</span>
            </div>
            <button class="kid-shop-ad-btn gold" id="btn-ad-gold">
              <img src="/assets/icon_ad_tv.png" class="ad-tv-img" alt="" />
              <span>${t('shop_claim_free')}: +500 💰</span>
            </button>
          </div>
        </div>

        <!-- FREE AD GEM PACK -->
        <div class="kid-shop-card daily">
          <div class="kid-shop-icon-btn">
            <img src="/assets/icon_gem.png" alt="" />
          </div>
          <div class="kid-shop-body">
            <div class="kid-shop-title">${t('shop_gem_pack')}</div>
            <div class="kid-chip-row">
              <span class="kid-chip">💎 +30 ${t('shop_gems')}</span>
            </div>
            <button class="kid-shop-ad-btn gem" id="btn-ad-gem">
              <img src="/assets/icon_ad_tv.png" class="ad-tv-img" alt="" />
              <span>${t('shop_claim_free')}: +30 💎</span>
            </button>
          </div>
        </div>

        <!-- DAILY FREE GIFT -->
        <div class="kid-shop-card daily">
          <button class="kid-shop-icon-btn" id="info-daily" aria-label="Daily Gift">
            <img src="/assets/shop_pack_daily.png" alt="" />
          </button>
          <div class="kid-shop-body">
            <div class="kid-shop-title">${t('shop_daily_gift')}</div>
            <div class="kid-chip-row">
              <span class="kid-chip">💰 +500</span>
              <span class="kid-chip">💎 +50</span>
            </div>
            <button class="kid-buy-btn green" id="btn-claim-daily">
              <span>${t('shop_claim')}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    tab.querySelector('#info-common')?.addEventListener('click', () => {
      this.showGameModal({
        title: 'Bronze Chest',
        iconImg: '/assets/shop_chest_bronze.png',
        items: [
          { label: 'Weapons', value: 'Tier 1-3', icon: '🔫', highlight: true },
          { label: 'Upgrade', value: '+1 Level', icon: '⬆️' },
          { label: 'Gold', value: '+200', icon: '💰' }
        ],
        actionText: '200 💰',
        onAction: () => this.executeGacha('COMMON')
      });
    });

    tab.querySelector('#info-royal')?.addEventListener('click', () => {
      this.showGameModal({
        title: 'Royal Chest',
        iconImg: '/assets/shop_chest_royal.png',
        items: [
          { label: 'VIP Weapons', value: 'Tier 3-5', icon: '👑', highlight: true },
          { label: 'Upgrade', value: '+2 Levels', icon: '⬆️', highlight: true },
          { label: 'Gold', value: '+1,000', icon: '💰' }
        ],
        actionText: '60 💎',
        onAction: () => this.executeGacha('ROYAL')
      });
    });

    const claimDaily = () => {
      sound.playMerge();
      save.diamonds += 50;
      save.permanentGold += 500;
      this.game['saveGame']();
      this.showGameModal({
        title: 'Daily Gift!',
        iconImg: '/assets/shop_pack_daily.png',
        items: [
          { label: 'Gold', value: '+500', icon: '💰', highlight: true },
          { label: 'Diamonds', value: '+50', icon: '💎', highlight: true }
        ],
        actionText: 'OK',
        onAction: () => this.render()
      });
    };

    tab.querySelector('#info-daily')?.addEventListener('click', claimDaily);
    tab.querySelector('#btn-claim-daily')?.addEventListener('click', claimDaily);

    tab.querySelector('#btn-buy-common')?.addEventListener('click', () => {
      this.executeGacha('COMMON');
    });

    tab.querySelector('#btn-buy-royal')?.addEventListener('click', () => {
      this.executeGacha('ROYAL');
    });

    // WATCH AD HANDLERS
    tab.querySelector('#btn-ad-common')?.addEventListener('click', () => {
      adService.showRewardedAd('Bronze Chest Sponsor', () => {
        this.executeGacha('COMMON', true);
      }, (t, r) => this.showSimulatedAd(t, r));
    });

    tab.querySelector('#btn-ad-royal')?.addEventListener('click', () => {
      adService.showRewardedAd('Royal Chest Sponsor', () => {
        const cur = save.shopRoyalAdProgress || 0;
        if (cur < 2) {
          save.shopRoyalAdProgress = cur + 1;
          this.game.saveGame();
          sound.playMerge();
          this.render();
          this.showAlertModal(`Sponsor ad watched (${save.shopRoyalAdProgress}/3)! Watch 3 ads to open the Royal Chest for free!`, 'Royal Chest Progress', '📺');
        } else {
          save.shopRoyalAdProgress = 0;
          this.game.saveGame();
          this.executeGacha('ROYAL', true);
        }
      }, (t, r) => this.showSimulatedAd(t, r));
    });

    tab.querySelector('#btn-ad-gold')?.addEventListener('click', () => {
      adService.showRewardedAd('Gold Bonus Sponsor', () => {
        save.permanentGold += 500;
        this.game.saveGame();
        sound.playMerge(2);
        this.render();
        this.showGameModal({
          title: 'Gold Received!',
          icon: '💰',
          items: [{ label: 'Gold Bonus', value: '+500 💰', icon: '💰', highlight: true }],
          actionText: 'AWESOME'
        });
      }, (t, r) => this.showSimulatedAd(t, r));
    });

    tab.querySelector('#btn-ad-gem')?.addEventListener('click', () => {
      adService.showRewardedAd('Gem Bonus Sponsor', () => {
        save.diamonds += 30;
        this.game.saveGame();
        sound.playMerge(3);
        this.render();
        this.showGameModal({
          title: 'Diamonds Received!',
          icon: '💎',
          items: [{ label: 'Diamond Bonus', value: '+30 💎', icon: '💎', highlight: true }],
          actionText: 'AWESOME'
        });
      }, (t, r) => this.showSimulatedAd(t, r));
    });

    return tab;
  }

  // --- 5. EQUIPMENT TAB (KID-FRIENDLY 5-SLOT BAR + BIG TOY GUN CARDS) ---
  private createEquipmentTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'equip-tab-screen scrollable-tab';

    const save = this.game.saveData;

    let activeSlotsHtml = '';
    for (let i = 0; i < 5; i++) {
      const g = save.equippedGuns[i];
      if (g) {
        const tier = GUN_TIERS[g] || 1;
        const lvl = save.gunLevels[g] || 1;
        activeSlotsHtml += `
          <button class="kid-equip-slot tier-bg-${tier}" data-unequip-idx="${i}" aria-label="${GUN_NAMES[g]}">
            <span class="kid-slot-remove">✕</span>
            <img src="/assets/gun_${g.toLowerCase()}.png" onerror="this.onerror=null; this.src='/assets/tab_equip.png';" class="kid-slot-img" alt="" />
            <span class="kid-slot-lvl">Lv.${lvl}</span>
          </button>
        `;
      } else {
        activeSlotsHtml += `
          <div class="kid-equip-slot empty">
            <span>+</span>
          </div>
        `;
      }
    }

    const allGuns = Object.keys(GUN_NAMES) as GunKind[];
    const filteredGuns = allGuns.filter(g => {
      if (this.selectedGunTier === 'ALL') return true;
      return (GUN_TIERS[g] || 1) === this.selectedGunTier;
    });

    let inventoryHtml = '';
    filteredGuns.forEach(g => {
      const isUnlocked = save.unlockedGuns.includes(g);
      const isEquipped = save.equippedGuns.includes(g);
      const tier = GUN_TIERS[g] || 1;
      const lvl = save.gunLevels[g] || 1;
      const upgradeCost = lvl * 40;
      const canUpgrade = save.permanentGold >= upgradeCost;
      const stars = '⭐'.repeat(Math.min(tier, 5));

      inventoryHtml += `
        <div class="kid-gun-card tier-card-${tier} ${isUnlocked ? '' : 'locked'}">
          <div class="kid-gun-top">
            <span class="kid-gun-stars">${stars}</span>
            <span class="kid-tier-badge tier-badge-${tier}">TIER ${tier}</span>
            <span class="kid-gun-lvl-pill">${isUnlocked ? `Lv.${lvl}` : '🔒'}</span>
          </div>

          <button class="kid-gun-preview" data-info-gun="${g}" aria-label="${GUN_NAMES[g]}">
            <img src="/assets/gun_${g.toLowerCase()}.png" onerror="this.onerror=null; this.src='/assets/tab_equip.png';" class="${isUnlocked ? '' : 'is-locked-img'}" alt="" />
            ${isEquipped ? '<span class="kid-equipped-check">✔</span>' : ''}
          </button>

          <div class="kid-gun-name">${GUN_NAMES[g]}</div>

          <div class="kid-gun-actions">
            ${isUnlocked ? `
              <button class="kid-gun-btn ${isEquipped ? 'equipped' : 'equip'}" data-gun="${g}">
                ${isEquipped ? '✔ ' + t('equip_equipped_badge') : t('equip_btn_equip')}
              </button>
              <button class="kid-gun-btn upgrade ${canUpgrade ? '' : 'disabled'}" data-upgrade-gun="${g}">
                ⬆️ ${upgradeCost} 💰
              </button>
            ` : `
              <button class="kid-gun-btn locked-btn" data-goto-shop="1">
                🔒 ${t('equip_locked_badge')}
              </button>
            `}
          </div>
        </div>
      `;
    });

    tab.innerHTML = `
      <div class="kid-loadout-panel">
        <div class="kid-section-pill">🎒 ${t('equip_title')} (${save.equippedGuns.length}/5)</div>
        <div class="kid-slot-row">
          ${activeSlotsHtml}
        </div>
      </div>

      <div class="kid-section-pill" style="margin: 18px auto 10px;">🔫 ${t('weapons').toUpperCase()} (${save.unlockedGuns.length}/${allGuns.length})</div>

      <!-- INVENTORY CONTAINER WITH SINGLE-ROW SLANTED TABS SEAMLESSLY CONNECTED TO BOARD -->
      <div class="kid-inventory-container">
        <div class="kid-tier-tab-bar">
          <button class="kid-tier-tab tab-tier-all ${this.selectedGunTier === 'ALL' ? 'active' : ''}" data-tier-filter="ALL" aria-label="All">
            <span class="tab-content">${t('equip_filter_all')}</span>
          </button>
          <button class="kid-tier-tab tab-tier-1 ${this.selectedGunTier === 1 ? 'active' : ''}" data-tier-filter="1" aria-label="1 star">
            <span class="tab-content">1⭐</span>
          </button>
          <button class="kid-tier-tab tab-tier-2 ${this.selectedGunTier === 2 ? 'active' : ''}" data-tier-filter="2" aria-label="2 stars">
            <span class="tab-content">2⭐</span>
          </button>
          <button class="kid-tier-tab tab-tier-3 ${this.selectedGunTier === 3 ? 'active' : ''}" data-tier-filter="3" aria-label="3 stars">
            <span class="tab-content">3⭐</span>
          </button>
          <button class="kid-tier-tab tab-tier-4 ${this.selectedGunTier === 4 ? 'active' : ''}" data-tier-filter="4" aria-label="4 stars">
            <span class="tab-content">4⭐</span>
          </button>
          <button class="kid-tier-tab tab-tier-5 ${this.selectedGunTier === 5 ? 'active' : ''}" data-tier-filter="5" aria-label="5 stars">
            <span class="tab-content">5⭐</span>
          </button>
        </div>

        <div class="kid-inventory-board tier-board-${this.selectedGunTier}">
          <div class="kid-gun-grid">
            ${inventoryHtml.length > 0 ? inventoryHtml : '<div style="grid-column: 1 / -1; text-align: center; padding: 30px; font-size: 22px; font-weight: 900; color: #475569;">No weapons in this tier!</div>'}
          </div>
        </div>
      </div>
    `;

    const toggleEquipGun = (g: GunKind) => {
      const isEquipped = save.equippedGuns.includes(g);
      if (isEquipped) {
        if (save.equippedGuns.length > 1) {
          save.equippedGuns = save.equippedGuns.filter(item => item !== g);
        } else {
          this.showGameModal({ title: 'Notice', icon: '⚠️', description: t('equip_must_keep') });
          return;
        }
      } else {
        if (save.equippedGuns.length < 5) {
          save.equippedGuns.push(g);
        } else {
          save.equippedGuns.shift();
          save.equippedGuns.push(g);
        }
        if (this.game.tutorialStep === 'EQUIP_GUN') {
          this.game['saveGame']();
          sound.playClick();
          this.completeTutorial();
          return;
        }
      }
      this.game['saveGame']();
      sound.playClick();
      this.render();
    };

    const upgradeGun = (g: GunKind) => {
      const lvl = save.gunLevels[g] || 1;
      const cost = lvl * 40;
      if (save.permanentGold < cost) {
        sound.playHit();
        this.showGameModal({
          title: t('equip_not_enough_gold'),
          icon: '💰',
          items: [{ label: 'Need', value: `${cost} 💰`, icon: '💰', highlight: true }],
          actionText: t('equip_btn_chest'),
          onAction: () => {
            this.currentTab = 'SHOP';
            this.render();
          }
        });
        return;
      }
      save.permanentGold -= cost;
      save.gunLevels[g] = lvl + 1;
      this.game.addQuestProgress('upgrade_guns', 1);
      this.game['saveGame']();
      sound.playMerge();
      this.render();
    };

    tab.querySelectorAll('[data-unequip-idx]').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).dataset.unequipIdx);
        const g = save.equippedGuns[idx];
        if (g) toggleEquipGun(g);
      });
    });

    tab.querySelectorAll('[data-info-gun]').forEach(el => {
      el.addEventListener('click', (e) => {
        const g = (e.currentTarget as HTMLElement).dataset.infoGun as GunKind;
        const isUnlocked = save.unlockedGuns.includes(g);
        const lvl = save.gunLevels[g] || 1;
        const tier = GUN_TIERS[g] || 1;
        const cost = lvl * 40;
        const detail = GUN_DETAILS[g];
        const rarityName = RARITY_CONFIGS[tier]?.name || `Tier ${tier}`;

        const items: { label: string; value: string; icon?: string; highlight?: boolean }[] = [
          { label: t('equip_stat_level'), value: isUnlocked ? `Lv.${lvl}` : `🔒 ${t('equip_locked_badge')}`, icon: '⭐', highlight: true },
          { label: t('equip_stat_power'), value: `+${(lvl - 1) * 15}% DMG`, icon: '💥', highlight: true },
          { label: t('equip_stat_rarity'), value: `Tier ${tier} (${rarityName})`, icon: '🎖️' },
        ];
        if (detail?.role) {
          items.push({ label: t('equip_stat_role'), value: detail.role, icon: '🛡️' });
        }

        const descHtml = detail ? `
          <div style="display:flex;flex-direction:column;gap:10px;text-align:left;font-size:20px;font-weight:600;color:#334155;">
            <div style="background:#fef3c7;border:2px solid #fde047;border-radius:14px;padding:12px 16px;">
              <div style="color:#b45309;font-weight:900;font-size:20px;margin-bottom:4px;">${t('equip_how_it_works')}</div>
              <div style="color:#78350f;line-height:1.35;">${detail.mechanic}</div>
            </div>
            <div style="background:#f1f5f9;border:2px solid #cbd5e1;border-radius:14px;padding:12px 16px;">
              <div style="color:#334155;font-weight:900;font-size:20px;margin-bottom:4px;">${t('equip_skill_details')}</div>
              <div style="color:#475569;line-height:1.35;">${detail.fullDesc}</div>
            </div>
            <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:14px;padding:12px 16px;">
              <div style="color:#1d4ed8;font-weight:900;font-size:20px;margin-bottom:4px;">${t('equip_tactical_tips')}</div>
              <div style="color:#1e40af;line-height:1.35;">${detail.tips}</div>
            </div>
          </div>
        ` : 'No skill details available.';

        this.showGameModal({
          title: GUN_NAMES[g],
          subtitle: detail ? `${detail.role} • ${detail.bulletType}` : undefined,
          iconImg: `/assets/gun_${g.toLowerCase()}.png`,
          items,
          description: descHtml,
          actionText: isUnlocked ? `⬆️ ${cost} 💰` : t('equip_btn_chest'),
          onAction: () => {
            if (isUnlocked) upgradeGun(g);
            else {
              this.currentTab = 'SHOP';
              this.render();
            }
          },
          secondaryText: isUnlocked ? (save.equippedGuns.includes(g) ? t('equip_btn_unequip') : t('equip_btn_equip')) : undefined,
          onSecondary: isUnlocked ? () => toggleEquipGun(g) : undefined
        });
      });
    });

    tab.querySelectorAll('[data-gun]').forEach(el => {
      el.addEventListener('click', (e) => {
        const g = (e.currentTarget as HTMLElement).dataset.gun as GunKind;
        toggleEquipGun(g);
      });
    });

    tab.querySelectorAll('[data-upgrade-gun]').forEach(el => {
      el.addEventListener('click', (e) => {
        const g = (e.currentTarget as HTMLElement).dataset.upgradeGun as GunKind;
        upgradeGun(g);
      });
    });

    tab.querySelectorAll('[data-tier-filter]').forEach(el => {
      el.addEventListener('click', (e) => {
        sound.playClick();
        const val = (e.currentTarget as HTMLElement).dataset.tierFilter;
        this.selectedGunTier = val === 'ALL' ? 'ALL' : Number(val);
        this.render();
      });
    });

    tab.querySelectorAll('[data-goto-shop]').forEach(el => {
      el.addEventListener('click', () => {
        sound.playClick();
        this.currentTab = 'SHOP';
        this.render();
      });
    });

    return tab;
  }

  // --- 6. TALENT TAB (HONEYCOMB GRID + RANDOM ROLL SYSTEM) ---
  private createTalentTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'talent-tab-screen scrollable-tab';

    const save = this.game.saveData;
    save.talents = {
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
      ...(save.talents || {})
    };
    const talents = save.talents;

    let totalLevels = 0;
    TALENT_REGISTRY.forEach(t => {
      totalLevels += (talents[t.key] || 0);
    });

    const rollCost = 250;
    const canAfford = save.permanentGold >= rollCost;

    // Sắp xếp 14 talent thành hình tổ ong (4 hàng so le: 3, 4, 4, 3)
    const rowCounts = [3, 4, 4, 3];
    let currentIndex = 0;
    let honeycombRowsHtml = '';

    for (let r = 0; r < rowCounts.length; r++) {
      const count = rowCounts[r];
      let cellsHtml = '';
      for (let i = 0; i < count; i++) {
        if (currentIndex >= TALENT_REGISTRY.length) break;
        const talent = TALENT_REGISTRY[currentIndex++];
        const lvl = talents[talent.key] || 0;
        const isLocked = lvl === 0;
        const item = getTalentItem(talent);

        cellsHtml += `
          <button class="honeycomb-cell ${isLocked ? 'locked' : `tier-${talent.tier}`}" data-talent-key="${talent.key}" aria-label="${item.name}">
            <div class="honeycomb-cell-icon">${isLocked ? '🔒' : talent.icon}</div>
            <div class="honeycomb-cell-title">${isLocked ? t('locked') : item.name}</div>
            <div class="honeycomb-cell-lvl">${isLocked ? 'Tier ' + talent.tier : `Lv.${lvl}`}</div>
          </button>
        `;
      }
      honeycombRowsHtml += `<div class="honeycomb-row">${cellsHtml}</div>`;
    }

    tab.innerHTML = `
      <div class="talent-roll-header-card">
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">${t('talents_title')}</div>
          <div style="font-size: 26px; font-weight: 900; color: #fde047;">✨ ${t('talents_buffs_active', totalLevels)}</div>
          <div style="font-size: 15px; font-weight: 700; color: #67e8f9; margin-top: 2px;">${t('talents_subtitle')}</div>
        </div>
        <button class="talent-roll-btn ${canAfford ? '' : 'disabled'}" id="btn-roll-talent">
          <span>🎲 ${t('talents_roll_btn')}</span>
          <span>${rollCost} 💰</span>
        </button>
      </div>

      <div class="kid-section-pill" style="margin: 4px auto 14px;">🛡️ ${t('tab_talents')}</div>

      <div class="talent-honeycomb-wrapper">
        ${honeycombRowsHtml}
      </div>
    `;

    // Roll random talent
    tab.querySelector('#btn-roll-talent')?.addEventListener('click', () => {
      if (save.permanentGold < rollCost) {
        sound.playHit();
        this.showGameModal({
          title: t('need_gold'),
          icon: '💰',
          items: [{ label: t('gold_cost'), value: `${rollCost} 💰`, icon: '💰', highlight: true }]
        });
        return;
      }

      save.permanentGold -= rollCost;

      // Weighted random selection by tier:
      // Tier 1: 45%, Tier 2: 30%, Tier 3: 15%, Tier 4: 8%, Tier 5: 2%
      const rand = Math.random();
      let targetTier = 1;
      if (rand < 0.45) targetTier = 1;
      else if (rand < 0.75) targetTier = 2;
      else if (rand < 0.90) targetTier = 3;
      else if (rand < 0.98) targetTier = 4;
      else targetTier = 5;

      const candidates = TALENT_REGISTRY.filter(t => t.tier === targetTier && (talents[t.key] || 0) < t.maxLvl);
      const picked = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : TALENT_REGISTRY[Math.floor(Math.random() * TALENT_REGISTRY.length)];

      const nextLvl = (talents[picked.key] || 0) + 1;
      talents[picked.key] = nextLvl;
      this.game.addQuestProgress('roll_talent', 1);
      this.game.saveGame();

      this.showTalentRollModal(picked, nextLvl);
    });

    // Xem thông tin chi tiết ô buff khi click
    tab.querySelectorAll('[data-talent-key]').forEach(el => {
      el.addEventListener('click', (e) => {
        const key = (e.currentTarget as HTMLElement).dataset.talentKey as keyof CastleTalentState;
        const talent = TALENT_REGISTRY.find(item => item.key === key);
        if (!talent) return;
        const lvl = talents[key] || 0;
        const isLocked = lvl === 0;
        const item = getTalentItem(talent);

        const rarityNames = ['', t('rarity_common'), t('rarity_rare'), t('rarity_epic'), t('rarity_legendary'), t('rarity_mythic')];
        this.showGameModal({
          title: item.name,
          icon: talent.icon,
          subtitle: `Tier ${talent.tier} (${rarityNames[talent.tier]})`,
          items: [
            { label: t('level'), value: isLocked ? t('locked') : `Lv.${lvl}/${talent.maxLvl}`, icon: '⭐', highlight: !isLocked },
            { label: 'Stat', value: isLocked ? '0' : talent.stat(lvl), icon: '📊', highlight: true },
            { label: t('next_upgrade'), value: talent.stat(lvl + 1), icon: '⬆️' }
          ],
          description: `<div style="padding:10px 14px;background:#1e293b;border-radius:12px;color:#67e8f9;font-weight:700;">${item.shortExplain}</div>`,
          actionText: t('action_ok')
        });
      });
    });

    return tab;
  }

  // --- 7. MODES TAB (KID-FRIENDLY MAP & MODE CARDS) ---
  private createModesTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'modes-tab-screen scrollable-tab';

    const save = this.game.saveData;

    tab.innerHTML = `
      <div class="mode-toggle-row">
        <button class="kid-mode-tab ${this.game.gameMode === 'CAMPAIGN' ? 'active' : ''}" id="mode-camp">
          🗺️ ${t('modes_campaign')}
        </button>
        <button class="kid-mode-tab ${this.game.gameMode === 'SURVIVAL' ? 'active' : ''}" id="mode-surv">
          💀 ${t('modes_survival')}
        </button>
      </div>

      ${this.game.gameMode === 'CAMPAIGN' ? `
        <div class="map-cards-list">
          ${CAMPAIGN_MAPS.map(m => {
            const isSelected = (save.selectedCampaignMap || 1) === m.id;
            const isUnlocked = (save.highestCampaignStage || 1) >= m.id;
            const mapInfo = getCampaignMapInfo(m.id);
            return `
              <div class="kid-map-card ${isSelected ? 'selected' : ''} ${isUnlocked ? '' : 'locked'}" data-map-id="${m.id}">
                <span class="kid-map-icon">${m.icon}</span>
                <div class="kid-map-info">
                  <div class="kid-map-name">${t('stage_num', m.id)} • ${mapInfo.name}</div>
                  <span class="kid-chip">${mapInfo.desc}</span>
                </div>
                <span class="kid-map-status">${isUnlocked ? (isSelected ? '✔' : '▶') : '🔒'}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="kid-surv-card">
          <div class="kid-surv-icon">💀</div>
          <div class="kid-map-name">${t('modes_survival_arena')}</div>
          <div class="kid-chip gold" style="font-size: 24px; padding: 8px 22px;">🏆 ${t('modes_best_record', save.highestSurvivalWave)}</div>
        </div>
      `}

      <button class="kid-play-btn" id="btn-modes-launch" style="position: relative; left: auto; bottom: auto; margin: 24px auto 0; width: 100%; max-width: 460px; height: 112px; font-size: 48px;">
        <span class="kid-play-icon">▶</span>
        <span>${t('modes_battle')}</span>
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
      if (save.energy < 5) save.energy = 999;
      this.game['saveGame']();
      sound.playMerge();
      this.game.startBattle();
      this.render();
    });

    return tab;
  }

  // --- 8. BOTTOM 5-TAB NAVIGATION BAR (icons only; label shows under active tab) ---
  private createBottomNavigationBar(): HTMLElement {
    const nav = document.createElement('div');
    nav.className = 'bottom-nav-bar';

    const tabs: { key: 'SHOP' | 'EQUIPMENT' | 'WORLD' | 'TALENT' | 'MODES'; id: string; label: string; iconSrc: string; dot?: boolean }[] = [
      { key: 'SHOP', id: 'nav-tab-shop', label: t('tab_shop'), iconSrc: '/assets/tab_shop.png', dot: true },
      { key: 'EQUIPMENT', id: 'nav-tab-equipment', label: t('tab_arsenal'), iconSrc: '/assets/tab_equip.png', dot: true },
      { key: 'WORLD', id: 'nav-tab-world', label: t('tab_home'), iconSrc: '/assets/tab_world.png' },
      { key: 'TALENT', id: 'nav-tab-talent', label: t('tab_talents'), iconSrc: '/assets/tab_talent.png' },
      { key: 'MODES', id: 'nav-tab-modes', label: t('tab_modes'), iconSrc: '/assets/tab_modes.png' },
    ];

    tabs.forEach(t => {
      const btn = document.createElement('button');
      btn.id = t.id;
      btn.className = `kid-nav-btn ${this.currentTab === t.key ? 'active' : ''}`;
      btn.setAttribute('aria-label', t.label);
      btn.innerHTML = `
        <img src="${t.iconSrc}" alt="" />
        <span class="kid-nav-label">${t.label}</span>
        ${t.dot ? '<span class="kid-dot"></span>' : ''}
      `;
      btn.addEventListener('click', () => {
        if (t.key === 'SHOP' && this.game.tutorialStep === 'LOBBY_SHOP') {
          this.game.tutorialStep = 'SHOP_BUY';
          this.game.saveData.tutorialStep = 'SHOP_BUY';
        } else if (t.key === 'EQUIPMENT' && this.game.tutorialStep === 'LOBBY_EQUIP') {
          this.game.tutorialStep = 'EQUIP_GUN';
          this.game.saveData.tutorialStep = 'EQUIP_GUN';
        }
        this.currentTab = t.key;
        sound.playClick();
        this.render();
      });
      nav.appendChild(btn);
    });

    return nav;
  }

  // ================= IN-GAME BATTLE HUD (KID-FRIENDLY CHUNKY HUD) ================= //
  private renderBattleHUD() {
    this.battleHudEl = document.createElement('div');
    this.battleHudEl.className = 'battle-hud-screen';

    this.battleHudEl.innerHTML = `
      <!-- TOP HUD -->
      <div class="battle-top-bar">
        <button class="battle-menu-btn" id="btn-battle-back" aria-label="Menu">🏠</button>

        <div class="battle-wave-badge" id="hud-wave-text">
          🌊 1/25
        </div>

        <div class="battle-hp-pill">
          <span class="hp-icon">❤️</span>
          <div class="hp-bar-track">
            <div class="hp-bar-fill" id="hud-hp-fill" style="width: 100%;"></div>
          </div>
          <span class="hp-text" id="hud-hp-text">100</span>
        </div>

        <button class="battle-speed-btn" id="btn-battle-speed">⏩ 1x</button>
      </div>

      <!-- BOTTOM HUD -->
      <div class="battle-bottom-bar">
        <div class="roll-buy-wrapper">
          <div class="battle-gold-extension">
            <span class="gold-ext-icon">🪙</span>
            <span class="gold-ext-text" id="hud-gold-text">15</span>
          </div>

          <button class="chunky-roll-btn" id="btn-battle-roll">
            <div class="roll-btn-content">
              <span class="roll-icon">🎲</span>
              <span class="roll-label">${t('hud_buy')}</span>
              <span class="roll-price" id="hud-roll-price">2 🪙</span>
            </div>
          </button>
        </div>

        <button class="chunky-wave-btn" id="btn-battle-start-wave">
          ⚔️ ${t('hud_battle')}
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

    this.battleHudEl.querySelector('#btn-battle-back')?.addEventListener('click', () => {
      sound.playClick();
      this.showBattlePauseModal();
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

    if (this.game.tutorialStep === 'BATTLE_ROLL') {
      setTimeout(() => this.showTutorialRoll(), 150);
    } else if (this.game.tutorialStep === 'BATTLE_START') {
      setTimeout(() => this.showTutorialBattleStart(), 150);
    }
  }

  // Update HUD values in Game Loop (Zero Allocation)
  public updateHudValues() {
    if (this.game.inMenu || !this.battleHudEl) return;

    if (this.goldTextEl) {
      this.goldTextEl.innerText = `${this.game.gold}`;
    }

    if (this.hpTextEl && this.hpBarFillEl) {
      this.hpTextEl.innerText = `${this.game.castleHp}`;
      const pct = Math.max(0, Math.min(100, (this.game.castleHp / this.game.maxCastleHp) * 100));
      this.hpBarFillEl.style.width = `${pct}%`;
    }

    if (this.waveTextEl) {
      this.waveTextEl.innerText = this.game.gameMode === 'CAMPAIGN'
        ? `🌊 ${this.game.wave}/${this.game.maxWave}`
        : `🌊 ${this.game.wave}`;
    }

    if (this.rollPriceEl) {
      this.rollPriceEl.innerText = `${this.game.rollPrice} 🪙`;
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
        this.startWaveBtnEl.innerText = `🌊 ${t('hud_wave_label', this.game.wave)}`;
        this.startWaveBtnEl.classList.add('in-wave');
      } else {
        this.startWaveBtnEl.innerText = `⚔️ ${t('hud_battle')}`;
        this.startWaveBtnEl.classList.remove('in-wave');
      }
    }
  }

  // --- GACHA REWARD LOGIC (VISUAL MODAL WITH GUN SPRITE) ---
  public executeGacha(type: 'COMMON' | 'ROYAL', isFreeAd: boolean = false) {
    const save = this.game.saveData;

    if (!isFreeAd) {
      if (type === 'COMMON') {
        if (save.permanentGold < 200) {
          sound.playHit();
          this.showGameModal({
            title: 'Need Gold!',
            icon: '💰',
            items: [{ label: 'Cost', value: '200 💰', icon: '💰', highlight: true }]
          });
          return;
        }
        save.permanentGold -= 200;
      } else {
        if (save.diamonds < 60) {
          sound.playHit();
          this.showGameModal({
            title: 'Need Diamonds!',
            icon: '💎',
            items: [{ label: 'Cost', value: '60 💎', icon: '💎', highlight: true }]
          });
          return;
        }
        save.diamonds -= 60;
      }
    }

    this.game.addQuestProgress('open_chest', 1);

    if (this.game.tutorialStep === 'SHOP_BUY') {
      const candidates: GunKind[] = ['POISON', 'WIND', 'CRYO', 'TESLA'];
      const unequipped = candidates.filter(g => !save.unlockedGuns.includes(g));
      const pickedGun: GunKind = unequipped[0] || 'POISON';
      if (!save.unlockedGuns.includes(pickedGun)) {
        save.unlockedGuns.push(pickedGun);
        save.gunLevels[pickedGun] = 1;
      }
      this.game.tutorialStep = 'LOBBY_EQUIP';
      this.game.saveData.tutorialStep = 'LOBBY_EQUIP';
      this.game.saveGame();
      sound.playMerge();
      this.render();
      this.showGunChestRewardModal({
        isNew: true,
        gun: pickedGun,
        tier: GUN_TIERS[pickedGun] || 1,
        level: 1,
        actionText: '🎒 ' + t('equip_title'),
        onAction: () => {
          this.currentTab = 'EQUIPMENT';
          this.game.tutorialStep = 'EQUIP_GUN';
          this.game.saveData.tutorialStep = 'EQUIP_GUN';
          this.render();
        }
      });
      return;
    }

    const allGuns = Object.keys(GUN_NAMES) as GunKind[];

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

      this.game['saveGame']();
      sound.playMerge();
      this.render();
      this.showGunChestRewardModal({
        isNew: true,
        gun: pickedGun,
        tier,
        level: 1,
        actionText: '🎒 VIEW WEAPONS',
        onAction: () => {
          this.currentTab = 'EQUIPMENT';
          this.render();
        }
      });
    } else {
      const myGuns = save.unlockedGuns;
      const g = myGuns[Math.floor(Math.random() * myGuns.length)];
      const bonusLvl = type === 'ROYAL' ? 2 : 1;
      save.gunLevels[g] = (save.gunLevels[g] || 1) + bonusLvl;
      const bonusGold = type === 'ROYAL' ? 1000 : 200;
      save.permanentGold += bonusGold;
      const tier = GUN_TIERS[g] || 1;

      this.game['saveGame']();
      sound.playMerge();
      this.render();
      this.showGunChestRewardModal({
        isNew: false,
        gun: g,
        tier,
        level: save.gunLevels[g],
        bonusLvl,
        bonusGold,
        actionText: 'CONTINUE'
      });
    }
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

      /* ================= TUTORIAL OVERLAY & ANIMS ================= */
      .tutorial-overlay-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 720px;
        height: 1280px;
        pointer-events: none;
        z-index: 99999;
        overflow: hidden;
      }

      .tutorial-target-ring {
        position: absolute;
        border-radius: 26px;
        border: 4px solid #facc15;
        box-shadow: 0 0 24px #facc15, inset 0 0 16px rgba(250, 204, 21, 0.45);
        transform: translate(-50%, -50%);
        animation: tut-ring-pulse 1.3s infinite ease-out;
        pointer-events: none;
      }
      @keyframes tut-ring-pulse {
        0% { transform: translate(-50%, -50%) scale(0.92); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.32); opacity: 0; }
      }

      .tutorial-hand-pointer {
        position: absolute;
        font-size: 64px;
        transform: translate(-50%, -100%);
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 20px #38bdf8);
        animation: tut-hand-bounce 0.8s ease-in-out infinite alternate;
        pointer-events: none;
        z-index: 100000;
        user-select: none;
      }
      .tutorial-hand-pointer.point-up {
        transform: translate(-50%, 0);
        animation: tut-hand-bounce-up 0.8s ease-in-out infinite alternate;
      }
      @keyframes tut-hand-bounce {
        0% { transform: translate(-50%, -100%) translateY(0); }
        100% { transform: translate(-50%, -100%) translateY(-22px) scale(1.12); }
      }
      @keyframes tut-hand-bounce-up {
        0% { transform: translate(-50%, 0) translateY(0); }
        100% { transform: translate(-50%, 0) translateY(22px) scale(1.12); }
      }

      .tutorial-arrow-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 720px;
        height: 1280px;
        pointer-events: none;
        z-index: 99998;
        filter: drop-shadow(0 0 10px #facc15);
      }
      .tutorial-animated-arrow {
        animation: tut-arrow-dash 0.8s linear infinite;
      }
      @keyframes tut-arrow-dash {
        to {
          stroke-dashoffset: -20;
        }
      }

      .tutorial-swipe-hand {
        position: absolute;
        font-size: 64px;
        filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 22px #facc15);
        pointer-events: none;
        z-index: 100000;
        user-select: none;
        animation: tut-swipe-move 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
      @keyframes tut-swipe-move {
        0% {
          left: var(--start-x);
          top: var(--start-y);
          transform: translate(-50%, -50%) scale(1.05);
          opacity: 0;
        }
        15% {
          left: var(--start-x);
          top: var(--start-y);
          transform: translate(-50%, -50%) scale(0.92);
          opacity: 1;
        }
        70% {
          left: var(--end-x);
          top: var(--end-y);
          transform: translate(-50%, -50%) scale(0.92);
          opacity: 1;
        }
        85% {
          left: var(--end-x);
          top: var(--end-y);
          transform: translate(-50%, -50%) scale(1.08);
          opacity: 0.6;
        }
        100% {
          left: var(--end-x);
          top: var(--end-y);
          transform: translate(-50%, -50%) scale(1.08);
          opacity: 0;
        }
      }

      .tutorial-speech-bubble {
        position: absolute;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
        border: 3.5px solid #38bdf8;
        box-shadow: 0 10px 32px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.5);
        border-radius: 20px;
        padding: 12px 22px;
        text-align: center;
        pointer-events: none;
        z-index: 100001;
        min-width: 250px;
        max-width: 400px;
        animation: tut-bubble-glow 1.5s infinite alternate ease-in-out;
      }
      @keyframes tut-bubble-glow {
        0% { border-color: #38bdf8; box-shadow: 0 10px 32px rgba(0, 0, 0, 0.85), 0 0 20px rgba(56, 189, 248, 0.4); }
        100% { border-color: #facc15; box-shadow: 0 10px 32px rgba(0, 0, 0, 0.85), 0 0 30px rgba(250, 204, 21, 0.6); }
      }
      .tutorial-bubble-title {
        font-size: 19px;
        font-weight: 900;
        color: #facc15;
        letter-spacing: 0.6px;
        margin-bottom: 4px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      }
      .tutorial-bubble-desc {
        font-size: 14.5px;
        font-weight: 700;
        color: #f8fafc;
        line-height: 1.35;
      }

      /* MAIN MENU SCREEN */
      .main-menu-screen {
        width: 100%;
        height: 100%;
        position: relative;
        background: #38bdf8;
        display: flex;
        flex-direction: column;
      }

      /* ===== KID-FRIENDLY THEME (ages 5-10+) ===== */
      /* Shared chunky "candy" look: thick dark outline + solid 3D bottom edge */
      .kid-avatar, .kid-coin, .kid-round-btn, .kid-side-btn, .kid-stage-ribbon,
      .kid-play-btn, .kid-nav-btn, .modal-main-btn, .modal-sec-btn, .modal-close-corner-btn {
        font-family: "Baloo 2", "Nunito", "Arial Rounded MT Bold", "Segoe UI", sans-serif;
        cursor: pointer;
        border: 4px solid #1e293b;
        transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.12s ease;
      }
      .kid-avatar:hover, .kid-coin:hover, .kid-round-btn:hover, .kid-side-btn:hover,
      .kid-stage-ribbon:hover, .kid-nav-btn:hover, .modal-main-btn:hover, .modal-sec-btn:hover {
        filter: brightness(1.1);
        transform: translateY(-3px);
      }
      .kid-avatar:active, .kid-coin:active, .kid-round-btn:active, .kid-side-btn:active,
      .kid-stage-ribbon:active, .kid-nav-btn:active, .modal-main-btn:active, .modal-sec-btn:active {
        transform: translateY(4px) scale(0.95);
      }
      .kid-dot {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #ef4444;
        border: 4px solid #ffffff;
        box-shadow: 0 3px 0 #991b1b;
        animation: kidDotBounce 1.4s ease-in-out infinite;
      }
      @keyframes kidDotBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      /* TOP HEADER BAR */
      .top-header-bar {
        position: absolute;
        top: 14px;
        left: 0;
        right: 0;
        height: 100px;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 0 18px;
        z-index: 100;
      }

      .kid-avatar {
        position: relative;
        width: 96px;
        height: 96px;
        flex-shrink: 0;
        border-radius: 50%;
        border-width: 5px;
        background: radial-gradient(circle at 35% 30%, #fde68a 0%, #f59e0b 55%, #d97706 100%);
        box-shadow: 0 6px 0 #1e293b, inset 0 -6px 0 rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .kid-avatar-lv {
        font-size: 38px;
        font-weight: 900;
        color: #ffffff;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b, 0 4px 0 #1e293b;
      }
      .kid-avatar-star {
        position: absolute;
        bottom: -10px;
        font-size: 30px;
        filter: drop-shadow(0 2px 0 #1e293b);
      }

      .kid-currencies {
        flex: 1;
        display: flex;
        gap: 14px;
        justify-content: center;
      }
      .kid-coin {
        flex: 1;
        max-width: 210px;
        height: 68px;
        position: relative;
        border-radius: 34px;
        background: linear-gradient(180deg, #fef3c7 0%, #fde68a 100%);
        box-shadow: 0 6px 0 #1e293b;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0 20px 0 70px;
      }
      .kid-coin.gem {
        background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%);
      }
      .kid-currency-img {
        position: absolute;
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
        width: 78px;
        height: 78px;
        object-fit: contain;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
        z-index: 2;
      }
      .kid-coin-val {
        font-size: 32px;
        font-weight: 900;
        color: #1e293b;
      }

      .kid-round-btn {
        width: 84px;
        height: 84px;
        flex-shrink: 0;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #93c5fd 0%, #3b82f6 60%, #1d4ed8 100%);
        box-shadow: 0 6px 0 #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .kid-round-btn img {
        width: 62px;
        height: 62px;
        object-fit: contain;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
      }

      /* TAB CONTENT AREA */
      .tab-content-area {
        position: absolute;
        top: 124px;
        bottom: 150px;
        left: 0;
        right: 0;
        overflow: hidden;
      }

      .scrollable-tab {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        padding: 18px 20px 36px;
        background: linear-gradient(180deg, #bae6fd 0%, #e0f2fe 100%);
        border-top: 5px solid #1e293b;
      }

      /* WORLD TAB (HOME) - bright sky, big targets */
      .world-tab-screen {
        width: 100%;
        height: 100%;
        position: relative;
        background: linear-gradient(180deg, #38bdf8 0%, #7dd3fc 55%, #bae6fd 100%);
        overflow: hidden;
      }
      .kid-hills {
        position: absolute;
        left: -10%;
        right: -10%;
        bottom: -120px;
        height: 560px;
        border-radius: 50% 50% 0 0;
        background: radial-gradient(ellipse at 50% 0%, #86efac 0%, #4ade80 40%, #16a34a 100%);
        border-top: 6px solid #15803d;
      }
      .kid-cloud {
        position: absolute;
        width: 160px;
        height: 54px;
        background: #ffffff;
        border-radius: 30px;
        opacity: 0.9;
        animation: kidCloudDrift 14s ease-in-out infinite alternate;
      }
      .kid-cloud::before, .kid-cloud::after {
        content: '';
        position: absolute;
        background: #ffffff;
        border-radius: 50%;
      }
      .kid-cloud::before { width: 70px; height: 70px; top: -34px; left: 24px; }
      .kid-cloud::after { width: 54px; height: 54px; top: -24px; left: 80px; }
      .kid-cloud.c1 { top: 150px; left: 150px; }
      .kid-cloud.c2 { top: 300px; right: 140px; transform: scale(0.75); animation-duration: 18s; }
      .kid-cloud.c3 { top: 520px; left: 170px; transform: scale(0.6); animation-duration: 22s; }
      @keyframes kidCloudDrift {
        from { margin-left: -30px; }
        to { margin-left: 30px; }
      }

      .kid-stage-ribbon {
        position: absolute;
        top: 22px;
        left: 50%;
        margin-left: -150px;
        width: 300px;
        height: 84px;
        border-radius: 42px;
        background: linear-gradient(180deg, #fde047 0%, #f59e0b 100%);
        box-shadow: 0 7px 0 #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        z-index: 50;
      }
      .kid-stage-icon { font-size: 44px; filter: drop-shadow(0 3px 0 #1e293b); }
      .kid-stage-text {
        font-size: 44px;
        font-weight: 900;
        color: #ffffff;
        text-shadow: -3px -3px 0 #1e293b, 3px -3px 0 #1e293b, -3px 3px 0 #1e293b, 3px 3px 0 #1e293b, 0 5px 0 #1e293b;
      }

      .kid-side-col {
        position: absolute;
        top: 150px;
        display: flex;
        flex-direction: column;
        gap: 26px;
        z-index: 40;
      }
      .kid-side-col.left { left: 22px; }
      .kid-side-col.right { right: 22px; }
      .kid-side-btn {
        position: relative;
        width: 116px;
        height: 116px;
        border-radius: 30px;
        background: linear-gradient(180deg, #ffffff 0%, #e0f2fe 100%);
        box-shadow: 0 7px 0 #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .kid-side-btn img {
        width: 88px;
        height: 88px;
        object-fit: contain;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
      }

      .kid-hero-art {
        position: absolute;
        left: 50%;
        top: 175px;
        width: 460px;
        height: 440px;
        margin-left: -230px;
        object-fit: contain;
        filter: drop-shadow(0 20px 24px rgba(15, 23, 42, 0.40));
        animation: kidBob 3.5s ease-in-out infinite alternate;
        pointer-events: none;
      }
      @keyframes kidBob {
        from { transform: translateY(0); }
        to { transform: translateY(-16px); }
      }

      /* BỘ CHUYỂN ẢI DƯỚI LÂU ĐÀI */
      .kid-stage-switch-row {
        position: absolute;
        left: 50%;
        bottom: 204px;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        z-index: 60;
      }

      .kid-stage-arrow-btn {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #7dd3fc 0%, #0284c7 60%, #0369a1 100%);
        border: 5px solid #1e293b;
        box-shadow: 0 7px 0 #1e293b, inset 0 -4px 0 rgba(0,0,0,0.15);
        color: #ffffff;
        font-size: 34px;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b;
        transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.12s ease;
      }
      .kid-stage-arrow-btn:hover:not(.disabled) {
        filter: brightness(1.12);
        transform: translateY(-3px);
      }
      .kid-stage-arrow-btn:active:not(.disabled) {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #1e293b;
      }
      .kid-stage-arrow-btn.disabled {
        background: #94a3b8;
        box-shadow: 0 4px 0 #1e293b;
        opacity: 0.55;
        cursor: not-allowed;
      }

      .kid-stage-card {
        min-width: 320px;
        height: 80px;
        border-radius: 40px;
        background: linear-gradient(180deg, #ffffff 0%, #fef08a 60%, #fde047 100%);
        border: 5px solid #1e293b;
        box-shadow: 0 7px 0 #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 0 24px;
        cursor: pointer;
        transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .kid-stage-card:hover { transform: translateY(-3px); filter: brightness(1.08); }
      .kid-stage-card:active { transform: translateY(4px); box-shadow: 0 2px 0 #1e293b; }
      .kid-stage-card.locked {
        background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
      }

      .kid-stage-card-icon {
        font-size: 40px;
        line-height: 1;
        filter: drop-shadow(0 2px 0 rgba(0,0,0,0.25));
      }

      .kid-stage-card-text {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .kid-stage-card-title {
        font-size: 24px;
        font-weight: 900;
        color: #1e293b;
        line-height: 1.1;
      }

      .kid-stage-card-name {
        font-size: 18px;
        font-weight: 800;
        color: #0284c7;
      }
      .kid-stage-card.locked .kid-stage-card-name {
        color: #ef4444;
      }

      .kid-play-btn {
        position: absolute;
        left: 50%;
        bottom: 40px;
        width: 460px;
        height: 140px;
        margin-left: -230px;
        border-width: 6px;
        border-radius: 70px;
        background: linear-gradient(180deg, #86efac 0%, #22c55e 50%, #16a34a 100%);
        box-shadow: 0 10px 0 #1e293b, inset 0 -10px 0 rgba(0,0,0,0.15), inset 0 8px 0 rgba(255,255,255,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 22px;
        font-size: 64px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: 2px;
        text-shadow: -3px -3px 0 #1e293b, 3px -3px 0 #1e293b, -3px 3px 0 #1e293b, 3px 3px 0 #1e293b, 0 6px 0 #1e293b;
        animation: kidPlayPulse 1.6s ease-in-out infinite;
        z-index: 60;
      }
      .kid-play-btn:hover { filter: brightness(1.08); }
      .kid-play-btn:active { animation: none; transform: translateY(8px) scale(0.97); box-shadow: 0 2px 0 #1e293b; }
      .kid-play-icon { font-size: 58px; }
      @keyframes kidPlayPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      /* BOTTOM NAVIGATION BAR (5 big icon tabs) */
      .bottom-nav-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 150px;
        background: linear-gradient(180deg, #1e3a8a 0%, #172554 100%);
        border-top: 6px solid #1e293b;
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 0 10px 10px;
        z-index: 100;
      }
      .kid-nav-btn {
        position: relative;
        width: 116px;
        height: 116px;
        border-radius: 28px;
        background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
        box-shadow: 0 6px 0 #0f172a;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .kid-nav-btn img {
        width: 76px;
        height: 76px;
        object-fit: contain;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
      }
      .kid-nav-label { display: none; }
      .kid-nav-btn.active {
        background: linear-gradient(180deg, #fde047 0%, #f59e0b 100%);
        transform: translateY(-22px) scale(1.1);
        box-shadow: 0 8px 0 #1e293b, 0 0 0 6px rgba(253, 224, 71, 0.35);
      }
      .kid-nav-btn.active img { width: 70px; height: 70px; }
      .kid-nav-btn.active .kid-nav-label {
        display: block;
        position: absolute;
        bottom: -30px;
        font-size: 22px;
        font-weight: 900;
        color: #ffffff;
        white-space: nowrap;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b;
      }

      /* ===== KID-FRIENDLY TAB SECTION PILLS & CHIPS ===== */
      .kid-section-pill {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(180deg, #fde047 0%, #f59e0b 100%);
        border: 4px solid #1e293b;
        border-radius: 22px;
        padding: 10px 20px;
        font-size: 26px;
        font-weight: 900;
        color: #ffffff;
        box-shadow: 0 6px 0 #1e293b;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b, 0 3px 0 #1e293b;
        margin-bottom: 14px;
      }

      .kid-chip-row {
        display: flex;
        gap: 8px;
      }

      .kid-chip {
        background: #ffffff;
        border: 3px solid #1e293b;
        border-radius: 14px;
        padding: 4px 12px;
        font-size: 16px;
        font-weight: 900;
        color: #1e293b;
        text-shadow: none;
        box-shadow: 0 3px 0 #1e293b;
      }
      .kid-chip.gold {
        background: #fef08a;
      }

      /* ===== SHOP TAB (KID-FRIENDLY 5-10+) ===== */
      .kid-shop-list {
        display: flex;
        flex-direction: column;
        gap: 18px;
        margin-top: 8px;
      }

      .kid-shop-card {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px 22px;
        border-radius: 28px;
        border: 5px solid #1e293b;
        box-shadow: 0 8px 0 #1e293b;
        position: relative;
      }
      .kid-shop-card.bronze {
        background: linear-gradient(180deg, #ffffff 0%, #e0f2fe 100%);
      }
      .kid-shop-card.royal {
        background: linear-gradient(180deg, #fef08a 0%, #f59e0b 100%);
      }
      .kid-shop-card.daily {
        background: linear-gradient(180deg, #dcfce7 0%, #86efac 100%);
      }

      .kid-shop-icon-btn {
        width: 118px;
        height: 118px;
        flex-shrink: 0;
        border-radius: 26px;
        background: radial-gradient(circle at 35% 30%, #ffffff 0%, #bae6fd 100%);
        border: 4px solid #1e293b;
        box-shadow: 0 6px 0 #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        transition: transform 0.12s ease;
      }
      .kid-shop-card.royal .kid-shop-icon-btn {
        background: radial-gradient(circle at 35% 30%, #fef9c3 0%, #c084fc 100%);
      }
      .kid-shop-card.daily .kid-shop-icon-btn {
        background: radial-gradient(circle at 35% 30%, #ffffff 0%, #4ade80 100%);
      }
      .kid-shop-icon-btn:hover { transform: scale(1.05); }
      .kid-shop-icon-btn:active { transform: translateY(3px) scale(0.96); }

      .kid-shop-icon-btn img {
        width: 88px;
        height: 88px;
        object-fit: contain;
        filter: drop-shadow(0 4px 0 rgba(0,0,0,0.35));
      }

      .kid-info-badge {
        position: absolute;
        bottom: -8px;
        right: -8px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #38bdf8;
        border: 3.5px solid #1e293b;
        box-shadow: 0 3px 0 #1e293b;
        color: #ffffff;
        font-size: 20px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        text-shadow: -1.5px -1.5px 0 #1e293b, 1.5px -1.5px 0 #1e293b, -1.5px 1.5px 0 #1e293b, 1.5px 1.5px 0 #1e293b;
      }

      .kid-shop-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .kid-shop-title {
        font-size: 28px;
        font-weight: 900;
        color: #ffffff;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b, 0 4px 0 #1e293b;
      }

      .kid-buy-btn {
        height: 68px;
        border-radius: 22px;
        border: 4px solid #1e293b;
        box-shadow: 0 6px 0 #1e293b;
        font-size: 26px;
        font-weight: 900;
        color: #ffffff;
        cursor: pointer;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b, 0 3px 0 #1e293b;
        transition: transform 0.1s ease, filter 0.1s ease;
      }
      .kid-buy-btn.blue {
        background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
      }
      .kid-buy-btn.purple {
        background: linear-gradient(180deg, #c084fc 0%, #7e22ce 100%);
      }
      .kid-buy-btn.green {
        background: linear-gradient(180deg, #4ade80 0%, #16a34a 100%);
      }
      .kid-buy-btn.disabled {
        background: #94a3b8;
        color: #e2e8f0;
        cursor: not-allowed;
        opacity: 0.75;
      }
      .kid-buy-btn:hover:not(.disabled) { filter: brightness(1.1); transform: translateY(-2px); }
      .kid-buy-btn:active:not(.disabled) { transform: translateY(4px); box-shadow: 0 2px 0 #1e293b; }

      /* ===== EQUIPMENT / GUN TAB (KID-FRIENDLY 5-10+) ===== */
      .kid-loadout-panel {
        background: #ffffff;
        border: 4px solid #1e293b;
        border-radius: 26px;
        padding: 14px;
        box-shadow: 0 7px 0 #1e293b;
      }

      .kid-slot-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .kid-equip-slot {
        height: 126px;
        border-radius: 22px;
        border: 4px solid #1e293b;
        box-shadow: 0 5px 0 #1e293b;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        transition: transform 0.12s ease;
      }
      .kid-equip-slot:hover { transform: translateY(-3px); }
      .kid-equip-slot:active { transform: translateY(3px); }

      .kid-equip-slot.empty {
        background: #f1f5f9;
        border-style: dashed;
        border-color: #64748b;
        box-shadow: none;
        cursor: default;
      }
      .empty-plus {
        font-size: 46px;
        font-weight: 900;
        color: #94a3b8;
      }

      .tier-bg-1 { background: linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%); }
      .tier-bg-2 { background: linear-gradient(180deg, #bae6fd 0%, #38bdf8 100%); }
      .tier-bg-3 { background: linear-gradient(180deg, #e9d5ff 0%, #a855f7 100%); }
      .tier-bg-4 { background: linear-gradient(180deg, #fef08a 0%, #f59e0b 100%); }
      .tier-bg-5 { background: linear-gradient(180deg, #fecaca 0%, #ef4444 100%); }

      .kid-slot-remove {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #ef4444;
        border: 3px solid #1e293b;
        box-shadow: 0 3px 0 #1e293b;
        color: #ffffff;
        font-size: 16px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .kid-slot-img {
        width: 68px;
        height: 68px;
        object-fit: contain;
        filter: drop-shadow(0 4px 0 rgba(0,0,0,0.35));
      }

      .kid-slot-lvl {
        margin-top: 4px;
        background: #1e293b;
        color: #fde047;
        font-size: 15px;
        font-weight: 900;
        padding: 2px 10px;
        border-radius: 10px;
      }

      /* ===== KID INVENTORY CONTAINER & SLANTED SEAMLESS TABS ===== */
      .kid-inventory-container {
        width: 100%;
        margin-top: 10px;
        display: flex;
        flex-direction: column;
      }

      .kid-tier-tab-bar {
        display: flex;
        width: 100%;
        height: 52px;
        margin-bottom: -4px; /* Sits directly on top of board's top border */
        position: relative;
        z-index: 10;
        padding: 0 8px;
        box-sizing: border-box;
        gap: 2px;
      }

      .kid-tier-tab {
        flex: 1;
        height: 48px;
        border: 3.5px solid #1e293b;
        border-bottom: 4px solid #1e293b;
        border-radius: 12px 12px 0 0;
        transform: skewX(-14deg);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font-family: inherit;
        font-weight: 900;
        box-shadow: 0 -2px 0 rgba(0, 0, 0, 0.1);
        transition: transform 0.12s ease, filter 0.12s ease;
        position: relative;
      }
      .kid-tier-tab:hover {
        filter: brightness(1.1);
      }

      .kid-tier-tab .tab-content {
        transform: skewX(14deg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 900;
        letter-spacing: -0.5px;
        text-shadow: -1.5px -1.5px 0 #1e293b, 1.5px -1.5px 0 #1e293b, -1.5px 1.5px 0 #1e293b, 1.5px 1.5px 0 #1e293b;
      }

      /* Inactive & Active colors per tab */
      .kid-tier-tab.tab-tier-all {
        background: #334155;
        color: #cbd5e1;
      }
      .kid-tier-tab.tab-tier-all.active {
        background: #1e293b;
        color: #fde047;
      }

      .kid-tier-tab.tab-tier-1 {
        background: #94a3b8;
        color: #f8fafc;
      }
      .kid-tier-tab.tab-tier-1.active {
        background: #64748b;
        color: #ffffff;
      }

      .kid-tier-tab.tab-tier-2 {
        background: #38bdf8;
        color: #e0f2fe;
      }
      .kid-tier-tab.tab-tier-2.active {
        background: #0284c7;
        color: #ffffff;
      }

      .kid-tier-tab.tab-tier-3 {
        background: #c084fc;
        color: #faf5ff;
      }
      .kid-tier-tab.tab-tier-3.active {
        background: #9333ea;
        color: #ffffff;
      }

      .kid-tier-tab.tab-tier-4 {
        background: #fbbf24;
        color: #fefce8;
      }
      .kid-tier-tab.tab-tier-4.active {
        background: #d97706;
        color: #ffffff;
      }

      .kid-tier-tab.tab-tier-5 {
        background: #f87171;
        color: #fef2f2;
      }
      .kid-tier-tab.tab-tier-5.active {
        background: #dc2626;
        color: #ffffff;
      }

      /* ACTIVE TAB SEAMLESSLY CONNECTS INTO BOARD */
      .kid-tier-tab.active {
        height: 56px;
        margin-top: -6px;
        border-bottom: 4px solid transparent;
        z-index: 20;
        filter: brightness(1.05);
      }
      .kid-tier-tab.active::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: -2px;
        right: -2px;
        height: 8px;
        background: inherit;
        z-index: 25;
      }

      /* THE INVENTORY BOARD */
      .kid-inventory-board {
        background: rgba(255, 255, 255, 0.95);
        border: 4px solid #1e293b;
        border-radius: 20px;
        padding: 18px 14px 24px;
        box-shadow: 0 8px 0 #1e293b;
        position: relative;
        z-index: 5;
      }
      .kid-inventory-board.tier-board-1 { border-top-color: #64748b; }
      .kid-inventory-board.tier-board-2 { border-top-color: #0284c7; }
      .kid-inventory-board.tier-board-3 { border-top-color: #9333ea; }
      .kid-inventory-board.tier-board-4 { border-top-color: #d97706; }
      .kid-inventory-board.tier-board-5 { border-top-color: #dc2626; }

      /* GUN INVENTORY GRID */
      .kid-gun-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .kid-gun-card {
        background: #ffffff;
        border: 4px solid #1e293b;
        border-radius: 26px;
        padding: 14px;
        box-shadow: 0 7px 0 #1e293b;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: transform 0.12s ease;
      }

      /* TIER 1: Common / Slate-White */
      .kid-gun-card.tier-card-1 {
        background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
        border: 4px solid #475569;
        box-shadow: 0 7px 0 #1e293b;
      }
      .kid-gun-card.tier-card-1 .kid-gun-preview {
        background: radial-gradient(circle at 50% 50%, #ffffff 25%, #94a3b8 100%);
        border: 3px solid #64748b;
      }

      /* TIER 2: Rare / Radiant Sky Blue */
      .kid-gun-card.tier-card-2 {
        background: linear-gradient(180deg, #e0f2fe 0%, #7dd3fc 60%, #38bdf8 100%);
        border: 4px solid #0284c7;
        box-shadow: 0 7px 0 #075985;
      }
      .kid-gun-card.tier-card-2 .kid-gun-preview {
        background: radial-gradient(circle at 50% 50%, #ffffff 25%, #38bdf8 100%);
        border: 3px solid #0284c7;
      }

      /* TIER 3: Epic / Royal Purple */
      .kid-gun-card.tier-card-3 {
        background: linear-gradient(180deg, #f5d0fe 0%, #d8b4fe 60%, #c084fc 100%);
        border: 4px solid #9333ea;
        box-shadow: 0 7px 0 #581c87;
      }
      .kid-gun-card.tier-card-3 .kid-gun-preview {
        background: radial-gradient(circle at 50% 50%, #ffffff 25%, #c084fc 100%);
        border: 3px solid #9333ea;
      }

      /* TIER 4: Legendary / Bright Gold & Amber */
      .kid-gun-card.tier-card-4 {
        background: linear-gradient(180deg, #fef9c3 0%, #fde047 60%, #f59e0b 100%);
        border: 4px solid #d97706;
        box-shadow: 0 7px 0 #78350f;
      }
      .kid-gun-card.tier-card-4 .kid-gun-preview {
        background: radial-gradient(circle at 50% 50%, #ffffff 25%, #fde047 100%);
        border: 3px solid #d97706;
      }

      /* TIER 5: Mythic / Crimson Ruby */
      .kid-gun-card.tier-card-5 {
        background: linear-gradient(180deg, #fee2e2 0%, #fca5a5 60%, #ef4444 100%);
        border: 4px solid #dc2626;
        box-shadow: 0 7px 0 #7f1d1d;
      }
      .kid-gun-card.tier-card-5 .kid-gun-preview {
        background: radial-gradient(circle at 50% 50%, #ffffff 25%, #f87171 100%);
        border: 3px solid #dc2626;
      }

      .kid-gun-card.locked {
        opacity: 0.92;
      }
      .kid-gun-card.locked .kid-gun-preview {
        background: rgba(148, 163, 184, 0.45) !important;
      }

      .kid-gun-top {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .kid-gun-stars {
        font-size: 15px;
        letter-spacing: -2px;
        filter: drop-shadow(0 2px 0 #1e293b);
      }
      .kid-tier-badge {
        font-size: 13px;
        font-weight: 900;
        padding: 2px 8px;
        border-radius: 10px;
        border: 2px solid #1e293b;
        color: #ffffff;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
      }
      .kid-tier-badge.tier-badge-1 { background: #64748b; }
      .kid-tier-badge.tier-badge-2 { background: #0284c7; }
      .kid-tier-badge.tier-badge-3 { background: #9333ea; }
      .kid-tier-badge.tier-badge-4 { background: #d97706; }
      .kid-tier-badge.tier-badge-5 { background: #dc2626; }

      .kid-gun-lvl-pill {
        background: #1e293b;
        color: #fde047;
        font-size: 14px;
        font-weight: 900;
        padding: 3px 8px;
        border-radius: 12px;
      }

      .kid-gun-preview {
        width: 100%;
        height: 104px;
        border-radius: 20px;
        background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(148,163,184,0.28) 100%);
        border: 3px solid #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        margin-bottom: 8px;
      }
      .kid-gun-preview img {
        width: 78px;
        height: 78px;
        object-fit: contain;
        filter: drop-shadow(0 5px 0 rgba(0,0,0,0.35));
        transition: transform 0.12s ease;
      }
      .kid-gun-preview:hover img { transform: scale(1.08); }
      .kid-gun-preview img.is-locked-img {
        filter: grayscale(1) brightness(0.35) opacity(0.6);
      }

      .kid-equipped-check {
        position: absolute;
        top: 6px;
        left: 6px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #22c55e;
        border: 3px solid #1e293b;
        color: #ffffff;
        font-size: 18px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 0 #1e293b;
      }

      .kid-gun-name {
        font-size: 20px;
        font-weight: 900;
        color: #1e293b;
        margin-bottom: 10px;
        text-align: center;
      }

      .kid-gun-actions {
        width: 100%;
        display: flex;
        gap: 8px;
      }

      .kid-gun-btn {
        flex: 1;
        height: 50px;
        border-radius: 16px;
        border: 3.5px solid #1e293b;
        box-shadow: 0 4px 0 #1e293b;
        font-size: 18px;
        font-weight: 900;
        color: #ffffff;
        cursor: pointer;
        text-shadow: -1.5px -1.5px 0 #1e293b, 1.5px -1.5px 0 #1e293b, -1.5px 1.5px 0 #1e293b, 1.5px 1.5px 0 #1e293b;
        transition: transform 0.1s ease;
      }
      .kid-gun-btn:active:not(.disabled) {
        transform: translateY(3px);
        box-shadow: 0 1px 0 #1e293b;
      }
      .kid-gun-btn.equip {
        background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
      }
      .kid-gun-btn.equipped {
        background: linear-gradient(180deg, #4ade80 0%, #16a34a 100%);
      }
      .kid-gun-btn.upgrade {
        background: linear-gradient(180deg, #fde047 0%, #f59e0b 100%);
      }
      .kid-gun-btn.locked-btn, .kid-gun-btn.disabled {
        background: #94a3b8;
        cursor: not-allowed;
        opacity: 0.75;
      }

      /* ===== TALENTS TAB (KID-FRIENDLY 5-10+) ===== */
      .talents-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .kid-talent-card {
        background: #ffffff;
        border: 4px solid #1e293b;
        border-radius: 26px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 7px 0 #1e293b;
      }

      .kid-talent-icon {
        width: 82px;
        height: 82px;
        flex-shrink: 0;
        border-radius: 22px;
        background: linear-gradient(180deg, #fef08a 0%, #f59e0b 100%);
        border: 4px solid #1e293b;
        box-shadow: 0 4px 0 #1e293b;
        font-size: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .kid-talent-body {
        flex: 1;
      }
      .kid-talent-title {
        font-size: 22px;
        font-weight: 900;
        color: #1e293b;
      }
      .kid-talent-sub {
        font-size: 16px;
        font-weight: 900;
        color: #0284c7;
        margin: 2px 0 8px;
      }
      .talent-progress {
        width: 100%;
        height: 16px;
        background: #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
        border: 3px solid #1e293b;
      }
      .talent-fill {
        height: 100%;
        background: linear-gradient(90deg, #22c55e, #4ade80);
      }

      .kid-talent-btn {
        height: 60px;
        min-width: 130px;
        padding: 0 18px;
        border-radius: 18px;
        border: 4px solid #1e293b;
        box-shadow: 0 5px 0 #1e293b;
        background: linear-gradient(180deg, #4ade80 0%, #16a34a 100%);
        color: #ffffff;
        font-size: 22px;
        font-weight: 900;
        cursor: pointer;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b;
      }
      .kid-talent-btn.is-max, .kid-talent-btn.disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

      /* ===== MODES TAB (KID-FRIENDLY 5-10+) ===== */
      .mode-toggle-row {
        display: flex;
        gap: 14px;
        margin-bottom: 16px;
      }
      .kid-mode-tab {
        flex: 1;
        height: 68px;
        border-radius: 22px;
        border: 4px solid #1e293b;
        box-shadow: 0 6px 0 #1e293b;
        background: #ffffff;
        color: #1e293b;
        font-size: 22px;
        font-weight: 900;
        cursor: pointer;
      }
      .kid-mode-tab.active {
        background: linear-gradient(180deg, #fde047 0%, #f59e0b 100%);
        color: #ffffff;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b;
      }

      .map-cards-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .kid-map-card {
        background: #ffffff;
        border: 4px solid #1e293b;
        border-radius: 22px;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 6px 0 #1e293b;
        cursor: pointer;
      }
      .kid-map-card.selected {
        background: linear-gradient(180deg, #dcfce7 0%, #86efac 100%);
      }
      .kid-map-card.locked {
        background: #cbd5e1;
        opacity: 0.7;
        cursor: not-allowed;
      }
      .kid-map-icon {
        font-size: 40px;
      }
      .kid-map-info { flex: 1; }
      .kid-map-name {
        font-size: 22px;
        font-weight: 900;
        color: #1e293b;
      }
      .kid-map-status {
        font-size: 16px;
        font-weight: 900;
        color: #15803d;
      }

      .kid-surv-card {
        background: #ffffff;
        border: 4px solid #1e293b;
        border-radius: 26px;
        padding: 28px;
        text-align: center;
        box-shadow: 0 7px 0 #1e293b;
      }
      .kid-surv-icon { font-size: 64px; }
      .surv-title { font-size: 28px; font-weight: 900; color: #1e293b; margin: 8px 0; }
      .surv-record { font-size: 22px; font-weight: 900; color: #d97706; }

      /* ===== IN-GAME BATTLE HUD (COMPACT SINGLE-ROW TOP BAR) ===== */
      .battle-hud-screen {
        width: 100%;
        height: 100%;
        position: relative;
        pointer-events: none;
      }

      .battle-top-bar {
        position: absolute;
        top: 10px;
        left: 12px;
        right: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: auto;
      }

      .battle-menu-btn, .battle-speed-btn {
        height: 54px;
        min-width: 60px;
        padding: 0 14px;
        background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
        border: 4px solid #1e293b;
        border-radius: 18px;
        color: #ffffff;
        font-size: 22px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 5px 0 #1e293b;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b;
      }
      .battle-menu-btn:active, .battle-speed-btn:active {
        transform: translateY(3px);
        box-shadow: 0 2px 0 #1e293b;
      }

      .battle-wave-badge {
        height: 54px;
        padding: 0 14px;
        display: flex;
        align-items: center;
        background: linear-gradient(180deg, #fde047 0%, #f59e0b 100%);
        border: 4px solid #1e293b;
        border-radius: 18px;
        font-size: 20px;
        font-weight: 900;
        color: #ffffff;
        box-shadow: 0 5px 0 #1e293b;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b;
        white-space: nowrap;
      }

      .battle-hp-pill {
        flex: 1;
        height: 54px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #1e293b;
        border: 4px solid #1e293b;
        border-radius: 18px;
        padding: 0 12px;
        box-shadow: 0 5px 0 #0f172a;
        position: relative;
      }

      .hp-icon {
        font-size: 24px;
        line-height: 1;
      }

      .hp-bar-track {
        flex: 1;
        height: 24px;
        background: #090d16;
        border: 2.5px solid #475569;
        border-radius: 12px;
        overflow: hidden;
      }

      .hp-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
        transition: width 0.2s ease;
      }

      .hp-text {
        font-size: 16px;
        font-weight: 900;
        color: #ffffff;
        text-shadow: 0 2px 4px #000000;
        white-space: nowrap;
      }

      /* BATTLE BOTTOM BAR */
      .battle-bottom-bar {
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        height: 96px;
        display: flex;
        align-items: flex-end;
        gap: 16px;
        pointer-events: auto;
      }

      /* Khối nút MUA + phần mở rộng hiển thị TIỀN nối liền phía trên */
      .roll-buy-wrapper {
        flex: 1.05;
        height: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }

      .battle-gold-extension {
        position: absolute;
        bottom: calc(100% - 5px);
        left: 0;
        right: 0;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: linear-gradient(180deg, #fffbeb 0%, #fef08a 45%, #facc15 100%);
        border: 5px solid #1e293b;
        border-bottom: 4px dashed #92400e;
        border-radius: 26px 26px 0 0;
        padding: 0 18px;
        box-shadow: inset 0 4px 0 #ffffff;
        z-index: 2;
      }

      .gold-ext-icon {
        font-size: 42px;
        line-height: 1;
        filter: drop-shadow(0 3px 0 #1e293b);
      }

      .gold-ext-text {
        font-size: 42px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: 1px;
        text-shadow: -2.5px -2.5px 0 #1e293b, 2.5px -2.5px 0 #1e293b, -2.5px 2.5px 0 #1e293b, 2.5px 2.5px 0 #1e293b, 0 4px 0 #1e293b;
      }

      .chunky-roll-btn {
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, #fde047 0%, #f59e0b 100%);
        border: 5px solid #1e293b;
        border-radius: 0 0 26px 26px;
        color: #ffffff;
        cursor: pointer;
        box-shadow: 0 8px 0 #1e293b;
        transition: transform 0.1s ease, filter 0.1s ease;
        position: relative;
        z-index: 1;
      }
      .chunky-roll-btn:hover:not(.disabled) {
        filter: brightness(1.08);
      }
      .chunky-roll-btn:active:not(.disabled) {
        transform: translateY(5px);
        box-shadow: 0 3px 0 #1e293b;
      }
      .chunky-roll-btn.disabled {
        background: #94a3b8;
        cursor: not-allowed;
        opacity: 0.82;
      }

      .roll-btn-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      .roll-icon { font-size: 40px; filter: drop-shadow(0 3px 0 #1e293b); }
      .roll-label {
        font-size: 28px;
        font-weight: 900;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b, 0 3px 0 #1e293b;
      }
      .roll-price {
        background: #1e293b;
        color: #fde047;
        padding: 5px 14px;
        border-radius: 16px;
        font-size: 22px;
        font-weight: 900;
      }

      .chunky-wave-btn {
        flex: 1.2;
        height: 100%;
        background: linear-gradient(180deg, #4ade80 0%, #16a34a 100%);
        border: 5px solid #1e293b;
        border-radius: 26px;
        color: #ffffff;
        font-size: 28px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 8px 0 #1e293b;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b, 0 4px 0 #1e293b;
        transition: transform 0.1s ease, filter 0.1s ease;
      }
      .chunky-wave-btn:hover:not(.in-wave) {
        filter: brightness(1.08);
        transform: translateY(-2px);
      }
      .chunky-wave-btn:active:not(.in-wave) {
        transform: translateY(5px);
        box-shadow: 0 3px 0 #1e293b;
      }
      .chunky-wave-btn.in-wave {
        background: #64748b;
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

      /* IN-GAME NOTIFICATION MODAL DIALOG */
      .game-alert-overlay {
        position: absolute;
        inset: 0;
        background: rgba(4, 7, 16, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        pointer-events: auto;
        animation: alertFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .game-alert-overlay.fade-out {
        opacity: 0;
        transition: opacity 0.16s ease;
      }
      .game-alert-card {
        width: 530px;
        max-width: 92%;
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border: 3.5px solid #f59e0b;
        border-radius: 22px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.95), 0 0 28px rgba(245, 158, 11, 0.38), inset 0 2px 4px rgba(254, 240, 138, 0.25);
        padding: 28px 24px 24px;
        position: relative;
        overflow: hidden;
        animation: alertPopIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .game-alert-glow {
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        height: 120px;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
        pointer-events: none;
      }
      .game-alert-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 16px;
        border-bottom: 2px solid rgba(245, 158, 11, 0.35);
        padding-bottom: 14px;
      }
      .game-alert-icon {
        font-size: 30px;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.7));
      }
      .game-alert-title {
        font-size: 21px;
        font-weight: 900;
        color: #fde047;
        text-shadow: 0 2px 8px rgba(0,0,0,0.85);
        letter-spacing: 0.5px;
      }
      .game-alert-body {
        color: #f8fafc;
        font-size: 15.5px;
        line-height: 1.65;
        text-align: center;
        white-space: pre-line;
        margin-bottom: 24px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.7);
        max-height: 400px;
        overflow-y: auto;
        padding: 0 8px;
      }
      .game-alert-footer {
        display: flex;
        justify-content: center;
      }
      .game-alert-btn {
        min-width: 170px;
        height: 50px;
        background: linear-gradient(180deg, #22c55e 0%, #15803d 100%);
        border: 2px solid #86efac;
        border-radius: 14px;
        color: #ffffff;
        font-size: 17px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 5px 0 #14532d, 0 8px 18px rgba(0,0,0,0.6);
        transition: transform 0.08s ease, filter 0.08s ease;
      }
      .game-alert-btn:hover {
        filter: brightness(1.15);
        transform: translateY(-2px);
      }
      .game-alert-btn:active {
        transform: translateY(4px);
        box-shadow: 0 1px 0 #14532d;
      }

      /* DEV HACK BUTTON */
      .dev-hack-btn {
        background: linear-gradient(180deg, #f59e0b 0%, #b45309 100%);
        border: 2px solid #fef08a;
        border-radius: 12px;
        color: #ffffff;
        font-weight: 900;
        font-size: 12px;
        padding: 8px 12px;
        cursor: pointer;
        box-shadow: 0 3px 0 #78350f, 0 4px 10px rgba(0,0,0,0.5);
        white-space: nowrap;
        animation: devHackPulse 1.8s infinite alternate;
      }
      .dev-hack-btn:hover {
        filter: brightness(1.2);
        transform: translateY(-1px);
      }
      .dev-hack-btn:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 #78350f;
      }
      @keyframes devHackPulse {
        from { transform: scale(1); filter: brightness(1); }
        to { transform: scale(1.05); filter: brightness(1.22); }
      }

      @keyframes alertFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes alertPopIn {
        from { transform: scale(0.82); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes gachaPulseAura {
        0% { transform: scale(0.96); opacity: 0.88; }
        100% { transform: scale(1.04); opacity: 1; }
      }
      @keyframes gachaFloatGun {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-7px) rotate(2deg); }
        100% { transform: translateY(0px) rotate(-1deg); }
      }

      /* IN-GAME MODAL PANEL CARD (kid style: big icons, big buttons, few words) */
      .game-panel-overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        pointer-events: auto;
        animation: alertFadeIn 0.18s ease-out;
      }
      .game-panel-overlay.fade-out {
        opacity: 0;
        transition: opacity 0.16s ease;
      }
      .game-panel-card {
        width: 600px;
        max-width: 92%;
        background: linear-gradient(180deg, #ffffff 0%, #e0f2fe 100%);
        border: 6px solid #1e293b;
        border-radius: 40px;
        box-shadow: 0 12px 0 #1e293b;
        padding: 0 30px 30px;
        position: relative;
        animation: alertPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: "Baloo 2", "Nunito", "Arial Rounded MT Bold", "Segoe UI", sans-serif;
        color: #1e293b;
      }
      .game-panel-glow { display: none; }
      .modal-close-corner-btn {
        position: absolute;
        top: -26px;
        right: -26px;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fca5a5 0%, #ef4444 60%, #b91c1c 100%);
        box-shadow: 0 5px 0 #1e293b;
        color: #ffffff;
        font-size: 34px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        z-index: 2;
      }
      .modal-close-corner-btn:hover { transform: scale(1.1); }
      .modal-card-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin: -64px 0 20px;
      }
      .modal-header-pixel-img, .modal-header-icon {
        width: 128px;
        height: 128px;
        border-radius: 50%;
        background: linear-gradient(180deg, #fde047 0%, #f59e0b 100%);
        border: 6px solid #1e293b;
        box-shadow: 0 6px 0 #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-header-pixel-img { object-fit: contain; padding: 14px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25)); }
      .modal-header-icon { font-size: 68px; }
      .modal-header-titles { display: flex; flex-direction: column; align-items: center; }
      .modal-title {
        font-size: 40px;
        font-weight: 900;
        color: #ffffff;
        text-align: center;
        text-shadow: -3px -3px 0 #1e293b, 3px -3px 0 #1e293b, -3px 3px 0 #1e293b, 3px 3px 0 #1e293b, 0 5px 0 #1e293b;
      }
      .modal-subtitle { font-size: 20px; font-weight: 800; color: #475569; }
      .modal-items-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
        margin-bottom: 22px;
      }
      .modal-item-card {
        width: 150px;
        min-height: 150px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: #ffffff;
        border: 4px solid #1e293b;
        border-radius: 26px;
        box-shadow: 0 6px 0 #1e293b;
        padding: 12px 8px;
      }
      .modal-item-card.item-highlight { background: linear-gradient(180deg, #fef9c3 0%, #fde68a 100%); }
      .item-icon { font-size: 56px; line-height: 1; }
      .item-info { display: flex; flex-direction: column; align-items: center; }
      .item-label { display: none; }
      .item-value {
        font-size: 28px;
        font-weight: 900;
        color: #1e293b;
        text-align: center;
        line-height: 1.1;
      }
      .modal-desc-box {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.4;
        color: #1e293b;
        text-align: center;
        white-space: pre-line;
        max-height: 420px;
        overflow-y: auto;
        margin-bottom: 24px;
      }
      .modal-buttons-row {
        display: flex;
        gap: 16px;
        justify-content: center;
      }
      .modal-main-btn, .modal-sec-btn {
        flex: 1;
        max-width: 320px;
        height: 92px;
        border-radius: 46px;
        font-size: 34px;
        font-weight: 900;
        color: #ffffff;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b, 0 4px 0 #1e293b;
        box-shadow: 0 7px 0 #1e293b;
      }
      .modal-main-btn { background: linear-gradient(180deg, #86efac 0%, #22c55e 50%, #16a34a 100%); }
      .modal-sec-btn { background: linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 100%); }

      /* BATTLE PAUSE MODAL */
      .pause-modal-card {
        max-width: 520px;
        padding-bottom: 34px;
      }
      .pause-menu-actions {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        margin-top: 10px;
      }
      .pause-action-btn {
        width: 100%;
        height: 74px;
        border-radius: 24px;
        border: 4px solid #1e293b;
        box-shadow: 0 6px 0 #1e293b;
        color: #ffffff;
        font-family: inherit;
        font-size: 26px;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        text-shadow: -2px -2px 0 #1e293b, 2px -2px 0 #1e293b, -2px 2px 0 #1e293b, 2px 2px 0 #1e293b, 0 3px 0 #1e293b;
        transition: transform 0.1s ease, filter 0.1s ease;
      }
      .pause-action-btn:hover {
        filter: brightness(1.08);
        transform: translateY(-2px);
      }
      .pause-action-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #1e293b;
      }
      .pause-action-btn.btn-resume {
        background: linear-gradient(180deg, #86efac 0%, #22c55e 50%, #16a34a 100%);
      }
      .pause-action-btn.btn-sound.sound-on,
      .pause-action-btn.btn-music.sound-on {
        background: linear-gradient(180deg, #93c5fd 0%, #3b82f6 50%, #1d4ed8 100%);
      }
      .pause-action-btn.btn-sound.sound-off,
      .pause-action-btn.btn-music.sound-off,
      .pause-action-btn.btn-vfx.sound-off {
        background: linear-gradient(180deg, #94a3b8 0%, #64748b 50%, #475569 100%);
      }
      .pause-action-btn.btn-vfx.sound-on {
        background: linear-gradient(180deg, #fed7aa 0%, #f97316 50%, #ea580c 100%);
      }
      .pause-action-btn.btn-quit {
        background: linear-gradient(180deg, #fca5a5 0%, #ef4444 50%, #b91c1c 100%);
      }
      .pause-btn-icon {
        font-size: 32px;
        filter: drop-shadow(0 2px 0 #1e293b);
      }

      /* SETTINGS MODAL */
      .settings-modal-card {
        max-width: 560px;
        padding-bottom: 28px;
      }
      .settings-rows-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
        margin-bottom: 24px;
        margin-top: 10px;
      }
      .settings-row-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #ffffff;
        border: 4px solid #1e293b;
        border-radius: 24px;
        box-shadow: 0 5px 0 #1e293b;
        padding: 14px 18px;
        gap: 14px;
      }
      .settings-row-info {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;
      }
      .settings-row-icon {
        font-size: 32px;
        line-height: 1;
        width: 40px;
        text-align: center;
        filter: drop-shadow(0 2px 0 rgba(0,0,0,0.15));
      }
      .settings-row-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .settings-row-title {
        font-size: 20px;
        font-weight: 900;
        color: #1e293b;
      }
      .settings-row-sub {
        font-size: 13px;
        font-weight: 700;
        color: #64748b;
      }
      .settings-toggle-btn {
        min-width: 110px;
        height: 50px;
        border-radius: 25px;
        border: 3px solid #1e293b;
        box-shadow: 0 4px 0 #1e293b;
        font-family: inherit;
        font-size: 18px;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: #ffffff;
        text-shadow: -1px -1px 0 #1e293b, 1px -1px 0 #1e293b, -1px 1px 0 #1e293b, 1px 1px 0 #1e293b;
        transition: transform 0.1s ease, filter 0.1s ease;
      }
      .settings-toggle-btn:hover {
        filter: brightness(1.08);
      }
      .settings-toggle-btn:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 #1e293b;
      }
      .settings-toggle-btn.is-on {
        background: linear-gradient(180deg, #86efac 0%, #22c55e 50%, #16a34a 100%);
      }
      .settings-toggle-btn.is-off {
        background: linear-gradient(180deg, #94a3b8 0%, #64748b 50%, #475569 100%);
      }
      .settings-flag-btn {
        min-width: 146px;
        height: 50px;
        border-radius: 25px;
        border: 3px solid #1e293b;
        box-shadow: 0 4px 0 #1e293b;
        font-family: inherit;
        font-size: 15px;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #ffffff;
        text-shadow: -1px -1px 0 #1e293b, 1px -1px 0 #1e293b, -1px 1px 0 #1e293b, 1px 1px 0 #1e293b;
        transition: transform 0.1s ease, filter 0.1s ease;
        padding: 0 14px;
      }
      .settings-flag-btn:hover {
        filter: brightness(1.08);
      }
      .settings-flag-btn:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 #1e293b;
      }
      .settings-flag-btn.lang-en {
        background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
      }
      .settings-flag-btn.lang-vi {
        background: linear-gradient(180deg, #f87171 0%, #dc2626 100%);
      }
      .settings-flag-icon {
        font-size: 24px;
        line-height: 1;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
      }
      .settings-flag-name {
        letter-spacing: 0.5px;
      }
      .settings-flag-switch-badge {
        font-size: 14px;
        background: rgba(0, 0, 0, 0.25);
        padding: 2px 6px;
        border-radius: 10px;
      }
      .settings-version-pill {
        background: #f1f5f9;
        border: 3px solid #cbd5e1;
        border-radius: 16px;
        padding: 6px 14px;
        font-size: 16px;
        font-weight: 900;
        color: #475569;
      }

      /* HONEYCOMB TALENT MATRIX */
      .talent-roll-header-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 2px solid #334155;
        border-radius: 18px;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }
      .talent-roll-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
        border: 2px solid #fef08a;
        color: #fff;
        border-radius: 14px;
        padding: 8px 18px;
        font-weight: 900;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        transition: transform 0.1s, filter 0.1s;
      }
      .talent-roll-btn:active {
        transform: scale(0.95);
      }
      .talent-roll-btn.disabled {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(0.8);
      }
      .talent-honeycomb-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 10px 0 24px;
        width: 100%;
      }
      .honeycomb-row {
        display: flex;
        justify-content: center;
        gap: 10px;
        width: 100%;
      }
      .honeycomb-cell {
        width: 82px;
        height: 94px;
        background: #1e293b;
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border: none;
        cursor: pointer;
        transition: transform 0.15s, filter 0.15s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .honeycomb-cell:hover {
        transform: translateY(-2px) scale(1.05);
      }
      .honeycomb-cell:active {
        transform: scale(0.95);
      }
      .honeycomb-cell.locked {
        background: #334155;
        opacity: 0.6;
        filter: grayscale(1);
      }
      .honeycomb-cell.tier-1 {
        background: linear-gradient(180deg, #166534 0%, #14532d 100%);
      }
      .honeycomb-cell.tier-2 {
        background: linear-gradient(180deg, #0e7490 0%, #155e75 100%);
      }
      .honeycomb-cell.tier-3 {
        background: linear-gradient(180deg, #7e22ce 0%, #581c87 100%);
      }
      .honeycomb-cell.tier-4 {
        background: linear-gradient(180deg, #b45309 0%, #78350f 100%);
      }
      .honeycomb-cell.tier-5 {
        background: linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%);
      }
      .honeycomb-cell-icon {
        font-size: 24px;
        line-height: 1;
        margin-bottom: 2px;
      }
      .honeycomb-cell-title {
        font-size: 8px;
        font-weight: 800;
        color: #f1f5f9;
        text-align: center;
        max-width: 68px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-transform: uppercase;
      }
      .honeycomb-cell-lvl {
        font-size: 10px;
        font-weight: 900;
        color: #fde047;
        margin-top: 2px;
      }

      /* TALENT ROLL AURA & MODAL */
      .talent-roll-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(10, 15, 29, 0.88);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease-out;
      }
      .talent-roll-card {
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 24px;
        width: 100%;
        max-width: 440px;
        padding: 28px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      }
      .talent-roll-aura-wrap {
        position: relative;
        width: 140px;
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 16px 0;
      }
      .talent-roll-aura-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        animation: auraPulse 2s infinite ease-in-out, auraSpin 8s infinite linear;
      }
      @keyframes auraPulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.18); opacity: 1; }
      }
      @keyframes auraSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .talent-roll-buff-icon {
        font-size: 64px;
        position: relative;
        z-index: 2;
        animation: buffBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes buffBounce {
        0% { transform: scale(0.2); opacity: 0; }
        70% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      .talent-tier-badge {
        padding: 4px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .talent-roll-name {
        font-size: 26px;
        font-weight: 900;
        color: #f8fafc;
        margin-bottom: 4px;
      }
      .talent-roll-stat {
        font-size: 16px;
        font-weight: 800;
        color: #4ade80;
        margin-bottom: 12px;
      }
      .talent-roll-explain {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 10px 16px;
        color: #94a3b8;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 20px;
        width: 100%;
      }

      /* SHOP AD BUTTONS */
      .kid-shop-ad-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        height: 52px;
        border-radius: 16px;
        border: 2.5px solid rgba(255, 255, 255, 0.35);
        font-size: 15px;
        font-weight: 900;
        color: #ffffff;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: transform 0.1s, filter 0.1s;
      }
      .kid-shop-ad-btn:active {
        transform: scale(0.96);
      }
      .kid-shop-ad-btn.bronze {
        background: linear-gradient(180deg, #d97706 0%, #b45309 100%);
      }
      .kid-shop-ad-btn.royal {
        background: linear-gradient(180deg, #9333ea 0%, #7e22ce 100%);
      }
      .kid-shop-ad-btn.gold {
        background: linear-gradient(180deg, #eab308 0%, #ca8a04 100%);
      }
      .kid-shop-ad-btn.gem {
        background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%);
      }
      .kid-shop-ad-btn .ad-tv-img {
        width: 38px;
        height: 38px;
      }
      .ad-tv-img {
        width: 32px;
        height: 32px;
        object-fit: contain;
        flex-shrink: 0;
        filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.45));
      }

      /* SIMULATED AD MODAL */
      .sim-ad-overlay {
        position: absolute;
        inset: 0;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.92);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease-out;
      }
      .sim-ad-card {
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border: 2px solid #475569;
        border-radius: 24px;
        width: 100%;
        max-width: 460px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
      }
      .sim-ad-header {
        font-size: 13px;
        font-weight: 800;
        color: #94a3b8;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .sim-ad-title {
        font-size: 22px;
        font-weight: 900;
        color: #fde047;
        margin-bottom: 16px;
      }
      .sim-ad-arcade-screen {
        width: 100%;
        height: 180px;
        background: #020617;
        border: 2px solid #334155;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        margin-bottom: 20px;
      }
      .sim-ad-arcade-icon {
        font-size: 64px;
        animation: floatUpDown 2s infinite ease-in-out;
      }
      @keyframes floatUpDown {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .sim-ad-progress-outer {
        width: 100%;
        height: 12px;
        background: #1e293b;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 16px;
      }
      .sim-ad-progress-inner {
        height: 100%;
        background: linear-gradient(90deg, #22c55e, #4ade80);
        width: 0%;
        transition: width 0.1s linear;
      }
      .sim-ad-claim-btn {
        width: 100%;
        height: 56px;
        background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
        border: 2px solid #86efac;
        border-radius: 16px;
        font-size: 18px;
        font-weight: 900;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
        transition: transform 0.1s;
      }
      .sim-ad-claim-btn.disabled {
        background: #334155;
        border-color: #475569;
        color: #94a3b8;
        cursor: not-allowed;
        box-shadow: none;
      }

      /* BATTLE PASS MODAL */
      .battlepass-modal-overlay, .quests-modal-overlay {
        position: absolute;
        inset: 0;
        z-index: 99990;
        background: rgba(10, 15, 29, 0.88);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: fadeIn 0.2s ease-out;
      }
      .battlepass-modal-card, .quests-modal-card {
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 24px;
        width: 100%;
        max-width: 580px;
        max-height: 92%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
        position: relative;
      }
      .pass-header-banner {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
        border-bottom: 2px solid #4338ca;
        padding: 20px 20px 16px;
        position: relative;
      }
      .pass-banner-title {
        font-size: 24px;
        font-weight: 900;
        color: #fde047;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pass-banner-sub {
        font-size: 13px;
        font-weight: 700;
        color: #cbd5e1;
        margin-top: 4px;
      }
      .pass-track-scroll, .quests-list-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .pass-milestone-card {
        background: #1e293b;
        border: 2px solid #334155;
        border-radius: 16px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pass-milestone-card.unlocked {
        border-color: #6366f1;
      }
      .pass-card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        font-weight: 900;
      }
      .pass-reward-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #0f172a;
        padding: 8px 12px;
        border-radius: 10px;
        gap: 8px;
      }
      .pass-reward-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 800;
        color: #f1f5f9;
      }
      .pass-btn {
        padding: 6px 14px;
        min-height: 38px;
        border-radius: 12px;
        border: none;
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.1s;
      }
      .pass-btn .ad-tv-img {
        width: 28px;
        height: 28px;
      }
      .pass-btn:active {
        transform: scale(0.95);
      }
      .pass-btn.claim-free {
        background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
      }
      .pass-btn.claim-ad {
        background: linear-gradient(180deg, #ec4899 0%, #db2777 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
      }
      .pass-btn.claimed {
        background: #334155;
        color: #94a3b8;
        cursor: default;
      }
      .pass-btn.locked {
        background: #1e293b;
        color: #64748b;
        border: 1px solid #334155;
        cursor: not-allowed;
      }

      /* QUESTS MODAL */
      .quest-card-item {
        background: #1e293b;
        border: 2px solid #334155;
        border-radius: 16px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .quest-card-item.ready {
        border-color: #22c55e;
        box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
      }
      .quest-card-item.claimed {
        opacity: 0.7;
      }
      .quest-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .quest-title-txt {
        font-size: 15px;
        font-weight: 900;
        color: #f8fafc;
      }
      .quest-desc-txt {
        font-size: 13px;
        color: #94a3b8;
        font-weight: 600;
        margin-top: 2px;
      }
      .quest-bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .quest-btn-rewards {
        background: #334155;
        border: 1px solid #475569;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 800;
        color: #67e8f9;
        cursor: pointer;
      }
      .quest-btn-claim {
        background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
        border: none;
        border-radius: 10px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 900;
        color: #fff;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(34, 197, 94, 0.4);
      }

      /* HOW TO PLAY TUTORIAL MODAL */
      .how-to-play-overlay {
        position: absolute;
        inset: 0;
        z-index: 99999;
        background: rgba(10, 15, 29, 0.88);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: fadeIn 0.2s ease-out;
      }
      .how-to-play-card {
        background: #0f172a;
        border: 3px solid #38bdf8;
        border-radius: 28px;
        width: 600px;
        max-width: 94%;
        padding: 26px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
        position: relative;
        overflow: visible;
        box-sizing: border-box;
      }
      .htp-close-corner {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        font-size: 20px;
        font-weight: 900;
        background: #334155;
        border: 2px solid #64748b;
        color: #f8fafc;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: transform 0.1s, background 0.1s;
      }
      .htp-close-corner:hover {
        background: #ef4444;
        border-color: #f87171;
        transform: scale(1.08);
      }
      .htp-header {
        text-align: center;
        margin-bottom: 16px;
        padding: 0 44px;
      }
      .htp-badge {
        display: inline-block;
        padding: 4px 14px;
        background: #0284c7;
        color: #fff;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 1px;
        margin-bottom: 6px;
      }
      .htp-title {
        font-size: 24px;
        font-weight: 900;
        color: #fde047;
        line-height: 1.25;
      }
      .htp-subtitle {
        font-size: 13px;
        font-weight: 700;
        color: #94a3b8;
        margin-top: 4px;
      }
      .htp-steps-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
      }
      .htp-step-card {
        background: #1e293b;
        border: 2px solid #334155;
        border-radius: 16px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 14px;
        box-sizing: border-box;
      }
      .htp-step-icon {
        font-size: 32px;
        width: 44px;
        text-align: center;
        flex-shrink: 0;
        line-height: 1;
      }
      .htp-step-body {
        flex: 1;
        min-width: 0;
      }
      .htp-step-title {
        font-size: 16px;
        font-weight: 900;
        color: #f8fafc;
        margin-bottom: 3px;
      }
      .htp-step-desc {
        font-size: 13px;
        font-weight: 600;
        color: #cbd5e1;
        line-height: 1.4;
      }
      .htp-play-action-btn {
        width: 100%;
        height: 58px;
        margin-top: 18px;
        border-radius: 29px;
        background: linear-gradient(180deg, #22c55e 0%, #15803d 100%);
        border: 3px solid #166534;
        font-family: "Baloo 2", sans-serif;
        font-size: 22px;
        font-weight: 900;
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 0 #14532d, 0 10px 25px rgba(34, 197, 94, 0.4);
        text-shadow: 0 2px 4px rgba(0,0,0,0.4);
        letter-spacing: 0.5px;
        transition: transform 0.1s, filter 0.1s;
      }
      .htp-play-action-btn:hover {
        filter: brightness(1.1);
        transform: translateY(-2px);
      }
      .htp-play-action-btn:active {
        transform: translateY(3px);
        box-shadow: 0 2px 0 #14532d;
      }
    `;

    document.head.appendChild(styleEl);
  }

  public showResultModal(isWin: boolean, waveReached: number, earnedGold: number, earnedDia: number) {
    if (isWin) {
      sound.pauseBGM();
      sound.playVictory();
    }
    const modal = document.createElement('div');
    modal.className = 'result-modal-overlay';
    const modeName = this.game.gameMode === 'CAMPAIGN'
      ? `${t('modes_campaign')} (${t('stage_num', this.game.saveData.selectedCampaignMap || 1)})`
      : t('modes_survival_arena');
    modal.innerHTML = `
      <div class="result-modal-card ${isWin ? 'win-card' : 'lose-card'}">
        <div class="result-title">${isWin ? t('victory_title') : t('defeat_title')}</div>
        <div class="result-subtitle">
          ${t('modes_title')}: ${modeName}<br/>
          ${t('wave_reached')}: ${waveReached}
        </div>

        <div class="result-rewards-box">
          <div class="rewards-heading">${t('rewards_heading')}</div>
          <div class="reward-pill gold-rew">+${earnedGold} 💰 ${t('perm_gold')}</div>
          <div class="reward-pill dia-rew">+${earnedDia} 💎 ${t('diamonds')}</div>
        </div>

        <button class="result-return-btn" id="btn-result-return">
          ${t('main_menu_btn')}
        </button>
      </div>
    `;

    modal.querySelector('#btn-result-return')?.addEventListener('click', () => {
      sound.playClick();
      modal.remove();
      adService.showInterstitialAd('battle_finish');
      if (this.game.tutorialStep === 'BATTLE_PLAYING' || !this.game.saveData.hasSeenTutorial) {
        this.game.tutorialStep = 'LOBBY_SHOP';
        this.game.saveData.tutorialStep = 'LOBBY_SHOP';
      }
      this.game.returnToMainMenu();
      this.render();
    });

    this.rootEl.appendChild(modal);
  }

  public showGameModal(options: {
    title: string;
    icon?: string;
    iconImg?: string;
    subtitle?: string;
    items?: { label: string; value: string; icon?: string; highlight?: boolean }[];
    description?: string;
    actionText?: string;
    onAction?: () => void;
    secondaryText?: string;
    onSecondary?: () => void;
  }) {
    sound.playClick();
    const existing = this.rootEl.querySelector('.game-panel-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'game-panel-overlay';

    let itemsHtml = '';
    if (options.items && options.items.length > 0) {
      itemsHtml = `
        <div class="modal-items-grid">
          ${options.items
            .map(
              (item) => `
            <div class="modal-item-card ${item.highlight ? 'item-highlight' : ''}" title="${item.label}">
              ${item.icon ? `<span class="item-icon">${item.icon}</span>` : ''}
              <div class="item-info">
                <div class="item-label">${item.label}</div>
                <div class="item-value">${item.value}</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    let iconHtml = '';
    if (options.iconImg) {
      iconHtml = `<img src="${options.iconImg}" onerror="this.onerror=null; this.src='/assets/tab_equip.png';" class="modal-header-pixel-img" alt="Icon" />`;
    } else if (options.icon) {
      iconHtml = `<span class="modal-header-icon">${options.icon}</span>`;
    }

    const actionBtnHtml = options.actionText
      ? `<button class="modal-main-btn" id="modal-act-btn">${options.actionText}</button>`
      : `<button class="modal-main-btn" id="modal-act-btn">OK</button>`;

    const secBtnHtml = options.secondaryText
      ? `<button class="modal-sec-btn" id="modal-sec-btn">${options.secondaryText}</button>`
      : '';

    overlay.innerHTML = `
      <div class="game-panel-card">
        <button class="modal-close-corner-btn" id="modal-corner-close">✕</button>
        <div class="game-panel-glow"></div>

        <div class="modal-card-header">
          ${iconHtml}
          <div class="modal-header-titles">
            <div class="modal-title">${options.title}</div>
            ${options.subtitle ? `<div class="modal-subtitle">${options.subtitle}</div>` : ''}
          </div>
        </div>

        ${itemsHtml}

        ${options.description ? `<div class="modal-desc-box">${options.description}</div>` : ''}

        <div class="modal-buttons-row">
          ${secBtnHtml}
          ${actionBtnHtml}
        </div>
      </div>
    `;

    const close = () => {
      sound.playClick();
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 160);
    };

    overlay.querySelector('#modal-corner-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });

    overlay.querySelector('#modal-act-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
      if (options.onAction) options.onAction();
    });

    if (options.secondaryText) {
      overlay.querySelector('#modal-sec-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        close();
        if (options.onSecondary) options.onSecondary();
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    this.rootEl.appendChild(overlay);
  }

  public showGunChestRewardModal(options: {
    isNew: boolean;
    gun: GunKind;
    tier: number;
    level: number;
    bonusLvl?: number;
    bonusGold?: number;
    actionText: string;
    onAction?: () => void;
  }) {
    sound.playMerge(options.tier);
    const existing = this.rootEl.querySelector('.game-panel-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'game-panel-overlay';

    const rarity = RARITY_CONFIGS[options.tier] || { name: 'COMMON', hex: '#94a3b8' };
    const tierColor = options.tier === 1 ? '#94a3b8' : rarity.hex;
    const titleText = options.isNew ? t('gacha_new_weapon') : t('gacha_upgraded');
    const rarityName = t(('rarity_' + rarity.name.toLowerCase()) as TranslationKey) || rarity.name;
    const detail = GUN_DETAILS[options.gun];
    const actText = options.actionText === 'AWESOME' || options.actionText === 'GREAT' ? t('awesome') : options.actionText;

    overlay.innerHTML = `
      <div class="game-panel-card gacha-reward-card" style="text-align: center; border-color: ${tierColor}; box-shadow: 0 10px 0 #1e293b, 0 0 60px ${tierColor}55;">
        <button class="modal-close-corner-btn" id="modal-gacha-close">✕</button>
        <div class="game-panel-glow" style="background: radial-gradient(circle, ${tierColor}44 0%, transparent 70%);"></div>

        <div class="gacha-reward-header" style="
          font-size: 38px;
          font-weight: 900;
          color: #ffffff;
          text-shadow: -3px -3px 0 #1e293b, 3px -3px 0 #1e293b, -3px 3px 0 #1e293b, 3px 3px 0 #1e293b, 0 6px 0 #1e293b;
          margin-bottom: 6px;
        ">${titleText}</div>

        <!-- HERO AURA BADGE (ONLY THIS ICON WITH TIER AURA COLOR - NO 2 BOXES) -->
        <div class="gacha-aura-badge" style="
          width: 210px;
          height: 210px;
          margin: 18px auto 14px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Pulse Halo matching tier color -->
          <div class="gacha-aura-halo" style="
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            background: radial-gradient(circle, ${tierColor}55 0%, ${tierColor}15 60%, transparent 75%);
            box-shadow: 0 0 50px ${tierColor}, 0 0 90px ${tierColor}66, inset 0 0 30px ${tierColor}88;
            border: 6px solid ${tierColor};
            animation: gachaPulseAura 1.8s ease-in-out infinite alternate;
          "></div>

          <!-- Crisp Gun Image directly -->
          <img src="/assets/gun_${options.gun.toLowerCase()}.png"
               class="gacha-hero-gun-img"
               alt="${GUN_NAMES[options.gun]}"
               style="
                 width: 140px;
                 height: 140px;
                 object-fit: contain;
                 position: relative;
                 z-index: 2;
                 filter: drop-shadow(0 10px 14px rgba(0,0,0,0.5));
                 animation: gachaFloatGun 2.2s ease-in-out infinite alternate;
               " />
        </div>

        <!-- Gun Name -->
        <div class="gacha-hero-name" style="
          font-size: 34px;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 6px;
        ">${GUN_NAMES[options.gun]}</div>

        <!-- Tier Pill -->
        <div class="gacha-hero-tier-pill" style="
          display: inline-block;
          padding: 6px 20px;
          border-radius: 20px;
          background: ${tierColor};
          color: #ffffff;
          font-size: 20px;
          font-weight: 900;
          box-shadow: 0 4px 0 #1e293b;
          text-shadow: 0 2px 0 rgba(0,0,0,0.4);
          margin-bottom: 14px;
          text-transform: uppercase;
        ">TIER ${options.tier} • ${rarityName}</div>

        <!-- Single Info Line (NO 2 BOXES) -->
        ${options.isNew ? `
          <div style="font-size: 20px; font-weight: 800; color: #475569; margin-bottom: 22px;">
            ${detail?.role ? `${detail.role} &nbsp;•&nbsp; ` : ''}${detail?.bulletType || 'Combat Weapon'}
          </div>
        ` : `
          <div style="font-size: 22px; font-weight: 900; color: #16a34a; margin-bottom: 22px;">
            ⭐ ${t('level')} ${options.level} (+${options.bonusLvl}) &nbsp;|&nbsp; +${options.bonusGold} 💰 ${t('shop_gold')}
          </div>
        `}

        <div class="modal-buttons-row">
          <button class="modal-main-btn" id="modal-gacha-ok">${actText}</button>
        </div>
      </div>
    `;

    const close = () => {
      sound.playClick();
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 160);
    };

    overlay.querySelector('#modal-gacha-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
    overlay.querySelector('#modal-gacha-ok')?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
      if (options.onAction) options.onAction();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    this.rootEl.appendChild(overlay);
  }

  public showSettingsModal() {
    sound.playClick();
    const existing = this.rootEl.querySelector('.game-panel-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'game-panel-overlay settings-modal-overlay';

    const save = this.game.saveData;
    const currentLang = getLanguage();

    overlay.innerHTML = `
      <div class="game-panel-card settings-modal-card">
        <button class="modal-close-corner-btn" id="settings-corner-close" aria-label="Close">✕</button>

        <div class="modal-card-header">
          <img src="/assets/btn_settings.png" class="modal-header-pixel-img" alt="Settings" />
          <div class="modal-header-titles">
            <div class="modal-title">${t('settings_title')}</div>
            <div class="modal-subtitle">${t('settings_subtitle')}</div>
          </div>
        </div>

        <div class="settings-rows-list">
          <!-- 0. LANGUAGE SWITCH -->
          <div class="settings-row-item">
            <div class="settings-row-info">
              <div class="settings-row-icon">🌐</div>
              <div class="settings-row-text">
                <div class="settings-row-title">${t('settings_lang')}</div>
                <div class="settings-row-sub">${currentLang === 'vi' ? 'Tiếng Việt (Vietnamese)' : 'English'}</div>
              </div>
            </div>
            <button class="settings-flag-btn ${currentLang === 'vi' ? 'lang-vi' : 'lang-en'}" id="btn-toggle-lang" title="${currentLang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}">
              <span class="settings-flag-icon">${currentLang === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
              <span class="settings-flag-name">${currentLang === 'vi' ? 'TIẾNG VIỆT' : 'ENGLISH'}</span>
              <span class="settings-flag-switch-badge">⇄</span>
            </button>
          </div>

          <!-- 1. MUSIC (BGM) -->
          <div class="settings-row-item">
            <div class="settings-row-info">
              <div class="settings-row-icon">🎵</div>
              <div class="settings-row-text">
                <div class="settings-row-title">${t('settings_music')}</div>
                <div class="settings-row-sub">${t('settings_music_sub')}</div>
              </div>
            </div>
            <button class="settings-toggle-btn ${sound.isMusicActive() ? 'is-on' : 'is-off'}" id="btn-toggle-music">
              <span class="toggle-icon">${sound.isMusicActive() ? '🔊' : '🔇'}</span>
              <span class="toggle-text">${sound.isMusicActive() ? t('on') : t('off')}</span>
            </button>
          </div>

          <!-- 2. SOUND VFX (SFX) -->
          <div class="settings-row-item">
            <div class="settings-row-info">
              <div class="settings-row-icon">💥</div>
              <div class="settings-row-text">
                <div class="settings-row-title">${t('settings_sfx')}</div>
                <div class="settings-row-sub">${t('settings_sfx_sub')}</div>
              </div>
            </div>
            <button class="settings-toggle-btn ${sound.isSfxActive() ? 'is-on' : 'is-off'}" id="btn-toggle-sfx">
              <span class="toggle-icon">${sound.isSfxActive() ? '🔊' : '🔇'}</span>
              <span class="toggle-text">${sound.isSfxActive() ? t('on') : t('off')}</span>
            </button>
          </div>

          <!-- 3. MASTER AUDIO -->
          <div class="settings-row-item">
            <div class="settings-row-info">
              <div class="settings-row-info">
                <div class="settings-row-icon">🎚️</div>
                <div class="settings-row-text">
                  <div class="settings-row-title">${t('settings_master')}</div>
                  <div class="settings-row-sub">${t('settings_master_sub')}</div>
                </div>
              </div>
            </div>
            <button class="settings-toggle-btn ${sound.enabled ? 'is-on' : 'is-off'}" id="btn-toggle-master">
              <span class="toggle-icon">${sound.enabled ? '🔔' : '🔕'}</span>
              <span class="toggle-text">${sound.enabled ? t('on') : t('mute')}</span>
            </button>
          </div>

          <!-- 4. GAME VERSION -->
          <div class="settings-row-item">
            <div class="settings-row-info">
              <div class="settings-row-icon">⚙️</div>
              <div class="settings-row-text">
                <div class="settings-row-title">${t('settings_version')}</div>
                <div class="settings-row-sub">Gear Gun Castle • v1.2</div>
              </div>
            </div>
            <div class="settings-version-pill">v1.2</div>
          </div>
        </div>

        <div class="modal-buttons-row">
          ${import.meta.env.DEV ? `
            <button class="modal-sec-btn" id="btn-settings-replay" style="background:#0284c7; flex:1.2;">🔄 ${t('settings_replay_tut')}</button>
            <button class="modal-sec-btn" id="btn-settings-cheat">${t('settings_boost')}</button>
          ` : ''}
          <button class="modal-main-btn" id="btn-settings-done">${t('settings_ok')}</button>
        </div>
      </div>
    `;

    const closeModal = () => {
      sound.playClick();
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 160);
    };

    overlay.querySelector('#settings-corner-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });

    overlay.querySelector('#btn-settings-done')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });

    if (import.meta.env.DEV) {
      overlay.querySelector('#btn-settings-replay')?.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.remove();
        this.game.startTutorial();
      });
    }

    // Language toggle flag button
    overlay.querySelector('#btn-toggle-lang')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextLang: Language = currentLang === 'vi' ? 'en' : 'vi';
      this.game.setGameLanguage(nextLang);
      sound.playClick();
      this.showSettingsModal();
    });

    // Music toggle button
    const musicBtn = overlay.querySelector('#btn-toggle-music') as HTMLButtonElement;
    musicBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.setMusicEnabled(!sound.musicEnabled);
      const active = sound.isMusicActive();
      musicBtn.className = `settings-toggle-btn ${active ? 'is-on' : 'is-off'}`;
      musicBtn.innerHTML = `
        <span class="toggle-icon">${active ? '🔊' : '🔇'}</span>
        <span class="toggle-text">${active ? t('on') : t('off')}</span>
      `;
      sound.playClick();
    });

    // VFX / SFX toggle button
    const sfxBtn = overlay.querySelector('#btn-toggle-sfx') as HTMLButtonElement;
    sfxBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.setSfxEnabled(!sound.sfxEnabled);
      const active = sound.isSfxActive();
      sfxBtn.className = `settings-toggle-btn ${active ? 'is-on' : 'is-off'}`;
      sfxBtn.innerHTML = `
        <span class="toggle-icon">${active ? '🔊' : '🔇'}</span>
        <span class="toggle-text">${active ? t('on') : t('off')}</span>
      `;
      if (active) sound.playClick();
    });

    // Master audio toggle button
    const masterBtn = overlay.querySelector('#btn-toggle-master') as HTMLButtonElement;
    masterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.setSoundEnabled(!sound.enabled);
      const active = sound.enabled;
      masterBtn.className = `settings-toggle-btn ${active ? 'is-on' : 'is-off'}`;
      masterBtn.innerHTML = `
        <span class="toggle-icon">${active ? '🔔' : '🔕'}</span>
        <span class="toggle-text">${active ? t('on') : t('mute')}</span>
      `;

      // Update music & sfx buttons state visuals
      const mActive = sound.isMusicActive();
      musicBtn.className = `settings-toggle-btn ${mActive ? 'is-on' : 'is-off'}`;
      musicBtn.innerHTML = `
        <span class="toggle-icon">${mActive ? '🔊' : '🔇'}</span>
        <span class="toggle-text">${mActive ? t('on') : t('off')}</span>
      `;

      const sActive = sound.isSfxActive();
      sfxBtn.className = `settings-toggle-btn ${sActive ? 'is-on' : 'is-off'}`;
      sfxBtn.innerHTML = `
        <span class="toggle-icon">${sActive ? '🔊' : '🔇'}</span>
        <span class="toggle-text">${sActive ? t('on') : t('off')}</span>
      `;
      if (active) sound.playClick();
    });

    // Boost button (Dev only)
    if (import.meta.env.DEV) {
      overlay.querySelector('#btn-settings-cheat')?.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playMerge(4);
        save.energy = 999;
        save.maxEnergy = 999;
        save.permanentGold += 20000;
        save.diamonds += 2000;
        save.highestCampaignStage = Math.max(save.highestCampaignStage || 1, 5);
        this.game.saveGame();
        this.render();
        closeModal();
        this.showAlertModal('+20,000 Gold & +2,000 Diamonds granted!', 'CHEAT ACTIVATED', '⚡');
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    this.rootEl.appendChild(overlay);
  }

  public showBattlePauseModal() {
    this.game.isPaused = true;

    // Remove any existing pause overlay
    const existing = this.rootEl.querySelector('.battle-pause-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'game-panel-overlay battle-pause-overlay';

    overlay.innerHTML = `
      <div class="game-panel-card pause-modal-card">
        <button class="modal-close-corner-btn" id="pause-corner-close" aria-label="Close">✕</button>

        <div class="modal-card-header" style="margin-top: -50px;">
          <div class="modal-header-icon" style="background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);">⏸️</div>
          <div class="modal-header-titles">
            <div class="modal-title">${t('pause_title')}</div>
            <div class="modal-subtitle">
              ${this.game.gameMode === 'CAMPAIGN' ? `${t('modes_campaign')} • ${t('hud_wave_label', this.game.wave + '/' + this.game.maxWave)}` : `${t('modes_survival')} • ${t('hud_wave_label', this.game.wave)}`}
            </div>
          </div>
        </div>

        <div class="pause-menu-actions">
          <!-- 1. RESUME -->
          <button class="pause-action-btn btn-resume" id="btn-pause-resume">
            <span class="pause-btn-icon">▶️</span>
            <span class="pause-btn-text">${t('pause_resume')}</span>
          </button>

          <!-- 2. MUSIC TOGGLE -->
          <button class="pause-action-btn btn-music ${sound.isMusicActive() ? 'sound-on' : 'sound-off'}" id="btn-pause-music">
            <span class="pause-btn-icon">${sound.isMusicActive() ? '🎵' : '🔇'}</span>
            <span class="pause-btn-text" id="pause-music-text">${t('settings_music')}: ${sound.isMusicActive() ? t('on') : t('off')}</span>
          </button>

          <!-- 3. VFX / SFX TOGGLE -->
          <button class="pause-action-btn btn-vfx ${sound.isSfxActive() ? 'sound-on' : 'sound-off'}" id="btn-pause-vfx">
            <span class="pause-btn-icon">${sound.isSfxActive() ? '💥' : '🔇'}</span>
            <span class="pause-btn-text" id="pause-vfx-text">${t('settings_sfx')}: ${sound.isSfxActive() ? t('on') : t('off')}</span>
          </button>

          <!-- 4. QUIT TO MENU -->
          <button class="pause-action-btn btn-quit" id="btn-pause-quit">
            <span class="pause-btn-icon">🏠</span>
            <span class="pause-btn-text">${t('main_menu_btn')}</span>
          </button>
        </div>
      </div>
    `;

    const closeAndResume = () => {
      sound.playClick();
      this.game.isPaused = false;
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 160);
    };

    overlay.querySelector('#pause-corner-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAndResume();
    });

    overlay.querySelector('#btn-pause-resume')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAndResume();
    });

    // Music toggle in pause
    overlay.querySelector('#btn-pause-music')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.setMusicEnabled(!sound.musicEnabled);
      const active = sound.isMusicActive();
      const btn = overlay.querySelector('#btn-pause-music');
      const text = overlay.querySelector('#pause-music-text');
      const icon = btn?.querySelector('.pause-btn-icon');
      if (btn && text && icon) {
        icon.textContent = active ? '🎵' : '🔇';
        text.textContent = `${t('settings_music')}: ${active ? t('on') : t('off')}`;
        btn.className = `pause-action-btn btn-music ${active ? 'sound-on' : 'sound-off'}`;
      }
      sound.playClick();
    });

    // VFX / SFX toggle in pause
    overlay.querySelector('#btn-pause-vfx')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.setSfxEnabled(!sound.sfxEnabled);
      const active = sound.isSfxActive();
      const btn = overlay.querySelector('#btn-pause-vfx');
      const text = overlay.querySelector('#pause-vfx-text');
      const icon = btn?.querySelector('.pause-btn-icon');
      if (btn && text && icon) {
        icon.textContent = active ? '💥' : '🔇';
        text.textContent = `${t('settings_sfx')}: ${active ? t('on') : t('off')}`;
        btn.className = `pause-action-btn btn-vfx ${active ? 'sound-on' : 'sound-off'}`;
      }
      if (active) sound.playClick();
    });

    overlay.querySelector('#btn-pause-quit')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      overlay.remove();
      this.game.isPaused = false;
      this.game.returnToMainMenu();
      this.render();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAndResume();
      }
    });

    this.rootEl.appendChild(overlay);
  }

  public showAlertModal(message: string, title: string = 'NOTICE', icon: string = '🔔') {
    this.showGameModal({
      title,
      icon,
      description: message,
      actionText: 'OK'
    });
  }

  // --- SIMULATED AD MODAL (ARCADE PREVIEW) ---
  public showSimulatedAd(adTitle: string, onReward: () => void) {
    sound.playClick();
    const existing = document.querySelector('.sim-ad-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';

    let timeLeft = 3;
    let isCompleted = false;

    overlay.innerHTML = `
      <div class="sim-ad-card">
        <div class="sim-ad-header">📺 SPONSORED ARCADE VIDEO AD</div>
        <div class="sim-ad-title">${adTitle}</div>
        
        <div class="sim-ad-arcade-screen">
          <div class="sim-ad-arcade-icon">🎮</div>
          <div style="font-size: 15px; font-weight: 800; color: #38bdf8; margin-top: 10px;">GEAR DEFENDER 2026 PREVIEW</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;" id="sim-ad-status">Streaming sponsor preview video...</div>
        </div>

        <div class="sim-ad-progress-outer">
          <div class="sim-ad-progress-inner" id="sim-ad-bar"></div>
        </div>

        <button class="sim-ad-claim-btn disabled" id="btn-sim-ad-claim" disabled>
          <span>WATCHING SPONSOR AD (${timeLeft}s)</span>
        </button>
      </div>
    `;

    this.rootEl.appendChild(overlay);

    const barEl = overlay.querySelector('#sim-ad-bar') as HTMLElement;
    const btnEl = overlay.querySelector('#btn-sim-ad-claim') as HTMLButtonElement;
    const statusEl = overlay.querySelector('#sim-ad-status') as HTMLElement;

    const interval = setInterval(() => {
      timeLeft--;
      if (barEl) {
        const percent = Math.min(100, Math.round(((3 - timeLeft) / 3) * 100));
        barEl.style.width = `${percent}%`;
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        isCompleted = true;
        if (statusEl) statusEl.textContent = 'Sponsor ad completed!';
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.className = 'sim-ad-claim-btn';
          btnEl.innerHTML = `<span>🎁 CLAIM REWARD</span>`;
        }
      } else {
        if (btnEl) {
          btnEl.innerHTML = `<span>WATCHING SPONSOR AD (${timeLeft}s)</span>`;
        }
      }
    }, 1000);

    setTimeout(() => {
      if (barEl) barEl.style.width = '33%';
    }, 100);

    btnEl.addEventListener('click', () => {
      if (!isCompleted) return;
      clearInterval(interval);
      sound.playMerge();
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        onReward();
      }, 160);
    });
  }

  // --- TALENT ROLL RESULT MODAL (AURA & ANIMATION) ---
  public showTalentRollModal(talent: CastleTalentItem, newLevel: number) {
    sound.playMerge(talent.tier);
    const existing = document.querySelector('.talent-roll-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'talent-roll-overlay';

    const rarityNames = ['', t('rarity_common'), t('rarity_rare'), t('rarity_epic'), t('rarity_legendary'), t('rarity_mythic')];
    const rarity = rarityNames[talent.tier] || t('rarity_rare');
    const item = getTalentItem(talent);

    overlay.innerHTML = `
      <div class="talent-roll-card">
        <div style="font-size: 13px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;">
          ✨ ${t('talents_title')}
        </div>

        <div class="talent-roll-aura-wrap">
          <div class="talent-roll-aura-ring" style="
            background: radial-gradient(circle, ${talent.glowColor}55 0%, ${talent.color}22 60%, transparent 80%);
            box-shadow: 0 0 35px ${talent.glowColor};
            border: 2px dashed ${talent.color};
          "></div>
          <div class="talent-roll-buff-icon">${talent.icon}</div>
        </div>

        <div class="talent-tier-badge" style="background: ${talent.color}; box-shadow: 0 0 12px ${talent.glowColor};">
          Tier ${talent.tier} • ${rarity}
        </div>

        <div class="talent-roll-name">${item.name}</div>
        <div class="talent-roll-stat">Lv.${newLevel}/${talent.maxLvl} • ${talent.stat(newLevel)}</div>
        <div style="font-size: 14px; font-weight: 700; color: #cbd5e1; margin-bottom: 12px;">${talent.bonusText(newLevel)}</div>

        <div class="talent-roll-explain">
          💡 ${item.shortExplain}
        </div>

        <button class="kid-play-btn" id="btn-talent-roll-ok" style="position: relative; left: auto; bottom: auto; width: 100%; height: 56px; font-size: 20px;">
          <span>${t('awesome')}</span>
        </button>
      </div>
    `;

    overlay.querySelector('#btn-talent-roll-ok')?.addEventListener('click', () => {
      sound.playClick();
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 160);
      this.render();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        sound.playClick();
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 160);
        this.render();
      }
    });

    this.rootEl.appendChild(overlay);
  }

  // --- QUESTS MODAL ---
  public showQuestsModal() {
    sound.playClick();
    const existing = document.querySelector('.quests-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'quests-modal-overlay';

    const save = this.game.saveData;
    const quests = save.quests || [];

    const renderQuests = () => {
      const itemsHtml = quests.map(q => {
        const isDone = q.current >= q.target;
        const pct = Math.min(100, Math.round((q.current / q.target) * 100));

        return `
          <div class="quest-card-item ${q.claimed ? 'claimed' : (isDone ? 'ready' : '')}">
            <div class="quest-card-top">
              <div>
                <div class="quest-title-txt">${q.title}</div>
                <div class="quest-desc-txt">${q.desc}</div>
              </div>
              <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
                <span class="kid-chip" style="color:#fde047; font-weight:900;">🎖️ +${q.rewardMedals}</span>
                ${q.rewardGold ? `<span class="kid-chip" style="color:#86efac; font-weight:900;">💰 +${q.rewardGold}</span>` : ''}
                ${q.rewardDia ? `<span class="kid-chip" style="color:#67e8f9; font-weight:900;">💎 +${q.rewardDia}</span>` : ''}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
              <div style="flex:1; height:10px; background:#0f172a; border-radius:5px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #3b82f6, #06b6d4); border-radius:5px;"></div>
              </div>
              <span style="font-size:12px; font-weight:800; color:#cbd5e1; min-width:50px; text-align:right;">${q.current}/${q.target}</span>
            </div>

            <div class="quest-bottom-row">
              <button class="quest-btn-rewards" data-quest-info="${q.id}">
                👁️ REWARDS
              </button>

              ${q.claimed ? `
                <button class="pass-btn claimed" disabled>CLAIMED ✔</button>
              ` : (isDone ? `
                <button class="quest-btn-claim" data-quest-claim="${q.id}">
                  🎁 CLAIM
                </button>
              ` : `
                <span class="kid-chip" style="font-size:12px; padding:6px 12px; color:#94a3b8;">IN PROGRESS</span>
              `)}
            </div>
          </div>
        `;
      }).join('');

      overlay.innerHTML = `
        <div class="quests-modal-card">
          <button class="modal-close-corner-btn" id="quests-close-btn">✕</button>

          <div class="pass-header-banner" style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); border-color: #059669;">
            <div class="pass-banner-title">📜 DAILY MISSIONS & QUESTS</div>
            <div class="pass-banner-sub">Complete daily missions to earn Medals 🎖️, advance your Battle Pass, and gain Gold & Gems!</div>
          </div>

          <div class="quests-list-scroll">
            ${itemsHtml}
          </div>
        </div>
      `;

      overlay.querySelector('#quests-close-btn')?.addEventListener('click', () => {
        sound.playClick();
        overlay.remove();
      });

      overlay.querySelectorAll('[data-quest-info]').forEach(el => {
        el.addEventListener('click', (e) => {
          const qId = (e.currentTarget as HTMLElement).dataset.questInfo;
          const q = quests.find(item => item.id === qId);
          if (!q) return;
          this.showGameModal({
            title: q.title,
            icon: '🎁',
            subtitle: 'Mission Reward Details',
            items: [
              { label: 'Battle Pass Medals', value: `+${q.rewardMedals} 🎖️`, icon: '🎖️', highlight: true },
              ...(q.rewardGold ? [{ label: 'Gold Bonus', value: `+${q.rewardGold} 💰`, icon: '💰', highlight: true }] : []),
              ...(q.rewardDia ? [{ label: 'Diamond Bonus', value: `+${q.rewardDia} 💎`, icon: '💎', highlight: true }] : [])
            ],
            description: `<div style="padding:10px 14px;background:#1e293b;border-radius:12px;color:#94a3b8;font-size:14px;">${q.desc}</div>`,
            actionText: 'GOT IT'
          });
        });
      });

      overlay.querySelectorAll('[data-quest-claim]').forEach(el => {
        el.addEventListener('click', (e) => {
          const qId = (e.currentTarget as HTMLElement).dataset.questClaim;
          const q = quests.find(item => item.id === qId);
          if (!q || q.claimed || q.current < q.target) return;

          q.claimed = true;
          this.game.addBattlePassPoints(q.rewardMedals);
          if (q.rewardGold) save.permanentGold += q.rewardGold;
          if (q.rewardDia) save.diamonds += q.rewardDia;
          this.game.saveGame();
          sound.playMerge(3);
          this.render();
          renderQuests();
        });
      });
    };

    renderQuests();

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        sound.playClick();
        overlay.remove();
      }
    });

    this.rootEl.appendChild(overlay);
  }

  // --- BATTLE PASS MODAL ---
  public showBattlePassModal() {
    sound.playClick();
    const existing = document.querySelector('.battlepass-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'battlepass-modal-overlay';

    const save = this.game.saveData;
    if (!save.battlePass) {
      save.battlePass = { points: 0, claimedFree: [], claimedAd: [] };
    }

    const renderPass = () => {
      const pass = save.battlePass!;
      const points = pass.points;
      const maxPts = BATTLE_PASS_MILESTONES[BATTLE_PASS_MILESTONES.length - 1].reqPoints;
      const overallPct = Math.min(100, Math.round((points / maxPts) * 100));

      const milestonesHtml = BATTLE_PASS_MILESTONES.map(m => {
        const isUnlocked = points >= m.reqPoints;
        const freeClaimed = pass.claimedFree.includes(m.level);
        const adClaimed = pass.claimedAd.includes(m.level);

        return `
          <div class="pass-milestone-card ${isUnlocked ? 'unlocked' : ''}">
            <div class="pass-card-head">
              <span style="color:#fde047;">🎖️ TIER ${m.level} (${m.reqPoints} Medals)</span>
              <span style="color:${isUnlocked ? '#4ade80' : '#94a3b8'}; font-size:12px;">
                ${isUnlocked ? '✔ UNLOCKED' : `🔒 NEED ${m.reqPoints - points} 🎖️`}
              </span>
            </div>

            <!-- Free Pass Row -->
            <div class="pass-reward-row">
              <div class="pass-reward-label">
                <span>🎁</span>
                <span>FREE: <b>${m.freeReward.icon} ${m.freeReward.text}</b></span>
              </div>
              <div>
                ${freeClaimed ? `
                  <button class="pass-btn claimed" disabled>CLAIMED ✔</button>
                ` : (isUnlocked ? `
                  <button class="pass-btn claim-free" data-claim-free="${m.level}">
                    CLAIM 🎁
                  </button>
                ` : `
                  <button class="pass-btn locked" disabled>🔒 LOCKED</button>
                `)}
              </div>
            </div>

            <!-- VIP Row (Watch Ad via GD SDK) -->
            <div class="pass-reward-row" style="background:#13112c; border: 1px solid rgba(236, 72, 153, 0.3);">
              <div class="pass-reward-label" style="color:#f472b6;">
                <span>👑</span>
                <span>VIP: <b>${m.vipReward.icon} ${m.vipReward.text}</b></span>
              </div>
              <div>
                ${adClaimed ? `
                  <button class="pass-btn claimed" disabled>CLAIMED ✔</button>
                ` : (isUnlocked ? `
                  <button class="pass-btn claim-ad" data-claim-ad="${m.level}">
                    <img src="/assets/icon_ad_tv.png" class="ad-tv-img" alt="" />
                    <span>CLAIM FREE</span>
                  </button>
                ` : `
                  <button class="pass-btn locked" disabled>
                    <img src="/assets/icon_ad_tv.png" class="ad-tv-img" style="filter:grayscale(1); opacity:0.5;" alt="" />
                    <span>LOCKED</span>
                  </button>
                `)}
              </div>
            </div>
          </div>
        `;
      }).join('');

      overlay.innerHTML = `
        <div class="battlepass-modal-card">
          <button class="modal-close-corner-btn" id="pass-close-btn">✕</button>

          <div class="pass-header-banner">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="pass-banner-title">🎖️ BATTLE PASS SEASON 1</div>
              <div style="background:rgba(0,0,0,0.4); padding:4px 12px; border-radius:12px; color:#fde047; font-weight:900; font-size:16px;">
                ${points} 🎖️
              </div>
            </div>
            <div class="pass-banner-sub">
              Defeat monsters (+1🎖️), clear waves (+10🎖️), or finish quests to gain Medals!
            </div>

            <!-- Overall Progress Bar -->
            <div style="margin-top:12px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; color:#cbd5e1; margin-bottom:4px;">
                <span>BATTLE PASS PROGRESS</span>
                <span>${points} / ${maxPts} 🎖️</span>
              </div>
              <div style="width:100%; height:12px; background:#0f172a; border-radius:6px; overflow:hidden; border:1px solid #4338ca;">
                <div style="width:${overallPct}%; height:100%; background:linear-gradient(90deg, #ec4899, #f59e0b); border-radius:6px;"></div>
              </div>
            </div>
          </div>

          <div class="pass-track-scroll">
            ${milestonesHtml}
          </div>
        </div>
      `;

      overlay.querySelector('#pass-close-btn')?.addEventListener('click', () => {
        sound.playClick();
        overlay.remove();
      });

      overlay.querySelectorAll('[data-claim-free]').forEach(el => {
        el.addEventListener('click', (e) => {
          const lvl = Number((e.currentTarget as HTMLElement).dataset.claimFree);
          const m = BATTLE_PASS_MILESTONES.find(item => item.level === lvl);
          if (!m || pass.claimedFree.includes(lvl) || points < m.reqPoints) return;

          m.freeReward.grant(save, this.game);
          pass.claimedFree.push(lvl);
          this.game.saveGame();
          sound.playMerge(2);
          this.render();
          renderPass();
        });
      });

      overlay.querySelectorAll('[data-claim-ad]').forEach(el => {
        el.addEventListener('click', (e) => {
          const lvl = Number((e.currentTarget as HTMLElement).dataset.claimAd);
          const m = BATTLE_PASS_MILESTONES.find(item => item.level === lvl);
          if (!m || pass.claimedAd.includes(lvl) || points < m.reqPoints) return;

          adService.showRewardedAd(`Battle Pass VIP Tier ${lvl}`, () => {
            m.vipReward.grant(save, this.game);
            pass.claimedAd.push(lvl);
            this.game.saveGame();
            sound.playMerge(4);
            this.render();
            renderPass();
          }, (t, r) => this.showSimulatedAd(t, r));
        });
      });
    };

    renderPass();

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        sound.playClick();
        overlay.remove();
      }
    });

    this.rootEl.appendChild(overlay);
  }

  // --- HOW TO PLAY TUTORIAL MODAL (FTUE FOR GD QUALITY) ---
  public showHowToPlayModal(onClose?: () => void) {
    sound.playClick();
    const existing = document.querySelector('.how-to-play-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'how-to-play-overlay';

    overlay.innerHTML = `
      <div class="how-to-play-card">
        <button class="htp-close-corner" id="htp-close-btn" aria-label="Close">✕</button>

        <div class="htp-header">
          <div class="htp-badge">${t('htp_badge')}</div>
          <div class="htp-title">${t('htp_title')}</div>
          <div class="htp-subtitle">${t('htp_subtitle')}</div>
        </div>

        <div class="htp-steps-list">
          <div class="htp-step-card">
            <div class="htp-step-icon">⚙️</div>
            <div class="htp-step-body">
              <div class="htp-step-title">${t('htp_step1_title')}</div>
              <div class="htp-step-desc">${t('htp_step1_desc')}</div>
            </div>
          </div>

          <div class="htp-step-card">
            <div class="htp-step-icon">🎲</div>
            <div class="htp-step-body">
              <div class="htp-step-title">${t('htp_step2_title')}</div>
              <div class="htp-step-desc">${t('htp_step2_desc')}</div>
            </div>
          </div>

          <div class="htp-step-card">
            <div class="htp-step-icon">🛡️</div>
            <div class="htp-step-body">
              <div class="htp-step-title">${t('htp_step3_title')}</div>
              <div class="htp-step-desc">${t('htp_step3_desc')}</div>
            </div>
          </div>
        </div>

        <button class="htp-play-action-btn" id="btn-htp-play">
          <span>${t('htp_action_btn')}</span>
        </button>
      </div>
    `;

    const close = () => {
      sound.playClick();
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        if (onClose) onClose();
      }, 160);
    };

    overlay.querySelector('#htp-close-btn')?.addEventListener('click', close);
    overlay.querySelector('#btn-htp-play')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    this.rootEl.appendChild(overlay);
  }

  // ================= INTERACTIVE TUTORIAL SYSTEM ================= //

  public hideTutorialOverlay() {
    if (this.tutorialOverlayEl) {
      this.tutorialOverlayEl.remove();
      this.tutorialOverlayEl = null;
    }
  }

  public showTutorialHandAt(
    x: number,
    y: number,
    title: string,
    desc: string,
    pointDirection: 'DOWN' | 'UP' = 'DOWN',
    customW?: number,
    customH?: number
  ) {
    this.hideTutorialOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay-layer';
    this.tutorialOverlayEl = overlay;

    const ringW = customW || 120;
    const ringH = customH || 80;

    const handY = pointDirection === 'DOWN' ? y - ringH / 2 - 15 : y + ringH / 2 + 15;
    const bubbleY = pointDirection === 'DOWN' ? handY - 80 : handY + 80;

    overlay.innerHTML = `
      <div class="tutorial-target-ring" style="left: ${x}px; top: ${y}px; width: ${ringW}px; height: ${ringH}px;"></div>
      <div class="tutorial-hand-pointer ${pointDirection === 'UP' ? 'point-up' : ''}" style="left: ${x}px; top: ${handY}px;">
        ${pointDirection === 'DOWN' ? '👇' : '👆'}
      </div>
      <div class="tutorial-speech-bubble" style="left: ${x}px; top: ${bubbleY}px;">
        <div class="tutorial-bubble-title">${title}</div>
        <div class="tutorial-bubble-desc">${desc}</div>
      </div>
    `;

    this.rootEl.appendChild(overlay);
  }

  public showTutorialRoll() {
    const rollBtn = this.rootEl.querySelector('#btn-battle-roll');
    if (rollBtn) {
      const rootRect = this.rootEl.getBoundingClientRect();
      const bRect = rollBtn.getBoundingClientRect();
      const x = (bRect.left - rootRect.left + bRect.width / 2) / this.scale;
      const y = (bRect.top - rootRect.top + bRect.height / 2) / this.scale;
      this.showTutorialHandAt(x, y, t('tut_roll_title'), t('tut_roll_desc'), 'DOWN', bRect.width / this.scale + 20, bRect.height / this.scale + 20);
    } else {
      this.showTutorialHandAt(160, 1200, t('tut_roll_title'), t('tut_roll_desc'), 'DOWN', 240, 90);
    }
  }

  public showTutorialMerge(col1: number, row1: number, col2: number, row2: number) {
    this.hideTutorialOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay-layer';
    this.tutorialOverlayEl = overlay;

    const x1 = 120 + col1 * 96 + 48;
    const y1 = 560 + row1 * 96 + 48;
    const x2 = 120 + col2 * 96 + 48;
    const y2 = 560 + row2 * 96 + 48;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    overlay.innerHTML = `
      <!-- Highlight Rings on Source and Target Cells -->
      <div class="tutorial-target-ring" style="left: ${x1}px; top: ${y1}px; width: 92px; height: 92px; border-color: #38bdf8;"></div>
      <div class="tutorial-target-ring" style="left: ${x2}px; top: ${y2}px; width: 92px; height: 92px; border-color: #facc15;"></div>

      <!-- Animated SVG Curved Arrow -->
      <svg class="tutorial-arrow-svg" viewBox="0 0 720 1280">
        <defs>
          <marker id="tut-arrowhead" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#facc15" />
          </marker>
        </defs>
        <path d="M ${x1} ${y1} Q ${midX} ${midY - 45} ${x2 - 12} ${y2}"
              fill="none"
              stroke="#facc15"
              stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="12 8"
              class="tutorial-animated-arrow"
              marker-end="url(#tut-arrowhead)" />
      </svg>

      <!-- Smooth Swiping Hand -->
      <div class="tutorial-swipe-hand" style="--start-x: ${x1}px; --start-y: ${y1}px; --end-x: ${x2}px; --end-y: ${y2}px;">
        👆
      </div>

      <!-- Speech Bubble -->
      <div class="tutorial-speech-bubble" style="left: ${midX}px; top: ${y1 - 100}px;">
        <div class="tutorial-bubble-title">${t('tut_merge_title')}</div>
        <div class="tutorial-bubble-desc">${t('tut_merge_desc')}</div>
      </div>
    `;

    this.rootEl.appendChild(overlay);
  }

  public showTutorialBattleStart() {
    const waveBtn = this.rootEl.querySelector('#btn-battle-start-wave');
    if (waveBtn) {
      const rootRect = this.rootEl.getBoundingClientRect();
      const bRect = waveBtn.getBoundingClientRect();
      const x = (bRect.left - rootRect.left + bRect.width / 2) / this.scale;
      const y = (bRect.top - rootRect.top + bRect.height / 2) / this.scale;
      this.showTutorialHandAt(x, y, t('tut_battle_title'), t('tut_battle_desc'), 'DOWN', bRect.width / this.scale + 20, bRect.height / this.scale + 20);
    } else {
      this.showTutorialHandAt(520, 1200, t('tut_battle_title'), t('tut_battle_desc'), 'DOWN', 320, 90);
    }
  }

  public showTutorialLobbyShop() {
    const shopTabBtn = this.rootEl.querySelector('#nav-tab-shop');
    if (shopTabBtn) {
      const rootRect = this.rootEl.getBoundingClientRect();
      const bRect = shopTabBtn.getBoundingClientRect();
      const x = (bRect.left - rootRect.left + bRect.width / 2) / this.scale;
      const y = (bRect.top - rootRect.top + bRect.height / 2) / this.scale;
      this.showTutorialHandAt(x, y, t('tut_shop_title'), t('tut_shop_desc'), 'DOWN', 100, 90);
    } else {
      this.showTutorialHandAt(72, 1220, t('tut_shop_title'), t('tut_shop_desc'), 'DOWN', 100, 90);
    }
  }

  public showTutorialShopBuy() {
    const buyBtn = this.rootEl.querySelector('#btn-buy-common');
    if (buyBtn) {
      const rootRect = this.rootEl.getBoundingClientRect();
      const bRect = buyBtn.getBoundingClientRect();
      const x = (bRect.left - rootRect.left + bRect.width / 2) / this.scale;
      const y = (bRect.top - rootRect.top + bRect.height / 2) / this.scale;
      this.showTutorialHandAt(x, y, t('tut_open_chest_title'), t('tut_open_chest_desc'), 'DOWN', bRect.width / this.scale + 20, bRect.height / this.scale + 20);
    } else {
      this.showTutorialHandAt(540, 715, t('tut_open_chest_title'), t('tut_open_chest_desc'), 'DOWN', 140, 80);
    }
  }

  public showTutorialLobbyEquip() {
    const equipTabBtn = this.rootEl.querySelector('#nav-tab-equipment');
    if (equipTabBtn) {
      const rootRect = this.rootEl.getBoundingClientRect();
      const bRect = equipTabBtn.getBoundingClientRect();
      const x = (bRect.left - rootRect.left + bRect.width / 2) / this.scale;
      const y = (bRect.top - rootRect.top + bRect.height / 2) / this.scale;
      this.showTutorialHandAt(x, y, t('tut_equip_tab_title'), t('tut_equip_tab_desc'), 'DOWN', 100, 90);
    } else {
      this.showTutorialHandAt(216, 1220, t('tut_equip_tab_title'), t('tut_equip_tab_desc'), 'DOWN', 100, 90);
    }
  }

  public showTutorialEquipGun() {
    const equipBtn = this.rootEl.querySelector('.kid-gun-btn.equip');
    if (equipBtn) {
      const rootRect = this.rootEl.getBoundingClientRect();
      const bRect = equipBtn.getBoundingClientRect();
      const x = (bRect.left - rootRect.left + bRect.width / 2) / this.scale;
      const y = (bRect.top - rootRect.top + bRect.height / 2) / this.scale;
      this.showTutorialHandAt(x, y, t('tut_equip_gun_title'), t('tut_equip_gun_desc'), 'DOWN', bRect.width / this.scale + 16, bRect.height / this.scale + 16);
    } else {
      this.showTutorialHandAt(200, 880, t('tut_equip_gun_title'), t('tut_equip_gun_desc'), 'DOWN', 160, 70);
    }
  }

  public completeTutorial() {
    this.hideTutorialOverlay();
    this.game.tutorialStep = 'COMPLETED';
    this.game.saveData.hasSeenTutorial = true;
    this.game.saveData.tutorialStep = 'COMPLETED';
    this.game.saveGame();
    sound.playVictory();
    this.showGameModal({
      title: t('tut_complete_title'),
      icon: '🎉',
      description: t('tut_complete_desc'),
      actionText: t('action_ok'),
      onAction: () => {
        this.render();
      }
    });
  }
}
