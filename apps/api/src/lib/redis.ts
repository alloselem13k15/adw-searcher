import Redis from 'ioredis'
import { logger } from './logger'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 10) {
          logger.error('Redis: nombre maximum de tentatives atteint')
          return null
        }
        return Math.min(times * 100, 3000)
      },
      reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ECONNRESET']
        if (targetErrors.some((e) => err.message.includes(e))) {
          return true
        }
        return false
      },
    })

    redis.on('connect', () => logger.info('Redis: connecté'))
    redis.on('error', (err: Error) => logger.error('Redis erreur:', err.message))
    redis.on('close', () => logger.warn('Redis: connexion fermée'))
    redis.on('reconnecting', () => logger.info('Redis: reconnexion en cours...'))
  }
  return redis
}

// ── Helpers Redis ─────────────────────────────────────────────

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  const r = getRedis()
  await r.setex(key, ttlSeconds, JSON.stringify(value))
}

export async function getCache<T>(key: string): Promise<T | null> {
  const r = getRedis()
  const data = await r.get(key)
  if (!data) return null
  try {
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

export async function deleteCache(key: string): Promise<void> {
  const r = getRedis()
  await r.del(key)
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const r = getRedis()
  const keys = await r.keys(pattern)
  if (keys.length > 0) {
    await r.del(...keys)
  }
}

// Incrémenteur de rate limiting
export async function incrementCounter(
  key: string,
  windowSeconds: number
): Promise<number> {
  const r = getRedis()
  const multi = r.multi()
  multi.incr(key)
  multi.expire(key, windowSeconds)
  const results = await multi.exec()
  return (results?.[0]?.[1] as number) || 0
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}
