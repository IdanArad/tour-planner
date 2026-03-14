"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { addArtist } from "@/lib/actions/artists";
import { updateArtist } from "@/lib/actions/artists";

export default function SettingsPage() {
  const { state, dispatch, loading } = useStore();
  const artist = state.artist;
  const isNew = !artist.id;

  const [name, setName] = useState(artist.name === "No Artist" ? "" : artist.name);
  const [genre, setGenre] = useState(artist.genre ?? "");
  const [bio, setBio] = useState(artist.bio ?? "");
  const [contactEmail, setContactEmail] = useState(artist.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(artist.contactPhone ?? "");
  const [spotifyUrl, setSpotifyUrl] = useState(artist.spotifyUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(artist.instagramUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(artist.websiteUrl ?? "");
  const [hometown, setHometown] = useState(artist.hometown ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Sync form values when artist data loads from the store
  useEffect(() => {
    if (artist.id) {
      setName(artist.name);
      setGenre(artist.genre ?? "");
      setBio(artist.bio ?? "");
      setContactEmail(artist.contactEmail ?? "");
      setContactPhone(artist.contactPhone ?? "");
      setSpotifyUrl(artist.spotifyUrl ?? "");
      setInstagramUrl(artist.instagramUrl ?? "");
      setWebsiteUrl(artist.websiteUrl ?? "");
      setHometown(artist.hometown ?? "");
    }
  }, [artist]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setError("Artist name is required");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    if (isNew) {
      if (!state.orgId) {
        setError("Organization not loaded yet");
        setSaving(false);
        return;
      }
      const result = await addArtist({
        org_id: state.orgId,
        name,
        genre: genre || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
      });
      setSaving(false);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        dispatch({ type: "REFRESH" });
        setTimeout(() => setSaved(false), 2000);
      }
    } else {
      const result = await updateArtist(artist.id, {
        name,
        genre: genre || null,
        bio: bio || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        spotify_url: spotifyUrl || null,
        instagram_url: instagramUrl || null,
        website_url: websiteUrl || null,
        hometown: hometown || null,
      });
      setSaving(false);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        dispatch({ type: "REFRESH" });
        setTimeout(() => setSaved(false), 2000);
      }
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1";

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading artist profile...</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isNew
            ? "Set up your artist profile \u2014 this info is used for AI pitch generation"
            : "Manage your artist profile \u2014 this info is used for AI pitch generation"}
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="font-semibold">Artist Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Basic info about your act
          </p>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="artist-name" className={labelClass}>Artist Name *</label>
                <input
                  id="artist-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your artist or band name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="genre" className={labelClass}>Genre</label>
                <input
                  id="genre"
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Post-Punk, Shoegaze"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="hometown" className={labelClass}>Hometown</label>
              <input
                id="hometown"
                type="text"
                value={hometown}
                onChange={(e) => setHometown(e.target.value)}
                placeholder="e.g. Tel Aviv, Israel"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="bio" className={labelClass}>Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="A short bio for pitch emails..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="font-semibold">Contact & Links</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How venues can reach you and find your music
          </p>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-email" className={labelClass}>Contact Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="booking@yourband.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className={labelClass}>Contact Phone</label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="spotify-url" className={labelClass}>Spotify URL</label>
              <input
                id="spotify-url"
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="instagram-url" className={labelClass}>Instagram URL</label>
              <input
                id="instagram-url"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourband"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="website-url" className={labelClass}>Website URL</label>
              <input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourband.com"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : isNew ? "Create Profile" : "Save Changes"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-400">
              {isNew ? "Profile created" : "Changes saved"}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
