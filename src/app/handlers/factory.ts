import { getFile } from '@services/files'
import { FileHandler } from './file'
import { PdfHandler } from './pdf'

export const getFileHandler = async (key: string): Promise<FileHandler> => {
  const file = await getFile(key)
  const [exists] = await file.exists()

  if (!exists) {
    throw new Error('File does not exist')
  }

  const contentType = file.metadata.contentType
  if (!contentType) {
    throw new Error('File does not have a content type')
  }

  switch (contentType.split('/').pop()) {
    case 'pdf':
      return new PdfHandler(key, file)
    //  TODO: add support for other file types
    // case 'image':
    //   return new ImageHandler(key, file)
    // case 'epub':
    //   return new EpubHandler(key, file)
    default:
      throw new Error('Unsupported file type')
  }
}
