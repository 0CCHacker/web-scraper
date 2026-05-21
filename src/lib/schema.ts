import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getRedis } from './redis';
import { callGemini } from './extract';

export type FieldType = 'string' | 'number' | 'boolean';

export type Field = {
  name: string;
  type: FieldType;
  description?: string;
};

export type ParsedSchema = {
  fields: Field[];
  cacheHit: boolean;
  usedLlm: boolean;
};

const SCHEMA_TTL_SEC = 60 * 60 * 24 * 7;

const FIELD_NAME_RE = /^[a-z][a-z0-9_]*$/;
const FAST_PATH_RE = /^[a-z][a-z0-9_ ]*(,\s*[a-z][a-z0-9_ ]*)*$/i;

const fieldListSchema = z.object({
  fields: z
    .array(
      z.object({
        name: z
          .string()
          .min(1)
          .max(60)
          .transform((s) => s.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, ''))
          .refine((s) => FIELD_NAME_RE.test(s), 'invalid field name'),
        type: z.enum(['string', 'number', 'boolean']),
        description: z.string().max(200).optional(),
      })
    )
    .min(1)
    .max(20),
});

function normalizeNlInput(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function dedupeFields(fields: Field[]): Field[] {
  const seen = new Set<string>();
  const out: Field[] = [];
  for (const f of fields) {
    const name = slugify(f.name);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, type: f.type, description: f.description });
  }
  return out;
}

function tryFastPath(input: string): Field[] | null {
  if (!FAST_PATH_RE.test(input)) return null;
  const parts = input
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > 20) return null;
  const fields = parts.map<Field>((p) => ({ name: slugify(p), type: 'string' }));
  const deduped = dedupeFields(fields);
  if (deduped.length === 0) return null;
  return deduped;
}

const LLM_PROMPT = `You convert a user's natural-language field list into a strict JSON schema description for a web scraper.

Rules:
- Output ONLY JSON matching: { "fields": [ { "name": string, "type": "string"|"number"|"boolean", "description"?: string }, ... ] }
- "name" must be snake_case ASCII, 1-60 chars, starting with a letter.
- "type" must be one of: "string", "number", "boolean". When in doubt, choose "string".
- Include at most 20 fields. Drop duplicates.
- "description" is optional, max 200 chars; include only when the user gave hints (e.g. "price in USD").
- Do not invent fields the user did not ask for. Do not output any commentary.

User request:
"""
{INPUT}
"""`;

async function llmConvert(input: string): Promise<Field[]> {
  const prompt = LLM_PROMPT.replace('{INPUT}', input.slice(0, 1000));
  const responseSchema = {
    type: 'object',
    properties: {
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['string', 'number', 'boolean'] },
            description: { type: 'string', nullable: true },
          },
          required: ['name', 'type'],
        },
      },
    },
    required: ['fields'],
  } as const;

  const raw = await callGemini({
    prompt,
    responseSchema,
    maxOutputTokens: 1024,
    timeoutMs: 15_000,
  });
  const parsed = fieldListSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Schema LLM returned invalid output: ${parsed.error.message}`);
  }
  const deduped = dedupeFields(parsed.data.fields);
  if (deduped.length === 0) throw new Error('Schema produced no valid fields.');
  return deduped;
}

function cacheKey(normalized: string): string {
  return `schema:${createHash('sha256').update(normalized).digest('hex').slice(0, 32)}`;
}

export async function parseSchema(rawInput: string): Promise<ParsedSchema> {
  const normalized = normalizeNlInput(rawInput);
  if (!normalized) {
    throw new Error('Schema input is empty.');
  }

  const fast = tryFastPath(normalized);
  if (fast) {
    return { fields: fast, cacheHit: false, usedLlm: false };
  }

  const redis = getRedis();
  const key = cacheKey(normalized);

  if (redis) {
    try {
      const cached = await redis.get<Field[]>(key);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return { fields: cached, cacheHit: true, usedLlm: false };
      }
    } catch {
      // non-fatal
    }
  }

  const fields = await llmConvert(normalized);

  if (redis) {
    try {
      await redis.set(key, fields, { ex: SCHEMA_TTL_SEC });
    } catch {
      // non-fatal
    }
  }

  return { fields, cacheHit: false, usedLlm: true };
}
