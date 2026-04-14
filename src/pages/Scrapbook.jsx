import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PenTool, StickyNote, Trash2, Coffee, Film } from 'lucide-react';

export default function Scrapbook() {
  const [notes, setNotes] = useState([]);
  const [stickers, setStickers] = useState([]);
  const constraintsRef = useRef(null);

  // Spawn a new text note in the center of the desk
  const addNote = () => {
    const newNote = {
      id: Date.now(),
      text: '',
      x: 0,
      y: 0,
      color: ['#fdf6e3', '#fcf3cf', '#f9e79f'][Math.floor(Math.random() * 3)] // Random parchment colors
    };
    setNotes([...notes, newNote]);
  };

  const updateNoteText = (id, newText) => {
    setNotes(notes.map(note => note.id === id ? { ...note, text: newText } : note));
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  // 🎨 The Desktop Background Aesthetic
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#2c3e50' }}>
      
      {/* The Textured Leather Desk Mat */}
      <div 
        ref={constraintsRef} 
        style={{ 
          position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', 
          background: 'linear-gradient(135deg, #1e130c 0%, #3a2318 100%)', 
          borderRadius: '20px', 
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.5)',
          border: '1px solid #4a3020',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        
        {/* The Control Panel (Drawer) */}
        <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', background: 'rgba(20, 20, 23, 0.7)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '30px', border: '1px solid var(--lantern-gold)', zIndex: 100 }}>
          <button onClick={addNote} style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <StickyNote size={18} /> Jot Note
          </button>
          <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>Stickers coming soon...</span>
        </div>

        {/* Render All Notes */}
        {notes.map(note => (
          <motion.div
            key={note.id}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            whileDrag={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
            style={{
              position: 'absolute', top: '30%', left: '40%', width: '220px', minHeight: '220px',
              background: note.color, padding: '15px',
              boxShadow: '2px 5px 15px rgba(0,0,0,0.4)', borderRadius: '2px 10px 10px 20px',
              border: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
              cursor: 'grab', zIndex: 10
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
              <button onPointerDown={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', opacity: 0.6 }}>
                <Trash2 size={16} />
              </button>
            </div>
            
            <textarea
              value={note.text}
              onChange={(e) => updateNoteText(note.id, e.target.value)}
              placeholder="Scribble your thoughts here..."
              style={{
                flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                fontFamily: '"Courier New", Courier, monospace', fontSize: '1rem', color: '#2c3e50',
                lineHeight: '1.5', cursor: 'text'
              }}
              onPointerDownCapture={(e) => e.stopPropagation()} // Prevents dragging when trying to select text!
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}