import Link from 'next/link';

export default function FolioBar({ here }: { here: 'index' | 'how' }) {
  return (
    <div className="border-b-2 border-ink">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <Link href="/" className="folio flex items-baseline gap-3 text-ink">
          <span className="font-display text-base leading-none tracking-tight">Tai Huynh</span>
          <span className="hidden text-ink-quiet sm:inline">/</span>
          <span className="hidden text-ink-soft sm:inline">freelance AI &amp; data tooling</span>
        </Link>

        <nav className="folio flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className={here === 'index' ? 'text-ink' : 'text-ink-soft hover:text-ink'}
          >
            Demo
          </Link>
          <Link
            href="/how-it-works"
            className={here === 'how' ? 'text-ink' : 'text-ink-soft hover:text-ink'}
          >
            How it works
          </Link>
          <a
            href="#contact"
            className="hidden text-ink-soft hover:text-ink sm:inline"
          >
            Contact
          </a>
          <a
            href="mailto:huynhchitai.070306@gmail.com?subject=Freelance%20enquiry"
            className="ml-1 inline-flex items-center gap-2 border-2 border-ink bg-ink px-3 py-1.5 text-bone transition hover:bg-saffron hover:border-saffron hover:text-ink"
            style={{ boxShadow: '3px 3px 0 var(--saffron)' }}
          >
            Hire me
            <span aria-hidden>→</span>
          </a>
        </nav>
      </div>
    </div>
  );
}
