import rateLimiter from '../../src/middleware/rateLimiter.js';
import { requireAdminKey } from '../../src/middleware/adminAuth.js';

export default {
  name: "Admin Stats",
  description: "Get admin statistics including banned IPs and active connections",
  category: "Admin",
  methods: ["GET"],
  params: [],

  run: [requireAdminKey, function(req, res) {
    try {
      const stats = rateLimiter.getStats();
      const bannedList = rateLimiter.getBannedList();

      res.json({
        success: true,
        data: {
          activeIPs: stats.activeIPs,
          bannedCount: stats.bannedCount,
          recentBans: Object.entries(bannedList)
            .map(([ip, info]) => ({ ip, ...info }))
            .slice(0, 10)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }]
};
