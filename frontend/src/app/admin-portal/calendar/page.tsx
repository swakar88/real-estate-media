"use client";

import { useEffect, useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Camera, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon,
  Info
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Photographer {
  id: number;
  full_name: string;
  color?: string;
}

interface Shoot {
  id: number;
  property_address: string;
  shoot_date: string;
  photographer: number;
  photographer_name?: string;
  status: string;
}

const PHOTOGRAPHER_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", 
  "bg-amber-500", "bg-rose-500", "bg-indigo-500", 
  "bg-cyan-500", "bg-orange-500"
];

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { "Authorization": `Bearer ${token}` };
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

        const [pRes, sRes] = await Promise.all([
          fetch(`${apiUrl}/api/photographers/`, { headers }),
          fetch(`${apiUrl}/api/shoots/`, { headers })
        ]);

        if (pRes.ok && sRes.ok) {
          const pData = await pRes.json();
          const sData = await sRes.json();
          
          setPhotographers(pData.map((p: any, i: number) => ({
            ...p,
            color: PHOTOGRAPHER_COLORS[i % PHOTOGRAPHER_COLORS.length]
          })));
          setShoots(sData);
        }
      } catch (err) {
        console.error("Failed to fetch calendar data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  // Dummy days for start of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getShootsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return shoots.filter(s => s.shoot_date === dateStr);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
         <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Combined Calendar</h1>
            <p className="text-muted-foreground">View all photographer schedules at a glance.</p>
          </div>

          <div className="flex items-center gap-4 bg-card border border-primary/20 p-2 rounded-2xl shadow-gold">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-black italic min-w-[150px] text-center uppercase tracking-widest text-primary">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] overflow-hidden shadow-gold">
            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-4 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 min-h-[600px]">
              {days.map((day, i) => {
                const dayShoots = day ? getShootsForDay(day) : [];
                const isToday = day && 
                                day === new Date().getDate() && 
                                month === new Date().getMonth() && 
                                year === new Date().getFullYear();

                return (
                  <div key={i} className={`min-h-[120px] border-r border-b border-border/30 p-2 transition-colors relative overflow-hidden ${day ? 'hover:bg-primary/5' : 'bg-muted/10 opacity-50'}`}>
                    {day && (
                      <>
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg mb-2 ${isToday ? 'bg-primary text-primary-foreground shadow-gold animate-pulse' : 'text-muted-foreground'}`}>
                          {day}
                        </span>
                        <div className="space-y-1">
                          {dayShoots.map(shoot => {
                            const photographer = photographers.find(p => p.id === shoot.photographer);
                            return (
                              <div 
                                key={shoot.id}
                                className={`text-[9px] font-bold p-1 rounded-md text-white truncate shadow-sm flex items-center gap-1 ${photographer?.color || 'bg-slate-500'}`}
                                title={`${shoot.property_address} (${photographer?.full_name})`}
                              >
                                <Camera className="w-2 h-2 shrink-0" />
                                {photographer?.full_name?.split(' ')[0]}: {shoot.property_address}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend & Summary */}
        <div className="space-y-8">
          <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl p-6 shadow-gold space-y-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest">Photographers</h3>
            </div>
            <div className="space-y-3">
              {photographers.map(p => (
                <div key={p.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${p.color} ring-4 ring-background shadow-sm`}></div>
                    <span className="text-xs font-bold group-hover:text-primary transition-colors">{p.full_name}</span>
                  </div>
                  <span className="text-[10px] font-black italic bg-muted/50 px-2 py-0.5 rounded-lg opacity-60">
                    {shoots.filter(s => s.photographer === p.id).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              <h3 className="text-xs font-black uppercase tracking-widest">Calendar Legend</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each photographer is assigned a unique color brand. Shoots are displayed relative to their confirmed date on the grid. Hover over any entry to see the full property address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
