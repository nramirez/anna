import React from 'react'
import { useEffect, useState } from 'react'
import AudioManager from '@managers/audio'
import './captions.css'

export const Captions = () => {
  const [text, setText] = useState<string>('')

  useEffect(() => {
    AudioManager.on('caption', setText)
    return () => {
      AudioManager.off('caption', setText)
    }
  }, [setText])
  return (
    <div className="overflow-wrap mx-auto h-18 break-words text-center text-slate-500">
      <span key={text} className={`caption-text reveal-text-animation`}>
        {text}
      </span>
    </div>
  )
}
