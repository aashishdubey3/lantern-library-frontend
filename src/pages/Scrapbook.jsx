import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { StickyNote, Quote, Image as ImageIcon, CheckSquare, BookOpen, Loader2, SmilePlus, X, RefreshCcw, Type, Plus, ChevronLeft, ChevronRight, Palette, Move, Lock, Droplet, Inbox, Sparkles, ZoomIn, ZoomOut, Wrench } from 'lucide-react';

export default function Scrapbook() {
  const [journals, setJournals] = useState([{ id: Date.now(), name: 'Page 1', items: [] }]);
  const [activeJournalId, setActiveJournalId] = useState(null);
  
  const [profileData, setProfileData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDesk, setIsLoadingDesk] = useState(true); 
  
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false); 
  
  const [bgTheme, setBgTheme] = useState('lined'); 
  const [activeZIndex, setActiveZIndex] = useState(10);
  const [focusedItemId, setFocusedItemId] = useState(null); 
  
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const constraintsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); 

  const activeJournal = journals.find(j => j.id === activeJournalId) || journals[0];
  const items = activeJournal ? activeJournal.items : [];
  const currentIndex = journals.findIndex(j => j.id === activeJournalId);

  const themes = {
    lined: 'repeating-linear-gradient(transparent, transparent 31px, #d4c4a8 31px, #d4c4a8 32px), #fdf6e3',
    grid: 'linear-gradient(#d4c4a8 1px, transparent 1px), linear-gradient(90deg, #d4c4a8 1px, transparent 1px), #fdf6e3',
    leather: 'radial-gradient(circle, rgba(255,255,255,0.04) 2px, transparent 2px), linear-gradient(135deg, #2b170c 0%, #1e130c 100%)',
    parchment: 'radial-gradient(#e0d5c1 1px, transparent 1px), #f4ecd8',
    wood: 'repeating-linear-gradient(to right, #4e342e, #3e2723 20px, #4e342e 40px)',
    slate: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)',
    green: 'radial-gradient(circle at center, #1b4332 0%, #081c15 100%)'
  };
  const themeSwatches = { lined: '#fdf6e3', grid: '#e5e5e5', leather: '#2b170c', parchment: '#f4ecd8', wood: '#4e342e', slate: '#2c3e50', green: '#1b4332' };
  const isDarkTheme = ['leather', 'wood', 'slate', 'green'].includes(bgTheme);
  const defaultTextColor = isDarkTheme ? '#fdf6e3' : '#2c3e50';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        const targetIndex = location.state?.targetPageIndex !== undefined ? location.state.targetPageIndex : 0;
        const targetPage = data.pages[targetIndex] || data.pages[0];
        setActiveJournalId(targetPage.id);
        if (data.theme) setBgTheme(data.theme); 
      } else { setActiveJournalId(journals[0].id); }
      setIsLoadingDesk(false);
    }).catch(() => setIsLoadingDesk(false));
  }, [location.state]);

  // AUTO-SAVE ENGINE
  useEffect(() => {
    if (isLoadingDesk) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const autoSaveTimer = setTimeout(() => {
      fetch('https://lantern-library-backend.onrender.com/api/journals', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pages: journals, theme: bgTheme }) 
      }).catch(err => console.error("Auto-save failed", err));
    }, 1000); 
    return () => clearTimeout(autoSaveTimer);
  }, [journals, bgTheme, isLoadingDesk]);

  const bringToFront = () => { setActiveZIndex(prev => prev + 1); return activeZIndex + 1; };
  const createNewPage = () => { const newId = Date.now(); setJournals([...journals, { id: newId, name: `Page ${journals.length + 1}`, items: [] }]); setActiveJournalId(newId); };
  const goToPrevPage = () => { if (currentIndex > 0) setActiveJournalId(journals[currentIndex - 1].id); };
  const goToNextPage = () => { if (currentIndex < journals.length - 1) setActiveJournalId(journals[currentIndex + 1].id); };

  const addItemToJournal = (newItem) => { setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: [...j.items, newItem] } : j)); setShowMobileTools(false); };

  const addNote = () => addItemToJournal({ id: Date.now(), type: 'note', text: '', x: 0, y: 0, scale: 1, font: '"Courier New", Courier, monospace', bgColor: '#fdf3c6', textColor: '#2c3e50', zIndex: bringToFront() });
  const addText = () => addItemToJournal({ id: Date.now(), type: 'text', text: '', x: 0, y: 0, scale: 1, font: 'var(--font-heading)', bgColor: 'transparent', textColor: defaultTextColor, zIndex: bringToFront() }); 
  const addQuote = () => addItemToJournal({ id: Date.now(), type: 'quote', text: '', author: '', x: 0, y: 0, scale: 1, font: 'var(--font-heading)', bgColor: 'transparent', textColor: defaultTextColor, zIndex: bringToFront() });
  const addTodo = () => addItemToJournal({ id: Date.now(), type: 'todo', listTitle: 'Checklist', tasks: [{ id: 1, text: '', done: false }], x: 0, y: 0, scale: 1, bgColor: 'rgba(253, 246, 227, 0.9)', textColor: '#2c3e50', font: 'var(--font-body)', zIndex: bringToFront() });
  const addSticker = (emoji) => { addItemToJournal({ id: Date.now(), type: 'sticker', emoji, x: 0, y: 0, scale: 1, zIndex: bringToFront() }); setShowStickerMenu(false); };
  const addMediaItem = (media) => { addItemToJournal({ id: Date.now(), type: 'media', media, x: 0, y: 0, scale: 1, displayStyle: media.mediaType === 'book' ? 'spine' : 'cover', zIndex: bringToFront() }); setShowMediaModal(false); };

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
      } catch (err) { alert('Upload failed'); } finally { setIsUploading(false); setShowMobileTools(false); }
    };
    input.click();
  };

  const deleteItem = (id) => { 
    setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: j.items.filter(item => item.id !== id) } : j)); 
    setFocusedItemId(null); 
  };
  
  const updateItem = (id, updates) => { 
    setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: j.items.map(item => item.id === id ? { ...item, ...updates } : item) } : j)); 
  };

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

  const archiveCurrentPage = async (e) => {
    e.preventDefault();
    if (!archiveTitle.trim()) return alert("Please give your entry a title.");
    setIsArchiving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/journals/archive', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: archiveTitle, theme: bgTheme, pages: journals, items: activeJournal.items }) 
      });
      if (res.ok) {
        alert("Notebook securely locked in your Vault!");
        setShowArchiveModal(false); setArchiveTitle('');
        setJournals([{ id: Date.now(), name: 'Page 1', items: [] }]); 
      }
    } catch (err) { alert("Failed to archive page."); } finally { setIsArchiving(false); }
  };

  // 🔥 SMART AUTO-RESIZE FOR TEXTAREAS
  const handleTextResize = (el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  const renderItemContent = (item) => {
    switch (item.type) {
      case 'note':
      case 'text':
        return <textarea 
          ref={handleTextResize}
          onFocus={() => setFocusedItemId(item.id)} 
          value={item.text} 
          onChange={(e) => { handleTextResize(e.target); updateItem(item.id, { text: e.target.value }); }} 
          placeholder={item.type === 'note' ? "Scribble thoughts..." : "Type here..."} 
          onPointerDownCapture={(e) => e.stopPropagation()} 
          style={{ flexGrow: 1, background: item.isHighlighted ? 'rgba(241, 196, 15, 0.4)' : 'transparent', border: 'none', outline: 'none', resize: 'both', fontFamily: item.font, fontSize: item.type === 'note' ? '1.05rem' : '1.4rem', color: item.textColor, lineHeight: '1.5', cursor: 'text', minHeight: '100px', minWidth: '150px', overflow: 'hidden' }} 
        />;
      
      case 'quote':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '250px' }}>
            <span style={{ fontSize: '4rem', color: 'rgba(0, 0, 0, 0.1)', position: 'absolute', top: '-15px', left: '5px', fontFamily: 'var(--font-heading)', pointerEvents: 'none' }}>"</span>
            <textarea 
              ref={handleTextResize}
              onFocus={() => setFocusedItemId(item.id)} 
              value={item.text} 
              onChange={(e) => { handleTextResize(e.target); updateItem(item.id, { text: e.target.value }); }} 
              placeholder="Enter a profound quote..." 
              onPointerDownCapture={(e) => e.stopPropagation()} 
              style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'both', fontFamily: item.font, fontSize: '1.3rem', fontStyle: 'italic', color: item.textColor, textAlign: 'center', minHeight: '80px', zIndex: 1, overflow: 'hidden' }} 
            />
            <input onFocus={() => setFocusedItemId(item.id)} value={item.author} onChange={(e) => updateItem(item.id, { author: e.target.value })} placeholder="- Author" onPointerDownCapture={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', color: item.textColor, opacity: 0.8, fontFamily: 'var(--font-body)', fontWeight: 'bold', fontSize: '0.9rem' }} />
          </div>
        );
      
      case 'photo':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={item.url} alt="Polaroid" draggable="false" style={{ width: '200px', height: '200px', objectFit: 'cover', pointerEvents: 'none', border: '1px solid #ddd' }} />
            <input onFocus={() => setFocusedItemId(item.id)} value={item.caption} onChange={(e) => updateItem(item.id, { caption: e.target.value })} placeholder="Write a caption..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ marginTop: '15px', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontFamily: item.font, color: item.textColor, width: '100%', fontSize: '1rem' }} />
          </div>
        );
      
      case 'todo':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
            <input onFocus={() => setFocusedItemId(item.id)} value={item.listTitle || ''} onChange={(e) => updateItem(item.id, { listTitle: e.target.value })} placeholder="List Title..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ margin: '0 0 5px 0', fontFamily: item.font, color: item.textColor, borderBottom: `1px solid ${item.textColor}40`, paddingBottom: '5px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: '1.2rem', fontWeight: 'bold' }} />
            {item.tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={task.done} onChange={(e) => updateTodoTask(item.id, task.id, { done: e.target.checked })} onPointerDownCapture={(e) => e.stopPropagation()} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                <input onFocus={() => setFocusedItemId(item.id)} value={task.text} onChange={(e) => updateTodoTask(item.id, task.id, { text: e.target.value })} placeholder="New item..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', color: item.textColor, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1, fontFamily: item.font }} />
              </div>
            ))}
          </div>
        );
      
      case 'sticker': return <div style={{ fontSize: '5rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }}>{item.emoji}</div>;
      
      case 'media':
        return (
          <div style={{ filter: 'drop-shadow(5px 10px 15px rgba(0,0,0,0.5))' }}>
            {item.media.mediaType === 'book' && item.displayStyle === 'spine' ? (
              <div className="shelf-book-spine" style={{ backgroundImage: `url(${item.media.coverImage})`, width: '50px', height: '200px', margin: 0, pointerEvents: 'none' }}><span className="spine-title">{item.media.title}</span></div>
            ) : (
              <img src={item.media.coverImage} className={item.media.mediaType === 'book' ? "shelf-book" : "film-poster"} style={{ width: '130px', height: '190px', margin: 0, borderRadius: item.media.mediaType === 'book' ? '2px 6px 6px 2px' : '4px', pointerEvents: 'none' }} alt="Media" />
            )}
          </div>
        );
      default: return null;
    }
  };

  if (isLoadingDesk) return <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'var(--lantern-gold)' }}><h2>Dusting off your desk...</h2></div>;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: '#000', zIndex: 9999 }}>
      
      <style>{`
        .item-container .item-controls { opacity: 0; transition: opacity 0.2s; pointer-events: none; } 
        .item-container:hover .item-controls, .item-container.focused .item-controls { opacity: 1; pointer-events: auto; }
        
        @media (max-width: 768px) {
          .mobile-top-nav { width: 90% !important; padding: 8px 15px !important; gap: 8px !important; }
          .mobile-top-nav span, .mobile-top-nav button { font-size: 0.8rem !important; }
          .mobile-bottom-nav { width: 95% !important; padding: 10px !important; gap: 8px !important; justify-content: flex-start !important; overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
          .mobile-bottom-nav button { padding: 5px !important; flex-shrink: 0; }
          .mobile-item-controls { padding: 4px 8px !important; gap: 6px !important; top: -38px !important; right: auto !important; left: 0 !important; transform: scale(0.9); transform-origin: top left; }
        }
      `}</style>

      <div ref={constraintsRef} onPointerDown={() => setFocusedItemId(null)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: themes[bgTheme], backgroundSize: bgTheme.includes('lined') || bgTheme.includes('grid') ? '100% 32px, 32px 32px' : 'auto', transition: 'background 0.5s ease' }}>
        
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}  
            animate={{ opacity: 1, scale: item.scale || 1 }} 
            drag dragConstraints={constraintsRef} dragElastic={0.1} dragMomentum={false}
            style={{ 
              x: item.x || 0, y: item.y || 0, position: 'absolute', top: '30%', left: isMobile ? '10%' : '40%', zIndex: item.zIndex, 
              background: item.type === 'photo' ? '#f8f9fa' : (item.bgColor || 'transparent'), 
              padding: item.type === 'sticker' || item.type === 'media' ? '0' : (item.type === 'photo' ? '10px 10px 25px 10px' : '20px'), 
              boxShadow: (item.bgColor && item.bgColor !== 'transparent') || item.type === 'photo' ? '0 10px 25px rgba(0,0,0,0.3)' : 'none', 
              borderRadius: item.type === 'note' ? '2px 10px 10px 20px' : '8px', 
              display: 'flex', flexDirection: 'column',
              outline: focusedItemId === item.id ? '2px dashed rgba(245, 158, 11, 0.5)' : 'none',
              outlineOffset: '4px',
              touchAction: 'none' 
            }}
            onDragEnd={(e, info) => { updateItem(item.id, { x: (item.x || 0) + info.offset.x, y: (item.y || 0) + info.offset.y }); }}
            onPointerDown={(e) => { e.stopPropagation(); updateItem(item.id, { zIndex: bringToFront() }); setFocusedItemId(item.id); }}
            whileDrag={{ boxShadow: "0 20px 50px rgba(0,0,0,0.4)", zIndex: 10000 }}
            className={`item-container ${focusedItemId === item.id ? 'focused' : ''}`}
          >
            <div className="item-controls mobile-item-controls" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', borderRadius: '30px', padding: '6px 12px', gap: '10px', position: 'absolute', top: '-45px', right: isMobile ? 'auto' : '0px', left: isMobile ? '0px' : 'auto', zIndex: 50, boxShadow: '0 5px 15px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
              
              <button onPointerDownCapture={(e) => { e.stopPropagation(); updateItem(item.id, { scale: Math.max(0.5, (item.scale || 1) - 0.1) }); }} title="Shrink" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><ZoomOut size={16} /></button>
              <button onPointerDownCapture={(e) => { e.stopPropagation(); updateItem(item.id, { scale: Math.min(2.5, (item.scale || 1) + 0.1) }); }} title="Enlarge" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><ZoomIn size={16} /></button>
              <div style={{ width: '1px', height: '15px', background: 'rgba(255,255,255,0.2)', margin: '0 2px' }}></div>

              {['note', 'text', 'quote', 'todo', 'photo'].includes(item.type) && (
                <select title="Font" value={item.font || 'var(--font-heading)'} onPointerDownCapture={e => e.stopPropagation()} onChange={e => updateItem(item.id, { font: e.target.value })} style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <option value="var(--font-heading)">Serif</option>
                  <option value='"Courier New", Courier, monospace'>Typewriter</option>
                  <option value="sans-serif">Modern</option>
                  <option value='"Comic Sans MS", cursive, sans-serif'>Handwriting</option>
                </select>
              )}

              {['note', 'text', 'quote', 'todo', 'photo'].includes(item.type) && (
                <div title="Text Color" style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <Type size={14} color="#fff" />
                  <input type="color" value={item.textColor || '#000000'} onPointerDownCapture={e => e.stopPropagation()} onChange={e => updateItem(item.id, { textColor: e.target.value })} style={{ width: '20px', height: '20px', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }} />
                </div>
              )}

              {['note', 'text', 'quote', 'todo'].includes(item.type) && (
                <div title="Background Color" style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '10px' }}>
                  <Palette size={14} color="#fff" />
                  <input type="color" value={item.bgColor !== 'transparent' ? item.bgColor : '#ffffff'} onPointerDownCapture={e => e.stopPropagation()} onChange={e => updateItem(item.id, { bgColor: e.target.value })} style={{ width: '20px', height: '20px', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }} />
                  <button onClick={(e) => { e.stopPropagation(); updateItem(item.id, { bgColor: 'transparent' }); }} title="Make Transparent" style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Droplet size={14} /></button>
                </div>
              )}

              {item.type === 'media' && item.media.mediaType === 'book' && ( 
                <button onPointerDownCapture={(e) => { e.stopPropagation(); updateItem(item.id, { displayStyle: item.displayStyle === 'spine' ? 'cover' : 'spine' }); }} style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '10px' }}><RefreshCcw size={16} /></button> 
              )}

              {/* 🔥 DRAG ICON REMOVED ON MOBILE SO IT DOESNT CLUTTER */}
              {!isMobile && (
                <>
                  <div style={{ width: '1px', height: '15px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
                  <div title="Drag to Move" style={{ color: '#3498db', cursor: 'grab', display: 'flex', alignItems: 'center' }}><Move size={16} /></div>
                </>
              )}
              
              {!isMobile && <div style={{ width: '1px', height: '15px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>}
              <button onPointerDownCapture={(e) => { e.stopPropagation(); deleteItem(item.id); }} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
            </div>

            {renderItemContent(item)}
          </motion.div>
        ))}

        <div style={{ position: 'absolute', bottom: '30px', left: '20px', right: '20px', display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center', zIndex: 1000, pointerEvents: 'none' }}>
          
          {!isMobile && (
            <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <button onClick={goToPrevPage} disabled={currentIndex === 0} style={{ background: 'transparent', border: 'none', color: currentIndex === 0 ? '#555' : 'var(--lantern-gold)', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={20} /></button>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', minWidth: '60px', textAlign: 'center' }}>{activeJournal?.name}</span>
              <button onClick={goToNextPage} disabled={currentIndex === journals.length - 1} style={{ background: 'transparent', border: 'none', color: currentIndex === journals.length - 1 ? '#555' : 'var(--lantern-gold)', cursor: currentIndex === journals.length - 1 ? 'not-allowed' : 'pointer' }}><ChevronRight size={20} /></button>
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
              <button onClick={createNewPage} style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}><Plus size={16} /> New Page</button>
            </div>
          )}

          {(!isMobile || showMobileTools) && (
            <div style={{ pointerEvents: 'auto', display: isMobile ? 'grid' : 'flex', gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'none', gap: '15px', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', padding: '15px 25px', borderRadius: isMobile ? '20px' : '40px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', position: isMobile ? 'absolute' : 'relative', bottom: isMobile ? '80px' : 'auto' }}>
              <button onClick={addText} title="Plain Text" style={{ background: 'transparent', border: 'none', color: '#ecf0f1', cursor: 'pointer' }}><Type size={22} /></button>
              <button onClick={addNote} title="Sticky Note" style={{ background: 'transparent', border: 'none', color: '#f1c40f', cursor: 'pointer' }}><StickyNote size={22} /></button>
              <button onClick={addTodo} title="Checklist" style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer' }}><CheckSquare size={22} /></button>
              <button onClick={addQuote} title="Quote" style={{ background: 'transparent', border: 'none', color: '#9b59b6', cursor: 'pointer' }}><Quote size={22} /></button>
              {!isMobile && <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>}
              <button onClick={addPhoto} title="Upload Photo" disabled={isUploading} style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.5 : 1 }}>{isUploading ? <Loader2 size={22} className="lucide-spin" /> : <ImageIcon size={22} />}</button>
              <button onClick={() => { setShowMediaModal(true); setShowMobileTools(false); }} title="Library Books" style={{ background: 'transparent', border: 'none', color: '#e67e22', cursor: 'pointer' }}><BookOpen size={22} /></button>
              {!isMobile && <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>}
              <button onClick={() => { setShowStickerMenu(!showStickerMenu); setShowBgMenu(false); setShowMobileTools(false); }} title="Stickers" style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><SmilePlus size={22} /></button>
              <button onClick={() => { setShowBgMenu(!showBgMenu); setShowStickerMenu(false); setShowMobileTools(false); }} title="Desk Theme" style={{ background: 'transparent', border: 'none', color: '#1abc9c', cursor: 'pointer' }}><Palette size={22} /></button>
              {!isMobile && <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>}
              <button onClick={() => { setShowArchiveModal(true); setShowMobileTools(false); }} title="Send to Vault" style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', cursor: 'pointer' }}><Inbox size={22} /></button>
              {!isMobile && <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>}
              <button onClick={() => alert("Oracle Lens coming next!")} title="Ask Oracle AI" style={{ background: 'transparent', border: 'none', color: '#a29bfe', cursor: 'pointer' }}><Sparkles size={22} /></button>
            </div>
          )}

          {isMobile && (
            <div style={{ pointerEvents: 'auto', display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={goToPrevPage} disabled={currentIndex === 0} style={{ background: 'transparent', border: 'none', color: currentIndex === 0 ? '#555' : 'var(--lantern-gold)' }}><ChevronLeft size={20} /></button>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeJournal?.name.replace('Page ', 'Pg ')}</span>
                <button onClick={goToNextPage} disabled={currentIndex === journals.length - 1} style={{ background: 'transparent', border: 'none', color: currentIndex === journals.length - 1 ? '#555' : 'var(--lantern-gold)' }}><ChevronRight size={20} /></button>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button onClick={() => setShowArchiveModal(true)} title="Send to Vault" style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)' }}><Inbox size={20} /></button>
                <button onClick={() => setShowMobileTools(!showMobileTools)} style={{ background: 'var(--lantern-gold)', border: 'none', color: '#000', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wrench size={20} /></button>
                <button onClick={() => navigate('/vault')} style={{ background: 'transparent', border: 'none', color: '#3498db' }}><Lock size={20} /></button>
              </div>
            </div>
          )}

          {!isMobile && (
            <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <button onClick={() => navigate('/vault')} style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><Lock size={18} /> Vault</button>
            </div>
          )}
        </div>

        {/* MENUS AND MODALS */}
        {showBgMenu && (
          <div className="mobile-bottom-nav hide-scrollbar" style={{ position: 'absolute', bottom: isMobile ? '160px' : '100px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 40px)' : 'repeat(7, 40px)', gap: '10px', zIndex: 1000, boxShadow: '0 15px 30px rgba(0,0,0,0.6)' }}>
            {Object.keys(themes).map(key => (
              <button key={key} title={key} onClick={() => { setBgTheme(key); setShowBgMenu(false); }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: themeSwatches[key], border: bgTheme === key ? '3px solid var(--lantern-gold)' : '2px solid transparent', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }} />
            ))}
          </div>
        )}

        {showStickerMenu && (
          <div className="mobile-bottom-nav hide-scrollbar" style={{ position: 'absolute', bottom: isMobile ? '160px' : '100px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', zIndex: 1000, boxShadow: '0 15px 30px rgba(0,0,0,0.6)' }}>
            {['☕', '🕯️', '🥀', '🕰️', '🎞️', '🎟️', '🖋️', '🍷', '🌿', '🗝️', '📜', '🌙', '🍂', '📌', '📎', '🔍'].map(emoji => (
              <button key={emoji} onClick={() => addSticker(emoji)} style={{ fontSize: '2rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>{emoji}</button>
            ))}
          </div>
        )}

        {showMediaModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '16px', width: '600px', maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--lantern-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}><h2 style={{ margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Select from Archives</h2><button onClick={() => setShowMediaModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div>
              <div style={{ overflowY: 'auto', flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                {profileData ? [...profileData.finishedList, ...profileData.currentlyConsuming, ...profileData.tbrList].map((media, i) => (
                  <div key={i} onClick={() => addMediaItem(media)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <img src={media.coverImage || 'https://via.placeholder.com/100'} alt={media.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #444' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{media.title}</p>
                  </div>
                )) : <p style={{ color: 'var(--lantern-gold)' }}>Loading archives...</p>}
              </div>
            </div>
          </div>
        )}

        {showArchiveModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    </div>
  );
}