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
            clears window.__deferredInstallPrompt on mount. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__deferredInstallPrompt=e})}catch(e){}})()",
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
