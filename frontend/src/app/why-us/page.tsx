import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import { Zap, Home, Camera, Plane, RotateCw, MapPin } from "lucide-react";

const DIFFERENTIATORS = [
  {
    icon: Zap,
    title: "Next-Day Delivery",
    description: "Every shoot is edited and delivered by the next business day, so your listing goes live without delay.",
  },
  {
    icon: Home,
    title: "MLS-Ready Images",
    description: "Photos are sized and formatted for direct MLS upload — no extra editing or resizing needed on your end.",
  },
  {
    icon: Camera,
    title: "Professional HDR Photography",
    description: "Multi-exposure HDR blending captures true-to-life color, detail, and lighting in every room.",
  },
  {
    icon: Plane,
    title: "Licensed Drone Packages",
    description: "FAA Part 107 licensed pilots deliver sweeping aerial photos and video that ground-level shots can't match.",
  },
  {
    icon: RotateCw,
    title: "360° Virtual Tours",
    description: "Immersive walk-throughs let buyers explore a property online before ever stepping inside.",
  },
  {
    icon: MapPin,
    title: "Local Kansas City Expertise",
    description: "We know the neighborhoods, the light, and the market — local expertise that national services can't offer.",
  },
];

export default function WhyUs() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-20 bg-background overflow-hidden relative">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
          <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl relative">
            <ScrollReveal>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Why Choose KC Real Estate Media</h1>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Listings sell faster with media that actually shows the property well. Here&apos;s what sets us apart from generic photography services.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-20 bg-card/30">
          <div className="container mx-auto px-4 md:px-8">
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {DIFFERENTIATORS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={i}>
                    <div className="h-full rounded-[2.5rem] border border-primary/20 bg-card p-8 shadow-gold hover:shadow-gold-heavy transition-all">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 md:px-8 text-center max-w-2xl">
            <ScrollReveal>
              <h2 className="text-3xl font-bold mb-4">Ready to see the difference?</h2>
              <p className="text-muted-foreground mb-8">
                Browse our packages or book your first shoot — no account required to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-foreground shadow-gold hover:shadow-gold-heavy transition-all hover:bg-primary/90 hover:scale-105">
                  View Pricing
                </Link>
                <Link href="/book" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background/50 backdrop-blur px-8 font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:scale-105">
                  Book a Shoot Now
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
