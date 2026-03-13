import { NextRequest, NextResponse } from "next/server";
import {
  scoreVenueMatch,
  type ScoringArtistProfile,
  type ScoringVenueData,
  type ScoringOptions,
} from "@/lib/ai/venue-scorer";

// ---------------------------------------------------------------------------
// POST /api/ai/analyze — Score how well a venue matches an artist
// ---------------------------------------------------------------------------

interface AnalyzeRequestBody {
  artist: ScoringArtistProfile;
  venue: ScoringVenueData;
  options?: ScoringOptions;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeRequestBody;

    // Validate required fields
    const validationError = validateAnalyzeRequest(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const score = await scoreVenueMatch(body.artist, body.venue, body.options);

    return NextResponse.json(score);
  } catch (error: unknown) {
    return handleAIError(error);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateAnalyzeRequest(body: AnalyzeRequestBody): string | null {
  if (!body.artist) {
    return "Missing required field: artist";
  }
  if (!body.venue) {
    return "Missing required field: venue";
  }
  if (!body.artist.name || typeof body.artist.name !== "string") {
    return "artist.name is required and must be a string";
  }
  if (
    !body.artist.genres ||
    !Array.isArray(body.artist.genres) ||
    body.artist.genres.length === 0
  ) {
    return "artist.genres is required and must be a non-empty array";
  }
  if (!body.venue.name || typeof body.venue.name !== "string") {
    return "venue.name is required and must be a string";
  }
  if (!body.venue.city || typeof body.venue.city !== "string") {
    return "venue.city is required and must be a string";
  }
  if (!body.venue.country || typeof body.venue.country !== "string") {
    return "venue.country is required and must be a string";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

function handleAIError(error: unknown): NextResponse {
  const status = getErrorStatus(error);
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  if (status === 429) {
    return NextResponse.json(
      { error: "AI service rate limit reached. Please try again in a moment." },
      { status: 429 }
    );
  }

  if (status === 529) {
    return NextResponse.json(
      { error: "AI service is temporarily overloaded. Please try again later." },
      { status: 503 }
    );
  }

  if (status === 401) {
    return NextResponse.json(
      { error: "AI service authentication failed. Check your API key." },
      { status: 500 }
    );
  }

  console.error("[AI Analyze] Error scoring venue:", message);
  return NextResponse.json(
    { error: "Failed to analyze venue match. Please try again." },
    { status: 500 }
  );
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
