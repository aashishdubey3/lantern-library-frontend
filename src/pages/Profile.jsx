import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('tbrList');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // 🔥 NEW: Master Media Modal State (Replaced flippedCardId)
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const [recommendations, setRecommendations] = useState([]);
  const [isRecommending, setIsRecommending] = useState(false);

  const [activeSummaryId, setActiveSummaryId] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [myArticles, setMyArticles] = useState([]);

  // Network & Discovery States
  const [networkModal, setNetworkModal] = useState(null); 
  const [networkUsers, setNetworkUsers] = useState([]);
  const [isNetworkLoading, setIsNetworkLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const navigate = useNavigate();

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const response = await fetch('https://lantern-library-backend.onrender.com/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setProfileData(data);

      const artRes = await fetch('https://lantern-library-backend.onrender.com/api/articles/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (artRes.ok) setMyArticles(await artRes.json());

    } catch (error) {
      console.error("Failed to fetch profile or articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const openNetworkModal = async (type) => {
    setNetworkModal(type);
    setSearchQuery('');
    setSearchResults([]);
    setIsNetworkLoading(true);
    
    const idsToFetch = type === 'followers' ? profileData.followers : profileData.following;

    if (!idsToFetch || idsToFetch.length === 0) {
      setNetworkUsers([]);
      setIsNetworkLoading(false);
      return;
    }

    try {
      const fetchedData = await Promise.all(
        idsToFetch.map(id => fetch(`https://lantern-library-backend.onrender.com/api/users/scholar/${id}`).then(r => r.json()))
      );
      setNetworkUsers(fetchedData.map(d => d.scholar).filter(Boolean));
    } catch (err) {
      console.error("Failed to fetch network users");
    } finally {
      setIsNetworkLoading(false);
    }
  };

  const handleSearchScholars = async () => {
    if (!searchQuery.trim()) return;
    setIsNetworkLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://lantern-library-backend.onrender.com/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setSearchResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsNetworkLoading(false);
    }
  };

  const handleToggleFollow = async (targetId, action) => {
    if (action === 'unfollow' && !window.confirm("Are you sure you want to unfollow this scholar?")) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/users/follow/${targetId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfileData(prev => ({ ...prev, following: data.followingList }));
        const storedUser = JSON.parse(localStorage.getItem('user'));
        storedUser.following = data.followingList;
        localStorage.setItem('user', JSON.stringify(storedUser));
        
        if (networkModal === 'following') {
          setNetworkUsers(prev => prev.filter(u => u._id !== targetId));
        }
      }
    } catch (err) { alert("Failed to update network."); }
  };

  const handleMove = async (mediaId, currentList, targetList) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://lantern-library-backend.onrender.com/api/users/move-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mediaId, currentList, targetList })
      });
      if (response.ok) {
        await fetchProfile(); 
        setSelectedMedia(null); // Close the modal smoothly after moving
      }
    } catch (error) { alert("Failed to move item."); }
  };

  const handleReviewSubmit = async (mediaId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://lantern-library-backend.onrender.com/api/users/add-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mediaId, rating, reviewText })
      });

      if (response.ok) {
        await fetchProfile(); 
        setIsEditing(false); 
      }
    } catch (error) { alert("Server error while saving."); }
  };

  // 🔥 NEW: Opens the detailed "Off the Shelf" modal
  const openMediaModal = (item) => {
    setSelectedMedia(item);
    const existingReview = profileData.personalReviews?.[item._id];
    
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.reviewText);
      setIsEditing(false); 
    } else {
      setRating(0);
      setReviewText('');
      setIsEditing(true); 
    }
    setSummaryText('');
    setActiveSummaryId(null);
  };

  const handleGetRecommendations = async () => {
    if (profileData.finishedList.length === 0) {
      alert("You need to add some items to your Finished list first!");
      return;
    }
    setIsRecommending(true);
    setRecommendations([]); 
    const finishedTitles = profileData.finishedList.map(item => item.title);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://lantern-library-backend.onrender.com/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ finishedItems: finishedTitles })
      });
      const data = await response.json();
      if (response.ok) setRecommendations(data);
    } catch (error) {
      console.error("Oracle Error", error);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleGetSummary = async (item) => {
    setIsSummarizing(true);
    setActiveSummaryId(item._id);
    setSummaryText('Consulting the archives...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://lantern-library-backend.onrender.com/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: item.title, mediaType: item.mediaType })
      });
      const data = await response.json();
      if (response.ok) setSummaryText(data.summary);
    } catch (error) {
      setSummaryText("Could not connect to the archives.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm("Are you sure you want to burn this manuscript forever?")) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://lantern-library-backend.onrender.com/api/articles/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.ok) {
        setMyArticles(prev => prev.filter(article => article._id !== id));
      }
    } catch (error) { alert("Failed to delete manuscript."); }
  };

  const handleTogglePrivacy = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/articles/${id}/privacy`, { 
        method: 'PATCH', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const updatedArticle = await res.json();
        setMyArticles(prev => prev.map(a => a._id === id ? updatedArticle : a));
      }
    } catch (error) { alert("Failed to update privacy settings."); }
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)' }}>Dusting off your archives...</h2>;
  if (!profileData) return <h2 style={{ textAlign: 'center', color: 'var(--danger)' }}>Error loading profile.</h2>;


  // 🔥 THE NEW AESTHETIC RENDER FUNCTION 🔥
  const renderList = (list) => {
    const filteredList = mediaFilter === 'all' ? list : list.filter(item => item.mediaType === mediaFilter);
    if (filteredList.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '1.1rem', fontStyle: 'italic' }}>These shelves are currently empty.</p>;

    const books = filteredList.filter(item => item.mediaType === 'book');
    const moviesAndSeries = filteredList.filter(item => item.mediaType === 'movie' || item.mediaType === 'series');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
        
        {/* 📚 1. THE WOODEN BOOKSHELF WITH SPINES */}
        {books.length > 0 && (
          <div>
            <h3 style={{ color: 'var(--lantern-gold)', fontFamily: 'var(--font-heading)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>The Library</h3>
            <div className="wooden-shelf-container">
              {books.map(item => (
                <div 
                  key={item._id} 
                  className="shelf-book-spine" 
                  style={{ backgroundImage: `url(${item.coverImage || 'https://via.placeholder.com/150'})` }}
                  onClick={() => openMediaModal(item)}
                  title={item.title}
                >
                  <span className="spine-title">{item.title}</span>
                </div>
              ))}
              {/* This empty div forms the front lip of the 3D shelf */}
              <div className="shelf-lip"></div>
            </div>
          </div>
        )}

        {/* 🎞️ 2. THE FILM STRIP */}
        {moviesAndSeries.length > 0 && (
          <div>
            <h3 style={{ color: 'var(--lantern-gold)', fontFamily: 'var(--font-heading)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>The Screening Room</h3>
            <div className="film-strip-container hide-scroll">
              {moviesAndSeries.map(item => (
                <div key={item._id} style={{ position: 'relative' }}>
                  <img src={item.coverImage || 'https://via.placeholder.com/150'} alt={item.title} className="film-poster" onClick={() => openMediaModal(item)} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderMyWorks = () => {
    if (myArticles.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '1.1rem', fontStyle: 'italic' }}>You have not published any manuscripts yet.</p>;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {myArticles.map(article => {
          const cleanSnippet = article.snippet 
            ? article.snippet.replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ').replace(/<[^>]+>/g, '') 
            : '';

          return (
            <div 
              key={article._id} 
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid #2c3e50', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'transform 0.2s ease-in-out' }}
            >
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', lineHeight: '1.4' }}>{article.title}</h4>
                <span style={{ fontSize: '0.7rem', background: article.isPrivate ? '#e74c3c' : 'var(--success)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  {article.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                </span>
              </div>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', flexGrow: 1, marginBottom: '20px' }}>
                {cleanSnippet}
              </p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => navigate('/write', { state: { article } })} style={{ flex: 1, padding: '8px', background: 'transparent', color: '#3498db', border: '1px solid #3498db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  Edit ✏️
                </button>
                <button onClick={() => handleTogglePrivacy(article._id)} style={{ flex: 1, padding: '8px', background: 'transparent', color: 'var(--lantern-gold)', border: '1px solid var(--lantern-gold)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  {article.isPrivate ? 'Make Public 👁️' : 'Make Private 🔒'}
                </button>
                <button onClick={() => handleDeleteArticle(article._id)} style={{ padding: '8px 15px', background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  Burn 🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', position: 'relative' }}>
      
      {/* 👤 PROFILE HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${profileData.username}`} alt="Avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#ecf0f1', border: '3px solid var(--lantern-gold)', marginBottom: '15px' }} />
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', margin: '0 0 5px 0' }}>{profileData.username}'s Archives</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', fontStyle: 'italic', margin: '0 0 15px 0' }}>
          "{profileData.bio || 'A wandering scholar of the archives.'}"
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginTop: '10px', marginBottom: '10px' }}>
          <div onClick={() => openNetworkModal('followers')} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <h4 style={{ margin: '0 0 5px 0', color: 'var(--lantern-gold)', fontSize: '1.5rem' }}>{profileData?.followers?.length || 0}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Followers</span>
          </div>
          <div onClick={() => openNetworkModal('following')} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <h4 style={{ margin: '0 0 5px 0', color: 'var(--lantern-gold)', fontSize: '1.5rem' }}>{profileData?.following?.length || 0}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Following</span>
          </div>
          
          <div 
            onClick={() => { setNetworkModal('discover'); setSearchResults([]); setSearchQuery(''); }} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'transparent', border: '2px dashed var(--lantern-gold)', color: 'var(--lantern-gold)', fontSize: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--lantern-gold)'; e.currentTarget.style.color = 'var(--bg-deep)'; e.currentTarget.style.borderStyle = 'solid'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--lantern-gold)'; e.currentTarget.style.borderStyle = 'dashed'; }}
            title="Discover New Scholars"
          >
            +
          </div>
        </div>
      </div>

      {/* 🔮 THE ORACLE */}
      <div style={{ background: 'linear-gradient(135deg, var(--bg-panel) 0%, #1a150b 100%)', padding: '30px', borderRadius: '12px', marginBottom: '40px', border: '1px solid #935116', boxShadow: '0 8px 25px rgba(243, 156, 18, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: recommendations.length > 0 ? '25px' : '0' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: 'var(--lantern-gold)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🔮 The Oracle</h3>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Analyze your finished media to receive divined recommendations.</p>
          </div>
          <button 
            onClick={handleGetRecommendations} 
            disabled={isRecommending}
            style={{ padding: '12px 25px', background: 'transparent', color: 'var(--lantern-gold)', border: '2px solid var(--lantern-gold)', borderRadius: '30px', cursor: isRecommending ? 'not-allowed' : 'pointer', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}
          >
            {isRecommending ? 'Consulting...' : 'Analyze My Taste'}
          </button>
        </div>

        {recommendations.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {recommendations.map((rec, index) => (
              <div key={index} style={{ background: 'var(--bg-deep)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--lantern-gold)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{rec.title}</h4>
                <span style={{ fontSize: '0.7rem', background: '#935116', color: 'white', padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>{rec.mediaType}</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.5' }}>{rec.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAIN TABS */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('tbrList')} style={{ padding: '8px 24px', borderRadius: '25px', background: activeTab === 'tbrList' ? 'var(--text-main)' : 'transparent', color: activeTab === 'tbrList' ? 'var(--bg-deep)' : 'var(--text-muted)', border: activeTab === 'tbrList' ? 'none' : '1px solid #555', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>To Be Read</button>
        <button onClick={() => setActiveTab('currentlyConsuming')} style={{ padding: '8px 24px', borderRadius: '25px', background: activeTab === 'currentlyConsuming' ? 'var(--text-main)' : 'transparent', color: activeTab === 'currentlyConsuming' ? 'var(--bg-deep)' : 'var(--text-muted)', border: activeTab === 'currentlyConsuming' ? 'none' : '1px solid #555', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Currently Consuming</button>
        <button onClick={() => setActiveTab('finishedList')} style={{ padding: '8px 24px', borderRadius: '25px', background: activeTab === 'finishedList' ? 'var(--text-main)' : 'transparent', color: activeTab === 'finishedList' ? 'var(--bg-deep)' : 'var(--text-muted)', border: activeTab === 'finishedList' ? 'none' : '1px solid #555', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Finished</button>
        <button onClick={() => setActiveTab('myWorks')} style={{ padding: '8px 24px', borderRadius: '25px', background: activeTab === 'myWorks' ? 'var(--lantern-gold)' : 'transparent', color: activeTab === 'myWorks' ? 'var(--bg-deep)' : 'var(--lantern-gold)', border: activeTab === 'myWorks' ? 'none' : '1px solid var(--lantern-gold)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>🖋️ My Works</button>
      </div>

      {/* FILTER BAR */}
      {activeTab !== 'myWorks' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '35px', paddingBottom: '20px', borderBottom: '1px solid #34495e' }}>
          {['all', 'book', 'movie', 'series'].map(type => (
            <button 
              key={type}
              onClick={() => setMediaFilter(type)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: mediaFilter === type ? 'var(--lantern-gold)' : 'var(--text-muted)', fontWeight: mediaFilter === type ? 'bold' : 'normal', fontSize: '0.95rem', textTransform: 'capitalize', borderBottom: mediaFilter === type ? '2px solid var(--lantern-gold)' : '2px solid transparent', paddingBottom: '5px', transition: 'all 0.2s' }}
            >
              {type === 'all' ? 'All Media' : type === 'book' ? '📚 Books' : type === 'movie' ? '🎬 Movies' : '📺 Series'}
            </button>
          ))}
        </div>
      )}

      {/* LIST CONTENT */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'myWorks' ? renderMyWorks() : renderList(profileData[activeTab])}
      </div>

      {/* NETWORK MODAL */}
      {networkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '12px', width: '450px', maxWidth: '90%', border: '1px solid var(--lantern-gold)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #34495e', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                {networkModal === 'discover' ? 'Discover Scholars' : networkModal}
              </h2>
              <button onClick={() => setNetworkModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#e74c3c'} onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}>×</button>
            </div>

            {networkModal === 'discover' && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  placeholder="Search by exact username..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchScholars()}
                  style={{ flexGrow: 1, padding: '10px', borderRadius: '6px', border: '1px solid #34495e', background: 'var(--bg-deep)', color: 'var(--text-main)' }}
                />
                <button onClick={handleSearchScholars} style={{ padding: '10px 20px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Search
                </button>
              </div>
            )}

            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
              {isNetworkLoading ? (
                <p style={{ textAlign: 'center', color: 'var(--lantern-gold)' }}>Consulting the network...</p>
              ) : (networkModal === 'discover' ? searchResults : networkUsers).length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {networkModal === 'discover' ? (searchQuery ? 'No scholars found matching that name.' : 'Search to expand your network.') : 'No scholars found.'}
                </p>
              ) : (
                (networkModal === 'discover' ? searchResults : networkUsers).map(user => {
                  const isFollowingThisUser = profileData.following?.includes(user._id);
                  const isSelf = user._id === profileData._id;

                  return (
                    <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 10px', borderBottom: '1px solid #2c3e50' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => { setNetworkModal(null); navigate(`/scholar/${user._id}`); }}>
                        <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} alt="Avatar" style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ecf0f1' }} />
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{user.username}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.followers?.length || 0} Followers</span>
                        </div>
                      </div>
                      
                      {!isSelf && (networkModal === 'following' || networkModal === 'discover') ? (
                        <button 
                          onClick={() => handleToggleFollow(user._id, isFollowingThisUser ? 'unfollow' : 'follow')} 
                          style={{ 
                            background: isFollowingThisUser ? 'transparent' : 'var(--lantern-gold)', 
                            color: isFollowingThisUser ? '#e74c3c' : 'var(--bg-deep)', 
                            border: isFollowingThisUser ? '1px solid #e74c3c' : 'none', 
                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' 
                          }}
                        >
                          {isFollowingThisUser ? 'Unfollow ✂️' : 'Follow +'}
                        </button>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* 🔥 THE NEW "PULL OFF SHELF" MEDIA MODAL 🔥 */}
      {selectedMedia && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--bg-panel)', borderRadius: '16px', display: 'flex', flexDirection: window.innerWidth <= 768 ? 'column' : 'row', maxWidth: '800px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid var(--lantern-gold)' }}>
            
            {/* Left Column: The Full Cover */}
            <div style={{ flex: '0 0 250px', background: '#000', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={selectedMedia.coverImage || 'https://via.placeholder.com/150'} alt={selectedMedia.title} style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', border: '2px solid #222' }} />
            </div>

            {/* Right Column: The Features & Notes */}
            <div style={{ flexGrow: 1, padding: '30px', display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--lantern-gold)', fontFamily: 'var(--font-heading)', fontSize: '1.8rem', lineHeight: '1.2' }}>{selectedMedia.title}</h2>
                <button onClick={() => setSelectedMedia(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '2rem', cursor: 'pointer' }}>×</button>
              </div>

              {/* Action Buttons Container */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', paddingBottom: '25px', borderBottom: '1px solid var(--border-color)' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Current Location</label>
                  <select value={activeTab} onChange={(e) => handleMove(selectedMedia._id, activeTab, e.target.value)} style={{ padding: '10px', fontSize: '0.9rem', background: 'var(--bg-deep)', color: 'var(--lantern-gold)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    <option value="tbrList">To Be Read/Watched</option>
                    <option value="currentlyConsuming">Currently Consuming</option>
                    <option value="finishedList">Finished Shelf</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'flex-end' }}>
                  {activeTab === 'tbrList' && (
                    <button onClick={() => handleGetSummary(selectedMedia)} style={{ padding: '10px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '1px solid #3498db', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {isSummarizing ? 'Consulting Oracle...' : 'Ask AI Summary ✨'}
                    </button>
                  )}
                  {activeTab === 'finishedList' && (
                    <button onClick={() => navigate('/summon', { state: { title: selectedMedia.title } })} style={{ padding: '10px', background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6', border: '1px solid #9b59b6', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      Summon Character 🔮
                    </button>
                  )}
                </div>
              </div>

              {/* AI Summary Display Box */}
              {activeSummaryId === selectedMedia._id && summaryText && (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '25px', background: 'var(--bg-deep)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #3498db', lineHeight: '1.6' }}>
                  {summaryText}
                </div>
              )}

              {/* Personal Notes Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>My Marginalia</h3>
                {!isEditing && <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Edit Notes</button>}
              </div>

              {!isEditing && profileData.personalReviews?.[selectedMedia._id] ? (
                <div style={{ background: 'var(--bg-deep)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '24px', color: 'var(--lantern-gold)', marginBottom: '10px' }}>
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.6', margin: 0 }}>"{reviewText}"</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '15px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer', fontSize: '28px', color: star <= rating ? 'var(--lantern-gold)' : '#34495e', transition: 'color 0.2s' }}>★</span>
                    ))}
                  </div>
                  <textarea 
                    placeholder="Pen your thoughts here..." 
                    value={reviewText} 
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{ padding: '15px', resize: 'vertical', minHeight: '100px', borderRadius: '8px', border: '1px solid #34495e', marginBottom: '15px', background: 'var(--bg-deep)', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { if(!profileData.personalReviews?.[selectedMedia._id]) setIsEditing(false); }} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid #7f8c8d', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>Cancel</button>
                    <button onClick={() => handleReviewSubmit(selectedMedia._id)} style={{ flex: 1, padding: '12px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>Save Marginalia</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}