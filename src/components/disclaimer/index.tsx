import { Button } from '@heroui/react'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'

const Disclaimer = (): React.ReactNode => {
  const cookies = useRef(new Cookies()).current
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (cookies.get('disclaimer_accept') === 'true') {
      setOpen(false)
    }
  }, [])

  const closeDrawer = (): void => {
    cookies.set('disclaimer_accept', 'true', { path: '/', sameSite: 'strict', secure: true })
    setOpen(false)
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-zinc-900 shadow-lg z-50 p-4">
          <div className="max-w-[900px] mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <h6 className="text-lg font-semibold">Cookie and Privacy Disclosure</h6>
              <p className="text-sm">
                This site only uses essential cookies such as those used to keep you logged in. We collect no personally
                identifiable information and no contact information. Depending on your activity, your IP address may
                appear in our logs for up to 90 days. We never sell your information -- we intentionally don&apos;t have
                information to sell.
              </p>
              <p className="text-sm">
                See our <Link href="/privacy-policy">privacy policy</Link> for more information.
              </p>
            </div>
            <div className="flex justify-center p-1 md:min-w-[140px]">
              <Button className="w-full" onPress={closeDrawer} variant="primary">
                Accept &amp; continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Disclaimer
