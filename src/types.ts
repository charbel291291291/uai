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
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  price?: number;

  // Shipping
  tracking_number?: string;
  shipping_carrier?: string;
  shipped_at?: string;
  delivered_at?: string;

  // Admin
  admin_notes?: string;
  updated_by?: string;

  created_at?: string;
  updated_at?: string;

  // Joined data
  user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'nfc_order_update' | 'payment_approved' | 'payment_rejected' | 'subscription_expiring' | 'new_message';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

// AI Conversation Types
export interface ConversationMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'visitor';
  sender_name?: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  profile_id: string;
  visitor_id: string;
  visitor_name?: string;
  messages: ConversationMessage[];
  status: 'active' | 'closed';
  last_message_at: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  text: string;
  rating: number;
  avatarUrl?: string;
}

export interface Lead {
  id: string;
  profile_id: string;
  name?: string;
  phone: string;
  message?: string;
  created_at: string;
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
  testimonials?: Testimonial[];
  featuredVideoUrl?: string;
  createdAt?: any;
  analytics?: {
    views: number;
    chats: number;
    messages: number;
    leads?: number;
    ctaClicks?: number;
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
  tone?: 'professional' | 'friendly' | 'persuasive' | 'casual' | 'energetic';
  goal?: 'get-clients' | 'book-calls' | 'sell-service' | 'build-network' | 'share-knowledge';
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

// Subscription System Types
export type PaymentMethod = 'whish' | 'omt' | 'bank';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface PaymentRequest {
  id: string;
  user_id: string;
  plan: Exclude<UserPlan, 'free'>;
  payment_method: PaymentMethod;
  proof_image_url: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: UserPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at?: string;
  payment_request_id?: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: string;
  label: string;
  free: boolean | string;
  pro: boolean | string;
  elite: boolean | string;
}

export const PLAN_PRICES: Record<Exclude<UserPlan, 'free'>, { monthly: number; yearly: number }> = {
  pro: { monthly: 5, yearly: 50 },
  elite: { monthly: 10, yearly: 100 },
};

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; instructions: string }[] = [
  {
    id: 'whish',
    label: 'Whish Money',
    icon: 'Wallet',
    instructions: 'Send to Whish Money account: 03/123 456',
  },
  {
    id: 'omt',
    label: 'OMT',
    icon: 'Banknote',
    instructions: 'Send via OMT to: Lebanon / Beirut / Phone: 03/123 456',
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: 'Building2',
    instructions: 'Bank: BDL\nAccount: 1234567890\nIBAN: LB12 1234 5678 9012 3456 7890 1234',
  },
];

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export type AnalyticsEventType = 
  | 'page_view'
  | 'profile_view'
  | 'chat_started'
  | 'message_sent'
  | 'link_click'
  | 'cta_click'
  | 'nfc_tap'
  | 'service_view'
  | 'testimonial_view'
  | 'signup_started'
  | 'signup_completed'
  | 'login'
  | 'logout'
  | 'order_created'
  | 'payment_initiated'
  | 'payment_completed'
  | 'subscription_started'
  | 'subscription_expired';

export interface AnalyticsEvent {
  id: string;
  event_type: AnalyticsEventType;
  user_id?: string;
  profile_id?: string;
  session_id?: string;
  visitor_id?: string;
  data: Record<string, any>;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  ip_address?: string;
  user_agent?: string;
  country?: string;
  city?: string;
  created_at: string;
  event_timestamp: string;
}

export interface AnalyticsDailySummary {
  id: string;
  profile_id: string;
  date: string;
  page_views: number;
  profile_views: number;
  chat_starts: number;
  messages_sent: number;
  link_clicks: number;
  cta_clicks: number;
  nfc_taps: number;
  unique_visitors: number;
  details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONTACT MESSAGES TYPES
// ============================================================================

export type ContactMessageCategory = 
  | 'general'
  | 'support'
  | 'sales'
  | 'partnership'
  | 'feedback'
  | 'bug_report'
  | 'feature_request';

export type ContactMessageStatus = 
  | 'new'
  | 'in_progress'
  | 'waiting_for_user'
  | 'resolved'
  | 'spam'
  | 'archived';

export type ContactMessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: ContactMessageCategory;
  user_id?: string;
  status: ContactMessageStatus;
  priority: ContactMessagePriority;
  assigned_to?: string;
  admin_notes?: string;
  responded_at?: string;
  response_count: number;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  created_at: string;
  updated_at: string;
}
