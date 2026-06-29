import api from './axios';
import { fixUrl } from '../utils/url';
import type { Story, StoryGroup } from '../types';

function normalizeStory(s: any): Story {
  const mediaRaw = s.media;
  const mediaUrl = typeof mediaRaw === 'string'
    ? mediaRaw
    : (mediaRaw?.url ?? mediaRaw?.uri ?? s.mediaUrl ?? s.url ?? '');
  const mediaType = (typeof mediaRaw === 'object' && mediaRaw !== null ? mediaRaw.type : null)
    ?? s.mediaType ?? s.type ?? 'image';
  return {
    _id: s._id,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
    viewers: s.viewers,
    isViewed: s.isViewed ?? false,
    author: {
      ...s.author,
      avatar: fixUrl(s.author?.avatar),
    },
    media: {
      url: fixUrl(mediaUrl) ?? '',
      type: mediaType,
    },
  };
}

export const createStory = (data: FormData): Promise<Story> =>
  api.post<any>('/stories', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => normalizeStory(r.data));

export const getStoryFeed = (): Promise<StoryGroup[]> =>
  api.get<any>('/stories/feed').then(r => {
    const arr = Array.isArray(r.data) ? r.data : r.data?.stories ?? [];
    // API may return array of StoryGroups or flat stories — handle both
    if (arr.length === 0) return [];
    if (arr[0]?.user && arr[0]?.stories) {
      // Already grouped format
      return arr.map((g: any) => ({
        user: { ...g.user, avatar: fixUrl(g.user?.avatar) },
        stories: (g.stories ?? []).map(normalizeStory),
        hasUnviewed: g.hasUnviewed ?? g.stories?.some((s: any) => !s.isViewed) ?? true,
      }));
    }
    // Flat array — group by author
    const groups: Record<string, StoryGroup> = {};
    for (const s of arr) {
      const story = normalizeStory(s);
      const uid = story.author._id;
      if (!groups[uid]) {
        groups[uid] = { user: story.author, stories: [], hasUnviewed: false };
      }
      groups[uid].stories.push(story);
      if (!story.isViewed) groups[uid].hasUnviewed = true;
    }
    return Object.values(groups);
  });

export const getUserStories = (userId: string): Promise<Story[]> =>
  api.get<any>(`/stories/user/${userId}`).then(r => {
    const arr = Array.isArray(r.data) ? r.data : r.data?.stories ?? [];
    return arr.map(normalizeStory);
  });

export const viewStory = (id: string) =>
  api.post(`/stories/${id}/view`).then(r => r.data);

export const deleteStory = (id: string) =>
  api.delete(`/stories/${id}`).then(r => r.data);
