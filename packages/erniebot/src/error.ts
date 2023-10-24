export class EBError extends Error {}

export class InvalidArgumentError extends EBError {}

export class UnsupportedAPITypeError extends EBError {}

export class APIError extends EBError {
  readonly status: number | undefined
  readonly headers: Headers | undefined
  readonly error: unknown | undefined

  readonly code: string | null | undefined
  readonly param: string | null | undefined
  readonly type: string | undefined

  constructor(
    status: number | undefined,
    error: unknown | undefined,
    message: string | undefined,
    headers: Headers | undefined,
  ) {
    super(`${APIError.makeMessage(status, error, message)}`)
    this.status = status
    this.headers = headers

    const data = error as Record<string, any>
    this.error = data
    this.code = data?.['code']
    this.param = data?.['param']
    this.type = data?.['type']
  }

  private static makeMessage(status: number | undefined, error: any, message: string | undefined) {
    const msg = error?.message
      ? typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error.message)
      : error
      ? JSON.stringify(error)
      : message

    if (status && msg) {
      return `${status} ${msg}`
    }
    if (status) {
      return `${status} status code (no body)`
    }
    if (msg) {
      return msg
    }
    return '(no status code or body)'
  }

  static generate(
    status: number | undefined,
    errorResponse: unknown | undefined,
    message: string | undefined,
    headers: Headers | undefined,
  ) {
    const error = (errorResponse as Record<string, any>)?.['error']

    return new APIError(status, error, message, headers)
  }
}

export class APIUserAbortError extends APIError {
  override readonly status: undefined = undefined

  constructor({ message }: { message?: string } = {}) {
    super(undefined, undefined, message || 'Request was aborted.', undefined)
  }
}

export class APIConnectionError extends APIError {
  override readonly status: undefined = undefined

  constructor({ message, cause }: { message?: string; cause?: Error | undefined }) {
    super(undefined, undefined, message || 'Connection error.', undefined)
    // in some environments the 'cause' property is already declared
    // @ts-ignore
    if (cause) this.cause = cause
  }
}

export class APIConnectionTimeoutError extends APIConnectionError {
  constructor({ message }: { message?: string } = {}) {
    super({ message: message ?? 'Request timed out.' })
  }
}
