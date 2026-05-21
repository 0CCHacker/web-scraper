import { getVertex, MODEL_ID } from './vertex';
import { buildExtractionResponseSchema, sanitizeForGemini, type GeminiSchema } from './gemini-schema';
import type { Field } from './schema';

const SYSTEM_INSTRUCTION = `You extract structured data from HTML content provided by the user.

Hard rules:
- Return ALL matching records on the page (this may be a listing page with many items).
- If a requested field is not present for a given record, return null. Do NOT infer, guess, or fabricate.
- Preserve exact text from the page; do not paraphrase or normalize unless the schema says so.
- For numeric fields, parse the value (strip currency symbols, commas). If parsing fails, return null.
- For boolean fields, return true/false based on explicit presence indicators ("in stock", "available", checkmarks). If unclear, return null.
- Output only the JSON object matching the provided response schema. No commentary, no markdown.`;

export type CallGeminiArgs = {
  prompt: string;
  responseSchema: unknown;
  maxOutputTokens?: number;
  timeoutMs?: number;
  systemInstruction?: string;
};

export async function callGemini(args: CallGeminiArgs): Promise<unknown> {
  const vertex = getVertex();
  const model = vertex.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: args.systemInstruction
      ? { role: 'system', parts: [{ text: args.systemInstruction }] }
      : undefined,
    generationConfig: {
      temperature: 0,
      maxOutputTokens: args.maxOutputTokens ?? 2048,
      responseMimeType: 'application/json',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: sanitizeForGemini(args.responseSchema) as any,
    },
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 20_000);
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: args.prompt }] }],
    });
    clearTimeout(timer);
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('Gemini returned empty response.');
    return JSON.parse(text);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export type ExtractResult = {
  records: Record<string, string | number | boolean | null>[];
  inputTokens: number;
  outputTokens: number;
};

export async function extractRecords(
  cleanedHtml: string,
  url: string,
  fields: Field[]
): Promise<ExtractResult> {
  const schema: GeminiSchema = buildExtractionResponseSchema(fields);
  const fieldHints = fields
    .map((f) => `- ${f.name} (${f.type})${f.description ? `: ${f.description}` : ''}`)
    .join('\n');

  const prompt = `URL: ${url}

Schema fields to extract:
${fieldHints}

HTML content (already stripped of scripts/styles/nav/footer):
"""
${cleanedHtml}
"""

Return JSON matching the response schema. Set fields to null when missing. Return ALL records found.`;

  const raw = (await callGemini({
    prompt,
    responseSchema: schema,
    systemInstruction: SYSTEM_INSTRUCTION,
    maxOutputTokens: 4096,
    timeoutMs: 25_000,
  })) as { records?: unknown };

  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.records)) {
    throw new Error('Gemini output missing "records" array.');
  }

  const records = raw.records
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => coerceRecord(r, fields));

  const inputTokens = 0;
  const outputTokens = 0;

  return { records, inputTokens, outputTokens };
}

function coerceRecord(
  raw: Record<string, unknown>,
  fields: Field[]
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const f of fields) {
    const v = raw[f.name];
    if (v === null || v === undefined) {
      out[f.name] = null;
      continue;
    }
    if (f.type === 'number') {
      const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.\-]/g, ''));
      out[f.name] = Number.isFinite(n) ? n : null;
    } else if (f.type === 'boolean') {
      if (typeof v === 'boolean') out[f.name] = v;
      else if (typeof v === 'string') {
        const s = v.toLowerCase().trim();
        if (['true', 'yes', 'in stock', 'available'].includes(s)) out[f.name] = true;
        else if (['false', 'no', 'out of stock', 'unavailable'].includes(s)) out[f.name] = false;
        else out[f.name] = null;
      } else out[f.name] = null;
    } else {
      out[f.name] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }
  return out;
}
