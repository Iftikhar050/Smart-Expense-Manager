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
      await apiFetch(`/groups/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ name: inviteName, email: inviteEmail })
      });
      setInviteName('');
      setInviteEmail('');
      showToast('Member invited successfully', 'success');
      fetchGroupData();
    } catch (err) {
      showToast('Failed to invite member', 'error');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="max-w-4xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Link to="/groups" className="text-primary hover:underline flex items-center mb-2 font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to groups
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Created on {new Date(group.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-primary" /> Members & Invites</h3>
        
        <ul className="space-y-4 mb-8">
          {group.members?.map((m: any) => (
            <li key={m.id} className="flex items-center justify-between group p-3 border border-slate-100 rounded bg-slate-50">
              <div className="flex items-center gap-4">
                <Avatar name={getUserName(m.user_id)} size="lg" />
                <div className="flex flex-col">
                  <span className="text-slate-700 font-semibold">{getUserName(m.user_id)}</span>
                  {m.user.email && <span className="text-xs text-slate-500">{m.user.email}</span>}
                  <span className="text-xs text-slate-400">Joined {new Date(m.joined_at).toLocaleDateString()}</span>
                </div>
              </div>
              {m.user_id !== currentUserId && (
                <button 
                  onClick={() => handleRemoveMember(m.user_id)}
                  className="text-slate-400 hover:text-red-500 hover:bg-white transition opacity-0 group-hover:opacity-100 p-2 rounded shadow-sm border border-transparent hover:border-red-100"
                  title="Remove Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
        
        <div className="border-t border-slate-200 pt-6">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Invite a new member</h4>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input 
                type="text" 
                value={inviteName} 
                onChange={e => setInviteName(e.target.value)} 
                placeholder="Name (Required)" 
                required
                className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-accent outline-none text-sm shadow-sm"
              />
            </div>
            <div className="flex-1">
              <input 
                type="email" 
                value={inviteEmail} 
                onChange={e => setInviteEmail(e.target.value)} 
                placeholder="Email (Optional)" 
                className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-accent outline-none text-sm shadow-sm"
              />
            </div>
            <button disabled={isSubmitting} type="submit" className="bg-primary text-white px-6 py-3 rounded-md text-sm hover:bg-opacity-90 transition font-medium disabled:opacity-50 shadow-sm whitespace-nowrap">
              {isSubmitting ? 'Sending...' : 'Invite Member'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
