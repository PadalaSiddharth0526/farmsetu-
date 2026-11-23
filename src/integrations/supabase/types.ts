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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      crop_recommendations: {
        Row: {
          created_at: string
          crop_name: string
          duration_days: string | null
          farmer_id: string
          guidance: string | null
          id: string
          market_demand: string | null
          reasons: Json
          season: string | null
          soil_test_id: string | null
          suitability_score: number
          water_requirement: string | null
          yield_range: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          duration_days?: string | null
          farmer_id: string
          guidance?: string | null
          id?: string
          market_demand?: string | null
          reasons?: Json
          season?: string | null
          soil_test_id?: string | null
          suitability_score?: number
          water_requirement?: string | null
          yield_range?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          duration_days?: string | null
          farmer_id?: string
          guidance?: string | null
          id?: string
          market_demand?: string | null
          reasons?: Json
          season?: string | null
          soil_test_id?: string | null
          suitability_score?: number
          water_requirement?: string | null
          yield_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_recommendations_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_recommendations_soil_test_id_fkey"
            columns: ["soil_test_id"]
            isOneToOne: false
            referencedRelation: "soil_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      farmers: {
        Row: {
          approved: boolean
          created_at: string
          district: string
          farm_size: number
          farmer_code: string | null
          id: string
          language: string
          mandal: string | null
          name: string
          phone: string | null
          photo_url: string | null
          pincode: string | null
          state: string
          user_id: string | null
          village: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          district?: string
          farm_size?: number
          farmer_code?: string | null
          id?: string
          language?: string
          mandal?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          state?: string
          user_id?: string | null
          village?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          district?: string
          farm_size?: number
          farmer_code?: string | null
          id?: string
          language?: string
          mandal?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          state?: string
          user_id?: string | null
          village?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          crop_name: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          unit: string
        }
        Insert: {
          crop_name: string
          id?: string
          order_id: string
          price?: number
          product_id?: string | null
          quantity?: number
          unit?: string
        }
        Update: {
          crop_name?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          unit?: string
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
          created_at: string
          customer_id: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number
          farmer_id: string
          id: string
          inventory_committed_at: string | null
          inventory_restored_at: string | null
          order_code: string
          order_status: string
          payment_method: string
          payment_status: string
          reservation_expires_at: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          farmer_id: string
          id?: string
          inventory_committed_at?: string | null
          inventory_restored_at?: string | null
          order_code?: string
          order_status?: string
          payment_method?: string
          payment_status?: string
          reservation_expires_at?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          farmer_id?: string
          id?: string
          inventory_committed_at?: string | null
          inventory_restored_at?: string | null
          order_code?: string
          order_status?: string
          payment_method?: string
          payment_status?: string
          reservation_expires_at?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          crop_name: string
          crop_name_te: string | null
          delivery_option: string
          district: string | null
          description: string | null
          farmer_id: string | null
          harvest_date: string | null
          id: string
          image_url: string | null
          is_demo: boolean
          listing_key: string | null
          location: string | null
          low_stock_threshold: number
          min_order: number
          organic: boolean
          organic_verified: boolean
          pack_sizes: number[]
          price: number
          price_verified: boolean
          quality: string
          quantity: number
          raw_price_per_quintal: number | null
          reserved_quantity: number
          rollout_phase: number
          status: string
          stock_verified: boolean
          supplier_verified: boolean
          unit: string
          variety: string
        }
        Insert: {
          category?: string
          created_at?: string
          crop_name: string
          crop_name_te?: string | null
          delivery_option?: string
          district?: string | null
          description?: string | null
          farmer_id?: string | null
          harvest_date?: string | null
          id?: string
          image_url?: string | null
          is_demo?: boolean
          listing_key?: string | null
          location?: string | null
          low_stock_threshold?: number
          min_order?: number
          organic?: boolean
          organic_verified?: boolean
          pack_sizes?: number[]
          price?: number
          price_verified?: boolean
          quality?: string
          quantity?: number
          raw_price_per_quintal?: number | null
          reserved_quantity?: number
          rollout_phase?: number
          status?: string
          stock_verified?: boolean
          supplier_verified?: boolean
          unit?: string
          variety?: string
        }
        Update: {
          category?: string
          created_at?: string
          crop_name?: string
          crop_name_te?: string | null
          delivery_option?: string
          district?: string | null
          description?: string | null
          farmer_id?: string | null
          harvest_date?: string | null
          id?: string
          image_url?: string | null
          is_demo?: boolean
          listing_key?: string | null
          location?: string | null
          low_stock_threshold?: number
          min_order?: number
          organic?: boolean
          organic_verified?: boolean
          pack_sizes?: number[]
          price?: number
          price_verified?: boolean
          quality?: string
          quantity?: number
          raw_price_per_quintal?: number | null
          reserved_quantity?: number
          rollout_phase?: number
          status?: string
          stock_verified?: boolean
          supplier_verified?: boolean
          unit?: string
          variety?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          district: string | null
          email: string | null
          id: string
          language: string
          name: string
          phone: string | null
          pincode: string | null
          role: string
          state: string
          village: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id: string
          language?: string
          name?: string
          phone?: string | null
          pincode?: string | null
          role?: string
          state?: string
          village?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          language?: string
          name?: string
          phone?: string | null
          pincode?: string | null
          role?: string
          state?: string
          village?: string | null
        }
        Relationships: []
      }
      soil_tests: {
        Row: {
          analysis: Json | null
          created_at: string
          electrical_conductivity: number | null
          farmer_id: string
          id: string
          moisture: number | null
          nitrogen: number | null
          organic_carbon: number | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
          report_file: string | null
          soil_score: number | null
          soil_type: string | null
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          electrical_conductivity?: number | null
          farmer_id: string
          id?: string
          moisture?: number | null
          nitrogen?: number | null
          organic_carbon?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          report_file?: string | null
          soil_score?: number | null
          soil_type?: string | null
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          electrical_conductivity?: number | null
          farmer_id?: string
          id?: string
          moisture?: number | null
          nitrogen?: number | null
          organic_carbon?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          report_file?: string | null
          soil_score?: number | null
          soil_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soil_tests_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_farmer_id: { Args: never; Returns: string }
      place_marketplace_orders: {
        Args: {
          p_customer_name: string | null
          p_customer_phone: string | null
          p_delivery_address: string | null
          p_items: Json
        }
        Returns: Json
      }
      release_expired_marketplace_reservations: { Args: never; Returns: number }
      seed_crowdquote_demo_listings: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "farmer" | "customer" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["farmer", "customer", "admin"],
    },
  },
} as const
