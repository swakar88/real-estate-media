"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function PhotographerSignup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing invitation token. Please check the link in your email.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographers/accept-invite/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save tokens and redirect to photographer portal
        localStorage.setItem("access_token", data.access);
        if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
        
        router.push("/photographer-portal");
      } else {
        setError(data.detail || "Failed to set password. Your invitation link may be expired.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

        <ScrollReveal className="w-full max-w-md px-4 relative z-10">
          <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-10 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                Welcome to the Team
              </h1>
              <p className="text-sm text-muted-foreground">
                Please set a secure password to activate your photographer account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-md border border-destructive/20 text-center font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">New Password</label>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                  placeholder="••••••••" 
                  required
                  disabled={!token}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                  placeholder="••••••••" 
                  required
                  disabled={!token}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !token}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? (
                   <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                ) : (
                   "Activate Account"
                )}
              </button>
            </form>
          </div>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
