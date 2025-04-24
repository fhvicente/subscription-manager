"use client";

import { useState, useEffect, FormEvent, ChangeEvent, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

// Interfaces for typing
interface NotificationSettings {
  id?: string;
  user_id?: string;
  email_enabled: number;
  sms_enabled: number;
  push_enabled: number;
  days_before_renewal: number;
  phone_number: string;
  created_at?: string;
  updated_at?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  premiumUntil?: string;
  created_at?: string;
  updated_at?: string;
}

interface SubscriptionStatus {
  plan: string;
  premiumUntil?: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { getSubscriptionStatus, cancelSubscription } = usePayment();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [showSuccessProfile, setShowSuccessProfile] = useState(false);
  const [showSuccessNotifications, setShowSuccessNotifications] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [error, setError] = useState("");

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: ""
  });

  const [notificationsForm, setNotificationsForm] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    daysBeforeRenewal: 3,
    phoneNumber: ""
  });

  // Fetch subscription status
  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
      return status;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }
  }, [getSubscriptionStatus]);

  // Force an update when component mounts and every 30 seconds
  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Check user settings periodically
    const intervalId = setInterval(fetchSubscriptionStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchSubscriptionStatus]);

  // Fetch user data and notification settings
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch user profile
      const userResponse = await api.get('/users/profile');
      const userData = userResponse.data;
      setUser(userData);
      setProfileForm({
        name: userData.name
      });

      // Fetch subscription status
      await fetchSubscriptionStatus();
      
      // Fetch notification settings
      try {
        const notificationsResponse = await api.get('/notifications/settings');
        const notificationsData = notificationsResponse.data;
        setNotificationSettings(notificationsData);
        
        // Set up notification form state
        setNotificationsForm({
          emailEnabled: notificationsData.email_enabled === 1,
          smsEnabled: notificationsData.sms_enabled === 1,
          pushEnabled: notificationsData.push_enabled === 1,
          daysBeforeRenewal: notificationsData.days_before_renewal,
          phoneNumber: notificationsData.phone_number || ""
        });
      } catch (notifError) {
        console.error("Error fetching notification settings:", notifError);
        // If we can't fetch settings, keep the default values
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Unable to load your settings. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscriptionStatus]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Handlers for form changes
  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, name, value, type } = e.target;
    const fieldName = id || name;
    
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setNotificationsForm(prev => ({ 
        ...prev, 
        [fieldName]: checkbox.checked 
      }));
    } else {
      setNotificationsForm(prev => ({ 
        ...prev, 
        [fieldName]: value 
      }));
    }
  };

  // Handlers for form submissions
  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSavingProfile(true);
      
      await api.put('/users/profile', { 
        name: profileForm.name 
      });
      
      // Show success message
      setShowSuccessProfile(true);
      setTimeout(() => setShowSuccessProfile(false), 3000);
      
      // Update user state
      if (user) {
        setUser({
          ...user,
          name: profileForm.name
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Unable to update profile. Please try again later.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNotificationsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSavingNotifications(true);
      
      const payload = {
        email_enabled: notificationsForm.emailEnabled ? 1 : 0,
        sms_enabled: notificationsForm.smsEnabled ? 1 : 0,
        push_enabled: notificationsForm.pushEnabled ? 1 : 0,
        days_before_renewal: parseInt(notificationsForm.daysBeforeRenewal.toString()),
        phone_number: notificationsForm.phoneNumber
      };
      
      console.log("Sending notification settings:", payload);
      
      await api.put('/notifications/settings', payload);
      
      // Show success message
      setShowSuccessNotifications(true);
      setTimeout(() => setShowSuccessNotifications(false), 3000);
      
      // Update notification settings state
      if (notificationSettings) {
        setNotificationSettings({
          ...notificationSettings,
          email_enabled: payload.email_enabled,
          sms_enabled: payload.sms_enabled,
          push_enabled: payload.push_enabled,
          days_before_renewal: payload.days_before_renewal,
          phone_number: payload.phone_number
        });
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      alert("Unable to update notification settings. Please try again later.");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-red-600">{error}</h1>
        <Button className="mt-4" onClick={() => router.refresh()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* Profile Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        <Card className="bg-white shadow-sm p-6 relative">
          {showSuccessProfile && (
            <div className="absolute top-2 right-2 flex items-center bg-green-100 text-green-600 px-3 py-1 rounded">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
              <p className="text-xs text-slate-500">Email managed by your login account</p>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={isSavingProfile} className="cursor-pointer">
                {isSavingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
        <Card className="bg-white shadow-sm p-6 relative">
          {showSuccessNotifications && (
            <div className="absolute top-2 right-2 flex items-center bg-green-100 text-green-600 px-3 py-1 rounded">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleNotificationsSubmit}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">Email Notifications</h3>
                <p className="text-sm text-slate-500">Receive email reminders before renewals</p>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="emailEnabled" 
                  className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                  checked={notificationsForm.emailEnabled}
                  onChange={handleNotificationChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">SMS Notifications</h3>
                <p className="text-sm text-slate-500">Receive SMS reminders before renewals</p>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="smsEnabled" 
                  className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                  checked={notificationsForm.smsEnabled}
                  onChange={handleNotificationChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (for SMS)</Label>
              <Input 
                id="phoneNumber" 
                placeholder="+351 123 456 789" 
                value={notificationsForm.phoneNumber}
                onChange={handleNotificationChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daysBeforeRenewal">Days in Advance for Notifications</Label>
              <select 
                id="daysBeforeRenewal" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={notificationsForm.daysBeforeRenewal}
                onChange={handleNotificationChange}
              >
                <option value="1">1 day before</option>
                <option value="2">2 days before</option>
                <option value="3">3 days before</option>
                <option value="5">5 days before</option>
                <option value="7">7 days before</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSavingNotifications} className="cursor-pointer">
                {isSavingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Settings"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Subscription Plan */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Subscription Plan</h2>
        <Card className="bg-white shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900">
                Current Plan: {subscriptionStatus?.plan === 'premium' ? 'Premium' : 'Free'}
              </h3>
              {subscriptionStatus?.plan === 'premium' && subscriptionStatus.premiumUntil && (
                <p className="text-sm text-slate-700 mt-1">
                  <span className="font-medium">Valid until:</span> {new Date(subscriptionStatus.premiumUntil).toLocaleDateString()}
                </p>
              )}
              <p className="text-sm text-slate-500 mt-2">
                {subscriptionStatus?.plan !== 'premium' 
                  ? 'Limited to 3 subscriptions. Upgrade to premium plan for unlimited features.' 
                  : 'You have access to all premium features.'}
              </p>
            </div>
            
            {subscriptionStatus?.plan !== 'premium' ? (
              <Button asChild className="cursor-pointer">
                <a href="/payment">Upgrade to Premium</a>
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">You can cancel your Premium plan at any time. After cancellation, you will continue to have access to premium features until the end of the paid period.</p>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                  if (confirm("Are you sure you want to cancel your Premium plan? You will continue to have access to premium features until the end of the paid period.")) {
                    try {
                      await cancelSubscription();
                      alert("Your plan has been successfully canceled!");
                      // Update subscription status after cancellation
                      await fetchSubscriptionStatus();
                      router.refresh();
                    } catch (error) {
                      console.error("Error canceling subscription:", error);
                      alert("Unable to cancel your subscription. Please try again later.");
                    }
                  }
                }}>
                  Cancel Subscription
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
