"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, Search, CalendarCheck, MapPin, Mail, Phone, AlertCircle, User as UserIcon, MessageSquare, RefreshCw, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import CustomModal from "@/components/CustomModal";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'historical'>('active');
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" as any });
  const [completionModal, setCompletionModal] = useState({ isOpen: false, bookingId: null as number | null, notes: "" });
  const [newBookingModal, setNewBookingModal] = useState(false);
  const [newBookingLoading, setNewBookingLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [newBookingForm, setNewBookingForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    package_interest: "", property_details: "",
    shoot_date: "", time_slot: "", assigned_photographer: "", sqft: "",
  });

  const fetchDropdowns = async () => {
    const token = localStorage.getItem("access_token");
    const [pkgRes, photoRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/packages/`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (pkgRes.ok) setPackages(await pkgRes.json());
    if (photoRes.ok) setPhotographers(await photoRes.json());
  };

  const submitNewBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewBookingLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const body: any = {
        first_name: newBookingForm.first_name,
        last_name: newBookingForm.last_name,
        email: newBookingForm.email,
        phone: newBookingForm.phone,
        property_details: newBookingForm.property_details,
      };
      if (newBookingForm.package_interest) body.package_interest = parseInt(newBookingForm.package_interest);
      if (newBookingForm.shoot_date) body.shoot_date = newBookingForm.shoot_date;
      if (newBookingForm.time_slot) body.time_slot = newBookingForm.time_slot;
      if (newBookingForm.assigned_photographer) body.assigned_photographer = parseInt(newBookingForm.assigned_photographer);
      if (newBookingForm.sqft) body.sqft = parseInt(newBookingForm.sqft);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Booking created successfully");
        setNewBookingModal(false);
        setNewBookingForm({ first_name: "", last_name: "", email: "", phone: "", package_interest: "", property_details: "", shoot_date: "", time_slot: "", assigned_photographer: "", sqft: "" });
        fetchBookings();
      } else {
        const err = await res.json();
        toast.error(err.detail || Object.values(err).flat().join(", ") || "Failed to create booking.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setNewBookingLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      } else {
        if (res.status === 401) setError("Session expired. Please log in again.");
        else setError("Failed to load bookings.");
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchDropdowns();
  }, []);

  const updateStatus = async (id: number, newStatus: string, notes: string = "") => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/${id}/`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          status: newStatus,
          completion_notes: notes 
        })
      });
      
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus, completion_notes: notes } : b));
        setCompletionModal({ isOpen: false, bookingId: null, notes: "" });
      } else {
        const errorData = await res.json();
        setModalConfig({
          isOpen: true,
          title: "Update Failed",
          message: errorData.completion_notes || errorData.detail || "Failed to update booking status.",
          type: "error"
        });
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleComplete = (booking: any) => {
    if (booking.payment_status !== 'paid') {
      setCompletionModal({
        isOpen: true,
        bookingId: booking.id,
        notes: ""
      });
    } else {
      updateStatus(booking.id, 'completed');
    }
  };

  const filteredBookings = (bookings || [])
    .filter(b => {
      const s = searchTerm.toLowerCase().trim();
      const matchesSearch = !s || 
        (b.first_name || '').toLowerCase().includes(s) || 
        (b.last_name || '').toLowerCase().includes(s) ||
        (b.property_details || '').toLowerCase().includes(s);
      
      const status = (b.status || '').toLowerCase().trim();
      const isHistorical = status === 'completed' || status === 'cancelled';
      const isMatch = filter === 'historical' ? isHistorical : !isHistorical;
      
      return matchesSearch && isMatch;
    })
    .sort((a, b) => {
       const dateA = a.shoot_date ? new Date(a.shoot_date).getTime() : new Date(a.created_at).getTime();
       const dateB = b.shoot_date ? new Date(b.shoot_date).getTime() : new Date(b.created_at).getTime();
       return (dateB || 0) - (dateA || 0); // Newest first
    });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Booking Requests</h1>
            <p className="text-muted-foreground">Review and manage incoming shoot requests.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-primary/20 rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-full sm:w-64 transition-all shadow-gold"
              />
            </div>
            <button
              onClick={() => setNewBookingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Booking
            </button>
            
            <div className="flex bg-muted p-1 rounded-lg">
              <button 
                onClick={() => setFilter('active')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filter === 'active' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('historical')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filter === 'historical' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Historical
              </button>
            </div>
            
            <button 
              onClick={fetchBookings}
              className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground border border-border/50"
              title="Refresh Bookings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-center text-sm font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center flex-col items-center gap-4">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
           <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Bookings...</p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 gap-4">
          {filteredBookings.map((booking) => (
            <StaggerItem key={booking.id}>
              <div className={`bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] p-8 md:p-10 shadow-gold hover:shadow-gold-heavy transition-all group relative border-l-4 overflow-hidden ${
                booking.status === 'pending' ? 'border-l-warning' : 
                booking.status === 'confirmed' ? 'border-l-info' : 
                booking.status === 'completed' ? 'border-l-success' : 
                'border-l-error'
              }`}>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider
                        ${booking.status === 'pending' ? 'bg-warning/10 text-warning' : ''}
                        ${booking.status === 'confirmed' ? 'bg-info/10 text-info' : ''}
                        ${booking.status === 'completed' ? 'bg-success/10 text-success' : ''}
                        ${booking.status === 'cancelled' ? 'bg-error/10 text-error' : ''}
                      `}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {booking.payment_status === 'paid' && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Paid
                        </span>
                      )}
                      {booking.status === 'completed' && booking.payment_status !== 'paid' && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Unpaid (Manual)
                        </span>
                      )}
                      
                      {booking.shoot_date && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-full">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          {new Date(booking.shoot_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {booking.time_slot}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {booking.first_name} {booking.last_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-3">
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary/60" />
                            <span className="max-w-[300px] truncate" title={booking.property_details}>{booking.property_details}</span>
                         </div>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                            <Mail className="w-4 h-4 text-primary/60" />
                            <a href={`mailto:${booking.email}`}>{booking.email}</a>
                         </div>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                            <Phone className="w-4 h-4 text-primary/60" />
                            <a href={`tel:${booking.phone}`}>{booking.phone}</a>
                         </div>
                         {(booking.photographer_name || booking.status === 'completed') && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                               <UserIcon className="w-4 h-4 text-primary" />
                               <span className="font-bold">Photographer: {booking.photographer_name || "Unassigned"}</span>
                            </div>
                          )}
                         {booking.sqft && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/40">
                               <span className="font-bold">{booking.sqft.toLocaleString()} sq ft</span>
                            </div>
                          )}
                         {booking.referral_code_used && (
                            <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                               <span className="font-bold">Ref: {booking.referral_code_used}</span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                       <div className="flex gap-2">
                          <button 
                            onClick={() => handleComplete(booking)}
                            className="px-6 py-2.5 bg-success text-white hover:bg-success/90 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-gold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                       </div>
                    )}
                    {booking.completion_notes && (
                        <div className="mt-2 p-3 bg-muted/30 rounded-2xl text-[11px] italic border border-primary/5 flex gap-2 max-w-[250px]">
                            <MessageSquare className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                            <span>Notes: {booking.completion_notes}</span>
                        </div>
                    )}
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                       Received: {new Date(booking.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-24 bg-card border border-border/50 border-dashed rounded-3xl">
          <CalendarCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-1">No bookings found</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">We couldn't find any {filter} booking requests matching your search.</p>
        </div>
      )}

      {/* Manual Completion Modal */}
      {completionModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-primary/20 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Manual Completion</h2>
                        <p className="text-xs text-muted-foreground">This shoot is currently <b>unpaid</b>.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <p className="text-sm text-center font-bold px-4">
                        Are you sure you want to mark this as completed without payment? 
                        Please provide a reason below.
                    </p>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Reason / Internal Note</label>
                        <textarea 
                            value={completionModal.notes}
                            onChange={(e) => setCompletionModal(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="e.g. Paid via check, recurring client adjustment, local cash payment..."
                            className="w-full bg-black/20 border border-primary/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none h-32 resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setCompletionModal({ isOpen: false, bookingId: null, notes: "" })}
                            className="flex-1 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                        >
                            Back
                        </button>
                        <button 
                            disabled={!completionModal.notes.trim()}
                            onClick={() => {
                                if (completionModal.bookingId) {
                                    updateStatus(completionModal.bookingId, 'completed', completionModal.notes);
                                }
                            }}
                            className="flex-1 px-4 py-4 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-gold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            Complete Shoot
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Global Alerts */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        showCancel={false}
        confirmText="Acknowledged"
      />

      {/* New Booking Modal */}
      {newBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setNewBookingModal(false)}>
          <div className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-primary/20 p-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black">New Booking</h2>
                <p className="text-sm text-muted-foreground mt-1">Create a booking request on behalf of a client.</p>
              </div>
              <button onClick={() => setNewBookingModal(false)} className="p-2 hover:bg-primary/10 rounded-xl transition-colors flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitNewBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">First Name</label>
                  <input type="text" required value={newBookingForm.first_name} onChange={e => setNewBookingForm(p => ({ ...p, first_name: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Jane" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Last Name</label>
                  <input type="text" required value={newBookingForm.last_name} onChange={e => setNewBookingForm(p => ({ ...p, last_name: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</label>
                  <input type="email" required value={newBookingForm.email} onChange={e => setNewBookingForm(p => ({ ...p, email: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="jane@agency.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone</label>
                  <input type="tel" required value={newBookingForm.phone} onChange={e => setNewBookingForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Package</label>
                <select value={newBookingForm.package_interest} onChange={e => setNewBookingForm(p => ({ ...p, package_interest: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">— Select a package —</option>
                  {packages.map((pkg: any) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Property Address</label>
                <textarea required rows={2} value={newBookingForm.property_details} onChange={e => setNewBookingForm(p => ({ ...p, property_details: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="123 Main St, Dallas, TX 75201" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Shoot Date <span className="normal-case font-medium opacity-50">(optional)</span></label>
                  <input type="date" value={newBookingForm.shoot_date} onChange={e => setNewBookingForm(p => ({ ...p, shoot_date: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Time Slot <span className="normal-case font-medium opacity-50">(optional)</span></label>
                  <input type="text" value={newBookingForm.time_slot} onChange={e => setNewBookingForm(p => ({ ...p, time_slot: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="09:00 AM" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Photographer <span className="normal-case font-medium opacity-50">(optional)</span></label>
                  <select value={newBookingForm.assigned_photographer} onChange={e => setNewBookingForm(p => ({ ...p, assigned_photographer: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">— Unassigned —</option>
                    {photographers.map((ph: any) => <option key={ph.id} value={ph.id}>{ph.user_name || ph.id}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sq Ft <span className="normal-case font-medium opacity-50">(optional)</span></label>
                  <input type="number" value={newBookingForm.sqft} onChange={e => setNewBookingForm(p => ({ ...p, sqft: e.target.value }))} className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="2500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setNewBookingModal(false)} className="flex-1 py-3 bg-muted text-muted-foreground font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-muted/80 transition-all">Cancel</button>
                <button type="submit" disabled={newBookingLoading} className="flex-1 py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-gold hover:shadow-gold-heavy transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {newBookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
