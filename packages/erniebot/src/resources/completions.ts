
/**
 * Usage statistics for the completion request.
 */
export interface CompletionUsage {
  /**
   * Number of tokens in the generated completion.
   */
  completion_tokens: number

  /**
   * Number of tokens in the prompt.
   */
  prompt_tokens: number

  /**
   * Total number of tokens used in the request (prompt + completion).
   */
  total_tokens: number
}
