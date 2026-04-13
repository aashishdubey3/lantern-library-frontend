import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function Community() {
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [socket, setSocket] = useState(null);
  
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const newSocket = io('https://lantern-library-backend.onrender.com');
    setSocket(newSocket);

    fetch('https://lantern-library-backend.onrender.com/api/discussions')
      .then(res => res.json())
      .then(data => setTopics(data));

    return () => newSocket.close();
  }, [navigate]);

  useEffect(() => {
    if (socket && activeTopic) {
      socket.emit('join_topic', activeTopic._id);
      socket.on('receive_reply', (newReply) => {
        setActiveTopic(prev => ({ ...prev, replies: [...prev.replies, newReply] }));
      });
    }
    return () => { if (socket) socket.off('receive_reply'); };
  }, [socket, activeTopic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeTopic?.replies]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/discussions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTopicTitle, content: newTopicContent })
      });
      const data = await res.json();
      if (res.ok) {
        setTopics([data, ...topics]);
        setIsCreating(false); setNewTopicTitle(''); setNewTopicContent('');
      } else alert(`Error: ${data.message}`); 
    } catch (err) { alert("Failed to connect to the server."); }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTopic) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/discussions/${activeTopic._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: replyText })
      });
      const updatedTopic = await res.json();
      
      if (res.ok) {
        const newReply = updatedTopic.replies[updatedTopic.replies.length - 1];
        socket.emit('send_reply', { topicId: activeTopic._id, replyData: newReply });
        setActiveTopic(updatedTopic);
        setReplyText('');
      } else alert(`Error: ${updatedTopic.message}`);
    } catch (err) { alert("Failed to connect to the server."); }
  };

  const containerStyle = { 
    maxWidth: '1200px', margin: isMobile ? '0' : '20px auto', 
    display: 'flex', gap: isMobile ? '0' : '20px', 
    height: isMobile ? 'calc(100vh - 65px)' : '80vh', /* Locks screen */
    flexDirection: isMobile ? 'column' : 'row'
  };

  const leftColumnStyle = { 
    width: isMobile ? '100%' : '35%', background: 'var(--bg-panel)', 
    borderRadius: isMobile ? '0' : '16px', border: isMobile ? 'none' : '1px solid var(--border-color)', 
    display: (!isMobile || (isMobile && !activeTopic)) ? 'flex' : 'none', 
    flexDirection: 'column', overflow: 'hidden', height: '100%'
  };

  const rightColumnStyle = { 
    width: isMobile ? '100%' : '65%', background: 'var(--bg-panel)', 
    borderRadius: isMobile ? '0' : '16px', border: isMobile ? 'none' : '1px solid var(--border-color)', 
    display: (!isMobile || (isMobile && activeTopic)) ? 'flex' : 'none', 
    flexDirection: 'column', overflow: 'hidden', height: '100%'
  };

  return (
    <div style={containerStyle}>
      
      {/* LEFT COLUMN: TOPIC LIST */}
      <div style={leftColumnStyle}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-deep)' }}>
          <h2 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1.4rem' }}>Scholar's Lounge</h2>
          <button onClick={() => setIsCreating(!isCreating)} style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--text-main)', border: '1px dashed var(--lantern-gold)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isCreating ? 'Cancel' : '+ Start New Discussion'}
          </button>
        </div>

        <div className="chat-tunnel" style={{ padding: '15px' }}>
          {isCreating && (
            <form onSubmit={handleCreateTopic} style={{ background: 'var(--bg-deep)', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid var(--lantern-gold)' }}>
              <input type="text" placeholder="Discussion Title..." value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px' }} />
              <textarea placeholder="What's on your mind?" value={newTopicContent} onChange={e => setNewTopicContent(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', resize: 'none', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} rows="3" />
              <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Post Topic</button>
            </form>
          )}

          {topics.map(topic => (
            <div key={topic._id} className="app-card" onClick={() => setActiveTopic(topic)} style={{ padding: '15px', marginBottom: '10px', background: activeTopic?._id === topic._id ? 'var(--bg-deep)' : 'var(--bg-panel)', borderRadius: '12px', cursor: 'pointer', border: activeTopic?._id === topic._id ? '1px solid var(--lantern-gold)' : '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: '1.3' }}>{topic.title}</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Started by <span style={{ color: 'var(--lantern-gold)', fontWeight: 'bold' }}>{topic.authorName}</span> • {topic.replies.length} replies</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE CHAT */}
      <div style={rightColumnStyle}>
        {!activeTopic ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <h3>Select a discussion to join.</h3>
          </div>
        ) : (
          <>
            {/* FIXED HEADER */}
            <div className="chat-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                {isMobile && (
                  <button onClick={() => setActiveTopic(null)} style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>←</button>
                )}
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeTopic.title}</h2>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{activeTopic.content}</p>
            </div>

            {/* SCROLLING CHAT TUNNEL */}
            <div className="chat-tunnel">
              {activeTopic.replies.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '20px' }}>No replies yet. Be the first to speak!</p>
              ) : (
                activeTopic.replies.map((reply, index) => {
                  const isMyReply = JSON.parse(localStorage.getItem('user'))?.username === reply.authorName;
                  return (
                    <div key={index} className={`bubble-wrapper ${isMyReply ? 'sent' : 'received'}`}>
                      <span onClick={() => navigate(`/scholar/${reply.authorId}`)} style={{ fontSize: '0.75rem', color: isMyReply ? 'var(--lantern-gold)' : '#3498db', padding: '0 10px', marginBottom: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {reply.authorName}
                      </span>
                      <div className={`chat-bubble ${isMyReply ? 'sent' : 'received'}`}>
                        {reply.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* FIXED BOTTOM INPUT */}
            <form onSubmit={handleSendReply} className="chat-input-area" style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Type your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ flexGrow: 1, padding: '12px 20px', borderRadius: '25px', outline: 'none' }} />
              <button type="submit" style={{ padding: '0 25px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
            </form>
          </>
        )}
      </div>

    </div>
  );
}