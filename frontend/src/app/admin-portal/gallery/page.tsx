"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit, Loader2, Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function AdminGallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<"add" | "edit" | null>(null);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "interior",
    image_url: "",
    featured: false
  });

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
      } else {
        alert("Failed to delete image.");
      }
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("access_token");
      // 1. Get presigned URL
      const urlRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/get-upload-url/?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { upload_url, public_url } = await urlRes.json();

      // 2. Upload to R2
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (uploadRes.ok) {
        setFormData({ ...formData, image_url: public_url });
      } else {
        throw new Error("Upload to R2 failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image to Cloudflare.");
    } finally {
      setUploading(false);
    }
  };

  const handleApplyEdit = (item: any) => {
    setEditingImage(item);
    setFormData({
      title: item.title,
      category: item.category,
      image_url: item.image_url,
      featured: item.featured || false
    });
    setShowModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const method = showModal === "add" ? "POST" : "PATCH";
      const url = showModal === "add" 
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/${editingImage.id}/`;

      const res = await fetch(url, {
        method: method,
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(null);
        setFormData({ title: "", category: "interior", image_url: "", featured: false });
        fetchGallery();
      } else {
        alert("Failed to save image.");
      }
    } catch (err) {
      console.error("Failed to submit", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground italic">Portfolio<span className="text-primary italic">Gallery</span></h1>
            <p className="text-muted-foreground">Manage the public showcase images on your website.</p>
          </div>
          
          <button 
            onClick={() => {
              setFormData({ title: "", category: "interior", image_url: "", featured: false });
              setShowModal("add");
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-gold active:scale-95"
          >
             <Plus className="w-4 h-4" /> Add Image
          </button>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : images.length > 0 ? (
        <StaggerContainer className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {images.map((item: any) => (
              <StaggerItem key={item.id} className="relative group overflow-hidden rounded-[2rem] border border-primary/20 shadow-gold transition-all hover:shadow-gold-heavy break-inside-avoid bg-card">
                <div className="relative w-full aspect-[4/3]">
                  <Image 
                    src={item.image_url} 
                    alt={item.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="flex justify-between items-end">
                      <div className="min-w-0">
                         <span className="text-white font-black text-[10px] uppercase tracking-widest drop-shadow-md block truncate" title={item.title}>{item.title}</span>
                         <span className="text-primary/90 text-[8px] font-black uppercase tracking-[0.2em]">{item.category}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                         <button 
                           onClick={() => handleApplyEdit(item)}
                           className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all backdrop-blur-md active:scale-90"
                         >
                            <Edit className="w-3.5 h-3.5" />
                         </button>
                         <button 
                            onClick={() => deleteImage(item.id)}
                            className="bg-destructive/60 hover:bg-destructive/80 text-white p-2 rounded-xl transition-all backdrop-blur-md active:scale-90"
                         >
                            <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                   </div>
                </div>
              </StaggerItem>
            ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-24 bg-card border border-primary/10 border-dashed rounded-[2.5rem] shadow-inner">
          <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <ImageIcon className="w-8 h-8 text-primary/40" />
          </div>
          <h3 className="text-xl font-bold mb-2">Portfolio is Empty</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">Upload premium architectural photos to showcase your best work to potential clients.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-gold-heavy border border-primary/20 p-10 md:p-12 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        {showModal === "add" ? <Plus className="w-6 h-6" /> : <Edit className="w-6 h-6" />}
                    </div>
                    <h2 className="text-2xl font-black italic">{showModal === "add" ? "Add New" : "Edit"} <span className="text-primary italic">Image</span></h2>
                </div>
                <button onClick={() => setShowModal(null)} className="p-2 text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Image Title</label>
                    <input 
                      type="text" required
                      className="w-full rounded-2xl border border-primary/10 bg-black/40 px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                      placeholder="e.g. Minimalist Bedroom"
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Asset Category</label>
                    <select 
                      className="w-full rounded-2xl border border-primary/10 bg-black/40 px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all appearance-none"
                      value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="interior">Interior Phography</option>
                      <option value="exterior">Exterior & Landscape</option>
                      <option value="twilight">Twilight / Golden Hour</option>
                      <option value="aerial">Aerial & Drone</option>
                      <option value="commercial">Commercial Space</option>
                    </select>
                  </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex justify-between">
                    Image Source {uploading && <span className="text-primary animate-pulse italic">Uploading to Cloudflare...</span>}
                </label>
                
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input 
                          type="url" required
                          className="w-full rounded-2xl border border-primary/10 bg-black/40 px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-mono"
                          placeholder="https://images.r2.cloudflare.com/..."
                          value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})}
                        />
                    </div>
                    <label className="shrink-0 cursor-pointer group">
                        <div className={`h-[50px] w-[50px] rounded-2xl flex items-center justify-center transition-all ${uploading ? 'bg-primary/20 text-primary animate-spin' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-lg shadow-primary/10 hover:shadow-primary/30'}`}>
                            <Upload className="w-5 h-5" />
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
                
                {formData.image_url && (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-primary/20 shadow-lg group">
                        <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <input 
                  type="checkbox" id="featured"
                  className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary/50"
                  checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})}
                />
                <label htmlFor="featured" className="text-sm font-bold cursor-pointer">Feature this asset on the Home Page</label>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <button 
                    type="button" 
                    onClick={() => setShowModal(null)} 
                    className="px-8 py-4 text-xs font-black uppercase tracking-widest bg-muted text-muted-foreground rounded-2xl hover:bg-muted/80 transition-all active:scale-95"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={submitting || uploading}
                    className="px-8 py-4 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all shadow-gold active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {showModal === "add" ? "Publish to Portfolio" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const ImageIcon = ({ className }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
);
