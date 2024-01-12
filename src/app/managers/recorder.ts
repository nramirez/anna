export class RecordManager {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: BlobPart[] = []

  private async initializeMediaRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      })
      this.mediaRecorder = new MediaRecorder(stream)

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }
    } catch (error) {
      console.error('Error accessing media devices.', error)
    }
  }

  public startRecording() {
    if (!this.mediaRecorder) {
      this.initializeMediaRecorder().then(() => {
        this.mediaRecorder?.start()
      })
    } else if (this.mediaRecorder.state === 'inactive') {
      this.mediaRecorder.start()
    }
  }

  public stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' })
          resolve(blob)
        }
        this.mediaRecorder.stop()
      } else {
        resolve(new Blob())
      }
    })
  }
}

const recordManager = new RecordManager()

export default recordManager
