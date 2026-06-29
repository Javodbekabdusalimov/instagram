import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, ChevronUp, ChevronDown, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExplore } from '../api/posts';
import { toggleLike, toggleSave } from '../api/posts';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import CommentModal from '../components/post/CommentModal';
import { formatCount } from '../components/common/TimeAgo';
import type { Post } from '../types';

export default function ReelsPage() {
  const [reels, setReels] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadReels = useCallback(async (p: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getExplore(p, 10);
      const videos = res.posts.filter((post: import('../types').Post) => post.media.some((m: import('../types').MediaFile) => m.type === 'video'));
      setReels(prev => p === 1 ? videos : [...prev, ...videos]);
      setHasMore(res.hasMore);
    } catch {}
    finally { setLoading(false); }
  }, [loading]);

  useEffect(() => { loadReels(1); }, []);

  useEffect(() => {
    if (currentIdx >= reels.length - 3 && hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      loadReels(next);
    }
  }, [currentIdx]);

  const goNext = () => { if (currentIdx < reels.length - 1) setCurrentIdx(i => i + 1); };
  const goPrev = () => { if (currentIdx > 0) setCurrentIdx(i => i - 1); };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIdx, reels.length]);

  if (loading && reels.length === 0) {
    return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-neutral-500">
        <p>No reels available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen overflow-hidden flex items-center justify-center bg-black">
      <div className="relative h-full max-h-screen" style={{ width: '420px' }}>
        {reels[currentIdx] && (
          <ReelCard
            key={reels[currentIdx]._id}
            post={reels[currentIdx]}
            isActive={true}
            onNavigate={navigate}
            onUpdate={(updated) => setReels(rs => rs.map(r => r._id === updated._id ? updated : r))}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#fff',
            display: 'flex', opacity: currentIdx === 0 ? 0.3 : 1,
          }}
        >
          <ChevronUp size={20} />
        </button>
        <button
          onClick={goNext}
          disabled={currentIdx >= reels.length - 1}
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#fff',
            display: 'flex', opacity: currentIdx >= reels.length - 1 ? 0.3 : 1,
          }}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {loading && reels.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}

interface ReelCardProps {
  post: Post;
  isActive: boolean;
  onNavigate: (path: string) => void;
  onUpdate: (post: Post) => void;
}

function ReelCard({ post: initialPost, isActive, onNavigate, onUpdate }: ReelCardProps) {
  const [post, setPost] = useState(initialPost);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useAuthStore();

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && playing) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, playing]);

  const handleLike = async () => {
    const updated = { ...post, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 };
    setPost(updated);
    onUpdate(updated);
    try { await toggleLike(post._id); } catch {}
  };

  const handleSave = async () => {
    const updated = { ...post, isSaved: !post.isSaved };
    setPost(updated);
    onUpdate(updated);
    try { await toggleSave(post._id); } catch {}
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${post.author.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: `@${post.author.username} on Instagram` });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  const videoMedia = post.media.find(m => m.type === 'video');

  return (
    <div className="relative w-full h-full flex items-center">
      {/* Video */}
      <div className="relative w-full h-full" onClick={() => setPlaying(!playing)}>
        {videoMedia ? (
          <video
            ref={videoRef}
            src={videoMedia.url}
            className="w-full h-full object-cover"
            loop
            muted={muted}
            playsInline
            autoPlay
          />
        ) : (
          <img src={post.media[0]?.url} alt="reel" className="w-full h-full object-cover" />
        )}

        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play size={60} className="text-white/80 fill-white/80" />
          </div>
        )}
      </div>

      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => onNavigate(`/${post.author.username}`)}>
          <Avatar src={post.author.avatar} alt={post.author.username} size="sm" />
          <span className="text-white font-semibold text-sm">{post.author.username}</span>
          <button className="border border-white text-white text-xs px-3 py-0.5 rounded-full hover:bg-white/20 ml-1">
            Follow
          </button>
        </div>
        {post.caption && (
          <p className="text-white text-sm leading-snug line-clamp-2 mb-1">{post.caption}</p>
        )}
        {post.location && (
          <p className="text-white/70 text-xs">{post.location}</p>
        )}
      </div>

      {/* Right action buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center gap-5">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <Heart size={28} className={post.isLiked ? 'fill-red-500 text-red-500' : 'text-white'} />
          <span className="text-white text-xs font-semibold">{formatCount(post.likesCount)}</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
          <MessageCircle size={28} className="text-white" />
          <span className="text-white text-xs font-semibold">{formatCount(post.commentsCount)}</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <Send size={28} className="text-white" />
        </button>
        <button onClick={handleSave} className="flex flex-col items-center gap-1">
          <Bookmark size={28} className={post.isSaved ? 'fill-white text-white' : 'text-white'} />
        </button>
        <button onClick={() => setMuted(!muted)} className="text-white">
          {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button className="text-white"><MoreHorizontal size={24} /></button>
      </div>

      <CommentModal
        postId={post._id}
        post={post}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onLikePost={handleLike}
        onCommentAdded={() => setPost(p => ({ ...p, commentsCount: p.commentsCount + 1 }))}
      />
    </div>
  );
}
