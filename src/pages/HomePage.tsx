import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getFeed, getExplore } from '../api/posts';
import { getSuggestions, toggleFollow } from '../api/users';
import { useAuthStore } from '../store/authStore';
import PostCard from '../components/post/PostCard';
import StoriesBar from '../components/stories/StoriesBar';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import type { Post, User } from '../types';

export default function HomePage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedPosts, setSuggestedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadPosts = useCallback(async (p: number, replace = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await getFeed(p);
      const items = res.posts;
      if (replace) setPosts(items);
      else setPosts(prev => [...prev, ...items]);
      setHasMore(res.hasMore);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPosts(1, true);
  }, []);

  /* When feed is empty after first load, fetch explore posts to show something */
  useEffect(() => {
    if (!initialLoaded) return;
    if (posts.length > 0) return;
    getExplore(1, 12)
      .then(r => setSuggestedPosts(r.posts))
      .catch(() => {});
  }, [initialLoaded, posts.length]);

  useEffect(() => {
    getSuggestions()
      .then(s => {
        setSuggestions(s.slice(0, 5));
        const map: Record<string, boolean> = {};
        (s as User[]).forEach(u => { map[u._id] = u.isFollowing ?? false; });
        setFollowing(map);
      })
      .catch(() => {});
  }, []);

  /* Infinite scroll */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        const next = page + 1;
        setPage(next);
        loadPosts(next);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, page, loadPosts]);

  const handleFollow = async (userId: string) => {
    const prev = following[userId];
    setFollowing(f => ({ ...f, [userId]: !prev }));
    try { await toggleFollow(userId); }
    catch { setFollowing(f => ({ ...f, [userId]: prev })); }
  };

  const isFeedEmpty = initialLoaded && posts.length === 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Feed column */}
      <div style={{ flex: 1, maxWidth: 470, margin: '0 auto' }}>
        <StoriesBar />

        {/* Real feed posts */}
        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onDelete={id => setPosts(ps => ps.filter(p => p._id !== id))}
          />
        ))}

        {/* Empty feed state — show suggested/explore posts */}
        {isFeedEmpty && (
          <>
            <div style={{
              padding: '16px 16px 8px',
              borderBottom: '1px solid #262626',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#737373', fontSize: 14, fontWeight: 600 }}>Suggested for you</span>
              <Link to="/explore" style={{ color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                See all
              </Link>
            </div>

            {suggestedPosts.length === 0 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', color: '#737373' }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Welcome to Instagram</p>
                <p style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
                  Follow people to see their posts here.
                </p>
                <Link to="/explore" style={{ marginTop: 16, color: '#0095f6', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Explore →
                </Link>
              </div>
            )}

            {suggestedPosts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={() => {}}
              />
            ))}
          </>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Spinner />
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 8 }} />
      </div>

      {/* Right sidebar — hidden on smaller screens */}
      <div
        className="hidden xl:block"
        style={{ width: 320, flexShrink: 0, padding: '32px 16px 32px 32px' }}
      >
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to={`/${user.username}`}>
                <Avatar src={user.avatar} alt={user.username} size="md" />
              </Link>
              <div>
                <Link to={`/${user.username}`} style={{ color: '#fff', fontSize: 14, fontWeight: 600, display: 'block', textDecoration: 'none' }}>
                  {user.username}
                </Link>
                <span style={{ color: '#737373', fontSize: 14 }}>{user.fullName}</span>
              </div>
            </div>
            <button style={{ color: '#0095f6', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
              Switch
            </button>
          </div>
        )}

        {suggestions.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#737373', fontSize: 14, fontWeight: 600 }}>Suggested for you</span>
              <Link to="/explore" style={{ color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                See all
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suggestions.map(s => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link to={`/${s.username}`}>
                      <Avatar src={s.avatar} alt={s.username} size="sm" />
                    </Link>
                    <div>
                      <Link to={`/${s.username}`} style={{ color: '#fff', fontSize: 13, fontWeight: 600, display: 'block', textDecoration: 'none' }}>
                        {s.username}
                      </Link>
                      <span style={{ color: '#737373', fontSize: 12 }}>Suggested for you</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollow(s._id)}
                    style={{ color: following[s._id] ? '#fff' : '#0095f6', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {following[s._id] ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          <p style={{ color: '#555', fontSize: 11, lineHeight: 1.8 }}>
            About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language · Meta Verified
          </p>
          <p style={{ color: '#555', fontSize: 11, marginTop: 6 }}>© 2026 INSTAGRAM FROM META</p>
        </div>
      </div>
    </div>
  );
}
