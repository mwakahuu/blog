import { Comment, GalleryImage, Post, ShopProduct, VideoItem } from './types';

type ContentResponse = {
  posts: Post[];
  videos: VideoItem[];
  galleryImages: GalleryImage[];
  products: ShopProduct[];
};

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export type LegacyContent = {
  posts: Post[];
  videos: VideoItem[];
  galleryImages: GalleryImage[];
};

export type PremiumAccessStatus = {
  active: boolean;
  expiresAt: string | null;
  pendingReference: string | null;
};

export type PremiumPaymentStatus = {
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  accessActive: boolean;
  expiresAt: string | null;
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
  if (import.meta.env.DEV && path.startsWith('/payments')) {
    console.info(`[payment-debug] ${init?.method ?? 'GET'} ${path}: HTTP ${response.status}; redirected=${response.redirected}`);
  }

  const result = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new ApiRequestError(result.error || `Request failed (${response.status}).`, response.status);
  }
  return result as T;
};

export const fetchContent = () => request<ContentResponse>('/content');

export const fetchAdminVideos = () => request<VideoItem[]>('/admin/videos');

export const fetchPremiumAccessStatus = () => request<PremiumAccessStatus>('/access/status');

export const createPremiumPayment = (phone: string) =>
  request<{ reference: string; status: 'pending'; amount: number; currency: 'TZS' }>('/payments/create', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

export const abandonPremiumPayment = (reference: string) =>
  request<{ abandoned: boolean }>('/payments/abandon', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  });

export const fetchPremiumPaymentStatus = (reference: string) =>
  request<PremiumPaymentStatus>(`/payments/status/${encodeURIComponent(reference)}`);

export const fetchVideoPlayback = (videoId: string) =>
  request<{ url: string; format: 'hls' | 'file' }>(`/videos/${encodeURIComponent(videoId)}/playback`);

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

export const saveProduct = (product: ShopProduct) =>
  request<{ success: true }>('/products', { method: 'POST', body: JSON.stringify(product) });

export const removeProduct = (id: string) =>
  request<{ success: true }>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const savePostComment = (postId: string, comment: Comment) =>
  request<{ success: true }>(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment),
  });
