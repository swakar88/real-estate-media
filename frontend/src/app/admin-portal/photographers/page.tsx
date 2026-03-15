"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Calendar as CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function AdminPhotographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPhotographer, setSelectedPhotographer] = useState<any>(null);
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  const removePhotographer = async (id: number, hard: boolean = false) => {
    const msg = hard 
      ? "PERMANENT DELETE: This will completely remove the photographer and their user account. This action cannot be undone. Proceed?" 
      : "Are you sure you want to deactivate this photographer?";
    
    if (!confirm(msg)) return;

    try {
      const token = localStorage.getItem("access_token");
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${id}/${hard ? '?hard=true' : ''}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        if (hard) {
          setPhotographers(photographers.filter(p => p.id !== id));
          if (selectedPhotographer?.id === id) setSelectedPhotographer(photographers.find(p => p.id !== id) || null);
        } else {
          setPhotographers(photographers.map(p => p.id === id ? { ...p, is_active: false } : p));
          if (selectedPhotographer?.id === id) setSelectedPhotographer({ ...selectedPhotographer, is_active: false });
        }
      }
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

  // Calendar Helpers
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Fill previous month days (to start on correct weekday)
    const firstDayIndex = date.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, current: false, dateStr: "" });
    }
    
    // Fill current month days
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      const d = new Date(year, month, i);
      const isoDate = d.toISOString().split('T')[0];
      days.push({ day: i, current: true, dateStr: isoDate });
    }
    
    // Fill next month days
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, current: false, dateStr: "" });
    }
    
    return days;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(next);
  };

  const selectedSlots = useMemo(() => 
    allSlots.filter(s => s.photographer === selectedPhotographer?.id),
    [allSlots, selectedPhotographer]
  );

  const getSlotsForDate = (dateStr: string) => {
    if (!dateStr) return [];
    return selectedSlots.filter(s => s.date === dateStr);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Photographers</h1>
            <p className="text-muted-foreground">Manage your team and their schedule availability.</p>
          </div>
          
          <button 
             onClick={() => setShowAddModal(true)}
             className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
             <Plus className="w-4 h-4" /> Add Team Member
          </button>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Photographers List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Team Directory</h2>
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm divide-y divide-border/30">
              {photographers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm italic">No team members.</div>
              ) : photographers.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotographer(photo)}
                  className={`w-full text-left p-4 transition-all relative group flex items-center gap-3 ${
                    selectedPhotographer?.id === photo.id 
                    ? 'bg-primary/5 border-l-4 border-l-primary' 
                    : 'hover:bg-muted/30 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                    ${photo.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {photo.user_name?.[0] || photo.first_name?.[0] || 'P'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold truncate text-sm">
                       {photo.user_name || `${photo.first_name} ${photo.last_name}`}
                    </div>
                    {!photo.is_active && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Inactive</span>}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {allSlots.filter(s => s.photographer === photo.id && !s.is_booked).length} Slots Available
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Availability Manager */}
          <div className="lg:col-span-3 space-y-6">
            {selectedPhotographer ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Header Info */}
                <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner
                         ${selectedPhotographer.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {selectedPhotographer.user_name?.[0] || selectedPhotographer.first_name?.[0] || "P"}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          {selectedPhotographer.user_name || `${selectedPhotographer.first_name} ${selectedPhotographer.last_name}`}
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{selectedPhotographer.email}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      {selectedPhotographer.is_active ? (
                        <button 
                          onClick={() => removePhotographer(selectedPhotographer.id)}
                          className="h-10 px-4 text-xs font-bold text-muted-foreground hover:text-amber-600 hover:bg-amber-600/10 rounded-xl transition-all border border-border/50 flex items-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4" /> Deactivate
                        </button>
                      ) : (
                         <div className="px-4 py-2 bg-destructive/10 text-destructive text-[10px] font-bold uppercase rounded-lg border border-destructive/20 select-none">
                            Inactive Profile
                         </div>
                      )}
                      
                      <button 
                        onClick={() => removePhotographer(selectedPhotographer.id, true)}
                        className="h-10 px-4 text-xs font-bold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-border/50 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4" /> Permanent Delete
                      </button>
                   </div>
                </div>

                {/* Calendar View */}
                <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                   <div className="flex-1 p-6">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                               <CalendarIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold">
                               {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h3>
                         </div>
                         <div className="flex bg-muted rounded-xl p-1 shadow-inner">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-background rounded-lg transition-all"><ChevronLeft className="w-4 h-4"/></button>
                            <button onClick={() => setCurrentMonth(new Date())} className="px-3 text-xs font-bold uppercase tracking-tight hover:bg-background rounded-lg transition-all">Today</button>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-background rounded-lg transition-all"><ChevronRight className="w-4 h-4"/></button>
                         </div>
                      </div>

                      <div className="grid grid-cols-7 gap-px bg-border/20 rounded-xl overflow-hidden border border-border/20">
                         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="bg-muted/30 p-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{day}</div>
                         ))}
                         {daysInMonth.map((dayObj, i) => {
                            const slots = getSlotsForDate(dayObj.dateStr);
                            const hasAvailable = slots.some(s => !s.is_booked);
                            const hasBooked = slots.some(s => s.is_booked);
                            
                            return (
                               <div key={i} 
                                    onClick={() => dayObj.dateStr && setDate(dayObj.dateStr)}
                                    className={`min-h-[80px] p-2 bg-card group relative transition-all cursor-pointer hover:bg-muted/20
                                       ${!dayObj.current ? 'opacity-20 pointer-events-none' : ''}
                                       ${date === dayObj.dateStr ? 'ring-2 ring-primary inset-0 z-10 rounded-md shadow-lg shadow-primary/20' : ''}
                                    `}>
                                  <span className={`text-[11px] font-bold ${date === dayObj.dateStr ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                     {dayObj.day}
                                  </span>
                                  
                                  <div className="mt-2 space-y-1">
                                     {hasAvailable && <div className="h-1.5 w-full bg-green-500 rounded-full opacity-60"></div>}
                                     {hasBooked && <div className="h-1.5 w-full bg-blue-500 rounded-full opacity-60"></div>}
                                  </div>
                                  
                                  {slots.length > 0 && (
                                     <div className="absolute bottom-1 right-2 text-[10px] font-black text-muted-foreground/30">
                                        {slots.length}
                                     </div>
                                  )}
                               </div>
                            );
                         })}
                      </div>
                   </div>

                   {/* Sidebar: Add/Remove Slots */}
                   <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/50 p-6 bg-muted/5 space-y-8">
                      <div>
                         <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Add Availability</h4>
                         <form onSubmit={addSlot} className="space-y-4">
                            <div>
                               <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Date</label>
                               <input 
                                 type="date" required 
                                 className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                 value={date} 
                                 onChange={e => setDate(e.target.value)} 
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                               <div>
                                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Range From</label>
                                  <select 
                                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50" 
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
                               <div>
                                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Range To</label>
                                  <select 
                                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50" 
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
                            </div>
                            <button 
                              type="submit" 
                              disabled={adding || !date || !selectedPhotographer?.is_active}
                              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                              {adding ? "Syncing..." : <><Plus className="w-4 h-4"/> Sync Slots</>}
                            </button>
                         </form>
                      </div>

                      <div className="space-y-4">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {date ? `Slots for ${new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Manage Selected Day'}
                         </h4>
                         <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {date ? (
                               getSlotsForDate(date).length === 0 ? (
                                  <div className="text-center py-10 opacity-40 italic text-xs">No slots on this day.</div>
                               ) : getSlotsForDate(date).sort((a,b) => a.time_slot.localeCompare(b.time_slot)).map(slot => (
                                  <div key={slot.id} className="flex items-center justify-between p-3 bg-background border border-border/40 rounded-xl group transition-all hover:border-border">
                                     <div className="flex items-center gap-3">
                                        <Clock className={`w-3.5 h-3.5 ${slot.is_booked ? 'text-blue-500' : 'text-green-500'}`} />
                                        <span className="text-sm font-bold">{slot.time_slot}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        {slot.is_booked ? (
                                           <span className="text-[9px] font-black uppercase text-blue-500 select-none">Booked</span>
                                        ) : (
                                           <button 
                                             onClick={() => deleteSlot(slot.id)}
                                             className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                             title="Delete Slot"
                                           >
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                        )}
                                     </div>
                                  </div>
                               ))
                            ) : (
                               <div className="text-center py-10 opacity-40 italic text-xs">Click a day on the calendar to manage.</div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/10 border-2 border-dashed border-border/50 rounded-3xl h-[600px] flex flex-col items-center justify-center text-center p-8">
                 <div className="bg-muted/50 p-6 rounded-3xl mb-4 text-muted-foreground/30 ring-8 ring-muted/20">
                    <Users className="w-16 h-16" />
                 </div>
                 <h3 className="text-2xl font-bold text-foreground mb-2">No Member Selected</h3>
                 <p className="text-muted-foreground text-sm max-w-sm">Select a photographer from the team directory to manage their schedules, availability and profile status.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add Photographer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border/50 p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-1">Add Team Member</h2>
            <p className="text-sm text-muted-foreground mb-8">Send an invitation to join the platform.</p>
            
            <form onSubmit={addPhotographer} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1">First Name</label>
                  <input 
                    type="text" required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                    placeholder="John"
                    value={newPhotoData.first_name} 
                    onChange={e => setNewPhotoData({...newPhotoData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1">Last Name</label>
                  <input 
                    type="text" required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                    placeholder="Doe"
                    value={newPhotoData.last_name} 
                    onChange={e => setNewPhotoData({...newPhotoData, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider ml-1">Email <span className="font-normal">(System ID)</span></label>
                <input 
                  type="email" required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                  placeholder="john@kcrealestatemedia.com"
                  value={newPhotoData.email} 
                  onChange={e => setNewPhotoData({...newPhotoData, email: e.target.value})}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-xl border border-border/50 text-[11px] text-muted-foreground flex gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 text-primary" />
                <p>The photographer will receive an email to activate their account and set their private credentials.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 py-3 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
                  disabled={addingPhoto || !newPhotoData.first_name || !newPhotoData.email}
                >
                  {addingPhoto ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
