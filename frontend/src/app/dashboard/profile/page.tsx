"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  ShieldCheck, 
  Loader2,
  Camera,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      const impId = sessionStorage.getItem('impersonating_as');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/${impId ? `?impersonate_id=${impId}` : ''}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address (e.g. name@domain.com).");
      return;
    }
    setSaving(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success("Profile updated successfully");
        const updated = await res.json();
        setUser(updated);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    
    setSaving(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password
        })
      });
      
      if (res.ok) {
        toast.success("Password updated successfully. Please log in again.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update password");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const token = localStorage.getItem("access_token");
      const urlRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/get-upload-url/?filename=profile_${user.id}_${file.name}&contentType=${encodeURIComponent(file.type)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { upload_url, public_url } = await urlRes.json();
      const uploadRes = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploadRes.ok) throw new Error("Upload to R2 failed");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ profile_image_url: public_url }),
      });
      setUser((u: any) => ({ ...u, profile_image_url: public_url }));
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">My Profile</h1>
          <p className="text-muted-foreground font-medium">Manage your personal information and account security.</p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-primary">Secure Account</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Avatar & Basic Info Card */}
        <div className="space-y-6">
           <div className="bg-card rounded-[2.5rem] border border-border/40 p-8 shadow-sm text-center">
              <div className="relative inline-block mb-6">
                <div className="h-32 w-32 rounded-[2rem] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-black text-4xl shadow-2xl shadow-primary/20 overflow-hidden">
                  {user?.profile_image_url
                    ? <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                    : (user?.first_name?.[0] || user?.username?.[0] || "U")}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-card border border-border/40 rounded-2xl shadow-xl text-muted-foreground hover:text-primary transition-all cursor-pointer">
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
              <h2 className="text-xl font-black mb-1">{user?.first_name} {user?.last_name}</h2>
              <p className="text-sm font-bold text-muted-foreground/60 mb-6 uppercase tracking-widest">{user?.username}</p>
              
              <div className="pt-6 border-t border-border/30 space-y-4">
                 <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground/40 uppercase tracking-widest">Account Type</span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest text-[9px]">Business Client</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground/40 uppercase tracking-widest">Joined</span>
                    <span className="text-foreground/80">March 2026</span>
                 </div>
              </div>
           </div>

           <button className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-destructive/5 text-destructive font-bold text-sm hover:bg-destructive/10 transition-all border border-destructive/10">
              <Trash2 className="h-4 w-4" /> Deactivate Account
           </button>
        </div>

        {/* Right Column: Update Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Info */}
          <section className="bg-card rounded-[2.5rem] border border-border/40 p-10 shadow-sm">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <User className="h-6 w-6 text-primary" /> Personal Information
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-muted/40 border border-border/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-muted/40 border border-border/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="email" 
                    className="w-full pl-12 pr-5 py-4 bg-muted/40 border border-border/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Personal Details
              </button>
            </form>
          </section>

          {/* Security / Password */}
          <section className="bg-card rounded-[2.5rem] border border-border/40 p-10 shadow-sm overflow-hidden relative">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
            
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
              <Lock className="h-6 w-6 text-primary" /> Security Settings
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Current Password</label>
                <input 
                  type="password" 
                  className="w-full px-5 py-4 bg-muted/40 border border-border/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  placeholder="Enter current password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-5 py-4 bg-muted/40 border border-border/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    placeholder="New password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
                  <input 
                    type="password" 
                    className="w-full px-5 py-4 bg-muted/40 border border-border/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    placeholder="Repeat new password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Change Password
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
