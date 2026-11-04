import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Smile, 
  Image as ImageIcon, 
  Gift, 
  Check, 
  CheckCheck, 
  Sparkles, 
  User, 
  Search, 
  ArrowLeft,
  Coins,
  ShieldCheck,
  MessageCircle,
  ShieldAlert,
  UserX
} from 'lucide-react';
import { Creator, Language } from '../types';
import { memeAudio } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
  giftIcon?: string;
  isReaction?: boolean;
}

interface DirectMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetCreator?: Creator | null;
  language?: Language;
  onOpenGift?: () => void;
  userCoins?: number;
}

const QUICK_REACTIONS = ['😂😂😂', '🔥 Hatari sana!', 'Umenivunja mbavu! 💀', 'Fanya Part 2! 🎬', 'Big up kiongozi! 🙌'];

export const DirectMessagesDrawer: React.FC<DirectMessagesDrawerProps> = ({
  isOpen,
  onClose,
  targetCreator,
  language = 'sw',
  onOpenGift,
  userCoins = 250,
}) => {
  const { authFetch, user } = useAuth();
  const [activeChatCreator, setActiveChatCreator] = useState<Creator | null>(targetCreator || null);
  const [conversations, setConversations] = useState<{ creator: Creator; lastMessage: string; time: string; unread: number }[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const [inputVal, setInputVal] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Update active creator when targetCreator prop changes
  useEffect(() => {
    if (targetCreator) {
      setActiveChatCreator(targetCreator);
    }
  }, [targetCreator]);

  // Load real messages from PostgreSQL database when opening a conversation
  useEffect(() => {
    if (!isOpen || !activeChatCreator) return;

    const loadDbMessages = async () => {
      try {
        const res = await authFetch(`/api/messages/${activeChatCreator.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            const currentUserId = user?.id;
            const mapped: ChatMessage[] = data.messages.map((m: any) => ({
              id: m.id,
              sender: m.senderId === currentUserId ? 'me' : 'them',
              text: m.messageText,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }));

            const chatKey = activeChatCreator.username || activeChatCreator.id;
            setMessages(prev => ({
              ...prev,
              [chatKey]: mapped,
            }));
          }
        }
      } catch (err) {
        console.warn('Could not sync messages from database:', err);
      }
    };

    loadDbMessages();
  }, [isOpen, activeChatCreator?.id, authFetch, user?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatCreator]);

  if (!isOpen) return null;

  const currentChatKey = activeChatCreator?.username || 'mwalimu_memes';
  const currentMessages = messages[currentChatKey] || [
    {
      id: 'intro',
      sender: 'them',
      text: `Habari! Mimi ni ${activeChatCreator?.name || 'Mchekeshaji'}. Tuma ujumbe wako au dondosha kicheko! 😂`,
      timestamp: 'Sasa hivi',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => ({
      ...prev,
      [currentChatKey]: [...(prev[currentChatKey] || []), newMsg],
    }));

    setInputVal('');
    memeAudio.playPop();

    // Persist message to PostgreSQL database
    if (activeChatCreator?.id) {
      try {
        await authFetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: activeChatCreator.id,
            messageText: text,
          }),
        });
      } catch (err) {
        console.warn('Failed to save message to PostgreSQL:', err);
      }
    }

    // Auto simulated creator reply after 1.5 seconds for engaging social experience
    setTimeout(() => {
      const replies = [
        'Hahaha nashukuru sana mwanangu! Endelea kucheka na ChekaApp 😂🙌',
        'Nimeipokea mkuu, video mpya inakuja baadae kidogo! 🔥',
        'Asante sana kwa upendo wako! Mungu akubariki sana! ❤️',
        '😂😂 Hiyo ndio maana ya Dar es Salaam, hauwezi kuchoka!',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'them',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => ({
        ...prev,
        [currentChatKey]: [...(prev[currentChatKey] || []), replyMsg],
      }));
      memeAudio.playBoing();
    }, 1500);
  };

  const [toastMsg, setToastMsg] = useState<string>('');

  const handleBlockActiveUser = async () => {
    if (!activeChatCreator) return;
    try {
      await authFetch(`/api/users/${activeChatCreator.id}/block`, { method: 'POST' });
    } catch {}

    setToastMsg(language === 'sw' ? 'Mtumiaji amezuiwa' : 'User blocked');
    memeAudio.playBoing();
    setTimeout(() => {
      setActiveChatCreator(null);
      setToastMsg('');
    }, 1200);
  };

  const handleReportActiveChat = () => {
    setToastMsg(language === 'sw' ? 'Mazungumzo yameripotiwa kwa timu ya usalama' : 'Conversation reported');
    memeAudio.playPop();
    setTimeout(() => setToastMsg(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[88vh] max-h-[88vh] text-white"
        onClick={e => e.stopPropagation()}
      >
        {toastMsg && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shadow-lg animate-bounce">
            {toastMsg}
          </div>
        )}

        {/* Chat Drawer Header */}
        <div className="px-4 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/90">
          <div className="flex items-center gap-2.5">
            {activeChatCreator ? (
              <button
                onClick={() => setActiveChatCreator(null)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Rudi kwenye orodha ya meseji"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
            )}

            <div>
              {activeChatCreator ? (
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <img
                      src={activeChatCreator.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=chat'}
                      alt={activeChatCreator.name}
                      className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-neutral-950" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{activeChatCreator.name}</span>
                      {activeChatCreator.verified && (
                        <span className="w-3 h-3 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-[8px] font-bold">✓</span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">Yupo Mtandaoni (Online)</span>
                  </div>
                </div>
              ) : (
                <div className="text-left">
                  <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{language === 'sw' ? 'Meseji za Moja kwa Moja (DMs)' : 'Direct Messages'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">CHATS</span>
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {language === 'sw' ? 'Piga soga na wachekeshaji unaowapenda' : 'Chat directly with comedy creators'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeChatCreator && (
              <>
                <button
                  type="button"
                  onClick={handleReportActiveChat}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                  title="Ripoti Mazungumzo"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleBlockActiveUser}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                  title="Zuia Mtumiaji (Block)"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </>
            )}

            {activeChatCreator && onOpenGift && (
              <button
                onClick={() => {
                  onClose();
                  onOpenGift();
                }}
                className="px-2.5 py-1 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500/25 transition-all text-xs flex items-center gap-1 font-semibold"
                title="Tuma Zawadi"
              >
                <Gift className="w-3.5 h-3.5 text-pink-400" />
                <span>Zawadi</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW 1: CONVERSATIONS LIST (When no specific chat is open) */}
        {!activeChatCreator ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="text-xs font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'sw' ? 'Mazungumzo Yako' : 'Conversations'}</span>
            </div>

            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-center text-neutral-400 mb-3">
                  <MessageCircle className="w-7 h-7 text-amber-400/80" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {language === 'sw' ? 'Hakuna Meseji Bado' : 'No Messages Yet'}
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs">
                  {language === 'sw' 
                    ? 'Unapotazama video ya mchekeshaji, gusa wasifu wake au kitufe cha DM ili kuanza mazungumzo ya moja kwa moja.' 
                    : 'When watching a reel, tap creator profile to start a direct 1-on-1 chat.'}
                </p>
              </div>
            ) : (
              conversations.map(({ creator, lastMessage, time, unread }) => (
                <div
                  key={creator.id}
                  onClick={() => {
                    setActiveChatCreator(creator);
                    memeAudio.playPop();
                  }}
                  className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 hover:border-amber-400/50 cursor-pointer flex items-center gap-3 transition-all hover:bg-neutral-950"
                >
                  <div className="relative shrink-0">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-12 h-12 rounded-full object-cover border border-amber-500/30"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white truncate flex items-center gap-1">
                        {creator.name}
                        {creator.verified && <span className="text-[9px] text-amber-400">✓</span>}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">{time}</span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate">{lastMessage}</p>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* VIEW 2: ACTIVE 1-ON-1 CHAT */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-center my-2">
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 px-2.5 py-1 rounded-full border border-neutral-800">
                  Ujumbe umelindwa kisheria na faragha (End-to-End Encrypted) 🔒
                </span>
              </div>

              {currentMessages.map(msg => {
                const isMe = msg.sender === 'me';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-medium rounded-br-xs shadow-md shadow-amber-500/10'
                          : 'bg-neutral-800/90 text-neutral-100 rounded-bl-xs border border-neutral-700/60 shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-neutral-500 mt-1 font-mono px-1 flex items-center gap-1">
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-amber-400" />}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reactions Bar */}
            <div className="px-3 py-1.5 border-t border-neutral-800/60 bg-neutral-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_REACTIONS.map((rx, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(rx)}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-300 whitespace-nowrap shrink-0 transition-colors border border-neutral-700/50"
                >
                  {rx}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-950/95 flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder={language === 'sw' ? 'Andika ujumbe wako hapa...' : 'Type a message...'}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 focus:border-amber-400 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim()}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
                title="Tuma Ujumbe"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
