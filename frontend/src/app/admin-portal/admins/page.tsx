"use client";

import { useEffect, useState } from "react";
import { Plus, UserPlus, Shield, Mail, Trash2, Loader2, Power, ShieldAlert, Trash, Camera, CheckCircle2, UserCircle } from "lucide-react";
import Link from "next/link";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchAdmins(), fetchCurrentUser()]);
        setLoading(false);
    };
    fetchInitialData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/auth/user/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch current user", err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/admins/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch admins", err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/admins/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ first_name: "", last_name: "", email: "" });
        fetchAdmins(); // Refresh list
      } else {
        setError(JSON.stringify(data) || "Failed to invite admin.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error("Failed to submit", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (admin: any) => {
    const action = admin.is_active ? "Deactivate" : "Activate";
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this admin account?`)) return;

    setActionLoading(admin.id);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/admins/${admin.id}/`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: !admin.is_active })
      });
      
      if (res.ok) {
        fetchAdmins();
      }
    } catch (err) {
      console.error("Failed to toggle admin status", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (adminId: number) => {
    const activeAdmins = admins.filter(a => a.is_active !== false);
    if (activeAdmins.length <= 1) {
      alert("Cannot delete the last admin account. Create another admin first.");
      return;
    }
    if (!confirm("Are you sure you want to PERMANENTLY delete this admin account? This cannot be undone.")) return;

    setActionLoading(adminId.toString());
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/admins/${adminId}/?hard=true`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAdmins();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || data[0] || "Failed to delete admin account.");
      }
    } catch (err) {
      console.error("Failed to delete admin", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleImageUpload = async (adminId: number, file: File) => {
    setActionLoading(`img-${adminId}`);
    try {
      const token = localStorage.getItem("access_token");
      const urlRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/get-upload-url/?filename=profile_admin_${adminId}_${file.name}&contentType=${encodeURIComponent(file.type)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { upload_url, public_url } = await urlRes.json();
      const uploadRes = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploadRes.ok) throw new Error("Upload failed");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ profile_image_url: public_url }),
      });
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, profile_image_url: public_url } : a));
    } catch (err) {
      console.error("Failed to upload image", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Management</h1>
            <p className="text-muted-foreground">Manage users with administrative access to this portal.</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
             <UserPlus className="w-4 h-4" /> Add New Admin
          </button>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin: any) => (
            <StaggerItem key={admin.id}>
              <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] p-8 shadow-gold hover:shadow-gold-heavy transition-all group relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield className="w-12 h-12 text-primary" />
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative group/avatar">
                    <div className="h-16 w-16 rounded-[1.25rem] bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-2xl shadow-gold overflow-hidden">
                      {admin.profile_image_url ? (
                        <img src={admin.profile_image_url} alt={admin.full_name} className="w-full h-full object-cover" />
                      ) : (
                        admin.full_name?.[0] || admin.username?.[0] || "A"
                      )}
                    </div>
                    {admin.id === currentUser?.id && (
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center rounded-[1.25rem] cursor-pointer transition-all border border-primary/40">
                        <Camera className="w-5 h-5 text-white" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(admin.id, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{admin.full_name || admin.username}</h3>
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-black text-primary/80">
                        <Shield className="w-3 h-3" />
                        Administrator
                    </div>
                  </div>
                </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 opacity-70" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                  
                  <div className="pt-2">
                    <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${admin.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-primary/5 flex justify-between items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Joined {new Date(admin.date_joined).toLocaleDateString()}</span>
                    
                    {admin.id !== currentUser?.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/?as=${admin.id}`}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title="View Site as this Admin"
                        >
                          <UserCircle className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleToggleActive(admin)}
                          disabled={actionLoading === admin.id}
                          className={`p-2 rounded-lg transition-all ${admin.is_active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                          title={admin.is_active ? "Deactivate" : "Activate"}
                        >
                          {actionLoading === admin.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(admin.id)}
                          disabled={actionLoading === admin.id.toString()}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                          title="Delete Permanently"
                        >
                          {actionLoading === admin.id.toString() ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] shadow-gold-heavy border border-primary/20 p-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-foreground">Invite Admin</h2>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-bold">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</label>
                  <input 
                    type="text" required
                    className="w-full rounded-xl border border-primary/10 bg-black/40 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                    placeholder="John"
                    value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</label>
                  <input 
                    type="text" required
                    className="w-full rounded-xl border border-primary/10 bg-black/40 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                    placeholder="Doe"
                    value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                <input 
                  type="email" required
                  className="w-full rounded-xl border border-primary/10 bg-black/40 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="admin@example.com"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[11px] text-muted-foreground flex gap-2">
                    <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                    An invitation email will be sent to this address. The admin will be prompted to set their own password to activate their account.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-6 py-3 text-sm font-bold bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-3 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
