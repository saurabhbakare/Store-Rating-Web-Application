import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Mail, Lock, MapPin, Eye, EyeOff, Check, X } from 'lucide-react';

export default function Register({ navigateToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password rules states
  const [pwLength, setPwLength] = useState(false);
  const [pwUpper, setPwUpper] = useState(false);
  const [pwSpecial, setPwSpecial] = useState(false);
  // Name rules states
  const [nameValid, setNameValid] = useState(false);

  useEffect(() => {
    // Check password rules
    setPwLength(password.length >= 8 && password.length <= 16);
    setPwUpper(/[A-Z]/.test(password));
    setPwSpecial(/[^A-Za-z0-9\s]/.test(password));
  }, [password]);

  useEffect(() => {
    // Check name rules
    setNameValid(name.trim().length >= 20 && name.trim().length <= 60);
  }, [name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Extra double checks
    if (!nameValid) {
      setError('Name must be between 20 and 60 characters.');
      return;
    }
    if (!pwLength || !pwUpper || !pwSpecial) {
      setError('Password does not meet all criteria.');
      return;
    }
    if (address.trim().length === 0 || address.length > 400) {
      setError('Address is required and must not exceed 400 characters.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', { name, email, password, address });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigateToLogin();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error during registration.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = nameValid && pwLength && pwUpper && pwSpecial && email && address.trim().length > 0 && address.length <= 400;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '540px' }}>
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Register as a Normal User on the platform</p>
        </div>

        {error && (
          <div className="alert-banner error">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner success">
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-container">
              <User className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Full Name (Min 20 characters)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
              />
            </div>
            <ul className="validation-helpers">
              <li className={nameValid ? 'valid' : name.length > 0 ? 'error' : 'invalid'}>
                {nameValid ? <Check size={12} /> : <X size={12} />} Name must be 20-60 characters (Current: {name.length})
              </li>
            </ul>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-container">
              <Mail className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Home Address</label>
            <div className="input-container">
              <MapPin className="input-icon" style={{ top: '22px' }} />
              <textarea
                className="form-input form-textarea"
                placeholder="Enter your complete home address (Max 400 characters)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={400}
                required
              />
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {address.length}/400 characters
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn-close"
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <ul className="validation-helpers" style={{ marginTop: '0.5rem' }}>
              <li className={pwLength ? 'valid' : password.length > 0 ? 'error' : 'invalid'}>
                {pwLength ? <Check size={12} /> : <X size={12} />} 8 to 16 characters long
              </li>
              <li className={pwUpper ? 'valid' : password.length > 0 ? 'error' : 'invalid'}>
                {pwUpper ? <Check size={12} /> : <X size={12} />} Contains at least one uppercase letter
              </li>
              <li className={pwSpecial ? 'valid' : password.length > 0 ? 'error' : 'invalid'}>
                {pwSpecial ? <Check size={12} /> : <X size={12} />} Contains at least one special character
              </li>
            </ul>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !isFormValid}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); navigateToLogin(); }}>
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
