"use client";

import { useEffect, useState } from "react";
import { Camera, Plus, Trash2, Edit, Search, Filter, ExternalLink, CreditCard, CheckCircle2, AlertCircle, Clock, DollarSign, Calendar, MapPin } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function AdminShoots() {
  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'open' | 'delivered'>('open');
  
  const [showInvoiceModal, setShowInvoiceModal] = useState<number | null>(null);
  const [amountDue, setAmountDue] = useState("");
  const [generating, setGenerating] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    property_address: "",
    shoot_date: new Date().toISOString().split('T')[0]
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchShoots();
  }, []);

  const fetchShoots = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setShoots(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch shoots", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(addFormData)
      });
      if (res.ok) {
        const newShoot = await res.json();
        setShoots([newShoot, ...shoots]);
        setShowAddModal(false);
        setAddFormData({ property_address: "", shoot_date: new Date().toISOString().split('T')[0] });
      } else {
        alert("Failed to create shoot");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleGenerateInvoice = async (shootId: number, manualAmount?: string) => {
    const finalAmount = manualAmount || amountDue;
    if (!finalAmount) return;
    setGenerating(true);
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/${shootId}/generate-invoice/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount_due: finalAmount })
      });
      
      if (res.ok) {
        const data = await res.json();
        setShoots(shoots.map(s => s.id === shootId ? {
           ...s, 
           amount_due: finalAmount, 
           stripe_payment_link: data.stripe_payment_link 
        } : s));
        setShowInvoiceModal(null);
        setAmountDue("");
      } else {
        alert("Failed to generate invoice");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const filteredShoots = shoots
    .filter(s => {
      const matchesSearch = s.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.client_name && s.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const isDelivered = s.status === 'delivered';
      const matchesFilter = filter === 'delivered' ? isDelivered : !isDelivered;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.shoot_date).getTime() - new Date(a.shoot_date).getTime());

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Shoots</h1>
            <p className="text-muted-foreground">Manage deliveries and track payment status.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search shoots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border/50 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-full md:w-64 transition-all shadow-sm"
                />
             </div>

             <div className="flex bg-muted p-1 rounded-lg self-end sm:self-auto">
                <button 
                  onClick={() => setFilter('open')}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filter === 'open' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Open
                </button>
                <button 
                  onClick={() => setFilter('delivered')}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filter === 'delivered' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Delivered
                </button>
             </div>

             <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
             >
                <Plus className="w-4 h-4" /> New Shoot
             </button>
          </div>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : filteredShoots.length > 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                 <thead>
                    <tr className="bg-muted/50 border-b border-border/50">
                       <th className="px-6 py-4 font-bold text-muted-foreground">Property & Date</th>
                       <th className="px-6 py-4 font-bold text-muted-foreground">Client</th>
                       <th className="px-6 py-4 font-bold text-muted-foreground">Status</th>
                       <th className="px-6 py-4 font-bold text-muted-foreground">Payment</th>
                       <th className="px-6 py-4 font-bold text-muted-foreground text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/40">
                    {filteredShoots.map(shoot => (
                       <tr key={shoot.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="font-bold text-base truncate max-w-[280px]" title={shoot.property_address}>{shoot.property_address}</div>
                             <div className="text-xs text-primary font-medium mt-1 uppercase tracking-wider">
                                {new Date(shoot.shoot_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="font-medium text-foreground">
                                {shoot.client_name || `User #${shoot.client}`}
                             </div>
                             <div className="text-[10px] text-muted-foreground mt-0.5">ID: {shoot.id}</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                                ${shoot.status === 'delivered' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}
                             `}>
                                {shoot.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {shoot.status}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col gap-1.5">
                                <span className={`inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${shoot.payment_status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                   {shoot.payment_status || 'unpaid'}
                                </span>
                                {shoot.amount_due && <div className="text-xs font-bold">${parseFloat(shoot.amount_due).toFixed(2)}</div>}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center justify-end gap-2">
                                {shoot.stripe_payment_link ? (
                                   <a href={shoot.stripe_payment_link} target="_blank" rel="noopener noreferrer" 
                                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View Payment Link">
                                      <CreditCard className="w-4 h-4" />
                                   </a>
                                ) : (
                                   <button 
                                      onClick={() => {
                                         if (shoot.amount_due) handleGenerateInvoice(shoot.id, shoot.amount_due.toString());
                                         else setShowInvoiceModal(shoot.id);
                                      }}
                                      className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all" title="Generate Invoice">
                                      <DollarSign className="w-4 h-4" />
                                   </button>
                                )}
                                
                                {shoot.delivery_link && (
                                   <a href={shoot.delivery_link} target="_blank" rel="noopener noreferrer" 
                                      className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="View Delivery">
                                      <ExternalLink className="w-4 h-4" />
                                   </a>
                                )}

                                <div className="w-px h-4 bg-border/50 mx-1 hidden sm:block"></div>

                                <button className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-40 group-hover:opacity-100">
                                   <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-40 group-hover:opacity-100">
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-card border border-border/50 border-dashed rounded-3xl flex flex-col items-center">
          <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold mb-1">No {filter} shoots found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">Create a new client shoot or adjust your filters.</p>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border/50 p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2">Create Invoice</h2>
            <p className="text-muted-foreground text-xs mb-6 uppercase tracking-widest font-bold">Stripe Integration</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Amount Due ($)</label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <input 
                     type="number" step="0.01" required
                     className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                     placeholder="250.00"
                     value={amountDue} 
                     onChange={e => setAmountDue(e.target.value)}
                   />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button 
                  onClick={() => handleGenerateInvoice(showInvoiceModal)} 
                  disabled={!amountDue || generating}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
                >
                  {generating ? "Generating..." : "Generate Stripe Link"}
                </button>
                <button 
                  onClick={() => setShowInvoiceModal(null)} 
                  className="w-full py-3 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Shoot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border/50 p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-1">New Client Shoot</h2>
            <p className="text-muted-foreground text-sm mb-6">Initialize a delivery record for a client.</p>
            
            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider">Property Address</label>
                <div className="relative">
                   <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                   <textarea 
                     required rows={2}
                     className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                     placeholder="123 Main St, Leawood KS"
                     value={addFormData.property_address} 
                     onChange={e => setAddFormData({...addFormData, property_address: e.target.value})}
                   />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider">Shoot Date</label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <input 
                     type="date" required
                     className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                     value={addFormData.shoot_date} 
                     onChange={e => setAddFormData({...addFormData, shoot_date: e.target.value})}
                   />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 py-3 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={adding || !addFormData.property_address}
                  className="flex-[2] py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
                >
                  {adding ? "Initializing..." : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

