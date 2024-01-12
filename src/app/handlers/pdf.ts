import { FileHandler } from './file'
import { PDFDocumentProxy, getDocument } from 'pdfjs-dist'
import { GlobalWorkerOptions } from 'pdfjs-dist'
import worker from 'pdfjs-dist/build/pdf.worker.min.js'
GlobalWorkerOptions.workerSrc = worker

export class PdfHandler extends FileHandler {
  instructionMessage(numPages: string, chapters: string | null): string {
    const text = `We processed the PDF and extracted the outline and number of pages. Ask the user in which page they want to start reading. The document has: ${numPages} pages`
    if (!chapters) {
      return text
    }

    return text + ` and ${chapters} chapters.`
  }

  getPdf = async (): Promise<PDFDocumentProxy> => {
    const [buffer] = await this.file.download()
    const arrayBuffer = Uint8Array.from(buffer).buffer
    return await getDocument(arrayBuffer).promise
  }

  async process(): Promise<string> {
    const pdf = await this.getPdf()
    const outline = await pdf.getOutline()

    let meta: {
      [key: string]: string
    } = {
      numPages: pdf.numPages.toString(),
    }
    if (outline) {
      meta['chapters'] = outline.map((item) => item.title).length.toString()
    }
    this.file.setMetadata({
      // maybe the title and author should be in the metadata?
      metadata: meta,
    })

    return this.instructionMessage(meta.numPages, meta.chapters)
  }

  fileHasValidMetadata(pageNumber: number): void {
    if (!this.file.metadata?.metadata) {
      throw new Error('No metadata for this document')
    }
    const metadata = this.file.metadata.metadata
    if (!metadata.numPages) {
      throw new Error('No pages for this document')
    }
    const numPages = parseInt(metadata.numPages)
    // let's check that this page is within bounds
    if (pageNumber > numPages) {
      throw new Error('Page number is out of bounds')
    }
  }

  async getTextFromPage(pageNumber: number): Promise<string> {
    this.fileHasValidMetadata(pageNumber)
    // Think about caching this, although the LLM will likely call this once per page
    // and otherwise access that text from the history
    const pdf = await this.getPdf()
    const page = await pdf.getPage(pageNumber)
    // inform the LLM that this is the text extracted from the page
    const textContent = await page.getTextContent()
    const rawText = textContent.items.map(
      (item: any) => item.str + (item.hasEOL ? '\n' : ''),
    )
    if (rawText.findIndex((text) => text.trim() !== '') === -1) {
      // make sure to inform the user whether this page has any content
      return 'This page has no content'
    }

    return `This is the text extracted from page ${pageNumber} :\n ${rawText.join(
      '',
    )}`
  }
}
