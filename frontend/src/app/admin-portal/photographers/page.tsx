"use client";

import { useEffect, useState } from "react";
import { Users, Calendar, Plus, Trash2 } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function AdminPhotographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPhotographer, setSelectedPhotographer] = useState<any>(null);
  
  const [date, setDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("09:00");
  const [timeTo, setTimeTo] = useState("17:00");
  const [adding, setAdding] = useState(false);

  // Photographer Management State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhotoData, setNewPhotoData] = useState({ first_name: "", last_name: "", email: "" });
  const [addingPhoto, setAddingPhoto] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      
      const [photoRes, slotsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/`, {
            headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
      ]);
      
      if (photoRes.ok && slotsRes.ok) {
        const photoData = await photoRes.json();
        const slotsData = await slotsRes.json();
        setPhotographers(photoData);
        setAllSlots(slotsData);
        if (photoData.length > 0) setSelectedPhotographer(photoData[0]);
      }
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhotographer) return;
    setAdding(true);
    
    // Define all available valid slots
    const validSlots = ["09:00", "11:00", "13:00", "15:00", "17:00"];
    
    const startIndex = validSlots.indexOf(timeFrom);
    const endIndex = validSlots.indexOf(timeTo);
    
    if (startIndex > endIndex) {
        alert("End time must be after start time");
        setAdding(false);
        return;
    }
    
    const slotsToAdd = validSlots.slice(startIndex, endIndex + 1);
    
    try {
      const token = localStorage.getItem("access_token");
      
      const promises = slotsToAdd.map(slot => 
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                date, 
                time_slot: slot, 
                photographer_id: selectedPhotographer.id 
            })
          })
      );
      
      const results = await Promise.allSettled(promises);
      const newSlots: any[] = [];
      let hadError = false;
      
      for (const result of results) {
          if (result.status === 'fulfilled' && result.value.ok) {
              newSlots.push(await result.value.json());
          } else {
              hadError = true;
          }
      }

      if (newSlots.length > 0) {
        setAllSlots(prev => [...prev, ...newSlots]);
      }
      
      if (hadError) {
        alert("Some slots failed to add. They might already exist.");
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const deleteSlot = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/${id}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setAllSlots(allSlots.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const addPhotographer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPhoto(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPhotoData)
      });
      
      if (res.ok) {
        const newPhoto = await res.json();
        setPhotographers([...photographers, newPhoto]);
        setShowAddModal(false);
        setNewPhotoData({ first_name: "", last_name: "", email: "" });
        setSelectedPhotographer(newPhoto);
      } else {
        alert("Failed to add photographer.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingPhoto(false);
    }
  };

  const removePhotographer = async (id: number) => {
    if (!confirm("Are you sure you want to remove this photographer? They will be marked as inactive.")) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${id}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setPhotographers(photographers.map(p => p.id === id ? { ...p, is_active: false } : p));
        if (selectedPhotographer?.id === id) {
          setSelectedPhotographer({ ...selectedPhotographer, is_active: false });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedSlots = allSlots.filter(s => s.photographer === selectedPhotographer?.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Photographers</h1>
            <p className="text-muted-foreground">Manage your team and their schedule availability.</p>
          </div>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Photographers List */}
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm flex flex-col h-fit">
            <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4" /> Team Members</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="text-xs font-medium bg-primary text-primary-foreground px-2.5 py-1 rounded hidden lg:flex items-center gap-1 hover:bg-primary/90 transition-colors"
                title="Add Photographer"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
              {photographers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                   No photographers found. 
                </div>
              ) : photographers.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotographer(photo)}
                  className={`w-full text-left px-5 py-4 transition-colors relative group ${
                    selectedPhotographer?.id === photo.id 
                    ? 'bg-primary/10 border-l-2 border-l-primary' 
                    : 'hover:bg-muted/30 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold flex items-center gap-2">
                       {photo.user_name || `Photographer #${photo.id}`}
                       {!photo.is_active && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {allSlots.filter(s => s.photographer === photo.id && !s.is_booked).length} available slots
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-border/50 lg:hidden">
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full text-sm font-medium bg-primary text-primary-foreground py-2 rounded flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Team Member
              </button>
            </div>
          </div>

          {/* Availability Manager */}
          <div className="lg:col-span-2">
            {selectedPhotographer ? (
              <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-3">
                     <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${selectedPhotographer.is_active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                       {selectedPhotographer.user_name?.[0] || selectedPhotographer.first_name?.[0] || "P"}
                     </div>
                     <div>
                       <h2 className="text-xl font-bold flex items-center gap-2">
                         {selectedPhotographer.user_name || selectedPhotographer.first_name || "Unknown"}
                         {!selectedPhotographer.is_active && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded font-bold uppercase tracking-wider">Inactive</span>}
                       </h2>
                       <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> Managing Schedule</p>
                     </div>
                  </div>
                  
                  {selectedPhotographer.is_active && (
                    <button 
                      onClick={() => removePhotographer(selectedPhotographer.id)}
                      className="text-xs font-medium text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-destructive/20 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                
                {selectedPhotographer.is_active ? (
                  <>
                  <form onSubmit={addSlot} className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
                    <input 
                      type="date" required 
                      className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Time</label>
                    <select 
                      className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                      value={timeFrom} 
                      onChange={e => setTimeFrom(e.target.value)}
                    >
                      <option value="09:00">9:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Time</label>
                    <select 
                      className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                      value={timeTo} 
                      onChange={e => setTimeTo(e.target.value)}
                    >
                      <option value="09:00">9:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                  </div>
                  <div className="sm:pt-6">
                    <button 
                      type="submit" 
                      disabled={adding}
                      className="w-full sm:w-auto bg-primary text-primary-foreground px-5 py-2 rounded-md font-medium flex items-center justify-center gap-2 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {adding ? "Adding..." : <><Plus className="w-4 h-4"/> Add Slot</>}
                    </button>
                  </div>
                </form>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/20 pb-2">Upcoming Slots</h3>
                  {selectedSlots.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-border/50 rounded-lg text-muted-foreground text-sm">
                      No availability slots assigned.
                    </div>
                  )}
                  {selectedSlots.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(slot => (
                    <div key={slot.id} className="flex justify-between items-center bg-background border border-border/40 hover:border-border/80 p-3 rounded-lg transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted/30 px-3 py-1.5 rounded-md text-sm font-semibold border border-border/50 shadow-sm">
                          {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <span className="text-sm font-medium">{slot.time_slot}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {slot.is_booked ? (
                          <span className="text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-md border border-destructive/20">Booked</span>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">Available</span>
                            <button 
                              onClick={() => deleteSlot(slot.id)} 
                              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 p-1 bg-muted/50 rounded hover:bg-destructive/10"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground border border-dashed border-border/50 rounded-lg">
                    <p className="font-medium text-foreground mb-1">Photographer is inactive.</p>
                    <p className="text-sm">They can no longer log in or be assigned to shoots.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/10 border border-dashed border-border/50 rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6">
                 <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                 <h3 className="text-lg font-medium text-foreground mb-1">No Photographer Selected</h3>
                 <p className="text-sm text-muted-foreground max-w-sm">Select a team member from the list to view and manage their schedule availability.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add Photographer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border/50 p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4">Add Team Member</h2>
            <form onSubmit={addPhotographer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input 
                    type="text" required
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. John"
                    value={newPhotoData.first_name} 
                    onChange={e => setNewPhotoData({...newPhotoData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input 
                    type="text" required
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Doe"
                    value={newPhotoData.last_name} 
                    onChange={e => setNewPhotoData({...newPhotoData, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email <span className="text-xs font-normal text-muted-foreground">(Used for login)</span></label>
                <input 
                  type="email" required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. john@kcrealestatemedia.com"
                  value={newPhotoData.email} 
                  onChange={e => setNewPhotoData({...newPhotoData, email: e.target.value})}
                />
              </div>

              <div className="bg-muted/30 p-3 rounded border border-border/50 mb-2">
                <p className="text-xs text-muted-foreground">The photographer's generated password will default to: <strong className="text-foreground">kcmedia123!</strong></p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  disabled={addingPhoto}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  disabled={addingPhoto || !newPhotoData.first_name || !newPhotoData.email}
                >
                  {addingPhoto ? (
                    <>Adding...</>
                  ) : (
                    <>Add Photographer</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
