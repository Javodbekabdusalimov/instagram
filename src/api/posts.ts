import api from './axios';
import { fixUrl } from '../utils/url';
import type { Post, MediaFile } from '../types';
import { useAuthStore } from '../store/authStore';

export interface FeedResult {
  posts: Post[];
  hasMore: boolean;
  total: number;
}

function normalizePost(p: any): Post {
  const store = useAuthStore.getState();
  const currentUserId = store.user?._id;
  const savedPosts = store.savedPosts;

  const likes: string[] = Array.isArray(p.likes) ? p.likes : [];
  const comments: any[] = Array.isArray(p.comments) ? p.comments : [];

  const media: MediaFile[] = Array.isArray(p.media)
    ? p.media.map((m: any) => ({ ...m, url: fixUrl(m.url) ?? m.url }))
    : [];

  return {
    _id: p._id,
    caption: p.caption,
    location: p.location,
    hashtags: p.hashtags,
    createdAt: p.createdAt,
    media,
    author: {
      ...p.author,
      avatar: fixUrl(p.author?.avatar),
    },
    likesCount: p.likesCount ?? likes.length,
    commentsCount: p.commentsCount ?? comments.length,
    isLiked: currentUserId ? likes.includes(currentUserId) : (p.isLiked ?? false),
    isSaved: savedPosts.includes(p._id) || (p.isSaved ?? false),
    likes: p.likes,
  };
}

function parseFeed(data: any): FeedResult {
  let raw: any[] = [];
  let hasMore = false;
  let total = 0;

  if (Array.isArray(data)) {
    raw = data;
    hasMore = data.length >= 10;
    total = data.length;
  } else if (data?.posts && Array.isArray(data.posts)) {
    raw = data.posts;
    hasMore = data.hasMore ?? raw.length >= 10;
    total = data.total ?? raw.length;
  } else if (data?.data && Array.isArray(data.data)) {
    raw = data.data;
    hasMore = data.hasMore ?? raw.length >= 10;
    total = data.total ?? raw.length;
  } else if (data?.items && Array.isArray(data.items)) {
    raw = data.items;
    hasMore = data.hasMore ?? false;
    total = data.total ?? raw.length;
  }

  return { posts: raw.map(normalizePost), hasMore, total };
}

export const createPost = (data: FormData) =>
  api.post<Post>('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

export const getFeed = (page = 1, limit = 10) =>
  api.get<any>('/posts/feed', { params: { page, limit } }).then(r => parseFeed(r.data));

export const getExplore = (page = 1, limit = 20) =>
  api.get<any>('/posts/explore', { params: { page, limit } }).then(r => parseFeed(r.data));

export const getSavedPosts = (): Promise<Post[]> =>
  api.get<any>('/posts/saved').then(r => {
    const arr = Array.isArray(r.data) ? r.data : r.data?.posts ?? r.data?.data ?? [];
    return arr.map(normalizePost);
  });

export const getHashtagPosts = (tag: string, page = 1) =>
  api.get<any>(`/posts/hashtag/${tag}`, { params: { page } }).then(r => parseFeed(r.data));

export const getUserPosts = (userId: string, page = 1) =>
  api.get<any>(`/posts/user/${userId}`, { params: { page } }).then(r => parseFeed(r.data));

export const getPost = (id: string) =>
  api.get<any>(`/posts/${id}`).then(r => normalizePost(r.data));

export const deletePost = (id: string) =>
  api.delete(`/posts/${id}`).then(r => r.data);

export const toggleLike = (id: string) =>
  api.post<any>(`/posts/${id}/like`).then(r => r.data);

export const toggleSave = (id: string) =>
  api.post<any>(`/posts/${id}/save`).then(r => r.data);
