// ---------------------------------------------------------------------------
// System prompts and prompt templates for Claude API calls
// ---------------------------------------------------------------------------

// -- Pitch Email Generation --------------------------------------------------

export const PITCH_SYSTEM_PROMPT = `You are an experienced music booking agent who writes compelling, personalized pitch emails to venues on behalf of touring artists.

Your emails should:
- Be concise and professional (under 250 words for the body)
- Lead with why the artist is a good fit for THIS specific venue
- Reference the venue's genre focus, capacity, and location when relevant
- Include a clear call to action (available dates, request for hold, etc.)
- Sound human and warm — not like a mass-blast template
- Never use excessive exclamation marks or hype language
- Avoid generic phrases like "I hope this email finds you well"

Output ONLY valid JSON with two fields:
- "subject": the email subject line (under 80 characters)
- "body": the email body as plain text (use \\n for line breaks)

Do not include any text outside the JSON object.`;

export function buildPitchUserPrompt(params: {
  artistName: string;
  artistGenres: string[];
  artistBio: string;
  artistHometown?: string;
  artistMonthlyListeners?: number;
  venueName: string;
  venueCity: string;
  venueCountry: string;
  venueCapacity?: number;
  venueGenres?: string[];
  venueBookingContact?: string;
  tourName?: string;
  targetDates?: string;
  additionalContext?: string;
}): string {
  const lines: string[] = [
    `Generate a pitch email for the following artist and venue.`,
    ``,
    `## Artist`,
    `- Name: ${params.artistName}`,
    `- Genres: ${params.artistGenres.join(", ")}`,
    `- Bio: ${params.artistBio}`,
  ];

  if (params.artistHometown) {
    lines.push(`- Hometown: ${params.artistHometown}`);
  }
  if (params.artistMonthlyListeners) {
    lines.push(
      `- Monthly listeners: ${params.artistMonthlyListeners.toLocaleString()}`
    );
  }

  lines.push(``, `## Venue`);
  lines.push(`- Name: ${params.venueName}`);
  lines.push(`- Location: ${params.venueCity}, ${params.venueCountry}`);

  if (params.venueCapacity) {
    lines.push(`- Capacity: ${params.venueCapacity}`);
  }
  if (params.venueGenres && params.venueGenres.length > 0) {
    lines.push(`- Genres: ${params.venueGenres.join(", ")}`);
  }
  if (params.venueBookingContact) {
    lines.push(`- Booking contact: ${params.venueBookingContact}`);
  }

  if (params.tourName || params.targetDates) {
    lines.push(``, `## Tour Details`);
    if (params.tourName) lines.push(`- Tour: ${params.tourName}`);
    if (params.targetDates) lines.push(`- Target dates: ${params.targetDates}`);
  }

  if (params.additionalContext) {
    lines.push(``, `## Additional Context`, params.additionalContext);
  }

  return lines.join("\n");
}

// -- Venue Scoring -----------------------------------------------------------

export const VENUE_SCORING_SYSTEM_PROMPT = `You are an AI assistant that evaluates how well a music venue matches an artist for booking purposes.

Score the match from 0 to 100 based on three weighted factors:
1. **Genre Match (40%)**: How well do the venue's typical genres align with the artist's genres?
2. **Capacity Fit (30%)**: Is the venue's capacity appropriate for the artist's draw? Too small is better than too large (a sold-out small room beats a half-empty big one).
3. **Location Relevance (30%)**: Is the venue in a target region? Consider proximity to the artist's hometown or tour route.

Output ONLY valid JSON with these fields:
- "score": number from 0 to 100
- "genreScore": number from 0 to 100
- "capacityScore": number from 0 to 100
- "locationScore": number from 0 to 100
- "reasoning": a brief 1-3 sentence explanation of the overall score
- "strengths": array of 1-3 short strings highlighting positives
- "concerns": array of 0-3 short strings highlighting potential issues

Do not include any text outside the JSON object.`;

export function buildVenueScoringPrompt(params: {
  artistName: string;
  artistGenres: string[];
  artistHometown?: string;
  artistMonthlyListeners?: number;
  artistDrawEstimate?: Record<string, number>;
  venueName: string;
  venueCity: string;
  venueCountry: string;
  venueCapacity?: number;
  venueGenres?: string[];
  venueType?: string;
  targetRegions?: string[];
  tourRoute?: string[];
}): string {
  const lines: string[] = [
    `Evaluate the match between this artist and venue.`,
    ``,
    `## Artist`,
    `- Name: ${params.artistName}`,
    `- Genres: ${params.artistGenres.join(", ")}`,
  ];

  if (params.artistHometown) {
    lines.push(`- Hometown: ${params.artistHometown}`);
  }
  if (params.artistMonthlyListeners) {
    lines.push(
      `- Monthly listeners: ${params.artistMonthlyListeners.toLocaleString()}`
    );
  }
  if (params.artistDrawEstimate) {
    const draws = Object.entries(params.artistDrawEstimate)
      .map(([region, count]) => `${region}: ~${count}`)
      .join(", ");
    lines.push(`- Estimated draw: ${draws}`);
  }

  lines.push(``, `## Venue`);
  lines.push(`- Name: ${params.venueName}`);
  lines.push(`- Location: ${params.venueCity}, ${params.venueCountry}`);

  if (params.venueCapacity) {
    lines.push(`- Capacity: ${params.venueCapacity}`);
  }
  if (params.venueGenres && params.venueGenres.length > 0) {
    lines.push(`- Typical genres: ${params.venueGenres.join(", ")}`);
  }
  if (params.venueType) {
    lines.push(`- Venue type: ${params.venueType}`);
  }

  if (params.targetRegions && params.targetRegions.length > 0) {
    lines.push(``, `## Tour Context`);
    lines.push(`- Target regions: ${params.targetRegions.join(", ")}`);
    if (params.tourRoute && params.tourRoute.length > 0) {
      lines.push(`- Planned route: ${params.tourRoute.join(" → ")}`);
    }
  }

  return lines.join("\n");
}

// -- Reply Parsing -----------------------------------------------------------

export const REPLY_PARSING_SYSTEM_PROMPT = `You are an AI assistant that categorizes email replies from venue bookers and promoters.

Analyze the reply and determine the intent. Classify it as one of:
- "interested" — venue wants to proceed (hold date, discuss terms, confirm show)
- "declined" — venue is not interested or unavailable
- "needs_info" — venue wants more information before deciding

Output ONLY valid JSON with these fields:
- "intent": one of "interested", "declined", "needs_info"
- "confidence": number from 0 to 1 indicating confidence in the classification
- "summary": a one-sentence summary of the reply
- "suggestedAction": a brief suggested next step for the booking agent
- "keyDetails": object with optional fields:
  - "proposedDate": string or null (if a date was mentioned)
  - "guarantee": string or null (if a fee/guarantee was mentioned)
  - "questionsAsked": array of strings (questions the venue asked)

Do not include any text outside the JSON object.`;

export function buildReplyParsingPrompt(params: {
  originalSubject: string;
  originalBody: string;
  replyBody: string;
  venueName?: string;
  contactName?: string;
}): string {
  const lines: string[] = [
    `Analyze this email reply from a venue.`,
    ``,
    `## Original Email`,
    `Subject: ${params.originalSubject}`,
    `Body:`,
    params.originalBody,
    ``,
    `## Reply`,
  ];

  if (params.venueName || params.contactName) {
    const from = [params.contactName, params.venueName]
      .filter(Boolean)
      .join(" at ");
    lines.push(`From: ${from}`);
  }

  lines.push(`Body:`, params.replyBody);

  return lines.join("\n");
}
