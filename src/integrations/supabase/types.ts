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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      help_requests: {
        Row: {
          comment: string
          contact: string
          created_at: string
          help_way: string
          id: string
          is_demo: boolean
          name: string
          need_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          comment?: string
          contact: string
          created_at?: string
          help_way?: string
          id?: string
          is_demo?: boolean
          name: string
          need_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          comment?: string
          contact?: string
          created_at?: string
          help_way?: string
          id?: string
          is_demo?: boolean
          name?: string
          need_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
        ]
      }
      need_categories: {
        Row: {
          created_at: string
          id: string
          is_hidden: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      need_history: {
        Row: {
          changed_by: string | null
          changed_by_email: string
          created_at: string
          id: string
          need_id: string
          summary: string
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string
          created_at?: string
          id?: string
          need_id: string
          summary?: string
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string
          created_at?: string
          id?: string
          need_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "need_history_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
        ]
      }
      needs: {
        Row: {
          category_id: string | null
          collected_amount: number
          created_at: string
          description: string
          goal_type: Database["public"]["Enums"]["need_goal_type"]
          id: string
          is_demo: boolean
          pay_bank: string | null
          pay_phone: string | null
          pay_purpose: string | null
          pay_recipient: string | null
          photo_url: string | null
          priority: Database["public"]["Enums"]["need_priority"]
          published_at: string
          report_url: string | null
          required_amount: number | null
          status: Database["public"]["Enums"]["need_status"]
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          collected_amount?: number
          created_at?: string
          description?: string
          goal_type?: Database["public"]["Enums"]["need_goal_type"]
          id?: string
          is_demo?: boolean
          pay_bank?: string | null
          pay_phone?: string | null
          pay_purpose?: string | null
          pay_recipient?: string | null
          photo_url?: string | null
          priority?: Database["public"]["Enums"]["need_priority"]
          published_at?: string
          report_url?: string | null
          required_amount?: number | null
          status?: Database["public"]["Enums"]["need_status"]
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          collected_amount?: number
          created_at?: string
          description?: string
          goal_type?: Database["public"]["Enums"]["need_goal_type"]
          id?: string
          is_demo?: boolean
          pay_bank?: string | null
          pay_phone?: string | null
          pay_purpose?: string | null
          pay_recipient?: string | null
          photo_url?: string | null
          priority?: Database["public"]["Enums"]["need_priority"]
          published_at?: string
          report_url?: string | null
          required_amount?: number | null
          status?: Database["public"]["Enums"]["need_status"]
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "needs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "need_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          body: string
          category_id: string | null
          created_at: string
          document_paths: string[]
          id: string
          is_demo: boolean
          need_id: string | null
          photo_paths: string[]
          report_date: string
          status: Database["public"]["Enums"]["report_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          category_id?: string | null
          created_at?: string
          document_paths?: string[]
          id?: string
          is_demo?: boolean
          need_id?: string | null
          photo_paths?: string[]
          report_date?: string
          status?: Database["public"]["Enums"]["report_status"]
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category_id?: string | null
          created_at?: string
          document_paths?: string[]
          id?: string
          is_demo?: boolean
          need_id?: string | null
          photo_paths?: string[]
          report_date?: string
          status?: Database["public"]["Enums"]["report_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "need_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          coordinator_name: string
          donation_details: string
          email: string
          footer_text: string
          id: boolean
          max_contact: string
          phone: string
          updated_at: string
          vk_url: string
        }
        Insert: {
          coordinator_name?: string
          donation_details?: string
          email?: string
          footer_text?: string
          id?: boolean
          max_contact?: string
          phone?: string
          updated_at?: string
          vk_url?: string
        }
        Update: {
          coordinator_name?: string
          donation_details?: string
          email?: string
          footer_text?: string
          id?: boolean
          max_contact?: string
          phone?: string
          updated_at?: string
          vk_url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_admin_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_admin_role: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "tester"
      need_goal_type: "quantity" | "money" | "descriptive"
      need_priority: "normal" | "important" | "urgent"
      need_status: "active" | "partial" | "closed" | "draft"
      report_status: "draft" | "published"
      request_status:
        | "new"
        | "in_progress"
        | "contacted"
        | "agreed"
        | "done"
        | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "tester"],
      need_goal_type: ["quantity", "money", "descriptive"],
      need_priority: ["normal", "important", "urgent"],
      need_status: ["active", "partial", "closed", "draft"],
      report_status: ["draft", "published"],
      request_status: [
        "new",
        "in_progress",
        "contacted",
        "agreed",
        "done",
        "rejected",
      ],
    },
  },
} as const
