// --- Status types ---

export type ShowStatus =
  | "idea"
  | "pitched"
  | "hold"
  | "confirmed"
  | "advanced"
  | "played"
  | "cancelled";

export type ReachoutStatus =
  | "drafted"
  | "sent"
  | "replied"
  | "follow_up"
  | "no_response"
  | "declined"
  | "booked";

export type ShowType =
  | "headline"
  | "opener"
  | "co_headline"
  | "festival"
  | "private";

export type TourStatus = "planning" | "active" | "completed" | "cancelled";

export type ReachoutMethod = "email" | "phone" | "dm" | "in_person";

// --- Core entities ---

export interface Artist {
  id: string;
  name: string;
  genre?: string;
  bio?: string;
  contactEmail?: string;
  contactPhone?: string;
  spotifyUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  hometown?: string;
  notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  venueId?: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  capacity?: number;
  contacts: Contact[];
  notes?: string;
}

export interface Reachout {
  id: string;
  venueId: string;
  contactId?: string;
  tourId?: string;
  status: ReachoutStatus;
  method?: ReachoutMethod;
  sentAt?: string;
  lastFollowUp?: string;
  notes?: string;
  createdAt: string;
}

export interface Show {
  id: string;
  tourId?: string;
  venueId: string;
  artistId: string;
  date: string;
  status: ShowStatus;
  type: ShowType;
  guarantee?: number;
  ticketPrice?: number;
  doorsTime?: string;
  setTime?: string;
  notes?: string;
  reachoutId?: string;
  createdAt: string;
}

export interface Tour {
  id: string;
  name: string;
  artistId: string;
  startDate?: string;
  endDate?: string;
  status: TourStatus;
  notes?: string;
  createdAt: string;
}

// --- Store state ---

export interface AppState {
  orgId: string;
  artist: Artist;
  tours: Tour[];
  shows: Show[];
  venues: Venue[];
  reachouts: Reachout[];
}
