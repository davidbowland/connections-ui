import React from 'react'

import { InstallPlatform } from '@hooks/useInstallPrompt'

export interface InstallCardProps {
  isDismissed: boolean
  onDismiss: () => void
  onInstall: () => void
  onReopen: () => void
  platform: InstallPlatform
}

// The quiet action carries no border, so it cannot read as a second offer of equal
// weight next to the one control the card exists to present.
const QUIET_ACTION =
  'min-h-11 text-[10px] uppercase tracking-[0.15em] text-black/60 hover:text-black/[0.88] dark:text-white/55 dark:hover:text-white/90'

const OFFER =
  'mb-2 min-h-11 w-full rounded-full border border-black/20 px-4 text-[11px] uppercase tracking-[0.15em] text-black/70 hover:border-black/35 hover:bg-black/[0.03] dark:border-white/20 dark:text-white/65 dark:hover:border-white/35 dark:hover:bg-white/[0.04]'

export const InstallCard = ({
  isDismissed,
  onDismiss,
  onInstall,
  onReopen,
  platform,
}: InstallCardProps): React.ReactNode => {
  // Dismissing collapses the card, it never removes it. iOS has no
  // beforeinstallprompt to re-fire, so losing this link would strand the player
  // with no route to installing at all.
  if (isDismissed) {
    return (
      <button className={`mt-3 ${QUIET_ACTION}`} onClick={onReopen} type="button">
        Install
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-black/8 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.04]">
      <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-black/[0.88] dark:text-white/90">
        Take the week with you
      </h3>
      <p className="mb-3 text-[12.5px] leading-5 text-black/60 dark:text-white/55">
        Only the puzzles you open stay on this device. Install Common Threads and the last seven days stay too — no
        connection needed.
      </p>
      {platform === 'ios' ? (
        // Safari has no install API. A button here would be a promise the browser
        // cannot keep, so the steps are named exactly as Safari names them.
        <ol className="mb-3 list-decimal pl-5 text-[12.5px] leading-5 text-black/60 dark:text-white/55">
          <li>Tap Share at the bottom of Safari.</li>
          <li>Tap Add to Home Screen.</li>
        </ol>
      ) : (
        // A desktop has no home screen, so the same label cannot serve both.
        <button className={OFFER} onClick={onInstall} type="button">
          {platform === 'android' ? 'Add to home screen' : 'Install'}
        </button>
      )}
      <button className={QUIET_ACTION} onClick={onDismiss} type="button">
        Not now
      </button>
    </div>
  )
}
