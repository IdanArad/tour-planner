import { getAnthropicClient, AI_MODEL, DEFAULT_MAX_TOKENS } from "@/lib/ai/client";
import { PITCH_SYSTEM_PROMPT, buildPitchUserPrompt } from "@/lib/ai/prompts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArtistProfile {
  name: string;
  genres: string[];
  bio: string;
  hometown?: string;
  monthlyListeners?: number;
}

export interface VenueData {
  name: string;
  city: string;
  country: string;
  capacity?: number;
  genres?: string[];
  bookingContact?: string;
}

export interface PitchOptions {
  tourName?: string;
  targetDates?: string;
  additionalContext?: string;
}

export interface GeneratedPitch {
  subject: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Pitch Generation
// ---------------------------------------------------------------------------

/**
 * Generates a personalized pitch email for an artist to send to a venue.
 * Returns a structured object with subject and body.
 *
 * @throws Error if the API call fails or the response cannot be parsed
 */
export async function generatePitch(
  artist: ArtistProfile,
  venue: VenueData,
  options: PitchOptions = {}
): Promise<GeneratedPitch> {
  const client = getAnthropicClient();

  const userPrompt = buildPitchUserPrompt({
    artistName: artist.name,
    artistGenres: artist.genres,
    artistBio: artist.bio,
    artistHometown: artist.hometown,
    artistMonthlyListeners: artist.monthlyListeners,
    venueName: venue.name,
    venueCity: venue.city,
    venueCountry: venue.country,
    venueCapacity: venue.capacity,
    venueGenres: venue.genres,
    venueBookingContact: venue.bookingContact,
    tourName: options.tourName,
    targetDates: options.targetDates,
    additionalContext: options.additionalContext,
  });

  const message = await callWithRetry(() =>
    client.messages.create({
      model: AI_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      messages: [{ role: "user", content: userPrompt }],
      system: PITCH_SYSTEM_PROMPT,
    })
  );

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const parsed = parseJsonResponse<GeneratedPitch>(textBlock.text);

  if (!parsed.subject || !parsed.body) {
    throw new Error(
      "Invalid pitch response: missing subject or body fields"
    );
  }

  return {
    subject: parsed.subject,
    body: parsed.body,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses a JSON string from Claude's response, stripping markdown code fences
 * if present.
 */
function parseJsonResponse<T>(text: string): T {
  // Strip markdown code fences that Claude sometimes wraps around JSON
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
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

      // Exponential backoff: 1s, 2s, 4s
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
