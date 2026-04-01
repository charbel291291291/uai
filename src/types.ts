export type ProfileMode = 'ai' | 'landing' | 'sales';
export type UserPlan = 'free' | 'pro' | 'elite';
export type NFCProductType = 'card' | 'keychain' | 'bracelet' | 'sticker';

export interface Service {
  id: string;
  title: string;
  description: string;
  price?: string;
  ctaLabel?: string;
  ctaLink?: string;
  ctaType?: 'order' | 'book' | 'contact' | 'whatsapp';
  featured?: boolean;
}

export interface NFCProduct {
  type: NFCProductType;
  name: string;
  description: string;
  sellPrice: string;
  emoji: string;
}

export interface NFCOrder {
  id?: string;
  user_id: string;
  product_type: NFCProductType;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered';
  created_at?: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  links?: UserLink[];
  aiPersona?: string;
  qaPairs?: QAPair[];
  services?: Service[];
  featuredVideoUrl?: string;
  createdAt?: any;
  analytics?: {
    views: number;
    chats: number;
    messages: number;
  };
  themeColor?: string;
  aboutMe?: string;
  avatarSource?: 'upload' | 'url' | 'initials';
  tags?: string[];
  isPrivate?: boolean;
  mode?: ProfileMode;
  plan?: UserPlan;
  whatsapp?: string;
  phone?: string;
}

export interface UserLink {
  title: string;
  url: string;
  icon?: string;
}

export interface QAPair {
  question: string;
  answer: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface ContactMessage {
  id: string;
  toUid: string;
  fromName: string;
  fromEmail: string;
  subject?: string;
  message: string;
  createdAt: string;
}
