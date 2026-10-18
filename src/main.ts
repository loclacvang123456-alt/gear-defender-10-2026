import { Application } from 'pixi.js';
import { GameEngine } from './game';
import { UIManager } from './ui';
import { PixelAssetManager } from './pixelArt';
import { sound } from './audio';

async function bootstrap() {
  const container = document.getElementById('game-container')!;

  const app = new Application();
  await app.init({
    width: 720,
    height: 1280,
    backgroundColor: 0x090a0f,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    antialias: true, // Mịn màng sắc nét
  });

  // Tải trước toàn bộ Asset Súng Pixel Art chất lượng cao vẽ từ Aseprite
  await PixelAssetManager.preloadAssets();

  container.appendChild(app.canvas);

  // Khởi tạo Game Engine
  const game = new GameEngine();
  app.stage.addChild(game.stage);

  // Khởi tạo Real HTML/CSS UI Manager
  const ui = new UIManager(game, container);
  game.setUIManager(ui);

  (window as any).game = game;
  (window as any).ui = ui;
  (window as any).restartTutorial = () => game.startTutorial();

  // Khởi động trận đấu Tutorial ngay nếu là người chơi mới
  if (!game.saveData.hasSeenTutorial) {
    game.startTutorial();
  } else {
    // Khởi động nhạc nền sảnh chờ (Arcade Toy March)
    sound.playBGM('MENU');
  }

  // Global button click SFX listener for interactive UI elements
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement)?.closest('button, [role="button"], .kid-side-btn, .honeycomb-cell, .kid-bottom-nav-item, .kid-mode-tab, .kid-map-card');
    if (el) {
      sound.playClick();
    }
  }, { capture: true });

  // Resize canvas & UI giữ đúng tỉ lệ 9:16 sắc nét trên mọi thiết bị
  function resizeGame() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const targetRatio = 720 / 1280;
    const windowRatio = windowWidth / windowHeight;

    let finalW: number;
    let finalH: number;

    if (windowRatio > targetRatio) {
      finalH = windowHeight;
      finalW = finalH * targetRatio;
    } else {
      finalW = windowWidth;
      finalH = finalW / targetRatio;
    }

    const w = Math.floor(finalW);
    const h = Math.floor(finalH);

    app.canvas.style.width = `${w}px`;
    app.canvas.style.height = `${h}px`;

    container.style.width = `${w}px`;
    container.style.height = `${h}px`;

    ui.setScale(w / 720);
  }

  window.addEventListener('resize', resizeGame);
  resizeGame();

  // Vòng lặp Game Loop chuẩn mực
  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    game.update(dt);
    ui.updateHudValues();
  });
}

bootstrap().catch((err) => {
  console.error("FATAL ERROR IN BOOTSTRAP:", err);
  const errDiv = document.createElement('div');
  errDiv.style.position = 'fixed';
  errDiv.style.top = '10px';
  errDiv.style.left = '10px';
  errDiv.style.right = '10px';
  errDiv.style.padding = '20px';
  errDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
  errDiv.style.color = '#ffffff';
  errDiv.style.fontSize = '14px';
  errDiv.style.fontFamily = 'monospace';
  errDiv.style.zIndex = '999999';
  errDiv.style.whiteSpace = 'pre-wrap';
  errDiv.innerText = 'LỖI RUNTIME:\n' + (err?.stack || err?.message || String(err));
  document.body.appendChild(errDiv);
});
