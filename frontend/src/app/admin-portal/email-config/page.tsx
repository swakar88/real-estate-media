"use client";

import { useState, useEffect } from "react";
import { 
  Mail, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";

export default function EmailConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState({
    title: "Primary SMTP",
    email_host: "",
    email_port: 587,
    email_username: "",
    email_password: "",
    email_from_address: "",
    email_from_name: "KC Real Estate Media",
    use_tls: true,
    use_ssl: false,
    is_active: true,
    default_cc: "",
    default_bcc: "",
    test_mode: false,
    test_email_admin: "",
    test_email_client: "",
    test_email_photographer: ""
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/email-configuration/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const remoteConfig = Array.isArray(data) ? data[0] : (data.results ? data.results[0] : null);
        
        if (remoteConfig) {
          setConfig(prev => ({
            ...prev,
            ...remoteConfig,
            email_password: "" // Don't show password even if it comes back
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch email config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const isUpdate = (config as any).id !== undefined;
      const url = isUpdate 
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/email-configuration/${(config as any).id}/`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/email-configuration/`;
      
      // Filter out empty password if updating
      const payload = { ...config };
      if (isUpdate && !payload.email_password) {
        delete (payload as any).email_password;
      }

      const res = await fetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Email configuration saved successfully!");
        fetchConfig();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save configuration");
      }
    } catch (err) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.email_host || !config.email_username || !config.email_from_address) {
      toast.error("Please fill in host, username, and from address before testing.");
      return;
    }

    setTesting(true);
    setTestError(null);
    setTestSuccess(false);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/email-configuration/test-connection/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (res.ok) {
        setTestSuccess(true);
        toast.success(data.message || "Test email sent successfully!");
      } else {
        setTestError(data.error || "Connection test failed");
      }
    } catch (err) {
      setTestError("An error occurred during testing. Check your network connection.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Email Configuration</h1>
        <p className="text-muted-foreground">Manage your SMTP settings for system notifications (replacing Resend).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] shadow-gold overflow-hidden">
            <div className="p-8 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black italic">SMTP <span className="text-primary italic">Settings</span></h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.is_active ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                  {config.is_active ? 'Active Connection' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Config Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={e => setConfig({...config, title: e.target.value})}
                    className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    placeholder="e.g. Gmail SMTP"
                  />
                </div>
                <div className="space-y-2 text-transparent select-none pointer-events-none hidden sm:block">.</div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Host</label>
                  <input
                    type="text"
                    value={config.email_host}
                    onChange={e => setConfig({...config, email_host: e.target.value})}
                    className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Port</label>
                  <input
                    type="number"
                    value={config.email_port}
                    onChange={e => setConfig({...config, email_port: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    placeholder="587"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Username / Email</label>
                  <input
                    type="text"
                    value={config.email_username}
                    onChange={e => setConfig({...config, email_username: e.target.value})}
                    className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    placeholder="your-email@gmail.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password / App Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={config.email_password}
                      onChange={e => setConfig({...config, email_password: e.target.value})}
                      className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 pr-12 text-sm"
                      placeholder={ (config as any).id ? "•••••••• (Keep Current)" : "Enter password"}
                      required={!(config as any).id}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">From Address</label>
                  <input
                    type="email"
                    value={config.email_from_address}
                    onChange={e => setConfig({...config, email_from_address: e.target.value})}
                    className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    placeholder="noreply@kcremedia.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Name</label>
                  <input
                    type="text"
                    value={config.email_from_name}
                    onChange={e => setConfig({...config, email_from_name: e.target.value})}
                    className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    placeholder="KC Real Estate Media"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Default CC</label>
                  <input
                    type="email"
                    value={config.default_cc || ""}
                    onChange={e => setConfig({...config, default_cc: e.target.value})}
                    className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
                    placeholder="manager@kcremedia.com (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default BCC</label>
                  <input
                    type="email"
                    value={config.default_bcc || ""}
                    onChange={e => setConfig({...config, default_bcc: e.target.value})}
                    className="w-full px-4 py-3 bg-black/40 border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
                    placeholder="backup@kcremedia.com (optional)"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${config.use_tls ? 'bg-primary' : 'bg-muted'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={config.use_tls}
                      onChange={e => setConfig({...config, use_tls: e.target.checked, use_ssl: e.target.checked ? false : config.use_ssl})}
                    />
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${config.use_tls ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-sm font-medium">Use TLS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${config.use_ssl ? 'bg-primary' : 'bg-muted'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={config.use_ssl}
                      onChange={e => setConfig({...config, use_ssl: e.target.checked, use_tls: e.target.checked ? false : config.use_tls})}
                    />
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${config.use_ssl ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-sm font-medium">Use SSL</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${config.is_active ? 'bg-primary' : 'bg-muted'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={config.is_active}
                      onChange={e => setConfig({...config, is_active: e.target.checked})}
                    />
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${config.is_active ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-sm font-medium">Is Active</span>
                </label>
              </div>
            </div>

            {/* Test Mode */}
            <div className="p-6 border-t border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Test Mode</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">When enabled, all outgoing emails are redirected to the addresses below instead of real recipients.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${config.test_mode ? 'bg-yellow-500' : 'bg-muted'}`}>
                    <input type="checkbox" className="hidden" checked={config.test_mode} onChange={e => setConfig({...config, test_mode: e.target.checked})} />
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${config.test_mode ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-sm font-medium">{config.test_mode ? 'On' : 'Off'}</span>
                </label>
              </div>
              {config.test_mode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-yellow-400">Admin emails →</label>
                    <input type="email" value={config.test_email_admin || ""} onChange={e => setConfig({...config, test_email_admin: e.target.value})}
                      className="w-full px-3 py-2 bg-black/40 border border-yellow-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm font-mono"
                      placeholder="admin@test.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-yellow-400">Client emails →</label>
                    <input type="email" value={config.test_email_client || ""} onChange={e => setConfig({...config, test_email_client: e.target.value})}
                      className="w-full px-3 py-2 bg-black/40 border border-yellow-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm font-mono"
                      placeholder="client@test.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-yellow-400">Photographer emails →</label>
                    <input type="email" value={config.test_email_photographer || ""} onChange={e => setConfig({...config, test_email_photographer: e.target.value})}
                      className="w-full px-3 py-2 bg-black/40 border border-yellow-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm font-mono"
                      placeholder="photographer@test.com" />
                  </div>
                </div>
              )}
            </div>

            {(testError || testSuccess) && (
              <div className={`mx-6 mb-0 mt-4 p-4 rounded-xl border text-sm flex gap-3 ${testError ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
                {testError ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
                <span>{testError || "Test email sent successfully! Check your inbox."}</span>
              </div>
            )}

            <div className="p-6 bg-muted/30 border-t border-border/50 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving}
                className="flex items-center gap-2 px-6 py-3 bg-card border border-primary/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Send className="h-4 w-4 text-primary" />}
                Test Connection
              </button>
              <button
                type="submit"
                disabled={saving || testing}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 shadow-gold transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Configuration
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl p-8 shadow-gold">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Information
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                By configuring SMTP, all system-generated emails (bookings, invites, invoices) will be sent through your own mail server.
              </p>
              <p>
                <strong>Gmail Users:</strong> You must use an <em>App Password</em> if you have 2FA enabled. Common port is 587 with TLS.
              </p>
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-primary text-xs">
                <p className="font-semibold mb-1">Backup Fallback</p>
                The system will automatically fall back to Resend if your SMTP configuration is disabled or fails to connect.
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Security
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your SMTP credentials are encrypted at rest and never sent to the frontend during reads.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                     <Lock className="h-3 w-3" />
                   </div>
                 ))}
              </div>
              <span className="text-xs font-medium">AES-256 Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
