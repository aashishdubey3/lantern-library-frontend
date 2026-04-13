import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Research() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommended');
  const navigate = useNavigate();

  const categories = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'literature', label: 'Literature' },
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'psychology', label: 'Psychology' },
    { id: 'technology', label: 'Technology' },
    { id: 'history', label: 'History' }
  ];

  const cleanTitle = (title) => title ? title.replace(/<[^>]+>/g, '') : '';

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) return navigate('/login');

    const fetchPapers = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(userString);
        let topicToSearch = activeTab;
        
        // If "recommended", use a random interest from their profile
        if (activeTab === 'recommended') {
          const userInterests = user.interests || ['Literature'];
          topicToSearch = userInterests[Math.floor(Math.random() * userInterests.length)];
        }
        
        const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(topicToSearch)}&per-page=15`);
        const data = await res.json();
        if (data.results) setPapers(data.results);
      } catch (err) { console.error("Error fetching research"); } finally { setLoading(false); }
    };
    fetchPapers();
  }, [activeTab, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingBottom: '40px', overflowX: 'hidden', width: '100vw', boxSizing: 'border-box' }}>
      
      {/* 📱 NATIVE APP STICKY HEADER */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
          ←
        </button>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>Academic Journals</h2>
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#3498db' }}>Searching global archives...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {papers.map((paper) => (
              <div key={paper.id} className="app-card" onClick={() => window.open(paper.primary_location?.landing_page_url || paper.id, '_blank')} style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '20px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🔬 Peer Reviewed
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{paper.publication_year}</span>
                </div>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '1.1rem', lineHeight: '1.4' }}>{cleanTitle(paper.title)}</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {paper.authorships?.slice(0, 3).map(a => a.author.display_name).join(', ')} {paper.authorships?.length > 3 ? 'et al.' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}