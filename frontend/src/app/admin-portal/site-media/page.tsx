"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Save, Link as LinkIcon, Image as ImageIcon, Video, Loader2, AlertCircle } from "lucide-react";

interface SiteMedia {
  key: string;
  title: string;
  url: string;
  media_type: "image" | "video";
  description: string;
}

export default function SiteMediaAdminPage() {
  const [mediaItems, setMediaItems] = useState<SiteMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/site-media/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data.results || data);
      }
    } catch (err) {
      console.error("Error fetching site media:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (key: string, newUrl: string) => {
    setMediaItems(items => items.map(item => item.key === key ? { ...item, url: newUrl } : item));
  };

  const saveMedia = async (media: SiteMedia) => {
    try {
      setSavingKey(media.key);
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/site-media/${media.key}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: media.url })
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      // Briefly show success state then re-render
      setTimeout(() => setSavingKey(null), 1000);
      
    } catch (err) {
      console.error("Failed to update media:", err);
      alert("Failed to update media URL.");
      setSavingKey(null);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Site Media Manager</h1>
        <p className="text-muted-foreground">
          Update the images and videos displayed across the website. 
          Changes are live instantly. Use absolute URLs (e.g., https://...) for external files or relative paths (e.g., /team/agency.png) for local public files.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {mediaItems.map((item) => (
          <div key={item.key} className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm flex flex-col group transition-all hover:border-primary/40 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/40 relative">
            <div className="h-48 bg-muted border-b border-border/50 relative flex items-center justify-center overflow-hidden">
              {item.media_type === "video" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                  <Video className="w-10 h-10 mb-2 opacity-50" />
                  <span className="text-sm opacity-80 break-all">{item.url}</span>
                </div>
              ) : (
                <Image 
                  src={item.url.startsWith('http') || item.url.startsWith('/') ? item.url : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80"}
                  alt={item.title} 
                  fill 
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                  unoptimized={item.url.startsWith('http')}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2">
                {item.media_type === "video" ? <Video className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-primary" />}
                <h3 className="font-semibold truncate">{item.title}</h3>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 font-mono text-xs opacity-70">
                key: {item.key}
              </p>
              
              <div className="space-y-4 flex-1 flex flex-col justify-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Media URL
                  </label>
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => handleUrlChange(item.key, e.target.value)}
                    className="w-full p-2.5 bg-background border border-input rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button
                  onClick={() => saveMedia(item)}
                  disabled={savingKey === item.key}
                  className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all rounded-md py-2.5 font-medium disabled:opacity-50"
                >
                  {savingKey === item.key ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                     <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {mediaItems.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
             <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
             <h3 className="text-lg font-medium text-foreground">No Site Media Found</h3>
             <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
               You need to run the migrations and seed script for the database to populate these items.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
