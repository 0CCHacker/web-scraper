import { safeFetch } from '../src/lib/fetch';
import { cleanHtml, htmlBytes } from '../src/lib/clean';
import { looksLikeSpa } from '../src/lib/spa-detect';

const url = process.argv[2];
if (!url) {
  console.error('usage: tsx scripts/test-clean.ts <url>');
  process.exit(1);
}

async function main() {
  const fetched = await safeFetch(url);
  if (!fetched.ok) {
    console.error(`fetch failed: ${fetched.code} ${fetched.message}`);
    process.exit(1);
  }
  const rawBytes = htmlBytes(fetched.body);
  const spa = looksLikeSpa(fetched.body);
  const { cleaned, truncated } = cleanHtml(fetched.body);
  const cleanedBytes = Buffer.byteLength(cleaned, 'utf8');
  const reduction = Math.round(((rawBytes - cleanedBytes) / rawBytes) * 100);

  console.log(`URL: ${fetched.finalUrl}`);
  console.log(`Raw HTML: ${rawBytes} bytes`);
  console.log(`Cleaned : ${cleanedBytes} bytes (-${reduction}%)`);
  console.log(`Truncated: ${truncated}`);
  console.log(`SPA-shaped: ${spa}`);
  console.log('Contains <script>?', cleaned.includes('<script'));
  console.log('Contains class="product_pod"?', cleaned.includes('product_pod'));
  console.log('Contains class="quote"?', cleaned.includes('class="quote"'));
  console.log('--- preview (first 800 chars) ---');
  console.log(cleaned.slice(0, 800));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
