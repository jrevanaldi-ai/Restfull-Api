import 'dotenv/config';

 
export function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;

  // ADMIN_KEY tidak dikonfigurasi
  if (!adminKey) {
    return res.status(500).json({
      success: false,
      error: "Admin key not configured on server"
    });
  }

  // Ambil admin key dari header, query, atau body
  const providedKey = req.headers['x-admin-key'] 
    || req.query.adminKey 
    || req.body?.adminKey;

  // Tidak ada key yang diberikan
  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: "Admin key required. Provide it via X-Admin-Key header, adminKey query parameter, or request body"
    });
  }

  // Key tidak cocok
  if (providedKey !== adminKey) {
    return res.status(403).json({
      success: false,
      error: "Invalid admin key"
    });
  }

  // Key valid, lanjutkan
  next();
}

export default { requireAdminKey };
