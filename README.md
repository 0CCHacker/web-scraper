# AI Web Scraper

Paste a URL, describe the fields in plain English, get structured data back as a table + CSV + JSON.

> Portfolio Project 2 — see `/how-it-works` once running for the architectural deep dive.

## Demo

![demo gif goes here](docs/demo.gif)

Try the live form at `/` or the architecture writeup at `/how-it-works`.

Best demo targets (sandbox sites built for scraping practice):

- `http://books.toscrape.com/catalogue/page-1.html` — schema: `title, price, availability, rating`
- `http://quotes.toscrape.com/` — schema: `quote text, author, tags`

## Stack

- Next.js 14 (App Router, TypeScript, Tailwind) on **Vercel Pro** (the route uses `maxDuration = 60` — hobby's 10s cap will 504).
- Vertex AI **Gemini 2.5 Flash** with `responseMimeType: 'application/json'` and a hand-built OpenAPI-subset `responseSchema`.
- `cheerio` for HTML cleanup (Readability deliberately not used — it strips listing grids).
- Upstash Redis for rate limit + robots.txt cache + NL→schema cache.
- `robots-parser` for robots.txt enforcement.
- Native Node `dns` + `net` for SSRF guard.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# fill in GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS_JSON, and (optionally) Upstash creds
pnpm dev
```

Without Upstash, rate limiting and caches become no-ops (a console warning prints once); the scraper still works.

## Tests

```bash
pnpm test                                           # vitest (SSRF guard, schema, csv)
pnpm tsx scripts/test-clean.ts <url>                # verify cheerio cleanup preserves grid selectors
```

## Why no Playwright in the demo?

Most public pages are server-rendered — `fetch` covers them. Standing up a headless browser tier (Cloud Run + a 1GB Chromium image) for the SPA minority would add a separate deploy, cold starts, and ops surface that the demo doesn't need.

Instead, the scraper detects when a page is SPA-shaped and returns an explicit `SPA_DETECTED` error pointing to the full-build fallback (Playwright on Cloud Run, scale-to-zero). The `/how-it-works` page documents both tiers.

## Pipeline at a glance

```
URL + NL schema
  → rate limit (Upstash)
  → SSRF guard (scheme + DNS + private-IP + redirect re-check)
  → domain blocklist
  → robots.txt (cached 24h)
  → fetch (8s timeout, 2MB cap, manual redirect)
  → SPA detect
  → cheerio clean (strip script/style/nav/footer, keep grids)
  → NL → field list (regex fast-path, LLM slow-path, cached 7d)
  → build Gemini responseSchema (always array, nullable)
  → Gemini 2.5 Flash extract
  → coerce + validate (zod)
  → CSV + JSON + table
```

## Security stance

- **SSRF guard runs before every network call.** Scheme allowlist, literal-hostname block, full DNS resolve with private/loopback/link-local rejection (catches `169.254.169.254` cloud metadata). Redirects are followed manually so each hop is re-validated.
- **DNS rebinding is not mitigated** in this demo (validate-then-fetch has a TOCTOU window). The full client build uses a pinned-IP `undici.Agent`. Calling that out explicitly because flagging the gap is part of taking security seriously.
- `robots.txt` enforced. Banking, government, social, and adult domains blocklisted.

## Known limits

- Pages over ~50,000 cleaned characters are truncated from the end — long listing pages may lose tail rows. Pagination is future work.
- SPA detection is a heuristic (empty body + `#root`/`#__next`/`#app`). False negatives possible for SPAs that render a loading skeleton.
