import express from "express";
import logApiRequest from "../utils/logApiRequest.js";
import rateLimiter from "./rateLimiter.js";

 
export default function setupMiddleware(app) {
   
  app.use(express.json());
  
   
  app.use(express.urlencoded({ extended: true }));
  
   
  app.use(logApiRequest);
  
   
  app.use(rateLimiter.middleware);
  
   
  app.use(express.static('public'));
}