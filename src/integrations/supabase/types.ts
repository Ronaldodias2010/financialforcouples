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
    PostgrestVersion: "13.0.5"
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
          deleted_at: string | null
          id: string
          is_active: boolean | null
          is_cash_account: boolean | null
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
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_cash_account?: boolean | null
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
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_cash_account?: boolean | null
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
          user_question: string | null
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
          user_question?: string | null
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
          user_question?: string | null
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
          boarding_tax: number | null
          bonus_percentage: number | null
          created_at: string
          currency: string | null
          data_source: string | null
          departure_date: string | null
          description: string | null
          discount_percentage: number | null
          end_date: string
          external_promotion_id: string | null
          external_reference: string | null
          id: string
          is_active: boolean
          is_round_trip: boolean | null
          last_synced_at: string | null
          miles_required: number | null
          original_price: number | null
          promotion_type: string
          promotion_url: string | null
          promotional_price: number | null
          raw_price: number | null
          return_date: string | null
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
          boarding_tax?: number | null
          bonus_percentage?: number | null
          created_at?: string
          currency?: string | null
          data_source?: string | null
          departure_date?: string | null
          description?: string | null
          discount_percentage?: number | null
          end_date: string
          external_promotion_id?: string | null
          external_reference?: string | null
          id?: string
          is_active?: boolean
          is_round_trip?: boolean | null
          last_synced_at?: string | null
          miles_required?: number | null
          original_price?: number | null
          promotion_type?: string
          promotion_url?: string | null
          promotional_price?: number | null
          raw_price?: number | null
          return_date?: string | null
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
          boarding_tax?: number | null
          bonus_percentage?: number | null
          created_at?: string
          currency?: string | null
          data_source?: string | null
          departure_date?: string | null
          description?: string | null
          discount_percentage?: number | null
          end_date?: string
          external_promotion_id?: string | null
          external_reference?: string | null
          id?: string
          is_active?: boolean
          is_round_trip?: boolean | null
          last_synced_at?: string | null
          miles_required?: number | null
          original_price?: number | null
          promotion_type?: string
          promotion_url?: string | null
          promotional_price?: number | null
          raw_price?: number | null
          return_date?: string | null
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
          purchase_type: string | null
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
          purchase_type?: string | null
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
          purchase_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_mileage_rules_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "active_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_mileage_rules_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_payment_history: {
        Row: {
          account_id: string | null
          card_id: string
          created_at: string
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          card_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          card_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_payment_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payment_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payment_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "active_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payment_history_card_id_fkey"
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
          allows_partial_payment: boolean | null
          card_type: Database["public"]["Enums"]["card_type"]
          closing_date: number | null
          created_at: string
          credit_limit: number | null
          currency: Database["public"]["Enums"]["currency_type"]
          current_balance: number | null
          deleted_at: string | null
          due_date: number | null
          id: string
          initial_balance: number | null
          initial_balance_original: number | null
          last_four_digits: string | null
          minimum_payment_amount: number | null
          name: string
          owner_user: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          allows_partial_payment?: boolean | null
          card_type: Database["public"]["Enums"]["card_type"]
          closing_date?: number | null
          created_at?: string
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_type"]
          current_balance?: number | null
          deleted_at?: string | null
          due_date?: number | null
          id?: string
          initial_balance?: number | null
          initial_balance_original?: number | null
          last_four_digits?: string | null
          minimum_payment_amount?: number | null
          name: string
          owner_user?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          allows_partial_payment?: boolean | null
          card_type?: Database["public"]["Enums"]["card_type"]
          closing_date?: number | null
          created_at?: string
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_type"]
          current_balance?: number | null
          deleted_at?: string | null
          due_date?: number | null
          id?: string
          initial_balance?: number | null
          initial_balance_original?: number | null
          last_four_digits?: string | null
          minimum_payment_amount?: number | null
          name?: string
          owner_user?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cards_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cards_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_history: {
        Row: {
          account_id: string | null
          account_name: string | null
          amount: number
          balance_after: number
          balance_before: number
          business_at: string | null
          card_id: string | null
          card_name: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string
          id: string
          is_reconciled: boolean | null
          movement_date: string
          movement_type: string
          notes: string | null
          owner_user: string | null
          payment_method: string | null
          period_month: number | null
          period_quarter: number | null
          period_year: number | null
          reconciled_at: string | null
          reconciled_by: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          amount: number
          balance_after: number
          balance_before?: number
          business_at?: string | null
          card_id?: string | null
          card_name?: string | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description: string
          id?: string
          is_reconciled?: boolean | null
          movement_date: string
          movement_type: string
          notes?: string | null
          owner_user?: string | null
          payment_method?: string | null
          period_month?: number | null
          period_quarter?: number | null
          period_year?: number | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          amount?: number
          balance_after?: number
          balance_before?: number
          business_at?: string | null
          card_id?: string | null
          card_name?: string | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string
          id?: string
          is_reconciled?: boolean | null
          movement_date?: string
          movement_type?: string
          notes?: string | null
          owner_user?: string | null
          payment_method?: string | null
          period_month?: number | null
          period_quarter?: number | null
          period_year?: number | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cash_flow_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cash_flow_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cash_flow_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "active_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cash_flow_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cash_flow_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cash_flow_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cash_flow_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "active_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cash_flow_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "ai_transactions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cash_flow_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_monthly_summary: {
        Row: {
          account_id: string | null
          closed_at: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          final_balance: number
          id: string
          initial_balance: number
          is_closed: boolean | null
          month: number
          net_result: number | null
          owner_user: string | null
          total_expense: number
          total_income: number
          transaction_count: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          account_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          final_balance?: number
          id?: string
          initial_balance?: number
          is_closed?: boolean | null
          month: number
          net_result?: number | null
          owner_user?: string | null
          total_expense?: number
          total_income?: number
          transaction_count?: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          account_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          final_balance?: number
          id?: string
          initial_balance?: number
          is_closed?: boolean | null
          month?: number
          net_result?: number | null
          owner_user?: string | null
          total_expense?: number
          total_income?: number
          transaction_count?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_monthly_summary_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_monthly_summary_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_type: string
          color: string | null
          created_at: string
          default_category_id: string | null
          deleted_at: string | null
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
          default_category_id?: string | null
          deleted_at?: string | null
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
          default_category_id?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          owner_user?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_categories_default_category"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "default_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_tag_relations: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          tag_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          tag_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_tag_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "default_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "category_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      category_tags: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          keywords_en: string[] | null
          keywords_es: string[] | null
          keywords_pt: string[] | null
          name_en: string
          name_es: string
          name_pt: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          keywords_en?: string[] | null
          keywords_es?: string[] | null
          keywords_pt?: string[] | null
          name_en: string
          name_es: string
          name_pt: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          keywords_en?: string[] | null
          keywords_es?: string[] | null
          keywords_pt?: string[] | null
          name_en?: string
          name_es?: string
          name_pt?: string
          updated_at?: string
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
      couple_agreement_compliance: {
        Row: {
          agreement_id: string | null
          compliance_percentage: number | null
          compliant: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          reviewed_at: string | null
          reviewed_by: string | null
          violations: Json | null
        }
        Insert: {
          agreement_id?: string | null
          compliance_percentage?: number | null
          compliant?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          violations?: Json | null
        }
        Update: {
          agreement_id?: string | null
          compliance_percentage?: number | null
          compliant?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          violations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_agreement_compliance_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "couple_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_agreements: {
        Row: {
          accepted_by_user1: boolean | null
          accepted_by_user2: boolean | null
          agreement_type: string
          couple_id: string | null
          created_at: string | null
          created_by: string | null
          decision_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          review_date: string | null
          rules: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          accepted_by_user1?: boolean | null
          accepted_by_user2?: boolean | null
          agreement_type: string
          couple_id?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          review_date?: string | null
          rules?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          accepted_by_user1?: boolean | null
          accepted_by_user2?: boolean | null
          agreement_type?: string
          couple_id?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          review_date?: string | null
          rules?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_agreements_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "user_couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_agreements_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "couple_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_decision_votes: {
        Row: {
          condition: string | null
          created_at: string | null
          decision_id: string | null
          id: string
          notes: string | null
          selected_scenario: string | null
          updated_at: string | null
          user_id: string | null
          vote: string
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          decision_id?: string | null
          id?: string
          notes?: string | null
          selected_scenario?: string | null
          updated_at?: string | null
          user_id?: string | null
          vote: string
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          decision_id?: string | null
          id?: string
          notes?: string | null
          selected_scenario?: string | null
          updated_at?: string | null
          user_id?: string | null
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_decision_votes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "couple_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_decisions: {
        Row: {
          action_plan: Json | null
          category: string | null
          context_data: Json | null
          couple_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          decision_type: string
          description: string | null
          estimated_value: number | null
          final_decision: Json | null
          id: string
          motivation: string | null
          paused_until: string | null
          restrictions: Json | null
          scenarios: Json | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
          urgency: string | null
          who_wants: string | null
        }
        Insert: {
          action_plan?: Json | null
          category?: string | null
          context_data?: Json | null
          couple_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          decision_type: string
          description?: string | null
          estimated_value?: number | null
          final_decision?: Json | null
          id?: string
          motivation?: string | null
          paused_until?: string | null
          restrictions?: Json | null
          scenarios?: Json | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          urgency?: string | null
          who_wants?: string | null
        }
        Update: {
          action_plan?: Json | null
          category?: string | null
          context_data?: Json | null
          couple_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          decision_type?: string
          description?: string | null
          estimated_value?: number | null
          final_decision?: Json | null
          id?: string
          motivation?: string | null
          paused_until?: string | null
          restrictions?: Json | null
          scenarios?: Json | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
          who_wants?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_decisions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "user_couples"
            referencedColumns: ["id"]
          },
        ]
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
      default_subcategories: {
        Row: {
          color: string | null
          created_at: string | null
          default_category_id: string | null
          icon: string | null
          id: string
          name: string
          name_en: string | null
          name_es: string | null
          name_pt: string | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_category_id?: string | null
          icon?: string | null
          id?: string
          name: string
          name_en?: string | null
          name_es?: string | null
          name_pt?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_category_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
          name_es?: string | null
          name_pt?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "default_subcategories_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "default_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_content: {
        Row: {
          category: string
          content_type: string
          created_at: string
          created_by_admin_id: string
          description: string | null
          description_en: string | null
          description_es: string | null
          description_pt: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number | null
          title: string
          title_en: string | null
          title_es: string | null
          title_pt: string | null
          updated_at: string
          web_content: string | null
          web_content_en: string | null
          web_content_es: string | null
          web_content_pt: string | null
        }
        Insert: {
          category: string
          content_type: string
          created_at?: string
          created_by_admin_id: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          description_pt?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number | null
          title: string
          title_en?: string | null
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
          web_content?: string | null
          web_content_en?: string | null
          web_content_es?: string | null
          web_content_pt?: string | null
        }
        Update: {
          category?: string
          content_type?: string
          created_at?: string
          created_by_admin_id?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          description_pt?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number | null
          title?: string
          title_en?: string | null
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
          web_content?: string | null
          web_content_en?: string | null
          web_content_es?: string | null
          web_content_pt?: string | null
        }
        Relationships: []
      }
      emergency_fund_reminders: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          reminder_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          reminder_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          reminder_type?: string
          updated_at?: string | null
          user_id?: string
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
          rate_date: string | null
          target_currency: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          rate: number
          rate_date?: string | null
          target_currency: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          rate?: number
          rate_date?: string | null
          target_currency?: string
        }
        Relationships: []
      }
      extension_sync_logs: {
        Row: {
          balance: number
          created_at: string
          error_message: string | null
          extension_version: string | null
          id: string
          ip_address: string | null
          program_code: string
          program_name: string
          raw_text: string | null
          source_url: string | null
          sync_status: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          balance: number
          created_at?: string
          error_message?: string | null
          extension_version?: string | null
          id?: string
          ip_address?: string | null
          program_code: string
          program_name: string
          raw_text?: string | null
          source_url?: string | null
          sync_status?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          error_message?: string | null
          extension_version?: string | null
          id?: string
          ip_address?: string | null
          program_code?: string
          program_name?: string
          raw_text?: string | null
          source_url?: string | null
          sync_status?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_audit_log: {
        Row: {
          action_details: Json | null
          action_type: string
          id: string
          imported_file_id: string | null
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          id?: string
          imported_file_id?: string | null
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          id?: string
          imported_file_id?: string | null
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_audit_log_imported_file_id_fkey"
            columns: ["imported_file_id"]
            isOneToOne: false
            referencedRelation: "imported_files"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_files: {
        Row: {
          created_at: string
          detected_currency: string | null
          detected_language: string | null
          detected_region: string | null
          file_hash: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          processing_error: string | null
          processing_status: string
          statement_type: string | null
          total_transactions: number | null
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detected_currency?: string | null
          detected_language?: string | null
          detected_region?: string | null
          file_hash: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          processing_error?: string | null
          processing_status?: string
          statement_type?: string | null
          total_transactions?: number | null
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detected_currency?: string | null
          detected_language?: string | null
          detected_region?: string | null
          file_hash?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          processing_error?: string | null
          processing_status?: string
          statement_type?: string | null
          total_transactions?: number | null
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      imported_transactions: {
        Row: {
          confidence_score: number | null
          created_at: string
          duplicate_transaction_id: string | null
          final_account_id: string | null
          final_card_id: string | null
          final_category_id: string | null
          final_payment_method: string | null
          final_tags: string[] | null
          id: string
          imported_file_id: string
          installment_current: number | null
          installment_total: number | null
          is_duplicate: boolean | null
          is_fee: boolean | null
          is_installment: boolean | null
          is_transfer: boolean | null
          normalized_amount: number | null
          normalized_currency: string
          normalized_date: string | null
          original_amount: string
          original_currency: string | null
          original_date: string
          original_description: string
          review_notes: string | null
          suggested_category_id: string | null
          suggested_payment_method: string | null
          transaction_type: string | null
          updated_at: string
          user_id: string
          validation_status: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          duplicate_transaction_id?: string | null
          final_account_id?: string | null
          final_card_id?: string | null
          final_category_id?: string | null
          final_payment_method?: string | null
          final_tags?: string[] | null
          id?: string
          imported_file_id: string
          installment_current?: number | null
          installment_total?: number | null
          is_duplicate?: boolean | null
          is_fee?: boolean | null
          is_installment?: boolean | null
          is_transfer?: boolean | null
          normalized_amount?: number | null
          normalized_currency?: string
          normalized_date?: string | null
          original_amount: string
          original_currency?: string | null
          original_date: string
          original_description: string
          review_notes?: string | null
          suggested_category_id?: string | null
          suggested_payment_method?: string | null
          transaction_type?: string | null
          updated_at?: string
          user_id: string
          validation_status?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          duplicate_transaction_id?: string | null
          final_account_id?: string | null
          final_card_id?: string | null
          final_category_id?: string | null
          final_payment_method?: string | null
          final_tags?: string[] | null
          id?: string
          imported_file_id?: string
          installment_current?: number | null
          installment_total?: number | null
          is_duplicate?: boolean | null
          is_fee?: boolean | null
          is_installment?: boolean | null
          is_transfer?: boolean | null
          normalized_amount?: number | null
          normalized_currency?: string
          normalized_date?: string | null
          original_amount?: string
          original_currency?: string | null
          original_date?: string
          original_description?: string
          review_notes?: string | null
          suggested_category_id?: string | null
          suggested_payment_method?: string | null
          transaction_type?: string | null
          updated_at?: string
          user_id?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_transactions_imported_file_id_fkey"
            columns: ["imported_file_id"]
            isOneToOne: false
            referencedRelation: "imported_files"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_financial_inputs: {
        Row: {
          account_hint: string | null
          amount: number | null
          card_hint: string | null
          category_hint: string | null
          confidence_score: number | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"] | null
          description_hint: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          owner_user: string | null
          payment_method: string | null
          processed_at: string | null
          raw_message: string
          resolved_account_id: string | null
          resolved_card_id: string | null
          resolved_category_id: string | null
          resolved_subcategory_id: string | null
          source: string
          status: string
          subcategory_confidence: string | null
          subcategory_hint: string | null
          transaction_date: string | null
          transaction_id: string | null
          transaction_type: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
          whatsapp_message_id: string | null
        }
        Insert: {
          account_hint?: string | null
          amount?: number | null
          card_hint?: string | null
          category_hint?: string | null
          confidence_score?: number | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description_hint?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          owner_user?: string | null
          payment_method?: string | null
          processed_at?: string | null
          raw_message: string
          resolved_account_id?: string | null
          resolved_card_id?: string | null
          resolved_category_id?: string | null
          resolved_subcategory_id?: string | null
          source?: string
          status?: string
          subcategory_confidence?: string | null
          subcategory_hint?: string | null
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
          whatsapp_message_id?: string | null
        }
        Update: {
          account_hint?: string | null
          amount?: number | null
          card_hint?: string | null
          category_hint?: string | null
          confidence_score?: number | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description_hint?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          owner_user?: string | null
          payment_method?: string | null
          processed_at?: string | null
          raw_message?: string
          resolved_account_id?: string | null
          resolved_card_id?: string | null
          resolved_category_id?: string | null
          resolved_subcategory_id?: string | null
          source?: string
          status?: string
          subcategory_confidence?: string | null
          subcategory_hint?: string | null
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incoming_financial_inputs_resolved_subcategory_id_fkey"
            columns: ["resolved_subcategory_id"]
            isOneToOne: false
            referencedRelation: "active_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incoming_financial_inputs_resolved_subcategory_id_fkey"
            columns: ["resolved_subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_goals: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          current_amount: number
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
            referencedRelation: "active_investments"
            referencedColumns: ["id"]
          },
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      manual_future_expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string
          due_date: string
          id: string
          is_overdue: boolean | null
          is_paid: boolean
          notes: string | null
          owner_user: string
          paid_at: string | null
          payment_method: string | null
          recurring_expense_id: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description: string
          due_date: string
          id?: string
          is_overdue?: boolean | null
          is_paid?: boolean
          notes?: string | null
          owner_user?: string
          paid_at?: string | null
          payment_method?: string | null
          recurring_expense_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          due_date?: string
          id?: string
          is_overdue?: boolean | null
          is_paid?: boolean
          notes?: string | null
          owner_user?: string
          paid_at?: string | null
          payment_method?: string | null
          recurring_expense_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_future_expenses_recurring"
            columns: ["recurring_expense_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_manual_future_expenses_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_manual_future_expenses_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_future_incomes: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          days_overdue: number | null
          deleted_at: string | null
          description: string
          due_date: string
          id: string
          is_overdue: boolean
          is_received: boolean
          notes: string | null
          owner_user: string
          payment_method: string
          received_at: string | null
          received_late: boolean | null
          subcategory_id: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          days_overdue?: number | null
          deleted_at?: string | null
          description: string
          due_date: string
          id?: string
          is_overdue?: boolean
          is_received?: boolean
          notes?: string | null
          owner_user?: string
          payment_method?: string
          received_at?: string | null
          received_late?: boolean | null
          subcategory_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          days_overdue?: number | null
          deleted_at?: string | null
          description?: string
          due_date?: string
          id?: string
          is_overdue?: boolean
          is_received?: boolean
          notes?: string | null
          owner_user?: string
          payment_method?: string
          received_at?: string | null
          received_late?: boolean | null
          subcategory_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_manual_future_incomes_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_manual_future_incomes_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_manual_future_incomes_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_manual_future_incomes_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_future_incomes_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "active_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_future_incomes_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
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
      market_rates: {
        Row: {
          bcb_series: number | null
          created_at: string
          id: string
          indicator: string
          previous_value: number | null
          rate_date: string
          recorded_at: string
          source: string
          unit: string
          updated_at: string
          value: number
          variation: number | null
        }
        Insert: {
          bcb_series?: number | null
          created_at?: string
          id?: string
          indicator: string
          previous_value?: number | null
          rate_date?: string
          recorded_at?: string
          source?: string
          unit?: string
          updated_at?: string
          value: number
          variation?: number | null
        }
        Update: {
          bcb_series?: number | null
          created_at?: string
          id?: string
          indicator?: string
          previous_value?: number | null
          rate_date?: string
          recorded_at?: string
          source?: string
          unit?: string
          updated_at?: string
          value?: number
          variation?: number | null
        }
        Relationships: []
      }
      migration_audit_log: {
        Row: {
          action: string
          affected_rows: number | null
          created_at: string
          error_message: string | null
          executed_at: string
          executed_by: string
          id: string
          notes: string | null
          phase: string
          status: string
        }
        Insert: {
          action: string
          affected_rows?: number | null
          created_at?: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string
          id?: string
          notes?: string | null
          phase: string
          status?: string
        }
        Update: {
          action?: string
          affected_rows?: number | null
          created_at?: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string
          id?: string
          notes?: string | null
          phase?: string
          status?: string
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
            referencedRelation: "active_cards"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_cards"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "ai_transactions_view"
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
      mileage_program_history: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          miles_amount: number
          program_id: string | null
          source: string | null
          transaction_date: string
          transaction_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          miles_amount: number
          program_id?: string | null
          source?: string | null
          transaction_date: string
          transaction_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          miles_amount?: number
          program_id?: string | null
          source?: string | null
          transaction_date?: string
          transaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_program_history_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "mileage_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_programs: {
        Row: {
          access_token: string | null
          balance_miles: number | null
          balance_value: number | null
          created_at: string | null
          external_member_id: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          last_synced_at: string | null
          program_code: string
          program_name: string
          refresh_token: string | null
          status: string
          sync_source: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          balance_miles?: number | null
          balance_value?: number | null
          created_at?: string | null
          external_member_id?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_synced_at?: string | null
          program_code: string
          program_name: string
          refresh_token?: string | null
          status?: string
          sync_source?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          balance_miles?: number | null
          balance_value?: number | null
          created_at?: string | null
          external_member_id?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_synced_at?: string | null
          program_code?: string
          program_name?: string
          refresh_token?: string | null
          status?: string
          sync_source?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moblix_offers: {
        Row: {
          created_at: string | null
          external_id: string
          id: string
          processed: boolean | null
          raw_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: string
          id?: string
          processed?: boolean | null
          raw_data: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string
          id?: string
          processed?: boolean | null
          raw_data?: Json
          updated_at?: string | null
        }
        Relationships: []
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
      payment_email_queue: {
        Row: {
          created_at: string
          email_address: string
          email_type: string
          failure_reason: string | null
          id: string
          language: string
          scheduled_for: string
          sent_at: string | null
          status: string
          subscription_end_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address: string
          email_type: string
          failure_reason?: string | null
          id?: string
          language?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subscription_end_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string
          email_type?: string
          failure_reason?: string | null
          id?: string
          language?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subscription_end_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_failures: {
        Row: {
          created_at: string
          downgrade_scheduled_for: string | null
          email: string
          failure_date: string
          failure_reason: string | null
          grace_period_ends_at: string | null
          grace_period_started_at: string | null
          id: string
          notification_emails_sent: Json | null
          resolved_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          downgrade_scheduled_for?: string | null
          email: string
          failure_date?: string
          failure_reason?: string | null
          grace_period_ends_at?: string | null
          grace_period_started_at?: string | null
          id?: string
          notification_emails_sent?: Json | null
          resolved_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          downgrade_scheduled_for?: string | null
          email?: string
          failure_date?: string
          failure_reason?: string | null
          grace_period_ends_at?: string | null
          grace_period_started_at?: string | null
          id?: string
          notification_emails_sent?: Json | null
          resolved_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          cpf: string | null
          cpf_partner: string | null
          created_at: string
          display_name: string | null
          email_verified: boolean | null
          id: string
          phone_number: string | null
          preferred_currency:
            | Database["public"]["Enums"]["currency_type"]
            | null
          provisional_login: boolean | null
          second_user_email: string | null
          second_user_name: string | null
          subscribed: boolean | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
          whatsapp_verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          checkout_session_id?: string | null
          cpf?: string | null
          cpf_partner?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          id?: string
          phone_number?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_type"]
            | null
          provisional_login?: boolean | null
          second_user_email?: string | null
          second_user_name?: string | null
          subscribed?: boolean | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
          whatsapp_verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          checkout_session_id?: string | null
          cpf?: string | null
          cpf_partner?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          id?: string
          phone_number?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_type"]
            | null
          provisional_login?: boolean | null
          second_user_email?: string | null
          second_user_name?: string | null
          subscribed?: boolean | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_verified_at?: string | null
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
      rate_limit_entries: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
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
          deleted_at: string | null
          frequency_days: number
          frequency_type: string | null
          id: string
          is_active: boolean | null
          is_completed: boolean | null
          is_overdue: boolean | null
          name: string
          next_due_date: string
          owner_user: string | null
          remaining_installments: number | null
          subcategory_id: string | null
          total_installments: number | null
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
          deleted_at?: string | null
          frequency_days?: number
          frequency_type?: string | null
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          is_overdue?: boolean | null
          name: string
          next_due_date: string
          owner_user?: string | null
          remaining_installments?: number | null
          subcategory_id?: string | null
          total_installments?: number | null
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
          deleted_at?: string | null
          frequency_days?: number
          frequency_type?: string | null
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          is_overdue?: boolean | null
          name?: string
          next_due_date?: string
          owner_user?: string | null
          remaining_installments?: number | null
          subcategory_id?: string | null
          total_installments?: number | null
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
            foreignKeyName: "recurring_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "active_cards"
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
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "active_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
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
      scraped_promotions: {
        Row: {
          created_at: string
          data_coleta: string
          descricao: string | null
          destino: string
          expires_at: string | null
          external_hash: string | null
          fonte: string
          id: string
          is_active: boolean
          link: string
          milhas_min: number
          origem: string | null
          programa: string
          titulo: string | null
        }
        Insert: {
          created_at?: string
          data_coleta?: string
          descricao?: string | null
          destino: string
          expires_at?: string | null
          external_hash?: string | null
          fonte: string
          id?: string
          is_active?: boolean
          link: string
          milhas_min: number
          origem?: string | null
          programa: string
          titulo?: string | null
        }
        Update: {
          created_at?: string
          data_coleta?: string
          descricao?: string | null
          destino?: string
          expires_at?: string | null
          external_hash?: string | null
          fonte?: string
          id?: string
          is_active?: boolean
          link?: string
          milhas_min?: number
          origem?: string | null
          programa?: string
          titulo?: string | null
        }
        Relationships: []
      }
      scraping_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          pages_scraped: number | null
          promotions_found: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          pages_scraped?: number | null
          promotions_found?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          pages_scraped?: number | null
          promotions_found?: number | null
          started_at?: string
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
          category_id: string
          color: string | null
          created_at: string
          deleted_at: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          name_en: string | null
          name_es: string | null
          source_tag_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          name_en?: string | null
          name_es?: string | null
          source_tag_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          name_en?: string | null
          name_es?: string | null
          source_tag_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
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
      tax_assets: {
        Row: {
          acquisition_date: string | null
          acquisition_value: number | null
          asset_code: string | null
          asset_type: string
          created_at: string | null
          description: string
          id: string
          ir_description: string | null
          location: string | null
          owner_user: string | null
          source_id: string | null
          source_table: string | null
          tax_year: number
          updated_at: string | null
          user_id: string
          value_at_year_end: number | null
          value_at_year_start: number | null
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_value?: number | null
          asset_code?: string | null
          asset_type: string
          created_at?: string | null
          description: string
          id?: string
          ir_description?: string | null
          location?: string | null
          owner_user?: string | null
          source_id?: string | null
          source_table?: string | null
          tax_year: number
          updated_at?: string | null
          user_id: string
          value_at_year_end?: number | null
          value_at_year_start?: number | null
        }
        Update: {
          acquisition_date?: string | null
          acquisition_value?: number | null
          asset_code?: string | null
          asset_type?: string
          created_at?: string | null
          description?: string
          id?: string
          ir_description?: string | null
          location?: string | null
          owner_user?: string | null
          source_id?: string | null
          source_table?: string | null
          tax_year?: number
          updated_at?: string | null
          user_id?: string
          value_at_year_end?: number | null
          value_at_year_start?: number | null
        }
        Relationships: []
      }
      tax_deduction_documents: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          document_name: string | null
          document_url: string | null
          id: string
          notes: string | null
          owner_user: string | null
          provider_cpf_cnpj: string | null
          provider_name: string | null
          status: string | null
          tax_year: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          owner_user?: string | null
          provider_cpf_cnpj?: string | null
          provider_name?: string | null
          status?: string | null
          tax_year: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          owner_user?: string | null
          provider_cpf_cnpj?: string | null
          provider_name?: string | null
          status?: string | null
          tax_year?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_deduction_documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "active_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_deduction_documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "ai_transactions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_deduction_documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_report_config: {
        Row: {
          accepted_suggestions: Json | null
          created_at: string | null
          declaration_type: string
          declared_at: string | null
          dependents: Json | null
          diagnostic_answers: Json | null
          diagnostic_completed_at: string | null
          final_summary: Json | null
          id: string
          notes: string | null
          notes_next_year: string | null
          primary_declarant: string
          progress_percentage: number | null
          receita_status: string | null
          rejected_suggestions: Json | null
          section_status: Json | null
          status: string
          tax_country: string | null
          tax_year: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_suggestions?: Json | null
          created_at?: string | null
          declaration_type?: string
          declared_at?: string | null
          dependents?: Json | null
          diagnostic_answers?: Json | null
          diagnostic_completed_at?: string | null
          final_summary?: Json | null
          id?: string
          notes?: string | null
          notes_next_year?: string | null
          primary_declarant?: string
          progress_percentage?: number | null
          receita_status?: string | null
          rejected_suggestions?: Json | null
          section_status?: Json | null
          status?: string
          tax_country?: string | null
          tax_year: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_suggestions?: Json | null
          created_at?: string | null
          declaration_type?: string
          declared_at?: string | null
          dependents?: Json | null
          diagnostic_answers?: Json | null
          diagnostic_completed_at?: string | null
          final_summary?: Json | null
          id?: string
          notes?: string | null
          notes_next_year?: string | null
          primary_declarant?: string
          progress_percentage?: number | null
          receita_status?: string | null
          rejected_suggestions?: Json | null
          section_status?: Json | null
          status?: string
          tax_country?: string | null
          tax_year?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          photo_url: string | null
          rating: number | null
          status: string | null
          testimonial_text: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          photo_url?: string | null
          rating?: number | null
          status?: string | null
          testimonial_text: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          rating?: number | null
          status?: string | null
          testimonial_text?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_audit_log: {
        Row: {
          action_type: string
          change_reason: string | null
          changed_fields: string[] | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          performed_at: string | null
          session_id: string | null
          source_application: string | null
          transaction_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          change_reason?: string | null
          changed_fields?: string[] | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          session_id?: string | null
          source_application?: string | null
          transaction_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          change_reason?: string | null
          changed_fields?: string[] | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          session_id?: string | null
          source_application?: string | null
          transaction_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          amount_original: number | null
          business_at: string | null
          card_id: string | null
          card_transaction_type: string | null
          category_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          currency_original: string | null
          deleted_at: string | null
          description: string
          due_date: string | null
          exchange_rate_used: number | null
          expense_source_type: string | null
          external_reference_id: string | null
          id: string
          installment_number: number | null
          is_installment: boolean | null
          owner_user: string | null
          payment_method: string | null
          purchase_date: string
          source: string | null
          status: string
          subcategory: string | null
          subcategory_id: string | null
          tag_id: string | null
          total_installments: number | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          amount_original?: number | null
          business_at?: string | null
          card_id?: string | null
          card_transaction_type?: string | null
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          currency_original?: string | null
          deleted_at?: string | null
          description: string
          due_date?: string | null
          exchange_rate_used?: number | null
          expense_source_type?: string | null
          external_reference_id?: string | null
          id?: string
          installment_number?: number | null
          is_installment?: boolean | null
          owner_user?: string | null
          payment_method?: string | null
          purchase_date?: string
          source?: string | null
          status?: string
          subcategory?: string | null
          subcategory_id?: string | null
          tag_id?: string | null
          total_installments?: number | null
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          amount_original?: number | null
          business_at?: string | null
          card_id?: string | null
          card_transaction_type?: string | null
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          currency_original?: string | null
          deleted_at?: string | null
          description?: string
          due_date?: string | null
          exchange_rate_used?: number | null
          expense_source_type?: string | null
          external_reference_id?: string | null
          id?: string
          installment_number?: number | null
          is_installment?: boolean | null
          owner_user?: string | null
          payment_method?: string | null
          purchase_date?: string
          source?: string | null
          status?: string
          subcategory?: string | null
          subcategory_id?: string | null
          tag_id?: string | null
          total_installments?: number | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "active_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_tag"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "category_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "active_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa_codes: {
        Row: {
          code_hash: string
          created_at: string | null
          expires_at: string
          id: string
          method: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string | null
          expires_at: string
          id?: string
          method: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          method?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_2fa_settings: {
        Row: {
          backup_codes: string[] | null
          backup_codes_used: number | null
          created_at: string | null
          failed_attempts: number | null
          id: string
          is_enabled: boolean | null
          last_notification_at: string | null
          last_notification_channel: string | null
          last_sms_error_code: string | null
          last_sms_error_message: string | null
          last_verified_at: string | null
          locked_until: string | null
          method: string | null
          phone_number: string | null
          sms_opt_in: boolean | null
          totp_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          backup_codes_used?: number | null
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          is_enabled?: boolean | null
          last_notification_at?: string | null
          last_notification_channel?: string | null
          last_sms_error_code?: string | null
          last_sms_error_message?: string | null
          last_verified_at?: string | null
          locked_until?: string | null
          method?: string | null
          phone_number?: string | null
          sms_opt_in?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          backup_codes_used?: number | null
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          is_enabled?: boolean | null
          last_notification_at?: string | null
          last_notification_channel?: string | null
          last_sms_error_code?: string | null
          last_sms_error_message?: string | null
          last_verified_at?: string | null
          locked_until?: string | null
          method?: string | null
          phone_number?: string | null
          sms_opt_in?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_tracking: {
        Row: {
          activity_count: number | null
          created_at: string | null
          days_inactive: number | null
          entered_inactive_funnel_at: string | null
          first_access_at: string | null
          id: string
          last_activity_at: string
          last_reengagement_email_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_count?: number | null
          created_at?: string | null
          days_inactive?: number | null
          entered_inactive_funnel_at?: string | null
          first_access_at?: string | null
          id?: string
          last_activity_at?: string
          last_reengagement_email_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_count?: number | null
          created_at?: string | null
          days_inactive?: number | null
          entered_inactive_funnel_at?: string | null
          first_access_at?: string | null
          id?: string
          last_activity_at?: string
          last_reengagement_email_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_category_tag_exclusions: {
        Row: {
          category_id: string
          created_at: string
          id: string
          system_tag_id: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          system_tag_id: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          system_tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_category_tag_exclusions_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_category_tag_exclusions_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_category_tag_exclusions_system_tag"
            columns: ["system_tag_id"]
            isOneToOne: false
            referencedRelation: "category_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      user_category_tags: {
        Row: {
          category_id: string
          color: string | null
          created_at: string | null
          id: string
          tag_name: string
          tag_name_en: string | null
          tag_name_es: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          tag_name: string
          tag_name_en?: string | null
          tag_name_es?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          tag_name?: string
          tag_name_en?: string | null
          tag_name_es?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_category_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_category_tags_category_id_fkey"
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
      user_financial_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          title: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          title: string
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          title?: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: []
      }
      user_import_rules: {
        Row: {
          amount_max: number | null
          amount_min: number | null
          assign_category_id: string | null
          assign_payment_method: string | null
          assign_tags: string[] | null
          created_at: string
          description_pattern: string | null
          id: string
          is_active: boolean | null
          language: string
          mark_as_transfer: boolean | null
          rule_name: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          amount_max?: number | null
          amount_min?: number | null
          assign_category_id?: string | null
          assign_payment_method?: string | null
          assign_tags?: string[] | null
          created_at?: string
          description_pattern?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          mark_as_transfer?: boolean | null
          rule_name: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          amount_max?: number | null
          amount_min?: number | null
          assign_category_id?: string | null
          assign_payment_method?: string | null
          assign_tags?: string[] | null
          created_at?: string
          description_pattern?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          mark_as_transfer?: boolean | null
          rule_name?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
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
          temp_password: string | null
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
          temp_password?: string | null
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
          temp_password?: string | null
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
      user_travel_suggestions: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          is_viewed: boolean
          mensagem: string
          programa_usuario: string
          promotion_id: string
          saldo_usuario: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_viewed?: boolean
          mensagem: string
          programa_usuario: string
          promotion_id: string
          saldo_usuario: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_viewed?: boolean
          mensagem?: string
          programa_usuario?: string
          promotion_id?: string
          saldo_usuario?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_travel_suggestions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "scraped_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          algorithm: string
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          algorithm?: string
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          algorithm?: string
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          cash_account_id: string
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          description: string | null
          id: string
          source_account_id: string | null
          source_card_id: string | null
          updated_at: string | null
          user_id: string
          withdrawal_date: string
          withdrawal_type: Database["public"]["Enums"]["withdrawal_type"]
        }
        Insert: {
          amount: number
          cash_account_id: string
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          id?: string
          source_account_id?: string | null
          source_card_id?: string | null
          updated_at?: string | null
          user_id: string
          withdrawal_date?: string
          withdrawal_type: Database["public"]["Enums"]["withdrawal_type"]
        }
        Update: {
          amount?: number
          cash_account_id?: string
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          id?: string
          source_account_id?: string | null
          source_card_id?: string | null
          updated_at?: string | null
          user_id?: string
          withdrawal_date?: string
          withdrawal_type?: Database["public"]["Enums"]["withdrawal_type"]
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_source_account_id_fkey"
            columns: ["source_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_source_account_id_fkey"
            columns: ["source_account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_source_card_id_fkey"
            columns: ["source_card_id"]
            isOneToOne: false
            referencedRelation: "active_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_source_card_id_fkey"
            columns: ["source_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_accounts: {
        Row: {
          account_model: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          balance: number | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          id: string | null
          is_active: boolean | null
          is_cash_account: boolean | null
          name: string | null
          overdraft_limit: number | null
          owner_user: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_model?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          balance?: number | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          id?: string | null
          is_active?: boolean | null
          is_cash_account?: boolean | null
          name?: string | null
          overdraft_limit?: number | null
          owner_user?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_model?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          balance?: number | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          id?: string | null
          is_active?: boolean | null
          is_cash_account?: boolean | null
          name?: string | null
          overdraft_limit?: number | null
          owner_user?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      active_cards: {
        Row: {
          account_id: string | null
          allows_partial_payment: boolean | null
          card_type: Database["public"]["Enums"]["card_type"] | null
          closing_date: number | null
          created_at: string | null
          credit_limit: number | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          current_balance: number | null
          due_date: number | null
          id: string | null
          initial_balance: number | null
          initial_balance_original: number | null
          last_four_digits: string | null
          minimum_payment_amount: number | null
          name: string | null
          owner_user: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          allows_partial_payment?: boolean | null
          card_type?: Database["public"]["Enums"]["card_type"] | null
          closing_date?: number | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          current_balance?: number | null
          due_date?: number | null
          id?: string | null
          initial_balance?: number | null
          initial_balance_original?: number | null
          last_four_digits?: string | null
          minimum_payment_amount?: number | null
          name?: string | null
          owner_user?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          allows_partial_payment?: boolean | null
          card_type?: Database["public"]["Enums"]["card_type"] | null
          closing_date?: number | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          current_balance?: number | null
          due_date?: number | null
          id?: string | null
          initial_balance?: number | null
          initial_balance_original?: number | null
          last_four_digits?: string | null
          minimum_payment_amount?: number | null
          name?: string | null
          owner_user?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cards_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cards_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      active_categories: {
        Row: {
          category_type: string | null
          color: string | null
          created_at: string | null
          default_category_id: string | null
          description: string | null
          icon: string | null
          id: string | null
          name: string | null
          owner_user: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category_type?: string | null
          color?: string | null
          created_at?: string | null
          default_category_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string | null
          name?: string | null
          owner_user?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category_type?: string | null
          color?: string | null
          created_at?: string | null
          default_category_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string | null
          name?: string | null
          owner_user?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_categories_default_category"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "default_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      active_investments: {
        Row: {
          amount: number | null
          auto_calculate_yield: boolean | null
          broker: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          current_value: number | null
          goal_id: string | null
          id: string | null
          is_shared: boolean | null
          last_yield_date: string | null
          name: string | null
          notes: string | null
          owner_user: string | null
          purchase_date: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          yield_type: string | null
          yield_value: number | null
        }
        Insert: {
          amount?: number | null
          auto_calculate_yield?: boolean | null
          broker?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          current_value?: number | null
          goal_id?: string | null
          id?: string | null
          is_shared?: boolean | null
          last_yield_date?: string | null
          name?: string | null
          notes?: string | null
          owner_user?: string | null
          purchase_date?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          yield_type?: string | null
          yield_value?: number | null
        }
        Update: {
          amount?: number | null
          auto_calculate_yield?: boolean | null
          broker?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          current_value?: number | null
          goal_id?: string | null
          id?: string | null
          is_shared?: boolean | null
          last_yield_date?: string | null
          name?: string | null
          notes?: string | null
          owner_user?: string | null
          purchase_date?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      active_subcategories: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string | null
          deleted_at: string | null
          icon: string | null
          id: string | null
          is_system: boolean | null
          name: string | null
          name_en: string | null
          name_es: string | null
          source_tag_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          icon?: string | null
          id?: string | null
          is_system?: boolean | null
          name?: string | null
          name_en?: string | null
          name_es?: string | null
          source_tag_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          icon?: string | null
          id?: string | null
          is_system?: boolean | null
          name?: string | null
          name_en?: string | null
          name_es?: string | null
          source_tag_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      active_transactions: {
        Row: {
          account_id: string | null
          amount: number | null
          business_at: string | null
          card_id: string | null
          card_transaction_type: string | null
          category_id: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          due_date: string | null
          expense_source_type: string | null
          id: string | null
          installment_number: number | null
          is_installment: boolean | null
          owner_user: string | null
          payment_method: string | null
          purchase_date: string | null
          status: string | null
          subcategory: string | null
          tag_id: string | null
          total_installments: number | null
          transaction_date: string | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          business_at?: string | null
          card_id?: string | null
          card_transaction_type?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          due_date?: string | null
          expense_source_type?: string | null
          id?: string | null
          installment_number?: number | null
          is_installment?: boolean | null
          owner_user?: string | null
          payment_method?: string | null
          purchase_date?: string | null
          status?: string | null
          subcategory?: string | null
          tag_id?: string | null
          total_installments?: number | null
          transaction_date?: string | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          business_at?: string | null
          card_id?: string | null
          card_transaction_type?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          due_date?: string | null
          expense_source_type?: string | null
          id?: string | null
          installment_number?: number | null
          is_installment?: boolean | null
          owner_user?: string | null
          payment_method?: string | null
          purchase_date?: string | null
          status?: string | null
          subcategory?: string | null
          tag_id?: string | null
          total_installments?: number | null
          transaction_date?: string | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "active_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "active_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "active_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_tag"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "category_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_transactions_view: {
        Row: {
          account_name: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          amount: number | null
          card_name: string | null
          card_type: Database["public"]["Enums"]["card_type"] | null
          category_color: string | null
          category_name: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          id: string | null
          owner_user: string | null
          payment_method: string | null
          status: string | null
          transaction_date: string | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          user_id: string | null
        }
        Relationships: []
      }
      monthly_financial_summary: {
        Row: {
          currency: Database["public"]["Enums"]["currency_type"] | null
          month_number: number | null
          month_year: string | null
          net_balance: number | null
          total_expenses: number | null
          total_income: number | null
          user_id: string | null
          year_number: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_complete_pending_transactions: { Args: never; Returns: undefined }
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
      check_manual_premium_expiration: { Args: never; Returns: undefined }
      check_user_promotion_eligibility: {
        Args: { p_promotion_id: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: number }
      cleanup_old_rate_limits: { Args: never; Returns: number }
      create_cash_accounts_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_default_categories_for_user: {
        Args: { p_user_id: string; user_language?: string }
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
      create_transaction_from_input: {
        Args: { p_input_id: string }
        Returns: Json
      }
      determine_owner_user: { Args: { p_user_id: string }; Returns: string }
      find_tag_case_insensitive: {
        Args: { search_lang?: string; search_name: string }
        Returns: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          keywords_en: string[] | null
          keywords_es: string[] | null
          keywords_pt: string[] | null
          name_en: string
          name_es: string
          name_pt: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "category_tags"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fix_security_definer_views: { Args: never; Returns: string }
      generate_cash_flow_report:
        | {
            Args: {
              p_account_id?: string
              p_category_id?: string
              p_end_date: string
              p_movement_type?: string
              p_start_date: string
              p_user_id: string
              p_view_mode?: string
            }
            Returns: {
              account_name: string
              amount: number
              balance_after: number
              card_name: string
              category_name: string
              description: string
              id: string
              is_reconciled: boolean
              movement_date: string
              movement_type: string
              owner_user: string
              payment_method: string
              transaction_id: string
            }[]
          }
        | {
            Args: {
              p_account_id?: string
              p_category_id?: string
              p_end_date: string
              p_exclude_card_payments?: boolean
              p_movement_type?: string
              p_start_date: string
              p_user_id: string
              p_view_mode?: string
            }
            Returns: {
              account_name: string
              amount: number
              balance_after: number
              card_name: string
              category_name: string
              description: string
              id: string
              is_reconciled: boolean
              movement_date: string
              movement_type: string
              owner_user: string
              payment_method: string
              transaction_id: string
            }[]
          }
      generate_referral_code: { Args: never; Returns: string }
      generate_temp_password: { Args: never; Returns: string }
      get_accounts_breakdown: {
        Args: { p_user_id: string; p_view_mode?: string }
        Returns: {
          account_id: string
          account_name: string
          account_type: string
          balance: number
          category: string
          is_asset: boolean
          is_cash_account: boolean
        }[]
      }
      get_active_tags_for_category: {
        Args: { p_category_id: string; p_user_id?: string }
        Returns: {
          color: string
          icon: string
          tag_id: string
          tag_name_en: string
          tag_name_es: string
          tag_name_pt: string
        }[]
      }
      get_cash_flow_summary: {
        Args: {
          p_account_id?: string
          p_end_date: string
          p_start_date: string
          p_user_id: string
          p_view_mode?: string
        }
        Returns: {
          expense_count: number
          final_balance: number
          income_count: number
          initial_balance: number
          net_result: number
          total_expense: number
          total_income: number
          transaction_count: number
        }[]
      }
      get_cash_flow_summary_v2: {
        Args: {
          p_account_id?: string
          p_end_date: string
          p_start_date: string
          p_user_id: string
          p_view_mode?: string
        }
        Returns: {
          assets_bank: number
          assets_cash: number
          cash_available: number
          expense_count: number
          final_balance: number
          income_count: number
          initial_balance: number
          liabilities_credit_limit: number
          net_position: number
          net_result: number
          total_debt: number
          total_expense: number
          total_income: number
          transaction_count: number
        }[]
      }
      get_consolidated_expenses: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_user_id: string
          p_view_mode?: string
        }
        Returns: {
          avg_amount: number
          category_color: string
          category_icon: string
          category_id: string
          category_name: string
          max_amount: number
          min_amount: number
          percentage: number
          total_amount: number
          transaction_count: number
        }[]
      }
      get_consolidated_revenues: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_user_id: string
          p_view_mode?: string
        }
        Returns: {
          avg_amount: number
          category_color: string
          category_icon: string
          category_id: string
          category_name: string
          max_amount: number
          min_amount: number
          percentage: number
          total_amount: number
          transaction_count: number
        }[]
      }
      get_financial_position: {
        Args: { p_date?: string; p_user_id: string; p_view_mode?: string }
        Returns: {
          available_cash: number
          bank_balance: number
          cash_balance: number
          credit_limit_used: number
          net_position: number
          total_assets: number
          total_liabilities: number
        }[]
      }
      get_inactive_users: {
        Args: never
        Returns: {
          days_inactive: number
          display_name: string
          email: string
          entered_inactive_funnel_at: string
          first_access_at: string
          is_premium: boolean
          last_activity_at: string
          user_id: string
        }[]
      }
      get_period_initial_balance:
        | {
            Args: {
              p_account_id?: string
              p_start_date: string
              p_user_id: string
              p_view_mode?: string
            }
            Returns: number
          }
        | {
            Args: {
              p_start_date: string
              p_user_id: string
              p_view_mode?: string
            }
            Returns: number
          }
      get_subcategories_for_category: {
        Args: { p_category_id: string }
        Returns: {
          color: string
          icon: string
          id: string
          is_system: boolean
          name: string
          name_en: string
          name_es: string
        }[]
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
      get_user_financial_options: { Args: { p_user_id: string }; Returns: Json }
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
      hash_temp_password: { Args: { password: string }; Returns: string }
      insert_normalized_user_tag: {
        Args: {
          p_category_id: string
          p_color?: string
          p_tag_name: string
          p_user_id: string
        }
        Returns: string
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_email_verified: { Args: { p_user_id: string }; Returns: boolean }
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
      migrate_all_tags_to_subcategories: {
        Args: never
        Returns: {
          migrated_count: number
          skipped_count: number
        }[]
      }
      migrate_tags_to_subcategories: { Args: never; Returns: Json }
      normalize_category_name: { Args: { input_name: string }; Returns: string }
      normalize_text_simple: { Args: { input: string }; Returns: string }
      populate_initial_cash_flow_history: {
        Args: { p_user_id: string }
        Returns: number
      }
      process_card_payment: {
        Args: {
          p_account_id: string
          p_card_id: string
          p_notes?: string
          p_payment_amount: number
          p_payment_date: string
          p_user_id: string
        }
        Returns: Json
      }
      process_future_expense_payment: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_card_id?: string
          p_card_payment_info?: Json
          p_category_id?: string
          p_description: string
          p_installment_transaction_id?: string
          p_original_due_date: string
          p_payment_date?: string
          p_payment_method?: string
          p_recurring_expense_id?: string
          p_user_id: string
        }
        Returns: string
      }
      process_future_income_receipt: {
        Args: {
          p_account_id?: string
          p_income_id: string
          p_payment_method?: string
          p_receipt_date?: string
          p_user_id: string
        }
        Returns: string
      }
      process_installment_payment: {
        Args: { p_future_payment_id: string }
        Returns: string
      }
      process_recurring_expenses_daily: { Args: never; Returns: undefined }
      process_withdrawal: {
        Args: {
          p_amount: number
          p_currency?: Database["public"]["Enums"]["currency_type"]
          p_description?: string
          p_source_account_id?: string
          p_source_card_id?: string
          p_user_id: string
        }
        Returns: string
      }
      recalculate_mileage_goals: { Args: never; Returns: undefined }
      regenerate_future_expenses: { Args: never; Returns: number }
      resolve_financial_hints: { Args: { p_input_id: string }; Returns: Json }
      suggest_category_and_tag:
        | {
            Args: { description: string; language?: string }
            Returns: {
              category_id: string
              category_name: string
              confidence: number
              tag_id: string
              tag_name: string
            }[]
          }
        | {
            Args: { description: string; language?: string; p_user_id?: string }
            Returns: {
              category_id: string
              category_name: string
              confidence: number
              tag_id: string
              tag_name: string
            }[]
          }
      sync_user_tag_preferences: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      track_user_activity: { Args: { p_user_id: string }; Returns: undefined }
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
      update_inactive_users: { Args: never; Returns: number }
      use_referral_code: {
        Args: { p_code: string; p_referred_user_id: string }
        Returns: Json
      }
      verify_temp_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
      verify_user_email: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      account_type: "checking" | "savings" | "investment" | "emergency"
      card_type: "credit" | "debit"
      currency_type: "BRL" | "USD" | "EUR"
      transaction_type: "income" | "expense"
      withdrawal_type: "bank_withdrawal" | "credit_advance"
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
      account_type: ["checking", "savings", "investment", "emergency"],
      card_type: ["credit", "debit"],
      currency_type: ["BRL", "USD", "EUR"],
      transaction_type: ["income", "expense"],
      withdrawal_type: ["bank_withdrawal", "credit_advance"],
    },
  },
} as const
