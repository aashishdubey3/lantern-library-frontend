import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SummonChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const chatTunnelRef = useRef(null);
  
  const mediaTitle = location.state?.title || 'the archives';

  const [characterName, setCharacterName] = useState('');
  const [isSummoned, setIsSummoned] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

 useEffect(() => {
    // This tells ONLY the chat tunnel to scroll its own internal height, 
    // leaving the main webpage completely alone.
    if (chatTunnelRef.current) {
      chatTunnelRef.current.scrollTo({
        top: chatTunnelRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const handleSummon = (e) => {
    e.preventDefault();
    if (characterName.trim() === '') return;
    setIsSummoned(true);
    setMessages([{ 
      sender: 'ai', 
      text: `*The mist clears. ${characterName} steps forward from the world of ${mediaTitle}.* "You called for me?"`,
      isGreeting: true 
    }]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    // 🔥 THE MEMORY LEDGER: Rolling Window Logic
    // We strictly take only the last 6 messages to preserve your Gemini API limits.
    const strictHistory = messages.filter(m => m.sender !== 'system' && !m.isGreeting);
    const tokenSavingHistory = strictHistory.slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://lantern-library-backend.onrender.com/api/ai/summon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          characterName, 
          mediaTitle, 
          userMessage,
          chatHistory: tokenSavingHistory
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'system', text: '❌ The connection to the realm severed.' }]);
      }
    } catch (error) { 
      setMessages(prev => [...prev, { sender: 'system', text: '❌ The magical weave is unstable (Server error).' }]); 
    } 
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
      <div className="chat-layout">
        
        <div className="chat-header">
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--lantern-gold)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span> The Summoning Room
          </h2>
          <button onClick={() => navigate('/profile')} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Sever Connection
          </button>
        </div>

        {!isSummoned ? (
          <div className="chat-tunnel magical-chat-tunnel" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--lantern-gold)', fontSize: '1.8rem', fontFamily: 'var(--font-heading)' }}>From the world of <em>{mediaTitle}</em>...</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontStyle: 'italic' }}>Whose spirit do you wish to commune with?</p>
            <form onSubmit={handleSummon} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px', position: 'relative', zIndex: 2 }}>
              <input type="text" placeholder="e.g. Paul Atreides, Elizabeth Bennet" value={characterName} onChange={(e) => setCharacterName(e.target.value)} style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--lantern-gold)', background: 'var(--bg-panel)', color: 'var(--text-main)', fontSize: '1rem', textAlign: 'center', boxShadow: '0 0 15px rgba(243, 156, 18, 0.1)' }} required />
              <button type="submit" style={{ padding: '15px', background: 'var(--lantern-gold)', color: '#0B0E14', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Begin Ritual</button>
            </form>
          </div>
        ) : (
         <>
            <div className="chat-tunnel magical-chat-tunnel" ref={chatTunnelRef}>
              {messages.map((msg, index) => (
                <div key={index} className={`bubble-wrapper ${msg.sender === 'user' ? 'sent' : 'received'}`} style={{ gap: '6px' }}>
                  
                  {/* Glowing AI Avatar & Name */}
                  {msg.sender === 'ai' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', paddingLeft: '5px' }}>
                      <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${characterName}`} alt="AI" className="glowing-avatar" />
                      <strong style={{ color: 'var(--lantern-gold)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{characterName}</strong>
                    </div>
                  )}

                  <div className={`chat-bubble summon-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="bubble-wrapper received" style={{ gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', paddingLeft: '5px' }}>
                    <div className="glowing-avatar" style={{ width: '30px', height: '30px', background: 'var(--bg-deep)' }}></div>
                    <strong style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Communing...</strong>
                  </div>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}
              
            </div>

           <form onSubmit={sendMessage} className="chat-input-area" style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(20, 20, 23, 0.85)', borderTop: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', padding: '20px 25px', zIndex: 10 }}>
              <input 
                type="text" 
                placeholder={`Speak to ${characterName}...`} 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                style={{ flexGrow: 1, padding: '14px 22px', borderRadius: '30px', outline: 'none', background: 'var(--bg-deep)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)', fontSize: '1.05rem', transition: 'border 0.3s ease' }} 
                disabled={loading} 
              />
              <button 
                type="submit" 
                disabled={loading} 
                style={{ padding: '14px 28px', background: 'linear-gradient(135deg, var(--lantern-gold), #d35400)', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', minWidth: '110px' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.6)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)'; }}
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}