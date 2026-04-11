import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SummonChat() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // We grab the title of the book/movie from the button click on the Profile page
  const mediaTitle = location.state?.title || 'this story';

  const [characterName, setCharacterName] = useState('');
  const [isSummoned, setIsSummoned] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Lock in the character and start the chat
  const handleSummon = (e) => {
    e.preventDefault();
    if (characterName.trim() === '') return;
    setIsSummoned(true);
    
    // We tag this first message as a greeting so we can hide it from Gemini's history
    setMessages([{ 
      sender: 'ai', 
      text: `*The mist clears. ${characterName} steps forward from the world of ${mediaTitle}.* "You called for me?"`,
      isGreeting: true 
    }]);
  };

  // 2. Send messages to your Gemini Backend
  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = input;
    // Add user's message to the screen immediately
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
          // Filter out the fake greeting so Gemini doesn't crash!
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
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', background: '#1e272e', color: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      
      {/* Header */}
      <div style={{ padding: '20px', background: '#2c3e50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>✨ The Summoning Room</h2>
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: '#ecf0f1', cursor: 'pointer', textDecoration: 'underline' }}>Leave Room</button>
      </div>

      {!isSummoned ? (
        // STAGE 1: Choose who to summon
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h3>From the world of <em>{mediaTitle}</em>...</h3>
          <p style={{ color: '#bdc3c7', marginBottom: '20px' }}>Who do you wish to speak with?</p>
          <form onSubmit={handleSummon} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="e.g. Paul Atreides, Elizabeth Bennet" 
              value={characterName} 
              onChange={(e) => setCharacterName(e.target.value)}
              style={{ padding: '12px', width: '80%', borderRadius: '6px', border: 'none', fontSize: '16px' }}
              required
            />
            <button type="submit" style={{ padding: '12px 24px', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              Begin Ritual
            </button>
          </form>
        </div>
      ) : (
        // STAGE 2: The Chat Interface
        <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
          
          {/* Chat Window */}
          <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ 
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', 
                background: msg.sender === 'user' ? '#2980b9' : '#34495e', 
                padding: '12px 16px', 
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                maxWidth: '80%',
                lineHeight: '1.5'
              }}>
                {msg.sender === 'ai' && <strong style={{ display: 'block', marginBottom: '5px', color: '#9b59b6', fontSize: '12px' }}>{characterName}</strong>}
                {msg.text}
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', color: '#bdc3c7', fontStyle: 'italic', fontSize: '14px' }}>{characterName} is thinking...</div>}
          </div>

          {/* Input Box */}
          <form onSubmit={sendMessage} style={{ padding: '15px', background: '#2c3e50', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder={`Speak to ${characterName}...`}
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              style={{ flexGrow: 1, padding: '12px', borderRadius: '20px', border: 'none', outline: 'none' }}
              disabled={loading}
            />
            <button type="submit" disabled={loading} style={{ padding: '0 20px', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
              Send
            </button>
          </form>

        </div>
      )}
    </div>
  );
}