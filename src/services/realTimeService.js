import { supabase } from '../lib/supabase';

export const realTimeService = {
  // Store active subscriptions
  subscriptions: new Map(),

  // Subscribe to profile expenses in real-time
  subscribeToProfileExpenses(profileId, callback) {
    // Unsubscribe from existing subscription if any
    if (this.subscriptions.has(profileId)) {
      this.unsubscribeFromProfileExpenses(profileId);
    }

    console.log('🔔 Subscribing to real-time updates for profile:', profileId);

    const subscription = supabase
      .channel(`profile-expenses-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          console.log('📡 Real-time expense update received:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_profiles',
          filter: `id=eq.${profileId}`
        },
        (payload) => {
          console.log('📡 Real-time profile update received:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          console.log('📡 Real-time budget update received:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        }
      });

    // Store the subscription
    this.subscriptions.set(profileId, subscription);

    return subscription;
  },

  // Unsubscribe from profile expenses
  unsubscribeFromProfileExpenses(profileId) {
    const subscription = this.subscriptions.get(profileId);
    if (subscription) {
      console.log('🔕 Unsubscribing from real-time updates for profile:', profileId);
      subscription.unsubscribe();
      this.subscriptions.delete(profileId);
    }
  },

  // Unsubscribe from all subscriptions
  unsubscribeFromAll() {
    console.log('🔕 Unsubscribing from all real-time updates');
    this.subscriptions.forEach((subscription, profileId) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  },

  // Subscribe to profile members updates
  subscribeToProfileMembers(profileId, callback) {
    const channelName = `profile-members-${profileId}`;
    
    // Unsubscribe from existing subscription if any
    if (this.subscriptions.has(channelName)) {
      this.unsubscribeFromProfileMembers(profileId);
    }

    console.log('🔔 Subscribing to real-time member updates for profile:', profileId);

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_members',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          console.log('📡 Real-time member update received:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('🔔 Member subscription status:', status);
      });

    // Store the subscription
    this.subscriptions.set(channelName, subscription);

    return subscription;
  },

  // Unsubscribe from profile members
  unsubscribeFromProfileMembers(profileId) {
    const channelName = `profile-members-${profileId}`;
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      console.log('🔕 Unsubscribing from member updates for profile:', profileId);
      subscription.unsubscribe();
      this.subscriptions.delete(channelName);
    }
  }
};
