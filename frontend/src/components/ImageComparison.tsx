"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ImageComparison({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After"
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isResizing) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsResizing(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl cursor-col-resize select-none border border-white/10 group"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      {/* After Image (Base) */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt="After"
          fill
          className="object-cover"
          unoptimized={afterImage.startsWith('http')}
        />
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 py-1.5 px-3 rounded-full z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-white italic">{afterLabel}</span>
        </div>
      </div>

      {/* Before Image (Overlay with clip-path) */}
      <div 
        className="absolute inset-0 z-10"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt="Before"
          fill
          className="object-cover"
          unoptimized={beforeImage.startsWith('http')}
        />
        <div className="absolute bottom-4 left-4 bg-primary/20 backdrop-blur-md border border-primary/30 py-1.5 px-3 rounded-full z-10 transition-opacity">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary italic drop-shadow-md">{beforeLabel}</span>
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 z-20 w-1 bg-white cursor-col-resize flex items-center justify-center transition-all duration-75"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-primary transition-transform group-hover:scale-110">
              <div className="flex gap-1">
                <div className="w-1 h-2 bg-primary/40 rounded-full" />
                <div className="w-1 h-3 bg-primary rounded-full transition-all group-hover:h-4" />
                <div className="w-1 h-2 bg-primary/40 rounded-full" />
              </div>
            </div>
            
            <div className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-md text-[8px] font-black text-primary uppercase tracking-tighter shadow-lg whitespace-nowrap">
                Slide to Compare
            </div>
        </div>
      </div>
    </div>
  );
}
