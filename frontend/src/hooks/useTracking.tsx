'use client';

import { useAnalytics } from '@/lib/analytics';
import { useEffect } from 'react';

// Define types for subscription
interface Subscription {
  id: string | number;
  name: string;
  category?: string;
  amount?: number;
  frequency?: string;
}

// Hook to track subscription-related events
export function useSubscriptionTracking() {
  const { trackEvent } = useAnalytics();
  
  // Track subscription creation
  const trackSubscriptionCreated = (subscription: Subscription) => {
    trackEvent('subscription_created', {
      subscription_id: subscription.id,
      subscription_name: subscription.name,
      category: subscription.category || '',
      amount: subscription.amount || 0,
      frequency: subscription.frequency || ''
    });
  };
  
  // Track subscription update
  const trackSubscriptionUpdated = (subscription: Subscription) => {
    trackEvent('subscription_updated', {
      subscription_id: subscription.id,
      subscription_name: subscription.name
    });
  };
  
  // Track subscription deletion
  const trackSubscriptionDeleted = (subscriptionId: string | number, subscriptionName: string) => {
    trackEvent('subscription_deleted', {
      subscription_id: subscriptionId,
      subscription_name: subscriptionName
    });
  };
  
  // Track subscription view
  const trackSubscriptionViewed = (subscriptionId: string | number, subscriptionName: string) => {
    trackEvent('subscription_viewed', {
      subscription_id: subscriptionId,
      subscription_name: subscriptionName
    });
  };
  
  return {
    trackSubscriptionCreated,
    trackSubscriptionUpdated,
    trackSubscriptionDeleted,
    trackSubscriptionViewed
  };
}

// Hook to track payment-related events
export function usePaymentTracking() {
  const { trackEvent } = useAnalytics();
  
  // Track checkout initiated
  const trackCheckoutInitiated = (plan: string) => {
    trackEvent('checkout_initiated', {
      plan: plan
    });
  };
  
  // Track payment success
  const trackPaymentSuccess = (sessionId: string, plan: string) => {
    trackEvent('payment_success', {
      session_id: sessionId,
      plan: plan
    });
  };
  
  // Track payment canceled
  const trackPaymentCanceled = () => {
    trackEvent('payment_canceled');
  };
  
  return {
    trackCheckoutInitiated,
    trackPaymentSuccess,
    trackPaymentCanceled
  };
}

// Hook to track user engagement
export function useEngagementTracking() {
  const { trackEvent } = useAnalytics();
  
  // Track dashboard view
  const trackDashboardView = () => {
    trackEvent('dashboard_viewed');
  };
  
  // Track settings update
  const trackSettingsUpdated = (settingType: string) => {
    trackEvent('settings_updated', {
      setting_type: settingType
    });
  };
  
  // Track notification settings update
  const trackNotificationSettingsUpdated = (emailEnabled: boolean, smsEnabled: boolean, daysBeforeRenewal: number) => {
    trackEvent('notification_settings_updated', {
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      days_before_renewal: daysBeforeRenewal
    });
  };
  
  return {
    trackDashboardView,
    trackSettingsUpdated,
    trackNotificationSettingsUpdated
  };
}
