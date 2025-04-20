import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/api';
import { useState, useEffect } from 'react';

// Hook to fetch user profile from backend
export function useUserProfile() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const api = useApi();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch profile if user is signed in
        if (!authLoading && isAuthenticated() && api) {
            setLoading(true);
            api.get('/users/profile')
                .then(response => {
                    setProfile(response.data);
                    setError(null);
                })
                .catch(err => {
                    console.error('Error fetching user profile:', err);
                    setError('Failed to load user profile');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else if (!authLoading && !isAuthenticated()) {
            setProfile(null);
            setLoading(false);
        }
    }, [authLoading, isAuthenticated, api, user?.id]);

    return { 
        profile, 
        loading, 
        error, 
        refetch: () => {
            if (api) {
                setLoading(true);
                api.get('/users/profile')
                    .then(response => {
                        setProfile(response.data);
                        setError(null);
                    })
                    .catch(err => {
                        setError('Failed to load user profile');
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        }
    };
}