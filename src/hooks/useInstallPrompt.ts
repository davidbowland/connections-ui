import { useCallback, useEffect, useState } from 'react'

import { readMeta, setInstallDismissed } from '@services/storage'

export type InstallPlatform = 'android' | 'desktop' | 'ios'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void
}

export interface UseInstallPromptResult {
  dismiss: () => void
  install: () => void
  isDismissed: boolean
  isOfferable: boolean
  platform: InstallPlatform
  reopen: () => void
}

// iPadOS 13 and later send the desktop Safari user agent verbatim, so the string
// alone reports every iPad as a Mac. Touch points are the only thing left that
// separates the two, and getting it wrong strands iPad completely: Safari fires no
// beforeinstallprompt, so a card gated on that event never appears and the one
// route to installing is never explained.
const detectPlatform = (): InstallPlatform => {
  const agent = window.navigator.userAgent
  if (/iPad|iPhone|iPod/.test(agent)) return 'ios'
  if (/Macintosh/.test(agent) && window.navigator.maxTouchPoints > 1) return 'ios'
  if (/Android/.test(agent)) return 'android'
  return 'desktop'
}

// Already running as an installed app. Chromium handles this by never firing
// beforeinstallprompt, but iOS has no event to withhold, so without this the card
// would keep offering Add to Home Screen to someone already on their home screen.
const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true

export const useInstallPrompt = (): UseInstallPromptResult => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  // Server-render and the first client render must agree, so every browser fact
  // starts at its neutral value and is corrected on mount.
  const [platform, setPlatform] = useState<InstallPlatform>('desktop')
  const [isDismissed, setIsDismissed] = useState(false)
  const [isRunningInstalled, setIsRunningInstalled] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())
    setIsDismissed(readMeta().installDismissed)
    setIsRunningInstalled(isStandalone())

    const capture = (event: Event) => {
      // Hold the event back so the offer arrives inside the card, next to the
      // seven-day strip that shows what installing is actually worth.
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    const installed = () => {
      setDeferred(null)
      setIsRunningInstalled(true)
    }

    window.addEventListener('appinstalled', installed)
    window.addEventListener('beforeinstallprompt', capture)
    return () => {
      window.removeEventListener('appinstalled', installed)
      window.removeEventListener('beforeinstallprompt', capture)
    }
  }, [])

  const dismiss = useCallback(() => {
    setInstallDismissed(true)
    setIsDismissed(true)
  }, [])

  // Dismissing collapses the card to a text link; it never destroys it. iOS fires
  // no beforeinstallprompt, so the card is the only route to installing there and
  // a one-way door would make it unreachable forever after a stray tap.
  const reopen = useCallback(() => {
    setInstallDismissed(false)
    setIsDismissed(false)
  }, [])

  const install = useCallback(() => deferred?.prompt(), [deferred])

  return {
    dismiss,
    install,
    isDismissed,
    // iOS never fires the event, so the manual steps are always on offer there.
    isOfferable: !isRunningInstalled && (deferred !== null || platform === 'ios'),
    platform,
    reopen,
  }
}
