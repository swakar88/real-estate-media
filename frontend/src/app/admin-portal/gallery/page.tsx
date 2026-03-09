"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function AdminGallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/`, { cache: 'no-store' });
      if (res.ok) {
        setImages(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch gallery", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (id: number) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/${id}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok || res.status === 204) {
        setImages(images.filter(img => img.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio Gallery</h1>
            <p className="text-muted-foreground">Manage the public showcase images on your website.</p>
          </div>
          
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
             <Plus className="w-4 h-4" /> Add Image
          </button>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : images.length > 0 ? (
        <StaggerContainer className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
           {images.map((item: any) => (
             <StaggerItem key={item.id} className="relative group overflow-hidden rounded-xl border border-border/50 break-inside-avoid">
               <div className="relative w-full aspect-[4/3]">
                 <Image 
                   src={item.image_url} 
                   alt={item.title} 
                   fill 
                   className="object-cover transition-transform duration-500 group-hover:scale-105" 
                   sizes="(max-width: 768px) 50vw, 25vw"
                 />
               </div>
               
               <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex justify-between items-end">
                     <div>
                        <span className="text-white font-bold text-sm drop-shadow-md block truncate w-32" title={item.title}>{item.title}</span>
                        <span className="text-primary/90 text-[10px] font-bold uppercase tracking-wider">{item.category}</span>
                     </div>
                     <div className="flex gap-2">
                        <button className="bg-background/80 hover:bg-background text-foreground p-1.5 rounded-md transition-colors backdrop-blur-sm">
                           <Edit className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => deleteImage(item.id)}
                           className="bg-destructive/80 hover:bg-destructive text-white p-1.5 rounded-md transition-colors backdrop-blur-sm"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
             </StaggerItem>
           ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-20 bg-card border border-border/50 border-dashed rounded-xl">
          <h3 className="text-lg font-medium mb-1">No Gallery Images</h3>
          <p className="text-muted-foreground text-sm">Upload high-res photos to display on the public portfolio page.</p>
        </div>
      )}
    </div>
  );
}
