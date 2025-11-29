import { supabase } from '@/integrations/supabase/client';

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user ID
 * @param folder - The folder name (e.g., 'profile-images', 'gallery')
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
  file: File,
  userId: string,
  folder: 'profile-images' | 'gallery' | 'videos' = 'profile-images'
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('profiles')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profiles')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload a video file to Supabase Storage
 * @param file - The video file to upload
 * @param userId - The user ID
 * @returns The public URL of the uploaded video
 */
export async function uploadVideo(
  file: File,
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `videos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('profiles')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload video: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profiles')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param url - The public URL of the file to delete
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    // Extract path from Supabase Storage public URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/profiles/[folder]/[userId]/[filename]
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'profiles');
    
    if (bucketIndex === -1) {
      console.warn('Could not extract file path from URL:', url);
      return;
    }

    // Get everything after 'profiles' in the path
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('profiles')
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete file:', error);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

