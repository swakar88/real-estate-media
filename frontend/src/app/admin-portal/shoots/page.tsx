"use client";

import { useEffect, useState } from "react";
import { Camera, Plus, Trash2, Edit } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function AdminShoots() {
  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Shoots (Deliverables)</h1>
            <p className="text-muted-foreground">Manage agent portal access links and shoot status.</p>
          </div>
          
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
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
                       <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Client User ID</span>
                       <span className="font-medium">{shoot.client}</span>
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
    </div>
  );
}
