import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  // 🔥 NEW: State for the Share Modal
  const [shareModalData, setShareModalData] = useState(null); // Holds the article being shared
  const [friendsList, setFriendsList] = useState([]);

  const categories = [
    { id: 'all', label: 'All Updates' },
    { id: 'network', label: '🤝 My Network' },
    { id: 'literature', label: 'Classic Literature' },
    { id: 'philosophy', label: 'Philosophy' }
  ];

  const getSnippet = (text, maxWords) => {
    if (!text) return "Translating...";
    let cleanText = text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    const words = cleanText.split(' ');
    return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : cleanText;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token) return navigate('/login');

    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://lantern-library-backend.onrender.com/api/articles/${activeTab === 'network' ? 'network' : 'feed?category=' + activeTab}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setArticles(await res.json());
      } catch (err) { console.error("Error fetching articles"); } finally { setLoading(false); }
    };
    fetchArticles();

    // Fetch friends for the Share modal
    if (user?.friends) {
      Promise.all(user.friends.map(id => fetch(`https://lantern-library-backend.onrender.com/api/users/scholar/${id}`).then(res => res.json())))
        .then(data => setFriendsList(data.map(d => d.scholar)))
        .catch(err => console.error(err));
    }
  }, [activeTab, navigate]);

  const handleLike = async (e, articleId) => {
    e.stopPropagation(); 
    const token = localStorage.getItem('token');
    setArticles(articles.map(art => {
      if (art._id === articleId) {
        return { ...art, isLikedByMe: !art.isLikedByMe, likesCount: (art.likesCount || 0) + (art.isLikedByMe ? -1 : 1) };
      }
      return art;
    }));
    try { await fetch(`https://lantern-library-backend.onrender.com/api/articles/${articleId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); } catch (err) {}
  };

  // 🔥 NEW: Trigger the Share Modal
  const openShareModal = (e, article) => {
    e.stopPropagation();
    setShareModalData(article);
  };

  // 🔥 NEW: Send to a specific friend inside the app
  const sendToFriend = async (friendId) => {
    const token = localStorage.getItem('token');
    const shareUrl = `${window.location.origin}/article/${shareModalData._id}`;
    const text = `Hey! Check out this article: "${shareModalData.title}"\nRead it here: ${shareUrl}`;

    try {
      await fetch(`https://lantern-library-backend.onrender.com/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverId: friendId, text: text })
      });
      alert('Article sent to friend!');
      setShareModalData(null); // Close modal
    } catch (err) {
      alert('Failed to send article.');
    }
  };

  const copyToClipboard = () => {
    const shareUrl = `${window.location.origin}/article/${shareModalData._id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
    setShareModalData(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingBottom: '40px', overflowX: 'hidden', width: '100vw', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* 🔥 THE SHARE MODAL */}
      {shareModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '350px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Share Article</h3>
              <button onClick={() => setShareModalData(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
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

      {/* HEADER */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>←</button>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>Community Articles</h2>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 15px', width: '100%', boxSizing: 'border-box' }}>
        
        <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '5px' }}>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{ flexShrink: 0, padding: '6px 16px', borderRadius: '30px', background: activeTab === cat.id ? 'var(--text-main)' : 'transparent', color: activeTab === cat.id ? 'var(--bg-panel)' : 'var(--text-muted)', border: activeTab === cat.id ? 'none' : '1px solid var(--border-color)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s ease' }}>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--lantern-gold)' }}>Loading feed...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {articles.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No records found in this category.</p>
            ) : (
              articles.map((article, index) => (
                <div key={index} onClick={() => article._id ? navigate(`/article/${article._id}`) : window.open(article.link || article.externalLink, '_blank')} style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--lantern-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>
                      {article.authorName ? article.authorName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{article.authorName || article.source}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(article.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: '1.4', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{article.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{getSnippet(article.snippet, 25)}</p>

                  {/* ACTION BAR */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <button onClick={(e) => handleLike(e, article._id)} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: article.isLikedByMe ? '#e74c3c' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', padding: 0 }}>
                        {article.isLikedByMe ? '❤️' : '🤍'} {article.likesCount || article.likes?.length || 0}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/article/${article._id}#comments`); }} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', padding: 0 }}>
                        💬 {article.comments?.length || 0}
                      </button>
                    </div>

                    <button onClick={(e) => openShareModal(e, article)} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', padding: 0 }}>
                      📤 Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}