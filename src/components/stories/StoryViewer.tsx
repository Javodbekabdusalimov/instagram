import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import Avatar from '../common/Avatar';
import { viewStory } from '../../api/stories';
import type { StoryGroup } from '../../types';

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

const DURATION = 5000;

export default function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  const goNext = useCallback(() => {
    if (!group) return;
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, group, groupIdx, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx(i => i - 1);
      setStoryIdx(0);
      setProgress(0);
    }
  }, [storyIdx, groupIdx]);

  useEffect(() => {
    if (!story) return;
    viewStory(story._id).catch(() => {});
  }, [story?._id]);

  useEffect(() => {
    if (paused || !story) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = (elapsed / DURATION) * 100;
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        goNext();
      } else {
        setProgress(pct);
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [storyIdx, groupIdx, paused, goNext]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  if (!group || !story) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 110,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#fff', display: 'flex',
        }}
      >
        <X size={28} />
      </button>

      {/* Story card */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 380,
        height: '100%', maxHeight: '90vh',
        overflow: 'hidden', borderRadius: 16,
        backgroundColor: '#111',
      }}>
        {/* Progress bars */}
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          zIndex: 20, display: 'flex', gap: 4,
        }}>
          {group.stories.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 2,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 99, overflow: 'hidden',
              }}
            >
              <div style={{
                height: '100%',
                backgroundColor: '#fff',
                borderRadius: 99,
                width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{
          position: 'absolute', top: 24, left: 12, right: 12,
          zIndex: 20, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar src={group.user.avatar} alt={group.user.username} size="sm" />
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              {group.user.username}
            </span>
            {story.createdAt && (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                {timeAgo(story.createdAt)}
              </span>
            )}
          </div>
          <button
            onClick={() => setMuted(!muted)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Media */}
        <div
          style={{ width: '100%', height: '100%' }}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {story.media.type === 'video' ? (
            <video
              key={story._id}
              src={story.media.url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
              muted={muted}
              loop
            />
          ) : (
            <img
              key={story._id}
              src={story.media.url}
              alt="story"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Tap zones */}
        <button
          onClick={goPrev}
          style={{ position: 'absolute', left: 0, top: 0, width: '33%', height: '100%', zIndex: 10, background: 'none', border: 'none', cursor: 'pointer' }}
        />
        <button
          onClick={goNext}
          style={{ position: 'absolute', right: 0, top: 0, width: '67%', height: '100%', zIndex: 10, background: 'none', border: 'none', cursor: 'pointer' }}
        />
      </div>

      {/* Prev group */}
      {groupIdx > 0 && (
        <button
          onClick={() => { setGroupIdx(i => i - 1); setStoryIdx(0); setProgress(0); }}
          style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: '50%', padding: 8, cursor: 'pointer',
            color: '#fff', display: 'flex', zIndex: 20,
          }}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Next group */}
      {groupIdx < groups.length - 1 && (
        <button
          onClick={() => { setGroupIdx(i => i + 1); setStoryIdx(0); setProgress(0); }}
          style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: '50%', padding: 8, cursor: 'pointer',
            color: '#fff', display: 'flex', zIndex: 20,
          }}
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
