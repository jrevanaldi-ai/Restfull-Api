import fs from 'fs';
import path from 'path';
import { getRecentLogs, getRequestStats } from '../middleware/monitoring.js';

 
export class MonitoringService {
  static startTime = Date.now();

   
  static async getStats() {
    const uptime = Date.now() - this.startTime;
    const uptimeDays = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const uptimeHours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    // Load request logs from file
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'request-logs.log');
    let totalRequests = 0;
    let requestsLastHour = 0;

    if (fs.existsSync(logFile)) {
      try {
        const logContent = fs.readFileSync(logFile, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        totalRequests = lines.length;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        lines.forEach(line => {
          const timestampMatch = line.match(/\[(REQ|BLOCKED_REQ)\]\s+([\d-T:.Z]+)/);
          if (timestampMatch) {
            const timestamp = timestampMatch[2];
            if (timestamp > oneHourAgo) {
              requestsLastHour++;
            }
          }
        });
      } catch (error) {
        console.error('Error reading logs:', error.message);
      }
    }

    // Load banned IPs
    const dataDir = path.join(process.cwd(), 'data');
    const bannedFile = path.join(dataDir, 'banned-ips.json');
    let bannedIPs = 0;

    if (fs.existsSync(bannedFile)) {
      try {
        const bannedData = JSON.parse(fs.readFileSync(bannedFile, 'utf8'));
        bannedIPs = Object.keys(bannedData).length;
      } catch (error) {
        console.error('Error reading banned IPs:', error.message);
      }
    }

    // Get stats from memory logs
    const memoryStats = getRequestStats();
    const recentLogs = getRecentLogs(50);

    // Count active IPs from recent logs
    const uniqueIPs = new Set(recentLogs.map(log => log.ip));
    const activeIPs = uniqueIPs.size;

    // Top endpoints
    const topEndpoints = memoryStats.topEndpoints;

    return {
      totalRequests,
      requestsLastHour,
      activeIPs,
      bannedIPs,
      uptime: `$${uptimeDays}:$${String(uptimeHours).padStart(2, '0')}:$${String(uptimeMinutes).padStart(2, '0')}`,
      startTime: new Date(this.startTime).toLocaleString(),
      rateLimiter: {
        window: 10,
        maxRequests: 25
      },
      methods: memoryStats.methods,
      topEndpoints,
      requestsCount: memoryStats.totalLogs,
      avgResponseTime: memoryStats.avgResponseTime,
      responseTimes: memoryStats.responseTimes
    };
  }

   
  static async getLogs(limit = 100) {
    return getRecentLogs(limit);
  }

   
  static async clearLogs() {
    const { clearMemoryLogs } = await import('../middleware/monitoring.js');
    clearMemoryLogs();
    
    // Also clear file logs
    const logFile = path.join(process.cwd(), 'logs', 'request-logs.log');
    if (fs.existsSync(logFile)) {
      try {
        fs.writeFileSync(logFile, '');
      } catch (error) {
        console.error('Error clearing log file:', error.message);
      }
    }
    
    return true;
  }
}

export default MonitoringService;
