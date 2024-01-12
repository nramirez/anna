'use client'

import { useEffect, useState } from 'react'
import { Captions } from './captions'
import { CallToAction } from './cta'
import { ActionButton } from './button'
import { ConversationStatus } from '@/app/models/status'
import AudioManager from '@managers/audio'
import RecordManager from '@managers/recorder'
import { VoiceWave } from './voice'
import { createPresignedUrl } from '@services/files'
import axios from 'axios'
import { UplaodButton } from './upload'
import { TrashIcon } from '@heroicons/react/20/solid'
import { removeHistory } from '@services/history'

const uploadFile = async (blob: Blob) => {
  const [url, key] = await createPresignedUrl(blob.type)
  try {
    await axios.put(url, blob, {
      headers: {
        'Content-Type': blob.type,
      },
    })
    return key
  } catch (error) {
    console.error(error)
  }

  // TODO: handle errors
  return null
}

type SpaceContainerProps = {
  welcomeKey: string
}

export const MiddleContainer = ({ welcomeKey }: SpaceContainerProps) => {
  const [state, setState] = useState<ConversationStatus>(
    ConversationStatus.None,
  )

  useEffect(() => {
    AudioManager.queueAudio(welcomeKey)
  }, [welcomeKey])

  useEffect(() => {
    const handleOnPlay = () => {
      setState(ConversationStatus.Play)
    }
    const handleOnPause = () => {
      setState(ConversationStatus.Pause)
    }
    const handleOnEndCallback = () => {
      if (AudioManager.needsUpload) {
        setState(ConversationStatus.WaitUpload)
      } else {
        // is it possible to play and record at the same time?
        // and we can probably pause the audio if the user starts recording?
        setState(ConversationStatus.Listen)
        RecordManager.startRecording()
      }
    }

    AudioManager.on('end', handleOnEndCallback)
    AudioManager.on('play', handleOnPlay)
    AudioManager.on('pause', handleOnPause)

    return () => {
      AudioManager.off('end', handleOnEndCallback)
      AudioManager.off('play', handleOnPlay)
      AudioManager.off('pause', handleOnPause)
    }
  }, [])

  return (
    <div className="flex h-full flex-col justify-between">
      <div></div>
      <div className="flex flex-col items-center">
        <VoiceWave />
        <Captions />
      </div>
      <div className="flex justify-between">
        <div className="flex items-end pb-5 pl-5">
          <button
            onClick={async () => {
              await removeHistory()
              window.location.reload()
            }}
            className="flex cursor-pointer items-center justify-center rounded-full p-4 font-bold text-white hover:bg-red-700"
          >
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div>
          <CallToAction
            text={'click to start'}
            shouldShow={state === ConversationStatus.None}
          />
          <ActionButton
            status={state}
            triggerStateChange={async (newState: ConversationStatus) => {
              //  do we really need a state for pause/play?
              // can we just listen to sound.isPlaying?
              if (newState === ConversationStatus.Pause) {
                AudioManager.pause()
              } else if (newState === ConversationStatus.Play) {
                AudioManager.play()
              } else {
                setState(newState)
                if (newState === ConversationStatus.Sending) {
                  const recordingBlob = await RecordManager.stopRecording()
                  if (recordingBlob) {
                    uploadFile(recordingBlob).then((k) => {
                      // this should never fail (lol), but what if it does?
                      // retry?
                      if (k) {
                        AudioManager.queueAudio(k)
                        AudioManager.play()
                      }
                    })
                  }
                }
              }
            }}
          />
        </div>
        <div className="flex items-end pb-5 pr-5">
          <div>
            <CallToAction
              text={'upload'}
              shouldShow={state === ConversationStatus.WaitUpload}
            />
            <UplaodButton
              triggerStateChange={(newState: ConversationStatus) => {
                setState(newState)
              }}
              onUploadComplete={(k: string) => {
                if (!k) return
                AudioManager.queueAudio(k)
                AudioManager.play()
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
