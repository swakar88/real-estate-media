"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store tokens securely (localStorage for this demo)
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        // Handle Django DRF SimpleJWT error messages
        setError(data.detail || "Invalid username or password.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20 bg-background relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

        <ScrollReveal className="w-full max-w-md px-4 relative z-10">
          <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-10 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Agent Portal</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to view your shoots, download media, and manage invoices.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-md border border-destructive/20 text-center font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Username</label>
                <input 
                  type="text" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                  placeholder="agent_username" 
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? (
                   <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                ) : (
                   "Sign In"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/40 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account yet?{" "}
                <Link href="/book" className="text-primary font-medium hover:underline">
                  Book a shoot to get started
                </Link>
              </p>
            </div>
          </div>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
