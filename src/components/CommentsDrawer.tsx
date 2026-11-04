import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  CornerDownRight,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Music,
  Play,
  Volume2,
  Sparkles,
  Smile
} from 'lucide-react';
import { Comment, Language } from '../types';
import { memeAudio, MEME_SOUND_REACTIONS, SoundReaction } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  onRequireAuth?: () => void;
  onCommentCountChange?: (videoId: string, newCount: number) => void;
  language: Language;
}

// Helper to parse sound tag out of comment text
function parseCommentContent(rawText: string): { soundReaction?: SoundReaction; displayText: string } {
  if (!rawText) return { displayText: '' };
  const match = rawText.match(/^\[sound:([a-zA-Z0-9_]+)\]\s*(.*)$/s);
  if (match) {
    const soundKey = match[1];
    const displayText = match[2].trim();
    const soundReaction = MEME_SOUND_REACTIONS.find(s => s.soundKey === soundKey || s.id === soundKey);
    return { soundReaction, displayText };
  }
  return { displayText: rawText };
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

  // Sound Reaction picker & currently playing sound state
  const [showSoundPicker, setShowSoundPicker] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<SoundReaction | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [filterOnlySounds, setFilterOnlySounds] = useState<boolean>(false);

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
        const res = await authFetch(`/api/videos/${videoId}/comments?limit=25`);
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
    setSelectedSound(null);
    setShowSoundPicker(false);
    fetchTopComments();

    return () => {
      isMounted = false;
    };
  }, [isOpen, videoId]);

  if (!isOpen) return null;

  // Play sound effect with animation feedback
  const handlePlaySound = (soundKey: string, commentId: string) => {
    setCurrentlyPlayingId(commentId);
    memeAudio.playSoundByKey(soundKey);
    setTimeout(() => {
      setCurrentlyPlayingId(prev => (prev === commentId ? null : prev));
    }, 1200);
  };

  // Preview sound in picker
  const handlePreviewSound = (sound: SoundReaction) => {
    memeAudio.playSoundByKey(sound.soundKey);
    if (selectedSound?.id === sound.id) {
      setSelectedSound(null);
    } else {
      setSelectedSound(sound);
    }
  };

  // Load more top-level comments (Cursor pagination)
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
    setReplyingTo(comment);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = commentText.trim().length > 0;
    const hasSound = Boolean(selectedSound);

    if ((!hasText && !hasSound) || isSubmitting) return;

    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    // Embed sound reaction tag into the text payload: [sound:soundKey] text
    const textToSend = selectedSound
      ? `[sound:${selectedSound.soundKey}] ${commentText.trim() || selectedSound.emoji + ' ' + selectedSound.nameSw}`
      : commentText.trim();

    const parent = replyingTo;
    setIsSubmitting(true);

    // Optimistic comment
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
      text: textToSend,
      soundEffect: selectedSound?.soundKey,
      timestamp: language === 'sw' ? 'Sasa hivi' : 'Just now',
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      repliesCount: 0,
    };

    if (parent) {
      setExpandedReplies(prev => ({
        ...prev,
        [parent.id]: [...(prev[parent.id] || []), optimisticComment]
      }));
      setComments(prev =>
        prev.map(c => (c.id === parent.id ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c))
      );
    } else {
      setComments(prev => [optimisticComment, ...prev]);
    }

    const nextCount = totalCount + 1;
    setTotalCount(nextCount);
    if (onCommentCountChange) {
      onCommentCountChange(videoId, nextCount);
    }

    // Play cheerful confirmation
    if (selectedSound) {
      memeAudio.playSoundByKey(selectedSound.soundKey);
    } else {
      memeAudio.playBoing();
    }

    // Generate in-app notification
    try {
      const cleanText = textToSend.replace(/\[sound:[^\]]+\]/, '').trim();
      const notifItem = {
        id: `notif_comment_${Date.now()}`,
        type: 'comment' as const,
        title: language === 'sw' ? '💬 Maoni Yamechapishwa!' : '💬 Comment Posted!',
        body: language === 'sw'
          ? `Umetoa maoni: "${cleanText.slice(0, 50)}"`
          : `You commented: "${cleanText.slice(0, 50)}"`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      const stored = localStorage.getItem('cheka_notifications');
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem('cheka_notifications', JSON.stringify([notifItem, ...(Array.isArray(list) ? list : [])]));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cheka_new_notification', { detail: notifItem }));
      }
    } catch (_) {}

    setCommentText('');
    setSelectedSound(null);
    setShowSoundPicker(false);
    setReplyingTo(null);

    try {
      const res = await authFetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          parent_id: parent ? parent.id : null,
        }),
      });

      if (res.ok) {
        const savedComment = await res.json();
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

  const displayedComments = filterOnlySounds
    ? comments.filter(c => c.text.includes('[sound:') || c.soundEffect)
    : comments;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer content */}
      <div className="relative w-full max-w-lg rounded-t-3xl bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl flex flex-col max-h-[85vh] h-[600px] z-10">
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

            {/* Quick sound reaction filter */}
            <button
              onClick={() => {
                setFilterOnlySounds(!filterOnlySounds);
                memeAudio.playBoing();
              }}
              className={`flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all border ${
                filterOnlySounds
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                  : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <Music className="w-2.5 h-2.5" />
              <span>{language === 'sw' ? 'Sauti Tu 🎵' : 'Sounds 🎵'}</span>
            </button>
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
              <span className="text-xs">
                {language === 'sw' ? 'Inapakia maoni kutoka PostgreSQL...' : 'Loading comments from DB...'}
              </span>
            </div>
          ) : displayedComments.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-sm space-y-2">
              <p className="text-3xl">{filterOnlySounds ? '🎵' : '💬'}</p>
              <p>
                {filterOnlySounds
                  ? language === 'sw'
                    ? 'Hakuna maoni yenye sauti fupi bado. Kuwa wa kwanza kutuma kicheko!'
                    : 'No sound reactions yet. Be the first to send a soundbite!'
                  : language === 'sw'
                  ? 'Hakuna maoni bado. Kuwa wa kwanza kutoa kicheko!'
                  : 'No comments yet. Be the first to comment!'}
              </p>
            </div>
          ) : (
            <>
              {displayedComments.map(c => {
                const { soundReaction, displayText } = parseCommentContent(c.text);
                const hasReplies = (c.repliesCount || 0) > 0;
                const isExpanded = Boolean(expandedReplies[c.id]);
                const repliesList = expandedReplies[c.id] || [];
                const isLoadingRep = Boolean(loadingReplies[c.id]);
                const isThisPlaying = currentlyPlayingId === c.id;

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

                          {/* Sound Reaction Audio Badge */}
                          {soundReaction && (
                            <div className="mt-1 mb-1.5 flex items-center gap-2">
                              <button
                                onClick={() => handlePlaySound(soundReaction.soundKey, c.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs transition-all active:scale-95 ${soundReaction.badgeColor} ${
                                  isThisPlaying ? 'ring-2 ring-amber-400 scale-105' : 'hover:brightness-125'
                                }`}
                              >
                                {isThisPlaying ? (
                                  <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                                ) : (
                                  <Play className="w-3 h-3 fill-current" />
                                )}
                                <span>{soundReaction.emoji}</span>
                                <span>{language === 'sw' ? soundReaction.nameSw : soundReaction.name}</span>
                                {isThisPlaying && (
                                  <span className="flex items-center gap-0.5 ml-1">
                                    <span className="w-1 h-2.5 bg-amber-400 animate-pulse rounded-full" />
                                    <span className="w-1 h-3.5 bg-amber-300 animate-pulse rounded-full" />
                                    <span className="w-1 h-2 bg-amber-400 animate-pulse rounded-full" />
                                  </span>
                                )}
                              </button>
                            </div>
                          )}

                          {displayText && (
                            <p className="text-xs text-neutral-300 mt-1 leading-relaxed break-words">
                              {displayText}
                            </p>
                          )}

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
                                    ? language === 'sw'
                                      ? 'Ficha majibu'
                                      : 'Hide replies'
                                    : language === 'sw'
                                    ? `Tazama majibu (${c.repliesCount})`
                                    : `View replies (${c.repliesCount})`}
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

                        {repliesList.map(r => {
                          const replyParsed = parseCommentContent(r.text);
                          const isRepPlaying = currentlyPlayingId === r.id;
                          return (
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

                                {replyParsed.soundReaction && (
                                  <div className="mt-1 mb-1">
                                    <button
                                      onClick={() => handlePlaySound(replyParsed.soundReaction!.soundKey, r.id)}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs transition-all ${
                                        replyParsed.soundReaction.badgeColor
                                      } ${isRepPlaying ? 'ring-2 ring-amber-400' : 'hover:brightness-125'}`}
                                    >
                                      <Play className="w-2.5 h-2.5 fill-current" />
                                      <span>{replyParsed.soundReaction.emoji}</span>
                                      <span>{language === 'sw' ? replyParsed.soundReaction.nameSw : replyParsed.soundReaction.name}</span>
                                    </button>
                                  </div>
                                )}

                                {replyParsed.displayText && (
                                  <p className="text-xs text-neutral-300 mt-0.5 break-words">
                                    {replyParsed.displayText}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
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

        {/* Selected Sound Attachment Tag */}
        {selectedSound && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 bg-neutral-950 border border-amber-500/40 rounded-xl text-xs text-amber-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-bold">{selectedSound.emoji} {language === 'sw' ? selectedSound.nameSw : selectedSound.name}</span>
              <span className="text-[10px] text-neutral-400">({language === 'sw' ? 'Imeambatanishwa' : 'Attached'})</span>
            </div>
            <button
              onClick={() => setSelectedSound(null)}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title="Ondoa sauti"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Sound Reaction Picker Drawer (8 Comedy Soundbites) */}
        {showSoundPicker && (
          <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-2xl mb-2 animate-fade-in space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {language === 'sw' ? 'Chagua Sauti Fupi ya Kichekesho:' : 'Choose Comedy Soundbite:'}
              </span>
              <button
                onClick={() => setShowSoundPicker(false)}
                className="text-[11px] text-neutral-400 hover:text-white"
              >
                {language === 'sw' ? 'Funga' : 'Close'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {MEME_SOUND_REACTIONS.map(reaction => {
                const isSelected = selectedSound?.id === reaction.id;
                return (
                  <button
                    key={reaction.id}
                    type="button"
                    onClick={() => handlePreviewSound(reaction)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm font-bold'
                        : `${reaction.badgeColor} hover:brightness-125`
                    }`}
                  >
                    <Play className="w-2.5 h-2.5 shrink-0 fill-current" />
                    <span className="truncate">{reaction.emoji} {language === 'sw' ? reaction.nameSw : reaction.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Emoji Bar & Sound Effects Toggle */}
        <div className="flex items-center justify-between gap-1 py-1.5 border-t border-neutral-800/80 px-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {quickEmojis.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-base p-1 hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Sound Reaction Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowSoundPicker(!showSoundPicker);
              memeAudio.playBoing();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border shrink-0 ${
              showSoundPicker || selectedSound
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                : 'bg-neutral-800 hover:bg-neutral-750 text-amber-400 border-neutral-700'
            }`}
          >
            <Music className="w-3 h-3" />
            <span>{language === 'sw' ? 'Sauti 🎵' : 'Sounds 🎵'}</span>
          </button>
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1.5">
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
                : selectedSound
                ? language === 'sw'
                  ? `Sauti: ${selectedSound.nameSw} (ongeza maneno au tuma)...`
                  : `Sound: ${selectedSound.name} (add text or send)...`
                : replyingTo
                ? language === 'sw'
                  ? `Jibu kwa ${replyingTo.user.name}...`
                  : `Reply to ${replyingTo.user.name}...`
                : language === 'sw'
                ? 'Weka maoni au chagua sauti ya kichekesho 🎵...'
                : 'Add comment or pick a comedy soundbite 🎵...'
            }
            className="flex-1 bg-neutral-800 text-neutral-100 placeholder-neutral-500 text-xs rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-amber-500 border border-neutral-700"
          />
          <button
            type="submit"
            disabled={(!commentText.trim() && !selectedSound) || isSubmitting}
            className="p-2.5 rounded-full bg-amber-500 text-neutral-950 font-semibold disabled:opacity-40 disabled:hover:bg-amber-500 hover:bg-amber-400 transition-colors shrink-0 shadow-md"
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
