import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, Shield } from "lucide-react";
import compatibilityImage from "@/assets/compatibility-visual.jpg";

const features = [
  {
    icon: CheckCircle2,
    title: "16 Personality Types",
    description: "Backed by psychology, refined for modern dating",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Scoring",
    description: "See compatibility scores from 0-100 on every profile",
  },
  {
    icon: Shield,
    title: "Friction Points",
    description: "Honest insights about potential challenges, not just strengths",
  },
];

export const CompatibilitySection = () => {
  return (
    <section className="py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-medium">
              <img
                src={compatibilityImage}
                alt="Compatibility visualization"
                className="w-full h-auto"
              />
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="text-sm font-medium text-primary">
                  The Science Behind It
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Compatibility, <span className="text-gradient">simplified</span>
              </h2>

              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                We measure what matters: communication style, emotional patterns, values alignment, lifestyle compatibility, and future goals. No astrology. No guessing. Just data-backed insights.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
