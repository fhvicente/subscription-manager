'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import Plausible from 'plausible-tracker';

// Define types for Plausible
type PlausibleOptions = {
  trackPageview?: boolean;
};

type PlausibleEventProps = Record<string, string | number | boolean>;

type Cleanup = { (): void };

interface PlausibleInstance {
  trackPageview: (options?: PlausibleOptions) => void;
  trackEvent: (eventName: string, props?: PlausibleEventProps) => void;
  enableAutoPageviews: () => Cleanup;
  enableAutoOutboundTracking?: () => Cleanup;
}

// Create analytics context
const AnalyticsContext = createContext<PlausibleInstance | null>(null);

// Initialize Plausible tracker
const plausible = Plausible({
  domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'gestor-assinaturas.example.com',
  apiHost: process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST || 'https://plausible.io',
  trackLocalhost: process.env.NODE_ENV !== 'production',
}) as PlausibleInstance;

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Enable automatic page view tracking
  useEffect(() => {
    const cleanup = plausible.enableAutoPageviews();
    
    return () => {
      // Clean up when component unmounts
      cleanup();
    };
  }, []);

  return (
    <AnalyticsContext.Provider value={plausible}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook to use analytics
export function useAnalytics() {
  const analytics = useContext(AnalyticsContext);
  
  if (!analytics) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return {
    // Track page views manually
    trackPageview: (options?: PlausibleOptions) => {
      analytics.trackPageview(options);
    },
    
    // Track custom events
    trackEvent: (eventName: string, props?: PlausibleEventProps) => {
      analytics.trackEvent(eventName, props);
    }
  };
}
