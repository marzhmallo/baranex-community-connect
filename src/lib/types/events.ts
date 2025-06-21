
export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  event_type?: string;
  target_audience?: string;
  is_public?: boolean;
  created_by: string;
  brgyid: string;
  created_at?: string;
  updated_at?: string;
}
