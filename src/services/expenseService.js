import { supabase } from '../lib/supabase';

export const expenseService = {
  // Get user's expense profiles
  async getExpenseProfiles(userId) {
    try {
      const { data, error } = await supabase?.from('expense_profiles')?.select('*')?.eq('user_id', userId)?.order('created_at', { ascending: false });
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create expense profile
  async createExpenseProfile(profileData) {
    try {
      // If profile is shared but no share code, generate one
      if (profileData.is_shared && !profileData.share_code) {
        try {
          const { data: codeData, error: codeError } = await supabase.rpc('generate_share_code');
          if (!codeError && codeData) {
            profileData.share_code = codeData;
          }
        } catch (codeError) {
          console.warn('Failed to generate share code via RPC, using fallback');
          // Fallback to simple generation
          profileData.share_code = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        }
      }
      
      const { data, error } = await supabase?.from('expense_profiles')?.insert([profileData])?.select()?.single();
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update expense profile
  async updateExpenseProfile(profileId, updates) {
    try {
      // If profile is being shared but no share code, generate one
      if (updates.is_shared && !updates.share_code) {
        try {
          const { data: codeData, error: codeError } = await supabase.rpc('generate_share_code');
          if (!codeError && codeData) {
            updates.share_code = codeData;
          }
        } catch (codeError) {
          console.warn('Failed to generate share code via RPC, using fallback');
          // Fallback to simple generation
          updates.share_code = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        }
      }
      
      const { data, error } = await supabase?.from('expense_profiles')?.update(updates)?.eq('id', profileId)?.select()?.single();
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete expense profile
  async deleteExpenseProfile(profileId) {
    try {
      const { error } = await supabase?.from('expense_profiles')?.delete()?.eq('id', profileId);
      
      if (error) {
        return { error: error?.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  },

  // Ensure all shared profiles have share codes
  async ensureShareCodes() {
    try {
      // Get all shared profiles without share codes
      const { data: profilesWithoutCodes, error: fetchError } = await supabase
        .from('expense_profiles')
        .select('id')
        .eq('is_shared', true)
        .is('share_code', null);
      
      if (fetchError) {
        console.error('Error fetching profiles without share codes:', fetchError);
        return { error: fetchError.message };
      }
      
      if (profilesWithoutCodes && profilesWithoutCodes.length > 0) {
        // Generate share codes for each profile
        for (const profile of profilesWithoutCodes) {
          try {
            const { data: codeData, error: codeError } = await supabase.rpc('generate_share_code');
            if (!codeError && codeData) {
              await supabase
                .from('expense_profiles')
                .update({ share_code: codeData })
                .eq('id', profile.id);
            }
          } catch (codeError) {
            console.error('Error generating share code for profile:', profile.id, codeError);
          }
        }
      }
      
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get profile by share code
  async getProfileByShareCode(shareCode) {
    try {
      const { data, error } = await supabase
        .from('expense_profiles')
        .select('*')
        .eq('share_code', shareCode)
        .eq('is_shared', true)
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Get expenses for a profile
  async getExpenses(profileId, limit = 50) {
    try {
      const { data, error } = await supabase?.from('expenses')?.select('*')?.eq('profile_id', profileId)?.order('expense_date', { ascending: false })?.limit(limit);
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create expense
  async createExpense(expenseData) {
    try {
      const { data, error } = await supabase?.from('expenses')?.insert([expenseData])?.select()?.single();
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update expense
  async updateExpense(expenseId, updates) {
    try {
      const { data, error } = await supabase?.from('expenses')?.update(updates)?.eq('id', expenseId)?.select()?.single();
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete expense
  async deleteExpense(expenseId) {
    try {
      const { error } = await supabase?.from('expenses')?.delete()?.eq('id', expenseId);
      
      if (error) {
        return { error: error?.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  },

  // Get budgets for a profile
  async getBudgets(profileId) {
    try {
      const { data, error } = await supabase?.from('budgets')?.select('*')?.eq('profile_id', profileId)?.order('created_at', { ascending: false });
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create budget
  async createBudget(budgetData) {
    try {
      const { data, error } = await supabase?.from('budgets')?.insert([budgetData])?.select()?.single();
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update budget
  async updateBudget(budgetId, updates) {
    try {
      const { data, error } = await supabase?.from('budgets')?.update(updates)?.eq('id', budgetId)?.select()?.single();
      
      if (error) {
        return { data: null, error: error?.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};