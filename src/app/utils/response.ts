/**
 * A utility class for streaming audio responses.
 */
export class StreamingAudioResponse extends Response {
    constructor(res: ReadableStream, init?: ResponseInit) {
      super(res as any, {
        ...init,
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Accept-Ranges': 'bytes',
          ...init?.headers,
        },
      })
    }
  }
