import LandingHero from "./_components/LandingHero";
import LandingFeatures from "./_components/LandingFeatures";
import LandingTestimonials from "./_components/LandingTestimonials";
import LandingFAQ from "./_components/LandingFAQ";
import HomePageGradients from "./_components/HomePageGradients";
import LandingPricing from "./_components/LandingPricing";

export default function HomePage() {
  return (
    <>
      <HomePageGradients />
      <LandingHero />
      <LandingFeatures />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFAQ />
    </>
  );
}
