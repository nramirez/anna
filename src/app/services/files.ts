'use server'

import { Storage } from '@google-cloud/storage'
import { v4 } from 'uuid'
import {
  FilesPath,
  generateSpeechHashKey as generateSpeechHashPath,
} from '@models/history'

if (!process.env.GOOGLE_SERVICE_KEY) {
  throw new Error('GOOGLE_SERVICE_KEY not set')
}
if (!process.env.GOOGLE_BUCKET_NAME) {
  throw new Error('GOOGLE_BUCKET_NAME not set')
}

const credential = JSON.parse(
  Buffer.from(process.env.GOOGLE_SERVICE_KEY, 'base64').toString(),
)
const storage = new Storage({
  projectId: credential.project_id,
  credentials: {
    client_email: credential.client_email,
    private_key: credential.private_key,
  },
})
const bucket = storage.bucket(process.env.GOOGLE_BUCKET_NAME)

export async function createFileUploadUrl(
  fileType: string,
): Promise<[string, string]> {
  const key = FilesPath + v4()

  return createPresignedUrl(fileType, key)
}

// Create a presigned URL for file upload
export async function createPresignedUrl(
  fileType: string,
  key?: string,
): Promise<[string, string]> {
  key = key || v4()
  const [url] = await bucket.file(key).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 30 * 60 * 1000, // 30 minutes
    contentType: fileType,
  })
  return [url, key]
}

// Create a presigned URL for file download
export async function getSignedUrlPromise(key: string): Promise<string> {
  const [url] = await bucket.file(key).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 30 * 60 * 1000, // 30 minutes
  })
  return url
}

export async function setMetadata(
  filename: string,
  newMetadata: {
    [key: string]: string
  },
) {
  const file = bucket.file(filename)
  await file.setMetadata({
    metadata: newMetadata, // New metadata
  })
}

type CustomMetadata = {
  [key: string]: string
}
export async function getMetadata(key: string) {
  const file = bucket.file(key)
  const [exists] = await file.exists()
  if (!exists) {
    return null
  }
  const [metadata] = await file.getMetadata()
  return metadata.metadata as CustomMetadata
}

export async function uploadFile(buffer: Buffer, fileName: string) {
  const file = bucket.file(fileName)

  await file.save(buffer, {
    metadata: { contentType: 'audio/mp3' },
  })
}

export async function createUploadStream(fileName: string) {
  const file = bucket.file(fileName)
  const stream = file.createWriteStream({
    metadata: { contentType: 'audio/mp3' },
  })
  return stream
}

export async function getFile(fileName: string) {
  const file = bucket.file(fileName)
  return file
}

export async function deleteFile(fileName: string) {
  const file = bucket.file(fileName)
  await file.delete()
}

type SpeechFileGcpResponse = {
  key: string
  exists: boolean
}

export const getSpeechFileFromStorage = async (
  text: string,
): Promise<SpeechFileGcpResponse> => {
  const hashKey = generateSpeechHashPath(text)
  // check if the file exists
  const file = bucket.file(hashKey)
  const [exists] = await file.exists()

  return {
    key: hashKey,
    exists: exists,
  }
}
