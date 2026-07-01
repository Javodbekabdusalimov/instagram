import api from './axios';
import { fixUrl } from '../utils/url';
import type { Conversation, Message } from '../types';

function normalizeParticipant(u: any) {
  return { ...u, avatar: fixUrl(u?.avatar) };
}

function normalizeMsg(m: any): Message {
  return {
    _id: m._id,
    content: m.content ?? m.text ?? m.message,
    media: m.media ? fixUrl(m.media) : undefined,
    mediaType: m.mediaType,
    createdAt: m.createdAt,
    readBy: m.readBy,
    sender: normalizeParticipant(m.sender),
  };
}

function normalizeConv(c: any): Conversation {
  return {
    _id: c._id,
    updatedAt: c.updatedAt,
    participants: (c.participants ?? []).map(normalizeParticipant),
    lastMessage: c.lastMessage ? normalizeMsg(c.lastMessage) : undefined,
    unreadCount: c.unreadCount,
  };
}

export const getConversations = (): Promise<Conversation[]> =>
  api.get<any>('/messages/conversations').then(r => {
    const arr = Array.isArray(r.data) ? r.data : r.data?.conversations ?? [];
    return arr.map(normalizeConv);
  });

export const startConversation = (userId: string): Promise<Conversation> =>
  api.post<any>('/messages/conversations', { userId }).then(r => normalizeConv(r.data));

export const getUnreadCount = () =>
  api.get<any>('/messages/unread/count').then(r => ({
    count: r.data?.count ?? r.data?.unreadCount ?? 0,
  }));

export const getMessages = (conversationId: string, page = 1): Promise<Message[]> =>
  api.get<any>(`/messages/${conversationId}`, { params: { page } }).then(r => {
    const arr = Array.isArray(r.data) ? r.data : r.data?.messages ?? [];
    return arr.map(normalizeMsg);
  });

export const sendMessage = (conversationId: string, data: FormData): Promise<Message> =>
  api.post<any>(`/messages/${conversationId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => normalizeMsg(r.data));
