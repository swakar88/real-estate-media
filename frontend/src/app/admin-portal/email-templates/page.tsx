"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  ChevronRight, 
  Save, 
  Info,
  ChevronLeft,
  Settings2,
  Eye,
  X,
  Check,
  RefreshCcw
} from "lucide-react";
import { toast } from "sonner";

interface EmailTemplate {
  slug: string;
  title: string;
  subject: string;
  body: string;
  cc: string;
  bcc: string;
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/email-templates/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setTemplates(results);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/email-templates/${selectedTemplate.slug}/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedTemplate),
      });

      if (response.ok) {
        toast.success("Template saved successfully!");
        fetchTemplates();
      } else {
        toast.error("Failed to save template.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Email Templates</h1>
          <p className="text-slate-500 mt-1">Manage content and subjects for system emails.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
        {/* Template List */}
        <div className="md:col-span-4 bg-card/80 backdrop-blur-sm rounded-[2rem] border border-primary/20 overflow-hidden shadow-gold h-fit">
          <div className="p-6 border-b border-primary/10 bg-primary/5">
            <h2 className="font-black italic text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings2 className="w-4 h-4 text-primary" />
              </div>
              Templates
            </h2>
          </div>
          <div className="divide-y divide-border/50">
            {templates.map((template) => (
              <button
                key={template.slug}
                onClick={() => setSelectedTemplate(template)}
                className={`w-full text-left p-4 transition-all hover:bg-muted/50 flex items-center justify-between group ${
                  selectedTemplate?.slug === template.slug ? "bg-primary/10 border-r-4 border-primary shadow-inner" : ""
                }`}
              >
                <div>
                  <div className={`font-medium transition-colors ${selectedTemplate?.slug === template.slug ? "text-primary" : "text-foreground"}`}>
                    {template.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{template.slug}</div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                  selectedTemplate?.slug === template.slug ? "text-primary" : "text-muted-foreground"
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="md:col-span-8 space-y-6">
          {selectedTemplate ? (
            <div className="bg-card/80 backdrop-blur-sm rounded-[2.5rem] border border-primary/20 overflow-hidden shadow-gold animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-8 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black italic text-xl text-foreground truncate max-w-[200px]">{selectedTemplate.title}</h2>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">Registry: {selectedTemplate.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowPreview(true)}
                    className="bg-card hover:bg-muted text-foreground px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-primary/20 shadow-md"
                  >
                    <Eye className="w-4 h-4 text-primary" />
                    Preview
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-gold hover:shadow-gold-heavy flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Deploying..." : "Update Template"}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-[10px]">CC Address (Optional)</label>
                    <input
                      type="email"
                      value={selectedTemplate.cc || ""}
                      onChange={(e) => setSelectedTemplate({...selectedTemplate, cc: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-primary/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium"
                      placeholder="e.g. admin@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-[10px]">BCC Address (Optional)</label>
                    <input
                      type="email"
                      value={selectedTemplate.bcc || ""}
                      onChange={(e) => setSelectedTemplate({...selectedTemplate, bcc: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-primary/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium"
                      placeholder="e.g. backup@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email Subject</label>
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-primary/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold"
                    placeholder="Subject line..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email Body (Plain Text Recommended)</label>
                  </div>
                  <div className="relative group">
                    <textarea
                      rows={14}
                      value={selectedTemplate.body}
                      onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                      className="w-full px-4 py-4 rounded-2xl bg-muted/20 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-mono text-sm leading-relaxed min-h-[400px]"
                      placeholder="Enter email body..."
                    />
                  </div>
                </div>

                <div className="bg-primary/[0.03] rounded-2xl p-6 border border-primary/10 flex gap-4 group transition-all hover:bg-primary/[0.06] hover:border-primary/20">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-sm text-foreground/80 leading-relaxed">
                    <p className="font-bold mb-3 text-foreground flex items-center gap-2">
                      Magic Placeholders
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded tracking-tighter">RENDER ON SEND</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["{customer_name}", "{property_address}", "{photographer_name}", "{shoot_date}", "{time_slot}", "{package_name}"].map(tag => (
                        <code key={tag} className="bg-card px-2.5 py-1 rounded-lg border border-border/50 text-primary font-bold text-[11px] shadow-sm transition-transform hover:scale-105 cursor-default">{tag}</code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card/30 border-2 border-dashed border-border/20 rounded-[2rem] h-[600px] flex flex-col items-center justify-center text-muted-foreground space-y-6 group">
              <div className="w-24 h-24 rounded-[2rem] bg-card border border-border/50 flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-bounce">
                  <Settings2 className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-xl text-foreground">Template Studio</p>
                <p className="text-sm opacity-60">Select a communication to start customizing.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowPreview(false)} />
          <div className="relative bg-card text-foreground w-full max-w-2xl rounded-[2.5rem] shadow-gold border border-primary/20 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-primary/20 flex items-center justify-between bg-muted/20">
               <div>
                  <h3 className="font-black text-foreground flex items-center gap-2 text-lg">
                    <Eye className="w-5 h-5 text-primary" />
                    Template Preview
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">{selectedTemplate.title} — Live Rendering</p>
               </div>
               <button 
                onClick={() => setShowPreview(false)}
                className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors border border-primary/10"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
              {/* This mimics the _get_email_template structure from backend */}
              <div className="max-w-[600px] mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-10 border-b border-slate-50 text-center">
                   <div className="text-xl font-black tracking-tighter text-slate-900 uppercase">KC REAL ESTATE MEDIA</div>
                </div>
                <div className="p-10 space-y-6">
                   <h1 className="text-2xl font-black text-slate-900 leading-tight">
                      {selectedTemplate.title}
                   </h1>
                   <div 
                    className="text-slate-600 leading-relaxed space-y-4 prose prose-slate"
                    dangerouslySetInnerHTML={{ 
                      __html: renderPreviewBody(selectedTemplate.body) 
                    }} 
                   />
                </div>
                <div className="p-8 border-t border-slate-50 bg-slate-50/30 text-center space-y-2">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">&copy; 2026 KC Real Estate Media</p>
                   <p className="text-[9px] text-slate-300 font-medium">Professional Media Solutions for Modern Real Estate.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 text-center">
              <p className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-2">
                <Info className="w-3 h-3" />
                NOTE: PLACEHOLDERS ARE SHOWN WITH SAMPLE DATA FOR VISUALIZATION
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to render preview with sample data
function renderPreviewBody(body: string) {
  const sampleData = {
    customer_name: "Johnny Appleseed",
    property_address: "123 Sunset Blvd, Beverly Hills, CA",
    photographer_name: "Alex Sterling",
    shoot_date: "Monday, Oct 12, 2026",
    time_slot: "02:00 PM",
    package_name: "Premium Cinematic Package"
  };

  let rendered = body;
  Object.entries(sampleData).forEach(([key, value]) => {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, "g"), `<strong>${value}</strong>`);
  });
  
  // Convert newlines to HTML breaks for preview display
  return rendered.replace(/\n/g, '<br/>');
}
