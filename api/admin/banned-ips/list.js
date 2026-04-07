import rateLimiter from '../../../src/middleware/rateLimiter.js';
import { requireAdminKey } from '../../../src/middleware/adminAuth.js';

export default {
  name: "List Banned IPs",
  description: "Get list of all banned IP addresses with details",
  category: "Admin",
  methods: ["GET"],
  params: [],

  run: [requireAdminKey, function(req, res) {
    try {
      const bannedList = rateLimiter.getBannedList();
      const stats = rateLimiter.getStats();

      // Convert to array for easier consumption
      const bannedArray = Object.entries(bannedList).map(([ip, info]) => ({
        ip,
        ...info
      }));

      res.json({
        success: true,
        data: {
          banned: bannedArray,
          total: bannedArray.length,
          activeIPs: stats.activeIPs
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
