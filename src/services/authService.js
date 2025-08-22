import { supabase } from '../lib/supabase';

export const authService = {
  // Get current session
  async getSession() {
    try {
      const { data, error } = await supabase?.auth?.getSession();
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data: data?.session, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data, error } = await supabase?.auth?.getUser();
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data: data?.user, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single();
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', userId)?.select()?.single();
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase?.auth?.resetPasswordForEmail(email, {
        redirectTo: `${window.location?.origin}/reset-password`,
      });
      
      if (error) {
        return { error: error?.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  },

  // Update password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase?.auth?.updateUser({
        password: newPassword
      });
      
      if (error) {
        return { error: error?.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  }
};