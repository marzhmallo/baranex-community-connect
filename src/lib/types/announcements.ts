
export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  audience: string;
  is_public: boolean;
  is_pinned: boolean;
  photo_url?: string;
  attachment_url?: string;
  created_by: string;
  brgyid: string;
  created_at: string;
  updated_at: string;
}
