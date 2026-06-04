'use client';

import React from 'react';
import { BookOpen, Search, Cpu, Briefcase, Globe, Tv, Calendar, Settings, ShieldCheck, Sun, Moon } from 'lucide-react';
import { UserProfile } from '@/lib/db';
import { useTheme } from '@/components/ThemeProvider';

interface HeaderProps {
  activeProfile: UserProfile;
  currentMode: 'public' | 'cms';
  setMode: (mode: 'public' | 'cms') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function Header({ 
  activeProfile, 
  currentMode, 
  setMode, 
  searchQuery, 
  setSearchQuery 
}: HeaderProps) {
  const { theme: colorMode, toggleTheme: toggleColorMode, isLight } = useTheme();
  const isEditorialStaff = ['Super Admin', 'Editor-in-Chief', 'Editor', 'Author', 'Contributor', 'Moderator'].includes(activeProfile.role);

  return (
    <header className={`border-b sticky top-0 z-40 font-sans transition-colors duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-md' 
        : 'bg-[#050505]/70 border-white/10 text-white backdrop-blur-md'
    }`} id="site-primary-header">
      {/* Top micro-bar: Live system indicators, Theme Switch, & UTC Clock */}
      <div className={`text-[10px] px-4 md:px-8 py-1.5 flex items-center justify-between border-b transition-colors duration-300 ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-650' : 'bg-black/60 border-white/5 text-slate-350'
      }`}>
        <div className="flex items-center gap-4">
          <span className="font-mono flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d41c1c] animate-pulse inline-block"></span>
            FEED: LIVE
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          {/* High-fidelity color mode button */}
          <button
            onClick={toggleColorMode}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border cursor-pointer text-[9px] uppercase tracking-wider font-bold select-none active:scale-95 transition-all ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-350 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-[#d41c1c]/40 text-white'
            }`}
            id="theme-toggle-trigger"
            title="Switch newsroom theme mode"
          >
            {colorMode === 'dark' ? (
              <>
                <Sun size={9} className="text-amber-500" />
                <span>Light Desk</span>
              </>
            ) : (
              <>
                <Moon size={9} className="text-blue-600" />
                <span>Dark Desk</span>
              </>
            )}
          </button>
          
          <span className={`h-3 w-px hidden sm:inline-block ${isLight ? 'bg-slate-300' : 'bg-white/10'}`} />

          <div className="hidden sm:flex items-center gap-1.5">
            <Calendar size={10} className="text-[#d41c1c]" />
            <span>UTC: 2026-06-04 12:03:49</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 sm:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo - Brutalist Editorial Typography / Serif styling */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearchQuery('');
              setMode('public');
            }}
            className="text-left group cursor-pointer"
            id="logo-anchor"
          >
            <h1 className={`text-4xl md:text-5xl font-black tracking-tighter font-display font-serif select-none transition-transform hover:scale-[1.01] ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Ofofo<span className="text-[#d41c1c] font-sans">.ng</span>
            </h1>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-mono font-bold mt-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Premium Digital Publishing & News
            </p>
          </button>
        </div>



        {/* User profile identifier */}
        <div className={`flex items-center gap-3 p-2 rounded-xl border max-w-[260px] truncate transition-colors duration-300 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <div className="relative">
            <img
              alt={activeProfile.fullName}
              src={activeProfile.avatarUrl || `https://picsum.photos/seed/${activeProfile.id}/100/100`}
              className={`h-8 w-8 rounded-full border ${isLight ? 'border-slate-300' : 'border-white/10'}`}
            />
            {isEditorialStaff && (
              <span className="absolute -bottom-1 -right-1 bg-[#d41c1c] border border-black text-[8px] text-white p-0.5 rounded-full shadow-lg">
                <ShieldCheck size={8} />
              </span>
            )}
          </div>
          <div className="min-w-0 text-left">
            <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`} id="auth-display-name">
              {activeProfile.fullName}
            </p>
            <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Role: {activeProfile.role}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-bar Navigation or search indicator */}
      {currentMode === 'public' && (
        <div className={`border-t py-3 px-4 md:px-8 transition-colors duration-300 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/30 border-white/10'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Quick Filter Categories */}
            <div className="flex items-center gap-4 text-xs font-semibold overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none" id="category-nav-bar">
              <span className={`text-[10px] font-mono tracking-wider font-bold uppercase flex-shrink-0 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>TOPICS:</span>
              <button 
                onClick={() => setSearchQuery('')} 
                className={`flex-shrink-0 transition-colors cursor-pointer ${
                  !searchQuery 
                    ? `${isLight ? 'text-slate-900' : 'text-white'} font-bold underline underline-offset-4 decoration-2 decoration-[#d41c1c]` 
                    : `${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-350 hover:text-white'}`
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setSearchQuery('Tech & Innovation')} 
                className={`flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer ${
                  searchQuery === 'Tech & Innovation' 
                    ? `${isLight ? 'text-slate-900' : 'text-white'} font-bold underline underline-offset-4 decoration-2 decoration-[#d41c1c]` 
                    : `${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-350 hover:text-white'}`
                }`}
              >
                <Cpu size={12} /> Tech
              </button>
              <button 
                onClick={() => setSearchQuery('Business & Markets')} 
                className={`flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer ${
                  searchQuery === 'Business & Markets' 
                    ? `${isLight ? 'text-slate-900' : 'text-white'} font-bold underline underline-offset-4 decoration-2 decoration-[#d41c1c]` 
                    : `${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-350 hover:text-white'}`
                }`}
              >
                <Briefcase size={12} /> Business
              </button>
              <button 
                onClick={() => setSearchQuery('Politics & Society')} 
                className={`flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer ${
                  searchQuery === 'Politics & Society' 
                    ? `${isLight ? 'text-slate-900' : 'text-white'} font-bold underline underline-offset-4 decoration-2 decoration-[#d41c1c]` 
                    : `${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-350 hover:text-white'}`
                }`}
              >
                <Globe size={12} /> Politics
              </button>
              <button 
                onClick={() => setSearchQuery('Entertainment & Culture')} 
                className={`flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer ${
                  searchQuery === 'Entertainment & Culture' 
                    ? `${isLight ? 'text-slate-900' : 'text-white'} font-bold underline underline-offset-4 decoration-2 decoration-[#d41c1c]` 
                    : `${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-350 hover:text-white'}`
                }`}
              >
                <Tv size={12} /> Entertainment
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                id="search-input-field"
                type="text"
                placeholder="Instant article search, e.g., 'Yaba'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs pl-9 pr-4 py-2 border rounded-lg outline-none tracking-tight transition-all backdrop-blur-md ${
                  isLight
                    ? 'border-slate-300 hover:border-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-[#d41c1c] bg-white text-slate-800 placeholder-slate-400'
                    : 'border-white/10 hover:border-white/20 focus:border-white/40 focus:ring-1 focus:ring-[#d41c1c] bg-white/5 text-white placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold ${
                    isLight ? 'text-slate-400 hover:text-slate-700' : 'text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

