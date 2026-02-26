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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          module: string
          user_id: string | null
          user_name: string | null
          vendor_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          module: string
          user_id?: string | null
          user_name?: string | null
          vendor_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          module?: string
          user_id?: string | null
          user_name?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          cgst: number | null
          created_at: string
          created_by: string | null
          id: string
          igst: number | null
          note_date: string
          note_number: string
          order_id: string | null
          party_name: string
          reason: string | null
          sgst: number | null
          status: string | null
          total_amount: number
          vendor_id: string | null
        }
        Insert: {
          cgst?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          igst?: number | null
          note_date?: string
          note_number: string
          order_id?: string | null
          party_name: string
          reason?: string | null
          sgst?: number | null
          status?: string | null
          total_amount?: number
          vendor_id?: string | null
        }
        Update: {
          cgst?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          igst?: number | null
          note_date?: string
          note_number?: string
          order_id?: string | null
          party_name?: string
          reason?: string | null
          sgst?: number | null
          status?: string | null
          total_amount?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      debit_notes: {
        Row: {
          cgst: number | null
          created_at: string
          created_by: string | null
          id: string
          igst: number | null
          note_date: string
          note_number: string
          order_id: string | null
          party_name: string
          reason: string | null
          sgst: number | null
          status: string | null
          total_amount: number
          vendor_id: string | null
        }
        Insert: {
          cgst?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          igst?: number | null
          note_date?: string
          note_number: string
          order_id?: string | null
          party_name: string
          reason?: string | null
          sgst?: number | null
          status?: string | null
          total_amount?: number
          vendor_id?: string | null
        }
        Update: {
          cgst?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          igst?: number | null
          note_date?: string
          note_number?: string
          order_id?: string | null
          party_name?: string
          reason?: string | null
          sgst?: number | null
          status?: string | null
          total_amount?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debit_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          gst_percent: number | null
          hsn_code: string | null
          id: string
          invoice_id: string
          product_name: string
          quantity: number
          rate: number
          total: number
        }
        Insert: {
          gst_percent?: number | null
          hsn_code?: string | null
          id?: string
          invoice_id: string
          product_name: string
          quantity?: number
          rate?: number
          total?: number
        }
        Update: {
          gst_percent?: number | null
          hsn_code?: string | null
          id?: string
          invoice_id?: string
          product_name?: string
          quantity?: number
          rate?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cgst: number | null
          created_at: string
          created_by: string | null
          due_date: string | null
          finalized: boolean
          gstin: string | null
          id: string
          igst: number | null
          invoice_date: string
          invoice_number: string
          order_id: string | null
          party_name: string
          pdf_url: string | null
          sgst: number | null
          status: string | null
          total_amount: number
          type: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          cgst?: number | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          finalized?: boolean
          gstin?: string | null
          id?: string
          igst?: number | null
          invoice_date?: string
          invoice_number: string
          order_id?: string | null
          party_name: string
          pdf_url?: string | null
          sgst?: number | null
          status?: string | null
          total_amount?: number
          type?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          cgst?: number | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          finalized?: boolean
          gstin?: string | null
          id?: string
          igst?: number | null
          invoice_date?: string
          invoice_number?: string
          order_id?: string | null
          party_name?: string
          pdf_url?: string | null
          sgst?: number | null
          status?: string | null
          total_amount?: number
          type?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company_name: string
          contact_person: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["lead_priority"] | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          value: number | null
          vendor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_name: string
          contact_person: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          value?: number | null
          vendor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          value?: number | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      onboarding_requests: {
        Row: {
          access_enabled: boolean | null
          business_name: string
          business_type: string | null
          created_at: string
          documents: string[] | null
          email: string
          gstin: string | null
          id: string
          owner_name: string
          phone: string | null
          platforms: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["onboarding_status"]
          subscription_expiry: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string
        }
        Insert: {
          access_enabled?: boolean | null
          business_name: string
          business_type?: string | null
          created_at?: string
          documents?: string[] | null
          email: string
          gstin?: string | null
          id?: string
          owner_name: string
          phone?: string | null
          platforms?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          subscription_expiry?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
        }
        Update: {
          access_enabled?: boolean | null
          business_name?: string
          business_type?: string | null
          created_at?: string
          documents?: string[] | null
          email?: string
          gstin?: string | null
          id?: string
          owner_name?: string
          phone?: string | null
          platforms?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          subscription_expiry?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          gst_percent: number | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          total: number
          unit_price: number
        }
        Insert: {
          gst_percent?: number | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          sku?: string | null
          total?: number
          unit_price?: number
        }
        Update: {
          gst_percent?: number | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          total?: number
          unit_price?: number
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
          commission: number | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          customer_pincode: string | null
          customer_state: string | null
          delivered_date: string | null
          id: string
          order_date: string
          order_number: string
          portal: string
          shipped_date: string | null
          shipping_fee: number | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          vendor_id: string | null
          video_captured: boolean | null
          video_quality: string | null
        }
        Insert: {
          commission?: number | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_pincode?: string | null
          customer_state?: string | null
          delivered_date?: string | null
          id?: string
          order_date?: string
          order_number: string
          portal: string
          shipped_date?: string | null
          shipping_fee?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
          video_captured?: boolean | null
          video_quality?: string | null
        }
        Update: {
          commission?: number | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_pincode?: string | null
          customer_state?: string | null
          delivered_date?: string | null
          id?: string
          order_date?: string
          order_number?: string
          portal?: string
          shipped_date?: string | null
          shipping_fee?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
          video_captured?: boolean | null
          video_quality?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number
          brand: string | null
          category: string | null
          created_at: string
          created_by: string | null
          gst_percent: number | null
          hsn_code: string | null
          id: string
          image_url: string | null
          mrp: number
          name: string
          portals_enabled: string[] | null
          sku: string
          status: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          base_price?: number
          brand?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          gst_percent?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          mrp?: number
          name: string
          portals_enabled?: string[] | null
          sku: string
          status?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          base_price?: number
          brand?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          gst_percent?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          mrp?: number
          name?: string
          portals_enabled?: string[] | null
          sku?: string
          status?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_logs: {
        Row: {
          created_at: string
          date: string
          difference: number | null
          expected_orders: number | null
          id: string
          notes: string | null
          portal: string
          processed_orders: number | null
          status: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          difference?: number | null
          expected_orders?: number | null
          id?: string
          notes?: string | null
          portal: string
          processed_orders?: number | null
          status?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          difference?: number | null
          expected_orders?: number | null
          id?: string
          notes?: string | null
          portal?: string
          processed_orders?: number | null
          status?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      returns: {
        Row: {
          claim_status: string | null
          created_at: string
          customer_name: string
          evidence_urls: string[] | null
          id: string
          order_id: string | null
          order_number: string
          portal: string
          reason: string | null
          refund_amount: number | null
          requested_at: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["return_status"]
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          claim_status?: string | null
          created_at?: string
          customer_name: string
          evidence_urls?: string[] | null
          id?: string
          order_id?: string | null
          order_number: string
          portal: string
          reason?: string | null
          refund_amount?: number | null
          requested_at?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          claim_status?: string | null
          created_at?: string
          customer_name?: string
          evidence_urls?: string[] | null
          id?: string
          order_id?: string | null
          order_number?: string
          portal?: string
          reason?: string | null
          refund_amount?: number | null
          requested_at?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          commission: number | null
          created_at: string
          id: string
          locked: boolean
          net_amount: number
          portal: string
          reference_orders: string[] | null
          settlement_date: string | null
          settlement_id: string
          status: Database["public"]["Enums"]["settlement_status"]
          tax: number | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          commission?: number | null
          created_at?: string
          id?: string
          locked?: boolean
          net_amount?: number
          portal: string
          reference_orders?: string[] | null
          settlement_date?: string | null
          settlement_id: string
          status?: Database["public"]["Enums"]["settlement_status"]
          tax?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          commission?: number | null
          created_at?: string
          id?: string
          locked?: boolean
          net_amount?: number
          portal?: string
          reference_orders?: string[] | null
          settlement_date?: string | null
          settlement_id?: string
          status?: Database["public"]["Enums"]["settlement_status"]
          tax?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      can_access_vendor_data: { Args: { _vendor_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendor" | "operations"
      lead_priority: "low" | "medium" | "high"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "negotiation"
        | "won"
        | "lost"
      onboarding_status: "submitted" | "under_review" | "approved" | "rejected"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "rto"
        | "returned"
      return_status:
        | "requested"
        | "approved"
        | "rejected"
        | "pickup_scheduled"
        | "picked_up"
        | "received"
        | "refund_initiated"
        | "closed"
      settlement_status:
        | "pending"
        | "processing"
        | "completed"
        | "disputed"
        | "failed"
      subscription_status:
        | "trial"
        | "fully_paid"
        | "partially_paid"
        | "expired"
        | "suspended"
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
      app_role: ["admin", "vendor", "operations"],
      lead_priority: ["low", "medium", "high"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "negotiation",
        "won",
        "lost",
      ],
      onboarding_status: ["submitted", "under_review", "approved", "rejected"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "rto",
        "returned",
      ],
      return_status: [
        "requested",
        "approved",
        "rejected",
        "pickup_scheduled",
        "picked_up",
        "received",
        "refund_initiated",
        "closed",
      ],
      settlement_status: [
        "pending",
        "processing",
        "completed",
        "disputed",
        "failed",
      ],
      subscription_status: [
        "trial",
        "fully_paid",
        "partially_paid",
        "expired",
        "suspended",
      ],
    },
  },
} as const
