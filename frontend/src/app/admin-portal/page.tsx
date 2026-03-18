"use client";

import { useEffect, useState } from "react";
import { FolderGit2, Users, Calendar, ArrowUpRight, DollarSign, Clock, CheckCircle2, Camera } from "lucide-react";
import Link from "next/link";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import UserSelectionModal from "@/components/UserSelectionModal";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeShoots: 0,
    completedShootsMonth: 0,
    monthlyRevenue: 0,
  });
  const [openBookings, setOpenBookings] = useState<any[]>([]);
  const [upcomingShoots, setUpcomingShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Impersonation Modal State
  const [impersonateModal, setImpersonateModal] = useState<{
    isOpen: boolean;
    mode: "clients" | "photographers";
    title: string;
  }>({
    isOpen: false,
    mode: "clients",
    title: "Impersonate Client",
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("access_token");
      try {
        const [bookRes, shootsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/`, { 
            headers: { "Authorization": `Bearer ${token}` } 
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, { 
            headers: { "Authorization": `Bearer ${token}` } 
          }),
        ]);

        if (bookRes.ok && shootsRes.ok) {
          const bookings = await bookRes.json();
          const shoots = await shootsRes.json();

          // Calculations
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          const deliveredThisMonth = shoots.filter((s: any) => {
            const shootDate = new Date(s.shoot_date);
            return s.status === 'delivered' && 
                   shootDate.getMonth() === currentMonth && 
                   shootDate.getFullYear() === currentYear;
          });

          const monthlyRevenue = shoots
            .filter((s: any) => {
              const shootDate = new Date(s.shoot_date);
              return s.payment_status === 'paid' && 
                     shootDate.getMonth() === currentMonth && 
                     shootDate.getFullYear() === currentYear;
            })
            .reduce((sum: number, s: any) => sum + parseFloat(s.amount_due || 0), 0);

          const activeShoots = shoots.filter((s: any) => s.status !== 'delivered' && s.status !== 'archived').length;

          setStats({
            activeShoots,
            completedShootsMonth: deliveredThisMonth.length,
            monthlyRevenue,
          });

          // Open Bookings (Pending or Confirmed, but not yet delivered as a shoot)
          const deliveredAddresses = new Set(shoots.filter((s: any) => s.status === 'delivered').map((s: any) => s.property_address.toLowerCase().trim()));
          
          const open = bookings.filter((b: any) => {
            const isPendingOrConfirmed = b.status === 'pending' || b.status === 'confirmed';
            const isNotDeliveredYet = !deliveredAddresses.has((b.property_details || "").toLowerCase().trim());
            return isPendingOrConfirmed && isNotDeliveredYet;
          });
          
          setOpenBookings(open.slice(0, 5));

          // Upcoming Shoots (next 48 hours)
          const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
          const upcoming = shoots.filter((s: any) => {
            const shootDate = new Date(s.shoot_date);
            return shootDate >= now && shootDate <= fortyEightHoursFromNow && s.status !== 'delivered';
          }).sort((a: any, b: any) => new Date(a.shoot_date).getTime() - new Date(b.shoot_date).getTime());
          
          setUpcomingShoots(upcoming.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { title: "Active Shoots", value: stats.activeShoots, icon: Camera, href: "/admin-portal/shoots", color: "text-primary", bg: "bg-primary/10" },
    { title: "Completed (This Month)", value: stats.completedShootsMonth, icon: CheckCircle2, href: "/admin-portal/shoots", color: "text-primary", bg: "bg-primary/10" },
    { title: "Monthly Revenue", value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, href: "/admin-portal/shoots", color: "text-primary", bg: "bg-primary/10" },
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Real-time overview of media operations and revenue.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-xs font-black uppercase tracking-widest text-primary/60 mr-2">Quick Portals:</div>
             <button 
                onClick={() => setImpersonateModal({ isOpen: true, mode: "clients", title: "Impersonate Client" })}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-gold hover:bg-primary/10 transition-all active:scale-95"
             >
                <Users className="w-3 h-3" /> Client Hub
             </button>
             <button 
                onClick={() => setImpersonateModal({ isOpen: true, mode: "photographers", title: "Impersonate Photographer" })}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-gold hover:bg-primary/10 transition-all active:scale-95"
             >
                <Camera className="w-3 h-3" /> Photographer Portal
             </button>
          </div>
        </div>
      </ScrollReveal>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.title}>
              <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-gold hover:shadow-gold-heavy transition-all group relative overflow-hidden">
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-gold`}>
                     <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
                
                <Link href={stat.href} className="absolute inset-0 z-20 focus:outline-none">
                  <span className="sr-only">View {stat.title}</span>
                </Link>
                
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-muted-foreground group-hover:text-primary">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <ScrollReveal delay={0.2}>
          <div className="bg-card border border-primary/20 rounded-[2.5rem] p-10 shadow-gold h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Open Bookings
              </h2>
              <Link href="/admin-portal/bookings" className="text-xs text-primary hover:underline font-medium">View All</Link>
            </div>
            
            <div className="space-y-4">
              {openBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No open bookings found.</p>
              ) : openBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {booking.first_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{booking.first_name} {booking.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{booking.property_details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        booking.status === 'pending' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/20 text-primary border border-primary/30'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Upcoming Shoots */}
        <ScrollReveal delay={0.3}>
          <div className="bg-card border border-primary/20 rounded-[2.5rem] p-10 shadow-gold h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Shoots (Next 48 Hours)
              </h2>
              <Link href="/admin-portal/shoots" className="text-xs text-primary hover:underline font-medium">View Schedule</Link>
            </div>
            
            <div className="space-y-4">
              {upcomingShoots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No shoots scheduled for the next 48 hours.</p>
              ) : upcomingShoots.map((shoot) => (
                <div key={shoot.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                       <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[200px]">{shoot.property_address}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(shoot.shoot_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        shoot.payment_status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
                     }`}>
                        {shoot.payment_status}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>

      <UserSelectionModal 
        isOpen={impersonateModal.isOpen}
        onClose={() => setImpersonateModal({ ...impersonateModal, isOpen: false })}
        mode={impersonateModal.mode}
        title={impersonateModal.title}
      />
    </div>
  );
}
