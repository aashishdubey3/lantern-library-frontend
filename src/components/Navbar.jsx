import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const [theme, setTheme] = useState(localStorage.getItem('lantern-theme') || 'lamplight');
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isChatScreen = isMobile && (location.pathname.startsWith('/messages/') || location.pathname === '/summon');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (theme === 'daylight') document.body.classList.add('theme-daylight');
    else document.body.classList.remove('theme-daylight');
    localStorage.setItem('lantern-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'lamplight' ? 'daylight' : 'lamplight');

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
      const res = await fetch('https://lantern-library-backend.onrender.com/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setNotifications(await res.json());
    } catch (err) { console.error("Error fetching notifications"); }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchNotifications();
        
        const socket = io('https://lantern-library-backend.onrender.com');
        const myId = parsedUser.id || parsedUser._id;

        if (myId) {
          socket.emit('register_scholar', myId);
          socket.on('connect', () => socket.emit('register_scholar', myId));
        }

        socket.on('receive_notification_ping', () => fetchNotifications());

        return () => {
          socket.off('connect');
          socket.off('receive_notification_ping');
          socket.close();
        };
      } catch (e) { console.error("Parse error", e); }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; 
  };

  // 🔥 SMART NOTIFICATION ROUTER
  const handleNotificationClick = async (notif) => {
    setShowNotifDropdown(false); // Close dropdown
    
    const msg = (notif.message || '').toLowerCase();
    
    // Guess the route based on keywords in your backend's message
    if (msg.includes('request') || msg.includes('friend') || msg.includes('message')) {
      navigate('/messages'); 
    } else if (msg.includes('reply') || msg.includes('group') || msg.includes('discussion')) {
      navigate('/community');
    } else if (msg.includes('article') || msg.includes('post')) {
      navigate('/articles');
    } else if (notif.link) {
      // If your backend ever sends a direct link property, use it!
      navigate(notif.link); 
    }
    
    // Optional: If you have a backend endpoint to mark it as read, call it here!
    // await fetch(`https://lantern-library-backend.onrender.com/api/notifications/${notif._id}/read`, { method: 'POST', headers: {...} });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;
  if (isChatScreen) return null;

  return (
    <nav style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: isMobile ? '12px 15px' : '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, transition: 'background 0.8s ease' }}>
      
      {/* LEFT: 3D Book Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px' }}>
        <div className="aesthetic-3d-book" onClick={toggleTheme} title="Turn the page to change time">
          <div className="book-static-page left"></div>
          <div className="book-spine-center"></div>
          <div className="book-flipping-page"></div>
          <div className="book-static-page right"></div>
        </div>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 style={{ margin: 0, color: 'var(--lantern-gold)', letterSpacing: isMobile ? '0px' : '1px', textTransform: 'uppercase', fontSize: isMobile ? '0.9rem' : '1.2rem', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
            The Lantern Library
          </h2>
        </Link>
      </div>

      {/* MIDDLE: Desktop Links */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <Link to="/messages" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 'bold' }}>💬 Whispers</Link>
          <Link to="/community" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 'bold' }}>🗣️ Lounge</Link>
        </div>
      )}

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '15px' : '20px' }}>
        
        {!isMobile && (
          <button onClick={() => navigate('/write')} style={{ background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
            ✏️ Publish
          </button>
        )}
        
        <div style={{ color: 'var(--lantern-gold)', fontWeight: 'bold', fontSize: isMobile ? '1rem' : '0.9rem' }}>
          🔥 {user?.currentStreak || 0}
        </div>

        {/* NOTIFICATION BELL */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{ background: 'transparent', border: 'none', fontSize: isMobile ? '1.4rem' : '1.5rem', cursor: 'pointer', position: 'relative', padding: '0' }}>
            🔔
            {unreadCount > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
          </button>

          {showNotifDropdown && (
             <div style={{ position: 'absolute', top: '100%', right: isMobile ? '-40px' : '0', marginTop: '15px', width: isMobile ? '260px' : '320px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
               <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-deep)' }}>
                 <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Notifications</h4>
               </div>
               <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                 {notifications.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>All caught up.</p> : notifications.map(notif => (
                   
                   // 🔥 THIS IS NOW CLICKABLE!
                   <div key={notif._id} onClick={() => handleNotificationClick(notif)} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '10px', cursor: 'pointer', background: notif.isRead ? 'transparent' : 'rgba(243, 156, 18, 0.05)' }}>
                     <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${notif?.senderName || 'System'}`} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                     <div><p style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '0.85rem' }}>{notif.message}</p></div>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>

        {/* PROFILE DROPDOWN */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <img onClick={() => setShowProfileMenu(!showProfileMenu)} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username || 'user'}`} alt="Profile" style={{ width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px', borderRadius: '50%', border: '2px solid var(--lantern-gold)', background: '#ecf0f1', cursor: 'pointer' }} />
          
          {showProfileMenu && (
            <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '15px', width: '220px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} style={{ padding: '14px 15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>📚 My Archives</div>
              <div onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} style={{ padding: '14px 15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>⚙️ Settings</div>
              <div onClick={handleLogout} style={{ padding: '14px 15px', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold', background: 'var(--bg-deep)', fontSize: '0.9rem' }}>🚪 Log Out</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}