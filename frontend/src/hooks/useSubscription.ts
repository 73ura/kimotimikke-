'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useState } from 'react';

interface SubscriptionStatus {
  has_subscription: boolean;
  status: string;
  is_trial: boolean;
  is_paid: boolean;
  trial_expires_at: string | null;
  stripe_subscription_id?: string;
  cancel_at_period_end?: boolean;
}

export const useSubscription = () => {
  const { firebaseUser } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!firebaseUser) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch(
        `${apiBaseUrl}/api/v1/stripe/subscription/status`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      if (!response.ok) throw new Error('Failed to fetch subscription status');

      const data = await response.json();

      // デバッグ情報をコンソールに出力
      console.log('=== サブスクリプション状態デバッグ ===');
      console.log('Response data:', data);
      console.log('has_subscription:', data.has_subscription);
      console.log('status:', data.status);
      console.log('is_trial:', data.is_trial);
      console.log('trial_expires_at:', data.trial_expires_at);
      console.log('Current time:', new Date().toISOString());
      if (data.trial_expires_at) {
        const trialExpires = new Date(data.trial_expires_at);
        const now = new Date();
        console.log('Trial expires:', trialExpires.toISOString());
        console.log('Is trial active (calculated):', now < trialExpires);
      }
      console.log('=====================================');

      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // フロントエンドでトライアル状態を正しく計算
  const calculateIsTrialActive = () => {
    if (!subscription?.trial_expires_at) return false;
    const trialExpires = new Date(subscription.trial_expires_at);
    const now = new Date();
    return now < trialExpires;
  };

  return {
    has_subscription: subscription?.has_subscription || false,
    status: subscription?.status || 'none',
    is_trial: calculateIsTrialActive(), // フロントエンドで計算した値を使用
    is_paid: subscription?.is_paid || false,
    trial_expires_at: subscription?.trial_expires_at || null,
    stripe_subscription_id: subscription?.stripe_subscription_id,
    cancel_at_period_end: subscription?.cancel_at_period_end || false,
    loading,
    error,
    refetch: fetchSubscriptionStatus,
  };
};
