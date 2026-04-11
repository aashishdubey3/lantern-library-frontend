import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'book'; 

  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  
  // 🔥 NEW: Tracks which card is being hovered for the Blurb Overlay
  const [hoveredCard, setHoveredCard] = useState(null);

  // 🔑 YOUR OFFICIAL TMDB API KEY
  const TMDB_API_KEY = "9dd0a1ecebdae6f85705540be76728a8"; 

  useEffect(() => {
    if (!query) return;

    const fetchRealData = async () => {
      setIsSearching(true);
      setResults([]); 

      try {
        let combinedItems = [];

        // 📚 BOOKS
        if (type === 'book') {
          let googleFoundResults = false;

          try {
            const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=12`);
            if (googleRes.ok) {
              const data = await googleRes.json();
              if (data.items && data.items.length > 0) {
                const googleBooks = data.items.map(book => ({
                  id: `google-${book.id}`,
                  title: book.volumeInfo.title,
                  creator: book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : "Unknown Author",
                  year: book.volumeInfo.publishedDate ? book.volumeInfo.publishedDate.substring(0, 4) : "Unknown",
                  cover: book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://placehold.co/150x220/2c3e50/ecf0f1?text=No+Cover',
                  mediaType: 'book',
                  externalLink: book.volumeInfo.infoLink || null,
                  // 🔥 ADDED: Grab the description for the blurb
                  description: book.volumeInfo.description || 'No summary available in the archives.'
                }));
                combinedItems = [...combinedItems, ...googleBooks];
                googleFoundResults = true; 
              }
            }
          } catch (err) {
            console.error("Google Books API unreachable:", err);
          }

          if (!googleFoundResults) {
            try {
              const openLibRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`);
              if (openLibRes.ok) {
                const data = await openLibRes.json();
                if (data.docs) {
                  const openLibBooks = data.docs.map(book => ({
                    id: `openlib-${book.key}`,
                    title: book.title,
                    creator: book.author_name ? book.author_name.join(', ') : "Unknown Author",
                    year: book.first_publish_year || "Unknown",
                    cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : 'https://placehold.co/150x220/2c3e50/ecf0f1?text=No+Cover',
                    mediaType: 'book',
                    externalLink: `https://openlibrary.org${book.key}`,
                    description: 'Summary available upon reading.'
                  }));
                  combinedItems = [...combinedItems, ...openLibBooks];
                }
              }
            } catch (err) {
              console.error("Open Library API unreachable:", err);
            }
          }
        } 
        
        // 🎬 MOVIES
        else if (type === 'movie') {
          const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
          const data = await response.json();
          
          if (data.results) {
            combinedItems = data.results.map(movie => ({
              id: `tmdb-${movie.id}`,
              title: movie.title,
              creator: "Movie",
              year: movie.release_date ? movie.release_date.substring(0, 4) : "Unknown",
              cover: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/150x220/2c3e50/ecf0f1?text=No+Cover',
              mediaType: 'movie',
              externalLink: null,
              description: movie.overview || 'No summary available.'
            }));
          }
        }

        // 📺 SERIES
        else if (type === 'series') {
          const [tmdbRes, tvmazeRes] = await Promise.allSettled([
            fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`),
            fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`)
          ]);

          if (tmdbRes.status === 'fulfilled') {
            const data = await tmdbRes.value.json();
            if (data.results) {
              const tmdbSeries = data.results.map(series => ({
                id: `tmdb-${series.id}`,
                title: series.name,
                creator: "TV Series (TMDB)",
                year: series.first_air_date ? series.first_air_date.substring(0, 4) : "Unknown",
                cover: series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : 'https://placehold.co/150x220/2c3e50/ecf0f1?text=No+Cover',
                mediaType: 'series',
                externalLink: null,
                description: series.overview || 'No summary available.'
              }));
              combinedItems = [...combinedItems, ...tmdbSeries];
            }
          }

          if (tvmazeRes.status === 'fulfilled') {
            const data = await tvmazeRes.value.json();
            if (data && data.length > 0) {
              const tvmazeSeries = data.slice(0, 8).map(item => ({
                id: `tvmaze-${item.show.id}`,
                title: item.show.name,
                creator: "TV Series (TVMaze)",
                year: item.show.premiered ? item.show.premiered.substring(0, 4) : "Unknown",
                cover: item.show.image?.original || 'https://placehold.co/150x220/2c3e50/ecf0f1?text=No+Cover',
                mediaType: 'series',
                externalLink: item.show.url || null,
                description: item.show.summary ? item.show.summary.replace(/<[^>]+>/g, '') : 'No summary available.'
              }));
              combinedItems = [...combinedItems, ...tvmazeSeries];
            }
          }
        }

        // 📜 PAPERS
        else if (type === 'paper') {
          const response = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=12`);
          const data = await response.json();
          
          if (data.results) {
            combinedItems = data.results.map(paper => {
              let authorText = "Unknown Scholars";
              if (paper.authorships && paper.authorships.length > 0) {
                const topAuthors = paper.authorships.slice(0, 3).map(a => a.author.display_name);
                authorText = topAuthors.join(', ') + (paper.authorships.length > 3 ? ' et al.' : '');
              }
              return {
                id: `openalex-${paper.id}`,
                title: paper.title || "Untitled Archive",
                creator: authorText,
                year: paper.publication_year || "Unknown",
                cover: `https://placehold.co/150x220/1a1c23/f39c12?text=Research%5CnPaper`,
                mediaType: 'paper',
                externalLink: paper.primary_location?.landing_page_url || paper.id,
                description: 'Research paper abstract available via external link.'
              };
            });
          }
        }

        // DEDUPLICATION
        const uniqueResults = [];
        const seenTitles = new Set();
        for (const item of combinedItems) {
          const normalizedTitle = item.title.toLowerCase().trim();
          if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            uniqueResults.push(item);
          }
        }

        setResults(uniqueResults);
      } catch (error) {
        console.error("Search API Error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchRealData();
  }, [query, type]);

  const handleAddToLibrary = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) return alert("You must be logged in to add to your library.");

    try {
      const response = await fetch('https://lantern-library-backend.onrender.com/api/users/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: item.title, mediaType: item.mediaType, coverImage: item.cover, listType: 'tbrList' })
      });

      const data = await response.json(); 

      if (response.ok) {
        alert(`✨ Added "${item.title}" to your Archives!`);
      } else {
        alert(`❌ Failed: ${data.message || "Unknown Database Error"}`);
      }
    } catch (error) {
      alert("Server error. Check your backend terminal for the red error code!");
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #34495e' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '10px' }}>Searching the Archives...</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Looking for <span style={{ color: 'var(--lantern-gold)', fontWeight: 'bold', textTransform: 'capitalize' }}>{type}s</span> matching "<span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>{query}</span>"
        </p>
      </div>

      {isSearching ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2 style={{ color: 'var(--lantern-gold)', letterSpacing: '2px' }}>Consulting the Global Networks...</h2>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
          {results.map((item) => (
            <div 
              key={item.id} 
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                setHoveredCard(item.id); // Trigger the blurb!
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                setHoveredCard(null); // Hide the blurb
              }}
              style={{ background: 'var(--bg-panel)', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2c3e50', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease-in-out', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            >
              
              {/* 🔥 IMAGE CONTAINER WITH BLURB OVERLAY */}
              <div style={{ position: 'relative', width: '100%', height: '280px' }}>
                <img src={item.cover} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderBottom: '2px solid var(--lantern-gold)' }} />
                
                {hoveredCard === item.id && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 14, 23, 0.90)', padding: '15px', overflowY: 'auto', backdropFilter: 'blur(3px)', borderBottom: '2px solid var(--lantern-gold)' }}>
                    <p style={{ color: '#ecf0f1', fontSize: '0.85rem', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>
                      {item.description}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>{item.title}</h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.creator} • {item.year}
                </p>
                
                <div style={{ marginTop: 'auto', display: 'flex', gap: '5px', flexDirection: 'column' }}>
                  {item.externalLink && (
                    <button onClick={() => window.open(item.externalLink, '_blank')} style={{ width: '100%', padding: '8px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      View Details
                    </button>
                  )}
                  <button onClick={() => handleAddToLibrary(item)} style={{ width: '100%', padding: '10px', background: 'transparent', color: 'var(--lantern-gold)', border: '1px solid var(--lantern-gold)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1px', transition: 'all 0.2s' }} onMouseOver={(e) => { e.target.style.background = 'var(--lantern-gold)'; e.target.style.color = 'var(--bg-deep)'; }} onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--lantern-gold)'; }}>
                    + Add to Library
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isSearching && results.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '50px' }}>
          The archives hold no records of this title. 
        </p>
      )}
    </div>
  );
}