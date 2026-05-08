import { Request, Response, NextFunction } from "express";
import winston from "winston";
import path from "path";

// 1. Create the Winston instance
const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(), // Log to terminal
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs/error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs/combined.log"),
    }),
  ],
});

// 2. Export the winston instance for manual logging
export { winstonLogger };

// 3. This is the middleware used in app.ts
export const logger = (req: Request, _res: Response, next: NextFunction) => {
  winstonLogger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
};
