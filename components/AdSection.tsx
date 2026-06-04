'use client';

import React, { useEffect } from 'react';
import { Advertisement, AdPosition } from '@/lib/db';
import { recordAdViewAction, recordAdClickAction } from '@/lib/actions';
import { Megaphone, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface AdSectionProps {
  position: AdPosition;
  ads: Advertisement[];
}

export default function AdSection({ position, ads }: AdSectionProps) {
  const [selectedAd, setSelectedAd] = React.useState<Advertisement | null>(null);
  const { isLight } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      const filteredAds = ads.filter((ad) => ad.position === position && ad.active);
      if (filteredAds.length > 0) {
        const randomAd = filteredAds[Math.floor(Math.random() * filteredAds.length)];
        setSelectedAd(randomAd);
      } else {
        setSelectedAd(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [position, ads]);

  useEffect(() => {
    if (selectedAd) {
      const timer = setTimeout(() => {
        recordAdViewAction(selectedAd.id).catch((err) => console.error('Failed to log ad view:', err));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedAd]);

  const handleClick = (adId: string) => {
    recordAdClickAction(adId).catch((err) => console.error('Failed to log ad click:', err));
  };

  if (!selectedAd) return null;

  // Render header position
  if (position === 'Header-Banner') {
    return (
      <div 
        id="ad-header-banner"
        className={`w-full max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-4 border-b text-center font-sans hidden sm:block transition-colors duration-300 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050505] border-white/5'
        }`}
      >
        <div className={`flex items-center justify-between gap-4 max-w-5xl mx-auto border p-2 rounded-xl backdrop-blur-md transition-colors duration-300 relative group ${
          isLight 
            ? 'border-slate-300 bg-white hover:border-[#d41c1c]/50' 
            : 'border-white/10 bg-white/5 hover:border-[#d41c1c]/50'
        }`}>
          <span className={`absolute -top-2 left-4 text-[7px] font-bold tracking-widest text-[#d41c1c] uppercase px-1 border ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050505] border-white/10'
          }`}>
            SPONSOR MESSAGE
          </span>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 md:h-12 md:w-20 rounded-lg overflow-hidden flex-shrink-0 border hidden md:block ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <img src={selectedAd.imageUrl} alt={selectedAd.title} className="h-full w-full object-cover" />
            </div>
            <div className="text-left font-sans">
              <p className={`text-[11px] md:text-xs font-bold transition-colors ${
                isLight ? 'text-slate-900 group-hover:text-[#d41c1c]' : 'text-white group-hover:text-[#d41c1c]'
              }`}>
                {selectedAd.title}
              </p>
              <p className={`text-[9px] line-clamp-1 italic ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Support our sponsors by exploring cross-border billing networks.
              </p>
            </div>
          </div>
          <a
            onClick={() => handleClick(selectedAd.id)}
            href={selectedAd.link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#d41c1c] text-white rounded-lg text-[10px] font-bold hover:bg-[#b01717] flex items-center gap-1 cursor-pointer flex-shrink-0 transition-colors"
          >
            Explore <ExternalLink size={10} />
          </a>
        </div>
      </div>
    );
  }

  // Render sidebar banner position
  if (position === 'Sidebar-Widget') {
    return (
      <div 
        id="ad-sidebar-widget"
        className={`backdrop-blur-md border p-4 rounded-2xl shadow-xl font-sans text-left relative overflow-hidden transition-colors duration-300 ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-white/5 border-white/10 text-white'
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <span className={`text-[8px] font-black tracking-widest uppercase ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            COMMERCIAL SPOTLIGHT
          </span>
          <Megaphone size={12} className="text-[#d41c1c]" />
        </div>
        <div className={`aspect-[1.5] w-full rounded-lg overflow-hidden border mb-3 ${
          isLight ? 'bg-slate-100 border-slate-150' : 'bg-black/45 border-white/5'
        }`}>
          <img src={selectedAd.imageUrl} alt={selectedAd.title} className="object-cover h-full w-full" />
        </div>
        <h4 className={`text-xs font-bold tracking-tight mb-2 leading-snug ${
          isLight ? 'text-slate-950' : 'text-white'
        }`}>
          {selectedAd.title}
        </h4>
        <a
          onClick={() => handleClick(selectedAd.id)}
          href={selectedAd.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full py-2 border text-center rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-700'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
          }`}
        >
          Partner Integration <ExternalLink size={10} />
        </a>
      </div>
    );
  }

  // Default In-feed/Footer placeholder banner
  return (
    <div 
      id="ad-infeed-banner"
      className={`border rounded-2xl text-center font-sans tracking-tight relative overflow-hidden max-w-4xl mx-auto my-6 transition-colors duration-300 p-4 md:p-6 ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-800' 
          : 'bg-white/5 border-white/10 text-white'
      }`}
    >
      <span className="absolute top-2 left-4 text-[8px] font-bold text-white bg-[#d41c1c] rounded px-1.5 py-0.5">
        SPONSOR
      </span>
      <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="text-left">
          <h4 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedAd.title}</h4>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-350'}`}>Unlock global payments for West African businesses.</p>
        </div>
        <a
          onClick={() => handleClick(selectedAd.id)}
          href={selectedAd.link}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#d41c1c] hover:bg-[#b01717] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
        >
          Integration Docs <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

