import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [dailyArticleGoal, setDailyArticleGoal] = useState(1);
  const [isLibraryPublic, setIsLibraryPublic] = useState(true); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const response = await fetch('https://lantern-library-backend.onrender.com/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          setUsername(data.username || '');
          setBio(data.bio || '');
          setInterests(data.interests ? data.interests.join(', ') : '');
          setDailyArticleGoal(data.dailyArticleGoal || 1);
          setIsLibraryPublic(data.isLibraryPublic !== false); 
        }
      } catch (error) {
        console.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');
    
    const interestArray = interests.split(',').map(i => i.trim()).filter(i => i);

    try {
      const response = await fetch('https://lantern-library-backend.onrender.com/api/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username, bio, interests: interestArray, dailyArticleGoal, isLibraryPublic })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage'));
        alert("Settings saved successfully!");
        navigate('/profile');
      } else {
        alert("Failed to save settings.");
      }
    } catch (error) { alert("Server error."); } 
    finally { setSaving(false); }
  };

  // 🔥 THE NUCLEAR OPTION
  const handleDeleteAccount = async () => {
    if (!window.confirm("🚨 WARNING 🚨\n\nThis will permanently delete your account, your published manuscripts, and your messages. This cannot be undone. Are you absolutely sure?")) {
      return;
    }
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/users/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/register'; // Hard reset to registration!
      } else {
        alert("Failed to delete account.");
      }
    } catch (err) {
      alert("Server error during deletion.");
    }
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--lantern-gold)' }}>Opening ledgers...</h2>;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '12px', border: '1px solid #2c3e50', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <h1 style={{ color: 'var(--lantern-gold)', marginBottom: '30px', textAlign: 'center', fontSize: '2.2rem' }}>Account Settings</h1>
        
        <form onSubmit={handleSave}>
          <label style={{ display: 'block', color: 'var(--lantern-gold)', fontWeight: 'bold', marginBottom: '8px' }}>Scholar Name</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '12px', marginBottom: '20px', background: 'var(--bg-deep)', color: 'white', border: '1px solid #34495e', borderRadius: '6px' }} />

          <label style={{ display: 'block', color: 'var(--lantern-gold)', fontWeight: 'bold', marginBottom: '8px' }}>Biography</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A wandering scholar of the archives..." style={{ width: '100%', padding: '12px', marginBottom: '20px', background: 'var(--bg-deep)', color: 'white', border: '1px solid #34495e', borderRadius: '6px', minHeight: '100px', resize: 'vertical' }} />

          <label style={{ display: 'block', color: 'var(--lantern-gold)', fontWeight: 'bold', marginBottom: '8px' }}>Areas of Study (comma-separated)</label>
          <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Sci-Fi, Philosophy, Fantasy" style={{ width: '100%', padding: '12px', marginBottom: '20px', background: 'var(--bg-deep)', color: 'white', border: '1px solid #34495e', borderRadius: '6px' }} />

          <label style={{ display: 'block', color: 'var(--lantern-gold)', fontWeight: 'bold', marginBottom: '8px' }}>Daily Reading Goal (Articles)</label>
          <input type="number" min="1" max="10" value={dailyArticleGoal} onChange={(e) => setDailyArticleGoal(Number(e.target.value))} style={{ width: '100%', padding: '12px', marginBottom: '30px', background: 'var(--bg-deep)', color: 'white', border: '1px solid #34495e', borderRadius: '6px' }} />

          {/* Privacy Switch */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--bg-deep)', border: '1px solid #34495e', borderRadius: '6px', marginBottom: '40px' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>Public Library</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Allow other scholars to see your reading lists.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setIsLibraryPublic(!isLibraryPublic)} 
              style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: isLibraryPublic ? 'var(--success)' : '#7f8c8d', color: 'white', transition: 'all 0.2s' }}
            >
              {isLibraryPublic ? 'PUBLIC 👁️' : 'PRIVATE 🔒'}
            </button>
          </div>

          <button type="submit" disabled={saving} style={{ width: '100%', padding: '15px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '20px' }}>
            {saving ? 'Sealing Records...' : 'Save Settings'}
          </button>
        </form>

        {/* DANGER ZONE */}
        <div style={{ borderTop: '1px dashed #e74c3c', paddingTop: '30px', marginTop: '20px' }}>
          <h3 style={{ color: '#e74c3c', margin: '0 0 10px 0' }}>Danger Zone</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>Permanently erase your existence from The Lantern Library. This action cannot be reversed.</p>
          <button 
            onClick={handleDeleteAccount} 
            style={{ width: '100%', padding: '12px', background: 'transparent', color: '#e74c3c', border: '2px solid #e74c3c', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.target.style.background = '#e74c3c'; e.target.style.color = 'white'; }}
            onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#e74c3c'; }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}