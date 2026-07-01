import React, { useEffect, useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { getStoryFeed, createStory } from '../../api/stories';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import StoryViewer from './StoryViewer';
import type { StoryGroup } from '../../types';

export default function StoriesBar() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [creatingStory, setCreatingStory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storyFileRef = useRef<HTMLInputElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    getStoryFeed().then(setGroups).catch(() => {});
  }, []);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => { checkScroll(); }, [groups]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const handleStoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCreatingStory(true);
    try {
      const fd = new FormData();
      fd.append('media', file);
      await createStory(fd);
      const updated = await getStoryFeed();
      setGroups(updated);
    } catch {
      alert('Failed to create story');
    } finally {
      setCreatingStory(false);
    }
  };

  return (
    <div className="relative px-4 py-4 border-b border-neutral-800">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-neutral-800 rounded-full p-1 z-10 shadow-md hover:bg-neutral-700"
        >
          <ChevronLeft size={16} className="text-white" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-800 rounded-full p-1 z-10 shadow-md hover:bg-neutral-700"
        >
          <ChevronRight size={16} className="text-white" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide"
        onScroll={checkScroll}
      >
        {/* Your story */}
        <div
          className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
          onClick={() => !creatingStory && storyFileRef.current?.click()}
        >
          <div className="relative">
            <Avatar src={user?.avatar} alt={user?.username} size="lg" />
            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-black">
              {creatingStory ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={12} className="text-white" />
              )}
            </div>
          </div>
          <span className="text-white text-xs max-w-[64px] truncate">Your story</span>
        </div>

        <input
          ref={storyFileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleStoryFileChange}
        />

        {groups.map((group, idx) => (
          <div
            key={group.user._id}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
            onClick={() => setSelectedGroup(idx)}
          >
            <Avatar
              src={group.user.avatar}
              alt={group.user.username}
              size="lg"
              hasStory
              hasUnviewed={group.hasUnviewed}
            />
            <span className="text-white text-xs max-w-[64px] truncate">{group.user.username}</span>
          </div>
        ))}
      </div>

      {selectedGroup !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}
