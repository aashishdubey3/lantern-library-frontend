import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const [selected, setSelected] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const topics = ['Philosophy', 'History', 'Music', 'Movies', 'Painting', 'Classic Literature', 'Psychology', 'Technology'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  const toggleTopic = (topic) => {
    if (selected.includes(topic)) {
      setSelected(selected.filter(t => t !== topic));
    } else {
      if (selected.length < 3) setSelected([...selected, topic]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) return alert("Please select at least one discipline.");
    
    setIsSaving(true);
    const token = localStorage.getItem('token');
    
    try {
      // 🔥 FIX: Pointed to the correct master update route and changed method to PUT
      const response = await fetch('https://lantern-library-backend.onrender.com/api/users/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ interests: selected })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Backend Error: ${errorData.message || 'Failed to update archives.'}`);
        setIsSaving(false);
        return;
      }

      // If successful, update local storage and redirect
      const updatedUser = await response.json();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      navigate('/');
      
    } catch (error) {
      console.error("Network Error:", error);
      alert("Could not connect to the backend server. Is it running?");
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    storedUser.interests = ['Technology']; 
    localStorage.setItem('user', JSON.stringify(storedUser));
    navigate('/');
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      <div style={{ maxWidth: '700px', background: 'var(--bg-panel)', padding: '50px', borderRadius: '16px', border: '1px solid var(--lantern-gold)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
        
        <h1 style={{ color: 'var(--lantern-gold)', fontSize: '2.5rem', marginBottom: '10px' }}>What seek ye library</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '40px' }}>Select up to 3 topics to personalize your daily reading and research.</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '40px' }}>
          {topics.map(topic => (
            <button 
              key={topic}
              onClick={() => toggleTopic(topic)}
              style={{ 
                padding: '12px 24px', 
                borderRadius: '30px', 
                border: selected.includes(topic) ? '2px solid var(--lantern-gold)' : '1px solid #34495e',
                background: selected.includes(topic) ? 'rgba(243, 156, 18, 0.1)' : 'var(--bg-deep)',
                color: selected.includes(topic) ? 'var(--lantern-gold)' : 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {topic}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ padding: '15px 40px', width: '100%', maxWidth: '300px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: isSaving ? 'not-allowed' : 'pointer', border: 'none' }}
          >
            {isSaving ? 'Saving...' : 'Enter the Archives →'}
          </button>
          
          <button 
            onClick={handleSkip}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  );
}