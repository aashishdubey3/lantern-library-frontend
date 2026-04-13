import { useState, useEffect } from 'react';

export default function Footer() {
  const [quote, setQuote] = useState({ text: "", author: "" });
  const year = new Date().getFullYear();

  // 📜 THE SCHOLARLY ARCHIVE OF QUOTES
  const scholarlyQuotes = [
    { text: "The mystery of human existence lies not in just staying alive, but in finding something to live for.", author: "Fyodor Dostoevsky" },
    { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
    { text: "In the midst of winter, I found there was, within me, an invincible summer.", author: "Albert Camus" },
    { text: "The man who has no inner life is a slave to his surroundings.", author: "Henri Frédéric Amiel" },
    { text: "To know that we know what we know, and to know that we do not know what we do not know, that is true knowledge.", author: "Nicolaus Copernicus" },
    { text: "In the end, we will conserve only what we love; we will love only what we understand.", author: "Baba Dioum" }
  ];

  // 🔥 Randomise quote on every refresh
  useEffect(() => {
    const randomQuote = scholarlyQuotes[Math.floor(Math.random() * scholarlyQuotes.length)];
    setQuote(randomQuote);
  }, []);

  const linkStyle = {
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    transition: 'color 0.2s ease',
    cursor: 'pointer'
  };

  const handleMouseOver = (e) => e.target.style.color = 'var(--lantern-gold)';
  const handleMouseOut = (e) => e.target.style.color = 'var(--text-muted)';

  return (
    <footer style={{ background: 'var(--bg-panel)', padding: '60px 20px 30px 20px', borderTop: '1px solid #2c3e50', marginTop: 'auto' }}>
      
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginBottom: '40px' }}>
        
        {/* 1. DYNAMIC LITERARY QUOTE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ color: 'var(--lantern-gold)', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', letterSpacing: '1px', margin: 0 }}>
            🏮 The Lantern Library
          </h3>
          <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontStyle: 'italic', lineHeight: '1.6', margin: 0, minHeight: '80px' }}>
            "{quote.text}"
          </p>
          <span style={{ color: 'var(--lantern-gold)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
            — {quote.author}
          </span>
        </div>

        {/* 2. THE ARCHITECT (Hyperlinked) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ color: 'var(--lantern-gold)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>
            The Architect
          </h3>
          <a href="https://github.com/aashishdubey3" target="_blank" rel="noreferrer" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/aashish-dubey-1aa410229/" target="_blank" rel="noreferrer" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            LinkedIn
          </a>
        </div>

        {/* 3. CONNECT (Hyperlinked) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ color: 'var(--lantern-gold)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>
            Social Archives
          </h3>
          <a href="https://www.instagram.com/_thelanternlibrary?igsh=MTV1Zm82bHI3OG9zNg==" target="_blank" rel="noreferrer" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            The Lantern Library
          </a>
          <a href="https://www.instagram.com/_aashishdubey?igsh=MXMxa2Z3d2VkcHpoMA==" target="_blank" rel="noreferrer" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            Personal Archive
          </a>
        </div>

      </div>

      {/* 📜 COPYRIGHT BAR */}
      <div style={{ borderTop: '1px solid #2c3e50', paddingTop: '20px', textAlign: 'center', maxWidth: '1100px', margin: '0 auto' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
          © {year} Developed by <span style={{ color: 'var(--lantern-gold)', fontWeight: 'bold' }}>Ashish Kumar</span> • All Rights Reserved
        </p>
      </div>
    </footer>
  );
}