import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, Eye, Bell, UserX, Shield, Info, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const sections = [
  {
    title: 'Account',
    items: [
      { icon: <Lock size={20} />, label: 'Password and security' },
      { icon: <Eye size={20} />, label: 'Account privacy' },
      { icon: <UserX size={20} />, label: 'Blocked accounts' },
      { icon: <Bell size={20} />, label: 'Notifications' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: <Shield size={20} />, label: 'Privacy policy' },
      { icon: <Info size={20} />, label: 'Terms of use' },
    ],
  },
];

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 0' }}>
      <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, padding: '8px 20px 16px', margin: 0 }}>Settings</h1>

      {sections.map(section => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <p style={{ color: '#737373', fontSize: 13, fontWeight: 600, padding: '4px 20px 8px', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {section.title}
          </p>
          <div style={{ borderTop: '1px solid #262626', borderBottom: '1px solid #262626' }}>
            {section.items.map((item, i) => (
              <button
                key={item.label}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '14px 20px',
                  backgroundColor: hoveredItem === item.label ? '#111' : 'transparent',
                  border: 'none', borderBottom: i < section.items.length - 1 ? '1px solid #1a1a1a' : 'none',
                  cursor: 'pointer', color: '#fff', textAlign: 'left',
                }}
              >
                <span style={{ color: '#737373' }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 15 }}>{item.label}</span>
                <ChevronRight size={18} color="#737373" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Log out */}
      <div style={{ borderTop: '1px solid #262626', borderBottom: '1px solid #262626' }}>
        <button
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#ff3b30', textAlign: 'left' }}
        >
          <LogOut size={20} />
          <span style={{ fontSize: 15 }}>Log out</span>
        </button>
      </div>
    </div>
  );
}
