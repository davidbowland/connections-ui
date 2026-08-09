import React, { useEffect, useRef } from 'react'

import { InstallMode, InstallPlatform } from '@hooks/useInstallPrompt'

export interface InstallCardProps {
  mode: InstallMode
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

// Safari has no install API, and Firefox for Android fires no beforeinstallprompt. On
// both, the gesture happens in the browser's own chrome, where we cannot put a button,
// so the only honest offer is to name the steps.
//
// Neither list claims a position. Share sits at the bottom on iPhone and the top on
// iPad, and Firefox's menu moves with the toolbar setting. Naming Safari matters:
// Chrome, Firefox and the browsers inside messaging apps all report themselves as iOS,
// and none of them can add anything to a home screen.
//
// Install, named first and named exactly. Firefox lists Add to Home screen as a
// SEPARATE item that makes an ordinary shortcut -- it opens in a tab and Android never
// counts it as installed -- so a step that said only "add to home screen" would send
// the player to the one item that cannot work. Older Firefox called the install item
// Add to Home screen itself, which is why the second name still has to appear.
const STEPS: Partial<Record<InstallPlatform, string[]>> = {
  'firefox-android': ['Open the Firefox menu.', 'Tap Install. Older versions call it Add to Home screen.'],
  ios: ['Open this page in Safari.', 'Tap Share, then Add to Home Screen.'],
}

export const InstallCard = ({ mode, onDismiss, onInstall, onReopen, platform }: InstallCardProps): React.ReactNode => {
  const collapsedRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const installRef = useRef<HTMLButtonElement>(null)
  const previousMode = useRef<InstallMode>(mode)

  // Collapsing and reopening unmount the control the keyboard was sitting on. Focus
  // then falls to <body>, the next Tab restarts at the top of the page, and a screen
  // reader announces nothing -- so the card reads as gone rather than collapsed
  // (WCAG 2.4.3). Only the two disclosure transitions move focus: a card that appears
  // because the browser finally fired its event must not snatch focus from whatever
  // the player is doing.
  useEffect(() => {
    const previous = previousMode.current
    previousMode.current = mode
    if (previous === 'card' && mode === 'link') collapsedRef.current?.focus()
    // iOS and Firefox for Android offer steps instead of a button, so there the card
    // announces itself by its title rather than dropping focus back onto <body>.
    if (previous === 'link' && mode === 'card') (installRef.current ?? headingRef.current)?.focus()
  }, [mode])

  // A desktop has no home screen, so the same label cannot serve both. Both branches
  // read from the same expression: an offer that returned under a second name would
  // look like a different offer.
  const offerLabel = platform === 'android' || platform === 'firefox-android' ? 'Add to home screen' : 'Install'
  const steps = STEPS[platform]

  if (mode === 'none') return null

  // Dismissing collapses the card, it never removes it. iOS has no
  // beforeinstallprompt to re-fire, so losing this link would strand the player
  // with no route to installing at all.
  if (mode === 'link') {
    return (
      <button
        aria-expanded={false}
        className={`mt-3 ${QUIET_ACTION}`}
        onClick={onReopen}
        ref={collapsedRef}
        type="button"
      >
        {offerLabel}
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-black/8 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.04]">
      <h3
        className="mb-2 text-[11px] uppercase tracking-[0.15em] text-black/[0.88] dark:text-white/90"
        ref={headingRef}
        tabIndex={-1}
      >
        Take the week with you
      </h3>
      <p className="mb-3 text-[12.5px] leading-5 text-black/60 dark:text-white/55">
        Only the puzzles you open stay on this device. Install Common Threads and the last seven days stay too — no
        connection needed.
      </p>
      {steps === undefined ? (
        <button className={OFFER} onClick={onInstall} ref={installRef} type="button">
          {offerLabel}
        </button>
      ) : (
        // A button here would be a promise the browser cannot keep: neither platform
        // that lands in this branch has an install event to replay.
        <ol className="mb-3 list-decimal pl-5 text-[12.5px] leading-5 text-black/60 dark:text-white/55">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      <button className={QUIET_ACTION} onClick={onDismiss} type="button">
        Not now
      </button>
    </div>
  )
}
