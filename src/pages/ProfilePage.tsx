import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Grid3X3, Bookmark, UserRound, Camera, Plus, X } from 'lucide-react';
import { getUserByUsername, getFollowers, getFollowing } from '../api/users';
import { getUserPosts, getSavedPosts } from '../api/posts';
import { toggleFollow, updateProfile } from '../api/users';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import type { User, Post } from '../types';
import { getFollowersCount, getFollowingCount } from '../types';

type Tab = 'posts' | 'saved' | 'tagged';

interface Highlight {
  id: string;
  name: string;
  cover: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('posts');
  const [following, setFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showNewHighlight, setShowNewHighlight] = useState(false);

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getUserByUsername(username)
      .then(p => { setProfile(p); setFollowing(p.isFollowing || false); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    try {
      const saved = localStorage.getItem(`highlights_${profile._id}`);
      if (saved) setHighlights(JSON.parse(saved));
    } catch {}
  }, [profile?._id]);

  useEffect(() => {
    if (!profile) return;
    setPostsLoading(true);
    const load = tab === 'saved' && isOwn
      ? getSavedPosts().then(data => Array.isArray(data) ? data : [])
      : getUserPosts(profile._id).then(res => res.posts ?? []);
    load.then(setPosts).catch(() => {}).finally(() => setPostsLoading(false));
  }, [profile, tab]);

  const handleFollow = async () => {
    if (!profile) return;
    const prev = following;
    const prevFc = getFollowersCount(profile);
    setFollowing(!prev);
    setProfile(p => p ? {
      ...p,
      followersCount: prev ? prevFc - 1 : prevFc + 1,
      followers: prev
        ? (p.followers ?? []).filter(id => id !== currentUser?._id)
        : [...(p.followers ?? []), currentUser?._id ?? ''],
    } : p);
    try { await toggleFollow(profile._id); }
    catch {
      setFollowing(prev);
      setProfile(p => p ? { ...p, followersCount: prevFc, followers: profile.followers } : p);
    }
  };

  const saveHighlight = (h: Highlight) => {
    if (!profile) return;
    const updated = [...highlights, h];
    setHighlights(updated);
    localStorage.setItem(`highlights_${profile._id}`, JSON.stringify(updated));
    setShowNewHighlight(false);
  };

  const deleteHighlight = (id: string) => {
    if (!profile) return;
    const updated = highlights.filter(h => h.id !== id);
    setHighlights(updated);
    localStorage.setItem(`highlights_${profile._id}`, JSON.stringify(updated));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spinner /></div>;
  if (!profile) return null;

  return (
    <div style={{ maxWidth: 935, margin: '0 auto', padding: '30px 20px 40px' }}>
      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, marginBottom: 28 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={profile.avatar} alt={profile.username} size="xl" />
          {isOwn && (
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                position: 'absolute', bottom: 2, right: 2,
                background: '#262626', border: '2px solid #000',
                borderRadius: '50%', padding: 5, cursor: 'pointer',
                display: 'flex', color: '#fff',
              }}
            >
              <Camera size={12} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Username + buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 300, margin: 0 }}>{profile.username}</h1>
            {profile.isVerified && (
              <svg viewBox="0 0 40 40" width={18} height={18} fill="#3b82f6">
                <path d="M19.998 3.094L14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v6.354h6.234L14.638 40l5.36-3.094L25.358 40l2.972-5.15h6.234v-6.354L40 25.359 36.906 20 40 14.641l-5.432-3.137V4.95h-6.234z"/>
              </svg>
            )}

            {isOwn ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowEditModal(true)} style={{ backgroundColor: '#262626', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Edit profile
                </button>
                <button style={{ backgroundColor: '#262626', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  View archive
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleFollow} style={{ backgroundColor: following ? '#262626' : '#0095f6', color: '#fff', border: 'none', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {following ? 'Following' : 'Follow'}
                </button>
                <button onClick={() => navigate('/messages', { state: { userId: profile._id } })} style={{ backgroundColor: '#262626', color: '#fff', border: 'none', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Message
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, marginBottom: 16 }}>
            <div>
              <span style={{ color: '#fff', fontWeight: 700 }}>{profile.postsCount ?? posts.length}</span>
              <span style={{ color: '#fff', fontSize: 14 }}> posts</span>
            </div>
            <button onClick={() => setShowFollowersModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}>
              <span style={{ color: '#fff', fontWeight: 700 }}>{getFollowersCount(profile)}</span>
              <span style={{ color: '#fff', fontSize: 14 }}> followers</span>
            </button>
            <button onClick={() => setShowFollowingModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ color: '#fff', fontWeight: 700 }}>{getFollowingCount(profile)}</span>
              <span style={{ color: '#fff', fontSize: 14 }}> following</span>
            </button>
          </div>

          {/* Bio */}
          <div>
            {profile.fullName && <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}>{profile.fullName}</p>}
            {profile.bio && <p style={{ color: '#fff', fontSize: 14, whiteSpace: 'pre-wrap', margin: '0 0 2px' }}>{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#0095f6', fontSize: 14 }}>
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Story Highlights */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {/* New highlight button (own profile) */}
        {isOwn && (
          <button onClick={() => setShowNewHighlight(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '1px dashed #555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={24} color="#fff" />
            </div>
            <span style={{ color: '#fff', fontSize: 12 }}>New</span>
          </button>
        )}

        {/* Existing highlights */}
        {highlights.map(h => (
          <div key={h.id} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => {}}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid #333', overflow: 'hidden' }}>
                {h.cover ? (
                  <img src={h.cover} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#333' }} />
                )}
              </div>
              <span style={{ color: '#fff', fontSize: 12, maxWidth: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
            </button>
            {isOwn && (
              <button
                onClick={() => deleteHighlight(h.id)}
                style={{ position: 'absolute', top: -2, right: -2, background: '#262626', border: '1px solid #444', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              >
                <X size={10} color="#fff" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderTop: '1px solid #262626' }}>
        {[
          { key: 'posts' as Tab, icon: <Grid3X3 size={16} />, label: 'POSTS' },
          ...(isOwn ? [{ key: 'saved' as Tab, icon: <Bookmark size={16} />, label: 'SAVED' }] : []),
          { key: 'tagged' as Tab, icon: <UserRound size={16} />, label: 'TAGGED' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              flex: 1, padding: '12px 0',
              borderTop: tab === t.key ? '1px solid #fff' : '1px solid transparent',
              color: tab === t.key ? '#fff' : '#737373',
              background: 'none', border: 'none',
              borderTopWidth: 1, borderTopStyle: 'solid',
              borderTopColor: tab === t.key ? '#fff' : 'transparent',
              cursor: 'pointer',
              fontSize: 11, fontWeight: 600, letterSpacing: 1,
            }}
          >
            {t.icon}
            <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {postsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner /></div>
      ) : posts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 16 }}>
          <div style={{ width: 62, height: 62, borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={28} color="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Share photos</h3>
            <p style={{ color: '#737373', fontSize: 14, margin: 0 }}>When you share photos, they will appear on your profile.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginTop: 3 }}>
          {posts.map(post => (
            <div
              key={post._id}
              style={{ position: 'relative', aspectRatio: '1', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => setSelectedPost(post)}
              onMouseEnter={e => { (e.currentTarget.querySelector('.overlay') as HTMLElement)!.style.opacity = '1'; }}
              onMouseLeave={e => { (e.currentTarget.querySelector('.overlay') as HTMLElement)!.style.opacity = '0'; }}
            >
              {post.media[0]?.type === 'video' ? (
                <video src={post.media[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              ) : (
                <img src={post.media[0]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
              )}
              <div className="overlay" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700 }}>
                  <span>♥</span> {post.likesCount}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700 }}>
                  <span>💬</span> {post.commentsCount}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post detail viewer */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedPost(null)}>
          <button style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', zIndex: 1 }} onClick={() => setSelectedPost(null)}>
            <X size={28} />
          </button>
          <div style={{ maxWidth: 600, width: '100%', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            {selectedPost.media[0]?.type === 'video' ? (
              <video src={selectedPost.media[0].url} controls style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            ) : (
              <img src={selectedPost.media[0]?.url} alt="" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            )}
          </div>
        </div>
      )}

      {/* Followers Modal */}
      <FollowListModal
        userId={profile._id}
        type="followers"
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
      />

      {/* Following Modal */}
      <FollowListModal
        userId={profile._id}
        type="following"
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
      />

      {/* New Highlight Modal */}
      {showNewHighlight && (
        <NewHighlightModal
          posts={posts}
          onSave={saveHighlight}
          onClose={() => setShowNewHighlight(false)}
        />
      )}

      {/* Edit profile modal */}
      {isOwn && <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} user={currentUser!} onUpdate={u => { updateUser(u); setProfile(u); }} />}
    </div>
  );
}

/* ─── Followers / Following list modal ─── */
function FollowListModal({ userId, type, isOpen, onClose }: { userId: string; type: 'followers' | 'following'; isOpen: boolean; onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const fn = type === 'followers' ? getFollowers : getFollowing;
    fn(userId).then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, [isOpen, userId, type]);

  useEffect(() => { if (!isOpen) setUsers([]); }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'followers' ? 'Followers' : 'Following'} maxWidth="max-w-sm">
      <div style={{ maxHeight: 440, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : users.length === 0 ? (
          <p style={{ color: '#737373', textAlign: 'center', padding: 32, fontSize: 14 }}>No {type} yet</p>
        ) : (
          users.map(u => (
            <Link key={u._id} to={`/${u.username}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Avatar src={u.avatar} alt={u.username} size="sm" />
              <div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>{u.username}</p>
                {u.fullName && <p style={{ color: '#737373', fontSize: 12, margin: 0 }}>{u.fullName}</p>}
              </div>
            </Link>
          ))
        )}
      </div>
    </Modal>
  );
}

/* ─── New Highlight Modal ─── */
function NewHighlightModal({ posts, onSave, onClose }: { posts: Post[]; onSave: (h: { id: string; name: string; cover: string }) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [cover, setCover] = useState('');

  return (
    <Modal isOpen={true} onClose={onClose} title="New Highlight" maxWidth="max-w-sm">
      <div style={{ padding: 16 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Highlight name"
          style={{ width: '100%', background: '#262626', border: '1px solid #363636', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />

        {posts.length > 0 && (
          <>
            <p style={{ color: '#737373', fontSize: 12, marginBottom: 8 }}>Select cover from your posts:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
              {posts.map(p => (
                <div
                  key={p._id}
                  onClick={() => setCover(p.media[0]?.url || '')}
                  style={{ aspectRatio: '1', cursor: 'pointer', borderRadius: 4, overflow: 'hidden', border: cover === p.media[0]?.url ? '2px solid #0095f6' : '2px solid transparent' }}
                >
                  <img src={p.media[0]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => name.trim() && onSave({ id: Date.now().toString(), name: name.trim(), cover })}
          disabled={!name.trim()}
          style={{ width: '100%', backgroundColor: name.trim() ? '#0095f6' : '#0095f680', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 14, cursor: name.trim() ? 'pointer' : 'default' }}
        >
          Add
        </button>
      </div>
    </Modal>
  );
}

/* ─── Edit Profile Modal ─── */
function EditProfileModal({ isOpen, onClose, user, onUpdate }: { isOpen: boolean; onClose: () => void; user: User; onUpdate: (u: User) => void }) {
  const [form, setForm] = useState({ fullName: user.fullName, bio: user.bio || '', website: user.website || '' });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState(user.avatar || '');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setAvatar(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName);
      fd.append('bio', form.bio);
      fd.append('website', form.website);
      if (avatar) fd.append('avatar', avatar);
      const updated = await updateProfile(fd);
      onUpdate(updated);
      onClose();
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
            <Avatar src={preview} alt={user.username} size="xl" />
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={20} color="#fff" />
            </div>
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} style={{ color: '#0095f6', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            Change photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {[
          { label: 'Full name', key: 'fullName', type: 'text' },
          { label: 'Bio', key: 'bio', type: 'textarea' },
          { label: 'Website', key: 'website', type: 'url' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label style={{ color: '#737373', fontSize: 13, display: 'block', marginBottom: 4 }}>{label}</label>
            {type === 'textarea' ? (
              <textarea
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                rows={3}
                style={{ width: '100%', background: '#262626', border: '1px solid #363636', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
            ) : (
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', background: '#262626', border: '1px solid #363636', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', backgroundColor: '#0095f6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? <Spinner size="sm" /> : 'Save changes'}
        </button>
      </form>
    </Modal>
  );
}
