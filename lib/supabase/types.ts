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
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          package: "basic" | "advanced";
          status: "active" | "expired" | "cancelled" | "refunded";
          amount_paid: number;
          currency: string;
          stripe_payment_intent: string | null;
          stripe_customer_id: string | null;
          stripe_session_id: string | null;
          purchased_at: string;
          expires_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          package: "basic" | "advanced";
          status?: "active" | "expired" | "cancelled" | "refunded";
          amount_paid: number;
          currency?: string;
          stripe_payment_intent?: string | null;
          stripe_customer_id?: string | null;
          stripe_session_id?: string | null;
          purchased_at?: string;
          expires_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          package?: "basic" | "advanced";
          status?: "active" | "expired" | "cancelled" | "refunded";
          amount_paid?: number;
          currency?: string;
          stripe_payment_intent?: string | null;
          stripe_customer_id?: string | null;
          stripe_session_id?: string | null;
          purchased_at?: string;
          expires_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      levels: {
        Row: {
          id: string;
          level_number: 1 | 2 | 3;
          title: string;
          title_en: string | null;
          description: string | null;
          description_en: string | null;
          required_package: "basic" | "advanced" | null;
          required_level: number;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          level_number: 1 | 2 | 3;
          title: string;
          title_en?: string | null;
          description?: string | null;
          description_en?: string | null;
          required_package?: "basic" | "advanced" | null;
          required_level?: number;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          level_number?: 1 | 2 | 3;
          title?: string;
          title_en?: string | null;
          description?: string | null;
          description_en?: string | null;
          required_package?: "basic" | "advanced" | null;
          required_level?: number;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          level_id: string;
          chapter_number: number;
          title: string;
          title_en: string | null;
          description: string | null;
          description_en: string | null;
          video_duration: number;
          video_url: string | null;
          video_thumbnail_url: string | null;
          is_preview: boolean;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          level_id: string;
          chapter_number: number;
          title: string;
          title_en?: string | null;
          description?: string | null;
          description_en?: string | null;
          video_duration?: number;
          video_url?: string | null;
          video_thumbnail_url?: string | null;
          is_preview?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          level_id?: string;
          chapter_number?: number;
          title?: string;
          title_en?: string | null;
          description?: string | null;
          description_en?: string | null;
          video_duration?: number;
          video_url?: string | null;
          video_thumbnail_url?: string | null;
          is_preview?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          chapter_id: string;
          watch_percentage: number;
          watch_time: number;
          completed: boolean;
          completed_at: string | null;
          last_position: number;
          started_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chapter_id: string;
          watch_percentage?: number;
          watch_time?: number;
          completed?: boolean;
          completed_at?: string | null;
          last_position?: number;
          started_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          chapter_id?: string;
          watch_percentage?: number;
          watch_time?: number;
          completed?: boolean;
          completed_at?: string | null;
          last_position?: number;
          started_at?: string;
          updated_at?: string;
        };
      };
      certifications: {
        Row: {
          id: string;
          user_id: string;
          status:
            | "not_eligible"
            | "eligible"
            | "applied"
            | "under_review"
            | "approved"
            | "rejected";
          applied_at: string | null;
          review_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          approved_at: string | null;
          certificate_number: string | null;
          certificate_url: string | null;
          level1_completed_at: string | null;
          level2_completed_at: string | null;
          level3_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?:
            | "not_eligible"
            | "eligible"
            | "applied"
            | "under_review"
            | "approved"
            | "rejected";
          applied_at?: string | null;
          review_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          approved_at?: string | null;
          certificate_number?: string | null;
          certificate_url?: string | null;
          level1_completed_at?: string | null;
          level2_completed_at?: string | null;
          level3_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?:
            | "not_eligible"
            | "eligible"
            | "applied"
            | "under_review"
            | "approved"
            | "rejected";
          applied_at?: string | null;
          review_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          approved_at?: string | null;
          certificate_number?: string | null;
          certificate_url?: string | null;
          level1_completed_at?: string | null;
          level2_completed_at?: string | null;
          level3_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          user_id: string;
          device_name: string;
          device_type: "mobile" | "tablet" | "desktop" | "unknown" | null;
          browser: string | null;
          os: string | null;
          session_token: string | null;
          ip_address: string | null;
          user_agent: string | null;
          is_current: boolean;
          last_active: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_name: string;
          device_type?: "mobile" | "tablet" | "desktop" | "unknown" | null;
          browser?: string | null;
          os?: string | null;
          session_token?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          is_current?: boolean;
          last_active?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_name?: string;
          device_type?: "mobile" | "tablet" | "desktop" | "unknown" | null;
          browser?: string | null;
          os?: string | null;
          session_token?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          is_current?: boolean;
          last_active?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          slug: string;
          description: string | null;
          description_en: string | null;
          price: number;
          original_price: number | null;
          currency: string;
          category: "extensions" | "tools" | "care";
          images: string[];
          in_stock: boolean;
          stock_quantity: number;
          track_inventory: boolean;
          specifications: Json;
          featured: boolean;
          sort_order: number;
          is_published: boolean;
          stripe_product_id: string | null;
          stripe_price_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en?: string | null;
          slug: string;
          description?: string | null;
          description_en?: string | null;
          price: number;
          original_price?: number | null;
          currency?: string;
          category: "extensions" | "tools" | "care";
          images?: string[];
          in_stock?: boolean;
          stock_quantity?: number;
          track_inventory?: boolean;
          specifications?: Json;
          featured?: boolean;
          sort_order?: number;
          is_published?: boolean;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string | null;
          slug?: string;
          description?: string | null;
          description_en?: string | null;
          price?: number;
          original_price?: number | null;
          currency?: string;
          category?: "extensions" | "tools" | "care";
          images?: string[];
          in_stock?: boolean;
          stock_quantity?: number;
          track_inventory?: boolean;
          specifications?: Json;
          featured?: boolean;
          sort_order?: number;
          is_published?: boolean;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      webshop_orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          shipping_full_name: string;
          shipping_street: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_country: string;
          shipping_phone: string | null;
          items: Json;
          subtotal: number;
          shipping: number;
          discount: number;
          total: number;
          currency: string;
          coupon_code: string | null;
          coupon_id: string | null;
          status:
            | "pending"
            | "paid"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded";
          stripe_session_id: string | null;
          stripe_payment_intent: string | null;
          stripe_customer_id: string | null;
          tracking_number: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          customer_notes: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          shipping_full_name: string;
          shipping_street: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_country: string;
          shipping_phone?: string | null;
          items: Json;
          subtotal: number;
          shipping: number;
          discount?: number;
          total: number;
          currency?: string;
          coupon_code?: string | null;
          coupon_id?: string | null;
          status?:
            | "pending"
            | "paid"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded";
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          stripe_customer_id?: string | null;
          tracking_number?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          customer_notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          shipping_full_name?: string;
          shipping_street?: string;
          shipping_city?: string;
          shipping_postal_code?: string;
          shipping_country?: string;
          shipping_phone?: string | null;
          items?: Json;
          subtotal?: number;
          shipping?: number;
          discount?: number;
          total?: number;
          currency?: string;
          coupon_code?: string | null;
          coupon_id?: string | null;
          status?:
            | "pending"
            | "paid"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded";
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          stripe_customer_id?: string | null;
          tracking_number?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          customer_notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          minimum_order: number | null;
          maximum_discount: number | null;
          usage_limit: number | null;
          usage_count: number;
          one_per_customer: boolean;
          starts_at: string;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          minimum_order?: number | null;
          maximum_discount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          one_per_customer?: boolean;
          starts_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          discount_type?: "percentage" | "fixed";
          discount_value?: number;
          minimum_order?: number | null;
          maximum_discount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          one_per_customer?: boolean;
          starts_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      has_active_enrollment: {
        Args: { p_user_id: string; p_course_id: string };
        Returns: boolean;
      };
      get_user_progress: {
        Args: { p_user_id: string };
        Returns: {
          level_number: number;
          total_chapters: number;
          completed_chapters: number;
          progress_percentage: number;
        }[];
      };
      get_last_watched: {
        Args: { p_user_id: string };
        Returns: {
          chapter_id: string;
          chapter_title: string;
          level_number: number;
          last_position: number;
          watch_percentage: number;
        }[];
      };
      register_device: {
        Args: {
          p_user_id: string;
          p_device_name: string;
          p_device_type?: string;
          p_browser?: string;
          p_os?: string;
          p_ip_address?: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
      get_device_count: {
        Args: { p_user_id: string };
        Returns: number;
      };
      generate_certificate_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      generate_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      validate_coupon: {
        Args: {
          p_code: string;
          p_order_subtotal: number;
          p_user_id?: string;
        };
        Returns: {
          valid: boolean;
          error_message: string | null;
          discount_amount: number;
          coupon_id: string | null;
        }[];
      };
      update_certification_eligibility: {
        Args: { p_user_id: string };
        Returns: void;
      };
    };
  };
}

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];
export type Level = Database["public"]["Tables"]["levels"]["Row"];
export type Chapter = Database["public"]["Tables"]["chapters"]["Row"];
export type Progress = Database["public"]["Tables"]["progress"]["Row"];
export type Certification = Database["public"]["Tables"]["certifications"]["Row"];
export type Device = Database["public"]["Tables"]["devices"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type WebshopOrder = Database["public"]["Tables"]["webshop_orders"]["Row"];
export type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

// Insert types
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type EnrollmentInsert = Database["public"]["Tables"]["enrollments"]["Insert"];
export type ProgressInsert = Database["public"]["Tables"]["progress"]["Insert"];
export type WebshopOrderInsert = Database["public"]["Tables"]["webshop_orders"]["Insert"];
