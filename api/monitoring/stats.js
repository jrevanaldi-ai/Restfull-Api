import MonitoringService from '../../src/services/monitoringService.js';
import { requireAdminKey } from '../../src/middleware/adminAuth.js';

export default {
  name: "Monitoring Stats",
  description: "Get real-time monitoring statistics and server metrics",
  category: "Monitoring",
  methods: ["GET"],
  params: [],

  run: [requireAdminKey, async function(req, res) {
    try {
      const stats = await MonitoringService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }]
};
