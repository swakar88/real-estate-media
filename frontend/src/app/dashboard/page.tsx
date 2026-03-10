"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Fetch User Profile
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (userRes.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }

        const userData = await userRes.json();
        setUser(userData);

        // Fetch user's shoots
        const shootsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/`, {
           headers: {
             "Authorization": `Bearer ${token}`
           }
        });
        
        if (shootsRes.ok) {
           const shootsData = await shootsRes.json();
           setShoots(shootsData);
        }

      } catch (err) {
        console.error("Dashboard Error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          
          <ScrollReveal>
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-border/40 pb-8">
               <div>
                 <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.first_name || user?.username}!</h1>
                 <p className="text-muted-foreground">Manage your real estate media and download assets.</p>
               </div>
               <button 
                 onClick={handleLogout}
                 className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
               >
                 Log out
               </button>
             </div>
          </ScrollReveal>

          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-8 border border-destructive/20">
              {error}
            </div>
          )}

          <ScrollReveal delay={0.1}>
            <h2 className="text-2xl font-bold mb-6">Your Recent Shoots</h2>
            
            {shoots.length > 0 ? (
               <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {shoots.map((shoot) => (
                    <StaggerItem key={shoot.id} className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col h-full">
                       <div className="mb-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 ${
                            shoot.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 
                            shoot.status === 'editing' ? 'bg-amber-500/20 text-amber-400' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {shoot.get_status_display || shoot.status}
                          </span>
                          <h3 className="font-bold text-lg leading-tight truncate" title={shoot.property_address}>
                            {shoot.property_address}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 text-primary/80 font-medium">
                            {new Date(shoot.shoot_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                       </div>
                       
                       {shoot.notes && (
                         <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground mb-4 italic flex-1">
                           "{shoot.notes}"
                         </div>
                       )}

                       <div className="mt-auto pt-4 border-t border-border/40">
                         {shoot.payment_status === 'unpaid' && shoot.stripe_payment_link ? (
                           <a 
                             href={shoot.stripe_payment_link}
                             className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-bold flex justify-center items-center hover:bg-primary/90 transition-all text-sm shadow-md"
                           >
                              Pay Invoice (${shoot.amount_due}) ↗
                           </a>
                         ) : shoot.payment_status === 'unpaid' ? (
                           <button disabled className="w-full py-2.5 bg-muted text-muted-foreground rounded-md font-medium text-sm border border-border/50 cursor-not-allowed">
                              Awaiting Invoice...
                           </button>
                         ) : shoot.delivery_link ? (
                           <a 
                             href={shoot.delivery_link} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="w-full py-2.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md font-bold flex justify-center items-center hover:bg-green-500 hover:text-white transition-all text-sm"
                           >
                              Download Media ↗
                           </a>
                         ) : (
                           <button disabled className="w-full py-2.5 bg-muted text-muted-foreground rounded-md font-medium text-sm border border-border/50 cursor-not-allowed">
                              Media Processing...
                           </button>
                         )}
                       </div>
                    </StaggerItem>
                 ))}
               </StaggerContainer>
            ) : (
               <div className="text-center py-16 bg-muted/20 border border-dashed border-border/50 rounded-xl">
                 <h3 className="text-xl font-medium mb-2">No shoots found</h3>
                 <p className="text-muted-foreground">You don't have any completed or upcoming shoots yet.</p>
               </div>
            )}
          </ScrollReveal>

        </div>
      </main>

      <Footer />
    </div>
  );
}
