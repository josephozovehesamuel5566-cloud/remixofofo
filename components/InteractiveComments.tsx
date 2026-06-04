'use client';

import React, { useState } from 'react';
import { MessageSquare, Heart, CornerDownRight, ThumbsUp, AlertTriangle, Send } from 'lucide-react';
import { Comment, CommentStatus } from '@/lib/db';
import { addCommentAction, likeCommentAction, moderateCommentAction } from '@/lib/actions';

interface InteractiveCommentsProps {
  articleId: string;
  initialComments: Comment[];
  isStaff: boolean;
}

export default function InteractiveComments({ articleId, initialComments, isStaff }: InteractiveCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const reloadComments = async () => {
    // Re-fetch locally from action
    try {
      const response = await fetch(`/api/comments?articleId=${articleId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to reload comments list:', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const txt = parentId ? replyText : newCommentText;
    if (!txt.trim() || loading) return;

    setLoading(true);
    try {
      const added = await addCommentAction({
        articleId,
        content: txt,
        parentId,
      });
      // Prepend or append locally to state for optimistic render
      setComments((prev) => [added, ...prev]);
      
      if (parentId) {
        setReplyText('');
        setReplyTarget(null);
      } else {
        setNewCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      const updatedLikes = await likeCommentAction(commentId);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likes: updatedLikes } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (commentId: string) => {
    try {
      // Toggle to reported locally, report matches RLS flag triggers
      await moderateCommentAction(commentId, 'Reported');
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: 'Reported' } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      await moderateCommentAction(commentId, 'Approved');
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: 'Approved' } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (commentId: string) => {
    try {
      await moderateCommentAction(commentId, 'Flagged');
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: 'Flagged' } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Group comments into map matching parent hierarchies
  const rootComments = comments.filter((c) => !c.parentId && c.status === 'Approved');
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  // Comments waiting for moderation, displayed in small ribbon if staff member compiles
  const reportedComments = comments.filter((c) => c.status === 'Reported');

  return (
    <div className="border border-white/10 bg-white/5 backdrop-blur-md p-5 md:p-8 rounded-2xl shadow-xl font-sans text-left text-white" id="comments-section-container">
      <h3 className="text-xl font-bold tracking-tight text-white mb-6 flex items-center gap-2">
        <MessageSquare size={18} className="text-[#d41c1c]" />
        Journal Threads ({comments.filter(c => c.status === 'Approved').length})
      </h3>

      {/* Staff Flagged / Moderation warning banner */}
      {isStaff && reportedComments.length > 0 && (
        <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/35 rounded-xl">
          <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1">
            <AlertTriangle size={13} className="text-purple-400" />
            Moderation Duty: {reportedComments.length} Flagged comments awaiting actions
          </h4>
          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
            {reportedComments.map((rc) => (
              <div key={rc.id} className="text-[11px] bg-white/5 p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-white">{rc.userName}</span>:{" "}
                  <span className="text-slate-300 line-clamp-1">{rc.content}</span>
                </div>
                <div className="flex gap-1.5 scroll-none">
                  <button
                    onClick={() => handleApprove(rc.id)}
                    className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 cursor-pointer text-[10px]"
                  >
                    Clear Match
                  </button>
                  <button
                    onClick={() => handleDismiss(rc.id)}
                    className="px-2 py-0.5 bg-[#d41c1c] text-white rounded font-bold hover:bg-[#b01717] cursor-pointer text-[10px]"
                  >
                    Censure Block
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Root Comment Form */}
      <form onSubmit={(e) => handlePostComment(e)} className="mb-8" id="add-root-comment-form">
        <div className="flex gap-3">
          <div className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center font-bold text-slate-300 text-xs">
            P
          </div>
          <div className="flex-1">
            <textarea
              required
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Contribute to the dialogue..."
              className="w-full text-xs p-3 border border-white/10 focus:border-[#d41c1c] focus:ring-1 focus:ring-[#d41c1c] rounded-xl bg-black/45 outline-none transition-all placeholder-slate-400 text-white"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#d41c1c] hover:bg-[#b01717] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                Publish Comment
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Render comment loops */}
      <div className="space-y-6" id="threads-loop-block">
        {rootComments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 font-mono">
            No dialogue yet. Be the first to share your perspectives under the criteria rules.
          </p>
        ) : (
          rootComments.map((comment) => (
            <div key={comment.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
              <div className="flex gap-3">
                <img
                  alt={comment.userName}
                  src={comment.userAvatar || `https://picsum.photos/seed/${comment.id}/100/100`}
                  className="h-10 w-10 rounded-full border border-white/15 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{comment.userName}</span>
                    <span className="text-[10px] text-slate-450 font-mono">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Actions under comment */}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 hover:text-[#d41c1c] cursor-pointer transition-colors"
                    >
                      <ThumbsUp size={11} />
                      <span>{comment.likes}</span>
                    </button>
                    <button
                      onClick={() => setReplyTarget(replyTarget === comment.id ? null : comment.id)}
                      className="text-[10px] font-bold text-slate-350 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => handleReport(comment.id)}
                      className="text-[10px] font-bold text-slate-500 hover:text-[#d41c1c] flex items-center gap-1 cursor-pointer ml-auto transition-colors"
                      title="Report comment"
                    >
                      Flag Story
                    </button>
                  </div>

                  {/* Reply Input block */}
                  {replyTarget === comment.id && (
                    <form onSubmit={(e) => handlePostComment(e, comment.id)} className="mt-4 bg-black/45 p-3 rounded-xl border border-white/10">
                      <textarea
                        required
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Replying to ${comment.userName}...`}
                        className="w-full text-xs p-2 border border-white/10 focus:border-[#d41c1c] bg-black/30 rounded-lg outline-none text-white placeholder-slate-500"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTarget(null);
                            setReplyText('');
                          }}
                          className="px-2.5 py-1 text-slate-400 hover:text-white text-[10px] font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-3 py-1 bg-[#d41c1c] text-white rounded-md text-[10px] font-bold cursor-pointer hover:bg-[#b01717]"
                        >
                          Send Reply
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Render replies */}
                  {repliesMap[comment.id] && repliesMap[comment.id].length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-white/10 space-y-4">
                      {repliesMap[comment.id]
                        .filter(reply => reply.status === 'Approved')
                        .map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <CornerDownRight size={14} className="text-[#d41c1c] mt-2 flex-shrink-0" />
                            <img
                              alt={reply.userName}
                              src={reply.userAvatar || `https://picsum.photos/seed/${reply.id}/100/100`}
                              className="h-7 w-7 rounded-full border border-white/5 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{reply.userName}</span>
                                <span className="text-[9px] text-slate-450 font-mono">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                {reply.content}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => handleLike(reply.id)}
                                  className="flex items-center gap-1 text-[9px] font-mono text-slate-450 hover:text-white cursor-pointer"
                                >
                                  <ThumbsUp size={10} />
                                  <span>{reply.likes}</span>
                                </button>
                                <button
                                  onClick={() => handleReport(reply.id)}
                                  className="text-[9px] text-slate-450 hover:text-[#d41c1c] cursor-pointer"
                                >
                                  Report
                                </button>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
