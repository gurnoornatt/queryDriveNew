export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      deliveries: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          restaurant_id: string;
          pickup_address: Json;
          dropoff_address: Json;
          status: string;
          provider: string;
          provider_delivery_id: string;
          tracking_url: string;
          fee: number;
          fee_currency: string;
          estimated_pickup_time: string | null;
          estimated_dropoff_time: string | null;
          actual_pickup_time: string | null;
          actual_dropoff_time: string | null;
          external_delivery_id: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          restaurant_id: string;
          pickup_address: Json;
          dropoff_address: Json;
          status: string;
          provider: string;
          provider_delivery_id: string;
          tracking_url: string;
          fee: number;
          fee_currency: string;
          estimated_pickup_time?: string | null;
          estimated_dropoff_time?: string | null;
          actual_pickup_time?: string | null;
          actual_dropoff_time?: string | null;
          external_delivery_id: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          restaurant_id?: string;
          pickup_address?: Json;
          dropoff_address?: Json;
          status?: string;
          provider?: string;
          provider_delivery_id?: string;
          tracking_url?: string;
          fee?: number;
          fee_currency?: string;
          estimated_pickup_time?: string | null;
          estimated_dropoff_time?: string | null;
          actual_pickup_time?: string | null;
          actual_dropoff_time?: string | null;
          external_delivery_id?: string;
          metadata?: Json | null;
        };
      };
      provider_quotes: {
        Row: {
          id: string;
          created_at: string;
          provider: string;
          provider_quote_id: string;
          fee: number;
          fee_currency: string;
          expires_at: string;
          external_delivery_id: string;
          selected: boolean;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          provider: string;
          provider_quote_id: string;
          fee: number;
          fee_currency: string;
          expires_at: string;
          external_delivery_id: string;
          selected: boolean;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          provider?: string;
          provider_quote_id?: string;
          fee?: number;
          fee_currency?: string;
          expires_at?: string;
          external_delivery_id?: string;
          selected?: boolean;
          metadata?: Json | null;
        };
      };
      restaurants: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          address: Json;
          contact_phone: string;
          contact_email: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          address: Json;
          contact_phone: string;
          contact_email?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          address?: Json;
          contact_phone?: string;
          contact_email?: string | null;
          metadata?: Json | null;
        };
      };
    };
  };
}
