import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/common/Spinner';

const InstagramGradientIcon = () => (
  <svg viewBox="0 0 48 48" className="w-14 h-14 mx-auto" fill="none">
    <defs>
      <linearGradient id="ig-grad2" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#ig-grad2)" />
    <rect x="6" y="6" width="36" height="36" rx="9" fill="none" stroke="white" strokeWidth="2.5" />
    <circle cx="24" cy="24" r="9" fill="none" stroke="white" strokeWidth="2.5" />
    <circle cx="34.5" cy="13.5" r="2.5" fill="white" />
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', fullName: '', username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, fullName, username, password } = form;
    if (!email || !fullName || !username || !password) { setError('Please fill all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const { user, token } = await register(form);
      setAuth(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <InstagramGradientIcon />
          <h1 className="text-white text-2xl font-bold mt-4">Create your account</h1>
          <p className="text-neutral-400 text-sm mt-2">Sign up to see photos and videos from your friends.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(['email', 'fullName', 'username'] as const).map(k => (
            <input
              key={k}
              type={k === 'email' ? 'email' : 'text'}
              placeholder={k === 'fullName' ? 'Full name' : k.charAt(0).toUpperCase() + k.slice(1)}
              value={form[k]}
              onChange={set(k)}
              style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #363636', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          ))}
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={set('password')}
              style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #363636', borderRadius: 10, padding: '12px 44px 12px 16px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p style={{ color: '#ff6b6b', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#4B3FA7', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Spinner size="sm" /> : 'Sign up'}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-neutral-400 text-sm">Have an account?{' '}</span>
          <Link to="/login" className="text-[#a89cf0] text-sm font-semibold hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
