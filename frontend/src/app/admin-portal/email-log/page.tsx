"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2, RefreshCw, Filter } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function EmailLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "failed">("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const q = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/email-log/${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.results || data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight italic">Email <span className="text-primary">Audit Log</span></h1>
            <p className="text-muted-foreground">Full history of all outgoing emails sent by the system.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-black/40 rounded-xl border border-primary/10 gap-1">
              {(["all", "sent", "failed"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={fetchLogs} className="p-2.5 bg-card border border-primary/10 rounded-xl hover:bg-primary/10 transition-all" title="Refresh">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : logs.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-primary/10 rounded-[2.5rem] bg-card/50">
          <Mail className="w-14 h-14 text-primary/20 mx-auto mb-4" />
          <h3 className="text-xl font-black italic mb-2">No Emails Logged</h3>
          <p className="text-muted-foreground text-sm">Emails will appear here once the system sends them.</p>
        </div>
      ) : (
        <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] shadow-gold overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-primary/10 bg-primary/5">
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Status</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Sent At</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Recipient</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Subject</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Trigger</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">Template</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-primary/10 transition-colors">
                    <td className="px-6 py-4">
                      {log.status === 'sent' ? (
                        <span className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase"><CheckCircle2 className="w-3.5 h-3.5" /> Sent</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-destructive font-black text-[10px] uppercase" title={log.error_message}><AlertCircle className="w-3.5 h-3.5" /> Failed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.sent_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-medium">{log.recipient}</td>
                    <td className="px-6 py-4 max-w-[250px] truncate font-bold" title={log.subject}>{log.subject}</td>
                    <td className="px-6 py-4 text-muted-foreground">{log.trigger_event || '—'}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-[10px]">{log.template_slug || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
