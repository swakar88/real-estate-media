"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, Search, CalendarCheck, MapPin, Mail, Phone, Filter } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'active' | 'historical'>('active');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/${id}/`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const filteredBookings = bookings
    .filter(b => {
      const matchesSearch = 
        b.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.property_details.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isHistorical = b.status === 'completed' || b.status === 'cancelled';
      const matchesFilter = filter === 'historical' ? isHistorical : !isHistorical;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
       // Sort by shoot date if available, otherwise created_at
       const dateA = a.shoot_date ? new Date(a.shoot_date).getTime() : new Date(a.created_at).getTime();
       const dateB = b.shoot_date ? new Date(b.shoot_date).getTime() : new Date(b.created_at).getTime();
       return dateA - dateB;
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
          </div>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
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
                        {booking.status}
                      </span>
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
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                       <div className="flex gap-2">
                          <button 
                            onClick={() => updateStatus(booking.id, 'completed')}
                            className="px-4 py-2 bg-success/10 text-success hover:bg-success hover:text-white border border-success/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </button>
                          <button 
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
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
    </div>
  );
}
