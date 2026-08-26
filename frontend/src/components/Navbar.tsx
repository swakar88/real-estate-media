"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useGlobalSettings } from '@/context/GlobalSettingsContext';

export default function Navbar() {
  const { settings } = useGlobalSettings();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPhotographer, setIsPhotographer] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check auth status on mount
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);

    if (token) {
      fetchUserRole(token);
    }
  }, []);

  const fetchUserRole = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsPhotographer(data.is_photographer);
        setIsAdmin(data.is_staff);
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setIsPhotographer(false);
    setIsAdmin(false);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Admins and Photographers are "staff", Clients are not.
  const isStaff = isAdmin || isPhotographer;
  const showPublicLinks = !isLoggedIn || isStaff;

  const getDashboardLink = () => {
    if (isAdmin) return '/admin-portal';
    if (isPhotographer) return '/photographer-portal';
    return '/dashboard';
  };

  const dashboardLabel = isAdmin ? "Admin Portal" : (isPhotographer ? "Photographer Portal" : "My Dashboard");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <img src={settings?.site_logo_url || "/logo.png"} alt={settings?.site_name || "KC Real Estate Media"} className="h-14 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {showPublicLinks && (
            <>
              <Link href="/services" className="transition-colors hover:text-primary">Real Estate & Services</Link>
              <Link href="/gallery" className="transition-colors hover:text-primary">Gallery & Video</Link>
              <Link href="/about" className="transition-colors hover:text-primary">About Us</Link>
            </>
          )}
          <Link href="/pricing" className="transition-colors hover:text-primary">Pricing</Link>
          <Link href="/why-us" className="transition-colors hover:text-primary">Why Choose Us</Link>
          {isLoggedIn && (
            <Link href={getDashboardLink()} className="transition-colors text-primary font-bold">{dashboardLabel}</Link>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          <div>
            <ThemeToggle />
          </div>
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
          
          {showPublicLinks && (
            <Link href="/book" className="hidden md:inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow-gold hover:shadow-gold-heavy hover:scale-105 transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              Book Online
            </Link>
          )}
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background absolute top-20 left-0 w-full shadow-gold hover:shadow-gold-heavy-lg">
          <nav className="flex flex-col p-4 space-y-4 text-sm font-medium">
            {showPublicLinks && (
              <>
                <Link href="/services" onClick={closeMobileMenu} className="transition-colors hover:text-primary p-2">Real Estate & Services</Link>
                <Link href="/gallery" onClick={closeMobileMenu} className="transition-colors hover:text-primary p-2">Gallery & Video</Link>
                <Link href="/about" onClick={closeMobileMenu} className="transition-colors hover:text-primary p-2">About Us</Link>
              </>
            )}
            <Link href="/pricing" onClick={closeMobileMenu} className="transition-colors hover:text-primary p-2">Pricing</Link>
            <Link href="/why-us" onClick={closeMobileMenu} className="transition-colors hover:text-primary p-2">Why Choose Us</Link>

            {isLoggedIn && (
              <Link href={getDashboardLink()} onClick={closeMobileMenu} className="transition-colors text-primary font-bold p-2">{dashboardLabel}</Link>
            )}
            
            <div className="h-px w-full bg-border/40 my-2"></div>
            
            {isLoggedIn ? (
              <button 
                onClick={handleLogout}
                className="text-left text-destructive hover:text-destructive/80 transition-colors p-2"
              >
                Logout
              </button>
            ) : (
              <Link href="/login" onClick={closeMobileMenu} className="text-muted-foreground hover:text-primary transition-colors p-2">
                Login
              </Link>
            )}
            
            {showPublicLinks && (
              <Link href="/book" onClick={closeMobileMenu} className="flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow-gold hover:shadow-gold-heavy transition-colors hover:bg-primary/90 mt-2">
                Book Online
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
