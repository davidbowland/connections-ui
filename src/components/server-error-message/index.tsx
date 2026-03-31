import Link from 'next/link'
import React from 'react'

import PrivacyLink from '@components/privacy-link'

export interface ServerErrorProps {
  children: React.ReactNode
  title: string
}

const ServerErrorMessage = ({ children, title }: ServerErrorProps): React.ReactNode => {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col gap-4 max-w-[900px] p-8 w-full">
        <div>
          <h1 className="text-8xl font-light">{title}</h1>
        </div>
        <div>{children}</div>
        <div>
          <Link href="/">Go home</Link>
          <PrivacyLink />
        </div>
      </div>
    </div>
  )
}

export default ServerErrorMessage
