import type { Field } from './schema';

export type ScrapeRequest = {
  url: string;
  schema: string;
};

export type ScrapeSuccess = {
  ok: true;
  fields: (Field & { nullable: true })[];
  data: Record<string, string | number | boolean | null>[];
  meta: {
    url: string;
    finalUrl: string;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
    htmlBytes: number;
    cleanedBytes: number;
    truncated: boolean;
    schemaCacheHit: boolean;
    schemaUsedLlm: boolean;
  };
};

export type ScrapeErrorCode =
  | 'RATE_LIMIT'
  | 'BLOCKED_DOMAIN'
  | 'BLOCKED_SCHEME'
  | 'BLOCKED_HOSTNAME'
  | 'BLOCKED_PRIVATE_IP'
  | 'DNS_FAIL'
  | 'ROBOTS_DISALLOW'
  | 'SPA_DETECTED'
  | 'FETCH_FAIL'
  | 'TIMEOUT'
  | 'TOO_LARGE'
  | 'TOO_MANY_REDIRECTS'
  | 'HTTP_ERROR'
  | 'SCHEMA_INVALID'
  | 'EXTRACT_FAIL';

export type ScrapeError = {
  ok: false;
  error: ScrapeErrorCode;
  message: string;
};

export type ScrapeResponse = ScrapeSuccess | ScrapeError;
