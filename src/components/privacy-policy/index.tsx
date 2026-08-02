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
      This policy describes how{' '}
      <strong className="font-semibold text-black/75 dark:text-white/75">connections.dbowland.com</strong> handles your
      data. The short version: you don&apos;t give us anything, and we don&apos;t keep much.
    </p>

    <Section heading="What we collect">
      When your browser requests a puzzle, our server records the request in a log: your IP address, the time, the
      address requested, and your browser&apos;s user-agent string. That is the whole of it. We set no cookies, store
      nothing in your browser, and have no accounts to sign in to.
    </Section>

    <Section heading="What we don't collect">
      We don&apos;t record which pages you view — the website itself keeps no access log, so only requests that reach
      the puzzle API appear anywhere. We don&apos;t track your progress through a puzzle: your guesses stay in the
      browser tab and are gone when you close it. We don&apos;t sell your data, share it with advertisers, build
      profiles, or run analytics.
    </Section>

    <Section heading="How the puzzles are made">
      Each day&apos;s puzzle is written by an AI model running on Amazon Bedrock, on a schedule, from fixed word lists
      we supply. It never receives anything about you or anything you type.
    </Section>

    <Section heading="Who else handles your data">
      Amazon Web Services hosts the site and stores the logs described above. Log lines recording an error are copied to
      a separate error-reporting function we run in the same AWS account, so we can see what broke. Nobody else receives
      your data, and we don&apos;t sell or trade it.
    </Section>

    <Section heading="When we share your data">
      Beyond the AWS hosting described above, we share data only when legally required — for example, in response to a
      valid court order or law enforcement request.
    </Section>

    <Section heading="Data retention">
      Server logs are deleted automatically after 30 days. Copies of error lines follow the same 30-day schedule.
    </Section>

    <Section heading="Your rights">
      If you are a European resident, you have the right to access personal information we hold about you and to ask
      that it be corrected or deleted. In practice the only thing we hold is a server log entry tied to your IP address.
      Write to us and we will find it and remove it.
    </Section>

    <Section heading="Contact">
      For questions about this policy, contact us at{' '}
      <Link
        className="text-violet-600 underline hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        href="mailto:privacy@dbowland.com"
      >
        privacy@dbowland.com
      </Link>
      .
    </Section>

    <hr className="border-black/8 dark:border-white/8" />
    <p className="pt-8 text-[13px] text-black/40 dark:text-white/40">Effective August 1, 2026</p>
  </div>
)

export default PrivacyPolicy
