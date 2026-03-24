import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Calendar, LayoutDashboard, Camera, Settings2, UserCog } from "lucide-react";
import { useGlobalSettings } from "@/context/GlobalSettingsContext";

export default function AdminSidebar() {
  const { settings } = useGlobalSettings();
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/admin-portal", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin-portal/bookings", icon: Calendar },
    { name: "Shoots & Deliveries", href: "/admin-portal/shoots", icon: Camera },
    { name: "Photographers", href: "/admin-portal/photographers", icon: Users },
    { name: "Clients", href: "/admin-portal/clients", icon: UserCog },
    { name: "Admin Hub", href: "/admin-portal/admin-hub", icon: Settings2 },
  ];

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block border-r border-border/40 bg-card/30 min-h-[calc(100vh-[72px])] pt-8 px-4">
      <div className="mb-8 px-4">
        {settings?.sidebar_logo_url ? (
          <img src={settings.sidebar_logo_url} alt={settings.site_name} className="h-6 w-auto object-contain mb-2" />
        ) : (
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{settings?.site_name || "Admin Portal"}</h2>
        )}
      </div>
      
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin-portal" && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
