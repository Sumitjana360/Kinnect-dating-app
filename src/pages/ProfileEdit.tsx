import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, X, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImage, uploadVideo, deleteFile } from '@/lib/storage';
import { ProfileData, DEFAULT_WRITTEN_PROMPTS, WrittenPrompt, VideoPrompt } from '@/lib/profileTypes';

const ProfileEdit = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const profileImageInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const videoInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }

        loadProfile();
    }, [user, navigate]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // Parse JSON fields and ensure defaults
            const profileData: ProfileData = {
                ...data,
                gallery_photos: data.gallery_photos ? (typeof data.gallery_photos === 'string' ? JSON.parse(data.gallery_photos) : data.gallery_photos) : [],
                written_prompts: data.written_prompts ? (typeof data.written_prompts === 'string' ? JSON.parse(data.written_prompts) : data.written_prompts) : DEFAULT_WRITTEN_PROMPTS,
                video_prompts: data.video_prompts ? (typeof data.video_prompts === 'string' ? JSON.parse(data.video_prompts) : data.video_prompts) : [{ title: '', video_url: '' }, { title: '', video_url: '' }],
                interests: data.interests ? (typeof data.interests === 'string' ? JSON.parse(data.interests) : data.interests) : [],
            } as ProfileData;

            // Ensure written_prompts has exactly 3
            if (!profileData.written_prompts || profileData.written_prompts.length !== 3) {
                profileData.written_prompts = DEFAULT_WRITTEN_PROMPTS;
            }

            // Ensure video_prompts has exactly 2
            if (!profileData.video_prompts || profileData.video_prompts.length !== 2) {
                profileData.video_prompts = [{ title: '', video_url: '' }, { title: '', video_url: '' }];
            }

            setProfile(profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
            toast({
                title: 'Error',
                description: 'Failed to load profile',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0]) return;

        const file = e.target.files[0];
        setUploading('profile-image');

        try {
            // Delete old image if exists
            if (profile?.profile_image_url) {
                await deleteFile(profile.profile_image_url);
            }

            const url = await uploadImage(file, user.id, 'profile-images');

            setProfile(prev => prev ? { ...prev, profile_image_url: url } : null);

            // Save immediately
            await supabase
                .from('profiles')
                .update({ profile_image_url: url })
                .eq('id', user.id);

            toast({
                title: 'Success',
                description: 'Profile image updated',
            });
        } catch (error: any) {
            console.error('Error uploading profile image:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to upload image',
                variant: 'destructive',
            });
        } finally {
            setUploading(null);
            if (profileImageInputRef.current) {
                profileImageInputRef.current.value = '';
            }
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0] || !profile) return;

        const currentPhotos = profile.gallery_photos || [];
        if (currentPhotos.length >= 5) {
            toast({
                title: 'Limit reached',
                description: 'You can only have up to 5 gallery photos',
                variant: 'destructive',
            });
            return;
        }

        const file = e.target.files[0];
        setUploading('gallery');

        try {
            const url = await uploadImage(file, user.id, 'gallery');
            const newPhotos = [...currentPhotos, url];

            setProfile(prev => prev ? { ...prev, gallery_photos: newPhotos } : null);

            // Save immediately
            await supabase
                .from('profiles')
                .update({ gallery_photos: newPhotos })
                .eq('id', user.id);

            toast({
                title: 'Success',
                description: 'Photo added to gallery',
            });
        } catch (error: any) {
            console.error('Error uploading gallery photo:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to upload photo',
                variant: 'destructive',
            });
        } finally {
            setUploading(null);
            if (galleryInputRef.current) {
                galleryInputRef.current.value = '';
            }
        }
    };

    const handleRemoveGalleryPhoto = async (index: number) => {
        if (!user || !profile?.gallery_photos) return;

        const photoUrl = profile.gallery_photos[index];
        const newPhotos = profile.gallery_photos.filter((_, i) => i !== index);

        try {
            // Delete from storage
            await deleteFile(photoUrl);

            setProfile(prev => prev ? { ...prev, gallery_photos: newPhotos } : null);

            // Save immediately
            await supabase
                .from('profiles')
                .update({ gallery_photos: newPhotos })
                .eq('id', user.id);

            toast({
                title: 'Success',
                description: 'Photo removed',
            });
        } catch (error: any) {
            console.error('Error removing photo:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove photo',
                variant: 'destructive',
            });
        }
    };

    const handleVideoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0] || !profile) return;

        const file = e.target.files[0];
        setUploading(`video-${index}`);

        try {
            // Delete old video if exists
            const oldVideoUrl = profile.video_prompts?.[index]?.video_url;
            if (oldVideoUrl) {
                await deleteFile(oldVideoUrl);
            }

            const url = await uploadVideo(file, user.id);
            const newVideoPrompts = [...(profile.video_prompts || [])];
            newVideoPrompts[index] = {
                ...newVideoPrompts[index],
                video_url: url,
            };

            setProfile(prev => prev ? { ...prev, video_prompts: newVideoPrompts } : null);

            // Save immediately
            await supabase
                .from('profiles')
                .update({ video_prompts: newVideoPrompts })
                .eq('id', user.id);

            toast({
                title: 'Success',
                description: 'Video uploaded',
            });
        } catch (error: any) {
            console.error('Error uploading video:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to upload video',
                variant: 'destructive',
            });
        } finally {
            setUploading(null);
            if (videoInputRefs.current[index]) {
                videoInputRefs.current[index]!.value = '';
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;

        setSaving(true);

        try {
            const updateData: any = {
                full_name: profile.full_name || null,
                age: profile.age || null,
                city: profile.city || null,
                bio: profile.bio || null,
                written_prompts: profile.written_prompts || DEFAULT_WRITTEN_PROMPTS,
                video_prompts: profile.video_prompts || [{ title: '', video_url: '' }, { title: '', video_url: '' }],
            };

            // Handle interests if present
            if (profile.interests) {
                updateData.interests = profile.interests;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) {
                // If error is about interests field, try again without it
                if (error.message?.includes('interests') || error.message?.includes('column')) {
                    delete updateData.interests;
                    const { error: retryError } = await supabase
                        .from('profiles')
                        .update(updateData)
                        .eq('id', user.id);

                    if (retryError) throw retryError;
                } else {
                    throw error;
                }
            }

            toast({
                title: 'Success',
                description: 'Profile updated successfully',
            });

            navigate('/profile');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update profile',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-card-foreground">Profile not found</h2>
                    <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
                </div>
            </div>
        );
    }

    const profileImage = profile.profile_image_url || profile.avatar_url;

    return (
        <div className="min-h-screen bg-gradient-subtle px-4 py-8 pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/profile')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold text-card-foreground">Edit Profile</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Picture */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Picture</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => profileImageInputRef.current?.click()}
                                    />
                                ) : (
                                    <div
                                        className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => profileImageInputRef.current?.click()}
                                    >
                                        <Camera className="h-8 w-8 text-primary-foreground" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => profileImageInputRef.current?.click()}
                                        disabled={uploading === 'profile-image'}
                                    >
                                        {uploading === 'profile-image' ? 'Uploading...' : 'Change Photo'}
                                    </Button>
                                    <input
                                        ref={profileImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfileImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gallery Photos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Photo Gallery ({profile.gallery_photos?.length || 0}/5)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.gallery_photos && profile.gallery_photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {profile.gallery_photos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={photo}
                                                alt={`Gallery ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveGalleryPhoto(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(!profile.gallery_photos || profile.gallery_photos.length < 5) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => galleryInputRef.current?.click()}
                                    disabled={uploading === 'gallery'}
                                    className="w-full"
                                >
                                    {uploading === 'gallery' ? 'Uploading...' : <><Upload className="h-4 w-4 mr-2" /> Add Photo</>}
                                </Button>
                            )}
                            <input
                                ref={galleryInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleGalleryUpload}
                                className="hidden"
                            />
                        </CardContent>
                    </Card>

                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Name</Label>
                                <Input
                                    id="full_name"
                                    value={profile.full_name || ''}
                                    onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                                    placeholder="Your name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    min="18"
                                    max="120"
                                    value={profile.age || ''}
                                    onChange={(e) => setProfile(prev => prev ? { ...prev, age: e.target.value ? parseInt(e.target.value, 10) : null } : null)}
                                    placeholder="Your age"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={profile.city || ''}
                                    onChange={(e) => setProfile(prev => prev ? { ...prev, city: e.target.value } : null)}
                                    placeholder="Your city"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={profile.bio || ''}
                                    onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Written Prompts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Written Prompts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.written_prompts?.map((prompt, index) => (
                                <div key={index} className="space-y-2">
                                    <Label>{prompt.question}</Label>
                                    <Textarea
                                        value={prompt.answer}
                                        onChange={(e) => {
                                            const newPrompts = [...(profile.written_prompts || [])];
                                            newPrompts[index] = { ...newPrompts[index], answer: e.target.value };
                                            setProfile(prev => prev ? { ...prev, written_prompts: newPrompts } : null);
                                        }}
                                        placeholder="Your answer..."
                                        rows={3}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Video Prompts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Video Prompts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {profile.video_prompts?.map((video, index) => (
                                <div key={index} className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Video {index + 1} Title</Label>
                                        <Input
                                            value={video.title}
                                            onChange={(e) => {
                                                const newVideos = [...(profile.video_prompts || [])];
                                                newVideos[index] = { ...newVideos[index], title: e.target.value };
                                                setProfile(prev => prev ? { ...prev, video_prompts: newVideos } : null);
                                            }}
                                            placeholder="Enter video title..."
                                        />
                                    </div>
                                    {video.video_url ? (
                                        <div className="space-y-2">
                                            <video
                                                src={video.video_url}
                                                controls
                                                className="w-full rounded-lg"
                                            >
                                                Your browser does not support the video tag.
                                            </video>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => videoInputRefs.current[index]?.click()}
                                                disabled={uploading === `video-${index}`}
                                                className="w-full"
                                            >
                                                {uploading === `video-${index}` ? 'Uploading...' : 'Replace Video'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => videoInputRefs.current[index]?.click()}
                                            disabled={uploading === `video-${index}`}
                                            className="w-full"
                                        >
                                            {uploading === `video-${index}` ? 'Uploading...' : <><Upload className="h-4 w-4 mr-2" /> Upload Video</>}
                                        </Button>
                                    )}
                                    <input
                                        ref={el => videoInputRefs.current[index] = el}
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => handleVideoUpload(index, e)}
                                        className="hidden"
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/profile')}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving} className="flex-1">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEdit;
