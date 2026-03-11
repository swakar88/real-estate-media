"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check auth status on mount
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    router.push('/login');
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl tracking-wider uppercase">KC Real<span className="text-primary"> Estate Media</span></span>
        </Link>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="/services" className="transition-colors hover:text-primary">Real Estate & Services</Link>
          <Link href="/gallery" className="transition-colors hover:text-primary">Gallery & Video</Link>
          <Link href="/about" className="transition-colors hover:text-primary">About Us</Link>
        </nav>
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <button 
              onClick={handleLogout}
              className="hidden md:inline-flex text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="hidden md:inline-flex text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Login
            </Link>
          )}
          
          <Link href="/book" className="hidden md:inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            Book Online
          </Link>
          {/* Mobile Menu Button Placeholder */}
          <button className="md:hidden p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
