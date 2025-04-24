import { useApi } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';

interface Subscription {
    id: string;
    userId: string;
    plan: string;
    startDate: string;
    endDate?: string;
}

interface SubscriptionStats {
    total: number;
    active: number;
    cancelled: number;
}

type SubscriptionInput = Omit<Subscription, 'id'>;

// Hook to fetch subscriptions from our backend
export function useSubscriptions() {
    const api = useApi();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats] = useState<SubscriptionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch subscriptions
    const fetchSubscriptions = useCallback(async () => {
        if (!api) return;
        
        setLoading(true);
        try {
            const response = await api.get('/subscriptions');
            setSubscriptions(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
            setError('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    }, [api]);

    // Fetch subscription statistics
    const fetchStats = useCallback(async () => {
        if (!api) return;
        
        try {
            const response = await api.get('/subscriptions/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching subscription stats:', err);
        }
    }, [api]);

    // Create a new subscription
    const createSubscription = async (subscriptionData: SubscriptionInput): Promise<Subscription | null> => {
        if (!api) return null;
        
        try {
            const response = await api.post('/subscriptions', subscriptionData);
            await fetchSubscriptions(); // Refresh the list
            await fetchStats(); // Refresh stats
            return response.data;
        } catch (err) {
            console.error('Error creating subscription:', err);
            throw err;
        }
    };

    // Update a subscription
    const updateSubscription = async (id: string, subscriptionData: SubscriptionInput): Promise<Subscription | null> => {
        if (!api) return null;
        
        try {
            const response = await api.put(`/subscriptions/${id}`, subscriptionData);
            await fetchSubscriptions(); // Refresh the list
            await fetchStats(); // Refresh stats
            return response.data;
        } catch (err) {
            console.error('Error updating subscription:', err);
            throw err;
        }
    };

    // Delete a subscription
    const deleteSubscription = async (id: string): Promise<boolean> => {
        if (!api) return false;
        
        try {
            await api.delete(`/subscriptions/${id}`);
            await fetchSubscriptions(); // Refresh the list
            await fetchStats(); // Refresh stats
            return true;
        } catch (err) {
            console.error('Error deleting subscription:', err);
            throw err;
        }
    };

    // Fetch data on initial load
    useEffect(() => {
        if (!api) return;
        fetchSubscriptions();
        fetchStats();
    }, [api, fetchSubscriptions, fetchStats]);

    return {
        subscriptions,
        stats,
        loading,
        error,
        refetch: () => {
            fetchSubscriptions();
            fetchStats();
        },
        createSubscription,
        updateSubscription,
        deleteSubscription
    };
}