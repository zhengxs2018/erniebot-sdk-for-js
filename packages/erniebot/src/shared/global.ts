import { inNode, inBrowser } from './detection'

export type GlobalObject = Window & typeof globalThis

const fallbackGlobalObject = {}

function resolveGlobalObject<T = GlobalObject>(): T {
  if (typeof globalThis) return globalThis as T
  if (inNode) return global as T
  if (inBrowser) return window as T
  return fallbackGlobalObject as T
}

let globalObject = resolveGlobalObject<GlobalObject>()

/**
 * 兼容小程序等特殊环境
 *
 * @param global - 新的全局对象
 */
export function setGlobalObject(global: any): void {
  if (global === fallbackGlobalObject) return

  globalObject = global
}

/**
 * 辅助函数
 */
export const getGlobalObject = <T = GlobalObject>() => globalObject as T
