import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 🔥 FIX: Now pointing to the new auth route!
      const response = await fetch('https://lantern-library-backend.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message); // "Registration successful! Please check your email..."
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '12px', border: '1px solid var(--lantern-gold)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--lantern-gold)', marginBottom: '20px' }}>Join the Library</h2>
        
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</p>}
        {success && <p style={{ color: 'var(--success)', fontSize: '0.95rem', marginBottom: '15px', padding: '10px', border: '1px solid var(--success)', borderRadius: '6px' }}>{success}</p>}
        
        {!success && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #34495e', background: 'var(--bg-deep)', color: 'var(--text-main)' }} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #34495e', background: 'var(--bg-deep)', color: 'var(--text-main)' }} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #34495e', background: 'var(--bg-deep)', color: 'var(--text-main)' }} />
            <button type="submit" disabled={loading} style={{ padding: '12px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Inscribing...' : 'Register'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already a scholar? <span onClick={() => navigate('/login')} style={{ color: 'var(--lantern-gold)', cursor: 'pointer', textDecoration: 'underline' }}>Log in</span>
        </p>
      </div>
    </div>
  );
}