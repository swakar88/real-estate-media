"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Plus, Trash2 } from "lucide-react";

export default function PhotographerPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("09:00");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return router.push("/login");

    try {
      // Fetch User
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/me/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (!userData.is_photographer) {
        return router.push("/dashboard");
      }
      setUser(userData);

      // Fetch Slots
      const slotsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (slotsRes.ok) setSlots(await slotsRes.json());

      // Future: Fetch assigned bookings
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ date, time_slot: timeSlot })
      });
      if (res.ok) {
        const newSlot = await res.json();
        setSlots([...slots, newSlot]);
      } else {
        alert("Failed to add slot (maybe it already exists?)");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSlot = async (id: number) => {
    const token = localStorage.getItem("access_token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/photographer/slots/${id}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setSlots(slots.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-20 bg-background container mx-auto px-4 md:px-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Photographer Portal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Availability Manager */}
          <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5"/> Manage Availability</h2>
            <form onSubmit={addSlot} className="flex gap-4 mb-6 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Date</label>
                <input type="date" required className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Time</label>
                <select className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                  <option value="09:00">9:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90">Add</button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {slots.length === 0 && <p className="text-sm text-muted-foreground italic">No availability slots set.</p>}
              {slots.map(slot => (
                <div key={slot.id} className="flex justify-between items-center bg-background border border-border/40 p-3 rounded-md">
                  <div>
                    <span className="font-semibold text-sm">{slot.date}</span>
                    <span className="ml-3 text-sm text-muted-foreground">{slot.time_slot}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {slot.is_booked ? (
                      <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">Booked</span>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">Available</span>
                        <button onClick={() => deleteSlot(slot.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
