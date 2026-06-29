export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  gender?: string;
  isPrivate?: boolean;
  isVerified?: boolean;
  // Backend can return either array or count
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  createdAt?: string;
}

export function getFollowersCount(u: User): number {
  return u.followersCount ?? u.followers?.length ?? 0;
}
export function getFollowingCount(u: User): number {
  return u.followingCount ?? u.following?.length ?? 0;
}

export interface MediaFile {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface Post {
  _id: string;
  author: User;
  media: MediaFile[];
  caption?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  location?: string;
  hashtags?: string[];
  createdAt: string;
  likes?: string[];
  savedBy?: string[];
}

export interface Comment {
  _id: string;
  author: User;
  text: string;
  likesCount: number;
  isLiked: boolean;
  replies?: Comment[];
  parentId?: string;
  createdAt: string;
}

export interface Story {
  _id: string;
  author: User;
  media: { url: string; type: 'image' | 'video' };
  viewers?: string[];
  expiresAt: string;
  createdAt: string;
  isViewed?: boolean;
}

export interface StoryGroup {
  user: User;
  stories: Story[];
  hasUnviewed: boolean;
}

export interface Message {
  _id: string;
  sender: User;
  content?: string;
  media?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  readBy?: string[];
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'reply';
  actor: User;
  post?: { _id: string; media: MediaFile[] };
  comment?: string;
  read: boolean;
  createdAt: string;
}

// Flexible paginated response - backend may return different shapes
export interface PaginatedResponse<T> {
  data?: T[];
  posts?: T[];
  items?: T[];
  total?: number;
  page?: number;
  pages?: number;
  hasMore?: boolean;
  totalPages?: number;
}

export interface AuthResponse {
  token: string;
  user?: User;
  // Flat format (token + user fields in same object)
  _id?: string;
  username?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
}
