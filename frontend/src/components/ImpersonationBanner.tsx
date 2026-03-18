"use client";

import { UserCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ImpersonationBannerProps {
  userName: string;
  role: string;
}

export default function ImpersonationBanner({ userName, role }: ImpersonationBannerProps) {
  const router = useRouter();

  const handleExit = () => {
    // Clear impersonation from URL and redirect to admin portal
    router.push('/admin-portal');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white py-2.5 px-6 shadow-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <UserCircle className="w-5 h-5" />
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em]">
          Mode: Administrative View As &mdash; <span className="bg-white/20 px-2 py-0.5 rounded-md">{userName}</span> ({role})
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link 
          href="/admin-portal"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/20"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="hidden sm:inline">Admin Portal</span>
        </Link>
        <button 
          onClick={handleExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
        >
          <XCircle className="w-3 h-3" />
          Exit
        </button>
      </div>
    </div>
  );
}
