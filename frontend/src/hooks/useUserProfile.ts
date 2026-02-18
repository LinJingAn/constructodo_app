import { useState, useEffect, useCallback } from 'react';
import { client, UserProfile } from '@/lib/api';

export type UserType = 'client' | 'professional';

export interface UseUserProfileResult {
  profile: UserProfile | null;
  userType: UserType;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Fetches the current user's profile (user_profiles) and exposes user_type
 * so the UI can show the correct role (client vs professional) and nav.
 */
export function useUserProfile(): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.entities.user_profiles.query({ limit: 1 });
      if (response.data?.items?.length > 0) {
        setProfile(response.data.items[0]);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const userType: UserType = profile?.user_type === 'professional' ? 'professional' : 'client';

  return { profile, userType, loading, refetch: fetchProfile };
}
