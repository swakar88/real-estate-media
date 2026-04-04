"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  Gift,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clients, setClients] = useState<any[]>([]);
  const [newReferralModal, setNewReferralModal] = useState(false);
  const [newReferralLoading, setNewReferralLoading] = useState(false);
  const [newReferralForm, setNewReferralForm] = useState({
    referrer_id: "" as string | "self",
    referee_name: "",
    referee_email: "",
    referee_phone: "",
    notes: "",
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

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/clients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setClients(await res.json());
    } catch { /* non-critical */ }
  };

  const createReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewReferralLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const body: any = {
        referee_name: newReferralForm.referee_name,
        referee_email: newReferralForm.referee_email,
        referee_phone: newReferralForm.referee_phone || undefined,
        notes: newReferralForm.notes || undefined,
        status: "pending",
      };
      if (newReferralForm.referrer_id && newReferralForm.referrer_id !== "self") {
        body.referrer_id = parseInt(newReferralForm.referrer_id);
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/referrals/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Referral created successfully");
        setNewReferralModal(false);
        setNewReferralForm({ referrer_id: "", referee_name: "", referee_email: "", referee_phone: "", notes: "" });
        fetchReferrals();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create referral.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setNewReferralLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
    fetchClients();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/referrals/${id}/`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Referral marked as ${newStatus}`);
        fetchReferrals();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating referral status:", err);
      toast.error("Network error");
    }
  };

  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = 
      ref.referee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referrer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ref.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: string) => {
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
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-64 bg-muted animate-pulse rounded-[2.5rem]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Referral Management</h1>
          <p className="text-muted-foreground font-medium">Track client referrals and manage reward fulfillment.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search referrals..."
              className="pl-11 pr-6 py-3 bg-card border border-primary/10 rounded-2xl w-full md:w-64 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center bg-card border border-primary/10 rounded-2xl p-1 shadow-sm">
            {['all', 'pending', 'completed', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === status
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setNewReferralModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> New Referral
          </button>
        </div>
      </div>

      {/* Referrals table / list */}
      <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] shadow-gold overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-primary/10 bg-primary/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Referrer</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lead Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredReferrals.length > 0 ? (
                filteredReferrals.map((ref) => {
                  const statusInfo = getStatusInfo(ref.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={ref.id} className="group hover:bg-muted/40 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                            {ref.referrer_name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-none mb-1">{ref.referrer_name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 uppercase tracking-tighter">
                              <Calendar className="h-3 w-3" /> {new Date(ref.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{ref.referee_name}</p>
                          <div className="flex flex-col gap-0.5">
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <Mail className="h-3 w-3" /> {ref.referee_email}
                             </div>
                             {ref.referee_phone && (
                               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                 <Phone className="h-3 w-3" /> {ref.referee_phone}
                               </div>
                             )}
                          </div>
                          {ref.notes && (
                            <p className="text-[10px] text-primary/60 font-medium italic max-w-xs truncate">"{ref.notes}"</p>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-transparent ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{statusInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {ref.status === 'pending' && (
                            <button 
                              onClick={() => updateStatus(ref.id, 'completed')}
                              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                              Mark Booked
                            </button>
                          )}
                          {ref.status === 'completed' && (
                            <button 
                              onClick={() => updateStatus(ref.id, 'paid')}
                              className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                       <Users className="h-12 w-12 opacity-20" />
                       <p className="font-medium">No referrals found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* New Referral Modal */}
      {newReferralModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setNewReferralModal(false)}>
          <div className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-primary/20 p-10 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black">New Referral</h2>
                <p className="text-sm text-muted-foreground mt-1">Log a referral on behalf of a client or yourself.</p>
              </div>
              <button onClick={() => setNewReferralModal(false)} className="p-2 hover:bg-primary/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createReferral} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Referred By</label>
                <select
                  value={newReferralForm.referrer_id}
                  onChange={e => setNewReferralForm(p => ({ ...p, referrer_id: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="self">Admin (myself)</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.full_name || c.email} — {c.email}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Referee Name</label>
                <input
                  type="text" required
                  value={newReferralForm.referee_name}
                  onChange={e => setNewReferralForm(p => ({ ...p, referee_name: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Referee Email</label>
                <input
                  type="email" required
                  value={newReferralForm.referee_email}
                  onChange={e => setNewReferralForm(p => ({ ...p, referee_email: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Referee Phone <span className="normal-case font-medium opacity-50">(optional)</span></label>
                <input
                  type="tel"
                  value={newReferralForm.referee_phone}
                  onChange={e => setNewReferralForm(p => ({ ...p, referee_phone: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notes <span className="normal-case font-medium opacity-50">(optional)</span></label>
                <textarea
                  rows={2}
                  value={newReferralForm.notes}
                  onChange={e => setNewReferralForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Any context about this referral..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setNewReferralModal(false)} className="flex-1 py-3 bg-muted text-muted-foreground font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-muted/80 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={newReferralLoading} className="flex-1 py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-gold hover:shadow-gold-heavy transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {newReferralLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Referral"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
