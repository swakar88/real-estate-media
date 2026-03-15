"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-muted/40 animate-pulse"></div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center p-2.5 rounded-2xl bg-muted/40 border border-border/10 hover:bg-muted/60 transition-all active:scale-95 group relative overflow-hidden"
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5">
        <Sun className="h-5 w-5 absolute inset-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-500" />
        <Moon className="h-5 w-5 absolute inset-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
      </div>
    </button>
  );
}
