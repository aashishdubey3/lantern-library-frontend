import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '12px', border: '1px solid var(--lantern-gold)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--lantern-gold)', marginBottom: '20px' }}>Recover Password</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Enter your email address to receive a password reset link.</p>
        
        {message && <p style={{ color: 'var(--success)', marginBottom: '15px' }}>{message}</p>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #34495e', background: 'var(--bg-deep)', color: 'white' }} />
          <button type="submit" disabled={loading} style={{ padding: '12px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Sending Ravens...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}