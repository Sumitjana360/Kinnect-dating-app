import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { CompatibilitySection } from "@/components/CompatibilitySection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <CompatibilitySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
