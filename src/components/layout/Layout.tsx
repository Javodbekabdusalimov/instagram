import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CreatePost from '../create/CreatePost';
import { getUnreadCount as getUnreadNotif } from '../../api/notifications';
import { getUnreadCount as getUnreadMsg } from '../../api/messages';

interface LayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_W = 245;

export default function Layout({ children }: LayoutProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [n, m] = await Promise.all([getUnreadNotif(), getUnreadMsg()]);
        setUnreadNotif(n.count);
        setUnreadMsg(m.count);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <Sidebar
        unreadNotifications={unreadNotif}
        unreadMessages={unreadMsg}
        onCreatePost={() => setShowCreate(true)}
      />

      {/* Spacer that matches sidebar width on desktop, keeps content from going under sidebar */}
      <div style={{ display: 'flex' }}>
        {/* Desktop spacer */}
        <div
          className="hidden md:block flex-shrink-0"
          style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W }}
        />
        {/* Main content — pb-16 for mobile nav clearance, removed on md+ */}
        <main
          className="pb-16 md:pb-0"
          style={{ flex: 1, minWidth: 0 }}
        >
          {children}
        </main>
      </div>

      <CreatePost
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {}}
      />
    </div>
  );
}
