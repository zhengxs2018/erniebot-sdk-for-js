import { inBrowser, inNode } from './env'

const fallbackGlobalObject = {}

function resolveGlobalObject<T = Window & typeof globalThis>(): T {
  if (typeof globalThis) return globalThis as T
  if (inNode) return global as T
  if (inBrowser) return window as T
  return fallbackGlobalObject as T
}

export const globalObject = resolveGlobalObject<Window & typeof globalThis>()

/**
 * 辅助函数
 */
export const getGlobalObject = <T>() => globalObject as T

export function debug(action: string, ...args: any[]) {
  if (inNode && process.env['DEBUG'] === 'true') {
    console.log(`ErnieBot:DEBUG:${action}`, ...args)
  }
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
