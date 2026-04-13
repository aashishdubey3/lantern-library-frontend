import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [academicPapers, setAcademicPapers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('book');
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(4); 
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [summonModalState, setSummonModalState] = useState('closed');

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categories = [
    { id: 'all', label: 'All Papers' },
    { id: 'network', label: '🤝 My Network' },
    { id: 'literature', label: 'Classic Literature' },
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'psychology', label: 'Psychology' },
    { id: 'technology', label: 'Technology' }
  ];

  // 🔥 FIXED SNIPPET CLEANER (Destroys &nbsp; and HTML trash)
  const getSnippet = (text, maxWords) => {
    if (!text) return "The ancient texts are currently being translated...";
    let cleanText = text
      .replace(/<[^>]+>/g, '')         
      .replace(/&nbsp;/g, ' ')         
      .replace(/&#160;/g, ' ')         
      .replace(/&amp;/g, '&')          
      .replace(/&quot;/g, '"')         
      .replace(/&#39;/g, "'")          
      .replace(/\s+/g, ' ')            
      .trim();
    const words = cleanText.split(' ');
    return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : cleanText;
  };

  const cleanTitle = (title) => title ? title.replace(/<[^>]+>/g, '') : '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) { setLoading(false); return; }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    if (!parsedUser.interests || parsedUser.interests.length === 0) {
      navigate('/onboarding'); return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        let artResPromise = fetch(`https://lantern-library-backend.onrender.com/api/articles/${activeTab === 'network' ? 'network' : 'feed?category=' + activeTab}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const profResPromise = fetch('https://lantern-library-backend.onrender.com/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } });

        const [artRes, profRes] = await Promise.all([artResPromise, profResPromise]);
        if (artRes.ok) setArticles(await artRes.json());
        if (profRes.ok) setUserProfile(await profRes.json());
      } catch (error) { console.error("Could not fetch data"); } finally { setLoading(false); }

      try {
        const userInterests = parsedUser.interests;
        const randomTopic = userInterests[Math.floor(Math.random() * userInterests.length)];
        fetch(`https://api.openalex.org/works?search=${encodeURIComponent(randomTopic)}&per-page=5`)
          .then(res => res.json())
          .then(paperData => { if (paperData.results) setAcademicPapers(paperData.results); });
      } catch (e) { console.error("Background fetch failed"); }
    };
    
    fetchData();
  }, [navigate, activeTab]); 

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
  };

  const handleSummonClick = () => {
    if (userProfile?.finishedList?.length > 0) setSummonModalState('recommend');
    else setSummonModalState('warning');
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)' }}>Dusting off the archives...</h2>;
  if (!user) return null; 

  const currentMedia = userProfile?.currentlyConsuming?.[0];

  return (
    <div style={{ maxWidth: '1200px', margin: isMobile ? '10px auto' : '40px auto', padding: isMobile ? '0 15px' : '0 20px', position: 'relative' }}>
      
      {/* --- MODALS --- */}
      {summonModalState === 'recommend' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '20px', border: '1px solid #3498db', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ color: '#3498db', marginTop: 0, fontSize: '1.6rem' }}>Highly Recommended 💡</h2>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '25px' }}>The magic works best with characters whose journeys you have fully witnessed. We recommend summoning from your <strong>Finished Archives</strong>.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => navigate('/profile')} style={{ padding: '15px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Go to my Archives →</button>
              <button onClick={() => setSummonModalState('warning')} style={{ padding: '15px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>No, I want to summon someone else</button>
            </div>
          </div>
        </div>
      )}

      {summonModalState === 'warning' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '20px', border: '1px solid var(--lantern-gold)', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--lantern-gold)', marginTop: 0, fontSize: '1.6rem' }}>Halt, Scholar! 🛑</h2>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '15px' }}>You are stepping outside the safety of your established archives.</p>
            <p style={{ color: '#e74c3c', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '25px', background: 'rgba(231, 76, 60, 0.1)', padding: '15px', borderRadius: '12px' }}>
              <strong>Disclaimer:</strong> You must provide the Oracle with full context. Do not just type "Raskolnikov"—you must type "Raskolnikov from Crime and Punishment".
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => navigate('/summon')} style={{ padding: '15px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>I know the risks. Let me summon.</button>
              <button onClick={() => setSummonModalState('closed')} style={{ padding: '15px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel ↩️</button>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING, AESTHETIC SEARCH HERO --- */}
      <div style={{ padding: isMobile ? '30px 0 40px 0' : '60px 20px', textAlign: 'center', position: 'relative' }}>
        
        {!isMobile && (
          <>
            <h1 style={{ margin: '0 0 15px 0', fontSize: '3.5rem', color: 'var(--text-main)', textShadow: '0 0 20px rgba(243, 156, 18, 0.2)' }}>Your Library, Brought to Life.</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto 40px auto' }}>Track your favorite series, summon protagonists to chat, and dive into a world of curated research and articles.</p>
          </>
        )}
        
        {/* Floating Glassmorphism Bar */}
        <div style={{ maxWidth: '750px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Search across all realms..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ 
                flexGrow: 1, padding: '18px 25px', borderRadius: '30px', fontSize: '1.1rem', 
                background: 'rgba(21, 26, 34, 0.6)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(243, 156, 18, 0.3)', color: 'var(--text-main)',
                width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }} 
            />
            {/* The Glowing Lantern Button */}
            <button type="submit" className="lantern-search-btn" style={{ padding: '16px 35px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
              Search 🏮
            </button>
          </form>

          {/* Sleek Pills */}
          <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', justifyContent: 'center', marginTop: '20px' }}>
            {[{ id: 'book', label: 'Books' }, { id: 'movie', label: 'Movies' }, { id: 'series', label: 'Series' }, { id: 'paper', label: 'Research' }].map(type => (
              <button 
                key={type.id} 
                onClick={() => setSearchType(type.id)} 
                style={{ 
                  flexShrink: 0, padding: '8px 20px', borderRadius: '20px', 
                  background: searchType === type.id ? 'var(--lantern-gold)' : 'transparent', 
                  color: searchType === type.id ? '#fff' : 'var(--text-muted)', 
                  border: searchType === type.id ? 'none' : '1px solid var(--border-color)', 
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', transition: 'all 0.2s' 
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- SWIPEABLE FEATURE CARDS (ALIVE) --- */}
      <div 
        className="hide-scroll"
        style={{ 
          display: 'flex', 
          flexDirection: 'row',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          gap: '15px', 
          overflowX: isMobile ? 'auto' : 'visible',
          scrollSnapType: isMobile ? 'x mandatory' : 'none',
          padding: isMobile ? '10px 0 20px 0' : '0 0 60px 0',
        }}
      >
        <div className="alive-card" style={{ flex: isMobile ? '0 0 85%' : '1', scrollSnapAlign: 'center', background: 'var(--bg-panel)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}><span style={{ fontSize: '1.8rem' }}>✨</span><h3 style={{ margin: 0, fontSize: '1.2rem' }}>The Summoning Room</h3></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, margin: '0 0 20px 0' }}>Dialogue with the minds behind the text. Ask Elizabeth Bennet about modern dating, or debate morality with Raskolnikov.</p>
          <button onClick={handleSummonClick} style={{ padding: '12px', background: 'var(--bg-deep)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Initiate Summoning →</button>
        </div>

        <div className="alive-card" style={{ flex: isMobile ? '0 0 85%' : '1', scrollSnapAlign: 'center', background: 'var(--bg-panel)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}><span style={{ fontSize: '1.8rem' }}>🔮</span><h3 style={{ margin: 0, fontSize: '1.2rem' }}>Stuck in a Slump?</h3></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, margin: '0 0 20px 0' }}>Let the Oracle analyze your footprint to generate your next obsession based on what you already love.</p>
          <button onClick={() => navigate('/profile')} style={{ padding: '12px', background: 'transparent', color: 'var(--lantern-gold)', border: '1px solid var(--lantern-gold)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Consult the Oracle →</button>
        </div>

        <div className="alive-card" style={{ flex: isMobile ? '0 0 85%' : '1', scrollSnapAlign: 'center', background: 'var(--bg-panel)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {currentMedia ? (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <img src={currentMedia.coverImage} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} alt="" />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#3498db', fontWeight: 'bold', textTransform: 'uppercase' }}>Currently Tracking</span>
                <h3 style={{ color: 'var(--text-main)', margin: '5px 0 10px 0', fontSize: '1rem' }}>{currentMedia.title}</h3>
                <button onClick={() => navigate('/profile')} style={{ padding: '6px 12px', background: 'transparent', color: '#3498db', border: '1px solid #3498db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Update Log</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-main)', margin: '0 0 10px 0', fontSize: '1.1rem' }}>The Desk is Empty</h3>
              <button onClick={() => navigate('/search')} style={{ padding: '8px 16px', background: 'var(--bg-deep)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Search Archives</button>
            </div>
          )}
        </div>
      </div>

      {/* --- DESKTOP ONLY: FULL ARTICLES LIST --- */}
      {!isMobile && (
        <div style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 10px 0' }}>The Reading Room</h2>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => { setActiveTab(cat.id); setVisibleCount(4); }} 
                style={{ 
                  padding: '6px 16px', 
                  borderRadius: '30px', 
                  background: activeTab === cat.id ? 'var(--text-main)' : 'transparent', 
                  color: activeTab === cat.id ? 'var(--bg-panel)' : 'var(--text-muted)', 
                  border: activeTab === cat.id ? 'none' : '1px solid var(--border-color)', 
                  cursor: 'pointer', 
                  fontSize: '0.85rem', 
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            
            <div style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ borderBottom: '2px solid var(--lantern-gold)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-main)' }}>📰 Daily Articles</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {articles.slice(0, visibleCount).map((article, index) => (
                  <div key={index} className="app-card" onClick={() => article._id ? navigate(`/article/${article._id}`) : window.open(article.link || article.externalLink, '_blank')} style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{article.authorName || article.source || 'Community'}</span>
                    <h4 style={{ margin: '8px 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>{article.title}</h4>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{getSnippet(article.snippet, 20)}</p>
                  </div>
                ))}
              </div>
              {articles.length > visibleCount && <button onClick={() => setVisibleCount(prev => prev + 3)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: 'var(--bg-deep)', border: 'none', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Load More ↓</button>}
            </div>

            <div style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-main)' }}>📜 Academic Journals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {academicPapers.map((paper) => (
                  <div key={paper.id} className="app-card" onClick={() => window.open(paper.primary_location?.landing_page_url || paper.id, '_blank')} style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{paper.publication_year}</span>
                    <h4 style={{ margin: '8px 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>{cleanTitle(paper.title)}</h4>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MOBILE ONLY: DEEPSTASH PORTALS --- */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
          <div onClick={() => navigate('/articles')} className="app-card" style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
             <div>
               <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>📰 Read Articles</h3>
               <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Browse the daily community feed</p>
             </div>
             <span style={{ fontSize: '1.5rem', color: 'var(--lantern-gold)' }}>→</span>
          </div>

          <div onClick={() => navigate('/research')} className="app-card" style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
             <div>
               <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>📜 Academic Journals</h3>
               <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Explore global open-access research</p>
             </div>
             <span style={{ fontSize: '1.5rem', color: '#3498db' }}>→</span>
          </div>
        </div>
      )}
    </div>
  );
}