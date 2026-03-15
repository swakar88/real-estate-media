"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ExternalLink, 
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Camera
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [shoots, setShoots] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get('payment');
    const sessionId = queryParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      const verifyPayment = async () => {
        const token = localStorage.getItem("access_token");
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/verify-payment/`, {
            method: 'POST',
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ session_id: sessionId })
          });
          
          if (res.ok) {
            toast.success("Payment verified! Your media is now unlocked.");
            // Refresh shoots to show new status
            fetchShoots();
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('payment');
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url.pathname + url.search);
          }
        } catch (err) {
          console.error("Error verifying payment:", err);
        }
      };
      verifyPayment();
    }
  }, []);

  const fetchShoots = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShoots(data.results || data);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShoots();
  }, []);

  const filteredShoots = shoots.filter(s => 
    s.property_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (shoot: any) => {
    // Production Status
    if (shoot.status === 'scheduled') return { label: 'Scheduled', color: 'bg-blue-500/10 text-blue-500 ring-blue-500/20', icon: Calendar };
    if (shoot.status === 'editing') return { label: 'In Post-Production', color: 'bg-amber-500/10 text-amber-500 ring-amber-500/20', icon: Clock };
    
    // Delivery Status based on Payment
    if (shoot.status === 'delivered') {
      if (shoot.payment_status === 'paid') {
        return { label: 'Paid & Delivered', color: 'bg-green-500/10 text-green-500 ring-green-500/20', icon: CheckCircle2 };
      }
      return { label: 'Pending Payment', color: 'bg-rose-500/10 text-rose-500 ring-rose-500/20', icon: AlertCircle };
    }

    return { label: shoot.status, color: 'bg-slate-500/10 text-slate-500 ring-slate-500/20', icon: Clock };
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in transition-all duration-700">
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-6 w-96 bg-muted animate-pulse rounded-md opacity-60"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-[2.5rem]"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Your Bookings</h1>
          <p className="text-muted-foreground font-medium">Track your property shoots and download media assets.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Search address..." 
            className="pl-11 pr-6 py-3.5 bg-card border border-border/40 rounded-2xl w-full md:w-80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredShoots.length > 0 ? (
          filteredShoots.map((shoot) => {
            const status = getStatusBadge(shoot);
            const StatusIcon = status.icon;
            
            return (
              <div key={shoot.id} className="group bg-card rounded-[2.5rem] border border-border/40 shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col h-full">
                {/* Image / Header area */}
                <div className="aspect-[16/9] w-full bg-muted relative overflow-hidden group-hover:brightness-110 transition-all duration-500">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 group-hover:scale-110 transition-transform duration-700">
                    <Camera className="h-20 w-20" />
                  </div>
                  <div className={`absolute top-4 right-4 px-4 py-2 rounded-full backdrop-blur-md shadow-lg flex items-center gap-2 border border-white/10 ${status.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-1 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-black tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">{shoot.property_address}</h3>
                      <button className="p-2 -mr-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors shrink-0">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground/60">
                      <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                         <Calendar className="h-3.5 w-3.5" />
                         {new Date(shoot.shoot_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border/30 flex flex-wrap items-center gap-3">
                    {shoot.status === 'delivered' ? (
                      shoot.payment_status === 'paid' ? (
                        <Link 
                          href={`/shoot/${shoot.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          <Download className="h-4 w-4" /> Download Assets
                        </Link>
                      ) : (
                        <div className="flex flex-col w-full gap-3">
                          <Link 
                            href={`/shoot/${shoot.id}?view=watermarked`}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-muted text-foreground rounded-2xl font-black text-xs uppercase tracking-widest border border-border/40 hover:bg-muted/80 transition-all"
                          >
                            <ExternalLink className="h-4 w-4" /> View Gallery
                          </Link>
                          {shoot.stripe_payment_link && (
                            <a 
                              href={shoot.stripe_payment_link}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                            >
                              <CreditCard className="h-4 w-4" /> Pay to Unlock Full Size
                            </a>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="flex-1 py-4 text-center bg-muted/30 rounded-2xl border border-dashed border-border/80">
                         <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">In Production</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center gap-6 bg-card rounded-[3rem] border-2 border-dashed border-border/40 text-center animate-in zoom-in-95 duration-700">
             <div className="h-20 w-20 bg-muted/50 text-muted-foreground/20 rounded-full flex items-center justify-center">
                <Calendar className="h-10 w-10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black">No Bookings Found</h3>
                <p className="text-muted-foreground font-medium">You haven't scheduled any property shoots yet.</p>
             </div>
             <Link href="/book" className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Book A New Shoot</Link>
          </div>
        )}
      </div>
    </div>
  );
}
