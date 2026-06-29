import api from './axios';
import { fixUrl } from '../utils/url';
import type { Comment } from '../types';

function normalizeComment(c: any): Comment {
  return {
    _id: c._id,
    text: c.text,
    likesCount: c.likesCount ?? (c.likes?.length ?? 0),
    isLiked: c.isLiked ?? false,
    createdAt: c.createdAt,
    parentId: c.parentComment ?? c.parentId,
    author: {
      ...c.author,
      avatar: fixUrl(c.author?.avatar),
    },
    replies: Array.isArray(c.replies) ? c.replies.map(normalizeComment) : [],
  };
}

export const getComments = (postId: string): Promise<Comment[]> =>
  api.get<any>(`/posts/${postId}/comments`).then(r => {
    const arr = Array.isArray(r.data) ? r.data : r.data?.comments ?? [];
    return arr.map(normalizeComment);
  });

export const addComment = (postId: string, text: string, parentId?: string) =>
  api.post<any>(`/posts/${postId}/comments`, { text, parentComment: parentId })
    .then(r => normalizeComment(r.data));

export const toggleCommentLike = (id: string) =>
  api.post<{ isLiked: boolean; likesCount: number }>(`/comments/${id}/like`).then(r => r.data);

export const deleteComment = (id: string) =>
  api.delete(`/comments/${id}`).then(r => r.data);
