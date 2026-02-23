# 🎲 Bầu Cua Tôm Cá — Multiplayer

Game **Bầu Cua Tôm Cá** đa người chơi theo thời gian thực, xây dựng bằng React 19 + Node.js + Socket.IO.

---

## 📁 Cấu trúc dự án

```
Bau_cua/
├── src/                  # Frontend (React + Vite)
│   ├── app/              # Redux store
│   ├── components/       # UI components
│   ├── features/game/    # Redux slices
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Socket.IO singleton
│   └── types/            # TypeScript types
├── server/               # Backend (Node.js + Socket.IO)
│   └── src/
│       ├── server.ts     # Express + Socket.IO server
│       ├── gameEngine.ts # Logic game, tính điểm
│       └── types.ts      # Shared types
├── public/
├── .env                  # Biến môi trường frontend
└── package.json
```

---

## 🚀 Hướng dẫn chạy

### Yêu cầu

- **Node.js** >= 18
- **npm** >= 9

---

### 1. Chạy Backend (Server)

```bash
cd server
npm install
npm run dev
```

Server sẽ chạy tại: `http://localhost:3001`

> Để chạy production: `npm run build && npm start`

---

### 2. Chạy Frontend (Client)

Mở terminal **mới**, từ thư mục gốc:

```bash
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

### 3. Mở trình duyệt

Truy cập **http://localhost:5173**, nhập tên và bắt đầu chơi.

Để test nhiều người chơi: mở **nhiều tab trình duyệt** hoặc dùng nhiều thiết bị trên cùng mạng LAN.

---

## 🌐 Chơi qua mạng LAN

Để các thiết bị khác trong mạng nội bộ có thể vào chơi:

**1. Khởi động frontend với flag `--host`:**

```bash
npm run dev -- --host
```

**2. Cập nhật file `.env` với IP máy host:**

```env
VITE_SERVER_URL=http://<IP_CỦA_BẠN>:3001
```

Ví dụ: `VITE_SERVER_URL=http://192.168.1.10:3001`

**3. Khởi động lại cả server và frontend.**

---

## ⚙️ Biến môi trường

File `.env` tại thư mục gốc:

| Biến | Mặc định | Mô tả |
|---|---|---|
| `VITE_SERVER_URL` | `http://localhost:3001` | URL của backend server |

---

## 🎮 Cách chơi

1. Mở game, nhập **tên người chơi** → Vào Chơi
2. Số dư khởi điểm: **₫1,000**
3. **Click trái** vào ô biểu tượng để đặt cược **+₫10**
4. **Click phải** để bỏ cược **−₫10**
5. Nhấn **🎲 Lắc** để quay xúc xắc (bất kỳ người chơi nào cũng có thể lắc)
6. Kết quả được phát đến **tất cả người chơi** đồng thời

### Quy tắc thắng

- 3 xúc xắc được tung ngẫu nhiên
- Mỗi xúc xắc ra ký hiệu bạn đặt cược → thắng **1:1**
- Ví dụ: Đặt ₫100 vào **Cá**, xúc xắc ra 2 con Cá → thắng **₫200** lợi nhuận

---

## 🛠️ Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | TailwindCSS |
| State | Redux Toolkit |
| Animation | Framer Motion |
| Realtime | Socket.IO Client |
| Backend | Node.js, Express |
| Server WS | Socket.IO |

---

## 📜 Scripts

### Frontend

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run preview` | Xem bản build |

### Backend (`server/`)

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy server với hot-reload (tsx watch) |
| `npm run build` | Biên dịch TypeScript |
| `npm start` | Chạy bản đã build |

---

## 📌 Ghi chú

- Số dư và lịch sử được lưu **trong bộ nhớ server** — reset khi restart server
- Số dư người chơi được lưu theo `playerId` trong `localStorage` trình duyệt
- Tối đa **50 vòng lịch sử** được lưu
- Số dư nhà cái mặc định: **₫1,000,000**
