import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const categories = [
    { id: 'all', label: 'All Papers' },
    { id: 'network', label: '🤝 My Network' },
    { id: 'literature', label: 'Classic Literature' },
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'psychology', label: 'Psychology' },
    { id: 'technology', label: 'Technology' }
  ];

  const getSnippet = (text, maxWords) => {
    if (!text) return "Translating...";
    const cleanText = text.replace(/<[^>]+>/g, '');
    const words = cleanText.split(/\s+/);
    return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : cleanText;
  };

  const getBadgeStyle = (index) => {
    const styles = [
      { bg: 'rgba(192, 57, 43, 0.1)', color: '#c0392b', border: 'rgba(192, 57, 43, 0.3)', label: '🪶 Lore' },
      { bg: 'rgba(41, 128, 185, 0.1)', color: '#2980b9', border: 'rgba(41, 128, 185, 0.3)', label: '📜 Archive' },
      { bg: 'rgba(39, 174, 96, 0.1)', color: '#27ae60', border: 'rgba(39, 174, 96, 0.3)', label: '🕯️ Insight' },
      { bg: 'rgba(142, 68, 173, 0.1)', color: '#8e44ad', border: 'rgba(142, 68, 173, 0.3)', label: '🗝️ Theory' }
    ];
    return styles[index % styles.length];
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://lantern-library-backend.onrender.com/api/articles/${activeTab === 'network' ? 'network' : 'feed?category=' + activeTab}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setArticles(await res.json());
      } catch (err) { console.error("Error fetching articles"); } finally { setLoading(false); }
    };
    fetchArticles();
  }, [activeTab, navigate]);

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>←</button>
        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>📰 Articles</h1>
      </div>

      <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '10px' }}>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', background: activeTab === cat.id ? 'var(--text-main)' : 'transparent', color: activeTab === cat.id ? 'var(--bg-panel)' : 'var(--text-muted)', border: activeTab === cat.id ? 'none' : '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 'bold' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <h3 style={{ textAlign: 'center', color: 'var(--lantern-gold)' }}>Pulling from the archives...</h3>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {articles.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No records found in this category.</p>
          ) : (
            articles.map((article, index) => {
              const badge = getBadgeStyle(index);
              return (
                <div key={index} className="manuscript-card" onClick={() => article._id ? navigate(`/article/${article._id}`) : window.open(article.link || article.externalLink, '_blank')} style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontWeight: 'bold' }}>{badge.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{article.authorName || article.source}</span>
                  </div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{article.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{getSnippet(article.snippet, 25)}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}