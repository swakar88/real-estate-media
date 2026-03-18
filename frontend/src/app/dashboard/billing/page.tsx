"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  ArrowUpRight,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function BillingHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [shoots, setShoots] = useState<any[]>([]);

  useEffect(() => {
    const fetchBillingData = async () => {
      const token = localStorage.getItem("access_token");
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`;

      try {
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const allShoots = data.results || data;
          // Sort by date newest first
          setShoots(allShoots.sort((a: any, b: any) => 
            new Date(b.shoot_date).getTime() - new Date(a.shoot_date).getTime()
          ));
        }
      } catch (err) {
        console.error("Error fetching billing data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-xl"></div>
        <div className="h-[400px] bg-muted animate-pulse rounded-[2.5rem]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Billing History</h1>
          <p className="text-muted-foreground font-medium">View and manage your invoices and payment records.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-card px-4 py-2.5 rounded-2xl border border-border/40 flex items-center gap-3 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Total Outstanding:</span>
              <span className="text-lg font-black text-error">
                ${shoots.filter(s => s.payment_status === 'unpaid').reduce((acc, s) => acc + (parseFloat(s.amount_due) || 0), 0).toFixed(2)}
              </span>
           </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-[2.5rem] border border-border/40 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-8 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input 
                type="text" 
                placeholder="Search by property address..." 
                className="w-full pl-11 pr-4 py-3 bg-background/50 border border-border/40 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-background border border-border/40 text-xs font-bold hover:bg-muted transition-all">
                <Filter className="h-4 w-4" /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                <Download className="h-4 w-4" /> Export PDF
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/40">
                <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Date</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Property</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Amount</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Status</th>
                <th className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {shoots.length > 0 ? (
                shoots.map((shoot) => (
                  <tr key={shoot.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-10 py-6 whitespace-nowrap">
                      <div className="text-sm font-bold">{new Date(shoot.shoot_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-[10px] font-medium text-muted-foreground/60 uppercase">Inv #INV-{shoot.id}</div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm font-black group-hover:text-primary transition-colors truncate max-w-[250px]">{shoot.property_address}</div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="text-sm font-black">${parseFloat(shoot.amount_due || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${
                        shoot.payment_status === 'paid' 
                        ? 'bg-success/10 text-success ring-success/20' 
                        : 'bg-warning/10 text-warning ring-warning/20'
                      }`}>
                        {shoot.payment_status === 'paid' ? (
                          <><CheckCircle2 className="h-3 w-3" /> Paid</>
                        ) : (
                          <><Clock className="h-3 w-3" /> Pending</>
                        )}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right whitespace-nowrap">
                      {shoot.payment_status === 'unpaid' && shoot.stripe_payment_link ? (
                        <a 
                          href={shoot.stripe_payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-gold hover:shadow-gold-heavy hover:scale-[1.05] transition-all"
                        >
                          Pay Now <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ) : (
                        <button className="inline-flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-xl text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all">
                          <Download className="h-4 w-4" /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <CreditCard className="h-16 w-16" />
                      <p className="font-bold italic">No billing records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
