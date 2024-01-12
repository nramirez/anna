export const extractKey = (req: Request) => {
    const parts = req.url.split('=')
    const encodedKey = parts.length > 1 ? parts.pop() : null
    if (encodedKey) {
      return decodeURIComponent(encodedKey)
    }
    
    return null
  }
