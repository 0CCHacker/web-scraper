import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRate } from '@/lib/ratelimit';
import { ssrfGuard } from '@/lib/ssrf';
import { isBlockedDomain } from '@/lib/blocklist';
import { checkRobots } from '@/lib/robots';
import { safeFetch } from '@/lib/fetch';
import { looksLikeSpa } from '@/lib/spa-detect';
import { cleanHtml, htmlBytes } from '@/lib/clean';
import { parseSchema } from '@/lib/schema';
import { extractRecords } from '@/lib/extract';
import type { ScrapeResponse, ScrapeError, ScrapeErrorCode } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  url: z.string().min(1).max(2048),
  schema: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  const started = Date.now();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anon';

  const rate = await checkRate(ip);
  if (!rate.ok) {
    return err('RATE_LIMIT', `Rate limit exceeded (${rate.limit}/day). Try again later.`, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('FETCH_FAIL', 'Invalid JSON body.', 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return err('FETCH_FAIL', `Invalid request: ${parsed.error.message}`, 400);
  }
  const { url, schema: schemaInput } = parsed.data;

  const guard = await ssrfGuard(url);
  if (!guard.ok) {
    const status = guard.code === 'DNS_FAIL' ? 400 : 403;
    return err(guard.code as ScrapeErrorCode, guard.message, status);
  }

  const blocked = isBlockedDomain(guard.url.hostname);
  if (blocked.blocked) {
    return err('BLOCKED_DOMAIN', blocked.reason, 403);
  }

  const robots = await checkRobots(guard.url.toString());
  if (!robots.allowed) {
    return err('ROBOTS_DISALLOW', robots.reason, 403);
  }

  const fetched = await safeFetch(guard.url.toString());
  if (!fetched.ok) {
    const status =
      fetched.code === 'TIMEOUT' ? 504 :
      fetched.code === 'TOO_LARGE' ? 413 :
      fetched.code === 'HTTP_ERROR' ? (fetched.status ?? 502) :
      502;
    return err(fetched.code as ScrapeErrorCode, fetched.message, status);
  }

  if (looksLikeSpa(fetched.body)) {
    return err(
      'SPA_DETECTED',
      'This page is client-rendered (SPA). Server-side fetch returned no usable content. Browser rendering is needed (available in full build).',
      422
    );
  }

  const { cleaned, truncated } = cleanHtml(fetched.body);
  const rawBytes = htmlBytes(fetched.body);
  const cleanedBytes = Buffer.byteLength(cleaned, 'utf8');

  if (!cleaned || cleaned.length < 50) {
    return err('EXTRACT_FAIL', 'Cleaned content was empty; nothing to extract.', 422);
  }

  let parsedSchema;
  try {
    parsedSchema = await parseSchema(schemaInput);
  } catch (e) {
    return err('SCHEMA_INVALID', (e as Error).message, 400);
  }

  let extraction;
  try {
    extraction = await extractRecords(cleaned, guard.url.toString(), parsedSchema.fields);
  } catch (e) {
    return err('EXTRACT_FAIL', `Extraction failed: ${(e as Error).message}`, 500);
  }

  const response: ScrapeResponse = {
    ok: true,
    fields: parsedSchema.fields.map((f) => ({ ...f, nullable: true })),
    data: extraction.records,
    meta: {
      url,
      finalUrl: fetched.finalUrl,
      inputTokens: extraction.inputTokens,
      outputTokens: extraction.outputTokens,
      durationMs: Date.now() - started,
      htmlBytes: rawBytes,
      cleanedBytes,
      truncated,
      schemaCacheHit: parsedSchema.cacheHit,
      schemaUsedLlm: parsedSchema.usedLlm,
    },
  };
  return NextResponse.json(response);
}

function err(code: ScrapeErrorCode, message: string, status: number) {
  const body: ScrapeError = { ok: false, error: code, message };
  return NextResponse.json(body, { status });
}
