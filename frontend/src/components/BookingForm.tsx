"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { StaggerContainer, StaggerItem, ScrollReveal } from "@/components/ScrollReveal";

export default function BookingForm({ packages }: { packages: any[] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [fetchingSlots, setFetchingSlots] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Pre-fill referral code from ?ref= URL param
    const refCode = searchParams.get("ref");
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode.toUpperCase() }));
    }

    // Check authentication and prefill data
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsAuthenticated(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
         setFormData(prev => ({
           ...prev,
           firstName: data.first_name || "",
           lastName: data.last_name || "",
           email: data.email || ""
         }));
      })
      .catch(() => setIsAuthenticated(false));
    } else {
      setIsAuthenticated(false);
    }

    // Fetch Slots
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/availability/`)
      .then(res => res.json())
      .then(data => {
        setAvailableSlots(data);
        setFetchingSlots(false);
      })
      .catch(err => {
        console.error("Failed to fetch slots", err);
        setFetchingSlots(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    packageId: "",
    propertyDetails: "",
    sqft: "",
    referralCode: "",
    shootDate: "",
    timeSlot: ""
  });

  const handlePackageSelect = (pkgId: string) => {
    setFormData(prev => ({ ...prev, packageId: pkgId }));
    const formElement = document.getElementById("booking-form-section");
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const submitBooking = async (force = false) => {
    setLoading(true);
    setError("");
    setDuplicateWarning(false);

    if (!/^[\d\s\-\(\)\+]{7,20}$/.test(formData.phone)) {
      setError("Please enter a valid phone number (digits, spaces, dashes, parentheses).");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          package_interest: formData.packageId === "custom" || !formData.packageId ? null : parseInt(formData.packageId, 10),
          property_details: formData.propertyDetails,
          sqft: formData.sqft ? parseInt(formData.sqft, 10) : null,
          referral_code_used: formData.referralCode.trim().toUpperCase() || null,
          shoot_date: formData.shootDate || null,
          time_slot: formData.timeSlot || null,
          status: "pending",
          ...(force ? { force: true } : {}),
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        if (data.duplicate_warning) {
          setDuplicateWarning(true);
        } else {
          setError(data.detail || "Failed to submit booking request. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitBooking(false);
  };

  if (success) {
    return (
      <div className="text-center py-8 animate-in zoom-in duration-500">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-gold transition-all">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-4">Your Booking is confirmed.</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The Photographer will be on site by {formData.shootDate} at {formatTime(formData.timeSlot)}.
        </p>
        
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm border-dashed mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            {isAuthenticated ? "View your booking status and download media from your dashboard." : "Log in to your account to track this booking, cancel, or reschedule."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
             <Link href={isAuthenticated ? "/dashboard" : "/login"} className="px-8 py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] active:scale-95 transition-all">
               {isAuthenticated ? "Go to Dashboard" : "Login to Your Account"}
             </Link>
             <button onClick={() => setSuccess(false)} className="px-8 py-3 border border-primary/20 bg-card hover:bg-muted text-foreground font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
               Book Another
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="text-center py-12 max-w-xl mx-auto">
        <div className="bg-muted/40 border border-border/50 rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold mb-4">Account Required</h3>
          <p className="text-muted-foreground mb-8">
            Please create an account or log in to schedule a shoot. This allows you to easily track the status of your booking, process invoices, and securely download your high-res media when it's ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-10 py-4 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] active:scale-95 transition-all">
              Create Account / Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Packages Grid */}
      {packages && packages.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 md:mb-32">
          {packages.map((pkg: any) => (
            <StaggerItem key={pkg.id}>
              <div className={`flex flex-col rounded-3xl bg-card p-8 shadow-gold transition-all h-full relative group ${pkg.is_popular ? 'border-2 border-primary shadow-gold-heavy transform md:-translate-y-4' : 'border border-primary/10'}`}>
                {pkg.is_popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">${pkg.price}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
                  {pkg.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                       <span className="text-primary shrink-0 mt-0.5">✓</span> 
                       <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  type="button"
                  onClick={() => handlePackageSelect(pkg.id.toString())}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${pkg.is_popular ? 'bg-primary text-primary-foreground shadow-gold hover:shadow-gold-heavy' : 'bg-muted text-foreground hover:bg-muted/80'} active:scale-95`}
                >
                  {formData.packageId === pkg.id.toString() ? "Selected ✓" : "Select Package"}
                </button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-10 mb-20 bg-muted/30 rounded-2xl border border-border/50">
            <p className="text-muted-foreground">Loading packages...</p>
        </div>
      )}

      {/* Booking Form Layout */}
      {/* Booking Form Layout */}
      <ScrollReveal delay={0.3}>
        <div id="booking-form-section" className="rounded-[2.5rem] border border-primary/20 bg-card p-8 md:p-12 shadow-gold">
           <div className="text-center mb-10">
             <h2 className="text-3xl font-bold mb-4">Schedule Your Shoot</h2>
             <p className="text-muted-foreground max-w-xl mx-auto">
               Fill out the form below to request a time, or give us a call directly. We'll confirm your slot within 2 hours.
             </p>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
             {error && (
                <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium text-center">
                  {error}
                </div>
             )}
             {duplicateWarning && (
                <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl text-sm font-medium">
                  <p className="font-bold text-warning mb-2">You already have an active booking for this address.</p>
                  <p className="text-muted-foreground mb-3">Would you like to book another shoot for the same property?</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => submitBooking(true)} disabled={loading} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
                      Yes, Book Again
                    </button>
                    <button type="button" onClick={() => setDuplicateWarning(false)} className="px-5 py-2 bg-muted text-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted/80 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
             )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
           <input 
             type="text" 
             id="firstName" 
             required
             value={formData.firstName}
             onChange={handleChange}
             className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
             placeholder="John" 
           />
        </div>
        <div className="space-y-2">
           <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
           <input 
             type="text" 
             id="lastName" 
             required
             value={formData.lastName}
             onChange={handleChange}
             className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
             placeholder="Doe" 
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label htmlFor="email" className="text-sm font-medium">Email Address</label>
           <input 
             type="email" 
             id="email" 
             required
             value={formData.email}
             onChange={handleChange}
             className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
             placeholder="john@example.com" 
           />
        </div>
        <div className="space-y-2">
           <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
           <input 
             type="tel" 
             id="phone" 
             required
             value={formData.phone}
             onChange={handleChange}
             className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
             placeholder="(555) 123-4567" 
           />
        </div>
      </div>

      <div className="space-y-2">
         <label htmlFor="packageId" className="text-sm font-medium">Primary Package Interest</label>
         <select 
           id="packageId" 
           required
           value={formData.packageId}
           onChange={handleChange}
           className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
         >
            <option value="">Select a package...</option>
            {packages.map((pkg: any) => (
               <option key={pkg.id} value={pkg.id.toString()}>{pkg.name} (${pkg.price})</option>
            ))}
            <option value="custom">Custom Commercial Quote</option>
         </select>
      </div>

      <div className="space-y-2">
         <label htmlFor="propertyDetails" className="text-sm font-medium">Property Address & Details</label>
         <textarea
           id="propertyDetails"
           required
           value={formData.propertyDetails}
           onChange={handleChange}
           rows={4}
           className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
           placeholder="123 Main St... Briefly describe the property and any special requests."
         />
      </div>

      <div className="space-y-2">
         <label htmlFor="sqft" className="text-sm font-medium">
           Property Size (sq ft) <span className="text-muted-foreground font-normal">— optional</span>
         </label>
         <input
           type="number"
           id="sqft"
           min="0"
           value={formData.sqft}
           onChange={handleChange}
           className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
           placeholder="e.g. 2400"
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label htmlFor="shootDate" className="text-sm font-medium">Preferred Date</label>
           <input 
             type="date" 
             id="shootDate" 
             required
             min={new Date().toISOString().split('T')[0]} // disable past dates
             value={formData.shootDate}
             onChange={(e) => {
                handleChange(e);
                setFormData(prev => ({ ...prev, shootDate: e.target.value, timeSlot: "" })); // Reset time when date changes
             }}
             className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
           />
        </div>
        <div className="space-y-2">
           <label htmlFor="timeSlot" className="text-sm font-medium">Available Time Slots</label>
           <select 
             id="timeSlot" 
             required
             value={formData.timeSlot}
             onChange={handleChange}
             disabled={!formData.shootDate || fetchingSlots}
             className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
           >
              <option value="">
                {fetchingSlots ? "Loading slots..." : 
                 !formData.shootDate ? "Select a date first" : 
                 !availableSlots[formData.shootDate]?.length ? "No slots available" : "Select an available time"}
              </option>
              {formData.shootDate && availableSlots[formData.shootDate]?.map(slot => (
                 <option key={slot} value={slot}>{formatTime(slot)}</option>
              ))}
           </select>
        </div>
      </div>

      <div className="space-y-2">
         <label htmlFor="referralCode" className="text-sm font-medium">
           Referral Code <span className="text-muted-foreground font-normal">— optional</span>
         </label>
         <input
           type="text"
           id="referralCode"
           value={formData.referralCode}
           onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
           className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono tracking-widest uppercase"
           placeholder="e.g. KCAB1234"
           maxLength={10}
         />
         <p className="text-xs text-muted-foreground">Enter a friend&apos;s referral code to apply their credit toward your booking.</p>
      </div>

      <div className="pt-6">
         <button
           type="submit"
           disabled={loading}
           className="w-full md:w-auto px-12 py-5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-gold hover:shadow-gold-heavy hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {loading ? "Confirming Request..." : "Submit Booking Request →"}
         </button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
         By submitting this form, you agree to our Terms of Service and Cancellation Policy.
      </p>
    </form>
    </div>
    </ScrollReveal>
    </div>
  );
}
