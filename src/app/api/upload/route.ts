import { getHistory, saveHistory } from '@services/history'
import { NextResponse } from 'next/server'
import { getFileHandler } from '@/app/handlers/factory'

// We used to have a server action for this, but processing would take too long
// this endpoint will handle the post upload processing
export async function POST(req: Request) {
  const { key } = await req.json()

  const handler = await getFileHandler(key)
  const response = await handler.process()
  const history = await getHistory()

  await saveHistory({
    ...history,
    readingMaterialId: key,
    messages: [
      ...history.messages,
      {
        id: key,
        content: response,
        role: 'system',
      },
    ],
  })

  return NextResponse.json({
    responseKey: key,
  })
}
