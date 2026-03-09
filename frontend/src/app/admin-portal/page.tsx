"use client";

import { useEffect, useState } from "react";
import { FolderGit2, Users, Calendar, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    bookings: 0,
    shoots: 0,
    galleryImages: 0
  });

  useEffect(() => {
    // In a real app, you would fetch these from a statistics endpoint.
    // Since we don't have one, we'll fetch the individual endpoints or just show static UI
    const fetchStats = async () => {
       const token = localStorage.getItem("access_token");
       try {
         // This is just a quick aggregate simulation - real app would use a summary API
         const [bookRes, shootsRes, galleryRes] = await Promise.all([
             fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/`, { headers: { "Authorization": `Bearer ${token}` } }),
             fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, { headers: { "Authorization": `Bearer ${token}` } }),
             fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/gallery/`, { cache: 'no-store' }),
         ]);
         
         if (bookRes.ok && shootsRes.ok && galleryRes.ok) {
           const books = await bookRes.json();
           const shoots = await shootsRes.json();
           const gallery = await galleryRes.json();
           
           setStats({
             bookings: books.length,
             shoots: shoots.length,
             galleryImages: gallery.length
           });
         }
       } catch (e) {
         console.error("Failed to fetch stats", e);
       }
    };
    
    fetchStats();
  }, []);

  const statCards = [
    { title: "Pending Bookings", value: stats.bookings, icon: Calendar, href: "/admin-portal/bookings", color: "text-blue-500" },
    { title: "Active Shoots", value: stats.shoots, icon: Users, href: "/admin-portal/shoots", color: "text-green-500" },
    { title: "Gallery Assets", value: stats.galleryImages, icon: FolderGit2, href: "/admin-portal/gallery", color: "text-purple-500" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome to the KC Real Estate Media control center.</p>
        </div>
      </ScrollReveal>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.title}>
              <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors group relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                  <div className={`p-2 bg-background rounded-md shadow-sm ${stat.color}`}>
                     <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                
                <Link href={stat.href} className="absolute inset-0 z-20 focus:outline-none">
                  <span className="sr-only">View {stat.title}</span>
                </Link>
                
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-muted-foreground group-hover:text-primary">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <ScrollReveal delay={0.2} className="mt-8">
        <div className="bg-card border border-border/50 rounded-xl p-8 text-center border-dashed">
          <h3 className="text-xl font-bold mb-2">Ready to manage content?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Use the sidebar navigation to review incoming bookings, deliver shoot assets to clients, or update the portfolio gallery.</p>
          <div className="flex flex-wrap justify-center gap-4">
             <Link href="/admin-portal/bookings" className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
               Review Bookings
             </Link>
             <Link href="/admin-portal/shoots" className="px-6 py-2 border border-border bg-background hover:bg-muted font-medium rounded-md transition-colors">
               Deliver Shoots
             </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
