import { createLogger, format, transports } from "winston";

const timezoned = () => {
  return new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
};

const Logger = createLogger({
  transports: [
    new transports.File({
      dirname: "logs",
      filename: "main.log",
      level: "info",
    }),
    new transports.Console({
        level: process.env.LOG_LEVEL,
    }),
  ],
  format: format.combine(
    format.timestamp({ format: timezoned }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
});

export function taggedLogger(tag: string) {
  return {
    info: (message: string) => {
      Logger.info(`[${tag}] ${message}`);
    },
    warn: (message: string) => {
      Logger.warn(`[${tag}] ${message}`);
    },
    error: (message: string) => {
      Logger.error(`[${tag}] ${message}`);
    },
    debug: (message: string) => {
      Logger.debug(`[${tag}] ${message}`);
    },
    verbose: (message: string) => {
      Logger.verbose(`[${tag}] ${message}`);
    },
  };
}
