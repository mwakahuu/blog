export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  date: string;
  content: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  categories: string[];
  author: string;
  authorAvatar?: string;
  date: string;
  readTime: string;
  image: string;
  additionalImages?: string[];
  videoUrl?: string;
  excerpt: string;
  content: string[];
  pullQuote?: string;
  views: number;
  comments: Comment[];
  isMainStory?: boolean;
  isEditorPick?: boolean;
  isMostShared?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
}

export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  description: string;
  image: string;
  inStock: boolean;
  features: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface VideoItem {
  id: string;
  title: string;
  category?: string;
  duration: string;
  views: string;
  uploadDate: string;
  thumbnail: string;
  videoUrl?: string;
  channelName: string;
  channelAvatar?: string;
  description: string;
  likes: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  span?: string;
}

export type ViewMode = 
  | 'home'
  | 'articles'
  | 'shop'
  | 'videos'
  | 'gallery'
  | 'admin'
  | 'post'
  | 'category'
  | 'author'
  | 'contact';
