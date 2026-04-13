import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const categories = [
    { id: 'all', label: 'All Updates' },
    { id: 'network', label: '🤝 My Network' },
    { id: 'literature', label: 'Classic Literature' },
    { id: 'philosophy', label: 'Philosophy' }
  ];

  const getSnippet = (text, maxWords) => {
    if (!text) return "Translating...";
    const cleanText = text.replace(/<[^>]+>/g, '');
    const words = cleanText.split(/\s+/);
    return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : cleanText;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://lantern-library-backend.onrender.com/api/articles/${activeTab === 'network' ? 'network' : 'feed?category=' + activeTab}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setArticles(await res.json());
      } catch (err) { console.error("Error fetching articles"); } finally { setLoading(false); }
    };
    fetchArticles();
  }, [activeTab, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingBottom: '40px' }}>
      
      {/* 📱 NATIVE APP STICKY HEADER */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
          ←
        </button>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>Community Articles</h2>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 15px' }}>
        
        {/* SWIPEABLE CATEGORIES */}
        <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '5px' }}>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{ flexShrink: 0, padding: '8px 18px', borderRadius: '25px', background: activeTab === cat.id ? 'var(--text-main)' : 'var(--bg-panel)', color: activeTab === cat.id ? 'var(--bg-deep)' : 'var(--text-muted)', border: activeTab === cat.id ? 'none' : '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--lantern-gold)' }}>Loading feed...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {articles.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No records found in this category.</p>
            ) : (
              articles.map((article, index) => (
                <div key={index} className="app-card" onClick={() => article._id ? navigate(`/article/${article._id}`) : window.open(article.link || article.externalLink, '_blank')} style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--lantern-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {article.authorName ? article.authorName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{article.authorName || article.source}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Community Post</p>
                    </div>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{article.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{getSnippet(article.snippet, 25)}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}