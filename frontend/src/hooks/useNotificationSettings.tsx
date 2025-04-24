import { useApi } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
}

// Hook to fetch and manage notification settings
export function useNotificationSettings() {
    const api = useApi();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch notification settings
    const fetchSettings = useCallback(async () => {
        if (!api) return;
        
        setLoading(true);
        try {
            const response = await api.get<NotificationSettings>('/notifications');
            setSettings(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching notification settings:', err);
            setError('Failed to load notification settings');
        } finally {
            setLoading(false);
        }
    }, [api]);

    // Update notification settings
    const updateSettings = async (settingsData: NotificationSettings): Promise<NotificationSettings | null> => {
        if (!api) return null;
        
        try {
            const response = await api.put<NotificationSettings>('/notifications', settingsData);
            setSettings(response.data);
            return response.data;
        } catch (err) {
            console.error('Error updating notification settings:', err);
            throw err;
        }
    };

    // Send test notification
    const sendTestNotification = async (type: string): Promise<Record<string, unknown> | null> => {
        if (!api) return null;
        
        try {
            const response = await api.post('/notifications/test', { type });
            return response.data;
        } catch (err) {
            console.error('Error sending test notification:', err);
            throw err;
        }
    };

    // Fetch data on initial load
    useEffect(() => {
        if (!api) return;
        fetchSettings();
    }, [api, fetchSettings]);

    return {
        settings,
        loading,
        error,
        refetch: fetchSettings,
        updateSettings,
        sendTestNotification
    };
}