import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // 🔥 Mobile Radar
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleNotificationClick = async (notif) => {
    const token = localStorage.getItem('token');
    if (!notif.isRead) {
      await fetch(`https://lantern-library-backend.onrender.com/api/notifications/${notif._id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications(); 
    }
    setShowNotifDropdown(false);
    if (notif.type === 'friend_request') navigate('/messages'); 
    else navigate('/');
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    await fetch(`https://lantern-library-backend.onrender.com/api/notifications/read-all`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }});
    fetchNotifications();
    setShowNotifDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; 
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <nav style={{ background: 'var(--bg-panel)', borderBottom: '1px solid #2c3e50', padding: isMobile ? '10px 15px' : '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
      
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: isMobile ? '1.5rem' : '1.8rem' }}>🏮</span>
        {!isMobile && <h2 style={{ margin: 0, color: 'var(--lantern-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '1.2rem' }}>The Lantern Library</h2>}
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '15px' : '25px' }}>
        <Link to="/messages" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 'bold', fontSize: isMobile ? '1.2rem' : '1rem' }} title="Whispers">💬 {!isMobile && 'Whispers'}</Link>
        <Link to="/community" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 'bold', fontSize: isMobile ? '1.2rem' : '1rem' }} title="Lounge">🗣️ {!isMobile && 'Lounge'}</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px' }}>
        <button onClick={() => navigate('/write')} style={{ background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', padding: isMobile ? '6px 12px' : '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✏️ {!isMobile && 'Publish'}
        </button>
        
        {/* 🔥 Now pulling real streak data! */}
        <div style={{ background: 'transparent', border: '1px solid var(--lantern-gold)', color: 'var(--lantern-gold)', padding: isMobile ? '4px 8px' : '6px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
          {isMobile ? `🔥 ${user?.currentStreak || 0}` : `STREAK 🔥 ${user?.currentStreak || 0}`}
        </div>

        {/* 🔔 NOTIFICATION BELL */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{ background: 'transparent', border: 'none', fontSize: isMobile ? '1.2rem' : '1.5rem', cursor: 'pointer', position: 'relative', padding: '5px' }}>
            🔔
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '0', right: '0', background: '#e74c3c', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
             <div style={{ position: 'absolute', top: '100%', right: isMobile ? '-50px' : '0', marginTop: '15px', width: isMobile ? '280px' : '320px', background: 'var(--bg-panel)', border: '1px solid var(--lantern-gold)', borderRadius: '8px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #34495e', background: 'var(--bg-deep)' }}>
                 <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Notifications</h4>
                 {unreadCount > 0 && <span onClick={markAllAsRead} style={{ fontSize: '0.8rem', color: '#3498db', cursor: 'pointer', fontWeight: 'bold' }}>Mark all read</span>}
               </div>
               <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                 {notifications.length === 0 ? (
                   <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontStyle: 'italic', margin: 0 }}>All caught up.</p>
                 ) : (
                   notifications.map(notif => (
                     <div key={notif._id} onClick={() => handleNotificationClick(notif)} style={{ padding: '15px', borderBottom: '1px solid #2c3e50', background: notif.isRead ? 'transparent' : 'rgba(243, 156, 18, 0.1)', cursor: 'pointer', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                       <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${notif.senderName || 'System'}`} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#ecf0f1', flexShrink: 0 }} />
                       <div>
                         <p style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.4' }}>{notif.message}</p>
                         <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
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
            style={{ width: isMobile ? '35px' : '45px', height: isMobile ? '35px' : '45px', borderRadius: '50%', border: '2px solid var(--lantern-gold)', background: '#ecf0f1', cursor: 'pointer' }} 
          />
          
          {showProfileMenu && (
            <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '15px', width: '200px', background: 'var(--bg-panel)', border: '1px solid #34495e', borderRadius: '8px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} style={{ padding: '15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid #2c3e50', fontWeight: 'bold' }}>📚 My Archives</div>
              <div onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} style={{ padding: '15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid #2c3e50', fontWeight: 'bold' }}>⚙️ Settings</div>
              <div onClick={handleLogout} style={{ padding: '15px', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold', background: 'var(--bg-deep)' }}>🚪 Log Out</div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}