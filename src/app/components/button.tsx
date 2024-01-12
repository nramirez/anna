'use client'

import './button.css'
import {
  ArrowUpIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/20/solid'
import { Spinner } from './spinner'
import { ConversationStatus } from '@/app/models/status'

export function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

const nextStatus = (status: ConversationStatus) => {
  switch (status) {
    case ConversationStatus.None:
      return ConversationStatus.Play
    case ConversationStatus.Listen:
      return ConversationStatus.Sending
    case ConversationStatus.Stop:
      return ConversationStatus.Listen
    case ConversationStatus.Play:
      return ConversationStatus.Pause
    case ConversationStatus.Pause:
      return ConversationStatus.Play
    case ConversationStatus.WaitUpload:
      return ConversationStatus.WaitUpload
    default:
      return ConversationStatus.None
  }
}

export const ActionButton = ({
  status,
  triggerStateChange,
}: {
  status: ConversationStatus
  triggerStateChange: (state: ConversationStatus) => void
}) => {
  return (
    <>
      <div className="flex justify-center pb-3">
        <div
          onClick={() => {
            triggerStateChange(nextStatus(status))
          }}
          className={classNames(
            'relative rounded-full bg-blue-100 p-2',
            status === ConversationStatus.Listen ? 'animate-pulse' : '',
            status === ConversationStatus.Play ? 'animate-glow' : '',
            status === ConversationStatus.None ? '' : '',
            status === ConversationStatus.WaitUpload ||
              status === ConversationStatus.Sending
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer',
          )}
        >
          <div
            className={classNames(
              'flex h-16 w-16 items-center justify-center rounded-full',
              status === ConversationStatus.Listen
                ? 'bg-green-600'
                : 'bg-blue-500',
              status === ConversationStatus.Play ? 'animate-glow' : '',
              status === ConversationStatus.None ? 'animate-pulse' : '',
            )}
          >
            <div className="flex items-center justify-center text-2xl text-white">
              {status === ConversationStatus.Listen ? (
                <ArrowUpIcon
                  className="h-5 w-5 animate-pulse"
                  aria-hidden="true"
                />
              ) : status === ConversationStatus.Play ? (
                <PauseIcon
                  className="h-5 w-5 animate-pulse"
                  aria-hidden="true"
                />
              ) : status === ConversationStatus.Sending ? (
                <Spinner />
              ) : (
                <PlayIcon
                  className="h-5 w-5 animate-pulse"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </div>
        {status === ConversationStatus.Listen && (
          <button
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              triggerStateChange(ConversationStatus.Stop)
            }}
            className="absolute bottom-5 ml-40 cursor-pointer rounded-full bg-red-500 p-2 text-white"
          >
            <StopIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="text-center text-xs text-slate-500">
        <span>
          {status === ConversationStatus.Listen ? 'listening...' : '\u00A0'}
        </span>
      </div>
    </>
  )
}
