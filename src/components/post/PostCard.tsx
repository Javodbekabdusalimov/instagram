import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  ChevronLeft, ChevronRight, Volume2, VolumeX
} from 'lucide-react';
import Avatar from '../common/Avatar';
import TimeAgo, { formatCount } from '../common/TimeAgo';
import { toggleLike, toggleSave, deletePost } from '../../api/posts';
import { useAuthStore } from '../../store/authStore';
import type { Post } from '../../types';
import CommentModal from './CommentModal';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export default function PostCard({ post: initialPost, onDelete }: PostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [muted, setMuted] = useState(true);
  const lastTap = useRef(0);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const currentMedia = post.media[mediaIndex];
  const isOwner = user?._id === post.author._id;

  const handleLike = async () => {
    const wasLiked = post.isLiked;
    // Optimistic update
    setPost(p => ({
      ...p,
      isLiked: !wasLiked,
      likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
    }));
    try {
      await toggleLike(post._id);
    } catch {
      setPost(p => ({
        ...p,
        isLiked: wasLiked,
        likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1,
      }));
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!post.isLiked) { handleLike(); }
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 800);
    }
    lastTap.current = now;
  };

  const handleSave = async () => {
    const prev = post.isSaved;
    setPost(p => ({ ...p, isSaved: !p.isSaved }));
    try {
      await toggleSave(post._id);
    } catch {
      setPost(p => ({ ...p, isSaved: prev }));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setShowMenu(false);
    try {
      await deletePost(post._id);
      onDelete?.(post._id);
    } catch {}
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

  return (
    <article className="border-b border-neutral-800 pb-4 mb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/${post.author.username}`)}>
          <Avatar src={post.author.avatar} alt={post.author.username} size="sm" hasStory hasUnviewed />
          <div>
            <p className="text-white text-sm font-semibold">{post.author.username}</p>
            {post.location && <p className="text-neutral-400 text-xs">{post.location}</p>}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-white p-1">
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl z-20 min-w-[180px] overflow-hidden">
              {isOwner && (
                <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-red-400 text-sm hover:bg-neutral-800">
                  Delete post
                </button>
              )}
              <button
                onClick={() => { navigate(`/${post.author.username}`); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-white text-sm hover:bg-neutral-800"
              >
                Go to profile
              </button>
              <button onClick={() => setShowMenu(false)} className="w-full text-left px-4 py-3 text-white text-sm hover:bg-neutral-800">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="relative bg-black select-none" style={{ aspectRatio: '1 / 1' }}>
        <div onClick={handleDoubleTap} className="w-full h-full">
          {currentMedia?.type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                src={currentMedia.url}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted={muted}
                playsInline
              />
              <button
                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                className="absolute bottom-3 right-3 bg-black/60 rounded-full p-1.5 text-white"
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          ) : (
            <img src={currentMedia?.url} alt="post" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Like animation */}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="text-white fill-white" size={80} style={{ animation: 'likeHeart 0.8s ease-out forwards' }} />
          </div>
        )}

        {/* Carousel controls */}
        {post.media.length > 1 && (
          <>
            {mediaIndex > 0 && (
              <button
                onClick={() => setMediaIndex(i => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-1.5 backdrop-blur-sm"
              >
                <ChevronLeft size={16} className="text-white" />
              </button>
            )}
            {mediaIndex < post.media.length - 1 && (
              <button
                onClick={() => setMediaIndex(i => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-1.5 backdrop-blur-sm"
              >
                <ChevronRight size={16} className="text-white" />
              </button>
            )}
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {post.media.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${i === mediaIndex ? 'w-2 h-2 bg-blue-500' : 'w-1.5 h-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="transition-transform active:scale-90">
            <Heart
              size={24}
              className={post.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}
            />
          </button>
          <button onClick={() => setShowComments(true)}>
            <MessageCircle size={24} className="text-white" />
          </button>
          <button onClick={handleShare}>
            <Send size={24} className="text-white" />
          </button>
        </div>
        <button onClick={handleSave}>
          <Bookmark size={24} className={post.isSaved ? 'fill-white text-white' : 'text-white'} />
        </button>
      </div>

      {/* Likes */}
      <div className="px-4 mt-2">
        {post.likesCount > 0 && (
          <p className="text-white text-sm font-semibold">{formatCount(post.likesCount)} likes</p>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 mt-1">
          <p className="text-white text-sm">
            <Link to={`/${post.author.username}`} className="font-semibold mr-1">{post.author.username}</Link>
            <CaptionText text={post.caption} />
          </p>
        </div>
      )}

      {/* Comments link */}
      {post.commentsCount > 0 && (
        <button
          onClick={() => setShowComments(true)}
          className="px-4 mt-1 text-neutral-500 text-sm hover:text-neutral-400"
        >
          View all {post.commentsCount} comments
        </button>
      )}

      {/* Time */}
      <div className="px-4 mt-1">
        <TimeAgo date={post.createdAt} />
      </div>

      <CommentModal
        postId={post._id}
        post={post}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onLikePost={handleLike}
        onCommentAdded={() => setPost(p => ({ ...p, commentsCount: p.commentsCount + 1 }))}
      />
    </article>
  );
}

function CaptionText({ text }: { text: string }) {
  const parts = text.split(/(#\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <span key={i} className="text-blue-400">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
