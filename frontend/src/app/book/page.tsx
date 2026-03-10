import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import BookingForm from "@/components/BookingForm";

export const dynamic = 'force-dynamic';

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
            {/* Packages */}
            {/* Packages */}
            {packages.length > 0 ? (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {packages.map((pkg: any) => (
                  <StaggerItem key={pkg.id}>
                    <div className={`flex flex-col rounded-2xl bg-card p-8 shadow-sm hover:shadow-lg transition-shadow h-full relative ${pkg.is_popular ? 'border-2 border-primary shadow-lg transform md:-translate-y-4' : 'border border-border/50'}`}>
                      {pkg.is_popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                          Most Popular
                        </div>
                      )}
                      
                      <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                      <div className="mb-6">
                        <span className="text-4xl font-extrabold">${pkg.price}</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
                        {pkg.features.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                             <span className="text-primary shrink-0 mt-0.5">✓</span> 
                             <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button className={`w-full py-3 rounded-md font-medium transition-colors ${pkg.is_popular ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                        Select Package
                      </button>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="text-center py-10 mb-20 bg-muted/30 rounded-2xl border border-border/50">
                  <p className="text-muted-foreground">Loading packages...</p>
              </div>
            )}

            {/* Booking Form Layout */}
            <ScrollReveal delay={0.3}>
              <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-12 shadow-sm">
                 <div className="text-center mb-10">
                   <h2 className="text-3xl font-bold mb-4">Schedule Your Shoot</h2>
                   <p className="text-muted-foreground max-w-xl mx-auto">
                     Fill out the form below to request a time, or give us a call directly. We'll confirm your slot within 2 hours.
                   </p>
                 </div>
                 <BookingForm packages={packages} />
              </div>
            </ScrollReveal>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
