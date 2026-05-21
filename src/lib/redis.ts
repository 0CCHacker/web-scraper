import { Redis } from '@upstash/redis';

let cached: Redis | null = null;
let warned = false;

export function getRedis(): Redis | null {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) {
      console.warn('[redis] UPSTASH_REDIS_REST_URL/TOKEN missing — cache + rate-limit disabled.');
      warned = true;
    }
    return null;
  }
  cached = new Redis({ url, token });
  return cached;
}
