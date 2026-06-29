import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Play, X } from 'lucide-react';
import { getExplore } from '../api/posts';
import { searchUsers } from '../api/users';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/common/Spinner';
import Avatar from '../components/common/Avatar';
import PostCard from '../components/post/PostCard';
import type { Post, User } from '../types';

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const loadPosts = useCallback(async (p: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getExplore(p, 20);
      setPosts(prev => p === 1 ? res.posts : [...prev, ...res.posts]);
      setHasMore(res.hasMore);
    } catch {}
    finally { setLoading(false); }
  }, [loading]);

  useEffect(() => { loadPosts(1); }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const next = page + 1;
        setPage(next);
        loadPosts(next);
      }
    });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, page]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try { setSearchResults(await searchUsers(val)); }
      catch {}
      finally { setSearchLoading(false); }
    }, 400);
  };

  const showDropdown = inputFocused && query && (searchLoading || searchResults.length > 0);

  return (
    <div style={{ maxWidth: 935, margin: '0 auto', padding: '12px 0 40px' }}>
      {/* Search bar */}
      <div style={{ padding: '4px 16px 12px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#737373', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)}
            placeholder="Search"
            style={{
              width: '100%', backgroundColor: '#262626', border: 'none',
              borderRadius: 10, paddingLeft: 36, paddingRight: query ? 36 : 14,
              paddingTop: 9, paddingBottom: 9,
              color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSearchResults([]); }}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {showDropdown && (
          <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, backgroundColor: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 30, overflow: 'hidden' }}>
            {searchLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner size="sm" /></div>
            ) : searchResults.length === 0 ? (
              <p style={{ color: '#737373', fontSize: 14, padding: '14px 16px', margin: 0 }}>No results for "{query}"</p>
            ) : (
              searchResults.map(u => (
                <button
                  key={u._id}
                  onClick={() => { navigate(`/${u.username}`); setQuery(''); setSearchResults([]); }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#262626')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid #1f1f1f' }}
                >
                  <Avatar src={u.avatar} alt={u.username} size="sm" />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>{u.username}</p>
                    <p style={{ color: '#737373', fontSize: 12, margin: 0 }}>{u.fullName}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, padding: '0 0' }}>
        {posts.map((post, idx) => {
          const isLarge = idx % 7 === 0;
          return (
            <div
              key={post._id}
              style={{
                position: 'relative', backgroundColor: '#1a1a1a', cursor: 'pointer',
                overflow: 'hidden', aspectRatio: '1',
                gridColumn: isLarge ? 'span 2' : undefined,
                gridRow: isLarge ? 'span 2' : undefined,
              }}
              onClick={() => setSelectedPost(post)}
              onMouseEnter={e => { (e.currentTarget.querySelector('.exp-overlay') as HTMLElement)!.style.opacity = '1'; }}
              onMouseLeave={e => { (e.currentTarget.querySelector('.exp-overlay') as HTMLElement)!.style.opacity = '0'; }}
            >
              {post.media[0]?.type === 'video' ? (
                <video src={post.media[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              ) : (
                <img src={post.media[0]?.url} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
              )}
              {post.media[0]?.type === 'video' && (
                <Play size={20} style={{ position: 'absolute', top: 8, right: 8, color: '#fff', fill: '#fff' }} />
              )}
              {post.media.length > 1 && (
                <div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 2 }}>
                  <svg viewBox="0 0 20 20" fill="white" width={16} height={16}>
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                  </svg>
                </div>
              )}
              <div className="exp-overlay" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700, fontSize: 15 }}>
                  <svg viewBox="0 0 24 24" fill="white" width={20} height={20}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  {post.likesCount}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700, fontSize: 15 }}>
                  <svg viewBox="0 0 24 24" fill="white" width={20} height={20}><path d="M21 6.5C21 5.12 19.88 4 18.5 4h-13C4.12 4 3 5.12 3 6.5v8C3 15.88 4.12 17 5.5 17H7v3.5l3.5-3.5H18.5c1.38 0 2.5-1.12 2.5-2.5v-8z"/></svg>
                  {post.commentsCount}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>}
      <div ref={sentinelRef} style={{ height: 8 }} />

      {/* Post detail modal */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <button
            onClick={() => setSelectedPost(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', zIndex: 51 }}
          >
            <X size={28} />
          </button>
          <div style={{ width: '100%', maxWidth: 470, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <PostCard
              post={selectedPost}
              onDelete={id => { setPosts(ps => ps.filter(p => p._id !== id)); setSelectedPost(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
