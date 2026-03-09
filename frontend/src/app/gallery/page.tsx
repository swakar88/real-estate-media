import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import GalleryGrid from "@/components/GalleryGrid";

async function getGalleryImages() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch gallery images:", error);
    return [];
  }
}

export default async function Gallery() {
  const images = await getGalleryImages();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-12">
              <ScrollReveal>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center">Portfolio Gallery</h1>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                  Discover our previous work across real estate, commercial marketing, and portrait photography.
                </p>
              </ScrollReveal>
            </div>
            
            <GalleryGrid initialImages={images} />

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
