import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/**
 * Returns a singleton Anthropic client instance.
 * Reads ANTHROPIC_API_KEY from environment variables.
 */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is not set. " +
          "Add it to your .env.local file or deployment environment."
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** Model used for cost-efficient operations (pitch generation, scoring). */
export const AI_MODEL = "claude-sonnet-4-5-20241022";

/** Default max tokens for responses. */
export const DEFAULT_MAX_TOKENS = 1024;
