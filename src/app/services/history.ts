'use server'

import { cookies } from 'next/headers'
import { DefaultHistory, IHistory } from '../models/history'
import { v4 } from 'uuid'
import { deleteFile, getFile } from './files'

// We'll assign the user a temporary email id if they're not logged in
function retrieveTempEmailFromCookie(): string {
  const cookieStore = cookies()
  const savedEmail = cookieStore.get('history_email')?.value

  // move this to a env variable
  return savedEmail || `${v4()}@ana.com`
}

/// Sets the temporary email cookie
/// This is used to store the history for a user that is not logged in
/// Cookies can only be set on the server
// when called from a server component wrap this in a effect
// https://github.com/vercel/next.js/issues/51875#issuecomment-1652710273
export const setTempEmailCookie = (email: string) => {
  //  we will only update the email if it is a temporary one
  // temporary emails end with @kos
  if (!email.endsWith('@ana.com')) {
    return null
  }

  const cookieStore = cookies()
  cookieStore.set('history_email', email)
}

const historyFileName = (email: string) => `history/${email}.json`

export async function getHistory(): Promise<IHistory> {
  const email = retrieveTempEmailFromCookie()
  //   check if the file exists
  const file = await getFile(historyFileName(email))
  const [exists] = await file.exists()
  if (!exists) {
    const d = DefaultHistory(email)
    // save the history for this user
    await file.save(JSON.stringify(d), {
      metadata: { contentType: 'application/json' },
    })

    return d
  }
  // TODO: update other places in the backend to use this download instead
  // of a signed url, signed urls are only needed from the frontend
  const history = await file.download()
  return JSON.parse(history.toString())
}

export async function welcomeData(): Promise<{
  welcomeMessageId: string
}> {
  const history = await getHistory()
  return {
    welcomeMessageId: history.messages[history.messages.length - 1].id!,
  }
}

// preparation for a clear history action
export async function removeHistory() {
  const email = retrieveTempEmailFromCookie()
  await deleteFile(historyFileName(email))
}

export async function saveHistory(history: IHistory) {
  const file = await getFile(historyFileName(history.email))
  await file.save(JSON.stringify(history), {
    metadata: { contentType: 'application/json' },
  })
}
