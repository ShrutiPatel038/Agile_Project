import { createLogger, format, transports } from 'winston';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

// Ensure logs/ directory exists in production
if (isProd) {
  const logsDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
}

const logTransports = isProd
  ? [
      new transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
        format: format.combine(format.timestamp(), format.json()),
      }),
      new transports.File({
        filename: path.join(__dirname, '../../logs/app.log'),
        format: format.combine(format.timestamp(), format.json()),
      }),
    ]
  : [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.timestamp({ format: 'HH:mm:ss' }),
          format.printf(({ timestamp, level, message, ...meta }) => {
            const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
            return `${timestamp} ${level}: ${message}${extras}`;
          })
        ),
      }),
    ];

const logger = createLogger({
  level: logLevel,
  transports: logTransports,
});

// Morgan stream — writes HTTP logs through Winston at 'http' level
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

// Morgan format: concise in dev, combined in prod
export const morganMiddleware = morgan(isProd ? 'combined' : 'dev', {
  stream: morganStream,
});

export default logger;
