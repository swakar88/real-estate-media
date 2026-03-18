"use client";

import { useState } from "react";
import { 
  Send, 
  MessageSquare, 
  LifeBuoy, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export default function SupportHubPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    topic: "other",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem("access_token");
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/support-tickets/`;

    try {
      // Get user name and email from local storage or another me fetch if needed, 
      // but for simplicity we assume the backend handles the authenticated user.
      // We still need name/email for the ticket model.
      
      // Let's fetch 'me' first if we don't have it
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await meRes.json();

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          name: userData.full_name || userData.first_name || userData.username,
          email: userData.email
        })
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Support ticket submitted successfully!");
      } else {
        toast.error("Failed to submit ticket. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting support ticket:", err);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center text-success mb-2 shadow-sm ring-1 ring-success/20">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-black">Support Ticket Received!</h1>
        <p className="text-muted-foreground max-w-md font-medium">Your request has been sent to our team. We'll review it and get back to you at your registered email address as soon as possible.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-gold hover:scale-[1.02] transition-all active:scale-95"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">Support Hub</h1>
        <p className="text-muted-foreground font-medium max-w-2xl mx-auto italic">How can we help you today? Select a topic and tell us what's on your mind.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Info/Status */}
        <div className="space-y-6">
           <div className="bg-card p-8 rounded-[2rem] border border-border/40 shadow-sm">
              <h3 className="text-lg font-black mb-6">Need Immediate Help?</h3>
              <div className="space-y-4">
                 {[
                   { label: "Knowledge Base", icon: HelpCircle, color: "text-info" },
                   { label: "Billing Documentation", icon: ShieldCheck, color: "text-success" },
                   { label: "System Status", icon: Clock, color: "text-warning" },
                 ].map((item) => (
                   <button key={item.label} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/20 group">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg bg-card shadow-sm ${item.color}`}>
                            <item.icon className="h-4 w-4" />
                         </div>
                         <span className="text-sm font-bold">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-all" />
                   </button>
                 ))}
              </div>
           </div>

           <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-lg font-black mb-2 relative z-10">Response Time</h3>
              <p className="text-sm text-muted-foreground relative z-10 font-medium">Our typical response time is within 12-24 business hours.</p>
           </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <div className="bg-card p-10 rounded-[2.5rem] border border-border/40 shadow-sm">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              Contact Support
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Inquiry Topic</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: "billing", label: "Billing" },
                    { id: "technical", label: "Technical" },
                    { id: "booking", label: "Booking" },
                    { id: "other", label: "Other" },
                  ].map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, topic: topic.id })}
                      className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                        formData.topic === topic.id 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                        : "bg-background border-border/40 hover:border-primary/40"
                      }`}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Subject</label>
                <input
                  required
                  type="text"
                  placeholder="Summarize your issue..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-5 py-4 bg-background border border-border/40 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Detailed Message</label>
                <textarea
                  required
                  rows={6}
                  placeholder="How can we help? Please be as specific as possible..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-5 py-4 bg-background border border-border/40 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between gap-6">
                <p className="text-[10px] text-muted-foreground/60 font-medium italic">
                  By clicking submit, you agree to our terms of service regarding support requests.
                </p>
                <button
                  disabled={submitting}
                  type="submit"
                  className="shrink-0 flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? "Sending..." : (
                    <><Send className="h-4 w-4" /> Submit Ticket</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
