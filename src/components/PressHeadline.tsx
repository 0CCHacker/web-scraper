'use client';

import { useEffect, useState } from 'react';

const WORDS: { text: string; highlight?: boolean; italic?: boolean }[] = [
  { text: 'AI' },
  { text: 'tools' },
  { text: 'that' },
  { text: 'ship' },
  { text: 'clean', highlight: true },
  { text: 'data', highlight: true },
  { text: 'to' },
  { text: 'your' },
  { text: 'business.', italic: true },
];

export default function PressHeadline() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <h1 className="font-display text-[clamp(2.4rem,8.4vw,7.6rem)] leading-[0.96] tracking-tight text-ink">
      {WORDS.map((w, i) => (
        <span
          key={i}
          className="press-line"
          style={{ marginRight: w.text.endsWith('.') ? 0 : '0.22em' }}
        >
          <span
            style={{
              animationDelay: `${120 + i * 95}ms`,
              fontStyle: w.italic ? 'italic' : 'normal',
              fontVariationSettings: w.highlight
                ? '"opsz" 144, "SOFT" 100, "WONK" 0'
                : w.italic
                ? '"opsz" 144, "SOFT" 60, "WONK" 0'
                : '"opsz" 144, "SOFT" 30, "WONK" 0',
            }}
            className={w.highlight ? `saffron-underline ${armed ? 'in' : ''}` : ''}
          >
            {w.text}
          </span>
        </span>
      ))}
    </h1>
  );
}
