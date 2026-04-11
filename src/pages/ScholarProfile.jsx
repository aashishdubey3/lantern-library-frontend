import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ScholarProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [scholar, setScholar] = useState(null);
  const [publicArticles, setPublicArticles] = useState([]);
  const [activeTab, setActiveTab] = useState('articles');
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false); 
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      if (parsedUser.following && parsedUser.following.includes(id)) setIsFollowing(true);
      if (parsedUser.blockedUsers && parsedUser.blockedUsers.includes(id)) setIsBlocked(true);
    }

    const fetchScholarData = async () => {
      try {
        const res = await fetch(`https://lantern-library-backend.onrender.com/api/users/scholar/${id}`);
        if (res.ok) {
          const data = await res.json();
          setScholar(data.scholar);
          setPublicArticles(data.publicArticles);
        } else {
          alert("Scholar not found.");
          navigate('/');
        }
      } catch (err) {
        console.error("Failed to fetch scholar.");
      } finally {
        setLoading(false);
      }
    };
    fetchScholarData();
  }, [id, navigate]);

  const handleFollowToggle = async () => {
    if (!currentUser) return navigate('/login');
    setIsActionLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/users/follow/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        const updatedUser = { ...currentUser, following: data.followingList };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      alert("Failed to update network.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!currentUser) return navigate('/login');
    if (!window.confirm("Are you sure you want to change this scholar's block status?")) return;
    
    setIsActionLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/users/block/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsBlocked(!isBlocked);
        setIsFollowing(false); // Blocking forces unfollow!
        const updatedUser = { ...currentUser, blockedUsers: data.blockedUsers };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Slightly hacky way to force follower numbers to update visually
        setScholar(prev => ({ ...prev, followers: prev.followers.filter(fid => fid !== currentUser.id) }));
      }
    } catch (error) {
      alert("Failed to update block list.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const getCleanSnippet = (htmlString) => {
    if (!htmlString) return '';
    return htmlString.replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ').replace(/<[^>]+>/g, '');
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)' }}>Searching the directory...</h2>;
  if (!scholar) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      
      <div style={{ background: 'var(--bg-panel)', padding: '50px', borderRadius: '12px', border: '1px solid #2c3e50', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', marginBottom: '40px' }}>
        
        <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${scholar.username}`} alt="Avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#ecf0f1', border: '4px solid var(--lantern-gold)', marginBottom: '20px' }} />
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', margin: '0 0 10px 0' }}>{scholar.username}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 20px auto', fontStyle: 'italic', lineHeight: '1.6' }}>
          "{scholar.bio || 'A wandering scholar of the archives.'}"
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '30px' }}>
          <div><h4 style={{ margin: '0 0 5px 0', color: 'var(--lantern-gold)', fontSize: '1.5rem' }}>{scholar.followers?.length || 0}</h4><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Followers</span></div>
          <div><h4 style={{ margin: '0 0 5px 0', color: 'var(--lantern-gold)', fontSize: '1.5rem' }}>{scholar.following?.length || 0}</h4><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Following</span></div>
        </div>

        {currentUser && currentUser.id !== scholar._id && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {!isBlocked && (
              <>
                <button 
                  onClick={handleFollowToggle} 
                  disabled={isActionLoading} 
                  style={{ padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.95rem', cursor: isActionLoading ? 'not-allowed' : 'pointer', border: isFollowing ? '2px solid #7f8c8d' : '2px solid var(--lantern-gold)', background: isFollowing ? 'transparent' : 'var(--lantern-gold)', color: isFollowing ? '#7f8c8d' : 'var(--bg-deep)', transition: 'all 0.2s' }}
                >
                  {isFollowing ? 'Following ✓' : 'Follow Scholar +'}
                </button>

                {/* 🔥 THE NEW FRIEND & WHISPER LOGIC */}
                {currentUser.friends && currentUser.friends.includes(scholar._id) ? (
                  <button 
                    onClick={() => navigate('/messages', { state: { chatWith: scholar } })} 
                    style={{ padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', border: '2px solid #3498db', background: 'transparent', color: '#3498db', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.target.style.background = '#3498db'; e.target.style.color = 'white'; }}
                    onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#3498db'; }}
                  >
                    Whisper 💬
                  </button>
                ) : scholar.friendRequests && (scholar.friendRequests.includes(currentUser.id) || scholar.friendRequests.includes(currentUser._id)) ? (
                  <button disabled style={{ padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.95rem', border: '2px solid #f39c12', background: 'transparent', color: '#f39c12', cursor: 'not-allowed' }}>
                    Request Sent ⏳
                  </button>
                ) : (
                 <button 
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      await fetch(`https://lantern-library-backend.onrender.com/api/users/friend-request/${scholar._id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                      
                      // 🔥 FIRE THE FLARE GUN TO THEIR SCREEN!
                      const { io } = require('socket.io-client');
                      const socket = io('https://lantern-library-backend.onrender.com');
                      socket.emit('send_notification_ping', { targetUserId: scholar._id });
                      setTimeout(() => socket.close(), 1000); // Close it right after firing

                      alert("Friend request sent!");
                      window.location.reload(); 
                    }}
                    style={{ padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', border: '2px solid #2ecc71', background: 'transparent', color: '#2ecc71', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.target.style.background = '#2ecc71'; e.target.style.color = 'white'; }}
                    onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#2ecc71'; }}
                  >
                    Add Friend 🤝
                  </button>
                )}
              </>
            )}
            
            {/* 🔥 BLOCK BUTTON */}
            <button 
              onClick={handleBlockToggle} 
              disabled={isActionLoading} 
              style={{ padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.95rem', cursor: isActionLoading ? 'not-allowed' : 'pointer', border: '2px solid #e74c3c', background: isBlocked ? '#e74c3c' : 'transparent', color: isBlocked ? 'white' : '#e74c3c', transition: 'all 0.2s' }}
            >
              {isBlocked ? 'Unblock Scholar' : 'Block 🚫'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => setActiveTab('articles')} style={{ padding: '10px 25px', borderRadius: '25px', background: activeTab === 'articles' ? 'var(--lantern-gold)' : 'transparent', color: activeTab === 'articles' ? 'var(--bg-deep)' : 'var(--lantern-gold)', border: activeTab === 'articles' ? 'none' : '1px solid var(--lantern-gold)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>🖋️ Published Works</button>
        <button onClick={() => setActiveTab('library')} style={{ padding: '10px 25px', borderRadius: '25px', background: activeTab === 'library' ? 'var(--text-main)' : 'transparent', color: activeTab === 'library' ? 'var(--bg-deep)' : 'var(--text-muted)', border: activeTab === 'library' ? 'none' : '1px solid #555', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>📚 Reading Library</button>
      </div>

      {activeTab === 'articles' && (
        <div>
          {publicArticles.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '40px' }}>This scholar has not published any public works yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {publicArticles.map(article => (
                <div key={article._id} style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid #2c3e50', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.2rem', lineHeight: '1.4' }}>{article.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', flexGrow: 1, marginBottom: '20px' }}>{getCleanSnippet(article.snippet)}</p>
                  <button onClick={() => navigate(`/article/${article._id}`)} style={{ padding: '10px', background: 'transparent', color: 'var(--lantern-gold)', border: '1px solid var(--lantern-gold)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Read Manuscript →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <div>
          {!scholar.isLibraryPublic ? (
             <div style={{ textAlign: 'center', padding: '50px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px dashed #e74c3c' }}>
               <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>🔒 Sealed Archives</h3>
               <p style={{ color: 'var(--text-muted)' }}>This scholar has chosen to keep their reading ledger private.</p>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div>
                <h3 style={{ color: 'var(--lantern-gold)', borderBottom: '1px solid #34495e', paddingBottom: '10px', marginBottom: '20px' }}>Finished Works</h3>
                {scholar.finishedList?.length === 0 ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None yet.</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                    {scholar.finishedList.map(item => (
                       <div key={item._id} style={{ background: 'var(--bg-deep)', padding: '10px', borderRadius: '8px', border: '1px solid #34495e', textAlign: 'center' }}>
                         <img src={item.coverImage} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                         <h5 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem' }}>{item.title}</h5>
                       </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}