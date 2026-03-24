"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Calendar as CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight, Clock, AlertTriangle, ShieldAlert, DollarSign, Percent, Upload, Award, CheckCircle2, Eye, History, Trash } from "lucide-react";
import Link from "next/link";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import CustomModal from "@/components/CustomModal";

export default function AdminPhotographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPhotographer, setSelectedPhotographer] = useState<any>(null);
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timeFrom, setTimeFrom] = useState("09:00");
  const [timeTo, setTimeTo] = useState("17:00");
  const [adding, setAdding] = useState(false);

  // Photographer Management State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhotoData, setNewPhotoData] = useState({ first_name: "", last_name: "", email: "" });
  const [addingPhoto, setAddingPhoto] = useState(false);
  
  // Payment History State
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: "", payment_date: new Date().toISOString().split('T')[0], reference_number: "", notes: "" });
  const [pendingShoots, setPendingShoots] = useState<any[]>([]);

  // Modal states
  const [modalConfig, setModalConfig] = useState<any>({ 
    isOpen: false, 
    title: "", 
    message: "", 
    type: "info", 
    onConfirm: null,
    showCancel: true,
    confirmText: "Confirm",
    cancelText: "Cancel"
  });

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
        if (photoData.length > 0) {
            setSelectedPhotographer(photoData[0]);
            fetchPayments(photoData[0].id);
            fetchPendingShoots(photoData[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (photographerId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer-payments/?photographer=${photographerId}`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // The API returns all payments if admin, so we might need to client-side filter
        // although our viewset get_queryset could be improved to filter by photographer id from query params
        setPayments(data.filter((p: any) => p.photographer === photographerId));
      }
    } catch (err) {
      console.error("Failed to fetch payments", err);
    }
  };

  const fetchPendingShoots = async (photographerId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/?photographer=${photographerId}`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter for unpaid/partial delivered/archived
        setPendingShoots(data.filter((s: any) => 
            (s.status === 'delivered' || s.status === 'archived') && 
            s.photographer_payment_status !== 'paid'
        ));
      }
    } catch (err) {
      console.error("Failed to fetch pending shoots", err);
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
        setModalConfig({
            isOpen: true,
            title: "Invalid Range",
            message: "The 'End Time' must be after the 'Start Time' for slot synchronization.",
            type: "warning",
            showCancel: false
        });
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
         setModalConfig({
             isOpen: true,
             title: "Partial Success",
             message: "Some slots could not be added. This usually happens if they were already scheduled for this photographer on this day.",
             type: "warning",
             showCancel: false
         });
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
    const title = hard ? "Delete Photographer" : "Deactivate Profile";
    const msg = hard
      ? "⚠️ This will permanently delete the photographer and all associated data. This cannot be undone. Are you sure you want to proceed?"
      : "Are you sure you want to deactivate this photographer?";
    
    setModalConfig({
        isOpen: true,
        title,
        message: msg,
        type: hard ? 'error' : 'warning',
        onConfirm: async () => {
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
              } else {
                  const data = await res.json();
                  setModalConfig({
                      isOpen: true,
                      title: "Error",
                      message: data.detail || data[0] || "Failed to delete photographer.",
                      type: "error",
                      showCancel: false
                  });
              }
            } catch (err) {
              console.error(err);
            }
        }
    });
  };

  const updatePhotographer = async (id: number, data: any) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${id}/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        setPhotographers(photographers.map(p => p.id === id ? updated : p));
        setSelectedPhotographer(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhotographer) return;
    setRecordingPayment(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer-payments/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...paymentData,
          photographer: selectedPhotographer.id,
          amount: parseFloat(paymentData.amount)
        })
      });
      
      if (res.ok) {
        const newPayment = await res.json();
        setPayments([newPayment, ...payments]);
        setPaymentData({ amount: "", payment_date: new Date().toISOString().split('T')[0], reference_number: "", notes: "" });
        
        // Refresh photographer to get updated total_paid
        const photoRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${selectedPhotographer.id}/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (photoRes.ok) {
            const updated = await photoRes.json();
            setPhotographers(photographers.map(p => p.id === selectedPhotographer.id ? updated : p));
            setSelectedPhotographer(updated);
            fetchPendingShoots(selectedPhotographer.id);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setModalConfig({
            isOpen: true,
            title: "Payment Error",
            message: errorData.detail || "Failed to record the payment record. Please check the amount and try again.",
            type: "error",
            showCancel: false
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecordingPayment(false);
    }
  };

  const deletePayment = async (id: number) => {
    setModalConfig({
        isOpen: true,
        title: "Delete Payment Record",
        message: "Are you sure you want to delete this payment record? The photographer's balance will be adjusted.",
        type: "warning",
        onConfirm: async () => {
            try {
              const token = localStorage.getItem("access_token");
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer-payments/${id}/`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
              });
              
              if (res.ok) {
                setPayments(payments.filter(p => p.id !== id));
                // Refresh photographer to get updated total_paid
                const photoRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${selectedPhotographer.id}/`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (photoRes.ok) {
                    const updated = await photoRes.json();
                    setPhotographers(photographers.map(p => p.id === selectedPhotographer.id ? updated : p));
                    setSelectedPhotographer(updated);
                    fetchPendingShoots(selectedPhotographer.id);
                }
              }
            } catch (err) {
              console.error(err);
            }
        }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedPhotographer) return;
    const file = e.target.files[0];
    try {
      const token = localStorage.getItem("access_token");
      const urlRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/get-upload-url/?filename=profile_photographer_${selectedPhotographer.id}_${file.name}&contentType=${encodeURIComponent(file.type)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!urlRes.ok) return;
      const { upload_url, public_url } = await urlRes.json();
      await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/${selectedPhotographer.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ profile_image_url: public_url }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhotographers(photographers.map(p => p.id === selectedPhotographer.id ? updated : p));
        setSelectedPhotographer(updated);
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
        const errorData = await res.json().catch(() => ({}));
        setModalConfig({
            isOpen: true,
            title: "Error Adding Member",
            message: errorData.detail || errorData.email?.[0] || "We couldn't add the team member. Usually this happens if the email is already in use.",
            type: "error",
            showCancel: false
        });
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
             className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-gold active:scale-95"
          >
             <Plus className="w-5 h-5" /> Add Team Member
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
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 mb-4 flex items-center gap-2">
              <Users className="w-3 h-3 text-primary" />
              Team Directory
            </h2>
            <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2rem] overflow-hidden shadow-gold divide-y divide-primary/5">
              {photographers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm italic">No team members.</div>
              ) : photographers.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setSelectedPhotographer(photo);
                    fetchPayments(photo.id);
                    fetchPendingShoots(photo.id);
                  }}
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
                <div className="bg-card/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-primary/20 shadow-gold flex flex-col md:flex-row md:items-center justify-between gap-8">
                   <div className="flex items-center gap-6">
                      <div className="relative group/img">
                         <div className={`h-20 w-20 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-inner border border-primary/10 overflow-hidden
                            ${selectedPhotographer.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                           {selectedPhotographer.profile_image_url ? (
                              <img src={selectedPhotographer.profile_image_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                              selectedPhotographer.user_name?.[0] || selectedPhotographer.first_name?.[0] || "P"
                           )}
                         </div>
                         <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer rounded-[1.5rem]">
                            <Upload className="w-6 h-6" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                         </label>
                      </div>
                      <div>
                        <h2 className="text-3xl font-black italic text-foreground flex items-center gap-3">
                          {selectedPhotographer.user_name || `${selectedPhotographer.first_name} ${selectedPhotographer.last_name}`}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                           <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full">
                              {selectedPhotographer.email}
                           </p>
                           <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                              <Award className="w-3 h-3 text-amber-500" />
                              ID: {selectedPhotographer.id}
                           </div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-3">
                      <Link 
                        href={`/photographer-portal?impersonate_id=${selectedPhotographer.user}`}
                        className="h-12 px-6 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-gold group border border-primary/30"
                      >
                        <Eye className="w-4 h-4 transition-transform group-hover:scale-110" />
                        View as Photographer
                      </Link>
                      {selectedPhotographer.is_active ? (
                        <button 
                          onClick={() => removePhotographer(selectedPhotographer.id)}
                          className="h-12 px-5 text-[10px] font-black uppercase tracking-widest bg-warning text-primary-foreground hover:opacity-90 rounded-xl transition-all border border-warning/30 flex items-center gap-2 active:scale-95 shadow-lg group"
                        >
                          <AlertTriangle className="w-4 h-4 transition-transform group-hover:rotate-12" /> Deactivate
                        </button>
                      ) : (
                         <div className="px-5 py-3 bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest rounded-xl border border-destructive/20 select-none">
                            Inactive Profile
                         </div>
                      )}
                      
                      {selectedPhotographer.booking_count === 0 && (
                        <button 
                            onClick={() => removePhotographer(selectedPhotographer.id, true)}
                            className="h-12 px-5 text-[10px] font-black uppercase tracking-widest bg-destructive text-destructive-foreground hover:opacity-90 rounded-xl transition-all border border-destructive/30 flex items-center gap-2 active:scale-95 shadow-lg group"
                        >
                            <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" /> Delete
                        </button>
                      )}
                   </div>
                </div>

                {/* Financial Overview Section Header */}
                <div className="flex items-center gap-3 mt-4 mb-2">
                  <div className="h-px flex-1 bg-primary/10"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Financial Performance</h3>
                  <div className="h-px flex-1 bg-primary/10"></div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="bg-card/80 backdrop-blur-sm p-6 rounded-3xl border border-primary/20 shadow-gold flex items-center gap-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                         <Percent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Share Setting</p>
                         <div className="flex items-center gap-2">
                            <input 
                               type="number" 
                               className="bg-transparent font-black italic text-xl w-16 focus:outline-none focus:text-primary transition-colors"
                               value={Math.round(selectedPhotographer.share_percentage || 0)}
                               onChange={(e) => updatePhotographer(selectedPhotographer.id, { share_percentage: parseInt(e.target.value) || 0 })}
                            />
                            <span className="font-black text-xl italic text-primary">%</span>
                         </div>
                      </div>
                   </div>
                   <div className="bg-card/80 backdrop-blur-sm p-6 rounded-3xl border border-primary/20 shadow-gold flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                         <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Earned</p>
                         <p className="font-black italic text-xl">${parseFloat(selectedPhotographer.total_earned || 0).toFixed(2)}</p>
                      </div>
                   </div>
                    <div className="bg-card/80 backdrop-blur-sm p-6 rounded-3xl border border-primary/20 shadow-gold flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                            <CheckCircle2 className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Paid</p>
                            <p className="font-black italic text-xl">${parseFloat(selectedPhotographer.total_paid || 0).toFixed(2)}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Calendar View - moved above payment history */}
                <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] shadow-gold overflow-hidden flex flex-col md:flex-row min-h-[500px]">
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

                      <div className="grid grid-cols-7 gap-px bg-primary/10 rounded-2xl overflow-hidden border border-primary/20 shadow-inner">
                         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="bg-primary/5 p-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{day}</div>
                         ))}
                         {daysInMonth.map((dayObj, i) => {
                            const slots = getSlotsForDate(dayObj.dateStr);
                            const hasAvailable = slots.some(s => !s.is_booked);
                            const hasBooked = slots.some(s => s.is_booked);
                            
                            return (
                               <div key={i} 
                                    onClick={() => dayObj.dateStr && setDate(dayObj.dateStr)}
                                    className={`min-h-[100px] p-3 bg-card group relative transition-all cursor-pointer hover:bg-primary/5
                                       ${!dayObj.current ? 'opacity-10 pointer-events-none' : ''}
                                       ${date === dayObj.dateStr ? 'bg-primary/10 ring-2 ring-primary inset-0 z-10' : ''}
                                    `}>
                                  <span className={`text-[11px] font-bold ${date === dayObj.dateStr ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                     {dayObj.day}
                                  </span>
                                  
                                  <div className="mt-2 space-y-1">
                                     {hasAvailable && <div className="h-1.5 w-full bg-success rounded-full opacity-60"></div>}
                                     {hasBooked && <div className="h-1.5 w-full bg-info rounded-full opacity-60"></div>}
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
                               <div className="relative">
                                 <input
                                   type="date" required
                                   className="w-full bg-background border border-primary/10 rounded-xl px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                   value={date}
                                   onChange={e => setDate(e.target.value)}
                                 />
                                 <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                               <div>
                                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Range From</label>
                                  <select 
                                    className="w-full bg-background text-foreground border border-primary/10 rounded-xl px-3 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer" 
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
                                    className="w-full bg-background text-foreground border border-primary/10 rounded-xl px-3 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer" 
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
                            {date ? (() => {
                               const [y, m, d] = date.split('-');
                               const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                               return `Slots for ${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                            })() : 'Manage Selected Day'}
                         </h4>
                         <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {date ? (
                               getSlotsForDate(date).length === 0 ? (
                                  <div className="text-center py-10 opacity-40 italic text-xs">No slots on this day.</div>
                               ) : getSlotsForDate(date).sort((a,b) => a.time_slot.localeCompare(b.time_slot)).map(slot => (
                                  <div key={slot.id} className="flex items-center justify-between p-4 bg-black/40 border border-primary/10 rounded-2xl group transition-all hover:border-primary/30 shadow-inner">
                                     <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${slot.is_booked ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>
                                           <Clock className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-black italic">{slot.time_slot}</span>
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
                {/* Payment History Section - below calendar */}
                <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] shadow-gold overflow-hidden">
                  <div className="p-8 border-b border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black italic tracking-tight">Payment History</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Historical records of all manual & automated payouts</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${
                        selectedPhotographer.stripe_account_id
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${selectedPhotographer.stripe_account_id ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedPhotographer.stripe_account_id ? 'Stripe Connected' : 'Manual Payouts Only'}</span>
                      </div>
                      <button
                        onClick={() => setShowPayoutForm(v => !v)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-gold"
                      >
                        <DollarSign className="w-4 h-4" /> Record Payout
                      </button>
                    </div>
                  </div>

                  {showPayoutForm && (
                    <div className="p-8 border-b border-primary/10 bg-primary/5">
                      <p className="text-[10px] text-muted-foreground/60 mb-5 leading-relaxed">Use this for Zelle, Checks, or Cash payments. Automated Stripe splits are logged here automatically.</p>
                      <form onSubmit={(e) => { recordPayment(e); setShowPayoutForm(false); }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1">Amount ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <input type="number" step="0.01" required className="w-full bg-background/50 border border-primary/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} placeholder="0.00" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1">Payment Date</label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <input type="date" required className="w-full bg-background/50 border border-primary/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" value={paymentData.payment_date} onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1">Ref # / Method</label>
                          <input type="text" className="w-full bg-background/50 border border-primary/10 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" value={paymentData.reference_number} onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })} placeholder="Zelle, Check #, etc." />
                        </div>
                        <button type="submit" disabled={recordingPayment || !paymentData.amount} className="flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-gold hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50">
                          {recordingPayment ? "Recording..." : <><CheckCircle2 className="h-4 w-4" /> Confirm</>}
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="p-8 overflow-x-auto">
                    {payments.length === 0 ? (
                      <div className="py-20 text-center bg-muted/5 rounded-[2.5rem] border border-dashed border-border/40 text-sm italic opacity-40">No payout records found for this photographer.</div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-primary/10">
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Date</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Photographer Share</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Our Cut</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Ref / Method</th>
                            <th className="px-4 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                          {payments.map((p: any) => {
                            const photoPct = parseFloat(selectedPhotographer.share_percentage || 0) / 100;
                            const photoAmt = parseFloat(p.amount);
                            const ourCut = photoPct > 0 ? (photoAmt / photoPct) * (1 - photoPct) : 0;
                            return (
                              <tr key={p.id} className="hover:bg-primary/5 transition-colors group/row">
                                <td className="px-4 py-4 font-bold whitespace-nowrap">
                                  {(() => { const [y, m, d] = p.payment_date.split('-'); return new Date(parseInt(y), parseInt(m)-1, parseInt(d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); })()}
                                </td>
                                <td className="px-4 py-4 text-emerald-500 font-black italic text-sm">${photoAmt.toFixed(2)}</td>
                                <td className="px-4 py-4 text-primary font-black italic text-sm">${ourCut.toFixed(2)}</td>
                                <td className="px-4 py-4">
                                  <div className="font-bold text-foreground/80">{p.reference_number || 'N/A'}</div>
                                  {p.notes && <div className="text-[10px] text-muted-foreground line-clamp-1 italic" title={p.notes}>{p.notes}</div>}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <button onClick={() => deletePayment(p.id)} className="p-2 text-destructive opacity-0 group-hover/row:opacity-100 hover:bg-destructive/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] shadow-gold-heavy border border-primary/20 p-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-black italic mb-2">Add <span className="text-primary">Team Member</span></h2>
            <p className="text-sm text-muted-foreground mb-8">Send an invitation to join the platform.</p>
            
            <form onSubmit={addPhotographer} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1">First Name</label>
                  <input 
                    type="text" required
                    className="w-full rounded-xl border border-primary/10 bg-black/40 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner"
                    placeholder="John"
                    value={newPhotoData.first_name} 
                    onChange={e => setNewPhotoData({...newPhotoData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1">Last Name</label>
                  <input 
                    type="text" required
                    className="w-full rounded-xl border border-primary/10 bg-black/40 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner"
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
                  className="w-full rounded-xl border border-primary/10 bg-black/40 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner"
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
      {/* Payment History & Recording Modal */}
      {showPaymentModal && selectedPhotographer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-4xl rounded-[2.5rem] shadow-gold-heavy border border-primary/20 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                    <div>
                        <h2 className="text-3xl font-black italic">Payment <span className="text-primary">History</span></h2>
                        <p className="text-sm text-muted-foreground">Managing payouts for {selectedPhotographer.user_name || `${selectedPhotographer.first_name} ${selectedPhotographer.last_name}`}</p>
                    </div>
                    <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground">
                        <Plus className="w-6 h-6 rotate-45" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: History List */}
                    <div className="space-y-6 flex flex-col h-full">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Recent Transactions</h3>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {payments.length === 0 ? (
                                <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border/50 text-sm italic opacity-40">No payments recorded yet.</div>
                            ) : (
                                <div className="bg-black/20 rounded-2xl border border-primary/10 overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-primary/5 border-b border-primary/10">
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-[10px] text-muted-foreground">Date</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-[10px] text-muted-foreground">Amount</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-[10px] text-muted-foreground">Ref / Notes</th>
                                                <th className="px-4 py-3 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-primary/5">
                                            {payments.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-primary/5 transition-colors group/row">
                                                    <td className="px-4 py-3 font-bold whitespace-nowrap">
                                                        {(() => {
                                                            const [y, m, d] = p.payment_date.split('-');
                                                            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString();
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-emerald-500 font-black italic">
                                                        ${parseFloat(p.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-foreground/80">{p.reference_number || '-'}</div>
                                                        {p.notes && <div className="text-[9px] text-muted-foreground line-clamp-1 italic" title={p.notes}>{p.notes}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button 
                                                            onClick={() => deletePayment(p.id)} 
                                                            className="p-1.5 text-destructive opacity-0 group-hover/row:opacity-100 hover:bg-destructive/10 rounded-lg transition-all"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Record Form */}
                    <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Record New Payment</h3>
                        <form onSubmit={recordPayment} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Amount ($)</label>
                                    <input 
                                        type="number" step="0.01" required
                                        className="w-full bg-background border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="0.00"
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Date</label>
                                    <div className="relative">
                                      <input
                                          type="date" required
                                          className="w-full bg-background border border-primary/10 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                          value={paymentData.payment_date}
                                          onChange={e => setPaymentData({...paymentData, payment_date: e.target.value})}
                                      />
                                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Reference Number (Optional)</label>
                                <input 
                                    type="text"
                                    className="w-full bg-background border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Check # or Transaction ID"
                                    value={paymentData.reference_number}
                                    onChange={e => setPaymentData({...paymentData, reference_number: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Notes</label>
                                <textarea 
                                    className="w-full bg-background border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none"
                                    placeholder="Add any internal payout notes..."
                                    value={paymentData.notes}
                                    onChange={e => setPaymentData({...paymentData, notes: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={recordingPayment || !paymentData.amount}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-gold active:scale-95 disabled:opacity-50"
                            >
                                {recordingPayment ? "Recording..." : "Confirm Payment Payout"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* Reusable Custom Modal */}
      <CustomModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        showCancel={modalConfig.showCancel}
      />
    </div>
  );
}
