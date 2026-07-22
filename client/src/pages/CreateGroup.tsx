import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, X, User as UserIcon } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast, Toast } from '../components/Toast';
export default function CreateGroup() {
  const [name, setName] = useState('');
  const [members, setMembers] = useState([{ name: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const handleAddMember = () => {
    setMembers([...members, { name: '', email: '' }]);
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
          members: members.filter(m => m.name.trim() !== '')
        })
      });
      
      if (res.ok) {
        const group = await res.json();
        navigate(`/groups/${group.id}`);
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <h1 className="text-3xl font-bold text-primary mb-8 flex items-center">
        <Users className="w-8 h-8 mr-3 text-secondary" /> 
        Start a new group
      </h1>
      
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">My group shall be called...</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apartment, Trip to Hawaii, etc."
              className="w-full text-xl p-3 border rounded-lg focus:ring-2 focus:ring-accent outline-none"
            />
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-4 border-b pb-2">Group members</label>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <input type="text" disabled value="You" className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-500" />
                </div>
                <div className="flex-1">
                  <input type="email" disabled placeholder="Your email" className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-500" />
                </div>
                <div className="w-8"></div>
              </div>
              
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Name" 
                      value={member.name}
                      onChange={(e) => handleChange(idx, 'name', e.target.value)}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-accent outline-none" 
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="email" 
                      placeholder="Email address (optional)" 
                      value={member.email}
                      onChange={(e) => handleChange(idx, 'email', e.target.value)}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-accent outline-none" 
                    />
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
        </form>
      </div>
    </div>
  );
}
