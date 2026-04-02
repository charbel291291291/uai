import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, X, Check, Package, MessageSquare, CreditCard,
  Crown, Clock, Trash2, ExternalLink
} from 'lucide-react';
import { useAuth } from '../App';
import { useRealtimeNotifications } from '../hooks/useRealtime';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Link } from 'react-router-dom';

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  nfc_order_update: Package,
  payment_approved: Check,
  payment_rejected: X,
  subscription_expiring: Clock,
  new_message: MessageSquare,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  nfc_order_update: 'text-blue-400 bg-blue-400/20',
  payment_approved: 'text-green-400 bg-green-400/20',
  payment_rejected: 'text-red-400 bg-red-400/20',
  subscription_expiring: 'text-yellow-400 bg-yellow-400/20',
  new_message: 'text-purple-400 bg-purple-400/20',
};

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, dismissNotification } = useRealtimeNotifications(user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark as read when opening
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAsRead();
    }
  }, [isOpen, unreadCount, markAsRead]);

  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case 'nfc_order_update':
        return '/dashboard?tab=orders';
      case 'payment_approved':
      case 'payment_rejected':
        return '/upgrade';
      case 'new_message':
        return '/dashboard?tab=messages';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Bell size={20} className="text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold text-white">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-xs text-brand-accent hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={48} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => {
                    const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                    const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-white/50 bg-white/10';

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-white/5 transition-colors ${
                          !notification.read ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-white text-sm">
                                {notification.title}
                              </p>
                              <button
                                onClick={() => dismissNotification(notification.id)}
                                className="text-white/30 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p className="text-white/50 text-sm mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-white/30">
                                {new Date(notification.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <Link
                                to={getNotificationLink(notification)}
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-brand-accent hover:underline flex items-center gap-1"
                              >
                                View
                                <ExternalLink size={12} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10 text-center">
                <Link
                  to="/dashboard?tab=notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
