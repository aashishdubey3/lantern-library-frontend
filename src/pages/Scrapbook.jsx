import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  StickyNote, Quote, Image as ImageIcon, CheckSquare, BookOpen, Loader2, SmilePlus, 
  X, RefreshCcw, Type, Plus, ChevronLeft, ChevronRight, Palette, Lock, Droplet, 
  Sparkles, Settings2, Trash2, ZoomIn, ZoomOut, Move, Undo, Redo
} from 'lucide-react';

// 🔥 THE FIXED AUTO-EXPANDING TEXT BOX (No more scroll traps!)
const AutoExpandingTextarea = ({ item, updateItemText, onFocus, textStyle, placeholder }) => {
  const textareaRef = useRef(null);
  
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => { adjustHeight(); }, [item.text]);

  return (
    <textarea 
      ref={textareaRef}
      onFocus={onFocus} 
      value={item.text || ''} 
      onChange={(e) => { updateItemText(item.id, { text: e.target.value }); adjustHeight(); }} 
      placeholder={placeholder} 
      onPointerDown={(e) => e.stopPropagation()} 
      style={{ ...textStyle, overflow: 'hidden', resize: 'none' }} 
    />
  );
};

export default function Scrapbook() {
  const [journals, setJournals] = useState([{ id: Date.now(), name: 'Page 1', items: [] }]);
  const [activeJournalId, setActiveJournalId] = useState(null);
  
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  
  const [profileData, setProfileData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDesk, setIsLoadingDesk] = useState(true); 
  
  const [activeSheet, setActiveSheet] = useState(null); 
  const [bgTheme, setBgTheme] = useState('lined'); 
  const [activeZIndex, setActiveZIndex] = useState(10);
  const [focusedItemId, setFocusedItemId] = useState(null); 
  
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const constraintsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); 

  const activeJournal = journals.find(j => j.id === activeJournalId) || journals[0] || { id: Date.now(), name: 'Page 1', items: [] };
  const items = activeJournal?.items || [];
  const currentIndex = journals.findIndex(j => j.id === activeJournalId);
  const safeJournalName = activeJournal?.name || `Page ${currentIndex + 1}`;
  const safeActiveJournalId = activeJournal?.id;

  const themes = {
    lined: { bg: '#fdf6e3', img: 'repeating-linear-gradient(transparent, transparent 31px, #d4c4a8 31px, #d4c4a8 32px)', size: '100% 32px' },
    grid: { bg: '#fdf6e3', img: 'linear-gradient(#d4c4a8 1px, transparent 1px), linear-gradient(90deg, #d4c4a8 1px, transparent 1px)', size: '32px 32px' },
    dotted: { bg: '#fdf6e3', img: 'radial-gradient(#d4c4a8 2px, transparent 2px)', size: '20px 20px' },
    leather: { bg: '#1e130c', img: 'radial-gradient(circle, rgba(255,255,255,0.04) 2px, transparent 2px), linear-gradient(135deg, #2b170c 0%, #1e130c 100%)', size: 'auto' },
    parchment: { bg: '#f4ecd8', img: 'radial-gradient(#e0d5c1 1px, transparent 1px)', size: '20px 20px' },
    wood: { bg: '#3e2723', img: 'repeating-linear-gradient(to right, #4e342e, #3e2723 20px, #4e342e 40px)', size: 'auto' },
    slate: { bg: '#1a252f', img: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)', size: 'auto' },
    green: { bg: '#081c15', img: 'radial-gradient(circle at center, #1b4332 0%, #081c15 100%)', size: 'auto' }
  };
  const themeSwatches = { lined: '#fdf6e3', grid: '#e5e5e5', dotted: '#d4c4a8', leather: '#2b170c', parchment: '#f4ecd8', wood: '#4e342e', slate: '#2c3e50', green: '#1b4332' };

  const currentTheme = themes[bgTheme] || themes['lined'];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('https://lantern-library-backend.onrender.com/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const actualUserData = data.user ? data.user : data;
        setProfileData(actualUserData);
      }).catch(console.error);

    fetch('https://lantern-library-backend.onrender.com/api/journals', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.json())
    .then(data => {
      if (data && data.pages && data.pages.length > 0) {
        const safePages = data.pages.map(p => ({ ...p, name: p.name || 'Page 1', items: p.items || [] }));
        setJournals(safePages);
        
        const targetIndex = location.state?.targetPageIndex !== undefined ? location.state.targetPageIndex : 0;
        const targetPage = safePages[targetIndex] || safePages[0];
        setActiveJournalId(targetPage.id);
        if (data.theme) setBgTheme(data.theme); 
      } else { 
        setActiveJournalId(journals[0].id); 
      }
      setIsLoadingDesk(false);
    }).catch(() => setIsLoadingDesk(false));
  }, [location.state]);

  useEffect(() => {
    if (isLoadingDesk) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const autoSaveTimer = setTimeout(() => {
      fetch('https://lantern-library-backend.onrender.com/api/journals', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ pages: journals, theme: bgTheme }) }).catch(console.error);
    }, 1000); 
    return () => clearTimeout(autoSaveTimer);
  }, [journals, bgTheme, isLoadingDesk]);

  const commitHistory = (newJournals) => {
    setPast([...past, journals]);
    setFuture([]);
    setJournals(newJournals);
  };
  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture([journals, ...future]);
    setJournals(previous);
  };
  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast([...past, journals]);
    setJournals(next);
  };

  const bringToFront = () => { setActiveZIndex(prev => prev + 1); return activeZIndex + 1; };
  
  const createNewPage = () => { const newId = Date.now(); commitHistory([...journals, { id: newId, name: `Page ${journals.length + 1}`, items: [] }]); setActiveJournalId(newId); };
  const goToPrevPage = () => { if (currentIndex > 0) setActiveJournalId(journals[currentIndex - 1].id); };
  const goToNextPage = () => { if (currentIndex < journals.length - 1) setActiveJournalId(journals[currentIndex + 1].id); };

  const addItemToJournal = (newItem) => { 
    commitHistory(journals.map(j => j.id === safeActiveJournalId ? { ...j, items: [...(j.items || []), newItem] } : j)); 
    setActiveSheet(null); 
    setFocusedItemId(newItem.id);
  };

  const addNote = () => addItemToJournal({ id: Date.now(), type: 'note', text: '', x: 0, y: 0, scale: 1, font: '"Courier New", Courier, monospace', bgColor: '#fdf3c6', textColor: '#2c3e50', zIndex: bringToFront() });
  const addText = () => addItemToJournal({ id: Date.now(), type: 'text', text: '', x: 0, y: 0, scale: 1, font: 'var(--font-heading)', bgColor: 'transparent', textColor: '#2c3e50', zIndex: bringToFront() }); 
  const addQuote = () => addItemToJournal({ id: Date.now(), type: 'quote', text: '', author: '', x: 0, y: 0, scale: 1, font: 'var(--font-heading)', bgColor: 'transparent', textColor: '#2c3e50', zIndex: bringToFront() });
  const addTodo = () => addItemToJournal({ id: Date.now(), type: 'todo', listTitle: 'Checklist', tasks: [{ id: 1, text: '', done: false }], x: 0, y: 0, scale: 1, bgColor: 'rgba(253, 246, 227, 0.9)', textColor: '#2c3e50', font: 'var(--font-body)', zIndex: bringToFront() });
  const addSticker = (emoji) => addItemToJournal({ id: Date.now(), type: 'sticker', emoji, x: 0, y: 0, scale: 1, zIndex: bringToFront() }); 
  const addMediaItem = (media) => addItemToJournal({ id: Date.now(), type: 'media', media, x: 0, y: 0, scale: 1, displayStyle: media?.mediaType === 'book' ? 'spine' : 'cover', zIndex: bringToFront() }); 

  const addPhoto = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      setIsUploading(true);
      const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', 'lantern_articles'); 
      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dfugne8fq/image/upload', { method: 'POST', body: formData });
        const data = await res.json();
        addItemToJournal({ id: Date.now(), type: 'photo', url: data.secure_url, caption: '', x: 0, y: 0, scale: 1, font: '"Comic Sans MS", cursive, sans-serif', textColor: '#2c3e50', zIndex: bringToFront() });
      } catch (err) { alert('Upload failed'); } finally { setIsUploading(false); setActiveSheet(null); }
    };
    input.click();
  };

  const updateItemText = (id, updates) => {
    setJournals(journals.map(j => j.id === safeActiveJournalId ? { ...j, items: (j.items || []).map(item => item.id === id ? { ...item, ...updates } : item) } : j));
  };
  const updateItemCommitted = (id, updates) => {
    commitHistory(journals.map(j => j.id === safeActiveJournalId ? { ...j, items: (j.items || []).map(item => item.id === id ? { ...item, ...updates } : item) } : j));
  };
  const deleteItem = (id) => { 
    commitHistory(journals.map(j => j.id === safeActiveJournalId ? { ...j, items: (j.items || []).filter(item => item.id !== id) } : j)); 
    setFocusedItemId(null); 
    setActiveSheet(null); 
  };

  const updateTodoTask = (itemId, taskId, updates) => {
    setJournals(journals.map(j => {
      if (j.id === safeActiveJournalId) {
        return { ...j, items: (j.items || []).map(item => {
            if (item.id === itemId) {
              const newTasks = (item.tasks || []).map(t => t.id === taskId ? { ...t, ...updates } : t);
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

  const archiveCurrentPage = async (e) => {
    e.preventDefault();
    if (!archiveTitle.trim()) return alert("Please give your entry a title.");
    setIsArchiving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/journals/archive', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: archiveTitle, theme: bgTheme, pages: journals, items: items }) });
      if (res.ok) {
        alert("Notebook locked in Vault!");
        setShowArchiveModal(false); setArchiveTitle(''); setActiveSheet(null);
        commitHistory([{ id: Date.now(), name: 'Page 1', items: [] }]); 
      }
    } catch (err) { alert("Failed to archive page."); } finally { setIsArchiving(false); }
  };

  const renderItemContent = (item) => {
    // 🔥 FIXED TEXT STYLE: Removed ALL maxHeight and overflow restrictions so paragraphs flow freely!
    const textStyle = { flexGrow: 1, background: item.isHighlighted ? 'rgba(241, 196, 15, 0.4)' : 'transparent', border: 'none', outline: 'none', fontFamily: item.font, color: item.textColor || '#000', lineHeight: '1.5', cursor: 'text', minWidth: '150px' };

    switch (item.type) {
      case 'note':
      case 'text':
        return <AutoExpandingTextarea item={item} updateItemText={updateItemText} onFocus={() => { setFocusedItemId(item.id); if(isMobile) setActiveSheet('format'); }} textStyle={{ ...textStyle, fontSize: item.type === 'note' ? '1.05rem' : '1.4rem' }} placeholder={item.type === 'note' ? "Scribble thoughts..." : "Type here..."} />;
      
      case 'quote':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '250px' }}>
            <span style={{ fontSize: '4rem', color: 'rgba(0, 0, 0, 0.1)', position: 'absolute', top: '-15px', left: '5px', fontFamily: 'var(--font-heading)', pointerEvents: 'none' }}>"</span>
            <AutoExpandingTextarea item={item} updateItemText={updateItemText} onFocus={() => { setFocusedItemId(item.id); if(isMobile) setActiveSheet('format'); }} textStyle={{ ...textStyle, fontSize: '1.3rem', fontStyle: 'italic', textAlign: 'center', zIndex: 1 }} placeholder="Enter a profound quote..." />
            <input onFocus={() => { setFocusedItemId(item.id); if(isMobile) setActiveSheet('format'); }} value={item.author || ''} onChange={(e) => updateItemText(item.id, { author: e.target.value })} placeholder="- Author" onPointerDown={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', color: item.textColor || '#000', opacity: 0.8, fontFamily: 'var(--font-body)', fontWeight: 'bold', fontSize: '0.9rem' }} />
          </div>
        );
      
      case 'photo':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={item.url} alt="Polaroid" draggable="false" style={{ width: '200px', height: '200px', objectFit: 'cover', pointerEvents: 'none', border: '1px solid #ddd' }} />
            <input onFocus={() => { setFocusedItemId(item.id); if(isMobile) setActiveSheet('format'); }} value={item.caption || ''} onChange={(e) => updateItemText(item.id, { caption: e.target.value })} placeholder="Write a caption..." onPointerDown={(e) => e.stopPropagation()} style={{ marginTop: '15px', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontFamily: item.font, color: item.textColor || '#000', width: '100%', fontSize: '1rem' }} />
          </div>
        );
      
      case 'todo':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
            <input onFocus={() => { setFocusedItemId(item.id); if(isMobile) setActiveSheet('format'); }} value={item.listTitle || ''} onChange={(e) => updateItemText(item.id, { listTitle: e.target.value })} placeholder="List Title..." onPointerDown={(e) => e.stopPropagation()} style={{ margin: '0 0 5px 0', fontFamily: item.font, color: item.textColor || '#000', borderBottom: `1px solid ${(item.textColor || '#000')}40`, paddingBottom: '5px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: '1.2rem', fontWeight: 'bold' }} />
            {(item.tasks || []).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={task.done} onChange={(e) => updateTodoTask(item.id, task.id, { done: e.target.checked })} onPointerDown={(e) => e.stopPropagation()} style={{ cursor: 'pointer', width: '20px', height: '20px' }} />
                <input onFocus={() => { setFocusedItemId(item.id); if(isMobile) setActiveSheet('format'); }} value={task.text || ''} onChange={(e) => updateTodoTask(item.id, task.id, { text: e.target.value })} placeholder="New item..." onPointerDown={(e) => e.stopPropagation()} style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', color: item.textColor || '#000', textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1, fontFamily: item.font }} />
              </div>
            ))}
          </div>
        );
      
      case 'sticker': return <div style={{ fontSize: '5rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }}>{item.emoji}</div>;
      
      case 'media':
        return (
          <div style={{ filter: 'drop-shadow(5px 10px 15px rgba(0,0,0,0.5))' }}>
            {item.media?.mediaType === 'book' && item.displayStyle === 'spine' ? (
              <div className="shelf-book-spine" style={{ backgroundImage: `url(${item.media.coverImage})`, width: '50px', height: '200px', margin: 0, pointerEvents: 'none' }}><span className="spine-title">{item.media.title}</span></div>
            ) : (
              <img src={item.media?.coverImage} className={item.media?.mediaType === 'book' ? "shelf-book" : "film-poster"} style={{ width: '130px', height: '190px', margin: 0, borderRadius: item.media?.mediaType === 'book' ? '2px 6px 6px 2px' : '4px', pointerEvents: 'none' }} alt="Media" />
            )}
          </div>
        );
      default: return null;
    }
  };

  if (isLoadingDesk) return <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'var(--lantern-gold)' }}><h2>Dusting off your desk...</h2></div>;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      
      <style>{`
        .item-container .item-controls { opacity: 0; transition: opacity 0.2s; pointer-events: none; } 
        .item-container:hover .item-controls, .item-container.focused .item-controls { opacity: 1; pointer-events: auto; }
      `}</style>

      {/* 📱 MOBILE TOP BAR */}
      {isMobile && (
        <div style={{ height: '60px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', zIndex: 1000, pointerEvents: 'auto' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={undo} disabled={past.length === 0} style={{ background: 'transparent', border: 'none', color: past.length === 0 ? '#555' : 'var(--text-main)' }}><Undo size={22} /></button>
            <button onClick={redo} disabled={future.length === 0} style={{ background: 'transparent', border: 'none', color: future.length === 0 ? '#555' : 'var(--text-main)' }}><Redo size={22} /></button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <button onClick={goToPrevPage} disabled={currentIndex === 0} style={{ background: 'transparent', border: 'none', color: currentIndex === 0 ? '#555' : 'var(--text-main)' }}><ChevronLeft size={20} /></button>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{safeJournalName.replace('Page ', 'Pg ')}</span>
            <button onClick={goToNextPage} disabled={currentIndex === journals.length - 1} style={{ background: 'transparent', border: 'none', color: currentIndex === journals.length - 1 ? '#555' : 'var(--text-main)' }}><ChevronRight size={20} /></button>
            <button onClick={createNewPage} style={{ background: 'transparent', border: 'none', color: '#2ecc71', padding: '0 5px' }}><Plus size={20} /></button>
          </div>

          <button onClick={() => setShowArchiveModal(true)} style={{ background: 'var(--lantern-gold)', border: 'none', color: '#000', borderRadius: '20px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', pointerEvents: 'auto' }}>Save</button>
        </div>
      )}

      {/* DESKTOP TOP BAR */}
      {!isMobile && (
        <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <button onClick={undo} disabled={past.length === 0} style={{ background: 'transparent', border: 'none', color: past.length === 0 ? '#555' : 'var(--text-main)' }}><Undo size={20} /></button>
          <button onClick={redo} disabled={future.length === 0} style={{ background: 'transparent', border: 'none', color: future.length === 0 ? '#555' : 'var(--text-main)' }}><Redo size={20} /></button>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
          <button onClick={goToPrevPage} disabled={currentIndex === 0} style={{ background: 'transparent', border: 'none', color: currentIndex === 0 ? '#555' : 'var(--lantern-gold)' }}><ChevronLeft size={20} /></button>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{safeJournalName}</span>
          <button onClick={goToNextPage} disabled={currentIndex === journals.length - 1} style={{ background: 'transparent', border: 'none', color: currentIndex === journals.length - 1 ? '#555' : 'var(--lantern-gold)' }}><ChevronRight size={20} /></button>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
          <button onClick={createNewPage} style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}><Plus size={16} /> New Page</button>
        </div>
      )}

      {/* 🎨 MAIN CANVAS */}
      <div ref={constraintsRef} onPointerDown={() => { setFocusedItemId(null); setActiveSheet(null); }} style={{ flex: 1, position: 'relative', backgroundColor: currentTheme.bg, backgroundImage: currentTheme.img, backgroundSize: currentTheme.size, transition: 'background 0.5s ease', overflow: 'hidden' }}>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: item.scale || 1 }} 
            drag dragConstraints={constraintsRef} dragElastic={0.1} dragMomentum={false}
            style={{ 
              x: item.x || 0, y: item.y || 0, position: 'absolute', top: '30%', left: isMobile ? '10%' : '40%', zIndex: item.zIndex, 
              background: item.type === 'photo' ? '#f8f9fa' : (item.bgColor || 'transparent'), 
              padding: item.type === 'sticker' || item.type === 'media' ? '0' : (item.type === 'photo' ? '10px 10px 25px 10px' : '20px'), 
              boxShadow: (item.bgColor && item.bgColor !== 'transparent') || item.type === 'photo' ? '0 10px 25px rgba(0,0,0,0.3)' : 'none', 
              borderRadius: item.type === 'note' ? '2px 10px 10px 20px' : '8px', 
              display: 'flex', flexDirection: 'column',
              outline: focusedItemId === item.id ? '2px dashed rgba(245, 158, 11, 0.5)' : 'none', outlineOffset: '4px',
              touchAction: 'none', transformOrigin: 'top left'
            }}
            onDragEnd={(e, info) => { updateItemCommitted(item.id, { x: (item.x || 0) + info.offset.x, y: (item.y || 0) + info.offset.y }); }}
            onPointerDown={(e) => { e.stopPropagation(); updateItemText(item.id, { zIndex: bringToFront() }); setFocusedItemId(item.id); }}
            whileDrag={{ boxShadow: "0 20px 50px rgba(0,0,0,0.4)", zIndex: 10000 }}
            className={`item-container ${focusedItemId === item.id ? 'focused' : ''}`}
          >
            {/* Desktop Floating Pill */}
            {!isMobile && focusedItemId === item.id && (
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', borderRadius: '30px', padding: '6px 12px', gap: '10px', position: 'absolute', top: '-45px', right: '0px', zIndex: 50, border: '1px solid rgba(255,255,255,0.1)' }}>
                <button onPointerDownCapture={(e) => { e.stopPropagation(); updateItemCommitted(item.id, { scale: Math.max(0.5, (item.scale || 1) - 0.1) }); }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><ZoomOut size={16} /></button>
                <button onPointerDownCapture={(e) => { e.stopPropagation(); updateItemCommitted(item.id, { scale: Math.min(2.5, (item.scale || 1) + 0.1) }); }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><ZoomIn size={16} /></button>
                <div style={{ width: '1px', height: '15px', background: 'rgba(255,255,255,0.2)', margin: '0 2px' }}></div>
                <div style={{ color: '#3498db', cursor: 'grab', display: 'flex', alignItems: 'center' }}><Move size={16} /></div>
                <button onPointerDownCapture={(e) => { e.stopPropagation(); deleteItem(item.id); }} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
              </div>
            )}
            {renderItemContent(item)}
          </motion.div>
        ))}
      </div>

      {/* 📱 MOBILE BOTTOM NAV */}
      {isMobile && (
        <div style={{ height: '70px', background: 'var(--bg-panel)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 1000, paddingBottom: '10px' }}>
          <button onClick={() => setActiveSheet(activeSheet === 'skins' ? null : 'skins')} style={{ background: 'transparent', border: 'none', color: activeSheet === 'skins' ? 'var(--lantern-gold)' : 'var(--text-muted)' }}><Palette size={26} /></button>
          <button onClick={() => alert("Oracle Lens coming next!")} style={{ background: 'transparent', border: 'none', color: '#a29bfe' }}><Sparkles size={26} /></button>
          
          <button onClick={() => setActiveSheet(activeSheet === 'add' ? null : 'add')} style={{ background: 'var(--lantern-gold)', border: 'none', color: '#000', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateY(-15px)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}><Plus size={30} /></button>
          
          <button onClick={() => navigate('/vault')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><Lock size={26} /></button>
          <button onClick={() => setActiveSheet(activeSheet === 'format' ? null : 'format')} style={{ background: 'transparent', border: 'none', color: activeSheet === 'format' ? 'var(--lantern-gold)' : 'var(--text-muted)' }}><Settings2 size={26} /></button>
        </div>
      )}

      {/* DESKTOP BOTTOM DOCK */}
      {!isMobile && (
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', padding: '15px 25px', borderRadius: '40px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', zIndex: 1000 }}>
          <button onClick={addText} title="Plain Text" style={{ background: 'transparent', border: 'none', color: '#ecf0f1', cursor: 'pointer' }}><Type size={22} /></button>
          <button onClick={addNote} title="Sticky Note" style={{ background: 'transparent', border: 'none', color: '#f1c40f', cursor: 'pointer' }}><StickyNote size={22} /></button>
          <button onClick={addTodo} title="Checklist" style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer' }}><CheckSquare size={22} /></button>
          <button onClick={addQuote} title="Quote" style={{ background: 'transparent', border: 'none', color: '#9b59b6', cursor: 'pointer' }}><Quote size={22} /></button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
          <button onClick={addPhoto} title="Upload Photo" disabled={isUploading} style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.5 : 1 }}>{isUploading ? <Loader2 size={22} className="lucide-spin" /> : <ImageIcon size={22} />}</button>
          <button onClick={() => setShowMediaModal(true)} title="Library Books" style={{ background: 'transparent', border: 'none', color: '#e67e22', cursor: 'pointer' }}><BookOpen size={22} /></button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
          <button onClick={() => setShowBgMenu(!showBgMenu)} title="Desk Theme" style={{ background: 'transparent', border: 'none', color: '#1abc9c', cursor: 'pointer' }}><Palette size={22} /></button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
          <button onClick={() => setShowArchiveModal(true)} title="Send to Vault" style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', cursor: 'pointer' }}><Inbox size={22} /></button>
          <button onClick={() => navigate('/vault')} title="Open Vault" style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer' }}><Lock size={22} /></button>
        </div>
      )}

      {/* 📱 NATIVE BOTTOM SHEETS (Mobile Only) */}
      <AnimatePresence>
        {isMobile && activeSheet && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.2 }} style={{ position: 'absolute', bottom: '70px', left: 0, right: 0, background: 'var(--bg-panel)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', borderTop: '1px solid var(--border-color)', zIndex: 900, boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
            
            {activeSheet === 'add' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', textAlign: 'center' }}>
                <div onClick={addText}><Type size={28} color="#ecf0f1" style={{ margin: '0 auto' }}/><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Text</p></div>
                <div onClick={addNote}><StickyNote size={28} color="#f1c40f" style={{ margin: '0 auto' }}/><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Note</p></div>
                <div onClick={addTodo}><CheckSquare size={28} color="#2ecc71" style={{ margin: '0 auto' }}/><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>List</p></div>
                <div onClick={addQuote}><Quote size={28} color="#9b59b6" style={{ margin: '0 auto' }}/><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Quote</p></div>
                <div onClick={addPhoto}><ImageIcon size={28} color="#3498db" style={{ margin: '0 auto' }}/><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Photo</p></div>
                <div onClick={() => setActiveSheet('media')}><BookOpen size={28} color="#e67e22" style={{ margin: '0 auto' }}/><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Library</p></div>
                <div onClick={() => setActiveSheet('stickers')}><SmilePlus size={28} color="#e74c3c" style={{ margin: '0 auto' }}/><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Sticker</p></div>
              </div>
            )}

            {activeSheet === 'format' && (
              <div>
                {!selectedItem ? ( <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Tap an item to format it.</p> ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scale</span>
                      <div style={{ display: 'flex', gap: '15px', background: 'var(--bg-deep)', padding: '5px 15px', borderRadius: '20px' }}>
                        <button onClick={() => updateItemCommitted(selectedItem.id, { scale: Math.max(0.5, (selectedItem.scale || 1) - 0.1) })} style={{ background: 'transparent', border: 'none', color: '#fff' }}><ZoomOut size={20}/></button>
                        <span style={{ color: '#fff' }}>{Math.round((selectedItem.scale || 1) * 100)}%</span>
                        <button onClick={() => updateItemCommitted(selectedItem.id, { scale: Math.min(2.5, (selectedItem.scale || 1) + 0.1) })} style={{ background: 'transparent', border: 'none', color: '#fff' }}><ZoomIn size={20}/></button>
                      </div>
                    </div>

                    {['note', 'text', 'quote', 'todo'].includes(selectedItem.type) && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Colors</span>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="color" value={selectedItem.textColor || '#000000'} onChange={e => updateItemCommitted(selectedItem.id, { textColor: e.target.value })} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent' }} />
                            <input type="color" value={(selectedItem.bgColor && selectedItem.bgColor !== 'transparent') ? selectedItem.bgColor : '#ffffff'} onChange={e => updateItemCommitted(selectedItem.id, { bgColor: e.target.value })} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent' }} />
                            <button onClick={() => updateItemCommitted(selectedItem.id, { bgColor: 'transparent' })} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px' }}><Droplet size={14} style={{margin:'0 auto'}}/></button>
                          </div>
                        </div>
                        <select value={selectedItem.font || 'var(--font-heading)'} onChange={e => updateItemCommitted(selectedItem.id, { font: e.target.value })} style={{ padding: '10px', background: 'var(--bg-deep)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <option value="var(--font-heading)">Serif Font</option>
                          <option value='"Courier New", Courier, monospace'>Typewriter</option>
                          <option value="sans-serif">Modern</option>
                          <option value='"Comic Sans MS", cursive, sans-serif'>Handwriting</option>
                        </select>
                      </>
                    )}
                    <button onClick={() => deleteItem(selectedItem.id)} style={{ width: '100%', padding: '12px', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}><Trash2 size={18}/> Delete Item</button>
                  </div>
                )}
              </div>
            )}

            {activeSheet === 'skins' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                {Object.keys(themes).map(key => (
                  <div key={key} onClick={() => setBgTheme(key)} style={{ height: '60px', borderRadius: '12px', backgroundColor: themes[key].bg, backgroundImage: themes[key].img, backgroundSize: themes[key].size, border: bgTheme === key ? '3px solid var(--lantern-gold)' : '1px solid var(--border-color)' }}></div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP MODALS */}
      {!isMobile && showBgMenu && (
        <div style={{ position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(8, 40px)', gap: '10px', zIndex: 1000 }}>
          {Object.keys(themes).map(key => <button key={key} onClick={() => { setBgTheme(key); setShowBgMenu(false); }} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: themes[key].bg, backgroundImage: themes[key].img, backgroundSize: themes[key].size, border: bgTheme === key ? '3px solid var(--lantern-gold)' : 'none', cursor: 'pointer' }} />)}
        </div>
      )}
      
      {showMediaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '16px', width: '600px', maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--lantern-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h2 style={{ margin: 0, color: 'var(--text-main)' }}>Archives</h2><button onClick={() => setShowMediaModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem' }}>×</button></div>
            <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
              {profileData ? [...(profileData.finishedList || []), ...(profileData.currentlyConsuming || []), ...(profileData.tbrList || [])].map((media, i) => (
                <div key={i} onClick={() => { addMediaItem(media); setShowMediaModal(false); }} style={{ cursor: 'pointer' }}>
                  <img src={media.coverImage || 'https://via.placeholder.com/100'} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px' }} />
                </div>
              )) : <p style={{ color: 'var(--lantern-gold)' }}>Loading Library...</p>}
            </div>
          </div>
        </div>
      )}

      {showArchiveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={archiveCurrentPage} style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '16px', width: '400px', border: '1px solid var(--lantern-gold)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, color: 'var(--lantern-gold)' }}>Archive Notebook</h2>
            <input type="text" required placeholder="Title..." value={archiveTitle} onChange={e => setArchiveTitle(e.target.value)} style={{ padding: '15px', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setShowArchiveModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: '#fff', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isArchiving} style={{ flex: 1, padding: '12px', background: 'var(--lantern-gold)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Lock in Vault</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}