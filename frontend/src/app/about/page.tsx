import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function About() {
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
                 <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xs">Logo</div>
                 <div>
                   <h4 className="font-semibold text-primary">Google Trusted Photographer</h4>
                   <p className="text-sm text-muted-foreground">Certified Virtual Walk-throughs</p>
                 </div>
               </div>
             </ScrollReveal>
             <ScrollReveal direction="right" delay={0.2} className="relative">
                <div className="aspect-square bg-muted rounded-2xl border border-border/50 rotate-3 transition-transform hover:rotate-0 duration-500 overflow-hidden shadow-2xl relative">
                   <Image src="/team/agency.png" alt="KC Real Estate Media Team" fill className="object-cover" />
                </div>
             </ScrollReveal>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-card/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold mb-12 text-center">Meet The Team</h2>
            
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { name: 'Aarav Patel', role: 'Project Manager', src: '/team/aarav.png' },
                { name: 'Neha Sharma', role: 'Content Manager', src: '/team/neha.png' },
                { name: 'Rohan Desai', role: 'Photographer', src: '/team/rohan.png' },
                { name: 'Priya Singh', role: 'Admin Support', src: '/team/priya.png' }
              ].map((member, i) => (
                <StaggerItem key={i} className="group">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted mb-4 relative transition-all duration-500 border border-border/20 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                     <Image src={member.src} alt={member.name} fill className="object-cover" />
                  </div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
