"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Sun, 
  Moon, 
  CreditCard,
  AlertCircle,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useGlobalSettings } from "@/context/GlobalSettingsContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useGlobalSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login?redirect=/dashboard");
        return;
      }

      const queryParams = new URLSearchParams(window.location.search);
      const impId = queryParams.get('impersonate_id');
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/${impId ? `?impersonate_id=${impId}` : ''}`;

      try {
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setIsAuthorized(true);
        } else {
          localStorage.removeItem("access_token");
          router.push("/login");
        }
      } catch (err) {
        console.error("Dashboard auth failed:", err);
        router.push("/login");
      }
    };

    fetchUser();
  }, [router]);


  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    toast.success("Successfully signed out");
    router.push("/login");
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
         <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      </div>
    );
  }

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bookings", href: "/dashboard/bookings", icon: Calendar },
    { name: "Billing History", href: "/dashboard/billing", icon: CreditCard },
    { name: "Support Hub", href: "/dashboard/support", icon: AlertCircle },
    { name: "Referrals", href: "/dashboard/referrals", icon: User },
    { name: "Profile", href: "/dashboard/profile", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground antialiased">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 md:hidden animate-in fade-in transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/40 shadow-2xl 
        transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0 outline outline-primary/10" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col pt-8">
          <div className="px-8 mb-10">
            <div className="flex items-center gap-3 mb-2">
              {settings?.sidebar_logo_url ? (
                <img src={settings.sidebar_logo_url} alt={settings.site_name} className="h-8 w-auto object-contain" />
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/30">
                    {settings?.site_name?.[0] || "K"}
                    {settings?.site_name?.split(' ')[1]?.[0] || "C"}
                  </div>
                  <span className="font-black text-xl tracking-tight">Client Hub</span>
                </>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">{settings?.site_name || "KC Real Estate Media"}</p>
          </div>

          <div className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none mb-2">Main Menu</div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group relative
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 ring-1 ring-primary/20" 
                      : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "scale-110" : "group-hover:rotate-12 group-hover:scale-110"}`} />
                  {link.name}
                  {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-foreground/40 blur-[1px]"></div>}
                </Link>
              );
            })}
          </div>

          <div className="p-6 border-t border-border/40 space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-lg shadow-sm">
                {user?.first_name?.[0] || user?.username?.[0] || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate leading-tight">{user?.first_name || user?.username}</span>
                <span className="text-[10px] font-medium text-muted-foreground/60">Business Account</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-all group text-destructive"
              >
                <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-muted/10 relative">
        {/* Subtle background glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-5 bg-card border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground text-xs">KC</div>
            <span className="font-bold text-sm tracking-tight">Client Hub</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
             <Menu className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
           <div className="max-w-[1400px] mx-auto p-6 md:p-10 lg:p-12">
              {children}
           </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary), 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary), 0.2);
        }
      `}</style>
    </div>
  );
}
