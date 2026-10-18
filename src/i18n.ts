import { GunKind } from './types';

export type Language = 'en' | 'vi';

export interface GunDetailInfo {
  name: string;
  tier: number;
  role: 'Attack' | 'Control' | 'Special' | 'Support Aura' | 'Economy' | 'Tấn Công' | 'Khống Chế' | 'Đặc Biệt' | 'Aura Hỗ Trợ' | 'Kinh Tế';
  bulletType: string;
  mechanic: string;
  fullDesc: string;
  tips: string;
}

let currentLanguage: Language = 'en';

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang === 'vi' ? 'vi' : 'en';
}

export const GUN_NAMES_EN: Record<GunKind, string> = {
  PISTOL: 'PISTOL',
  CROSSBOW: 'STEEL CROSSBOW',
  SLINGSHOT: 'SLINGSHOT',
  SHOTGUN: 'SHOTGUN',
  FLAMER: 'FLAMETHROWER',
  POISON: 'POISON CANNON',
  WIND: 'TORNADO BLASTER',
  BOUNTY: 'BOUNTY HUNTER',
  CRYO: 'FROST CANNON',
  CANNON: 'BOMB CANNON',
  THORN: 'THORN TOTEM',
  SACRIFICE: 'SACRIFICE TOTEM',
  BERSERKER: 'BERSERKER GUN',
  IRON: 'ARMORED CANNON',
  MINE: 'LANDMINE TOTEM',
  AURA_SPEED: 'SPEED TOTEM',
  TESLA: 'TESLA COIL',
  SNIPER: 'SNIPER RIFLE',
  MYSTERY: 'MYSTERY GUN',
  MIMIC: 'MIMIC TOTEM',
  SUMMONER: 'SUMMONER CANNON',
  COMBO: 'COMBO BLASTER',
  BLIZZARD: 'BLIZZARD TOTEM',
  MAGNET: 'MAGNETIC TOTEM',
  AURA_DMG: 'MIGHT TOTEM',
  MINIGUN: 'GATLING MINIGUN',
  TYPHOON: 'TYPHOON BLASTER',
  NUCLEAR: 'NUCLEAR LAUNCHER',
  ASSASSIN: 'ASSASSIN CANNON',
  LASER: 'OPTICAL LASER',
  CHAINSAW: 'CHAINSAW TOTEM',
  TIME: 'CHRONO TOTEM',
  AURA_CRIT: 'CRIT TOTEM',
  METEOR: 'METEOR SHOWER',
  SOLAR: 'SOLAR FLARE',
  LUNAR: 'LUNAR TOTEM',
  HOLY: 'HOLY LIGHT',
  BLACKHOLE: 'BLACK HOLE',
  PRISM: 'PRISM BEAM',
  AURA_ENERGY: 'ENERGY TOTEM',
};

export const GUN_NAMES_VI: Record<GunKind, string> = {
  PISTOL: 'SÚNG LỤC',
  CROSSBOW: 'NỎ THÉP',
  SLINGSHOT: 'NÁ CAO SU',
  SHOTGUN: 'SHOTGUN',
  FLAMER: 'SÚNG LỬA',
  POISON: 'SÚNG ĐỘC',
  WIND: 'SÚNG GIÓ LỐC',
  BOUNTY: 'SÚNG THỢ SĂN',
  CRYO: 'SÚNG BĂNG',
  CANNON: 'ĐẠI BÁC BOM',
  THORN: 'SÚNG CHÔNG GAI',
  SACRIFICE: 'SÚNG HIẾN TẾ',
  BERSERKER: 'SÚNG CUỒNG NỘ',
  IRON: 'SÚNG THIẾT GIÁP',
  MINE: 'SÚNG ĐẶT MÌN',
  AURA_SPEED: 'TRỤ TỐC ĐỘ (AURA)',
  TESLA: 'SÚNG SÉT',
  SNIPER: 'BẮN TỈA BÁO THÙ',
  MYSTERY: 'SÚNG BÍ ẨN (?)',
  MIMIC: 'SÚNG TẮC KÈ (VẠN NĂNG)',
  SUMMONER: 'SÚNG TRIỆU HỒI',
  COMBO: 'SÚNG COMBO',
  BLIZZARD: 'SÚNG BÃO TUYẾT',
  MAGNET: 'SÚNG NAM CHÂM',
  AURA_DMG: 'TRỤ CHIẾN Ý (AURA)',
  MINIGUN: 'MINIGUN 6 NÒNG',
  TYPHOON: 'SÚNG CUỒNG PHONG',
  NUCLEAR: 'SÚNG HẠT NHÂN',
  ASSASSIN: 'SÚNG SÁT THỦ',
  LASER: 'SÚNG LASER QUANG HỌC',
  CHAINSAW: 'SÚNG CƯA MÁY',
  TIME: 'SÚNG ĐỒNG HỒ VŨ TRỤ',
  AURA_CRIT: 'TRỤ BẠO KÍCH (AURA)',
  METEOR: 'BÁNH RĂNG THIÊN THẠCH',
  SOLAR: 'SÚNG THÁI DƯƠNG',
  LUNAR: 'TRỤ NGUYỆT QUANG',
  HOLY: 'SÚNG THÁNH QUANG',
  BLACKHOLE: 'SÚNG HỐ ĐEN',
  PRISM: 'SÚNG LĂNG KÍNH',
  AURA_ENERGY: 'TRỤ NĂNG LƯỢNG (AURA)',
};

export const GUN_DETAILS_EN: Record<GunKind, GunDetailInfo> = {
  PISTOL: {
    name: 'PISTOL',
    tier: 1,
    role: 'Attack',
    bulletType: 'High-Speed Single Shot',
    mechanic: 'Fires rapid single-target bullets with fast, steady reload.',
    fullDesc: 'Basic rapid-fire castle sidearm. Reloads extremely fast when triggered by rotating gears, delivering steady firepower to vanguard foes.',
    tips: 'Place next to high-speed Triggers to maintain a rapid barrage.'
  },
  CROSSBOW: {
    name: 'STEEL CROSSBOW',
    tier: 1,
    role: 'Attack',
    bulletType: 'Piercing Iron Bolts',
    mechanic: 'Fires heavy steel bolts that pierce through up to 3 lined-up targets.',
    fullDesc: 'Launches heavy forged iron bolts piercing through up to 3 monsters in a line. Highly effective when monsters march down corridors towards castle gates.',
    tips: 'Extremely effective at clearing rows of marching enemies.'
  },
  SLINGSHOT: {
    name: 'SLINGSHOT',
    tier: 1,
    role: 'Control',
    bulletType: 'Knockback Pebbles',
    mechanic: 'Fires sturdy pebbles that knock back approaching enemies.',
    fullDesc: 'Launches solid pebbles that knock back targets on hit, buying valuable time for heavy castle weapons to reload.',
    tips: 'Place at long-range vantage points to keep monsters away from walls.'
  },
  SHOTGUN: {
    name: 'SHOTGUN',
    tier: 1,
    role: 'Attack',
    bulletType: '5-Pellet Fan Spread',
    mechanic: 'Discharges a 5-pellet fan spread that shreds close-range clusters.',
    fullDesc: 'Unleashes a wide 5-pellet shotgun blast at close range. Deals massive damage when all pellets hit giant bosses or dense crowds.',
    tips: 'At close range, all 5 pellets hit a single target for 5x damage.'
  },
  FLAMER: {
    name: 'FLAMETHROWER',
    tier: 1,
    role: 'Attack',
    bulletType: 'Explosive AoE Fireball',
    mechanic: 'Fires explosive fireballs leaving a burning fire zone for 3.5s.',
    fullDesc: 'Launches rolling fireballs that detonate on impact into a burning ground patch (R=70px) lasting 3.5s, ticking damage 4 times per second on anything stepping through.',
    tips: 'Combines well with slow effects like Frost Cannon to trap foes in flames.'
  },
  POISON: {
    name: 'POISON CANNON',
    tier: 1,
    role: 'Control',
    bulletType: 'Contagious Acid Spit',
    mechanic: 'Shoots corrosive acid; poisoned enemies explode on death and infect others.',
    fullDesc: 'Fires corrosive green venom dealing damage over time. When a poisoned victim dies, it detonates into toxic fumes that poison all nearby enemies.',
    tips: 'Obliterates fragile Swarm hordes rapidly through chain reactions.'
  },
  WIND: {
    name: 'TORNADO BLASTER',
    tier: 1,
    role: 'Control',
    bulletType: 'Knockback Gale Gust',
    mechanic: 'Blasts fierce gale gusts that knock back all enemies in path by 70px.',
    fullDesc: 'Channels fierce swirling storms knocking back all enemies in its trajectory by 70px, disrupting enemy formations and halting sprinters.',
    tips: 'Completely counters fast Runners and suicidal Bombers.'
  },
  BOUNTY: {
    name: 'BOUNTY HUNTER',
    tier: 1,
    role: 'Economy',
    bulletType: 'Golden Coin Shot',
    mechanic: 'Tags foes with coin mark; tagged kills grant +50% Gold and SP.',
    fullDesc: 'Shoots golden coins marking targets with a bounty crest. Defeated targets yield +50% combat energy (SP) and permanent Gold.',
    tips: 'Best used in early waves to accelerate SP income for rapid expansion.'
  },
  CRYO: {
    name: 'FROST CANNON',
    tier: 2,
    role: 'Control',
    bulletType: 'Sub-Zero Ice Crystals',
    mechanic: 'Slows enemy movement speed by 50% for 3 seconds.',
    fullDesc: 'Fires freezing crystal shards slowing target movement speed by 50% for 3s, giving your defenses ample time to shred them.',
    tips: '1-2 Frost Cannons in your lineup are enough to keep the whole board under control.'
  },
  CANNON: {
    name: 'BOMB CANNON',
    tier: 2,
    role: 'Attack',
    bulletType: 'AoE Siege Shell',
    mechanic: 'Fires heavy siege shells that detonate on impact for splash damage.',
    fullDesc: 'Lobs heavy cast-iron explosive ordnance dealing splash damage to all monsters within blast radius, demolishing compact crowds.',
    tips: 'Pairs exceptionally well with crowd-pulling weapons like Magnetic Totem.'
  },
  THORN: {
    name: 'THORN TOTEM',
    tier: 2,
    role: 'Control',
    bulletType: 'Steel Caltrop Field',
    mechanic: 'Scatters sharp caltrops on path that bleed and slow enemies.',
    fullDesc: 'Deploys sharp steel caltrops across battlefield lanes. Stepping on thorns deals continuous bleeding damage and hinders movement.',
    tips: 'Deploy along main approach corridors to whittle down foes before they reach walls.'
  },
  SACRIFICE: {
    name: 'SACRIFICE TOTEM',
    tier: 2,
    role: 'Economy',
    bulletType: 'Dark Gem Orbs',
    mechanic: 'Merging 2 Sacrifice Totems instantly grants +60 SP Energy!',
    fullDesc: 'Ancient occult sacrifice apparatus. Fires medium-range dark energy, but when you merge 2 Sacrifice totems, instantly grants +60 SP per star tier to summon more weapons!',
    tips: 'The ultimate economic acceleration tool for tactical masters.'
  },
  BERSERKER: {
    name: 'BERSERKER GUN',
    tier: 2,
    role: 'Attack',
    bulletType: 'Blood Moon Rounds',
    mechanic: 'The lower castle HP gets, the faster it fires (up to 3x damage).',
    fullDesc: 'Power scales inversely with castle health. As wall durability drops, Berserker enters a frenzy, boosting fire rate and dealing up to +200% critical damage to turn the tide!',
    tips: 'Your castle savior during desperate last-stand situations.'
  },
  IRON: {
    name: 'ARMORED CANNON',
    tier: 2,
    role: 'Attack',
    bulletType: 'Armor-Piercing Tungsten',
    mechanic: 'Deals 2.5x damage against armored enemies (Shield and Tank).',
    fullDesc: 'Heavy anti-armor battery firing dense tungsten shells. Inflicts 2.5x devastating damage against shielded vanguards and bulky Tanks.',
    tips: 'The hard counter to shielded elites and massive Tank brutes.'
  },
  MINE: {
    name: 'LANDMINE TOTEM',
    tier: 2,
    role: 'Attack',
    bulletType: 'High-Explosive Contact Mines',
    mechanic: 'Lays proximity mines that detonate into massive explosions on contact.',
    fullDesc: 'Ejects mechanical proximity landmines onto battlefield tiles. When stepped on by intruders, detonates into high-yield shockwaves wiping out waves.',
    tips: 'Mines persist indefinitely until an enemy triggers them.'
  },
  AURA_SPEED: {
    name: 'SPEED TOTEM (AURA)',
    tier: 2,
    role: 'Support Aura',
    bulletType: 'Overclock Acceleration Pulse',
    mechanic: 'Passive totem: boosts trigger spin speed by +30% for 4 adjacent cells.',
    fullDesc: 'Mechanical clockwork booster. Emits tachyon pulse waves accelerating rotation speeds by +30% (scales with stars) for all Triggers in adjacent cells (Up, Down, Left, Right).',
    tips: 'Place between rotating Triggers to push castle fire rates to blazing speeds.'
  },
  TESLA: {
    name: 'TESLA COIL',
    tier: 3,
    role: 'Attack',
    bulletType: 'Chained Lightning Arc',
    mechanic: 'Discharges instant lightning arcing across up to 3 adjacent enemies.',
    fullDesc: 'Channels electromagnetic arcs that instantly shock the lead target and chain across 3 nearby enemies, dealing electric damage and brief paralysis.',
    tips: 'Never misses due to instantaneous travel time.'
  },
  SNIPER: {
    name: 'SNIPER RIFLE',
    tier: 3,
    role: 'Attack',
    bulletType: 'Supersonic 4-Pierce Round',
    mechanic: 'Supersonic round piercing 4 enemies with massive full-map damage.',
    fullDesc: 'High-caliber thermal-scoped anti-material rifle. Fires supersonic 1600px/s rounds piercing through 4 enemies with colossal lethal critical damage.',
    tips: 'Specialized for neutralizing dangerous Bosses and Minibosses from afar.'
  },
  MYSTERY: {
    name: 'MYSTERY GUN (?)',
    tier: 3,
    role: 'Special',
    bulletType: 'Spinning ? Enigma Glyphs',
    mechanic: 'Fires spinning ? runes. Morphs into a random weapon after every 10 shots!',
    fullDesc: 'Enigmatic dice firearm. Barrel is a spinning question mark ? firing mystical runes. Every 10 accumulated shots, pulses with magic and transforms into a random weapon of equal or higher tier!',
    tips: 'Golden opportunity to acquire top-tier Legendary and Mythic weapons for free!'
  },
  MIMIC: {
    name: 'MIMIC TOTEM',
    tier: 3,
    role: 'Special',
    bulletType: 'Prismatic Rainbow Shards',
    mechanic: 'WILD CARD MERGE: Can be merged with ANY weapon of the same star level!',
    fullDesc: 'Universal shapeshifter totem. Can be merged with any weapon sharing the same star tier to upgrade that weapon (+1 Level). Merging 2 Mimics together creates a higher-tier Mimic!',
    tips: 'Merge with core damage dealers to boost their star ranks without waiting.'
  },
  SUMMONER: {
    name: 'SUMMONER CANNON',
    tier: 3,
    role: 'Special',
    bulletType: 'Summoning Rift Crystals',
    mechanic: 'Merging 2 Summoners instantly conjures 1 free random weapon on empty cell!',
    fullDesc: 'Dimensional summoning engine. Merging two identical Summoners tears open a rift, immediately summoning a free random tier 1 weapon onto an empty grid tile!',
    tips: 'Maintains numeric superiority on your board without spending extra SP.'
  },
  COMBO: {
    name: 'COMBO BLASTER',
    tier: 3,
    role: 'Attack',
    bulletType: 'Twin Barrage Shards',
    mechanic: 'Every merge adds +1 permanent Combo point (+15% DMG to all Combo Blasters).',
    fullDesc: 'Dual-firing tactical blaster. Each time 2 Combo Blasters are merged, the battle Combo counter increments by +1, granting +15% permanent stacking damage to all Combo Blasters in play!',
    tips: 'In late waves, Combo Blasters become unmatched unstoppable powerhouses.'
  },
  BLIZZARD: {
    name: 'BLIZZARD TOTEM',
    tier: 3,
    role: 'Control',
    bulletType: 'Global Flash Freeze Wave',
    mechanic: 'Every 4s unleashes a blizzard freezing all battlefield monsters for 1.5s.',
    fullDesc: 'Glacial relic engine. Every 4 seconds whips up an intense snowstorm engulfing the entire battlefield, completely freezing all monsters solid for 1.5 seconds.',
    tips: 'The most potent full-screen crowd-control instrument in the game.'
  },
  MAGNET: {
    name: 'MAGNETIC TOTEM',
    tier: 3,
    role: 'Control',
    bulletType: 'Vortex Gravity Orb',
    mechanic: 'Fires magnetic singularity pulling all nearby enemies into a tight cluster.',
    fullDesc: 'Generates intense magnetic vortex fields. Upon detonating, exerts centripetal force dragging all surrounding monsters into a single point for AoE annihilation.',
    tips: 'Matches perfectly with Bomb Cannon, Flamethrower, or Meteor Shower.'
  },
  AURA_DMG: {
    name: 'MIGHT TOTEM (AURA)',
    tier: 3,
    role: 'Support Aura',
    bulletType: 'Crimson War Cry Radiance',
    mechanic: 'Passive totem: grants +30% bonus damage to 4 adjacent weapons.',
    fullDesc: 'Fiery runic battlement tower. Does not fire directly; projects a crimson aura increasing weapon damage by +30% (stacks with stars) for all weapons in 4 adjacent cells.',
    tips: 'Place between primary carries like Sniper or Meteor to maximize firepower.'
  },
  MINIGUN: {
    name: 'GATLING MINIGUN',
    tier: 4,
    role: 'Attack',
    bulletType: 'Gatling Lead Tempest',
    mechanic: 'Unleashes a relentless 6-barrel hurricane of lead at blistering fire rate.',
    fullDesc: 'Spinning 6-barrel rotary cannon. Hyper-fast cycle rates and continuous bullet storms create a wall of lead that repels any monster advance.',
    tips: 'Empower with Might Totem to turn Minigun into an unstoppable meat grinder.'
  },
  TYPHOON: {
    name: 'TYPHOON BLASTER',
    tier: 4,
    role: 'Attack',
    bulletType: 'Supercharged Gale Volley',
    mechanic: 'Every 5s enters Superstorm: +300% fire rate and 100% Crits for 2.5s.',
    fullDesc: 'Fierce stormcannon storing gale energy. Every 5 seconds unleashes Superstorm overdrive, firing at +300% speed with 100% critical strike chance on every hit!',
    tips: 'One of the most terrifying single-target burst-damage dealers in existence.'
  },
  NUCLEAR: {
    name: 'NUCLEAR LAUNCHER',
    tier: 4,
    role: 'Special',
    bulletType: 'Radioactive Atomic Warhead',
    mechanic: 'Merging 2 Nuclear Launchers triggers atomic blast clearing all normal monsters!',
    fullDesc: 'Ultimate tactical deterrence. When 2 identical Nuclear Launchers are merged, sirens blare and an atomic warhead detonates screenwide, clearing all regular monsters and shaving 25% Boss HP!',
    tips: 'Save Nuclear merges as emergency panic buttons when enemies near your gate.'
  },
  ASSASSIN: {
    name: 'ASSASSIN CANNON',
    tier: 4,
    role: 'Special',
    bulletType: 'Phantom Shuriken Dart',
    mechanic: 'When merged, throws a shadow dart randomly upgrading 1 ally weapon by +1 star!',
    fullDesc: 'Phantom shadow battery. Whenever 2 Assassin Cannons are merged, casts an ethereal dart across the board instantly upgrading a random allied weapon by +1 level for free!',
    tips: 'Superb method to bypass tedious merging chains for high-tier weaponry.'
  },
  LASER: {
    name: 'OPTICAL LASER',
    tier: 4,
    role: 'Attack',
    bulletType: 'Continuous Focused Ray',
    mechanic: 'Channels continuous laser; damage doubles every second target stays alive.',
    fullDesc: 'High-energy optical beam concentrating sustained heat onto high-HP targets. Sustained exposure doubles damage output every second, making it the supreme Boss-slayer!',
    tips: 'Melt down bulky Bosses and Minibosses within a matter of seconds.'
  },
  CHAINSAW: {
    name: 'CHAINSAW TOTEM',
    tier: 4,
    role: 'Attack',
    bulletType: 'Ricocheting Sawblade Disk',
    mechanic: 'Launches spinning sawblade ricocheting between monsters and boundary walls.',
    fullDesc: 'Releases high-speed diamond-toothed saw disks screaming across the field. Blades bounce between monsters and walls up to 4 times, lacerating everything.',
    tips: 'Devastating against dense monster swarms due to endless ricochet hits.'
  },
  TIME: {
    name: 'CHRONO TOTEM',
    tier: 4,
    role: 'Control',
    bulletType: 'Spacetime Dilation Wave',
    mechanic: 'Emits time waves slowing enemies by 40% while speeding ally reloads by 25%.',
    fullDesc: 'Temporal battlefield regulator. Radiates chronal disruption fields slowing enemy movements while accelerating weapon reload and trigger cycles for castle forces.',
    tips: 'Dual-purpose utility providing defense and offensive boost across the board.'
  },
  AURA_CRIT: {
    name: 'CRIT TOTEM (AURA)',
    tier: 4,
    role: 'Support Aura',
    bulletType: 'Infrared Targeting Beacon',
    mechanic: 'Passive totem: grants +20% Crit Rate and +50% Crit DMG.',
    fullDesc: 'Hawkeye precision observation relay. Illuminates adjacent tiles with infrared guidance, giving +20% critical chance and +50% critical damage to all 4 neighbors.',
    tips: 'Synergizes with Minigun or Typhoon to trigger constant golden crit cascades.'
  },
  METEOR: {
    name: 'METEOR SHOWER',
    tier: 5,
    role: 'Attack',
    bulletType: 'Colossal Cosmic Meteorite',
    mechanic: 'Calls down apocalyptic meteor crashing with screenwide shockwave damage.',
    fullDesc: 'Mythic catastrophe device. Summons massive burning asteroids crashing from low orbit, exploding into colossal seismic shockwaves that level the battlefield.',
    tips: 'Every meteorite impact releases devastating shockwaves sweeping all lanes.'
  },
  SOLAR: {
    name: 'SOLAR FLARE',
    tier: 5,
    role: 'Attack',
    bulletType: 'Solar Thermal Beam (5x DMG)',
    mechanic: 'Activates Solar Divinity when count is exactly 1, 4, or 9 (deals 5x Damage)!',
    fullDesc: 'Sun god weapon inspired by Random Dice. When the total count of Solar guns on your board equals sacred tiers (exactly 1, 4, or 9), ignites blinding solar rays dealing 5x damage!',
    tips: 'Maintain your board Solar count precisely at 1, 4, or 9 to sustain godly power.'
  },
  LUNAR: {
    name: 'LUNAR TOTEM',
    tier: 5,
    role: 'Support Aura',
    bulletType: 'Mystic Moonlight Aura',
    mechanic: 'Activates at 1, 4, or 9 Lunar totems: doubles (+100%) Damage and Speed of neighbors!',
    fullDesc: 'Celestial moonlight conduit. When exact counts of 1, 4, or 9 Lunar totems are active on field, shines with moonlight doubling all damage and attack speed for adjacent weapons!',
    tips: 'The Solar + Lunar combination is the ultimate endgame world-record synergy.'
  },
  HOLY: {
    name: 'HOLY LIGHT',
    tier: 5,
    role: 'Attack',
    bulletType: 'Sacred Beam (% Max HP)',
    mechanic: 'Fires holy rays dealing bonus damage equal to 8% of target Max HP.',
    fullDesc: 'Pure sanctified radiance weapon. Pierces armor to inflict bonus damage equal to 8% of enemy maximum health, vaporizing high-HP titans in blinks!',
    tips: 'Scales infinitely against high-wave Bosses with massive health pools.'
  },
  BLACKHOLE: {
    name: 'BLACK HOLE',
    tier: 5,
    role: 'Control',
    bulletType: 'Crushing Singularity Vortex',
    mechanic: 'Shoots miniature cosmic black hole crushing all foes inside event horizon for 3s.',
    fullDesc: 'Unleashes a gravitational singularity opening into a cosmic event horizon. Drags all nearby invaders into its epicenter, crushing them under immense gravitational pressure.',
    tips: 'Pulls the entire screen into one focal point for instant AoE annihilation.'
  },
  PRISM: {
    name: 'PRISM BEAM',
    tier: 5,
    role: 'Attack',
    bulletType: 'Spectral 3-Way Split Beam',
    mechanic: 'Fires spectral beam that splits into 3 refracted rainbow lasers on hit.',
    fullDesc: '7-color crystal prism projector. Emits pure spectral light; on striking its primary mark, refracts and splits into 3 secondary beams tracking nearby targets.',
    tips: 'Fills the screen with rainbow lasers, dealing multi-directional devastation.'
  },
  AURA_ENERGY: {
    name: 'ENERGY TOTEM (AURA)',
    tier: 5,
    role: 'Economy',
    bulletType: 'Cosmic Aether Crystal',
    mechanic: 'Supreme passive totem: Automatically generates +8 SP Energy every 4 seconds.',
    fullDesc: 'Perpetual energy aether crystal. Channels cosmic mana into +8 battlefield SP directly into your reserves every 4 seconds, enabling nonstop rolls and rapid upgrades!',
    tips: 'Eliminates SP starvation during relentless boss and swarm waves.'
  },
};

export const GUN_DETAILS_VI: Record<GunKind, GunDetailInfo> = {
  PISTOL: {
    name: 'SÚNG LỤC',
    tier: 1,
    role: 'Tấn Công',
    bulletType: 'Đạn Đơn Tốc Độ Cao',
    mechanic: 'Bắn tia đạn đơn mục tiêu, nạp đạn nhanh và đều đặn.',
    fullDesc: 'Súng lục liên thanh cơ bản của lâu đài. Tốc độ nạp đạn cực nhanh khi được Cò xoay gõ nhịp, xả đạn ổn định liên tục vào quái đi đầu.',
    tips: 'Đặt cạnh các Cò có tốc độ xoay cao để duy trì nhịp bắn dồn dập.'
  },
  CROSSBOW: {
    name: 'NỎ THÉP',
    tier: 1,
    role: 'Tấn Công',
    bulletType: 'Tên Sắt Xuyên Thấu',
    mechanic: 'Bắn mũi tên thép xuyên qua tối đa 3 mục tiêu thẳng hàng.',
    fullDesc: 'Bắn ra những mũi tên thép đúc nặng xuyên qua tối đa 3 quái vật liên tiếp. Rất mạnh khi quái vật đi thành hàng dọc hướng về cổng thành.',
    tips: 'Cực kỳ hiệu quả trong việc dọn dẹp các đợt quái đi theo hàng thẳng.'
  },
  SLINGSHOT: {
    name: 'NÁ CAO SU',
    tier: 1,
    role: 'Khống Chế',
    bulletType: 'Sỏi Cuội Đẩy Lùi',
    mechanic: 'Bắn đạn sỏi cuội gây lực đẩy lùi kẻ địch về phía sau.',
    fullDesc: 'Bắn ra những viên sỏi cuội cứng cáp hất văng mục tiêu lùi lại mỗi khi trúng đích, câu giờ quý giá cho các súng khác xả đạn.',
    tips: 'Đặt ở các vị trí có tầm bắn xa để ngăn quái áp sát cổng thành.'
  },
  SHOTGUN: {
    name: 'SHOTGUN',
    tier: 1,
    role: 'Tấn Công',
    bulletType: 'Chùm 5 Đạn Chì Góc Quạt',
    mechanic: 'Xòe chùm 5 viên đạn chì hình quạt càn quét quái áp sát.',
    fullDesc: 'Xả chùm 5 viên đạn hoa cải cự ly gần. Sát thương cực lớn khi toàn bộ chùm đạn bắn trúng các mục tiêu khổng lồ hoặc cụm quái đông đảo.',
    tips: 'Càng bắn ở cự ly gần, toàn bộ 5 viên đạn trúng cùng 1 mục tiêu gây sát thương x5.'
  },
  FLAMER: {
    name: 'SÚNG LỬA',
    tier: 1,
    role: 'Tấn Công',
    bulletType: 'Cầu Lửa Thiêu Đốt AoE',
    mechanic: 'Bắn cầu lửa phát nổ tạo Vùng Lửa thiêu đốt trong 3.5s.',
    fullDesc: 'Bắn 1 quả cầu lửa cuồn cuộn bay thẳng vào mục tiêu. Khi chạm quái hoặc rìa thành phát nổ tạo Vùng Lửa (R=70px) trong 3.5s, gây sát thương liên tục 4 lần/giây lên mọi kẻ địch bước qua.',
    tips: 'Rất mạnh khi kết hợp với súng làm chậm như Súng Băng để giữ quái đứng trong lửa.'
  },
  POISON: {
    name: 'SÚNG ĐỘC',
    tier: 1,
    role: 'Khống Chế',
    bulletType: 'Axit Ăn Mòn Lây Lan',
    mechanic: 'Bắn dịch độc ăn mòn; quái chết nổ độc lây sang xung quanh.',
    fullDesc: 'Bắn ra dịch axit xanh ăn mòn khiến quái bị trúng độc rút máu liên tục. Khi một quái nhiễm độc bị tiêu diệt, nó sẽ nổ tung lây độc sang tất cả quái vật lân cận.',
    tips: 'Dọn các đàn quái Swarm máu mỏng cực nhanh nhờ phản ứng dây chuyền.'
  },
  WIND: {
    name: 'SÚNG GIÓ LỐC',
    tier: 1,
    role: 'Khống Chế',
    bulletType: 'Gió Lốc Hất Tung',
    mechanic: 'Bắn luồng gió bão hất quái trên đường bay lùi lại 70px.',
    fullDesc: 'Phóng ra luồng gió xoáy dữ dội hất tung toàn bộ kẻ địch cản đường lùi lại 70px, phá vỡ đội hình quái vật và chặn đứng các đợt chạy nhanh.',
    tips: 'Khắc chế hoàn toàn quái Runner chạy nhanh và quái Bomber liều chết.'
  },
  BOUNTY: {
    name: 'SÚNG THỢ SĂN',
    tier: 1,
    role: 'Kinh Tế',
    bulletType: 'Đồng Xu Hoàng Kim',
    mechanic: 'Bắn đạn tiền xu đánh dấu quái; hạ gục rơi thêm +50% Vàng/SP.',
    fullDesc: 'Bắn những đồng tiền vàng đánh dấu ấn tiền thưởng lên quái vật. Kẻ địch mang ấn khi bị hạ gục sẽ thưởng thêm +50% Năng lượng chiến đấu (SP) và Vàng vĩnh viễn.',
    tips: 'Nên dùng ở những đợt đầu trận để gia tăng lượng SP mua thêm nhiều súng.'
  },
  CRYO: {
    name: 'SÚNG BĂNG',
    tier: 2,
    role: 'Khống Chế',
    bulletType: 'Tinh Thể Băng Giá',
    mechanic: 'Làm chậm 50% tốc độ di chuyển của kẻ địch trong 3 giây.',
    fullDesc: 'Bắn ra những mảnh tinh thể băng tuyết cực lạnh làm chậm 50% tốc độ di chuyển của kẻ địch trong 3 giây, giúp toàn đội hình có nhiều thời gian gây sát thương.',
    tips: 'Chỉ cần 1-2 súng Băng trong đội hình là đủ kiểm soát tốc độ quái vật.'
  },
  CANNON: {
    name: 'ĐẠI BÁC BOM',
    tier: 2,
    role: 'Tấn Công',
    bulletType: 'Đạn Pháo Nổ Lan (AoE)',
    mechanic: 'Bắn đạn pháo công thành phát nổ lan diện rộng khi va chạm.',
    fullDesc: 'Bắn đạn pháo gang hạng nặng phát nổ khi va chạm, gây sát thương toàn bộ quái vật trong bán kính vụ nổ, xé toạc các cụm quái tụ tập đông đúc.',
    tips: 'Sức công phá AoE cực mạnh, kết hợp hoàn hảo với súng Gom Quái / Nam Châm.'
  },
  THORN: {
    name: 'SÚNG CHÔNG GAI',
    tier: 2,
    role: 'Khống Chế',
    bulletType: 'Bẫy Chông Gai Thép',
    mechanic: 'Rải bẫy chông sắt gai trên đường di chuyển của quái vật.',
    fullDesc: 'Bắn các cụm chông sắt cắm xuống chiến trường. Quái vật bước qua chông sẽ nhận sát thương liên tục và bị chảy máu giảm tốc độ.',
    tips: 'Đặt trước lối đi chính để bào mòn sinh lực quái vật trước khi chúng tới gần thành.'
  },
  SACRIFICE: {
    name: 'SÚNG HIẾN TẾ',
    tier: 2,
    role: 'Kinh Tế',
    bulletType: 'Hắc Ngọc Năng Lượng',
    mechanic: 'Khi GHÉP (Merge) 2 súng này, nhận ngay +60 Năng Lượng (SP)!',
    fullDesc: 'Súng cổ thuật hiến tế. Bản thân súng bắn đạn hắc ngọc tầm trung, nhưng khi bạn kéo GHÉP 2 súng Sacrifice lại với nhau, bạn nhận ngay một lượng lớn SP (+60 x Cấp sao) để mua thêm súng mới!',
    tips: 'Công cụ tăng tốc kinh tế tuyệt đỉnh của các cao thủ Random Dice.'
  },
  BERSERKER: {
    name: 'SÚNG CUỒNG NỘ',
    tier: 2,
    role: 'Tấn Công',
    bulletType: 'Đạn Huyết Nguyệt',
    mechanic: 'Lâu đài càng ít máu thì súng bắn càng nhanh và gây x3 sát thương.',
    fullDesc: 'Sức mạnh tỉ lệ nghịch với lượng máu còn lại của Lâu đài. Khi Lâu đài tụt máu, súng nổi giận tăng tốc xả đạn và gây tới +200% sát thương bạo nộ để lật ngược tình thế!',
    tips: 'Cứu tinh trong những đợt phòng thủ hiểm nghèo cận kề thất bại.'
  },
  IRON: {
    name: 'SÚNG THIẾT GIÁP',
    tier: 2,
    role: 'Tấn Công',
    bulletType: 'Đạn Hợp Kim Xuyên Giáp',
    mechanic: 'Gây x2.5 sát thương lên quái có Giáp (Shield và Tank).',
    fullDesc: 'Súng thiết giáp hạng nặng bắn đạn vonfram đặc biệt. Gây sát thương cực lớn gấp 2.5 lần lên các mục tiêu mang khiên bảo vệ và quái Tank trâu máu.',
    tips: 'Khắc tinh số 1 của quái Shield mang khiên và quái Khổng Lồ Tank.'
  },
  MINE: {
    name: 'SÚNG ĐẶT MÌN',
    tier: 2,
    role: 'Tấn Công',
    bulletType: 'Mìn Cảm Ứng Nổ Lớn',
    mechanic: 'Rải mìn cảm ứng dưới chân quái, giẫm phải phát nổ cực lớn.',
    fullDesc: 'Bắn ra những quả mìn cơ khí nằm chờ trên chiến trường. Khi kẻ địch chạm phải, mìn kích nổ chấn động gây sát thương diện rộng xóa sổ cả đàn quái.',
    tips: 'Mìn không biến mất theo thời gian cho tới khi có quái giẫm phải.'
  },
  AURA_SPEED: {
    name: 'TRỤ TỐC ĐỘ (AURA)',
    tier: 2,
    role: 'Aura Hỗ Trợ',
    bulletType: 'Hào Quang Đồng Hồ Gia Tốc',
    mechanic: 'Trụ hỗ trợ không bắn, tăng +30% tốc xoay Cò cho 4 ô liền kề.',
    fullDesc: 'Trụ cơ khí tăng tốc hào quang. Không trực tiếp bắn đạn, phát sóng gia tốc tăng +30% tốc độ xoay (tăng theo cấp sao) cho tất cả Cò nằm ở 4 ô liền kề (Trên, Dưới, Trái, Phải).',
    tips: 'Đặt trụ này giữa các Cò xoay để đẩy tốc độ bắn của cả lâu đài lên mức chóng mặt.'
  },
  TESLA: {
    name: 'SÚNG SÉT',
    tier: 3,
    role: 'Tấn Công',
    bulletType: 'Tia Điện Từ Giật Chuỗi',
    mechanic: 'Phóng tia sét giật tức thì và truyền dẫn sang 3 quái lân cận.',
    fullDesc: 'Phóng ra tia sét điện trường tức thì đánh trúng mục tiêu và giật liên hoàn sang 3 quái vật lân cận, gây sát thương điện và làm tê liệt chớp nhoáng.',
    tips: 'Không sợ trượt đạn vì tia sét đánh trúng mục tiêu ngay lập tức trong nháy mắt.'
  },
  SNIPER: {
    name: 'BẮN TỈA BÁO THÙ',
    tier: 3,
    role: 'Tấn Công',
    bulletType: 'Đạn Siêu Thanh Xuyên 4 Quái',
    mechanic: 'Đạn siêu thanh xuyên 4 quái, sát thương cực lớn toàn bản đồ.',
    fullDesc: 'Súng ngắm bắn tỉa nòng dài tầm nhiệt. Bắn ra viên đạn siêu thanh với tốc độ 1600px/s xuyên qua 4 mục tiêu liên tiếp với sát thương chí mạng khổng lồ.',
    tips: 'Đặc trị các mục tiêu Boss và Miniboss nguy hiểm từ xa.'
  },
  MYSTERY: {
    name: 'SÚNG BÍ ẨN (?)',
    tier: 3,
    role: 'Đặc Biệt',
    bulletType: 'Ký Hiệu ? Xoay Vòng Biến Ảo',
    mechanic: 'Bắn đạn dấu hỏi ? xoay vòng. Sau 10 phát bắn tự động biến hóa ngẫu nhiên!',
    fullDesc: 'Khẩu súng xúc xắc bí ẩn phong cách Random Dice. Nòng súng là dấu hỏi ?, bắn ra các ký hiệu ? xoay tít trên không. Sau mỗi 10 phát bắn tích lũy, súng bừng sáng kỳ ảo và tự động biến thành một súng hoặc trụ ngẫu nhiên với cấp sao bất ngờ!',
    tips: 'Cơ hội vàng để đột phá nhận được các súng Huyền Thoại và Thần Thoại miễn phí!'
  },
  MIMIC: {
    name: 'SÚNG TẮC KÈ (VẠN NĂNG)',
    tier: 3,
    role: 'Đặc Biệt',
    bulletType: 'Đạn Đa Sắc Cầu Vồng',
    mechanic: 'GHÉP VẠN NĂNG: Ghép được với BẤT KỲ súng nào cùng cấp sao!',
    fullDesc: 'Súng tắc kè vạn năng có thể ghép với bất kỳ súng nào cùng cấp sao để nâng cấp súng đó lên sao cao hơn (+1 Level). Khi ghép 2 súng Tắc Kè với nhau, sẽ nâng cấp thành súng Tắc Kè cấp sao cao hơn!',
    tips: 'Ghép 2 súng Tắc Kè để tạo Tắc Kè 2 sao, hoặc ghép với súng khác để nâng cấp súng đó.'
  },
  SUMMONER: {
    name: 'SÚNG TRIỆU HỒI',
    tier: 3,
    role: 'Đặc Biệt',
    bulletType: 'Tinh Thể Triệu Hoán',
    mechanic: 'Khi ghép 2 súng Summoner, lập tức triệu hồi thêm 1 súng ngẫu nhiên miễn phí!',
    fullDesc: 'Súng ma thuật triệu hoán. Khi bạn kéo ghép 2 súng Summoner cùng cấp, một cánh cổng không gian mở ra và lập tức triệu hồi thêm 1 súng ngẫu nhiên cấp 1 vào ô trống bất kỳ trên bàn cờ!',
    tips: 'Giúp bạn luôn duy trì số lượng súng áp đảo trên bàn cờ mà không tốn SP.'
  },
  COMBO: {
    name: 'SÚNG COMBO',
    tier: 3,
    role: 'Tấn Công',
    bulletType: 'Đạn Song Kích Liên Hoàn',
    mechanic: 'Mỗi lần merge tăng +1 điểm Combo vĩnh viễn, tăng +15% damage toàn bộ súng Combo.',
    fullDesc: 'Mỗi khi bạn merge 2 súng Combo lại với nhau, điểm Combo của trận chiến sẽ tăng thêm +1. Tất cả súng Combo trên bàn cờ được tăng vĩnh viễn +15% sát thương cho mỗi điểm Combo tích lũy!',
    tips: 'Càng về các đợt Wave sau, súng Combo càng trở thành quái vật sát thương không đối thủ.'
  },
  BLIZZARD: {
    name: 'SÚNG BÃO TUYẾT',
    tier: 3,
    role: 'Khống Chế',
    bulletType: 'Bão Tuyết Đóng Băng Toàn Sân',
    mechanic: 'Định kỳ 4s tạo bão tuyết đóng băng toàn bộ quái vật trong 1.5s.',
    fullDesc: 'Súng cổ vật băng hà. Mỗi 4 giây kích hoạt một trận bão tuyết mù mịt bao trùm toàn bộ chiến trường, đóng băng cứng ngắc mọi quái vật trên sân trong 1.5 giây.',
    tips: 'Khả năng khống chế diện rộng toàn màn hình mạnh nhất trong game.'
  },
  MAGNET: {
    name: 'SÚNG NAM CHÂM',
    tier: 3,
    role: 'Khống Chế',
    bulletType: 'Cầu Từ Trường Hút Quái',
    mechanic: 'Bắn cầu từ trường hút gom toàn bộ quái vật lại 1 điểm.',
    fullDesc: 'Bắn ra khối từ trường cực mạnh. Khi phát nổ, nó tạo lực hút xoáy gom toàn bộ kẻ địch xung quanh dồn lại thành một cụm để các súng diện rộng tiêu diệt.',
    tips: 'Cặp đôi hoàn hảo với Đại Bác Bom hoặc Súng Lửa.'
  },
  AURA_DMG: {
    name: 'TRỤ CHIẾN Ý (AURA)',
    tier: 3,
    role: 'Aura Hỗ Trợ',
    bulletType: 'Hào Quang Sát Thương Đỏ Rực',
    mechanic: 'Trụ hỗ trợ không bắn, tăng +30% sát thương cho súng ở 4 ô liền kề.',
    fullDesc: 'Tháp cổ ngữ chiến ý rực lửa. Không trực tiếp xả đạn, tỏa hào quang uy lực tăng +30% sát thương (cộng dồn theo cấp sao) cho tất cả súng đặt ở 4 ô liền kề (Trên, Dưới, Trái, Phải).',
    tips: 'Đặt giữa các súng chủ lực như Sniper, Meteor để tối ưu hóa hỏa lực.'
  },
  MINIGUN: {
    name: 'MINIGUN 6 NÒNG',
    tier: 4,
    role: 'Tấn Công',
    bulletType: 'Mưa Bão Đạn Liên Thanh',
    mechanic: 'Xả mưa bão đạn liên thanh 6 nòng với tốc độ xả cực nhanh.',
    fullDesc: 'Khẩu đại liên 6 nòng xoay tít càn quét chiến trường. Tốc độ nạp đạn siêu tốc và khả năng xả mưa đạn liên tục khiến không quái vật nào có thể tiến bước.',
    tips: 'Tận dụng buff sát thương từ Trụ Chiến Ý để biến Minigun thành máy nghiền quái.'
  },
  TYPHOON: {
    name: 'SÚNG CUỒNG PHONG',
    tier: 4,
    role: 'Tấn Công',
    bulletType: 'Đạn Phong Lôi Siêu Tốc',
    mechanic: 'Mỗi 5s bước vào trạng thái Siêu Bão: +300% tốc độ và 100% Bạo Kích trong 2.5s.',
    fullDesc: 'Khẩu súng phong lôi cuồng bạo. Tự động tích lũy năng lượng gió; mỗi 5 giây súng bùng nổ trạng thái Siêu Bão Cuồng Nộ, tăng 300% tốc độ xả đạn và toàn bộ phát bắn đều là Bạo Kích x2 sát thương!',
    tips: 'Một trong những khẩu súng dồn sát thương đơn mục tiêu khủng khiếp nhất.'
  },
  NUCLEAR: {
    name: 'SÚNG HẠT NHÂN',
    tier: 4,
    role: 'Đặc Biệt',
    bulletType: 'Tên Lửa Nguyên Tử Phóng Xạ',
    mechanic: 'Khi ghép 2 súng Nuclear, nổ Hạt Nhân xóa sổ quái thường toàn màn hình!',
    fullDesc: 'Vũ khí nguyên tử tối thượng. Khi bạn kéo GHÉP 2 súng Nuclear cùng cấp, còi báo động vang lên và một quả bom hạt nhân phát nổ rung chuyển toàn màn hình, xóa sổ toàn bộ quái thường và rút 25% máu của Boss!',
    tips: 'Lưu giữ các súng Nuclear để kích nổ giải nguy khi quái tràn ngập sắp chạm vào tường thành.'
  },
  ASSASSIN: {
    name: 'SÚNG SÁT THỦ',
    tier: 4,
    role: 'Đặc Biệt',
    bulletType: 'Phi Tiêu Ám Sát Thần Tốc',
    mechanic: 'Khi merge, phóng phi tiêu nâng cấp ngẫu nhiên 1 súng đồng minh thêm +1 cấp sao!',
    fullDesc: 'Súng ám sát thần xuất quỷ nhập. Mỗi lần bạn merge 2 súng Assassin, nó phóng ra một phi tiêu bóng tối bay tới 1 súng đồng minh ngẫu nhiên trên bàn cờ và lập tức nâng cấp súng đó lên +1 Level miễn phí!',
    tips: 'Cách tuyệt vời để nâng cấp các súng cấp cao mà không tốn công gộp nhiều bước.'
  },
  LASER: {
    name: 'SÚNG LASER QUANG HỌC',
    tier: 4,
    role: 'Tấn Công',
    bulletType: 'Tia Laser Hội Tụ Liên Tục',
    mechanic: 'Chiếu tia laser liên tục vào quái; sát thương tăng gấp đôi mỗi giây mục tiêu còn sống.',
    fullDesc: 'Súng quang học chiếu tia laser tập trung năng lượng cao vào kẻ địch nhiều máu nhất. Càng chiếu lâu trên cùng một mục tiêu, sát thương tăng gấp đôi mỗi giây, là hung thần diệt Boss số 1!',
    tips: 'Cực mạnh để kết liễu Boss và Miniboss trong vài giây.'
  },
  CHAINSAW: {
    name: 'SÚNG CƯA MÁY',
    tier: 4,
    role: 'Tấn Công',
    bulletType: 'Lưỡi Cưa Thép Nảy Liên Hoàn',
    mechanic: 'Bắn lưỡi cưa sắt xoay tròn nảy liên hoàn giữa các quái và vách tường.',
    fullDesc: 'Phóng ra những lưỡi cưa răng cưa sắc bén rít lên trên chiến trường. Lưỡi cưa nảy qua lại giữa các quái vật và rìa bản đồ tối đa 4 lần, gây sát thương chém ngọt.',
    tips: 'Cực mạnh trong các đợt quái đông đúc vì lưỡi cưa nảy liên tục không ngừng.'
  },
  TIME: {
    name: 'SÚNG ĐỒNG HỒ VŨ TRỤ',
    tier: 4,
    role: 'Khống Chế',
    bulletType: 'Sóng Thời Gian Không Gian',
    mechanic: 'Sóng thời gian làm chậm 40% toàn bộ quái và tăng 25% tốc nạp đạn súng đồng minh.',
    fullDesc: 'Kiểm soát dòng thời gian chiến trường. Phát ra các xung sóng thời gian làm chậm nhịp di chuyển của quái vật đồng thời đẩy nhanh tốc độ lên đạn của toàn bộ súng quân ta.',
    tips: 'Đa dụng cả công lẫn thủ, hỗ trợ toàn diện cho mọi đội hình.'
  },
  AURA_CRIT: {
    name: 'TRỤ BẠO KÍCH (AURA)',
    tier: 4,
    role: 'Aura Hỗ Trợ',
    bulletType: 'Hào Quang Ngắm Bắn Hồng Ngoại',
    mechanic: 'Trụ hỗ trợ không bắn, tăng +20% Tỉ lệ Crit và +50% Sát Thương Bạo Kích.',
    fullDesc: 'Đài ngắm chuẩn Mắt Đại Bàng. Tỏa hào quang hồng ngoại tăng +20% tỉ lệ Bạo Kích và +50% sát thương bạo kích cho tất cả súng đặt tại 4 ô lân cận.',
    tips: 'Kết hợp cùng súng Minigun hoặc Typhoon để tạo nên những cơn bão sát thương vàng rực.'
  },
  METEOR: {
    name: 'BÁNH RĂNG THIÊN THẠCH',
    tier: 5,
    role: 'Tấn Công',
    bulletType: 'Thiên Thạch Vũ Trụ Khổng Lồ',
    mechanic: 'Triệu hồi thiên thạch rơi xuống phát nổ hủy diệt toàn sàn đấu.',
    fullDesc: 'Vũ khí cự đại cấp Thần Thoại. Triệu hồi thiên thạch khổng lồ từ không gian lao thẳng xuống mặt đất, phát nổ sóng xung kích cực đại quét sạch chiến trường.',
    tips: 'Mỗi cú va chạm của thiên thạch đều tạo ra chấn động hủy diệt mọi kẻ thù.'
  },
  SOLAR: {
    name: 'SÚNG THÁI DƯƠNG',
    tier: 5,
    role: 'Tấn Công',
    bulletType: 'Chùm Tia Nhiệt Quang Thái Dương',
    mechanic: 'Kích hoạt Thái Dương Thần Thánh khi có đúng 1, 4 hoặc 9 súng Solar (x5 Sát Thương)!',
    fullDesc: 'Súng Mặt Trời Thái Dương phong cách Random Dice. Khi số lượng súng Solar trên bàn cờ đạt đúng mốc thần thánh (1, 4 hoặc 9 súng), toàn bộ súng Solar bừng sáng ánh dương rực rỡ, bắn ra chùm tia nhiệt quang hủy diệt với sát thương x5 lần!',
    tips: 'Hãy giữ số lượng súng Solar trên sân luôn chuẩn xác ở mức 1, 4 hoặc 9 khẩu.'
  },
  LUNAR: {
    name: 'TRỤ NGUYỆT QUANG',
    tier: 5,
    role: 'Aura Hỗ Trợ',
    bulletType: 'Hào Quang Ánh Trăng Huyền Ảo',
    mechanic: 'Trụ Nguyệt Quang: Kích hoạt khi có 1, 4 hoặc 9 súng Lunar, tăng +100% DMG và Tốc độ.',
    fullDesc: 'Trụ ánh trăng huyền ảo. Khi số lượng súng Lunar trên sân đạt đúng 1, 4 hoặc 9 súng, nó phát ra vầng trăng sáng rực nhân đôi toàn bộ chỉ số sát thương và tốc độ cho các súng lân cận!',
    tips: 'Bộ đôi Solar + Lunar là sự kết hợp tối thượng càn quét mọi kỷ lục vô tận.'
  },
  HOLY: {
    name: 'SÚNG THÁNH QUANG',
    tier: 5,
    role: 'Tấn Công',
    bulletType: 'Tia Sáng Thánh Thiện (% Máu)',
    mechanic: 'Bắn tia thánh quang gây thêm sát thương bằng 8% Máu Tối Đa của kẻ địch.',
    fullDesc: 'Súng ánh sáng thánh khiết. Đạn thánh quang không phụ thuộc vào giáp, gây thêm sát thương bằng 8% lượng máu tối đa của quái vật. Đánh bại cả những con Boss trâu bò nhất trong nháy mắt!',
    tips: 'Boss càng nhiều máu ở các Wave cao thì súng Thánh Quang bắn càng đau.'
  },
  BLACKHOLE: {
    name: 'SÚNG HỐ ĐEN',
    tier: 5,
    role: 'Khống Chế',
    bulletType: 'Hố Đen Không Gian Hút Nghiền Nát',
    mechanic: 'Bắn ra hố đen vũ trụ hút nghiền nát mọi kẻ địch trong tâm trong 3 giây.',
    fullDesc: 'Phóng ra một điểm kỳ dị không gian mở thành Hố Đen vũ trụ. Hút xoáy toàn bộ quái vật xung quanh vào tâm điểm và nghiền nát chúng bằng lực hấp dẫn cực lớn.',
    tips: 'Tập trung toàn bộ quái vật trên sàn đấu về một điểm để tiêu diệt sạch sẽ.'
  },
  PRISM: {
    name: 'SÚNG LĂNG KÍNH',
    tier: 5,
    role: 'Tấn Công',
    bulletType: 'Tia Sáng Quang Phổ Khúc Xạ 3',
    mechanic: 'Bắn tia sáng quang phổ; chạm quái phân rã thành 3 tia khúc xạ bắn tiếp.',
    fullDesc: 'Súng lăng kính pha lê 7 màu. Bắn ra luồng sáng thuần khiết; ngay khi chạm vào mục tiêu đầu tiên, tia sáng khúc xạ tách thành 3 tia chùm cầu vồng bắn tiếp sang các kẻ địch xung quanh.',
    tips: 'Mỗi phát bắn tạo ra cơn mưa tia sáng bao phủ toàn bộ chiến trường.'
  },
  AURA_ENERGY: {
    name: 'TRỤ NĂNG LƯỢNG (AURA)',
    tier: 5,
    role: 'Kinh Tế',
    bulletType: 'Tinh Thể Năng Lượng Vũ Trụ',
    mechanic: 'Trụ hỗ trợ tối thượng: Tự động sản sinh +8 Năng Lượng (SP) mỗi 4 giây.',
    fullDesc: 'Trụ tinh thể năng lượng vĩnh cửu. Hấp thụ năng lượng vũ trụ tự động cộng ngay +8 SP chiến đấu vào túi của bạn mỗi 4 giây, giúp bạn roll súng và nâng cấp vượt bậc!',
    tips: 'Giải quyết triệt để vấn đề thiếu hụt SP ở các đợt Wave căng thẳng.'
  },
};

export function getGunName(kind: GunKind, lang: Language = currentLanguage): string {
  if (lang === 'vi') return GUN_NAMES_VI[kind] || GUN_NAMES_EN[kind] || kind;
  return GUN_NAMES_EN[kind] || kind;
}

export function getGunDetail(kind: GunKind, lang: Language = currentLanguage): GunDetailInfo {
  if (lang === 'vi') return GUN_DETAILS_VI[kind] || GUN_DETAILS_EN[kind];
  return GUN_DETAILS_EN[kind] || GUN_DETAILS_VI[kind];
}

const TRANSLATIONS = {
  en: {
    // Top Bar
    highest_stage: 'Highest Stage',
    weapons: 'Weapons',
    profile_exp: 'EXP',
    profile_highest_stage: 'Highest Stage',
    profile_weapons: 'Weapons',
    
    // Bottom Nav
    tab_shop: 'Shop',
    tab_arsenal: 'Arsenal',
    tab_home: 'Home',
    tab_talents: 'Talents',
    tab_modes: 'Modes',

    // Settings
    settings_title: 'SETTINGS',
    settings_subtitle: 'Audio & Game Controls',
    settings_music: 'Background Music',
    settings_music_sub: 'Lobby & Battle soundtrack',
    settings_sfx: 'Sound Effects (VFX)',
    settings_sfx_sub: 'Gunfire, explosions & skills',
    settings_master: 'Master Audio',
    settings_master_sub: 'Mute or enable all sound',
    settings_lang: 'Language',
    settings_lang_sub: 'Switch language (EN / VI)',
    settings_version: 'Version',
    settings_boost: '⚡ BOOST',
    settings_ok: 'OK',
    on: 'ON',
    off: 'OFF',
    mute: 'MUTE',

    // World Tab
    stage: 'Stage',
    quests: 'Quests',
    pass: 'Pass',
    guide: 'Guide',
    harvest: 'Harvest',
    chest: 'Chest',
    battle: 'BATTLE',
    energy_cost: '⚡ 5 Energy',
    stage_locked_alert: 'Stage {0} is locked! Clear previous stages first.',

    // Maps
    map_1_name: 'Green Forest',
    map_1_desc: 'Verdant Woods',
    map_2_name: 'Frozen Peaks',
    map_2_desc: 'Snowy Mountains',
    map_3_name: 'Golden Dunes',
    map_3_desc: 'Scorching Desert',
    map_4_name: 'Magma Citadel',
    map_4_desc: 'Volcano Caldera',
    map_5_name: 'Cyber Ruins',
    map_5_desc: 'Synthwave Metropolis',
    map_6_name: 'Shadow Crypt',
    map_6_desc: 'Cursed Graveyard',
    map_7_name: 'Celestial Sanctuary',
    map_7_desc: 'High Heavens',

    // Shop Tab
    shop_bronze_title: 'BRONZE CHEST',
    shop_royal_title: '👑 ROYAL CHEST',
    shop_gold_pack: 'FREE GOLD REWARD',
    shop_gem_pack: 'FREE GEM REWARD',
    shop_daily_gift: 'DAILY GIFT',
    shop_claim_free: 'CLAIM FREE',
    shop_claim: '🎁 CLAIM',
    shop_gold: 'Gold',
    shop_gems: 'Gems',
    shop_chip_weapons: '🔫 Weapons',
    shop_chip_vip_weapons: '🔥 VIP Weapons',
    shop_daily_claimed: 'Already claimed today! Come back tomorrow.',
    shop_ad_progress: 'Ad Reward Claimed!',

    // Equipment Tab
    equip_title: 'DEPLOYMENT LINEUP',
    equip_subtitle: '5 Weapons & 2 Buffs active in battle',
    equip_count: '{0}/40 WEAPONS',
    equip_filter_all: 'ALL',
    equip_equipped_badge: 'EQUIPPED',
    equip_locked_badge: 'LOCKED',
    equip_btn_equip: '+ EQUIP',
    equip_btn_unequip: 'UNEQUIP',
    equip_btn_chest: '🛒 OPEN CHEST',
    equip_stat_level: 'Level',
    equip_stat_power: 'Power Up',
    equip_stat_rarity: 'Rarity',
    equip_stat_role: 'Role',
    equip_how_it_works: '⚡ HOW IT WORKS',
    equip_skill_details: '📖 SKILL DETAILS',
    equip_tactical_tips: '💡 TACTICAL TIPS',
    equip_must_keep: 'Must keep at least 1 weapon equipped!',
    equip_max_reached: 'Maximum 5 weapons equipped!',
    equip_not_enough_gold: 'Not enough Gold to upgrade!',

    // Talents Tab
    talents_title: 'CASTLE TALENTS',
    talents_subtitle: 'Roll random permanent stat upgrades with Gold',
    talents_roll_btn: '🎲 ROLL TALENT',
    talents_max: 'MAX',
    talents_all_maxed: 'All talents maxed out!',
    talents_not_enough_gold: 'Not enough Gold to roll talents!',
    talents_rolled: '🎉 TALENT UPGRADED! 🎉',

    // Modes Tab
    modes_title: 'DUNGEON MODES',
    modes_demon_title: 'Demon Tower',
    modes_demon_sub: 'Climb 100 endless monster floors',
    modes_island_title: 'Island Expedition',
    modes_island_sub: 'Conquer archipelago territories',
    modes_wizard_title: 'Wizard Sanctuary',
    modes_wizard_sub: 'Master ancient elemental magic',
    modes_octopus_title: 'Octopus Sea',
    modes_octopus_sub: 'Defeat the kraken sea monster',
    modes_arena_title: 'Hero Arena',
    modes_arena_sub: 'Compete for global ranking titles',
    modes_enter: 'ENTER',
    modes_locked_wave: 'LOCKED (Wave {0})',

    // Battle HUD
    hud_wave: 'WAVE {0}/{1}',
    hud_prep: 'PREPARING',
    hud_auto_merge: 'AUTO MERGE',
    hud_speed: 'SPEED: {0}x',
    hud_start_wave: '⚔ START WAVE {0}',
    hud_roll_btn: '🎲 ROLL (2$)\n(Gun / Gear / Buff)',
    hud_buy: 'BUY',
    hud_battle: 'BATTLE!',
    hud_wave_label: 'WAVE {0}',
    hud_tip: '💡 Turrets auto-aim 360°. Drag items to merge or sell!',
    hud_trash_ready: '🗑 DROP TO SELL\n(+50% GOLD)',
    hud_trash_val: '🗑 DROP TO SELL\n+{0}$ GOLD',
    hud_tap_outside: '• Tap outside to close',

    // Floating battle texts
    float_weapon: '+ WEAPON',
    float_trigger: '+ TRIGGER GEAR',
    float_might: '+ MIGHT BUFF',
    float_haste: '+ HASTE BUFF',
    float_reload: '+ RELOAD BUFF',
    float_crit: '+ CRIT BUFF',

    // Battle Modals
    pause_title: 'GAME PAUSED',
    pause_subtitle: 'Tactical Pause',
    pause_resume: '▶ RESUME',
    pause_retry: '🔄 RETRY',
    pause_quit: '🏠 QUIT TO MENU',
    victory_title: '🎉 VICTORY! 🎉',
    victory_subtitle: 'STAGE CLEARED!',
    defeat_title: '💀 DEFEAT 💀',
    defeat_subtitle: 'CASTLE OVERRUN!',
    rewards_heading: 'REWARDS:',
    perm_gold: 'Permanent Gold',
    diamonds: 'Diamonds',
    gold_earned: 'Gold Earned',
    gems_earned: 'Gems Earned',
    wave_reached: 'Wave Reached',
    next_stage_btn: 'NEXT STAGE ▶',
    main_menu_btn: 'MAIN MENU 🏰',
    retry_btn: 'RETRY 🔄',
    gacha_new_weapon: '🎉 NEW WEAPON! 🎉',
    gacha_upgraded: '⬆️ UPGRADED! ⬆️',
    awesome: 'AWESOME!',

    // Quests & Pass
    quests_modal_title: 'QUESTS & MISSIONS',
    quests_modal_sub: 'Complete tasks to earn medals & rewards',
    claim_btn: 'CLAIM',
    completed_badge: 'COMPLETED',
    pass_modal_title: 'SEASON 117 PASS',
    pass_modal_sub: 'Collect medals to unlock tiered rewards',
    pass_free_label: 'FREE PASS',
    pass_vip_label: 'VIP PASS',
    pass_claimed: 'CLAIMED',

    // How to Play Guide
    guide_title: 'HOW TO PLAY',
    guide_subtitle: 'Castle Defense & Gear Mechanics',
    guide_got_it: 'GOT IT!',

    // Extra UI labels
    locked: 'LOCKED',
    talents_buffs_active: '{0} Buffs Active',
    need_gold: 'Need Gold!',
    gold_cost: 'Gold Cost',
    rarity_common: 'Common',
    rarity_rare: 'Rare',
    rarity_epic: 'Epic',
    rarity_legendary: 'Legendary',
    rarity_mythic: 'Mythic',
    level: 'Level',
    next_upgrade: 'Next Upgrade',
    action_ok: 'OK',
    modes_campaign: 'Campaign',
    modes_survival: 'Endless',
    stage_num: 'STAGE {0}',
    modes_survival_arena: 'SURVIVAL ARENA',
    modes_best_record: 'Best Record: Wave {0}',
    modes_battle: '⚔️ BATTLE',
    htp_badge: 'QUICK TUTORIAL',
    htp_title: '🏰 HOW TO PLAY GEAR DEFENDER',
    htp_subtitle: 'Master gear mechanics & defeat monster waves',
    htp_step1_title: '1. Link Matching Gears',
    htp_step1_desc: 'Connect spinning gears in the castle grid. Connecting matching gears supercharges rotation speed and triggers rapid fire!',
    htp_step2_title: '2. Roll & Upgrade Weapons',
    htp_step2_desc: 'Use battlefield Gold 💰 to roll powerful turrets (Flame, Cryo, Tesla, Snipers). Merge identical weapons to raise their level!',
    htp_step3_title: '3. Defend The Wall',
    htp_step3_desc: 'Prevent relentless monster hordes from breaching your defenses. Survive 10 waves to conquer the stage and slay the Titan Boss!',
    htp_action_btn: '⚔️ LET\'S DEFEND! ▶',

    // Interactive Tutorial
    tut_roll_title: 'ROLL WEAPON',
    tut_roll_desc: 'Tap Roll to summon a weapon!',
    tut_merge_title: 'MERGE WEAPONS',
    tut_merge_desc: 'Drag identical weapons together to merge and upgrade!',
    tut_battle_title: 'START BATTLE',
    tut_battle_desc: 'Tap Battle to defend against invading monsters!',
    tut_shop_title: 'VISIT SHOP',
    tut_shop_desc: 'Go to Shop to open mystery chests!',
    tut_open_chest_title: 'OPEN CHEST',
    tut_open_chest_desc: 'Open Bronze Chest to unlock new weapons!',
    tut_equip_tab_title: 'ARSENAL',
    tut_equip_tab_desc: 'Go to Arsenal to manage your loadout!',
    tut_equip_gun_title: 'EQUIP WEAPON',
    tut_equip_gun_desc: 'Tap Equip to add your new weapon to battle!',
    tut_complete_title: 'TUTORIAL COMPLETED!',
    tut_complete_desc: 'You are now ready to defend the kingdom! Good luck!',
    settings_replay_tut: 'Replay Tutorial',
  },

  vi: {
    // Top Bar
    highest_stage: 'Ải Cao Nhất',
    weapons: 'Vũ Khí',
    profile_exp: 'EXP',
    profile_highest_stage: 'Ải Cao Nhất',
    profile_weapons: 'Vũ Khí',

    // Bottom Nav
    tab_shop: 'Cửa Hàng',
    tab_arsenal: 'Trang Bị',
    tab_home: 'Chiến Đấu',
    tab_talents: 'Thiên Phú',
    tab_modes: 'Chế Độ',

    // Settings
    settings_title: 'CÀI ĐẶT',
    settings_subtitle: 'Âm Thanh & Điều Khiển',
    settings_music: 'Nhạc Nền',
    settings_music_sub: 'Âm thanh Sảnh & Trận Đấu',
    settings_sfx: 'Hiệu Ứng (VFX)',
    settings_sfx_sub: 'Tiếng súng, bom nổ & kỹ năng',
    settings_master: 'Âm Lượng Tổng',
    settings_master_sub: 'Bật hoặc tắt toàn bộ âm thanh',
    settings_lang: 'Ngôn Ngữ',
    settings_lang_sub: 'Chuyển đổi ngôn ngữ game',
    settings_version: 'Phiên Bản',
    settings_boost: '⚡ TĂNG CƯỜNG',
    settings_ok: 'ĐỒNG Ý',
    on: 'BẬT',
    off: 'TẮT',
    mute: 'TẮT TIẾNG',

    // World Tab
    stage: 'Ải',
    quests: 'Nhiệm Vụ',
    pass: 'Thẻ Mùa',
    guide: 'Hướng Dẫn',
    harvest: 'Thu Hoạch',
    chest: 'Rương',
    battle: 'CHIẾN ĐẤU',
    energy_cost: '⚡ 5 Năng Lượng',
    stage_locked_alert: 'Ải {0} đang khóa! Hãy vượt qua ải trước để mở.',

    // Maps
    map_1_name: 'Rừng Xanh',
    map_1_desc: 'Rừng Cây Xanh Mát',
    map_2_name: 'Đỉnh Băng Giá',
    map_2_desc: 'Dãy Núi Băng Tuyết',
    map_3_name: 'Đồi Cát Vàng',
    map_3_desc: 'Sa Mạc Thiêu Đốt',
    map_4_name: 'Thành Dung Nham',
    map_4_desc: 'Miệng Núi Lửa',
    map_5_name: 'Tàn Tích Công Nghệ',
    map_5_desc: 'Đô Thị Tương Lai',
    map_6_name: 'Hầm Ngục Bóng Tối',
    map_6_desc: 'Nghĩa Trang Bị Nguyền',
    map_7_name: 'Thánh Địa Thần Thánh',
    map_7_desc: 'Cung Điện Trên Mây',

    // Shop Tab
    shop_bronze_title: 'HÒM CHIẾN BINH',
    shop_royal_title: '👑 HÒM HOÀNG GIA',
    shop_gold_pack: 'VÀNG MIỄN PHÍ',
    shop_gem_pack: 'KIM CƯƠNG MIỄN PHÍ',
    shop_daily_gift: 'QUÀ MỖI NGÀY',
    shop_claim_free: 'NHẬN MIỄN PHÍ',
    shop_claim: '🎁 NHẬN QUÀ',
    shop_gold: 'Vàng',
    shop_gems: 'Kim Cương',
    shop_chip_weapons: '🔫 Vũ Khí',
    shop_chip_vip_weapons: '🔥 Vũ Khí VIP',
    shop_daily_claimed: 'Hôm nay bạn đã nhận rồi! Mai quay lại nhé.',
    shop_ad_progress: 'Đã nhận thưởng xem quảng cáo!',

    // Equipment Tab
    equip_title: 'ĐỘI HÌNH RA TRẬN',
    equip_subtitle: '5 Vũ Khí & 2 Buff xuất hiện trong trận',
    equip_count: '{0}/40 VŨ KHÍ',
    equip_filter_all: 'TẤT CẢ',
    equip_equipped_badge: 'ĐANG DÙNG',
    equip_locked_badge: 'KHÓA',
    equip_btn_equip: '+ TRANG BỊ',
    equip_btn_unequip: 'GỠ BỎ',
    equip_btn_chest: '🛒 MỞ HÒM',
    equip_stat_level: 'Cấp Độ',
    equip_stat_power: 'Sức Mạnh',
    equip_stat_rarity: 'Độ Hiếm',
    equip_stat_role: 'Vai Trò',
    equip_how_it_works: '⚡ CÁCH HOẠT ĐỘNG',
    equip_skill_details: '📖 CHI TIẾT KỸ NĂNG',
    equip_tactical_tips: '💡 MẸO CHIẾN THUẬT',
    equip_must_keep: 'Phải giữ lại ít nhất 1 vũ khí trong đội hình!',
    equip_max_reached: 'Đã trang bị tối đa 5 vũ khí!',
    equip_not_enough_gold: 'Không đủ Vàng để nâng cấp!',

    // Talents Tab
    talents_title: 'THIÊN PHÚ THÀNH TRÌ',
    talents_subtitle: 'Quay ngẫu nhiên chỉ số vĩnh viễn bằng Vàng',
    talents_roll_btn: '🎲 QUAY THIÊN PHÚ',
    talents_max: 'TỐI ĐA',
    talents_all_maxed: 'Đã nâng tối đa toàn bộ thiên phú!',
    talents_not_enough_gold: 'Không đủ Vàng để quay thiên phú!',
    talents_rolled: '🎉 NÂNG CẤP THIÊN PHÚ THÀNH CÔNG! 🎉',

    // Modes Tab
    modes_title: 'CHẾ ĐỘ THỬ THÁCH',
    modes_demon_title: 'Tháp Ma Vương',
    modes_demon_sub: 'Leo 100 tầng tháp quái vật vô tận',
    modes_island_title: 'Viễn Chinh Đảo',
    modes_island_sub: 'Chinh phục các hải đảo xa xôi',
    modes_wizard_title: 'Đền Phù Thủy',
    modes_wizard_sub: 'Luyện bí thuật ma pháp cổ đại',
    modes_octopus_title: 'Biển Bạch Tuộc',
    modes_octopus_sub: 'Đánh bại thủy quái khổng lồ',
    modes_arena_title: 'Đấu Trường Anh Hùng',
    modes_arena_sub: 'Tranh tài bảng xếp hạng toàn cầu',
    modes_enter: 'VÀO TRẬN',
    modes_locked_wave: 'KHÓA (Đợt {0})',

    // Battle HUD
    hud_wave: 'ĐỢT {0}/{1}',
    hud_prep: 'CHUẨN BỊ',
    hud_auto_merge: 'TỰ ĐỘNG GHÉP',
    hud_speed: 'TỐC ĐỘ: {0}x',
    hud_start_wave: '⚔ BẮT ĐẦU ĐỢT {0}',
    hud_roll_btn: '🎲 ROLL (2$)\n(Súng / Cò / Buff)',
    hud_buy: 'MUA',
    hud_battle: 'CHIẾN ĐẤU!',
    hud_wave_label: 'ĐỢT {0}',
    hud_tip: '💡 Súng tự ngắm 360°. Kéo món để ghép hoặc bán!',
    hud_trash_ready: '🗑 THẢ VÀO ĐỂ BÁN\n(+50% VÀNG)',
    hud_trash_val: '🗑 THẢ ĐỂ BÁN\n+{0}$ VÀNG',
    hud_tap_outside: '• Chạm vị trí khác để đóng',

    // Floating battle texts
    float_weapon: '+ SÚNG',
    float_trigger: '+ BỘ CÒ XOAY',
    float_might: '+ BUFF CÔNG',
    float_haste: '+ BUFF TỐC',
    float_reload: '+ BUFF NẠP',
    float_crit: '+ BUFF BẠO KÍCH',

    // Battle Modals
    pause_title: 'TẠM DỪNG',
    pause_subtitle: 'Nghỉ ngơi chiến thuật',
    pause_resume: '▶ TIẾP TỤC',
    pause_retry: '🔄 CHƠI LẠI',
    pause_quit: '🏠 VỀ SẢNH',
    victory_title: '🎉 CHIẾN THẮNG! 🎉',
    victory_subtitle: 'VƯỢT ẢI THÀNH CÔNG!',
    defeat_title: '💀 THẤT BẠI 💀',
    defeat_subtitle: 'THÀNH TRÌ THẤT THỦ!',
    rewards_heading: 'PHẦN THƯỞNG:',
    perm_gold: 'Vàng Vĩnh Viễn',
    diamonds: 'Kim Cương',
    gold_earned: 'Vàng Nhận Được',
    gems_earned: 'Kim Cương Nhận',
    wave_reached: 'Đợt Đạt Đến',
    next_stage_btn: 'ẢI TIẾP THEO ▶',
    main_menu_btn: 'VỀ SẢNH 🏰',
    retry_btn: 'THỬ LẠI 🔄',
    gacha_new_weapon: '🎉 VŨ KHÍ MỚI! 🎉',
    gacha_upgraded: '⬆️ NÂNG CẤP! ⬆️',
    awesome: 'TUYỆT VỜI!',

    // Quests & Pass
    quests_modal_title: 'NHIỆM VỤ CHIẾN TRƯỜNG',
    quests_modal_sub: 'Hoàn thành nhiệm vụ nhận huy chương & quà',
    claim_btn: 'NHẬN',
    completed_badge: 'ĐÃ XONG',
    pass_modal_title: 'THẺ MÙA GIẢI 117',
    pass_modal_sub: 'Tích lũy huy chương mở khóa phần thưởng',
    pass_free_label: 'THẺ MIỄN PHÍ',
    pass_vip_label: 'THẺ VIP',
    pass_claimed: 'ĐÃ NHẬN',

    // How to Play Guide
    guide_title: 'HƯỚNG DẪN CHƠI',
    guide_subtitle: 'Cơ chế Thủ Thành & Bánh Răng',
    guide_got_it: 'ĐÃ HIỂU!',

    // Extra UI labels
    locked: 'ĐÃ KHÓA',
    talents_buffs_active: '{0} Thuộc Tính Hoạt Động',
    need_gold: 'Cần Thêm Vàng!',
    gold_cost: 'Chi Phí Vàng',
    rarity_common: 'Thường',
    rarity_rare: 'Hiếm',
    rarity_epic: 'Sử Thi',
    rarity_legendary: 'Huyền Thoại',
    rarity_mythic: 'Thần Thoại',
    level: 'Cấp Độ',
    next_upgrade: 'Cấp Kế Tiếp',
    action_ok: 'ĐỒNG Ý',
    modes_campaign: 'Chiến Dịch',
    modes_survival: 'Vô Tận',
    stage_num: 'ẢI {0}',
    modes_survival_arena: 'ĐẤU TRƯỜNG SINH TỒN',
    modes_best_record: 'Kỷ Lục: Đợt {0}',
    modes_battle: '⚔️ VÀO TRẬN',
    htp_badge: 'HƯỚNG DẪN NHANH',
    htp_title: '🏰 CÁCH CHƠI GEAR DEFENDER',
    htp_subtitle: 'Làm chủ cơ chế bánh răng & quét sạch quái vật',
    htp_step1_title: '1. Kết Nối Bánh Răng Cùng Loại',
    htp_step1_desc: 'Nối các bánh răng xoay trong thành. Ghép cặp bánh răng cùng loại giúp tăng tốc độ xoay cực đại và xả đạn liên hoàn!',
    htp_step2_title: '2. Roll & Nâng Cấp Vũ Khí',
    htp_step2_desc: 'Dùng Vàng 💰 trên chiến trường để roll trụ bắn (Lửa, Băng, Điện, Bắn tỉa). Ghép 2 vũ khí giống nhau để tăng cấp sao!',
    htp_step3_title: '3. Phòng Thủ Tường Thành',
    htp_step3_desc: 'Ngăn chặn đàn quái vật tấn công phá vỡ phòng tuyến. Vượt qua 10 đợt wave để hạ gục Boss Titan!',
    htp_action_btn: '⚔️ BẮT ĐẦU PHÒNG THỦ! ▶',

    // Interactive Tutorial
    tut_roll_title: 'ROLL SÚNG',
    tut_roll_desc: 'Bấm Roll để mua súng mới!',
    tut_merge_title: 'GHÉP SÚNG',
    tut_merge_desc: 'Kéo súng sang để ghép 2 súng cùng loại!',
    tut_battle_title: 'CHIẾN ĐẤU',
    tut_battle_desc: 'Bấm Chiến Đấu để bắt đầu phòng thủ thành!',
    tut_shop_title: 'VÀO CỬA HÀNG',
    tut_shop_desc: 'Vào Cửa Hàng để mở rương nhận vũ khí mới!',
    tut_open_chest_title: 'MỞ RƯƠNG',
    tut_open_chest_desc: 'Mở Hòm Chiến Binh để nhận súng mới!',
    tut_equip_tab_title: 'TRANG BỊ',
    tut_equip_tab_desc: 'Vào Trang Bị để chuẩn bị đội hình ra trận!',
    tut_equip_gun_title: 'LẮP VŨ KHÍ',
    tut_equip_gun_desc: 'Bấm Trang Bị để lắp súng mới vào đội hình!',
    tut_complete_title: 'HOÀN THÀNH HƯỚNG DẪN!',
    tut_complete_desc: 'Bạn đã nắm vững cách chơi và sẵn sàng bảo vệ vương quốc!',
    settings_replay_tut: 'Chơi Lại Hướng Dẫn',
  }
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function t(key: TranslationKey, ...args: (string | number)[]): string {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  let str = (dict as any)[key] || (TRANSLATIONS.en as any)[key] || String(key);
  if (args.length > 0) {
    args.forEach((val, idx) => {
      str = str.replace(new RegExp(`\\{${idx}\\}`, 'g'), String(val));
    });
  }
  return str;
}
