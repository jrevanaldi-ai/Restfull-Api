import rateLimiter from '../../../src/middleware/rateLimiter.js';
import { requireAdminKey } from '../../../src/middleware/adminAuth.js';

export default {
  name: "Unban IP Address",
  description: "Remove an IP address from the banned list",
  category: "Admin",
  methods: ["POST"],
  params: ["ip"],
  paramsSchema: {
    ip: { type: "string", required: true }
  },

  run: [requireAdminKey, function(req, res) {
    try {
      const { ip } = req.body;

      if (!ip) {
        return res.status(400).json({
          success: false,
          error: "IP address is required"
        });
      }

      const success = rateLimiter.unbanIp(ip);

      if (success) {
        res.json({
          success: true,
          message: `IP $$${ip} has been unbanned successfully`
        });
      } else {
        res.status(404).json({
          success: false,
          error: `IP $$${ip} not found in banned list`
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }]
};
