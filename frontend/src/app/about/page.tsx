"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import { Users } from "lucide-react";

export default function About() {
  const [team, setTeam] = useState<any[]>([]);
  const [media, setMedia] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const [teamRes, mediaRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/public/`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/site-media/?format=dict`)
        ]);

        if (teamRes.ok) {
          setTeam(await teamRes.json());
        }
        if (mediaRes.ok) {
          setMedia(await mediaRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch about data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 bg-background overflow-hidden relative">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
          <div className="container mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-16 items-center">
             <ScrollReveal direction="left" className="space-y-6">
               <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">About KC Real Estate Media</h1>
               <p className="text-lg text-muted-foreground leading-relaxed">
                 KC Real Estate Media is a digital marketing agency specializing in virtual media solutions for real estate professionals and small business owners in Kansas City.
               </p>
               <p className="text-muted-foreground leading-relaxed">
                 A partnership consisting of a current real estate professional, marketing consultant, and general contractor, KC Real Estate Media aims to enhance the real estate marketing structure by introducing 360 virtual reality and videography concepts.
               </p>
               <div className="flex items-center gap-4 pt-4">
                 <div className="flex items-center gap-3 bg-white border border-border/40 rounded-2xl px-4 py-3 shadow-sm">
                   <img
                     src="https://www.gstatic.com/images/branding/product/1x/google_maps_48dp.png"
                     alt="Google Maps"
                     className="h-8 w-8 object-contain"
                   />
                   <div>
                     <h4 className="font-semibold text-sm text-foreground leading-tight">Google Trusted Photographer</h4>
                     <p className="text-xs text-muted-foreground">Certified Virtual Walk-throughs</p>
                   </div>
                 </div>
               </div>
             </ScrollReveal>
             <ScrollReveal direction="right" delay={0.2} className="relative">
                <div className="aspect-square bg-muted rounded-2xl border border-border/50 rotate-3 hover:rotate-0 [transition:transform_500ms_ease] overflow-hidden shadow-2xl relative">
                   <Image src={media.about_agency_photo || "/team/agency.png"} alt="KC Real Estate Media Team" fill className="object-cover" />
                </div>
             </ScrollReveal>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-card/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold mb-12 text-center">Meet The Team</h2>
            
            {loading ? (
              <div className="py-20 flex justify-center">
                 <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : team.length > 0 ? (
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {team.map((member, i) => {
                  // Fallback to local images based on first name if they exist
                  const firstNameLower = (member.first_name || member.user_name || '').split(' ')[0].toLowerCase();
                  const localFallback = ['aarav', 'neha', 'rohan', 'priya'].includes(firstNameLower) 
                    ? `/team/${firstNameLower}.png` 
                    : null;
                  
                  const imgSrc = member.profile_image_url || localFallback;

                  return (
                    <StaggerItem key={i} className="group">
                      <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted mb-4 relative transition-all duration-500 border border-border/20 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 flex items-center justify-center">
                        {imgSrc ? (
                          <img src={imgSrc} alt={member.user_name || member.first_name} className="object-cover w-full h-full" />
                        ) : (
                          <Users className="w-20 h-20 text-muted-foreground/30 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg">{(member.user_name || member.first_name || `Team Member #${member.id}`).split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</h3>
                      <p className="text-sm text-primary">{member.role || 'Photographer'}</p>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            ) : (
               <div className="text-center text-muted-foreground py-12">
                 Our team is growing. Check back soon!
               </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
