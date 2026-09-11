export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: string;
          meta: Json | null;
          target_id: string | null;
          target_table: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          meta?: Json | null;
          target_id?: string | null;
          target_table?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          meta?: Json | null;
          target_id?: string | null;
          target_table?: string | null;
        };
        Relationships: [];
      };
      admin_saved_filters: {
        Row: {
          created_at: string;
          filters: Json;
          id: string;
          is_default: boolean;
          name: string;
          scope: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          filters?: Json;
          id?: string;
          is_default?: boolean;
          name: string;
          scope?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          filters?: Json;
          id?: string;
          is_default?: boolean;
          name?: string;
          scope?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      affiliate_clicks: {
        Row: {
          country: string | null;
          created_at: string;
          deal_id: string;
          id: string;
          network: string | null;
          referrer: string | null;
          source: string | null;
          user_agent: string | null;
        };
        Insert: {
          country?: string | null;
          created_at?: string;
          deal_id: string;
          id?: string;
          network?: string | null;
          referrer?: string | null;
          source?: string | null;
          user_agent?: string | null;
        };
        Update: {
          country?: string | null;
          created_at?: string;
          deal_id?: string;
          id?: string;
          network?: string | null;
          referrer?: string | null;
          source?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "merchant_deals";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_conversions: {
        Row: {
          amount: number;
          click_id: string | null;
          commission: number;
          created_at: string;
          currency: string;
          deal_id: string | null;
          id: string;
          network: string;
          order_id: string;
          raw: Json | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount?: number;
          click_id?: string | null;
          commission?: number;
          created_at?: string;
          currency?: string;
          deal_id?: string | null;
          id?: string;
          network: string;
          order_id: string;
          raw?: Json | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          click_id?: string | null;
          commission?: number;
          created_at?: string;
          currency?: string;
          deal_id?: string | null;
          id?: string;
          network?: string;
          order_id?: string;
          raw?: Json | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_click_id_fkey";
            columns: ["click_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_clicks";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_stores: {
        Row: {
          active: boolean;
          affiliate_param: string | null;
          category: string | null;
          city: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          network: string;
          network_account_email: string | null;
          network_account_id: string | null;
          notes: string | null;
          site_url: string;
          slug: string | null;
          tracking_template: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          affiliate_param?: string | null;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          network?: string;
          network_account_email?: string | null;
          network_account_id?: string | null;
          notes?: string | null;
          site_url: string;
          slug?: string | null;
          tracking_template?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          affiliate_param?: string | null;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          network?: string;
          network_account_email?: string | null;
          network_account_id?: string | null;
          notes?: string | null;
          site_url?: string;
          slug?: string | null;
          tracking_template?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          created_at: string;
          event: string;
          id: string;
          path: string | null;
          payload: Json;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event: string;
          id?: string;
          path?: string | null;
          payload?: Json;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event?: string;
          id?: string;
          path?: string | null;
          payload?: Json;
          user_id?: string | null;
        };
        Relationships: [];
      };
      buyer_requests: {
        Row: {
          city: string;
          contact_consent: boolean;
          created_at: string;
          district: string;
          features: string[];
          full_name: string;
          id: string;
          is_demo: boolean;
          max_price: number;
          min_bedrooms: number;
          phone: string | null;
          property_type: string;
          purpose: string;
          required_services: string[];
          status: string;
          user_id: string | null;
        };
        Insert: {
          city: string;
          contact_consent?: boolean;
          created_at?: string;
          district: string;
          features?: string[];
          full_name: string;
          id?: string;
          is_demo?: boolean;
          max_price: number;
          min_bedrooms: number;
          phone?: string | null;
          property_type: string;
          purpose?: string;
          required_services?: string[];
          status?: string;
          user_id?: string | null;
        };
        Update: {
          city?: string;
          contact_consent?: boolean;
          created_at?: string;
          district?: string;
          features?: string[];
          full_name?: string;
          id?: string;
          is_demo?: boolean;
          max_price?: number;
          min_bedrooms?: number;
          phone?: string | null;
          property_type?: string;
          purpose?: string;
          required_services?: string[];
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      cashback_transactions: {
        Row: {
          cashback_amount: number;
          cashback_rate: number;
          created_at: string;
          deal_id: string | null;
          id: string;
          note: string | null;
          purchase_amount: number;
          status: string;
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cashback_amount: number;
          cashback_rate?: number;
          created_at?: string;
          deal_id?: string | null;
          id?: string;
          note?: string | null;
          purchase_amount: number;
          status?: string;
          store_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cashback_amount?: number;
          cashback_rate?: number;
          created_at?: string;
          deal_id?: string | null;
          id?: string;
          note?: string | null;
          purchase_amount?: number;
          status?: string;
          store_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      complaints: {
        Row: {
          assigned_to: string | null;
          body: string;
          created_at: string;
          id: string;
          response: string | null;
          status: string;
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          response?: string | null;
          status?: string;
          subject: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_to?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          response?: string | null;
          status?: string;
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      coupon_reports: {
        Row: {
          coupon_code: string | null;
          coupon_id: string;
          created_at: string;
          id: string;
          note: string | null;
          offer_url: string | null;
          reason: string;
          resolved_at: string | null;
          resolved_by: string | null;
          session: string | null;
          site_url: string | null;
          status: string;
          store_id: string | null;
          store_name: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          coupon_code?: string | null;
          coupon_id: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          offer_url?: string | null;
          reason?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          session?: string | null;
          site_url?: string | null;
          status?: string;
          store_id?: string | null;
          store_name?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          coupon_code?: string | null;
          coupon_id?: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          offer_url?: string | null;
          reason?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          session?: string | null;
          site_url?: string | null;
          status?: string;
          store_id?: string | null;
          store_name?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          active: boolean;
          category: string | null;
          code: string;
          created_at: string;
          description: string;
          discount: string;
          expires_at: string | null;
          id: string;
          min_order: number | null;
          source: string;
          store_id: string | null;
          store_name: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          category?: string | null;
          code: string;
          created_at?: string;
          description?: string;
          discount: string;
          expires_at?: string | null;
          id?: string;
          min_order?: number | null;
          source?: string;
          store_id?: string | null;
          store_name: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category?: string | null;
          code?: string;
          created_at?: string;
          description?: string;
          discount?: string;
          expires_at?: string | null;
          id?: string;
          min_order?: number | null;
          source?: string;
          store_id?: string | null;
          store_name?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cron_secrets: {
        Row: {
          created_at: string;
          name: string;
          secret: string;
        };
        Insert: {
          created_at?: string;
          name: string;
          secret?: string;
        };
        Update: {
          created_at?: string;
          name?: string;
          secret?: string;
        };
        Relationships: [];
      };
      deal_alert_settings: {
        Row: {
          coupon_window_hours: number;
          coupons_enabled: boolean;
          created_at: string;
          enabled: boolean;
          id: boolean;
          lead_hours: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          coupon_window_hours?: number;
          coupons_enabled?: boolean;
          created_at?: string;
          enabled?: boolean;
          id?: boolean;
          lead_hours?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          coupon_window_hours?: number;
          coupons_enabled?: boolean;
          created_at?: string;
          enabled?: boolean;
          id?: boolean;
          lead_hours?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      external_deals: {
        Row: {
          active: boolean;
          brand: string | null;
          category: string;
          created_at: string;
          created_by: string | null;
          discount_percent: number;
          expires_at: string | null;
          fetched_at: string;
          id: string;
          image_url: string | null;
          original_price: number;
          price: number;
          product_key: string | null;
          product_url: string | null;
          source: string;
          source_key: string;
          store_id: string;
          store_name: string | null;
          title: string;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          brand?: string | null;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          discount_percent?: number;
          expires_at?: string | null;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          original_price: number;
          price: number;
          product_key?: string | null;
          product_url?: string | null;
          source?: string;
          source_key: string;
          store_id: string;
          store_name?: string | null;
          title: string;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          brand?: string | null;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          discount_percent?: number;
          expires_at?: string | null;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          original_price?: number;
          price?: number;
          product_key?: string | null;
          product_url?: string | null;
          source?: string;
          source_key?: string;
          store_id?: string;
          store_name?: string | null;
          title?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          item_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          item_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          item_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      haraj_listings: {
        Row: {
          active: boolean;
          author: string | null;
          city: string | null;
          created_at: string;
          description: string | null;
          fetched_at: string;
          id: string;
          image_url: string | null;
          post_url: string;
          posted_at: string | null;
          price: number | null;
          rank: number;
          source_key: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          author?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          post_url: string;
          posted_at?: string | null;
          price?: number | null;
          rank?: number;
          source_key: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          author?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          post_url?: string;
          posted_at?: string | null;
          price?: number | null;
          rank?: number;
          source_key?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_credentials: {
        Row: {
          created_at: string;
          id: string;
          key_name: string;
          updated_at: string;
          updated_by: string | null;
          value_ciphertext: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key_name: string;
          updated_at?: string;
          updated_by?: string | null;
          value_ciphertext: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          key_name?: string;
          updated_at?: string;
          updated_by?: string | null;
          value_ciphertext?: string;
        };
        Relationships: [];
      };
      merchant_deals: {
        Row: {
          category: string;
          clicks: number;
          coupon_code: string | null;
          created_at: string;
          description: string | null;
          discount_percent: number | null;
          expires_at: string | null;
          id: string;
          image_url: string | null;
          merchant_id: string;
          original_price: number;
          price: number;
          product_url: string | null;
          review_note: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["deal_status"];
          title: string;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          category?: string;
          clicks?: number;
          coupon_code?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percent?: number | null;
          expires_at?: string | null;
          id?: string;
          image_url?: string | null;
          merchant_id: string;
          original_price: number;
          price: number;
          product_url?: string | null;
          review_note?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["deal_status"];
          title: string;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          category?: string;
          clicks?: number;
          coupon_code?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percent?: number | null;
          expires_at?: string | null;
          id?: string;
          image_url?: string | null;
          merchant_id?: string;
          original_price?: number;
          price?: number;
          product_url?: string | null;
          review_note?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["deal_status"];
          title?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "merchant_deals_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      merchants: {
        Row: {
          category: string;
          city: string | null;
          cr_number: string | null;
          created_at: string;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string | null;
          phone: string | null;
          review_note: string | null;
          slug: string;
          status: Database["public"]["Enums"]["merchant_status"];
          updated_at: string;
          website: string | null;
        };
        Insert: {
          category?: string;
          city?: string | null;
          cr_number?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id?: string | null;
          phone?: string | null;
          review_note?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["merchant_status"];
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          category?: string;
          city?: string | null;
          cr_number?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string | null;
          phone?: string | null;
          review_note?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["merchant_status"];
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          is_broadcast: boolean;
          link: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_broadcast?: boolean;
          link?: string | null;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_broadcast?: boolean;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      offer_clicks: {
        Row: {
          city: string | null;
          country: string | null;
          coupon_code: string | null;
          created_at: string;
          id: string;
          kind: string;
          offer_id: string;
          offer_title: string | null;
          path: string | null;
          session: string | null;
          store_id: string | null;
          store_name: string | null;
          surface: string;
          user_id: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          coupon_code?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          offer_id: string;
          offer_title?: string | null;
          path?: string | null;
          session?: string | null;
          store_id?: string | null;
          store_name?: string | null;
          surface?: string;
          user_id?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          coupon_code?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          offer_id?: string;
          offer_title?: string | null;
          path?: string | null;
          session?: string | null;
          store_id?: string | null;
          store_name?: string | null;
          surface?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      office_picks: {
        Row: {
          active: boolean;
          city: string | null;
          created_at: string;
          fetched_at: string;
          id: string;
          image_url: string | null;
          kind: string;
          link_url: string | null;
          price: number | null;
          rank: number;
          rating: number | null;
          source_key: string;
          subtitle: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          city?: string | null;
          created_at?: string;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          kind: string;
          link_url?: string | null;
          price?: number | null;
          rank?: number;
          rating?: number | null;
          source_key: string;
          subtitle?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          city?: string | null;
          created_at?: string;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          kind?: string;
          link_url?: string | null;
          price?: number | null;
          rank?: number;
          rating?: number | null;
          source_key?: string;
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      premium_subscriptions: {
        Row: {
          created_at: string;
          end_at: string | null;
          id: string;
          plan: string;
          start_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_at?: string | null;
          id?: string;
          plan?: string;
          start_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_at?: string | null;
          id?: string;
          plan?: string;
          start_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      price_alerts: {
        Row: {
          active: boolean;
          created_at: string;
          current_price: number;
          deal_id: string;
          id: string;
          product_key: string | null;
          target_price: number;
          title: string;
          triggered_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          current_price: number;
          deal_id: string;
          id?: string;
          product_key?: string | null;
          target_price: number;
          title: string;
          triggered_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          current_price?: number;
          deal_id?: string;
          id?: string;
          product_key?: string | null;
          target_price?: number;
          title?: string;
          triggered_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_listings: {
        Row: {
          bedrooms: number;
          city: string;
          created_at: string;
          district: string;
          features: string[];
          id: string;
          owner_id: string;
          price: number;
          property_type: string;
          purpose: string;
          required_services: string[];
          status: string;
          title: string;
        };
        Insert: {
          bedrooms: number;
          city: string;
          created_at?: string;
          district: string;
          features?: string[];
          id?: string;
          owner_id: string;
          price: number;
          property_type: string;
          purpose?: string;
          required_services?: string[];
          status?: string;
          title: string;
        };
        Update: {
          bedrooms?: number;
          city?: string;
          created_at?: string;
          district?: string;
          features?: string[];
          id?: string;
          owner_id?: string;
          price?: number;
          property_type?: string;
          purpose?: string;
          required_services?: string[];
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      push_dispatch_log: {
        Row: {
          created_at: string;
          dispatch_key: string;
          failed: number;
          id: string;
          kind: string;
          sent: number;
        };
        Insert: {
          created_at?: string;
          dispatch_key: string;
          failed?: number;
          id?: string;
          kind: string;
          sent?: number;
        };
        Update: {
          created_at?: string;
          dispatch_key?: string;
          failed?: number;
          id?: string;
          kind?: string;
          sent?: number;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          failure_count: number;
          id: string;
          last_success_at: string | null;
          p256dh: string;
          topics: string[];
          updated_at: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          failure_count?: number;
          id?: string;
          last_success_at?: string | null;
          p256dh: string;
          topics?: string[];
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          failure_count?: number;
          id?: string;
          last_success_at?: string | null;
          p256dh?: string;
          topics?: string[];
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      report_recipients: {
        Row: {
          active: boolean;
          created_at: string;
          email: string;
          id: string;
          name: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          email: string;
          id?: string;
          name?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_runs: {
        Row: {
          created_at: string;
          days: number;
          error: string | null;
          id: string;
          period_end: string;
          period_start: string;
          recipients: number;
          status: string;
          summary: Json | null;
          triggered_by: string;
        };
        Insert: {
          created_at?: string;
          days?: number;
          error?: string | null;
          id?: string;
          period_end: string;
          period_start: string;
          recipients?: number;
          status?: string;
          summary?: Json | null;
          triggered_by?: string;
        };
        Update: {
          created_at?: string;
          days?: number;
          error?: string | null;
          id?: string;
          period_end?: string;
          period_start?: string;
          recipients?: number;
          status?: string;
          summary?: Json | null;
          triggered_by?: string;
        };
        Relationships: [];
      };
      search_console_snapshots: {
        Row: {
          created_at: string;
          details: Json | null;
          id: string;
          indexed: number;
          indexed_urls: number;
          inspected_urls: number;
          site_url: string;
          sitemap_errors: number;
          sitemap_warnings: number;
          submitted: number;
        };
        Insert: {
          created_at?: string;
          details?: Json | null;
          id?: string;
          indexed?: number;
          indexed_urls?: number;
          inspected_urls?: number;
          site_url: string;
          sitemap_errors?: number;
          sitemap_warnings?: number;
          submitted?: number;
        };
        Update: {
          created_at?: string;
          details?: Json | null;
          id?: string;
          indexed?: number;
          indexed_urls?: number;
          inspected_urls?: number;
          site_url?: string;
          sitemap_errors?: number;
          sitemap_warnings?: number;
          submitted?: number;
        };
        Relationships: [];
      };
      showroom_offers: {
        Row: {
          active: boolean;
          brand: string;
          category: string;
          city: string | null;
          created_at: string;
          description: string | null;
          discount_percent: number;
          fetched_at: string;
          id: string;
          image_url: string | null;
          offer_url: string | null;
          original_price: number | null;
          price: number | null;
          rank: number;
          source_key: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          brand: string;
          category?: string;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percent?: number;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          offer_url?: string | null;
          original_price?: number | null;
          price?: number | null;
          rank?: number;
          source_key: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          brand?: string;
          category?: string;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percent?: number;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          offer_url?: string | null;
          original_price?: number | null;
          price?: number | null;
          rank?: number;
          source_key?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_accounts: {
        Row: {
          active: boolean;
          city: string | null;
          created_at: string;
          display_name: string | null;
          feed_url: string | null;
          handle: string;
          id: string;
          last_count: number;
          last_run_at: string | null;
          last_status: string | null;
          lat: number | null;
          lng: number | null;
          platform: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          city?: string | null;
          created_at?: string;
          display_name?: string | null;
          feed_url?: string | null;
          handle: string;
          id?: string;
          last_count?: number;
          last_run_at?: string | null;
          last_status?: string | null;
          lat?: number | null;
          lng?: number | null;
          platform: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          city?: string | null;
          created_at?: string;
          display_name?: string | null;
          feed_url?: string | null;
          handle?: string;
          id?: string;
          last_count?: number;
          last_run_at?: string | null;
          last_status?: string | null;
          lat?: number | null;
          lng?: number | null;
          platform?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_offers: {
        Row: {
          account_id: string | null;
          active: boolean;
          city: string | null;
          coupon_code: string | null;
          created_at: string;
          description: string | null;
          discount_percent: number | null;
          expires_at: string | null;
          fetched_at: string;
          handle: string;
          id: string;
          image_url: string | null;
          lat: number | null;
          lng: number | null;
          original_price: number | null;
          platform: string;
          post_url: string | null;
          price: number | null;
          source_key: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          active?: boolean;
          city?: string | null;
          coupon_code?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percent?: number | null;
          expires_at?: string | null;
          fetched_at?: string;
          handle: string;
          id?: string;
          image_url?: string | null;
          lat?: number | null;
          lng?: number | null;
          original_price?: number | null;
          platform: string;
          post_url?: string | null;
          price?: number | null;
          source_key: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          active?: boolean;
          city?: string | null;
          coupon_code?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percent?: number | null;
          expires_at?: string | null;
          fetched_at?: string;
          handle?: string;
          id?: string;
          image_url?: string | null;
          lat?: number | null;
          lng?: number | null;
          original_price?: number | null;
          platform?: string;
          post_url?: string | null;
          price?: number | null;
          source_key?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_offers_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      store_feeds: {
        Row: {
          active: boolean;
          affiliate_param: string | null;
          category: string;
          created_at: string;
          feed_type: string;
          feed_url: string;
          id: string;
          last_count: number;
          last_run_at: string | null;
          last_status: string | null;
          store_name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          affiliate_param?: string | null;
          category?: string;
          created_at?: string;
          feed_type?: string;
          feed_url: string;
          id?: string;
          last_count?: number;
          last_run_at?: string | null;
          last_status?: string | null;
          store_name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          affiliate_param?: string | null;
          category?: string;
          created_at?: string;
          feed_type?: string;
          feed_url?: string;
          id?: string;
          last_count?: number;
          last_run_at?: string | null;
          last_status?: string | null;
          store_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      suggestions: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          status: string;
          subject: string;
          tag: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          status?: string;
          subject: string;
          tag?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          status?: string;
          subject?: string;
          tag?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      sync_events: {
        Row: {
          code: string | null;
          created_at: string;
          id: string;
          keyword: string | null;
          message: string | null;
          source: string;
          status: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          id?: string;
          keyword?: string | null;
          message?: string | null;
          source: string;
          status: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          id?: string;
          keyword?: string | null;
          message?: string | null;
          source?: string;
          status?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      affiliate_click_stats: {
        Row: {
          clicks: number | null;
          deal_id: string | null;
          last_click_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "merchant_deals";
            referencedColumns: ["id"];
          },
        ];
      };
      cashback_user_totals: {
        Row: {
          confirmed_total: number | null;
          paid_total: number | null;
          pending_total: number | null;
          tx_count: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      assign_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _target: string;
        };
        Returns: undefined;
      };
      get_search_console_schedule: { Args: never; Returns: Json };
      get_sync_schedule: { Args: never; Returns: Json };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      match_buyers_for_property: {
        Args: { p_listing_id: string };
        Returns: {
          city: string;
          created_at: string;
          district: string;
          features: string[];
          full_name: string;
          id: string;
          is_demo: boolean;
          match_score: number;
          max_price: number;
          min_bedrooms: number;
          phone: string;
          property_type: string;
          purpose: string;
          required_services: string[];
        }[];
      };
      register_affiliate_click: {
        Args: {
          _country?: string;
          _deal_id: string;
          _network?: string;
          _referrer?: string;
          _source?: string;
          _user_agent?: string;
        };
        Returns: undefined;
      };
      register_affiliate_click_returning: {
        Args: {
          _country?: string;
          _deal_id: string;
          _network?: string;
          _referrer?: string;
          _source?: string;
          _user_agent?: string;
        };
        Returns: string;
      };
      revoke_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _target: string;
        };
        Returns: undefined;
      };
      set_search_console_schedule: {
        Args: { _active?: boolean; _schedule: string };
        Returns: Json;
      };
      set_sync_schedule: {
        Args: { _active?: boolean; _schedule: string };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin" | "support" | "content_manager";
      deal_status: "draft" | "pending" | "published" | "rejected" | "expired";
      merchant_status: "pending" | "verified" | "rejected" | "suspended";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "super_admin", "support", "content_manager"],
      deal_status: ["draft", "pending", "published", "rejected", "expired"],
      merchant_status: ["pending", "verified", "rejected", "suspended"],
    },
  },
} as const;
