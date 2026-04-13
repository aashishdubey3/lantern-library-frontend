import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SummonChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const mediaTitle = location.state?.title || 'the archives';

  const [characterName, setCharacterName] = useState('');
  const [isSummoned, setIsSummoned] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            <div className="chat-tunnel magical-chat-tunnel">
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', opacity: 0.7 }}>
                  <div className="glowing-avatar" style={{ width: '25px', height: '25px' }}></div>
                  <div style={{ color: 'var(--lantern-gold)', fontStyle: 'italic', fontSize: '0.9rem' }}>The spirit is responding...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input-area" style={{ background: '#0B0E14', borderTop: '1px solid rgba(243, 156, 18, 0.2)' }}>
              <input type="text" placeholder={`Speak to ${characterName}...`} value={input} onChange={(e) => setInput(e.target.value)} style={{ flexGrow: 1, padding: '12px 20px', borderRadius: '25px', outline: 'none', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} disabled={loading} />
              <button type="submit" disabled={loading} style={{ padding: '0 25px', background: 'var(--lantern-gold)', color: '#0B0E14', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}