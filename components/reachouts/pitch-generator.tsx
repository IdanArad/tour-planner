"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PitchGeneratorProps {
  reachoutId: string;
  venueName: string;
  venueCity?: string;
  venueCountry?: string;
  artistName: string;
  artistGenre?: string;
  onClose: () => void;
}

export function PitchGenerator({
  venueName,
  venueCity,
  venueCountry,
  artistName,
  artistGenre,
  onClose,
}: PitchGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist: {
            name: artistName,
            genres: artistGenre ? [artistGenre] : [],
            bio: "",
          },
          venue: {
            name: venueName,
            city: venueCity ?? "",
            country: venueCountry ?? "",
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setPitch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate pitch");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!pitch) return;
    const text = `Subject: ${pitch.subject}\n\n${pitch.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-2xl border border-border/50 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">AI Pitch Generator</h3>
            <p className="text-sm text-muted-foreground">
              Generate a pitch email for {venueName}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent/50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Artist: <strong className="text-foreground">{artistName}</strong></span>
            {artistGenre && <span>Genre: <strong className="text-foreground">{artistGenre}</strong></span>}
            <span>Venue: <strong className="text-foreground">{venueName}</strong></span>
            {venueCity && <span>{venueCity}{venueCountry ? `, ${venueCountry}` : ""}</span>}
          </div>
        </div>

        {!pitch && !loading && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleGenerate}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Pitch Email
            </Button>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            <p className="text-sm text-muted-foreground">Generating personalized pitch...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {pitch && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <div className="mt-1 rounded-lg border border-border/50 bg-background/50 p-3 text-sm">
                {pitch.subject}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Body</label>
              <div className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-border/50 bg-background/50 p-3 text-sm whitespace-pre-wrap">
                {pitch.body}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" size="sm">
                {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-400" /> : <Copy className="mr-1.5 h-4 w-4" />}
                {copied ? "Copied" : "Copy to Clipboard"}
              </Button>
              <Button onClick={handleGenerate} variant="outline" size="sm" disabled={loading}>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
