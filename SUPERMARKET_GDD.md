# Supermarket Street Tycoon – Game Design Document (GDD) & AI Implementation Spec

- **Tên dự án đề xuất:** **Supermarket Street Tycoon** (Siêu Thị Phố Phường)
- **Thể loại:** Hybrid Isometric Tycoon / Management + 2D Tactile Mini-games (Simulation / Hyper-casual)
- **Nền tảng:** Mobile Web / Native Webview (iOS / Android) & Desktop Browser – Màn hình dọc (**Portrait `720 x 1280`**)
- **Công nghệ (Engine):** **Pixi.js v8** (WebGL) + **HTML5/CSS3 Scaled DOM UI (`#ui-root`)** + **TypeScript / Vite**
- **Phong cách đồ họa:** **2.5D Isometric Cutaway (Góc nhìn chéo không mái, tường cắt)** cho quản lý tổng thể + **Crisp 2D Tactile View** cho tương tác xếp kệ & thu ngân.

---

## 0. CHỈ THỊ BẮT BUỘC DÀNH CHO AI DEVELOPER (MANDATORY AI RULES)

> [!IMPORTANT]
> **AI TIẾP THEO PHẢI TUÂN THỦ TUYỆT ĐỐI CÁC NGUYÊN TẮC SAU ĐỂ TRÁNH ĐỒ HỌA XẤU & UI LÀM BỪA:**
> 1. **TUYỆT ĐỐI KHÔNG vẽ UI (Nút bấm, Thanh tiền, Menu, Shop, Modal) bằng `PIXI.Graphics` hay `PIXI.Text` thô sơ.** Toàn bộ HUD, Menu 5 Tab, Modal, Thông báo phải dùng kiến trúc **HTML/CSS DOM Overlay (`#ui-root` chuẩn `720x1280` tự động `transform: scale(...)`)** giống hệt chuẩn của `src/ui.ts` hiện tại.
> 2. **TUYỆT ĐỐI KHÔNG dùng `window.alert` hoặc `window.confirm` mặc định của trình duyệt.** Phải override `window.alert` và dùng hệ thống Custom Sleek Modal (`showGameModal` / `showAlertModal`).
> 3. **TUYỆT ĐỐI KHÔNG vẽ kệ hàng, khách hàng, sản phẩm bằng các hình chữ nhật phẳng (`rect`, `circle`) đơn sắc trong Pixi.** Phải kết hợp:
>    - **PNG Sprite Assets (`/public/assets/*.png`)** được tạo từ `aseprite-ai-artist` hoặc `image-generator` (được preload qua `PixelAssetManager` trong `src/pixelArt.ts`).
>    - **High-Res Canvas2D Procedural Textures (`createHighResTexture`)** có đổ bóng (drop shadow), chuyển màu (gradient), viền (outline 2px) và chi tiết ánh sáng khi cần fallback.
> 4. **Góc nhìn quản lý (Macro View) PHẢI là Isometric 2.5D Cutaway chuẩn:** Có sàn lát gạch chéo, 2 bức tường sau (Bắc - Đông Bắc) dựng đứng có cửa sổ/biển hiệu, 2 bức tường trước (Nam - Tây Nam) cắt thấp sát đất, **không có mái** để nhìn rõ toàn bộ bên trong siêu thị và vỉa hè/con phố phía trước.
> 5. **Tương tác xếp đồ & Thanh toán (Micro View) PHẢI tách thành 2D Pop-up Drawer / Scene cận cảnh:** Khi bấm vào Kệ đang thiếu hàng hoặc Quầy thu ngân đang có khách, mở giao diện 2D trực diện để người chơi kéo-thả từng món đồ và vuốt quét mã vạch + bấm trả tiền thừa.

---

## 1. TỔNG QUAN & VÒNG LẶP GAMEPLAY (CORE LOOP)

### 1.1 Tầm nhìn sản phẩm
Người chơi khởi đầu với một tiệm tạp hóa nhỏ ven đường, tự tay làm mọi khâu từ đặt thùng hàng ngoài vỉa hè, bê vào xếp từng món lên kệ (2D), chạy ra quầy thu ngân quét mã vạch từng món và thối tiền thừa cho khách (2D), cầm cây lau nhà dọn vết bẩn trên sàn. Khi tích lũy đủ vốn và danh tiếng, người chơi thuê nhân viên tự động hóa các khâu tay chân, mở rộng diện tích siêu thị, nâng cấp nội thất và mua mặt bằng mở **chuỗi siêu thị dọc khắp các con phố sầm uất**.

### 1.2 Sơ đồ Core Loop (2 Lớp Góc Nhìn)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ LỚP 1: GÓC NHÌN CHÉO TỔNG THỂ (2.5D ISOMETRIC CUTAWAY - PIXI.JS WORLD)     │
│                                                                            │
│  [Đặt hàng trên Tablet] ──► Xe tải giao thùng Carton ra vỉa hè trước tiệm  │
│         ▲                                                 │                │
│         │                                                 ▼                │
│  [Mở rộng Tiệm / Mở Chi Nhánh Phố Mới]        Chạm vào Thùng & Kệ Hàng     │
│         ▲                                                 │                │
└─────────┼─────────────────────────────────────────────────┼────────────────┘
          │                                                 ▼
┌─────────┼──────────────────────────────────────────────────────────────────┐
│ LỚP 2: TƯƠNG TÁC CẬN CẢNH 2D (2D TACTILE MINI-GAME DRAWERS)                │
│         │                                                                  │
│   (A) [MINI-GAME 2D XẾP KỆ]: Kéo từng hộp sữa, gói bánh từ thùng lên kệ    │
│         │                                                                  │
│         ▼ (Khách vào lấy đồ trên kệ Isometric -> Xếp hàng ở Quầy Thu Ngân) │
│                                                                            │
│   (B) [MINI-GAME 2D THU NGÂN]:                                             │
│       1. Vuốt từng sản phẩm qua Máy Quét Laser ("BÍP!")                    │
│       2. Nhận tiền mặt / thẻ -> Bấm mệnh giá tiền thừa trả khách           │
│         │                                                                  │
│         ▼                                                                  │
│   (C) [DỌN DẸP & VẬN HÀNH]: Chạm lau vết bẩn sàn, xử lý khách phàn nàn    │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. XỬ LÝ ĐỒ HỌA PIXI.JS: LÀM SAO ĐỂ ĐẸP, CÓ CHIỀU SÂU & KHÔNG BỊ "PHẲNG"?

Lý do các game Pixi.js thông thường nhìn bị "hạn chế" là do vẽ hình học 2D phẳng và thiếu chiều sâu không gian. Dự án này bắt buộc áp dụng **Kiến trúc 2.5D Isometric Diorama**:

### 2.1 Phép chiếu Isometric 2:1 (Góc nhìn chéo không mái)
- Toàn bộ mặt bằng siêu thị và con phố sử dụng lưới **Isometric 2:1**:
  - Kích thước 1 ô gạch (Tile): Rộng `W = 96px`, Cao `H = 48px` (trên độ phân giải logic `720 x 1280`).
  - Công thức chuyển đổi tọa độ Lưới `(gridX, gridY)` sang tọa độ Màn hình `(screenX, screenY)`:
    ```ts
    const screenX = originX + (gridX - gridY) * (TILE_W / 2);
    const screenY = originY + (gridX + gridY) * (TILE_H / 2);
    ```
- **Tường cắt (Cutaway Walls) & Không mái (Roof-less):**
  - **Tường hậu (North-West & North-East):** Dựng cao `110px` theo góc nghiêng Isometric, có ốp gạch chân tường, cửa sổ kính nhìn ra phố, poster khuyến mãi `SALE 50%`.
  - **Tường tiền (South-West & South-East - Phía gần mắt người chơi):** Cắt thấp chỉ còn gờ tường `12px` mặt cắt màu tối để không che khuất kệ hàng và khách bên trong, kèm cửa kính tự động mở ra vỉa hè.
  - **Vỉa hè & Lòng đường (Street Foreground):** Nằm sát cạnh dưới-phải của siêu thị, có vạch kẻ đường, cây xanh, cột đèn đường, xe tải chở hàng chạy tới đỗ và người đi bộ qua lại.

### 2.2 Thuật toán Xếp lớp Chiều sâu (Strict Y-Sorting / Z-Index)
Để khách hàng đi *sau lưng* kệ hàng này nhưng đứng *trước mặt* kệ hàng kia một cách chân thực tuyệt đối trong Pixi.js v8:
```ts
worldContainer.sortableChildren = true;

// Trong game loop hoặc khi đặt vật thể:
// Chân của mọi Sprite (anchor) phải đặt ở đáy: sprite.anchor.set(0.5, 1.0)
entity.sprite.zIndex = Math.floor(entity.screenY * 10 + entity.layerBias);
```
- **Tầng `FloorLayer` (`zIndex: 0`):** Gạch lát sàn siêu thị, vỉa hè, lòng đường, thảm chùi chân.
- **Tầng `DecalLayer` (`zIndex: 100`):** Vết bẩn bùn đất, nước đổ, rác vỏ bánh trên sàn (để nhân viên/người chơi lau dọn), bóng đổ elip mềm (`rgba(0,0,0,0.28)`) dưới chân kệ và nhân vật.
- **Tầng `SortedWorldLayer` (`sortableChildren = true`):** Kệ hàng, Tủ đông, Quầy thu ngân, Thùng hàng, Khách hàng, Nhân viên, Cây cảnh.
- **Tầng `FloatingIndicatorLayer` (`zIndex: 99999`):** Bong bóng cảm xúc của khách (`😊`, `😡`, `💸`), biểu tượng báo kệ hết hàng (`📦!`), biểu tượng khách chờ thanh toán (`🛒!`), chữ tiền bay lên (`+$24.50`).

### 2.3 Chiến lược Xử lý Asset (Asset Pipeline chuẩn)
AI tiếp theo phải xây dựng `PixelAssetManager` trong `src/pixelArt.ts` kết hợp 2 nguồn:
1. **Bộ PNG Assets Tĩnh (`/public/assets/*.png`)** – Dùng MCP `aseprite-ai-artist` hoặc `image-generator` tạo sẵn:
   - **Kiến trúc & Nội thất Isometric:** `iso_shelf_empty.png`, `iso_shelf_full.png`, `iso_fridge.png`, `iso_checkout_counter.png`, `iso_delivery_truck.png`, `iso_trash_spill.png`.
   - **Bối cảnh Con phố (Diorama):** `street_diorama_1_corner.png`, `street_diorama_2_downtown.png`, `street_diorama_3_mall.png`, `street_diorama_4_harbor.png`, `street_diorama_5_megacity.png`.
   - **Hàng hóa 2D Sắc nét (Dùng cho cả Icon và Mini-game 2D):**
     - `item_milk.png` (Hộp sữa tươi)
     - `item_bread.png` (Bánh mì sandwich)
     - `item_soda.png` (Lon nước ngọt)
     - `item_chips.png` (Gói snack khoai tây)
     - `item_egg.png` (Vỉ trứng gà)
     - `item_cereal.png` (Hộp ngũ cốc)
     - `item_apple.png` (Khay táo đỏ)
     - `item_steak.png` (Khay thịt bò thượng hạng)
     - `item_detergent.png` (Chai nước giặt)
     - `item_icecream.png` (Hộp kem lạnh)
   - **UI Icons:** `icon_cash.png`, `icon_gem.png`, `icon_reputation.png`, `tab_store.png`, `tab_supply.png`, `tab_street.png`, `tab_staff.png`, `tab_upgrade.png`.
2. **High-Res Canvas2D Texture Cache (`createHighResTexture`):**
   - Mọi nhân vật (Khách hàng, Thu ngân, Nhân viên kho) nếu vẽ hoặc ghép bộ phận trên Canvas2D phải có:
     - Bóng đổ elip dưới chân.
     - Viền ngoài tối màu (`#1e293b`, dày `2.5px`) giúp tách biệt hoàn toàn khỏi nền gạch.
     - Hiệu ứng nhấp nhô (Bobbing animation `Math.sin(walkPhase)`) và lật hướng (`scale.x = -1 | 1`) khi đi theo đường chéo Isometric.

---

## 3. THIẾT KẾ CHI TIẾT CÁC CƠ CHẾ GAMEPLAY

### 3.1 Nhập Hàng & Quản Lý Kho (Supply & Restock)
1. **Đặt hàng (Order Goods):**
   - Người chơi mở tab **Nhập Hàng (Supply)** hoặc bấm vào **Tấm Bảng Đặt Hàng** ngoài cửa.
   - Giá sỉ biến động nhẹ theo ngày (Ví dụ: Sữa nhập `$2.00`/hộp, bán lẻ `$4.50`/hộp).
   - Sau khi bấm đặt, **Xe tải giao hàng (`Delivery Truck`)** chạy dọc con phố đỗ xịch trước cửa siêu thị (kèm tiếng còi xe & khói pô) và thả các **Thùng Carton (`Cardboard Box`)** xuống khu vực tập kết.
2. **Nhặt thùng & Đưa tới kệ:**
   - Ở góc nhìn Isometric: Người chơi chạm vào Thùng Carton (hoặc chạm trực tiếp vào Kệ đang hiện bong bóng `📦 Xếp Hàng`).

### 3.2 Mini-game 2D #1: Xếp Đồ Lên Kệ (2D Shelf Stocking View)
Khi chạm vào kệ cần châm hàng, một **Drawer 2D Cận Cảnh** trượt lên chiếm 75% màn hình (vẫn nhìn thấy siêu thị mờ nhẹ phía sau):
- **Bố cục 2D trực diện:**
  - **Nửa trên:** Mặt trước của Kệ Hàng 2D chia làm **3 tầng (Rows) $\times$ 4 ô (Slots)**, có bảng giá kẹp ở mép kệ.
  - **Nửa dưới:** Thùng Carton đang mở nắp, bên trong chứa các món hàng vừa nhập (Sữa, Bánh, Nước ngọt...).
- **Thao tác của người chơi:**
  - **Kéo & Thả (Drag & Drop) hoặc Vuốt nhanh (Flick):** Kéo từng sản phẩm từ thùng carton thả vào đúng tầng kệ tương ứng.
  - **Cảm giác "Đã tay" (Tactile Juice):**
    - Khi thả đúng ô: Món đồ nảy nhẹ (`Squash & Stretch` 1.2x -> 1.0x), phát tiếng *"Póc!"* tăng dần cao độ (Pitch tăng theo chuỗi Combo `x1, x2, x3...`).
    - Xếp đầy kệ trước khi hết giờ thưởng thêm **Bonus Tốc Độ (`+$5 Tip`)** và tự động đóng Drawer 2D sau `0.4s`.
  - **Nút "Nhân viên tự xếp" (Khi đã thuê Staff):** Cho phép bỏ qua thao tác tay nếu người chơi đang bận.

### 3.3 Mini-game 2D #2: Đứng Quầy Thanh Toán (2D Cashier Checkout View)
Khi khách nhặt đủ đồ và xếp hàng ở Quầy Thu Ngân (hiện bong bóng `💳 Thanh Toán!`), người chơi chạm vào quầy để mở **Giao diện Thu Ngân 2D**:

```
┌──────────────────────────────────────────────────────────┐
│  [KHÁCH HÀNG 2D]  "Chào shop! Tính tiền giúp tôi nhé!"    │
│  Thanh kiên nhẫn: [████████████████░░░░] 82%             │
├──────────────────────────────────────────────────────────┤
│  BĂNG CHUYỀN (Trái)       │   MÁY QUÉT LASER (Phải)      │
│  [🥛 Sữa] [🍞 Bánh]       │──►  [  laser đỏ ||||| ] 🔊BÍP│
│   (Vuốt từng món sang ──►)│     TỔNG CỘNG: $14.50        │
├──────────────────────────────────────────────────────────┤
│  KHÁCH ĐƯA: 💵 $20.00     │   TIỀN THỪA CẦN TRẢ: $5.50   │
│                           │   ĐÃ CHỌN: $5.00             │
├──────────────────────────────────────────────────────────┤
│  NGĂN KÉO TIỀN MẶT / MÁY POS (Chạm để thối tiền):        │
│  [ 💵 $10 ]   [ 💵 $5 ]   [ 💵 $1 ]                      │
│  [ 🪙 50¢ ]   [ 🪙 25¢ ]  [ 🪙 10¢ ]   [ ✅ GIAO TIỀN ]  │
└──────────────────────────────────────────────────────────┘
```

- **Bước 1 – Vuốt quét mã vạch (Swipe to Scan):**
  - Các món đồ khách mua nằm trên băng chuyền bên trái.
  - Người chơi **vuốt (swipe) hoặc kéo từng món** lướt qua khung **Tia Laser Đỏ** ở giữa.
  - Mỗi món đi qua tia laser sẽ chớp sáng đỏ, kêu *"BÍP!"* chuẩn tiếng máy quét siêu thị, và dòng tiền cộng dồn lên màn hình LED xanh lá của máy tính tiền.
- **Bước 2 – Trả tiền thừa hoặc Quẹt thẻ (Give Change / POS):**
  - **Trường hợp 1 (Khách trả Tiền Mặt - 70%):** Khách đưa tờ tiền lớn (VD: Tổng `$14.50`, khách đưa tờ `$20.00` $\rightarrow$ Cần trả thừa `$5.50`). Ngăn kéo tiền bật mở (*"Keng!"*), người chơi chạm vào tờ `$5` + đồng `50¢` rồi bấm **Giao Tiền** (hoặc tự động hoàn tất khi bấm đúng số tiền thừa).
    - Nếu trả thiếu: Khách nhăn mặt `😡` trừ điểm Uy Tín (Reputation).
    - Nếu trả thừa: Mất tiền oan!
    - Nếu trả chuẩn & nhanh: Khách thả tim `😍` + Tiền Tip!
  - **Trường hợp 2 (Khách trả Thẻ VIP - 30%):** Hiện bàn phím POS 2D, người chơi bấm nhanh số tiền `$14.50` rồi quẹt thẻ qua khe.

### 3.4 Quét Dọn, Sự Cố & Vận Hành Trong Siêu Thị
- **Vết bẩn & Rác (`Trash & Spills`):**
  - Khách đi lại có tỉ lệ làm đổ nước ngọt, rơi vỏ bánh hoặc để lại vết giày bùn đất trên sàn gạch Isometric.
  - Nếu không dọn: Khách đi ngang qua bị trượt chân hoặc giảm thanh Hài Lòng (Reputation), làm giảm lượng khách vào tiệm.
  - **Cách xử lý:** Người chơi chạm trực tiếp vào vết bẩn trên sàn Isometric (hiện hiệu ứng chổi lau xoay tròn 0.8s + bong bóng xà phòng lấp lánh $\rightarrow$ sàn sạch bóng + thưởng `+$2`).
- **Kẻ gian móc túi / Ăn cắp vặt (`Shoplifter` - Sự kiện gay cấn):**
  - Thỉnh thoảng có kẻ gian mặc áo khoác đen lén bỏ đồ vào túi rồi chạy ra cửa phố.
  - Người chơi bấm trực tiếp vào tên trộm để thu hồi hàng hóa (hoặc thuê **Bảo Vệ / Lắp cổng từ an ninh**).

### 3.5 Mở Rộng Chuỗi Siêu Thị & Làm Chủ Con Phố (Street & Franchise Expansion)
Đúng theo yêu cầu *"mở rộng chuỗi siêu thị, rồi là con phố"*:
1. **Mở rộng mặt bằng tiệm hiện tại (Store Expansion):**
   - Từ tiệm nhỏ `4x4` ô gạch $\rightarrow$ Đập tường mở rộng lên `6x6`, `8x8`, `10x10` ô.
   - Mở thêm Quầy Thu Ngân số 2, Tủ Đông đồ lạnh, Quầy Rau Củ Tươi, Quầy Bánh Nướng.
2. **Tự động hóa bằng Nhân sự (Staff System):**
   - **Nhân viên Kho (Restocker):** Tự bê thùng ngoài phố vào xếp đầy kệ.
   - **Nhân viên Thu Ngân (Cashier):** Tự đứng quầy quét mã và thối tiền (tốc độ phụ thuộc Level nhân viên).
   - **Nhân viên Vệ Sinh (Janitor):** Tự đi tuần tra lau sạch mọi vết bẩn.
3. **Bản đồ Con Phố & Chuỗi Chi Nhánh (Street Franchise Map):**
   - Khi tiệm hiện tại đạt chuẩn doanh thu & đánh giá 5 Sao, người chơi mở tab **Con Phố (Street / Franchise)**:
     - **Chi nhánh 1:** *Tạp Hóa Ngõ Nhỏ (Corner Mini-Mart)* – Khách bình dân, mặt hàng thiết yếu.
     - **Chi nhánh 2:** *Siêu Thị Phố Đi Bộ (Downtown Supermarket)* – Đông khách trẻ, mạnh về đồ ăn nhanh, nước giải khát.
     - **Chi nhánh 3:** *Trung Tâm Khu Đô Thị (Suburban Hypermarket)* – Khách gia đình mua sỉ số lượng lớn.
     - **Chi nhánh 4:** *Chợ Cảng Hải Sản (Harbor Fresh Mart)* – Chuyên thực phẩm tươi sống, thịt cá cao cấp.
     - **Chi nhánh 5:** *Đại Siêu Thị Trung Tâm (Mega Mall Flagship)* – Đỉnh cao chuỗi bán lẻ.
   - Các chi nhánh cũ đã có Quản Lý (Store Manager) sẽ **tự động sinh lợi nhuận thụ động (Idle Franchise Income)** mỗi phút để người chơi thu hoạch.

---

## 4. TIÊU CHUẨN THIẾT KẾ UI/UX (CHUẨN HÓA NHƯ GAME HIỆN TẠI – KHÔNG LÀM BỪA)

> [!WARNING]
> **QUY TẮC SỐNG CÒN CHO AI:**
> Giao diện UI của game hiện tại (`src/ui.ts`) rất gọn, rõ ràng, thân thiện (Kid/Casual-friendly), có Top Header, 5-Tab Bottom Navigation, hệ thống Modal đồng nhất và tỉ lệ chuẩn `720 x 1280`. AI tiếp theo **BẮT BUỘC** giữ nguyên khung kiến trúc UI này, không được tự ý làm nút bấm thô kệch hay bố cục lộn xộn.

### 4.1 Kiến trúc Khung Màn Hình (`720 x 1280` Scaled Root)
- `#game-container` chứa `<canvas>` Pixi.js và `<div id="ui-root">` rộng `720px`, cao `1280px`, co giãn đồng bộ bằng `transform: scale(scale)`.
- Mọi thao tác UI nằm trong `#ui-root` với font chữ dày dặn, dễ đọc, có đổ bóng chữ (`text-shadow`) và nút bấm có hiệu ứng nhấn (`active: translateY(2px)`).

### 4.2 Bố cục Màn hình Chính & Trong Ca Bán Hàng (HUD & Navigation)

```
0px ─────────────────────────────────────────────────────────── Top
    [ ⭐ Lv.5 ]   [ 💵 $1,240 ]   [ 💎 85 ]   [ ⭐ 4.8 ]  [ ⚙️ ]  TOP HEADER BAR (Cao 88px)
88px ──────────────────────────────────────────────────────────
    | [📋 Nhiệm vụ]                        [🚚 Thu lợi chuỗi] |  Nút nổi 2 bên (Side Pills)
    | [🏅 Sự kiện]                         [🧹 Tự động dọn]   |
    |                                                         |
    |              GÓC NHÌN CHÉO ISOMETRIC 2.5D               |
    |        (CON PHỐ + SIÊU THỊ KHÔNG MÁI, TƯỜNG CẮT)        |  VÙNG PIXI.JS CANVAS
    |                                                         |  (Chiếm toàn màn hình nền,
    |         Khách đi mua đồ, Xe tải đỗ ngoài phố,           |   có thể chạm trực tiếp vào
    |         Kệ hàng, Quầy thu ngân, Vết bẩn trên sàn        |   Kệ, Quầy, Thùng hàng, Rác)
    |                                                         |
1020px ────────────────────────────────────────────────────────
    |  [ 📦 Đặt Hàng Nhanh ]  [ 💳 Vào Quầy (3) ]  [ ⏩ x2 ]  |  THANH THAO TÁC NHANH (Quick Action Bar)
1140px ════════════════════════════════════════════════════════
    | [🏪 Cửa Hàng] [📦 Nhập Kho] [🌆 Con Phố] [👩‍💼 Nhân Sự] [📈 Nâng Cấp] |  BOTTOM 5-TAB BAR (Cao 140px)
1280px ──────────────────────────────────────────────────────── Bottom
```

### 4.3 Chi Tiết 5 Tab Điều Hướng Đáy (Bottom 5-Tab Navigation Bar)
Khi người chơi bấm vào các Tab ở đáy, một **Tấm Panel Bo Tròn Hiện Đại (Slide-up Sheet / Full Tab Card)** mở lên gọn gàng, hoặc đóng lại khi bấm vào tab `🏪 Cửa Hàng` để quan sát toàn cảnh siêu thị:

1. **Tab 1 – `🏪 Cửa Hàng` (Store Live View - Mặc định):**
   - Hiển thị trực tiếp siêu thị Isometric đang hoạt động.
   - Có thanh **Quick Action Bar** phía trên thanh Tab giúp bấm nhanh: Mở kho đặt hàng, Nhảy ngay vào Quầy Thu Ngân khi có khách đợi, Bật tốc độ `x2`.
2. **Tab 2 – `📦 Nhập Kho` (Supply & Catalog):**
   - Danh sách các mặt hàng (Sữa, Bánh mì, Nước ngọt, Trứng, Thịt bò, Kem...).
   - Hiển thị rõ: **Icon sản phẩm lớn**, **Giá nhập thùng (10 món)**, **Giá bán lẻ**, **Tồn kho hiện tại**, và nút **[ 🚚 ĐẶT HÀNG ]**.
   - Cho phép chỉnh giá bán lẻ (Tăng giá = Lãi cao nhưng khách dễ chê đắt; Giảm giá = Khách mua cực nhanh).
3. **Tab 3 – `🌆 Con Phố` (Street & Franchise Chain):**
   - Hiển thị thẻ Diorama của từng Khu Phố / Chi nhánh (giống thiết kế `Stage Selector` + `Hero Art` trong `src/ui.ts` hiện tại).
   - Cho phép chuyển đổi qua lại giữa các siêu thị trong chuỗi, mở khóa mặt bằng mới trên phố và bấm **[ 💰 Thu Lợi Nhuận Chuỗi ]**.
4. **Tab 4 – `👩‍💼 Nhân Sự` (Staff Management):**
   - Danh sách thẻ nhân viên: **Thu Ngân (Cashier)**, **Nhân Viên Xếp Kệ (Restocker)**, **Nhân Viên Lau Dọn (Janitor)**, **Bảo Vệ (Security)**.
   - Mỗi thẻ có: Avatar, Cấp độ, Tốc độ làm việc, Lương/ngày và nút **[ Thuê / Nâng Cấp $ ]**.
5. **Tab 5 – `📈 Nâng Cấp` (Store Upgrades & Furniture):**
   - Chia theo cấp độ màu sắc (Tier 1 Green $\rightarrow$ Tier 5 Gold/Crimson giống `TALENT_REGISTRY` hiện tại):
     - Mua thêm Kệ Hàng mới, Tủ Đông, Quầy Thu Ngân thứ 2.
     - Mở rộng diện tích sàn siêu thị (`+2x2` ô gạch).
     - Nâng cấp Loa phát nhạc, Điều hòa, Biển hiệu Neon ngoài phố (Tăng tốc độ khách vào tiệm & tăng % Tiền Tip).

---

## 5. KIẾN TRÚC CODE & CẤU TRÚC THƯ MỤC ĐỀ XUẤT

Để giữ nguyên sự gọn gàng, dễ bảo trì và chuẩn TypeScript + Vite như project hiện tại:

```
project-root/
├── index.html               # Khung chuẩn 720x1280, CSS reset, Error Banner bảo vệ runtime
├── package.json             # pixi.js ^8.22.0, typescript, vite
├── public/
│   └── assets/              # Toàn bộ PNG Sprite (kệ isometric, hàng hóa, icon UI, diorama phố, audio)
└── src/
    ├── main.ts              # Khởi tạo Pixi Application, Resize handler chuẩn tỉ lệ 720x1280
    ├── types.ts             # Định nghĩa toàn bộ Interface: ProductKind, ShelfState, Customer, SaveData
    ├── i18n.ts              # Đa ngôn ngữ Việt / Anh (VI mặc định hoặc tự nhận diện)
    ├── audio.ts             # Web Audio API Synthesizer (tiếng BÍP máy quét, tiếng KENG ngăn kéo tiền, tiếng PÓC xếp kệ) + BGM
    ├── pixelArt.ts          # PixelAssetManager: Preload PNG + High-Res Procedural Isometric Fallback
    ├── game.ts              # GameEngine: Quản lý Isometric Grid, AI Khách hàng, AI Nhân viên, Kinh tế
    ├── miniGames.ts         # Logic & UI 2D tương tác cho: (1) Xếp kệ 2D, (2) Thu ngân quét mã & trả tiền thừa 2D
    └── ui.ts                # UIManager: Top Header, 5-Tab Bottom Bar, Custom Modals, Quick HUD
```

### 5.1 Quy tắc Game Loop & Hiệu năng (Theo chuẩn `gamedev` Skill)
- **Frame-Rate Independence:** Mọi chuyển động của khách hàng, xe tải, nhân viên, thanh kiên nhẫn đều phải nhân với `dt = ticker.deltaMS / 1000`.
- **Zero-Allocation trong `update(dt)`:** Không khởi tạo mảng/object mới mỗi frame; tái sử dụng Object Pool cho Khách hàng (`CustomerPool`), Chữ tiền bay (`FloatingTextPool`) và Hiệu ứng hạt (`ParticlePool`).
- **Web Audio SFX Thực tế (`src/audio.ts`):**
  - **Tiếng máy quét Barcode (`playScanBeep()`):** Sine/Square wave ở tần số chuẩn `2400Hz` trong `0.07s` (nghe giống hệt máy quét siêu thị thật).
  - **Tiếng ngăn kéo tiền (`playCashRegister()`):** Âm "Keng!" kim loại kép (`1200Hz` $\rightarrow$ `2600Hz` decay mượt).
  - **Tiếng đặt hàng lên kệ (`playStockPop(combo)`):** Tần số tăng dần theo chuỗi combo `300 + combo * 45 Hz`.

---

## 6. LỘ TRÌNH TRIỂN KHAI CHO AI TIẾP THEO (STEP-BY-STEP EXECUTION PLAN)

Khi AI tiếp theo nhận file thiết kế này, hãy thực hiện tuần tự 5 bước sau:

1. **Bước 1 – Dựng Hệ Thống Asset (`src/pixelArt.ts` & `/public/assets`):**
   - Tạo bộ sprite Isometric cho Sàn gạch, Tường cắt (Cutaway Wall), Kệ hàng 3 tầng, Tủ lạnh, Quầy thu ngân, Xe tải giao hàng, Vết bẩn sàn và 10 mặt hàng siêu thị + bộ Icon UI.
2. **Bước 2 – Dựng Thế Giới Isometric 2.5D (`src/game.ts`):**
   - Render mặt bằng siêu thị không mái + vỉa hè/con phố phía trước với thuật toán `sortableChildren` (Y-sorting).
   - Lập trình AI Khách hàng: Đi từ vỉa hè $\rightarrow$ vào cửa kính $\rightarrow$ tìm đến kệ có hàng $\rightarrow$ lấy hàng $\rightarrow$ ra xếp hàng ở quầy thu ngân $\rightarrow$ thanh toán xong đi ra phố.
3. **Bước 3 – Xây Dựng 2 Mini-Game 2D Cận Cảnh (`src/miniGames.ts`):**
   - **Drawer 2D Xếp Kệ:** Kéo sản phẩm từ thùng carton lên các ô kệ 2D.
   - **Drawer 2D Thu Ngân:** Vuốt từng món qua tia laser máy quét kêu *"BÍP!"*, sau đó bấm mệnh giá tiền mặt (`$10, $5, $1, 50¢, 25¢, 10¢`) trong ngăn kéo để trả tiền thừa cho khách.
4. **Bước 4 – Hoàn Thiện Hệ Thống UI Chuẩn (`src/ui.ts`):**
   - Dựng Top Header Bar, 5-Tab Bottom Bar (`Cửa Hàng`, `Nhập Kho`, `Con Phố`, `Nhân Sự`, `Nâng Cấp`), hệ thống Modal thông báo đẹp mắt, Nhiệm vụ (Quests) và Lưu trữ (`localStorage`).
5. **Bước 5 – Kiểm Thử Tự Động & Đóng Gói:**
   - Chạy kiểm thử không có bất kỳ lỗi console/runtime nào, kiểm tra cảm ứng kéo-thả 2D mượt mà trên khung `720x1280`.
