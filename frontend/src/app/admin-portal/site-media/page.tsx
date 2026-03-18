"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Save, Link as LinkIcon, Image as ImageIcon, Video, Loader2, AlertCircle, Upload, CheckCircle2, X } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

interface SiteMedia {
  key: string;
  title: string;
  url: string;
  url_before?: string;
  media_type: "image" | "video";
  description: string;
}

export default function SiteMediaAdminPage() {
  const [mediaItems, setMediaItems] = useState<SiteMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

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

  const handleUrlChange = (key: string, newUrl: string, field: 'url' | 'url_before' = 'url') => {
    setMediaItems(items => items.map(item => {
      if (item.key === key) {
        if (field === 'url_before') {
           return { ...item, url_before: newUrl };
        }
        // Auto-detect type ONLY for the main URL
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(newUrl) || newUrl.includes('video');
        return { ...item, url: newUrl, media_type: isVideo ? "video" : "image" };
      }
      return item;
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string, field: 'url' | 'url_before' = 'url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKey(`${key}_${field}`);
    try {
      const token = localStorage.getItem("access_token");
      
      // 1. Get presigned URL (using site-media endpoint)
      const urlRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/site-media/get-upload-url/?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!urlRes.ok) {
        const errorText = await urlRes.text();
        console.error("Failed to get upload URL. Status:", urlRes.status, "Body:", errorText);
        throw new Error(`Failed to get upload URL: ${urlRes.status}`);
      }
      const { upload_url, public_url } = await urlRes.json();

      // 2. Upload to R2
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (uploadRes.ok) {
        // Auto-detect type from file type or name
        const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(file.name);
        setMediaItems(items => items.map(item => 
          item.key === key ? { 
            ...item, 
            [field]: public_url, 
            media_type: field === 'url' ? (isVideo ? "video" : "image") : item.media_type 
          } : item
        ));
      } else {
        const errorText = await uploadRes.text();
        console.error("R2 Upload failed:", errorText);
        throw new Error("Upload to R2 failed");
      }
    } catch (err: any) {
      console.error("Upload error details:", err);
      setNotification({ message: `Failed to upload media: ${err.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setUploadingKey(null);
    }
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
        body: JSON.stringify({ 
          url: media.url,
          url_before: media.url_before,
          media_type: media.media_type
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to save");
      }
      
      // Success feedback
      setNotification({ message: "Changes applied successfully!", type: 'success' });
      setTimeout(() => {
        setSavingKey(null);
        setNotification({ message: '', type: null });
      }, 3000);
      
    } catch (err: any) {
      console.error("Failed to update media:", err);
      setNotification({ message: `Failed to update media: ${err.message || 'Unknown error'}`, type: 'error' });
      setSavingKey(null);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <ScrollReveal>
        <div className="mb-8">
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight italic">Site <span className="text-primary italic">Media Manager</span></h1>
            <p className="text-muted-foreground max-w-2xl">
              Control the primary visual elements of your website. Update hero backgrounds, feature videos, and branding assets directly from your computer.
            </p>
        </div>
      </ScrollReveal>

      {/* Notification Toast */}
      {notification.type && (
        <div className={`fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right duration-300`}>
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-gold-heavy backdrop-blur-xl border ${
            notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
            : 'bg-destructive/10 border-destructive/50 text-destructive'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-bold">{notification.message}</p>
            <button 
              onClick={() => setNotification({ message: '', type: null })}
              className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <StaggerContainer className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {mediaItems.map((item) => (
          <StaggerItem key={item.key}>
            <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] overflow-hidden shadow-gold flex flex-col group transition-all hover:shadow-gold-heavy focus-within:shadow-gold-heavy relative h-full">
              <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden border-b border-primary/20">
                {item.media_type === "video" ? (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <video 
                      src={item.url} 
                      className="w-full h-full object-cover opacity-60"
                      muted
                      loop
                      playsInline
                      onMouseOver={e => e.currentTarget.play()}
                      onMouseOut={e => e.currentTarget.pause()}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center pointer-events-none">
                      <Video className="w-12 h-12 mb-3 text-primary opacity-80" />
                      <span className="text-[10px] font-mono opacity-60 break-all bg-black/40 p-2 rounded-lg max-w-[80%]">{item.url}</span>
                    </div>
                  </div>
                ) : (
                  <Image 
                    src={item.url.startsWith('http') || item.url.startsWith('/') ? item.url : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80"}
                    alt={item.title} 
                    fill 
                    className="object-cover group-hover:scale-[1.05] transition-transform duration-1000" 
                    unoptimized={item.url.startsWith('http')}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20"></div>
                
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                        {item.media_type === "video" ? <Video className="w-3 h-3 text-primary" /> : <ImageIcon className="w-3 h-3 text-primary" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.media_type}</span>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 z-10">
                  <h3 className="text-xl font-black text-white italic drop-shadow-lg">{item.title}</h3>
                  <p className="text-xs text-white/60 line-clamp-1">{item.description}</p>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col space-y-6">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    <span>Registry Key</span>
                    <span className="font-mono text-primary/80">{item.key}</span>
                </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                         Media Type
                       </label>
                       <select 
                         value={item.media_type}
                         onChange={(e) => setMediaItems(items => items.map(i => i.key === item.key ? { ...i, media_type: e.target.value as any } : i))}
                         className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground appearance-none cursor-pointer"
                       >
                         <option value="image">Image Asset</option>
                         <option value="video">Video Stream</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex justify-between">
                        Media Source URL
                        {uploadingKey === `${item.key}_url` && <span className="text-primary animate-pulse">Uploading...</span>}
                      </label>
                      
                      <div className="flex gap-3">
                          <div className="flex-1">
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) => handleUrlChange(item.key, e.target.value, 'url')}
                                className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl font-mono text-xs focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground"
                                placeholder="Main media URL..."
                              />
                          </div>
                          <label className="shrink-0 cursor-pointer group">
                              <div className={`h-[42px] w-[42px] rounded-xl flex items-center justify-center transition-all ${uploadingKey === `${item.key}_url` ? 'bg-primary/20 text-primary animate-spin' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                                  <Upload className="w-4 h-4" />
                              </div>
                              <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, item.key, 'url')} disabled={uploadingKey === `${item.key}_url`} />
                          </label>
                      </div>
                    </div>

                    {/* Secondary Image for Comparison */}
                    {(item.key.includes('services_') && item.media_type === 'image' && item.key !== 'services_drone') && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex justify-between">
                          Before Image (Comparison)
                          {uploadingKey === `${item.key}_url_before` && <span className="text-primary animate-pulse">Uploading...</span>}
                        </label>
                        
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                  type="text"
                                  value={item.url_before || ''}
                                  onChange={(e) => handleUrlChange(item.key, e.target.value, 'url_before')}
                                  className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl font-mono text-xs focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground"
                                  placeholder="Secondary (Before) image URL..."
                                />
                            </div>
                            <label className="shrink-0 cursor-pointer group">
                                <div className={`h-[42px] w-[42px] rounded-xl flex items-center justify-center transition-all ${uploadingKey === `${item.key}_url_before` ? 'bg-primary/20 text-primary animate-spin' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                                    <Upload className="w-4 h-4" />
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, item.key, 'url_before')} disabled={uploadingKey === `${item.key}_url_before`} />
                            </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => saveMedia(item)}
                    disabled={savingKey === item.key}
                    className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all rounded-xl py-4 font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-primary/5"
                  >
                    {savingKey === item.key ? (
                       <><Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...</>
                    ) : (
                       <><CheckCircle2 className="w-4 h-4" /> Apply to Site</>
                    )}
                  </button>
                </div>
              </div>
          </StaggerItem>
        ))}
        
        {mediaItems.length === 0 && !loading && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-primary/10 rounded-[2.5rem] bg-card/50">
             <AlertCircle className="w-16 h-16 text-primary/20 mx-auto mb-4" />
             <h3 className="text-2xl font-black text-foreground mb-2 italic">Null Media Registry</h3>
             <p className="text-muted-foreground max-w-sm mx-auto text-sm">
               The site media registry is currently empty. Initialize the database to begin managing global visual assets.
             </p>
          </div>
        )}
      </StaggerContainer>
    </div>
  );
}
