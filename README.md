# ĐỒ ÁN TRIỂN KHAI HỆ THỐNG E-LEARNING BẰNG CI/CD PIPELINE & CENTRALIZED MONITORING

## 1. Thành viên thực hiện
* **Dương Thành Nhân** - MSSV: 49.01.104.100
* **Lê Viết Thành Thái** - MSSV: 49.01.104.132

## 2. Thông tin hệ thống thực tế (Production Infrastructure)
* **🌐 Ứng dụng E-Learning (Production):** [https://elearning-app.duckdns.org](https://elearning-app.duckdns.org)
* **📊 Hệ thống Giám sát & Quản lý Log tập trung (Grafana Dashboard):** `http://<IP-Droplet>:3000`
* **🔍 Quét chất lượng & An toàn mã nguồn:** SonarCloud Dashboard

## 3. Kiến trúc Công nghệ & Hạ tầng (DevOps Stack)
* **CI/CD Pipeline Engine:** GitHub Actions (Tự động hóa luồng kiểm thử, phân tích mã tĩnh, đóng gói và phát hành).
* **Monorepo Strategy:** Tái cấu trúc cấu trúc thư mục (Monorepo Re-structure) giúp tách biệt dependencies giữa Frontend và Backend, giải quyết triệt để lỗi xung đột `package-lock.json`.
* **Static Code Analysis:** SonarCloud (Cấu hình Quality Gate kiểm tra lỗ hổng bảo mật, Bugs và Code Smells).
* **Containerization:** Docker & Docker Compose v2 (Đóng gói ứng dụng dạng Multi-stage tối ưu dung lượng và cô lập môi trường mạng nội bộ `web_network`).
* **Reverse Proxy & Tự động hóa SSL:** Caddy Server (Xử lý lỗi chặn API *Mixed Content* giữa HTTPS-HTTP và tự cấp chứng chỉ SSL miễn phí).
* **Metrics Monitoring:** Prometheus kết hợp Node Exporter thu thập tài nguyên máy chủ theo thời gian thực (Real-time Metric Collection).
* **Centralized Logging:** Loki & Promtail (Hút log tự động từ Docker Socket và quản lý tập trung trên Grafana).

---

## 4. Hướng dẫn Triển khai chi tiết từ đầu (Deployment & Run Guide)

Để hệ thống tự động vận hành toàn diện mà không cần can thiệp thủ công bằng các lệnh SSH truyền thống, người vận hành thực hiện theo các bước sau:

### Bước 1: Khởi tạo hạ tầng môi trường (Server Setup)
1. Thuê một máy chủ ảo **DigitalOcean Droplet** (Cấu hình khuyến nghị: Linux Ubuntu, tối thiểu 2GB-4GB RAM để đảm bảo chạy tốt cụm Monitoring).
2. Cài đặt **Docker Engine** và **Docker Compose v2** lên Droplet:
   ```bash
   sudo apt-get update
   sudo apt-get install docker.io docker-compose-v2 -y
   sudo systemctl enable docker --now
