import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, Trash2, Edit3, ChevronRight } from 'lucide-react';

export default function Archive() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingArchive, setViewingArchive] = useState(null); 
  const [pageIndex, setPageIndex] = useState(0); // Flip through vault pages
  const navigate = useNavigate();

  const fetchArchives = () => {
    const token = localStorage.getItem('token');
    fetch('https://lantern-library-backend.onrender.com/api/journals/archive', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.json()).then(data => { setArchives(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) return navigate('/login');
    fetchArchives();
  }, [navigate]);

  const deleteArchive = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently burn this journal?")) return;
    const token = localStorage.getItem('token');
    await fetch(`https://lantern-library-backend.onrender.com/api/journals/archive/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchArchives();
  };

  const restoreToDesk = async () => {
    const token = localStorage.getItem('token');
    await fetch(`https://lantern-library-backend.onrender.com/api/journals/archive/restore/${viewingArchive._id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    navigate('/desk'); // Or whatever your Scrapbook route is!
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)' }}>Unlocking the Vault...</h2>;

  if (viewingArchive) {
    const activePage = viewingArchive.pages[pageIndex] || viewingArchive.pages[0];
    const items = activePage?.items || [];

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 100000, overflow: 'hidden' }}>
        
        {/* VAULT TOP NAV */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 100001 }}>
          <button onClick={() => setViewingArchive(null)} style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.8)', color: 'var(--lantern-gold)', border: '1px solid var(--lantern-gold)', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}><ChevronLeft size={18} /> Close Vault</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.8)', padding: '5px 20px', borderRadius: '30px', border: '1px solid var(--border-color)', color: '#fff' }}>
            <button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
            <span style={{ fontWeight: 'bold' }}>{activePage.name}</span>
            <button onClick={() => setPageIndex(Math.min(viewingArchive.pages.length - 1, pageIndex + 1))} disabled={pageIndex === viewingArchive.pages.length - 1} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronRight size={20} /></button>
          </div>

          <button onClick={restoreToDesk} style={{ padding: '10px 20px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}><Edit3 size={18} /> Edit on Desk</button>
        </div>
        
        {/* DESK BACKGROUND */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: viewingArchive.theme.includes('gradient') || viewingArchive.theme.includes('#') ? viewingArchive.theme : '#111' }}>
          {items.map(item => (
            <div key={item.id} style={{ position: 'absolute', top: '20%', left: '40%', transform: `translate(${item.x}px, ${item.y}px)`, zIndex: item.zIndex, background: item.type === 'note' || item.type === 'todo' ? item.color : 'transparent', padding: item.type === 'note' || item.type === 'todo' ? '15px' : '0', boxShadow: item.type === 'note' || item.type === 'todo' ? '2px 5px 15px rgba(0,0,0,0.4)' : 'none', borderRadius: item.type === 'note' || item.type === 'todo' ? '2px 10px 10px 20px' : '0', display: 'flex', flexDirection: 'column' }}>
              
              {/* READ ONLY ITEM RENDERING */}
              {item.type === 'note' && <div style={{ flexGrow: 1, fontFamily: item.font || '"Courier New", Courier, monospace', fontSize: '1.05rem', color: item.textColor || '#2c3e50', lineHeight: '1.5', minHeight: '150px', minWidth: '150px', background: item.isHighlighted ? 'rgba(241, 196, 15, 0.4)' : 'transparent', padding: '10px', borderRadius: '4px' }}>{item.text}</div>}
              {item.type === 'text' && <div style={{ flexGrow: 1, fontFamily: item.font || 'var(--font-heading)', fontSize: '1.4rem', color: item.textColor || '#fdf6e3', lineHeight: '1.6', minHeight: '100px', minWidth: '200px', background: item.isHighlighted ? 'rgba(241, 196, 15, 0.4)' : 'transparent', padding: '10px', borderRadius: '4px' }}>{item.text}</div>}
              {item.type === 'quote' && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '250px' }}>
                  <span style={{ fontSize: '4rem', color: 'rgba(245, 158, 11, 0.3)', position: 'absolute', top: '-10px', left: '10px', fontFamily: 'var(--font-heading)' }}>"</span>
                  <div style={{ fontFamily: item.font || 'var(--font-heading)', fontSize: '1.3rem', fontStyle: 'italic', color: item.textColor || '#2c3e50', textAlign: 'center', zIndex: 1 }}>{item.text}</div>
                  <div style={{ textAlign: 'center', color: 'var(--lantern-gold)', fontFamily: 'var(--font-body)', fontWeight: 'bold', fontSize: '0.9rem' }}>- {item.author}</div>
                </div>
              )}
              {item.type === 'photo' && (
                <div style={{ padding: '10px 10px 20px 10px', background: '#f8f9fa', borderRadius: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={item.url} alt="Polaroid" style={{ width: '200px', height: '200px', objectFit: 'cover', border: '1px solid #ddd' }} />
                  <div style={{ marginTop: '15px', textAlign: 'center', fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#2c3e50', width: '100%' }}>{item.caption}</div>
                </div>
              )}
              {item.type === 'todo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', padding: '10px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontFamily: 'var(--font-heading)', color: item.textColor || '#2c3e50', borderBottom: '1px solid #bdc3c7', paddingBottom: '5px' }}>{item.listTitle || 'Reading List'}</h4>
                  {item.tasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" checked={task.done} readOnly style={{ width: '18px', height: '18px' }} />
                      <span style={{ fontSize: '0.95rem', color: item.textColor || '#2c3e50', textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1 }}>{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {item.type === 'sticker' && <div style={{ fontSize: '5rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}>{item.emoji}</div>}
              {item.type === 'media' && (
                <div style={{ filter: 'drop-shadow(5px 10px 15px rgba(0,0,0,0.5))' }}>
                  {item.media.mediaType === 'book' && item.displayStyle === 'spine' ? (
                    <div className="shelf-book-spine" style={{ backgroundImage: `url(${item.media.coverImage})`, width: '50px', height: '200px', margin: 0 }}><span className="spine-title">{item.media.title}</span></div>
                  ) : (
                    <img src={item.media.coverImage} className={item.media.mediaType === 'book' ? "shelf-book" : "film-poster"} style={{ width: '130px', height: '190px', margin: 0, borderRadius: item.media.mediaType === 'book' ? '2px 6px 6px 2px' : '4px' }} alt="Media" />
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Lock size={40} color="var(--lantern-gold)" style={{ marginBottom: '15px' }} />
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', margin: '0 0 10px 0' }}>The Vault</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Permanent snapshots of your past journals and desks.</p>
      </div>

      {archives.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>Your vault is currently empty. Send a page to the archives from your Desk.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {archives.map(archive => (
            <div key={archive._id} onClick={() => { setViewingArchive(archive); setPageIndex(0); }} className="glass-card" style={{ padding: '20px', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid var(--lantern-gold)', position: 'relative' }} onMouseOver={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', paddingRight: '30px' }}>{archive.title}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked on {new Date(archive.createdAt).toLocaleDateString()}</span>
              <div style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', alignSelf: 'flex-start', color: '#bdc3c7' }}>
                {archive.pages.length} Pages Saved
              </div>
              <button onClick={(e) => deleteArchive(archive._id, e)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}