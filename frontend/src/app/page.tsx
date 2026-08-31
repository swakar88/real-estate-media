import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

async function getSiteMedia() {
  try {
    // Revalidate every minute or use 'no-store' if we want instant updates
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/site-media/?view=dict`, { cache: 'no-store' });
    if (!res.ok) return {};
    return res.json();
  } catch (err) {
    return {};
  }
}

async function getPackages() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/packages/`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    return [];
  }
}

export default async function Home() {
  const [media, packages] = await Promise.all([getSiteMedia(), getPackages()]);
  const startingPrice = packages && packages.length > 0
    ? Math.min(...packages.map((p: any) => parseFloat(p.price)))
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="py-6 md:py-10 bg-background overflow-hidden relative">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
          <div className="container mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 lg:gap-16 items-center relative">
            <ScrollReveal direction="left">
              <div className="inline-block py-1 px-3 mb-6 rounded-full bg-primary/20 text-gradient-text border border-primary/30 text-sm font-medium tracking-wide">
                ELEVATE YOUR LISTINGS
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
                Professional Real Estate{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gradient-text to-gradient-text">
                  Photography & Media in Kansas City
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed font-light">
                Premium 4K video, HDR photography, and 360-degree virtual tours designed to capture attention and drive conversions.
              </p>
              {startingPrice !== null && (
                <Link href="/pricing" className="inline-flex items-center gap-1 text-gradient-text font-medium hover:underline mb-8">
                  Packages from ${startingPrice} <span aria-hidden>→</span>
                </Link>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-foreground shadow-gold hover:shadow-gold-heavy transition-all hover:bg-primary/90 hover:scale-105">
                  Book a Shoot Now
                </Link>
                <Link href="/gallery" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background/50 backdrop-blur px-8 font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:scale-105">
                  View Our Portfolio
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.2} className="relative">
              <div className="aspect-[16/9] bg-muted rounded-2xl border border-border/50 rotate-3 hover:rotate-0 [transition:transform_500ms_ease] overflow-hidden shadow-2xl relative">
                {media.home_hero_bg_type === 'video' ? (
                   <video
                      src={media.home_hero_bg}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                   />
                ) : (
                   <Image
                      src={media.home_hero_bg || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"}
                      alt="Real estate photography by KC Real Estate Media"
                      fill
                      className="object-cover"
                      priority
                   />
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* SERVICES GRID */}
        <section className="py-8 md:py-10 bg-card/50">
          <div className="container mx-auto px-4 md:px-8">
            <ScrollReveal>
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">What We Do</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Specialized virtual media solutions tailored for your industry.</p>
              </div>
            </ScrollReveal>
            
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Service 1 */}
              <StaggerItem>
                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-1 hover:border-primary/50 transition-colors duration-300 h-full">
                  <div className="h-48 rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                     <Image src={media.home_service_1 || "https://images.unsplash.com/photo-1600607687931-ceeb66d11362?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt="Real Estate Media" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-80"></div>
                     <h3 className="absolute bottom-4 left-4 z-20 text-xl font-bold">Real Estate Media</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-muted-foreground text-sm mb-4">Interactive properties marketing. 360 tours, aerial shorts, and professional HDR photos.</p>
                    <Link href="/services" className="text-primary font-medium text-sm hover:underline">Explore Services →</Link>
                  </div>
                </div>
              </StaggerItem>

              {/* Service 2 */}
              <StaggerItem>
                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-1 hover:border-primary/50 transition-colors duration-300 h-full">
                  <div className="h-48 rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                     <Image src={media.home_service_2 || "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt="Business Marketing" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-80"></div>
                     <h3 className="absolute bottom-4 left-4 z-20 text-xl font-bold">Business Marketing</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-muted-foreground text-sm mb-4">Establish a strong digital presence with 4K video concepts and Google Maps virtual tours.</p>
                    <Link href="/services" className="text-primary font-medium text-sm hover:underline">Learn More →</Link>
                  </div>
                </div>
              </StaggerItem>

              {/* Service 3 */}
              <StaggerItem>
                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-1 hover:border-primary/50 transition-colors duration-300 h-full">
                  <div className="h-48 rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                     <Image src={media.home_service_3 || "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt="Portrait & Aerial" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-80"></div>
                     <h3 className="absolute bottom-4 left-4 z-20 text-xl font-bold">Portrait & Aerial</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-muted-foreground text-sm mb-4">Professional headshots, team photography, and sweeping drone captures for events.</p>
                    <Link href="/gallery" className="text-primary font-medium text-sm hover:underline">View Gallery →</Link>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
