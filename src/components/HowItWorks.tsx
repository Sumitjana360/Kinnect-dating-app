import { motion } from "framer-motion";
import { ClipboardList, Brain, Users, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Set Your Intent",
    description: "Choose what you're looking for: casual, intentional, or committed. We match you with people who want the same.",
  },
  {
    icon: Brain,
    title: "Take the Kinnect Quiz",
    description: "45 questions reveal your personality type and compatibility traits. Get your unique Kinnect Type and trait fingerprint.",
  },
  {
    icon: Users,
    title: "See Smart Matches",
    description: "Browse profiles with compatibility scores and detailed reports. Know why you match before you connect.",
  },
  {
    icon: MessageCircle,
    title: "Connect Meaningfully",
    description: "Chat with matches who align with you. Use our 'Let's Meet' feature when you're both ready to take it offline.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How KINNECT Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to find connections that actually matter
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -z-10" />
              )}

              <div className="bg-background rounded-2xl p-8 shadow-soft border border-border hover:shadow-medium transition-shadow h-full">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
