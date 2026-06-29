import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNotifications, markAllRead, deleteNotification } from '../api/notifications';
import { toggleFollow } from '../api/users';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import TimeAgo from '../components/common/TimeAgo';
import type { Notification } from '../types';

function groupNotifications(notifications: Notification[]) {
  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  const month = 30 * 24 * 3600 * 1000;
  const thisWeek: Notification[] = [];
  const thisMonth: Notification[] = [];
  const earlier: Notification[] = [];
  notifications.forEach(n => {
    const age = now - new Date(n.createdAt).getTime();
    if (age < week) thisWeek.push(n);
    else if (age < month) thisMonth.push(n);
    else earlier.push(n);
  });
  return { thisWeek, thisMonth, earlier };
}

type FilterTab = 'All' | 'People you follow' | 'Comments' | 'Follows';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [hoveredNotif, setHoveredNotif] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getNotifications()
      .then(ns => {
        setNotifications(ns);
        const map: Record<string, boolean> = {};
        ns.forEach(n => {
          if (n.type === 'follow') map[n.actor._id] = n.actor.isFollowing || false;
        });
        setFollowing(map);
        markAllRead().catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    setNotifications(ns => ns.filter(n => n._id !== id));
    try { await deleteNotification(id); } catch {}
  };

  const handleFollow = async (userId: string) => {
    const prev = following[userId];
    setFollowing(f => ({ ...f, [userId]: !prev }));
    try { await toggleFollow(userId); }
    catch { setFollowing(f => ({ ...f, [userId]: prev })); }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Comments') return n.type === 'comment' || n.type === 'mention';
    if (activeTab === 'Follows') return n.type === 'follow';
    return true;
  });

  const { thisWeek, thisMonth, earlier } = groupNotifications(filtered);

  const tabs: FilterTab[] = ['All', 'People you follow', 'Comments', 'Follows'];

  const renderNotif = (n: Notification) => (
    <div
      key={n._id}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        backgroundColor: hoveredNotif === n._id ? '#0a0a0a' : 'transparent',
        position: 'relative',
      }}
      onMouseEnter={() => setHoveredNotif(n._id)}
      onMouseLeave={() => setHoveredNotif(null)}
    >
      <Link to={`/${n.actor.username}`} style={{ flexShrink: 0 }}>
        <Avatar src={n.actor.avatar} alt={n.actor.username} size="md" />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#fff', fontSize: 14, margin: 0, lineHeight: 1.4 }}>
          <Link to={`/${n.actor.username}`} style={{ fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
            {n.actor.username}
          </Link>{' '}
          {n.type === 'like' && 'liked your photo.'}
          {n.type === 'comment' && `commented: "${n.comment}"`}
          {n.type === 'follow' && 'started following you.'}
          {n.type === 'mention' && 'mentioned you in a comment.'}
          {n.type === 'reply' && 'replied to your comment.'}
          {' '}
          <span style={{ color: '#737373', fontSize: 12 }}>
            <TimeAgo date={n.createdAt} />
          </span>
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {n.post && (
          <img src={n.post.media[0]?.url} alt="post" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
        )}
        {n.type === 'follow' && (
          <button
            onClick={() => handleFollow(n.actor._id)}
            style={{
              backgroundColor: following[n.actor._id] ? '#262626' : '#0095f6',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 16px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {following[n.actor._id] ? 'Following' : 'Follow Back'}
          </button>
        )}
        {hoveredNotif === n._id && (
          <button
            onClick={() => handleDelete(n._id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex', padding: 4 }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spinner /></div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 8, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 8px' }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Notifications</h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px 12px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flexShrink: 0, padding: '6px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500,
              backgroundColor: activeTab === tab ? '#fff' : 'transparent',
              color: activeTab === tab ? '#000' : '#fff',
              border: `1px solid ${activeTab === tab ? '#fff' : '#363636'}`,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', color: '#737373' }}>
          <p style={{ fontSize: 14 }}>No notifications yet</p>
        </div>
      ) : (
        <>
          {thisWeek.length > 0 && (
            <section>
              <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, padding: '8px 16px 4px', margin: 0 }}>This week</h2>
              {thisWeek.map(renderNotif)}
            </section>
          )}
          {thisMonth.length > 0 && (
            <section style={{ marginTop: 8 }}>
              <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, padding: '8px 16px 4px', margin: 0 }}>This month</h2>
              {thisMonth.map(renderNotif)}
            </section>
          )}
          {earlier.length > 0 && (
            <section style={{ marginTop: 8 }}>
              <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, padding: '8px 16px 4px', margin: 0 }}>Earlier</h2>
              {earlier.map(renderNotif)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
