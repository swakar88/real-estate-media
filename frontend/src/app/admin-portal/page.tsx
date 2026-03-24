"use client";

import { useEffect, useState } from "react";
import { Users, Calendar, ArrowUpRight, DollarSign, Camera, CheckCircle2, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import UserSelectionModal from "@/components/UserSelectionModal";

interface StatPanel {
  active: number;
  completed: number;
  shoots: number;
  dollarValue: number;
  ourShare: number;
  photographers: number;
  photographerShare: number;
}

const emptyPanel = (): StatPanel => ({
  active: 0, completed: 0, shoots: 0, dollarValue: 0,
  ourShare: 0, photographers: 0, photographerShare: 0,
});

export default function AdminDashboard() {
  const [cy, setCy] = useState<StatPanel>(emptyPanel());
  const [allTime, setAllTime] = useState<StatPanel>(emptyPanel());
  const [openBookings, setOpenBookings] = useState<any[]>([]);
  const [upcomingShoots, setUpcomingShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [impersonateModal, setImpersonateModal] = useState<{
    isOpen: boolean; mode: "clients" | "photographers"; title: string;
  }>({ isOpen: false, mode: "clients", title: "Impersonate Client" });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("access_token");
      try {
        const [bookRes, shootsRes, photoRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/`, { headers: { "Authorization": `Bearer ${token}` } }),
        ]);

        if (bookRes.ok && shootsRes.ok && photoRes.ok) {
          const bookings = await bookRes.json();
          const shoots = await shootsRes.json();
          const photographers = await photoRes.json();

          const now = new Date();
          const currentYear = now.getFullYear();

          const cyShots = shoots.filter((s: any) => new Date(s.shoot_date).getFullYear() === currentYear);
          const allShots = shoots;

          const calcPanel = (list: any[], allPhotographers: any[]): StatPanel => {
            const active = list.filter((s: any) => s.status !== 'delivered' && s.status !== 'archived').length;
            const completed = list.filter((s: any) => s.status === 'delivered').length;
            const dollarValue = list.filter((s: any) => s.payment_status === 'paid').reduce((sum: number, s: any) => sum + parseFloat(s.amount_due || 0), 0);
            const photographerShare = list.reduce((sum: number, s: any) => sum + parseFloat(s.photographer_fee || 0), 0);
            const ourShare = dollarValue - photographerShare;
            return {
              active,
              completed,
              shoots: list.length,
              dollarValue,
              ourShare: Math.max(0, ourShare),
              photographers: allPhotographers.filter((p: any) => p.is_active).length,
              photographerShare,
            };
          };

          setCy(calcPanel(cyShots, photographers));
          setAllTime(calcPanel(allShots, photographers));

          const deliveredAddresses = new Set(allShots.filter((s: any) => s.status === 'delivered').map((s: any) => s.property_address?.toLowerCase().trim()));
          const open = bookings.filter((b: any) => {
            return (b.status === 'pending' || b.status === 'confirmed') &&
              !deliveredAddresses.has((b.property_details || "").toLowerCase().trim());
          });
          setOpenBookings(open.slice(0, 5));

          const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
          const upcoming = allShots.filter((s: any) => {
            const d = new Date(s.shoot_date);
            return d >= now && d <= fortyEightHoursFromNow && s.status !== 'delivered';
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

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const StatRow = ({ label, value, icon: Icon, color = "text-primary", format = "number" }: { label: string; value: number; icon: any; color?: string; format?: "number" | "currency" }) => (
    <div className="flex items-center justify-between py-3 border-b border-primary/5 last:border-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="font-bold uppercase tracking-widest text-[10px]">{label}</span>
      </div>
      <span className={`font-black text-sm ${color}`}>
        {format === "currency" ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : value.toLocaleString()}
      </span>
    </div>
  );

  const PanelCard = ({ title, data, accent }: { title: string; data: StatPanel; accent: string }) => (
    <div className={`bg-card/80 backdrop-blur-sm border ${accent} rounded-[2.5rem] p-8 shadow-gold flex flex-col h-full`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl bg-primary/10`}>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-black italic tracking-tight">{title}</h2>
      </div>
      <div className="flex-1 space-y-0">
        <StatRow label="Active Shoots" value={data.active} icon={Activity} color="text-sky-400" />
        <StatRow label="Completed Shoots" value={data.completed} icon={CheckCircle2} color="text-emerald-400" />
        <StatRow label="Total Shoots" value={data.shoots} icon={Camera} color="text-primary" />
        <StatRow label="Gross Revenue" value={data.dollarValue} icon={DollarSign} color="text-emerald-400" format="currency" />
        <StatRow label="Our Share" value={data.ourShare} icon={DollarSign} color="text-primary" format="currency" />
        <StatRow label="Active Photographers" value={data.photographers} icon={Users} color="text-amber-400" />
        <StatRow label="Photographer Payouts" value={data.photographerShare} icon={DollarSign} color="text-rose-400" format="currency" />
      </div>
    </div>
  );

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
            <button onClick={() => setImpersonateModal({ isOpen: true, mode: "clients", title: "Impersonate Client" })} className="flex items-center gap-2 px-4 py-2 bg-card border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-gold hover:bg-primary/10 transition-all active:scale-95">
              <Users className="w-3 h-3" /> Client Hub
            </button>
            <button onClick={() => setImpersonateModal({ isOpen: true, mode: "photographers", title: "Impersonate Photographer" })} className="flex items-center gap-2 px-4 py-2 bg-card border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-gold hover:bg-primary/10 transition-all active:scale-95">
              <Camera className="w-3 h-3" /> Photographer Portal
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* CY vs All Time Stats */}
      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StaggerItem>
          <PanelCard title={`Current Year (${new Date().getFullYear()})`} data={cy} accent="border-primary/20" />
        </StaggerItem>
        <StaggerItem>
          <PanelCard title="All Time" data={allTime} accent="border-primary/10" />
        </StaggerItem>
      </StaggerContainer>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ScrollReveal delay={0.2}>
          <div className="bg-card border border-primary/20 rounded-[2.5rem] p-10 shadow-gold h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Open Bookings
              </h2>
              <Link href="/admin-portal/bookings" className="text-xs text-primary hover:underline font-medium">View All</Link>
            </div>
            <div className="space-y-4">
              {openBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No open bookings found.</p>
              ) : openBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {booking.first_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{booking.first_name} {booking.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{booking.property_details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{new Date(booking.created_at).toLocaleDateString()}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-primary/10 text-primary border border-primary/20">{booking.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="bg-card border border-primary/20 rounded-[2.5rem] p-10 shadow-gold h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" /> Shoots (Next 48 Hours)
              </h2>
              <Link href="/admin-portal/shoots" className="text-xs text-primary hover:underline font-medium">View Schedule</Link>
            </div>
            <div className="space-y-4">
              {upcomingShoots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No shoots scheduled for the next 48 hours.</p>
              ) : upcomingShoots.map((shoot) => (
                <div key={shoot.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[200px]">{shoot.property_address}</p>
                      <p className="text-xs text-muted-foreground">{new Date(shoot.shoot_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${shoot.payment_status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                    {shoot.payment_status}
                  </span>
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
