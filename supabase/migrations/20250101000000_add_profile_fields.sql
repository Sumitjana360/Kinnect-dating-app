-- Add new profile fields for enhanced profile system
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS written_prompts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_prompts JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.profile_image_url IS 'Main profile picture URL';
COMMENT ON COLUMN public.profiles.gallery_photos IS 'Array of up to 5 gallery photo URLs';
COMMENT ON COLUMN public.profiles.written_prompts IS 'Array of 3 written prompts with question and answer';
COMMENT ON COLUMN public.profiles.video_prompts IS 'Array of 2 video prompts with title and video_url';



