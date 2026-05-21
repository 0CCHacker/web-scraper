import { looksLikeSpa } from '../src/lib/spa-detect';

const cases: { name: string; html: string; expected: boolean }[] = [
  {
    name: 'empty SPA root',
    html: '<html><body><div id="root"></div></body></html>',
    expected: true,
  },
  {
    name: 'empty Next.js root',
    html: '<html><body><div id="__next"></div></body></html>',
    expected: true,
  },
  {
    name: 'SSR content with React root marker',
    html: '<html><body><div id="root"><h1>Welcome</h1>' + 'real server-rendered content '.repeat(20) + '</div></body></html>',
    expected: false,
  },
  {
    name: 'plain HTML article',
    html: '<html><body><article>' + 'A real article body '.repeat(40) + '</article></body></html>',
    expected: false,
  },
];

let failed = 0;
for (const c of cases) {
  const got = looksLikeSpa(c.html);
  const ok = got === c.expected;
  console.log(`${ok ? '✓' : '✗'} ${c.name}: got ${got}, expected ${c.expected}`);
  if (!ok) failed++;
}
if (failed > 0) process.exit(1);
