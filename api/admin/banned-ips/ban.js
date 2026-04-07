import rateLimiter from '../../../src/middleware/rateLimiter.js';
import { requireAdminKey } from '../../../src/middleware/adminAuth.js';

export default {
  name: "Ban IP Address",
  description: "Manually ban an IP address with optional reason",
  category: "Admin",
  methods: ["POST"],
  params: ["ip", "reason"],
  paramsSchema: {
    ip: { type: "string", required: true },
    reason: { type: "string", required: false }
  },

  run: [requireAdminKey, function(req, res) {
    try {
      const { ip, reason = "Manual ban by admin" } = req.body;

      if (!ip) {
        return res.status(400).json({
          success: false,
          error: "IP address is required"
        });
      }

      rateLimiter.banIp(ip, reason);

      res.json({
        success: true,
        message: `IP $$${ip} has been banned successfully`,
        data: { ip, reason }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }]
};
