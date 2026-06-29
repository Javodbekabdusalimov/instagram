import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Search, Compass, Film, Send, Heart, PlusSquare,
  Menu, LogOut, Settings, Bookmark, Activity, Moon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';

const IgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width={26} height={26} stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

interface SidebarProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  onCreatePost?: () => void;
}

export default function Sidebar({ unreadNotifications = 0, unreadMessages = 0, onCreatePost }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { id: 'home', label: 'Home', Icon: Home, path: '/' },
    { id: 'search', label: 'Search', Icon: Search, path: '/explore' },
    { id: 'explore', label: 'Explore', Icon: Compass, path: '/explore' },
    { id: 'reels', label: 'Reels', Icon: Film, path: '/reels' },
    { id: 'messages', label: 'Messages', Icon: Send, path: '/messages', badge: unreadMessages },
    {
      id: 'notifications', label: 'Notifications', Icon: Heart, path: '/notifications',
      badge: unreadNotifications,
    },
    { id: 'create', label: 'Create', Icon: PlusSquare, action: onCreatePost },
  ];

  const itemBg = (id: string) => hoveredId === id ? '#1a1a1a' : 'transparent';

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex"
        style={{
          position: 'fixed', left: 0, top: 0, height: '100vh', width: 245,
          backgroundColor: '#000', borderRight: '1px solid #262626',
          zIndex: 40, flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '8px 12px 16px' }}>
          {/* Logo */}
          <Link
            to="/"
            onMouseEnter={() => setHoveredId('logo')}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 12px', marginBottom: 8,
              borderRadius: 12,
              backgroundColor: itemBg('logo'),
              textDecoration: 'none',
              transition: 'background-color 0.15s',
            }}
          >
            <IgIcon />
            <span style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 28, color: '#fff', lineHeight: 1,
              fontWeight: 700,
            }}>
              Instagram
            </span>
          </Link>

          {/* Nav items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {navItems.map(({ id, label, Icon, path, badge, action }) => {
              const active = !!path && isActive(path);
              const fillable = id === 'home' || id === 'notifications';
              return (
                <button
                  key={id}
                  onClick={() => (action ? action() : path && navigate(path))}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '12px 12px', borderRadius: 12,
                    backgroundColor: itemBg(id),
                    color: '#fff', border: 'none', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <span style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
                    <Icon
                      size={24}
                      strokeWidth={active ? 2.5 : 1.5}
                      fill={fillable && active ? 'white' : 'none'}
                    />
                    {!!badge && badge > 0 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -5,
                        backgroundColor: '#e0143c', color: '#fff',
                        borderRadius: 99, fontSize: 9, fontWeight: 700,
                        minWidth: 14, height: 14, padding: '0 3px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: active ? 700 : 400 }}>{label}</span>
                </button>
              );
            })}

            {/* Profile */}
            <Link
              to={`/${user?.username}`}
              onMouseEnter={() => setHoveredId('profile')}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 12px', borderRadius: 12,
                backgroundColor: itemBg('profile'),
                color: '#fff', textDecoration: 'none',
                transition: 'background-color 0.15s',
              }}
            >
              <Avatar src={user?.avatar} alt={user?.username} size="sm" />
              <span style={{
                fontSize: 15,
                fontWeight: isActive(`/${user?.username}`) ? 700 : 400,
              }}>
                Profile
              </span>
            </Link>
          </div>

          {/* More */}
          <button
            onClick={() => setShowMenu(true)}
            onMouseEnter={() => setHoveredId('more')}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 12px', borderRadius: 12,
              backgroundColor: itemBg('more'),
              color: '#fff', border: 'none', cursor: 'pointer',
              width: '100%', textAlign: 'left', marginTop: 4,
              transition: 'background-color 0.15s',
            }}
          >
            <Menu size={24} strokeWidth={1.5} />
            <span style={{ fontSize: 15 }}>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav — className controls display, no display in style */}
      <nav
        className="md:hidden flex items-center justify-around"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          padding: '6px 0',
          backgroundColor: '#000', borderTop: '1px solid #262626',
        }}
      >
        <Link to="/" style={{ padding: 8, color: '#fff', display: 'flex' }}>
          <Home size={24} strokeWidth={isActive('/') ? 2.5 : 1.5} fill={isActive('/') ? 'white' : 'none'} />
        </Link>
        <Link to="/explore" style={{ padding: 8, color: '#fff', display: 'flex' }}>
          <Search size={24} strokeWidth={1.5} />
        </Link>
        <button
          onClick={onCreatePost}
          style={{ padding: 8, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
        >
          <PlusSquare size={24} strokeWidth={1.5} />
        </button>
        <Link to="/reels" style={{ padding: 8, color: '#fff', display: 'flex' }}>
          <Film size={24} strokeWidth={1.5} />
        </Link>
        <Link to={`/${user?.username}`} style={{ padding: 8, display: 'flex' }}>
          <Avatar src={user?.avatar} alt={user?.username} size="xs" />
        </Link>
      </nav>

      {/* More menu */}
      <Modal isOpen={showMenu} onClose={() => setShowMenu(false)} maxWidth="max-w-xs">
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          {[
            { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
            { icon: <Activity size={20} />, label: 'Your activity', path: `/${user?.username}` },
            { icon: <Bookmark size={20} />, label: 'Saved', path: `/${user?.username}` },
            { icon: <Moon size={20} />, label: 'Switch appearance', path: null },
          ].map(item => (
            <button
              key={item.label}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { setShowMenu(false); if (item.path) navigate(item.path); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                width: '100%', padding: '14px 20px',
                color: '#fff', fontSize: 14,
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid #262626', margin: '4px 0' }} />
          <button
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              width: '100%', padding: '14px 20px',
              color: '#fff', fontSize: 14,
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            <LogOut size={20} />
            Log out
          </button>
        </div>
      </Modal>
    </>
  );
}
