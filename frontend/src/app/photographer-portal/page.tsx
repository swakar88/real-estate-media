"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminSidebar from "@/components/AdminSidebar";
import { Calendar, Plus, Trash2 } from "lucide-react";

export default function PhotographerPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("09:00");

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

      // Fetch Slots
      const slotsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (slotsRes.ok) setSlots(await slotsRes.json());

      // Fetch assigned bookings (ClientShoots)
      const shootsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (shootsRes.ok) setShoots(await shootsRes.json());
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

  const updateShoot = async (shootId: number, status: string, delivery_link?: string) => {
    const token = localStorage.getItem("access_token");
    try {
      const payload: any = { status };
      if (delivery_link !== undefined) payload.delivery_link = delivery_link;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/${shootId}/`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShoots(shoots.map(s => s.id === shootId ? { ...s, status, delivery_link: delivery_link || s.delivery_link } : s));
      } else {
        alert("Failed to update shoot.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateProfileImage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const input = document.getElementById('profileImg') as HTMLInputElement;
    if (!input || !input.value) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profile_image_url: input.value })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        alert("Profile image updated successfully!");
      } else {
        alert("Failed to update profile image.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;

  // Determine the default profile image string, falling back to local files for seeded users
  const firstNameLower = (user?.first_name || user?.username || '').split(' ')[0].toLowerCase();
  const localFallback = ['aarav', 'neha', 'rohan', 'priya'].includes(firstNameLower) 
    ? `/team/${firstNameLower}.png` 
    : `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=random`;
  
  const profileImgSrc = user?.profile_image_url || localFallback;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <div className={`flex flex-1 ${user?.is_staff ? 'pt-[72px]' : ''}`}>
        {user?.is_staff && <AdminSidebar />}
        
        <main className={`flex-1 p-6 md:p-10 container mx-auto max-w-5xl ${!user?.is_staff ? 'pt-24 pb-20' : ''}`}>
          <div className="flex justify-between items-end mb-8">
            <h1 className="text-3xl font-bold">Photographer Portal</h1>
            <div className="flex items-center gap-4 bg-muted/30 p-2 pr-4 rounded-full border border-border/40">
              <img 
                src={profileImgSrc} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
              <span className="font-medium text-sm">Welcome, {user?.first_name || user?.username}!</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Profile & Availability */}
            <div className="space-y-8">
              
              {/* Profile Image Manager */}
              <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-xl overflow-hidden border border-border/60 shadow-inner bg-muted">
                  <img 
                    src={profileImgSrc} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=random` }}
                  />
                </div>
                
                <div className="flex-1 w-full">
                  <h2 className="text-lg font-bold mb-1">Profile Photo</h2>
                  <p className="text-xs text-muted-foreground mb-4">This photo will be displayed on the public About page.</p>
                  
                  <form onSubmit={updateProfileImage} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Unsplash or Image URL</label>
                      <input 
                        type="url" 
                        id="profileImg"
                        placeholder="https://images.unsplash.com/..." 
                        defaultValue={user?.profile_image_url || ""}
                        className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                      />
                    </div>
                    <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90">Save</button>
                  </form>
                </div>
              </div>

              {/* Availability Manager */}
              <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5"/> Manage Availability</h2>
            <form onSubmit={addSlot} className="flex gap-4 mb-6 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Date</label>
                <input type="date" required className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Time</label>
                <select className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                  <option value="09:00">9:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90">Add</button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {slots.length === 0 && <p className="text-sm text-muted-foreground italic">No availability slots set.</p>}
              {slots.map(slot => (
                <div key={slot.id} className="flex justify-between items-center bg-background border border-border/40 p-3 rounded-md">
                  <div>
                    <span className="font-semibold text-sm">{slot.date}</span>
                    <span className="ml-3 text-sm text-muted-foreground">{slot.time_slot}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {slot.is_booked ? (
                      <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">Booked</span>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">Available</span>
                        <button onClick={() => deleteSlot(slot.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Right Column: Assigned Shoots */}
          <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">My Assigned Shoots</h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {shoots.length === 0 && <p className="text-sm text-muted-foreground italic">No shoots assigned yet.</p>}
              
              {shoots.map(shoot => (
                <div key={shoot.id} className="bg-background border border-border/40 p-4 rounded-xl flex flex-col gap-4 shadow-sm">
                  <div className="flex justify-between items-start">
                     <div className="truncate max-w-[200px] md:max-w-xs">
                      <h3 className="font-bold text-primary truncate" title={shoot.property_address}>{shoot.property_address}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Scheduled Date: <span className="font-semibold text-foreground">{shoot.shoot_date}</span></p>
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${
                        shoot.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {shoot.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {shoot.notes && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md whitespace-pre-wrap">
                      {shoot.notes}
                    </div>
                  )}

                  {shoot.status !== 'delivered' && (
                    <div className="pt-3 border-t border-border/40">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Upload Media (Direct to R2)</label>
                      <div className="flex flex-col gap-3">
                        <input 
                          type="file" 
                          id={`file-${shoot.id}`}
                          accept=".zip,.rar,.mp4,.jpg,.jpeg,.png,.pdf"
                          className="flex-1 bg-background border border-border/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button 
                          onClick={async (e) => {
                            const btn = e.currentTarget;
                            const fileInput = document.getElementById(`file-${shoot.id}`) as HTMLInputElement;
                            const file = fileInput?.files?.[0];
                            
                            if (!file) {
                                alert("Please select a file to upload.");
                                return;
                            }

                            const btnOriginalText = btn.innerText;
                            btn.innerText = "Uploading...";
                            btn.disabled = true;

                            try {
                                const token = localStorage.getItem("access_token");
                                
                                // 1. Get Presigned POST URL from Django
                                const presignRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/${shoot.id}/get-upload-url/`, {
                                    method: "POST",
                                    headers: {
                                        "Authorization": `Bearer ${token}`,
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({ 
                                        file_name: file.name,
                                        file_type: file.type || 'application/octet-stream' 
                                    })
                                });

                                if (!presignRes.ok) throw new Error("Could not get upload credentials");
                                const { url, fields, object_key } = await presignRes.json();

                                // 2. Perform direct POST to Cloudflare R2
                                const formData = new FormData();
                                Object.keys(fields).forEach(key => formData.append(key, fields[key]));
                                formData.append("file", file); // File must be the last field appended

                                const uploadRes = await fetch(url, {
                                    method: "POST",
                                    body: formData
                                });

                                if (!uploadRes.ok) throw new Error(`R2 Upload failed. Status: ${uploadRes.status}`);

                                // 3. Update the Shoot status to delivered and clear the UI
                                await updateShoot(shoot.id, 'delivered');
                                fileInput.value = "";
                                alert("Media uploaded and delivered successfully!");

                            } catch (error) {
                                console.error(error);
                                alert("Upload failed: " + (error as any).message);
                            } finally {
                                btn.innerText = btnOriginalText;
                                btn.disabled = false;
                            }
                          }}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors self-start"
                        >
                          Upload File
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {shoot.status === 'delivered' && (
                    <div className="pt-3 border-t border-border/40 text-sm">
                      <span className="text-muted-foreground mr-2 p-2 bg-muted/40 rounded italic block">Media successfully uploaded into R2 bucket. The client will be able to download it securely from their portal once they pay the invoice for this shoot.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        </main>
      </div>
      {!user?.is_staff && <Footer />}
    </div>
  );
}
