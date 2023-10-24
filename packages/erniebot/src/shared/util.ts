const kEscapedMap: Record<string, string> = {
  '!': '%21',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
}

export function normalize(string: string, encodingSlash?: boolean): string {
  let result = encodeURIComponent(string)

  result = result.replace(/[!'\(\)\*]/g, function ($1) {
    return kEscapedMap[$1]
  })

  if (encodingSlash === false) {
    result = result.replace(/%2F/gi, '/')
  }

  return result
}

export const castToError = (err: any): Error => {
  if (err instanceof Error) return err
  return new Error(err)
}

export const safeJSON = (text: string) => {
  try {
    return JSON.parse(text)
  } catch (err) {
    return undefined
  }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
