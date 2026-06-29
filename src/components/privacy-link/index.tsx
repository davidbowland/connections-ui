import Link from 'next/link'
import React from 'react'

const PrivacyLink = (): React.ReactNode => (
  <div className="p-2 text-center text-[10px] uppercase tracking-[0.15em]">
    <Link
      className="text-black/25 transition-colors hover:text-black/50 dark:text-white/20 dark:hover:text-white/40"
      href="/privacy-policy"
    >
      Privacy policy
    </Link>
  </div>
)

export default PrivacyLink
