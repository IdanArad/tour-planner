import { NextRequest, NextResponse } from "next/server";
import {
  generatePitch,
  type ArtistProfile,
  type VenueData,
  type PitchOptions,
} from "@/lib/ai/pitch-generator";

// ---------------------------------------------------------------------------
// POST /api/ai/pitch — Generate a personalized pitch email
// ---------------------------------------------------------------------------

interface PitchRequestBody {
  artist: ArtistProfile;
  venue: VenueData;
  options?: PitchOptions;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PitchRequestBody;

    // Validate required fields
    const validationError = validatePitchRequest(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const pitch = await generatePitch(body.artist, body.venue, body.options);

    return NextResponse.json(pitch);
  } catch (error: unknown) {
    return handleAIError(error);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validatePitchRequest(body: PitchRequestBody): string | null {
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
  if (!body.artist.bio || typeof body.artist.bio !== "string") {
    return "artist.bio is required and must be a string";
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

  // Rate limit — pass through the 429
  if (status === 429) {
    return NextResponse.json(
      { error: "AI service rate limit reached. Please try again in a moment." },
      { status: 429 }
    );
  }

  // Overloaded
  if (status === 529) {
    return NextResponse.json(
      { error: "AI service is temporarily overloaded. Please try again later." },
      { status: 503 }
    );
  }

  // Auth error
  if (status === 401) {
    return NextResponse.json(
      { error: "AI service authentication failed. Check your API key." },
      { status: 500 }
    );
  }

  // Generic server error
  console.error("[AI Pitch] Error generating pitch:", message);
  return NextResponse.json(
    { error: "Failed to generate pitch email. Please try again." },
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
