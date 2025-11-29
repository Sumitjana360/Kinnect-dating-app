/**
 * Profile types with all new fields
 */

export interface WrittenPrompt {
  question: string;
  answer: string;
}

export interface VideoPrompt {
  title: string;
  video_url: string;
}

export interface ProfileData {
  id: string;
  full_name: string | null;
  age: number | null;
  city: string | null;
  intent: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_image_url?: string | null;
  gallery_photos?: string[] | null;
  written_prompts?: WrittenPrompt[] | null;
  video_prompts?: VideoPrompt[] | null;
  readiness_score: number | null;
  readiness_label: string | null;
  readiness_description: string | null;
  kinnect_type: string | null;
  dimension_emotional: any;
  dimension_self_awareness: any;
  dimension_communication: any;
  dimension_stability: any;
  dimension_boundaries: any;
  interests?: string[] | null;
}

export const DEFAULT_WRITTEN_PROMPTS: WrittenPrompt[] = [
  { question: 'One thing people should know about me', answer: '' },
  { question: 'My ideal first date', answer: '' },
  { question: "Something I'm currently working on", answer: '' },
];



