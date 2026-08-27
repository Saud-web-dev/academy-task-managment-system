import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  checkPushSubscription,
} from '../../service/pushNotificationService';

const NotificationSettings = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const checkingRef = useRef(false); // Prevent multiple simultaneous checks

  useEffect(() => {
    // Only check once on mount to avoid infinite loops in production
    if (checkingRef.current) return;
    checkingRef.current = true;
    checkSubscriptionStatus();
  }, []); // Empty dependency - only run once on mount // Empty dependency array - only run once on mount

  const checkSubscriptionStatus = async () => {
    setLoading(true);
    try {
      // ✅ Check if service worker is available
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported in this browser');
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      const subscribed = await checkPushSubscription();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Check subscription error:', error);
      // ✅ Default to false on error - allows Settings page to render
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    const result = await subscribeToPushNotifications();
    if (result.success) {
      setIsSubscribed(true);
      toast.success('✅ Notifications Allowed');
    } else {
      toast.error(result.message);
    }
    setSubscribing(false);
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm('Disable notifications?')) return;
    setSubscribing(true);
    const result = await unsubscribeFromPushNotifications();
    if (result.success) {
      setIsSubscribed(false);
      toast.success('🔕 Notifications Denied');
    } else {
      toast.error(result.message);
    }
    setSubscribing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
        <p className="ml-2 text-sm text-[var(--text-secondary)]">Checking...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple Allow/Deny Toggle */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isSubscribed ? (
                <>
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Notifications Allowed
                  </h3>
                </>
              ) : (
                <>
                  <BellOff className="w-5 h-5 text-[var(--warning)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Notifications Denied
                  </h3>
                </>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {isSubscribed
                ? 'You will receive notifications for marks deduction, task assignment, and system updates.'
                : 'Enable to receive notifications for important actions.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
              disabled={subscribing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
                isSubscribed
                  ? 'bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20'
                  : 'bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] border border-[var(--accent-primary)]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {subscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {isSubscribed ? 'Deny' : 'Allow'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[var(--info)]/5 border border-[var(--info)]/20 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[var(--info)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[var(--info)] font-medium">Auto Notifications</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              When allowed, you will automatically receive notifications when admin deducts marks, assigns tasks, or sends system updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
