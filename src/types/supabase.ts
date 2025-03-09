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
          email: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      formations: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          published: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      chapters: {
        Row: {
          id: string
          title: string
          description: string | null
          position: number
          formation_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          position: number
          formation_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          position?: number
          formation_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          title: string
          content: string | null
          description: string | null
          position: number
          duration: number | null
          video_url: string | null
          audio_url: string | null
          chapter_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          description?: string | null
          position: number
          duration?: number | null
          video_url?: string | null
          audio_url?: string | null
          chapter_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          description?: string | null
          position?: number
          duration?: number | null
          video_url?: string | null
          audio_url?: string | null
          chapter_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      lesson_versions: {
        Row: {
          id: string
          lesson_id: string
          version_number: number
          title: string
          content: string | null
          description: string | null
          video_url: string | null
          audio_url: string | null
          duration: number | null
          change_summary: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          lesson_id: string
          version_number: number
          title: string
          content?: string | null
          description?: string | null
          video_url?: string | null
          audio_url?: string | null
          duration?: number | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          lesson_id?: string
          version_number?: number
          title?: string
          content?: string | null
          description?: string | null
          video_url?: string | null
          audio_url?: string | null
          duration?: number | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      lesson_comments: {
        Row: {
          id: string
          lesson_id: string
          user_id: string
          content: string
          parent_id: string | null
          is_approved: boolean
          is_flagged: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          user_id: string
          content: string
          parent_id?: string | null
          is_approved?: boolean
          is_flagged?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          is_approved?: boolean
          is_flagged?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lesson_statistics: {
        Row: {
          id: string
          lesson_id: string
          views: number
          unique_users: number
          completion_count: number
          avg_time_spent: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          views?: number
          unique_users?: number
          completion_count?: number
          avg_time_spent?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          views?: number
          unique_users?: number
          completion_count?: number
          avg_time_spent?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_lesson_tracking: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          is_completed: boolean
          progress_percentage: number
          time_spent: number | null
          last_position: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          is_completed?: boolean
          progress_percentage?: number
          time_spent?: number | null
          last_position?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          is_completed?: boolean
          progress_percentage?: number
          time_spent?: number | null
          last_position?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          lesson_id: string | null
          type: string
          question: string
          options: Json
          explanation: string | null
          points: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id?: string | null
          type: string
          question: string
          options: Json
          explanation?: string | null
          points?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string | null
          type?: string
          question?: string
          options?: Json
          explanation?: string | null
          points?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          lesson_id: string | null
          score: number
          max_score: number
          answers: Json | null
          correct_count: number | null
          total_questions: number | null
          time_spent: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          lesson_id?: string | null
          score: number
          max_score: number
          answers?: Json | null
          correct_count?: number | null
          total_questions?: number | null
          time_spent?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          lesson_id?: string | null
          score?: number
          max_score?: number
          answers?: Json | null
          correct_count?: number | null
          total_questions?: number | null
          time_spent?: number | null
          created_at?: string
        }
      }
      exercise_attempts: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          lesson_id: string | null
          score: number
          max_score: number
          answers: Json | null
          time_spent: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          lesson_id?: string | null
          score: number
          max_score: number
          answers?: Json | null
          time_spent?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          lesson_id?: string | null
          score?: number
          max_score?: number
          answers?: Json | null
          time_spent?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_exercise_attempts: {
        Args: {
          p_user_id?: string
          p_lesson_id?: string
        }
        Returns: {
          id: string
          lesson_id: string
          exercise_id: string
          score: number
          max_score: number
          answers: Json
          time_spent: number
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 