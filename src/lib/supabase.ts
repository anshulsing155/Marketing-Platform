import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      user_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      subscribers: {
        Row: {
          id: string
          email: string
          phone: string | null
          first_name: string | null
          last_name: string | null
          status: 'active' | 'unsubscribed' | 'bounced'
          whatsapp_opt_in: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          status?: 'active' | 'unsubscribed' | 'bounced'
          whatsapp_opt_in?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          status?: 'active' | 'unsubscribed' | 'bounced'
          whatsapp_opt_in?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      group_subscribers: {
        Row: {
          id: string
          group_id: string
          subscriber_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          subscriber_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          subscriber_id?: string
          created_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          name: string
          subject: string
          content: string
          template_data: any
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          content: string
          template_data?: any
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          content?: string
          template_data?: any
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      whatsapp_templates: {
        Row: {
          id: string
          name: string
          content: string
          template_data: any
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          content: string
          template_data?: any
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          content?: string
          template_data?: any
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          name: string
          type: 'email' | 'whatsapp'
          subject: string | null
          template_id: string
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at: string | null
          sent_at: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          type: 'email' | 'whatsapp'
          subject?: string | null
          template_id: string
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'email' | 'whatsapp'
          subject?: string | null
          template_id?: string
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      campaign_groups: {
        Row: {
          id: string
          campaign_id: string
          group_id: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          group_id: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          group_id?: string
          created_at?: string
        }
      }
    }
  }
}