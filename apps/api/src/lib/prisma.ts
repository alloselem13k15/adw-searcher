import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Log les requêtes lentes en développement
prisma.$on('query', (e: { duration: number; query: string }) => {
  if (e.duration > 500) {
    logger.warn(`Requête lente (${e.duration}ms): ${e.query}`)
  }
})

prisma.$on('error', (e: { message: string }) => {
  logger.error('Erreur Prisma:', e.message)
})

export default prisma
