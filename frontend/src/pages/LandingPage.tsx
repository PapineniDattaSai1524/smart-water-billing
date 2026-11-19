import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import RoleSelector from '@/components/landing/RoleSelector';
import ValueSection from '@/components/landing/ValueSection';
import ProblemSolution from '@/components/landing/ProblemSolution';
import ProductPreview from '@/components/landing/ProductPreview';
import AnalyticsSection from '@/components/landing/AnalyticsSection';
import BillingShowcase from '@/components/landing/BillingShowcase';
import DataPipeline from '@/components/landing/DataPipeline';
import HowItWorks from '@/components/landing/HowItWorks';
import CommunitySection from '@/components/landing/CommunitySection';
import FeatureMatrix from '@/components/landing/FeatureMatrix';
import TrustSection from '@/components/landing/TrustSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ocean-950">
      <LandingNav />
      <main>
        <Hero />
        <RoleSelector />
        <ValueSection />
        <ProblemSolution />
        <ProductPreview />
        <AnalyticsSection />
        <div id="billing">
          <BillingShowcase />
        </div>
        <DataPipeline />
        <HowItWorks />
        <CommunitySection />
        <FeatureMatrix />
        <TrustSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
