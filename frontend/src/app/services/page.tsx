import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function Services() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="py-20 md:py-32 bg-card/30 border-b border-border/40">
          <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
            <ScrollReveal>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Our Services</h1>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Elevate your property presentations with our industry-leading virtual media solutions. We specialize in bringing spaces to life.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Real Estate Editing Services */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Individual Enhancements</h2>
              <p className="text-muted-foreground">Specialized photo editing to correct, enhance, and perfect your shots.</p>
            </div>
            
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Day to Dusk */}
              <StaggerItem>
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden h-full">
                  <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <Image src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Day to Dusk real estate editing" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent z-10"></div>
                    <span className="z-20 font-semibold text-lg text-rose-300">Twilight Conversion</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">Day-To-Dusk</h3>
                    <p className="text-sm text-muted-foreground mb-4">Transform standard daytime exterior photos into stunning twilight imagery. Captures attention instantly on MLS.</p>
                    <Link href="/book" className="text-primary text-sm hover:underline font-medium">Add to Package →</Link>
                  </div>
                </div>
              </StaggerItem>

              {/* Declutter */}
              <StaggerItem>
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden h-full">
                  <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <Image src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Decluttered room editing" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent z-10"></div>
                    <span className="z-20 font-semibold text-lg text-rose-300">Virtual Staging</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">Enhanced De-clutter</h3>
                    <p className="text-sm text-muted-foreground mb-4">Digitally remove unwanted furniture, vehicles, or personal items from rooms to present a clean, empty space.</p>
                    <Link href="/book" className="text-primary text-sm hover:underline font-medium">Add to Package →</Link>
                  </div>
                </div>
              </StaggerItem>

              {/* Green Grass */}
              <StaggerItem>
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden h-full">
                  <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <Image src="https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Lush green grass editing" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent z-10"></div>
                    <span className="z-20 font-semibold text-lg text-rose-300">Green Grass Edit</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">Green Grass Edit</h3>
                    <p className="text-sm text-muted-foreground mb-4">Enhance brown, patchy, or dormant lawns to a vibrant, lush green to maximize curb appeal.</p>
                    <Link href="/book" className="text-primary text-sm hover:underline font-medium">Add to Package →</Link>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Drone & Video Block */}
        <section className="py-20 bg-background border-t border-border/40">
           <div className="container mx-auto px-4 md:px-8">
             <div className="flex flex-col md:flex-row gap-12 items-center overflow-hidden">
               <ScrollReveal direction="left" className="flex-1 space-y-6">
                 <h2 className="text-3xl font-bold">Drone Photography & Video</h2>
                 <p className="text-muted-foreground leading-relaxed">
                   Capture the full scope of your property or business from above. Our licensed pilots provide striking aerial views that show the scale, location, and true magnitude of your space.
                 </p>
                 <ul className="space-y-3">
                   <li className="flex items-center gap-3">
                     <span className="text-primary">✓</span> 4K Aerial Video Flythroughs
                   </li>
                   <li className="flex items-center gap-3">
                     <span className="text-primary">✓</span> High-Resolution Drone Photography
                   </li>
                   <li className="flex items-center gap-3">
                     <span className="text-primary">✓</span> Property Line Outlines & Graphic Overlays
                   </li>
                 </ul>
                 <div className="pt-4">
                   <Link href="/book" className="inline-flex h-10 items-center justify-center rounded-md bg-primary/10 px-8 text-sm font-medium text-primary shadow transition-colors hover:bg-primary hover:text-primary-foreground">
                     Inquire About Aerials
                   </Link>
                 </div>
               </ScrollReveal>
               <ScrollReveal direction="right" delay={0.2} className="flex-1 w-full relative">
                 <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border/50 flex items-center justify-center relative group shadow-2xl">
                    <Image src="https://images.unsplash.com/photo-1628611225249-6c4c9258dcc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Cinematic Drone Aerial" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                       <div className="w-16 h-16 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-primary group-hover:scale-110 transition-transform cursor-pointer shadow-lg border border-primary/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                             <path d="M8 5v14l11-7z" />
                          </svg>
                       </div>
                    </div>
                 </div>
               </ScrollReveal>
             </div>
           </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
