const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generateAdIcon() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 512, height: 512 });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 512px; height: 512px; }
        canvas { width: 512px; height: 512px; }
      </style>
    </head>
    <body>
      <canvas id="c" width="512" height="512"></canvas>
      <script>
        const c = document.getElementById('c');
        const ctx = c.getContext('2d');

        // TV Body Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.beginPath();
        ctx.ellipse(256, 470, 190, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Antennas
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#64748b';

        // Left antenna
        ctx.beginPath();
        ctx.moveTo(210, 150);
        ctx.lineTo(130, 40);
        ctx.stroke();

        // Left antenna tip (shiny ball)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(130, 40, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Right antenna
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(300, 150);
        ctx.lineTo(380, 40);
        ctx.stroke();

        // Right antenna tip (shiny ball)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(380, 40, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Outer TV Box (Chunky Arcade retro style)
        // Draw rounded rectangle with dark outline
        function roundRect(ctx, x, y, w, h, r) {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
        }

        // TV Outer Casing Border (Thick arcade outline)
        ctx.fillStyle = '#0f172a';
        roundRect(ctx, 40, 110, 432, 340, 56);
        ctx.fill();

        // TV Outer Casing Gradient (Vibrant purple/magenta tech gradient)
        const caseGrad = ctx.createLinearGradient(0, 110, 0, 450);
        caseGrad.addColorStop(0, '#a855f7');
        caseGrad.addColorStop(0.5, '#7c3aed');
        caseGrad.addColorStop(1, '#581c87');
        ctx.fillStyle = caseGrad;
        roundRect(ctx, 48, 118, 416, 324, 48);
        ctx.fill();

        // Top Highlight on TV
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        roundRect(ctx, 68, 126, 376, 24, 12);
        ctx.fill();

        // Screen Bezel Inner
        ctx.fillStyle = '#1e1b4b';
        roundRect(ctx, 72, 160, 290, 250, 36);
        ctx.fill();

        // TV Screen (Glow cyan-teal gradient)
        const screenGrad = ctx.createLinearGradient(72, 160, 362, 410);
        screenGrad.addColorStop(0, '#06b6d4');
        screenGrad.addColorStop(0.5, '#0ea5e9');
        screenGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = screenGrad;
        roundRect(ctx, 80, 168, 274, 234, 28);
        ctx.fill();

        // Screen scanlines / CRT curve highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(85, 175);
        ctx.quadraticCurveTo(217, 185, 349, 175);
        ctx.lineTo(349, 215);
        ctx.quadraticCurveTo(217, 230, 85, 215);
        ctx.closePath();
        ctx.fill();

        // PLAY BUTTON IN SCREEN
        // Play button glow
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        ctx.arc(220, 285, 60, 0, Math.PI * 2);
        ctx.fill();

        // Big Play Triangle with golden gradient & 3D bevel
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(182, 226);
        ctx.lineTo(276, 285);
        ctx.lineTo(182, 344);
        ctx.closePath();
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#0f172a';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.fill();

        ctx.shadowColor = 'transparent';

        const playGrad = ctx.createLinearGradient(182, 226, 276, 344);
        playGrad.addColorStop(0, '#fef08a');
        playGrad.addColorStop(0.4, '#facc15');
        playGrad.addColorStop(1, '#eab308');
        ctx.fillStyle = playGrad;
        ctx.beginPath();
        ctx.moveTo(186, 234);
        ctx.lineTo(270, 285);
        ctx.lineTo(186, 336);
        ctx.closePath();
        ctx.fill();

        // Play button inner highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(192, 246);
        ctx.lineTo(235, 272);
        ctx.lineTo(192, 280);
        ctx.closePath();
        ctx.fill();

        // Control Panel on Right side of TV
        // Knob 1 (Dial)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(405, 195, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(405, 195, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(400, 190, 6, 0, Math.PI * 2);
        ctx.fill();

        // Knob 2 (Dial)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(405, 265, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(405, 265, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(400, 260, 6, 0, Math.PI * 2);
        ctx.fill();

        // Speaker slits
        ctx.fillStyle = '#1e1b4b';
        for (let y = 325; y <= 395; y += 14) {
          roundRect(ctx, 380, y, 50, 7, 3);
          ctx.fill();
        }

        // TV Legs
        ctx.fillStyle = '#0f172a';
        roundRect(ctx, 110, 442, 40, 24, 6);
        ctx.fill();
        roundRect(ctx, 362, 442, 40, 24, 6);
        ctx.fill();

        ctx.fillStyle = '#475569';
        roundRect(ctx, 114, 442, 32, 20, 5);
        ctx.fill();
        roundRect(ctx, 366, 442, 32, 20, 5);
        ctx.fill();

        // "AD" Badge in corner of TV
        const badgeGrad = ctx.createLinearGradient(275, 140, 360, 175);
        badgeGrad.addColorStop(0, '#ef4444');
        badgeGrad.addColorStop(1, '#dc2626');
        ctx.fillStyle = '#0f172a';
        roundRect(ctx, 274, 148, 82, 38, 12);
        ctx.fill();
        ctx.fillStyle = badgeGrad;
        roundRect(ctx, 277, 151, 76, 32, 10);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AD ⚡', 315, 167);
      </script>
    </body>
    </html>
  `);

  const canvasEl = await page.$('#c');
  const buffer = await canvasEl.screenshot({ omitBackground: true });

  const destPath1 = path.resolve(__dirname, '../public/assets/icon_ad_tv.png');
  const destPath2 = path.resolve(__dirname, '../public/assets/btn_watch_ad.png');
  fs.writeFileSync(destPath1, buffer);
  fs.writeFileSync(destPath2, buffer);
  console.log('Saved ad TV icon to:', destPath1, destPath2);

  await browser.close();
}

generateAdIcon().catch(console.error);
