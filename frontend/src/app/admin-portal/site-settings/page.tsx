"use client";

import { useEffect, useState } from "react";
import { Save, Upload, Info, Globe, Image as ImageIcon, Sparkles, Layout, Receipt, MousePointer2 } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import CustomModal from "@/components/CustomModal";

export default function SiteSettings() {
  const [settings, setSettings] = useState({
    site_name: "KC Real Estate Media",
    logo_url: "",
    favicon_url: "",
    invoice_logo_url: "",
    sidebar_logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/settings/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setSettings(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/settings/update_global/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setModalConfig({
          isOpen: true,
          title: "Success",
          message: "Global settings have been updated successfully.",
          type: "success"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string = "logo") => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append(type, file);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/settings/update_global/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setModalConfig({
          isOpen: true,
          title: "Asset Updated",
          message: `The ${type.replace('_', ' ')} has been uploaded and updated successfully.`,
          type: "success"
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
         <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
            <p className="text-muted-foreground">Manage your brand identity and global platform configurations.</p>
          </div>
        </div>
      </ScrollReveal>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Branding Section */}
            <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] p-8 shadow-gold space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Globe className="w-5 h-5" />
                <h2 className="text-sm font-black uppercase tracking-widest">General Branding</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider ml-1 text-muted-foreground">Site Name</label>
                <input 
                  type="text" 
                  value={settings.site_name}
                  onChange={e => setSettings({...settings, site_name: e.target.value})}
                  className="w-full bg-black/40 border border-primary/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner"
                  placeholder="e.g. KC Real Estate Media"
                />
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This name appears in the browser title, email signatures, and portal headers across the entire platform.
                </p>
              </div>
            </div>

            {/* Logo Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Logo */}
                <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] p-8 shadow-gold space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                        <ImageIcon className="w-5 h-5" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Platform Logo</h2>
                    </div>

                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="h-32 w-full rounded-[2rem] bg-black/40 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden relative group">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Site Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-primary/20" />
                            )}
                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="w-6 h-6 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, "logo")} />
                            </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Main branding logo used on login and public pages.</p>
                    </div>
                </div>

                {/* Sidebar Logo */}
                <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] p-8 shadow-gold space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                        <Layout className="w-5 h-5" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Sidebar Logo</h2>
                    </div>

                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="h-32 w-full rounded-[2rem] bg-black/40 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden relative group">
                            {settings.sidebar_logo_url ? (
                                <img src={settings.sidebar_logo_url} alt="Sidebar Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <Layout className="w-8 h-8 text-primary/20" />
                            )}
                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="w-6 h-6 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, "sidebar_logo")} />
                            </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Condensed logo for navigation sidebars across portals.</p>
                    </div>
                </div>

                {/* Invoice Logo */}
                <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] p-8 shadow-gold space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                        <Receipt className="w-5 h-5" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Invoice Logo</h2>
                    </div>

                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="h-32 w-full rounded-[2rem] bg-black/40 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden relative group">
                            {settings.invoice_logo_url ? (
                                <img src={settings.invoice_logo_url} alt="Invoice Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <Receipt className="w-8 h-8 text-primary/20" />
                            )}
                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="w-6 h-6 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, "invoice_logo")} />
                            </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">High-resolution logo for PDF and email invoices.</p>
                    </div>
                </div>

                {/* Browser Favicon */}
                <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] p-8 shadow-gold space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                        <MousePointer2 className="w-5 h-5" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Browser Favicon</h2>
                    </div>

                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="h-32 w-full rounded-[2rem] bg-black/40 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden relative group">
                            {settings.favicon_url ? (
                                <img src={settings.favicon_url} alt="Favicon" className="w-full h-full object-contain p-8" />
                            ) : (
                                <MousePointer2 className="w-8 h-8 text-primary/20" />
                            )}
                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="w-6 h-6 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, "favicon")} />
                            </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Small icon visible in browser tabs (Recommended: 32x32px).</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl p-6 shadow-gold space-y-6">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest">Global Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-bold">Just now</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Config Type</span>
                  <span className="font-bold uppercase tracking-tighter text-primary">Master Global</span>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-gold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Save All Settings</span>}
              </button>
            </div>
          </div>
        </div>
      </form>

      <CustomModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        showCancel={false}
        confirmText="Got it"
      />
    </div>
  );
}
