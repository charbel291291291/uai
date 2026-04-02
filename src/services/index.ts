// ============================================================================
// SERVICES INDEX - Centralized API exports
// ============================================================================

// Base client
export { apiClient, ApiClientError } from './apiClient';
export type { ApiResponse, ApiError } from './apiClient';

// Auth Service
export { 
  default as authService,
  signUp,
  signIn,
  signInWithOAuth,
  signOut,
  getSession,
  getCurrentUser,
  resetPassword,
  updatePassword,
  updateMetadata,
  onAuthStateChange,
  refreshSession,
} from './authService';
export type { AuthResponse, SignUpData, SignInData, OAuthProvider } from './authService';

// AI Service
export {
  default as aiService,
  sendMessageToAI,
  getConversationHistory,
  clearConversationHistory,
  AIService,
} from './aiService';
export type { AIRequest, AIResponse, ConversationMessage, AIError } from './aiService';

// Profile Service
export {
  default as profileService,
  createProfile,
  getProfileById,
  getProfileByUsername,
  updateProfile,
  deleteProfile,
  getAllProfiles,
  searchProfiles,
  checkUsernameAvailability,
  addService,
  removeService,
  addLink,
  removeLink,
  addTestimonial,
  uploadAvatar,
  getProfileStats,
} from './profileService';
export type { CreateProfileData, UpdateProfileData, ProfileFilters } from './profileService';

// Order Service
export {
  default as orderService,
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  createPaymentRequest,
  getUserPaymentHistory,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getPaymentStats,
} from './orderService';
export type { 
  CreateOrderData, 
  UpdateOrderStatusData, 
  CreatePaymentData,
  PaymentApprovalData 
} from './orderService';

// Analytics Service
export {
  default as analyticsService,
  trackEvent,
  trackPageView,
  trackProfileView,
  trackChatStarted,
  trackCTAClick,
  trackNFCTap,
  getEvents,
  getProfileAnalytics,
  getDailySummary,
  aggregateDailyAnalytics,
  getAnalyticsSummary,
} from './analyticsService';
export type { TrackEventData, AnalyticsFilters } from './analyticsService';

// Contact Message Service
export {
  default as contactMessageService,
  createMessage,
  getMessageById,
  getAllMessages,
  getUserMessages,
  updateMessage,
  deleteMessage,
  assignMessage,
  markAsResponded,
  resolveMessage,
  markAsSpam,
  getMessageStats,
  getUnassignedMessages,
  getMessagesByAssignee,
} from './contactMessageService';
export type { 
  CreateContactMessageData, 
  UpdateContactMessageData, 
  ContactMessageFilters 
} from './contactMessageService';
