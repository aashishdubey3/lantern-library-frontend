import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 🔥 New state variables for the Resend logic
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false); // Reset the resend button on new attempts
    setResendStatus('');
    setLoading(true);

    try {
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
        
        // 🔥 Trigger the Resend UI if we hit the "Account Limbo" error
        if (data.message && data.message.includes('verify your email')) {
          setShowResend(true);
        }
      }
    } catch (err) {
      setError('Server error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 The new function to trigger the backend Resend Route
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendStatus('');
    
    try {
      const response = await fetch('https://lantern-library-backend.onrender.com/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setResendStatus("Success! A new scroll has been dispatched to your email.");
        setError(''); // Clear the red error to focus on the success message
      } else {
        setResendStatus(data.message || "Failed to resend the link.");
      }
    } catch (err) {
      setResendStatus("Server error while trying to resend.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '12px', border: '1px solid var(--lantern-gold)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--lantern-gold)', marginBottom: '20px' }}>Enter the Archives</h2>
        
        {/* Main Error Message */}
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</p>}
        
        {/* 🔥 The Dynamic Resend Verification Box */}
        {showResend && (
          <div style={{ marginBottom: '20px', background: 'rgba(243, 156, 18, 0.1)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--lantern-gold)' }}>
            <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '10px' }}>
              Lost your verification email? We can send a new one.
            </p>
            <button 
              type="button" 
              onClick={handleResendVerification} 
              disabled={resendLoading}
              style={{ padding: '8px 15px', background: 'transparent', border: '1px solid var(--lantern-gold)', color: 'var(--lantern-gold)', borderRadius: '4px', cursor: resendLoading ? 'wait' : 'pointer', fontSize: '0.85rem' }}
            >
              {resendLoading ? 'Summoning Ravens...' : 'Resend Verification Link'}
            </button>
            {/* Status message for the resend action */}
            {resendStatus && (
              <p style={{ marginTop: '10px', fontSize: '0.85rem', color: resendStatus.includes('Success') ? '#2ecc71' : 'var(--danger)' }}>
                {resendStatus}
              </p>
            )}
          </div>
        )}

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