import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';
import { profileSharingService } from '../../services/profileSharingService';

const ProfileSharingModal = ({ 
  isOpen = false, 
  profile = null, 
  onClose = () => {}, 
  onUpdate = () => {} 
}) => {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      loadProfileData();
    }
  }, [isOpen, profile]);

  const loadProfileData = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    try {
      const [membersResult, invitationsResult] = await Promise.all([
        profileSharingService.getProfileMembers(profile.id),
        profileSharingService.getProfileInvitations(profile.id)
      ]);
      
      if (membersResult.data) setMembers(membersResult.data);
      if (invitationsResult.data) setInvitations(invitationsResult.data);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !profile) return;
    
    setIsInviting(true);
    try {
      // For now, we'll store the invitation but focus on share links
      // Email sending requires Supabase Edge Functions setup
      const permissions = {
        view: true,
        edit: inviteRole === 'admin',
        delete: false,
        invite: inviteRole === 'admin'
      };
      
      const result = await profileSharingService.inviteUserToProfile(
        profile.id,
        inviteEmail.trim(),
        inviteRole,
        permissions,
        inviteMessage.trim()
      );
      
      if (result.error) {
        alert('Failed to send invitation: ' + result.error);
        return;
      }
      
      // Reset form and reload data
      setInviteEmail('');
      setInviteRole('member');
      setInviteMessage('');
      await loadProfileData();
      
      // Show success message with instructions
      alert(`Invitation sent successfully! 

An email has been sent to ${inviteEmail} with the invitation details.

The user can also join using the share code: ${profile.share_code}

Note: If the email doesn't arrive, check the spam folder or share the profile using the share link above.`);
    } catch (error) {
      alert('Failed to send invitation: ' + error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const result = await profileSharingService.removeMember(profile.id, memberId);
      if (result.error) {
        alert('Failed to remove member: ' + result.error);
        return;
      }
      
      await loadProfileData();
      alert('Member removed successfully');
    } catch (error) {
      alert('Failed to remove member: ' + error.message);
    }
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      const result = await profileSharingService.updateMemberRole(profile.id, memberId, newRole);
      if (result.error) {
        alert('Failed to update role: ' + result.error);
        return;
      }
      
      await loadProfileData();
    } catch (error) {
      alert('Failed to update role: ' + error.message);
    }
  };

  const handleCopyShareLink = () => {
    if (!profile?.share_code) return;
    
    const shareUrl = `${window.location.origin}/join-profile/${profile.share_code}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link. Please copy manually: ' + shareUrl);
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              Profile Sharing - {profile.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage members and invitations for this profile
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-card-foreground"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Share Link Section - Prominent Display */}
        {profile?.is_shared && profile?.share_code && (
          <div className="p-6 bg-accent/5 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">Share This Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Share Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={profile.share_code}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.share_code);
                        alert('Share code copied to clipboard!');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Copy Code
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Share Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={`${window.location.origin}/join-profile/${profile.share_code}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/join-profile/${profile.share_code}`);
                        alert('Share link copied to clipboard!');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground bg-background p-3 rounded-lg border">
                <strong>How to share:</strong> Send the share code or link to someone. They can join your profile by visiting the link or entering the code on the join profile page.
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'invitations'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Invitations ({invitations.length})
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'invite'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Invite New Member
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader" size={24} className="animate-spin text-accent" />
                <span className="ml-2 text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-card-foreground">Profile Members</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyShareLink}
                        iconName="Copy"
                        iconPosition="left"
                      >
                        Copy Share Link
                      </Button>
                    </div>
                    
                    {members.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No members yet. Invite people to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                                <Icon name="User" size={20} className="text-accent" />
                              </div>
                              <div>
                                <p className="font-medium text-card-foreground">
                                  {member.user?.full_name || 'Unknown User'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {member.user?.email}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(member.role)}`}>
                                    {member.role}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(member.status)}`}>
                                    {member.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {member.role !== 'owner' && (
                                <>
                                  <select
                                    value={member.role}
                                    onChange={(e) => handleUpdateMemberRole(member.user_id, e.target.value)}
                                    className="px-2 py-1 text-sm border border-border rounded bg-background"
                                  >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    iconName="Trash2"
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    Remove
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Invitations Tab */}
                {activeTab === 'invitations' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-card-foreground mb-2">Pending Invitations</h3>
                      <p className="text-sm text-muted-foreground">
                        Invitations that have been sent but not yet accepted
                      </p>
                    </div>
                    
                    {/* Invitations Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800">Email Invitations Sent</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            These invitations have been sent via email. Users can join using the email link or the share code above.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {invitations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon name="Mail" size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No pending invitations</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {invitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                                <Icon name="Mail" size={20} className="text-accent" />
                              </div>
                              <div>
                                <p className="font-medium text-card-foreground">
                                  {invitation.invited_email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Invited by {invitation.invited_by?.full_name || 'Unknown'}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                                    {invitation.role}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(invitation.status)}`}>
                                    {invitation.status}
                                  </span>
                                </div>
                                {invitation.message && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    "{invitation.message}"
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                              </p>
                              {invitation.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMember(invitation.id)}
                                  iconName="X"
                                  className="text-red-500 hover:text-red-700 mt-2"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Invite Tab */}
                {activeTab === 'invite' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-card-foreground mb-2">Invite New Member</h3>
                      <p className="text-sm text-muted-foreground">
                        Send an invitation to someone to join this profile
                      </p>
                    </div>
                    
                    {/* Email Invitation Notice */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Icon name="CheckCircle" size={20} className="text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-800">Email Invitations Enabled</h4>
                          <p className="text-sm text-green-700 mt-1">
                            Send email invitations to invite people to your profile. They'll receive a beautiful email with the share link and code.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Input
                        label="Email Address"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">
                          Role
                        </label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-accent"
                        >
                          <option value="member">Member - Can view and edit expenses</option>
                          <option value="admin">Admin - Can manage members and settings</option>
                        </select>
                      </div>
                      
                      <Input
                        label="Personal Message (Optional)"
                        type="text"
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        placeholder="Add a personal message to your invitation"
                      />
                      
                      <Button
                        onClick={handleInviteUser}
                        loading={isInviting}
                        disabled={!inviteEmail.trim()}
                        iconName="Send"
                        iconPosition="left"
                        className="w-full"
                      >
                        Send Email Invitation
                      </Button>
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Or share the profile using the share link above
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSharingModal;
