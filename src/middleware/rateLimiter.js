 
import 'dotenv/config';
import fs from "fs";
import path from "path";

 
const DATA_DIR = path.join(process.cwd(), "data");

 
const LOG_DIR = path.join(process.cwd(), "logs");

 
const BANNED_FILE = path.join(DATA_DIR, "banned-ips.json");

 
const REQUEST_LOG = path.join(LOG_DIR, "request-logs.log");

 
const WINDOW_MS = 10 * 1000;

 
const MAX_REQUESTS = 25;

 
const CLEANUP_INTERVAL_MS = 60 * 1000;

 
const ipTimestamps = new Map();

 
let banned = {};

 
function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
  if (!fs.existsSync(BANNED_FILE)) fs.writeFileSync(BANNED_FILE, JSON.stringify({}, null, 2));
  if (!fs.existsSync(REQUEST_LOG)) fs.writeFileSync(REQUEST_LOG, "");
}
ensureFiles();

 
function loadBanned() {
  try {
    const raw = fs.readFileSync(BANNED_FILE, "utf8");
    banned = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Failed to load banned ips file:", err);
    banned = {};
  }
}
loadBanned();

 
function saveBanned() {
  try {
    fs.writeFileSync(BANNED_FILE, JSON.stringify(banned, null, 2));
  } catch (err) {
    console.error("Failed to save banned ips file:", err);
  }
}

 
function appendLog(line) {
  try {
    fs.appendFileSync(REQUEST_LOG, line + "\n");
  } catch (err) {
    console.error("Failed to append request log:", err);
  }
}

 
function banIp(ip, reason = "rate_limit_exceeded") {
  const now = new Date().toISOString();
  banned[ip] = {
    bannedAt: now,
    reason,
    by: "rateLimiter",
  };
  saveBanned();
  appendLog(`[BAN] $${now} $${ip} reason=$${reason}`);
}

 
function unbanIp(ip) {
  if (banned[ip]) {
    const now = new Date().toISOString();
    delete banned[ip];
    saveBanned();
    appendLog(`[UNBAN] $${now} $${ip}`);
    return true;
  }
  return false;
}

 
function cleanup() {
  const now = Date.now();
  for (const [ip, arr] of ipTimestamps.entries()) {
    const filtered = arr.filter((t) => now - t <= WINDOW_MS);
    if (filtered.length === 0) ipTimestamps.delete(ip);
    else ipTimestamps.set(ip, filtered);
  }
}

// Run periodic cleanup
setInterval(cleanup, CLEANUP_INTERVAL_MS);

 
function rateLimiterMiddleware(options = {}) {
  const maxReq = options.maxRequests || MAX_REQUESTS;
  const windowMs = options.windowMs || WINDOW_MS;

  return (req, res, next) => {
    // Dapatkan IP (Express menggunakan trust proxy jika dikonfig sebelumnya di index.js)
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown";

    // Kalau sudah dibanned -> langsung blokir
    if (banned[ip]) {
      const info = banned[ip];
      res.status(403).json({
        success: false,
        error: "Your IP has been blocked due to abuse or rate limit violations.",
        note: "Contact the owner to request unblocking.",
        bannedAt: info.bannedAt,
        reason: info.reason,
      });
      appendLog(`[BLOCKED_REQ] $${new Date().toISOString()} $${ip} path=$${req.path} method=$${req.method} - blocked`);
      return;
    }

    // Simpan timestamp
    const now = Date.now();
    const arr = ipTimestamps.get(ip) || [];
    arr.push(now);

    // Buang timestamp yang lebih tua dari window
    const recent = arr.filter((t) => now - t <= windowMs);
    ipTimestamps.set(ip, recent);

    // Logging minimal (append)
    appendLog(`[REQ] $${new Date().toISOString()} $${ip} $${req.method} $${req.path} count=$${recent.length}`);

    if (recent.length > maxReq) {
      // Langsung ban IP
      banIp(ip, `exceeded_$${maxReq}_per_$${windowMs}ms`);
      res.status(429).json({
        success: false,
        error: `Rate limit exceeded - your IP has been blocked. Max $${maxReq} requests per $${windowMs/1000}s.`,
        note: "Contact the owner to request unblocking.",
      });
      return;
    }

    next();
  };
}

 
function adminUnbanHandler(req, res) {
  const adminKey = process.env.ADMIN_KEY || null;
  const provided = req.headers["x-admin-key"] || req.body?.adminKey || req.query?.adminKey;

  if (!adminKey) {
    return res.status(500).json({ success: false, error: "ADMIN_KEY not configured on server." });
  }

  if (!provided || provided !== adminKey) {
    return res.status(401).json({ success: false, error: "Unauthorized. Provide valid admin key in X-Admin-Key header." });
  }

  const { ip } = req.body;
  if (!ip) return res.status(400).json({ success: false, error: "Provide ip in request body to unban." });

  const ok = unbanIp(ip);
  if (ok) return res.json({ success: true, message: `IP $${ip} unbanned.` });
  return res.status(404).json({ success: false, error: `IP $${ip} not found in ban list.` });
}

 
function getBannedList() {
  return banned;
}

 
function getStats() {
  return {
    activeIps: ipTimestamps.size,
    bannedCount: Object.keys(banned).length,
  };
}

 
export default {
   
  middleware: rateLimiterMiddleware(),
  
   
  adminUnbanHandler,
  
   
  getBannedList,
  
   
  getStats,
  
   
  banIp,
  
   
  unbanIp,
};