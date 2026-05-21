'use client';

import { useEffect, useState } from 'react';
import type { ScrapeResponse } from '@/lib/types';
import ResultPanel from './ResultPanel';

const EXAMPLES = [
  {
    label: 'Books grid (e-commerce listing)',
    url: 'http://books.toscrape.com/catalogue/page-1.html',
    schema: 'title, price, availability, rating',
  },
  {
    label: 'Quotes list (text + tags)',
    url: 'http://quotes.toscrape.com/',
    schema: 'quote text, author, tags',
  },
  {
    label: 'SPA probe (shows graceful fallback)',
    url: 'https://twitter.com/',
    schema: 'username, bio',
  },
];

export default function ScrapeForm() {
  const [url, setUrl] = useState('http://books.toscrape.com/catalogue/page-1.html');
  const [schema, setSchema] = useState('title, price, availability, rating');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runAt, setRunAt] = useState<string | null>(null);

  useEffect(() => {
    if (loading) setRunAt(new Date().toISOString().slice(11, 19));
  }, [loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, schema }),
      });
      const json = (await res.json()) as ScrapeResponse;
      setResult(json);
      if (!json.ok) setError(json.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <form
        onSubmit={onSubmit}
        className="relative overflow-hidden border-2 border-ink bg-bone-deep/40 ink-shadow"
      >
        <div className="halftone pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-8 p-7 sm:p-10">
          <div className="flex items-end justify-between gap-6 border-b border-ink pb-4">
            <span className="folio">Live demo</span>
            <span className="folio text-ink-quiet">{runAt ?? '—:—:—'} UTC</span>
          </div>

          <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_1fr] sm:gap-8">
            <label htmlFor="url" className="folio pt-3 text-ink-soft">
              <span className="text-ink">01</span> &nbsp;URL
            </label>
            <input
              id="url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://books.toscrape.com/…"
              className="press-field"
            />
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_1fr] sm:gap-8">
            <label htmlFor="schema" className="folio pt-3 text-ink-soft">
              <span className="text-ink">02</span> &nbsp;What to extract
              <span className="mt-1 block text-[0.62rem] tracking-[0.2em] text-ink-quiet">
                plain english · comma-separated
              </span>
            </label>
            <textarea
              id="schema"
              required
              rows={2}
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder="title, price, availability, rating"
              className="press-field resize-none"
              style={{ lineHeight: 1.6 }}
            />
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_1fr] sm:gap-8">
            <label className="folio pt-1 text-ink-soft">
              <span className="text-ink">¶</span> &nbsp;Examples
            </label>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setUrl(ex.url);
                    setSchema(ex.schema);
                  }}
                  className="press-chip group flex w-full items-baseline gap-3 text-left"
                >
                  <span className="text-ink">{ex.label}</span>
                  <span className="dotted-trail" />
                  <span className="font-normal lowercase tracking-normal text-ink-quiet group-hover:text-ink-soft">
                    {ex.schema}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-2 flex flex-col-reverse items-stretch gap-6 border-t-2 border-ink pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-soft">
              <span className="text-ink">10</span> requests · ip · day &nbsp;·&nbsp; public pages only &nbsp;·&nbsp;
              <a href="/how-it-works" className="underline-offset-4 hover:underline">
                full pipeline →
              </a>
            </p>
            <button type="submit" disabled={loading} className="press-button">
              {loading ? (
                <>
                  <span className="spinner-press" />
                  working…
                </>
              ) : (
                <>
                  Run scrape
                  <span aria-hidden>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {error && !result?.ok && (
        <div className="border-2 border-crimson bg-bone p-6">
          <p className="folio text-crimson">
            Error · {result && !result.ok ? result.error : 'FETCH_FAIL'}
          </p>
          <p className="mt-2 font-serif text-lg leading-snug text-ink">{error}</p>
        </div>
      )}

      {result?.ok && <ResultPanel result={result} />}
    </div>
  );
}
