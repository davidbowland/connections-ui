import Link from 'next/link'
import React from 'react'

const Section = ({ heading, children }: { heading: string; children: React.ReactNode }): React.ReactNode => (
  <div>
    <hr className="border-black/8 dark:border-white/8" />
    <div className="py-8">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
        {heading}
      </p>
      <p className="text-[15px] leading-relaxed text-black/55 dark:text-white/55">{children}</p>
    </div>
  </div>
)

const PrivacyPolicy = (): React.ReactNode => (
  <div className="mx-auto max-w-[680px] px-6 py-20 md:px-8">
    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
      Legal
    </p>
    <h1 className="mb-6 text-5xl font-light tracking-tight text-black/88 dark:text-white/90">Privacy Policy</h1>
    <p className="mb-10 text-[15px] leading-relaxed text-black/55 dark:text-white/55">
      You can play <strong className="font-semibold text-black/75 dark:text-white/75">connections.dbowland.com</strong>{' '}
      without telling us anything. There are no accounts, no cookies, no ads, and no analytics.
    </p>

    <Section heading="What we know about you">
      Our server logs each request for 30 days, including your IP address. We never use those logs to work out who you
      are, and no one else sees them unless the law compels us.
    </Section>

    <Section heading="What stays on your device">
      Every puzzle you open is saved on your device so you can play without a signal, and clearing this site&apos;s data
      erases it.
    </Section>

    <Section heading="Where the puzzles come from">
      An AI model writes each day&apos;s puzzle ahead of time. It never receives anything about you or your game.
    </Section>

    <Section heading="Questions or deletions">
      Write to{' '}
      <Link
        className="text-violet-600 underline hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        href="mailto:privacy@dbowland.com"
      >
        privacy@dbowland.com
      </Link>{' '}
      to ask what we hold about you, or to have it deleted.
    </Section>

    <hr className="border-black/8 dark:border-white/8" />
    <p className="pt-8 text-[13px] text-black/60 dark:text-white/55">Effective August 10, 2026</p>
  </div>
)

export default PrivacyPolicy
