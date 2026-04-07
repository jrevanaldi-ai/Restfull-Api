import fs from 'fs';
import path from 'path';

 
let requestLogs = [];

 
const MAX_MEMORY_LOGS = 1000;

 
const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const method = req.method;
  const url = req.url;
  const path = req.path;

  // Store original json method
  const originalJson = res.json;
  const originalSend = res.send;

  // Override response methods to capture response completion
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Create structured log entry
    const logEntry = {
      timestamp,
      ip,
      method,
      path,
      url,
      statusCode,
      responseTime,
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    // Add to memory logs
    requestLogs.push(logEntry);
    if (requestLogs.length > MAX_MEMORY_LOGS) {
      requestLogs = requestLogs.slice(-MAX_MEMORY_LOGS);
    }

    // Restore original method
    res.json = originalJson;
    return originalJson.call(this, data);
  };

  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Create structured log entry
    const logEntry = {
      timestamp,
      ip,
      method,
      path,
      url,
      statusCode,
      responseTime,
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    // Add to memory logs
    requestLogs.push(logEntry);
    if (requestLogs.length > MAX_MEMORY_LOGS) {
      requestLogs = requestLogs.slice(-MAX_MEMORY_LOGS);
    }

    // Restore original method
    res.send = originalSend;
    return originalSend.call(this, data);
  };

  next();
};

 
export function getRecentLogs(limit = 100) {
  return requestLogs.slice(-limit);
}

 
export function getRequestStats() {
  const totalLogs = requestLogs.length;
  const methods = { GET: 0, POST: 0, PUT: 0, DELETE: 0 };
  const endpointHits = {};
  const responseTimes = [];
  const statusCodes = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };

  requestLogs.forEach(log => {
    // Count methods
    if (methods[log.method] !== undefined) {
      methods[log.method]++;
    }

    // Count endpoints
    endpointHits[log.path] = (endpointHits[log.path] || 0) + 1;

    // Collect response times
    responseTimes.push(log.responseTime);

    // Count status codes
    const statusGroup = `$${Math.floor(log.statusCode / 100)}xx`;
    if (statusCodes[statusGroup] !== undefined) {
      statusCodes[statusGroup]++;
    }
  });

  // Calculate average response time
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  // Get top endpoints
  const topEndpoints = Object.entries(endpointHits)
    .map(([path, hits]) => ({ path, hits }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 10);

  return {
    totalLogs,
    methods,
    topEndpoints,
    avgResponseTime,
    statusCodes,
    responseTimes: {
      min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      avg: avgResponseTime
    }
  };
}

 
export function clearMemoryLogs() {
  requestLogs = [];
}

export default monitoringMiddleware;
