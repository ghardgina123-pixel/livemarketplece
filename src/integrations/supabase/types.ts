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
      addresses: {
        Row: {
          created_at: string
          district: string | null
          id: string
          is_default: boolean
          label: string
          lat: number | null
          lng: number | null
          municipality_id: string
          phone: string | null
          province_id: string
          recipient_name: string | null
          reference: string | null
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
          municipality_id: string
          phone?: string | null
          province_id: string
          recipient_name?: string | null
          reference?: string | null
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
          municipality_id?: string
          phone?: string | null
          province_id?: string
          recipient_name?: string | null
          reference?: string | null
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_message_at: string
          store_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string
          store_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      live_messages: {
        Row: {
          created_at: string
          id: string
          live_id: string
          sender_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          live_id: string
          sender_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          live_id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_messages_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "lives"
            referencedColumns: ["id"]
          },
        ]
      }
      live_products: {
        Row: {
          live_id: string
          product_id: string
        }
        Insert: {
          live_id: string
          product_id: string
        }
        Update: {
          live_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_products_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "lives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      lives: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          livekit_room: string
          started_at: string | null
          status: Database["public"]["Enums"]["live_status"]
          store_id: string
          title: string
          viewer_count: number
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          livekit_room: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["live_status"]
          store_id: string
          title: string
          viewer_count?: number
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          livekit_room?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["live_status"]
          store_id?: string
          title?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lives_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          created_at: string
          id: string
          name: string
          province_id: string
          shipping_fee_aoa: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          province_id: string
          shipping_fee_aoa?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          province_id?: string
          shipping_fee_aoa?: number
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price_aoa: number
          unit_price_brl: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price_aoa?: number
          unit_price_brl: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price_aoa?: number
          unit_price_brl?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          created_at: string
          customer_id: string
          id: string
          paid_at: string | null
          payment_method: string | null
          shipping_aoa: number
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal_aoa: number
          total_aoa: number
          total_brl: number
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          shipping_aoa?: number
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal_aoa?: number
          total_aoa?: number
          total_brl: number
        }
        Update: {
          address_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          shipping_aoa?: number
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal_aoa?: number
          total_aoa?: number
          total_brl?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          config: Json
          country_code: string
          created_at: string
          currency_code: string
          currency_symbol: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          is_cash_on_delivery: boolean
          method_type: string
          requires_proof_upload: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          config?: Json
          country_code: string
          created_at?: string
          currency_code: string
          currency_symbol: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_cash_on_delivery?: boolean
          method_type: string
          requires_proof_upload?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          config?: Json
          country_code?: string
          created_at?: string
          currency_code?: string
          currency_symbol?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_cash_on_delivery?: boolean
          method_type?: string
          requires_proof_upload?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          commission_pct: number
          created_at: string
          gross_brl: number
          id: string
          net_brl: number
          order_id: string
          release_at: string
          released_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          store_id: string
        }
        Insert: {
          commission_pct?: number
          created_at?: string
          gross_brl: number
          id?: string
          net_brl: number
          order_id: string
          release_at: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          store_id: string
        }
        Update: {
          commission_pct?: number
          created_at?: string
          gross_brl?: number
          id?: string
          net_brl?: number
          order_id?: string
          release_at?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_videos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          product_id: string
          store_id: string
          thumbnail_url: string | null
          video_url: string
          views: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          product_id: string
          store_id: string
          thumbnail_url?: string | null
          video_url: string
          views?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          product_id?: string
          store_id?: string
          thumbnail_url?: string | null
          video_url?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_videos_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_aoa: number
          price_brl: number
          rejection_reason: string | null
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_aoa?: number
          price_brl: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_aoa?: number
          price_brl?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provinces: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      store_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          payment_method: string | null
          plan: string
          price_aoa: number
          proof_url: string | null
          rejection_reason: string | null
          started_at: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          plan?: string
          price_aoa?: number
          proof_url?: string | null
          rejection_reason?: string | null
          started_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          plan?: string
          price_aoa?: number
          proof_url?: string | null
          rejection_reason?: string | null
          started_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          bank_account: string | null
          bank_holder: string | null
          bank_name: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          municipality_id: string | null
          name: string
          nif: string | null
          owner_id: string
          phone: string | null
          province_id: string | null
          rating: number | null
          rejection_reason: string | null
          slug: string | null
          status: Database["public"]["Enums"]["store_status"]
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          municipality_id?: string | null
          name: string
          nif?: string | null
          owner_id: string
          phone?: string | null
          province_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          municipality_id?: string | null
          name?: string
          nif?: string | null
          owner_id?: string
          phone?: string | null
          province_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      create_order_with_items: {
        Args: {
          p_address_id: string
          p_items: Json
          p_payment_method?: string
          p_store_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "seller" | "admin"
      live_status: "scheduled" | "live" | "ended"
      order_status:
        | "pending"
        | "paid"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payout_status: "pending" | "released" | "failed"
      product_status: "pending" | "approved" | "rejected"
      store_status: "pending" | "active" | "rejected"
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
      app_role: ["customer", "seller", "admin"],
      live_status: ["scheduled", "live", "ended"],
      order_status: [
        "pending",
        "paid",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payout_status: ["pending", "released", "failed"],
      product_status: ["pending", "approved", "rejected"],
      store_status: ["pending", "active", "rejected"],
    },
  },
} as const
