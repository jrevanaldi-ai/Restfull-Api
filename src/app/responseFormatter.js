 
export default function setupResponseFormatter(app) {
  app.use((req, res, next) => {
     
    const originalJson = res.json;
    
     
    res.json = function (data) {
      // Only format if data is an object (not null, array, or primitive)
      if (data && typeof data === "object") {
         
        const statusCode = res.statusCode || 200;
        
         
        const responseData = {
          statusCode,
          ...data,
        };

        // Add additional fields only for successful responses (2xx status codes)
        if (statusCode >= 200 && statusCode < 300) {
           
          responseData.timestamp = new Date().toISOString();

           
          responseData.creator = "AstraluneCompany";
        }

        // Call the original json method with the formatted data
        return originalJson.call(this, responseData);
      }
      
      // For non-object data, use the original json method unchanged
      return originalJson.call(this, data);
    };
    
    // Proceed to the next middleware
    next();
  });
}