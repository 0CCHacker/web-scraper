import { describe, it, expect } from 'vitest';
import { ssrfGuard, isPrivateOrReservedIp } from '../ssrf';

describe('isPrivateOrReservedIp', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '10.255.255.255',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    '224.0.0.1',
    '::1',
    '::',
    'fc00::1',
    'fd00::1',
    'fe80::1',
    'ff00::1',
  ])('rejects %s as private/reserved', (ip) => {
    expect(isPrivateOrReservedIp(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700:4700::1111'])(
    'accepts %s as public',
    (ip) => {
      expect(isPrivateOrReservedIp(ip)).toBe(false);
    }
  );
});

describe('ssrfGuard', () => {
  it('rejects file:// scheme', async () => {
    const r = await ssrfGuard('file:///etc/passwd');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_SCHEME');
  });

  it('rejects gopher:// scheme', async () => {
    const r = await ssrfGuard('gopher://example.com/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_SCHEME');
  });

  it('rejects http://localhost', async () => {
    const r = await ssrfGuard('http://localhost');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_HOSTNAME');
  });

  it('rejects http://localhost:6379', async () => {
    const r = await ssrfGuard('http://localhost:6379');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_HOSTNAME');
  });

  it('rejects metadata.google.internal', async () => {
    const r = await ssrfGuard('http://metadata.google.internal/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_HOSTNAME');
  });

  it('rejects http://169.254.169.254 (cloud metadata)', async () => {
    const r = await ssrfGuard('http://169.254.169.254/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_PRIVATE_IP');
  });

  it('rejects http://127.0.0.1', async () => {
    const r = await ssrfGuard('http://127.0.0.1/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_PRIVATE_IP');
  });

  it('rejects http://10.0.0.1', async () => {
    const r = await ssrfGuard('http://10.0.0.1/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_PRIVATE_IP');
  });

  it('rejects http://192.168.1.1', async () => {
    const r = await ssrfGuard('http://192.168.1.1/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_PRIVATE_IP');
  });

  it('rejects http://[::1]', async () => {
    const r = await ssrfGuard('http://[::1]/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_HOSTNAME');
  });

  it('rejects http://[fc00::1]', async () => {
    const r = await ssrfGuard('http://[fc00::1]/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_PRIVATE_IP');
  });

  it('rejects empty hostname', async () => {
    const r = await ssrfGuard('http:///path');
    expect(r.ok).toBe(false);
  });

  it('accepts http://books.toscrape.com', async () => {
    const r = await ssrfGuard('http://books.toscrape.com/');
    expect(r.ok).toBe(true);
  });

  it('accepts https://example.com', async () => {
    const r = await ssrfGuard('https://example.com/');
    expect(r.ok).toBe(true);
  });

  it('rejects subdomain.localhost', async () => {
    const r = await ssrfGuard('http://foo.localhost/');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BLOCKED_HOSTNAME');
  });
});
