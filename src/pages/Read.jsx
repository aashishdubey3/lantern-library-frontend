import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Read() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [readingStatus, setReadingStatus] = useState('');
  
  // 🔥 Follow System States
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    // Get the logged-in user from local storage
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

          // Check if we are already following this author!
          if (storedUser) {
             const parsedUser = JSON.parse(storedUser);
             if (parsedUser.following && parsedUser.following.includes(fetchedArticle.authorId)) {
               setIsFollowing(true);
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
      const streakRes = await fetch('https://lantern-library-backend.onrender.com/api/users/update-streak', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await streakRes.json();
      
      if (streakRes.ok) {
        if (data.streakUpdated) {
          setReadingStatus('🔥 Goal Met! Streak Increased!');
          const storedUser = JSON.parse(localStorage.getItem('user'));
          storedUser.currentStreak = data.currentStreak;
          localStorage.setItem('user', JSON.stringify(storedUser));
          window.dispatchEvent(new Event('storage')); 
        } else {
          setReadingStatus(`📖 Logged! (${data.articlesReadToday}/${data.goal} read today)`);
        }
      }
    } catch (error) {
      setReadingStatus('Failed to log reading session.');
    }
  };

  // 🔥 Handle the Follow Button Click
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
        
        // Update local storage so the app remembers who you follow
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

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)' }}>Unrolling manuscript...</h2>;
  if (!article) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-main)' }}>Manuscript not found in the archives.</h2>;

// 🔥 FIX: Aggressively strip rogue font colors and background colors!
  const cleanContent = article.content
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/color\s*:[^;"]+;?/gi, '') 
    .replace(/background-color\s*:[^;"]+;?/gi, '');
  
  // 🔥 SMART CHECK: Is this article written by the person currently logged in?
  const isMyOwnArticle = currentUser && currentUser.id === article.authorId;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>←</span> Return to Archives
        </button>
        
        {secondsLeft !== null && (
          <div style={{ background: secondsLeft > 0 ? '#2c3e50' : 'var(--lantern-gold)', color: secondsLeft > 0 ? 'var(--text-muted)' : 'var(--bg-deep)', padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.3s' }}>
            {secondsLeft > 0 ? `⏳ Reading... (${secondsLeft}s)` : readingStatus}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-panel)', padding: '50px', borderRadius: '12px', border: '1px solid #2c3e50', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize: '2.8rem', color: 'var(--text-main)', margin: '0 0 20px 0', lineHeight: '1.2' }}>{article.title}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px', borderBottom: '1px solid #34495e', paddingBottom: '20px' }}>
          <img 
            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${article.authorName}`} 
            alt="Author Avatar" 
            style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ecf0f1', border: '2px solid var(--lantern-gold)', cursor: 'pointer' }} 
            onClick={() => navigate(`/scholar/${article.authorId}`)} // Clicking avatar goes to their profile!
          />
          <div style={{ flexGrow: 1 }}>
            <p 
              style={{ margin: 0, color: 'var(--lantern-gold)', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
              onClick={() => navigate(`/scholar/${article.authorId}`)}
            >
              {article.authorName}
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Published on {new Date(article.createdAt).toLocaleDateString()}</p>
          </div>

          {/* 🔥 THE CONDITIONAL FOLLOW BUTTON */}
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

        <div style={{ color: '#ecf0f1', fontSize: '1.15rem', lineHeight: '1.8', wordWrap: 'break-word', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: cleanContent }} />
      </div>
    </div>
  );
}