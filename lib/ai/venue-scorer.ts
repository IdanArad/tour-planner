import { getAnthropicClient, AI_MODEL, DEFAULT_MAX_TOKENS } from "@/lib/ai/client";
import {
  VENUE_SCORING_SYSTEM_PROMPT,
  buildVenueScoringPrompt,
  REPLY_PARSING_SYSTEM_PROMPT,
  buildReplyParsingPrompt,
} from "@/lib/ai/prompts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoringArtistProfile {
  name: string;
  genres: string[];
  hometown?: string;
  monthlyListeners?: number;
  drawEstimate?: Record<string, number>;
}

export interface ScoringVenueData {
  name: string;
  city: string;
  country: string;
  capacity?: number;
  genres?: string[];
  venueType?: string;
}

export interface ScoringOptions {
  targetRegions?: string[];
  tourRoute?: string[];
}

export interface VenueScore {
  score: number;
  genreScore: number;
  capacityScore: number;
  locationScore: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
}

export interface ReplyParsingInput {
  originalSubject: string;
  originalBody: string;
  replyBody: string;
  venueName?: string;
  contactName?: string;
}

export type ReplyIntent = "interested" | "declined" | "needs_info";

export interface ParsedReply {
  intent: ReplyIntent;
  confidence: number;
  summary: string;
  suggestedAction: string;
  keyDetails: {
    proposedDate?: string | null;
    guarantee?: string | null;
    questionsAsked?: string[];
  };
}

// ---------------------------------------------------------------------------
// Venue Scoring
// ---------------------------------------------------------------------------

/**
 * Scores how well a venue matches an artist (0-100) using Claude.
 * Returns a detailed score breakdown with reasoning.
 *
 * @throws Error if the API call fails or the response cannot be parsed
 */
export async function scoreVenueMatch(
  artist: ScoringArtistProfile,
  venue: ScoringVenueData,
  options: ScoringOptions = {}
): Promise<VenueScore> {
  const client = getAnthropicClient();

  const userPrompt = buildVenueScoringPrompt({
    artistName: artist.name,
    artistGenres: artist.genres,
    artistHometown: artist.hometown,
    artistMonthlyListeners: artist.monthlyListeners,
    artistDrawEstimate: artist.drawEstimate,
    venueName: venue.name,
    venueCity: venue.city,
    venueCountry: venue.country,
    venueCapacity: venue.capacity,
    venueGenres: venue.genres,
    venueType: venue.venueType,
    targetRegions: options.targetRegions,
    tourRoute: options.tourRoute,
  });

  const message = await callWithRetry(() =>
    client.messages.create({
      model: AI_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      messages: [{ role: "user", content: userPrompt }],
      system: VENUE_SCORING_SYSTEM_PROMPT,
    })
  );

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const parsed = parseJsonResponse<VenueScore>(textBlock.text);

  // Validate the response has all required fields
  if (
    typeof parsed.score !== "number" ||
    typeof parsed.genreScore !== "number" ||
    typeof parsed.capacityScore !== "number" ||
    typeof parsed.locationScore !== "number" ||
    typeof parsed.reasoning !== "string"
  ) {
    throw new Error("Invalid venue score response: missing required fields");
  }

  // Clamp scores to 0-100 range
  return {
    score: clamp(parsed.score, 0, 100),
    genreScore: clamp(parsed.genreScore, 0, 100),
    capacityScore: clamp(parsed.capacityScore, 0, 100),
    locationScore: clamp(parsed.locationScore, 0, 100),
    reasoning: parsed.reasoning,
    strengths: parsed.strengths ?? [],
    concerns: parsed.concerns ?? [],
  };
}

// ---------------------------------------------------------------------------
// Reply Parsing
// ---------------------------------------------------------------------------

/**
 * Parses a venue's email reply to categorize their response intent.
 *
 * @throws Error if the API call fails or the response cannot be parsed
 */
export async function parseReply(
  input: ReplyParsingInput
): Promise<ParsedReply> {
  const client = getAnthropicClient();

  const userPrompt = buildReplyParsingPrompt({
    originalSubject: input.originalSubject,
    originalBody: input.originalBody,
    replyBody: input.replyBody,
    venueName: input.venueName,
    contactName: input.contactName,
  });

  const message = await callWithRetry(() =>
    client.messages.create({
      model: AI_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      messages: [{ role: "user", content: userPrompt }],
      system: REPLY_PARSING_SYSTEM_PROMPT,
    })
  );

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const parsed = parseJsonResponse<ParsedReply>(textBlock.text);

  const validIntents: ReplyIntent[] = ["interested", "declined", "needs_info"];
  if (!validIntents.includes(parsed.intent)) {
    throw new Error(
      `Invalid reply intent: "${parsed.intent}". Expected one of: ${validIntents.join(", ")}`
    );
  }

  return {
    intent: parsed.intent,
    confidence: clamp(parsed.confidence ?? 0.5, 0, 1),
    summary: parsed.summary ?? "",
    suggestedAction: parsed.suggestedAction ?? "",
    keyDetails: {
      proposedDate: parsed.keyDetails?.proposedDate ?? null,
      guarantee: parsed.keyDetails?.guarantee ?? null,
      questionsAsked: parsed.keyDetails?.questionsAsked ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Parses a JSON string from Claude's response, stripping markdown code fences
 * if present.
 */
function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Failed to parse JSON from Claude response: ${cleaned.slice(0, 200)}`
    );
  }
}

/**
 * Retries an API call with exponential backoff on rate-limit (429) or
 * overloaded (529) errors.
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      const status = getErrorStatus(error);
      const isRetryable = status === 429 || status === 529;

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delayMs = Math.pow(2, attempt) * 1000;
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function getErrorStatus(error: unknown): number | undefined {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
