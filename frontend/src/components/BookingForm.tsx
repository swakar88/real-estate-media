"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BookingForm({ packages }: { packages: any[] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    packageId: "",
    propertyDetails: "",
    shootDate: "",
    timeSlot: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/bookings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          package_interest: formData.packageId === "custom" || !formData.packageId ? null : parseInt(formData.packageId, 10),
          property_details: formData.propertyDetails,
          shoot_date: formData.shootDate || null,
          time_slot: formData.timeSlot || null,
          status: "pending"
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to submit booking request. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 animate-in zoom-in duration-500">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-4">Request Received!</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          We have successfully received your booking request. Our team will review the details and contact you shortly to confirm the appointment.
        </p>
        
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm border-dashed">
          <h4 className="font-bold mb-2">Want to track your deliverables?</h4>
          <p className="text-sm text-muted-foreground mb-4">Create an agency account to easily track the status of this shoot and securely download your high-res media when it's ready.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
             <Link href="/login" className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors text-sm">
               Create Account / Login
             </Link>
             <button onClick={() => setSuccess(false)} className="px-6 py-2 border border-border bg-background hover:bg-muted font-medium rounded-md transition-colors text-sm">
               Book Another
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium text-center">
          {error}
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
           placeholder="123 Main St... Briefly describe the property size and preferred shoot date." 
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label htmlFor="shootDate" className="text-sm font-medium">Preferred Date</label>
           <input 
             type="date" 
             id="shootDate" 
             value={formData.shootDate}
             onChange={handleChange}
             className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
           />
        </div>
        <div className="space-y-2">
           <label htmlFor="timeSlot" className="text-sm font-medium">Preferred Time</label>
           <select 
             id="timeSlot" 
             value={formData.timeSlot}
             onChange={handleChange}
             className="w-full bg-background border border-border/60 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
           >
              <option value="">Any Time</option>
              <option value="09:00">9:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="13:00">1:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="17:00">5:00 PM</option>
           </select>
        </div>
      </div>

      <div className="pt-4">
         <button 
           type="submit" 
           disabled={loading}
           className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {loading ? "Submitting Request..." : "Submit Booking Request →"}
         </button>
      </div>
    </form>
  );
}
