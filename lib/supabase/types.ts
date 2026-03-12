export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          org_id: string;
          role: "owner" | "admin" | "agent" | "artist";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          org_id: string;
          role?: "owner" | "admin" | "agent" | "artist";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_id?: string;
          role?: "owner" | "admin" | "agent" | "artist";
          created_at?: string;
        };
        Relationships: [];
      };
      artists: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          genre: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          genre?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          genre?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          city: string;
          state: string | null;
          country: string;
          capacity: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          city: string;
          state?: string | null;
          country?: string;
          capacity?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          city?: string;
          state?: string | null;
          country?: string;
          capacity?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          org_id: string;
          venue_id: string | null;
          name: string;
          role: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          venue_id?: string | null;
          name: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          venue_id?: string | null;
          name?: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tours: {
        Row: {
          id: string;
          org_id: string;
          artist_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          artist_id: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          artist_id?: string;
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shows: {
        Row: {
          id: string;
          org_id: string;
          tour_id: string | null;
          venue_id: string;
          artist_id: string;
          reachout_id: string | null;
          date: string;
          status: string;
          type: string;
          guarantee: number | null;
          ticket_price: number | null;
          doors_time: string | null;
          set_time: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          tour_id?: string | null;
          venue_id: string;
          artist_id: string;
          reachout_id?: string | null;
          date: string;
          status?: string;
          type?: string;
          guarantee?: number | null;
          ticket_price?: number | null;
          doors_time?: string | null;
          set_time?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          tour_id?: string | null;
          venue_id?: string;
          artist_id?: string;
          reachout_id?: string | null;
          date?: string;
          status?: string;
          type?: string;
          guarantee?: number | null;
          ticket_price?: number | null;
          doors_time?: string | null;
          set_time?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reachouts: {
        Row: {
          id: string;
          org_id: string;
          venue_id: string;
          contact_id: string | null;
          tour_id: string | null;
          status: string;
          method: string | null;
          sent_at: string | null;
          last_follow_up: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          venue_id: string;
          contact_id?: string | null;
          tour_id?: string | null;
          status?: string;
          method?: string | null;
          sent_at?: string | null;
          last_follow_up?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          venue_id?: string;
          contact_id?: string | null;
          tour_id?: string | null;
          status?: string;
          method?: string | null;
          sent_at?: string | null;
          last_follow_up?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discovered_venues: {
        Row: {
          id: string;
          source: string;
          source_id: string | null;
          name: string;
          city: string | null;
          state: string | null;
          country: string | null;
          capacity: number | null;
          genres: string[] | null;
          venue_type: string | null;
          website_url: string | null;
          booking_email: string | null;
          booking_contact: string | null;
          phone: string | null;
          lat: number | null;
          lng: number | null;
          raw_data: Json | null;
          last_scraped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          source_id?: string | null;
          name: string;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          capacity?: number | null;
          genres?: string[] | null;
          venue_type?: string | null;
          website_url?: string | null;
          booking_email?: string | null;
          booking_contact?: string | null;
          phone?: string | null;
          lat?: number | null;
          lng?: number | null;
          raw_data?: Json | null;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          source_id?: string | null;
          name?: string;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          capacity?: number | null;
          genres?: string[] | null;
          venue_type?: string | null;
          website_url?: string | null;
          booking_email?: string | null;
          booking_contact?: string | null;
          phone?: string | null;
          lat?: number | null;
          lng?: number | null;
          raw_data?: Json | null;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discovered_events: {
        Row: {
          id: string;
          source: string;
          source_id: string | null;
          name: string;
          discovered_venue_id: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          start_date: string | null;
          end_date: string | null;
          genres: string[] | null;
          event_type: string | null;
          lineup: string[] | null;
          application_url: string | null;
          application_deadline: string | null;
          website_url: string | null;
          booking_email: string | null;
          status: string | null;
          raw_data: Json | null;
          last_scraped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          source_id?: string | null;
          name: string;
          discovered_venue_id?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          genres?: string[] | null;
          event_type?: string | null;
          lineup?: string[] | null;
          application_url?: string | null;
          application_deadline?: string | null;
          website_url?: string | null;
          booking_email?: string | null;
          status?: string | null;
          raw_data?: Json | null;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          source_id?: string | null;
          name?: string;
          discovered_venue_id?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          genres?: string[] | null;
          event_type?: string | null;
          lineup?: string[] | null;
          application_url?: string | null;
          application_deadline?: string | null;
          website_url?: string | null;
          booking_email?: string | null;
          status?: string | null;
          raw_data?: Json | null;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scrape_sources: {
        Row: {
          id: string;
          name: string;
          base_url: string | null;
          scraper_type: string;
          config: Json;
          enabled: boolean;
          last_run_at: string | null;
          next_run_at: string | null;
          run_interval_hours: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          base_url?: string | null;
          scraper_type: string;
          config?: Json;
          enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          run_interval_hours?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          base_url?: string | null;
          scraper_type?: string;
          config?: Json;
          enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          run_interval_hours?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      scrape_jobs: {
        Row: {
          id: string;
          source_id: string;
          status: string;
          job_type: string;
          config: Json;
          started_at: string | null;
          completed_at: string | null;
          items_found: number;
          items_new: number;
          error_log: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          status?: string;
          job_type?: string;
          config?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          items_found?: number;
          items_new?: number;
          error_log?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          status?: string;
          job_type?: string;
          config?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          items_found?: number;
          items_new?: number;
          error_log?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      opportunity_matches: {
        Row: {
          id: string;
          org_id: string;
          artist_id: string;
          discovered_venue_id: string | null;
          discovered_event_id: string | null;
          match_score: number;
          match_reasons: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          artist_id: string;
          discovered_venue_id?: string | null;
          discovered_event_id?: string | null;
          match_score: number;
          match_reasons?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          artist_id?: string;
          discovered_venue_id?: string | null;
          discovered_event_id?: string | null;
          match_score?: number;
          match_reasons?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_accounts: {
        Row: {
          id: string;
          org_id: string;
          email_address: string;
          display_name: string | null;
          provider: string;
          api_key_encrypted: string | null;
          daily_limit: number;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email_address: string;
          display_name?: string | null;
          provider?: string;
          api_key_encrypted?: string | null;
          daily_limit?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email_address?: string;
          display_name?: string | null;
          provider?: string;
          api_key_encrypted?: string | null;
          daily_limit?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          subject_template: string;
          body_template: string;
          template_type: string;
          variables: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          subject_template: string;
          body_template: string;
          template_type?: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          subject_template?: string;
          body_template?: string;
          template_type?: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_messages: {
        Row: {
          id: string;
          org_id: string;
          reachout_id: string | null;
          template_id: string | null;
          account_id: string | null;
          to_email: string;
          subject: string;
          body_html: string;
          status: string;
          external_id: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          reachout_id?: string | null;
          template_id?: string | null;
          account_id?: string | null;
          to_email: string;
          subject: string;
          body_html: string;
          status?: string;
          external_id?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          reachout_id?: string | null;
          template_id?: string | null;
          account_id?: string | null;
          to_email?: string;
          subject?: string;
          body_html?: string;
          status?: string;
          external_id?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      automation_rules: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          rule_type: string;
          trigger_config: Json;
          action_config: Json;
          enabled: boolean;
          last_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          rule_type: string;
          trigger_config?: Json;
          action_config?: Json;
          enabled?: boolean;
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          rule_type?: string;
          trigger_config?: Json;
          action_config?: Json;
          enabled?: boolean;
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          action?: string;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_org_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      user_has_role: {
        Args: {
          target_org_id: string;
          allowed_roles: string[];
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
