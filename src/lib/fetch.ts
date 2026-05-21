import { ssrfGuard } from './ssrf';

export const FETCH_TIMEOUT_MS = 8000;
export const MAX_BODY_BYTES = 2 * 1024 * 1024;
export const MAX_REDIRECTS = 3;
export const USER_AGENT = 'AI-Scraper-Demo/1.0 (+https://github.com/)';

export type FetchOk = {
  ok: true;
  finalUrl: string;
  status: number;
  contentType: string;
  bytes: number;
  body: string;
};

export type FetchFail = {
  ok: false;
  code:
    | 'BLOCKED_SCHEME'
    | 'BLOCKED_HOSTNAME'
    | 'BLOCKED_PRIVATE_IP'
    | 'DNS_FAIL'
    | 'TIMEOUT'
    | 'TOO_LARGE'
    | 'TOO_MANY_REDIRECTS'
    | 'HTTP_ERROR'
    | 'FETCH_FAIL';
  message: string;
  status?: number;
};

export async function safeFetch(rawUrl: string): Promise<FetchOk | FetchFail> {
  let currentUrl = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const guard = await ssrfGuard(currentUrl);
    if (!guard.ok) {
      return { ok: false, code: guard.code, message: guard.message };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(guard.url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : 'fetch failed';
      if (msg.includes('aborted') || msg.includes('AbortError')) {
        return { ok: false, code: 'TIMEOUT', message: `Request exceeded ${FETCH_TIMEOUT_MS}ms.` };
      }
      return { ok: false, code: 'FETCH_FAIL', message: msg };
    }

    if (response.status >= 300 && response.status < 400) {
      clearTimeout(timer);
      const loc = response.headers.get('location');
      if (!loc) {
        return { ok: false, code: 'HTTP_ERROR', message: 'Redirect without Location header.', status: response.status };
      }
      try {
        currentUrl = new URL(loc, guard.url).toString();
      } catch {
        return { ok: false, code: 'HTTP_ERROR', message: `Invalid redirect target: ${loc}.`, status: response.status };
      }
      continue;
    }

    if (!response.ok) {
      clearTimeout(timer);
      return {
        ok: false,
        code: 'HTTP_ERROR',
        message: `Origin returned HTTP ${response.status}.`,
        status: response.status,
      };
    }

    const contentType = response.headers.get('content-type') ?? 'text/html';
    const body = await readBodyCapped(response, controller, timer);
    if (!body.ok) return body;

    return {
      ok: true,
      finalUrl: guard.url.toString(),
      status: response.status,
      contentType,
      bytes: body.bytes,
      body: body.text,
    };
  }
  return { ok: false, code: 'TOO_MANY_REDIRECTS', message: `Exceeded ${MAX_REDIRECTS} redirects.` };
}

async function readBodyCapped(
  response: Response,
  controller: AbortController,
  timer: NodeJS.Timeout
): Promise<{ ok: true; text: string; bytes: number } | FetchFail> {
  const reader = response.body?.getReader();
  if (!reader) {
    clearTimeout(timer);
    return { ok: false, code: 'FETCH_FAIL', message: 'No response body.' };
  }
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let total = 0;
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        controller.abort();
        clearTimeout(timer);
        return {
          ok: false,
          code: 'TOO_LARGE',
          message: `Response body exceeded ${MAX_BODY_BYTES} bytes.`,
        };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : 'stream failed';
    if (msg.includes('aborted') || msg.includes('AbortError')) {
      return { ok: false, code: 'TIMEOUT', message: `Body read exceeded ${FETCH_TIMEOUT_MS}ms.` };
    }
    return { ok: false, code: 'FETCH_FAIL', message: msg };
  }
  clearTimeout(timer);
  return { ok: true, text, bytes: total };
}
