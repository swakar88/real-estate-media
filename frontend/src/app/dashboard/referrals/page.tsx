"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Send, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  Search,
  ArrowUpRight,
  Info,
  Gift,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    referee_name: "",
    referee_email: "",
    referee_phone: "",
    notes: ""
  });

  const fetchReferrals = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/referrals/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.results || data);
      }
    } catch (err) {
      console.error("Error fetching referrals:", err);
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("access_token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/referrals/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Referral submitted successfully!");
        setFormData({ referee_name: "", referee_email: "", referee_phone: "", notes: "" });
        setShowForm(false);
        fetchReferrals();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to submit referral");
      }
    } catch (err) {
      console.error("Error submitting referral:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Reward Paid', color: 'bg-green-500/10 text-green-500 ring-green-500/20', icon: CheckCircle2 };
      case 'completed':
        return { label: 'Lead Booked', color: 'bg-primary/10 text-primary ring-primary/20', icon: Gift };
      case 'pending':
      default:
        return { label: 'Pending', color: 'bg-amber-500/10 text-amber-500 ring-amber-500/20', icon: Clock };
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in transition-all duration-700">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[1,2,3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-3xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-[1200px] mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Referral Program</h1>
          <p className="text-muted-foreground font-medium">Earn rewards by referring colleagues for their property media needs.</p>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] active:scale-95 transition-all"
        >
          {showForm ? <Plus className="h-4 w-4 rotate-45" /> : <UserPlus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Refer a Colleague"}
        </button>
      </div>

      {/* Referral Form */}
      {showForm && (
        <ScrollReveal>
          <div className="bg-card rounded-[2.5rem] border border-primary/20 p-8 md:p-10 shadow-gold relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Gift className="w-64 h-64 text-primary" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-6">New Referral Details</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Colleague Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.referee_name}
                    onChange={e => setFormData({...formData, referee_name: e.target.value})}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-black/20 border border-primary/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.referee_email}
                    onChange={e => setFormData({...formData, referee_email: e.target.value})}
                    placeholder="sarah@realestate.com"
                    className="w-full bg-black/20 border border-primary/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone (Optional)</label>
                  <input 
                    type="tel" 
                    value={formData.referee_phone}
                    onChange={e => setFormData({...formData, referee_phone: e.target.value})}
                    placeholder="(555) 000-0000"
                    className="w-full bg-black/20 border border-primary/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Notes / Project Info</label>
                  <input 
                    type="text" 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="e.g. Upcoming listing in North Hills"
                    className="w-full bg-black/20 border border-primary/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end">
                   <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-12 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-gold hover:shadow-gold-heavy disabled:opacity-50 transition-all flex items-center gap-2"
                   >
                     {submitting ? "Submitting..." : <><Send className="h-4 w-4" /> Send Referral</>}
                   </button>
                </div>
              </form>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Program Info Cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Step 1", desc: "Refer a colleague by submitting their contact info.", icon: UserPlus },
          { title: "Step 2", desc: "They book their first shoot with KC Media.", icon: CheckCircle2 },
          { title: "Step 3", desc: "You receive a reward credit on your next booking!", icon: Gift },
        ].map((step, i) => (
          <StaggerItem key={i}>
            <div className="bg-card p-8 rounded-[2rem] border border-border/40 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground font-medium">{step.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Referrals List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          Your Referrals
        </h2>

        {referrals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {referrals.map((ref) => {
              const status = getStatusBadge(ref.status);
              const StatusIcon = status.icon;

              return (
                <ScrollReveal key={ref.id}>
                  <div className="bg-card rounded-[2rem] border border-primary/10 p-6 shadow-sm hover:shadow-gold transition-all duration-500 group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/40 font-black text-lg group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                          {ref.referee_name[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-none mb-1">{ref.referee_name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" /> {ref.referee_email}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 border border-transparent ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20 mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Date Referred</p>
                        <p className="text-xs font-bold">{new Date(ref.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Phone</p>
                        <p className="text-xs font-bold">{ref.referee_phone || "Not provided"}</p>
                      </div>
                    </div>

                    {ref.notes && (
                      <div className="p-3 bg-muted/30 rounded-xl text-[11px] text-muted-foreground font-medium italic">
                        "{ref.notes}"
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/40">
             <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/30">
                <Users className="h-8 w-8" />
             </div>
             <div className="space-y-1">
                <p className="font-black">No referrals yet.</p>
                <p className="text-sm text-muted-foreground">Start by inviting your professional network.</p>
             </div>
          </div>
        )}
      </div>

      {/* Program Transparency Section */}
      <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0">
          <Info className="w-10 h-10" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-lg font-black tracking-tight">How Rewards Work</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium">
            Once your referral completes their first paid shoot, your referral status will update to <span className="text-primary font-bold">"Lead Booked"</span>. 
            Our administration will then issue a credit to your account, which will be automatically applied to your next booking or sent as a discount code. 
            Once processed, the status will move to <span className="text-green-500 font-bold">"Reward Paid"</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
