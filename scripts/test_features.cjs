const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Running sanity checks on GameDistribution SDK, Quality, Battle Pass, Quests, Maps, Talents, and Assets...');

// 1. Verify assets exist
const assets = [
  'icon_ad_tv.png',
  'btn_watch_ad.png',
  'stage_diorama_volcano.png',
  'stage_diorama_cyber.png',
  'stage_diorama_shadow.png',
  'stage_diorama_celestial.png'
];

for (const a of assets) {
  const p = path.join(__dirname, '..', 'public', 'assets', a);
  assert(fs.existsSync(p), `Missing asset: ${a}`);
}
console.log('✔ All new UI assets verified.');

// 2. Verify GameDistribution SDK in index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
assert(indexHtml.includes('lang="en"'), 'index.html must have lang="en"');
assert(indexHtml.includes('window["GD_OPTIONS"]'), 'index.html missing GD_OPTIONS configuration');
assert(indexHtml.includes('gamedistribution-jssdk'), 'index.html missing GD SDK script tag');
console.log('✔ GameDistribution SDK integration in index.html verified.');

// 3. Verify types.ts content
const typesContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'types.ts'), 'utf-8');
assert(typesContent.includes('BattlePassData'), 'types.ts missing BattlePassData');
assert(typesContent.includes('QuestProgress'), 'types.ts missing QuestProgress');
assert(typesContent.includes('CastleTalentState'), 'types.ts missing CastleTalentState');
assert(typesContent.includes('selectedCampaignMap'), 'types.ts missing selectedCampaignMap');
assert(typesContent.includes('hasSeenTutorial'), 'types.ts missing hasSeenTutorial');
console.log('✔ types.ts interfaces verified.');

// 4. Verify game.ts logic & ad registration
const gameContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'game.ts'), 'utf-8');
assert(gameContent.includes('addBattlePassPoints'), 'game.ts missing addBattlePassPoints');
assert(gameContent.includes('addQuestProgress'), 'game.ts missing addQuestProgress');
assert(gameContent.includes('kill_monsters'), 'game.ts missing kill_monsters quest hook');
assert(gameContent.includes('clear_waves'), 'game.ts missing clear_waves quest hook');
assert(gameContent.includes('MAGMA CITADEL'), 'game.ts missing Map 4 visuals');
assert(gameContent.includes('CELESTIAL SANCTUARY'), 'game.ts missing Map 7 visuals');
assert(gameContent.includes('registerGameInstance'), 'game.ts missing adService.registerGameInstance');
console.log('✔ game.ts features, hooks, and GD adService registration verified.');

// 5. Verify audio.ts mute/pause compliance, BGM tracks, Victory SFX, and Click SFX
const audioAssets = [
  { name: 'sfx_btn_click.wav', minSize: 1000 },
  { name: 'sfx_victory.mp3', minSize: 10000 },
  { name: 'bgm_menu.mp3', minSize: 1000000 },
  { name: 'bgm_battle.mp3', minSize: 1000000 },
  { name: 'bgm_boss.mp3', minSize: 1000000 }
];
for (const a of audioAssets) {
  const p = path.join(__dirname, '..', 'public', 'assets', 'audio', a.name);
  assert(fs.existsSync(p), `Missing audio asset: ${a.name}`);
  const stat = fs.statSync(p);
  assert(stat.size > a.minSize, `Audio asset ${a.name} is unexpectedly small (${stat.size} bytes)`);
}
console.log('✔ All background music, victory fanfare, and click SFX audio files verified in public/assets/audio/.');

const audioContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'audio.ts'), 'utf-8');
assert(audioContent.includes('pauseAudio'), 'audio.ts missing pauseAudio for GD compliance');
assert(audioContent.includes('resumeAudio'), 'audio.ts missing resumeAudio for GD compliance');
assert(audioContent.includes('playBGM'), 'audio.ts missing playBGM');
assert(audioContent.includes('playClick'), 'audio.ts missing playClick');
assert(audioContent.includes('playVictory'), 'audio.ts missing playVictory');
assert(audioContent.includes('setSoundEnabled'), 'audio.ts missing setSoundEnabled');
console.log('✔ audio.ts GD SDK audio pause/resume, BGM tracks, victory fanfare, and click SFX pool verified.');

const mainContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf-8');
assert(mainContent.includes("sound.playBGM('MENU')"), 'main.ts missing lobby BGM initialization');
assert(mainContent.includes("sound.playClick()"), 'main.ts missing global button click SFX listener');
console.log('✔ main.ts BGM startup and global click SFX listener verified.');

// 6. Verify ui.ts implementations & English texts
const uiContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.ts'), 'utf-8');
assert(uiContent.includes('showBattlePassModal'), 'ui.ts missing showBattlePassModal');
assert(uiContent.includes('showQuestsModal'), 'ui.ts missing showQuestsModal');
assert(uiContent.includes('showSimulatedAd'), 'ui.ts missing showSimulatedAd');
assert(uiContent.includes('showTalentRollModal'), 'ui.ts missing showTalentRollModal');
assert(uiContent.includes('showHowToPlayModal'), 'ui.ts missing showHowToPlayModal (FTUE tutorial)');
assert(uiContent.includes('adService.showRewardedAd'), 'ui.ts missing adService.showRewardedAd hook');
assert(uiContent.includes('adService.showInterstitialAd'), 'ui.ts missing adService.showInterstitialAd hook');
assert(uiContent.includes('Castle Hexagonal Defense Matrix'), 'ui.ts talent matrix subtitle not in English');
assert(uiContent.includes('BATTLE PASS PROGRESS'), 'ui.ts battle pass progress not in English');
console.log('✔ ui.ts modals, tutorial FTUE, English localization, and GD SDK ad hooks verified.');

console.log('ALL GAME DISTRIBUTION QUALITY & FEATURE SANITY CHECKS PASSED!');
