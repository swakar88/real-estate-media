"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Search, Mail, Calendar, Clock, ChevronLeft, ChevronRight, UserCircle, X, Phone, Shield, Archive, Trash2, Eye, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import CustomModal from "@/components/CustomModal";

interface Client {
  id: number;
  username: string;
  email: string;
  full_name: string;
  booking_count: number;
  last_login: string | null;
  date_joined: string;
}

export default function AdminClients() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClientModal, setNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ first_name: "", last_name: "", email: "" });
  const [newClientLoading, setNewClientLoading] = useState(false);
  interface ModalConfig {
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    onConfirm?: () => void;
    showCancel?: boolean;
    confirmText?: string;
  }

  const [modalConfig, setModalConfig] = useState<ModalConfig>({ 
    isOpen: false, 
    title: "", 
    message: "", 
    type: "info", 
    onConfirm: undefined,
    showCancel: true
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchClients();
  }, []);

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewClientLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/clients/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newClientForm),
      });
      if (res.ok) {
        toast.success(`Invite sent to ${newClientForm.email}`);
        setNewClientModal(false);
        setNewClientForm({ first_name: "", last_name: "", email: "" });
        fetchClients();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create client.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setNewClientLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/clients/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setClients(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const newClientsThisMonth = clients.filter(c => {
    const joined = new Date(c.date_joined);
    return joined.getMonth() === currentMonth && joined.getFullYear() === currentYear;
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Directory</h1>
            <p className="text-muted-foreground">Manage and track your customer base.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-4 py-2.5 border border-primary/20 rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-full md:w-72 transition-all shadow-gold"
              />
            </div>
            <button
              onClick={() => setNewClientModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Client
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Stats Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StaggerItem>
          <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 shadow-gold flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
               <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Clients</p>
              <p className="text-2xl font-black italic">{clients.length}</p>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 shadow-gold flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
               <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">New (This Month)</p>
              <p className="text-2xl font-black italic">{newClientsThisMonth}</p>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {loading ? (
        <div className="py-20 flex justify-center">
           <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] overflow-hidden shadow-gold">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-6 py-4 font-bold text-muted-foreground">Client Info</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground text-center">Bookings</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground">Joined Date</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedClients.map(client => (
                    <tr 
                      key={client.id} 
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {client.full_name ? client.full_name[0] : (client.username ? client.username[0] : '?')}
                          </div>
                          <div>
                            <div className="font-bold text-base">{client.full_name || client.username}</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted font-bold text-primary">
                          {client.booking_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 opacity-50" />
                          {client.date_joined ? new Date(client.date_joined).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 opacity-50" />
                          <span className={client.last_login ? "text-foreground font-medium" : "text-muted-foreground italic text-xs"}>
                            {client.last_login ? new Date(client.last_login).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredClients.length)}</span> of <span className="font-medium">{filteredClients.length}</span> clients
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-border rounded-lg bg-background hover:bg-muted disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-border rounded-lg bg-background hover:bg-muted disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-24 bg-card border border-border/50 border-dashed rounded-3xl flex flex-col items-center">
          <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
            <UserCircle className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold mb-1">No clients found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {searchTerm ? `No results for "${searchTerm}"` : "You don't have any client registrations yet."}
          </p>
        </div>
      )}

      {/* Client Detail Slide-over */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedClient(null)}
          />
          <div className="relative w-full max-w-md bg-card border-l border-primary/20 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Client Details</h2>
              <button 
                onClick={() => setSelectedClient(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl mb-4 shadow-gold">
                  {selectedClient.full_name ? selectedClient.full_name[0] : (selectedClient.username ? selectedClient.username[0] : '?')}
                </div>
                <h3 className="text-2xl font-black italic">{selectedClient.full_name || selectedClient.username}</h3>
                <p className="text-muted-foreground">{selectedClient.email}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">User ID</p>
                  <p className="font-mono text-sm">#{selectedClient.id}</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Total Bookings</p>
                  <p className="font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {selectedClient.booking_count}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Account Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined on {new Date(selectedClient.date_joined).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Last login: {selectedClient.last_login ? new Date(selectedClient.last_login).toLocaleString() : 'Never'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <button
                  onClick={() => {
                    sessionStorage.setItem('impersonating_as', String(selectedClient.id));
                    router.push('/dashboard');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-gold group"
                >
                  <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
                  View Dashboard as Client
                </button>
                <button className="w-full py-3 px-4 rounded-xl border border-primary/20 font-bold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Client
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => {
                        setModalConfig({
                          isOpen: true,
                          title: "Client Archived",
                          message: "Client history has been preserved. (Simulation)",
                          type: "success",
                          showCancel: false,
                          onConfirm: () => {
                            setSelectedClient(null);
                            setModalConfig((prev) => ({ ...prev, isOpen: false }));
                          }
                        });
                    }}
                    className="py-3 px-4 rounded-xl border border-border bg-muted/20 font-bold text-xs hover:bg-amber-500/10 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
                   >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                  <button 
                    onClick={() => {
                        if (selectedClient.booking_count > 0) {
                            setModalConfig({
                              isOpen: true,
                              title: "Cannot Delete",
                              message: "Cannot delete client with existing bookings. Please archive instead.",
                              type: "warning",
                              showCancel: false
                            });
                        } else {
                            setModalConfig({
                              isOpen: true,
                              title: "Confirm Deletion",
                              message: "Are you sure you want to permanently delete this client?",
                              type: "warning",
                              showCancel: true,
                              onConfirm: () => {
                                // Real deletion logic would go here
                                 setModalConfig((prev) => ({ ...prev, isOpen: false }));
                                setSelectedClient(null);
                              }
                            });
                        }
                    }}
                    className="py-3 px-4 rounded-xl border border-border bg-muted/20 font-bold text-xs hover:bg-red-500/10 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        showCancel={modalConfig.showCancel}
      />

      {/* New Client Modal */}
      {newClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setNewClientModal(false)}>
          <div className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-primary/20 p-10 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black">New Client</h2>
                <p className="text-sm text-muted-foreground mt-1">An invite email will be sent to set their password.</p>
              </div>
              <button onClick={() => setNewClientModal(false)} className="p-2 hover:bg-primary/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">First Name</label>
                  <input
                    type="text" required
                    value={newClientForm.first_name}
                    onChange={e => setNewClientForm(p => ({ ...p, first_name: e.target.value }))}
                    className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Last Name</label>
                  <input
                    type="text" required
                    value={newClientForm.last_name}
                    onChange={e => setNewClientForm(p => ({ ...p, last_name: e.target.value }))}
                    className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Address</label>
                <input
                  type="email" required
                  value={newClientForm.email}
                  onChange={e => setNewClientForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="jane@agency.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setNewClientModal(false)} className="flex-1 py-3 bg-muted text-muted-foreground font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-muted/80 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={newClientLoading} className="flex-1 py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-gold hover:shadow-gold-heavy transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {newClientLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
