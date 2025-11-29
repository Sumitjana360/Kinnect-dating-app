import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DimensionScore {
  score: number;
}

interface ProfileData {
  readiness_score: number;
  readiness_label: string;
  readiness_description: string;
  dimension_emotional: DimensionScore;
  dimension_self_awareness: DimensionScore;
  dimension_communication: DimensionScore;
  dimension_stability: DimensionScore;
  dimension_boundaries: DimensionScore;
}

const ReadinessResult = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadProfileData();
  }, [user, navigate]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (!data.has_completed_quiz) {
        navigate('/readiness-quiz');
        return;
      }

      setProfileData({
        readiness_score: data.readiness_score,
        readiness_label: data.readiness_label,
        readiness_description: data.readiness_description,
        dimension_emotional: data.dimension_emotional as unknown as DimensionScore,
        dimension_self_awareness: data.dimension_self_awareness as unknown as DimensionScore,
        dimension_communication: data.dimension_communication as unknown as DimensionScore,
        dimension_stability: data.dimension_stability as unknown as DimensionScore,
        dimension_boundaries: data.dimension_boundaries as unknown as DimensionScore
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-primary';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getInsights = () => {
    const dimensions = [
      { name: 'Emotional Readiness', score: profileData.dimension_emotional.score },
      { name: 'Self-Awareness', score: profileData.dimension_self_awareness.score },
      { name: 'Communication', score: profileData.dimension_communication.score },
      { name: 'Stability', score: profileData.dimension_stability.score },
      { name: 'Boundaries', score: profileData.dimension_boundaries.score }
    ];

    const sorted = [...dimensions].sort((a, b) => b.score - a.score);
    const strengths = sorted.slice(0, 2);
    const growth = sorted.slice(-1)[0];

    return {
      strengths: strengths.map(d => d.name),
      growth: growth.name,
      growthScore: growth.score
    };
  };

  const insights = getInsights();

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-card-foreground">Your Readiness Score</h1>
          <p className="text-muted-foreground">Here's your relationship readiness profile</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl shadow-medium p-8 border border-border mb-8"
        >
          <div className="text-center mb-8">
            <div className={`text-7xl font-bold mb-2 ${getScoreColor(profileData.readiness_score)}`}>
              {profileData.readiness_score}/10
            </div>
            <div className="text-2xl font-semibold text-card-foreground mb-2">
              {profileData.readiness_label}
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              {profileData.readiness_description}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">Your Strengths</h3>
              <div className="space-y-2">
                {insights.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>Strong {strength}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">Growth Area</h3>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-muted-foreground">
                  Your {insights.growth} could use some attention. 
                  {insights.growthScore < 5 && " Consider working on this area before diving into dating."}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">Dimension Breakdown</h3>
              <div className="space-y-3">
                {[
                  { name: 'Emotional Readiness', score: profileData.dimension_emotional.score },
                  { name: 'Self-Awareness', score: profileData.dimension_self_awareness.score },
                  { name: 'Communication', score: profileData.dimension_communication.score },
                  { name: 'Stability', score: profileData.dimension_stability.score },
                  { name: 'Boundaries', score: profileData.dimension_boundaries.score }
                ].map((dim) => (
                  <div key={dim.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">{dim.name}</span>
                      <span className={`text-sm font-medium ${getScoreColor(dim.score)}`}>
                        {dim.score}/10
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary"
                        style={{ width: `${(dim.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate('/explore')}
            className="w-full mt-8 bg-gradient-primary text-primary-foreground hover:opacity-90"
            size="lg"
          >
            Start Exploring
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadinessResult;
