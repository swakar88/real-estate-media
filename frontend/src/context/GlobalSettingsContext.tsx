'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GlobalSettings {
  site_name: string;
  site_logo_url: string;
  favicon_url: string;
  invoice_logo_url: string;
  sidebar_logo_url: string;
  referral_reward_amount: number;
  referral_reward_type: 'fixed' | 'percentage';
}

interface GlobalSettingsContextType {
  settings: GlobalSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

export const GlobalSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/settings/`);
      if (res.ok) {
        const data = await res.json();
        // Since list() returns the first object directly in our viewset
        setSettings(data);
        
        // Update favicon if present
        if (data.favicon_url) {
          const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (favicon) {
            favicon.href = data.favicon_url;
          } else {
            const newFavicon = document.createElement('link');
            newFavicon.rel = 'icon';
            newFavicon.href = data.favicon_url;
            document.head.appendChild(newFavicon);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch global settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <GlobalSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
};
