import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/errors.log", level: "error" }),
    new winston.transports.File({ filename: "logs/callback.log" })
  ]
});

export default logger;
