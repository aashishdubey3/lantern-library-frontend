import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // 🔥 THEME STATE: Check local storage first, default to 'lamplight'
  const [theme, setTheme] = useState(localStorage.getItem('lantern-theme') || 'lamplight');
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 THEME EFFECT: Applies the class to the <body> tag whenever theme changes
  useEffect(() => {
    if (theme === 'daylight') {
      document.body.classList.add('theme-daylight');
    } else {
      document.body.classList.remove('theme-daylight');
    }
    localStorage.setItem('lantern-theme', theme); // Remember their choice!
  }, [theme]);

  // 🔥 FLIP THE BOOK FUNCTION
  const toggleTheme = () => {
    setTheme(prev => prev === 'lamplight' ? 'daylight' : 'lamplight');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifDropdown(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) { console.error("Error fetching notifications"); }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchNotifications();

      const socket = io('https://lantern-library-backend.onrender.com');
      socket.emit('register_scholar', parsedUser.id || parsedUser._id);
      socket.on('receive_notification_ping', () => fetchNotifications());

      return () => socket.close();
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; 
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <nav style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: isMobile ? '12px 10px' : '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, transition: 'background 0.8s ease, border-color 0.8s ease' }}>
      
      {/* LEFT: Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
        <span style={{ fontSize: isMobile ? '1.3rem' : '1.8rem' }}>🏮</span>
        <h2 style={{ margin: 0, color: 'var(--lantern-gold)', letterSpacing: isMobile ? '0px' : '2px', textTransform: 'uppercase', fontSize: isMobile ? '0.85rem' : '1.2rem', whiteSpace: 'nowrap' }}>
          The Lantern Library
        </h2>
      </Link>

      {/* MIDDLE: Links */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <Link to="/messages" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 'bold' }}>💬 Whispers</Link>
          <Link to="/community" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 'bold' }}>🗣️ Lounge</Link>
        </div>
      )}

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px' }}>
        
        {!isMobile && (
          <button onClick={() => navigate('/write')} style={{ background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
            ✏️ Publish
          </button>
        )}
        
        <div style={{ background: 'transparent', border: isMobile ? 'none' : '1px solid var(--lantern-gold)', color: 'var(--lantern-gold)', padding: isMobile ? '0' : '6px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: isMobile ? '1rem' : '0.9rem' }}>
          {isMobile ? `🔥 ${user?.currentStreak || 0}` : `STREAK 🔥 ${user?.currentStreak || 0}`}
        </div>

        {/* 📖 THE MAGIC BOOK TOGGLE */}
        <div 
          className={`magic-book-toggle ${theme === 'daylight' ? 'is-daylight' : ''}`} 
          onClick={toggleTheme}
          title={theme === 'lamplight' ? "Switch to Daylight" : "Switch to Lamplight"}
        >
          <div className="book-half left"></div>
          <div className="book-half right"></div>
          <div className="flipping-page"></div>
        </div>

        {/* 🔔 NOTIFICATION BELL */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{ background: 'transparent', border: 'none', fontSize: isMobile ? '1.3rem' : '1.5rem', cursor: 'pointer', position: 'relative', padding: '0' }}>
            🔔
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
             <div style={{ position: 'absolute', top: '100%', right: isMobile ? '-40px' : '0', marginTop: '15px', width: isMobile ? '260px' : '320px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-deep)' }}>
                 <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>Notifications</h4>
                 {unreadCount > 0 && <span onClick={markAllAsRead} style={{ fontSize: '0.75rem', color: '#3498db', cursor: 'pointer', fontWeight: 'bold' }}>Mark all read</span>}
               </div>
               <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                 {notifications.length === 0 ? (
                   <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontStyle: 'italic', margin: 0 }}>All caught up.</p>
                 ) : (
                   notifications.map(notif => (
                     <div key={notif._id} onClick={() => handleNotificationClick(notif)} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', background: notif.isRead ? 'transparent' : 'rgba(243, 156, 18, 0.1)', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                       <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${notif.senderName || 'System'}`} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ecf0f1', flexShrink: 0 }} />
                       <div>
                         <p style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.3' }}>{notif.message}</p>
                         <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </div>
          )}
        </div>

        {/* 👤 PROFILE MENU */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <img 
            onClick={() => setShowProfileMenu(!showProfileMenu)} 
            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} 
            alt="Profile" 
            style={{ width: isMobile ? '32px' : '45px', height: isMobile ? '32px' : '45px', borderRadius: '50%', border: '2px solid var(--lantern-gold)', background: '#ecf0f1', cursor: 'pointer' }} 
          />
          
          {showProfileMenu && (
            <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '15px', width: '200px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              
              {isMobile && (
                <>
                  <div onClick={() => { setShowProfileMenu(false); navigate('/write'); }} style={{ padding: '12px 15px', color: 'var(--lantern-gold)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>✏️ Publish</div>
                  <div onClick={() => { setShowProfileMenu(false); navigate('/messages'); }} style={{ padding: '12px 15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>💬 Whispers</div>
                  <div onClick={() => { setShowProfileMenu(false); navigate('/community'); }} style={{ padding: '12px 15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>🗣️ Lounge</div>
                </>
              )}
              
              <div onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} style={{ padding: '12px 15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>📚 My Archives</div>
              <div onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} style={{ padding: '12px 15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>⚙️ Settings</div>
              <div onClick={handleLogout} style={{ padding: '12px 15px', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold', background: 'var(--bg-deep)', fontSize: '0.9rem' }}>🚪 Log Out</div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}