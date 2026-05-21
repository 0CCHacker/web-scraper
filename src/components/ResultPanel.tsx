'use client';

import { useMemo, useState } from 'react';
import type { ScrapeSuccess } from '@/lib/types';
import { recordsToCsv } from '@/lib/csv';

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function fmtCell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default function ResultPanel({ result }: { result: ScrapeSuccess }) {
  const [copied, setCopied] = useState(false);

  const csv = useMemo(() => recordsToCsv(result.data, result.fields), [result]);
  const json = useMemo(() => JSON.stringify(result.data, null, 2), [result]);
  const reductionPct = result.meta.htmlBytes
    ? Math.round(((result.meta.htmlBytes - result.meta.cleanedBytes) / result.meta.htmlBytes) * 100)
    : 0;

  function download(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  }

  async function copy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="relative">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl sm:text-5xl leading-none">Result</h2>
        <span className="folio">{String(result.data.length).padStart(3, '0')} records</span>
      </div>

      <div className="rule-thick mb-0" />
      <div className="mb-6 mt-[2px] rule-hair" />

      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-soft">
          <Stat label="records" value={String(result.data.length)} />
          <Stat label="time" value={`${result.meta.durationMs}ms`} />
          <Stat label="raw" value={fmtBytes(result.meta.htmlBytes)} />
          <Stat label="cleaned" value={`${fmtBytes(result.meta.cleanedBytes)} (-${reductionPct}%)`} />
          <Stat
            label="schema"
            value={
              result.meta.schemaCacheHit ? 'cache' : result.meta.schemaUsedLlm ? 'llm' : 'regex'
            }
          />
          {result.meta.truncated && <Stat label="truncated" value="yes" warn />}
        </div>
        <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em]">
          <button
            onClick={() => download(csv, 'scrape.csv', 'text/csv')}
            className="border border-ink px-3 py-1.5 transition hover:bg-ink hover:text-bone"
          >
            csv ↓
          </button>
          <button
            onClick={() => download(json, 'scrape.json', 'application/json')}
            className="border border-ink px-3 py-1.5 transition hover:bg-ink hover:text-bone"
          >
            json ↓
          </button>
          <button
            onClick={copy}
            className="border-2 border-ink bg-ink px-3 py-1.5 text-bone transition hover:bg-saffron hover:text-ink hover:border-saffron"
          >
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden border-2 border-ink ink-shadow-sm bg-bone">
        <div className="max-h-[68vh] overflow-auto">
          {result.data.length === 0 ? (
            <div className="p-10 text-center">
              <p className="folio text-ink-soft">no records returned</p>
              <p className="mt-3 font-serif italic text-ink-quiet">
                the page matched no rows for that schema.
              </p>
            </div>
          ) : (
            <table className="press-table">
              <thead>
                <tr>
                  <th className="w-12 text-right">№</th>
                  {result.fields.map((f) => (
                    <th key={f.name}>
                      <div className="flex flex-col">
                        <span className="text-ink">{f.name}</span>
                        <span className="text-[0.58rem] font-normal lowercase tracking-[0.18em] text-ink-quiet">
                          {f.type} · nullable
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.map((row, i) => (
                  <tr key={i}>
                    <td className="num text-right">{String(i + 1).padStart(2, '0')}</td>
                    {result.fields.map((f) => {
                      const v = row[f.name];
                      return (
                        <td key={f.name} className={v == null ? 'text-rule italic' : ''}>
                          {fmtCell(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="mt-3 colophon">
        validated against {result.fields.length} field
        {result.fields.length === 1 ? '' : 's'} · {result.meta.finalUrl}
      </p>
    </article>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-ink-quiet">{label}</span>
      <span className={warn ? 'text-crimson' : 'text-ink'}>{value}</span>
    </span>
  );
}
