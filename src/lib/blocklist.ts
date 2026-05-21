const BLOCKED_PATTERNS: RegExp[] = [
  /(^|\.)paypal\.com$/i,
  /(^|\.)stripe\.com$/i,
  /(^|\.)square\.com$/i,
  /(^|\.)squareup\.com$/i,
  /(^|\.)(chase|wellsfargo|bankofamerica|citi|hsbc|barclays|capitalone|usbank)\.com$/i,
  /(^|\.)bank(ing)?\.[a-z]+$/i,
  /\.gov$/i,
  /\.mil$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)fb\.com$/i,
  /(^|\.)instagram\.com$/i,
  /(^|\.)linkedin\.com$/i,
  /(^|\.)twitter\.com$/i,
  /(^|\.)x\.com$/i,
  /(^|\.)tiktok\.com$/i,
  /(^|\.)snapchat\.com$/i,
  /(^|\.)whatsapp\.com$/i,
  /(^|\.)tinder\.com$/i,
  /(^|\.)okcupid\.com$/i,
  /(^|\.)pornhub\.com$/i,
];

export function isBlockedDomain(hostname: string): { blocked: true; reason: string } | { blocked: false } {
  const h = hostname.toLowerCase();
  for (const re of BLOCKED_PATTERNS) {
    if (re.test(h)) {
      return { blocked: true, reason: `Domain ${h} is on the blocklist (financial, social, government, or login-walled).` };
    }
  }
  return { blocked: false };
}
