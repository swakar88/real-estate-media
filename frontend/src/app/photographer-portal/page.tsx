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
  DollarSign,
  History,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import ImpersonationBanner from "@/components/ImpersonationBanner";

export default function PhotographerPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shoots" | "earnings" | "availability" | "profile">("shoots");
  
  // Payment State
  const [payments, setPayments] = useState<any[]>([]);

  // Profile Form State
  const [bio, setBio] = useState("");
  const [equipment, setEquipment] = useState("");
  const [socials, setSocials] = useState<any>({});

  // Availability Form State
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState("09:00");
  const [uploadStatus, setUploadStatus] = useState<{message: string, type: 'success' | 'error' | 'none'}>({message: '', type: 'none'});
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return router.push("/login");

    const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const impId = queryParams.get('impersonate_id');
    const tabParam = queryParams.get('tab');
    const stripeParam = queryParams.get('stripe');

    if (tabParam === 'profile') setActiveTab('profile');
    if (stripeParam === 'success') {
      // Show a temporary success toast/alert if needed
      // alert("Stripe account successfully connected!");
    }

    try {
      // Fetch User
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/${impId ? `?impersonate_id=${impId}` : ''}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await userRes.json();
      
      // If we are an admin impersonating, allowed. Otherwise check role.
      const isImpersonating = impId && userData.is_staff;
      
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
      const slotsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/${impId ? `?impersonate_id=${impId}` : ''}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (slotsRes.ok) setSlots(await slotsRes.json());

      // Fetch assigned bookings (ClientShoots)
      const shootsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/${impId ? `?impersonate_id=${impId}&role=photographer` : ''}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (shootsRes.ok) {
        const data = await shootsRes.json();
        setShoots(data.results || data);
      }

      // Fetch Payments
      const paymentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer-payments/${impId ? `?impersonate_id=${impId}` : ''}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (paymentsRes.ok) {
        setPayments(await paymentsRes.json());
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
        setUploadStatus({ message: "Session slot published!", type: 'success' });
        setTimeout(() => setUploadStatus({message: '', type: 'none'}), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setUploadStatus({ message: errorData.detail || "Failed to add slot - it might already exist.", type: 'error' });
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
      if (!uploadRes.ok) throw new Error("Upload failed");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ profile_image_url: public_url }),
      });
      setUser((u: any) => ({ ...u, profile_image_url: public_url }));
      setUploadStatus({ message: "Profile photo updated!", type: 'success' });
      setTimeout(() => setUploadStatus({ message: '', type: 'none' }), 3000);
    } catch (err) {
      setUploadStatus({ message: "Failed to upload photo.", type: 'error' });
    } finally {
      setUploadingImage(false);
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
        setUploadStatus({ message: "Profile updated successfully!", type: 'success' });
        setTimeout(() => setUploadStatus({message: '', type: 'none'}), 3000);
      } else {
        setUploadStatus({ message: "Failed to update profile.", type: 'error' });
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
    <div className="flex min-h-screen flex-col dark:bg-black bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-300">
      <Navbar />
      
      <div className={`flex flex-1 ${user?.is_staff ? 'pt-[72px]' : ''}`}>
        {user?.is_staff && <AdminSidebar />}
        
        <main className={`flex-1 p-6 md:p-10 container mx-auto max-w-6xl ${!user?.is_staff ? 'pt-24 pb-20' : ''}`}>
          
          {/* Header Section */}
          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('impersonate_id') && (
            <ImpersonationBanner 
              userName={user?.full_name || user?.first_name || user?.username} 
              role="Photographer" 
            />
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">
                {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('impersonate_id') ? `Viewing: ${user?.first_name || user?.username}` : 'Photographer Portal'}
              </h1>
              <p className="text-muted-foreground font-medium">Manage your shoots, availability and portfolio assets.</p>
            </div>
            <div className="flex items-center gap-4 bg-card p-2 pr-6 rounded-2xl border border-primary/20 backdrop-blur-sm shadow-gold">
              <ThemeToggle />
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-primary/10 shrink-0">
                <img src={profileImgSrc} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Logged in as</p>
                <p className="font-bold text-sm tracking-tight">{user?.first_name || user?.username}</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar">
            {[
              { id: 'shoots', label: 'My Bookings', icon: ShoppingBag, count: activeShoots.length },
              { id: 'earnings', label: 'My Earnings', icon: DollarSign },
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
            {activeTab === 'earnings' && user?.photographer_profile && (
               <div className="space-y-10">
                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="bg-card/80 backdrop-blur-md border border-primary/20 p-8 rounded-[2.5rem] shadow-gold flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                           <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Earned</p>
                           <h4 className="text-2xl font-black italic">${parseFloat(user.photographer_profile.total_earned || 0).toFixed(2)}</h4>
                        </div>
                     </div>
                     <div className="bg-card/80 backdrop-blur-md border border-primary/20 p-8 rounded-[2.5rem] shadow-gold flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                           <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Paid Out</p>
                           <h4 className="text-2xl font-black italic">${parseFloat(user.photographer_profile.total_paid || 0).toFixed(2)}</h4>
                        </div>
                     </div>
                     <div className="bg-card/80 backdrop-blur-md border border-primary/20 p-8 rounded-[2.5rem] shadow-gold-heavy flex items-center gap-6 bg-primary/5">
                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                           <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Current Balance</p>
                           <h4 className="text-2xl font-black italic">${(parseFloat(user.photographer_profile.total_earned || 0) - parseFloat(user.photographer_profile.total_paid || 0)).toFixed(2)}</h4>
                        </div>
                     </div>
                  </div>

                  {/* Payment History Table */}
                  <div className="bg-card border border-primary/20 p-10 rounded-[3rem] shadow-gold">
                     <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                        <History className="w-5 h-5 text-primary" /> Payment History
                     </h2>
                     
                     <div className="space-y-4">
                        {payments.length === 0 ? (
                           <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-dashed border-primary/10">
                              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">No payments recorded yet</p>
                           </div>
                        ) : (
                           <div className="overflow-hidden border border-primary/5 rounded-3xl divide-y divide-primary/5">
                              {payments.map((payment: any) => (
                                 <div key={payment.id} className="p-6 bg-muted/10 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-5">
                                       <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl">
                                          🏦
                                       </div>
                                       <div>
                                          <p className="font-black text-lg italic tracking-tight">${parseFloat(payment.amount).toFixed(2)}</p>
                                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                              {(() => {
                                                 const [y, m, d] = payment.payment_date.split('-');
                                                 return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                                              })()}
                                           </p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">Ref / Notes</span>
                                       <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                                          {payment.reference_number || 'N/A'} {payment.notes && ` • ${payment.notes}`}
                                       </p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>

                     <div className="mt-10 p-6 bg-primary/5 border border-primary/10 rounded-3xl">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                           💡 Note to Photographer
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                           Payments are typically processed within 3-5 business days of reach the payout threshold. 
                           The "Current Balance" represents your share of earnings from all delivered and paid shoots that haven't been disbursed yet.
                        </p>
                     </div>
                  </div>
               </div>
            )}

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
                    <div className="bg-card border border-primary/20 shadow-gold flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No active shoots assigned</p>
                    </div>
                  )}

                  {activeShoots.map(shoot => (
                    <div key={shoot.id} className="group bg-card border border-primary/20 hover:border-primary/40 p-8 rounded-[2.5rem] transition-all duration-500 shadow-gold">
                      <div className="flex justify-between items-start gap-4 mb-6">
                        <div className="min-w-0">
                          <h3 className="text-xl font-black truncate group-hover:text-primary transition-colors">{shoot.property_address}</h3>
                           <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                 {(() => {
                                    const [y, m, d] = shoot.shoot_date.split('-');
                                    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toDateString();
                                 })()}
                              </span>
                             <span className="w-1 h-1 rounded-full bg-border"></span>
                             <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{shoot.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <div className="shrink-0 bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/10">
                           Action Needed
                        </div>
                      </div>

                      {shoot.notes && (
                        <div className="p-4 bg-muted/50 rounded-2xl mb-6 text-sm text-foreground/70 border border-primary/10 italic">
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

                                       setUploadStatus({ message: `Successfully uploaded ${files.length} file(s)!`, type: 'success' });
                                       fetchData();
                                    } catch (err: any) {
                                       setUploadStatus({ message: `Upload Error: ${err.message}`, type: 'error' });
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
                             className="bg-primary text-primary-foreground h-[50px] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-gold-heavy transition-all shadow-gold active:scale-95"
                           >
                              Choose & Upload
                           </button>
                        </div>
                        
                        {uploadStatus.type !== 'none' && (
                           <div className={`mt-4 p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${uploadStatus.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                              {uploadStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                              {uploadStatus.message}
                              <button onClick={() => setUploadStatus({message: '', type: 'none'})} className="ml-auto opacity-50 hover:opacity-100">✕</button>
                           </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completed Shoots Section */}
                <div className="bg-card border border-primary/20 p-10 rounded-[3rem] shadow-gold">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success" /> Past Work
                  </h2>
                  <div className="space-y-4">
                    {completedShoots.length === 0 ? (
                      <p className="text-muted-foreground text-center py-10 font-medium">No completed bookings yet.</p>
                    ) : (
                      completedShoots.map((shoot) => (
                        <div key={shoot.id} className="bg-muted/30 border border-border p-5 rounded-2xl hover:bg-muted/50 transition-all group">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{shoot.property_address || 'Unnamed Property'}</p>
                            <CheckCircle2 className="w-4 h-4 text-success/50 group-hover:text-success transition-colors" />
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
                <div className="bg-card border border-primary/20 p-10 rounded-[3rem] shadow-gold">
                  <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary"/> Schedule Availability
                  </h2>
                  <form onSubmit={addSlot} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Select Date</label>
                       <div className="relative">
                         <input
                           type="date"
                           required
                           className="w-full bg-background text-foreground border border-border rounded-2xl px-6 py-4 pr-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                           value={date}
                           onChange={e => setDate(e.target.value)}
                         />
                         <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                       </div>
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
                     <button type="submit" className="w-full bg-primary text-primary-foreground h-[60px] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50">
                       Publish Session Slot
                     </button>
                     {uploadStatus.message && activeTab === 'availability' && (
                       <div className={`mt-4 p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${uploadStatus.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          {uploadStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                          {uploadStatus.message}
                          <button onClick={() => setUploadStatus({message: '', type: 'none'})} className="ml-auto opacity-50 hover:opacity-100">✕</button>
                       </div>
                     )}
                   </form>
                 </div>

                <div className="space-y-6">
                   <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Currently Listed Slots</h3>
                   <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {slots.length === 0 && (
                      <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-primary/10">
                        <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">No slots available</p>
                      </div>
                    )}
                    {slots.map(slot => (
                      <div key={slot.id} className="flex justify-between items-center group bg-card hover:bg-primary/5 border border-primary/20 p-6 rounded-[2rem] transition-all shadow-gold">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                             <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-sm block">
                              {(() => {
                                const [y, m, d] = slot.date.split('-');
                                return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                              })()}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{slot.time_slot} Window</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {slot.is_booked ? (
                            <span className="text-[9px] font-black text-error bg-error/10 px-4 py-2 rounded-full border border-error/10 uppercase tracking-widest">Booked</span>
                          ) : (
                            <div className="flex items-center gap-4">
                              <span className="text-[9px] font-black text-success bg-success/10 px-4 py-2 rounded-full border border-success/10 uppercase tracking-widest">Available</span>
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
                 <div className="bg-card border border-primary/20 p-10 rounded-[3rem] text-center shadow-gold">
                    <div className="relative inline-block">
                       <label className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-border mb-6 group relative cursor-pointer block">
                          <img src={profileImgSrc} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             {uploadingImage ? <Camera className="w-6 h-6 text-white animate-pulse" /> : <Plus className="w-6 h-6 text-white" />}
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                       </label>
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
                          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Active & Accepting Bookings</p>
                       </div>
                    </div>

                    {/* Stripe Connect Section */}
                    <div className="mt-6 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/20 text-left group">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
                             <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                             <h3 className="text-xs font-black tracking-tight italic">Stripe Connect</h3>
                             <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Automated Splits</p>
                          </div>
                       </div>

                       {user.photographer_profile?.stripe_account_id ? (
                          <div className="space-y-3">
                             <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/10">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Connected</span>
                             </div>
                             <p className="text-[10px] font-bold text-muted-foreground/60 px-1 truncate">
                                ID: {user.photographer_profile.stripe_account_id}
                             </p>
                          </div>
                       ) : (
                          <div className="space-y-4">
                             <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Connect to receive instant automated payouts.
                             </p>
                             <button 
                               onClick={async () => {
                                 const token = localStorage.getItem("access_token");
                                 try {
                                   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${user.photographer_profile.id}/stripe-connect/`, {
                                     method: "POST",
                                     headers: { "Authorization": `Bearer ${token}` }
                                   });
                                   if (res.ok) {
                                     const { url } = await res.json();
                                     window.location.href = url;
                                   } else {
                                     const err = await res.json();
                                     alert(`Failed to start onboarding: ${err.detail || 'Unknown error'}`);
                                   }
                                 } catch (err) {
                                   console.error(err);
                                   alert("An error occurred. Please try again.");
                                 }
                               }}
                               className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.02] transition-all active:scale-95"
                             >
                                <div className="w-3 h-3 bg-white text-indigo-600 rounded-sm flex items-center justify-center font-black text-[7px] italic">S</div>
                                Connect Stripe
                             </button>
                          </div>
                       )}
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="lg:col-span-2 bg-card border border-primary/20 p-10 rounded-[3rem] shadow-gold">
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

                        <button type="submit" className="px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-gold hover:shadow-gold-heavy transition-all active:scale-95">
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
