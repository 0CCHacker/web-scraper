import * as cheerio from 'cheerio';

const SPA_ROOT_PATTERNS = ['#root', '#__next', '#app', '#nuxt', '#svelte', '[data-reactroot]'];

export function looksLikeSpa(html: string): boolean {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const bodyText = ($('body').text() ?? '').trim();
  if (bodyText.length >= 200) return false;

  for (const sel of SPA_ROOT_PATTERNS) {
    if ($(sel).length > 0) return true;
  }
  return false;
}
