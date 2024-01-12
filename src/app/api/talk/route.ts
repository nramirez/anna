import { getSpeech, processFeedback, transcribe } from '@/app/external/speech'
import { IHistory } from '@models/history'
import {
  getSignedUrlPromise,
  getSpeechFileFromStorage,
  getFile,
  createUploadStream,
  setMetadata,
} from '@services/files'
import { getHistory, saveHistory, setTempEmailCookie } from '@services/history'
import { StreamingAudioResponse } from '@utils/response'
import { extractKey } from '@utils/params'

export async function GET(req: Request) {
  const key = extractKey(req)
  if (!key) {
    return ErrorResponse()
  }

  const history = await getHistory()
  // cookies can't be uploaded on load, so we'll update here
  setTempEmailCookie(history.email)

  // if we have a system key and the last message is an assistant, return that message
  // if we have a system key at the end or a new user key, we need to process the request
  // and update the history for this user
  const kExists = history.messages.find((m) => m.id === key)
  const lastMessage = history.messages[history.messages.length - 1]
  console.log(key, kExists, lastMessage)
  if (kExists && lastMessage.role === 'assistant') {
    return speechResponse(lastMessage.content!)
  }

  let newHistory: IHistory = {
    ...history,
    messages: [...history.messages],
  }

  // // assume this is a new user message
  // // because it's not in the pile of messages
  // // if it is not a speech file, it's probably a system message of an upload action
  // // and we need to process the next speech response
  if (!kExists) {
    // this only means that it's a new message from the user
    const signedUrl = await getSignedUrlPromise(key)
    // TODO: we want to upate the file metadata with the transcription here
    // if we update the text in the metadata we can easily reconstruct the history
    // with the sequence of keys
    const t = await transcribe(signedUrl, `${key}.webm`)
    if (!t) {
      return CouldNotHearResponse()
    }
    // append transcribed message to history
    newHistory.messages.push({
      id: key,
      content: t,
      role: 'user',
    })
  }

  try {
    newHistory = await processFeedback(newHistory)
  } catch (e) {
    console.log('error adding feedback', e)
    return ErrorResponse()
  }

  await saveHistory(newHistory)
  console.log('saved new history', newHistory)
  const assistanceReponse = newHistory.messages[newHistory.messages.length - 1]
    .content as string
  return speechResponse(assistanceReponse)
}

const ErrorResponse = async () => {
  const text = 'Sorry, Something went wrong. Please try again later.'
  return speechResponse(text)
}
const CouldNotHearResponse = async () => {
  const text = 'Sorry, I could not hear you. Please try again.'
  return speechResponse(text)
}

const voiceStream = async (text: string, key: string) => {
  const audioStream = await getSpeech(text)
  if (!audioStream) {
    throw new Error('We need to handle errors')
  }
  console.log('got audio stream from openai')

  const uploadStream = await createUploadStream(key)

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of audioStream as any) {
        const bufferChunk = chunk instanceof Buffer ? chunk : Buffer.from(chunk)
        controller.enqueue(bufferChunk)
        // Write chunks to GCS as they come in
        uploadStream.write(bufferChunk)
      }
      controller.close()
      // End the GCS write stream when the audio stream is finished
      uploadStream.end()

      // should we schedule transcription here? or on the first request of getting the transcript?
      const signedUrl = await getSignedUrlPromise(key)
      //  can we transcribe this directly from the file?
      const srt = await transcribe(signedUrl, `${key}.mp3`, 'srt')

      await setMetadata(key, {
        srt: srt,
        text: text,
      })
      console.log('file uploaded to GCS and saved metadata')
    },
  })
}

const readableStreamFromBuffer = async (buffer: Buffer) => {
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(buffer)
      controller.close()
    },
  })
}

const speechResponse = async (
  text: string,
): Promise<StreamingAudioResponse> => {
  const { key, exists } = await getSpeechFileFromStorage(text)
  if (exists) {
    console.log('found file in GCP cache')

    const file = await getFile(key)
    const [buffer] = await file.download()
    return new StreamingAudioResponse(await readableStreamFromBuffer(buffer))
  }

  return new StreamingAudioResponse(await voiceStream(text, key))
}
