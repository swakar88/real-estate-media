import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import BookingForm from "@/components/BookingForm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPackages() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/packages/`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    return [];
  }
}

export default async function BookOnline() {
  const packages = await getPackages();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 md:py-32 bg-card/30 border-b border-border/40">
          <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
            <ScrollReveal>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Book Your Shoot</h1>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Fast, reliable, and premium media delivered when you need it. Same-day photo turnaround included in all packages.
              </p>
            </ScrollReveal>
          </div>
        </section>
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <Suspense fallback={<div className="py-20 flex justify-center"><span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <BookingForm packages={packages} />
        </Suspense>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
