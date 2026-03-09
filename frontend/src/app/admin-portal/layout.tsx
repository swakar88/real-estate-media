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
  X
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
    { name: "Overview", href: "/admin-portal", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin-portal/bookings", icon: CalendarCheck },
    { name: "Client Shoots", href: "/admin-portal/shoots", icon: Camera },
    { name: "Gallery", href: "/admin-portal/gallery", icon: ImageIcon },
  ];

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      
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
            <span className="font-extrabold text-xl tracking-tight">Admin<span className="text-primary">Portal</span></span>
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
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {adminUser?.first_name?.[0] || "A"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{adminUser?.first_name || adminUser?.username}</span>
                <span className="text-xs text-muted-foreground mt-1">Administrator</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
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
