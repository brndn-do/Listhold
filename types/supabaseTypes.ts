export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer: Json
          created_at: string
          id: string
          prompt_id: string
          signup_id: string
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: string
          prompt_id: string
          signup_id: string
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: string
          prompt_id?: string
          signup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "event_list_view"
            referencedColumns: ["signup_id"]
          },
          {
            foreignKeyName: "answers_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "signups"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          end_time: string | null
          event_name: string
          id: string
          location: string
          organization_id: string | null
          owner_id: string
          photo_url: string | null
          slug: string
          start_time: string
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_name: string
          id?: string
          location: string
          organization_id?: string | null
          owner_id: string
          photo_url?: string | null
          slug: string
          start_time: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_name?: string
          id?: string
          location?: string
          organization_id?: string | null
          owner_id?: string
          photo_url?: string | null
          slug?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          organization_name: string
          owner_id: string
          slug: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_name: string
          owner_id: string
          slug: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_name?: string
          owner_id?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string
          profile_completed_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id: string
          profile_completed_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
          profile_completed_at?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string
          display_order: number
          event_id: string
          id: string
          is_private: boolean
          is_required: boolean
          prompt_text: string
          prompt_type: Database["public"]["Enums"]["prompt_type_enum"]
        }
        Insert: {
          created_at?: string
          display_order: number
          event_id: string
          id?: string
          is_private?: boolean
          is_required?: boolean
          prompt_text: string
          prompt_type: Database["public"]["Enums"]["prompt_type_enum"]
        }
        Update: {
          created_at?: string
          display_order?: number
          event_id?: string
          id?: string
          is_private?: boolean
          is_required?: boolean
          prompt_text?: string
          prompt_type?: Database["public"]["Enums"]["prompt_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "prompts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      signups: {
        Row: {
          created_at: string
          event_id: string
          id: string
          last_updated: string
          status: Database["public"]["Enums"]["signup_status_enum"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          last_updated?: string
          status: Database["public"]["Enums"]["signup_status_enum"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          last_updated?: string
          status?: Database["public"]["Enums"]["signup_status_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_list_view: {
        Row: {
          answers: Json | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          event_id: string | null
          last_updated: string | null
          signup_id: string | null
          status: Database["public"]["Enums"]["signup_status_enum"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_user_to_event: {
        Args: { p_answers?: Json; p_event_id: string; p_user_id: string }
        Returns: Json
      }
      remove_user_from_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      prompt_type_enum: "yes/no" | "notice"
      signup_status_enum: "confirmed" | "waitlisted" | "withdrawn"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      prompt_type_enum: ["yes/no", "notice"],
      signup_status_enum: ["confirmed", "waitlisted", "withdrawn"],
    },
  },
} as const

