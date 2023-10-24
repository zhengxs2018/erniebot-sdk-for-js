import type { APIResponseProps, MaybePromise } from '../interfaces'

/**
 * A subclass of `Promise` providing additional helper methods
 * for interacting with the SDK.
 */
export class APIPromise<T> extends Promise<T> {
  private parsedPromise: Promise<T> | undefined

  constructor(
    private responsePromise: Promise<APIResponseProps>,
    private parseResponse: (props: APIResponseProps) => MaybePromise<T>,
  ) {
    super((resolve) => {
      // this is maybe a bit weird but this has to be a no-op to not implicitly
      // parse the response body; instead .then, .catch, .finally are overridden
      // to parse the response
      resolve(null as any)
    })
  }

  _thenUnwrap<U>(transform: (data: T) => U): APIPromise<U> {
    return new APIPromise(this.responsePromise, async (props) => transform(await this.parseResponse(props)))
  }

  asResponse(): Promise<Response> {
    return this.responsePromise.then((p) => p.response)
  }

  async withResponse(): Promise<{ data: T; response: Response }> {
    const [data, response] = await Promise.all([this.parse(), this.asResponse()])
    return { data, response }
  }

  private parse(): Promise<T> {
    if (!this.parsedPromise) {
      this.parsedPromise = this.responsePromise.then(this.parseResponse)
    }
    return this.parsedPromise
  }

  override then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.parse().then(onfulfilled, onrejected)
  }

  override catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<T | TResult> {
    return this.parse().catch(onrejected)
  }

  override finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.parse().finally(onfinally)
  }
}
