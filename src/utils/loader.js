import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

 
export default async function loadEndpoints(dir, app) {
   
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
   
  const endpoints = [];

  // Process each file/directory in the current directory
  for (const file of files) {
     
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
       
      const subEndpoints = await loadEndpoints(fullPath, app);
      endpoints.push(...subEndpoints);
    } else if (file.isFile() && file.name.endsWith(".js")) {
      try {
         
        const module = (await import(pathToFileURL(fullPath))).default;

        // Check if the module has the required run function
        if (typeof module.run === "function" || Array.isArray(module.run)) {
           
          const routePath = "/api" + fullPath
            .replace(path.join(process.cwd(), "api"), "")
            .replace(/\.js$/, "")
            .replace(/\\/g, "/");

           
          const methods = module.methods || ["GET"];

          // Register each HTTP method with Express
          for (const method of methods) {
             
            if (Array.isArray(module.run)) {
              app[method.toLowerCase()](routePath, ...module.run);
            } else {
              app[method.toLowerCase()](routePath, (req, res) => module.run(req, res));
            }
          }

          // Log successful endpoint loading
          console.log(`• endpoint loaded: $${routePath} [$${methods.join(", ")}]`);

           
          const endpointInfo = {
            name: module.name || path.basename(file.name, '.js'),
            description: module.description || "",
            category: module.category || "General",
            route: routePath,
            methods,
            params: module.params || [],
            paramsSchema: module.paramsSchema || {},
          };

          endpoints.push(endpointInfo);
        }
      } catch (error) {
        console.error(`Error loading endpoint $${fullPath}:`, error);
      }
    }
  }

  return endpoints;
}