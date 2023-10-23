import { inNode, inDeno } from './env'
import { getGlobalObject } from './util'

declare const Deno: any

export const readEnv = (env: string): string | undefined => {
  if (inNode) return process.env[env] ?? undefined
  if (inDeno) return Deno.env.get(env)

  return getGlobalObject<Record<string, string | undefined>>()[env]
}
