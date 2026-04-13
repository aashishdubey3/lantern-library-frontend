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

  // 🔥 FIXED SNIPPET CLEANER (Destroys &nbsp; and HTML trash)
  const getSnippet = (text, maxWords) => {
    if (!text) return "Translating...";
    let cleanText = text
      .replace(/<[^>]+>/g, '')         // Removes tags like <p>
      .replace(/&nbsp;/g, ' ')         // Replaces HTML spaces
      .replace(/&#160;/g, ' ')         // Replaces alternate HTML spaces
      .replace(/&amp;/g, '&')          // Fixes ampersands
      .replace(/&quot;/g, '"')         // Fixes quotes
      .replace(/&#39;/g, "'")          // Fixes apostrophes
      .replace(/\s+/g, ' ')            // Collapses multiple spaces into one
      .trim();
      
    const words = cleanText.split(' ');
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingBottom: '40px', overflowX: 'hidden', width: '100vw', boxSizing: 'border-box' }}>
      
      {/* NATIVE APP STICKY HEADER */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>←</button>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>Community Articles</h2>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 15px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* 🔥 SLEEK IOS-STYLE CATEGORIES */}
        <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '5px' }}>
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setActiveTab(cat.id)} 
              style={{ 
                flexShrink: 0, 
                padding: '6px 16px', 
                borderRadius: '30px', 
                background: activeTab === cat.id ? 'var(--text-main)' : 'transparent', 
                color: activeTab === cat.id ? 'var(--bg-panel)' : 'var(--text-muted)', 
                border: activeTab === cat.id ? 'none' : '1px solid var(--border-color)', 
                cursor: 'pointer', 
                fontWeight: '600', 
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
            >
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
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Community Post</p>
                    </div>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: '1.4', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{article.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{getSnippet(article.snippet, 25)}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}