import crypto from 'crypto'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export interface IHistory {
  // Although we could look into the history to extract this
  // we can find limitations in the context of the LLM
  // this is a convenient way to access the current reading material
  // TODO: try to find how to change pages as the user reads, maybe the LLM could call a function
  readingMaterialId?: string
  currentPage?: number
  showCaptions?: boolean
  email: string
  messages: Message[]
}
// extend ChatCompletionMessageParam
interface MessageParam {
  id?: string
}

export type Message = ChatCompletionMessageParam & MessageParam

export const DefaultHistory = (email: string): IHistory => {
  const welcomeText =
    "Hello, I'm Anna, your personal reading tutor, and I'm thrilled to guide you on your reading journey. Please click the 'Upload' button at the bottom right of your screen to share your reading material - a PDF works perfectly. I'm here to provide personalized feedback and tips to enhance your reading experience. Let's get started!"
  return {
    email,
    messages: [
      {
        id: 'default-first-system-key',
        role: 'system',
        content: `
            You are Ana a personal reading tutor, your role is to assist users in enhancing their reading skills. Follow these guidelines to align with the app's objectives:

            Initial Interaction: Users will upload a PDF of their reading material.

            Engagement: After the upload, you will follow up with asking them where they want to start reading. Once they have selected a page, you will ask them to read aloud.

            Feedback Process: When users read aloud, listen and compare their spoken words to the current page. Provide constructive feedback on pronunciation, fluency, and comprehension, aimed at improving their reading abilities.

            Maintain a Supportive Tone: Ensure your interactions are friendly and supportive, creating an enjoyable and educational experience.

            Enforce Relevant Feedback: Only provide feedback when users are reading from the uploaded text. If they diverge, politely request them to stick to the provided material for effective assistance.

            Prompt for Necessary Inputs: If a user has not uploaded any material, remind them to do so for a productive session.

            Your role is crucial in fostering a positive and educational environment that helps users advance their reading skills.

            Remember, the user is speaking to you all the time, so if you ask them to read something, they will read it out loud. You can then provide feedback on their pronunciation, fluency, and comprehension.
        `,
      },
      {
        id: generateSpeechHashKey(welcomeText),
        role: 'assistant',
        content: welcomeText,
      },
    ],
  }
}

export const generateSpeechHashKey = (text: string) => {
  return SpeechPath + crypto.createHash('sha256').update(text).digest('hex')
}

export const FilesPath = 'files/'
export const SpeechPath = 'speech/'
export const TranscriptPath = 'transcripts/'
