'use client';

import React from 'react';
import { Clock, Heart, Eye, ArrowUpRight, Bookmark, Share2 } from 'lucide-react';
import { Article, UserProfile, Category } from '@/lib/db';
import { incrementLikeAction, saveArticleAction } from '@/lib/actions';

interface ArticleCardProps {
  article: Article;
  author: UserProfile;
  category: Category;
  saved: boolean;
  onArticleSelected: (article: Article) => void;
  onRefreshLikes?: () => void;
  onRefreshBookmarks?: () => void;
}

export default function ArticleCard({ article, author, category, saved, onArticleSelected, onRefreshLikes, onRefreshBookmarks }: ArticleCardProps) {
  const [likes, setLikes] = React.useState(article.likeCount);
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(saved);

  // Sync state with props shifts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLikes(article.likeCount);
    }, 0);
    return () => clearTimeout(timer);
  }, [article.likeCount]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaved(saved);
    }, 0);
    return () => clearTimeout(timer);
  }, [saved]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const updatedCount = await incrementLikeAction(article.id);
      setLikes(updatedCount);
      if (onRefreshLikes) onRefreshLikes();
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const added = await saveArticleAction(article.id);
      setIsSaved(added);
      if (onRefreshBookmarks) onRefreshBookmarks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <article
      id={`article-card-${article.id}`}
      onClick={() => onArticleSelected(article)}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:border-[#d41c1c]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer overflow-hidden flex flex-col h-full font-sans text-left shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-white"
    >
      {/* Article Featured Hero Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/10 bg-white/5">
        <img
          src={article.featuredImage || 'https://picsum.photos/seed/placeholder/800/450'}
          alt={article.title}
          className="object-cover w-full h-full hover:scale-105 transition-all duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {/* Category Badge */}
          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white rounded-md">
            {category?.name || 'News'}
          </span>
          {article.sponsored && (
            <span className="px-2.5 py-1 bg-[#d41c1c] border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white rounded-md shadow-sm">
              Sponsored
            </span>
          )}
          {article.premiumOnly && (
            <span className="px-2.5 py-1 bg-purple-900/80 backdrop-blur-md border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider text-white rounded-md">
              Premium
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          title={isSaved ? "Saved" : "Save article"}
          className={`absolute top-3 right-3 h-8 w-8 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer transition-colors ${
            isSaved ? 'bg-[#d41c1c] text-white border-transparent' : 'bg-black/40 text-slate-350 hover:text-white hover:bg-black/60'
          }`}
        >
          <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Article Inner Contents */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Meta header details */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mb-2">
            <span>By</span>
            <span className="font-bold underline text-slate-300">{author?.fullName || 'Editor'}</span>
            <span>•</span>
            <div className="flex items-center gap-0.5">
              <Clock size={11} />
              <span>{article.readingTime} min read</span>
            </div>
          </div>

          <h3 className="text-lg md:text-xl font-bold tracking-tight text-white hover:text-[#d41c1c] transition-colors line-clamp-2 leading-tight">
            {article.title}
          </h3>

          <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/10 mt-4 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* View count indicator */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Eye size={12} />
              <span>{article.viewCount.toLocaleString()}</span>
            </div>
            {/* Likes Trigger button */}
            <button
              id={`like-btn-art-${article.id}`}
              onClick={handleLike}
              disabled={likeLoading}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-350 hover:text-[#d41c1c] group transition-colors cursor-pointer"
            >
              <Heart size={12} className="group-hover:scale-125 transition-transform text-slate-400 group-hover:text-[#d41c1c]" />
              <span>{likes.toLocaleString()}</span>
            </button>
          </div>

          <span className="text-xs font-bold text-slate-200 group flex items-center gap-1 hover:text-[#d41c1c]">
            Read Article
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  );
}
