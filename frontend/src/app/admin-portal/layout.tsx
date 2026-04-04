"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarCheck,
  Camera,
  LogOut,
  Menu,
  X,
  Users,
  UserCircle,
  Settings2
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useGlobalSettings } from "@/context/GlobalSettingsContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useGlobalSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const user = await res.json();
          if (user.is_staff) {
            setAdminUser(user);
            setIsAuthorized(true);
          } else {
             // Not an admin, send to regular dashboard
             router.push("/dashboard");
          }
        } else {
             localStorage.removeItem("access_token");
             router.push("/login");
        }
      } catch (err) {
        console.error("Admin verification failed:", err);
        router.push("/login");
      }
    };

    verifyAdmin();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
         <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const navLinks = [
    { name: "Dashboard", href: "/admin-portal", icon: LayoutDashboard },
    { name: "Booking Requests", href: "/admin-portal/bookings", icon: CalendarCheck },
    { name: "Calendar", href: "/admin-portal/calendar", icon: CalendarCheck },
    { name: "Shoot Tracker", href: "/admin-portal/shoots", icon: Camera },
    { name: "Photographers", href: "/admin-portal/photographers", icon: Users },
    { name: "Clients", href: "/admin-portal/clients", icon: UserCircle },
    { name: "Referrals", href: "/admin-portal/referrals", icon: Users },
    { name: "Admin Hub", href: "/admin-portal/admin-hub", icon: Settings2 },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r border-primary/20 shadow-gold 
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-6 border-b border-border/50">
            {settings?.sidebar_logo_url ? (
              <img src={settings.sidebar_logo_url} alt={settings.site_name} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-extrabold text-xl tracking-tight text-foreground transition-colors duration-300">Admin<span className="text-primary">Portal</span></span>
            )}
            <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/admin-portal" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? "" : "group-hover:rotate-12"}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>

           <div className="p-4 border-t border-primary/10 flex items-center justify-between">
             <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Adjust Theme</div>
             <ThemeToggle />
           </div>
           
           <div className="p-4 border-t border-border/10">

            <div className="flex items-center gap-3 py-2 px-2 border-t border-border/10">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-lg overflow-hidden relative group">
                <span className="relative z-10">{adminUser?.first_name?.[0] || "A"}</span>
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate text-foreground">{adminUser?.first_name || adminUser?.username}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Administrator</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all active:scale-95"
            >
              <div className="p-1.5 rounded-lg bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </div>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-4 bg-card border-b border-primary/20 shadow-gold">
          <span className="font-bold text-lg">Admin Portal</span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-muted-foreground">
             <Menu className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
           {children}
        </div>
      </main>
      
    </div>
  );
}
