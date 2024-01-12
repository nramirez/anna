import OpenAI from 'openai'
import fs from 'fs'
import { IHistory, Message, generateSpeechHashKey } from '@models/history'
import { getFileHandler } from '../handlers/factory'
import { v4 } from 'uuid'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const getSpeech = async (text: string) => {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'shimmer',
    input: text,
  })

  // https://github.com/openai/openai-node/issues/487#issuecomment-1813858023
  return response.body
}

export const transcribe = async (
  signedUrl: string,
  fileName: string = 'test.webm',
  response_format: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt' = 'text',
): Promise<string> => {
  const fileResponse = await fetch(signedUrl)
  const fileData = await fileResponse.arrayBuffer()
  const buffer = Buffer.from(fileData)
  // replace slashes with underscores
  const cleanFileName = fileName.replace(/\//g, '_')
  // is this really the best we can do?
  // what if two files have the same name?
  // revisit this and try not to use the temp file, I was always looking at the wrong place
  fs.writeFileSync(`/tmp/${cleanFileName}`, buffer)

  try {
    const textResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(`/tmp/${cleanFileName}`),
      model: 'whisper-1',
      response_format: response_format,
    })

    return textResponse as any
  } catch (e) {
    console.log(e)
  }

  return ''
}

const ALLOWED_FUNCTIONS = {
  get_text_from_page: true,
}

const cleanMessages = (messages: Message[]) => {
  const m = [...messages]
  // remove id
  m.forEach((message) => {
    delete message.id
  })
  return m
}

export const processFeedback = async (history: IHistory): Promise<IHistory> => {
  let messages = [...history.messages]
  const tutorResponse = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    temperature: 0.8,
    messages: cleanMessages(messages),
    tool_choice: 'auto',
    tools: [
      {
        type: 'function',
        // TODO: add the upload file function to attach the book with the file key
        function: {
          name: 'get_text_from_page',
          description:
            'This function takes a page number and returns the text from that page',
          parameters: {
            type: 'object',
            properties: {
              pageNumber: {
                type: 'number',
                description: 'The page number to extract the text from',
              },
            },
          },
        },
      },
    ],
  })

  const responseMessage = tutorResponse.choices[0].message
  console.log(responseMessage)
  let content = responseMessage.content
  if (
    responseMessage.tool_calls &&
    responseMessage.tool_calls[0].function.name in ALLOWED_FUNCTIONS
  ) {
    const toolCall = responseMessage.tool_calls[0]
    // we only have one function for now, but refactor this later
    const functionResponse = toolCall.function
    const functionArgs = JSON.parse(functionResponse.arguments)
    const pageNumber = functionArgs.pageNumber
    const currentFileKey = history.readingMaterialId
    if (currentFileKey && pageNumber) {
      const handler = await getFileHandler(currentFileKey)
      const text = await handler.getTextFromPage(pageNumber)
      // the llm needs to know about the function response
      messages.push({
        ...responseMessage,
        id: v4(),
      })
      messages.push({
        id: v4(),
        ...{
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: text,
        },
      })
      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: cleanMessages(messages),
      })
      // return secondResponse.choices[0].message.content
      content = secondResponse.choices[0].message.content
    }
  }

  return {
    ...history,
    messages: [
      ...messages,
      {
        id: generateSpeechHashKey(content!),
        role: 'assistant',
        content: content,
      },
    ],
  }
}
