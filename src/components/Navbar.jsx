import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MessageCircle, Users, PenLine, Flame, Bell, BookOpen, Home as HomeIcon } from 'lucide-react';

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

  const handleNotificationClick = async (notif) => {
    setShowNotifDropdown(false); 
    const msg = (notif.message || '').toLowerCase();
    if (msg.includes('request') || msg.includes('friend') || msg.includes('message')) { navigate('/messages'); } 
    else if (msg.includes('reply') || msg.includes('group') || msg.includes('discussion')) { navigate('/community'); } 
    else if (msg.includes('article') || msg.includes('post')) { navigate('/articles'); } 
    else if (notif.link) { navigate(notif.link); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;
  if (isChatScreen) return null;

  return (
    <>
      {/* 🔥 FIX 1: zIndex boosted to 9999 so it covers everything */}
      <nav style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: isMobile ? '12px 15px' : '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 9999, transition: 'background 0.4s ease' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px' }}>
          <div className="aesthetic-3d-book" onClick={toggleTheme} title="Turn the page to change time">
            <div className="book-static-page left"></div>
            <div className="book-spine-center"></div>
            <div className="book-flipping-page"></div>
            <div className="book-static-page right"></div>
          </div>
          
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ margin: 0, color: 'var(--lantern-gold)', letterSpacing: isMobile ? '0px' : '1px', textTransform: 'uppercase', fontSize: isMobile ? '0.9rem' : '1.2rem', whiteSpace: 'nowrap', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
              The Lantern Library
            </h2>
          </Link>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <Link to="/messages" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--lantern-gold)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-main)'}>
              <MessageCircle size={18} /> Whispers
            </Link>
            <Link to="/community" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--lantern-gold)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-main)'}>
              <Users size={18} /> Lounge
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '15px' : '20px' }}>
          
          {!isMobile && (
            <button onClick={() => navigate('/write')} style={{ background: 'var(--lantern-gold)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <PenLine size={16} /> Publish
            </button>
          )}
          
          <div style={{ color: 'var(--lantern-gold)', fontWeight: 'bold', fontSize: isMobile ? '1rem' : '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={18} strokeWidth={2.5} /> {user?.currentStreak || 0}
          </div>

          {/* NOTIFICATION BELL */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', padding: '0', display: 'flex', alignItems: 'center', color: 'var(--lantern-gold)' }}>
              <Bell size={isMobile ? 22 : 24} />
              {unreadCount > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e74c3c', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-panel)' }}>{unreadCount}</span>}
            </button>

            {/* 🔥 Dropdown background is explicitly set so it covers elements beneath it */}
            {showNotifDropdown && (
               <div style={{ position: 'absolute', top: '100%', right: isMobile ? '-40px' : '0', marginTop: '15px', width: isMobile ? '280px' : '320px', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', borderRadius: '12px', zIndex: 10000, boxShadow: '0 10px 30px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
                 <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
                   <h4 style={{ margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Notifications</h4>
                 </div>
                 <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'var(--bg-deep)' }}>
                   {notifications.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '0.9rem' }}>All caught up.</p> : notifications.map(notif => (
                     <div key={notif._id} onClick={() => handleNotificationClick(notif)} style={{ padding: '12px 15px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', cursor: 'pointer', background: notif.isRead ? 'var(--bg-deep)' : 'var(--lantern-glow)', transition: 'background 0.2s' }}>
                       <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${notif?.senderName || 'System'}`} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                       <div><p style={{ margin: '0', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.4' }}>{notif.message}</p></div>
                     </div>
                   ))}
                 </div>
               </div>
            )}
          </div>

          {/* PROFILE DROPDOWN */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <img onClick={() => setShowProfileMenu(!showProfileMenu)} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username || 'user'}`} alt="Profile" style={{ width: isMobile ? '34px' : '40px', height: isMobile ? '34px' : '40px', borderRadius: '50%', border: '2px solid var(--lantern-gold)', background: '#ecf0f1', cursor: 'pointer' }} />
            
            {showProfileMenu && (
              <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '15px', width: '220px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', zIndex: 10000, boxShadow: '0 10px 30px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
                <div onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} style={{ padding: '14px 15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: '500', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen size={16} /> My Archives</div>
                <div onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} style={{ padding: '14px 15px', color: 'var(--text-main)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: '500', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>⚙️ Settings</div>
                <div onClick={handleLogout} style={{ padding: '14px 15px', color: '#e74c3c', cursor: 'pointer', fontWeight: '600', background: 'var(--bg-deep)', fontSize: '0.9rem' }}>Log Out</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 📱 MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'var(--bg-panel)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0', zIndex: 9999, paddingBottom: 'env(safe-area-inset-bottom, 10px)' }}>
          <Link to="/" className="bottom-nav-link" style={{ color: location.pathname === '/' ? 'var(--lantern-gold)' : 'var(--text-muted)' }}><HomeIcon size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} /></Link>
          <Link to="/write" className="bottom-nav-link" style={{ color: location.pathname === '/write' ? 'var(--lantern-gold)' : 'var(--text-muted)' }}><PenLine size={24} strokeWidth={location.pathname === '/write' ? 2.5 : 2} /></Link>
          <Link to="/messages" className="bottom-nav-link" style={{ color: location.pathname.startsWith('/messages') ? 'var(--lantern-gold)' : 'var(--text-muted)' }}><MessageCircle size={24} strokeWidth={location.pathname.startsWith('/messages') ? 2.5 : 2} /></Link>
          <Link to="/community" className="bottom-nav-link" style={{ color: location.pathname === '/community' ? 'var(--lantern-gold)' : 'var(--text-muted)' }}><Users size={24} strokeWidth={location.pathname === '/community' ? 2.5 : 2} /></Link>
        </nav>
      )}
    </>
  );
}