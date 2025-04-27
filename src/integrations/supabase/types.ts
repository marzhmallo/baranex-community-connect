export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      barangays: {
        Row: {
          barangayname: string
          country: string | null
          created_at: string
          id: string
          is_custom: boolean | null
          logo_url: string | null
          municipality: string
          province: string
          region: string | null
          updated_at: string | null
        }
        Insert: {
          barangayname: string
          country?: string | null
          created_at: string
          id?: string
          is_custom?: boolean | null
          logo_url?: string | null
          municipality: string
          province: string
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          barangayname?: string
          country?: string | null
          created_at?: string
          id?: string
          is_custom?: boolean | null
          logo_url?: string | null
          municipality?: string
          province?: string
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          document_id: string
          id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          document_id: string
          id?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          document_id?: string
          id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "issued_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string | null
          description: string | null
          fee: number | null
          id: string
          name: string
          required_fields: Json
          template: string
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fee?: number | null
          id?: string
          name: string
          required_fields?: Json
          template: string
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fee?: number | null
          id?: string
          name?: string
          required_fields?: Json
          template?: string
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: []
      }
      households: {
        Row: {
          address: string
          brgyid: string | null
          contact_number: string | null
          created_at: string | null
          electricity_source: string | null
          garbage_disposal: string | null
          head_of_family: string | null
          house_type: string | null
          id: string
          monthly_income: string | null
          name: string
          name_extension: string | null
          property_type: string | null
          purok: string
          remarks: string | null
          status: string
          toilet_type: string | null
          updated_at: string | null
          water_source: string | null
          year_established: number | null
        }
        Insert: {
          address: string
          brgyid?: string | null
          contact_number?: string | null
          created_at?: string | null
          electricity_source?: string | null
          garbage_disposal?: string | null
          head_of_family?: string | null
          house_type?: string | null
          id: string
          monthly_income?: string | null
          name: string
          name_extension?: string | null
          property_type?: string | null
          purok: string
          remarks?: string | null
          status: string
          toilet_type?: string | null
          updated_at?: string | null
          water_source?: string | null
          year_established?: number | null
        }
        Update: {
          address?: string
          brgyid?: string | null
          contact_number?: string | null
          created_at?: string | null
          electricity_source?: string | null
          garbage_disposal?: string | null
          head_of_family?: string | null
          house_type?: string | null
          id?: string
          monthly_income?: string | null
          name?: string
          name_extension?: string | null
          property_type?: string | null
          purok?: string
          remarks?: string | null
          status?: string
          toilet_type?: string | null
          updated_at?: string | null
          water_source?: string | null
          year_established?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "households_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      issued_documents: {
        Row: {
          created_at: string | null
          data: Json
          document_number: string
          document_type_id: string
          expiry_date: string | null
          household_id: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          payment_amount: number | null
          payment_date: string | null
          payment_status: string | null
          purpose: string | null
          resident_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          document_number: string
          document_type_id: string
          expiry_date?: string | null
          household_id?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_status?: string | null
          purpose?: string | null
          resident_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          document_number?: string
          document_type_id?: string
          expiry_date?: string | null
          household_id?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_status?: string | null
          purpose?: string | null
          resident_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issued_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_documents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_documents_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      official_positions: {
        Row: {
          committee: string | null
          created_at: string | null
          description: string | null
          id: string
          is_current: boolean | null
          official_id: string | null
          position: string
          term_end: string | null
          term_start: string | null
          updated_at: string | null
        }
        Insert: {
          committee?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          official_id?: string | null
          position: string
          term_end?: string | null
          term_start?: string | null
          updated_at?: string | null
        }
        Update: {
          committee?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          official_id?: string | null
          position?: string
          term_end?: string | null
          term_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_positions_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      officials: {
        Row: {
          achievements: Json | null
          address: string | null
          bio: string | null
          birthdate: string | null
          brgyid: string | null
          committees: Json | null
          created_at: string | null
          education: string | null
          email: string | null
          id: string
          is_sk: boolean[] | null
          name: string
          phone: string | null
          photo_url: string | null
          position: string
          term_end: string | null
          term_start: string | null
          updated_at: string | null
        }
        Insert: {
          achievements?: Json | null
          address?: string | null
          bio?: string | null
          birthdate?: string | null
          brgyid?: string | null
          committees?: Json | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          id?: string
          is_sk?: boolean[] | null
          name: string
          phone?: string | null
          photo_url?: string | null
          position: string
          term_end?: string | null
          term_start?: string | null
          updated_at?: string | null
        }
        Update: {
          achievements?: Json | null
          address?: string | null
          bio?: string | null
          birthdate?: string | null
          brgyid?: string | null
          committees?: Json | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          id?: string
          is_sk?: boolean[] | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          position?: string
          term_end?: string | null
          term_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officials_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          adminid: string | null
          brgyid: string | null
          created_at: string | null
          email: string | null
          firstname: string | null
          id: string
          lastname: string | null
          middlename: string | null
          phone: string | null
          role: string | null
          status: string | null
          username: string | null
        }
        Insert: {
          adminid?: string | null
          brgyid?: string | null
          created_at?: string | null
          email?: string | null
          firstname?: string | null
          id?: string
          lastname?: string | null
          middlename?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          username?: string | null
        }
        Update: {
          adminid?: string | null
          brgyid?: string | null
          created_at?: string | null
          email?: string | null
          firstname?: string | null
          id?: string
          lastname?: string | null
          middlename?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string | null
          id: string
          related_resident_id: string
          relationship_type: string
          resident_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          related_resident_id: string
          relationship_type: string
          resident_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          related_resident_id?: string
          relationship_type?: string
          resident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_related_resident_id_fkey"
            columns: ["related_resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          parameters: Json | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id: string
          parameters?: Json | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          parameters?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      residents: {
        Row: {
          address: string | null
          barangaydb: string
          birthdate: string
          brgyid: string | null
          civil_status: string
          classifications: string[] | null
          countryph: string
          created_at: string | null
          died_on: string | null
          email: string | null
          first_name: string
          gender: string
          has_pagibig: boolean | null
          has_philhealth: boolean | null
          has_sss: boolean | null
          has_tin: boolean | null
          household_id: string | null
          id: string
          is_voter: boolean | null
          last_name: string
          middle_name: string | null
          mobile_number: string | null
          monthly_income: number | null
          municipalitycity: string
          nationality: string
          occupation: string | null
          photo_url: string | null
          provinze: string
          purok: string
          regional: string
          remarks: string | null
          status: string
          suffix: string | null
          updated_at: string | null
          years_in_barangay: number | null
        }
        Insert: {
          address?: string | null
          barangaydb: string
          birthdate: string
          brgyid?: string | null
          civil_status: string
          classifications?: string[] | null
          countryph: string
          created_at?: string | null
          died_on?: string | null
          email?: string | null
          first_name: string
          gender: string
          has_pagibig?: boolean | null
          has_philhealth?: boolean | null
          has_sss?: boolean | null
          has_tin?: boolean | null
          household_id?: string | null
          id: string
          is_voter?: boolean | null
          last_name: string
          middle_name?: string | null
          mobile_number?: string | null
          monthly_income?: number | null
          municipalitycity: string
          nationality: string
          occupation?: string | null
          photo_url?: string | null
          provinze: string
          purok: string
          regional: string
          remarks?: string | null
          status?: string
          suffix?: string | null
          updated_at?: string | null
          years_in_barangay?: number | null
        }
        Update: {
          address?: string | null
          barangaydb?: string
          birthdate?: string
          brgyid?: string | null
          civil_status?: string
          classifications?: string[] | null
          countryph?: string
          created_at?: string | null
          died_on?: string | null
          email?: string | null
          first_name?: string
          gender?: string
          has_pagibig?: boolean | null
          has_philhealth?: boolean | null
          has_sss?: boolean | null
          has_tin?: boolean | null
          household_id?: string | null
          id?: string
          is_voter?: boolean | null
          last_name?: string
          middle_name?: string | null
          mobile_number?: string | null
          monthly_income?: number | null
          municipalitycity?: string
          nationality?: string
          occupation?: string | null
          photo_url?: string | null
          provinze?: string
          purok?: string
          regional?: string
          remarks?: string | null
          status?: string
          suffix?: string | null
          updated_at?: string | null
          years_in_barangay?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "residents_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          brgyid: string | null
          created_at: string
          email: string | null
          firstname: string
          id: string
          lastname: string
          middlename: string | null
          password: string | null
          phone: number | null
          role: string
          status: string
          username: string | null
        }
        Insert: {
          brgyid?: string | null
          created_at?: string
          email?: string | null
          firstname: string
          id?: string
          lastname: string
          middlename?: string | null
          password?: string | null
          phone?: number | null
          role: string
          status: string
          username?: string | null
        }
        Update: {
          brgyid?: string | null
          created_at?: string
          email?: string | null
          firstname?: string
          id?: string
          lastname?: string
          middlename?: string | null
          password?: string | null
          phone?: number | null
          role?: string
          status?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_age_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          age_group: string
          count: number
        }[]
      }
      get_gender_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          gender: string
          count: number
        }[]
      }
      get_purok_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          purok: string
          count: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
