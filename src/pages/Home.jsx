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

  const getSnippet = (text, maxWords) => {
    if (!text) return "The ancient texts are currently being translated...";
    const cleanText = text.replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ').replace(/<[^>]+>/g, '');
    const words = cleanText.split(/\s+/);
    if (words.length > maxWords) return words.slice(0, maxWords).join(' ') + '...';
    return cleanText;
  };

  const cleanTitle = (title) => title ? title.replace(/<[^>]+>/g, '') : '';

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
    const storedUser = localStorage.getItem('user');
    
    if (!token) { setLoading(false); return; }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    if (!parsedUser.interests || parsedUser.interests.length === 0) {
      navigate('/onboarding');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        let artResPromise = fetch(`https://lantern-library-backend.onrender.com/api/articles/${activeTab === 'network' ? 'network' : 'feed?category=' + activeTab}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const profResPromise = fetch('https://lantern-library-backend.onrender.com/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } });

        const [artRes, profRes] = await Promise.all([artResPromise, profResPromise]);

        if (artRes.ok) setArticles(await artRes.json());
        if (profRes.ok) setUserProfile(await profRes.json());

      } catch (error) {
        console.error("Could not fetch dashboard data");
      } finally {
        setLoading(false);
      }

      try {
        const userInterests = parsedUser.interests;
        const randomTopic = userInterests[Math.floor(Math.random() * userInterests.length)];
        fetch(`https://api.openalex.org/works?search=${encodeURIComponent(randomTopic)}&per-page=5`)
          .then(res => res.json())
          .then(paperData => { if (paperData.results) setAcademicPapers(paperData.results); })
          .catch(err => console.error("Background paper fetch failed", err));
      } catch (e) {
        console.error("Failed to trigger background fetch");
      }
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
  if (!user) return null; // Fallback handled by App.jsx routing usually

  const currentMedia = userProfile?.currentlyConsuming?.[0];

  return (
    <div style={{ maxWidth: '1200px', margin: isMobile ? '10px auto' : '40px auto', padding: isMobile ? '0 15px' : '0 20px', position: 'relative' }}>
      
      {/* 🔥 CSS TRICK TO HIDE SCROLLBARS ON CAROUSELS BUT KEEP SWIPING */}
      <style>
        {`
          .hide-scroll::-webkit-scrollbar { display: none; }
          .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* --- MINIMAL HERO & SEARCH --- */}
      <div style={{ padding: isMobile ? '10px 0 25px 0' : '40px 20px', textAlign: isMobile ? 'left' : 'center' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '1.8rem' : '2.8rem', color: 'var(--lantern-gold)', lineHeight: '1.2' }}>The Archives.</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: isMobile ? '0.9rem' : '1rem' }}>Your magical library, brought to life.</p>
        
        <div style={{ background: 'var(--bg-panel)', padding: isMobile ? '15px' : '25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: isMobile ? '15px' : '20px' }}>
            <input type="text" placeholder="Search the realms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flexGrow: 1, padding: '12px 16px', borderRadius: '25px', fontSize: '0.95rem', background: 'var(--bg-deep)' }} />
            {/* Hidden text on mobile for the search button, just a magnifying glass icon */}
            <button type="submit" style={{ padding: isMobile ? '0 15px' : '12px 30px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '25px', fontWeight: 'bold', fontSize: isMobile ? '1.2rem' : '1rem' }}>
              {isMobile ? '🔍' : 'Search'}
            </button>
          </form>

          {/* SWIPEABLE SEARCH TYPE PILLS */}
          <div className="hide-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
            {[{ id: 'book', label: 'Books' }, { id: 'movie', label: 'Movies' }, { id: 'series', label: 'Series' }, { id: 'paper', label: 'Research' }].map(type => (
              <button key={type.id} onClick={() => setSearchType(type.id)} style={{ flexShrink: 0, background: searchType === type.id ? 'var(--lantern-gold)' : 'transparent', color: searchType === type.id ? '#fff' : 'var(--text-muted)', border: searchType === type.id ? 'none' : '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- THE MAGIC CAROUSEL (FEATURE CARDS) --- */}
      {/* On desktop, it's a grid. On mobile, it's a horizontal swipe list! */}
      <div 
        className="hide-scroll" 
        style={{ 
          display: isMobile ? 'flex' : 'grid', 
          gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: isMobile ? '15px' : '20px', 
          overflowX: isMobile ? 'auto' : 'visible',
          scrollSnapType: isMobile ? 'x mandatory' : 'none',
          paddingBottom: isMobile ? '20px' : '60px',
          margin: isMobile ? '0 -15px' : '0', // Let it bleed to the edge of the phone
          paddingLeft: isMobile ? '15px' : '0',
          paddingRight: isMobile ? '15px' : '0'
        }}
      >
        
        {/* CARD 1: Summoning Room */}
        <div style={{ flex: isMobile ? '0 0 85%' : '1', scrollSnapAlign: 'center', background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><span style={{ fontSize: '1.5rem' }}>✨</span><h3 style={{ margin: 0, fontSize: '1.1rem' }}>The Summoning Room</h3></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', flexGrow: 1, margin: '0 0 15px 0' }}>Ask Elizabeth Bennet about dating, or debate morality with Raskolnikov.</p>
          <button onClick={handleSummonClick} style={{ padding: '10px', background: 'var(--bg-deep)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Initiate Summoning →</button>
        </div>

        {/* CARD 2: Oracle */}
        <div style={{ flex: isMobile ? '0 0 85%' : '1', scrollSnapAlign: 'center', background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><span style={{ fontSize: '1.5rem' }}>🔮</span><h3 style={{ margin: 0, fontSize: '1.1rem' }}>Stuck in a Slump?</h3></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', flexGrow: 1, margin: '0 0 15px 0' }}>Let the Oracle analyze your footprint to generate your next obsession.</p>
          <button onClick={() => navigate('/profile')} style={{ padding: '10px', background: 'transparent', color: 'var(--lantern-gold)', border: '1px solid var(--lantern-gold)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Consult the Oracle →</button>
        </div>

        {/* CARD 3: Currently Reading */}
        <div style={{ flex: isMobile ? '0 0 85%' : '1', scrollSnapAlign: 'center', background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {currentMedia ? (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <img src={currentMedia.coverImage} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} alt="" />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#3498db', fontWeight: 'bold', textTransform: 'uppercase' }}>Currently Tracking</span>
                <h3 style={{ color: 'var(--text-main)', margin: '5px 0 10px 0', fontSize: '1rem', lineHeight: '1.3' }}>{currentMedia.title}</h3>
                <button onClick={() => navigate('/profile')} style={{ padding: '6px 12px', background: 'transparent', color: '#3498db', border: '1px solid #3498db', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Update Log</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-main)', margin: '0 0 5px 0', fontSize: '1.1rem' }}>The Desk is Empty</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>Your reading ledger awaits.</p>
              <button onClick={() => navigate('/search')} style={{ padding: '8px 16px', background: 'var(--bg-deep)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Search Archives</button>
            </div>
          )}
        </div>

      </div>

      {/* --- THE READING ROOM --- */}
      <div style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', color: 'var(--text-main)', margin: '0 0 15px 0' }}>The Reading Room</h2>
        
        {/* SWIPEABLE CATEGORY TABS */}
        <div className="hide-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '10px' }}>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => { setActiveTab(cat.id); setVisibleCount(4); }} style={{ flexShrink: 0, padding: '6px 16px', borderRadius: '20px', background: activeTab === cat.id ? 'var(--text-main)' : 'transparent', color: activeTab === cat.id ? 'var(--bg-deep)' : 'var(--text-muted)', border: activeTab === cat.id ? 'none' : '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          
          {/* DAILY ARTICLES FEED */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {articles.length === 0 && activeTab === 'network' ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>Your network hasn't published anything yet!</p>
            ) : (
              articles.slice(0, visibleCount).map((article, index) => {
                const badge = getBadgeStyle(index);
                return (
                  <div key={index} className="manuscript-card" onClick={() => article._id ? navigate(`/article/${article._id}`) : window.open(article.link || article.externalLink, '_blank')} style={{ padding: isMobile ? '15px' : '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{badge.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{article.authorName || article.source || 'Community'}</span>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{article.title}</h4>
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{getSnippet(article.snippet, 20)}</p>
                  </div>
                );
              })
            )}

            {articles.length > visibleCount && (
              <button onClick={() => setVisibleCount(prev => prev + 3)} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Load More ↓</button>
            )}
          </div>

          {/* ACADEMIC PAPERS (Only shows on Desktop or if you scroll down on mobile) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>📜 Academic Journals</h3>
            {academicPapers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Searching global archives...</p>
            ) : (
              academicPapers.map((paper) => (
                <div key={paper.id} className="manuscript-card" onClick={() => window.open(paper.primary_location?.landing_page_url || paper.id, '_blank')} style={{ padding: isMobile ? '15px' : '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '1px solid rgba(52, 152, 219, 0.3)', fontWeight: 'bold', textTransform: 'uppercase' }}>🔬 Peer Reviewed</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{paper.publication_year}</span>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.4' }}>{cleanTitle(paper.title)}</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{paper.authorships?.slice(0, 2).map(a => a.author.display_name).join(', ')} {paper.authorships?.length > 2 ? 'et al.' : ''}</p>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}