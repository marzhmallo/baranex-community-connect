export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          agent: string | null
          brgyid: string
          created_at: string | null
          details: Json
          id: string
          ip: string | null
          user_id: string
        }
        Insert: {
          action: string
          agent?: string | null
          brgyid: string
          created_at?: string | null
          details: Json
          id?: string
          ip?: string | null
          user_id: string
        }
        Update: {
          action?: string
          agent?: string | null
          brgyid?: string
          created_at?: string | null
          details?: Json
          id?: string
          ip?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          attachment_url: string | null
          audience: string
          brgyid: string
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_pinned: boolean | null
          is_public: boolean | null
          photo_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          audience?: string
          brgyid: string
          category: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_pinned?: boolean | null
          is_public?: boolean | null
          photo_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          audience?: string
          brgyid?: string
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_pinned?: boolean | null
          is_public?: boolean | null
          photo_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      barangays: {
        Row: {
          backgroundurl: string | null
          barangayname: string
          country: string
          created_at: string
          email: string | null
          "gcash#": number | null
          gcashname: string[] | null
          gcashurl: string | null
          halllat: number | null
          halllong: number | null
          id: string
          is_custom: boolean
          logo_url: string | null
          municipality: string
          officehours: string | null
          phone: string | null
          plazid: string | null
          province: string
          region: string
          updated_at: string | null
        }
        Insert: {
          backgroundurl?: string | null
          barangayname: string
          country: string
          created_at: string
          email?: string | null
          "gcash#"?: number | null
          gcashname?: string[] | null
          gcashurl?: string | null
          halllat?: number | null
          halllong?: number | null
          id?: string
          is_custom?: boolean
          logo_url?: string | null
          municipality: string
          officehours?: string | null
          phone?: string | null
          plazid?: string | null
          province: string
          region: string
          updated_at?: string | null
        }
        Update: {
          backgroundurl?: string | null
          barangayname?: string
          country?: string
          created_at?: string
          email?: string | null
          "gcash#"?: number | null
          gcashname?: string[] | null
          gcashurl?: string | null
          halllat?: number | null
          halllong?: number | null
          id?: string
          is_custom?: boolean
          logo_url?: string | null
          municipality?: string
          officehours?: string | null
          phone?: string | null
          plazid?: string | null
          province?: string
          region?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blotters: {
        Row: {
          complainant_id: string | null
          complaint_details: string
          created_at: string | null
          id: string
          incident_date: string
          incident_location: string
          resolution: string | null
          respondent_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          complainant_id?: string | null
          complaint_details: string
          created_at?: string | null
          id?: string
          incident_date: string
          incident_location: string
          resolution?: string | null
          respondent_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          complainant_id?: string | null
          complaint_details?: string
          created_at?: string | null
          id?: string
          incident_date?: string
          incident_location?: string
          resolution?: string | null
          respondent_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blotters_complainant_id_fkey"
            columns: ["complainant_id"]
            isOneToOne: false
            referencedRelation: "admin_residents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blotters_complainant_id_fkey"
            columns: ["complainant_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blotters_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "admin_residents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blotters_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_faq: {
        Row: {
          answer_text: Json[] | null
          answer_textz: string
          category: string
          created_at: string
          id: string
          question_keywords: Json
          relevant_roles: Json
          updated_at: string
        }
        Insert: {
          answer_text?: Json[] | null
          answer_textz: string
          category: string
          created_at?: string
          id?: string
          question_keywords?: Json
          relevant_roles?: Json
          updated_at?: string
        }
        Update: {
          answer_text?: Json[] | null
          answer_textz?: string
          category?: string
          created_at?: string
          id?: string
          question_keywords?: Json
          relevant_roles?: Json
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          parent_id: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          parent_id?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          parent_id?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      disaster_zones: {
        Row: {
          brgyid: string
          created_at: string | null
          created_by: string
          id: string
          notes: string | null
          polygon_coords: Json
          risk_level: string | null
          updated_at: string | null
          zone_name: string
          zone_type: Database["public"]["Enums"]["disaster_zone_type"]
        }
        Insert: {
          brgyid: string
          created_at?: string | null
          created_by: string
          id?: string
          notes?: string | null
          polygon_coords: Json
          risk_level?: string | null
          updated_at?: string | null
          zone_name: string
          zone_type: Database["public"]["Enums"]["disaster_zone_type"]
        }
        Update: {
          brgyid?: string
          created_at?: string | null
          created_by?: string
          id?: string
          notes?: string | null
          polygon_coords?: Json
          risk_level?: string | null
          updated_at?: string | null
          zone_name?: string
          zone_type?: Database["public"]["Enums"]["disaster_zone_type"]
        }
        Relationships: [
          {
            foreignKeyName: "disaster_zones_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      dnexus: {
        Row: {
          accepted_on: string | null
          created_at: string
          dataid: string[]
          datatype: string | null
          destination: string
          id: string
          initiator: string
          notes: string | null
          reviewer: string | null
          source: string
          status: string
          transfernotes: Json | null
        }
        Insert: {
          accepted_on?: string | null
          created_at?: string
          dataid?: string[]
          datatype?: string | null
          destination?: string
          id?: string
          initiator?: string
          notes?: string | null
          reviewer?: string | null
          source?: string
          status: string
          transfernotes?: Json | null
        }
        Update: {
          accepted_on?: string | null
          created_at?: string
          dataid?: string[]
          datatype?: string | null
          destination?: string
          id?: string
          initiator?: string
          notes?: string | null
          reviewer?: string | null
          source?: string
          status?: string
          transfernotes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dnexus_destination_fkey"
            columns: ["destination"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dnexus_source_fkey"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      docrequests: {
        Row: {
          amount: number | null
          brgyid: string
          "contact#": number | null
          created_at: string
          docnumber: string
          email: string | null
          id: string
          issued_at: string
          method: string | null
          notes: string | null
          ornumber: string | null
          paydate: string | null
          paymenturl: string | null
          processedby: string | null
          purpose: string
          receiver: Json | null
          resident_id: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          brgyid?: string
          "contact#"?: number | null
          created_at?: string
          docnumber: string
          email?: string | null
          id?: string
          issued_at: string
          method?: string | null
          notes?: string | null
          ornumber?: string | null
          paydate?: string | null
          paymenturl?: string | null
          processedby?: string | null
          purpose: string
          receiver?: Json | null
          resident_id?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          brgyid?: string
          "contact#"?: number | null
          created_at?: string
          docnumber?: string
          email?: string | null
          id?: string
          issued_at?: string
          method?: string | null
          notes?: string | null
          ornumber?: string | null
          paydate?: string | null
          paymenturl?: string | null
          processedby?: string | null
          purpose?: string
          receiver?: Json | null
          resident_id?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docrequests_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_logs: {
        Row: {
          action: string
          brgyid: string
          created_at: string | null
          details: Json | null
          document_id: string
          id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          brgyid?: string
          created_at?: string | null
          details?: Json | null
          document_id: string
          id?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          brgyid?: string
          created_at?: string | null
          details?: Json | null
          document_id?: string
          id?: string
          performed_by?: string | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          brgyid: string
          content: string | null
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
          brgyid: string
          content?: string | null
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
          brgyid?: string
          content?: string | null
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
      emergency_contacts: {
        Row: {
          brgyid: string
          created_at: string | null
          created_by: string
          description: string | null
          email: string | null
          id: string
          name: string
          phone_number: string
          type: Database["public"]["Enums"]["emergency_contact_type"]
          updated_at: string | null
        }
        Insert: {
          brgyid: string
          created_at?: string | null
          created_by: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone_number: string
          type: Database["public"]["Enums"]["emergency_contact_type"]
          updated_at?: string | null
        }
        Update: {
          brgyid?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone_number?: string
          type?: Database["public"]["Enums"]["emergency_contact_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      evacuation_centers: {
        Row: {
          address: string
          brgyid: string
          capacity: number
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          facilities: string[] | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          occupancy: number | null
          status: Database["public"]["Enums"]["evacuation_center_status"] | null
          updated_at: string | null
        }
        Insert: {
          address: string
          brgyid: string
          capacity?: number
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          facilities?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          occupancy?: number | null
          status?:
            | Database["public"]["Enums"]["evacuation_center_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          brgyid?: string
          capacity?: number
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          facilities?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          occupancy?: number | null
          status?:
            | Database["public"]["Enums"]["evacuation_center_status"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evacuation_centers_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      evacuation_routes: {
        Row: {
          brgyid: string
          created_at: string | null
          created_by: string
          distance_km: number | null
          end_point: Json
          estimated_time_minutes: number | null
          id: string
          route_coords: Json
          route_name: string
          start_point: Json
          updated_at: string | null
        }
        Insert: {
          brgyid: string
          created_at?: string | null
          created_by: string
          distance_km?: number | null
          end_point: Json
          estimated_time_minutes?: number | null
          id?: string
          route_coords: Json
          route_name: string
          start_point: Json
          updated_at?: string | null
        }
        Update: {
          brgyid?: string
          created_at?: string | null
          created_by?: string
          distance_km?: number | null
          end_point?: Json
          estimated_time_minutes?: number | null
          id?: string
          route_coords?: Json
          route_name?: string
          start_point?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evacuation_routes_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          brgyid: string
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          is_public: boolean | null
          location: string | null
          start_time: string
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          brgyid: string
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          start_time: string
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          brgyid?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          start_time?: string
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_reports: {
        Row: {
          admin_notes: string | null
          attachments: string[] | null
          brgyid: string
          category: string
          created_at: string
          description: string
          id: string
          location: string
          status: Database["public"]["Enums"]["feedback_status"]
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          attachments?: string[] | null
          brgyid: string
          category: string
          created_at?: string
          description: string
          id?: string
          location: string
          status: Database["public"]["Enums"]["feedback_status"]
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          attachments?: string[] | null
          brgyid?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          location?: string
          status?: Database["public"]["Enums"]["feedback_status"]
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_reports_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_individuals: {
        Row: {
          alias: string | null
          brgyid: string
          created_at: string
          created_by: string
          full_name: string | null
          id: string
          linked_report_id: string
          reason: string
          residentname: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          updated_at: string
        }
        Insert: {
          alias?: string | null
          brgyid: string
          created_at?: string
          created_by: string
          full_name?: string | null
          id?: string
          linked_report_id: string
          reason: string
          residentname?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string
        }
        Update: {
          alias?: string | null
          brgyid?: string
          created_at?: string
          created_by?: string
          full_name?: string | null
          id?: string
          linked_report_id?: string
          reason?: string
          residentname?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flagged_individuals_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagged_individuals_linked_report_id_fkey"
            columns: ["linked_report_id"]
            isOneToOne: false
            referencedRelation: "incident_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagged_individuals_residentname_fkey"
            columns: ["residentname"]
            isOneToOne: false
            referencedRelation: "admin_residents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagged_individuals_residentname_fkey"
            columns: ["residentname"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      forums: {
        Row: {
          brgyid: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string
          viewcount: number
        }
        Insert: {
          brgyid: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string
          viewcount?: number
        }
        Update: {
          brgyid?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string
          viewcount?: number
        }
        Relationships: []
      }
      householdmembers: {
        Row: {
          created_at: string | null
          householdid: string
          id: string
          residentid: string
          role: Database["public"]["Enums"]["householdrole"]
        }
        Insert: {
          created_at?: string | null
          householdid: string
          id?: string
          residentid: string
          role: Database["public"]["Enums"]["householdrole"]
        }
        Update: {
          created_at?: string | null
          householdid?: string
          id?: string
          residentid?: string
          role?: Database["public"]["Enums"]["householdrole"]
        }
        Relationships: [
          {
            foreignKeyName: "householdmembers_householdid_fkey"
            columns: ["householdid"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "householdmembers_residentid_fkey"
            columns: ["residentid"]
            isOneToOne: true
            referencedRelation: "admin_residents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "householdmembers_residentid_fkey"
            columns: ["residentid"]
            isOneToOne: true
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          address: string
          barangayname: string | null
          brgyid: string | null
          contact_number: string | null
          country: string | null
          created_at: string | null
          electricity_source: string | null
          garbage_disposal: string | null
          head_of_family: string | null
          headname: string | null
          house_type: string | null
          id: string
          members: Json | null
          monthly_income: string | null
          municipality: string | null
          name: string
          name_extension: string | null
          property_type: string | null
          province: string | null
          purok: string
          recordedby: string | null
          region: string | null
          remarks: string | null
          status: string
          toilet_type: string | null
          updated_at: string | null
          updatedby: string | null
          water_source: string | null
          year_established: number | null
        }
        Insert: {
          address: string
          barangayname?: string | null
          brgyid?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string | null
          electricity_source?: string | null
          garbage_disposal?: string | null
          head_of_family?: string | null
          headname?: string | null
          house_type?: string | null
          id: string
          members?: Json | null
          monthly_income?: string | null
          municipality?: string | null
          name: string
          name_extension?: string | null
          property_type?: string | null
          province?: string | null
          purok: string
          recordedby?: string | null
          region?: string | null
          remarks?: string | null
          status: string
          toilet_type?: string | null
          updated_at?: string | null
          updatedby?: string | null
          water_source?: string | null
          year_established?: number | null
        }
        Update: {
          address?: string
          barangayname?: string | null
          brgyid?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string | null
          electricity_source?: string | null
          garbage_disposal?: string | null
          head_of_family?: string | null
          headname?: string | null
          house_type?: string | null
          id?: string
          members?: Json | null
          monthly_income?: string | null
          municipality?: string | null
          name?: string
          name_extension?: string | null
          property_type?: string | null
          province?: string | null
          purok?: string
          recordedby?: string | null
          region?: string | null
          remarks?: string | null
          status?: string
          toilet_type?: string | null
          updated_at?: string | null
          updatedby?: string | null
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
          {
            foreignKeyName: "households_head_of_family_fkey"
            columns: ["head_of_family"]
            isOneToOne: true
            referencedRelation: "admin_residents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_head_of_family_fkey"
            columns: ["head_of_family"]
            isOneToOne: true
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_parties: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          incident_id: string
          name: string
          resident_id: string | null
          role: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          incident_id: string
          name: string
          resident_id?: string | null
          role: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          name?: string
          resident_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_parties_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incident_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_parties_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "admin_residents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_parties_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_reports: {
        Row: {
          brgyid: string
          created_at: string
          created_by: string
          date_reported: string
          description: string
          id: string
          location: string
          report_type: Database["public"]["Enums"]["report_type"]
          reporter_contact: string | null
          reporter_name: string
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at: string
        }
        Insert: {
          brgyid: string
          created_at?: string
          created_by: string
          date_reported?: string
          description: string
          id?: string
          location: string
          report_type: Database["public"]["Enums"]["report_type"]
          reporter_contact?: string | null
          reporter_name: string
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at?: string
        }
        Update: {
          brgyid?: string
          created_at?: string
          created_by?: string
          date_reported?: string
          description?: string
          id?: string
          location?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          reporter_contact?: string | null
          reporter_name?: string
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_brgyid_fkey"
            columns: ["brgyid"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      monthlyreport: {
        Row: {
          brgyid: string
          created_at: string
          id: number
          munid: string
          report: Json
          reportperiod: string
          status: string
          submittedon: string
        }
        Insert: {
          brgyid?: string
          created_at?: string
          id?: number
          munid?: string
          report: Json
          reportperiod: string
          status: string
          submittedon: string
        }
        Update: {
          brgyid?: string
          created_at?: string
          id?: number
          munid?: string
          report?: Json
          reportperiod?: string
          status?: string
          submittedon?: string
        }
        Relationships: []
      }
      notification: {
        Row: {
          created_at: string | null
          id: string
          linkurl: string | null
          message: string | null
          read: boolean | null
          type: string
          updated_at: string | null
          userid: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          linkurl?: string | null
          message?: string | null
          read?: boolean | null
          type: string
          updated_at?: string | null
          userid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          linkurl?: string | null
          message?: string | null
          read?: boolean | null
          type?: string
          updated_at?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      official_positions: {
        Row: {
          committee: string | null
          created_at: string
          description: string | null
          id: string
          is_current: boolean | null
          official_id: string
          position: string
          position_no: number | null
          sk: boolean | null
          tenure: string
          term_end: string
          term_start: string
          updated_at: string | null
        }
        Insert: {
          committee?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_current?: boolean | null
          official_id: string
          position: string
          position_no?: number | null
          sk?: boolean | null
          tenure: string
          term_end: string
          term_start: string
          updated_at?: string | null
        }
        Update: {
          committee?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_current?: boolean | null
          official_id?: string
          position?: string
          position_no?: number | null
          sk?: boolean | null
          tenure?: string
          term_end?: string
          term_start?: string
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
      officialranks: {
        Row: {
          bio: string | null
          brgyid: string
          created_at: string
          id: string
          officialid: string | null
          ranklabel: string | null
          rankno: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          brgyid?: string
          created_at?: string
          id: string
          officialid?: string | null
          ranklabel?: string | null
          rankno: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          brgyid?: string
          created_at?: string
          id?: string
          officialid?: string | null
          ranklabel?: string | null
          rankno?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officialranks_officialid_fkey"
            columns: ["officialid"]
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
          birthdate: string
          brgyid: string
          committees: Json | null
          coverurl: string | null
          created_at: string
          editedby: string | null
          educ: Json | null
          education: string | null
          email: string | null
          id: string
          "is_sk old": boolean[] | null
          name: string
          phone: string | null
          photo_url: string | null
          position_no: number | null
          recordedby: string
          term_end: string | null
          term_start: string | null
          updated_at: string
        }
        Insert: {
          achievements?: Json | null
          address?: string | null
          bio?: string | null
          birthdate: string
          brgyid?: string
          committees?: Json | null
          coverurl?: string | null
          created_at?: string
          editedby?: string | null
          educ?: Json | null
          education?: string | null
          email?: string | null
          id?: string
          "is_sk old"?: boolean[] | null
          name: string
          phone?: string | null
          photo_url?: string | null
          position_no?: number | null
          recordedby: string
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
        }
        Update: {
          achievements?: Json | null
          address?: string | null
          bio?: string | null
          birthdate?: string
          brgyid?: string
          committees?: Json | null
          coverurl?: string | null
          created_at?: string
          editedby?: string | null
          educ?: Json | null
          education?: string | null
          email?: string | null
          id?: string
          "is_sk old"?: boolean[] | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          position_no?: number | null
          recordedby?: string
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
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
      plaza: {
        Row: {
          barangay: string
          country: string
          created_at: string
          id: string
          municipality: string
          province: string
          region: string
        }
        Insert: {
          barangay: string
          country: string
          created_at?: string
          id: string
          municipality: string
          province: string
          region: string
        }
        Update: {
          barangay?: string
          country?: string
          created_at?: string
          id?: string
          municipality?: string
          province?: string
          region?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          adminid: string | null
          bday: string
          bio: string | null
          brgyid: string | null
          created_at: string | null
          dis: Json | null
          email: string
          firstname: string | null
          gender: string
          id: string
          last_login: string
          lastname: string | null
          mid: string | null
          middlename: string | null
          notes: Json | null
          online: boolean | null
          padlock: boolean | null
          phone: string | null
          plazid: string | null
          profile_picture: string | null
          purok: string
          role: string
          status: string
          superior_admin: boolean
          username: string
        }
        Insert: {
          adminid?: string | null
          bday: string
          bio?: string | null
          brgyid?: string | null
          created_at?: string | null
          dis?: Json | null
          email: string
          firstname?: string | null
          gender?: string
          id?: string
          last_login?: string
          lastname?: string | null
          mid?: string | null
          middlename?: string | null
          notes?: Json | null
          online?: boolean | null
          padlock?: boolean | null
          phone?: string | null
          plazid?: string | null
          profile_picture?: string | null
          purok: string
          role: string
          status?: string
          superior_admin?: boolean
          username: string
        }
        Update: {
          adminid?: string | null
          bday?: string
          bio?: string | null
          brgyid?: string | null
          created_at?: string | null
          dis?: Json | null
          email?: string
          firstname?: string | null
          gender?: string
          id?: string
          last_login?: string
          lastname?: string | null
          mid?: string | null
          middlename?: string | null
          notes?: Json | null
          online?: boolean | null
          padlock?: boolean | null
          phone?: string | null
          plazid?: string | null
          profile_picture?: string | null
          purok?: string
          role?: string
          status?: string
          superior_admin?: boolean
          username?: string
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
      reactions: {
        Row: {
          comment_id: string | null
          created_at: string
          emoji: string
          id: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          emoji: string
          id?: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          emoji?: string
          id?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
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
            referencedRelation: "admin_residents_view"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "admin_residents_view"
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
          brgyid: string
          civil_status: string
          classifications: string[] | null
          countryph: string
          created_at: string | null
          died_on: string | null
          editedby: string | null
          email: string | null
          emcontact: number | null
          emname: string | null
          emrelation: string | null
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
          recordedby: string | null
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
          brgyid?: string
          civil_status: string
          classifications?: string[] | null
          countryph: string
          created_at?: string | null
          died_on?: string | null
          editedby?: string | null
          email?: string | null
          emcontact?: number | null
          emname?: string | null
          emrelation?: string | null
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
          recordedby?: string | null
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
          brgyid?: string
          civil_status?: string
          classifications?: string[] | null
          countryph?: string
          created_at?: string | null
          died_on?: string | null
          editedby?: string | null
          email?: string | null
          emcontact?: number | null
          emname?: string | null
          emrelation?: string | null
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
          recordedby?: string | null
          regional?: string
          remarks?: string | null
          status?: string
          suffix?: string | null
          updated_at?: string | null
          years_in_barangay?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_household"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
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
          userid: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          userid?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          userid?: string
          value?: string
        }
        Relationships: []
      }
      settings_duplicate: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          userid: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          userid?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          userid?: string | null
          value?: string
        }
        Relationships: []
      }
      threads: {
        Row: {
          brgyid: string
          content: string
          created_at: string
          created_by: string
          forum_id: string
          id: string
          locked: boolean
          photo_url: string | null
          pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          viewcount: number
        }
        Insert: {
          brgyid: string
          content: string
          created_at?: string
          created_by: string
          forum_id: string
          id?: string
          locked?: boolean
          photo_url?: string | null
          pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          viewcount?: number
        }
        Update: {
          brgyid?: string
          content?: string
          created_at?: string
          created_by?: string
          forum_id?: string
          id?: string
          locked?: boolean
          photo_url?: string | null
          pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          viewcount?: number
        }
        Relationships: [
          {
            foreignKeyName: "threads_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          authid: string
          brgyid: string | null
          created_at: string
          email: string | null
          firstname: string
          id: string
          lastname: string
          middlename: string | null
          password: string | null
          phone: string | null
          role: string
          status: string
          username: string | null
        }
        Insert: {
          authid?: string
          brgyid?: string | null
          created_at?: string
          email?: string | null
          firstname: string
          id?: string
          lastname: string
          middlename?: string | null
          password?: string | null
          phone?: string | null
          role: string
          status: string
          username?: string | null
        }
        Update: {
          authid?: string
          brgyid?: string | null
          created_at?: string
          email?: string | null
          firstname?: string
          id?: string
          lastname?: string
          middlename?: string | null
          password?: string | null
          phone?: string | null
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
      wrappers_fdw_stats: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          create_times: number | null
          created_at: string
          fdw_name: string
          metadata: Json | null
          rows_in: number | null
          rows_out: number | null
          updated_at: string
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name?: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_residents_view: {
        Row: {
          address: string | null
          barangaydb: string | null
          birthdate: string | null
          brgyid: string | null
          civil_status: string | null
          classifications: string[] | null
          countryph: string | null
          created_at: string | null
          died_on: string | null
          email: string | null
          emcontact: number | null
          emname: string | null
          emrelation: string | null
          first_name: string | null
          gender: string | null
          has_pagibig: boolean | null
          has_philhealth: boolean | null
          has_sss: boolean | null
          has_tin: boolean | null
          household_id: string | null
          id: string | null
          is_voter: boolean | null
          last_name: string | null
          middle_name: string | null
          mobile_number: string | null
          monthly_income: number | null
          municipalitycity: string | null
          nationality: string | null
          occupation: string | null
          photo_url: string | null
          provinze: string | null
          purok: string | null
          regional: string | null
          remarks: string | null
          status: string | null
          suffix: string | null
          updated_at: string | null
          years_in_barangay: number | null
        }
        Insert: {
          address?: string | null
          barangaydb?: string | null
          birthdate?: string | null
          brgyid?: string | null
          civil_status?: string | null
          classifications?: string[] | null
          countryph?: string | null
          created_at?: string | null
          died_on?: string | null
          email?: string | null
          emcontact?: number | null
          emname?: string | null
          emrelation?: string | null
          first_name?: string | null
          gender?: string | null
          has_pagibig?: boolean | null
          has_philhealth?: boolean | null
          has_sss?: boolean | null
          has_tin?: boolean | null
          household_id?: string | null
          id?: string | null
          is_voter?: boolean | null
          last_name?: string | null
          middle_name?: string | null
          mobile_number?: string | null
          monthly_income?: number | null
          municipalitycity?: string | null
          nationality?: string | null
          occupation?: string | null
          photo_url?: string | null
          provinze?: string | null
          purok?: string | null
          regional?: string | null
          remarks?: string | null
          status?: string | null
          suffix?: string | null
          updated_at?: string | null
          years_in_barangay?: number | null
        }
        Update: {
          address?: string | null
          barangaydb?: string | null
          birthdate?: string | null
          brgyid?: string | null
          civil_status?: string | null
          classifications?: string[] | null
          countryph?: string | null
          created_at?: string | null
          died_on?: string | null
          email?: string | null
          emcontact?: number | null
          emname?: string | null
          emrelation?: string | null
          first_name?: string | null
          gender?: string | null
          has_pagibig?: boolean | null
          has_philhealth?: boolean | null
          has_sss?: boolean | null
          has_tin?: boolean | null
          household_id?: string | null
          id?: string | null
          is_voter?: boolean | null
          last_name?: string | null
          middle_name?: string | null
          mobile_number?: string | null
          monthly_income?: number | null
          municipalitycity?: string | null
          nationality?: string | null
          occupation?: string | null
          photo_url?: string | null
          provinze?: string | null
          purok?: string | null
          regional?: string | null
          remarks?: string | null
          status?: string | null
          suffix?: string | null
          updated_at?: string | null
          years_in_barangay?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_household"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
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
    }
    Functions: {
      accept_data_transfer: {
        Args: { transferid: string }
        Returns: string
      }
      airtable_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      airtable_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      airtable_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      auth0_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      auth0_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      auth0_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      big_query_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      big_query_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      big_query_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      click_house_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      click_house_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      click_house_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      cognito_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      cognito_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      cognito_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      delete_rejected_unprocessed_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      firebase_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      firebase_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      firebase_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      get_age_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          age_group: string
          count: number
        }[]
      }
      get_current_user_admin_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_admin: boolean
          brgyid: string
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
      hello_world_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      hello_world_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      hello_world_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      logflare_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      logflare_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      logflare_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      mssql_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      mssql_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      mssql_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      redis_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      redis_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      redis_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      s3_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      s3_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      s3_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      stripe_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      stripe_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      stripe_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      wasm_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      wasm_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      wasm_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
    }
    Enums: {
      disaster_zone_type:
        | "flood"
        | "fire"
        | "landslide"
        | "earthquake"
        | "typhoon"
        | "other"
      emergency_contact_type:
        | "fire"
        | "police"
        | "medical"
        | "disaster"
        | "rescue"
      evacuation_center_status: "available" | "full" | "closed" | "maintenance"
      feedback_status: "pending" | "in_progress" | "resolved" | "rejected"
      feedback_type: "barangay" | "system"
      householdrole: "Head" | "Spouse" | "Child" | "Other"
      incident_status: "Open" | "Under_Investigation" | "Resolved" | "Dismissed"
      report_type: "Theft" | "Dispute" | "Vandalism" | "Curfew" | "Others"
      risk_level: "Low" | "Moderate" | "High"
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
      disaster_zone_type: [
        "flood",
        "fire",
        "landslide",
        "earthquake",
        "typhoon",
        "other",
      ],
      emergency_contact_type: [
        "fire",
        "police",
        "medical",
        "disaster",
        "rescue",
      ],
      evacuation_center_status: ["available", "full", "closed", "maintenance"],
      feedback_status: ["pending", "in_progress", "resolved", "rejected"],
      feedback_type: ["barangay", "system"],
      householdrole: ["Head", "Spouse", "Child", "Other"],
      incident_status: ["Open", "Under_Investigation", "Resolved", "Dismissed"],
      report_type: ["Theft", "Dispute", "Vandalism", "Curfew", "Others"],
      risk_level: ["Low", "Moderate", "High"],
    },
  },
} as const
