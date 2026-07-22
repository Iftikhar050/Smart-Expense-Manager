import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useToast, Toast } from '../components/Toast';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const body = isRegister ? { name, email, password } : { email, password };
    
    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
        redirectOn401: false
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/groups';
      } else {
        showToast(data.error || 'Authentication failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-200">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">
        {isRegister ? 'Join FairShare' : 'Welcome to FairShare'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded focus:ring-2 focus:ring-accent outline-none" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded focus:ring-2 focus:ring-accent outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded focus:ring-2 focus:ring-accent outline-none" />
        </div>
        <button type="submit" className="w-full bg-primary text-white py-2 rounded font-medium hover:bg-opacity-90 transition">
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button onClick={() => setIsRegister(!isRegister)} className="text-secondary text-sm hover:underline">
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
