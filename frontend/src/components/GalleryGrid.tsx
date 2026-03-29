"use client";

import { useState } from "react";
import Image from "next/image";
import { StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function GalleryGrid({ initialImages }: { initialImages: any[] }) {
  const [activeTab, setActiveTab] = useState("All");

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // Extract unique categories from the images array to dynamically build the filter buttons
  const categories = ["All", ...Array.from(new Set(initialImages.map((img) => img.category)))];

  // Filter images based on selected tab
  const filteredImages = activeTab === "All" 
    ? initialImages 
    : initialImages.filter((img) => img.category === activeTab);

  return (
    <>
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {categories.map((category: any) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === category
                ? "bg-primary text-primary-foreground"
                : "border border-border/50 hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {capitalize(category)}
          </button>
        ))}
      </div>

      {filteredImages.length > 0 ? (
        <StaggerContainer key={activeTab} className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredImages.map((item: any, i: number) => {
            const heights = ['h-64', 'h-80', 'h-96'];
            const h = heights[i % heights.length];
            
            return (
              <StaggerItem key={item.id} className={`rounded-xl overflow-hidden bg-muted relative group border border-border/20 ${h}`}>
                <Image 
                  src={item.image_url} 
                  alt={item.title} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 text-left">
                  <span className="text-white font-medium drop-shadow-md block">{item.title}</span>
                  <span className="text-primary/80 text-xs font-semibold uppercase tracking-wider">{capitalize(item.category)}</span>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border/50 animate-in fade-in zoom-in duration-500">
          <p className="text-muted-foreground">No {activeTab.toLowerCase()} images available in the portfolio yet.</p>
        </div>
      )}
    </>
  );
}
