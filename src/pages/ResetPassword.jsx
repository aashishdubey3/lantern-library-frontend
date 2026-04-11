import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://lantern-library-backend.onrender.com/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Server error.");
    }
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '12px', border: '1px solid var(--lantern-gold)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--lantern-gold)', marginBottom: '20px' }}>Forge New Password</h2>
        
        {message && <p style={{ color: 'var(--success)', marginBottom: '15px' }}>{message}</p>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #34495e', background: 'var(--bg-deep)', color: 'white' }} />
          <button type="submit" style={{ padding: '12px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Save New Password
          </button>
        </form>
        <button onClick={() => navigate('/login')} style={{ marginTop: '15px', background: 'transparent', color: '#3498db', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Back to Login</button>
      </div>
    </div>
  );
}