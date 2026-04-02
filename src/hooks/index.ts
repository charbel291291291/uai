// ============================================================================
// HOOKS INDEX - Centralized hooks exports
// ============================================================================

// Auth hooks
export { 
  useAuth, 
  useAuthProvider, 
  useAuthenticated,
  AuthProvider 
} from './useAuth';

// Profile hooks
export { 
  useProfile, 
  usePublicProfile, 
  useProfileSearch,
  useUsernameAvailability 
} from './useProfile';

// Subscription hooks
export { 
  useSubscription, 
  useCreatePaymentRequest, 
  useAdminPayments 
} from './useSubscription';

// NFC Order hooks
export { 
  useNFCOrdersAdmin, 
  useUserNFCOrders,
  useCreateNFCOrder 
} from './useNFCOrders';

// AI Chat hooks
export { useAIChat } from './useAIChat';

// Analytics hooks
export {
  useAnalytics,
  useAnalyticsSummary,
  useDailyAnalytics,
} from './useAnalytics';

// Contact Message hooks
export {
  useContactMessages,
  useContactMessageStats,
  useCreateContactMessage,
  useUserContactMessages,
} from './useContactMessages';

// Accessibility hooks
export {
  useFocusTrap,
  useAnnouncer,
  useSkipLink,
  useListKeyboardNavigation,
  useReducedMotion,
  useHighContrast,
  useFocusVisible,
  useAccessibleModal,
  generateUniqueId,
} from './useAccessibility';

// Other hooks
export { useLang, LangProvider } from './useLang';
export { useInstallPrompt } from './useInstallPrompt';
export { useRealtime } from './useRealtime';
