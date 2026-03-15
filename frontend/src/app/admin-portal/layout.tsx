"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  CalendarCheck, 
  Camera, 
  LogOut,
  Menu,
  X,
  Users,
  MonitorPlay,
  UserCircle,
  Mail,
  FileText,
  Sun,
  Moon
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin-theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
         <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const navLinks = [
    { name: "Dashboard", href: "/admin-portal", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin-portal/bookings", icon: CalendarCheck },
    { name: "Client Shoots", href: "/admin-portal/shoots", icon: Camera },
    { name: "Photographers", href: "/admin-portal/photographers", icon: Users },
    { name: "Clients", href: "/admin-portal/clients", icon: UserCircle },
    { name: "Portfolio", href: "/admin-portal/gallery", icon: ImageIcon },
    { name: "Site Media", href: "/admin-portal/site-media", icon: MonitorPlay },
    { name: "Email Config", href: "/admin-portal/email-config", icon: Mail },
    { name: "Email Templates", href: "/admin-portal/email-templates", icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden text-foreground">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 shadow-xl 
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-6 border-b border-border/50">
            <span className="font-extrabold text-xl tracking-tight text-foreground transition-colors duration-300">Admin<span className="text-primary">Portal</span></span>
            <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
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

          <div className="p-4 border-t border-border/50 space-y-4">
            <div className="bg-muted px-2 py-2 rounded-2xl">
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all bg-card/50 shadow-sm border border-border/10"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isDark ? "bg-primary/20 text-primary" : "bg-orange-100 text-orange-600"}`}>
                    {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </div>
                  <span className="text-foreground">{isDark ? "Dark Theme" : "Light Theme"}</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isDark ? 'bg-primary' : 'bg-slate-300 shadow-inner'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

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
        <header className="md:hidden flex items-center justify-between px-4 py-4 bg-card border-b border-border/50">
          <span className="font-bold text-lg">Admin Portal</span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-muted-foreground">
             <Menu className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
           {children}
        </div>
      </main>
      
    </div>
  );
}
