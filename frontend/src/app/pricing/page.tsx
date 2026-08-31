import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

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

async function getAddons() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/addons/`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch add-ons:", error);
    return [];
  }
}

export default async function Pricing() {
  const [packages, addons] = await Promise.all([getPackages(), getAddons()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-10 md:py-14 bg-card/30 border-b border-border/40">
          <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
            <ScrollReveal>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Pricing & Packages</h1>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Transparent pricing for every listing — no login required to browse. Pick a package and book when you&apos;re ready.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            {packages && packages.length > 0 ? (
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {packages.map((pkg: any) => (
                  <StaggerItem key={pkg.id}>
                    <div className={`flex flex-col rounded-3xl bg-card p-6 shadow-gold transition-all h-full relative ${pkg.is_popular ? 'border-2 border-primary shadow-gold-heavy transform lg:-translate-y-4' : 'border border-primary/10'}`}>
                      {pkg.is_popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                          Most Popular
                        </div>
                      )}

                      <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-extrabold">${pkg.price}</span>
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                      )}
                      <ul className="space-y-3 mb-6 flex-1 text-sm text-muted-foreground">
                        {pkg.features?.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary shrink-0 mt-0.5">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/book?package=${pkg.id}`}
                        className={`w-full text-center py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${pkg.is_popular ? 'bg-primary text-primary-foreground shadow-gold hover:shadow-gold-heavy' : 'bg-muted text-foreground hover:bg-muted/80'} active:scale-95`}
                      >
                        Book This Package
                      </Link>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-2xl border border-border/50">
                <p className="text-muted-foreground">Packages are being updated — check back shortly, or contact us directly for a custom quote.</p>
              </div>
            )}

            {addons && addons.length > 0 && (
              <ScrollReveal delay={0.2}>
                <div className="mt-16 max-w-5xl mx-auto rounded-[2.5rem] border border-primary/20 bg-card p-8 md:p-12 shadow-gold">
                  <h2 className="text-2xl font-bold mb-1 text-center">Add-Ins</h2>
                  <p className="text-sm text-muted-foreground mb-8 text-center">Available inside any package during booking.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {addons.map((addon: any) => (
                      <div key={addon.id} className="rounded-2xl border border-border/50 bg-background p-5">
                        <h3 className="font-semibold mb-1">{addon.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{addon.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-extrabold">+${parseFloat(addon.price).toFixed(0)}</span>
                          {addon.turnaround && <span className="text-xs text-muted-foreground">{addon.turnaround}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            <ScrollReveal delay={0.3}>
              <div className="mt-16 max-w-5xl mx-auto text-center rounded-[2.5rem] border border-primary/20 bg-card p-8 md:p-12 shadow-gold">
                <h2 className="text-2xl font-bold mb-4">Need something custom?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                  Commercial properties, large square footage, or multi-property portfolios — request a custom quote and we&apos;ll build a package around your needs.
                </p>
                <Link href="/book" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-foreground shadow-gold hover:shadow-gold-heavy transition-all hover:bg-primary/90 hover:scale-105">
                  Request a Custom Quote
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
