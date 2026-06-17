import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Store, Star, Mail, MapPin, Key, Lock, ArrowUpDown, Check, X, Users, Calendar
} from 'lucide-react';

export default function StoreOwnerDashboard() {
  const [store, setStore] = useState(null);
  const [raters, setRaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sorting
  const [sort, setSort] = useState({ sortBy: 'name', order: 'ASC' });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Password checkers
  const [pwLength, setPwLength] = useState(false);
  const [pwUpper, setPwUpper] = useState(false);
  const [pwSpecial, setPwSpecial] = useState(false);

  useEffect(() => {
    setPwLength(passwordForm.newPassword.length >= 8 && passwordForm.newPassword.length <= 16);
    setPwUpper(/[A-Z]/.test(passwordForm.newPassword));
    setPwSpecial(/[^A-Za-z0-9\s]/.test(passwordForm.newPassword));
  }, [passwordForm.newPassword]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/stores/owner/dashboard', {
        sortBy: sort.sortBy,
        order: sort.order
      });
      setStore(data.store);
      setRaters(data.raters);
    } catch (err) {
      setError(err.message || 'Error loading owner dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [sort.sortBy, sort.order]);

  const handleSortChange = (field) => {
    setSort(prev => {
      const isAsc = prev.sortBy === field && prev.order === 'ASC';
      return {
        sortBy: field,
        order: isAsc ? 'DESC' : 'ASC'
      };
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (!pwLength || !pwUpper || !pwSpecial) {
      setPasswordError('Password does not meet the requirements.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/update-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading && !store) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Loading store dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header / Store Profile */}
      {store && (
        <div className="owner-card">
          <div className="owner-info">
            <h2>{store.name}</h2>
            <p><Mail size={16} /> {store.email}</p>
            <p><MapPin size={16} /> {store.address}</p>
          </div>
          <div className="owner-rating-box">
            <div className="owner-rating-title">Store Rating</div>
            <div className="owner-rating-val">{store.averageRating}</div>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={18} 
                  fill={star <= Math.round(store.averageRating) ? "currentColor" : "none"} 
                />
              ))}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Based on {store.totalRatings} user reviews</div>
          </div>
        </div>
      )}

      {error && <div className="alert-banner error">{error}</div>}

      <div className="profile-section">
        {/* Raters Table Panel */}
        <div className="dashboard-panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <h2><Users size={20} style={{ color: 'var(--accent-purple)' }} /> Customer Ratings & Reviews</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{raters.length} Feedbacks total</span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th onClick={() => handleSortChange('name')}>
                    <div className="th-content">Customer Name <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSortChange('email')}>
                    <div className="th-content">Customer Email <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSortChange('rating')}>
                    <div className="th-content">Rating Score <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSortChange('created_at')}>
                    <div className="th-content">Submitted Date <ArrowUpDown size={14} /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {raters.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>No user ratings have been submitted for your store yet.</td>
                  </tr>
                ) : (
                  raters.map((rater) => (
                    <tr key={rater.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{rater.name}</td>
                      <td>{rater.email}</td>
                      <td style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={16} fill="currentColor" />
                          {rater.rating} / 5
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {new Date(rater.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Change Password Panel */}
        <div className="user-info-panel" style={{ background: 'rgba(18, 16, 38, 0.4)', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(139, 92, 246, 0.15)', paddingBottom: '0.5rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={18} /> Update Login Password
          </h3>

          {passwordError && <div className="alert-banner error">{passwordError}</div>}
          {passwordSuccess && <div className="alert-banner success">{passwordSuccess}</div>}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="input-container">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-container">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Choose new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <ul className="validation-helpers">
                <li className={pwLength ? 'valid' : passwordForm.newPassword.length > 0 ? 'error' : 'invalid'}>
                  {pwLength ? <Check size={10} /> : <X size={10} />} 8-16 chars
                </li>
                <li className={pwUpper ? 'valid' : passwordForm.newPassword.length > 0 ? 'error' : 'invalid'}>
                  {pwUpper ? <Check size={10} /> : <X size={10} />} 1 Uppercase
                </li>
                <li className={pwSpecial ? 'valid' : passwordForm.newPassword.length > 0 ? 'error' : 'invalid'}>
                  {pwSpecial ? <Check size={10} /> : <X size={10} />} 1 Special
                </li>
              </ul>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-container">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={passwordLoading || !pwLength || !pwUpper || !pwSpecial || passwordForm.newPassword !== passwordForm.confirmPassword}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
