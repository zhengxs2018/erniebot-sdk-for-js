import { inNode, inDeno } from './detection'
import { getGlobalObject } from './global'

declare const Deno: any

export const readEnv = (env: string): string | undefined => {
  if (inNode) return process.env[env] ?? undefined
  if (inDeno) return Deno.env.get(env)

  return getGlobalObject<Record<string, string | undefined>>()[env]
}

export function debuglog(name: string) {
  const verbose = readEnv('DEBUG') === 'true'

  return function debug(action: string, ...args: any[]) {
    if (!verbose) return
    console.log('[%s]:[%s]', name, action, ...args)
  }
}

export async function sha256(data: string, secret: string): Promise<string> {
  const { crypto, btoa, TextEncoder, Uint8Array } = getGlobalObject()

  // TODO fix type
  if (inNode && typeof (crypto as any).createHmac === 'function') {
    const sha256Hmac = (crypto as any).createHmac('sha256', secret)
    sha256Hmac.update(data)
    return sha256Hmac.digest('hex')
  }

  const { importKey, sign } = crypto.subtle

  const enc = new TextEncoder()
  const algorithm = { name: 'HMAC', hash: 'SHA-256' }

  const key = await importKey('raw', enc.encode(secret), algorithm, false, ['sign', 'verify'])
  const signature = await sign(algorithm.name, key, enc.encode(data))

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}
