import type { Field } from './schema';

export type GeminiSchema = {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer';
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: string[];
  nullable?: boolean;
  description?: string;
  enum?: string[];
};

export function buildExtractionResponseSchema(fields: Field[]): GeminiSchema {
  const properties: Record<string, GeminiSchema> = {};
  for (const f of fields) {
    properties[f.name] = {
      type: f.type === 'boolean' ? 'boolean' : f.type === 'number' ? 'number' : 'string',
      nullable: true,
      ...(f.description ? { description: f.description } : {}),
    };
  }

  return {
    type: 'object',
    properties: {
      records: {
        type: 'array',
        description:
          'All matching records on the page. Use a single-element array if the page has only one record.',
        items: {
          type: 'object',
          properties,
          required: fields.map((f) => f.name),
        },
      },
    },
    required: ['records'],
  };
}

export function sanitizeForGemini(schema: unknown): GeminiSchema {
  if (!schema || typeof schema !== 'object') {
    throw new Error('sanitizeForGemini: input must be an object');
  }
  return walk(schema as Record<string, unknown>);
}

function walk(input: Record<string, unknown>): GeminiSchema {
  const out: GeminiSchema = { type: 'string' };

  const rawType = input.type;
  if (Array.isArray(rawType)) {
    const nonNull = rawType.filter((t) => t !== 'null');
    if (rawType.includes('null')) out.nullable = true;
    out.type = (nonNull[0] as GeminiSchema['type']) ?? 'string';
  } else if (typeof rawType === 'string') {
    out.type = rawType as GeminiSchema['type'];
  }

  if (input.nullable === true) out.nullable = true;

  if (typeof input.description === 'string') out.description = input.description;
  if (Array.isArray(input.enum)) out.enum = input.enum.filter((v) => typeof v === 'string') as string[];
  if (Array.isArray(input.required)) out.required = input.required.filter((v) => typeof v === 'string') as string[];

  if (input.properties && typeof input.properties === 'object') {
    out.properties = {};
    for (const [k, v] of Object.entries(input.properties as Record<string, unknown>)) {
      if (v && typeof v === 'object') {
        out.properties[k] = walk(v as Record<string, unknown>);
      }
    }
  }

  if (input.items && typeof input.items === 'object') {
    out.items = walk(input.items as Record<string, unknown>);
  }

  return out;
}
