import 'dotenv/config';
import express from "express";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import logger from "../utils/logger.js";
import logApiRequest from "../utils/logApiRequest.js";
import loadEndpoints from "../utils/loader.js";
import setupMiddleware from "../middleware/index.js";
import setupResponseFormatter from "./responseFormatter.js";
import rateLimiter from '../middleware/rateLimiter.js';
import monitoringMiddleware from '../middleware/monitoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(process.cwd(), "files");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// use multer to handle upload buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

 
const app = express();

// Configure application settings
app.set("trust proxy", true);
app.set("json spaces", 2);

// Initialize middleware and response formatter
setupMiddleware(app);
setupResponseFormatter(app);

// Apply monitoring middleware after other middleware
app.use(monitoringMiddleware);

 
let allEndpoints = [];

 
(async function initializeAPI() {
  logger.info("Starting server initialization...");
  logger.info("Loading API endpoints...");

  allEndpoints = (await loadEndpoints(path.join(process.cwd(), "api"), app)) || [];

  logger.ready(`Loaded $${allEndpoints.length} endpoints`);

  setupRoutes(app, allEndpoints);
})();

 
function setupRoutes(app, endpoints) {
   
  app.get("/openapi.json", (req, res) => {
    const baseURL = `$${req.protocol}://$${req.get("host")}`;

     
    const publicEndpoints = endpoints.filter((ep) => {
      return ep.category !== "Monitoring" && ep.category !== "Admin";
    });

     
    const enrichedEndpoints = publicEndpoints.map((ep) => {
      let url = baseURL + ep.route;
      if (ep.params && ep.params.length > 0) {
        const query = ep.params.map((p) => `$${p}=YOUR_$${p.toUpperCase()}`).join("&");
        url += "?" + query;
      }
      return { ...ep, url };
    });

    res.status(200).json({
      title: "Astralune API",
      description: "Welcome to the API documentation. This interactive interface allows you to explore and test our API endpoints in real-time.",
      baseURL,
      endpoints: enrichedEndpoints,
    });
  });

   
  app.post("/admin/unban", express.json(), rateLimiter.adminUnbanHandler);
  
   
  app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });

   
  app.get('/pages/endpoints', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'pages', 'endpoints.html'));
  });

   
  app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'monitoring.html'));
  });

   
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));
  });

   
  app.post("/files/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    // create random hex name
    const randomName = crypto.randomBytes(16).toString("hex") + path.extname(req.file.originalname);
    const filePath = path.join(uploadDir, randomName);
    // save file
    fs.writeFileSync(filePath, req.file.buffer);
    const fileUrl = `$${req.protocol}://$${req.get("host")}/files/$${randomName}`;
    res.json({ url: fileUrl });
    // auto delete after 5 minutes
    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 5 * 60 * 1000);
  });

   
  app.get("/files/:filename", (req, res) => {
      const filePath = path.join(uploadDir, req.params.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found or expired" });
      }
      res.sendFile(filePath);
  });
}

export default app;