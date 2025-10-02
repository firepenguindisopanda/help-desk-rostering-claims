import { createRouteHandler } from "uploadthing/next";
 
import { ourFileRouter } from "./core";
 
// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  
  // Apply (optional) global config
  config: {
    // Set your upload region (optional)
    // region: "us-east-1", // or whatever region you prefer
  },
});