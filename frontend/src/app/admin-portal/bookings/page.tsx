"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, Search, CalendarCheck } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
        // Optimistic UI update
        setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.property_details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Booking Requests</h1>
            <p className="text-muted-foreground">Manage incoming client shoots.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border/50 rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-full md:w-64 transition-all"
            />
          </div>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/50 hidden md:table-header-group">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Client</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Contact</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Property Details</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 flex flex-col md:table-row-group">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/20 transition-colors flex flex-col md:table-row p-4 md:p-0 gap-2 md:gap-0 border-b border-border/50 md:border-0 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-base md:text-sm">{booking.first_name} {booking.last_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">Package ID: {booking.package_id || 'Custom'}</div>
                    </td>
                    <td className="px-6 py-4 md:whitespace-nowrap flex flex-col gap-1">
                      <a href={`mailto:${booking.email}`} className="hover:text-primary transition-colors text-xs md:text-sm">{booking.email}</a>
                      <a href={`tel:${booking.phone_number}`} className="hover:text-primary transition-colors text-xs text-muted-foreground">{booking.phone_number}</a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs md:text-sm" title={booking.property_details}>
                        {booking.property_details}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                         Received: {new Date(booking.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 md:whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                        ${booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : ''}
                        ${booking.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : ''}
                        ${booking.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : ''}
                        ${booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
                      `}>
                        {booking.status === 'pending' && <Clock className="w-3 h-3" />}
                        {booking.status === 'confirmed' && <CheckCircle2 className="w-3 h-3" />}
                        {booking.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        {booking.status === 'cancelled' && <XCircle className="w-3 h-3 text-red-500" />}
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex flex-wrap gap-2 md:justify-end">
                       {booking.status === 'pending' && (
                         <button 
                           onClick={() => updateStatus(booking.id, 'confirmed')}
                           className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded text-xs font-semibold transition-colors"
                         >
                           Confirm
                         </button>
                       )}
                       {booking.status === 'confirmed' && (
                         <button 
                           onClick={() => updateStatus(booking.id, 'completed')}
                           className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 rounded text-xs font-semibold transition-colors"
                         >
                           Complete
                         </button>
                       )}
                       {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                         <button 
                           onClick={() => updateStatus(booking.id, 'cancelled')}
                           className="px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 rounded text-xs font-semibold transition-colors"
                         >
                           Cancel
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-card border border-border/50 border-dashed rounded-xl">
          <CalendarCheck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No bookings found</h3>
          <p className="text-muted-foreground text-sm">We couldn't find any booking requests matching your search.</p>
        </div>
      )}
    </div>
  );
}
