"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2, RefreshCw, X, ChevronRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function EmailLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "failed">("all");
  const [selected, setSelected] = useState<any | null>(null);

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
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {logs.map((log: any) => (
                  <tr key={log.id} onClick={() => setSelected(log)} className="hover:bg-primary/10 transition-colors cursor-pointer">
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
                    <td className="px-6 py-4 text-muted-foreground"><ChevronRight className="w-3.5 h-3.5" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-primary/20 flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between p-8 pb-4 border-b border-primary/10">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  {selected.status === 'sent' ? (
                    <span className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase"><CheckCircle2 className="w-3.5 h-3.5" /> Sent</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-destructive font-black text-[10px] uppercase"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>
                  )}
                  <span className="text-muted-foreground text-[10px]">
                    {new Date(selected.sent_at).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-xl font-black truncate">{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-primary/10 rounded-xl transition-colors flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata */}
            <div className="px-8 py-4 border-b border-primary/10 grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
              <div><span className="text-muted-foreground uppercase tracking-widest font-black text-[10px]">To</span><p className="font-medium mt-0.5">{selected.recipient}</p></div>
              {selected.cc && <div><span className="text-muted-foreground uppercase tracking-widest font-black text-[10px]">CC</span><p className="font-medium mt-0.5">{selected.cc}</p></div>}
              {selected.bcc && <div><span className="text-muted-foreground uppercase tracking-widest font-black text-[10px]">BCC</span><p className="font-medium mt-0.5">{selected.bcc}</p></div>}
              {selected.trigger_event && <div><span className="text-muted-foreground uppercase tracking-widest font-black text-[10px]">Trigger</span><p className="font-medium mt-0.5">{selected.trigger_event}</p></div>}
              {selected.template_slug && <div><span className="text-muted-foreground uppercase tracking-widest font-black text-[10px]">Template</span><p className="font-mono text-[10px] mt-0.5">{selected.template_slug}</p></div>}
              {selected.error_message && (
                <div className="col-span-2">
                  <span className="text-destructive uppercase tracking-widest font-black text-[10px]">Error</span>
                  <p className="text-destructive text-xs mt-0.5 font-mono">{selected.error_message}</p>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {selected.body ? (
                <iframe
                  srcDoc={selected.body}
                  className="w-full rounded-xl border border-primary/10 bg-white"
                  style={{ minHeight: '420px' }}
                  sandbox="allow-same-origin"
                  title="Email preview"
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  No email body recorded for this message.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
