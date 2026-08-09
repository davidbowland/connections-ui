import { Head, Html, Main, NextScript } from 'next/document'
import React from 'react'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()",
          }}
        />
        {/* This page ships as static HTML and hydrates after load, so on a slow phone
            Chromium can fire beforeinstallprompt before React has mounted anything.
            The event is not replayed: with no listener it is gone for the session and
            the install card never appears. Park it here; useInstallPrompt reads and
            clears window.__deferredInstallPrompt on mount.

            The listener removes itself after the first capture. Otherwise it outlives
            the hook and keeps re-stashing: prompt once, navigate away and back, and the
            remounted hook would find the spent event in the global, show the card, and
            reject with InvalidStateError. Anything fired later is the hook's own
            listener to catch. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var s=function(e){e.preventDefault();window.__deferredInstallPrompt=e;window.removeEventListener('beforeinstallprompt',s)};window.addEventListener('beforeinstallprompt',s)}catch(e){}})()",
          }}
        />
        <link href="/icon.svg" rel="icon" type="image/svg+xml" />
        <link href="/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png" />
        <link href="/favicon-16x16.png" rel="icon" sizes="16x16" type="image/png" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
        <link href="/site.webmanifest" rel="manifest" />
        <meta content="#060608" name="theme-color" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
