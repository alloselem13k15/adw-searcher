import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

const { combine, timestamp, errors, json, colorize, simple } = winston.format

const isDev = process.env.NODE_ENV === 'development'

// Format pour les logs en production (JSON structuré)
const productionFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
)

// Format pour les logs en développement (lisible)
const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  simple()
)

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isDev ? developmentFormat : productionFormat,
  }),
]

// Rotation des fichiers de log en production
if (!isDev) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.env.LOG_DIR || './logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '100m',
      format: productionFormat,
    }),
    new DailyRotateFile({
      filename: path.join(process.env.LOG_DIR || './logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '100m',
      format: productionFormat,
    })
  )
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  // Ne jamais logger dans les tests
  silent: process.env.NODE_ENV === 'test',
})

// Intercepter les exceptions non gérées
if (!isDev) {
  logger.exceptions.handle(
    new DailyRotateFile({
      filename: path.join(process.env.LOG_DIR || './logs', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    })
  )
}
