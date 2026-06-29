import api from './axios';
import { fixUrl } from '../utils/url';
import type { User } from '../types';

function normalizeUser(u: any): User {
  return {
    ...u,
    avatar: fixUrl(u.avatar),
  };
}

export const searchUsers = (search: string) =>
  api.get<any>('/users', { params: { search } }).then(r =>
    (Array.isArray(r.data) ? r.data : (r.data as any)?.users ?? []).map(normalizeUser)
  );

export const getSuggestions = () =>
  api.get<any>('/users/suggestions').then(r =>
    (Array.isArray(r.data) ? r.data : (r.data as any)?.users ?? []).map(normalizeUser)
  );

export const updateProfile = (data: FormData) =>
  api.put<User>('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => normalizeUser(r.data));

export const getUserByUsername = (username: string) =>
  api.get<User>(`/users/${username}`).then(r => normalizeUser(r.data));

export const toggleFollow = (id: string) =>
  api.post<{ isFollowing: boolean; followersCount: number }>(`/users/${id}/follow`).then(r => r.data);

export const getFollowers = (id: string) =>
  api.get<any>(`/users/${id}/followers`).then(r =>
    (Array.isArray(r.data) ? r.data : (r.data as any)?.followers ?? []).map(normalizeUser)
  );

export const getFollowing = (id: string) =>
  api.get<any>(`/users/${id}/following`).then(r =>
    (Array.isArray(r.data) ? r.data : (r.data as any)?.following ?? []).map(normalizeUser)
  );
