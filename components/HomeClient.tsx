'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cpu, Briefcase, Globe, Tv, GraduationCap, Calendar, Search, Sparkles, BookOpen, 
  ArrowLeft, Heart, Clock, MessageSquare, Play, Volume2, ArrowRight,
  TrendingUp, Check, Shield, Award, User, Filter, Tag, X, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article, UserProfile, Category, Comment, Advertisement } from '@/lib/db';
import Header from './Header';
import RoleSimulator from './RoleSimulator';
import ArticleCard from './ArticleCard';
import AdSection from './AdSection';
import NewsletterSubscription from './NewsletterSubscription';
import InteractiveComments from './InteractiveComments';
import CMSWorkspace from './CMSWorkspace';
import { followAuthorAction, incrementLikeAction, saveArticleAction } from '@/lib/actions';
import { useTheme } from '@/components/ThemeProvider';

// Map database strings to imported Lucide React icons
const categoryIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Cpu: Cpu,
  Briefcase: Briefcase,
  Globe: Globe,
  Tv: Tv,
  GraduationCap: GraduationCap,
};

interface HomeClientProps {
  initialArticles: Article[];
  profiles: UserProfile[];
  categories: Category[];
  ads: Advertisement[];
  currentUserId: string;
}

export default function HomeClient({ initialArticles, profiles, categories, ads, currentUserId }: HomeClientProps) {
  // Leverage the central ThemeProvider state
  const { theme: colorMode, toggleTheme: toggleColorMode } = useTheme();

  // Navigation & States
  const currentMode = 'public';
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Category & Tag Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Auth state
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
          console.error("Failed to parse stored saved dispatches:", e);
        }
      }
    }
    return baseProfile;
  });
  
  // Articles state
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  
  // AI Semantic search states
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<{
    matchedArticleIds: string[];
    explanations: Record<string, string>;
    recommendedTags: string[];
  } | null>(null);

  // Audio simulation state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Real-time AI News feed sync states
  const [syncingNews, setSyncingNews] = useState(false);
  const [syncSuccessMs, setSyncSuccessMs] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncRealNews = async () => {
    setSyncingNews(true);
    setSyncError(null);
    setSyncSuccessMs(null);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-live-news" }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.addedCount > 0) {
          // Merge newly generated real articles into state
          setArticles(prev => {
            const unmatched = data.addedArticles.filter(
              (newArt: Article) => !prev.some(p => p.id === newArt.id)
            );
            return [...unmatched, ...prev]; // Prepend new articles for high visibility
          });
          setSyncSuccessMs(`Successfully synced ${data.addedCount} new real-life stories from Google Search Grounding!`);
        } else {
          setSyncSuccessMs("Your feed is already synced with the latest real-life events!");
        }
      } else {
        setSyncError(data.error || "An error occurred while syncing news.");
      }
    } catch (err: any) {
      console.error(err);
      setSyncError("Network error synchronized desk. Please verify your connection.");
    } finally {
      setSyncingNews(false);
    }
  };

  const handleToggleBookmark = async (articleId: string) => {
    try {
      // 1. Toggle it on server database state
      await saveArticleAction(articleId);
      
      // 2. Compute the toggled bookmarks list
      const isBookmarked = activeProfile.savedArticles.includes(articleId);
      const updatedBookmarks = isBookmarked
        ? activeProfile.savedArticles.filter(id => id !== articleId)
        : [...activeProfile.savedArticles, articleId];
      
      // 3. Save to active simulated profile React state
      setActiveProfile(prev => {
        const nextProfile = { ...prev, savedArticles: updatedBookmarks };
        // 4. Save to client window library localStorage for absolute session endurance
        if (typeof window !== 'undefined') {
          localStorage.setItem(`ofofo_saved_articles_by_${prev.id}`, JSON.stringify(updatedBookmarks));
        }
        return nextProfile;
      });
    } catch (err) {
      console.error("Failed to toggle article save status", err);
    }
  };

  // Sync state when profile is simulated with full local storage support
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
          console.error("Failed to parse stored saved dispatches on profile switch:", e);
        }
      }
    }
    setActiveProfile(profileToSet);
    // If not staff, force public mode
    const isStaff = ['Super Admin', 'Editor-in-Chief', 'Editor', 'Author', 'Contributor', 'Moderator'].includes(profileToSet.role);
  };

  // Filter calculations: Matches title/summary/tags OR semantic matched IDs
  const publishedArticles = articles.filter(a => a.status === 'Published');

  // Dynamically extract and rank all tags from the published articles for context-aware discovery
  const dynamicTagStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    publishedArticles.forEach(art => {
      // Filter tags inside the chosen category to provide relevant insights
      if (selectedCategoryId === 'all' || art.categoryId === selectedCategoryId) {
        art.tags.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by frequency descending
      .slice(0, 12); // Grab top 12 popular tags
  }, [publishedArticles, selectedCategoryId]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedTag(null); // Reset tag filter on category change to prevent empty states
  };

  const handleResetFilters = () => {
    setSelectedCategoryId('all');
    setSelectedTag(null);
    setSearchQuery('');
    clearAISearch();
  };
  
  const filteredArticles = publishedArticles.filter(art => {
    // 1. AI Search filter
    if (aiSearchResults && aiSearchResults.matchedArticleIds.length > 0) {
      return aiSearchResults.matchedArticleIds.includes(art.id);
    }

    // 2. Category selection channels
    if (selectedCategoryId === 'saved') {
      if (!activeProfile.savedArticles.includes(art.id)) {
        return false;
      }
    } else if (selectedCategoryId !== 'all' && art.categoryId !== selectedCategoryId) {
      return false;
    }

    // 3. Tag selection channels
    if (selectedTag && !art.tags.includes(selectedTag)) {
      return false;
    }
    
    // 4. Fallback standard text search matches
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const categoryName = categories.find(c => c.id === art.categoryId)?.name || '';
    
    return (
      art.title.toLowerCase().includes(query) ||
      art.summary.toLowerCase().includes(query) ||
      categoryName.toLowerCase().includes(query) ||
      art.tags.some(t => t.toLowerCase().includes(query))
    );
  });

  const handleAISemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    setAiSearching(true);
    setAiSearchResults(null);
    try {
      const resp = await fetch('/app/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-search',
          payload: { query: aiSearchQuery }
        })
      });
      if (!resp.ok) throw new Error('Semantic search API call failed');
      const data = await resp.json();
      setAiSearchResults(data);
    } catch (err) {
      console.error(err);
      alert('AI Search encountered error, falling back to manual search filters.');
    } finally {
      setAiSearching(false);
    }
  };

  const clearAISearch = () => {
    setAiSearchQuery('');
    setAiSearchResults(null);
  };

  // Comments for selected article
  const [selectedComments, setSelectedComments] = useState<Comment[]>([]);
  useEffect(() => {
    if (selectedArticle) {
      // Simulate/Fetch comments
      fetch(`/api/comments?articleId=${selectedArticle.id}`)
        .then(res => res.json())
        .then(setSelectedComments)
        .catch(console.error);
    }
  }, [selectedArticle]);

  // Record related studies (limit to 3, matching category id, excluding self)
  const relatedArticles = selectedArticle
    ? publishedArticles.filter(a => a.id !== selectedArticle.id && a.categoryId === selectedArticle.categoryId).slice(0, 3)
    : [];

  const handleFollowAuthor = async (authorId: string) => {
    try {
      await followAuthorAction(authorId);
      // Synchronize in simulated reader profile
      const isAlreadyFollowing = activeProfile.followedAuthors.includes(authorId);
      let updatedList = [...activeProfile.followedAuthors];
      
      if (isAlreadyFollowing) {
        updatedList = updatedList.filter(id => id !== authorId);
      } else {
        updatedList.push(authorId);
      }
      
      setActiveProfile(prev => ({
        ...prev,
        followedAuthors: updatedList
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleArticleSelected = (article: Article) => {
    setSelectedArticle(article);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Optimistic reading view update
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, viewCount: a.viewCount + 1 } : a));
  };

  const featuredHeroPost = publishedArticles[0];

  // Generate continuous ticker headlines combining actual published stories and West African live indicators
  const tickerHeadlines = [
    ...publishedArticles.slice(0, 5).map(a => `⚡ ${a.title.toUpperCase()}`),
    "🌍 POLITICS: SOUTH AFRICA'S HISTORICAL GOVERNMENT OF NATIONAL UNITY (GNU) BOOSTS INVESTOR CONFIDENCE & STABILIZES THE RAND",
    "📱 TECHNOLOGY: SAFARICOM M-PESA EXPANDS MOBILE MONEY INTEROPERABILITY AND GAINS RECORD 42M CROSS-BORDER USER BASE",
    "💼 FINANCE: NIGERIAN SEC GRANTS FIRST BATCH OF STREAMLINED DIGITAL ASSET OPERATING LICENSES FORMALIZING CRYPTO PLATFORMS",
    "🚀 TECH: MONIEPOINT SECURES SECURE $110M SERIES C FUNDING ROUND FROM DPI AND GOOGLE TO RE-ENGINEER NIGERIAN MERCHANT TRADE FLOWS",
    "📶 TELECOM: NO_KIA INDUCTS PREMIER METROPOLITAN 5G METROPOLIS TRIALS IN CAIRO THROUGH STRATEGIC PARTNERSHIP WITH TELECOM EGYPT",
    "🏙️ METRO: LAGOS RAILWAY RED LINE RAPID TRANSIT PIPELINE CARRIES OVER 250,000 DAILY PASSENGERS IN INAUGURAL OPERATION TRAILS",
    "🔥 MACROECONOMICS: CENTRAL BANK OF NIGERIA MONETARY POLICY COMMITTEE SUSTAINS AGGRESSIVE TARGETS ELEVATING MPR RATE TO 27.25%",
  ];

  // Repeat for continuous infinite scrolling loop integration
  const duplicatedHeadlines = [...tickerHeadlines, ...tickerHeadlines];

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-32 selection:bg-[#d41c1c] selection:text-white ${
      colorMode === 'light' 
        ? 'light-mode bg-slate-50 text-slate-800' 
        : 'bg-[#050505] text-slate-100'
    }`}>
      {/* Floating System Role Switcher */}
      <RoleSimulator
        currentProfileId={activeProfile.id}
        profiles={profiles}
        onProfileSwitched={handleProfileSwitched}
      />

      {/* Dynamic Glass-Morphic Breaking News Ticker */}
      <div 
        id="top-breaking-news-ticker" 
        className="w-full bg-[#050505]/70 backdrop-blur-md border-b border-white/5 text-white py-2 overflow-hidden flex items-center justify-between font-mono text-[10px] sm:text-[11px] shadow-lg relative z-30 hover:bg-black/85 transition-colors group"
      >
        <div className="flex items-center pl-4 pr-3 py-1 bg-gradient-to-r from-[#d41c1c] to-[#b01717] text-white font-black uppercase text-[9px] tracking-widest z-20 flex-shrink-0 animate-pulse rounded-r-full shadow-md gap-1.5 cursor-pointer">
          <span className="h-2 w-2 rounded-full bg-white animate-ping"></span>
          <span>LIVE OFOFO BRIEFING</span>
        </div>
        
        <div className="relative flex-1 overflow-hidden h-5 mx-4 flex items-center z-10">
          <div className="animate-marquee whitespace-nowrap flex gap-12 font-bold uppercase tracking-tight group-hover:[animation-play-state:paused]">
            {duplicatedHeadlines.map((item, index) => (
              <span 
                key={index} 
                className="flex items-center gap-2 hover:text-[#d41c1c] hover:underline transition-all cursor-pointer select-none text-[10px] sm:text-[11px] text-slate-300"
                onClick={() => {
                  if (item.startsWith("⚡")) {
                    const titleClean = item.substring(2).trim();
                    const found = articles.find(a => a.title.toUpperCase() === titleClean && a.status === 'Published');
                    if (found) {
                      handleArticleSelected(found);
                    }
                  }
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 pr-4 text-[9px] text-slate-400 font-mono flex-shrink-0 border-l border-white/10 pl-3 z-20">
          <span className="inline-block h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>SYNC: ACTIVE</span>
        </div>
      </div>

      <Header
        activeProfile={activeProfile}
        currentMode={currentMode}
        setMode={(mode) => {
          if (mode === 'cms') {
            window.location.href = '/admin';
          } else {
            setSelectedArticle(null); // Clear selected reading article when tabs toggle
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          clearAISearch(); // reset semantic search
        }}
      />

      {/* Hero Monetization Advertisement micro-strip */}
      <AdSection position="Header-Banner" ads={ads} />

      {/* CORE DISPLAY ROUTINGS */}

      {selectedArticle ? (
        /* Immersive Article Editorial Reading Screen */
        <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 animate-fade-in font-sans text-left" id="immersive-story-reader">
          {/* Header Action Row */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* Back button */}
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white cursor-pointer group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-[#d41c1c]" />
              Back to Frontpage
            </button>

            {/* Bookmark toggle button */}
            <button
              id="immersive-bookmark-button"
              onClick={() => handleToggleBookmark(selectedArticle.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeProfile.savedArticles.includes(selectedArticle.id)
                  ? 'bg-[#d41c1c] border-[#d41c1c] text-white shadow shadow-red-900/30'
                  : 'bg-white/5 border-white/10 hover:border-[#d41c1c] text-white hover:bg-white/10'
              }`}
            >
              <Bookmark size={11} fill={activeProfile.savedArticles.includes(selectedArticle.id) ? "currentColor" : "none"} />
              <span>{activeProfile.savedArticles.includes(selectedArticle.id) ? "Saved Manuscript" : "Save to Library"}</span>
            </button>
          </div>

          {/* Reading metrics and categories */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-2.5 py-1 bg-[#d41c1c] text-white text-[10px] font-mono tracking-widest font-black uppercase rounded">
              {categories.find(c => c.id === selectedArticle.categoryId)?.name || 'Focus'}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <Clock size={12} className="text-[#d41c1c]" />
              <span>{selectedArticle.readingTime} min read</span>
              <span>•</span>
              <span>{selectedArticle.wordCount} words</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-white leading-tight">
            {selectedArticle.title}
          </h1>

          <p className="text-slate-300 text-sm md:text-base italic bg-white/5 p-4 border-l-4 border-[#d41c1c] mt-6 rounded-r-xl leading-relaxed backdrop-blur-md">
            {"\"" + selectedArticle.summary + "\""}
          </p>

          {/* Audio narration bar if user wants narration */}
          <div className="my-6 p-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-black/60 text-[#d41c1c] flex items-center justify-center flex-shrink-0 animate-pulse border border-white/5">
                <Volume2 size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Ofofo Audio Narration</p>
                <p className="text-[10px] text-slate-400 truncate">Synthesizing real-time voice synthesis playback...</p>
              </div>
            </div>
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="px-4 py-2 bg-[#d41c1c] text-white text-xs font-bold hover:bg-[#b01717] rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-colors flex-shrink-0"
            >
              <Play size={11} fill="currentColor" />
              <span>{isPlayingAudio ? 'Pause Narration' : 'Play Narration'}</span>
            </button>
          </div>

          {isPlayingAudio && (
            <div className="bg-[#d41c1c]/10 p-3 border border-[#d41c1c]/20 rounded-xl mb-6 text-center text-[11px] font-mono font-bold text-[#d41c1c] animate-pulse">
              🔊 Live synthetic feedback stream operating. Capturing speech segments...
            </div>
          )}

          {/* Featured Header banner image */}
          <div className="aspect-[1.9] w-full bg-[#050505] border border-white/10 shadow-lg rounded-2xl overflow-hidden my-6">
            <img src={selectedArticle.featuredImage} alt={selectedArticle.title} className="h-full w-full object-cover" />
          </div>

          {/* Written analytical layout */}
          <div className="prose prose-invert max-w-none text-slate-250 text-sm md:text-base leading-relaxed tracking-tight whitespace-pre-line border-b border-white/10 pb-10" id="editorial-body-prose">
            {selectedArticle.content}
          </div>

          {/* Author Biography box */}
          {(() => {
            const author = profiles.find(p => p.id === selectedArticle.authorId) || profiles[0];
            const isFollowing = activeProfile.followedAuthors.includes(author.id);

            return (
              <div className="my-10 p-5 bg-white/5 border border-white/10 rounded-3xl flex flex-col sm:flex-row items-center gap-5 text-left font-sans backdrop-blur-md">
                <img src={author.avatarUrl} alt={author.fullName} className="h-16 w-16 rounded-full border border-white/10 shadow-sm" />
                <div className="flex-1">
                  <span className="text-[9px] font-bold text-[#d41c1c] uppercase tracking-wider font-mono">STAFF WRITER</span>
                  <h4 className="text-md font-bold text-white mt-0.5">{author.fullName}</h4>
                  <p className="text-xs text-slate-300 mt-1">{author.bio}</p>
                </div>
                <button
                  onClick={() => handleFollowAuthor(author.id)}
                  className={`px-4 py-1.5 border border-white/20 text-xs font-bold rounded-full cursor-pointer transition-all ${
                    isFollowing ? 'bg-white text-black font-semibold' : 'bg-transparent text-white hover:bg-white/10'
                  }`}
                >
                  {isFollowing ? 'Following Staff' : 'Follow Writer'}
                </button>
              </div>
            );
          })()}

          {/* Monetization body advertisement banner */}
          <AdSection position="In-Feed-Banner" ads={ads} />

          {/* Related Stories display */}
          {relatedArticles.length > 0 && (
            <div className="my-10 border-t border-white/10 pt-8 text-left">
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 font-mono">
                RELATED ANALYSIS FROM {categories.find(c => c.id === selectedArticle.categoryId)?.name.toUpperCase()}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map(art => {
                  const author = profiles.find(p => p.id === art.authorId) || profiles[0];
                  const cat = categories.find(c => c.id === art.categoryId) || categories[0];
                  return (
                    <div
                      key={art.id}
                      onClick={() => handleArticleSelected(art)}
                      className="group cursor-pointer border border-white/10 p-4 rounded-xl hover:border-[#d41c1c] bg-white/5 backdrop-blur-md shadow-sm transition-all text-left text-white"
                    >
                      <h4 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-[#d41c1c] transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-2 font-mono">
                        {art.readingTime} min read
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments module */}
          <div className="mt-12">
            <InteractiveComments
              articleId={selectedArticle.id}
              initialComments={selectedComments}
              isStaff={['Super Admin', 'Editor-in-Chief', 'Editor', 'Moderator'].includes(activeProfile.role)}
            />
          </div>
        </main>
      ) : (
        /* Frontpage grid design */
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 font-sans">
          {/* Breaking News scrolling marquee banner */}
          <div className="bg-black/60 border border-white/10 text-white p-3 rounded-2xl mb-8 flex items-center font-mono text-[11px] overflow-hidden shadow-xl">
            <span className="bg-[#d41c1c] text-white font-black px-2 py-0.5 rounded mr-3 uppercase text-[9px] tracking-wider z-10 flex-shrink-0 animate-pulse">BREAKING:</span>
            <div className="relative flex-1 overflow-hidden h-4">
              <div className="animate-marquee whitespace-nowrap flex gap-12 font-bold uppercase tracking-tight">
                <span>⚡ NOLLYWOOD 3.0: SURGING STREAMING LICENSING CONTRACTS CROSS THE $1M MILESTONE</span>
                <span>☀️ KADUNA DECIDED: SOLAR MICROGRIDS UNLEASH DECENTRALIZED INDUSTRIAL PERFORMANCE INDEXES</span>
                <span>📈 YABA VENTURE SYNDICATES SOLIDIFY LAGOS HUB COMMITTED FUNDS AT $2.5B</span>
                <span>⚡ NOLLYWOOD 3.0: SURGING STREAMING LICENSING CONTRACTS CROSS THE $1M MILESTONE</span>
              </div>
            </div>
          </div>

          {/* AI Live Real-life News Syncer Widget */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-red-950/40 p-6 rounded-3xl shadow-2xl mb-10 text-left relative overflow-hidden group">
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,28,28,0.1),transparent_40%)] pointer-events-none" />
            <div className="absolute top-0 right-0 h-32 w-32 bg-red-600/5 blur-3xl rounded-full pointer-events-none transition-all duration-700 group-hover:scale-150" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest text-[#00dda0] font-bold uppercase">
                    OFOFO.NG LIVE SATELLITE CONNECTION ACTIVE
                  </span>
                </div>
                <h3 className="text-[16px] sm:text-lg font-bold text-white tracking-tight leading-snug mb-1.5 font-sans flex items-center gap-2">
                  <Globe className="text-[#d41c1c] animate-pulse" size={20} />
                  Real-time Pulsing News Intelligence
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Connect direct to global publication relays and Nigerian macroeconomic indexes. This trigger instructs Gemini to crawl live search endpoints with <strong className="text-white">Google Search Grounding</strong> to synthesize and download genuine, current West African news and events into your feed.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  disabled={syncingNews}
                  onClick={handleSyncRealNews}
                  className={`px-5 py-3.5 rounded-2xl text-[11px] font-extrabold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 font-mono uppercase tracking-wider ${
                    syncingNews 
                      ? 'bg-slate-800 text-slate-400 border border-slate-700/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#d41c1c] to-[#b01717] text-white hover:brightness-110 active:brightness-90 hover:shadow-lg hover:shadow-red-900/20'
                  }`}
                >
                  {syncingNews ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                      <span>Crawling Web News...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="animate-pulse text-amber-300" />
                      <span>Sync Real-Life News Feed</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notification/Feedback Banners with micro-animations */}
            <AnimatePresence>
              {syncSuccessMs && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300"
                >
                  <Check size={16} className="text-emerald-400 flex-shrink-0" />
                  <p className="font-medium">{syncSuccessMs}</p>
                </motion.div>
              )}
              {syncError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3.5 bg-rose-950/40 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-300"
                >
                  <X size={16} className="text-rose-400 flex-shrink-0" />
                  <p className="font-medium">{syncError}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Semantic Search Module box (Natural Language Article Querying) */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl mb-10 text-left text-white">
            <div className="flex items-center gap-1.5 mb-2 text-[#d41c1c]">
              <Sparkles className="text-[#d41c1c]" size={16} />
              <h3 className="text-xs font-black tracking-widest uppercase text-white font-mono">
                Ofofo.ng Natural-Language AI Search Engine
              </h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed max-w-3xl">
              Type queries in conversational human sentences (e.g. <em>{"explain Delaware entities for Nigerian developers"}</em> or <em>{"what's Kaduna's energy status?"}</em>). Gemini will scan summaries and tag relevance to explain matching stories.
            </p>

            <form onSubmit={handleAISemanticSearch} className="flex gap-2">
              <input
                id="ai-search-query-field"
                type="text"
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                placeholder="Ask Gemini to match articles semantically..."
                className="flex-1 text-xs border border-white/10 outline-none p-3 focus:border-[#d41c1c] focus:ring-1 focus:ring-[#d41c1c] hover:border-white/25 rounded-xl bg-black/40 text-white placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={aiSearching}
                className="px-5 py-3 bg-[#d41c1c] hover:bg-[#b01717] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1 flex-shrink-0"
              >
                {aiSearching ? 'Asking Gemini...' : 'Query Engine'}
              </button>
            </form>

            {/* AI Search outcome banner */}
            {aiSearchResults && (
              <div className="mt-4 p-4 bg-black/50 border border-white/10 rounded-xl" id="ai-search-results-output">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[11px] font-bold text-[#d41c1c] uppercase tracking-wider font-mono">Matched Articles explained by Gemini:</h4>
                  <button onClick={clearAISearch} className="text-[10px] font-bold text-slate-400 hover:text-white">Clear Search Match</button>
                </div>
                {aiSearchResults.matchedArticleIds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No semantic alignments detected for this prompt. Try searching for {"\"Yaba\""} or {"\"solar grids\""}.</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {aiSearchResults.matchedArticleIds.map((id) => {
                      const matchingArticle = articles.find(a => a.id === id);
                      if (!matchingArticle) return null;
                      return (
                        <div key={id} className="text-xs bg-white/5 border border-white/10 p-3 rounded-lg flex items-start gap-3">
                          <Check size={14} className="text-[#d41c1c] mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span
                              onClick={() => handleArticleSelected(matchingArticle)}
                              className="font-black text-white underline hover:text-[#d41c1c] cursor-pointer block leading-tight text-sm"
                            >
                              {matchingArticle.title}
                            </span>
                            <p className="text-slate-300 mt-1 text-[11px] italic">
                              {"\"" + aiSearchResults.explanations[id] + "\""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {aiSearchResults.recommendedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Found Tags:</span>
                    {aiSearchResults.recommendedTags.map((rt) => (
                      <button
                        key={rt}
                        onClick={() => setSearchQuery(rt)}
                        className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-bold text-white transition-colors"
                      >
                        #{rt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Category & Tag Filter Interface Dashboard */}
          <div className="mb-8 w-full bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-6 text-left shadow-2xl relative overflow-hidden" id="category-tag-filter-dashboard">
            {/* Subtle tech grid background element to emphasize high-fidelity */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,28,28,0.05),transparent_50%)] pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#d41c1c] animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase">
                  OFOFO.NG TRANSMISSION DESKS • EXPLORE SECTIONS
                </span>
              </div>
              
              {/* Reset active filters button */}
              {(selectedCategoryId !== 'all' || selectedTag || searchQuery || aiSearchResults) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={handleResetFilters}
                  className="px-3 py-1 bg-[#d41c1c]/15 hover:bg-[#d41c1c]/25 border border-[#d41c1c]/30 hover:border-[#d41c1c]/50 text-[#e53e3e] hover:text-[#f56565] rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto uppercase tracking-wider"
                >
                  <X size={10} />
                  <span>Reset All Filters</span>
                </motion.button>
              )}
            </div>

            {/* Category Navigation Row */}
            <div className="relative z-10">
              <h4 className="text-[11px] font-mono text-slate-400 uppercase font-black mb-3 tracking-widest">
                SELECT CATEGORY DESK
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                {/* 'ALL PUBLICATIONS' master desk */}
                <button
                  key="all"
                  onClick={() => handleCategoryChange('all')}
                  className={`relative p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-20 overflow-hidden ${
                    selectedCategoryId === 'all'
                      ? 'border-[#d41c1c] bg-[#d41c1c]/10 shadow-lg shadow-[#d41c1c]/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02] bg-transparent'
                  }`}
                >
                  {/* Decorative backdrop indicator */}
                  {selectedCategoryId === 'all' && (
                    <motion.div 
                      layoutId="activeCategoryGlow" 
                      className="absolute inset-0 bg-[#d41c1c]/[0.02] pointer-events-none" 
                    />
                  )}
                  <div className="flex items-center justify-between w-full">
                    <Filter className={selectedCategoryId === 'all' ? 'text-[#d41c1c]' : 'text-slate-450'} size={16} />
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      [{publishedArticles.length}]
                    </span>
                  </div>
                  <div>
                    <h5 className="text-xs font-black tracking-tight text-white uppercase mt-1">
                      All Dispatches
                    </h5>
                    <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5 leading-normal">
                      Full live newsroom wire
                    </p>
                  </div>
                </button>

                {/* 'SAVED ARTICLES' bookmark desk */}
                <button
                  id="bookmark-desk-toggle"
                  key="saved"
                  onClick={() => handleCategoryChange('saved')}
                  className={`relative p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-20 overflow-hidden ${
                    selectedCategoryId === 'saved'
                      ? 'border-[#d41c1c] bg-[#d41c1c]/10 shadow-lg shadow-[#d41c1c]/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02] bg-transparent'
                  }`}
                >
                  {/* Decorative backdrop indicator */}
                  {selectedCategoryId === 'saved' && (
                    <motion.div 
                      layoutId="activeCategoryGlow" 
                      className="absolute inset-0 bg-[#d41c1c]/[0.02] pointer-events-none" 
                    />
                  )}
                  <div className="flex items-center justify-between w-full">
                    <Bookmark className={selectedCategoryId === 'saved' ? 'text-[#d41c1c]' : 'text-slate-400'} size={16} fill={selectedCategoryId === 'saved' ? 'currentColor' : 'none'} />
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      [{activeProfile.savedArticles.length}]
                    </span>
                  </div>
                  <div>
                    <h5 className="text-xs font-black tracking-tight text-white uppercase mt-1">
                      Saved Library
                    </h5>
                    <p className="text-[9px] text-[#db1d1d] font-semibold truncate mt-0.5 leading-normal">
                      Saved micro-readings
                    </p>
                  </div>
                </button>

                {/* Specific Seed Categories */}
                {categories.map((cat) => {
                  const IconComponent = categoryIconMap[cat.icon] || Globe;
                  const isSelected = selectedCategoryId === cat.id;
                  const count = publishedArticles.filter(a => a.categoryId === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`relative p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-20 overflow-hidden ${
                        isSelected
                          ? 'border-[#d41c1c] bg-[#d41c1c]/10 shadow-lg shadow-[#d41c1c]/5'
                          : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02] bg-transparent'
                      }`}
                    >
                      {/* Decorative backdrop indicator */}
                      {isSelected && (
                        <motion.div 
                          layoutId="activeCategoryGlow" 
                          className="absolute inset-0 bg-[#d41c1c]/[0.02] pointer-events-none" 
                        />
                      )}
                      
                      <div className="flex items-center justify-between w-full">
                        <IconComponent className={isSelected ? 'text-[#d41c1c]' : 'text-slate-450'} size={16} />
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          [{count}]
                        </span>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-black tracking-tight text-white uppercase mt-1 truncate">
                          {cat.name}
                        </h5>
                        <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5 leading-normal" title={cat.description}>
                          {cat.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Interactive Tag Discovery Sub-Desk */}
            <div className="mt-5 border-t border-white/5 pt-4 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={12} className="text-[#d41c1c]" />
                <h4 className="text-[11px] font-mono text-slate-400 uppercase font-black tracking-widest">
                  POPULAR TAGS DISCOVERY
                </h4>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                {dynamicTagStats.length === 0 ? (
                  <span className="text-[11px] text-slate-500 font-medium italic">
                    No active tags within this category desk.
                  </span>
                ) : (
                  dynamicTagStats.map(([tag, count]) => {
                    const isSelected = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer select-none border ${
                          isSelected
                            ? 'bg-[#d41c1c] text-white border-[#d41c1c] shadow shadow-[#d41c1c]/20'
                            : 'bg-white/[0.02] text-slate-300 hover:text-white border-white/5 hover:border-white/15 hover:bg-white/5'
                        }`}
                      >
                        <span>#{tag}</span>
                        <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-slate-500 font-bold'}`}>
                          ({count})
                        </span>
                        {isSelected && <X size={10} className="ml-0.5 text-white/90" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Filters Summary Strip */}
            {(selectedCategoryId !== 'all' || selectedTag || searchQuery) && (
              <div className="mt-5 bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-wider">
                    ACTIVE DESK FILTERS:
                  </span>
                  
                  {selectedCategoryId !== 'all' && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-white flex items-center gap-1">
                      Desk: <strong className="text-[#d41c1c]">{selectedCategoryId === 'saved' ? 'Saved Articles' : categories.find(c => c.id === selectedCategoryId)?.name}</strong>
                    </span>
                  )}

                  {selectedTag && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-white flex items-center gap-1">
                      Tag: <strong className="text-[#d41c1c]">#{selectedTag}</strong>
                    </span>
                  )}

                  {searchQuery && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-white flex items-center gap-1">
                      Query: <strong className="text-[#d41c1c]">&quot;{searchQuery}&quot;</strong>
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-400">
                  Matches found: <strong className="text-white font-bold">{filteredArticles.length}</strong> publications
                </div>
              </div>
            )}
          </div>

          {/* Core Page Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* LEFT SIDE: Hero section and Latest list */}
            <div className="col-span-1 lg:col-span-8 space-y-10">
              
              {/* Only render prominent Hero if no active searches or custom filters */}
              {!searchQuery && !aiSearchResults && selectedCategoryId === 'all' && !selectedTag && featuredHeroPost && (
                <section id="hero-feature-panel">
                  <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-1.5 font-mono">
                    <Award size={14} className="text-[#d41c1c]" />
                    EXCLUSIVE COVER ANALYSIS
                  </h3>
                  
                  <div
                    onClick={() => handleArticleSelected(featuredHeroPost)}
                    className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-[#d41c1c]/50 transition-all cursor-pointer flex flex-col md:flex-row text-white"
                  >
                    <div className="aspect-[1.5] md:aspect-auto w-full md:w-1/2 border-r-0 md:border-r border-b md:border-b-0 border-white/10 overflow-hidden bg-white/5">
                      <img
                        src={featuredHeroPost.featuredImage}
                        alt={featuredHeroPost.title}
                        className="object-cover w-full h-full group-hover:scale-103 transition-all duration-300"
                      />
                    </div>
                    <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-[#d41c1c] text-white text-[9px] font-black uppercase rounded tracking-wider">
                            {categories.find(c => c.id === featuredHeroPost.categoryId)?.name}
                          </span>
                        </div>
                        <h2 className="text-xl md:text-3xl font-black font-serif tracking-tight mt-3 text-white group-hover:text-[#d41c1c] leading-snug">
                          {featuredHeroPost.title}
                        </h2>
                        <p className="text-xs text-slate-300 mt-3 line-clamp-4 leading-relaxed">
                          {featuredHeroPost.summary}
                        </p>
                      </div>

                      <div className="border-t border-white/10 pt-4 mt-6 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Speed: {featuredHeroPost.readingTime} min read</span>
                        <span className="font-bold underline text-white group-hover:text-[#d41c1c]">Explore Analysis →</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Feed of other articles */}
              <section id="articles-feed-section">
                <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-6 font-mono flex items-center justify-between">
                  <span>
                    {searchQuery || aiSearchResults || selectedCategoryId !== 'all' || selectedTag
                      ? (selectedCategoryId === 'saved' ? `YOUR SAVED MANUSCRIPTS (${filteredArticles.length})` : `FILTERED DISPATCHES (${filteredArticles.length})`)
                      : 'LATEST ANALYSIS DISPATCHES'}
                  </span>
                  {(selectedCategoryId !== 'all' || selectedTag) && (
                    <span className="text-[10px] text-[#d41c1c] font-black uppercase font-mono tracking-widest animate-pulse">
                      • TRANSMISSION ACTIVE
                    </span>
                  )}
                </h3>

                {filteredArticles.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 text-slate-350 shadow-inner">
                    {selectedCategoryId === 'saved' ? (
                      <div className="flex flex-col items-center justify-center p-6 gap-3">
                        <Bookmark size={40} className="text-[#d41c1c] opacity-40 animate-pulse" />
                        <h4 className="text-sm font-bold text-white">Your Saved Library is Empty</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                          Build your custom West African intelligence brief. Tap the bookmark icon on any dispatch card or article reader to keep high-value insights accessible offline.
                        </p>
                        <button
                          onClick={() => setSelectedCategoryId('all')}
                          className="mt-2 px-4 py-2.5 bg-[#d41c1c] text-white hover:bg-[#b01717] rounded-xl text-[10px] font-mono uppercase font-bold transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-md"
                        >
                          Explore Latest Dispatches
                        </button>
                      </div>
                    ) : (
                      "No publications match these filters. Reset filters to clear."
                    )}
                  </div>
                ) : (
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredArticles.map((art) => {
                        const author = profiles.find(p => p.id === art.authorId) || profiles[0];
                        const cat = categories.find(c => c.id === art.categoryId) || categories[0];
                        const isBookmarked = activeProfile.savedArticles.includes(art.id);
                        
                        return (
                           <motion.div
                             key={art.id}
                             layout
                             initial={{ opacity: 0, scale: 0.95, y: 15 }}
                             animate={{ opacity: 1, scale: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95, y: -15 }}
                             transition={{ duration: 0.25, ease: 'easeOut' }}
                           >
                            <ArticleCard
                              article={art}
                              author={author}
                              category={cat}
                              saved={isBookmarked}
                              onArticleSelected={handleArticleSelected}
                              onRefreshBookmarks={() => handleToggleBookmark(art.id)}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </section>

              {/* Interactive Newsletter segment form */}
              <section className="pt-4">
                <NewsletterSubscription />
              </section>
            </div>

            {/* RIGHT SIDEBAR: Category details, ads, premium locks. */}
            <aside className="col-span-1 lg:col-span-4 space-y-8 lg:sticky lg:top-32 h-fit">
              {/* Category list box */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl text-white">
                <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 font-mono">
                  STORY ARCHIVES DESK
                </h3>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        handleCategoryChange(cat.id);
                        const el = document.getElementById('category-tag-filter-dashboard');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className={`w-full text-left p-3 border rounded-xl transition-all block cursor-pointer text-white ${
                        selectedCategoryId === cat.id
                          ? 'border-[#d41c1c] bg-[#d41c1c]/10'
                          : 'border-white/10 hover:border-[#d41c1c] bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <h4 className="text-xs font-bold flex items-center gap-1 text-white">
                        {cat.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 italic mt-1 leading-normal">
                        {cat.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar Advertisement spotlight */}
              <AdSection position="Sidebar-Widget" ads={ads} />

              {/* Bookmarked premium sidebar section */}
              {activeProfile.savedArticles.length > 0 && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl text-left text-white">
                  <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3 font-mono">
                    YOUR SAVED MANUSCRIPTS ({activeProfile.savedArticles.length})
                  </h3>
                  <div className="space-y-2">
                    {activeProfile.savedArticles.map((artId) => {
                      const bookmarked = articles.find(a => a.id === artId);
                      if (!bookmarked) return null;
                      return (
                        <div
                          key={artId}
                          className="flex items-center justify-between gap-2 p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#d41c1c]/40 rounded-xl transition-all group"
                        >
                          <span
                            onClick={() => handleArticleSelected(bookmarked)}
                            className="flex-1 text-xs font-bold text-white cursor-pointer truncate leading-snug group-hover:text-red-400 transition-colors"
                          >
                            {bookmarked.title}
                          </span>
                          <button
                            title="Remove bookmark"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookmark(artId);
                            }}
                            className="h-6 w-6 rounded-md bg-transparent text-slate-400 hover:text-white hover:bg-[#d41c1c]/20 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}
