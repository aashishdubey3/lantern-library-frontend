import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]); 
  const [activeTab, setActiveTab] = useState('friends');
  
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState([]);

  const { id } = useParams();
  const [activeChat, setActiveChat] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState(null);
  const [isOnline, setIsOnline] = useState(false); 
  
  const [showChatMenu, setShowChatMenu] = useState(false);
  const chatMenuRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isGroupChat = activeChat && activeChat.members !== undefined;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) setShowChatMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    
    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);

    const newSocket = io('https://lantern-library-backend.onrender.com');
    setSocket(newSocket);
    
    const myId = parsedUser._id || parsedUser.id;
    if (myId) newSocket.emit('register_scholar', myId);

    return () => newSocket.close();
  }, [navigate]);

  const fetchNetworkData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const profRes = await fetch('https://lantern-library-backend.onrender.com/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      const myProfile = await profRes.json();
      localStorage.setItem('user', JSON.stringify(myProfile));
      setCurrentUser(myProfile);

      let loadedFriends = [];
      let loadedGroups = [];

      if (myProfile.friends) {
        const friendData = await Promise.all(myProfile.friends.map(id => fetch(`https://lantern-library-backend.onrender.com/api/users/scholar/${id}`).then(res => res.json())));
        loadedFriends = friendData.map(d => d.scholar);
        setFriends(loadedFriends);
      }
      if (myProfile.friendRequests) {
        const requestData = await Promise.all(myProfile.friendRequests.map(id => fetch(`https://lantern-library-backend.onrender.com/api/users/scholar/${id}`).then(res => res.json())));
        setRequests(requestData.map(d => d.scholar));
      }
      if (myProfile.blockedUsers) {
        const blockedData = await Promise.all(myProfile.blockedUsers.map(id => fetch(`https://lantern-library-backend.onrender.com/api/users/scholar/${id}`).then(res => res.json())));
        setBlockedUsers(blockedData.map(d => d.scholar));
      }
      const groupRes = await fetch('https://lantern-library-backend.onrender.com/api/groups', { headers: { 'Authorization': `Bearer ${token}` } });
      if (groupRes.ok) {
        loadedGroups = await groupRes.json();
        setGroups(loadedGroups);
      }

      if (id) {
        const foundFriend = loadedFriends.find(f => f._id === id);
        const foundGroup = loadedGroups.find(g => g._id === id);
        if (foundFriend) setActiveChat(foundFriend);
        else if (foundGroup) setActiveChat(foundGroup);
      }

    } catch (err) { console.error("Failed to load network"); }
  };

  useEffect(() => { fetchNetworkData(); }, [id]); 

  const handleChatClick = (chatObject) => { navigate(`/messages/${chatObject._id}`); };
  const handleBackToList = () => { setActiveChat(null); navigate('/messages'); };

  useEffect(() => {
    if (!activeChat) return;
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      try {
        const url = isGroupChat ? `https://lantern-library-backend.onrender.com/api/groups/${activeChat._id}/messages` : `https://lantern-library-backend.onrender.com/api/messages/${activeChat._id}`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setMessages(await res.json());
      } catch (err) { console.error("Failed to fetch history"); }
    };
    fetchHistory();

    if (socket) {
      if (isGroupChat) socket.emit('join_group_chat', activeChat._id);
      else {
        socket.emit('check_online_status', activeChat._id);
        const handleStatus = (data) => { if (data.userId === activeChat._id) setIsOnline(data.isOnline); };
        socket.on('online_status_result', handleStatus);
        return () => socket.off('online_status_result', handleStatus);
      }
    }
  }, [activeChat, socket, isGroupChat]);

  useEffect(() => {
    if (!socket) return;
    const handlePrivateMsg = (newMessage) => { if (activeChat && !isGroupChat && newMessage.senderId === activeChat._id) setMessages(prev => [...prev, newMessage]); };
    const handleGroupMsg = (newMessage) => { if (activeChat && isGroupChat && newMessage.groupId === activeChat._id) setMessages(prev => [...prev, newMessage]); };
    socket.on('receive_private_message', handlePrivateMsg);
    socket.on('receive_group_message', handleGroupMsg);
    return () => { socket.off('receive_private_message', handlePrivateMsg); socket.off('receive_group_message', handleGroupMsg); };
  }, [socket, activeChat, isGroupChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;
    const token = localStorage.getItem('token');
    const url = isGroupChat ? `https://lantern-library-backend.onrender.com/api/groups/${activeChat._id}/message` : `https://lantern-library-backend.onrender.com/api/messages`;
    const bodyData = isGroupChat ? { text: messageText } : { receiverId: activeChat._id, text: messageText };

    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(bodyData) });
      if (res.ok) {
        const savedMessage = await res.json();
        setMessages(prev => [...prev, savedMessage]);
        setMessageText('');
        if (isGroupChat) socket.emit('send_group_message', { groupId: activeChat._id, message: savedMessage });
        else socket.emit('send_private_message', { receiverId: activeChat._id, message: savedMessage });
      } else alert("Error sending message.");
    } catch (err) { alert("Failed to send message."); }
  };

  const getUsernameById = (id) => {
    if (!isGroupChat) return '';
    const member = activeChat.members.find(m => m._id === id);
    return member ? member.username : 'Unknown';
  };

  const handleAcceptRequest = async (id) => { const token = localStorage.getItem('token'); await fetch(`https://lantern-library-backend.onrender.com/api/users/accept-request/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }}); fetchNetworkData(); };
  const handleDeclineRequest = async (id) => { const token = localStorage.getItem('token'); await fetch(`https://lantern-library-backend.onrender.com/api/users/remove-friend/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }}); fetchNetworkData(); };
  
  const handleDeleteChat = async () => { 
    if (window.confirm("Burn this conversation? This will clear all messages.")) { 
      const token = localStorage.getItem('token'); 
      await fetch(`https://lantern-library-backend.onrender.com/api/messages/${activeChat._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); 
      setMessages([]); 
    } 
  };
  
  const handleUnfriend = async () => { 
    if (window.confirm("Remove this user from your friends list?")) { 
      const token = localStorage.getItem('token'); 
      await fetch(`https://lantern-library-backend.onrender.com/api/users/remove-friend/${activeChat._id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); 
      handleBackToList(); 
      fetchNetworkData(); 
    } 
  };
  
  const handleBlockToggle = async () => { 
    if (window.confirm("Change block status for this user?")) { 
      const token = localStorage.getItem('token'); 
      await fetch(`https://lantern-library-backend.onrender.com/api/users/block/${activeChat._id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); 
      handleBackToList(); 
      fetchNetworkData(); 
    } 
  };

  // 🔥 DIRECT UNBLOCK FROM THE LIST
  const handleUnblockDirectly = async (userId) => {
    const token = localStorage.getItem('token'); 
    await fetch(`https://lantern-library-backend.onrender.com/api/users/block/${userId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); 
    fetchNetworkData(); 
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedFriendsForGroup.length === 0) return alert("Add a name and at least 1 friend.");
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/groups/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name: newGroupName, members: selectedFriendsForGroup }) });
      if (res.ok) { setIsCreatingGroup(false); setNewGroupName(''); setSelectedFriendsForGroup([]); fetchNetworkData(); setActiveTab('groups'); }
    } catch(e) { alert("Failed to create group."); }
  };

  const containerStyle = { maxWidth: '1200px', margin: isMobile ? '0' : '20px auto', display: 'flex', gap: isMobile ? '0' : '20px', height: isMobile ? 'auto' : 'calc(100vh - 120px)', flexDirection: isMobile ? 'column' : 'row' };
  const leftColumnStyle = { width: isMobile ? '100%' : '35%', display: (!isMobile || !activeChat) ? 'flex' : 'none', flexDirection: 'column', height: '100%' };
  const rightColumnStyle = { width: isMobile ? '100%' : '65%', display: (!isMobile || activeChat) ? 'flex' : 'none', flexDirection: 'column' };

  return (
    <div style={containerStyle}>
      
      {/* LEFT COLUMN: INBOX TABS */}
      <div style={leftColumnStyle}>
        <div style={{ padding: '15px', background: 'var(--bg-deep)' }}>
          <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.4rem' }}>Whispers</h2>
          <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '5px' }}>
            <button onClick={() => setActiveTab('friends')} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', background: activeTab === 'friends' ? 'var(--text-main)' : 'var(--bg-panel)', color: activeTab === 'friends' ? 'var(--bg-deep)' : 'var(--text-muted)', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>Friends</button>
            <button onClick={() => setActiveTab('groups')} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', background: activeTab === 'groups' ? 'var(--text-main)' : 'var(--bg-panel)', color: activeTab === 'groups' ? 'var(--bg-deep)' : 'var(--text-muted)', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>Groups</button>
            <button onClick={() => setActiveTab('requests')} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', background: activeTab === 'requests' ? '#3498db' : 'var(--bg-panel)', color: activeTab === 'requests' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>Reqs {requests.length > 0 && `(${requests.length})`}</button>
            <button onClick={() => setActiveTab('blocked')} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', background: activeTab === 'blocked' ? '#e74c3c' : 'var(--bg-panel)', color: activeTab === 'blocked' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>Blocked</button>
          </div>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
          {activeTab === 'friends' && (
            friends.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No friends yet.</p> :
            friends.map(friend => (
              <div key={friend._id} className="app-card" onClick={() => handleChatClick(friend)} style={{ padding: '15px', background: activeChat?._id === friend._id ? 'var(--bg-deep)' : 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.username}`} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecf0f1' }} />
                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem' }}>{friend.username}</h4>
              </div>
            ))
          )}

          {activeTab === 'groups' && (
            <>
              {!isCreatingGroup ? (
                <button onClick={() => setIsCreatingGroup(true)} style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--text-main)', border: '1px dashed var(--lantern-gold)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>+ New Group Chat</button>
              ) : (
                <form onSubmit={handleCreateGroup} style={{ background: 'var(--bg-deep)', padding: '15px', borderRadius: '12px', border: '1px solid var(--lantern-gold)', marginBottom: '15px' }}>
                  <input type="text" placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px' }} />
                  <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' }}>
                    {friends.map(f => (
                      <label key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', padding: '5px 0' }}>
                        <input type="checkbox" value={f._id} onChange={(e) => {
                          if (e.target.checked) setSelectedFriendsForGroup([...selectedFriendsForGroup, f._id]);
                          else setSelectedFriendsForGroup(selectedFriendsForGroup.filter(id => id !== f._id));
                        }} /> {f.username}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setIsCreatingGroup(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>Cancel</button>
                    <button type="submit" style={{ flex: 1, padding: '10px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Create</button>
                  </div>
                </form>
              )}
              {groups.map(group => (
                <div key={group._id} className="app-card" onClick={() => handleChatClick(group)} style={{ padding: '15px', background: activeChat?._id === group._id ? 'var(--bg-deep)' : 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👥</div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem' }}>{group.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{group.members.length} Members</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'requests' && (
            requests.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending requests.</p> :
            requests.map(req => (
              <div key={req._id} style={{ padding: '15px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${req.username}`} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
                  <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{req.username}</h4>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleAcceptRequest(req._id)} style={{ flex: 1, padding: '8px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Accept</button>
                  <button onClick={() => handleDeclineRequest(req._id)} style={{ flex: 1, padding: '8px', background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '6px' }}>Decline</button>
                </div>
              </div>
            ))
          )}

          {/* 🔥 DIRECT UNBLOCK BUTTON IN THE LIST */}
          {activeTab === 'blocked' && (
            blockedUsers.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>Nobody blocked.</p> :
            blockedUsers.map(user => (
              <div key={user._id} className="app-card" style={{ padding: '15px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecf0f1', border: '2px solid #e74c3c', opacity: 0.5 }} />
                  <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.05rem', textDecoration: 'line-through' }}>{user.username}</h4>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleUnblockDirectly(user._id); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE CHAT WINDOW */}
      <div style={rightColumnStyle} className={isMobile && activeChat ? "mobile-fixed-chat chat-layout" : "chat-layout"}>
        {!activeChat ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <h3>Select a conversation.</h3>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {isMobile && (
                  <button onClick={handleBackToList} style={{ background: 'transparent', border: 'none', color: 'var(--lantern-gold)', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>←</button>
                )}
                {!isGroupChat ? (
                  <>
                    <img onClick={() => navigate(`/scholar/${activeChat._id}`)} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${activeChat.username}`} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#ecf0f1', border: '2px solid var(--lantern-gold)', cursor: 'pointer' }} />
                    <div onClick={() => navigate(`/scholar/${activeChat._id}`)} style={{ cursor: 'pointer' }}>
                      <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{activeChat.username}</h2>
                      {activeTab !== 'blocked' && <span style={{ fontSize: '0.75rem', color: isOnline ? '#27ae60' : 'var(--text-muted)' }}>{isOnline ? '🟢 Online' : '⚪ Offline'}</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👥</div>
                    <div>
                      <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{activeChat.name}</h2>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{activeChat.members.map(m => m.username).join(', ')}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* 🔥 SLEEK 3-DOTS ACTION MENU */}
              {!isGroupChat && (
                <div style={{ position: 'relative' }} ref={chatMenuRef}>
                  <button onClick={() => setShowChatMenu(!showChatMenu)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px' }}>⋮</button>
                  {showChatMenu && (
                    <div style={{ position: 'absolute', top: '100%', right: '0', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', zIndex: 100, boxShadow: '0 5px 20px rgba(0,0,0,0.4)', width: '180px', marginTop: '10px' }}>
                      <div onClick={() => { setShowChatMenu(false); navigate(`/scholar/${activeChat._id}`); }} style={{ padding: '14px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', color: 'var(--text-main)' }}>👤 View Profile</div>
                      
                      {activeTab !== 'blocked' && (
                        <>
                          <div onClick={() => { setShowChatMenu(false); handleDeleteChat(); }} style={{ padding: '14px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', color: 'var(--text-main)' }}>🧹 Clear Chat</div>
                          <div onClick={() => { setShowChatMenu(false); handleUnfriend(); }} style={{ padding: '14px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', color: '#e74c3c' }}>❌ Unfriend</div>
                        </>
                      )}

                      <div onClick={() => { setShowChatMenu(false); handleBlockToggle(); }} style={{ padding: '14px 15px', cursor: 'pointer', fontSize: '0.95rem', color: '#e74c3c', background: 'var(--bg-deep)', fontWeight: 'bold' }}>
                        {activeTab === 'blocked' ? '🟢 Unblock User' : '🚫 Block User'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="chat-tunnel">
              {activeTab === 'blocked' ? (
                 <div style={{ textAlign: 'center', color: '#e74c3c', marginTop: '20px', fontStyle: 'italic', padding: '20px' }}>This scholar is blocked. You cannot send or receive messages.</div>
              ) : messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '20px' }}>Say hello!</p>
              ) : (
                messages.map((msg, index) => {
                  const isMyMsg = msg.senderId === currentUser?.id || msg.senderId === currentUser?._id;
                  return (
                    <div key={index} className={`bubble-wrapper ${isMyMsg ? 'sent' : 'received'}`}>
                      {isGroupChat && !isMyMsg && (
                        <div style={{ fontSize: '0.75rem', color: '#3498db', marginBottom: '4px', paddingLeft: '10px', fontWeight: 'bold' }}>{getUsernameById(msg.senderId)}</div>
                      )}
                      <div className={`chat-bubble ${isMyMsg ? 'sent' : 'received'}`}>{msg.text}</div>
                      <div className="chat-timestamp" style={{ textAlign: isMyMsg ? 'right' : 'left' }}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {activeTab !== 'blocked' && (
              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input type="text" placeholder="Message..." value={messageText} onChange={e => setMessageText(e.target.value)} style={{ flexGrow: 1, padding: '12px 20px', borderRadius: '25px', outline: 'none' }} />
                <button type="submit" style={{ padding: '0 25px', background: 'var(--lantern-gold)', color: '#fff', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}