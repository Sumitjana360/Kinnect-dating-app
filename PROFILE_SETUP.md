# Profile System Setup Guide

## Database Migration

Run the migration file to add new profile fields:

```sql
-- File: supabase/migrations/20250101000000_add_profile_fields.sql
```

This adds:
- `profile_image_url` (TEXT)
- `gallery_photos` (JSONB, array of strings)
- `written_prompts` (JSONB, array of {question, answer})
- `video_prompts` (JSONB, array of {title, video_url})

## Supabase Storage Setup

1. **Create Storage Bucket:**
   - Go to Supabase Dashboard → Storage
   - Create a new bucket named `profiles`
   - Set it to **Public** (or configure RLS policies)

2. **Storage Policies:**
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- Allow authenticated users to read all files
   CREATE POLICY "Users can view all files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'profiles');
   ```

3. **Folder Structure:**
   - `profiles/profile-images/{userId}/` - Profile pictures
   - `profiles/gallery/{userId}/` - Gallery photos
   - `profiles/videos/{userId}/` - Video prompts

## Routes

- `/profile` - My Profile (logged-in user)
- `/profile/edit` - Edit Profile
- `/profile/:userId` - View Other User's Profile

## Navigation

Bottom navigation bar appears on:
- `/explore` - Explore tab
- `/profile` - Profile tab

## Features Implemented

✅ Profile image upload
✅ Gallery photos (max 5)
✅ Written prompts (3 default questions)
✅ Video prompts (2 videos)
✅ Bio and interests
✅ All existing profile fields
✅ View other users' profiles
✅ Mobile-responsive design



