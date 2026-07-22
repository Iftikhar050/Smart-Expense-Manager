import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, X, User as UserIcon } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast, Toast } from '../components/Toast';
export default function CreateGroup() {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [members, setMembers] = useState([{ name: '', email: '', role: 'VIEWER' }]);
  const [credentialsModal, setCredentialsModal] = useState<any[] | null>(null);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const handleAddMember = () => {
    setMembers([...members, { name: '', email: '', role: 'VIEWER' }]);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    setLoading(true);
    
    try {
      const res = await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify({
          name,
          budget: budget ? parseFloat(budget) : 0,
          members: members.filter(m => m.name.trim() !== '')
        })
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.generatedCredentials && result.generatedCredentials.length > 0) {
          setCredentialsModal(result.generatedCredentials);
          setCreatedGroupId(result.id);
        } else {
          navigate(`/groups/${result.id}`);
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create group', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {credentialsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                🎉 Group Created Successfully!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                We've automatically generated credentials for your invited members. Please copy these now and share them securely. They won't be shown again.
              </p>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {credentialsModal.map((cred, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md p-4">
                  <div className="font-bold text-slate-800 dark:text-slate-100 mb-2">{cred.name}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</div>
                      <code className="text-sm bg-white dark:bg-slate-800 px-2 py-1 rounded border dark:border-slate-600 block">{cred.email}</code>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Password</div>
                      <code className="text-sm bg-white dark:bg-slate-800 px-2 py-1 rounded border dark:border-slate-600 block">{cred.password}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => navigate(`/groups/${createdGroupId}`)}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-600 transition"
              >
                Go to Group
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <h2 className="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-100 flex items-center">
        <Users className="w-8 h-8 mr-3 text-secondary" /> 
        Start a new group
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200 space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Summer Trip 2026" 
              required
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary outline-none transition dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Budget (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-500 font-bold">$</span>
              </div>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={budget} 
                onChange={e => setBudget(e.target.value)} 
                placeholder="0.00" 
                className="w-full pl-8 p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary outline-none transition dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Group members</label>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <input type="text" disabled value="You" className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1">
                  <input type="email" disabled placeholder="Your email" className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400" />
                </div>
                <div className="w-8"></div>
              </div>
              
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Name (Required)" 
                      value={member.name}
                      onChange={(e) => handleChange(idx, 'name', e.target.value)}
                      required
                      className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-secondary outline-none shadow-sm dark:bg-slate-700 dark:text-white" 
                    />
                    <input 
                      type="email" 
                      placeholder="Email (Optional)" 
                      value={member.email}
                      onChange={(e) => handleChange(idx, 'email', e.target.value)}
                      className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-secondary outline-none shadow-sm dark:bg-slate-700 dark:text-white" 
                    />
                    <select
                      value={member.role}
                      onChange={(e) => handleChange(idx, 'role', e.target.value)}
                      className="w-32 p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-secondary outline-none shadow-sm dark:bg-slate-700 dark:text-white"
                    >
                      <option value="VIEWER">View Only</option>
                      <option value="EDITOR">Editor</option>
                    </select>
                  </div>
                  <div className="w-8 flex justify-center">
                    {members.length > 1 && (
                      <button type="button" onClick={() => handleRemoveMember(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              onClick={handleAddMember}
              className="mt-4 flex items-center text-accent font-medium hover:text-accent/80 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Add a person
            </button>
          </div>
          
          <div className="pt-4 border-t">
            <button 
              type="submit" 
              disabled={loading || !name}
              className="bg-secondary text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
