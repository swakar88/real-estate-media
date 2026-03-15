"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Search, Mail, Calendar, Clock, ChevronLeft, ChevronRight, UserCircle } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

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
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchClients();
  }, []);

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
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
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
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2.5 border border-border/50 rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-full md:w-80 transition-all shadow-sm"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Stats Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StaggerItem>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
               <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Total Clients</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
               <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">New (This Month)</p>
              <p className="text-2xl font-bold">{newClientsThisMonth}</p>
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
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
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
                    <tr key={client.id} className="hover:bg-muted/20 transition-colors group">
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
    </div>
  );
}
