/**
 * Auto-generated from Supabase schema.
 * Generated via: supabase gen types typescript --local
 */

export type UserRole = 'admin' | 'vendor' | 'operations';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type ReturnStatus = 'requested' | 'approved' | 'rejected';
export type SettlementStatus = 'pending' | 'processed';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: UserRole;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role?: UserRole;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: UserRole;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendors: {
        Row: {
          vendor_id: string;
          user_id: string;
          name: string;
          commission_rate: number;
          created_at: string;
        };
        Insert: {
          vendor_id?: string;
          user_id: string;
          name: string;
          commission_rate?: number;
          created_at?: string;
        };
        Update: {
          vendor_id?: string;
          user_id?: string;
          name?: string;
          commission_rate?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          product_id: string;
          vendor_id: string;
          sku: string;
          name: string;
          price: number;
          stock: number;
          created_at: string;
        };
        Insert: {
          product_id?: string;
          vendor_id: string;
          sku: string;
          name: string;
          price: number;
          stock?: number;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          vendor_id?: string;
          sku?: string;
          name?: string;
          price?: number;
          stock?: number;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          order_id: string;
          product_id: string;
          quantity: number;
          total_amount: number;
          status: OrderStatus;
          created_at: string;
        };
        Insert: {
          order_id?: string;
          product_id: string;
          quantity: number;
          total_amount: number;
          status?: OrderStatus;
          created_at?: string;
        };
        Update: {
          order_id?: string;
          product_id?: string;
          quantity?: number;
          total_amount?: number;
          status?: OrderStatus;
          created_at?: string;
        };
      };
      returns: {
        Row: {
          return_id: string;
          order_id: string;
          reason: string;
          status: ReturnStatus;
          created_at: string;
        };
        Insert: {
          return_id?: string;
          order_id: string;
          reason: string;
          status?: ReturnStatus;
          created_at?: string;
        };
        Update: {
          return_id?: string;
          order_id?: string;
          reason?: string;
          status?: ReturnStatus;
          created_at?: string;
        };
      };
      settlements: {
        Row: {
          settlement_id: string;
          vendor_id: string;
          net_amount: number;
          status: SettlementStatus;
          created_at: string;
        };
        Insert: {
          settlement_id?: string;
          vendor_id: string;
          net_amount: number;
          status?: SettlementStatus;
          created_at?: string;
        };
        Update: {
          settlement_id?: string;
          vendor_id?: string;
          net_amount?: number;
          status?: SettlementStatus;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          expense_id: string;
          vendor_id: string;
          category: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          expense_id?: string;
          vendor_id: string;
          category: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          expense_id?: string;
          vendor_id?: string;
          category?: string;
          amount?: number;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      return_status: ReturnStatus;
      settlement_status: SettlementStatus;
    };
  };
}
