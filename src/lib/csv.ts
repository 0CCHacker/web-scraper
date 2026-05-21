import Papa from 'papaparse';
import type { Field } from './schema';

type Cell = string | number | boolean | null;

export function flattenForCsv(value: unknown): Cell {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value
      .map((v) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)))
      .join('; ');
  }
  return JSON.stringify(value);
}

export function recordsToCsv(records: Record<string, unknown>[], fields: Field[]): string {
  const headers = fields.map((f) => f.name);
  const rows = records.map((rec) => {
    const flat: Record<string, Cell> = {};
    for (const h of headers) flat[h] = flattenForCsv(rec[h]);
    return flat;
  });
  return Papa.unparse({ fields: headers, data: rows }, { quotes: true });
}
