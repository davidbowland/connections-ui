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
      data. The short version: we collect very little, we keep it briefly, and we never sell it.
    </p>

    <Section heading="What we collect">
      Our servers automatically log your IP address, browser type, and the pages you visit. We use these logs to detect
      abuse and keep the site running. We set no cookies and collect no other personal information. That&apos;s
      everything.
    </Section>

    <Section heading="Why we collect it">
      We collect server logs to keep the site running and detect abuse — that&apos;s the only reason. We don&apos;t rely
      on your consent, and we don&apos;t use your data for advertising or profiling.
    </Section>

    <Section heading="What we don't do">
      We don&apos;t sell your data. We don&apos;t share it with advertisers. We don&apos;t build profiles. We don&apos;t
      set cookies. We intentionally don&apos;t collect contact information or anything personally identifying beyond
      what appears in a standard server log.
    </Section>

    <Section heading="When we share your data">
      We share data only when legally required — for example, in response to a valid court order or law enforcement
      request.
    </Section>

    <Section heading="Data retention">We keep server logs for up to 90 days, then we delete them.</Section>

    <Section heading="Your rights">
      If you are a European resident, you have the right to access personal information we hold about you and to ask
      that it be corrected or deleted. Contact us at the address below.
    </Section>

    <Section heading="Contact">
      For questions about this policy, contact us at{' '}
      <Link
        className="text-violet-600 underline hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        href="mailto:privacy@dbowland.com"
      >
        privacy@dbowland.com
      </Link>{' '}
      or by mail: dbowland.com Privacy Department, P.O. Box 81226, Seattle, WA 98108-1226.
    </Section>
  </div>
)

export default PrivacyPolicy
