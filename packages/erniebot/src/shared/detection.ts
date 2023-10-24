declare const Deno: any

/**
 * 是否 NodeJS 环境
 */
export const inNode =
  Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]'

// TODO fix type
export const inDeno = !inNode && typeof Deno !== 'undefined'

/**
 * 是否运行在浏览器中
 */
export const inBrowser = !(inNode || inDeno) && typeof window !== 'undefined'
