# Monitoring Dashboard

Halaman monitoring dashboard yang komprehensif untuk Astralune API.

## Akses Dashboard

Dashboard dapat diakses di: **http://localhost:7860/monitoring**

## Fitur Dashboard

### 1. Server Performance Cards

#### Speedometer Latency
- Gauge visual untuk mengukur latency server
- Warna otomatis:
  - 🟢 Hijau: < 100ms (Excellent)
  - 🟡 Kuning: 100-300ms (Good)
  - 🟠 Orange: 300-500ms (Fair)
  - 🔴 Merah: > 500ms (Poor)

#### Total Requests
- Jumlah total request yang diterima
- Statistik request dalam 1 jam terakhir

#### Active IPs
- Jumlah unik IP yang aktif
- Jumlah IP yang di-banned

#### Server Uptime
- Waktu server sudah berjalan
- Format: days:hours:minutes

### 2. Request Analytics Charts

#### Requests Over Time
- Line chart menampilkan jumlah request seiring waktu
- Update otomatis setiap 5 detik

#### Latency Over Time
- Line chart menampilkan latency per request
- Membantu identifikasi pattern dan bottleneck

#### HTTP Methods Distribution
- Doughnut chart distribusi method (GET/POST/PUT/DELETE)
- Memberikan insight tipe request yang dominan

#### Top Endpoints
- Horizontal bar chart endpoint paling sering diakses
- Ranking 10 endpoint teratas

### 3. Real-time Request Table

Tabel yang menampilkan request terbaru dengan kolom:
- **Timestamp**: Waktu request diterima
- **IP Address**: Alamat IP pengirim
- **Method**: HTTP method (GET/POST/PUT/DELETE)
- **Endpoint**: Path URL yang diakses
- **Status**: HTTP status code
- **Response Time**: Waktu respons dalam milidetik

Fitur:
- Menampilkan 50 request terbaru
- Auto-refresh setiap 5 detik
- Tombol untuk menghapus semua logs

### 4. Available Endpoints

Daftar semua endpoint yang tersedia di API:
- Menampilkan route dan description
- Badge untuk setiap HTTP method yang didukung
- Warna badge berbeda untuk setiap method

### 5. Rate Limiter Status

Informasi rate limiter saat ini:
- **Window Size**: Jendela waktu dalam detik
- **Max Requests**: Batas request per window
- **Banned IPs**: Jumlah IP yang sedang di-blokir

## API Endpoints

Dashboard menggunakan 4 endpoint khusus:

### GET /api/monitoring/stats
Mendapatkan statistik server lengkap.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1234,
    "requestsLastHour": 456,
    "activeIPs": 12,
    "bannedIPs": 3,
    "uptime": "5:12:34",
    "methods": { "GET": 1000, "POST": 234 },
    "topEndpoints": [
      { "path": "/api/ai/gpt", "hits": 500 }
    ],
    "avgResponseTime": 45,
    "responseTimes": { "min": 5, "max": 300, "avg": 45 }
  }
}
```

### GET /api/monitoring/logs
Mendapatkan log request terbaru.

**Query Parameters:**
- `limit` (optional): Jumlah log yang diambil (default: 100)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "timestamp": "2026-04-07T12:00:00.000Z",
      "ip": "192.168.1.1",
      "method": "GET",
      "path": "/api/ai/gpt",
      "statusCode": 200,
      "responseTime": 45,
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

### GET /api/monitoring/ping
Endpoint untuk mengukur latency.

**Response:**
```json
{
  "success": true,
  "message": "pong",
  "timestamp": "2026-04-07T12:00:00.000Z"
}
```

### POST /api/monitoring/clear-logs
Menghapus semua log request.

**Response:**
```json
{
  "success": true,
  "message": "Logs cleared successfully"
}
```

## Teknologi yang Digunakan

- **Chart.js**: Library untuk membuat grafik interaktif
- **Tailwind CSS**: Framework CSS untuk styling
- **Canvas API**: Untuk menggambar speedometer gauge
- **Vanilla JavaScript**: Tidak ada framework, pure JS untuk performa

## Auto-Refresh

Dashboard secara otomatis me-refresh data setiap **5 detik** untuk menampilkan data real-time.

## Performance

- Menyimpan maksimal **1000 log** dalam memory
- Chart menampilkan **50 data points** terbaru
- Speedometer di-update secara real-time
- Minimal overhead pada server

## Troubleshooting

### Dashboard tidak muncul
Pastikan server berjalan: `npm run dev`

### Data tidak update
- Cek console browser untuk error
- Pastikan endpoint `/api/monitoring/*` dapat diakses
- Refresh halaman secara manual

### Chart tidak muncul
- Pastikan koneksi internet aktif (untuk load Chart.js dari CDN)
- Cek browser console untuk error loading script

### Latency selalu 0
- Endpoint `/api/monitoring/ping` mungkin tidak dapat diakses
- Cek network tab di browser DevTools

## Customization

### Mengubah Auto-Refresh Interval
Edit di `monitoring.html`:
```javascript
// Default: 5000ms (5 detik)
setInterval(refreshAll, 5000);
```

### Mengubah Max Memory Logs
Edit di `src/middleware/monitoring.js`:
```javascript
const MAX_MEMORY_LOGS = 1000; // Ubah sesuai kebutuhan
```

### Mengubah Speedometer Max Value
Edit di `monitoring.html`:
```javascript
this.maxValue = 1000; // Ubah max latency yang ditampilkan
```
