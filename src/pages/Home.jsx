import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Compass, BookOpen, Newspaper, ScrollText, Search } from 'lucide-react';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [academicPapers, setAcademicPapers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('book');
  const [searchFocused, setSearchFocused] = useState(false); 
  
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(4); 
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [summonModalState, setSummonModalState] = useState('closed');

  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const searchCategories = [
    { id: 'book', label: 'Books' }, 
    { id: 'movie', label: 'Movies' }, 
    { id: 'series', label: 'Series' }, 
    { id: 'paper', label: 'Research' }
  ];

  const categories = [
    { id: 'all', label: 'All Papers' },
    { id: 'network', label: 'My Network' },
    { id: 'literature', label: 'Classic Literature' },
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'psychology', label: 'Psychology' },
    { id: 'technology', label: 'Technology' }
  ];

  const getSnippet = (text, maxWords) => {
    if (!text) return "The ancient texts are currently being translated...";
    let cleanText = text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
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

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)', fontFamily: 'var(--font-heading)' }}>Dusting off the archives...</h2>;
  if (!user) return null; 

  const currentMedia = userProfile?.currentlyConsuming?.[0];

  return (
    <div style={{ maxWidth: '1200px', margin: isMobile ? '0 auto' : '40px auto', padding: isMobile ? '0' : '0 20px', position: 'relative' }}>
      
      <div className={`page-dimmer ${searchFocused ? 'active' : ''}`} onClick={() => setSearchFocused(false)}></div>

      {/* --- MODALS (Unchanged) --- */}
      {summonModalState === 'recommend' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '20px', border: '1px solid #3498db', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ color: '#3498db', marginTop: 0, fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>Highly Recommended</h2>
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
            <h2 style={{ color: 'var(--lantern-gold)', marginTop: 0, fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>Halt, Scholar!</h2>
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

      {/* --- HERO SEARCH SECTION --- */}
      <div className={`animate-cascade-1 ${searchFocused ? 'search-container focused' : 'search-container'}`} style={{ padding: isMobile ? '40px 15px 20px 15px' : '60px 20px', textAlign: 'center', position: 'relative', zIndex: 100 }}>
        
        {!isMobile && (
          <>
            <h1 style={{ margin: '0 0 15px 0', fontSize: '3.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', textShadow: '0 0 20px rgba(245, 158, 11, 0.15)' }}>Your Library, Brought to Life.</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto 40px auto' }}>Track your favorite series, summon protagonists to chat, and dive into a world of curated research and articles.</p>
          </>
        )}
        
        <div style={{ maxWidth: '650px', margin: '0 auto', position: 'relative' }}>
          
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search across all realms..." 
              value={searchQuery} 
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ 
                width: '100%', padding: '18px 70px 18px 25px', borderRadius: '30px', fontSize: '1.1rem', 
                background: 'rgba(20, 20, 23, 0.7)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
                border: searchFocused ? '1px solid var(--lantern-gold)' : '1px solid rgba(245, 158, 11, 0.3)', 
                color: 'var(--text-main)', boxShadow: searchFocused ? '0 10px 40px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }} 
            />
            {/* 🔥 UNIFIED NATIVE SEARCH ICON */}
            <button 
              type="submit" 
              style={{ 
                position: 'absolute', right: '8px', top: '8px', bottom: '8px', 
                background: 'var(--lantern-gold)', border: 'none', cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 18px', borderRadius: '25px', color: '#fff', transition: 'transform 0.2s',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
          </form>

          {/* TRANSLUCENT AMBER TABS */}
          <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', justifyContent: 'center', marginTop: '20px' }}>
            {searchCategories.map(type => {
              const isActive = searchType === type.id;
              return (
                <button 
                  key={type.id} 
                  onClick={() => setSearchType(type.id)} 
                  style={{ 
                    flexShrink: 0, padding: '8px 20px', borderRadius: '20px', 
                    background: isActive ? 'var(--lantern-glow)' : 'transparent', 
                    color: isActive ? 'var(--lantern-gold)' : 'var(--text-muted)', 
                    border: '1px solid transparent', 
                    cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s' 
                  }}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? '0 15px 20px 15px' : '0 0 60px 0' }}>
        
        {/* 🔥 THE HERO CARD: SUMMONING ROOM */}
        <div className="glass-card animate-cascade-2" style={{ padding: isMobile ? '35px 20px' : '50px 40px', borderRadius: '24px', textAlign: 'center', marginBottom: '15px', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 20, 23, 0.6) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', background: 'var(--lantern-glow)', filter: 'blur(50px)', borderRadius: '50%', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Sparkles size={40} color="var(--lantern-gold)" strokeWidth={1.5} />
            <h3 style={{ margin: '15px 0 10px 0', fontSize: isMobile ? '1.8rem' : '2.2rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontWeight: '700' }}>The Summoning Room</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 25px auto' }}>Dialogue with the minds behind the text. Ask Elizabeth Bennet about modern dating, or debate morality with Raskolnikov.</p>
            
            <button className="card-cta-btn" onClick={handleSummonClick} style={{ padding: '14px 28px', fontSize: '1.05rem', borderRadius: '30px' }}>
              Initiate Summoning &rarr;
            </button>
          </div>
        </div>

        {/* 🔥 SECONDARY DRAWER: ORACLE & TRACKER (Swipeable Row) */}
        <div className="hide-scroll animate-cascade-3" style={{ display: 'flex', gap: '15px', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '10px' }}>
          
          <div className="glass-card" style={{ flex: '0 0 85%', minWidth: '280px', scrollSnapAlign: 'center', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <Compass size={24} color="var(--lantern-gold)" strokeWidth={1.5} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Stuck in a Slump?</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, margin: '0 0 20px 0' }}>Let the Oracle generate your next obsession based on what you already love.</p>
            <button className="card-cta-btn" onClick={() => navigate('/profile')}>Consult the Oracle &rarr;</button>
          </div>

          <div className="glass-card" style={{ flex: '0 0 85%', minWidth: '280px', scrollSnapAlign: 'center', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {currentMedia ? (
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <img src={currentMedia.coverImage} style={{ width: '70px', height: '105px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} alt="" />
                <div style={{ flexGrow: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--lantern-gold)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Currently Tracking</span>
                  <h3 style={{ color: 'var(--text-main)', margin: '4px 0 12px 0', fontSize: '1.1rem', lineHeight: '1.3', fontFamily: 'var(--font-heading)' }}>{currentMedia.title}</h3>
                  <button className="card-cta-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => navigate('/profile')}>Update Log</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                  <BookOpen size={24} color="var(--text-main)" strokeWidth={1.5} />
                  <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>The Desk is Empty</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>Your reading ledger awaits its first entry. Discover your next adventure.</p>
                <button className="card-cta-btn" onClick={() => navigate('/search')}>Search Archives</button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- DESKTOP ONLY: FULL ARTICLES LIST --- */}
      {!isMobile && (
        <div className="animate-cascade-3" style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 10px 0', fontFamily: 'var(--font-heading)' }}>The Reading Room</h2>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
            {categories.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => { setActiveTab(cat.id); setVisibleCount(4); }} 
                  style={{ 
                    padding: '6px 16px', borderRadius: '30px', 
                    background: isActive ? 'var(--lantern-glow)' : 'transparent', 
                    color: isActive ? 'var(--lantern-gold)' : 'var(--text-muted)', 
                    border: '1px solid transparent', 
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s ease' 
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            <div className="glass-card" style={{ padding: '25px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
                <Newspaper size={20} color="var(--lantern-gold)" />
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Daily Articles</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {articles.slice(0, visibleCount).map((article, index) => (
                  <div key={index} className="app-card" onClick={() => article._id ? navigate(`/article/${article._id}`) : window.open(article.link || article.externalLink, '_blank')} style={{ padding: '15px', borderRadius: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--lantern-gold)' }}>{article.authorName || article.source || 'Community'}</span>
                    <h4 style={{ margin: '8px 0', fontSize: '1.05rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>{article.title}</h4>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{getSnippet(article.snippet, 20)}</p>
                  </div>
                ))}
              </div>
              {articles.length > visibleCount && <button onClick={() => setVisibleCount(prev => prev + 3)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Load More &darr;</button>}
            </div>

            <div className="glass-card" style={{ padding: '25px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
                <ScrollText size={20} color="var(--lantern-gold)" />
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Academic Journals</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {academicPapers.map((paper) => (
                  <div key={paper.id} className="app-card" onClick={() => window.open(paper.primary_location?.landing_page_url || paper.id, '_blank')} style={{ padding: '15px', borderRadius: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{paper.publication_year}</span>
                    <h4 style={{ margin: '8px 0', color: 'var(--text-main)', fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>{cleanTitle(paper.title)}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOBILE ONLY: DEEPSTASH PORTALS --- */}
      {isMobile && (
        <div className="animate-cascade-3" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '0 15px 40px 15px' }}>
          <div onClick={() => navigate('/articles')} className="glass-card" style={{ padding: '25px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ padding: '10px', background: 'var(--lantern-glow)', borderRadius: '12px' }}><Newspaper size={24} color="var(--lantern-gold)" /></div>
               <div><h3 style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>Read Articles</h3><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Browse the daily community feed</p></div>
             </div>
             <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>&rarr;</span>
          </div>
          <div onClick={() => navigate('/research')} className="glass-card" style={{ padding: '25px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}><ScrollText size={24} color="#3b82f6" /></div>
               <div><h3 style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>Academic Journals</h3><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Explore global open-access research</p></div>
             </div>
             <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>&rarr;</span>
          </div>
        </div>
      )}
    </div>
  );
}