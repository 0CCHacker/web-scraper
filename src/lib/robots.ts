import robotsParser from 'robots-parser';
import { safeFetch, USER_AGENT } from './fetch';
import { getRedis } from './redis';

const ROBOTS_TTL_SEC = 60 * 60 * 24;

type CacheEntry = { body: string; status: number };

export type RobotsResult = { allowed: true } | { allowed: false; reason: string };

export async function checkRobots(targetUrl: string): Promise<RobotsResult> {
  let origin: string;
  try {
    origin = new URL(targetUrl).origin;
  } catch {
    return { allowed: false, reason: 'Invalid URL.' };
  }

  const key = `robots:${origin}`;
  const redis = getRedis();
  let entry: CacheEntry | null = null;

  if (redis) {
    try {
      entry = (await redis.get<CacheEntry>(key)) ?? null;
    } catch {
      entry = null;
    }
  }

  if (!entry) {
    const r = await safeFetch(`${origin}/robots.txt`);
    if (!r.ok) {
      entry = { body: '', status: 0 };
    } else {
      entry = { body: r.body, status: r.status };
    }
    if (redis) {
      try {
        await redis.set(key, entry, { ex: ROBOTS_TTL_SEC });
      } catch {
        // non-fatal
      }
    }
  }

  if (!entry.body) return { allowed: true };

  const parser = robotsParser(`${origin}/robots.txt`, entry.body);
  const allowed = parser.isAllowed(targetUrl, USER_AGENT);
  if (allowed === false) {
    return { allowed: false, reason: `robots.txt on ${origin} disallows ${USER_AGENT}.` };
  }
  return { allowed: true };
}
