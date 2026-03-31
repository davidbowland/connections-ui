import { AlertContent, AlertDescription, AlertIndicator, AlertRoot } from '@heroui/react'
import { CheckCircle, XCircle } from 'lucide-react'
import React from 'react'

export interface FeedbackMessageProps {
  isError: boolean
  message: string
}

const FeedbackMessage = ({ isError, message }: FeedbackMessageProps): React.ReactNode => (
  <AlertRoot className="mt-4" status={isError ? 'danger' : 'success'}>
    <AlertIndicator>{isError ? <XCircle size={18} /> : <CheckCircle size={18} />}</AlertIndicator>
    <AlertContent>
      <AlertDescription>{message}</AlertDescription>
    </AlertContent>
  </AlertRoot>
)

export default FeedbackMessage
