import MonitoringService from '../../src/services/monitoringService.js';
import { requireAdminKey } from '../../src/middleware/adminAuth.js';

export default {
  name: "Clear Monitoring Logs",
  description: "Clear all request logs for monitoring dashboard",
  category: "Monitoring",
  methods: ["POST"],
  params: [],

  run: [requireAdminKey, async function(req, res) {
    try {
      const success = MonitoringService.clearLogs();

      if (success) {
        res.json({
          success: true,
          message: "Logs cleared successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to clear logs"
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
