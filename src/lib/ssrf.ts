import { promises as dns } from 'node:dns';
import { isIP, isIPv4, isIPv6 } from 'node:net';

export type SsrfReject = {
  ok: false;
  code: 'BLOCKED_SCHEME' | 'BLOCKED_HOSTNAME' | 'BLOCKED_PRIVATE_IP' | 'DNS_FAIL';
  message: string;
};

export type SsrfAccept = {
  ok: true;
  url: URL;
  resolvedIps: string[];
};

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

const LITERAL_BLOCKED_HOSTS = new Set([
  'localhost',
  'ip6-localhost',
  'ip6-loopback',
  '0.0.0.0',
  '::',
  '::1',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
]);

export function isPrivateOrReservedIp(ip: string): boolean {
  if (isIPv4(ip)) return isPrivateOrReservedIpv4(ip);
  if (isIPv6(ip)) return isPrivateOrReservedIpv6(ip);
  return true;
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  if (a >= 224) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('fe80:') || lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('ff')) return true;
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.slice('::ffff:'.length);
    if (isIPv4(v4)) return isPrivateOrReservedIpv4(v4);
  }
  if (lower.startsWith('2002:')) {
    return true;
  }
  return false;
}

export async function ssrfGuard(rawUrl: string): Promise<SsrfAccept | SsrfReject> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, code: 'BLOCKED_SCHEME', message: 'Invalid URL.' };
  }

  if (!ALLOWED_SCHEMES.has(url.protocol)) {
    return {
      ok: false,
      code: 'BLOCKED_SCHEME',
      message: `Scheme ${url.protocol} not allowed. Use http or https.`,
    };
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!hostname) {
    return { ok: false, code: 'BLOCKED_HOSTNAME', message: 'Missing hostname.' };
  }
  if (LITERAL_BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return { ok: false, code: 'BLOCKED_HOSTNAME', message: `Hostname ${hostname} is not allowed.` };
  }

  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return {
        ok: false,
        code: 'BLOCKED_PRIVATE_IP',
        message: `Direct IP ${hostname} is in a private/reserved range.`,
      };
    }
    return { ok: true, url, resolvedIps: [hostname] };
  }

  let records: { address: string; family: number }[];
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    return { ok: false, code: 'DNS_FAIL', message: `Could not resolve ${hostname}.` };
  }

  if (records.length === 0) {
    return { ok: false, code: 'DNS_FAIL', message: `No DNS records for ${hostname}.` };
  }

  for (const r of records) {
    if (isPrivateOrReservedIp(r.address)) {
      return {
        ok: false,
        code: 'BLOCKED_PRIVATE_IP',
        message: `${hostname} resolves to ${r.address}, which is in a private/reserved range.`,
      };
    }
  }

  return { ok: true, url, resolvedIps: records.map((r) => r.address) };
}
