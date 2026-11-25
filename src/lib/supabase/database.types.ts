export interface Database {
  public: {
    Tables: {
      advent_days: {
        Row: {
          day_number: number;
          title: string;
          description: string;
          image_storage_path: string;
          opened_at: string | null;
        };
        Insert: {
          day_number: number;
          title: string;
          description: string;
          image_storage_path: string;
          opened_at?: string | null;
        };
        Update: {
          day_number?: number;
          title?: string;
          description?: string;
          image_storage_path?: string;
          opened_at?: string | null;
        };
        Relationships: [];
      };
      magic_tokens: {
        Row: {
          id: string;
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_hash: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token_hash?: string;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          day_number: number;
          notification_type: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          day_number: number;
          notification_type: string;
          sent_at?: string;
        };
        Update: {
          id?: string;
          day_number?: number;
          notification_type?: string;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_logs_day_number_fkey";
            columns: ["day_number"];
            isOneToOne: false;
            referencedRelation: "advent_days";
            referencedColumns: ["day_number"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      mark_advent_day_opened: {
        Args: { p_day_number: number };
        Returns: { opened_at: string }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
