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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_model: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          balance: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          id: string
          is_active: boolean | null
          name: string
          overdraft_limit: number
          owner_user: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_model?: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          balance?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          is_active?: boolean | null
          name: string
          overdraft_limit?: number
          owner_user?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_model?: string | null
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          is_active?: boolean | null
          name?: string
          overdraft_limit?: number
          owner_user?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_history: {
        Row: {
          amount: number | null
          card_name: string | null
          created_at: string
          currency: string | null
          entry_type: string
          id: string
          message: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          card_name?: string | null
          created_at?: string
          currency?: string | null
          entry_type?: string
          id?: string
          message: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          card_name?: string | null
          created_at?: string
          currency?: string | null
          entry_type?: string
          id?: string
          message?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_limits: {
        Row: {
          created_at: string
          daily_cost_limit_brl: number
          daily_requests_limit: number
          daily_tokens_limit: number
          id: string
          is_active: boolean
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_cost_limit_brl?: number
          daily_requests_limit?: number
          daily_tokens_limit?: number
          id?: string
          is_active?: boolean
          subscription_tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_cost_limit_brl?: number
          daily_requests_limit?: number
          daily_tokens_limit?: number
          id?: string
          is_active?: boolean
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_tracking: {
        Row: {
          created_at: string
          date: string
          estimated_cost_brl: number
          id: string
          requests_count: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          estimated_cost_brl?: number
          id?: string
          requests_count?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          estimated_cost_brl?: number
          id?: string
          requests_count?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      airline_promotions: {
        Row: {
          airline_code: string
          airline_name: string
          bonus_percentage: number | null
          created_at: string
          currency: string | null
          description: string | null
          discount_percentage: number | null
          end_date: string
          external_promotion_id: string | null
          id: string
          is_active: boolean
          last_synced_at: string | null
          miles_required: number | null
          original_price: number | null
          promotion_type: string
          promotion_url: string | null
          promotional_price: number | null
          route_from: string | null
          route_to: string | null
          start_date: string
          terms_conditions: string | null
          title: string
          updated_at: string
        }
        Insert: {
          airline_code: string
          airline_name: string
          bonus_percentage?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          end_date: string
          external_promotion_id?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          miles_required?: number | null
          original_price?: number | null
          promotion_type?: string
          promotion_url?: string | null
          promotional_price?: number | null
          route_from?: string | null
          route_to?: string | null
          start_date: string
          terms_conditions?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          airline_code?: string
          airline_name?: string
          bonus_percentage?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          end_date?: string
          external_promotion_id?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          miles_required?: number | null
          original_price?: number | null
          promotion_type?: string
          promotion_url?: string | null
          promotional_price?: number | null
          route_from?: string | null
          route_to?: string | null
          start_date?: string
          terms_conditions?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_mileage_rules: {
        Row: {
          amount_threshold: number
          bank_name: string
          card_brand: string
          card_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          existing_miles: number | null
          id: string
          is_active: boolean
          miles_per_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_threshold?: number
          bank_name: string
          card_brand: string
          card_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          existing_miles?: number | null
          id?: string
          is_active?: boolean
          miles_per_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_threshold?: number
          bank_name?: string
          card_brand?: string
          card_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          existing_miles?: number | null
          id?: string
          is_active?: boolean
          miles_per_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_mileage_rules_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          account_id: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          closing_date: number | null
          created_at: string
          credit_limit: number | null
          currency: Database["public"]["Enums"]["currency_type"]
          current_balance: number | null
          due_date: number | null
          id: string
          initial_balance: number | null
          initial_balance_original: number | null
          last_four_digits: string | null
          name: string
          owner_user: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          closing_date?: number | null
          created_at?: string
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_type"]
          current_balance?: number | null
          due_date?: number | null
          id?: string
          initial_balance?: number | null
          initial_balance_original?: number | null
          last_four_digits?: string | null
          name: string
          owner_user?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          card_type?: Database["public"]["Enums"]["card_type"]
          closing_date?: number | null
          created_at?: string
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_type"]
          current_balance?: number | null
          due_date?: number | null
          id?: string
          initial_balance?: number | null
          initial_balance_original?: number | null
          last_four_digits?: string | null
          name?: string
          owner_user?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_type: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          owner_user: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_type?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          owner_user?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_type?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          owner_user?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          applied_promo_discount: number | null
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          phone: string | null
          promo_code: string | null
          promo_final_price: number | null
          selected_plan: string
          session_token: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          applied_promo_discount?: number | null
          created_at?: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          phone?: string | null
          promo_code?: string | null
          promo_final_price?: number | null
          selected_plan?: string
          session_token?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          applied_promo_discount?: number | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          promo_code?: string | null
          promo_final_price?: number | null
          selected_plan?: string
          session_token?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      couple_relationship_requests: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          requested_email: string
          requester_user_id: string
          status: string
          updated_at: string | null
          verification_token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          requested_email: string
          requester_user_id: string
          status?: string
          updated_at?: string | null
          verification_token?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          requested_email?: string
          requester_user_id?: string
          status?: string
          updated_at?: string | null
          verification_token?: string
        }
        Relationships: []
      }
      default_categories: {
        Row: {
          category_type: string
          color: string
          created_at: string
          description_en: string | null
          description_es: string | null
          description_pt: string | null
          icon: string | null
          id: string
          name_en: string
          name_es: string
          name_pt: string
        }
        Insert: {
          category_type: string
          color?: string
          created_at?: string
          description_en?: string | null
          description_es?: string | null
          description_pt?: string | null
          icon?: string | null
          id?: string
          name_en: string
          name_es: string
          name_pt: string
        }
        Update: {
          category_type?: string
          color?: string
          created_at?: string
          description_en?: string | null
          description_es?: string | null
          description_pt?: string | null
          icon?: string | null
          id?: string
          name_en?: string
          name_es?: string
          name_pt?: string
        }
        Relationships: []
      }
      educational_content: {
        Row: {
          category: string
          content_type: string
          created_at: string
          created_by_admin_id: string
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content_type: string
          created_at?: string
          created_by_admin_id: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_type?: string
          created_at?: string
          created_by_admin_id?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          last_updated: string
          rate: number
          target_currency: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          rate: number
          target_currency: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          rate?: number
          target_currency?: string
        }
        Relationships: []
      }
      investment_goals: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          current_amount: number
          description: string | null
          id: string
          name: string
          owner_user: string | null
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          current_amount?: number
          description?: string | null
          id?: string
          name: string
          owner_user?: string | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          current_amount?: number
          description?: string | null
          id?: string
          name?: string
          owner_user?: string | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_performance: {
        Row: {
          created_at: string
          date: string
          id: string
          investment_id: string
          value: number
          yield_percentage: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          investment_id: string
          value?: number
          yield_percentage?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          investment_id?: string
          value?: number
          yield_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_performance_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_types: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          auto_calculate_yield: boolean | null
          broker: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          current_value: number
          goal_id: string | null
          id: string
          is_shared: boolean | null
          last_yield_date: string | null
          name: string
          notes: string | null
          owner_user: string | null
          purchase_date: string
          type: string
          updated_at: string
          user_id: string
          yield_type: string | null
          yield_value: number | null
        }
        Insert: {
          amount?: number
          auto_calculate_yield?: boolean | null
          broker?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          current_value?: number
          goal_id?: string | null
          id?: string
          is_shared?: boolean | null
          last_yield_date?: string | null
          name: string
          notes?: string | null
          owner_user?: string | null
          purchase_date?: string
          type: string
          updated_at?: string
          user_id: string
          yield_type?: string | null
          yield_value?: number | null
        }
        Update: {
          amount?: number
          auto_calculate_yield?: boolean | null
          broker?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          current_value?: number
          goal_id?: string | null
          id?: string
          is_shared?: boolean | null
          last_yield_date?: string | null
          name?: string
          notes?: string | null
          owner_user?: string | null
          purchase_date?: string
          type?: string
          updated_at?: string
          user_id?: string
          yield_type?: string | null
          yield_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "investment_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_premium_access: {
        Row: {
          approval_date: string | null
          approved_by_admin_id: string | null
          created_at: string
          created_by_admin_id: string
          email: string
          end_date: string
          id: string
          ip_address: string | null
          language_preference: string | null
          start_date: string
          status: string
          temp_password_hash: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          approval_date?: string | null
          approved_by_admin_id?: string | null
          created_at?: string
          created_by_admin_id: string
          email: string
          end_date: string
          id?: string
          ip_address?: string | null
          language_preference?: string | null
          start_date?: string
          status?: string
          temp_password_hash?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          approval_date?: string | null
          approved_by_admin_id?: string | null
          created_at?: string
          created_by_admin_id?: string
          email?: string
          end_date?: string
          id?: string
          ip_address?: string | null
          language_preference?: string | null
          start_date?: string
          status?: string
          temp_password_hash?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      manual_premium_access_audit: {
        Row: {
          action_type: string
          id: string
          ip_address: string | null
          performed_at: string
          performed_by_admin_id: string
          target_email: string
          target_record_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by_admin_id: string
          target_email: string
          target_record_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by_admin_id?: string
          target_email?: string
          target_record_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      mileage_goals: {
        Row: {
          created_at: string
          current_miles: number
          description: string | null
          id: string
          is_completed: boolean
          name: string
          source_card_id: string | null
          target_date: string | null
          target_miles: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_miles?: number
          description?: string | null
          id?: string
          is_completed?: boolean
          name: string
          source_card_id?: string | null
          target_date?: string | null
          target_miles: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_miles?: number
          description?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          source_card_id?: string | null
          target_date?: string | null
          target_miles?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_goals_source_card_id_fkey"
            columns: ["source_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_history: {
        Row: {
          amount_spent: number
          calculation_date: string
          card_id: string | null
          created_at: string
          id: string
          miles_earned: number
          month_year: string
          rule_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_spent: number
          calculation_date?: string
          card_id?: string | null
          created_at?: string
          id?: string
          miles_earned: number
          month_year: string
          rule_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_spent?: number
          calculation_date?: string
          card_id?: string | null
          created_at?: string
          id?: string
          miles_earned?: number
          month_year?: string
          rule_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_history_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "card_mileage_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_applications: {
        Row: {
          approved_at: string | null
          approved_by_admin_id: string | null
          audience_type: string | null
          created_at: string
          email: string
          id: string
          name: string
          payment_info: string | null
          phone: string | null
          referral_code_id: string | null
          social_media: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          audience_type?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          payment_info?: string | null
          phone?: string | null
          referral_code_id?: string | null
          social_media: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          audience_type?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          payment_info?: string | null
          phone?: string | null
          referral_code_id?: string | null
          social_media?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_partnership_referral_code"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          phone_number: string
          verification_code: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          phone_number: string
          verification_code: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          phone_number?: string
          verification_code?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          checkout_session_id: string | null
          created_at: string
          display_name: string | null
          id: string
          phone_number: string | null
          preferred_currency:
            | Database["public"]["Enums"]["currency_type"]
            | null
          second_user_email: string | null
          second_user_name: string | null
          subscribed: boolean | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          checkout_session_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone_number?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_type"]
            | null
          second_user_email?: string | null
          second_user_name?: string | null
          subscribed?: boolean | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          checkout_session_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone_number?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_type"]
            | null
          second_user_email?: string | null
          second_user_name?: string | null
          subscribed?: boolean | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by_admin_id: string | null
          current_uses: number
          discount_type: string
          discount_value: number
          expiry_date: string | null
          id: string
          is_active: boolean
          max_uses: number
          owner_user_id: string
          partner_email: string | null
          reward_amount: number | null
          reward_currency: string | null
          reward_description: string | null
          reward_type: string | null
          stripe_price_id: string | null
          updated_at: string
          valid_for_countries: string[] | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by_admin_id?: string | null
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          owner_user_id: string
          partner_email?: string | null
          reward_amount?: number | null
          reward_currency?: string | null
          reward_description?: string | null
          reward_type?: string | null
          stripe_price_id?: string | null
          updated_at?: string
          valid_for_countries?: string[] | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by_admin_id?: string | null
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          owner_user_id?: string
          partner_email?: string | null
          reward_amount?: number | null
          reward_currency?: string | null
          reward_description?: string | null
          reward_type?: string | null
          stripe_price_id?: string | null
          updated_at?: string
          valid_for_countries?: string[] | null
        }
        Relationships: []
      }
      promo_rewards: {
        Row: {
          created_at: string
          id: string
          owner_user_id: string
          paid_at: string | null
          promo_code_id: string
          reward_amount: number
          reward_currency: string
          status: string
          usage_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_user_id: string
          paid_at?: string | null
          promo_code_id: string
          reward_amount?: number
          reward_currency?: string
          status?: string
          usage_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_user_id?: string
          paid_at?: string | null
          promo_code_id?: string
          reward_amount?: number
          reward_currency?: string
          status?: string
          usage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_rewards_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category_id: string | null
          contract_duration_months: number | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          frequency_days: number
          id: string
          is_active: boolean | null
          name: string
          next_due_date: string
          owner_user: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category_id?: string | null
          contract_duration_months?: number | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          frequency_days?: number
          id?: string
          is_active?: boolean | null
          name: string
          next_due_date: string
          owner_user?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category_id?: string | null
          contract_duration_months?: number | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          frequency_days?: number
          id?: string
          is_active?: boolean | null
          name?: string
          next_due_date?: string
          owner_user?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by_admin_id: string | null
          current_uses: number
          expiry_date: string | null
          free_days_granted: number
          id: string
          is_active: boolean
          max_uses: number
          partner_email: string | null
          reward_amount: number
          reward_currency: string | null
          reward_description: string | null
          reward_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by_admin_id?: string | null
          current_uses?: number
          expiry_date?: string | null
          free_days_granted?: number
          id?: string
          is_active?: boolean
          max_uses?: number
          partner_email?: string | null
          reward_amount?: number
          reward_currency?: string | null
          reward_description?: string | null
          reward_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by_admin_id?: string | null
          current_uses?: number
          expiry_date?: string | null
          free_days_granted?: number
          id?: string
          is_active?: boolean
          max_uses?: number
          partner_email?: string | null
          reward_amount?: number
          reward_currency?: string | null
          reward_description?: string | null
          reward_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_date: string | null
          referral_id: string | null
          referrer_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string | null
          referral_id?: string | null
          referrer_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string | null
          referral_id?: string | null
          referrer_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          created_at: string
          free_days_granted: number
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string | null
          status: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          free_days_granted?: number
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id?: string | null
          status?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          free_days_granted?: number
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string | null
          status?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_metrics_cache: {
        Row: {
          active_users: number
          annual_revenue_brl: number
          canceled_subscriptions: number
          created_at: string
          failed_payments: number
          id: string
          last_updated: string
          monthly_revenue_brl: number
        }
        Insert: {
          active_users?: number
          annual_revenue_brl?: number
          canceled_subscriptions?: number
          created_at?: string
          failed_payments?: number
          id?: string
          last_updated?: string
          monthly_revenue_brl?: number
        }
        Update: {
          active_users?: number
          annual_revenue_brl?: number
          canceled_subscriptions?: number
          created_at?: string
          failed_payments?: number
          id?: string
          last_updated?: string
          monthly_revenue_brl?: number
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          description: string
          id: string
          installment_number: number | null
          is_installment: boolean | null
          owner_user: string | null
          payment_method: string | null
          purchase_date: string
          subcategory: string | null
          total_installments: number | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          description: string
          id?: string
          installment_number?: number | null
          is_installment?: boolean | null
          owner_user?: string | null
          payment_method?: string | null
          purchase_date?: string
          subcategory?: string | null
          total_installments?: number | null
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string
          id?: string
          installment_number?: number | null
          is_installment?: boolean | null
          owner_user?: string | null
          payment_method?: string | null
          purchase_date?: string
          subcategory?: string | null
          total_installments?: number | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_couples: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invitee_email: string
          invitee_name: string
          inviter_user_id: string
          status: string
          temp_password_hash: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invitee_email: string
          invitee_name: string
          inviter_user_id: string
          status?: string
          temp_password_hash?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invitee_email?: string
          invitee_name?: string
          inviter_user_id?: string
          status?: string
          temp_password_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_promotion_favorites: {
        Row: {
          created_at: string
          id: string
          promotion_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promotion_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promotion_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_promotion_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          notification_type: string
          promotion_id: string
          sent_at: string
          user_id: string
          user_miles_at_notification: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type?: string
          promotion_id: string
          sent_at?: string
          user_id: string
          user_miles_at_notification?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type?: string
          promotion_id?: string
          sent_at?: string
          user_id?: string
          user_miles_at_notification?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_promotion_notifications_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "airline_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_translate_category_name: {
        Args: { from_lang?: string; input_name: string }
        Returns: {
          en_description: string
          en_name: string
          es_description: string
          es_name: string
          pt_description: string
          pt_name: string
        }[]
      }
      check_manual_premium_expiration: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_user_promotion_eligibility: {
        Args: { p_promotion_id: string; p_user_id: string }
        Returns: boolean
      }
      create_default_categories_for_user: {
        Args: { user_id: string; user_language?: string }
        Returns: undefined
      }
      create_manual_premium_access: {
        Args: {
          p_email: string
          p_end_date?: string
          p_start_date?: string
          p_user_id: string
        }
        Returns: string
      }
      determine_owner_user: {
        Args: { p_user_id: string }
        Returns: string
      }
      fix_security_definer_views: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_temp_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_temp_password_for_invite: {
        Args: { p_record_id: string }
        Returns: string
      }
      get_user_daily_ai_usage: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          estimated_cost_brl: number
          requests_count: number
          tokens_used: number
        }[]
      }
      get_users_near_expiration: {
        Args: { days_before: number }
        Returns: {
          days_until_expiration: number
          email: string
          end_date: string
          language_preference: string
          user_id: string
        }[]
      }
      hash_temp_password: {
        Args: { password: string }
        Returns: string
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_expiration_email_sent: {
        Args: {
          p_email: string
          p_expiration_date: string
          p_language?: string
          p_user_id: string
          p_warning_type: string
        }
        Returns: undefined
      }
      normalize_text_simple: {
        Args: { input: string }
        Returns: string
      }
      recalculate_mileage_goals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_ai_usage: {
        Args: {
          p_estimated_cost_brl?: number
          p_tokens_used: number
          p_user_id: string
        }
        Returns: undefined
      }
      update_exchange_rate: {
        Args: {
          p_base_currency: string
          p_rate: number
          p_target_currency: string
        }
        Returns: undefined
      }
      use_referral_code: {
        Args: { p_code: string; p_referred_user_id: string }
        Returns: Json
      }
      verify_temp_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "checking" | "savings" | "investment"
      card_type: "credit" | "debit"
      currency_type: "BRL" | "USD" | "EUR"
      transaction_type: "income" | "expense"
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
      account_type: ["checking", "savings", "investment"],
      card_type: ["credit", "debit"],
      currency_type: ["BRL", "USD", "EUR"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
