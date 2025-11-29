import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Heart, X, Sparkles } from 'lucide-react';
import { getOtherUserProfile, normalizeUserIds, getOtherUserId } from '@/lib/matchUtils';

interface Profile {
  id: string;
  full_name: string;
  age: number;
  city: string;
  intent: string;
  readiness_score: number;
  readiness_label: string;
  bio: string;
  avatar_url: string;
  profile_image_url?: string | null;
}

interface MatchRow {
  user_a_id: string;
  user_b_id: string;
  created_at?: string;
  user_a?: Profile;
  user_b?: Profile;
  [key: string]: any;
}

const Explore = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [newMatchUser, setNewMatchUser] = useState<Profile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    checkQuizCompletion();
  }, [user, navigate]);

  const checkQuizCompletion = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_completed_quiz')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!data.has_completed_quiz) {
        navigate('/readiness-quiz');
        return;
      }

      // Load current user's profile for match modal
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userProfile) {
        setCurrentUserProfile(userProfile as Profile);
      }

      loadProfiles();
    } catch (error) {
      console.error('Error checking quiz completion:', error);
    }
  };

  /**
   * Checks if a match already exists between two users (in either order)
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns The existing match if found, null otherwise
   */
  const checkExistingMatch = async (userId1: string, userId2: string) => {
    try {
      // Check for match in both possible orders using OR condition
      // Format: (user_a_id = userId1 AND user_b_id = userId2) OR (user_a_id = userId2 AND user_b_id = userId1)
      const { data: existingMatches, error } = await (supabase
        .from('matches' as any)
        .select('*')
        .or(`user_a_id.eq.${userId1},user_b_id.eq.${userId1}`) as any);

      if (error) {
        console.error('Error checking for existing match:', error);
        return null;
      }

      if (!existingMatches || existingMatches.length === 0) {
        return null;
      }

      // Filter to find the match that contains both users
      const match = existingMatches.find((m: any) =>
        (m.user_a_id === userId1 && m.user_b_id === userId2) ||
        (m.user_a_id === userId2 && m.user_b_id === userId1)
      );

      return match || null;
    } catch (error) {
      console.error('Error checking for existing match:', error);
      return null;
    }
  };

  /**
   * Creates a match between two users if one doesn't already exist
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns The match object if created or found, null if error
   */
  const createMatchIfNotExists = async (userId1: string, userId2: string) => {
    // First, check if a match already exists in either order
    const existingMatch = await checkExistingMatch(userId1, userId2);

    if (existingMatch) {
      // Match already exists, return it
      return existingMatch;
    }

    // No existing match, create a new one with normalized IDs
    const { user_a_id, user_b_id } = normalizeUserIds(userId1, userId2);

    try {
      const { data: newMatch, error: matchError } = await (supabase
        .from('matches' as any)
        .insert({
          user_a_id,
          user_b_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single() as any);

      if (matchError) {
        // If insert fails, check again in case it was created by another request (race condition)
        const raceConditionMatch = await checkExistingMatch(userId1, userId2);
        if (raceConditionMatch) {
          return raceConditionMatch;
        }
        console.error('Error creating match:', matchError);
        return null;
      }

      return newMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  };

  const loadProfiles = async () => {
    if (!user) return;

    try {
      // Try to load matches first (if matches table exists)
      let matchesData: MatchRow[] | null = null;
      try {
        // First, try with joined profiles (if foreign keys are set up)
        const { data: matchesWithProfiles, error: matchesError } = await (supabase
          .from('matches' as any)
          .select(`
            user_a_id,
            user_b_id,
            created_at,
            user_a:profiles!matches_user_a_id_fkey(*),
            user_b:profiles!matches_user_b_id_fkey(*)
          `)
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`) as any);

        if (!matchesError && matchesWithProfiles && matchesWithProfiles.length > 0) {
          matchesData = matchesWithProfiles as MatchRow[];
        } else {
          // If that doesn't work, try without joins and fetch profiles separately
          const { data: matchesOnly, error: matchesOnlyError } = await (supabase
            .from('matches' as any)
            .select('user_a_id, user_b_id, created_at')
            .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`) as any);

          if (!matchesOnlyError && matchesOnly && matchesOnly.length > 0) {
            // Group matches by other user ID and pick most recent
            const matchesByOtherUser = new Map<string, any>();

            for (const match of matchesOnly as any[]) {
              const otherUserId = getOtherUserId(match, user.id);

              // Skip if this match doesn't contain the current user
              if (!otherUserId || otherUserId === user.id) continue;

              // Get existing match for this other user
              const existingMatch = matchesByOtherUser.get(otherUserId);

              // If no existing match, or this match is more recent, use this one
              if (!existingMatch) {
                matchesByOtherUser.set(otherUserId, match);
              } else {
                // Compare created_at timestamps to pick the most recent
                const existingCreatedAt = existingMatch.created_at ? new Date(existingMatch.created_at).getTime() : 0;
                const currentCreatedAt = match.created_at ? new Date(match.created_at).getTime() : 0;

                if (currentCreatedAt > existingCreatedAt) {
                  matchesByOtherUser.set(otherUserId, match);
                }
              }
            }

            // Get unique other user IDs from the most recent matches
            const otherUserIds = Array.from(matchesByOtherUser.keys())
              .filter((id): id is string => id != null && id !== user.id);

            // Fetch profiles for those users
            if (otherUserIds.length > 0) {
              const { data: otherProfiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', otherUserIds);

              if (!profilesError && otherProfiles) {
                setProfiles(otherProfiles as Profile[]);
                setLoading(false);
                return;
              }
            }
          }
        }
      } catch (e) {
        // Matches table might not exist, fall back to profiles
        console.log('Matches table not found or error occurred, using profiles');
      }

      // If we have matches with joined profiles, group by other user ID and pick most recent
      if (matchesData && matchesData.length > 0) {
        // Group matches by other user ID
        const matchesByOtherUser = new Map<string, MatchRow>();

        for (const match of matchesData) {
          const otherUserId = getOtherUserId(match, user.id);

          // Skip if this match doesn't contain the current user
          if (!otherUserId || otherUserId === user.id) continue;

          // Get existing match for this other user
          const existingMatch = matchesByOtherUser.get(otherUserId);

          // If no existing match, or this match is more recent, use this one
          if (!existingMatch) {
            matchesByOtherUser.set(otherUserId, match);
          } else {
            // Compare created_at timestamps to pick the most recent
            const existingCreatedAt = existingMatch.created_at ? new Date(existingMatch.created_at).getTime() : 0;
            const currentCreatedAt = match.created_at ? new Date(match.created_at).getTime() : 0;

            if (currentCreatedAt > existingCreatedAt) {
              matchesByOtherUser.set(otherUserId, match);
            }
          }
        }

        // Extract profiles from the most recent match for each other user
        const otherUserProfiles = Array.from(matchesByOtherUser.values())
          .map((match) => getOtherUserProfile(match, user.id))
          .filter((profile): profile is Profile => profile != null && profile.id !== user.id);

        if (otherUserProfiles.length > 0) {
          setProfiles(otherUserProfiles);
          setLoading(false);
          return;
        }
      }

      // Fallback to loading all profiles (original behavior)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .gte('readiness_score', 4)
        .not('readiness_score', 'is', null)
        .limit(20);

      if (error) throw error;

      // Map data to Profile interface, handling optional fields
      const mappedProfiles = (data || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || '',
        age: p.age || 0,
        city: p.city || '',
        intent: p.intent || '',
        readiness_score: p.readiness_score || 0,
        readiness_label: p.readiness_label || '',
        bio: p.bio || '',
        avatar_url: p.avatar_url || '',
        profile_image_url: p.profile_image_url || null,
      }));

      setProfiles(mappedProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (!user || !profiles[currentIndex]) return;

    const likedUserId = profiles[currentIndex].id;

    if (liked) {
      try {
        // Record the like
        const { error: likeError } = await (supabase
          .from('likes' as any)
          .insert({
            user_id: user.id,
            liked_user_id: likedUserId,
            created_at: new Date().toISOString()
          }) as any);

        if (likeError && (likeError as any).code !== '23505') { // Ignore duplicate key errors
          console.error('Error recording like:', likeError);
        }

        // Check if there's a mutual like (the other user has already liked the current user)
        const { data: mutualLike, error: checkError } = await (supabase
          .from('likes' as any)
          .select('*')
          .eq('user_id', likedUserId)
          .eq('liked_user_id', user.id)
          .maybeSingle() as any);

        if (!checkError && mutualLike) {
          // Mutual match! Create a match record (or get existing one)
          const match = await createMatchIfNotExists(user.id, likedUserId);

          if (match) {
            // Check if this is a newly created match (not just an existing one)
            // We can determine this by checking if the match was just created
            // For simplicity, we'll show the modal if we successfully got/created a match
            // and the match was created recently (within last few seconds) or is new
            const matchCreatedAt = new Date(match.created_at);
            const now = new Date();
            const secondsSinceCreation = (now.getTime() - matchCreatedAt.getTime()) / 1000;

            // Only show modal if match was created very recently (within 5 seconds)
            // This prevents showing modal for old matches when loading
            if (secondsSinceCreation < 5) {
              setNewMatchUser(profiles[currentIndex]);
              setShowMatchModal(true);
            }
          }
        }
      } catch (error) {
        console.error('Error processing like:', error);
      }
    }

    // Move to next profile
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setProfiles([]);
      setCurrentIndex(0);
    }
  };

  const handleStartChatting = () => {
    if (newMatchUser) {
      // Navigate to chat/messages with the matched user
      // Adjust the route based on your app's routing structure
      navigate(`/messages/${newMatchUser.id}`);
      setShowMatchModal(false);
      setNewMatchUser(null);
    }
  };

  const handleKeepBrowsing = () => {
    setShowMatchModal(false);
    setNewMatchUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md text-center border-dashed">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-xl font-semibold">You&apos;re all caught up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              No more profiles that match your settings right now.
            </p>
            <p className="text-sm text-muted-foreground">
              New people will appear as they join or update their readiness.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-primary bg-primary/10';
    if (score >= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <>
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">It&apos;s a match!</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center gap-8 py-6">
            {/* Current User */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {currentUserProfile?.avatar_url ? (
                  <img
                    src={currentUserProfile.avatar_url}
                    alt={currentUserProfile.full_name || 'You'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-primary">
                    <span className="text-3xl font-bold text-primary-foreground">
                      {currentUserProfile?.full_name?.[0] || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{currentUserProfile?.full_name || 'You'}</p>
                {currentUserProfile?.readiness_score !== undefined && (
                  <p className={`text-xs ${getScoreColor(currentUserProfile.readiness_score)} px-2 py-1 rounded-full mt-1`}>
                    {currentUserProfile.readiness_score}/10
                  </p>
                )}
              </div>
            </div>

            {/* Heart Icon */}
            <Heart className="w-8 h-8 text-primary fill-primary" />

            {/* Matched User */}
            <div
              className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (newMatchUser) {
                  navigate(`/profile/${newMatchUser.id}`);
                  setShowMatchModal(false);
                }
              }}
            >
              <div className="relative">
                {newMatchUser?.avatar_url ? (
                  <img
                    src={newMatchUser.avatar_url}
                    alt={newMatchUser.full_name || 'Match'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-primary">
                    <span className="text-3xl font-bold text-primary-foreground">
                      {newMatchUser?.full_name?.[0] || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{newMatchUser?.full_name || 'Match'}</p>
                {newMatchUser?.readiness_score !== undefined && (
                  <p className={`text-xs ${getScoreColor(newMatchUser.readiness_score)} px-2 py-1 rounded-full mt-1`}>
                    {newMatchUser.readiness_score}/10
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleKeepBrowsing}
              className="w-full sm:w-auto"
            >
              Keep browsing
            </Button>
            <Button
              onClick={handleStartChatting}
              className="w-full sm:w-auto bg-gradient-primary"
            >
              Start chatting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-subtle px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-card-foreground">Explore</h1>

          <motion.div
            key={currentProfile.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl shadow-medium overflow-hidden border border-border mb-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/profile/${currentProfile.id}`)}
          >
            <div className="aspect-[3/4] bg-gradient-primary relative flex items-center justify-center">
              {(currentProfile.profile_image_url || currentProfile.avatar_url) ? (
                <img
                  src={currentProfile.profile_image_url || currentProfile.avatar_url}
                  alt={currentProfile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl font-bold text-primary-foreground">
                  {currentProfile.full_name?.[0] || '?'}
                </div>
              )}

              <div className={`absolute top-4 right-4 px-4 py-2 rounded-full ${getScoreColor(currentProfile.readiness_score)} font-semibold`}>
                {currentProfile.readiness_score}/10
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-card-foreground">
                  {currentProfile.full_name || 'Anonymous'}
                  {currentProfile.age && `, ${currentProfile.age}`}
                </h2>
                {currentProfile.intent && (
                  <span className="px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm capitalize">
                    {currentProfile.intent}
                  </span>
                )}
              </div>

              {currentProfile.city && (
                <p className="text-muted-foreground mb-3">{currentProfile.city}</p>
              )}

              <div className="mb-4">
                <span className="text-sm font-medium text-muted-foreground">Readiness: </span>
                <span className="text-sm font-semibold text-card-foreground">
                  {currentProfile.readiness_label}
                </span>
              </div>

              {currentProfile.bio && (
                <p className="text-muted-foreground">{currentProfile.bio}</p>
              )}
            </div>
          </motion.div>

          <div className="flex justify-center gap-6">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 p-0"
              onClick={() => handleSwipe(false)}
            >
              <X className="w-8 h-8" />
            </Button>

            <Button
              size="lg"
              className="rounded-full w-16 h-16 p-0 bg-gradient-primary"
              onClick={() => handleSwipe(true)}
            >
              <Heart className="w-8 h-8" />
            </Button>
          </div>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            {currentIndex + 1} / {profiles.length}
          </div>
        </div>
      </div>
    </>
  );
};

export default Explore;
