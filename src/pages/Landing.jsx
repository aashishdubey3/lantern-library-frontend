import { useNavigate } from 'react-router-dom';
import { Key, PenTool } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-deep)', 
      position: 'relative', 
      overflow: 'hidden',
      padding: '20px'
    }}>
      
      {/* 🔥 The Ambient Lantern Glow in the Background */}
      <div style={{ 
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
        width: '60vw', height: '60vw', maxWidth: '600px', maxHeight: '600px', 
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)', 
        filter: 'blur(40px)', zIndex: 0, animation: 'pulse-glow 4s infinite alternate' 
      }}></div>

      <div className="animate-cascade-1" style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: '600px' }}>
        
        {/* The 3D Book Icon (Scaled up for the grand entrance) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', transform: 'scale(1.8)' }}>
          <div className="aesthetic-3d-book" style={{ cursor: 'default' }}>
            <div className="book-static-page left"></div>
            <div className="book-spine-center"></div>
            <div className="book-flipping-page" style={{ animation: 'flip-page 3s infinite cubic-bezier(0.64, 0.04, 0.35, 1)' }}></div>
            <div className="book-static-page right"></div>
          </div>
        </div>

        {/* Epic Typography */}
        <h1 style={{ 
          fontSize: window.innerWidth <= 768 ? '2.8rem' : '4rem', 
          color: 'var(--text-main)', 
          fontFamily: 'var(--font-heading)', 
          margin: '0 0 15px 0', 
          lineHeight: '1.1',
          textShadow: '0 0 30px rgba(245, 158, 11, 0.2)' 
        }}>
          The Lantern Library
        </h1>
        
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.3rem', 
          fontFamily: 'var(--font-heading)', 
          fontStyle: 'italic', 
          marginBottom: '50px', 
          lineHeight: '1.6' 
        }}>
          "A sanctuary for the wandering mind. Where pages breathe, and the archives whisper the secrets of the past."
        </p>

        {/* The Grand Call to Actions */}
        <div className="animate-cascade-2" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '350px', margin: '0 auto' }}>
          
          <button 
            onClick={() => navigate('/login')}
            className="lantern-search-btn"
            style={{ 
              padding: '16px', borderRadius: '30px', fontSize: '1.1rem', fontFamily: 'var(--font-body)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%'
            }}
          >
            <Key size={20} /> Present Library Card
          </button>

          <button 
            onClick={() => navigate('/register')} /* Change this to /signup if that is what your route is named! */
            style={{ 
              padding: '16px', borderRadius: '30px', fontSize: '1.1rem', fontFamily: 'var(--font-body)', 
              background: 'transparent', border: '1px solid var(--lantern-gold)', color: 'var(--lantern-gold)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
              transition: 'all 0.3s', width: '100%'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--lantern-glow)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
          >
            <PenTool size={20} /> Register as a Scholar
          </button>

        </div>
      </div>

      {/* Required tiny animation for the book flipping on the landing page */}
      <style>
        {`
          @keyframes flip-page {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(-180deg); }
            100% { transform: rotateY(0deg); }
          }
        `}
      </style>
    </div>
  );
}