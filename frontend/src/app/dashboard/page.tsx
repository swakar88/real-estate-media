"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Calendar, 
  Clock, 
  ChevronRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  AlertCircle,
  User
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeShoots: 0,
    readyToDownload: 0,
    pendingPayments: 0
  });
  const [recentShoots, setRecentShoots] = useState<any[]>([]);

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
            // Refresh dashboard data
            fetchData();
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

  const fetchData = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const shoots = data.results || data;
        
        setStats({
          totalBookings: shoots.length,
          activeShoots: shoots.filter((s:any) => s.status !== 'delivered' && s.status !== 'archived').length,
          readyToDownload: shoots.filter((s:any) => s.status === 'delivered').length,
          pendingPayments: shoots.filter((s:any) => s.payment_status === 'unpaid' && s.amount_due > 0).length
        });
        setRecentShoots(shoots.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-3xl"></div>)}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Welcome Back</h1>
        <p className="text-muted-foreground font-medium">Manage your properties and media assets in one place.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "bg-blue-500/10 text-blue-500" },
          { label: "In Production", value: stats.activeShoots, icon: Clock, color: "bg-amber-500/10 text-amber-500" },
          { label: "Ready to Download", value: stats.readyToDownload, icon: CheckCircle2, color: "bg-green-500/10 text-green-500" },
          { label: "Pending Payments", value: stats.pendingPayments, icon: AlertCircle, color: "bg-rose-500/10 text-rose-500" },
        ].map((item) => (
          <div key={item.label} className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="h-6 w-6" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>
            <div>
              <div className="text-3xl font-black mb-1">{item.value}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Shoots */}
        <div className="lg:col-span-2 bg-card rounded-[2.5rem] border border-border/40 p-10 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-xl font-black">Recent Property Shoots</h2>
            <Link href="/dashboard/bookings" className="text-xs font-black uppercase tracking-widest text-primary hover:underline">View All</Link>
          </div>
          
          <div className="space-y-6 relative z-10">
            {recentShoots.length > 0 ? (
              recentShoots.map((shoot) => (
                <Link 
                  key={shoot.id} 
                  href={`/dashboard/bookings?id=${shoot.id}`}
                  className="flex items-center gap-6 p-4 rounded-3xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/30 group"
                >
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                    <Camera className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate group-hover:text-primary transition-colors">{shoot.property_address}</h3>
                    <div className="flex items-center gap-3 mt-1 min-w-0 overflow-hidden">
                      <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0">{new Date(shoot.shoot_date).toLocaleDateString()}</span>
                      
                      {(shoot.beds || shoot.baths || shoot.sqft) && (
                        <div className="flex items-center gap-2 px-2 border-l border-border/50 shrink-0">
                          {shoot.beds && <span className="text-[10px] font-bold text-muted-foreground/40">{shoot.beds}BD</span>}
                          {shoot.baths && <span className="text-[10px] font-bold text-muted-foreground/40">{Math.round(shoot.baths)}BA</span>}
                          {shoot.sqft && <span className="text-[10px] font-bold text-muted-foreground/40">{Math.round(shoot.sqft / 100) / 10}k FT²</span>}
                        </div>
                      )}

                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ring-1 ring-inset shrink-0 ${
                        shoot.status === 'delivered' ? 'bg-green-500/10 text-green-500 ring-green-500/20' : 
                        shoot.status === 'editing' ? 'bg-blue-500/10 text-blue-500 ring-blue-500/20' : 
                        'bg-slate-500/10 text-slate-500 ring-slate-500/20'
                      }`}>
                        {shoot.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/30">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <p className="text-muted-foreground font-medium italic">No property shoots found yet.</p>
                <Link href="/book" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20">Book Your First Shoot</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="space-y-6">
          <div className="bg-primary p-8 rounded-[2.5rem] text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-lg font-black mb-2 relative z-10">Need a Shoot?</h3>
            <p className="text-sm text-primary-foreground/80 mb-6 relative z-10 leading-relaxed font-medium">Standard delivery is within 24-48 hours. Let us showcase your listing in the best light.</p>
            <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest relative z-10 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95">
              Book Today <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-card p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
            <h3 className="text-lg font-black mb-6">Quick Links</h3>
            <div className="space-y-3">
              {[
                { name: "My Profile", href: "/dashboard/profile", icon: User },
                { name: "Support Hub", href: "#", icon: AlertCircle },
                { name: "Billing History", href: "#", icon: CheckCircle2 },
              ].map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/30 group"
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">{link.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
