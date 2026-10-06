import { Comment, GalleryImage, Post, VideoItem } from './types';

type ContentResponse = {
  posts: Post[];
  videos: VideoItem[];
  galleryImages: GalleryImage[];
};

export type LegacyContent = {
  posts: Post[];
  videos: VideoItem[];
  galleryImages: GalleryImage[];
};

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const result = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status}).`);
  }
  return result as T;
};

export const fetchContent = () => request<ContentResponse>('/content');

export const fetchAdminSession = async () => {
  const result = await request<{ authenticated: boolean }>('/auth/session');
  return result.authenticated;
};

export const loginAdmin = (email: string, password: string) =>
  request<{ authenticated: true }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const logoutAdmin = () =>
  request<{ authenticated: false }>('/auth/logout', { method: 'POST' });

export const importLegacyContent = (content: LegacyContent) =>
  request<{ imported: boolean }>('/content/import-local', {
    method: 'POST',
    body: JSON.stringify(content),
  });

export const savePost = (post: Post) =>
  request<{ success: true }>('/posts', { method: 'POST', body: JSON.stringify(post) });

export const removePost = (id: string) =>
  request<{ success: true }>(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const saveVideo = (video: VideoItem) =>
  request<{ success: true }>('/videos', { method: 'POST', body: JSON.stringify(video) });

export const removeVideo = (id: string) =>
  request<{ success: true }>(`/videos/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const saveGalleryImage = (image: GalleryImage) =>
  request<{ success: true }>('/gallery', { method: 'POST', body: JSON.stringify(image) });

export const removeGalleryImage = (id: string) =>
  request<{ success: true }>(`/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const savePostComment = (postId: string, comment: Comment) =>
  request<{ success: true }>(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment),
  });
