import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import ImageComparison from "@/components/ImageComparison";
import { Video } from "lucide-react";

async function getSiteMedia() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/site-media/?view=dict`, { cache: 'no-store' });
    if (!res.ok) return {};
    return res.json();
  } catch (err) {
    return {};
  }
}

export default async function Services() {
  const media = await getSiteMedia();
  
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
        <section id="editing" className="py-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Individual Enhancements</h2>
              <p className="text-muted-foreground">Specialized photo editing to correct, enhance, and perfect your shots.</p>
            </div>
            
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Day to Dusk */}
              <StaggerItem>
                <div className="rounded-[2.5rem] border border-primary/20 bg-card overflow-hidden h-full shadow-gold hover:shadow-gold-heavy transition-all group">
                  <div className="h-64 bg-black relative overflow-hidden">
                    {media.services_dusk_before ? (
                      <ImageComparison 
                        beforeImage={media.services_dusk_before}
                        afterImage={media.services_dusk}
                      />
                    ) : (
                      <Image 
                        src={media.services_dusk || "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1474&auto=format&fit=crop"} 
                        alt="Premium Twilight Conversion" 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-6 left-6 pointer-events-none">
                        <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em] block mb-1">Architectural</span>
                        <h3 className="text-2xl font-black text-white italic">Twilight <span className="text-primary italic">Conversion</span></h3>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Transform standard daytime exterior photos into stunning, high-end twilight imagery. Guaranteed to capture attention instantly on premium listings.</p>
                    <Link href="/add-on-services" className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:gap-4 transition-all">
                        View Pricing <span>→</span>
                    </Link>
                  </div>
                </div>
              </StaggerItem>

              {/* Declutter */}
              <StaggerItem>
                <div className="rounded-[2.5rem] border border-primary/20 bg-card overflow-hidden h-full shadow-gold hover:shadow-gold-heavy transition-all group">
                  <div className="h-64 bg-black relative overflow-hidden">
                    {media.services_staging_before ? (
                      <ImageComparison 
                        beforeImage={media.services_staging_before}
                        afterImage={media.services_staging}
                      />
                    ) : (
                      <Image 
                        src={media.services_staging || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1470&auto=format&fit=crop"} 
                        alt="Premium Virtual Decluttering" 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-6 left-6 pointer-events-none">
                        <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em] block mb-1">Interior Optimization</span>
                        <h3 className="text-2xl font-black text-white italic">Virtual <span className="text-primary italic">De-clutter</span></h3>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Digitally remove unwanted furniture, vehicles, or personal items. We present a pristine, showroom-quality space that invites potential buyers in.</p>
                    <Link href="/add-on-services" className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:gap-4 transition-all">
                        View Pricing <span>→</span>
                    </Link>
                  </div>
                </div>
              </StaggerItem>

              {/* Green Grass */}
              <StaggerItem>
                <div className="rounded-[2.5rem] border border-primary/20 bg-card overflow-hidden h-full shadow-gold hover:shadow-gold-heavy transition-all group">
                  <div className="h-64 bg-black relative overflow-hidden">
                    {media.services_grass_before ? (
                      <ImageComparison
                        beforeImage={media.services_grass_before}
                        afterImage={media.services_grass}
                      />
                    ) : (
                      <>
                        <Image
                          src={media.services_grass || "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80"}
                          alt="Premium Curb Appeal Enhancement"
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                      </>
                    )}
                    {!media.services_grass_before && (
                      <div className="absolute bottom-6 left-6 pointer-events-none">
                        <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em] block mb-1">Curb Appeal</span>
                        <h3 className="text-2xl font-black text-white italic">Lush Grass <span className="text-primary italic">Edit</span></h3>
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Enhance patchy or dormant lawns to a vibrant, lush green. Perfect for maximizing first impressions and property value throughout the year.</p>
                    <Link href="/add-on-services" className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:gap-4 transition-all">
                        View Pricing <span>→</span>
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Drone & Video Block */}
        <section id="drone" className="py-20 bg-background border-t border-border/40">
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
                    {media.services_drone_type === 'video' ? (
                      <video 
                        src={media.services_drone} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <Image 
                        src={media.services_drone || "https://images.unsplash.com/photo-1499310392581-322cec0355a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
                        alt="Cinematic Drone Aerial" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    )}
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
