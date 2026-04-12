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
  
  // 🔥 THE NEW 3-STATE SUMMONING MODAL ('closed', 'recommend', 'warning')
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
        const userInterests = parsedUser.interests;
        const randomTopic = userInterests[Math.floor(Math.random() * userInterests.length)];

        let artRes;
        if (activeTab === 'network') {
          artRes = await fetch(`https://lantern-library-backend.onrender.com/api/articles/network`, { headers: { 'Authorization': `Bearer ${token}` } });
        } else {
          artRes = await fetch(`https://lantern-library-backend.onrender.com/api/articles/feed?category=${activeTab}`);
        }

        const [profRes, paperRes] = await Promise.all([
          fetch('https://lantern-library-backend.onrender.com/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`https://api.openalex.org/works?search=${encodeURIComponent(randomTopic)}&per-page=5`)
        ]);

        if (artRes.ok) setArticles(await artRes.json());
        if (profRes.ok) setUserProfile(await profRes.json());
        if (paperRes.ok) setAcademicPapers((await paperRes.json()).results || []);

      } catch (error) {
        console.error("Could not fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate, activeTab]); 

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
  };

  // 🔥 THE SMART SUMMONING LOGIC GATE
  const handleSummonClick = () => {
    if (userProfile?.finishedList?.length > 0) {
      // Path 1: They have finished items. Recommend they use them!
      setSummonModalState('recommend');
    } else {
      // Path 2: Empty list. Go straight to guilt trip!
      setSummonModalState('warning');
    }
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)' }}>Dusting off the archives...</h2>;

  if (!user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', marginBottom: '40px' }}>
          <h1 style={{ fontSize: isMobile ? '2.5rem' : '4rem', color: 'var(--lantern-gold)', marginBottom: '20px', letterSpacing: '2px' }}>The Lantern Library</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>Your Library, Brought to Life. Track your favorite series, summon protagonists to chat, and dive into a world of curated research and articles.</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
            <button onClick={() => navigate('/register')} style={{ padding: '15px 30px', fontSize: '1.1rem', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Open an Account</button>
            <button onClick={() => navigate('/login')} style={{ padding: '15px 30px', fontSize: '1.1rem', background: 'transparent', color: 'var(--text-main)', border: '2px solid var(--lantern-gold)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Enter the Archives</button>
          </div>
        </div>
      </div>
    );
  }

  const currentMedia = userProfile?.currentlyConsuming?.[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: isMobile ? '0 15px' : '0 20px', position: 'relative' }}>
      
      {/* 🔮 MODAL 1: THE RECOMMENDATION (For users with finished items) */}
      {summonModalState === 'recommend' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '12px', border: '1px solid #3498db', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#3498db', marginTop: 0, fontSize: '1.6rem' }}>Highly Recommended 💡</h2>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px' }}>
              The magic works best with characters whose journeys you have fully witnessed. We recommend summoning directly from your <strong>Finished Archives</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => navigate('/profile')} style={{ padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Go to my Archives →
              </button>
              <button onClick={() => setSummonModalState('warning')} style={{ padding: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid #7f8c8d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                No, I want to summon someone else
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛑 MODAL 2: THE WARNING / GUILT TRIP (Empty list OR bypassed recommendation) */}
      {summonModalState === 'warning' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '12px', border: '1px solid #935116', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: 'var(--lantern-gold)', marginTop: 0, fontSize: '1.6rem' }}>Halt, Scholar! 🛑</h2>
            
            {userProfile?.finishedList?.length === 0 ? (
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '15px' }}>
                Your <strong>Finished</strong> shelf is completely empty. It is unwise to summon literary figures whose journeys you haven't even witnessed. Are you not ashamed?
              </p>
            ) : (
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '15px' }}>
                You are stepping outside the safety of your established archives. 
              </p>
            )}

            <p style={{ color: '#e74c3c', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '25px', background: 'rgba(231, 76, 60, 0.1)', padding: '10px', borderRadius: '6px' }}>
              <strong>Disclaimer:</strong> You must provide the Oracle with full context. Do not just type "Raskolnikov"—you must type "Raskolnikov from Crime and Punishment by Fyodor Dostoevsky" or the magic will fail.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => navigate('/summon')} style={{ padding: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid #7f8c8d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                I know the risks. Let me summon.
              </button>
              <button onClick={() => { setSummonModalState('closed'); }} style={{ padding: '12px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Cancel ↩️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STANDARD HOMEPAGE CONTENT BELOW --- */}
      <div style={{ padding: isMobile ? '20px 0' : '40px 20px', textAlign: 'center', marginBottom: isMobile ? '20px' : '40px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '1.8rem' : '2.8rem', color: 'var(--lantern-gold)', lineHeight: '1.2' }}>Your Library, Brought to Life.</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: isMobile ? '0.9rem' : '1rem', maxWidth: '700px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>Track your favorite series, summon protagonists to chat, and dive into a world of curated research and articles.</p>
        
        <div style={{ background: 'var(--bg-panel)', padding: isMobile ? '15px' : '25px', borderRadius: '16px', border: '1px solid #34495e', maxWidth: '750px', margin: '0 auto' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginBottom: '20px' }}>
            <input type="text" placeholder="Search across all realms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flexGrow: 1, padding: '12px', borderRadius: '8px', border: '1px solid #2c3e50', background: 'var(--bg-deep)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
            <button type="submit" style={{ padding: '12px 30px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>Search</button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[{ id: 'book', label: 'Books' }, { id: 'movie', label: 'Movies' }, { id: 'series', label: 'Series' }, { id: 'paper', label: 'Research' }].map(type => (
              <button key={type.id} onClick={() => setSearchType(type.id)} style={{ background: searchType === type.id ? 'var(--lantern-gold)' : 'transparent', color: searchType === type.id ? 'var(--bg-deep)' : 'var(--text-muted)', border: searchType === type.id ? 'none' : '1px solid #34495e', padding: '6px 14px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '15px' : '20px', marginBottom: '60px' }}>
        
        <div style={{ background: 'linear-gradient(135deg, var(--bg-panel) 0%, #1a1525 100%)', padding: isMobile ? '20px' : '25px', borderRadius: '12px', border: '1px solid #4a235a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}><span style={{ fontSize: '1.5rem' }}>✨</span><h3 style={{ margin: 0, color: '#c39bd3', fontSize: '1.1rem' }}>The Summoning Room</h3></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', flexGrow: 1, margin: '0 0 15px 0' }}>Dialogue with the minds behind the text. Ask Elizabeth Bennet about modern dating, or debate morality with Raskolnikov.</p>
          {/* 🔥 TRIGGERS THE NEW LOGIC GATE */}
          <button onClick={handleSummonClick} style={{ padding: '10px', background: '#4a235a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Initiate Summoning →</button>
        </div>

        <div style={{ background: 'linear-gradient(135deg, var(--bg-panel) 0%, #2e2013 100%)', padding: isMobile ? '20px' : '25px', borderRadius: '12px', border: '1px solid #935116', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}><span style={{ fontSize: '1.5rem' }}>🔮</span><h3 style={{ margin: 0, color: 'var(--lantern-gold)', fontSize: '1.1rem' }}>Stuck in a Slump?</h3></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', flexGrow: 1, margin: '0 0 15px 0' }}>Let the Oracle analyze your footprint to generate your next obsession based on what you already love.</p>
          <button onClick={() => navigate('/profile')} style={{ padding: '10px', background: 'transparent', color: 'var(--lantern-gold)', border: '1px solid var(--lantern-gold)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Consult the Oracle →</button>
        </div>

        <div style={{ background: 'var(--bg-panel)', padding: isMobile ? '20px' : '25px', borderRadius: '12px', border: '1px solid #2c3e50', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {currentMedia ? (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <img src={currentMedia.coverImage} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #34495e' }} alt="" />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#3498db', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Currently Tracking</span>
                <h3 style={{ color: 'var(--text-main)', margin: '5px 0 10px 0', fontSize: '1rem', lineHeight: '1.3' }}>{currentMedia.title}</h3>
                <button onClick={() => navigate('/profile')} style={{ padding: '6px 12px', background: 'transparent', color: '#3498db', border: '1px solid #3498db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Update Log</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-main)', margin: '0 0 10px 0', fontSize: '1.1rem' }}>The Desk is Empty</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>Your reading ledger awaits its first entry.</p>
              <button onClick={() => navigate('/search')} style={{ padding: '8px 16px', background: '#34495e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Search Archives</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: isMobile ? '1.8rem' : '2rem', color: 'var(--text-main)', margin: '0 0 10px 0' }}>The Reading Room</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Dive into curated articles and academic research.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => { setActiveTab(cat.id); setVisibleCount(4); }} style={{ padding: '6px 14px', borderRadius: '20px', background: activeTab === cat.id ? 'var(--text-main)' : 'transparent', color: activeTab === cat.id ? 'var(--bg-deep)' : 'var(--text-muted)', border: activeTab === cat.id ? 'none' : '1px solid #34495e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          
          <div style={{ background: 'var(--bg-panel)', padding: isMobile ? '15px' : '25px', borderRadius: '12px', border: '1px solid #2c3e50' }}>
            <h3 style={{ borderBottom: '2px solid var(--lantern-gold)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📰 {activeTab === 'network' ? 'Your Network Feed' : 'Daily Articles'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {articles.length === 0 && activeTab === 'network' ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Your network hasn't published anything yet, or you aren't following anyone!</p>
              ) : (
                articles.slice(0, visibleCount).map((article, index) => (
                  <div key={index} style={{ borderBottom: '1px solid #34495e', paddingBottom: '15px' }}>
                    <span onClick={() => article._id ? navigate(`/scholar/${article.authorId}`) : null} style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--lantern-gold)', textTransform: 'uppercase', cursor: article._id ? 'pointer' : 'default' }}>
                      {article.authorName || article.source || 'Community'}
                    </span>
                    <h4 style={{ margin: '8px 0', fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{article.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '15px' }}>{getSnippet(article.snippet, 30)}</p>
                    <button onClick={() => { article._id ? navigate(`/article/${article._id}`) : window.open(article.link || article.externalLink, '_blank') }} style={{ background: 'transparent', color: 'var(--lantern-gold)', border: '1px solid var(--lantern-gold)', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {article._id ? 'Read Manuscript →' : 'Read External Article ↗'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {articles.length > visibleCount && (
              <button onClick={() => setVisibleCount(prev => prev + 3)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: 'transparent', border: '1px dashed #34495e', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Load More Articles ↓</button>
            )}
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: isMobile ? '15px' : '25px', borderRadius: '12px', border: '1px solid #2c3e50' }}>
             <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📜 Academic Journals
            </h3>

            {academicPapers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Loading archives...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {academicPapers.map(paper => (
                  <div key={paper.id} style={{ background: 'var(--bg-deep)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #3498db' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.4' }}>{cleanTitle(paper.title)}</h4>
                    <p style={{ margin: '0 0 15px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {paper.authorships?.slice(0, 2).map(a => a.author.display_name).join(', ')} {paper.authorships?.length > 2 ? 'et al.' : ''} • {paper.publication_year}
                    </p>
                    <button onClick={() => window.open(paper.primary_location?.landing_page_url || paper.id, '_blank')} style={{ background: '#3498db', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      Read DOI ↗
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}