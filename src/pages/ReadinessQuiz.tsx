import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const QUESTIONS = [
  // Emotional Readiness (8)
  { id: 1, text: "I feel emotionally available to start something new.", dimension: "emotional" },
  { id: 2, text: "I'm not stuck on my past relationships anymore.", dimension: "emotional" },
  { id: 3, text: "I can handle emotional ups and downs without shutting down.", dimension: "emotional" },
  { id: 4, text: "I'm open to being vulnerable with someone I trust.", dimension: "emotional" },
  { id: 5, text: "I'm not dating just to distract myself from loneliness.", dimension: "emotional" },
  { id: 6, text: "I can manage rejection or disappointment in a healthy way.", dimension: "emotional" },
  { id: 7, text: "I feel stable enough to let someone into my life.", dimension: "emotional" },
  { id: 8, text: "I'm not afraid of developing feelings for someone.", dimension: "emotional" },
  
  // Self-Awareness (8)
  { id: 9, text: "I understand my own needs clearly.", dimension: "self_awareness" },
  { id: 10, text: "I am aware of my relationship patterns.", dimension: "self_awareness" },
  { id: 11, text: "I take responsibility for my mistakes.", dimension: "self_awareness" },
  { id: 12, text: "I know what triggers me emotionally.", dimension: "self_awareness" },
  { id: 13, text: "I'm able to express my needs without guilt.", dimension: "self_awareness" },
  { id: 14, text: "I understand the type of partner I work best with.", dimension: "self_awareness" },
  { id: 15, text: "I'm honest with myself about what I truly want.", dimension: "self_awareness" },
  { id: 16, text: "I'm ready to show up as my authentic self.", dimension: "self_awareness" },
  
  // Communication (8)
  { id: 17, text: "I can talk about difficult topics without avoiding them.", dimension: "communication" },
  { id: 18, text: "I express my feelings clearly instead of bottling them up.", dimension: "communication" },
  { id: 19, text: "I listen actively without interrupting.", dimension: "communication" },
  { id: 20, text: "I can disagree respectfully.", dimension: "communication" },
  { id: 21, text: "I can communicate when I need space.", dimension: "communication" },
  { id: 22, text: "I can communicate when I need closeness.", dimension: "communication" },
  { id: 23, text: "I'm willing to work through misunderstandings.", dimension: "communication" },
  { id: 24, text: "I prefer clarity over assumptions.", dimension: "communication" },
  
  // Stability / Life Balance (8)
  { id: 25, text: "My life is generally stable right now.", dimension: "stability" },
  { id: 26, text: "I can make time for someone consistently.", dimension: "stability" },
  { id: 27, text: "My daily routine supports a healthy relationship.", dimension: "stability" },
  { id: 28, text: "I manage stress well enough to date intentionally.", dimension: "stability" },
  { id: 29, text: "I'm not overwhelmed by other responsibilities.", dimension: "stability" },
  { id: 30, text: "I'm emotionally in control most days.", dimension: "stability" },
  { id: 31, text: "I can balance personal goals and a relationship.", dimension: "stability" },
  { id: 32, text: "I can offer emotional support without burning out.", dimension: "stability" },
  
  // Boundaries & Availability (8)
  { id: 33, text: "I respect my own boundaries.", dimension: "boundaries" },
  { id: 34, text: "I respect other people's boundaries.", dimension: "boundaries" },
  { id: 35, text: "I can say \"no\" without guilt.", dimension: "boundaries" },
  { id: 36, text: "I can accept \"no\" without feeling rejected.", dimension: "boundaries" },
  { id: 37, text: "I don't depend on constant attention to feel secure.", dimension: "boundaries" },
  { id: 38, text: "I'm comfortable giving someone space when needed.", dimension: "boundaries" },
  { id: 39, text: "I'm comfortable receiving space without fear.", dimension: "boundaries" },
  { id: 40, text: "I'm genuinely ready to invest in someone.", dimension: "boundaries" }
];

const ReadinessQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleAnswer = (score: number) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentQuestion].id]: score }));
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 200);
    } else {
      saveAnswersAndCalculate();
    }
  };

  const saveAnswersAndCalculate = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Calculate dimension scores
    const dimensions = {
      emotional: calculateDimensionScore('emotional'),
      self_awareness: calculateDimensionScore('self_awareness'),
      communication: calculateDimensionScore('communication'),
      stability: calculateDimensionScore('stability'),
      boundaries: calculateDimensionScore('boundaries')
    };

    // Calculate overall readiness score (average of dimensions)
    const overallScore = Math.round(
      (dimensions.emotional + dimensions.self_awareness + dimensions.communication + 
       dimensions.stability + dimensions.boundaries) / 5
    );

    const labels = [
      "Closed Off", "Avoidant", "Uncertain", "Processing", "Slowly Warming Up",
      "Half-Ready", "Open but Careful", "Ready to Build", "Fully Available",
      "Relationship-Oriented", "Partnership-Ready"
    ];

    const descriptions = [
      "You may need more time before dating.",
      "You're keeping distance from connection.",
      "You're questioning if you're ready.",
      "You're working through past experiences.",
      "You're starting to open up.",
      "You're partly ready but cautious.",
      "You're open but taking your time.",
      "You're ready to build something real.",
      "You're emotionally ready and available.",
      "You're prioritizing meaningful relationships.",
      "You're fully ready for partnership."
    ];

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          has_completed_quiz: true,
          readiness_score: overallScore,
          readiness_label: labels[overallScore],
          readiness_description: descriptions[overallScore],
          dimension_emotional: { score: dimensions.emotional },
          dimension_self_awareness: { score: dimensions.self_awareness },
          dimension_communication: { score: dimensions.communication },
          dimension_stability: { score: dimensions.stability },
          dimension_boundaries: { score: dimensions.boundaries }
        })
        .eq('id', user.id);

      if (error) throw error;
      
      navigate('/readiness-result');
    } catch (error) {
      console.error('Error saving quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDimensionScore = (dimension: string): number => {
    const dimensionQuestions = QUESTIONS.filter(q => q.dimension === dimension);
    const dimensionAnswers = dimensionQuestions.map(q => answers[q.id] || 0);
    const sum = dimensionAnswers.reduce((a, b) => a + b, 0);
    const avg = sum / dimensionQuestions.length;
    return Math.round((avg / 5) * 10); // Convert 1-5 scale to 0-10
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Calculating your readiness...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card rounded-3xl shadow-medium p-8 border border-border"
          >
            <h2 className="text-2xl font-bold mb-8 text-card-foreground text-center">
              {QUESTIONS[currentQuestion].text}
            </h2>

            <div className="space-y-3">
              {[
                { label: 'Strongly Disagree', value: 1 },
                { label: 'Disagree', value: 2 },
                { label: 'Neutral', value: 3 },
                { label: 'Agree', value: 4 },
                { label: 'Strongly Agree', value: 5 }
              ].map(({ label, value }) => (
                <Button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  variant={answers[QUESTIONS[currentQuestion].id] === value ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-4 px-6"
                >
                  <span className="font-medium">{value}</span>
                  <span className="ml-4">{label}</span>
                </Button>
              ))}
            </div>

            {currentQuestion > 0 && (
              <Button
                onClick={goBack}
                variant="ghost"
                className="mt-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReadinessQuiz;
