import api from './axios';
import { fixUrl } from '../utils/url';
import type { User } from '../types';

interface LoginResult { token: string; user: User }

function normalizeUser(data: any): User {
  return {
    _id: data._id,
    username: data.username,
    fullName: data.fullName,
    email: data.email,
    avatar: fixUrl(data.avatar),
    bio: data.bio,
    website: data.website,
    gender: data.gender,
    followers: data.followers,
    following: data.following,
    isPrivate: data.isPrivate,
    createdAt: data.createdAt,
    // Computed counts
    followersCount: Array.isArray(data.followers) ? data.followers.length : data.followersCount,
    followingCount: Array.isArray(data.following) ? data.following.length : data.followingCount,
    postsCount: data.postsCount,
  };
}

function parseAuthResponse(data: any): LoginResult {
  const token = data.token;
  const rawUser = data.user ?? data;
  const user = normalizeUser(rawUser);
  // Store savedPosts on user object for store to pick up
  (user as any).savedPosts = rawUser.savedPosts ?? [];
  return { token, user };
}

export const login = (identifier: string, password: string) =>
  api.post<any>('/auth/login', { identifier, password }).then(r => parseAuthResponse(r.data));

export const register = (data: { username: string; fullName: string; email: string; password: string }) =>
  api.post<any>('/auth/register', data).then(r => parseAuthResponse(r.data));

export const getMe = () =>
  api.get<any>('/auth/me').then(r => {
    const user = normalizeUser(r.data);
    (user as any).savedPosts = r.data.savedPosts ?? [];
    return user;
  });
