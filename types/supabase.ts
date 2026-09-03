// Auto-generated from the connected Supabase schema. Do not edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          role: string
          phone: string | null
          address: string | null
          membership_number: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          author: string
          isbn: string | null
          category: string | null
          publisher: string | null
          publication_year: number | null
          total_copies: number
          available_copies: number
          shelf_location: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
      }
      book_issues: {
        Row: {
          id: string
          book_id: string
          user_id: string
          issued_by: string
          issue_date: string
          due_date: string
          return_date: string | null
          status: string
          remarks: string | null
          created_at: string
          updated_at: string
        }
      }
      fines: {
        Row: {
          id: string
          issue_id: string
          user_id: string
          overdue_days: number
          fine_per_day: number
          total_amount: number
          status: string
          paid_at: string | null
          waived_by: string | null
          waive_reason: string | null
          created_at: string
          updated_at: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          actor_id: string
          action_type: string
          entity_type: string
          entity_id: string | null
          description: string | null
          metadata: Json | null
          created_at: string
        }
      }
    }
  }
}