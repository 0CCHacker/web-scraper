import FolioBar from '@/components/FolioBar';
import PressHeadline from '@/components/PressHeadline';
import ScrapeForm from '@/components/ScrapeForm';

const PIPELINE = [
  { n: '01', label: 'Rate limit', note: '10 / ip / day' },
  { n: '02', label: 'SSRF guard', note: 'scheme · dns · private ip' },
  { n: '03', label: 'Blocklist', note: 'banking / gov / social' },
  { n: '04', label: 'Robots.txt', note: 'cached 24h' },
  { n: '05', label: 'Fetch', note: '8s · 2 MB · manual redirect' },
  { n: '06', label: 'SPA detect', note: 'graceful fallback' },
  { n: '07', label: 'Cheerio clean', note: 'keep grids · strip chrome' },
  { n: '08', label: 'NL → schema', note: 'regex · llm · cached 7d' },
  { n: '09', label: 'Gemini extract', note: '2.5 flash · array · nullable' },
  { n: '10', label: 'Validate', note: 'zod · coerce · return' },
];

const USE_CASES = [
  {
    title: 'Competitor price & inventory monitoring',
    body: 'Daily scrapes of a competitor catalog, diffed over time, with alerts on price moves or stock-outs. Output is a typed JSON feed or a CSV you can drop into BI.',
    fit: 'Best for: e-commerce, marketplaces, hospitality, anywhere price-moves matter.',
  },
  {
    title: 'Lead enrichment from public sources',
    body: 'Turn a list of company URLs into a structured row per company — about-page summary, public contact, tech stack hints, employee count from public sources.',
    fit: 'Best for: sales/BD teams who buy lists and want them deduped, enriched, and ready for outreach.',
  },
  {
    title: 'Structured-data pipelines for AI agents',
    body: 'Wrap any public source as a typed endpoint your agent can call. Schema-validated, rate-limited, robots-respecting, with the audit trail your compliance team will ask for.',
    fit: 'Best for: teams building RAG / agent systems that need clean, reliable, non-PII web data.',
  },
];

const PRINCIPLES = [
  {
    label: 'Security-first',
    body: 'Every URL passes an SSRF guard before a packet leaves the process — cloud-metadata addresses, private ranges, non-HTTP schemes all rejected. robots.txt enforced, not just consulted.',
  },
  {
    label: 'Honest about gaps',
    body: 'I tell you what the build does and does not cover. The how-it-works page calls out the DNS-rebinding gap on this demo and what the full client build adds — no hidden surprises.',
  },
  {
    label: 'Production discipline',
    body: 'Typecheck, tests, structured errors, cost ceilings, redacted logs. The demo is deployed the same way I would deploy your build — no shortcuts that the "real" version would clean up later.',
  },
  {
    label: 'Senior judgement',
    body: 'I push back early when a design will fail in three months. Most of the value I bring is not the code I write but the code I talk you out of writing.',
  },
];

export default function Home() {
  return (
    <>
      <FolioBar here="index" />

      <main className="mx-auto max-w-[1400px] px-6 sm:px-10">
        {/* Hero */}
        <section className="grid grid-cols-12 gap-y-10 pt-14 sm:pt-20">
          <div className="col-span-12 mb-6 flex items-end justify-between">
            <span className="press-eyebrow">
              Freelance · AI &amp; data tooling · open to commissions
            </span>
            <span className="press-eyebrow hidden text-ink-quiet sm:inline">
              based in Vietnam · works worldwide
            </span>
          </div>

          <div className="col-span-12 lg:col-span-10">
            <PressHeadline />
          </div>

          <div className="col-span-12 mt-2 lg:col-span-9 lg:col-start-3">
            <div className="press-rule h-[3px] w-full bg-ink" style={{ animationDelay: '900ms' }} />
            <p className="press-deck mt-6 max-w-2xl font-serif italic text-xl leading-relaxed text-ink-soft sm:text-2xl" style={{ fontVariationSettings: '"opsz" 22' }}>
              I&rsquo;m Tai. I build production AI tools — data pipelines,
              scrapers, and agent infrastructure — for businesses that need
              the open web to behave like a typed API. The page below is
              one of them. It&rsquo;s live, not a screenshot.
            </p>
            <div className="press-deck mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#demo"
                className="press-button"
                style={{ background: 'var(--bone)', color: 'var(--ink)', boxShadow: '5px 5px 0 var(--ink)' }}
              >
                Try the demo
                <span aria-hidden>↓</span>
              </a>
              <a
                href="mailto:huynhchitai.070306@gmail.com?subject=Freelance%20enquiry%20—%20AI%20tooling"
                className="press-button"
              >
                Hire me
                <span aria-hidden>→</span>
              </a>
              <span className="ml-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-quiet">
                replies within 24h
              </span>
            </div>
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="mt-24 grid grid-cols-12 gap-x-10 gap-y-12 sm:mt-32">
          <header className="col-span-12">
            <div className="rule-thick" />
            <div className="mt-[2px] rule-hair mb-6" />
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
              <h2 className="font-display text-4xl leading-none sm:text-6xl">
                The demo, live.
              </h2>
              <span className="folio text-ink-quiet">
                deployed on vercel · gemini 2.5 flash · ~$0.0008 / scrape
              </span>
            </div>
            <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft">
              Paste any public URL and describe the fields in plain English.
              Get a typed table, CSV, and JSON in seconds. Try one of the
              pre-loaded specimens or your own page.
            </p>
          </header>

          <div className="col-span-12 lg:col-span-8">
            <ScrapeForm />
          </div>

          <aside className="col-span-12 lg:col-span-4">
            <div className="sticky top-10 border-2 border-ink bg-bone p-6">
              <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                <span className="folio">Under the hood</span>
                <a
                  href="/how-it-works"
                  className="folio text-ink-soft hover:text-ink underline-offset-4 hover:underline"
                >
                  detail →
                </a>
              </div>
              <ol className="mt-4 flex flex-col gap-2.5">
                {PIPELINE.map((p) => (
                  <li
                    key={p.n}
                    className="grid grid-cols-[2.4rem_auto_1fr] items-baseline gap-3"
                  >
                    <span className="font-mono text-[0.72rem] tracking-[0.15em] text-saffron-deep">
                      {p.n}
                    </span>
                    <span className="font-serif text-base text-ink">{p.label}</span>
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-quiet text-right">
                      {p.note}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 border-t border-rule pt-4 font-serif text-sm leading-snug text-ink-soft">
                Ten steps between you pasting a URL and seeing a typed
                table. The non-obvious ones are SSRF, the Gemini schema
                sanitizer, and the schema cache — all explained in the{' '}
                <a href="/how-it-works" className="underline-offset-4 hover:underline">
                  full pipeline
                </a>
                .
              </p>
            </div>
          </aside>
        </section>

        {/* What I build */}
        <section id="services" className="mt-28 grid grid-cols-12 gap-x-10 gap-y-10 border-t-2 border-ink pt-10">
          <div className="col-span-12 lg:col-span-4">
            <span className="press-eyebrow">What I build for clients</span>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Three shapes of work.
            </h2>
            <p className="mt-4 max-w-md font-serif text-base leading-relaxed text-ink-soft">
              These are the patterns I&rsquo;ve shipped most recently. Your
              project probably looks like one of these or a hybrid — drop
              me a line and we can scope it.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {USE_CASES.map((c, i) => (
              <article key={c.title} className="border-2 border-ink bg-bone p-6 sm:p-7" style={{ boxShadow: '5px 5px 0 var(--ink)' }}>
                <div className="flex items-baseline gap-4">
                  <span className="folio text-saffron-deep">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="font-display text-2xl leading-tight sm:text-3xl">{c.title}</h3>
                </div>
                <p className="mt-4 font-serif text-lg leading-relaxed text-ink-soft">
                  {c.body}
                </p>
                <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-quiet">
                  <span className="text-ink">¶</span> {c.fit}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* How I work / trust */}
        <section className="mt-28 grid grid-cols-12 gap-x-10 gap-y-10 border-t-2 border-ink pt-10">
          <div className="col-span-12 lg:col-span-4">
            <span className="press-eyebrow">How I work</span>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              No tricks. No black hats.
            </h2>
          </div>

          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.label} className="border-l-2 border-saffron pl-5">
                <h3 className="font-display text-xl leading-tight text-ink">{p.label}</h3>
                <p className="mt-2 font-serif text-base leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mt-28 mb-24 grid grid-cols-12 gap-x-10 gap-y-10 border-t-2 border-ink pt-10">
          <div className="col-span-12 lg:col-span-4">
            <span className="press-eyebrow">Contact</span>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Want one of these for your business?
            </h2>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <p className="font-serif text-xl leading-relaxed text-ink-soft">
              The fastest path is an email with: <strong className="font-display text-ink">what you&rsquo;re trying to extract</strong>, <strong className="font-display text-ink">from where</strong>, and <strong className="font-display text-ink">how often</strong>. I&rsquo;ll come back within 24 hours with a scope and a price — or a clear &ldquo;no, here&rsquo;s why&rdquo; if it&rsquo;s outside my wheelhouse.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href="mailto:huynhchitai.070306@gmail.com?subject=Freelance%20enquiry%20—%20AI%20tooling"
                className="group flex items-center justify-between border-2 border-ink bg-ink px-5 py-4 text-bone transition hover:bg-saffron hover:border-saffron hover:text-ink"
                style={{ boxShadow: '5px 5px 0 var(--saffron)' }}
              >
                <span className="flex flex-col">
                  <span className="folio text-bone-deep group-hover:text-ink-soft">email</span>
                  <span className="mt-1 font-mono text-sm tracking-tight">huynhchitai.070306@gmail.com</span>
                </span>
                <span aria-hidden className="text-2xl">→</span>
              </a>
              <a
                href="https://huynhchitai.com"
                className="group flex items-center justify-between border-2 border-ink bg-bone px-5 py-4 text-ink transition hover:bg-ink hover:text-bone"
              >
                <span className="flex flex-col">
                  <span className="folio">personal site</span>
                  <span className="mt-1 font-mono text-sm tracking-tight">huynhchitai.com</span>
                </span>
                <span aria-hidden className="text-2xl">↗</span>
              </a>
              <a
                href="https://github.com/0CCHacker"
                className="group flex items-center justify-between border-2 border-ink bg-bone px-5 py-4 text-ink transition hover:bg-ink hover:text-bone"
              >
                <span className="flex flex-col">
                  <span className="folio">github</span>
                  <span className="mt-1 font-mono text-sm tracking-tight">github.com/0CCHacker</span>
                </span>
                <span aria-hidden className="text-2xl">↗</span>
              </a>
              <a
                href="/how-it-works"
                className="group flex items-center justify-between border-2 border-ink bg-bone px-5 py-4 text-ink transition hover:bg-ink hover:text-bone"
              >
                <span className="flex flex-col">
                  <span className="folio">engineering notes</span>
                  <span className="mt-1 font-mono text-sm tracking-tight">how this demo works</span>
                </span>
                <span aria-hidden className="text-2xl">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center sm:px-10">
          <p className="colophon">Tai Huynh · 2026 · built in next.js, vertex AI &amp; cheerio</p>
          <p className="colophon text-ink-quiet">
            <a href="https://huynhchitai.com" className="hover:text-ink">huynhchitai.com</a>
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
