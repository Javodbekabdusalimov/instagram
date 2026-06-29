import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, X, Send } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import TimeAgo, { formatCount } from '../common/TimeAgo';
import { getComments, addComment, toggleCommentLike, deleteComment } from '../../api/comments';
import { useAuthStore } from '../../store/authStore';
import type { Comment, Post } from '../../types';

interface CommentModalProps {
  postId: string;
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onLikePost: () => void;
  onCommentAdded?: () => void;
}

export default function CommentModal({ postId, post, isOpen, onClose, onLikePost, onCommentAdded }: CommentModalProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getComments(postId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await addComment(postId, text.trim(), replyTo?._id);
      if (replyTo) {
        setComments(cs => cs.map(c =>
          c._id === replyTo._id ? { ...c, replies: [...(c.replies || []), comment] } : c
        ));
      } else {
        setComments(cs => [comment, ...cs]);
      }
      setText('');
      setReplyTo(null);
      onCommentAdded?.();
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleLikeComment = async (id: string, isReply = false, parentId?: string) => {
    try {
      const res = await toggleCommentLike(id);
      setComments(cs => cs.map(c => {
        if (!isReply && c._id === id) return { ...c, ...res };
        if (isReply && c._id === parentId)
          return { ...c, replies: c.replies?.map(r => r._id === id ? { ...r, ...res } : r) };
        return c;
      }));
    } catch {}
  };

  const mediaUrl = post.media[0]?.url;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" showClose={false}>
      {/* Fixed height layout: image left + comments right */}
      <div style={{ display: 'flex', height: '85vh', maxHeight: 700 }}>

        {/* Left — post image (desktop only) */}
        <div
          className="hidden md:flex"
          style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
        >
          {post.media[0]?.type === 'video' ? (
            <video src={mediaUrl} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} autoPlay muted loop />
          ) : (
            <img src={mediaUrl} alt="post" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          )}
        </div>

        {/* Right — comments panel */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 380, borderLeft: '1px solid #262626', flexShrink: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #262626' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar src={post.author.avatar} alt={post.author.username} size="sm" />
              <Link to={`/${post.author.username}`} style={{ color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                {post.author.username}
              </Link>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>

          {/* Comments list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Caption */}
            {post.caption && (
              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar src={post.author.avatar} alt={post.author.username} size="sm" />
                <div>
                  <p style={{ color: '#fff', fontSize: 14 }}>
                    <span style={{ fontWeight: 600, marginRight: 4 }}>{post.author.username}</span>
                    {post.caption}
                  </p>
                  <TimeAgo date={post.createdAt} />
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner /></div>
            ) : comments.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: '#737373', gap: 8 }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>No comments yet.</p>
                <p style={{ fontSize: 14 }}>Start the conversation.</p>
              </div>
            ) : (
              comments.map(comment => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  currentUserId={user?._id}
                  onLike={(id) => handleLikeComment(id)}
                  onDelete={async (id) => {
                    try { await deleteComment(id); setComments(cs => cs.filter(c => c._id !== id)); } catch {}
                  }}
                  onReply={(c) => { setReplyTo(c); inputRef.current?.focus(); }}
                  onLikeReply={(id, parentId) => handleLikeComment(id, true, parentId)}
                />
              ))
            )}
          </div>

          {/* Actions row */}
          <div style={{ borderTop: '1px solid #262626', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <button onClick={onLikePost} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <Heart size={22} style={{ fill: post.isLiked ? '#ef4444' : 'none', color: post.isLiked ? '#ef4444' : '#fff' }} />
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#fff' }}>
                <Send size={22} />
              </button>
            </div>
            {post.likesCount > 0 && (
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {formatCount(post.likesCount)} likes
              </p>
            )}
            <TimeAgo date={post.createdAt} />
          </div>

          {/* Comment input */}
          <form onSubmit={handleSubmit} style={{ borderTop: '1px solid #262626', padding: '12px 16px' }}>
            {replyTo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, backgroundColor: '#262626', borderRadius: 8, padding: '6px 12px' }}>
                <span style={{ color: '#737373', fontSize: 12 }}>Replying to @{replyTo.author.username}</span>
                <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar src={user?.avatar} alt={user?.username} size="xs" />
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Add a comment..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14 }}
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                style={{ background: 'none', border: 'none', cursor: text.trim() ? 'pointer' : 'default', color: '#0095f6', fontWeight: 600, fontSize: 14, opacity: text.trim() ? 1 : 0.4, display: 'flex', alignItems: 'center' }}
              >
                {submitting ? <Spinner size="sm" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

function CommentItem({ comment, currentUserId, onLike, onDelete, onReply, onLikeReply }: {
  comment: Comment;
  currentUserId?: string;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (c: Comment) => void;
  onLikeReply: (id: string, parentId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const isOwner = currentUserId === comment.author._id;

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar src={comment.author.avatar} alt={comment.author.username} size="sm" />
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontSize: 14 }}>
            <span style={{ fontWeight: 600, marginRight: 4 }}>{comment.author.username}</span>
            {comment.text}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
            <TimeAgo date={comment.createdAt} />
            {comment.likesCount > 0 && (
              <span style={{ color: '#737373', fontSize: 12 }}>{formatCount(comment.likesCount)} likes</span>
            )}
            <button
              onClick={() => onReply(comment)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', fontSize: 12, fontWeight: 600, padding: 0 }}
            >
              Reply
            </button>
            {isOwner && showActions && (
              <button
                onClick={() => onDelete(comment._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: 12, padding: 0 }}
              >
                Delete
              </button>
            )}
          </div>

          {/* Replies */}
          {(comment.replies ?? []).map(reply => (
            <div key={reply._id} style={{ display: 'flex', gap: 10, marginTop: 12, marginLeft: 8 }}>
              <Avatar src={reply.author.avatar} alt={reply.author.username} size="xs" />
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: 14 }}>
                  <span style={{ fontWeight: 600, marginRight: 4 }}>{reply.author.username}</span>
                  {reply.text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <TimeAgo date={reply.createdAt} />
                  {reply.likesCount > 0 && (
                    <span style={{ color: '#737373', fontSize: 12 }}>{formatCount(reply.likesCount)} likes</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onLikeReply(reply._id, comment._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignSelf: 'flex-start' }}
              >
                <Heart size={14} style={{ fill: reply.isLiked ? '#ef4444' : 'none', color: reply.isLiked ? '#ef4444' : '#737373' }} />
              </button>
            </div>
          ))}
        </div>

        {/* Like button */}
        <button
          onClick={() => onLike(comment._id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignSelf: 'flex-start', paddingTop: 2 }}
        >
          <Heart size={14} style={{ fill: comment.isLiked ? '#ef4444' : 'none', color: comment.isLiked ? '#ef4444' : '#737373' }} />
        </button>
      </div>
    </div>
  );
}
