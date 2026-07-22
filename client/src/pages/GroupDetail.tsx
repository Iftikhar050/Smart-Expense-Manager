import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Users, Calendar } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { Toast, useToast } from '../components/Toast';

export default function GroupDetail() {
  const { id } = useParams();
  const { userId: currentUserId } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [credentialsModal, setCredentialsModal] = useState<any | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupRes = await apiFetch(`/groups/${id}`);
      if (groupRes.ok) {
        setGroup(await groupRes.json());
      } else {
        showToast('Group not found', 'error');
        navigate('/groups');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load group data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName && !inviteEmail) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/groups/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole })
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.generatedCredential) {
          setCredentialsModal(result.generatedCredential);
        }
        setInviteName('');
        setInviteEmail('');
        setInviteRole('VIEWER');
        showToast('Member invited successfully', 'success');
        fetchGroupData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to invite member', 'error');
      }
    } catch (err) {
      showToast('Failed to invite member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await apiFetch(`/groups/${id}/members/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showToast('Role updated successfully', 'success');
        fetchGroupData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update role', 'error');
      }
    } catch (err) {
      showToast('Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await apiFetch(`/groups/${id}/members/${userId}`, { method: 'DELETE' });
      showToast('Member removed', 'success');
      if (userId === currentUserId) {
        navigate('/groups');
      } else {
        fetchGroupData();
      }
    } catch (err) {
      showToast('Failed to remove member', 'error');
    }
  };

  const getUserName = (userId: string) => {
    if (userId === currentUserId) return 'You';
    const member = group?.members?.find((m: any) => m.user_id === userId);
    return member ? member.user.name : 'Unknown';
  };

  if (loading) return <div className="text-center py-12">Loading group settings...</div>;
  if (!group) return null;

  const currentUserRole = group.members?.find((m: any) => m.user_id === currentUserId)?.role;
  const isAdmin = currentUserRole === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto">
      {credentialsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Member Invited!</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                We generated credentials for {credentialsModal.name}. Please share them securely.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</div>
                <code className="text-sm bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 block text-slate-800 dark:text-slate-200">{credentialsModal.email}</code>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Password</div>
                <code className="text-sm bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 block text-slate-800 dark:text-slate-200">{credentialsModal.password}</code>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setCredentialsModal(null)}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Link to="/groups" className="text-primary hover:underline flex items-center mb-2 font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to groups
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Created on {new Date(group.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-primary dark:text-sky-400" /> Members & Invites</h3>
        
        <ul className="space-y-4 mb-8">
          {group.members?.map((m: any) => (
            <li key={m.id} className="flex items-center justify-between group p-3 border border-slate-100 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-700/50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <Avatar name={getUserName(m.user_id)} size="lg" />
                <div className="flex flex-col">
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">{getUserName(m.user_id)}</span>
                  {m.user.email && <span className="text-xs text-slate-500 dark:text-slate-400">{m.user.email}</span>}
                  <span className="text-xs text-slate-400 dark:text-slate-500">Joined {new Date(m.joined_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isAdmin && m.user_id !== group.created_by && (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                    className="p-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                )}
                {!isAdmin && (
                  <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300 font-medium">
                    {m.role}
                  </span>
                )}
                {isAdmin && m.user_id === group.created_by && (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary dark:text-sky-400 rounded font-bold">
                    CREATOR
                  </span>
                )}
                {isAdmin && m.user_id !== currentUserId && m.user_id !== group.created_by && (
                  <button 
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition opacity-0 group-hover:opacity-100 p-2 rounded shadow-sm border border-transparent hover:border-red-100 dark:hover:border-slate-600"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        {isAdmin && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">Invite a new member</h4>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={inviteName} 
                  onChange={e => setInviteName(e.target.value)} 
                  placeholder="Name (Required)" 
                  required
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-sky-500 outline-none text-sm shadow-sm dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="email" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  placeholder="Email (Optional)" 
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-sky-500 outline-none text-sm shadow-sm dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full sm:w-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-sky-500 outline-none text-sm shadow-sm dark:bg-slate-700 dark:text-white"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button disabled={isSubmitting} type="submit" className="bg-primary dark:bg-sky-600 text-white px-6 py-3 rounded-md text-sm hover:bg-opacity-90 transition font-medium disabled:opacity-50 shadow-sm whitespace-nowrap">
                {isSubmitting ? 'Sending...' : 'Invite Member'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
