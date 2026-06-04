'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, User, UserCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { setCurrentUser } from '@/lib/actions';
import { UserProfile } from '@/lib/db';

interface RoleSimulatorProps {
  currentProfileId: string;
  profiles: UserProfile[];
  onProfileSwitched: (updatedProfile: UserProfile) => void;
}

export default function RoleSimulator({ currentProfileId, profiles, onProfileSwitched }: RoleSimulatorProps) {
  const [activeId, setActiveId] = useState(currentProfileId);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeProfile = profiles.find(p => p.id === activeId) || profiles[0];

  const handleSwitch = async (profileId: string) => {
    setLoading(true);
    try {
      const updatedProfile = await setCurrentUser(profileId);
      setActiveId(profileId);
      onProfileSwitched(updatedProfile);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="role-simulator-panel">
      {/* Floating Toggle Trigger Button */}
      <button
        id="toggle-simulator-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 text-white rounded-full shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all text-xs font-semibold tracking-tight cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d41c1c] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d41c1c]"></span>
        </span>
        <Shield size={14} className="text-[#d41c1c]" />
        <span className="max-w-[140px] truncate">Role: <span className="text-[#d41c1c] font-bold">{activeProfile?.role || 'Guest'}</span></span>
      </button>

      {/* Selector Box */}
      {isOpen && (
        <div id="simulator-selection-card" className="absolute bottom-14 right-0 w-80 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 text-white">
          <div className="p-4 bg-black/40 text-white border-b border-white/10">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <Shield size={16} className="text-[#d41c1c]" />
              Ofofo.ng Role Simulator
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Switch roles to simulate real-time CMS publication workflows, workspace access, and role-based security policies in the newsroom.
            </p>
          </div>

          <div className="p-2 max-h-[290px] overflow-y-auto bg-black/40">
            {profiles.map((profile) => {
              const isSelected = profile.id === activeId;
              let roleBadgeColor = "bg-white/5 text-slate-300 border border-white/10";
              if (profile.role === 'Super Admin') roleBadgeColor = "bg-red-500/10 text-red-400 border border-red-500/20";
              if (profile.role === 'Editor-in-Chief' || profile.role === 'Editor') roleBadgeColor = "bg-amber-500/10 text-amber-450 border border-amber-500/20";
              if (profile.role === 'Author') roleBadgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
              if (profile.role === 'Moderator') roleBadgeColor = "bg-purple-500/10 text-purple-400 border border-purple-500/20";

              return (
                <button
                  id={`switch-user-${profile.id}`}
                  key={profile.id}
                  onClick={() => handleSwitch(profile.id)}
                  className={`w-full text-left p-3 rounded-xl mb-1 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-white/10 border border-white/20 shadow-sm' : 'hover:bg-white/5 border border-transparent text-slate-300'
                  }`}
                >
                  <img
                    alt={profile.fullName}
                    src={profile.avatarUrl || `https://picsum.photos/seed/${profile.id}/100/100`}
                    className="h-10 w-10 rounded-full border border-white/10 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-white truncate flex items-center gap-1">
                        {profile.fullName}
                        {isSelected && <UserCheck size={12} className="text-[#d41c1c] inline" />}
                      </p>
                    </div>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${roleBadgeColor}`}>
                      {profile.role}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                      {profile.bio}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-black/55 border-t border-white/10 text-[10px] text-slate-400 flex items-start gap-1.5">
            <AlertCircle size={12} className="text-[#d41c1c] mt-0.5 flex-shrink-0" />
            <span>
              <strong>Note:</strong> Author role unlocks the Notion Editor with Gemini Writing Assistant. Super Admin unlocks vector SVG finance charts and live audit logs.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
