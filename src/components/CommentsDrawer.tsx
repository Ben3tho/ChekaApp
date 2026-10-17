import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, CornerDownRight, MessageSquare, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Comment, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  onRequireAuth?: () => void;
  onCommentCountChange?: (videoId: string, newCount: number) => void;
  language: Language;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  videoId,
  onRequireAuth,
  onCommentCountChange,
  language
}) => {
  const { user, authFetch } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Level-1 nested replies state: commentId -> Comment[]
  const [expandedReplies, setExpandedReplies] = useState<Record<string, Comment[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const quickEmojis = ['😂', '🤣', '💀', '🔥', '👏', '🙌', '💯', '😭'];

  // Load top-level comments whenever drawer opens or videoId changes
  useEffect(() => {
    if (!isOpen || !videoId) return;

    let isMounted = true;
    const fetchTopComments = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch(`/api/videos/${videoId}/comments?limit=20`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setComments(data.comments || []);
          setNextCursor(data.nextCursor || null);
          setHasMore(Boolean(data.hasMore));
          const count = Number(data.totalCount || data.total_count) || (data.comments ? data.comments.length : 0);
          setTotalCount(count);
          if (onCommentCountChange) {
            onCommentCountChange(videoId, count);
          }
        }
      } catch (err) {
        console.error('Failed to load comments from PostgreSQL:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    setComments([]);
    setExpandedReplies({});
    setReplyingTo(null);
    setCommentText('');
    fetchTopComments();

    return () => {
      isMounted = false;
    };
  }, [isOpen, videoId]);

  if (!isOpen) return null;

  // Load more top-level comments (Cursor pagination of 20)
  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await authFetch(`/api/videos/${videoId}/comments?cursor=${encodeURIComponent(nextCursor)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, ...(data.comments || [])]);
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (err) {
      console.error('Failed to load more comments:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Toggle or fetch Level 1 nested replies for a comment
  const handleToggleReplies = async (comment: Comment) => {
    if (expandedReplies[comment.id]) {
      // Toggle hide
      setExpandedReplies(prev => {
        const copy = { ...prev };
        delete copy[comment.id];
        return copy;
      });
      return;
    }

    setLoadingReplies(prev => ({ ...prev, [comment.id]: true }));
    try {
      const res = await authFetch(`/api/videos/${videoId}/comments?parentId=${comment.id}`);
      if (res.ok) {
        const data = await res.json();
        setExpandedReplies(prev => ({
          ...prev,
          [comment.id]: data.comments || []
        }));
      }
    } catch (err) {
      console.error('Failed to load comment replies:', err);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [comment.id]: false }));
    }
  };

  const handleStartReply = (comment: Comment) => {
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    // Level 1: If replying to a reply, attach to its parent
    setReplyingTo(comment);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    const cleanText = commentText.trim();
    const parent = replyingTo;
    setIsSubmitting(true);

    // Optimistic UI representation
    const tempId = 'temp_' + Date.now();
    const optimisticComment: Comment = {
      id: tempId,
      videoId,
      parentId: parent ? parent.id : null,
      user: {
        id: user.id,
        name: `@${user.username}`,
        username: user.username,
        avatar: user.avatarUrl || '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg',
      },
      text: cleanText,
      timestamp: language === 'sw' ? 'Sasa hivi' : 'Just now',
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      repliesCount: 0,
    };

    if (parent) {
      // Add to expandedReplies for parent
      setExpandedReplies(prev => ({
        ...prev,
        [parent.id]: [...(prev[parent.id] || []), optimisticComment]
      }));
      // Increment parent's repliesCount in top-level list
      setComments(prev =>
        prev.map(c => (c.id === parent.id ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c))
      );
    } else {
      // Add to top-level comments
      setComments(prev => [optimisticComment, ...prev]);
    }

    const nextCount = totalCount + 1;
    setTotalCount(nextCount);
    if (onCommentCountChange) {
      onCommentCountChange(videoId, nextCount);
    }

    setCommentText('');
    setReplyingTo(null);
    memeAudio.playBoing();

    try {
      const res = await authFetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          parent_id: parent ? parent.id : null,
        }),
      });

      if (res.ok) {
        const savedComment = await res.json();
        // Replace tempId with real PostgreSQL ID
        if (parent) {
          setExpandedReplies(prev => ({
            ...prev,
            [parent.id]: (prev[parent.id] || []).map(r => (r.id === tempId ? { ...r, id: savedComment.id } : r))
          }));
        } else {
          setComments(prev => prev.map(c => (c.id === tempId ? { ...c, id: savedComment.id } : c)));
        }
      }
    } catch (err) {
      console.error('Failed to post comment to PostgreSQL:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer content */}
      <div className="relative w-full max-w-lg rounded-t-3xl bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl flex flex-col max-h-[80vh] h-[580px] z-10">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-neutral-100 text-sm">
              {language === 'sw' ? 'Maoni ya Watazamaji' : 'Viewer Comments'}
            </h3>
            <span className="text-xs text-neutral-400 font-mono tabular-nums px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700">
              {totalCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            aria-label="Close comments"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 no-scrollbar">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">{language === 'sw' ? 'Inapakia maoni kutoka PostgreSQL...' : 'Loading comments from DB...'}</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-sm space-y-2">
              <p className="text-3xl">💬</p>
              <p>{language === 'sw' ? 'Hakuna maoni bado. Kuwa wa kwanza kutoa kicheko!' : 'No comments yet. Be the first to comment!'}</p>
            </div>
          ) : (
            <>
              {comments.map(c => {
                const hasReplies = (c.repliesCount || 0) > 0;
                const isExpanded = Boolean(expandedReplies[c.id]);
                const repliesList = expandedReplies[c.id] || [];
                const isLoadingRep = Boolean(loadingReplies[c.id]);

                return (
                  <div key={c.id} className="space-y-2 border-b border-neutral-800/50 pb-3 last:border-b-0">
                    {/* Top-Level Comment */}
                    <div className="flex items-start justify-between gap-3 group">
                      <div className="flex items-start gap-3 flex-1">
                        <img
                          src={c.user.avatar || '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg'}
                          alt={c.user.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-700"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-200">
                              {c.user.name}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {c.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 mt-1 leading-relaxed break-words">
                            {c.text}
                          </p>

                          {/* Action Row: Reply button & View nested replies */}
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-neutral-400 font-semibold">
                            <button
                              onClick={() => handleStartReply(c)}
                              className="hover:text-amber-400 flex items-center gap-1 transition-colors"
                            >
                              <CornerDownRight className="w-3 h-3" />
                              <span>{language === 'sw' ? 'Jibu' : 'Reply'}</span>
                            </button>

                            {/* Level-1 Nested Replies Toggle */}
                            {(hasReplies || isExpanded) && (
                              <button
                                onClick={() => handleToggleReplies(c)}
                                className="hover:text-amber-400 flex items-center gap-1 transition-colors text-amber-500/90 font-medium"
                              >
                                {isLoadingRep ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                                <span>
                                  {isExpanded
                                    ? (language === 'sw' ? 'Ficha majibu' : 'Hide replies')
                                    : (language === 'sw'
                                        ? `Tazama majibu (${c.repliesCount})`
                                        : `View replies (${c.repliesCount})`)}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Level-1 Nested Replies Area */}
                    {isExpanded && (
                      <div className="pl-10 space-y-2 border-l-2 border-amber-500/30 ml-4 pt-2">
                        {repliesList.length === 0 && !isLoadingRep && (
                          <div className="text-[11px] text-neutral-500 italic py-1">
                            {language === 'sw' ? 'Hakuna majibu bado.' : 'No replies yet.'}
                          </div>
                        )}

                        {repliesList.map(r => (
                          <div key={r.id} className="flex items-start gap-2.5 pt-1">
                            <img
                              src={r.user.avatar || '/src/assets/images/swahili_comedian_avatar_1792057038016.jpg'}
                              alt={r.user.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0 border border-neutral-700"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-neutral-300">
                                  {r.user.name}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  {r.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-300 mt-0.5 break-words">
                                {r.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Cursor Pagination Button */}
              {hasMore && (
                <div className="pt-2 pb-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-4 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                        <span>{language === 'sw' ? 'Inapakia zaidi...' : 'Loading more...'}</span>
                      </span>
                    ) : (
                      <span>{language === 'sw' ? 'Pakia maoni 20 zaidi' : 'Load 20 more comments'}</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Replying Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 animate-fade-in">
            <span className="flex items-center gap-1">
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>
                {language === 'sw' ? 'Unamjibu' : 'Replying to'}{' '}
                <strong>{replyingTo.user.name}</strong>
              </span>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:text-white text-neutral-400 transition-colors"
              title="Futa / Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Emoji Bar */}
        <div className="flex items-center justify-between gap-1 py-2 border-t border-neutral-800/80 px-1">
          {quickEmojis.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="text-base p-1.5 hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={
              !user
                ? language === 'sw'
                  ? 'Ingia ili uweze kutoa maoni...'
                  : 'Sign in to comment...'
                : replyingTo
                ? language === 'sw'
                  ? `Jibu kwa ${replyingTo.user.name}...`
                  : `Reply to ${replyingTo.user.name}...`
                : language === 'sw'
                ? 'Weka maoni au kicheko chako...'
                : 'Add your comment or laugh...'
            }
            className="flex-1 bg-neutral-800 text-neutral-100 placeholder-neutral-500 text-xs rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-amber-500 border border-neutral-700"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="p-2.5 rounded-full bg-amber-500 text-neutral-950 font-semibold disabled:opacity-40 disabled:hover:bg-amber-500 hover:bg-amber-400 transition-colors shrink-0"
            aria-label="Send comment"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
