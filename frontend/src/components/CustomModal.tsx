"use client";

import { X, CheckCircle2, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { useEffect } from "react";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true
}: CustomModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-12 h-12 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500" />;
      case 'error': return <ShieldAlert className="w-12 h-12 text-red-500" />;
      default: return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const getThemeClass = () => {
    switch (type) {
      case 'success': return 'border-emerald-500/20 bg-emerald-500/5';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5';
      case 'error': return 'border-red-500/20 bg-red-500/5';
      default: return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'success': return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-black';
      case 'error': return 'bg-red-500 hover:bg-red-600 text-white';
      default: return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md bg-card rounded-[2.5rem] border border-primary/20 shadow-gold-heavy overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className={`p-8 flex flex-col items-center text-center space-y-6 ${getThemeClass()}`}>
          <div className="p-4 bg-white/5 rounded-3xl ring-8 ring-white/5">
             {getIcon()}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic tracking-tight">{title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="p-8 flex gap-4 bg-card/50">
          {showCancel && (
            <button 
              onClick={onClose}
              className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-2xl transition-all"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`flex-[2] py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 ${getButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
