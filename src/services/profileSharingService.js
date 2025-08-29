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

  // Test database access and function
  async testDatabaseAccess() {
    try {
      console.log('🧪 Testing database access...');
      
      // Test 1: Check if we can read from profile_invitations
      console.log('📧 Testing profile_invitations table access...');
      const { data: invitations, error: invError } = await supabase
        .from('profile_invitations')
        .select('count')
        .limit(1);
      
      console.log('Invitations test result:', { invitations, invError });
      
      // Test 2: Check if we can read from expense_profiles
      console.log('📊 Testing expense_profiles table access...');
      const { data: profiles, error: profError } = await supabase
        .from('expense_profiles')
        .select('count')
        .limit(1);
      
      console.log('Profiles test result:', { profiles, profError });
      
      // Test 3: Check if we can read from user_profiles
      console.log('👤 Testing user_profiles table access...');
      const { data: users, error: userError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      console.log('Users test result:', { users, userError });
      
      // Test 4: Try the database function
      console.log('🔧 Testing create_profile_invitation function...');
      const { data: funcData, error: funcError } = await supabase.rpc('create_profile_invitation', {
        profile_id: '00000000-0000-0000-0000-000000000000', // Dummy ID for testing
        invited_email: 'test@example.com',
        role: 'member',
        permissions: { view: true, edit: false, delete: false, invite: false },
        message: 'Test invitation'
      });
      
      console.log('Function test result:', { funcData, funcError });
      
      return {
        success: true,
        invitations: { data: invitations, error: invError },
        profiles: { data: profiles, error: profError },
        users: { data: users, error: userError },
        function: { data: funcData, error: funcError }
      };
      
    } catch (error) {
      console.error('💥 Database access test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Invite user to profile
  async inviteUserToProfile(profileId, invitedEmail, role = 'member', permissions = {}, message = '') {
    try {
      console.log('Creating invitation for profile:', profileId, 'to email:', invitedEmail);
      
      // Try to use the database function first
      let invitationData;
      try {
        const { data, error } = await supabase.rpc('create_profile_invitation', {
          profile_id: profileId,
          invited_email: invitedEmail,
          role,
          permissions,
          message
        });
        
        if (error) {
          console.warn('Database function failed, using fallback:', error);
          throw error;
        }
        
        if (!data || !data.success) {
          console.warn('Database function returned no success, using fallback');
          throw new Error('Function returned no success');
        }
        
        invitationData = data;
        console.log('✅ Database function worked:', invitationData);
        
      } catch (functionError) {
        console.log('🔄 Using fallback invitation creation...');
        
                 // Fallback: Generate invitation code manually and insert directly
         // Ensure exactly 12 characters for consistency
         const part1 = Math.random().toString(36).substring(2, 8);
         const part2 = Math.random().toString(36).substring(2, 8);
         const invitationCode = (part1 + part2).toUpperCase();
        
        const { data: insertData, error: insertError } = await supabase
          .from('profile_invitations')
          .insert({
            profile_id: profileId,
            invited_email: invitedEmail,
            role,
            permissions,
            invitation_code: invitationCode,
            message,
            status: 'pending'
          })
          .select('id, invitation_code')
          .single();
        
        if (insertError) {
          console.error('Fallback insertion failed:', insertError);
          return { data: null, error: `Failed to create invitation: ${insertError.message}` };
        }
        
        invitationData = {
          success: true,
          invitation_id: insertData.id,
          invitation_code: insertData.invitation_code
        };
        
        console.log('✅ Fallback invitation created:', invitationData);
      }

      // Now send the email invitation using the Edge Function
      try {
        const { data: profileData } = await supabase
          .from('expense_profiles')
          .select('name')
          .eq('id', profileId)
          .single();

        const { data: userData } = await supabase.auth.getUser();
        
        if (profileData && userData?.user) {
          // Use the unique invitation code for the link, not the profile share code
          const inviteLink = `https://fintrackr.vercel.app/join-profile/${invitationData.invitation_code}`;
          
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('test-email-function', {
            body: {
              invitationId: invitationData.invitation_id,
              profileId: profileId,
              invitedEmail: invitedEmail,
              inviterName: userData.user.user_metadata?.full_name || userData.user.email,
              profileName: profileData.name,
              invitationCode: invitationData.invitation_code, // Use invitation code instead of share code
              inviteLink: inviteLink, // Use invitation link
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
      
      return { data: invitationData, error: null };
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

  // Get profile by invitation code or share code - SIMPLIFIED VERSION
  async getProfileByCode(code) {
    try {
      console.log('🔍 getProfileByCode called with:', code);
      
      if (!code || code.length !== 12) {
        return { data: null, error: 'Invalid code format. Code must be 12 characters.' };
      }
      
      // Try to find an invitation first (most common case)
      console.log('🔍 Looking for invitation with code:', code);
      const { data: invitation, error: invitationError } = await supabase
        .from('profile_invitations')
        .select('*')
        .eq('invitation_code', code)
        .eq('status', 'pending')
        .maybeSingle(); // Use maybeSingle to avoid errors if no results
      
      console.log('📧 Invitation lookup result:', { invitation, invitationError });
      
      if (invitation && !invitationError) {
        console.log('✅ Found invitation, getting profile details...');
        
        // Get profile details using invitation.profile_id
        const { data: profile, error: profileError } = await supabase
          .from('expense_profiles')
          .select('*')
          .eq('id', invitation.profile_id)
          .maybeSingle();
        
        if (profileError) {
          console.error('❌ Profile lookup error:', profileError);
          return { data: null, error: 'Failed to load profile details' };
        }
        
        if (!profile) {
          console.error('❌ No profile found for invitation');
          return { data: null, error: 'Profile not found' };
        }
        
        // Get user info
        const { data: user, error: userError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .eq('id', profile.user_id)
          .maybeSingle();
        
        console.log('👤 User lookup result:', { user, userError });
        
        // Return combined data
        const result = {
          ...profile,
          user_profiles: user || { 
            id: profile.user_id, 
            full_name: 'Profile Owner', 
            email: 'owner@example.com' 
          },
          invitation: invitation
        };
        
        console.log('✅ Successfully loaded profile with invitation:', result);
        return { data: result, error: null };
      }
      
      // If no invitation found, try profile share code
      console.log('🔄 No invitation found, trying profile share code...');
      
      const { data: profile, error: profileError } = await supabase
        .from('expense_profiles')
        .select('*')
        .eq('share_code', code)
        .eq('is_shared', true)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ Profile share code lookup error:', profileError);
        return { data: null, error: 'Failed to load profile' };
      }
      
      if (!profile) {
        console.error('❌ No profile found with share code:', code);
        return { data: null, error: 'Invalid code. Please check and try again.' };
      }
      
      // Get user info
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', profile.user_id)
        .maybeSingle();
      
      const result = {
        ...profile,
        user_profiles: user || { 
          id: profile.user_id, 
          full_name: 'Profile Owner', 
          email: 'owner@example.com' 
        }
      };
      
      console.log('✅ Successfully loaded profile with share code:', result);
      return { data: result, error: null };
      
    } catch (error) {
      console.error('💥 Exception in getProfileByCode:', error);
      return { data: null, error: 'Service error. Please try again.' };
    }
  },

  // Generate new 6-digit share code
  async generateNewShareCode(profileId) {
    try {
      // Generate a new 6-digit code
      const newShareCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { data, error } = await supabase
        .from('expense_profiles')
        .update({ share_code: newShareCode })
        .eq('id', profileId)
        .select('share_code')
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: { share_code: data.share_code }, error: null };
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
        // Generate 6-digit share code if not exists
        const { data: existingProfile } = await supabase
          .from('expense_profiles')
          .select('share_code')
          .eq('id', profileId)
          .single();
        
        if (!existingProfile?.share_code) {
          // Generate a new 6-digit share code
          const newShareCode = Math.floor(100000 + Math.random() * 900000).toString();
          updates.share_code = newShareCode;
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
  },

  // Ensure user profile exists before joining
  async ensureUserProfileExists(userId) {
    try {
      console.log('🔍 Ensuring user profile exists for:', userId);
      
      // Check if user profile exists
      const { data: userProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ Error checking user profile:', checkError);
        return { success: false, error: checkError.message };
      }
      
      if (userProfile) {
        console.log('✅ User profile already exists:', userProfile);
        return { success: true, data: userProfile };
      }
      
      // Get user data from auth
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      const userEmail = authUser.user.email || 'user@example.com';
      const userName = authUser.user.user_metadata?.full_name || 'User';
      
      console.log('➕ Creating user profile for:', { userId, userEmail, userName });
      
      // Create user profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: userEmail,
          full_name: userName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create user profile:', createError);
        return { success: false, error: createError.message };
      }
      
      console.log('✅ User profile created successfully:', newProfile);
      return { success: true, data: newProfile };
      
    } catch (error) {
      console.error('💥 Exception in ensureUserProfileExists:', error);
      return { success: false, error: error.message };
    }
  }
};
