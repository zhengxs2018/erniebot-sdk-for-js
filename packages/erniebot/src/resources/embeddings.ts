import { APIPromise } from '../client'
import { APIRequestOptions } from '../interfaces'

import { APIResource } from '../resource'

export class Embeddings extends APIResource {
  create(body: EmbeddingCreateParams, options?: APIRequestOptions): APIPromise<CreateEmbeddingResponse> {
    return this.post('/embeddings', { body, ...options })
  }
}

export interface CreateEmbeddingResponse {
  data: Array<Embedding>

  model: (string & NonNullable<unknown>) | 'ernie-text-embedding'

  object: string

  usage: CreateEmbeddingResponse.Usage
}

export namespace CreateEmbeddingResponse {
  export interface Usage {
    prompt_tokens: number

    total_tokens: number
  }
}

export interface Embedding {
  embedding: Array<number>

  index: number

  object: string
}

export interface EmbeddingCreateParams {
  input: string | Array<string> | Array<number> | Array<Array<number>>

  model: string
}
