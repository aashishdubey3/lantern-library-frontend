import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🔥 FIX: Point to the new auth route!
      const response = await fetch('https://lantern-library-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Check if onboarding is needed
        if (!data.user.interests || data.user.interests.length === 0) {
          window.location.href = '/onboarding'; 
        } else {
          window.location.href = '/'; 
        }
      } else {
        setError(data.message || 'Login failed');
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
        <h2 style={{ color: 'var(--lantern-gold)', marginBottom: '20px' }}>Enter the Archives</h2>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #34495e', background: 'var(--bg-deep)', color: 'var(--text-main)' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #34495e', background: 'var(--bg-deep)', color: 'var(--text-main)' }} />
          
          <div style={{ textAlign: 'right' }}>
            <span onClick={() => navigate('/forgot-password')} style={{ color: '#3498db', fontSize: '0.85rem', cursor: 'pointer' }}>Forgot Password?</span>
          </div>

          <button type="submit" disabled={loading} style={{ padding: '12px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Consulting Ledgers...' : 'Log In'}
          </button>
        </form>
        <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Not a scholar yet? <span onClick={() => navigate('/register')} style={{ color: 'var(--lantern-gold)', cursor: 'pointer', textDecoration: 'underline' }}>Open an account</span>
        </p>
      </div>
    </div>
  );
}