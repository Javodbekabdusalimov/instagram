import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/common/Spinner';

const COLLAGE = [
  { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=220&h=390&fit=crop&q=80', rotate: -6, x: -60, y: -20 },
  { src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=220&h=390&fit=crop&q=80', rotate: 4, x: 30, y: -40 },
  { src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=220&h=390&fit=crop&q=80', rotate: -2, x: -20, y: 30 },
  { src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=220&h=390&fit=crop&q=80', rotate: 8, x: 70, y: 10 },
  { src: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=220&h=390&fit=crop&q=80', rotate: -10, x: -80, y: 50 },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#1a1a1a',
  border: '1px solid #363636',
  borderRadius: 8,
  padding: '12px 16px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

function Input({ type = 'text', placeholder, value, onChange, rightEl }: {
  type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...inputStyle, border: `1px solid ${focused ? '#737373' : '#363636'}`, paddingRight: rightEl ? 44 : 16 }}
        className="placeholder-neutral-600"
      />
      {rightEl && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {rightEl}
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const { user, token } = await login(identifier.trim(), password);
      setAuth(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect username or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left — collage */}
        <div
          className="hidden lg:flex"
          style={{
            flex: 1, alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', padding: '60px 40px',
            background: 'linear-gradient(135deg, #0d0d0d 0%, #0a0a1a 100%)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Gradient blobs */}
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(131,58,180,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(253,29,29,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          {/* Instagram gradient icon */}
          <div style={{ marginBottom: 32, position: 'relative', zIndex: 1 }}>
            <svg viewBox="0 0 60 60" width={64} height={64} fill="none">
              <defs>
                <linearGradient id="ig-g" x1="0" y1="60" x2="60" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f09433" />
                  <stop offset="25%" stopColor="#e6683c" />
                  <stop offset="50%" stopColor="#dc2743" />
                  <stop offset="75%" stopColor="#cc2366" />
                  <stop offset="100%" stopColor="#bc1888" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="56" height="56" rx="14" fill="url(#ig-g)" />
              <rect x="8" y="8" width="44" height="44" rx="10" fill="none" stroke="white" strokeWidth="2.5" />
              <circle cx="30" cy="30" r="10.5" fill="none" stroke="white" strokeWidth="2.5" />
              <circle cx="42" cy="18" r="3" fill="white" />
            </svg>
          </div>

          {/* Headline */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 48, maxWidth: 480 }}>
            <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
              See everyday moments from your{' '}
              <span style={{ background: 'linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                close friends.
              </span>
            </h1>
          </div>

          {/* Photo collage */}
          <div style={{ position: 'relative', zIndex: 1, width: 320, height: 360 }}>
            {COLLAGE.map((item, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px)) rotate(${item.rotate}deg)`,
                  width: 110, borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                  border: '2px solid rgba(255,255,255,0.08)',
                }}
              >
                <img src={item.src} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
          <div style={{ width: '100%', maxWidth: 360 }}>

            {/* Mobile logo */}
            <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 28 }}>
              <svg viewBox="0 0 48 48" width={52} height={52} fill="none" style={{ margin: '0 auto' }}>
                <defs>
                  <linearGradient id="ig-m" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f09433" /><stop offset="50%" stopColor="#dc2743" /><stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="44" height="44" rx="11" fill="url(#ig-m)" />
                <rect x="7" y="7" width="34" height="34" rx="8" fill="none" stroke="white" strokeWidth="2.2" />
                <circle cx="24" cy="24" r="8.5" fill="none" stroke="white" strokeWidth="2.2" />
                <circle cx="33.5" cy="14.5" r="2.2" fill="white" />
              </svg>
            </div>

            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, marginBottom: 20, textAlign: 'left' }}>
              Log into Instagram
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input
                placeholder="Mobile number, username or email"
                value={identifier}
                onChange={setIdentifier}
              />
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={setPassword}
                rightEl={
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: '#aaa', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex' }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {error && <p style={{ color: '#ff6b6b', fontSize: 13, textAlign: 'center', margin: '2px 0' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading || !identifier || !password}
                style={{
                  width: '100%',
                  background: loading || !identifier || !password ? 'rgba(0,149,246,0.4)' : '#0095f6',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '12px 0', fontWeight: 700, fontSize: 14,
                  cursor: loading || !identifier || !password ? 'default' : 'pointer',
                  marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? <Spinner size="sm" /> : 'Log in'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '14px 0' }}>
              <button style={{ color: '#aaa', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
                Forgot password?
              </button>
            </div>

            {/* OR divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#363636' }} />
              <span style={{ color: '#737373', fontSize: 12, fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#363636' }} />
            </div>

            {/* Facebook */}
            <button style={{ width: '100%', background: 'none', border: '1px solid #363636', borderRadius: 8, padding: '11px 0', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Log in with Facebook
            </button>

            {/* Create account */}
            <Link to="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #363636', borderRadius: 8, padding: '11px 0', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box' }}>
              Create new account
            </Link>

            {/* Meta */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <svg viewBox="0 0 72 20" width={48} fill="#555" style={{ display: 'inline-block' }}>
                <text y="16" fontSize="16" fontFamily="sans-serif">∞ Meta</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 12px', marginBottom: 4 }}>
          {['Meta', 'About', 'Blog', 'Jobs', 'Help', 'API', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'].map(t => (
            <button key={t} style={{ color: '#555', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#444', fontSize: 11, margin: 0 }}>© 2026 Instagram from Meta</p>
      </div>
    </div>
  );
}
