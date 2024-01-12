'use client'

import { useEffect, useRef } from 'react'
import SiriWave from 'siriwave'
import AudioManager from '@managers/audio'

export const VoiceWave = () => {
  const ref = useRef<HTMLDivElement>(null)
  const waveRef = useRef<SiriWave | null>(null)

  useEffect(() => {
    if (!ref.current) return

    var siriWave = new SiriWave({
      container: ref.current,
      curveDefinition: [
        { attenuation: -2, lineWidth: 2, opacity: 0.3 },
        { attenuation: -6, lineWidth: 1.5, opacity: 0.4 },
        { attenuation: 4, lineWidth: 1, opacity: 0.6 },
        { attenuation: 2, lineWidth: 0.9, opacity: 0.8 },
        { attenuation: 1, lineWidth: 0.8, opacity: 0.9 },
      ],
      width: 350,
      height: 200,
      speed: 0.01,
      color: '#6cadc7',
      frequency: 3,
      amplitude: 0.2,
    })

    waveRef.current = siriWave
    function onAnalysis({
      speed,
      amplitude,
    }: {
      speed: number
      amplitude: number
    }) {
      waveRef.current?.setSpeed(speed)
      waveRef.current?.setAmplitude(amplitude)
    }

    AudioManager.on('analysis', onAnalysis)

    return () => {
      AudioManager.off('analysis', onAnalysis)
      waveRef.current?.dispose()
    }
  }, [])

  return <div ref={ref} className="voice-wave"></div>
}
