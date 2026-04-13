import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Read() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [readingStatus, setReadingStatus] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // 🔥 STATE FOR THE SHARE MODAL
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    const fetchArticle = async () => {
      try {
        const res = await fetch(`https://lantern-library-backend.onrender.com/api/articles/${id}`);
        if (res.ok) {
          const fetchedArticle = await res.json();
          setArticle(fetchedArticle);

          if (storedUser) {
             const parsedUser = JSON.parse(storedUser);
             if (parsedUser.following && parsedUser.following.includes(fetchedArticle.authorId)) {
               setIsFollowing(true);
             }

             // Load friends for the Share modal
             if (parsedUser.friends) {
               Promise.all(parsedUser.friends.map(friendId => fetch(`https://lantern-library-backend.onrender.com/api/users/scholar/${friendId}`).then(r => r.json())))
                 .then(data => setFriendsList(data.map(d => d.scholar)))
                 .catch(err => console.error(err));
             }
          }

          const cleanText = fetchedArticle.content.replace(/<[^>]+>/g, '');
          const wordCount = cleanText.split(/\s+/).length;
          const requiredSeconds = Math.max(5, Math.floor(wordCount / 15)); 
          
          setSecondsLeft(requiredSeconds);
          setReadingStatus('Reading in progress...');
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error("Failed to load manuscript");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
      return () => clearTimeout(timer);
    } 
    if (secondsLeft === 0) {
      triggerStreakUpdate();
      setSecondsLeft(-1); 
    }
  }, [secondsLeft]);

  const triggerStreakUpdate = async () => {
    setReadingStatus('Logging to your ledger...');
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const streakRes = await fetch('https://lantern-library-backend.onrender.com/api/users/log-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await streakRes.json();
      
      if (streakRes.ok) {
        setReadingStatus(`📖 Logged! (${data.articlesReadToday}/${data.dailyGoal} read today)`);
      } else {
        setReadingStatus('Failed to log reading session.');
      }
    } catch (error) {
      setReadingStatus('Failed to log reading session.');
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) return alert("You must be logged in to follow scholars.");
    setIsFollowLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/users/follow/${article.authorId}`, {
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
      setIsFollowLoading(false);
    }
  };

  // 🔥 HANDLE LIKES
  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert("Please log in to like articles.");
    
    // Optimistic UI update
    setArticle({ 
      ...article, 
      isLikedByMe: !article.isLikedByMe, 
      likesCount: (article.likesCount || article.likes?.length || 0) + (article.isLikedByMe ? -1 : 1) 
    });

    try {
      await fetch(`https://lantern-library-backend.onrender.com/api/articles/${article._id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) { console.error("Failed to like article"); }
  };

  // 🔥 SEND TO WHISPERS LOGIC
  const sendToFriend = async (friendId) => {
    const token = localStorage.getItem('token');
    const shareUrl = window.location.href;
    const text = `Hey! Check out this article: "${article.title}"\nRead it here: ${shareUrl}`;

    try {
      await fetch(`https://lantern-library-backend.onrender.com/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverId: friendId, text: text })
      });
      alert('Article sent to friend!');
      setShareModalOpen(false); 
    } catch (err) {
      alert('Failed to send article.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
    setShareModalOpen(false);
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)' }}>Unrolling manuscript...</h2>;
  if (!article) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-main)' }}>Manuscript not found in the archives.</h2>;

  const cleanContent = article.content
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/color\s*:[^;"]+;?/gi, '') 
    .replace(/background-color\s*:[^;"]+;?/gi, '');
  
  const isMyOwnArticle = currentUser && currentUser.id === article.authorId;

  return (
    <div style={{ maxWidth: '800px', margin: isMobile ? '20px auto' : '40px auto', padding: '0 20px', paddingBottom: isMobile ? '80px' : '20px', position: 'relative' }}>
      
      {/* 🔥 THE SHARE MODAL */}
      {shareModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '350px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Share Article</h3>
              <button onClick={() => setShareModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <button onClick={copyToClipboard} style={{ width: '100%', padding: '15px', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px' }}>
              🔗 Copy External Link
            </button>

            <h4 style={{ margin: '0 0 10px 0', color: 'var(--lantern-gold)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Send to Whispers</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {friendsList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No friends in your network yet.</p>
              ) : (
                friendsList.map(friend => (
                  <div key={friend._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.username}`} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                      <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{friend.username}</span>
                    </div>
                    <button onClick={() => sendToFriend(friend._id)} style={{ padding: '6px 15px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      Send
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* THE CSS FIX FOR BEAUTIFUL QUOTES! */}
      <style>
        {`
          .parchment-content {
            color: #2c3e50; 
            font-size: 1.15rem;
            line-height: 1.8;
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-family: 'Georgia', serif; 
          }
          .parchment-content p {
            margin-bottom: 20px;
          }
          .parchment-content blockquote {
            border-left: 4px solid var(--lantern-gold);
            background: rgba(212, 175, 55, 0.15); 
            margin: 25px 0;
            padding: 15px 25px;
            font-style: italic;
            color: #1a252f; 
            border-radius: 0 8px 8px 0;
            font-size: 1.25rem; 
          }
          .parchment-content a {
            color: var(--lantern-gold);
            text-decoration: none;
            border-bottom: 1px dotted var(--lantern-gold);
          }
          .parchment-content a:hover {
            color: #b9770e;
            border-bottom: 1px solid #b9770e;
          }
        `}
      </style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>←</span> Return
        </button>
        
        {secondsLeft !== null && (
          <div style={{ background: secondsLeft > 0 ? '#2c3e50' : 'var(--lantern-gold)', color: secondsLeft > 0 ? 'var(--text-muted)' : 'var(--bg-deep)', padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.3s' }}>
            {secondsLeft > 0 ? `⏳ Reading... (${secondsLeft}s)` : readingStatus}
          </div>
        )}
      </div>

      {/* 🔥 THE PARCHMENT CONTAINER */}
      <div style={{ 
        background: '#fdf6e3', 
        padding: isMobile ? '25px' : '50px', 
        borderRadius: '12px', 
        border: '1px solid #d4c4a8', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        backgroundImage: 'radial-gradient(#e0d5c1 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}>
        <h1 style={{ fontSize: isMobile ? '2rem' : '2.8rem', color: '#1a1a1a', margin: '0 0 20px 0', lineHeight: '1.2', fontFamily: 'Georgia, serif' }}>
          {article.title}
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px', borderBottom: '1px solid #d4c4a8', paddingBottom: '20px' }}>
          <img 
            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${article.authorName}`} 
            alt="Author Avatar" 
            style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ecf0f1', border: '2px solid var(--lantern-gold)', cursor: 'pointer' }} 
            onClick={() => navigate(`/scholar/${article.authorId}`)} 
          />
          <div style={{ flexGrow: 1 }}>
            <p 
              style={{ margin: 0, color: '#b9770e', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
              onClick={() => navigate(`/scholar/${article.authorId}`)}
            >
              {article.authorName}
            </p>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.85rem' }}>Published on {new Date(article.createdAt).toLocaleDateString()}</p>
          </div>

          {!isMyOwnArticle && currentUser && (
            <button 
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              style={{ 
                padding: '6px 16px', 
                borderRadius: '20px', 
                fontWeight: 'bold', 
                cursor: isFollowLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                border: isFollowing ? '1px solid #7f8c8d' : '1px solid var(--lantern-gold)',
                background: isFollowing ? 'transparent' : 'var(--lantern-gold)',
                color: isFollowing ? '#7f8c8d' : 'var(--bg-deep)',
                transition: 'all 0.2s'
              }}
            >
              {isFollowing ? 'Following ✓' : 'Follow +'}
            </button>
          )}
        </div>

        {/* The content rendering area */}
        <div 
          className="parchment-content" 
          dangerouslySetInnerHTML={{ __html: cleanContent }} 
        />

        {/* 🔥 THE IN-ARTICLE SOCIAL BAR */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between', marginTop: '50px', paddingTop: '25px', borderTop: '1px solid #d4c4a8' }}>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={handleLike} 
              style={{ background: '#f5ead3', border: '1px solid #d4c4a8', display: 'flex', alignItems: 'center', gap: '8px', color: article.isLikedByMe ? '#e74c3c' : '#2c3e50', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', padding: '10px 20px', borderRadius: '30px' }}
            >
              {article.isLikedByMe ? '❤️' : '🤍'} {article.likesCount || article.likes?.length || 0} Likes
            </button>
            <button 
              style={{ background: '#f5ead3', border: '1px solid #d4c4a8', display: 'flex', alignItems: 'center', gap: '8px', color: '#2c3e50', cursor: 'default', fontSize: '1rem', fontWeight: 'bold', padding: '10px 20px', borderRadius: '30px' }}
            >
              💬 {article.comments?.length || 0} Comments
            </button>
          </div>

          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: article.title, url: window.location.href });
              } else {
                setShareModalOpen(true);
              }
            }} 
            style={{ background: 'var(--lantern-gold)', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', padding: '10px 20px', borderRadius: '30px' }}
          >
            📤 Share
          </button>
        </div>

      </div>
    </div>
  );
}