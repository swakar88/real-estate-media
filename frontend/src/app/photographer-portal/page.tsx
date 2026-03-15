"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminSidebar from "@/components/AdminSidebar";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  User as UserIcon, 
  Clock, 
  Camera, 
  CheckCircle2,
  Moon,
  Sun
} from "lucide-react";

export default function PhotographerPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shoots" | "availability" | "profile">("shoots");

  // Profile Form State
  const [bio, setBio] = useState("");
  const [equipment, setEquipment] = useState("");
  const [socials, setSocials] = useState<any>({});

  // Availability Form State
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("09:00");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setIsDark(savedTheme === "dark");
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Clean up html tag
    root.classList.remove("dark");
    
    if (isDark) {
      body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    console.log("Photographer Theme updated (on body):", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => {
    console.log("Toggling photographer theme...");
    setIsDark(prev => !prev);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return router.push("/login");

    try {
      // Fetch User
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (!userData.is_photographer && !userData.is_staff) {
        return router.push("/dashboard");
      }
      setUser(userData);

      // Fetch Photographer Profile (for equipment & social)
      if (userData.photographer_profile) {
          const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${userData.photographer_profile.id}/`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          if (profileRes.ok) {
              const pData = await profileRes.json();
              setEquipment(pData.equipment || "");
              setBio(pData.bio || "");
              setSocials(pData.social_links || {});
          }
      }

      // Fetch Slots
      const slotsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (slotsRes.ok) setSlots(await slotsRes.json());

      // Fetch assigned bookings (ClientShoots)
      const shootsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (shootsRes.ok) {
        const data = await shootsRes.json();
        setShoots(data.results || data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ date, time_slot: timeSlot })
      });
      if (res.ok) {
        const newSlot = await res.json();
        setSlots([...slots, newSlot]);
      } else {
        alert("Failed to add slot (maybe it already exists?)");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSlot = async (id: number) => {
    const token = localStorage.getItem("access_token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/${id}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setSlots(slots.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!user?.photographer_profile?.id) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${user.photographer_profile.id}/`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          bio, 
          equipment, 
          social_links: socials,
          profile_image_url: user.profile_image_url
        })
      });
      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;

  const deleteMediaItem = async (itemId: number) => {
    const token = localStorage.getItem("access_token");
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/media-items/${itemId}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData(); // Refresh to show remaining items
      } else {
        alert("Failed to delete item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const profileImgSrc = user?.profile_image_url || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=random`;
  
  const activeShoots = shoots.filter(s => s.status !== 'delivered' || s.payment_status !== 'paid');
  const completedShoots = shoots.filter(s => s.status === 'delivered' && s.payment_status === 'paid');

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-300">
      <Navbar />
      
      <div className={`flex flex-1 ${user?.is_staff ? 'pt-[72px]' : ''}`}>
        {user?.is_staff && <AdminSidebar />}
        
        <main className={`flex-1 p-6 md:p-10 container mx-auto max-w-6xl ${!user?.is_staff ? 'pt-24 pb-20' : ''}`}>
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Photographer Portal</h1>
              <p className="text-muted-foreground font-medium">Manage your shoots, availability and portfolio assets.</p>
            </div>
            <div className="flex items-center gap-4 bg-card p-2 pr-6 rounded-2xl border border-border backdrop-blur-sm shadow-sm">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 ml-2 rounded-xl bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-orange-500" />}
              </button>
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0">
                <img src={profileImgSrc} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Logged in as</p>
                <p className="font-bold text-sm">{user?.first_name || user?.username}</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar">
            {[
              { id: 'shoots', label: 'My Bookings', icon: ShoppingBag, count: activeShoots.length },
              { id: 'availability', label: 'Availability', icon: Calendar },
              { id: 'profile', label: 'My Profile', icon: UserIcon }
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shrink-0 ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && <span className={`ml-2 px-2 py-0.5 rounded-lg ${activeTab === tab.id ? 'bg-white/20' : 'bg-muted'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'shoots' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Active Shoots Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" /> Active Assignments
                    </h2>
                  </div>
                  
                  {activeShoots.length === 0 && (
                    <div className="bg-card border border-border p-12 rounded-[2.5rem] flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No active shoots assigned</p>
                    </div>
                  )}

                  {activeShoots.map(shoot => (
                    <div key={shoot.id} className="group bg-card border border-border hover:border-primary/40 p-8 rounded-[2.5rem] transition-all duration-500 shadow-sm">
                      <div className="flex justify-between items-start gap-4 mb-6">
                        <div className="min-w-0">
                          <h3 className="text-xl font-black truncate group-hover:text-primary transition-colors">{shoot.property_address}</h3>
                          <div className="flex items-center gap-3 mt-2">
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(shoot.shoot_date).toDateString()}</span>
                             <span className="w-1 h-1 rounded-full bg-border"></span>
                             <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{shoot.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <div className="shrink-0 bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/10">
                           Action Needed
                        </div>
                      </div>

                      {shoot.notes && (
                        <div className="p-4 bg-muted/50 rounded-2xl mb-6 text-sm text-foreground/70 border border-border italic">
                          "{shoot.notes}"
                        </div>
                      )}

                      {/* Existing Media Management */}
                      {shoot.media_items && shoot.media_items.length > 0 && (
                        <div className="pt-6 border-t border-border mt-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 ml-1">Manage Uploaded Content ({shoot.media_items.length})</p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {shoot.media_items.map((item: any) => (
                              <div key={item.id} className="aspect-square bg-muted rounded-xl relative overflow-hidden group/item border border-border">
                                {item.media_type === 'photo' ? (
                                  <img src={item.url} alt="" className={`w-full h-full object-cover ${!item.is_processed ? 'opacity-50 blur-[2px]' : ''}`} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                    {item.media_type === 'video' ? <Camera className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                                  </div>
                                )}
                                
                                {!item.is_processed && item.media_type !== 'virtual_tour' && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-white drop-shadow-md">Processing</span>
                                  </div>
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  {item.is_processed ? (
                                    <button 
                                      onClick={() => deleteMediaItem(item.id)}
                                      className="p-1.5 bg-rose-500 text-white rounded-lg hover:scale-110 transition-transform"
                                      title="Delete Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span className="text-[8px] font-bold text-white/70">Wait for processing...</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-6 border-t border-border mt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 ml-1">Upload New Media (Tagged)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <select className="upload-type-select w-full bg-muted/30 border border-border rounded-2xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer" id={`type-${shoot.id}`}>
                                <option value="photo" className="bg-card text-foreground">📷 Full Photo Set</option>
                                <option value="video" className="bg-card text-foreground">🎥 Video File / Link</option>
                                <option value="virtual_tour" className="bg-card text-foreground">🌐 3D Virtual Tour</option>
                             </select>
                           </div>
                           <input 
                              type="file" 
                              multiple
                              id={`file-${shoot.id}`}
                              className="hidden" 
                              onChange={async (e) => {
                                 const files = e.target.files;
                                 if (!files || files.length === 0) return;
                                 
                                 const btn = document.getElementById(`btn-${shoot.id}`);
                                 const mediaTypeSelect = document.getElementById(`type-${shoot.id}`) as HTMLSelectElement;
                                 const mediaType = mediaTypeSelect.value;
                                 
                                 if (btn) {
                                    const originalText = btn.innerHTML;
                                    (btn as HTMLButtonElement).disabled = true;

                                    try {
                                       const token = localStorage.getItem("access_token");
                                       
                                       for (let i = 0; i < files.length; i++) {
                                          const file = files[i];
                                          btn.innerHTML = `<span class="animate-pulse">Uploading ${i+1}/${files.length}...</span>`;
                                          
                                          // 1. Get Presigned URL
                                          const presignRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shoots/${shoot.id}/get-upload-url/?type=${mediaType}&filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`, {
                                             headers: { "Authorization": `Bearer ${token}` }
                                          });
                                          if (!presignRes.ok) throw new Error(`Failed to get upload link for ${file.name}`);
                                          const { upload_url, object_key } = await presignRes.json();

                                          // 2. Direct R2 Upload
                                          const uploadRes = await fetch(upload_url, {
                                             method: "PUT",
                                             headers: { "Content-Type": file.type },
                                             body: file
                                          });
                                          if (!uploadRes.ok) throw new Error(`R2 Upload failed for ${file.name}`);

                                          // 3. Confirm to backend
                                          // 3. Confirm to backend
                                          const confirmRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shoots/${shoot.id}/confirm-upload/`, {
                                             method: "POST",
                                             headers: {
                                                "Authorization": `Bearer ${token}`,
                                                "Content-Type": "application/json"
                                             },
                                             body: JSON.stringify({ object_key, media_type: mediaType })
                                          });

                                          if (!confirmRes.ok) {
                                             const errorData = await confirmRes.json().catch(() => ({}));
                                             throw new Error(`Failed to confirm upload for ${file.name}: ${errorData.detail || errorData.error || confirmRes.statusText}`);
                                          }
                                       }

                                       alert(`Successfully uploaded ${files.length} file(s)!`);
                                       fetchData();
                                    } catch (err: any) {
                                       alert(`Upload Error: ${err.message}`);
                                    } finally {
                                       btn.innerHTML = originalText;
                                       (btn as HTMLButtonElement).disabled = false;
                                       e.target.value = '';
                                    }
                                 }
                              }} 
                           />
                           <button 
                             id={`btn-${shoot.id}`}
                             onClick={() => document.getElementById(`file-${shoot.id}`)?.click()}
                             className="bg-white text-black h-[50px] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/10 active:scale-95"
                           >
                              Choose & Upload
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completed Shoots Section */}
                <div className="bg-card border border-border p-10 rounded-[3rem] shadow-xl">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> Past Work
                  </h2>
                  <div className="space-y-4">
                    {completedShoots.length === 0 ? (
                      <p className="text-muted-foreground text-center py-10 font-medium">No completed bookings yet.</p>
                    ) : (
                      completedShoots.map((shoot) => (
                        <div key={shoot.id} className="bg-muted/30 border border-border p-5 rounded-2xl hover:bg-muted/50 transition-all group">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{shoot.property_address || 'Unnamed Property'}</p>
                            <CheckCircle2 className="w-4 h-4 text-green-500/50 group-hover:text-green-500 transition-colors" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Delivered: {new Date(shoot.created_at).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-card border border-border p-10 rounded-[3rem] shadow-sm">
                  <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary"/> Schedule Availability
                  </h2>
                  <form onSubmit={addSlot} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Select Date</label>
                       <input 
                         type="date" 
                         required 
                         className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans" 
                         value={date} 
                         onChange={e => setDate(e.target.value)} 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Time Window</label>
                       <select 
                         className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer" 
                         value={timeSlot} 
                         onChange={e => setTimeSlot(e.target.value)}
                       >
                         <option value="09:00" className="bg-card text-foreground">9:00 AM - Early Morning</option>
                         <option value="11:00" className="bg-card text-foreground">11:00 AM - Late Morning</option>
                         <option value="13:00" className="bg-card text-foreground">1:00 PM - Afternoon</option>
                         <option value="15:00" className="bg-card text-foreground">3:00 PM - Late Afternoon</option>
                         <option value="17:00" className="bg-card text-foreground">5:00 PM - Twilight/Evening</option>
                       </select>
                    </div>
                    <button type="submit" className="w-full bg-primary text-white h-[60px] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                      Publish Session Slot
                    </button>
                  </form>
                </div>

                <div className="space-y-6">
                   <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Currently Listed Slots</h3>
                   <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {slots.length === 0 && (
                      <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-border">
                        <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">No slots available</p>
                      </div>
                    )}
                    {slots.map(slot => (
                      <div key={slot.id} className="flex justify-between items-center group bg-card hover:bg-muted/50 border border-border p-6 rounded-[2rem] transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                             <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-sm block">{new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{slot.time_slot} Window</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {slot.is_booked ? (
                            <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/10 uppercase tracking-widest">Booked</span>
                          ) : (
                            <div className="flex items-center gap-4">
                              <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/10 uppercase tracking-widest">Available</span>
                              <button onClick={() => deleteSlot(slot.id)} className="p-3 text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 {/* Profile sidebar */}
                 <div className="bg-card border border-border p-10 rounded-[3rem] text-center shadow-xl">
                    <div className="relative inline-block">
                       <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-border mb-6 group relative cursor-pointer">
                          <img src={profileImgSrc} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Plus className="w-6 h-6 text-white" />
                          </div>
                       </div>
                       <div className="w-full space-y-2 mb-6">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Profile Image URL</label>
                           <input 
                              type="url"
                              className="w-full bg-background/50 border border-border rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              value={user?.profile_image_url || ''}
                              onChange={e => setUser({ ...user, profile_image_url: e.target.value })}
                              placeholder="https://images.unsplash.com/..."
                           />
                       </div>
                       <h3 className="text-xl font-black mb-1">{user?.first_name} {user?.last_name}</h3>
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6">Verified Photographer</p>
                       <div className="w-full pt-6 border-t border-border grid grid-cols-2 gap-4">
                          <div className="text-center">
                             <p className="text-xl font-black">{shoots.length}</p>
                             <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Shoots</p>
                          </div>
                          <div className="text-center">
                             <p className="text-xl font-black">4.9</p>
                             <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Rating</p>
                          </div>
                       </div>
                    </div>
 
                    <div className="mt-10 p-6 bg-muted/30 rounded-3xl border border-border text-left">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Account Status</p>
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Active & Accepting Bookings</p>
                       </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="lg:col-span-2 bg-card border border-border p-10 rounded-[3rem]">
                     <h2 className="text-2xl font-black mb-8">Professional Profile</h2>
                    <form onSubmit={updateProfile} className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Profile Bio</label>
                             <textarea 
                                className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-32 resize-none"
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                placeholder="Tell clients about your style and experience..."
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Equipment List</label>
                             <textarea 
                                className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-32 resize-none"
                                value={equipment}
                                onChange={e => setEquipment(e.target.value)}
                                placeholder="Sony A7IV, RS3 Mini, Drone etc..."
                             />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Social Links</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[
                                { id: 'instagram', label: 'Instagram', icon: '📸' },
                                { id: 'facebook', label: 'Facebook', icon: '👤' },
                                { id: 'website', label: 'Portfolio/Website', icon: '🌐' },
                                { id: 'vimeo', label: 'Vimeo/Video', icon: '🎬' }
                             ].map((social: any) => (
                                <div key={social.id} className="relative group">
                                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-lg opacity-50">{social.icon}</div>
                                    <input 
                                       type="text"
                                       placeholder={`Link to ${social.label}`}
                                       className="w-full bg-muted/30 border border-border rounded-2xl pl-16 pr-6 py-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/30"
                                      value={socials[social.id] || ''}
                                      onChange={e => setSocials({ ...socials, [social.id]: e.target.value })}
                                   />
                                </div>
                             ))}
                          </div>
                       </div>

                        <button type="submit" className="px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                           Save Changes
                        </button>
                    </form>
                 </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {!user?.is_staff && <Footer />}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .dark input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
        }
        .upload-type-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.5rem center;
          background-size: 1rem;
        }
      `}</style>
    </div>
  );
}
