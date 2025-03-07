export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_deleted: boolean | null
          deleted_at: string | null
          phone: string | null
          bio: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          phone?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          phone?: string | null
          bio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      formations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          price: number
          image_url: string | null
          published: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          price: number
          image_url?: string | null
          published?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          price?: number
          image_url?: string | null
          published?: boolean
        }
        Relationships: []
      }
      chapters: {
        Row: {
          id: string
          formation_id: string
          title: string
          description: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          formation_id: string
          title: string
          description?: string | null
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          formation_id?: string
          title?: string
          description?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          chapter_id: string
          title: string
          description: string | null
          content: string
          video_url: string | null
          position: number
          duration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          title: string
          description?: string | null
          content: string
          video_url?: string | null
          position: number
          duration: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          title?: string
          description?: string | null
          content?: string
          video_url?: string | null
          position?: number
          duration?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_formations: {
        Row: {
          id: string
          user_id: string
          formation_id: string
          purchased_at: string
          price_paid: number
        }
        Insert: {
          id?: string
          user_id: string
          formation_id: string
          purchased_at?: string
          price_paid: number
        }
        Update: {
          id?: string
          user_id?: string
          formation_id?: string
          purchased_at?: string
          price_paid?: number
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed: boolean
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed?: boolean
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed?: boolean
          last_accessed?: string
        }
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          formation_id: string
          issued_at: string
          certificate_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          formation_id: string
          issued_at?: string
          certificate_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          formation_id?: string
          issued_at?: string
          certificate_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 