import MonitoringService from '../../src/services/monitoringService.js';
import { requireAdminKey } from '../../src/middleware/adminAuth.js';

export default {
  name: "Monitoring Logs",
  description: "Get recent request logs for monitoring dashboard",
  category: "Monitoring",
  methods: ["GET"],
  params: ["limit"],
  paramsSchema: {
    limit: { type: "number", required: false, default: 100 }
  },

  run: [requireAdminKey, async function(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const logs = await MonitoringService.getLogs(limit);

      res.json({
        success: true,
        logs: logs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }]
};
