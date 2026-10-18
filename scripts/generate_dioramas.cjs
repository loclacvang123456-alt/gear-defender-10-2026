const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generateDioramas() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 600, height: 400 });

  const dioramas = [
    {
      id: 'volcano',
      name: 'Magma Citadel',
      bgGrad: ['#450a0a', '#7f1d1d', '#991b1b'],
      draw: `
        // Volcano cone
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(100, 360);
        ctx.lineTo(240, 140);
        ctx.lineTo(360, 140);
        ctx.lineTo(500, 360);
        ctx.closePath();
        ctx.fill();

        // Crater lava
        const craterLava = ctx.createLinearGradient(240, 140, 360, 140);
        craterLava.addColorStop(0, '#f97316');
        craterLava.addColorStop(0.5, '#fef08a');
        craterLava.addColorStop(1, '#ef4444');
        ctx.fillStyle = craterLava;
        ctx.beginPath();
        ctx.ellipse(300, 140, 60, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lava rivers flowing down
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(270, 150);
        ctx.quadraticCurveTo(240, 240, 200, 360);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(330, 150);
        ctx.quadraticCurveTo(360, 250, 410, 360);
        ctx.stroke();

        // Lava glow inside river
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(270, 150);
        ctx.quadraticCurveTo(240, 240, 200, 360);
        ctx.stroke();

        // Castle fort at base
        ctx.fillStyle = '#292524';
        ctx.fillRect(230, 270, 140, 90);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(245, 290, 25, 40);
        ctx.fillRect(330, 290, 25, 40);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(275, 310, 50, 50);

        // Sparks & Embers
        for (let i = 0; i < 40; i++) {
          const sx = 200 + Math.random() * 200;
          const sy = 40 + Math.random() * 140;
          ctx.fillStyle = Math.random() > 0.5 ? '#fef08a' : '#f97316';
          ctx.beginPath();
          ctx.arc(sx, sy, 3 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      `
    },
    {
      id: 'cyber',
      name: 'Cyberpunk Ruins',
      bgGrad: ['#030712', '#0f172a', '#1e1b4b'],
      draw: `
        // Neon grid lines
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        for (let y = 200; y < 400; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(600, y);
          ctx.stroke();
        }
        for (let x = 0; x <= 600; x += 50) {
          ctx.beginPath();
          ctx.moveTo(x, 200);
          ctx.lineTo(x, 400);
          ctx.stroke();
        }

        // Cyber Skyscraper silhouettes
        ctx.fillStyle = '#090d16';
        ctx.fillRect(80, 120, 90, 280);
        ctx.fillRect(210, 80, 110, 320);
        ctx.fillRect(360, 110, 80, 290);
        ctx.fillRect(470, 150, 70, 250);

        // Neon glowing trims
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 4;
        ctx.strokeRect(210, 80, 110, 320);
        ctx.strokeStyle = '#06b6d4';
        ctx.strokeRect(80, 120, 90, 280);
        ctx.strokeStyle = '#a855f7';
        ctx.strokeRect(360, 110, 80, 290);

        // Windows
        ctx.fillStyle = '#38bdf8';
        for (let r = 100; r < 360; r += 24) {
          ctx.fillRect(230, r, 16, 12);
          ctx.fillRect(260, r, 16, 12);
          ctx.fillRect(290, r, 16, 12);
        }

        // Hologram gear / symbol in center
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(300, 180, 45, 0, Math.PI * 2);
        ctx.stroke();
      `
    },
    {
      id: 'shadow',
      name: 'Shadow Crypt',
      bgGrad: ['#0f051d', '#1e1035', '#2e1065'],
      draw: `
        // Full moon / eclipse
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(450, 110, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3b0764';
        ctx.beginPath();
        ctx.arc(465, 110, 52, 0, Math.PI * 2);
        ctx.fill();

        // Misty hill
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.ellipse(300, 380, 360, 160, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tombstones & crosses
        ctx.fillStyle = '#475569';
        for (const tx of [110, 180, 380, 480]) {
          ctx.fillRect(tx, 270, 28, 45);
          ctx.beginPath();
          ctx.arc(tx + 14, 270, 14, Math.PI, 0);
          ctx.fill();
        }

        // Haunted Gothic Castle
        ctx.fillStyle = '#0f0a1c';
        ctx.fillRect(240, 180, 120, 170);
        // Spire
        ctx.beginPath();
        ctx.moveTo(230, 180);
        ctx.lineTo(300, 80);
        ctx.lineTo(370, 180);
        ctx.closePath();
        ctx.fill();

        // Ghostly wisps (green/purple)
        for (let i = 0; i < 20; i++) {
          const wx = 80 + Math.random() * 440;
          const wy = 200 + Math.random() * 150;
          ctx.fillStyle = 'rgba(74, 222, 128, 0.4)';
          ctx.beginPath();
          ctx.ellipse(wx, wy, 12, 6, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      `
    },
    {
      id: 'celestial',
      name: 'Celestial Sanctuary',
      bgGrad: ['#1e3a8a', '#3b82f6', '#93c5fd'],
      draw: `
        // Golden Sun Rays
        ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(300, 160);
          ctx.lineTo(300 + Math.cos(a) * 400, 160 + Math.sin(a) * 400);
          ctx.lineTo(300 + Math.cos(a + 0.15) * 400, 160 + Math.sin(a + 0.15) * 400);
          ctx.closePath();
          ctx.fill();
        }

        // Floating Sky Island with waterfalls
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(120, 270);
        ctx.lineTo(480, 270);
        ctx.lineTo(300, 390);
        ctx.closePath();
        ctx.fill();

        // Lush green island top
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(300, 270, 185, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Marble Greek/Celestial Temple Pillars
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(190, 180, 16, 90);
        ctx.fillRect(240, 180, 16, 90);
        ctx.fillRect(344, 180, 16, 90);
        ctx.fillRect(394, 180, 16, 90);

        // Temple Roof (Golden Triangles)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(170, 180);
        ctx.lineTo(300, 120);
        ctx.lineTo(430, 180);
        ctx.closePath();
        ctx.fill();

        // Divine Holy Halo
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(300, 120, 40, 0, Math.PI * 2);
        ctx.stroke();
      `
    }
  ];

  for (const d of dioramas) {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head><style>body { margin: 0; background: transparent; }</style></head>
      <body>
        <canvas id="c" width="600" height="400"></canvas>
        <script>
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');

          // Background
          const grad = ctx.createLinearGradient(0, 0, 0, 400);
          grad.addColorStop(0, '${d.bgGrad[0]}');
          grad.addColorStop(0.5, '${d.bgGrad[1]}');
          grad.addColorStop(1, '${d.bgGrad[2]}');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 600, 400);

          ${d.draw}
        </script>
      </body>
      </html>
    `);

    const canvasEl = await page.$('#c');
    const buffer = await canvasEl.screenshot();
    const dest = path.resolve(__dirname, `../public/assets/stage_diorama_${d.id}.png`);
    fs.writeFileSync(dest, buffer);
    console.log(`Generated diorama: ${dest}`);
  }

  await browser.close();
}

generateDioramas().catch(console.error);
