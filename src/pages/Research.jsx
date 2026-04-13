import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Research() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const cleanTitle = (title) => title ? title.replace(/<[^>]+>/g, '') : '';

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) return navigate('/login');

    const fetchPapers = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(userString);
        const userInterests = user.interests || ['Literature'];
        const randomTopic = userInterests[Math.floor(Math.random() * userInterests.length)];
        
        const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(randomTopic)}&per-page=15`);
        const data = await res.json();
        if (data.results) setPapers(data.results);
      } catch (err) { console.error("Error fetching research"); } finally { setLoading(false); }
    };
    fetchPapers();
  }, [navigate]);

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>←</button>
        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>📜 Academic Journals</h1>
      </div>

      {loading ? (
        <h3 style={{ textAlign: 'center', color: '#3498db' }}>Searching global archives...</h3>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {papers.map((paper) => (
            <div key={paper.id} className="manuscript-card" onClick={() => window.open(paper.primary_location?.landing_page_url || paper.id, '_blank')} style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '1px solid rgba(52, 152, 219, 0.3)', fontWeight: 'bold' }}>🔬 Peer Reviewed</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{paper.publication_year}</span>
              </div>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.4' }}>{cleanTitle(paper.title)}</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{paper.authorships?.slice(0, 3).map(a => a.author.display_name).join(', ')} {paper.authorships?.length > 3 ? 'et al.' : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}