'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, ArrowLeft, Sun, Moon, Calendar, Settings, ShieldCheck, Cpu, Briefcase, Globe, Tv, AlertTriangle
} from 'lucide-react';
import { Article, UserProfile, Category, Advertisement } from '@/lib/db';
import Header from './Header';
import RoleSimulator from './RoleSimulator';
import CMSWorkspace from './CMSWorkspace';
import { useTheme } from '@/components/ThemeProvider';

interface AdminClientProps {
  initialArticles: Article[];
  profiles: UserProfile[];
  categories: Category[];
  ads: Advertisement[];
  currentUserId: string;
}

export default function AdminClient({ 
  initialArticles, 
  profiles, 
  categories, 
  ads, 
  currentUserId 
}: AdminClientProps) {
  const { theme: colorMode, toggleTheme: toggleColorMode, isLight } = useTheme();

  // Admin CMS panel password lock status
  const [isCmsUnlocked, setIsCmsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ofofo_cms_unlocked') === 'true';
    }
    return false;
  });
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Active auth simulation profile state
  const [activeProfile, setActiveProfile] = useState<UserProfile>(() => {
    const baseProfile = profiles.find(p => p.id === currentUserId) || profiles[0];
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`ofofo_saved_articles_by_${baseProfile.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return {
              ...baseProfile,
              savedArticles: Array.from(new Set([...baseProfile.savedArticles, ...parsed]))
            };
          }
        } catch (e) {
          console.error("Failed to parse stored saved dispatches state in admin client:", e);
        }
      }
    }
    return baseProfile;
  });

  const isEditorialStaff = ['Super Admin', 'Editor-in-Chief', 'Editor', 'Author', 'Contributor', 'Moderator'].includes(activeProfile.role);

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword.trim() === 'ofofo2026' || enteredPassword.trim().toLowerCase() === 'admin') {
      setIsCmsUnlocked(true);
      setPasswordError(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ofofo_cms_unlocked', 'true');
      }
    } else {
      setPasswordError(true);
      setEnteredPassword('');
    }
  };

  const handleLockCms = () => {
    setIsCmsUnlocked(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ofofo_cms_unlocked');
    }
  };

  // Sync simulated identity with stored preferences if available
  const handleProfileSwitched = (updatedProfile: UserProfile) => {
    let profileToSet = updatedProfile;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`ofofo_saved_articles_by_${updatedProfile.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            profileToSet = {
              ...updatedProfile,
              savedArticles: Array.from(new Set([...updatedProfile.savedArticles, ...parsed]))
            };
          }
        } catch (e) {
          console.error("Failed to sync bookmarks client side during switch:", e);
        }
      }
    }
    setActiveProfile(profileToSet);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-32 selection:bg-[#d41c1c] selection:text-white ${
      isLight 
        ? 'light-mode bg-slate-50 text-slate-800' 
        : 'bg-[#050505] text-slate-100'
    }`}>
      {/* Floating Role Simulator to allow seamless role swaps */}
      <RoleSimulator
        currentProfileId={activeProfile.id}
        profiles={profiles}
        onProfileSwitched={handleProfileSwitched}
      />

      {/* Static premium admin bar */}
      <div className={`text-[10px] px-4 md:px-8 py-1.5 flex items-center justify-between border-b transition-colors duration-300 ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-650' : 'bg-black/60 border-white/5 text-slate-350'
      }`}>
        <div className="flex items-center gap-4">
          <span className="font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#d41c1c] animate-pulse inline-block"></span>
            WORKSPACE PIPELINE: SECURE
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <button
            onClick={toggleColorMode}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border cursor-pointer text-[9px] uppercase tracking-wider font-bold select-none active:scale-95 transition-all ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-350 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-[#d41c1c]/40 text-white'
            }`}
          >
            {colorMode === 'dark' ? 'Light Desk' : 'Dark Desk'}
          </button>
          
          <span className={`h-3 w-px hidden sm:inline-block ${isLight ? 'bg-slate-300' : 'bg-white/10'}`} />

          <div className="hidden sm:flex items-center gap-1.5">
            <Calendar size={10} className="text-[#d41c1c]" />
            <span>EDITORIAL WORKPLACE EDITION</span>
          </div>
        </div>
      </div>

      {/* Brand logo bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between select-none">
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="text-left group cursor-pointer"
        >
          <h1 className={`text-3xl font-black tracking-tighter font-display font-serif ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Ofofo<span className="text-[#d41c1c] font-sans">.ng</span>
          </h1>
          <p className={`text-[9px] uppercase tracking-[0.2em] font-mono font-bold mt-0.5 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Administrative Newsroom Control
          </p>
        </button>

        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 bg-transparent border border-white/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={13} className="text-[#d41c1c]" />
          Return to Frontpage
        </button>
      </div>

      {/* SECURED GATEWAYS OR EDITOR WORKSPACE */}
      {!isEditorialStaff ? (
        /* Gating display when current active simulated user is standard non-staff Subscriber */
        <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
          <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-850' : 'bg-white/[0.03] border-white/10 text-slate-200'
          }`}>
            <div className="mx-auto h-16 w-16 bg-[#d41c1c]/10 border border-[#d41c1c]/30 rounded-full flex items-center justify-center mb-6 text-[#d41c1c]">
              <AlertTriangle size={28} />
            </div>
            
            <h2 className={`text-lg font-black tracking-tight mb-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
              RESTRICTED WORKSPACE ROLE REQUIRED
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-6">
              You are currently authenticated as a <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono">{activeProfile.role}</strong>. Subscribers cannot create, edit, or moderate publications.
            </p>

            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-[11px] leading-relaxed mb-6 font-mono text-left">
              <strong className="text-white block mb-1">🛠️ SIMULATION WORKAROUND:</strong>
              Use the floating role switcher on the right side of the page to choose an editorial role such as <strong>Super Admin</strong>, <strong>Editor-in-Chief</strong> or <strong>Author</strong> to unlock the staff desk.
            </div>

            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-3 bg-[#d41c1c] hover:bg-[#b01717] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg"
            >
              Return to Front Page
            </button>
          </div>
        </div>
      ) : !isCmsUnlocked ? (
        /* Password Gate Security checkpoint */
        <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in" id="cms-password-gate">
          <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-300 ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800' 
              : 'bg-white/[0.03] border-white/10 text-slate-200'
          }`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,28,28,0.04),transparent_60%)] pointer-events-none" />
            
            <div className="mx-auto h-16 w-16 bg-[#d41c1c]/10 border border-[#d41c1c]/30 rounded-full flex items-center justify-center mb-6 text-[#d41c1c] animate-pulse">
              <Shield size={28} />
            </div>
            
            <h2 className={`text-xl font-black tracking-tight leading-tight mb-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              OFOFO.NG CONTROL KEY REQUISITION
            </h2>
            <p className={`text-xs mb-6 leading-relaxed ${
              isLight ? 'text-slate-650' : 'text-slate-400'
            }`}>
              The administrative newsroom workspace is restricted. Verify your key credential to establish editing pipeline connections.
            </p>

            <form onSubmit={handleVerifyPassword} className="space-y-4 relative z-10 text-left">
              <div>
                <label className={`block text-[11px] font-mono uppercase font-black tracking-wider mb-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-450'
                }`}>
                  ENTER WORKSPACE PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    placeholder="Input publisher gatekey..."
                    className={`w-full text-xs font-mono p-3 border outline-none rounded-xl tracking-wide transition-all ${
                      passwordError 
                        ? 'border-[#d41c1c] bg-[#d41c1c]/5 focus:ring-1 focus:ring-[#d41c1c]'
                        : isLight
                          ? 'border-slate-300 focus:border-[#d41c1c] focus:ring-1 focus:ring-[#d41c1c] bg-slate-50 text-slate-900'
                          : 'border-white/10 focus:border-[#d41c1c] focus:ring-1 focus:ring-[#d41c1c] bg-black/40 text-white'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold cursor-pointer select-none uppercase ${
                      isLight ? 'text-slate-550 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[10px] font-mono text-[#e53e3e] font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                    ⚠️ ACCESS KEY DISCREPANCY REJECTED. TRY AGAIN.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl cursor-pointer border transition-colors ${
                    isLight
                      ? 'border-slate-300 hover:bg-slate-50 text-slate-700'
                      : 'border-white/10 hover:bg-white/5 text-slate-300'
                  }`}
                >
                  Public Frontpage
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#d41c1c] hover:bg-[#b01717] text-white rounded-xl text-xs font-black cursor-pointer transition-colors shadow-lg"
                >
                  Establish Desks
                </button>
              </div>
            </form>

            {/* Secure standard testing keys footnote helper */}
            <div className={`mt-6 border-t pt-4 text-[10px] font-mono leading-normal select-none ${
              isLight 
                ? 'border-slate-250 text-slate-550' 
                : 'border-white/5 text-slate-500'
            }`}>
              <span className="font-extrabold text-[#d41c1c]">PUBLISHING KEYS NOTICE: </span>
              For validation, please input standard credential <strong className="text-emerald-500 select-all font-bold">ofofo2026</strong>.
            </div>
          </div>
        </div>
      ) : (
        /* Workspace Active Canvas */
        <div className="animate-fade-in">
          {/* Quick status bar */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4 flex justify-between items-center text-xs">
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              🔒 SECURITY STATE: <span className="text-emerald-500 font-bold uppercase">CONNECTED DISPATCHER</span>
            </span>
            <button
              onClick={handleLockCms}
              className="text-[10px] font-mono text-[#d41c1c] hover:underline cursor-pointer uppercase font-bold"
            >
              [ Lock Workspace Session ]
            </button>
          </div>
          <CMSWorkspace
            activeProfile={activeProfile}
            profiles={profiles}
            initialArticles={initialArticles}
          />
        </div>
      )}
    </div>
  );
}
