"use client";

import { useEffect, useState } from "react";
import { Camera, Plus, Trash2, Edit } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function AdminShoots() {
  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleGenerateInvoice = async (shootId: number) => {
    if (!amountDue) return;
    setGenerating(true);
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/${shootId}/generate-invoice/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount_due: amountDue })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Optimistically update the shoot in state
        setShoots(shoots.map(s => s.id === shootId ? {
           ...s, 
           amount_due: amountDue, 
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Shoots (Deliverables)</h1>
            <p className="text-muted-foreground">Manage agent portal access links and shoot status.</p>
          </div>
          
          <button 
             onClick={() => setShowAddModal(true)}
             className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
             <Plus className="w-4 h-4" /> New Shoot Delivery
          </button>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : shoots.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
           {shoots.map(shoot => (
              <div key={shoot.id} className="bg-card border border-border/50 rounded-xl p-5 shadow-sm group">
                 <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      shoot.status === 'delivered' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {shoot.status}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button className="text-muted-foreground hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                       </button>
                       <button className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
                 
                 <h3 className="font-bold text-lg leading-tight mb-1 truncate" title={shoot.property_address}>{shoot.property_address}</h3>
                 <p className="text-sm text-primary mb-4">{new Date(shoot.shoot_date).toLocaleDateString()}</p>
                 
                 <div className="space-y-3 pt-4 border-t border-border/40 text-sm">
                    <div className="flex flex-col">
                       <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Client</span>
                       <span className="font-medium">
                         {shoot.client_name ? `${shoot.client_name} (ID: ${shoot.client})` : `User ID: ${shoot.client}`}
                       </span>
                    </div>
                    
                    <div className="flex flex-col">
                       <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Delivery Link</span>
                       {shoot.delivery_link ? (
                         <a href={shoot.delivery_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                           {shoot.delivery_link}
                         </a>
                       ) : (
                         <span className="text-muted-foreground italic">Not provided yet</span>
                       )}
                    </div>
                    
                    <div className="flex flex-col mt-4 pt-4 border-t border-border/40">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Payment Status</span>
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${shoot.payment_status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                           {shoot.payment_status || 'unpaid'}
                         </span>
                       </div>
                       
                       {shoot.stripe_payment_link ? (
                         <div className="flex flex-col gap-2 mt-1">
                           <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md border border-border/50">
                             <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice Generated</span>
                             <span className="text-lg font-bold text-green-500">Sent</span>
                           </div>
                         </div>
                       ) : (
                         <button 
                           onClick={() => {
                             setShowInvoiceModal(shoot.id);
                             setAmountDue(shoot.amount_due ? shoot.amount_due.toString() : "");
                           }}
                           className="w-full mt-2 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded font-medium text-sm transition-colors"
                         >
                           Generate Invoice
                         </button>
                       )}
                    </div>
                 </div>
              </div>
           ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card border border-border/50 border-dashed rounded-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-1">No Active Shoots</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">Create a new client shoot to assign delivery links directly to an agent's dashboard.</p>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-lg border border-border/50 p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2">Create Invoice</h2>
            <p className="text-muted-foreground text-sm mb-6">Enter the final amount due for this shoot. We will generate a secure Stripe Payment link.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount Due ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. 250.00"
                  value={amountDue} 
                  onChange={e => setAmountDue(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowInvoiceModal(null)} 
                  className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={() => handleGenerateInvoice(showInvoiceModal)} 
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  disabled={!amountDue || generating}
                >
                  {generating ? "Generating..." : "Create Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Shoot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border/50 p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4">Create New Shoot</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Property Address</label>
                <input 
                  type="text" required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. 123 Main St, Leawood KS"
                  value={addFormData.property_address} 
                  onChange={e => setAddFormData({...addFormData, property_address: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Shoot Date</label>
                <input 
                  type="date" required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={addFormData.shoot_date} 
                  onChange={e => setAddFormData({...addFormData, shoot_date: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  disabled={adding}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  disabled={adding || !addFormData.property_address}
                >
                  {adding ? "Creating..." : "Create Shoot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
