import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
          {/* Background Element */}
          <div className="absolute inset-0 bg-background z-0">
             <Image 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                alt="Luxury Real Estate Background" 
                fill 
                className="object-cover opacity-40 mix-blend-luminosity brightness-50" 
                priority 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 md:px-8 text-center flex flex-col items-center">
            <ScrollReveal delay={0.1}>
              <div className="inline-block py-1 px-3 mb-6 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium tracking-wide">
                ELEVATE YOUR LISTINGS
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl drop-shadow-sm">
                Immersive Virtual Media <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">
                  For Real Estate & Business
                </span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-light">
                Premium 4K video, HDR photography, and 360-degree virtual tours designed to capture attention and drive conversions.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105">
                  Book a Shoot Now
                </Link>
                <Link href="/gallery" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background/50 backdrop-blur px-8 font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:scale-105">
                  View Our Portfolio
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* SERVICES GRID */}
        <section className="py-24 bg-card/50">
          <div className="container mx-auto px-4 md:px-8">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">What We Do</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Specialized virtual media solutions tailored for your industry.</p>
              </div>
            </ScrollReveal>
            
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Service 1 */}
              <StaggerItem>
                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-1 hover:border-primary/50 transition-colors duration-300 h-full">
                  <div className="h-48 rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                     <Image src="https://images.unsplash.com/photo-1600607687931-ceeb66d11362?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Real Estate Media" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
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
                     <Image src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Business Marketing" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
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
                     <Image src="https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Portrait & Aerial" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
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
