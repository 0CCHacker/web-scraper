import Link from 'next/link';
import FolioBar from '@/components/FolioBar';

export const metadata = {
  title: 'How it works — Tai Huynh · AI Web Scraper',
};

const STEPS: { n: string; title: string; body: React.ReactNode }[] = [
  {
    n: '01',
    title: 'Rate limit',
    body: 'Upstash sliding window — 10 requests per IP per day. Cheap, stateless, no auth.',
  },
  {
    n: '02',
    title: 'SSRF guard',
    body: (
      <>
        Scheme allowlist (<code className="font-mono text-sm">http</code> /{' '}
        <code className="font-mono text-sm">https</code>); literal block on{' '}
        <code className="font-mono text-sm">localhost</code> /{' '}
        <code className="font-mono text-sm">metadata.google.internal</code>; DNS resolve every host
        and reject any private / loopback / link-local IP — including{' '}
        <code className="font-mono text-sm">169.254.169.254</code> (cloud metadata). Re-checked on
        every redirect.
      </>
    ),
  },
  {
    n: '03',
    title: 'Domain blocklist',
    body: 'Banking, government, social-login, and adult domains rejected up front. Defensive default.',
  },
  {
    n: '04',
    title: 'Robots.txt',
    body: 'Fetched (through the same SSRF guard) and cached 24h. Disallow → 403, no exceptions.',
  },
  {
    n: '05',
    title: 'Fetch HTML',
    body: '8s timeout, 2 MB body cap, manual redirect (max 3 hops, SSRF re-checked each hop), custom User-Agent.',
  },
  {
    n: '06',
    title: 'SPA detect',
    body: (
      <>
        Heuristic — empty body + presence of{' '}
        <code className="font-mono text-sm">#root</code>,{' '}
        <code className="font-mono text-sm">#__next</code>, or{' '}
        <code className="font-mono text-sm">#app</code> → graceful error pointing to the
        headless-browser fallback (Playwright on Cloud Run, in the full client build).
      </>
    ),
  },
  {
    n: '07',
    title: 'Clean HTML',
    body: 'Cheerio strips script, style, nav, footer, header, aside, inline event handlers, and inline styles. Listing grids stay intact — Readability is deliberately not used because it would strip them.',
  },
  {
    n: '08',
    title: 'NL → field list',
    body: 'Fast path: comma-separated names parsed by regex, no LLM. Slow path: a short Gemini call. Hashed and cached in Upstash for 7 days — same input never burns tokens twice.',
  },
  {
    n: '09',
    title: 'Build Gemini responseSchema',
    body: (
      <>
        Hand-built OpenAPI subset:{' '}
        <code className="font-mono text-sm">
          {`{ type: 'array', items: { … nullable: true } }`}
        </code>
        . Always an array, even for single-record pages, so the UI never branches on cardinality.
        Gemini rejects full JSON Schema (no <code className="font-mono text-sm">$ref</code> /{' '}
        <code className="font-mono text-sm">anyOf</code>, nullable must be{' '}
        <code className="font-mono text-sm">nullable: true</code>) — sanitized before sending.
      </>
    ),
  },
  {
    n: '10',
    title: 'Extract via Gemini 2.5 Flash',
    body: (
      <>
        Structured-output JSON, temperature 0, 25s timeout. The system prompt forbids
        hallucination: missing field → <code className="font-mono text-sm">null</code>.
      </>
    ),
  },
  {
    n: '11',
    title: 'Validate + return',
    body: 'Type-coerce per field (numbers stripped of currency, booleans normalized), zod-validated as nullable, returned with token + size telemetry for the table footer.',
  },
];

export default function HowItWorks() {
  return (
    <>
      <FolioBar here="how" />

      <main className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <header className="grid grid-cols-12 gap-y-8 pt-14 sm:pt-20">
          <div className="col-span-12 flex items-end justify-between">
            <span className="press-eyebrow">Engineering notes</span>
            <Link href="/" className="press-eyebrow text-ink-soft hover:text-ink">
              ← back to demo
            </Link>
          </div>
          <h1 className="col-span-12 font-display text-[clamp(2.4rem,8vw,6.8rem)] leading-[0.96]">
            How this scraper actually works.
          </h1>
          <p
            className="col-span-12 max-w-3xl font-serif italic text-xl leading-relaxed text-ink-soft lg:col-span-9"
            style={{ fontVariationSettings: '"opsz" 22' }}
          >
            One Vercel deploy, no separate backend. Every scrape runs as a
            Node.js serverless function with a 60-second budget. Below: the
            eleven steps between a URL and a typed table, plus the non-obvious
            engineering decisions and the gaps that are honestly disclosed.
          </p>
        </header>

        <section className="mt-20 grid grid-cols-12 gap-x-10 gap-y-12">
          <div className="col-span-12 lg:col-span-8">
            <div className="rule-thick" />
            <div className="mt-[2px] rule-hair mb-8" />
            <h2 className="font-display text-3xl leading-tight sm:text-5xl">
              The pipeline, step by step.
            </h2>
            <ol className="mt-10 flex flex-col gap-10">
              {STEPS.map((s) => (
                <li key={s.n} className="grid grid-cols-[3.5rem_1fr] gap-x-6 border-b border-rule-soft pb-8">
                  <span className="folio text-saffron-deep">{s.n}</span>
                  <div>
                    <h3 className="font-display text-2xl leading-tight text-ink">{s.title}</h3>
                    <p className="mt-2 font-serif text-base leading-relaxed text-ink-soft">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="col-span-12 lg:col-span-4">
            <div className="sticky top-10 flex flex-col gap-6">
              <Note title="Rendering strategy">
                Demo uses <code className="font-mono text-xs">fetch</code> + HTML parse — enough
                for server-rendered pages, which is most of the public web. For JS-heavy SPAs the
                pipeline falls back to a headless browser (Playwright on Cloud Run, scale-to-zero,
                containerized). The browser tier is kept off the demo to keep deployment a single
                Vercel project and the free tier usable; it&rsquo;s wired in for client builds when
                the target set demands it.
              </Note>
              <Note title="SSRF stance" accent>
                The guard blocks static private / reserved IPs, all non-HTTP schemes, and
                follows redirects manually so each hop is re-validated.
                <br />
                <br />
                <strong className="font-display">What this demo does not (yet) cover:</strong> DNS
                rebinding. Validate-then-fetch has a TOCTOU window — Node&rsquo;s fetch re-resolves
                internally. Full mitigation is a pinned-IP{' '}
                <code className="font-mono text-xs">undici.Agent</code>, in the client build but
                out of the demo. Flagging the gap rather than hiding it.
              </Note>
              <Note title="Cost &amp; limits">
                Gemini 2.5 Flash at temperature 0, max 4k output tokens per scrape — about
                $0.0008 per call. Schema conversion cached 7 days; the fast path skips the LLM
                entirely for comma-separated input. HTML clipped at 50,000 characters before the
                model. GCP budget alert set at <span className="font-mono">$20/mo</span>. Route
                uses <code className="font-mono text-xs">maxDuration = 60</code> — Vercel Pro
                required for production.
              </Note>
              <Note title="Ethics">
                Public pages only. Robots.txt enforced, not just consulted. Banking, government,
                social and adult domains blocklisted. For client engagements: only ever pointed at
                data the client is contractually entitled to scrape.
              </Note>
            </div>
          </aside>
        </section>

        <section className="mt-28 mb-24 grid grid-cols-12 gap-10 border-t-2 border-ink pt-10">
          <div className="col-span-12 lg:col-span-4">
            <span className="press-eyebrow">Next step</span>
            <h3 className="mt-3 font-display text-3xl leading-tight">
              Want this for your business?
            </h3>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <p className="font-serif text-xl leading-relaxed text-ink-soft">
              This demo is a portfolio piece, but the architecture is the
              real client build — minus the headless tier and the pinned-IP
              agent, both wired but off by default. If you have a
              compliance-sane scraping problem and a target list, email me
              with what you&rsquo;re extracting, from where, and how often.
              I&rsquo;ll reply within 24 hours.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="mailto:huynhchitai.070306@gmail.com?subject=Freelance%20enquiry%20—%20AI%20tooling"
                className="press-button"
              >
                Email me
                <span aria-hidden>→</span>
              </a>
              <Link
                href="/"
                className="press-button"
                style={{ background: 'var(--bone)', color: 'var(--ink)', boxShadow: '5px 5px 0 var(--ink)' }}
              >
                ← back to demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center sm:px-10">
          <p className="colophon">Tai Huynh · 2026 · built in next.js, vertex AI &amp; cheerio</p>
          <p className="colophon text-ink-quiet">
            <a href="https://github.com/0CCHacker" className="hover:text-ink">huynhchitai.com</a>
            <span className="mx-2 text-rule">·</span>
            <a href="https://github.com/0CCHacker" className="hover:text-ink">github</a>
            <span className="mx-2 text-rule">·</span>
            <a href="mailto:huynhchitai.070306@gmail.com" className="hover:text-ink">email</a>
          </p>
        </div>
      </footer>
    </>
  );
}

function Note({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border-2 border-ink bg-bone p-5 ${accent ? 'ink-shadow-sm' : ''}`}
      style={accent ? { boxShadow: '4px 4px 0 var(--saffron)' } : undefined}
    >
      <h4 className="folio mb-3 border-b border-ink pb-2 text-ink">{title}</h4>
      <div className="font-serif text-sm leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}
