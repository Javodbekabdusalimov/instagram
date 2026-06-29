import api from './axios';
import { fixUrl } from '../utils/url';
import type { Notification } from '../types';

function normalizeNotif(n: any): Notification {
  return {
    _id: n._id,
    type: n.type,
    read: n.isRead ?? n.read ?? false,
    createdAt: n.createdAt,
    // Backend uses "sender", our type uses "actor"
    actor: {
      ...( n.sender ?? n.actor ?? {}),
      avatar: fixUrl((n.sender ?? n.actor)?.avatar),
    },
    post: n.post ? {
      _id: n.post._id ?? n.post,
      media: Array.isArray(n.post.media)
        ? n.post.media.map((m: any) => ({ ...m, url: fixUrl(m.url) }))
        : [],
    } : undefined,
    comment: n.comment ?? n.text,
  };
}

export const getNotifications = (): Promise<Notification[]> =>
  api.get<any>('/notifications').then(r => {
    const arr = Array.isArray(r.data) ? r.data : r.data?.notifications ?? [];
    return arr.map(normalizeNotif);
  });

export const getUnreadCount = () =>
  api.get<any>('/notifications/unread/count').then(r => ({
    count: r.data?.count ?? r.data?.unreadCount ?? 0,
  }));

export const markAllRead = () =>
  api.put('/notifications/read').then(r => r.data);

export const deleteNotification = (id: string) =>
  api.delete(`/notifications/${id}`).then(r => r.data);
