"use client";

import { useState, useEffect } from "react";
import { Search, X, User, Camera, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "clients" | "photographers";
  title: string;
}

export default function UserSelectionModal({ isOpen, onClose, mode, title }: UserSelectionModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, mode]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const endpoint = mode === "clients" ? "/api/clients/" : "/api/photographers/";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${endpoint}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(`Failed to fetch ${mode}`, err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const name = u.full_name || u.user_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "";
    const email = u.email || u.user_email || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleImpersonate = (userId: number) => {
    const targetPath = mode === "clients" ? "/dashboard" : "/photographer-portal";
    router.push(`${targetPath}?impersonate_id=${userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-[2.5rem] border border-primary/20 shadow-gold-heavy overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              {mode === "clients" ? <User className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-black italic text-foreground uppercase tracking-tight">{title}</h2>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mt-1">Select identity to view</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${mode === "clients" ? "clients" : "photographers"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-black/40 border border-primary/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold"
              autoFocus
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-50">Searching Registry...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: any) => {
                const name = user.full_name || user.user_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "Unknown User";
                const email = user.email || user.user_email || "No email";
                const userId = mode === "clients" ? user.id : user.user; // Photographer id is usually linking to user id for impersonation

                return (
                  <button
                    key={user.id}
                    onClick={() => handleImpersonate(userId)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{email}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground italic">
                <p className="text-sm font-bold uppercase tracking-widest opacity-50">No users found</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/30 text-center border-t border-primary/5">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
            Impersonation session will be active until you logout or clear context
          </p>
        </div>
      </div>
    </div>
  );
}
