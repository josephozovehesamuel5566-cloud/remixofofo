'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { subscribeNewsletterAction } from '@/lib/actions';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState('Standard');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    try {
      await subscribeNewsletterAction(email, segment);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="newsletter-panel"
      className="bg-white/5 backdrop-blur-md text-slate-100 p-6 md:p-10 rounded-3xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-10 border border-white/10 relative overflow-hidden font-sans text-left"
    >
      {/* Visual abstract background accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#d41c1c]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-xl text-left">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d41c1c]/10 border border-[#d41c1c]/20 rounded-full text-[10px] uppercase font-bold text-[#d41c1c] tracking-wider mb-4">
          <Activity size={10} />
          Editorial Intelligence Briefs
        </span>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
          Subscribe to the Ofofo Briefing
        </h3>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Deep investigative dispatches covering tech coalitions, regulatory shifts, and capital allocations across Lagos, Nairobi, and West Africa. Never spam. Direct from our executive newsroom.
        </p>
      </div>

      <div className="w-full lg:w-auto min-w-[280px] sm:min-w-[400px]">
        {success ? (
          <div className="bg-[#d41c1c]/10 border border-[#d41c1c]/25 p-4 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="text-[#d41c1c] mt-0.5 flex-shrink-0" size={18} />
            <div>
              <h4 className="text-xs font-bold text-[#d41c1c]">Audience Subscription Secured!</h4>
              <p className="text-[10px] text-slate-300 mt-1">
                You have been registered for our high-affinity briefings. Expect our next analytical editorial dispatch in your inbox.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Enter your executive email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-3 bg-[#0a0a0a]/60 border border-white/10 text-white rounded-xl focus:border-[#d41c1c] focus:outline-none transition-all placeholder-slate-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3 bg-[#d41c1c] hover:bg-[#b01717] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                {loading ? 'Securing...' : 'Establish Connection'}
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Audience Segment selector */}
            <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/10">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">Briefing Segment:</span>
              <div className="flex gap-1.5">
                {[
                  { value: 'Standard', label: 'Daily Feed' },
                  { value: 'Prime', label: 'VC Capital' },
                  { value: 'Business', label: 'Trade & Energy' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSegment(item.value)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer ${
                      segment === item.value
                        ? 'bg-[#d41c1c] text-white'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
