import React, { useState, useEffect, useRef } from 'react';
import { Send, Edit, Search, ArrowLeft, ImageIcon, Smile, Mic, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getConversations, getMessages, sendMessage, startConversation } from '../api/messages';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import TimeAgo from '../components/common/TimeAgo';
import type { Conversation, Message } from '../types';

const EMOJI_LIST = ['😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥','🎉','🙏','💯','✨','😊','🤣','😭','😏','😤','🥳','😴','🤗','💪','🎶','🌸','🍕','⭐','🚀'];

function getBestAudioMime(): string {
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false); // mobile: show chat panel
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [windowW, setWindowW] = useState(window.innerWidth);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const didInit = useRef(false);
  const selectedRef = useRef<Conversation | null>(null);

  useEffect(() => {
    const onResize = () => setWindowW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isDesktop = windowW >= 768;

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const loadMessages = async (conv: Conversation) => {
    setSelected(conv);
    setShowChat(true);
    setMsgLoading(true);
    try {
      const msgs = await getMessages(conv._id);
      setMessages(msgs);
    } catch {}
    finally { setMsgLoading(false); }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setLoading(true);
    getConversations()
      .then(async (convs) => {
        setConversations(convs);
        const targetUserId = (location.state as any)?.userId;
        if (targetUserId) {
          const existing = convs.find(c => c.participants.some(p => p._id === targetUserId));
          if (existing) {
            loadMessages(existing);
          } else {
            try {
              const newConv = await startConversation(targetUserId);
              setConversations(prev => [newConv, ...prev]);
              loadMessages(newConv);
            } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const doSend = async (content: string, file?: File | null, voiceBlob?: Blob, voiceMime?: string) => {
    const conv = selectedRef.current;
    if (!conv) return;
    const optimisticId = `opt_${Date.now()}`;
    const optimistic: Message = {
      _id: optimisticId,
      sender: user!,
      content: content || (voiceBlob ? '🎤 Voice' : ''),
      media: file ? URL.createObjectURL(file) : undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const fd = new FormData();
      fd.append('content', content.trim() || (voiceBlob ? '🎤 Voice message' : '📷'));
      if (file) fd.append('media', file);
      if (voiceBlob) {
        const ext = (voiceMime ?? '').includes('mp4') ? 'mp4' : (voiceMime ?? '').includes('ogg') ? 'ogg' : 'webm';
        const audioFile = new File([voiceBlob], `voice_${Date.now()}.${ext}`, { type: voiceMime ?? 'audio/webm' });
        fd.append('media', audioFile);
      }
      const msg = await sendMessage(conv._id, fd);
      setMessages(prev => prev.map(m => m._id === optimisticId ? msg : m));
      setConversations(cs => cs.map(c => c._id === conv._id ? { ...c, lastMessage: msg } : c));
    } catch (err) {
      console.error('[Messages] send error:', err);
      // keep optimistic
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !mediaFile) || !selected || sending) return;
    setSending(true);
    const t = text;
    const f = mediaFile;
    setText('');
    setMediaFile(null);
    setMediaPreview(null);
    setShowEmoji(false);
    await doSend(t, f);
    setSending(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getBestAudioMime();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 100) await doSend('', null, blob, mimeType);
      };
      recorder.start(100);
      setRecording(true);
      setRecordingSecs(0);
      recordingTimer.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      alert('Mikrofonga ruxsat bering');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setRecording(false);
    setRecordingSecs(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    audioChunksRef.current = [];
    setRecording(false);
    setRecordingSecs(0);
  };

  const getOtherUser = (conv: Conversation) => conv.participants.find(p => p._id !== user?._id);
  const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Visibility logic:
  // Desktop (≥768px): always show BOTH panels
  // Mobile: show only conv list OR only chat panel
  const showConvList = isDesktop || !showChat;
  const showChatPanel = isDesktop || showChat;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Conversations panel */}
      {showConvList && (
        <div style={{ display: 'flex', flexDirection: 'column', width: isDesktop ? 380 : '100%', minWidth: 0, flexShrink: 0, borderRight: '1px solid #262626' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #262626' }}>
            <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>{user?.username}</h1>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
              <Edit size={22} />
            </button>
          </div>

          <div style={{ padding: '10px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#737373' }} />
              <input placeholder="Search" style={{ width: '100%', backgroundColor: '#262626', border: 'none', borderRadius: 12, paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px' }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Messages</span>
            <button style={{ color: '#737373', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>Requests</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
            ) : conversations.length === 0 ? (
              <p style={{ color: '#737373', fontSize: 14, textAlign: 'center', padding: 32 }}>No conversations yet</p>
            ) : (
              conversations.map(conv => {
                const other = getOtherUser(conv);
                if (!other) return null;
                const isActive = selected?._id === conv._id;
                return (
                  <button
                    key={conv._id}
                    onClick={() => loadMessages(conv)}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#0a0a0a'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: isActive ? '#111' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0 }}
                  >
                    <div style={{ flexShrink: 0 }}><Avatar src={other.avatar} alt={other.username} size="md" /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.username}</p>
                      <p style={{ color: '#737373', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.lastMessage?.content || 'Start a conversation'}
                      </p>
                    </div>
                    {conv.lastMessage && <div style={{ flexShrink: 0 }}><TimeAgo date={conv.lastMessage.createdAt} /></div>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Chat panel */}
      {showChatPanel && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={32} color="#fff" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>Your messages</h2>
                <p style={{ color: '#737373', fontSize: 14, margin: 0 }}>Send private photos and messages to a friend or group.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #262626', flexShrink: 0 }}>
                {!isDesktop && (
                  <button
                    onClick={() => { setShowChat(false); setSelected(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', marginRight: 4 }}
                  >
                    <ArrowLeft size={22} />
                  </button>
                )}
                <Avatar src={getOtherUser(selected)?.avatar} alt={getOtherUser(selected)?.username} size="sm" />
                <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0, flex: 1 }}>{getOtherUser(selected)?.username}</p>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msgLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender._id === user?._id;
                    const isVoice = msg.media && (
                      msg.media.includes('.webm') || msg.media.includes('.mp4') ||
                      msg.media.includes('.ogg') || msg.media.includes('.m4a') ||
                      msg.content === '🎤 Voice message'
                    );
                    return (
                      <div key={msg._id || msg.createdAt} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                        {!isMe && <Avatar src={msg.sender.avatar} alt={msg.sender.username ?? ''} size="xs" />}
                        <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          {msg.media && !isVoice && (
                            <img src={msg.media} alt="media" style={{ maxWidth: 220, borderRadius: 16, display: 'block' }} />
                          )}
                          {msg.media && isVoice && (
                            <div style={{ backgroundColor: isMe ? '#3797f0' : '#262626', borderRadius: 22, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Mic size={16} color="#fff" />
                              </div>
                              <audio controls src={msg.media} style={{ height: 30, minWidth: 160 }} />
                            </div>
                          )}
                          {msg.content && msg.content !== '🎤 Voice message' && (
                            <div style={{ padding: '10px 16px', borderRadius: 22, fontSize: 14, backgroundColor: isMe ? '#3797f0' : '#262626', color: '#fff', wordBreak: 'break-word', lineHeight: 1.4 }}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Media preview */}
              {mediaPreview && (
                <div style={{ padding: '8px 16px', borderTop: '1px solid #262626', flexShrink: 0 }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={mediaPreview} alt="preview" style={{ height: 80, borderRadius: 8, objectFit: 'cover' }} />
                    <button onClick={() => { setMediaPreview(null); setMediaFile(null); }} style={{ position: 'absolute', top: -6, right: -6, background: '#000', border: '1px solid #333', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              )}

              {/* Emoji panel */}
              {showEmoji && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #262626', backgroundColor: '#0a0a0a', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {EMOJI_LIST.map(e => (
                      <button
                        key={e}
                        onClick={() => handleEmojiClick(e)}
                        onMouseEnter={el => (el.currentTarget.style.backgroundColor = '#262626')}
                        onMouseLeave={el => (el.currentTarget.style.backgroundColor = 'transparent')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: '2px 4px', borderRadius: 6, lineHeight: 1 }}
                      >{e}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recording */}
              {recording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid #262626', backgroundColor: '#0a0a0a', flexShrink: 0 }}>
                  <button onClick={cancelRecording} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex' }}>
                    <X size={22} />
                  </button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <span style={{ color: '#fff', fontSize: 14 }}>Recording {fmtSecs(recordingSecs)}</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    style={{ backgroundColor: '#ef4444', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}

              {/* Input */}
              {!recording && (
                <form
                  onSubmit={handleSend}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid #262626', flexShrink: 0 }}
                >
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex', flexShrink: 0 }}>
                    <ImageIcon size={24} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#1a1a1a', border: '1px solid #363636', borderRadius: 22, padding: '8px 14px', gap: 8 }}>
                    <input
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Message..."
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmoji(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0, color: showEmoji ? '#0095f6' : '#737373' }}
                    >
                      <Smile size={18} />
                    </button>
                  </div>

                  {text.trim() || mediaFile ? (
                    <button type="submit" disabled={sending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0095f6', display: 'flex', flexShrink: 0 }}>
                      {sending ? <Spinner size="sm" /> : <Send size={22} />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex', flexShrink: 0 }}
                      title="Voice message"
                    >
                      <Mic size={22} />
                    </button>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
