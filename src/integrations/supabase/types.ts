export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          country: string | null
          created_at: string
          deal_id: string
          id: string
          network: string | null
          referrer: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          deal_id: string
          id?: string
          network?: string | null
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          network?: string | null
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "merchant_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          amount: number
          click_id: string | null
          commission: number
          created_at: string
          currency: string
          deal_id: string | null
          id: string
          network: string
          order_id: string
          raw: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          click_id?: string | null
          commission?: number
          created_at?: string
          currency?: string
          deal_id?: string | null
          id?: string
          network: string
          order_id: string
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          click_id?: string | null
          commission?: number
          created_at?: string
          currency?: string
          deal_id?: string | null
          id?: string
          network?: string
          order_id?: string
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "affiliate_clicks"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_transactions: {
        Row: {
          cashback_amount: number
          cashback_rate: number
          created_at: string
          deal_id: string | null
          id: string
          note: string | null
          purchase_amount: number
          status: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cashback_amount: number
          cashback_rate?: number
          created_at?: string
          deal_id?: string | null
          id?: string
          note?: string | null
          purchase_amount: number
          status?: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cashback_amount?: number
          cashback_rate?: number
          created_at?: string
          deal_id?: string | null
          id?: string
          note?: string | null
          purchase_amount?: number
          status?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          assigned_to: string | null
          body: string
          created_at: string
          id: string
          response: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          created_at?: string
          id?: string
          response?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          created_at?: string
          id?: string
          response?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      external_deals: {
        Row: {
          active: boolean
          brand: string | null
          category: string
          created_at: string
          created_by: string | null
          discount_percent: number
          expires_at: string | null
          fetched_at: string
          id: string
          image_url: string | null
          original_price: number
          price: number
          product_key: string | null
          product_url: string | null
          source: string
          source_key: string
          store_id: string
          store_name: string | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          expires_at?: string | null
          fetched_at?: string
          id?: string
          image_url?: string | null
          original_price: number
          price: number
          product_key?: string | null
          product_url?: string | null
          source?: string
          source_key: string
          store_id: string
          store_name?: string | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          expires_at?: string | null
          fetched_at?: string
          id?: string
          image_url?: string | null
          original_price?: number
          price?: number
          product_key?: string | null
          product_url?: string | null
          source?: string
          source_key?: string
          store_id?: string
          store_name?: string | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_credentials: {
        Row: {
          created_at: string
          id: string
          key_name: string
          updated_at: string
          updated_by: string | null
          value_ciphertext: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          updated_at?: string
          updated_by?: string | null
          value_ciphertext: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          updated_at?: string
          updated_by?: string | null
          value_ciphertext?: string
        }
        Relationships: []
      }
      merchant_deals: {
        Row: {
          category: string
          clicks: number
          created_at: string
          description: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          image_url: string | null
          merchant_id: string
          original_price: number
          price: number
          product_url: string | null
          review_note: string | null
          starts_at: string
          status: Database["public"]["Enums"]["deal_status"]
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          clicks?: number
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          merchant_id: string
          original_price: number
          price: number
          product_url?: string | null
          review_note?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["deal_status"]
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          clicks?: number
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          merchant_id?: string
          original_price?: number
          price?: number
          product_url?: string | null
          review_note?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["deal_status"]
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_deals_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          category: string
          city: string | null
          cr_number: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          review_note: string | null
          slug: string
          status: Database["public"]["Enums"]["merchant_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string
          city?: string | null
          cr_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          review_note?: string | null
          slug: string
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string
          city?: string | null
          cr_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          review_note?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_broadcast: boolean
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_broadcast?: boolean
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_broadcast?: boolean
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          created_at: string
          end_at: string | null
          id: string
          plan: string
          start_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          id?: string
          plan?: string
          start_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_at?: string | null
          id?: string
          plan?: string
          start_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          active: boolean
          created_at: string
          current_price: number
          deal_id: string
          id: string
          product_key: string | null
          target_price: number
          title: string
          triggered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          current_price: number
          deal_id: string
          id?: string
          product_key?: string | null
          target_price: number
          title: string
          triggered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          current_price?: number
          deal_id?: string
          id?: string
          product_key?: string | null
          target_price?: number
          title?: string
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          body: string
          created_at: string
          id: string
          status: string
          subject: string
          tag: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          status?: string
          subject: string
          tag?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string
          tag?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_events: {
        Row: {
          code: string | null
          created_at: string
          id: string
          keyword: string | null
          message: string | null
          source: string
          status: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          keyword?: string | null
          message?: string | null
          source: string
          status: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          keyword?: string | null
          message?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      affiliate_click_stats: {
        Row: {
          clicks: number | null
          deal_id: string | null
          last_click_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "merchant_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_user_totals: {
        Row: {
          confirmed_total: number | null
          paid_total: number | null
          pending_total: number | null
          tx_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      register_affiliate_click: {
        Args: {
          _country?: string
          _deal_id: string
          _network?: string
          _referrer?: string
          _source?: string
          _user_agent?: string
        }
        Returns: undefined
      }
      register_affiliate_click_returning: {
        Args: {
          _country?: string
          _deal_id: string
          _network?: string
          _referrer?: string
          _source?: string
          _user_agent?: string
        }
        Returns: string
      }
      revoke_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "support"
        | "content_manager"
      deal_status: "draft" | "pending" | "published" | "rejected" | "expired"
      merchant_status: "pending" | "verified" | "rejected" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "support",
        "content_manager",
      ],
      deal_status: ["draft", "pending", "published", "rejected", "expired"],
      merchant_status: ["pending", "verified", "rejected", "suspended"],
    },
  },
} as const
