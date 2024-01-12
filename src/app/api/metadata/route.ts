import { getMetadata } from '@services/files'
import { getHistory } from '@services/history'
import { NextResponse } from 'next/server'
import { SpeechPath } from '@models/history'

// returns file metadata
// including existing text, srt or if the user needs to upload a file
export async function GET() {
  const history = await getHistory()
  const needsUpload = !history.readingMaterialId
  // find captions from last message
  const speechResponse = history.messages.findLast((m) => m.id?.startsWith(SpeechPath))

  if (!speechResponse?.id) {
    return NextResponse.json({
      needsUpload,
    })
  }

  const metadata = await getMetadata(speechResponse.id)

  if (!metadata) {
    return NextResponse.json({
      needsUpload,
    })
  }

  return NextResponse.json({
    text: metadata?.text,
    srt: metadata?.srt,
    needsUpload,
  })
}
