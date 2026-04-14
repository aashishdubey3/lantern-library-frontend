import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  StickyNote, Quote, Image as ImageIcon, CheckSquare, BookOpen, Loader2, 
  SmilePlus, X, RefreshCcw, Save, Type, Plus, ChevronLeft, ChevronRight, 
  Palette, Inbox, Lock, AlignLeft, AlignCenter, AlignRight, Trash2
} from 'lucide-react';

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
  
  // 🔥 CRITICAL: Tracks exactly which item is clicked to show its formatting tab
  const [selectedItemId, setSelectedItemId] = useState(null); 
  
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  const constraintsRef = useRef(null);
  const navigate = useNavigate();

  const activeJournal = journals.find(j => j.id === activeJournalId) || journals[0];
  const items = activeJournal ? activeJournal.items : [];
  const currentIndex = journals.findIndex(j => j.id === activeJournalId);

  // Background Themes
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
    slate: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
  };

  const themeSwatches = { lined: '#fdf6e3', grid: '#e5e5e5', dotted: '#d4c4a8', leather: '#3a2318', parchment: '#f4ecd8', wood: '#4e342e', green: '#1b4332', blueprint: '#1a365d', darkGrid: '#111827', corkboard: '#d4a373', slate: '#2d3748' };

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
  
  const createNewPage = () => { const newId = Date.now(); setJournals([...journals, { id: newId, name: `Page ${journals.length + 1}`, items: [] }]); setActiveJournalId(newId); setSelectedItemId(null); };
  const goToPrevPage = () => { if (currentIndex > 0) { setActiveJournalId(journals[currentIndex - 1].id); setSelectedItemId(null); } };
  const goToNextPage = () => { if (currentIndex < journals.length - 1) { setActiveJournalId(journals[currentIndex + 1].id); setSelectedItemId(null); } };

  const addItemToJournal = (newItem) => { 
    setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: [...j.items, newItem] } : j)); 
    setSelectedItemId(newItem.id); // Auto-select new items
  };

  // 🔥 Default MS Word-style properties
  const defaultFormatting = { font: 'var(--font-body)', fontSize: 16, textAlign: 'left', textColor: '#2c3e50' };

  const addNote = () => addItemToJournal({ id: Date.now(), type: 'note', text: '', x: 100, y: 100, bgColor: '#fdf3c6', ...defaultFormatting, zIndex: bringToFront() });
  const addText = () => addItemToJournal({ id: Date.now(), type: 'text', text: '', x: 100, y: 100, bgColor: 'transparent', ...defaultFormatting, fontSize: 24, font: 'var(--font-heading)', zIndex: bringToFront() }); 
  const addQuote = () => addItemToJournal({ id: Date.now(), type: 'quote', text: '', author: '', x: 100, y: 100, bgColor: 'transparent', ...defaultFormatting, font: 'var(--font-heading)', textAlign: 'center', zIndex: bringToFront() });
  const addTodo = () => addItemToJournal({ id: Date.now(), type: 'todo', listTitle: 'New List', tasks: [{ id: 1, text: '', done: false }], x: 100, y: 100, bgColor: 'rgba(255,255,255,0.8)', ...defaultFormatting, zIndex: bringToFront() });
  const addSticker = (emoji) => { addItemToJournal({ id: Date.now(), type: 'sticker', emoji, x: 100, y: 100, zIndex: bringToFront() }); setShowStickerMenu(false); };
  const addMediaItem = (media) => { addItemToJournal({ id: Date.now(), type: 'media', media, x: 100, y: 100, displayStyle: media.mediaType === 'book' ? 'spine' : 'cover', zIndex: bringToFront() }); setShowMediaModal(false); };

  const addPhoto = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      setIsUploading(true);
      const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', 'lantern_articles'); 
      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dfugne8fq/image/upload', { method: 'POST', body: formData });
        const data = await res.json();
        addItemToJournal({ id: Date.now(), type: 'photo', url: data.secure_url, caption: '', x: 100, y: 100, zIndex: bringToFront() });
      } catch (err) { alert('Upload failed'); } finally { setIsUploading(false); }
    };
    input.click();
  };

  const deleteItem = (id) => { 
    setJournals(journals.map(j => j.id === activeJournalId ? { ...j, items: j.items.filter(item => item.id !== id) } : j)); 
    if (selectedItemId === id) setSelectedItemId(null); 
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

  const saveDesk = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    try {
      await fetch('https://lantern-library-backend.onrender.com/api/journals', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pages: journals, theme: bgTheme }) 
      });
      alert("Desk Layout Saved!");
    } catch (err) { alert("Network error."); } finally { setIsSaving(false); }
  };

  const archiveCurrentPage = async (e) => {
    e.preventDefault();
    if (!archiveTitle.trim()) return alert("Please give your entry a title.");
    setIsArchiving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/journals/archive', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: archiveTitle, theme: themes[bgTheme], pages: journals }) 
      });
      if (res.ok) {
        alert("Notebook securely locked in your Vault!");
        setShowArchiveModal(false); setArchiveTitle('');
        setJournals([{ id: Date.now(), name: 'Page 1', items: [] }]); 
      }
    } catch (err) { alert("Failed to archive page."); } finally { setIsArchiving(false); }
  };

  // 🔥 CORE RENDERER: Applies Formatting to Items
  const renderItemContent = (item) => {
    const commonTextStyle = {
      fontFamily: item.font,
      fontSize: `${item.fontSize}px`,
      color: item.textColor,
      textAlign: item.textAlign,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: 'both',
      lineHeight: '1.5'
    };

    switch (item.type) {
      case 'note':
      case 'text':
        return <textarea value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })} placeholder="Start writing..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ ...commonTextStyle, flexGrow: 1, minHeight: '100px', minWidth: '150px' }} />;
      
      case 'quote':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '250px' }}>
            <span style={{ fontSize: '3em', color: 'rgba(0,0,0,0.1)', position: 'absolute', top: '-10px', left: '10px', fontFamily: 'var(--font-heading)', pointerEvents: 'none' }}>"</span>
            <textarea value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })} placeholder="Enter a profound quote..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ ...commonTextStyle, fontStyle: 'italic', minHeight: '80px', zIndex: 1 }} />
            <input value={item.author} onChange={(e) => updateItem(item.id, { author: e.target.value })} placeholder="- Author" onPointerDownCapture={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', outline: 'none', textAlign: item.textAlign, color: item.textColor, fontFamily: item.font, fontWeight: 'bold', fontSize: '0.8em', opacity: 0.8 }} />
          </div>
        );
      
      case 'todo':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
            <input value={item.listTitle || ''} onChange={(e) => updateItem(item.id, { listTitle: e.target.value })} placeholder="List Title..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ margin: '0 0 5px 0', fontFamily: item.font, color: item.textColor, borderBottom: `1px solid ${item.textColor}40`, paddingBottom: '5px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: `${item.fontSize * 1.2}px`, fontWeight: 'bold', textAlign: item.textAlign }} />
            {item.tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={task.done} onChange={(e) => updateTodoTask(item.id, task.id, { done: e.target.checked })} onPointerDownCapture={(e) => e.stopPropagation()} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <input value={task.text} onChange={(e) => updateTodoTask(item.id, task.id, { text: e.target.value })} placeholder="New item..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: `${item.fontSize}px`, fontFamily: item.font, color: item.textColor, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.5 : 1 }} />
              </div>
            ))}
          </div>
        );

      case 'photo':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={item.url} alt="Polaroid" draggable="false" style={{ width: '200px', height: '200px', objectFit: 'cover', pointerEvents: 'none', borderRadius: '4px' }} />
            <input value={item.caption} onChange={(e) => updateItem(item.id, { caption: e.target.value })} placeholder="Write a caption..." onPointerDownCapture={(e) => e.stopPropagation()} style={{ marginTop: '10px', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontFamily: '"Comic Sans MS", cursive', color: '#2c3e50', width: '100%' }} />
          </div>
        );

      case 'sticker': return <div style={{ fontSize: '5rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))' }}>{item.emoji}</div>;
      
      case 'media':
        return (
          <div>
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

  const selectedItem = items.find(i => i.id === selectedItemId);
  const showFormattingTab = selectedItem && ['text', 'note', 'quote', 'todo'].includes(selectedItem.type);

  if (isLoadingDesk) return <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'var(--lantern-gold)' }}><h2>Dusting off your desk...</h2></div>;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#1e1e1e' }}>
      
      {/* 🟢 LEFT DOCK (Creation Tools) */}
      <div style={{ width: '70px', background: '#2c3e50', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px', zIndex: 100, borderRight: '1px solid #34495e', boxShadow: '2px 0 10px rgba(0,0,0,0.5)' }}>
        <button onClick={addText} title="Text" style={{ background: 'transparent', border: 'none', color: '#ecf0f1', cursor: 'pointer' }}><Type size={24} /></button>
        <button onClick={addNote} title="Sticky Note" style={{ background: 'transparent', border: 'none', color: '#f1c40f', cursor: 'pointer' }}><StickyNote size={24} /></button>
        <button onClick={addTodo} title="Checklist" style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer' }}><CheckSquare size={24} /></button>
        <button onClick={addQuote} title="Quote" style={{ background: 'transparent', border: 'none', color: '#9b59b6', cursor: 'pointer' }}><Quote size={24} /></button>
        <div style={{ width: '40px', height: '1px', background: '#455a64' }}></div>
        <button onClick={addPhoto} title="Photo" disabled={isUploading} style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.5 : 1 }}>{isUploading ? <Loader2 size={24} className="lucide-spin" /> : <ImageIcon size={24} />}</button>
        <button onClick={() => setShowMediaModal(true)} title="Library Media" style={{ background: 'transparent', border: 'none', color: '#e67e22', cursor: 'pointer' }}><BookOpen size={24} /></button>
        <button onClick={() => { setShowStickerMenu(!showStickerMenu); setShowBgMenu(false); }} title="Stickers" style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><SmilePlus size={24} /></button>
        <div style={{ width: '40px', height: '1px', background: '#455a64' }}></div>
        <button onClick={() => { setShowBgMenu(!showBgMenu); setShowStickerMenu(false); }} title="Desk Theme" style={{ background: 'transparent', border: 'none', color: '#1abc9c', cursor: 'pointer' }}><Palette size={24} /></button>
      </div>

      {/* 🟢 CENTER CANVAS (The Desk) */}
      <div 
        ref={constraintsRef} 
        onPointerDown={() => setSelectedItemId(null)} // Clicking empty space deselects
        style={{ flex: 1, position: 'relative', background: themes[bgTheme], backgroundSize: bgTheme.includes('lined') || bgTheme.includes('grid') || bgTheme.includes('blueprint') || bgTheme.includes('darkGrid') ? '100% 32px, 32px 32px' : 'auto', transition: 'background 0.5s ease', overflow: 'hidden' }}
      >
        {/* TOP NAV BAR */}
        <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
          <button onClick={goToPrevPage} disabled={currentIndex === 0} style={{ background: 'transparent', border: 'none', color: currentIndex === 0 ? '#555' : '#bdc3c7', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={20} /></button>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', minWidth: '60px', textAlign: 'center' }}>{activeJournal?.name}</span>
          <button onClick={goToNextPage} disabled={currentIndex === journals.length - 1} style={{ background: 'transparent', border: 'none', color: currentIndex === journals.length - 1 ? '#555' : '#bdc3c7', cursor: currentIndex === journals.length - 1 ? 'not-allowed' : 'pointer' }}><ChevronRight size={20} /></button>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
          <button onClick={createNewPage} style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}><Plus size={16} /> New Page</button>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
          <button onClick={saveDesk} disabled={isSaving} title="Save Draft" style={{ background: 'transparent', border: 'none', color: '#f1c40f', cursor: isSaving ? 'wait' : 'pointer' }}><Save size={18} /></button>
          <button onClick={() => setShowArchiveModal(true)} title="Send to Vault" style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', cursor: 'pointer' }}><Inbox size={18} /></button>
          <button onClick={() => navigate('/vault')} title="Open Vault" style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer' }}><Lock size={18} /></button>
        </div>

        {/* RENDER ITEMS */}
        {items.map(item => {
          const isSelected = selectedItemId === item.id;
          return (
            <motion.div
              key={item.id}
              drag dragConstraints={constraintsRef} dragElastic={0} dragMomentum={false}
              style={{ 
                x: item.x, y: item.y, position: 'absolute', zIndex: item.zIndex, 
                background: item.bgColor || 'transparent', 
                padding: item.type === 'sticker' || item.type === 'media' ? '0' : '20px', 
                borderRadius: '8px', 
                boxShadow: item.bgColor && item.bgColor !== 'transparent' ? '0 10px 20px rgba(0,0,0,0.2)' : 'none',
                // 🔥 Highlighting selected item
                outline: isSelected ? '2px solid #3498db' : 'none',
                outlineOffset: '4px'
              }}
              onDragEnd={(e, info) => updateItem(item.id, { x: item.x + info.offset.x, y: item.y + info.offset.y })}
              onPointerDown={(e) => { e.stopPropagation(); updateItem(item.id, { zIndex: bringToFront() }); setSelectedItemId(item.id); }}
              whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.3)", zIndex: 10000, cursor: 'grabbing' }}
            >
              {renderItemContent(item)}
            </motion.div>
          );
        })}

        {/* POPUP MENUS */}
        {showBgMenu && (
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'var(--bg-panel)', padding: '15px', borderRadius: '12px', border: '1px solid #34495e', display: 'grid', gridTemplateColumns: 'repeat(4, 40px)', gap: '10px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            {Object.keys(themes).map(key => (
              <button key={key} title={key} onClick={() => { setBgTheme(key); setShowBgMenu(false); }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: themeSwatches[key], border: bgTheme === key ? '3px solid var(--lantern-gold)' : '1px solid #555', cursor: 'pointer' }} />
            ))}
          </div>
        )}
        {showStickerMenu && (
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'var(--bg-panel)', padding: '15px', borderRadius: '12px', border: '1px solid #34495e', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', zIndex: 1000 }}>
            {['☕', '🕯️', '🥀', '🕰️', '🎞️', '🎟️', '🖋️', '🍷', '🌿', '🗝️', '📜', '🌙', '🍂', '📌', '📎', '🔍'].map(emoji => (
              <button key={emoji} onClick={() => addSticker(emoji)} style={{ fontSize: '2rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>{emoji}</button>
            ))}
          </div>
        )}
      </div>

      {/* 🟢 RIGHT PANEL (MS Word-Style Formatting Tab) */}
      {selectedItemId && (
        <div style={{ width: '280px', background: '#2c3e50', borderLeft: '1px solid #34495e', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 100, overflowY: 'auto', boxShadow: '-2px 0 10px rgba(0,0,0,0.5)', color: '#ecf0f1' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#bdc3c7', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #34495e', paddingBottom: '10px' }}>Properties</h3>
          
          {showFormattingTab ? (
            <>
              {/* FONT FAMILY */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#95a5a6' }}>Font Style</label>
                <select value={selectedItem.font || 'var(--font-body)'} onChange={e => updateItem(selectedItem.id, { font: e.target.value })} style={{ width: '100%', padding: '8px', background: '#34495e', border: '1px solid #455a64', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                  <option value="var(--font-body)">Standard Sans</option>
                  <option value="var(--font-heading)">Classic Serif</option>
                  <option value='"Courier New", Courier, monospace'>Typewriter</option>
                  <option value='"Comic Sans MS", cursive, sans-serif'>Handwriting</option>
                </select>
              </div>

              {/* FONT SIZE & ALIGNMENT */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#95a5a6' }}>Size</label>
                  <input type="number" value={selectedItem.fontSize || 16} onChange={e => updateItem(selectedItem.id, { fontSize: Number(e.target.value) })} style={{ width: '100%', padding: '8px', background: '#34495e', border: '1px solid #455a64', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#95a5a6' }}>Align</label>
                  <div style={{ display: 'flex', background: '#34495e', borderRadius: '6px', overflow: 'hidden', border: '1px solid #455a64' }}>
                    <button onClick={() => updateItem(selectedItem.id, { textAlign: 'left' })} style={{ flex: 1, padding: '8px 0', background: selectedItem.textAlign === 'left' ? '#3498db' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><AlignLeft size={16} style={{ margin: '0 auto' }}/></button>
                    <button onClick={() => updateItem(selectedItem.id, { textAlign: 'center' })} style={{ flex: 1, padding: '8px 0', background: selectedItem.textAlign === 'center' ? '#3498db' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><AlignCenter size={16} style={{ margin: '0 auto' }}/></button>
                    <button onClick={() => updateItem(selectedItem.id, { textAlign: 'right' })} style={{ flex: 1, padding: '8px 0', background: selectedItem.textAlign === 'right' ? '#3498db' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><AlignRight size={16} style={{ margin: '0 auto' }}/></button>
                  </div>
                </div>
              </div>

              {/* COLORS */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#95a5a6' }}>Text Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" value={selectedItem.textColor || '#000000'} onChange={e => updateItem(selectedItem.id, { textColor: e.target.value })} style={{ width: '35px', height: '35px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                    <span style={{ fontSize: '0.8rem' }}>{selectedItem.textColor || '#000000'}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#95a5a6' }}>Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" value={selectedItem.bgColor !== 'transparent' ? selectedItem.bgColor : '#ffffff'} onChange={e => updateItem(selectedItem.id, { bgColor: e.target.value })} style={{ width: '35px', height: '35px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                    <button onClick={() => updateItem(selectedItem.id, { bgColor: 'transparent' })} style={{ padding: '4px 8px', fontSize: '0.7rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#95a5a6', fontStyle: 'italic' }}>Formatting not available for this item type.</p>
          )}

          {selectedItem.type === 'media' && selectedItem.media.mediaType === 'book' && (
            <button onClick={() => updateItem(selectedItem.id, { displayStyle: selectedItem.displayStyle === 'spine' ? 'cover' : 'spine' })} style={{ padding: '10px', background: '#34495e', color: '#fff', border: '1px solid #455a64', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><RefreshCcw size={16} /> Toggle Spine/Cover</button>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #34495e' }}>
            <button onClick={() => deleteItem(selectedItem.id)} style={{ width: '100%', padding: '12px', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}><Trash2 size={18} /> Delete Item</button>
          </div>

        </div>
      )}

      {/* MODALS */}
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

      {showMediaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '16px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h2 style={{ margin: 0, color: 'white' }}>Archives</h2><button onClick={() => setShowMediaModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>X</button></div>
            <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
              {profileData && [...profileData.finishedList, ...profileData.currentlyConsuming, ...profileData.tbrList].map((media, i) => (
                <div key={i} onClick={() => addMediaItem(media)} style={{ cursor: 'pointer' }}>
                  <img src={media.coverImage || 'https://via.placeholder.com/100'} alt={media.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px' }} />
                  <p style={{ color: '#ccc', fontSize: '0.75rem', textAlign: 'center', margin: '5px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{media.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}