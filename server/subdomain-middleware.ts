import { Request, Response, NextFunction } from "express";

export type AppType = "customer" | "merchant" | "admin";

declare global {
  namespace Express {
    interface Request {
      appType: AppType;
    }
  }
}

export function subdomainMiddleware(req: Request, res: Response, next: NextFunction) {
  const host = req.headers.host || "";
  
  // Determine app type based on subdomain
  let appType: AppType = "customer"; // Default to customer app
  
  if (host.startsWith("partners.") || host.startsWith("business.") || host.startsWith("merchant.")) {
    appType = "merchant";
  } else if (host.startsWith("admin.") || host.startsWith("dashboard.")) {
    appType = "admin";
  }
  
  // Attach app type to request object
  req.appType = appType;
  
  // Set header for frontend to read
  res.setHeader("X-App-Type", appType);
  
  next();
}

export function getAppTypeFromHost(host: string): AppType {
  if (host.startsWith("partners.") || host.startsWith("business.") || host.startsWith("merchant.")) {
    return "merchant";
  } else if (host.startsWith("admin.") || host.startsWith("dashboard.")) {
    return "admin";
  }
  return "customer";
}
