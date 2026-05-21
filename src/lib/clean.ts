import * as cheerio from 'cheerio';

export const MAX_CLEANED_CHARS = 50_000;

const STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'svg',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'nav',
  'footer',
  'header',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[aria-hidden="true"]',
];

export function cleanHtml(html: string): { cleaned: string; truncated: boolean } {
  const $ = cheerio.load(html);
  for (const sel of STRIP_SELECTORS) {
    $(sel).remove();
  }
  $('*').each((_, el) => {
    const attribs = (el as unknown as { attribs?: Record<string, string> }).attribs;
    if (!attribs) return;
    for (const name of Object.keys(attribs)) {
      if (name.startsWith('on')) delete attribs[name];
      if (name === 'style') delete attribs[name];
    }
  });

  const body = $('body').html() ?? $.root().html() ?? '';
  const collapsed = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (collapsed.length <= MAX_CLEANED_CHARS) {
    return { cleaned: collapsed, truncated: false };
  }
  return { cleaned: collapsed.slice(0, MAX_CLEANED_CHARS), truncated: true };
}

export function htmlBytes(html: string): number {
  return Buffer.byteLength(html, 'utf8');
}
