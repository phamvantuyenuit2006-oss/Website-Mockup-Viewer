# Website Mockup Viewer 💻📱

Ứng dụng **Local Website Mockup Viewer** cho phép bạn chỉ cần dán một đường link website bất kỳ, hệ thống sẽ tự động dùng trình duyệt Chromium thật (Playwright) để mở website, cuộn lazy load, chụp cả giao diện Desktop và Mobile thật, rồi hiển thị trực quan ngay trong mockup Laptop (MacBook Pro style) và Smartphone (iPhone style).

---

## ✨ Tính năng nổi bật

- ⚡ **Real Browser Automation**: Sử dụng Playwright + Chromium thật để chụp ảnh chính xác 100%, không dùng iframe (vượt qua các giới hạn `X-Frame-Options` / CSP).
- 💻 **MacBook Pro Style Mockup**: Thiết kế khung laptop sang trọng, camera notch, viền bezel mỏng, bàn phím, đổ bóng đa tầng và hiệu ứng phản chiếu kính.
- 📱 **Modern Smartphone Mockup**: Thiết kế điện thoại hiện đại với Dynamic Island, viền titanium bo tròn, nút bấm vật lý, đổ bóng thực tế.
- 🔄 **3 Chế độ xem**:
  - `Both` (Mặc định: Laptop + Smartphone kết hợp).
  - `Desktop` (Chỉ xem Laptop).
  - `Mobile` (Chỉ xem Smartphone).
- 📐 **Capture Viewport & Full Page**: Hỗ trợ xem dạng màn hình chuẩn (1440×900 desktop & 390×844 mobile) hoặc chụp toàn bộ chiều dài trang.
- 📊 **Realtime Progress Indicator**:
  - `Connecting...`
  - `Loading website...`
  - `Capturing desktop...`
  - `Capturing mobile...`
  - `Rendering mockup...`
  - `Ready`
- 💾 **Export 1-Click**: Xuất ảnh mockup chất lượng cao Retina độ phân giải cao dưới dạng **PNG**, **JPG**, **WEBP**.
- 🌓 **Dark & Light Mode**: Tùy chỉnh giao diện tối/sáng dễ chịu.
- 🛡️ **Bảo mật & Tốc độ**: Chạy 100% hoàn toàn LOCAL trên máy tính của bạn, không upload ảnh lên cloud, không cần API key, không cần tài khoản.

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Cài đặt dependencies và Playwright browser
Nếu chưa cài đặt, mở terminal tại thư mục `website-mockup-viewer`:

```bash
npm install
npx playwright install chromium
```

### 2. Chạy ứng dụng Web (Khuyến nghị)
Khởi động cả Backend Server (port 3001) và Frontend React UI (port 5173):

```bash
npm run dev
```

Sau đó mở trình duyệt và truy cập: **[http://localhost:5173](http://localhost:5173)**

---

### 3. Chạy ứng dụng dạng Desktop App (Electron)
Nếu bạn muốn chạy Website Mockup Viewer như một phần mềm Windows Desktop độc lập:

```bash
npm run electron:dev
```

---

## 🛠️ Cấu trúc thư mục

```
website-mockup-viewer/
├── client/                     # Frontend React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Thanh header, Dark mode & Status badge
│   │   │   ├── UrlBar.tsx           # Nhập URL, Chọn chế độ, Nút Generate
│   │   │   ├── ProgressIndicator.tsx# Trạng thái tiến trình chụp thời gian thực
│   │   │   ├── MockupShowcase.tsx   # Khu vực hiển thị mockup kết hợp
│   │   │   ├── LaptopMockup.tsx     # Khung laptop MacBook Pro
│   │   │   ├── MobileMockup.tsx     # Khung điện thoại iPhone
│   │   │   ├── ExportToolbar.tsx    # Nút Export PNG, JPG, WEBP & Refresh
│   │   │   └── ErrorCard.tsx        # Xử lý & thông báo lỗi website
│   │   ├── App.tsx             # State chính & luồng SSE stream
│   │   └── main.tsx
│   └── index.html
├── server/                     # Backend Node.js + Express + Playwright
│   ├── browserManager.ts       # Quản lý Chromium, viewport, lazy-loading
│   ├── index.ts                # Server SSE stream & static screenshot hosting
│   └── types.ts                # Định nghĩa kiểu dữ liệu
├── electron/                   # Desktop App wrapper
│   ├── main.ts
│   └── wait-and-start.ts
└── package.json
```
