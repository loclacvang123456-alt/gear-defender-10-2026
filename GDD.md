# Gear Gun Castle – Game Design Document (GDD)

- **Thể loại:** Hyper-casual / Tower Defense kết hợp Merge + Roguelite
- **Nền tảng:** Mobile Web / Native Webview (iOS / Android), Màn hình dọc (Portrait)
- **Công nghệ (Engine):** **Pixi.js v8** (HTML5 Canvas / WebGL) + TypeScript / Vite
- **Phong cách đồ họa:** **Crisp Pixel Art** (Steampunk / Fantasy Castle), bảng màu tươi sáng, tương phản cao, hiệu ứng nổ, giật màn hình (screen shake), tối ưu điều khiển 1 ngón tay.
- **Phiên bản tài liệu:** 0.2 – Cập nhật thông số Pixel Art chuẩn, chuyển đổi engine Pixi.js & tinh chỉnh cân bằng.

---

## 0. TIÊU CHUẨN TỈ LỆ PIXEL CHUẨN (PIXEL ART SPECIFICATIONS)

> **Mục tiêu:** Đảm bảo toàn bộ asset vẽ trong **Aseprite** khi đưa vào **Pixi.js** đạt độ nét tuyệt đối (Pixel-Perfect), không bị nhòe pixel, không méo hình (non-uniform scaling) trên mọi tỉ lệ màn hình điện thoại từ 9:16 (chuẩn cũ) đến 9:19.5 / 9:20 (iPhone, Android hiện đại).

### 0.1 Độ phân giải ảo gốc (Virtual Resolution)
- **Kích thước Logic (Base Canvas):** **`360 x 640` px** (Tỉ lệ chuẩn 9:16).
- **Vùng an toàn (Safe Zone):** `360 x 600` px. Trên các màn hình dài (9:19.5 như 1170x2532 hoặc 1080x2400), Pixi.js sẽ mở rộng chiều cao canvas (letterbox / dynamic padding) mà không kéo giãn tỉ lệ pixel.
- **Tỉ lệ phóng đại (Integer Scaling):**
  - Màn HD (720x1280): Scale x2.
  - Màn Full HD (1080x1920): Scale x3 (chuẩn pixel-perfect).
  - Màn 2K / Super Retina (1440x2560 / 1170x2532): Scale x3.5 hoặc x4.
- **Thiết lập Pixi.js Renderer:**
  - `texture.source.scaleMode = 'nearest'` (Không nội suy làm mờ pixel).
  - Canvas CSS: `image-rendering: pixelated; image-rendering: crisp-edges;`.

### 0.2 Quy cách kích thước Sprite trong Aseprite (Sprite Matrix)
Toàn bộ sprite được thiết kế trên lưới lũy thừa 8 (`8x8`, `16x16`, `24x24`, `32x32`, `48x48`, `64x64`) để đảm bảo tính đồng nhất:

| Nhóm Asset | Kích thước Canvas trong Aseprite | Kích thước hiển thị trong game | Ghi chú thiết kế |
| :--- | :--- | :--- | :--- |
| **Ô Lưới (Grid Cell)** | `48 x 48` px | `48 x 48` px | Lưới 5 cột chiếm $5 \times 48 = 240$ px (căn giữa canvas 360px, chừa 60px 2 bên cho tường thành). |
| **Bánh Răng Cò (Trigger Gear)** | `40 x 40` px | `40 x 40` px | Trục tròn xoay mượt, chấu cò vươn ra sát mép `48px` để tạo cảm giác gõ trực tiếp vào ô bên cạnh. |
| **Súng & Nòng súng (Guns)** | `32 x 32` px (đặt trên đế `40x40`) | `40 x 40` px | Đế súng cố định, nòng súng xoay hoặc thụt lùi (recoil) khi bắn. |
| **Bánh Răng Buff / Random** | `40 x 40` px | `40 x 40` px | Lõi phát sáng màu đặc trưng (Đỏ, Xanh, Vàng, Tím) kèm rune ký hiệu. |
| **Quái Thường / Bầy đàn** | `24 x 24` px | `24 x 24` px | Rõ silhouette, hoạt ảnh chạy 4 frame. |
| **Quái Tank / Đột biến** | `32 x 32` px | `32 x 32` px | Thân to, giáp sắt, chuyển động nặng nề. |
| **Quái Boss** | `64 x 64` px | `64 x 64` px | Chiếm 1.5 - 2 làn di chuyển, hoạt ảnh đánh tường, nộ khí. |
| **Đạn / Tia / Hiệu ứng đạn** | `8 x 8` px hoặc `8 x 16` px | `8 x 8` đến `16 x 16` px | Pixel phát sáng (neon/bright core) có viền tương phản. |
| **VFX Nổ / Khói / Bắn** | `32 x 32` px (Sprite sheet 4-6 frames) | `32 x 32` px | Chớp trắng (hit flash) 2 frame, khói cam/vàng tan biến nhanh. |
| **UI Icon (Vàng, Gem, Roll, Lock)** | `16 x 16` px hoặc `24 x 24` px | `16 x 16` hoặc `24 x 24` px | Nét viền đậm (outline 1px đen/nâu thẫm) dễ nhìn trên nền sáng. |

---

## 1. TỔNG QUAN

### 1.1 Tầm nhìn
Người chơi xây dựng và vận hành một cỗ máy phòng thủ bánh răng ma thuật bên trong lâu đài. Súng không tự phát hỏa độc lập mà phụ thuộc hoàn toàn vào **Bánh Răng Cò (Trigger Gear)** gõ vào để tích thanh năng lượng (Fill). 
Vị trí đặt súng, bánh răng buff và các cò quay là chìa khóa chiến thuật giải đố (Puzzle-Tactics). Kết hợp với cơ chế **Merge (ghép đôi)** và **Roll ngẫu nhiên** tạo vòng lặp nghiện tức thì của dòng Hyper-casual / Roguelite.

### 1.2 Điểm khác biệt (USP)
- **Cơ chế nạp đạn cơ khí tương tác:** Cò quay liên tục $\rightarrow$ gõ vật lý vào các súng kế cận $\rightarrow$ đầy thanh Fill $\rightarrow$ bắn.
- **Bố trí không gian chiến thuật cao:** Tối ưu hóa ma trận: súng nào nhận hit từ 2-3 cò cùng lúc, buff nào bao phủ nhiều súng nhất.
- **Nhịp độ nhanh gọn:** Ván chơi 3–5 phút trên mobile màn hình dọc, thao tác hoàn toàn bằng 1 ngón tay cái.

### 1.3 Core Loop
```
[Ngoài ván]
  Chọn ải -> Thiết lập Loadout (5 món)
        │
        ▼
[Trong ván]
  Roll món đồ ($) ──► Kéo thả / Bố trí quanh Cò ──► Merge tăng cấp (Lv 1->5)
        ▲                                                      │
        │                                                      ▼
  Tích lũy Vàng ($) ◄── Tiêu diệt quái theo làn ◄── Súng nạp & Xả đạn
        │
        ▼
  Vượt Wave ──► Boss cuối ──► Thắng ải
        │
        ▼
[Phần thưởng & Tiến trình]
  Nhận Kim cương ──► Gacha / Nâng sao vĩnh viễn ──► Mở ải cao cấp hơn
```

---

## 2. BỐ CỤC MÀN HÌNH & KHÔNG GIAN (PORTRAIT 360 x 640)

```
0px ─────────────────────────────────────────────── Top
    [ Wave 3/10 ]    [ HP: 100/100 ]    [ 54 $ ]    HUD (Chiều cao ~ 40px)
40px ───────────────────────────────────────────────
    |  L1    L2    L3    L4    L5  |
    |  👾          👾          |
    |        👾          👾    |   VÙNG 1: CHIẾN TRƯỜNG QUÁI (35%)
    |  👾          👾          |   Quái đi xuống 5 làn dọc (Mỗi làn rộng ~ 48px)
    |                          |   Chiều cao ~ 220px
260px ══════════════════════════════════════════════ TƯỜNG THÀNH (Bảo vệ lâu đài)
    |  [ ][ ][ ][ ][ ]  | Row 1
    |  [ ][S][⚙][S][ ]  | Row 2
    |  [ ][ ][S][ ][ ]  | Row 3    VÙNG 2: LƯỚI LÂU ĐÀI (5 cột x 5 hàng = 25 ô)
    |  [ ][B][C][ ][ ]  | Row 4    Mỗi ô: 48x48 px (Lưới: 240 x 240 px, canh giữa)
    |  [ ][ ][ ][ ][ ]  | Row 5    Chiều cao ~ 260px (40%)
520px ───────────────────────────────────────────────
    |  [ 🎲 ROLL 3$ ]    [ 🔓 Mở ô 15$ ]    [ ⏩ x2 ] | VÙNG 3: ĐIỀU KHIỂN & BREADCRUMBS
    |  Thanh thông báo trạng thái / Hàng chờ roll     | Chiều cao ~ 120px (25%)
640px ─────────────────────────────────────────────── Bottom
```

### Điều khiển 1 ngón tay (Touch & Drag):
- **Kéo vào ô trống:** Di chuyển món đồ.
- **Kéo đè lên món cùng loại, cùng level:** **Merge** thành món cấp $Level + 1$.
- **Kéo đè lên món khác loại:** **Đổi vị trí (Swap)** lập tức mà không làm ngắt quãng trận đánh.
- **Thao tác nhanh:** Chạm đúp (Double tap) vào món để xem thông tin chi số / bán món.

---

## 3. LƯỚI LÂU ĐÀI VÀ HỆ THỐNG Ô

- **Kích thước tối ưu:** **5 Cột $\times$ 5 Hàng = 25 Ô** *(Đã tinh chỉnh từ 5x9 để vừa khít màn hình dọc mobile và kích thước ngón tay cái)*.
- **Mở khóa đầu ván:** Mở sẵn **9–11 ô trung tâm** (khu vực quanh Cò ban đầu).
- **Mở thêm ô:** Bằng vàng thu thập trong trận đấu (Ô thứ 12 giá 10$, mỗi ô tiếp theo $+5$$).
- **Tính chất hàng dọc:** Súng ở mọi hàng trong cùng một cột đều bắn trúng quái đi trên làn đó. Tuy nhiên, súng ở hàng trên (Row 1–2) đạn bay tới quái nhanh hơn (~0.1s), thích hợp cho shotgun/hỏa lực tức thì.

---

## 4. CÁC LOẠI VẬT PHẨM TRONG LƯỚI

| Loại Vật Phẩm | Vai trò chính | Cấp độ | Có thể Merge? |
| :--- | :--- | :--- | :--- |
| **Súng (Guns T1–T5)** | Nòng cốt hỏa lực, tích đầy thanh Fill để bắn. | Lv 1–5 | **Có** (Merge 2) |
| **Bánh Răng Cò (Trigger)** | Động cơ cơ học: xoay và gõ vào 4 ô lân cận để nạp đạn. | Lv 1–5 (Số chấu cò = Lv) | **Có** (Merge 2) |
| **Bánh Răng Buff** | Tăng cường chỉ số (DMG, Tốc độ xoay, Fill rate, Crit) cho 4 ô kề. | Lv 1–5 | **Có** (Merge 2) |
| **Bánh Răng Random** | Khi gõ đủ 15 hit $\rightarrow$ biến thành súng hoặc buff ngẫu nhiên. | Không | **Không** |

### 4.1 Quy tắc Merge (Ghép đôi)
- Ghép 2 vật phẩm giống hệt nhau (cùng loại, cùng tier, cùng level) $\rightarrow$ Vật phẩm cấp $+1$.
- **Cấp tối đa trong trận:** **Level 5** (cần tổng cộng 16 món Lv1 – con số lý tưởng cho ván 4-6 phút).
- Khi merge súng đang nạp dở: Giữ lại giá trị Fill cao hơn giữa 2 súng.
- **Cấp 5 (Max):** Nhận hiệu ứng viền lửa pixel và kích hoạt **Đặc Kỹ Tối Thượng (Ultimate Trait)**.

---

## 5. CƠ CHẾ BÁNH RĂNG VÀ FILL ĐẠN (CORE MECHANIC)

### 5.1 Bánh Răng Cò (Trigger Gear)
- Cò Lv1 được cấp sẵn ở trung tâm khi bắt đầu ván.
- **Tốc độ quay cơ bản:** **1.5 vòng / giây** (Đảm bảo nhịp đấu nhanh, không bị ì ạch).
- **Số chấu gõ:** Bằng chính cấp độ của Cò ($N = Level$). Các chấu chia đều $360^\circ / N$.
- **Tác động:** Chỉ tác động vào 4 ô kế cạnh theo trục thẳng: Trên, Dưới, Trái, Phải.
- **Tần suất gõ vào mỗi ô lân cận:**
  $$\text{Số Hit / giây} = \text{Level Cò} \times \text{Tốc độ quay (vòng/s)}$$
  - Cò Lv1: $1 \times 1.5 = 1.5\text{ hit/s}$.
  - Cò Lv2: $2 \times 1.5 = 3.0\text{ hit/s}$.
  - Cò Lv3: $3 \times 1.5 = 4.5\text{ hit/s}$.
  - Cò Lv4: $4 \times 1.5 = 6.0\text{ hit/s}$.
  - Cò Lv5: $5 \times 1.5 = 7.5\text{ hit/s}$.

### 5.2 Thanh Fill và Nhịp Bắn của Súng
- Mỗi súng có chỉ số **Fill / Hit** (Tỉ lệ nạp mỗi lần nhận gõ).
- Súng cơ bản T1 có Fill/Hit $= 0.50$ (Chỉ cần 2 hit là đầy thanh bắn 1 viên).
- Đứng cạnh Cò Lv1: Tốc độ bắn đạt $1.5 \times 0.50 = 0.75$ phát/s (khoảng 1.3s/phát – đủ nhanh để diệt đợt quái đầu).
- Đứng giữa 2 Cò Lv1 hoặc cạnh Cò Lv2: Bắn liên tục $1.5$ – $3.0$ phát/giây.

### 5.3 Bánh Răng Buff
Phủ hiệu ứng lên 4 ô lân cận:
- **Buff Đỏ (Damage):** $+15\%$ / level (Lv1: $+15\%$, Lv5: $+75\%$).
- **Buff Xanh Dương (Tốc Xoay):** Tăng tốc độ quay của Cò lân cận $+15\%$ / level.
- **Buff Xanh Lá (Siêu Nạp - Fill Boost):** $+10\%$ Fill/hit cho súng kề bên.
- **Buff Vàng (Crit & Vàng):** $+8\%$ Tỉ lệ bạo kích ($200\%$ DMG) và quái chết ở làn này rơi thêm $+1$ vàng.

---

## 6. HỆ THỐNG SÚNG CHI TIẾT

### 6.1 Bảng Súng Ban Đầu

| Tier | Tên Súng | Kiểu Bắn | Base DMG | Fill / Hit | Hiệu Ứng Riêng | Cấp 5 Ultimate Trait |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **T1** | **Súng Lục (Pistol)** | Làn | 12 | 1/2 (0.50) | Bắn đều đặn, đơn giản | Bắn phát đôi (x2 viên) |
| **T1** | **Nỏ Thép (Crossbow)** | Làn | 18 | 1/3 (0.33) | Đạn xuyên 1 quái đầu tiên | Đạn xuyên toàn bộ làn |
| **T1** | **Ná Cao Su (Slingshot)** | Quạt (Spread) | 9 | 1/2 (0.50) | Bắn chẽ 2 viên sang 2 làn kề | Bắn chẽ 3 viên hình cánh quạt |
| **T2** | **Súng Băng (Cryo Gun)** | Làn | 15 | 1/3 (0.33) | Làm chậm mục tiêu 30% trong 2s | Đóng băng hoàn toàn quái 1s |
| **T2** | **Súng Lửa (Flamer)** | Làn | 14 | 1/3 (0.33) | Đốt cháy 4 dmg/s trong 3s | Vết lửa bùng trên mặt đất gây DoT |
| **T2** | **Shotgun Tầm Gần** | Tầm gần (Short) | 36 | 1/4 (0.25) | Bắn chùm 4 viên sát thương cực lớn | Đẩy lùi quái về sau 1 đoạn |
| **T3** | **Đại Bác Bom (Cannon)** | Làn | 50 | 1/4 (0.25) | Nổ AOE bán kính 1 ô xung quanh | Nổ kép (2 đợt sát thương) |
| **T3** | **Súng Sét (Tesla)** | Toàn cục | 32 | 1/4 (0.25) | Sét giật nảy chuyền qua 3 quái | Giật sét toàn bộ quái trên màn hình |
| **T3** | **Súng Ngắm (Sniper)** | Toàn cục | 110 | 1/6 (0.16) | Luôn nhắm quái có HP cao nhất | Sát thương kết liễu quái dưới 30% HP |
| **T4** | **Pháo Laser (Beam)** | Làn | 30/tick | 1/6 (0.16) | Quét tia liên tục xuyên suốt làn | Tia laser kích nổ quái khi bị hạ gục |
| **T4** | **Minigun Xoay** | Làn | 22 | 1/2 (0.50) | Càng bắn liên tục càng tăng tốc | Tốc độ xả đạn cực đại không giới hạn |
| **T5** | **Thiên Thạch (Meteor)** | Toàn cục | 350 | 1/8 (0.12) | Nổ rung màn hình, gây choáng 1.5s | Vùng nham thạch thiêu đốt vĩnh viễn |

---

## 7. KINH TẾ & ROLL TRONG TRẬN

### 7.1 Công thức Giá Roll
$$\text{Giá Roll (lần thứ } n) = \min(2 + \lfloor (n - 1) \times 0.6 \rfloor, 12)$$
*(Giá khởi điểm: 2$, 2$, 3$, 3$, 4$, 4$, 5$... trần tối đa là 12$ để tránh tình trạng lạm phát khiến người chơi bế tắc).*

### 7.2 Cơ chế Cò trong Pool Roll
- **Không nhét Cò vào chung pool roll 12% ngẫu nhiên:** Để tránh việc người chơi cần súng lại roll ra Cò hoặc ngược lại.
- **Cách nhận Cò mới:**
  - Có nút riêng: **"Mua Bánh Răng Cò"** với giá cố định: Cò 2: 10$, Cò 3: 25$.
  - HOẶC: Thưởng chọn miễn phí sau các mốc Wave quan trọng (Wave 3, Wave 6).

---

## 8. HỆ THỐNG QUÁI VẬT & WAVE

### 8.1 Cấu trúc Ải (Stage)
- Gồm **10 Wave / ải** (Thời gian trung bình: 4 phút).
- Wave 5: Quái Tinh Nhuệ (Mini-boss).
- Wave 10: Trùm Cuối (Boss ải) với bộ kỹ năng độc nhất (Triệu hồi quái nhỏ, Hất khiên đỡ đạn, Dậm đất làm rung tạm ngừng cò 1s).
- Giữa các Wave: Có 10 giây nghỉ để thu xếp đội hình (kèm nút "Sẵn sàng" để nhận thêm $+3$$).

### 8.2 Tường Thành (Castle Wall)
- Tường thành có HP chung: 100/100 HP.
- Mỗi quái chạm vào tường sẽ phát nổ hoặc tấn công gây trừ 5–15 HP.
- HP về 0: Thất bại (Defeat).

---

## 9. KIẾN TRÚC KỸ THUẬT (PIXI.JS v8)

### 9.1 Stack Công Nghệ
- **Renderer:** Pixi.js v8 (WebGL 2.0 / WebGPU fallback).
- **Bundler:** Vite + TypeScript.
- **Audio:** Web Audio API (Tổng hợp âm thanh Retro Chiptune / 8-bit SFX cho tiếng bánh răng cơ học, tiếng merge, tiếng nổ không cần tải file âm thanh nặng).
- **Quản lý Asset:** Texture Atlas (Spritesheet sinh từ Aseprite).

### 9.2 Vòng lặp Game Loop & Zero-GC Mindset
```ts
// Ticker chuẩn theo chuẩn GameDev Pro
app.ticker.add((ticker) => {
  const dt = ticker.deltaMS / 1000; // Đổi sang giây chuẩn xác
  
  // 1. Cập nhật góc quay của toàn bộ Bánh Răng Cò
  triggerSystem.update(dt);
  
  // 2. Cập nhật trạng thái súng và xả đạn
  gunSystem.update(dt);
  
  // 3. Cập nhật di chuyển đạn & quái vật (Dùng Object Pool)
  bulletSystem.update(dt);
  enemySystem.update(dt);
  
  // 4. Xử lý va chạm qua Spatial Grid (Không dùng O(N^2))
  collisionSystem.resolve();
});
```

---

## 10. KẾ HOẠCH PHÁT TRIỂN & TÍCH HỢP ASEPRITE

1. **Giai đoạn 1 (Design & Setup):**
   - Thiết lập Project Pixi.js v8 + Vite chuẩn Portrait 360x640.
   - Sử dụng MCP tool `aseprite-ai-artist` vẽ bộ Sprite cơ bản theo đúng chuẩn Pixel Spec (Mục 0).
2. **Giai đoạn 2 (Core Mechanics Prototype):**
   - Lưới 5x5, cơ chế Cò xoay gõ 4 hướng, thanh nạp đạn của súng, hệ thống đạn bay theo làn.
   - Thử nghiệm cảm giác gõ (Juice: rung nhẹ, nảy số, đạn nổ).
3. **Giai đoạn 3 (Merge & Economy Loop):**
   - Kéo thả ghép súng Lv1 $\rightarrow$ Lv5, roll trong ván, mở ô bằng vàng.
4. **Giai đoạn 4 (Enemy & Wave Polish):**
   - 5 làn quái di chuyển, HP tường, thanh máu, màn hình thắng/thua.
