import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

  const [activeChat, setActiveChat] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState(null);
  const [isOnline, setIsOnline] = useState(false); 
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isGroupChat = activeChat && activeChat.members !== undefined;

  // 🔥 UPGRADED: Socket Initialization
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    
    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);

    const newSocket = io('https://lantern-library-backend.onrender.com');
    setSocket(newSocket);
    
    // THE FIX: MongoDB uses _id. We check both just in case to avoid undefined errors.
    const myId = parsedUser._id || parsedUser.id;
    if (myId) {
      newSocket.emit('register_scholar', myId);
    }

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

      if (myProfile.friends) {
        const friendData = await Promise.all(myProfile.friends.map(id => fetch(`https://lantern-library-backend.onrender.com/api/users/scholar/${id}`).then(res => res.json())));
        setFriends(friendData.map(d => d.scholar));
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
      if (groupRes.ok) setGroups(await groupRes.json());

    } catch (err) { console.error("Failed to load network"); }
  };

  useEffect(() => { fetchNetworkData(); }, []);

  useEffect(() => {
    if (!activeChat) return;
    
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      try {
        const url = isGroupChat 
          ? `https://lantern-library-backend.onrender.com/api/groups/${activeChat._id}/messages`
          : `https://lantern-library-backend.onrender.com/api/messages/${activeChat._id}`;

        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setMessages(await res.json());
      } catch (err) { console.error("Failed to fetch history"); }
    };
    
    fetchHistory();

    if (socket) {
      if (isGroupChat) {
        socket.emit('join_group_chat', activeChat._id);
      } else {
        socket.emit('check_online_status', activeChat._id);
        const handleStatus = (data) => { if (data.userId === activeChat._id) setIsOnline(data.isOnline); };
        socket.on('online_status_result', handleStatus);
        return () => socket.off('online_status_result', handleStatus);
      }
    }
  }, [activeChat, socket, isGroupChat]);

  // 🔥 UPGRADED: Real-time Listeners
  useEffect(() => {
    if (!socket) return;

    const handlePrivateMsg = (newMessage) => {
      // If we are currently looking at the chat of the person who sent it
      if (activeChat && !isGroupChat && newMessage.senderId === activeChat._id) {
        setMessages(prev => [...prev, newMessage]);
      }
    };

    const handleGroupMsg = (newMessage) => {
      if (activeChat && isGroupChat && newMessage.groupId === activeChat._id) {
        setMessages(prev => [...prev, newMessage]);
      }
    };

    socket.on('receive_private_message', handlePrivateMsg);
    socket.on('receive_group_message', handleGroupMsg);

    return () => {
      socket.off('receive_private_message', handlePrivateMsg);
      socket.off('receive_group_message', handleGroupMsg);
    };
  }, [socket, activeChat, isGroupChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages]);

  // --- ACTIONS ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const token = localStorage.getItem('token');
    const url = isGroupChat ? `https://lantern-library-backend.onrender.com/api/groups/${activeChat._id}/message` : `https://lantern-library-backend.onrender.com/api/messages`;
    const bodyData = isGroupChat ? { text: messageText } : { receiverId: activeChat._id, text: messageText };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        const savedMessage = await res.json();
        setMessages(prev => [...prev, savedMessage]);
        setMessageText('');
        
        // Immediately emit the saved message so the other person sees it without refreshing
        if (isGroupChat) {
          socket.emit('send_group_message', { groupId: activeChat._id, message: savedMessage });
        } else {
          socket.emit('send_private_message', { receiverId: activeChat._id, message: savedMessage });
        }
      } else {
        const errorData = await res.json();
        alert(errorData.message); 
      }
    } catch (err) { alert("Failed to send message."); }
  };

  const handleAcceptRequest = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`https://lantern-library-backend.onrender.com/api/users/accept-request/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
      fetchNetworkData(); 
    } catch(e) { alert("Error accepting request"); }
  };

  const handleDeclineRequest = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`https://lantern-library-backend.onrender.com/api/users/remove-friend/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
      fetchNetworkData(); 
    } catch(e) { alert("Error declining request"); }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedFriendsForGroup.length === 0) return alert("Add a name and at least 1 friend.");
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newGroupName, members: selectedFriendsForGroup })
      });
      if (res.ok) {
        setIsCreatingGroup(false);
        setNewGroupName('');
        setSelectedFriendsForGroup([]);
        fetchNetworkData(); 
        setActiveTab('groups');
      }
    } catch(e) { alert("Failed to create group."); }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm("Are you sure you want to burn this entire conversation? It cannot be undone.")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/messages/${activeChat._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setMessages([]);
        alert("Chat history erased.");
      }
    } catch (e) { alert("Failed to delete chat."); }
  };

  const handleUnfriend = async () => {
    if (!window.confirm(`Are you sure you want to remove ${activeChat.username} from your friends list?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/users/remove-friend/${activeChat._id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setActiveChat(null);
        fetchNetworkData();
      }
    } catch (e) { alert("Failed to unfriend."); }
  };

  const handleBlockToggle = async () => {
    if (!window.confirm(`Are you sure you want to change the block status for ${activeChat.username}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/users/block/${activeChat._id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setActiveChat(null);
        fetchNetworkData();
      }
    } catch (e) { alert("Failed to update block list."); }
  };

  const getUsernameById = (id) => {
    if (!isGroupChat) return '';
    const member = activeChat.members.find(m => m._id === id);
    return member ? member.username : 'Unknown Scholar';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '30px', height: '80vh' }}>
      
      {/* LEFT COLUMN: INBOX TABS */}
      <div style={{ width: '35%', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid #2c3e50', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #34495e', background: 'var(--bg-deep)' }}>
          <h2 style={{ margin: '0 0 15px 0', color: 'var(--lantern-gold)' }}>Network</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            <button onClick={() => setActiveTab('friends')} style={{ flexGrow: 1, padding: '6px', borderRadius: '4px', border: 'none', background: activeTab === 'friends' ? 'var(--lantern-gold)' : 'transparent', color: activeTab === 'friends' ? 'var(--bg-deep)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Friends</button>
            <button onClick={() => setActiveTab('groups')} style={{ flexGrow: 1, padding: '6px', borderRadius: '4px', border: 'none', background: activeTab === 'groups' ? 'var(--lantern-gold)' : 'transparent', color: activeTab === 'groups' ? 'var(--bg-deep)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Groups</button>
            <button onClick={() => setActiveTab('requests')} style={{ flexGrow: 1, padding: '6px', borderRadius: '4px', border: 'none', background: activeTab === 'requests' ? '#3498db' : 'transparent', color: activeTab === 'requests' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Reqs {requests.length > 0 && `(${requests.length})`}</button>
            <button onClick={() => setActiveTab('blocked')} style={{ flexGrow: 1, padding: '6px', borderRadius: '4px', border: 'none', background: activeTab === 'blocked' ? '#e74c3c' : 'transparent', color: activeTab === 'blocked' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Blocked</button>
          </div>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
          
          {activeTab === 'friends' && (
            friends.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>No friends yet.</p> :
            friends.map(friend => (
              <div key={friend._id} onClick={() => setActiveChat(friend)} style={{ padding: '15px', marginBottom: '10px', background: activeChat?._id === friend._id ? 'var(--bg-deep)' : 'transparent', borderRadius: '8px', cursor: 'pointer', border: activeChat?._id === friend._id ? '1px solid var(--lantern-gold)' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.username}`} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecf0f1', border: '2px solid var(--lantern-gold)' }} />
                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{friend.username}</h4>
              </div>
            ))
          )}

          {activeTab === 'groups' && (
            <>
              {!isCreatingGroup ? (
                <button onClick={() => setIsCreatingGroup(true)} style={{ width: '100%', padding: '10px', background: 'transparent', color: 'var(--lantern-gold)', border: '1px dashed var(--lantern-gold)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>+ New Group Chat</button>
              ) : (
                <form onSubmit={handleCreateGroup} style={{ background: 'var(--bg-deep)', padding: '15px', borderRadius: '8px', border: '1px solid var(--lantern-gold)', marginBottom: '15px' }}>
                  <input type="text" placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: 'none' }} />
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select Friends:</p>
                  <div style={{ maxHeight: '100px', overflowY: 'auto', marginBottom: '10px' }}>
                    {friends.map(f => (
                      <label key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.9rem', marginBottom: '5px' }}>
                        <input type="checkbox" value={f._id} onChange={(e) => {
                          if (e.target.checked) setSelectedFriendsForGroup([...selectedFriendsForGroup, f._id]);
                          else setSelectedFriendsForGroup(selectedFriendsForGroup.filter(id => id !== f._id));
                        }} /> {f.username}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setIsCreatingGroup(false)} style={{ flex: 1, padding: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ flex: 1, padding: '6px', background: 'var(--lantern-gold)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Create</button>
                  </div>
                </form>
              )}
              {groups.map(group => (
                <div key={group._id} onClick={() => setActiveChat(group)} style={{ padding: '15px', marginBottom: '10px', background: activeChat?._id === group._id ? 'var(--bg-deep)' : 'transparent', borderRadius: '8px', cursor: 'pointer', border: activeChat?._id === group._id ? '1px solid var(--lantern-gold)' : '1px solid #34495e', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👥</div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{group.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{group.members.length} Members</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'requests' && (
            requests.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>No pending requests.</p> :
            requests.map(req => (
              <div key={req._id} style={{ padding: '15px', marginBottom: '10px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid #34495e', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${req.username}`} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ecf0f1' }} />
                  <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{req.username}</h4>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleAcceptRequest(req._id)} style={{ flex: 1, padding: '6px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Accept</button>
                  <button onClick={() => handleDeclineRequest(req._id)} style={{ flex: 1, padding: '6px', background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '4px', cursor: 'pointer' }}>Decline</button>
                </div>
              </div>
            ))
          )}

          {activeTab === 'blocked' && (
            blockedUsers.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>Nobody blocked.</p> :
            blockedUsers.map(user => (
              <div key={user._id} onClick={() => setActiveChat(user)} style={{ padding: '15px', marginBottom: '10px', background: activeChat?._id === user._id ? 'var(--bg-deep)' : 'transparent', borderRadius: '8px', cursor: 'pointer', border: activeChat?._id === user._id ? '1px solid #e74c3c' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecf0f1', border: '2px solid #e74c3c', opacity: 0.5 }} />
                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem', textDecoration: 'line-through' }}>{user.username}</h4>
              </div>
            ))
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: CHAT WINDOW */}
      <div style={{ width: '65%', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid #2c3e50', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeChat ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <h3>Select a conversation.</h3>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #34495e', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {!isGroupChat ? (
                  <>
                    <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${activeChat.username}`} alt="Avatar" style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ecf0f1', border: '2px solid var(--lantern-gold)', cursor: 'pointer' }} onClick={() => navigate(`/scholar/${activeChat._id}`)} />
                    <div>
                      <h2 style={{ margin: 0, color: 'var(--text-main)', cursor: 'pointer' }} onClick={() => navigate(`/scholar/${activeChat._id}`)}>{activeChat.username}</h2>
                      {activeTab !== 'blocked' && <span style={{ fontSize: '0.8rem', color: isOnline ? 'var(--success)' : 'var(--text-muted)' }}>{isOnline ? '🟢 Online' : '⚪ Offline'}</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👥</div>
                    <div>
                      <h2 style={{ margin: 0, color: 'var(--text-main)' }}>{activeChat.name}</h2>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeChat.members.map(m => m.username).join(', ')}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* ACTION BUTTONS */}
              {!isGroupChat && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {activeTab === 'friends' && (
                    <>
                      <button onClick={handleDeleteChat} style={{ background: 'transparent', border: '1px solid #7f8c8d', color: '#7f8c8d', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Delete History</button>
                      <button onClick={handleUnfriend} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Unfriend ✂️</button>
                    </>
                  )}
                  {activeTab === 'blocked' ? (
                     <button onClick={handleBlockToggle} style={{ background: '#e74c3c', border: 'none', color: 'white', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Unblock Scholar</button>
                  ) : (
                     <button onClick={handleBlockToggle} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Block 🚫</button>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {activeTab === 'blocked' ? (
                 <div style={{ textAlign: 'center', color: '#e74c3c', marginTop: '20px', fontStyle: 'italic' }}>This scholar is blocked. You cannot send or receive messages.</div>
              ) : messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '20px' }}>Say hello!</p>
              ) : (
                messages.map((msg, index) => {
                  const isMyMsg = msg.senderId === currentUser?.id || msg.senderId === currentUser?._id;
                  return (
                    <div key={index} style={{ alignSelf: isMyMsg ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      {isGroupChat && !isMyMsg && (
                        <div style={{ fontSize: '0.75rem', color: '#3498db', marginBottom: '3px', marginLeft: '10px', fontWeight: 'bold' }}>
                          {getUsernameById(msg.senderId)}
                        </div>
                      )}
                      <div style={{ padding: '12px 18px', borderRadius: '15px', background: isMyMsg ? 'var(--lantern-gold)' : '#34495e', color: isMyMsg ? 'var(--bg-deep)' : 'white', borderBottomRightRadius: isMyMsg ? '4px' : '15px', borderBottomLeftRadius: isMyMsg ? '15px' : '4px' }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMyMsg ? 'right' : 'left' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            {activeTab !== 'blocked' && (
              <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #34495e', display: 'flex', gap: '10px', background: 'var(--bg-deep)' }}>
                <input type="text" placeholder="Write a message..." value={messageText} onChange={e => setMessageText(e.target.value)} style={{ flexGrow: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid #2c3e50', background: 'var(--bg-panel)', color: 'white', outline: 'none' }} />
                <button type="submit" style={{ padding: '0 25px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}