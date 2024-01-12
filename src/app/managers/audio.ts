import { Howl } from 'howler'
import Meyda from 'meyda'
import EventEmitter from 'events'
import srtParser2 from 'srt-parser-2'

export class AudioManager extends EventEmitter {
  private sound: Howl | null = null
  private analyzer: any | null = null
  private captions: Caption[] = []
  public needsUpload: boolean = false
  captionsCheckInterval: NodeJS.Timeout | null = null

  queueAudio(key: string) {
    // const url = `/api/talk?key=${key}`
    const url = 'https://d38nvwmjovqyq6.cloudfront.net/va90web25003/companions/Foundations%20of%20Rock/5.01.mp3'
    this.sound = new Howl({
      src: [url],
      // Set to true to force HTML5 Audio.
      // This should be used for large audio files so that you don't have to wait for the full file to be downloaded and decoded before playing.
      // but we won't be able to get a sound node if html5 is enabled, ideally we should get both
      html5: true,
      // should we only support webm? and make the playback seakeable
      // validate that quality is good before doing that
      // https://github.com/goldfire/howler.js/tree/master?tab=readme-ov-file#format-recommendations
      format: ['mp3', 'webm'],
      autoplay: false,
    })
    const mediaElementSource = Howler.ctx.createMediaElementSource(
      (this.sound as any)._sounds[0]._node,
    )
    mediaElementSource.connect(Howler.ctx.destination)
    this.analyzer = Meyda.createMeydaAnalyzer({
      audioContext: Howler.ctx,
      source: mediaElementSource,
      bufferSize: 512,
      featureExtractors: ['loudness', 'spectralCentroid'],
      callback: (features: any) => {
        if (features) {
          const speed = mapSpectralCentroidToSpeed(features.spectralCentroid)
          const amplitude = mapLoudnessToAmplitude(features.loudness.total)
          if (isNaN(speed) || isNaN(amplitude)) return
          this.emit('analysis', {
            speed: mapSpectralCentroidToSpeed(features.spectralCentroid),
            amplitude: mapLoudnessToAmplitude(features.loudness.total),
          })
        }
      },
    })

    this.sound.on('end', () => {
      this.analyzer.stop()
      this.emit('analysis', {
        speed: 0.01,
        amplitude: 0.2,
      })
      this.emit('end')
      this.stopCaptions()
    })
    this.sound.on('load', () => {
      this.emit('load')
      this.initializeMetadata()
    })

    // bubble up events
    this.sound.on('play', () => this.emit('play'))
    this.sound.on('pause', () => this.emit('pause'))
    this.sound.on('stop', () => this.emit('stop'))
    this.sound.on('mute', () => this.emit('mute'))
    this.sound.on('volume', () => this.emit('volume'))
    this.sound.on('rate', () => this.emit('rate'))
    this.sound.on('seek', () => this.emit('seek'))
    this.sound.on('fade', () => this.emit('fade'))
    this.sound.on('unlock', () => this.emit('unlock'))
  }

  play() {
    if (this.sound) {
      this.sound.play()
      this.analyzer.start()
      this.showCaptions()
    }
  }

  pause() {
    if (this.sound) {
      this.sound.pause()
      this.analyzer.stop()
      this.emit('analysis', {
        speed: 0.01,
        amplitude: 0.2,
      })
    }
  }

  private showCaptions() {
    if (this.captionsCheckInterval) clearInterval(this.captionsCheckInterval)

    this.captionsCheckInterval = setInterval(() => {
      if (!this.sound) return
      const currentTime = this.sound.seek()
      const currentCaption = this.captions.find(
        (caption) =>
          currentTime >= caption.startSeconds &&
          currentTime <= caption.endSeconds,
      )
      if (currentCaption) {
        this.emit('caption', currentCaption.text)
      }
    }, 300)
  }

  private stopCaptions() {
    if (this.captionsCheckInterval) clearInterval(this.captionsCheckInterval)
    this.captionsCheckInterval = null
  }

  private async initializeMetadata() {
    // wait a second before we do the first request
    let tries = 1
    const maxTries = 5
    const delay = 1000
    const getCaptions = async () => {
      const response = await fetch('/api/metadata')
      let srt = null
      if (response.ok) {
        const res = await response.json()
        srt = res.srt
        this.needsUpload = res.needsUpload
        if (srt) {
          this.captions = srt ? new srtParser2().fromSrt(srt) : []
        }
      }

      if (!srt) {
        if (tries < maxTries) {
          tries++
          setTimeout(getCaptions, delay * tries)
        }
      }
    }

    getCaptions()
  }
}

function mapLoudnessToAmplitude(loudnessTotal: number) {
  // Normalize loudness to a 0-1 range. Adjust the min and max values based on your observations
  const minLoudness = 5 // Set this to a reasonable minimum based on your observed data
  const maxLoudness = 30 // Set this to a maximum based on your observed data

  let normalizedLoudness =
    (loudnessTotal - minLoudness) / (maxLoudness - minLoudness)
  normalizedLoudness = Math.max(0, Math.min(normalizedLoudness, 1)) // Clamp values between 0 and 1

  // You can then map this normalized value to the desired amplitude range for your wave
  return 0.2 + 0.8 * normalizedLoudness // Example: Mapping to a range of 0.2 to 1.0
}

function mapSpectralCentroidToSpeed(centroid: number) {
  const maxCentroid = 50
  let normalizedCentroid = centroid / maxCentroid // Normalize based on maximum expected centroid
  return 0.01 + 0.09 * normalizedCentroid // Map to a range, e.g., [0.01, 0.05]
}

export type Caption = {
  id: string
  startTime: string
  startSeconds: number
  endTime: string
  endSeconds: number
  text: string
}
const audiodManager = new AudioManager()

export default audiodManager
