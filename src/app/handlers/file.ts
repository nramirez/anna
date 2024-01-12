import { File } from '@google-cloud/storage'

export abstract class FileHandler {
  key: string
  file: File
  constructor(key: string, file: File) {
    if (!key) {
      throw new Error('FileHandler requires a key')
    }
    if (!file) {
      throw new Error('FileHandler requires a file')
    }
    this.key = key
    this.file = file
  }

  // TODO: Enforce each handler to return the initialization text message
  // with instructions of what happens next
  abstract process(): Promise<string>
  abstract getTextFromPage(pageNumber: number): Promise<string>
}
