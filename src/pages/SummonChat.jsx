import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SummonChat() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const mediaTitle = location.state?.title || 'this story';

  const [characterName, setCharacterName] = useState('');
  const [isSummoned, setIsSummoned] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://lantern-library-backend.onrender.com/api/ai/summon', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          characterName,
          mediaTitle,
          userMessage,
          chatHistory: messages.filter(m => m.sender !== 'system' && !m.isGreeting).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }))
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'system', text: '❌ Connection lost to the character.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'system', text: '❌ Server error.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-layout">
      
      {/* FIXED HEADER */}
      <div className="chat-header">
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>✨</span> The Summoning Room
        </h2>
        <button onClick={() => navigate('/profile')} style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', cursor: 'pointer', fontWeight: 'bold' }}>
          Leave Room
        </button>
      </div>

      {!isSummoned ? (
        // STAGE 1: Choose who to summon (Centered in the tunnel)
        <div className="chat-tunnel" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.4rem' }}>From the world of <em>{mediaTitle}</em>...</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Who do you wish to speak with?</p>
          <form onSubmit={handleSummon} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px' }}>
            <input 
              type="text" 
              placeholder="e.g. Paul Atreides, Elizabeth Bennet" 
              value={characterName} 
              onChange={(e) => setCharacterName(e.target.value)}
              style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '1rem', textAlign: 'center' }}
              required
            />
            <button type="submit" style={{ padding: '15px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
              Begin Ritual
            </button>
          </form>
        </div>
      ) : (
        // STAGE 2: The Chat Interface
        <>
          {/* SCROLLING CHAT TUNNEL */}
          <div className="chat-tunnel">
            {messages.map((msg, index) => (
              <div key={index} className={`bubble-wrapper ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                {msg.sender === 'ai' && <strong style={{ marginBottom: '5px', color: 'var(--lantern-gold)', fontSize: '0.8rem', paddingLeft: '5px' }}>{characterName}</strong>}
                <div className={`chat-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', padding: '10px' }}>{characterName} is thinking...</div>}
          </div>

          {/* FIXED BOTTOM INPUT */}
          <form onSubmit={sendMessage} className="chat-input-area" style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder={`Speak to ${characterName}...`}
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              style={{ flexGrow: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid var(--border-color)', outline: 'none' }}
              disabled={loading}
            />
            <button type="submit" disabled={loading} style={{ padding: '0 25px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}