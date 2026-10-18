const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function processIcons() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const brainDir = 'C:/Users/Truong Quang Loc/.gemini/antigravity/brain/78f5f8d3-06f5-4db0-b7ea-8b46d664d465';
  const assetsDir = path.resolve(__dirname, '../public/assets');

  // List of AI-generated images to convert to transparent PNGs
  const aiImages = [
    { src: 'settings_gear_icon_1792165623622.jpg', dst: 'btn_settings.png' },
    { src: 'quest_task_icon_1792165619231.jpg', dst: 'badge_quest.png' },
    { src: 'battle_pass_rewards_icon_1792165622782.jpg', dst: 'pass_laurel.png' },
    { src: 'daily_harvest_supplies_icon_1792165622987.jpg', dst: 'shop_pack_daily.png' },
    { src: 'milestone_chest_icon_1792165619228.jpg', dst: 'chest_milestone.png' },
    { src: 'shop_icon_1792165634264.jpg', dst: 'tab_shop.png' },
    { src: 'tab_equipment_icon_1792165634924.jpg', dst: 'tab_equip.png' },
    { src: 'home_world_map_icon_1792165637286.jpg', dst: 'tab_world.png' },
    { src: 'talent_upgrades_icon_1792165638154.jpg', dst: 'tab_talent.png' },
    { src: 'gold_coin_icon_1792165646889.jpg', dst: 'icon_gold.png' },
    { src: 'royal_legendary_chest_1792165647941.jpg', dst: 'shop_chest_royal.png' },
  ];

  for (const item of aiImages) {
    const fullSrc = path.join(brainDir, item.src);
    if (!fs.existsSync(fullSrc)) {
      console.warn('Source file not found:', fullSrc);
      continue;
    }
    const jpgB64 = fs.readFileSync(fullSrc).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${jpgB64}`;

    const pngB64 = await page.evaluate(async (dataUrl) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          const w = canvas.width;
          const h = canvas.height;

          // Flood-fill BFS to isolate pure white / studio background
          const visited = new Uint8Array(w * h);
          const queue = [];

          for (let x = 0; x < w; x++) {
            queue.push(x, 0); visited[x] = 1;
            queue.push(x, h - 1); visited[(h - 1) * w + x] = 1;
          }
          for (let y = 0; y < h; y++) {
            queue.push(0, y); visited[y * w] = 1;
            queue.push(w - 1, y); visited[y * w + (w - 1)] = 1;
          }

          let head = 0;
          while (head < queue.length) {
            const cx = queue[head++];
            const cy = queue[head++];
            const idx = (cy * w + cx) * 4;

            const r = d[idx];
            const g = d[idx + 1];
            const b = d[idx + 2];

            const isWhite = r > 240 && g > 240 && b > 240;
            const isPaleNeutral = (r + g + b) / 3 > 215 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18;

            if (isWhite || isPaleNeutral) {
              d[idx + 3] = 0; // Transparent

              const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
              for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  const npos = ny * w + nx;
                  if (!visited[npos]) {
                    visited[npos] = 1;
                    queue.push(nx, ny);
                  }
                }
              }
            }
          }

          // Anti-aliasing feather on boundary pixels
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              if (d[idx + 3] > 0) {
                // If adjacent to a transparent pixel and very bright, soften alpha
                const r = d[idx], g = d[idx + 1], b = d[idx + 2];
                if ((r + g + b) / 3 > 220) {
                  const hasTransNeighbor =
                    d[((y - 1) * w + x) * 4 + 3] === 0 ||
                    d[((y + 1) * w + x) * 4 + 3] === 0 ||
                    d[(y * w + x - 1) * 4 + 3] === 0 ||
                    d[(y * w + x + 1) * 4 + 3] === 0;
                  if (hasTransNeighbor) {
                    d[idx + 3] = Math.round(d[idx + 3] * 0.4);
                  }
                }
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        };
        img.src = dataUrl;
      });
    }, dataUrl);

    const fullDst = path.join(assetsDir, item.dst);
    fs.writeFileSync(fullDst, Buffer.from(pngB64, 'base64'));
    console.log('Saved AI icon:', item.dst);
  }

  // Generate the 3 smooth 3D vector icons (tab_modes, icon_gem, shop_chest_bronze)
  const vectorB64 = await page.evaluate(async () => {
    function renderGem() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;

      const cx = 256, cy = 256;
      // 3D Diamond gemstone with facet cuts
      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, 50, cx, cy, 240);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 512, 512);

      // Diamond outline points
      // Top flat: (170, 110) to (342, 110)
      // Left point: (70, 210)
      // Right point: (442, 210)
      // Bottom tip: (256, 440)
      ctx.lineJoin = 'round';
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0284c7';

      // Facet 1: Center triangle
      const gCenter = ctx.createLinearGradient(cx, 110, cx, 440);
      gCenter.addColorStop(0, '#bae6fd');
      gCenter.addColorStop(0.3, '#38bdf8');
      gCenter.addColorStop(1, '#0284c7');
      ctx.fillStyle = gCenter;

      ctx.beginPath();
      ctx.moveTo(170, 110);
      ctx.lineTo(342, 110);
      ctx.lineTo(442, 210);
      ctx.lineTo(256, 440);
      ctx.lineTo(70, 210);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top Table facet
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(170, 110);
      ctx.lineTo(342, 110);
      ctx.lineTo(300, 170);
      ctx.lineTo(212, 170);
      ctx.closePath();
      ctx.fill();

      // Upper left kite
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(170, 110);
      ctx.lineTo(212, 170);
      ctx.lineTo(190, 210);
      ctx.lineTo(70, 210);
      ctx.closePath();
      ctx.fill();

      // Upper right kite
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(342, 110);
      ctx.lineTo(442, 210);
      ctx.lineTo(322, 210);
      ctx.lineTo(300, 170);
      ctx.closePath();
      ctx.fill();

      // Upper center facet
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(212, 170);
      ctx.lineTo(300, 170);
      ctx.lineTo(256, 210);
      ctx.closePath();
      ctx.fill();

      // Lower center main facet
      const gLower = ctx.createLinearGradient(cx, 210, cx, 440);
      gLower.addColorStop(0, '#38bdf8');
      gLower.addColorStop(1, '#0369a1');
      ctx.fillStyle = gLower;
      ctx.beginPath();
      ctx.moveTo(190, 210);
      ctx.lineTo(256, 210);
      ctx.lineTo(322, 210);
      ctx.lineTo(256, 440);
      ctx.closePath();
      ctx.fill();

      // Lower left facet
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(70, 210);
      ctx.lineTo(190, 210);
      ctx.lineTo(256, 440);
      ctx.closePath();
      ctx.fill();

      // Lower right facet
      ctx.fillStyle = '#075985';
      ctx.beginPath();
      ctx.moveTo(442, 210);
      ctx.lineTo(322, 210);
      ctx.lineTo(256, 440);
      ctx.closePath();
      ctx.fill();

      // Sparkle twinkle flare top right
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(360, 150, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(360, 110); ctx.lineTo(360, 190);
      ctx.moveTo(320, 150); ctx.lineTo(400, 150);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      return c.toDataURL('image/png').split(',')[1];
    }

    function renderModes() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;

      const cx = 256, cy = 256;
      // 3D Battle Arena: Crossed golden swords with target bullseye
      // Target bullseye behind
      const rings = [
        { r: 170, color: '#ef4444' },
        { r: 135, color: '#ffffff' },
        { r: 100, color: '#ef4444' },
        { r: 65, color: '#ffffff' },
        { r: 35, color: '#facc15' },
      ];
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#1e293b';
      for (const ring of rings) {
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.fillStyle = ring.color;
        ctx.fill();
        ctx.stroke();
      }

      // Crossed swords in front
      function drawSword(angle) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Blade
        const gBlade = ctx.createLinearGradient(-16, -210, 16, 50);
        gBlade.addColorStop(0, '#ffffff');
        gBlade.addColorStop(0.5, '#e2e8f0');
        gBlade.addColorStop(1, '#94a3b8');
        ctx.fillStyle = gBlade;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;

        ctx.beginPath();
        ctx.moveTo(0, -210); // Tip
        ctx.lineTo(18, -170);
        ctx.lineTo(16, 80);
        ctx.lineTo(-16, 80);
        ctx.lineTo(-18, -170);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crossguard
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.roundRect(-52, 80, 104, 22, 6);
        ctx.fill();
        ctx.stroke();

        // Grip & Pommel
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(-10, 102, 20, 52, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 164, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      drawSword(-Math.PI / 4);
      drawSword(Math.PI / 4);

      return c.toDataURL('image/png').split(',')[1];
    }

    function renderBronzeChest() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;

      const cx = 256, cy = 256;
      // 3D Wooden Bronze Chest
      ctx.lineJoin = 'round';
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#1e293b';

      // Chest base
      const gWood = ctx.createLinearGradient(0, 180, 0, 420);
      gWood.addColorStop(0, '#b45309');
      gWood.addColorStop(1, '#78350f');
      ctx.fillStyle = gWood;

      ctx.beginPath();
      ctx.roundRect(80, 230, 352, 180, 24);
      ctx.fill();
      ctx.stroke();

      // Chest lid
      const gLid = ctx.createLinearGradient(0, 120, 0, 240);
      gLid.addColorStop(0, '#d97706');
      gLid.addColorStop(1, '#92400e');
      ctx.fillStyle = gLid;

      ctx.beginPath();
      ctx.roundRect(70, 130, 372, 110, [40, 40, 12, 12]);
      ctx.fill();
      ctx.stroke();

      // Bronze bands
      ctx.fillStyle = '#f59e0b';
      for (const bx of [140, 322]) {
        // Lid band
        ctx.beginPath();
        ctx.roundRect(bx, 130, 50, 110, 8);
        ctx.fill();
        ctx.stroke();
        // Body band
        ctx.beginPath();
        ctx.roundRect(bx, 230, 50, 180, 8);
        ctx.fill();
        ctx.stroke();

        // Rivets
        ctx.fillStyle = '#78350f';
        for (let ry = 150; ry <= 390; ry += 55) {
          ctx.beginPath();
          ctx.arc(bx + 25, ry, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f59e0b';
      }

      // Center bronze lock latch
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(226, 210, 60, 72, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(256, 240, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(253, 240, 6, 16);

      return c.toDataURL('image/png').split(',')[1];
    }

    return {
      gem: renderGem(),
      modes: renderModes(),
      bronzeChest: renderBronzeChest()
    };
  });

  fs.writeFileSync(path.join(assetsDir, 'icon_gem.png'), Buffer.from(vectorB64.gem, 'base64'));
  fs.writeFileSync(path.join(assetsDir, 'tab_modes.png'), Buffer.from(vectorB64.modes, 'base64'));
  fs.writeFileSync(path.join(assetsDir, 'shop_chest_bronze.png'), Buffer.from(vectorB64.bronzeChest, 'base64'));
  console.log('Saved 3D vector icons: icon_gem.png, tab_modes.png, shop_chest_bronze.png');

  await browser.close();
}

processIcons().catch(err => console.error('Error processing icons:', err));
