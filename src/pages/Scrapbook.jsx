import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StickyNote, Quote, Image as ImageIcon, CheckSquare, BookOpen, Loader2, SmilePlus, X, RefreshCcw, Save, Type, Plus, ChevronLeft, ChevronRight, Palette, Move, Highlighter, Inbox } from 'lucide-react';

export default function Scrapbook() {
  const [journals, setJournals] = useState([{ id: Date.now(), name: 'Page 1', items: [] }]);
  const [activeJournalId, setActiveJournalId] = useState(null);
  
  const [profileData, setProfileData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDesk, setIsLoadingDesk] = useState(true); 
  
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [bgTheme, setBgTheme] = useState('lined'); 
  const [activeZIndex, setActiveZIndex] = useState(10);
  const [focusedItemId, setFocusedItemId] = useState(null); 
  
  // 🔥 ARCHIVE MODAL STATES
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  const constraintsRef = useRef(null);

  const activeJournal = journals.find(j => j.id === activeJournalId) || journals[0];
  const items = activeJournal ? activeJournal.items : [];
  const currentIndex = journals.findIndex(j => j.id === activeJournalId);

  const themes = {
    lined: 'repeating-linear-gradient(transparent, transparent 31px, #e5e5e5 31px, #e5e5e5 32px), #fdf6e3',
    grid: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px), #fdf6e3',
    dotted: 'radial-gradient(#d4c4a8 2px, transparent 2px), #fdf6e3',
    leather: 'radial-gradient(circle, rgba(255,255,255,0.04) 2px, transparent 2px), linear-gradient(135deg, #1e130c 0%, #3a2318 100%)',
    parchment: 'linear-gradient(rgba(0,0,0,0.03) 2px, transparent 2px), #f4ecd8',
    wood: 'repeating-linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), repeating-linear-gradient(to right, #3e2723, #4e342e 20px, #3e2723 40px)',
    green: 'radial-gradient(circle, rgba(0,0,0,0.1) 2px, transparent 2px), radial-gradient(circle at center, #1b4332 0%, #081c15 100%)',
    blueprint: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px), #1a365d',
    darkGrid: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), #111827',
    corkboard: 'repeating-linear-gradient(45deg, #d4a373, #d4a373 10px, #cc9a6a 10px, #cc9a6a 20px)',
    vintage: 'radial-gradient(circle at center, transparent 0%, rgba(139, 69, 19, 0.4) 100%), #faedcd',
    slate: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
    marble: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px), #e2e8f0',
    midnight: 'radial-gradient(circle at 50% 50%, #1f2937 0%, #111827 100%)',
    blossom: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
    galaxy: 'radial-gradient(circle at 20% 30%, rgba(76, 29, 149, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(30, 58, 138, 0.4) 0%, transparent 50%), #0f172a'
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('https://lantern-library-backend.onrender.com/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(data => setProfileData(data)).catch(console.error);

    fetch('https://lantern-library-backend.onrender.com/api/journals', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.json())
    .then(data => {
      if (data && data.pages && data.pages.length > 0) {
        setJournals(data.pages);
        setActiveJournalId(data.pages[0].id);
        if (data.theme) setBgTheme(data.theme); 
      } else { setActiveJournalId(journals[0].id); }
      setIsLoadingDesk(false);
    }).catch(() => setIsLoadingDesk(false));
  }, []);

  const bringToFront = () => { setActiveZIndex(prev => prev + 1); return activeZIndex + 1; };

  const createNewPage = () => {
    const newId = Date.now();
    setJournals([...journals, { id: newId, name: `Page ${journals.length + 1}`, items: [] }]);
    setActiveJournalId(newId);
  };
  const goToPrevPage = () => { if (currentIndex > 0) setActiveJournalId(journals[currentIndex - 1].id); };
  const goToNextPage = () => { if (currentIndex < journals.length - 1) setActiveJournalId(journals[currentIndex + 1].id); };

  const addItemToJournal = (newItem) => { setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: [...j.items, newItem] } : j)); };

  const addNote = () => addItemToJournal({ id: Date.now(), type: 'note', text: '', x: 0, y: 0, color: '#fdf3c6', textColor: '#2c3e50', isHighlighted: false, zIndex: bringToFront() });
  const addText = () => addItemToJournal({ id: Date.now(), type: 'text', text: '', x: 0, y: 0, color: 'transparent', textColor: '#2c3e50', isHighlighted: false, zIndex: bringToFront() }); 
  const addQuote = () => addItemToJournal({ id: Date.now(), type: 'quote', text: '', author: '', x: 0, y: 0, zIndex: bringToFront() });
  const addTodo = () => addItemToJournal({ id: Date.now(), type: 'todo', listTitle: 'Reading List', tasks: [{ id: 1, text: '', done: false }], x: 0, y: 0, zIndex: bringToFront() });
  const addSticker = (emoji) => { addItemToJournal({ id: Date.now(), type: 'sticker', emoji, x: 0, y: 0, zIndex: bringToFront() }); setShowStickerMenu(false); };
  const addMediaItem = (media) => { addItemToJournal({ id: Date.now(), type: 'media', media, x: 0, y: 0, displayStyle: media.mediaType === 'book' ? 'spine' : 'cover', zIndex: bringToFront() }); setShowMediaModal(false); };

  const addPhoto = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      setIsUploading(true);
      const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', 'lantern_articles'); 
      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dfugne8fq/image/upload', { method: 'POST', body: formData });
        const data = await res.json();
        addItemToJournal({ id: Date.now(), type: 'photo', url: data.secure_url, caption: '', x: 0, y: 0, zIndex: bringToFront() });
      } catch (err) { alert('Upload failed'); } finally { setIsUploading(false); }
    };
    input.click();
  };

  const deleteItem = (id) => { setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: j.items.filter(item => item.id !== id) } : j)); setFocusedItemId(null); };
  const updateItem = (id, updates) => { setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: j.items.map(item => item.id === id ? { ...item, ...updates } : item) } : j)); };

  const updateTodoTask = (itemId, taskId, updates) => {
    setJournals(journals.map(j => {
      if (j.id === activeJournalId) {
        return { ...j, items: j.items.map(item => {
            if (item.id === itemId) {
              const newTasks = item.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
              if (updates.text && taskId === item.tasks[item.tasks.length - 1].id) { newTasks.push({ id: Date.now(), text: '', done: false }); }
              return { ...item, tasks: newTasks };
            }
            return item;
          })
        };
      }
      return j;
    }));
  };

  // 🔥 SAVE THE ACTIVE DESK LAYOUT
  const saveDesk = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    try {
      await fetch('https://lantern-library-backend.onrender.com/api/journals', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pages: journals, theme: bgTheme }) 
      });
      alert("Active Desk Saved!");
    } catch (err) { alert("Network error."); } finally { setIsSaving(false); }
  };

  // 🔥 NEW: SAVE SNAPSHOT TO ARCHIVE
  const archiveCurrentPage = async (e) => {
    e.preventDefault();
    if (!archiveTitle.trim()) return alert("Please give your entry a title.");
    setIsArchiving(true);
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/journals/archive', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: archiveTitle, theme: bgTheme, items: activeJournal.items }) 
      });
      if (res.ok) {
        alert("Page securely locked in your Archives!");
        setShowArchiveModal(false);
        setArchiveTitle('');
        // Optional: Clear the page after archiving so they can start fresh!
        setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: [] } : j));
      }
    } catch (err) { alert("Failed to archive page."); } finally { setIsArchiving(false); }
  };

  const renderItemContent = (item) => {
    const highlightBg = item.isHighlighted ? 'rgba(241, 196, 15, 0.4)' : 'transparent';

    switch (item.type) {
      case 'note':
        return <textarea onFocus={() => setFocusedItemId(item.id)} value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })} placeholder="Scribble your thoughts..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ flexGrow: 1, background: highlightBg, border: 'none', outline: 'none', resize: 'both', fontFamily: '"Courier New", Courier, monospace', fontSize: '1.05rem', color: item.textColor || '#2c3e50', lineHeight: '1.5', cursor: 'text', minHeight: '150px', minWidth: '150px', borderRadius: '4px' }} />;
      
      case 'text':
        return <textarea onFocus={() => setFocusedItemId(item.id)} value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })} placeholder="Start writing..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ flexGrow: 1, background: highlightBg, border: 'none', outline: 'none', resize: 'both', fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: item.textColor || '#2c3e50', lineHeight: '1.6', cursor: 'text', minHeight: '100px', minWidth: '200px', borderRadius: '4px' }} />;
      
      case 'quote':
        return (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '250px' }}>
            <span style={{ fontSize: '4rem', color: 'rgba(245, 158, 11, 0.3)', position: 'absolute', top: '-10px', left: '10px', fontFamily: 'var(--font-heading)', pointerEvents: 'none' }}>"</span>
            <textarea onFocus={() => setFocusedItemId(item.id)} value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })} placeholder="Enter a profound quote..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'both', fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontStyle: 'italic', color: '#2c3e50', textAlign: 'center', minHeight: '100px', zIndex: 1 }} />
            <input onFocus={() => setFocusedItemId(item.id)} value={item.author} onChange={(e) => updateItem(item.id, { author: e.target.value })} placeholder="- Author" onPointerDownCapture={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', color: 'var(--lantern-gold)', fontFamily: 'var(--font-body)', fontWeight: 'bold', fontSize: '0.9rem' }} />
          </div>
        );
      
      case 'photo':
        return (
          <div style={{ padding: '10px 10px 20px 10px', background: '#f8f9fa', borderRadius: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={item.url} alt="Polaroid" draggable="false" style={{ width: '200px', height: '200px', objectFit: 'cover', border: '1px solid #ddd', pointerEvents: 'none' }} />
            <input onFocus={() => setFocusedItemId(item.id)} value={item.caption} onChange={(e) => updateItem(item.id, { caption: e.target.value })} placeholder="Write a caption..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ marginTop: '15px', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#2c3e50', width: '100%' }} />
          </div>
        );
      
      case 'todo':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', padding: '10px' }}>
            <input onFocus={() => setFocusedItemId(item.id)} value={item.listTitle || ''} onChange={(e) => updateItem(item.id, { listTitle: e.target.value })} placeholder="List Title..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ margin: '0 0 5px 0', fontFamily: 'var(--font-heading)', color: '#2c3e50', borderBottom: '1px solid #bdc3c7', paddingBottom: '5px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: '1.2rem', fontWeight: 'bold' }} />
            {item.tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={task.done} onChange={(e) => updateTodoTask(item.id, task.id, { done: e.target.checked })} onPointerDownCapture={(e) => e.stopPropagation()} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                <input onFocus={() => setFocusedItemId(item.id)} value={task.text} onChange={(e) => updateTodoTask(item.id, task.id, { text: e.target.value })} placeholder="New item..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', color: '#2c3e50', textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1 }} />
              </div>
            ))}
          </div>
        );
      
      case 'sticker': return <div style={{ fontSize: '5rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', cursor: 'grab' }}>{item.emoji}</div>;
      
      case 'media':
        const isBook = item.media.mediaType === 'book';
        const isSpine = item.displayStyle === 'spine';
        return (
          <div style={{ filter: 'drop-shadow(5px 10px 15px rgba(0,0,0,0.5))' }}>
            {isBook && isSpine ? (
              <div className="shelf-book-spine" style={{ backgroundImage: `url(${item.media.coverImage})`, width: '50px', height: '200px', margin: 0, pointerEvents: 'none' }}><span className="spine-title">{item.media.title}</span></div>
            ) : (
              <img src={item.media.coverImage} className={isBook ? "shelf-book" : "film-poster"} style={{ width: '130px', height: '190px', margin: 0, borderRadius: isBook ? '2px 6px 6px 2px' : '4px', pointerEvents: 'none' }} alt="Media" />
            )}
          </div>
        );
      default: return null;
    }
  };

  if (isLoadingDesk) return <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'var(--lantern-gold)' }}><h2>Dusting off your desk...</h2></div>;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <style>{`.item-container .item-controls { opacity: 0; transition: opacity 0.2s; } .item-container:hover .item-controls { opacity: 1; } .item-container.focused .item-controls { opacity: 1; }`}</style>

      <div ref={constraintsRef} onPointerDown={() => setFocusedItemId(null)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: themes[bgTheme], backgroundSize: bgTheme.includes('lined') || bgTheme.includes('grid') || bgTheme.includes('blueprint') ? '100% 32px, 32px 32px' : 'auto', transition: 'background 0.5s ease' }}>
        
        {/* HIGH-CONTRAST TOP NAV BAR */}
        <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(15px)', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(245, 158, 11, 0.5)', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          <button onClick={goToPrevPage} disabled={currentIndex === 0} style={{ background: 'transparent', border: 'none', color: currentIndex === 0 ? '#555' : 'var(--lantern-gold)', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex' }}><ChevronLeft size={20} /></button>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', minWidth: '60px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,1)' }}>{activeJournal?.name}</span>
          <button onClick={goToNextPage} disabled={currentIndex === journals.length - 1} style={{ background: 'transparent', border: 'none', color: currentIndex === journals.length - 1 ? '#555' : 'var(--lantern-gold)', cursor: currentIndex === journals.length - 1 ? 'not-allowed' : 'pointer', display: 'flex' }}><ChevronRight size={20} /></button>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.4)' }}></div>
          <button onClick={createNewPage} style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,1)' }}><Plus size={18} /> New Page</button>
        </div>

        {/* HIGH-CONTRAST BOTTOM TOOLBAR */}
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(15px)', padding: '15px 25px', borderRadius: '40px', border: '1px solid rgba(245, 158, 11, 0.5)', zIndex: 1000, boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflowX: 'auto', maxWidth: '95vw' }}>
          <button onClick={addText} title="Plain Text" style={{ background: 'transparent', border: 'none', color: '#ecf0f1', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><Type size={22} /></button>
          <button onClick={addNote} title="Add Note" style={{ background: 'transparent', border: 'none', color: '#f1c40f', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><StickyNote size={22} /></button>
          <button onClick={addTodo} title="Add Checklist" style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><CheckSquare size={22} /></button>
          <button onClick={addQuote} title="Add Quote" style={{ background: 'transparent', border: 'none', color: '#9b59b6', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><Quote size={22} /></button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.4)', margin: '0 5px' }}></div>
          <button onClick={addPhoto} title="Upload Photo" disabled={isUploading} style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', opacity: isUploading ? 0.5 : 1 }}>{isUploading ? <Loader2 size={22} className="lucide-spin" /> : <ImageIcon size={22} />}</button>
          <button onClick={() => setShowMediaModal(true)} title="Add Media" style={{ background: 'transparent', border: 'none', color: '#e67e22', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><BookOpen size={22} /></button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.4)', margin: '0 5px' }}></div>
          <button onClick={() => { setShowStickerMenu(!showStickerMenu); setShowBgMenu(false); }} title="Stickers" style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><SmilePlus size={22} /></button>
          <button onClick={() => { setShowBgMenu(!showBgMenu); setShowStickerMenu(false); }} title="Change Desk" style={{ background: 'transparent', border: 'none', color: '#1abc9c', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><Palette size={22} /></button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.4)', margin: '0 5px' }}></div>
          
          <button onClick={saveDesk} disabled={isSaving} title="Save Active Desk" style={{ background: 'transparent', border: 'none', color: '#95a5a6', cursor: isSaving ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', opacity: isSaving ? 0.5 : 1 }}><Save size={22} /></button>
          
          {/* 🔥 NEW: ARCHIVE BUTTON */}
          <button onClick={() => setShowArchiveModal(true)} title="Send to Archive" style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><Inbox size={22} /></button>
        </div>

        {/* SCROLLABLE THEME MENU */}
        {showBgMenu && (
          <div className="hide-scroll" style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '10px', zIndex: 1000, boxShadow: '0 15px 30px rgba(0,0,0,0.6)', maxWidth: '90vw', overflowX: 'auto' }}>
            {Object.keys(themes).map(themeName => (
               <button key={themeName} onClick={() => { setBgTheme(themeName); setShowBgMenu(false); }} style={{ padding: '8px 15px', background: 'var(--bg-deep)', color: 'var(--text-main)', border: '1px solid var(--lantern-gold)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{themeName}</button>
            ))}
          </div>
        )}

        {/* STICKER MENU */}
        {showStickerMenu && (
          <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', zIndex: 1000, boxShadow: '0 15px 30px rgba(0,0,0,0.6)' }}>
            {['☕', '🕯️', '🥀', '🕰️', '🎞️', '🎟️', '🖋️', '🍷', '🌿', '🗝️', '📜', '🌙', '🍂', '📌', '📎', '🔍'].map(emoji => (
              <button key={emoji} onClick={() => addSticker(emoji)} style={{ fontSize: '2rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'scale(1.2)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>{emoji}</button>
            ))}
          </div>
        )}

        {/* ARCHIVE MODAL */}
        {showArchiveModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <form onSubmit={archiveCurrentPage} style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '16px', width: '400px', maxWidth: '100%', border: '1px solid var(--lantern-gold)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
              <h2 style={{ margin: 0, color: 'var(--lantern-gold)', fontFamily: 'var(--font-heading)' }}>Archive this Page</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lock this layout away in your permanent digital vault.</p>
              <input type="text" autoFocus required placeholder="e.g., Thoughts on Gatsby, April 14" value={archiveTitle} onChange={(e) => setArchiveTitle(e.target.value)} style={{ padding: '15px', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '1rem', width: '100%' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowArchiveModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid #7f8c8d', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" disabled={isArchiving} style={{ flex: 1, padding: '12px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '8px', cursor: isArchiving ? 'wait' : 'pointer', fontWeight: 'bold' }}>
                  {isArchiving ? 'Archiving...' : 'Lock in Vault'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RENDER ALL DRAGGABLE ITEMS WITH ENTRANCE ANIMATIONS */}
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.5 }}  
            animate={{ opacity: 1, scale: 1 }}    
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            drag dragConstraints={constraintsRef} dragElastic={0.1} dragMomentum={false}
            style={{ x: item.x || 0, y: item.y || 0, position: 'absolute', top: '20%', left: '40%', zIndex: item.zIndex, background: item.type === 'note' || item.type === 'todo' ? item.color : 'transparent', padding: item.type === 'note' || item.type === 'todo' ? '15px' : '0', boxShadow: item.type === 'note' || item.type === 'todo' ? '2px 5px 15px rgba(0,0,0,0.4)' : 'none', borderRadius: item.type === 'note' || item.type === 'todo' ? '2px 10px 10px 20px' : '0', display: 'flex', flexDirection: 'column' }}
            onDragEnd={(e, info) => { updateItem(item.id, { x: (item.x || 0) + info.offset.x, y: (item.y || 0) + info.offset.y }); }}
            onPointerDown={(e) => { e.stopPropagation(); updateItem(item.id, { zIndex: bringToFront() }); setFocusedItemId(item.id); }}
            whileDrag={{ scale: 1.05, boxShadow: "0 30px 60px rgba(0,0,0,0.6)", zIndex: 10000 }}
            className={`item-container ${focusedItemId === item.id ? 'focused' : ''}`}
          >
            {/* THE CONTROL PANEL */}
            <div className="item-controls" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', position: 'absolute', top: '-15px', right: '-15px', zIndex: 50 }}>
              
              {/* TEXT STYLING CONTROLS */}
              {(item.type === 'text' || item.type === 'note') && (
                <>
                  <div title="Text Color" style={{ background: '#fff', border: '2px solid var(--bg-deep)', borderRadius: '50%', padding: '2px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: '32px', height: '32px' }}>
                    <input type="color" value={item.textColor || '#2c3e50'} onPointerDownCapture={e => e.stopPropagation()} onChange={e => updateItem(item.id, { textColor: e.target.value })} style={{ width: '150%', height: '150%', border: 'none', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                  <button onPointerDownCapture={(e) => { e.stopPropagation(); updateItem(item.id, { isHighlighted: !item.isHighlighted }); }} title="Toggle Highlight" style={{ background: item.isHighlighted ? '#f1c40f' : '#95a5a6', border: '2px solid var(--bg-deep)', borderRadius: '50%', padding: '6px', color: 'white', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}><Highlighter size={16} strokeWidth={3} /></button>
                </>
              )}

              <div title="Drag to Move" style={{ background: '#3498db', border: '2px solid var(--bg-deep)', borderRadius: '50%', padding: '6px', color: 'white', cursor: 'grab', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Move size={16} strokeWidth={3} /></div>
              {item.type === 'media' && item.media.mediaType === 'book' && ( <button onPointerDownCapture={(e) => { e.stopPropagation(); updateItem(item.id, { displayStyle: item.displayStyle === 'spine' ? 'cover' : 'spine' }); }} style={{ background: 'var(--lantern-gold)', border: '2px solid var(--bg-deep)', borderRadius: '50%', padding: '6px', color: 'var(--bg-deep)', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}><RefreshCcw size={16} strokeWidth={3} /></button> )}
              <button onPointerDownCapture={(e) => { e.stopPropagation(); deleteItem(item.id); }} style={{ background: '#e74c3c', border: '2px solid var(--bg-deep)', borderRadius: '50%', padding: '6px', color: 'white', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}><X size={16} strokeWidth={3} /></button>
            </div>

            {renderItemContent(item)}
          </motion.div>
        ))}

        {showMediaModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '16px', width: '600px', maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--lantern-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}><h2 style={{ margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Select from Archives</h2><button onClick={() => setShowMediaModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div>
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