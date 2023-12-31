import { APIRequestOptions } from '../../interfaces'
import { APIPromise, APIStream } from '../../client'

import { APIResource } from '../../resource'
import { CompletionUsage } from '../completions'

export class Completions extends APIResource {
  /**
   * Creates a model response for the given chat conversation.
   */
  create(body: ChatCompletionCreateParamsNonStreaming, options?: APIRequestOptions): APIPromise<ChatCompletion>
  create(
    body: ChatCompletionCreateParamsStreaming,
    options?: APIRequestOptions,
  ): APIPromise<APIStream<ChatCompletionChunk>>
  create(
    body: ChatCompletionCreateParamsBase,
    options?: APIRequestOptions,
  ): APIPromise<APIStream<ChatCompletionChunk> | ChatCompletion>
  create(
    body: ChatCompletionCreateParams,
    options?: APIRequestOptions,
  ): APIPromise<ChatCompletion> | APIPromise<APIStream<ChatCompletionChunk>> {
    return this.post('/chat/completions', { body, ...options, stream: body.stream ?? false }) as
      | APIPromise<ChatCompletion>
      | APIPromise<APIStream<ChatCompletionChunk>>
  }
}

/**
 * Represents a chat completion response returned by model, based on the provided
 * input.
 */
export interface ChatCompletion {
  /**
   * A unique identifier for the chat completion.
   */
  id: string

  /**
   * The object type, which is always `chat.completion`.
   */
  object: string

  result: string

  need_clear_history: boolean

  is_truncated: boolean

  /**
   * Usage statistics for the completion request.
   */
  usage: CompletionUsage

  /**
   * The Unix timestamp (in seconds) of when the chat completion was created.
   */
  created: number

  /**
   * The name and arguments of a function that should be called, as generated by the
   * model.
   */
  function_call?: ChatCompletion.FunctionCall
}

export namespace ChatCompletion {
  /**
   * The name and arguments of a function that should be called, as generated by the
   * model.
   */
  export interface FunctionCall {
    /**
     * The name of the function to call.
     */
    name?: string

    /**
     * The arguments to call the function with, as generated by the model in JSON
     * format. Note that the model does not always generate valid JSON, and may
     * hallucinate parameters not defined by your function schema. Validate the
     * arguments in your code before calling your function.
     */
    arguments?: string

    thoughts?: string
  }
}

/**
 * Represents a streamed chunk of a chat completion response returned by model,
 * based on the provided input.
 */
export interface ChatCompletionChunk {
  /**
   * A unique identifier for the chat completion. Each chunk has the same ID.
   */
  id: string

  result: string

  /**
   * Usage statistics for the completion request.
   */
  usage: CompletionUsage

  sentence_id: string

  is_end: boolean

  is_truncated: boolean

  need_clear_history: boolean

  /**
   * The Unix timestamp (in seconds) of when the chat completion was created. Each
   * chunk has the same timestamp.
   */
  created: number

  /**
   * The object type, which is always `chat.completion.chunk`.
   */
  object: string

  /**
   * The name and arguments of a function that should be called, as generated by the
   * model.
   */
  function_call?: ChatCompletion.FunctionCall
}

/**
 * A chat completion message generated by the model.
 */
export interface ChatCompletionMessage {
  /**
   * The contents of the message.
   */
  content: string | null

  /**
   * The role of the author of this message.
   */
  role: ChatCompletionRole

  /**
   * The name and arguments of a function that should be called, as generated by the
   * model.
   */
  function_call?: ChatCompletionMessage.FunctionCall
}

export namespace ChatCompletionMessage {
  /**
   * The name and arguments of a function that should be called, as generated by the
   * model.
   */
  export interface FunctionCall {
    arguments: string
    name: string
  }
}

export interface ChatCompletionMessageParam {
  /**
   * The contents of the message. `content` is required for all messages, and may be
   * null for assistant messages with function calls.
   */
  content: string | null

  /**
   * The role of the messages author. One of `system`, `user`, `assistant`, or
   * `function`.
   */
  role: 'system' | 'user' | 'assistant' | 'function'

  /**
   * The name and arguments of a function that should be called, as generated by the
   * model.
   */
  function_call?: ChatCompletionMessageParam.FunctionCall

  /**
   * The name of the author of this message. `name` is required if role is
   * `function`, and it should be the name of the function whose response is in the
   * `content`. May contain a-z, A-Z, 0-9, and underscores, with a maximum length of
   * 64 characters.
   */
  name?: string
}

export namespace ChatCompletionMessageParam {
  /**
   * The name and arguments of a function that should be called, as generated by the
   * model.
   */
  export interface FunctionCall {
    /**
     * The arguments to call the function with, as generated by the model in JSON
     * format. Note that the model does not always generate valid JSON, and may
     * hallucinate parameters not defined by your function schema. Validate the
     * arguments in your code before calling your function.
     */
    arguments: string

    /**
     * The name of the function to call.
     */
    name: string
  }
}

/**
 * The role of the author of this message.
 */
export type ChatCompletionRole = 'system' | 'user' | 'assistant' | 'function'

export type ChatCompletionCreateParams = ChatCompletionCreateParamsNonStreaming | ChatCompletionCreateParamsStreaming

export interface ChatCompletionCreateParamsBase {
  messages: Array<ChatCompletionMessageParam>
  model: (string & NonNullable<unknown>) | 'ernie-bot' | 'ernie-bot-turbo' | 'ernie-bot-4'
  frequency_penalty?: number | null
  function_call?: 'none' | 'auto' | ChatCompletionCreateParams.FunctionCallOption
  functions?: Array<ChatCompletionCreateParams.Function>
  max_tokens?: number | null
  n?: number | null
  presence_penalty?: number | null
  stop?: string | null | Array<string>
  stream?: boolean | null
  temperature?: number | null
  top_p?: number | null
  user?: string
}

export namespace ChatCompletionCreateParams {
  export interface FunctionCallOption {
    name: string
  }

  export interface Function {
    name: string
    parameters: Record<string, unknown>
    description?: string
    responses?: Record<string, unknown>
  }

  export interface ChatCompletionCreateParamsNonStreaming extends ChatCompletionCreateParamsBase {
    stream?: false | null
  }

  export interface ChatCompletionCreateParamsStreaming extends ChatCompletionCreateParamsBase {
    stream: true
  }
}

export type ChatCompletionCreateParamsNonStreaming = ChatCompletionCreateParams.ChatCompletionCreateParamsNonStreaming

export type ChatCompletionCreateParamsStreaming = ChatCompletionCreateParams.ChatCompletionCreateParamsStreaming
