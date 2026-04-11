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
  
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

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
        setActiveTopic(prev => ({
          ...prev,
          replies: [...prev.replies, newReply]
        }));
      });
    }

    return () => {
      if (socket) socket.off('receive_reply');
    };
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
        setIsCreating(false);
        setNewTopicTitle('');
        setNewTopicContent('');
      } else {
        alert(`Error: ${data.message}`); 
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
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
      } else {
        alert(`Error: ${updatedTopic.message}`);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '30px', height: '80vh' }}>
      
      {/* LEFT COLUMN: TOPIC LIST */}
      <div style={{ width: '35%', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid #2c3e50', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #34495e', background: 'var(--bg-deep)' }}>
          <h2 style={{ margin: '0 0 15px 0', color: 'var(--lantern-gold)' }}>Scholar's Lounge</h2>
          <button onClick={() => setIsCreating(!isCreating)} style={{ width: '100%', padding: '10px', background: 'transparent', color: 'var(--text-main)', border: '1px dashed var(--lantern-gold)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isCreating ? 'Cancel' : '+ Start New Discussion'}
          </button>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
          {isCreating && (
            <form onSubmit={handleCreateTopic} style={{ background: 'var(--bg-deep)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--lantern-gold)' }}>
              <input type="text" placeholder="Discussion Title..." value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: 'var(--bg-panel)', color: 'white', border: 'none', borderRadius: '4px' }} />
              <textarea placeholder="What's on your mind?" value={newTopicContent} onChange={e => setNewTopicContent(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: 'var(--bg-panel)', color: 'white', border: 'none', borderRadius: '4px', resize: 'none' }} rows="3" />
              <button type="submit" style={{ width: '100%', padding: '8px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Post Topic</button>
            </form>
          )}

          {topics.map(topic => (
            <div 
              key={topic._id} 
              onClick={() => setActiveTopic(topic)}
              style={{ padding: '15px', marginBottom: '10px', background: activeTopic?._id === topic._id ? 'var(--bg-deep)' : 'transparent', borderRadius: '8px', cursor: 'pointer', border: activeTopic?._id === topic._id ? '1px solid var(--lantern-gold)' : '1px solid transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.3' }}>{topic.title}</h4>
              
              {/* 🔥 Clickable Author Names in Topic List */}
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Started by <span onClick={(e) => { e.stopPropagation(); navigate(`/scholar/${topic.authorId}`); }} style={{ color: 'var(--lantern-gold)', cursor: 'pointer', fontWeight: 'bold' }}>{topic.authorName}</span> • {topic.replies.length} replies
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE CHAT */}
      <div style={{ width: '65%', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid #2c3e50', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeTopic ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <h3>Select a discussion to join the conversation.</h3>
          </div>
        ) : (
          <>
            <div style={{ padding: '25px', borderBottom: '1px solid #34495e', background: 'var(--bg-deep)' }}>
              <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>{activeTopic.title}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>{activeTopic.content}</p>
              <div style={{ marginTop: '15px', fontSize: '0.8rem', color: 'var(--lantern-gold)' }}>
                Started by <span onClick={() => navigate(`/scholar/${activeTopic.authorId}`)} style={{ cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>{activeTopic.authorName}</span>
              </div>
            </div>

            <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {activeTopic.replies.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '20px' }}>No replies yet. Be the first to speak!</p>
              ) : (
                activeTopic.replies.map((reply, index) => {
                  const isMyReply = JSON.parse(localStorage.getItem('user'))?.username === reply.authorName;
                  
                  return (
                    <div key={index} style={{ alignSelf: isMyReply ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      
                      {/* 🔥 Clickable Author Names in Chat Messages */}
                      <span 
                        onClick={() => navigate(`/scholar/${reply.authorId}`)} 
                        style={{ fontSize: '0.75rem', color: isMyReply ? 'var(--lantern-gold)' : '#3498db', marginLeft: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {reply.authorName}
                      </span>
                      
                      <div style={{ padding: '12px 18px', borderRadius: '15px', background: isMyReply ? 'var(--lantern-gold)' : '#34495e', color: isMyReply ? 'var(--bg-deep)' : 'white', borderBottomRightRadius: isMyReply ? '4px' : '15px', borderBottomLeftRadius: isMyReply ? '15px' : '4px', marginTop: '4px' }}>
                        {reply.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendReply} style={{ padding: '20px', borderTop: '1px solid #34495e', display: 'flex', gap: '10px', background: 'var(--bg-deep)' }}>
              <input type="text" placeholder="Type your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ flexGrow: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid #2c3e50', background: 'var(--bg-panel)', color: 'white', outline: 'none' }} />
              <button type="submit" style={{ padding: '0 25px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
            </form>
          </>
        )}
      </div>

    </div>
  );
}