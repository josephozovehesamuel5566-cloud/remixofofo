'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Check, Save, Trash2, ArrowRight, Image as ImageIcon, Sparkles, 
  HelpCircle, BarChart3, Clock, AlertCircle, BookOpen, Layers, Users, TrendingUp,
  FileCheck, ShieldAlert
} from 'lucide-react';
import { Article, UserProfile, Category, Comment, Revision, AuditLog, MediaAsset } from '@/lib/db';
import { 
  createArticleAction, updateArticleAction, deleteArticleAction, 
  getCategoriesAction, getAuditLogsAction, getAnalyticsAction, 
  getMediaLibraryAction, uploadMediaAction 
} from '@/lib/actions';

interface CMSWorkspaceProps {
  activeProfile: UserProfile;
  profiles: UserProfile[];
  initialArticles: Article[];
}

export default function CMSWorkspace({ activeProfile, profiles, initialArticles }: CMSWorkspaceProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(initialArticles[0] || null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form States for active editing article
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [status, setStatus] = useState<Article['status']>('Draft');
  const [categoryId, setCategoryId] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [sponsored, setSponsored] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

  // AI assistant States
  const [aiHeadlinePrompt, setAiHeadlinePrompt] = useState('catchy business');
  const [aiHeadlines, setAiHeadlines] = useState<string[]>([]);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiHeadlineLoading, setAiHeadlineLoading] = useState(false);
  const [aiSeoLoading, setAiSeoLoading] = useState(false);
  const [aiCritique, setAiCritique] = useState('');
  const [aiCritiqueLoading, setAiCritiqueLoading] = useState(false);

  // Administrative stats & diagnostics state
  const [activeTab, setActiveTab] = useState<'editor' | 'analytics' | 'media' | 'audit'>('editor');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const clearForm = () => {
    setTitle('');
    setSlug('');
    setSummary('');
    setContent('');
    setFeaturedImage('https://picsum.photos/seed/placeholder/800/450');
    setStatus('Draft');
    setCategoryId(categories[0]?.id || 'cat-1');
    setTagsStr('');
    setSeoTitle('');
    setSeoDescription('');
    setSponsored(false);
    setPremiumOnly(false);
    setChangeSummary('');
  };

  // Sync Form States with Newly Selected Article
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedArticle) {
        setTitle(selectedArticle.title);
        setSlug(selectedArticle.slug);
        setSummary(selectedArticle.summary);
        setContent(selectedArticle.content);
        setFeaturedImage(selectedArticle.featuredImage);
        setStatus(selectedArticle.status);
        setCategoryId(selectedArticle.categoryId);
        setTagsStr(selectedArticle.tags.join(', '));
        setSeoTitle(selectedArticle.seoTitle || '');
        setSeoDescription(selectedArticle.seoDescription || '');
        setSponsored(selectedArticle.sponsored);
        setPremiumOnly(selectedArticle.premiumOnly);
        setChangeSummary('');
      } else {
        clearForm();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedArticle, categories]);

  // Load supporting metrics on load
  useEffect(() => {
    getCategoriesAction().then(setCategories).catch(console.error);
    getMediaLibraryAction().then(setMediaAssets).catch(console.error);

    if (activeProfile.role === 'Super Admin' || activeProfile.role === 'Editor-in-Chief') {
      getAnalyticsAction().then(setAnalyticsData).catch(console.error);
      getAuditLogsAction().then(setAuditLogs).catch(console.error);
    }
  }, [activeProfile, activeTab]);

  const handleCreateNewDraft = () => {
    clearForm();
    setSelectedArticle(null);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    const postTags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const finalSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload = {
      title,
      slug: finalSlug,
      summary,
      content,
      featuredImage: featuredImage || 'https://picsum.photos/seed/featured/800/450',
      status,
      authorId: activeProfile.id,
      categoryId: categoryId || categories[0]?.id || 'cat-1',
      tags: postTags,
      seoTitle,
      seoDescription,
      sponsored,
      premiumOnly,
    };

    try {
      if (selectedArticle) {
        // Update Action
        const updated = await updateArticleAction(selectedArticle.id, payload, changeSummary || 'Edited from newsroom workspace');
        setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
        setSelectedArticle(updated);
      } else {
        // Create Action
        const created = await createArticleAction(payload);
        setArticles(prev => [created, ...prev]);
        setSelectedArticle(created);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failure: ${err?.message || 'Transaction aborted'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedArticle) return;
    if (!confirm('Are you absolutely certain you want to redact and delete this publication from database records? This is irreversible.')) return;

    try {
      await deleteArticleAction(selectedArticle.id);
      setArticles(prev => prev.filter(a => a.id !== selectedArticle.id));
      setSelectedArticle(articles.find(a => a.id !== selectedArticle.id) || null);
    } catch (err) {
      console.error(err);
    }
  };

  // --- GEMINI INTELLIGENCE ASSISTANCE triggers (POST to app/api/gemini) ---

  const handleAIGenerateHeadlines = async () => {
    if (!content) return alert('Draft content buffer is empty. Type some content first.');
    setAiHeadlineLoading(true);
    try {
      const resp = await fetch('/app/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'headline-gen',
          payload: { content, tone: aiHeadlinePrompt }
        })
      });
      if (!resp.ok) throw new Error('API failed');
      const data = await resp.json();
      setAiHeadlines(data.headlines || []);
    } catch (error) {
      alert('Gemini generated errors, make sure process.env.GEMINI_API_KEY is active.');
    } finally {
      setAiHeadlineLoading(false);
    }
  };

  const handleAIGenerateSummary = async () => {
    if (!content) return alert('Draft content buffer is empty. Type some content first.');
    setAiSummaryLoading(true);
    try {
      const resp = await fetch('/app/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summary-gen',
          payload: { content }
        })
      });
      if (!resp.ok) throw new Error('API failed');
      const data = await resp.json();
      setSummary(data.summary || '');
    } catch (error) {
      alert('Gemini generated errors.');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleAIOptimizeSeo = async () => {
    if (!content) return alert('Draft content buffer is empty. Type some content first.');
    setAiSeoLoading(true);
    try {
      const resp = await fetch('/app/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'seo-suggestions',
          payload: { title, content }
        })
      });
      if (!resp.ok) throw new Error('API failed');
      const data = await resp.json();
      setSeoTitle(data.seoTitle || '');
      setSeoDescription(data.seoDescription || '');
    } catch (error) {
      alert('Gemini generated errors.');
    } finally {
      setAiSeoLoading(false);
    }
  };

  const handleAICritique = async () => {
    if (!content) return alert('Draft content buffer is empty. Type some content first.');
    setAiCritiqueLoading(true);
    try {
      const resp = await fetch('/app/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'content-improvements',
          payload: { title, content }
        })
      });
      if (!resp.ok) throw new Error('API failed');
      const data = await resp.json();
      setAiCritique(data.feedback || '');
    } catch (error) {
      alert('Gemini critique failed.');
    } finally {
      setAiCritiqueLoading(false);
    }
  };

  // --- MEDIA LIBRARY SIMULATION TRIGGER ---
  const handleSimulateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const filenameInput = (e.currentTarget as any).elements.filename;
    const urlInput = (e.currentTarget as any).elements.url;
    if (!filenameInput.value || !urlInput.value) return;

    try {
      const uploaded = await uploadMediaAction(
        filenameInput.value,
        'Root',
        1024 * 342, // random sizes
        'image/png',
        urlInput.value,
      );
      setMediaAssets(prev => [uploaded, ...prev]);
      setFeaturedImage(uploaded.url); // instantly populate editor
      filenameInput.value = '';
      urlInput.value = '';
      alert('Media asset synced in local library. Populated featured image in your editor!');
    } catch (err) {
      console.error(err);
    }
  };

  // Check roles permissions
  const isAdmin = activeProfile.role === 'Super Admin';
  const isCmsEditor = ['Super Admin', 'Editor-in-Chief', 'Editor'].includes(activeProfile.role);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 font-sans text-left text-white" id="cms-workspace-main">
      {/* Title block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight font-display font-serif text-white flex items-center gap-2">
            <Layers className="text-[#d41c1c]" />
            Ofofo Newsroom & Editor Portal
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Publishing console for Author updates, regulatory checks, and direct performance dashboards.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 bg-[#0a0a0a]/60 p-1 rounded-xl border border-white/10 text-xs font-semibold backdrop-blur-md">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'editor' ? 'bg-[#d41c1c] text-white shadow-sm' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileText size={13} />
            Editorial Editor
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'media' ? 'bg-[#d41c1c] text-white shadow-sm' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <ImageIcon size={13} />
            Asset Library
          </button>
          
          {(isAdmin || activeProfile.role === 'Editor-in-Chief') ? (
            <>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'analytics' ? 'bg-[#d41c1c] text-white shadow-sm' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <BarChart3 size={13} />
                Admin Analytics
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'audit' ? 'bg-[#d41c1c] text-white shadow-sm' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Clock size={13} />
                Audit Logs
              </button>
            </>
          ) : (
            <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1 bg-stone-200/50 px-2 py-1 rounded">
              <ShieldAlert size={10} className="text-slate-450" />
              Logs locked for authors
            </div>
          )}
        </div>
      </div>

      {/* TABS CONTAINER */}

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: Article Draft Selector Column */}
          <div className="lg:col-span-1 border-r border-white/10 pr-0 lg:pr-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                YOUR MANUSCRIPTS
              </h3>
              <button
                onClick={handleCreateNewDraft}
                className="p-1 px-2.5 bg-[#d41c1c] text-white text-[11px] font-bold rounded hover:bg-[#b01717] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <Plus size={11} />
                Draft Post
              </button>
            </div>

            <div className="space-y-1.5" id="manuscripts-draft-list">
              {articles.map((art) => {
                const isSelected = selectedArticle?.id === art.id;
                let statusBadge = "bg-white/5 text-slate-300 border border-white/10";
                if (art.status === 'Published') statusBadge = "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20";
                if (art.status === 'Review') statusBadge = "bg-[#d41c1c]/10 text-[#d41c1c] border border-[#d41c1c]/20";
                if (art.status === 'Draft') statusBadge = "bg-white/5 text-slate-300 border border-white/10";

                return (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                      isSelected 
                        ? 'bg-[#d41c1c] text-white border-[#d41c1c] shadow-md' 
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <p className={`font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-white'}`}>{art.title || 'Untitled Draft'}</p>
                    <div className="flex items-center justify-between gap-2 mt-2 text-[10px]">
                      <span className="font-mono text-slate-400">Speed: {art.readingTime}m read</span>
                      <span className={`px-1 rounded text-[8px] font-bold ${statusBadge}`}>{art.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN & RIGHT: Notion-styled Editor Panel */}
          <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-8">
            <form onSubmit={handleSavePost} className="xl:col-span-2 space-y-5" id="notion-styled-editor">
              {/* Draft warnings */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-450 rounded-xl text-xs font-bold animate-pulse">
                  ✓ Database sync transaction complete. All changes saved to server.
                </div>
              )}

              <div className="space-y-1">
                <input
                  required
                  type="text"
                  placeholder="The Title Of Your Editorial Story..."
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="w-full text-2xl md:text-3xl font-black font-serif tracking-tight border-b border-white/10 focus:border-[#d41c1c] outline-none pb-2 text-white placeholder-slate-500 bg-transparent"
                />
                <input
                  type="text"
                  placeholder="URL slug-path (auto-calculates, e.g., 'solar-microgrids-kaduna')"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full text-[10px] font-mono text-slate-400 focus:text-slate-200 border-none outline-none bg-transparent"
                />
              </div>

              {/* Status and parameters grids */}
              <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1">PUBLICATION STATUS</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Article['status'])}
                    className="w-full p-2 bg-black border border-white/10 rounded-lg outline-none font-semibold text-white"
                  >
                    <option value="Draft">Draft (Private)</option>
                    <option value="Review">In Editorial Review</option>
                    {isCmsEditor && (
                      <>
                        <option value="Approved">Approved for Schedule</option>
                        <option value="Published">Published Live</option>
                        <option value="Archived">Archived Record</option>
                      </>
                    )}
                  </select>
                </div>                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1">STORY CLASSIFICATION</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2 bg-black border border-white/10 rounded-lg outline-none font-semibold text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1">EXECUTIVE SUMMARY (Max 3 lines)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe the editorial anchor of this story..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 border border-white/10 focus:border-[#d41c1c] rounded-xl text-xs bg-black/45 outline-none text-slate-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase">ARTICLE ESSAY CONTENT (Markdown compatible)</label>
                  <span className="text-[10px] font-mono text-slate-500">Avg speed calculation active</span>
                </div>
                <textarea
                  required
                  rows={14}
                  placeholder={`# Your Story Begins Here
                  
Use rich headers (##), bold statements (**text**), lists, pullquotes (> Text), and tables to build custom narratives comparable to TechCrunch and Medium.`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 border border-white/10 rounded-2xl text-xs font-mono bg-[#050505] focus:bg-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#d41c1c]/50 outline-none text-white"
                />
              </div>

              {/* Secondary togglers, SEO and tracking data */}
              <div className="border border-white/10 p-4 rounded-2xl bg-[#0a0a0a]/65 text-white space-y-4 shadow-xl">
                <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase">METADATA & MONETIZATION SETTINGS</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1">SEO TITLE ACCENTS</label>
                    <input
                      type="text"
                      placeholder="SEO optimized meta title..."
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full p-2 bg-black border border-white/10 focus:border-[#d41c1c] rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1">SEO META DESCRIPTION</label>
                    <input
                      type="text"
                      placeholder="SEO optimized search snippet..."
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full p-2 bg-black border border-white/10 focus:border-[#d41c1c] rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1">FEATURED COVER IMAGE (HTTPS URL)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      className="w-full p-2 bg-black border border-white/10 focus:border-[#d41c1c] rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1">TAGS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      placeholder="Tech, Lagos, Finance, Green Transition"
                      value={tagsStr}
                      onChange={(e) => setTagsStr(e.target.value)}
                      className="w-full p-2 bg-black border border-white/10 focus:border-[#d41c1c] rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={sponsored}
                      onChange={(e) => setSponsored(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 pr-1 accent-[#d41c1c]"
                    />
                    Mark as Sponsored Content Campaign
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={premiumOnly}
                      onChange={(e) => setPremiumOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 pr-1 accent-[#d41c1c]"
                    />
                    Restrict to Paywalled Premium tiers
                  </label>
                </div>

                {selectedArticle && (
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1 font-mono">REVISION HISTORY EXPLANATORY SUMMARY (Logged in Audit Logs)</label>
                    <input
                      type="text"
                      placeholder="How has this article’s state or grammar adjusted in this revision?"
                      value={changeSummary}
                      onChange={(e) => setChangeSummary(e.target.value)}
                      className="w-full p-2 bg-black border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons row */}
              <div className="flex items-center gap-3 pt-4 border-t border-stone-150">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-850 text-stone-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Save size={14} />
                  {loading ? 'Synthesizing...' : selectedArticle ? 'Synchronize Updates' : 'Publish Draft Document'}
                </button>

                {selectedArticle && (
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    className="p-2.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto transition-colors"
                  >
                    <Trash2 size={14} />
                    Redact Story
                  </button>
                )}
              </div>
            </form>

            {/* AI SYSTEM SIDEBAR FOR ASSISTED JOURNALISM */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-amber-50/50 border-2 border-dashed border-amber-900/30 p-5 rounded-2xl font-sans" id="ai-newsroom-co-pilot">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="text-amber-700" size={16} />
                  <h4 className="text-xs font-black tracking-widest text-stone-800 uppercase">
                    Gemini Newsroom Co-Pilot
                  </h4>
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed mb-4">
                  Leveraging server-side **GoogleGenAI SDK** and the fast **Gemini-3.5-flash** deep language model. Perform high-CTR headline generation, optimization metrics, or general editorial styling audits instantly.
                </p>

                {/* Summarizer Module */}
                <div className="border-t border-stone-200/60 pt-4 mb-4">
                  <h5 className="text-[11px] font-bold text-stone-900 mb-1">1. Generate Editorial Card Summary</h5>
                  <button
                    type="button"
                    onClick={handleAIGenerateSummary}
                    disabled={aiSummaryLoading}
                    className="w-full py-2 bg-stone-900 text-stone-100 text-left px-3 rounded-lg text-[10px] font-bold hover:bg-stone-850 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>{aiSummaryLoading ? 'Formulating summary...' : 'Draft Summary via Gemini'}</span>
                    <Sparkles size={11} className="text-amber-400" />
                  </button>
                </div>

                {/* SEO optimizer Module */}
                <div className="border-t border-stone-200/60 pt-4 mb-4">
                  <h5 className="text-[11px] font-bold text-stone-900 mb-1">2. Structured SEO Generation</h5>
                  <button
                    type="button"
                    onClick={handleAIOptimizeSeo}
                    disabled={aiSeoLoading}
                    className="w-full py-2 bg-stone-900 text-stone-100 text-left px-3 rounded-lg text-[10px] font-bold hover:bg-stone-850 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>{aiSeoLoading ? 'Synthesizing SEO metadata...' : 'Optimize SEO Tags via Gemini'}</span>
                    <Sparkles size={11} className="text-amber-400" />
                  </button>
                </div>

                {/* Editorial critique module */}
                <div className="border-t border-stone-200/60 pt-4 mb-4">
                  <h5 className="text-[11px] font-bold text-stone-900 mb-1">3. Content Critique & Styling Audit</h5>
                  <button
                    type="button"
                    onClick={handleAICritique}
                    disabled={aiCritiqueLoading}
                    className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white text-left px-3 rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer transition-colors mb-2"
                  >
                    <span>{aiCritiqueLoading ? 'Evaluating prose...' : 'Run Editorial Compliance Audit'}</span>
                    <Sparkles size={11} className="text-amber-200" />
                  </button>

                  {aiCritique && (
                    <div className="bg-white border border-stone-250 p-3 rounded-lg text-[10px] font-mono leading-relaxed text-stone-700 max-h-48 overflow-y-auto whitespace-pre-line">
                      {aiCritique}
                    </div>
                  )}
                </div>

                {/* Headline generator section */}
                <div className="border-t border-stone-200/60 pt-4">
                  <h5 className="text-[11px] font-bold text-stone-950 mb-1">4. Generate High-CTR Headlines</h5>
                  
                  <div className="flex gap-2 mb-2 text-[10px]">
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 flex-shrink-0 mt-2">Tone Focus:</span>
                    <select
                      value={aiHeadlinePrompt}
                      onChange={(e) => setAiHeadlinePrompt(e.target.value)}
                      className="p-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white border border-stone-250 rounded font-semibold text-stone-700"
                    >
                      <option value="professional & analytical">Analytical Professional</option>
                      <option value="provocative essayist">Provocative Essayist</option>
                      <option value="catchy newsroom">Catchy Newsroom</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAIGenerateHeadlines}
                    disabled={aiHeadlineLoading}
                    className="w-full py-2 bg-stone-900 text-stone-100 px-3 rounded-lg text-[10px] font-bold hover:bg-stone-850 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>{aiHeadlineLoading ? 'Evaluating CTR potentials...' : 'Synthesize 5 Headlines'}</span>
                    <Sparkles size={11} className="text-amber-400" />
                  </button>

                  <div className="space-y-1 mt-3" id="loaded-headlines-assistant">
                    {aiHeadlines.map((headline, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTitle(headline);
                          setSlug(headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                        }}
                        className="w-full bg-white hover:bg-amber-50 text-[10px] font-medium text-stone-800 text-left p-2 border border-stone-200 hover:border-amber-700 rounded transition-all block cursor-pointer"
                        title="Click to apply title and slide path"
                      >
                        {idx + 1}. {headline}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-6" id="cms-asset-library">
          <div className="p-5 bg-white border-2 border-stone-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
            <h3 className="text-sm font-black tracking-widest text-stone-400 uppercase mb-4">
              UPLOAD DIRECT SECTOR ASSETS
            </h3>
            
            <form onSubmit={handleSimulateUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] tracking-wider text-stone-500 uppercase mb-1">ASSET LABEL FILENAME</label>
                <input
                  name="filename"
                  required
                  type="text"
                  placeholder="e.g. lagos-yaba-incubators"
                  className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-50 outline-none text-stone-850"
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] tracking-wider text-stone-500 uppercase mb-1">DIRECT HOST URL (Supports PicSum/Unsplash)</label>
                  <input
                    name="url"
                    required
                    type="url"
                    placeholder="e.g. https://picsum.photos/seed/nigeriatech/1000/600"
                    className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-50 outline-none text-stone-850"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex-shrink-0"
                >
                  Import Asset
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 p-2" id="library-assets-catalog">
            {mediaAssets.length === 0 ? (
              <div className="col-span-full text-center py-12 text-stone-400 text-xs font-bold">
                No custom assets registered. Use the panel above to simulate direct database indexing!
              </div>
            ) : (
              mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="aspect-[1.5] bg-stone-100 border-b border-stone-200 relative group">
                    <img src={asset.url} alt={asset.filename} className="object-cover h-full w-full" />
                    <button
                      onClick={() => {
                        setFeaturedImage(asset.url);
                        alert('Featured image covers filled!');
                      }}
                      className="absolute inset-0 bg-stone-900/60 text-[10px] text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold tracking-tight transition-all cursor-pointer"
                    >
                      Apply Cover Photo
                    </button>
                  </div>
                  <div className="p-3 text-xs">
                    <p className="font-bold text-stone-900 truncate">{asset.filename}</p>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mt-1">
                      <span>Folder: {asset.folder}</span>
                      <span>342 KB</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8" id="admin-analytics-dashboard">
          {/* Top banner counters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border-2 border-stone-900 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-black">REVENUE TRANSACTIONS</span>
              <h3 className="text-2xl font-black text-stone-950 mt-1 font-mono">₦1,750,000</h3>
              <p className="text-[10px] text-stone-500 mt-2 flex items-center gap-1">
                <TrendingUp size={11} className="text-emerald-600" />
                <span>+24.2% since May cycle</span>
              </p>
            </div>

            <div className="bg-white border-2 border-stone-900 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-black">ACCUMULATIVE READERSHIP</span>
              <h3 className="text-2xl font-black text-stone-950 mt-1 font-mono">43,700</h3>
              <p className="text-[10px] text-stone-500 mt-2 flex items-center gap-1">
                <TrendingUp size={11} className="text-emerald-600" />
                <span>+12.8% since solar transition reports</span>
              </p>
            </div>

            <div className="bg-white border-2 border-stone-900 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-black">AUDIENCE SUBSCRIBERS</span>
              <h3 className="text-2xl font-black text-stone-950 mt-1 font-mono">812</h3>
              <p className="text-[10px] text-stone-500 mt-2 flex items-center gap-1">
                <TrendingUp size={11} className="text-emerald-600" />
                <span>94.2% email verification cleared</span>
              </p>
            </div>

            <div className="bg-white border-2 border-stone-900 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-black">COMMENTS MODERATION OVERVIEW</span>
              <h3 className="text-2xl font-black text-stone-950 mt-1 font-mono">100%</h3>
              <p className="text-[10px] text-stone-500 mt-2">
                All reported spam filtered instantly
              </p>
            </div>
          </div>

          {/* D3/Recharts-Style Fully Native High-Fidelity SVG Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Custom SVG Line Chart for revenue tracking */}
            <div className="bg-white border-2 border-stone-900 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] text-left">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xs font-black tracking-widest text-stone-400 uppercase mb-0.5">NET ADVERTISING REVENUE (NGN ₦)</h4>
                  <p className="text-xs text-stone-550">Dynamic performance metrics over recent days</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-800 border border-amber-500/10 rounded">LIVE AUDITS</span>
              </div>

              {/* Native SVG Graph rendering */}
              <div className="aspect-[2] w-full bg-stone-50 rounded-xl border border-stone-200 relative flex items-center justify-center p-4">
                <svg viewBox="0 0 500 220" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="480" y2="30" stroke="#e7e5e4" strokeDasharray="3" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#e7e5e4" strokeDasharray="3" />
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#e7e5e4" strokeDasharray="3" />
                  <line x1="40" y1="180" x2="480" y2="180" stroke="#d6d3d1" strokeWidth="2" />

                  {/* Y-Axis Value Labels */}
                  <text x="30" y="34" textAnchor="end" className="text-[9px] font-mono fill-stone-400">750K</text>
                  <text x="30" y="84" textAnchor="end" className="text-[9px] font-mono fill-stone-400">500K</text>
                  <text x="30" y="134" textAnchor="end" className="text-[9px] font-mono fill-stone-400">250K</text>
                  <text x="30" y="184" textAnchor="end" className="text-[9px] font-mono fill-stone-400">0</text>

                  {/* Graph Data points line */}
                  <path
                    d="M 60 144 L 160 118 L 260 94 L 360 82 L 460 38"
                    fill="none"
                    stroke="#b45309"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-md"
                  />

                  {/* Fill Under Plot Line */}
                  <path
                    d="M 60 144 L 160 118 L 260 94 L 360 82 L 460 38 L 460 180 L 60 180 Z"
                    fill="url(#gradient-ad)"
                    className="opacity-15"
                  />

                  {/* Node plot circles */}
                  <circle cx="60" cy="144" r="5" fill="#1c1917" stroke="#b45309" strokeWidth="2" />
                  <circle cx="160" cy="118" r="5" fill="#1c1917" stroke="#b45309" strokeWidth="2" />
                  <circle cx="260" cy="94" r="5" fill="#1c1917" stroke="#b45309" strokeWidth="2" />
                  <circle cx="360" cy="82" r="5" fill="#1c1917" stroke="#b45309" strokeWidth="2" />
                  <circle cx="460" cy="38" r="5" fill="#1c1917" stroke="#b45309" strokeWidth="2" />

                  {/* X-Axis labels */}
                  <text x="60" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-500">JUN 01</text>
                  <text x="160" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-500">JUN 02</text>
                  <text x="260" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-500">JUN 03</text>
                  <text x="360" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-500">JUN 04</text>
                  <text x="460" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-500">JUN 05 (PROJ)</text>

                  {/* Gradient definition block */}
                  <defs>
                    <linearGradient id="gradient-ad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b45309" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Custom SVG Column Bar Chart for traffic distribution segments */}
            <div className="bg-white border-2 border-stone-900 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] text-left">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xs font-black tracking-widest text-stone-400 uppercase mb-0.5">ACCREDITED TRAFFIC REFERRALS (% RATIO)</h4>
                  <p className="text-xs text-stone-500">Breakdown of content discovery platforms</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-stone-900 text-white rounded">AGGREGATE TRACKS</span>
              </div>

              {/* Native Bar Plot SVG */}
              <div className="aspect-[2] w-full bg-stone-50 rounded-xl border border-stone-200 relative flex items-center justify-center p-4">
                <svg viewBox="0 0 500 220" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="480" y2="30" stroke="#e7e5e4" strokeDasharray="2" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#e7e5e4" strokeDasharray="2" />
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#e7e5e4" strokeDasharray="2" />
                  <line x1="40" y1="180" x2="480" y2="180" stroke="#d6d3d1" strokeWidth="2" />

                  {/* Y-Axis Value Labels */}
                  <text x="30" y="34" textAnchor="end" className="text-[9px] font-mono fill-stone-400">100%</text>
                  <text x="30" y="84" textAnchor="end" className="text-[9px] font-mono fill-stone-400">50%</text>
                  <text x="30" y="134" textAnchor="end" className="text-[9px] font-mono fill-stone-400">25%</text>
                  <text x="30" y="184" textAnchor="end" className="text-[9px] font-mono fill-stone-400">0</text>

                  {/* Bars discovery block */}
                  {/* Twitter/X - 42% -> 180 - (150 * 0.42) = 117 */}
                  <rect x="75" y="117" width="40" height="63" fill="#1c1917" rx="4" className="hover:fill-amber-800 transition-all cursor-pointer" />
                  {/* LinkedIn - 28% -> 180 - (150 * 0.28) = 138 */}
                  <rect x="175" y="138" width="40" height="42" fill="#1c1917" rx="4" className="hover:fill-amber-800 transition-all cursor-pointer" />
                  {/* Direct - 18% -> 180 - (150 * 0.18) = 153 */}
                  <rect x="275" y="153" width="40" height="27" fill="#1c1917" rx="4" className="hover:fill-amber-800 transition-all cursor-pointer" />
                  {/* Google - 12% -> 180 - (150 * 0.12) = 162 */}
                  <rect x="375" y="162" width="40" height="18" fill="#1c1917" rx="4" className="hover:fill-amber-800 transition-all cursor-pointer" />

                  {/* Labels on x-axis */}
                  <text x="95" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-600 font-bold">Twitter/X (42%)</text>
                  <text x="195" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-600 font-bold">LinkedIn (28%)</text>
                  <text x="295" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-600 font-bold">Direct IP (18%)</text>
                  <text x="395" y="196" textAnchor="middle" className="text-[8px] font-mono fill-stone-600 font-bold">Search (12%)</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4" id="cms-audit-logs">
          <div className="p-5 bg-white border-2 border-stone-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] text-left">
            <h3 className="text-sm font-black tracking-widest text-stone-400 uppercase mb-4 flex items-center gap-1.5">
              <FileCheck size={16} className="text-emerald-600" />
              SYSTEM COMPLIANCE AUDIT TRAILS
            </h3>

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left text-stone-600 font-mono">
                <thead className="bg-stone-100 text-stone-700 uppercase font-black text-[9px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">LOG_UUID</th>
                    <th className="p-3">EVENT_ACTION</th>
                    <th className="p-3">DETAILS_METRICS</th>
                    <th className="p-3">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-stone-400 italic">No events recorded during this terminal lifetime. Modify or construct a story is needed to generate audit logs.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50">
                        <td className="p-3 font-semibold text-stone-500">{log.id}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-stone-900 text-stone-100 rounded text-[9px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 max-w-sm truncate text-[10px]">{JSON.stringify(log.details)}</td>
                        <td className="p-3 text-stone-400 text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
