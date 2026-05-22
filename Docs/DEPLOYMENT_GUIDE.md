# 🚀 Hướng dẫn Deploy E-Learning Platform

Có nhiều cách để deploy dự án này. Dưới đây là 3 cách phổ biến nhất:

---

## MỤC LỤC

1. [Cách 1: Deploy trên Render (Dễ nhất, free)](#-cách-1-deploy-trên-render-dễ-nhất)
2. [Cách 2: Deploy trên Vercel + MongoDB Atlas (Frontend + Backend riêng)](#-cách-2-deploy-trên-vercel--mongodb-atlas)
3. [Cách 3: Deploy trên VPS (AWS / DigitalOcean / Azure)](#-cách-3-deploy-trên-vps)
4. [So sánh các cách deploy](#-so-sánh-các-cách-deploy)
5. [Kiểm tra sau deploy](#-kiểm-tra-sau-deploy)

---

## 🥇 Cách 1: Deploy trên Render (Dễ nhất)

> **Chi phí:** Free (Web Service + PostgreSQL không cần)  
> **Thời gian:** ~30 phút  
> **Phù hợp:** Demo, báo cáo, test

### Bước 1: Chuẩn bị

**1.1. Tạo tài khoản**
- [Render.com](https://render.com) — Đăng ký bằng GitHub

**1.2. Đẩy code lên GitHub**
```bash
git add .
git commit -m "ready for deploy"
git push origin main
```

**1.3. Sửa file `backend/package.json` — Thêm script build**
```json
"scripts": {
  "start": "node index.js",
  "build": "npm install"
}
```

### Bước 2: Deploy Backend lên Render

1. Dashboard Render → **New +** → **Web Service**
2. **Connect GitHub repository** → chọn repo của bạn
3. Cấu hình:
   - **Name:** `elearning-api` (tùy chọn)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** Free
4. **Environment Variables** (Add từng cái):
   ```
   PORT=5001
   MONGODB_URI=mongodb+srv://... (của bạn)
   JWT_SECRET=0123456789
   GEMINI_API_KEY=... (nếu có)
   CLIENT_URL=https://elearning-fe.vercel.app (sẽ có sau)
   ```
5. **Deploy** → đợi ~5 phút
6. Copy URL backend (VD: `https://elearning-api.onrender.com`)

> ⚠️ **Lưu ý với Render Free:**
> - Server sẽ **sleep** sau 15 phút không có request
> - Lần đầu truy cập sau khi sleep mất ~30 giây để wake up
> - Có thể dùng [UptimeRobot](https://uptimerobot.com) để ping mỗi 14 phút (free)

### Bước 3: Deploy Frontend lên Render (hoặc Vercel)

#### Option A: Deploy Frontend trên Render

1. **New +** → **Static Site**
2. **Root Directory:** `frontend`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `build`
5. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://elearning-api.onrender.com
   ```
6. **Deploy**

#### Option B: Deploy Frontend trên Vercel (Nhanh hơn)

1. [Vercel.com](https://vercel.com) → Đăng ký bằng GitHub
2. **Add New Project** → Import GitHub repo
3. **Root Directory:** `frontend`
4. **Framework Preset:** `Create React App`
5. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://elearning-api.onrender.com
   ```
6. **Deploy** → đợi ~2 phút
7. Copy URL (VD: `https://elearning-fe.vercel.app`)

### Bước 4: Cập nhật Backend

Vào Render Dashboard → **Environment** → sửa:
```
CLIENT_URL=https://elearning-fe.vercel.app
```

**Deploy lại Backend:** Dashboard → **Manual Deploy** → **Deploy**

---

## 🥈 Cách 2: Deploy trên Vercel + MongoDB Atlas

> **Chi phí:** Free  
> **Phù hợp:** Khi backend là serverless (Vercel Functions)

### Backend — Serverless trên Vercel

**1. Sửa `backend/index.js` — Export Express app:**
```javascript
// Thêm ở CUỐI file (trước connectDB)
module.exports = app;

// Giữ nguyên connectDB() cho local development
```

**2. Tạo file `backend/api/index.js`:**
```javascript
const app = require('../index');
module.exports = app;
```

**3. Cấu hình `vercel.json` (đã có sẵn):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.js" }
  ]
}
```

**4. Deploy Backend lên Vercel:**
```
cd backend
npx vercel --prod
```

### Frontend — Deploy lên Vercel

```
cd frontend
npx vercel --prod
```

> ⚠️ **Lưu ý:** Socket.IO không chạy được trên Vercel Free. Nếu cần chat realtime, deploy backend trên Render hoặc VPS.

---

## 🥉 Cách 3: Deploy trên VPS

> **Chi phí:** $5-10/tháng  
> **Phù hợp:** Production thật, có nhiều user

### Bước 1: Mua VPS

- **DigitalOcean:** $6/tháng (droplet basic)
- **AWS EC2:** Free tier (1 năm)
- **Azure VM:** Free tier (12 tháng)
- **Hoặc:** VPS Việt Nam (~50k/tháng)

### Bước 2: Cài đặt môi trường

SSH vào VPS và chạy:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone project
git clone https://github.com/your-username/elearning-platform.git
cd elearning-platform

# Install backend
cd backend
npm install

# Create .env file
nano .env
# → Paste nội dung .env (PORT=5001, MONGODB_URI, ...)

# Start backend với PM2
pm2 start index.js --name "elearning-api"
pm2 save
pm2 startup
```

### Bước 3: Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/elearning
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/elearning-frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/elearning /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Build frontend
cd ~/elearning-platform/frontend
npm install
REACT_APP_API_URL=http://api.yourdomain.com npm run build

# Copy to web root
sudo cp -r build/* /var/www/elearning-frontend/build/
```

### Bước 4: SSL với Let's Encrypt (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## 📊 So sánh các cách deploy

| Tiêu chí | Render 🥇 | Vercel 🥈 | VPS 🥉 |
|---------|-----------|-----------|--------|
| **Chi phí** | Miễn phí | Miễn phí | $5-10/tháng |
| **SSL (HTTPS)** | Tự động | Tự động | Tự cài |
| **Socket.IO** | ✅ Có | ❌ Không | ✅ Có |
| **File upload (PDF)** | ⚠️ Hạn chế | ❌ Mất | ✅ Có |
| **Sleep khi không dùng** | ⚠️ 15 phút | ❌ Không | ❌ Không |
| **Tốc độ** | Trung bình | Nhanh | Nhanh |
| **Domain tùy chỉnh** | Có (free) | Có (free) | Có |
| **Độ khó** | 🟢 Dễ | 🟢 Dễ | 🔴 Trung bình |
| **Thời gian setup** | ~30 phút | ~20 phút | ~2 giờ |

### Nếu bạn cần:
- **Demo nhanh + free** → **Render** (backend) + **Vercel** (frontend)
- **Chat realtime hoạt động** → **Render** (cả backend + frontend)
- **Production thật sự** → **VPS** (có thể dùng thêm Docker)
- **Không cần realtime chat** → **Vercel** cho cả backend + frontend

---

## ✅ Kiểm tra sau deploy

Sau khi deploy xong, kiểm tra:

```bash
# 1. Backend hoạt động?
curl https://elearning-api.onrender.com/
# → {"message":"Welcome to SRM's Backend"}

# 2. Courses API?
curl https://elearning-api.onrender.com/courses/all
# → {"course":[...]}

# 3. Frontend truy cập được?
# → Mở browser: https://elearning-fe.vercel.app

# 4. Login hoạt động?
# → Đăng nhập bằng tài khoản có sẵn

# 5. Certificate?
# → Vào khóa học đã enroll → Get Certificate

# 6. AI Assistant?
# → Cần GEMINI_API_KEY đã set trong env
```

---

## ⚠️ Các lưu ý quan trọng

### 1. File upload (PDF) trên Render/Vercel
- **Render:** File lưu tạm, sẽ mất khi server restart
- **Vercel:** Không support ghi file
- **Giải pháp:** Dùng cloud storage (Cloudinary, AWS S3)

### 2. Socket.IO trên Vercel
- **Không chạy được** vì Vercel là serverless
- Deploy backend lên **Render** hoặc **VPS** nếu cần chat realtime

### 3. MongoDB URI
- Dùng MongoDB Atlas (free 512MB)
- Không để URI công khai trên GitHub

### 4. GEMINI_API_KEY
- Nếu không set, AI Assistant sẽ trả lời "chưa cấu hình"
- Không ảnh hưởng đến các chức năng khác

---

## 🐳 Bonus: Deploy với Docker

Nếu có Docker, có thể deploy nhanh với:

```bash
# Clone project
git clone https://github.com/your-username/elearning-platform.git
cd elearning-platform

# Tạo file .env cho Docker
nano docker-compose.yml
# → Chỉnh sửa MONGODB_URI, v.v.

# Build và chạy
docker-compose up -d

# Truy cập
# Frontend: http://localhost:3000
# Backend API: http://localhost:5001
```

Dự án đã có sẵn `docker-compose.yml` và `backend/Dockerfile`.

---

## 🔧 Troubleshooting

| Lỗi | Nguyên nhân | Fix |
|-----|------------|-----|
| `MongooseServerSelectionError` | MongoDB URI sai | Kiểm tra .env, whitelist IP trong MongoDB Atlas |
| `CORS error` | CLIENT_URL chưa đúng | Set đúng URL frontend trong .env |
| `404 Not Found` sau deploy | Route chưa đúng | Kiểm tra vercel.json / nginx config |
| `WebSocket connection failed` | Socket.IO không support | Deploy backend trên Render thay vì Vercel |
| `Error: ENOENT: no such file` | File upload path sai | Upload không hoạt động trên serverless |

---

<div align="center">
  <strong>Chúc bạn deploy thành công! 🚀</strong>
</div>