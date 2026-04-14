import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StickyNote, Quote, Image as ImageIcon, CheckSquare, BookOpen, Trash2, Loader2, SmilePlus, X } from 'lucide-react';

export default function Scrapbook() {
  const [items, setItems] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [activeZIndex, setActiveZIndex] = useState(10);
  
  const constraintsRef = useRef(null);

  // Fetch user profile so they can pull their books/movies onto the desk
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('https://lantern-library-backend.onrender.com/api/users/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()).then(data => setProfileData(data)).catch(console.error);
  }, []);

  const bringToFront = () => {
    setActiveZIndex(prev => prev + 1);
    return activeZIndex + 1;
  };

  // --- ITEM SPAWNERS ---

  const addNote = () => {
    setItems([...items, { 
      id: Date.now(), type: 'note', text: '', 
      color: ['#fdf6e3', '#fcf3cf', '#f9e79f', '#e8f8f5'][Math.floor(Math.random() * 4)], 
      zIndex: bringToFront() 
    }]);
  };

  const addQuote = () => {
    setItems([...items, { id: Date.now(), type: 'quote', text: '', author: '', zIndex: bringToFront() }]);
  };

  const addTodo = () => {
    setItems([...items, { id: Date.now(), type: 'todo', tasks: [{ id: 1, text: '', done: false }], zIndex: bringToFront() }]);
  };

  const addSticker = (emoji) => {
    setItems([...items, { id: Date.now(), type: 'sticker', emoji, zIndex: bringToFront() }]);
    setShowStickerMenu(false);
  };

  const addMediaItem = (media) => {
    setItems([...items, { id: Date.now(), type: 'media', media, zIndex: bringToFront() }]);
    setShowMediaModal(false);
  };

  const addPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'lantern_articles'); // Your Cloudinary Preset
      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dfugne8fq/image/upload', { method: 'POST', body: formData });
        const data = await res.json();
        setItems(prev => [...prev, { id: Date.now(), type: 'photo', url: data.secure_url, caption: '', zIndex: bringToFront() }]);
      } catch (err) { alert('Upload failed'); } finally { setIsUploading(false); }
    };
    input.click();
  };

  // --- ITEM UPDATERS ---

  const deleteItem = (id) => setItems(items.filter(item => item.id !== id));
  
  const updateItem = (id, updates) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const updateTodoTask = (itemId, taskId, updates) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newTasks = item.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
        // Automatically add a new empty task if they start typing in the last one
        if (updates.text && taskId === item.tasks[item.tasks.length - 1].id) {
          newTasks.push({ id: Date.now(), text: '', done: false });
        }
        return { ...item, tasks: newTasks };
      }
      return item;
    }));
  };

  // --- RENDERERS ---

  const renderItemContent = (item) => {
    switch (item.type) {
      
      case 'note':
        return (
          <textarea
            value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })}
            placeholder="Scribble your thoughts..."
            onPointerDownCapture={(e) => e.stopPropagation()} // Allows text selection without dragging
            style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: '"Courier New", Courier, monospace', fontSize: '1.05rem', color: '#2c3e50', lineHeight: '1.5', cursor: 'text', minHeight: '150px' }}
          />
        );
      
      case 'quote':
        return (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '250px' }}>
            <span style={{ fontSize: '4rem', color: 'rgba(245, 158, 11, 0.3)', position: 'absolute', top: '-10px', left: '10px', fontFamily: 'var(--font-heading)', pointerEvents: 'none' }}>"</span>
            <textarea
              value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })}
              placeholder="Enter a profound quote..." onPointerDownCapture={(e) => e.stopPropagation()}
              style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--text-main)', textAlign: 'center', minHeight: '100px', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            />
            <input 
              value={item.author} onChange={(e) => updateItem(item.id, { author: e.target.value })}
              placeholder="- Author" onPointerDownCapture={(e) => e.stopPropagation()}
              style={{ background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', color: 'var(--lantern-gold)', fontFamily: 'var(--font-body)', fontWeight: 'bold', fontSize: '0.9rem' }}
            />
          </div>
        );

      case 'photo':
        return (
          <div style={{ padding: '10px 10px 20px 10px', background: '#f8f9fa', borderRadius: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={item.url} alt="Polaroid" draggable="false" style={{ width: '200px', height: '200px', objectFit: 'cover', border: '1px solid #ddd', pointerEvents: 'none' }} />
            <input 
              value={item.caption} onChange={(e) => updateItem(item.id, { caption: e.target.value })}
              placeholder="Write a caption..." onPointerDownCapture={(e) => e.stopPropagation()}
              style={{ marginTop: '15px', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#2c3e50', width: '100%' }}
            />
          </div>
        );

      case 'todo':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', padding: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontFamily: 'var(--font-heading)', color: '#2c3e50', borderBottom: '1px solid #bdc3c7', paddingBottom: '5px' }}>Reading List</h4>
            {item.tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" checked={task.done} 
                  onChange={(e) => updateTodoTask(item.id, task.id, { done: e.target.checked })}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }} 
                />
                <input 
                  value={task.text} onChange={(e) => updateTodoTask(item.id, task.id, { text: e.target.value })}
                  placeholder="New item..." onPointerDownCapture={(e) => e.stopPropagation()}
                  style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', color: '#2c3e50', textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1 }}
                />
              </div>
            ))}
          </div>
        );

      case 'sticker':
        return <div style={{ fontSize: '5rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}>{item.emoji}</div>;

      case 'media':
        // Uses the CSS classes we built for Profile.jsx!
        const isBook = item.media.mediaType === 'book';
        return (
          <div style={{ filter: 'drop-shadow(5px 10px 15px rgba(0,0,0,0.5))' }}>
            {isBook ? (
              <div className="shelf-book-spine" style={{ backgroundImage: `url(${item.media.coverImage})`, width: '50px', height: '200px' }}>
                <span className="spine-title">{item.media.title}</span>
              </div>
            ) : (
              <img src={item.media.coverImage} className="film-poster" style={{ width: '140px', height: '210px', margin: 0 }} alt="Media" />
            )}
          </div>
        );

      default: return null;
    }
  };

  // 🎨 MAIN UI
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#111' }}>
      
      {/* The Textured Desk Mat */}
      <div 
        ref={constraintsRef} 
        style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'linear-gradient(135deg, #1e130c 0%, #3a2318 100%)', 
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 2px, transparent 2px)',
          backgroundSize: '30px 30px'
        }}
      >
        
        {/* THE TOOLBAR */}
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', background: 'rgba(10, 10, 12, 0.85)', backdropFilter: 'blur(15px)', padding: '15px 25px', borderRadius: '40px', border: '1px solid rgba(245, 158, 11, 0.3)', zIndex: 1000, boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          <button onClick={addNote} title="Add Note" style={{ background: 'transparent', border: 'none', color: '#f1c40f', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><StickyNote size={22} /></button>
          <button onClick={addTodo} title="Add Checklist" style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><CheckSquare size={22} /></button>
          <button onClick={addQuote} title="Add Quote" style={{ background: 'transparent', border: 'none', color: '#9b59b6', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><Quote size={22} /></button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
          <button onClick={addPhoto} title="Upload Photo" disabled={isUploading} style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', opacity: isUploading ? 0.5 : 1 }}>
            {isUploading ? <Loader2 size={22} className="lucide-spin" /> : <ImageIcon size={22} />}
          </button>
          <button onClick={() => setShowMediaModal(true)} title="Add Media" style={{ background: 'transparent', border: 'none', color: '#e67e22', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><BookOpen size={22} /></button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
          <button onClick={() => setShowStickerMenu(!showStickerMenu)} title="Stickers" style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><SmilePlus size={22} /></button>
        </div>

        {/* STICKER POPUP MENU */}
        {showStickerMenu && (
          <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', zIndex: 1000, boxShadow: '0 15px 30px rgba(0,0,0,0.6)' }}>
            {['☕', '🕯️', '🥀', '🕰️', '🎞️', '🎟️', '🖋️', '🍷', '🌿', '🗝️', '📜', '🌙'].map(emoji => (
              <button key={emoji} onClick={() => addSticker(emoji)} style={{ fontSize: '2rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'scale(1.2)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* RENDER ALL DRAGGABLE ITEMS */}
        {items.map(item => (
          <motion.div
            key={item.id}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            onPointerDown={() => updateItem(item.id, { zIndex: bringToFront() })}
            whileDrag={{ scale: 1.05, boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}
            style={{
              position: 'absolute', top: '20%', left: '40%', zIndex: item.zIndex,
              background: item.type === 'note' || item.type === 'todo' ? item.color || '#fdf6e3' : 'transparent',
              padding: item.type === 'note' || item.type === 'todo' ? '15px' : '0',
              boxShadow: item.type === 'note' || item.type === 'todo' ? '2px 5px 15px rgba(0,0,0,0.4)' : 'none',
              borderRadius: item.type === 'note' || item.type === 'todo' ? '2px 10px 10px 20px' : '0',
              display: 'flex', flexDirection: 'column', cursor: 'grab',
            }}
          >
            {/* Delete Button Header */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px', position: 'absolute', top: '5px', right: '5px', zIndex: 50 }}>
              <button onPointerDown={() => deleteItem(item.id)} style={{ background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', padding: '4px', color: '#c0392b', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }} className="delete-btn">
                <X size={14} strokeWidth={3} />
              </button>
            </div>
            
            {renderItemContent(item)}

            {/* CSS hack to only show delete button on hover */}
            <style>{`.delete-btn { opacity: 0; } div:hover > div > .delete-btn { opacity: 1; }`}</style>
          </motion.div>
        ))}

        {/* MEDIA PICKER MODAL */}
        {showMediaModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '16px', width: '600px', maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--lantern-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Select from Archives</h2>
                <button onClick={() => setShowMediaModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>
              
              <div style={{ overflowY: 'auto', flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                {profileData ? [...profileData.finishedList, ...profileData.currentlyConsuming, ...profileData.tbrList].map((media, i) => (
                  <div key={i} onClick={() => addMediaItem(media)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
                    <img src={media.coverImage || 'https://via.placeholder.com/100'} alt={media.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #444' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{media.title}</p>
                  </div>
                )) : <p style={{ color: 'var(--lantern-gold)' }}>Loading archives...</p>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}