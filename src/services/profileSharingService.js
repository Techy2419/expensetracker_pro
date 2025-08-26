import { supabase } from '../lib/supabase';

export const profileSharingService = {
  // Get profile members
  async getProfileMembers(profileId) {
    try {
      const { data, error } = await supabase
        .from('profile_members')
        .select(`
          *,
          user:user_profiles(id, email, full_name),
          invited_by:user_profiles!profile_members_invited_by_fkey(id, email, full_name)
        `)
        .eq('profile_id', profileId)
        .order('joined_at', { ascending: true });
      
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Get profile invitations
  async getProfileInvitations(profileId) {
    try {
      const { data, error } = await supabase
        .from('profile_invitations')
        .select(`
          *,
          invited_by:user_profiles(id, email, full_name)
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

    // Invite user to profile
  async inviteUserToProfile(profileId, invitedEmail, role = 'member', permissions = {}, message = '') {
    try {
      // Use the database function to create invitation with proper code generation
      const { data, error } = await supabase.rpc('create_profile_invitation', {
        profile_id: profileId,
        invited_email: invitedEmail,
        role,
        permissions,
        message
      });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      if (!data || !data.success) {
        return { data: null, error: 'Failed to create invitation' };
      }

             // Now send the email invitation using the Edge Function
       try {
         const { data: profileData } = await supabase
           .from('expense_profiles')
           .select('name, share_code')
           .eq('id', profileId)
           .single();

         const { data: userData } = await supabase.auth.getUser();
         
         if (profileData && userData?.user) {
           const shareLink = `${window.location.origin}/join-profile/${profileData.share_code}`;
           
                                               const { data: emailResult, error: emailError } = await supabase.functions.invoke('test-email-function', {
             body: {
               invitationId: data.invitation_id,
               profileId: profileId,
               invitedEmail: invitedEmail,
               inviterName: userData.user.user_metadata?.full_name || userData.user.email,
               profileName: profileData.name,
               shareCode: profileData.share_code,
               shareLink: shareLink,
               role: role,
               message: message
             }
           });

          if (emailError) {
            console.warn('Email sending failed, but invitation was stored:', emailError);
            // Don't fail the whole operation if email fails
          }
        }
      } catch (emailError) {
        console.warn('Email sending failed, but invitation was stored:', emailError);
        // Don't fail the whole operation if email fails
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Accept invitation
  async acceptInvitation(invitationCode, userId) {
    try {
      const { data, error } = await supabase.rpc('accept_profile_invitation', {
        invitation_code: invitationCode,
        user_id: userId
      });
      
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Decline invitation
  async declineInvitation(invitationId) {
    try {
      const { error } = await supabase
        .from('profile_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);
      
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Remove member from profile
  async removeMember(profileId, userId) {
    try {
      const { error } = await supabase
        .from('profile_members')
        .delete()
        .eq('profile_id', profileId)
        .eq('user_id', userId);
      
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Update member permissions
  async updateMemberPermissions(profileId, userId, permissions) {
    try {
      const { data, error } = await supabase
        .from('profile_members')
        .update({ permissions })
        .eq('profile_id', profileId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Update member role
  async updateMemberRole(profileId, userId, role) {
    try {
      const { data, error } = await supabase
        .from('profile_members')
        .update({ role })
        .eq('profile_id', profileId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Get profile by share code
  async getProfileByShareCode(shareCode) {
    try {
      const { data, error } = await supabase.rpc('get_profile_by_share_code', {
        share_code: shareCode
      });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      if (!data || !data.success) {
        return { data: null, error: data?.error || 'Invalid share code' };
      }
      
      return { data: data.data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Update profile sharing settings
  async updateProfileSharing(profileId, isShared, shareSettings) {
    try {
      const updates = { is_shared: isShared };
      
      if (isShared) {
        updates.share_settings = shareSettings;
        // Generate share code if not exists using database function
        const { data: existingProfile } = await supabase
          .from('expense_profiles')
          .select('share_code')
          .eq('id', profileId)
          .single();
        
        if (!existingProfile?.share_code) {
          // Use the database function to generate a unique share code
          const { data: codeData, error: codeError } = await supabase.rpc('generate_share_code');
          if (codeError) {
            console.error('Error generating share code:', codeError);
            // Fallback to simple generation if database function fails
            updates.share_code = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
          } else {
            updates.share_code = codeData;
          }
        }
      } else {
        updates.share_code = null;
        updates.share_settings = null;
      }
      
      const { data, error } = await supabase
        .from('expense_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Get user's shared profiles
  async getUserSharedProfiles(userId) {
    try {
      const { data, error } = await supabase
        .from('profile_members')
        .select(`
          *,
          profile:expense_profiles(
            id, name, type, is_shared, share_code, share_settings,
            user_profiles(id, email, full_name)
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });
      
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Check if user has access to profile
  async checkProfileAccess(profileId, userId) {
    try {
      // Check if user is owner
      const { data: profile, error: profileError } = await supabase
        .from('expense_profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();
      
      if (profileError) {
        return { hasAccess: false, role: null, permissions: null, error: profileError.message };
      }
      
      if (profile.user_id === userId) {
        return { hasAccess: true, role: 'owner', permissions: { view: true, edit: true, delete: true, invite: true } };
      }
      
      // Check if user is member
      const { data: member, error: memberError } = await supabase
        .from('profile_members')
        .select('role, permissions')
        .eq('profile_id', profileId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (memberError) {
        return { hasAccess: false, role: null, permissions: null, error: memberError.message };
      }
      
      return { hasAccess: true, role: member.role, permissions: member.permissions };
    } catch (error) {
      return { hasAccess: false, role: null, permissions: null, error: error.message };
    }
  }
};
