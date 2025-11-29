import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProfileData } from '@/lib/profileTypes';

const Profile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

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

            // Parse JSON fields
            const profileData: ProfileData = {
                ...data,
                gallery_photos: data.gallery_photos ? (typeof data.gallery_photos === 'string' ? JSON.parse(data.gallery_photos) : data.gallery_photos) : [],
                written_prompts: data.written_prompts ? (typeof data.written_prompts === 'string' ? JSON.parse(data.written_prompts) : data.written_prompts) : [],
                video_prompts: data.video_prompts ? (typeof data.video_prompts === 'string' ? JSON.parse(data.video_prompts) : data.video_prompts) : [],
                interests: data.interests ? (typeof data.interests === 'string' ? JSON.parse(data.interests) : data.interests) : [],
            } as ProfileData;

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

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-primary';
        if (score >= 4) return 'text-orange-600';
        return 'text-red-600';
    };

    const getDimensionScore = (dimension: any): number => {
        if (!dimension || typeof dimension !== 'object') return 0;
        if (typeof dimension.score === 'number') return dimension.score;
        if (typeof dimension.value === 'number') return dimension.value;
        return 0;
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
                    <Button onClick={() => navigate('/explore')}>Go to Explore</Button>
                </div>
            </div>
        );
    }

    const profileImage = profile.profile_image_url || profile.avatar_url;

    return (
        <div className="min-h-screen bg-gradient-subtle px-4 py-8 pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/explore')}
                        className="md:hidden"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold text-card-foreground">My Profile</h1>
                </div>

                {/* Header Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={profile.full_name || 'Profile'}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-primary">
                                        <span className="text-3xl font-bold text-primary-foreground">
                                            {profile.full_name?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold text-card-foreground">
                                        {profile.full_name || 'Anonymous'}
                                        {profile.age && `, ${profile.age}`}
                                    </h2>
                                    {profile.city && (
                                        <p className="text-muted-foreground mt-1">{profile.city}</p>
                                    )}
                                    {profile.intent && (
                                        <Badge variant="outline" className="mt-2 capitalize">
                                            {profile.intent}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Button onClick={() => navigate('/profile/edit')} variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Gallery Photos */}
                {profile.gallery_photos && profile.gallery_photos.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Photos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-2">
                                {profile.gallery_photos.map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo}
                                        alt={`Gallery ${index + 1}`}
                                        className="w-full aspect-square object-cover rounded-lg"
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Relationship Readiness */}
                <Card>
                    <CardHeader>
                        <CardTitle>Relationship Readiness</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {profile.readiness_score !== null && profile.readiness_score !== undefined ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Readiness: {profile.readiness_score} / 10
                                        </span>
                                        {profile.readiness_label && (
                                            <span className={`text-sm font-semibold ${getScoreColor(profile.readiness_score)}`}>
                                                {profile.readiness_label}
                                            </span>
                                        )}
                                    </div>
                                    <Progress value={(profile.readiness_score / 10) * 100} className="h-2" />
                                </div>
                                {profile.readiness_description && (
                                    <p className="text-sm text-muted-foreground">{profile.readiness_description}</p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Complete the readiness quiz to see your score.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Kinnect Type / Traits */}
                <Card>
                    <CardHeader>
                        <CardTitle>Kinnect Type & Traits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {profile.kinnect_type && (
                            <div>
                                <Badge variant="secondary" className="text-base px-3 py-1">
                                    Kinnect Type: {profile.kinnect_type}
                                </Badge>
                            </div>
                        )}

                        {/* Dimension Scores */}
                        <div className="space-y-3">
                            {profile.dimension_emotional && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">Emotional</span>
                                        <span className="text-sm text-muted-foreground">
                                            {getDimensionScore(profile.dimension_emotional)}/10
                                        </span>
                                    </div>
                                    <Progress value={(getDimensionScore(profile.dimension_emotional) / 10) * 100} className="h-2" />
                                </div>
                            )}
                            {profile.dimension_self_awareness && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">Self Awareness</span>
                                        <span className="text-sm text-muted-foreground">
                                            {getDimensionScore(profile.dimension_self_awareness)}/10
                                        </span>
                                    </div>
                                    <Progress value={(getDimensionScore(profile.dimension_self_awareness) / 10) * 100} className="h-2" />
                                </div>
                            )}
                            {profile.dimension_communication && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">Communication</span>
                                        <span className="text-sm text-muted-foreground">
                                            {getDimensionScore(profile.dimension_communication)}/10
                                        </span>
                                    </div>
                                    <Progress value={(getDimensionScore(profile.dimension_communication) / 10) * 100} className="h-2" />
                                </div>
                            )}
                            {profile.dimension_stability && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">Stability</span>
                                        <span className="text-sm text-muted-foreground">
                                            {getDimensionScore(profile.dimension_stability)}/10
                                        </span>
                                    </div>
                                    <Progress value={(getDimensionScore(profile.dimension_stability) / 10) * 100} className="h-2" />
                                </div>
                            )}
                            {profile.dimension_boundaries && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">Boundaries</span>
                                        <span className="text-sm text-muted-foreground">
                                            {getDimensionScore(profile.dimension_boundaries)}/10
                                        </span>
                                    </div>
                                    <Progress value={(getDimensionScore(profile.dimension_boundaries) / 10) * 100} className="h-2" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Written Prompts */}
                {profile.written_prompts && profile.written_prompts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Prompts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.written_prompts.map((prompt, index) => (
                                <div key={index}>
                                    <h3 className="text-sm font-semibold mb-1">{prompt.question}</h3>
                                    <p className="text-muted-foreground">{prompt.answer || 'No answer yet.'}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Video Prompts */}
                {profile.video_prompts && profile.video_prompts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Videos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.video_prompts.map((video, index) => (
                                <div key={index}>
                                    <h3 className="text-sm font-semibold mb-2">{video.title || `Video ${index + 1}`}</h3>
                                    {video.video_url ? (
                                        <video
                                            src={video.video_url}
                                            controls
                                            className="w-full rounded-lg"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No video added yet.</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* About Me */}
                <Card>
                    <CardHeader>
                        <CardTitle>About Me</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {profile.bio ? (
                            <p className="text-muted-foreground">{profile.bio}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No bio yet.</p>
                        )}

                        {profile.interests && profile.interests.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-2">Interests</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.interests.map((interest, index) => (
                                        <Badge key={index} variant="outline">
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
