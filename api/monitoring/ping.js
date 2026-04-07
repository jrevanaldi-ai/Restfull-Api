export default {
  name: "Monitoring Ping",
  description: "Ping endpoint for latency measurement",
  category: "Monitoring",
  methods: ["GET"],
  params: [],

  async run(req, res) {
    try {
      res.json({
        success: true,
        message: "pong",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};
