import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  Store, MapPin, Star, Search, ArrowUpDown, ChevronLeft, 
  ChevronRight, Key, Shield, User as UserIcon, X, Check, Lock
} from 'lucide-react';

export default function UserDashboard() {
  const { user, syncUser } = useAuth();

  // Stores data state
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search, Pagination, Sort
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [sort, setSort] = useState({ sortBy: 'name', order: 'ASC' });
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });

  // Rating Modal state
  const [ratingModal, setRatingModal] = useState({ open: false, store: null, rating: 0, hoverRating: 0 });
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState('');

  // Password update state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Password checkers
  const [pwLength, setPwLength] = useState(false);
  const [pwUpper, setPwUpper] = useState(false);
  const [pwSpecial, setPwSpecial] = useState(false);

  // Notification bubble
  const [notification, setNotification] = useState('');

  useEffect(() => {
    setPwLength(passwordForm.newPassword.length >= 8 && passwordForm.newPassword.length <= 16);
    setPwUpper(/[A-Z]/.test(passwordForm.newPassword));
    setPwSpecial(/[^A-Za-z0-9\s]/.test(passwordForm.newPassword));
  }, [passwordForm.newPassword]);

  const loadStores = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/stores/user/stores', {
        name: filters.name,
        address: filters.address,
        sortBy: sort.sortBy,
        order: sort.order,
        page: meta.page,
        limit: meta.limit,
      });
      setStores(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Error loading store directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, [meta.page, sort.sortBy, sort.order]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setMeta(prev => ({ ...prev, page: 1 }));
    loadStores();
  };

  const handleResetFilters = () => {
    setFilters({ name: '', address: '' });
    setMeta(prev => ({ ...prev, page: 1 }));
    setTimeout(() => {
      loadStores();
    }, 50);
  };

  const handleSortChange = (field) => {
    setSort(prev => {
      const isAsc = prev.sortBy === field && prev.order === 'ASC';
      return {
        sortBy: field,
        order: isAsc ? 'DESC' : 'ASC',
      };
    });
    setMeta(prev => ({ ...prev, page: 1 }));
  };

  // Open rating submission modal
  const openRateModal = (storeObj) => {
    setRatingModal({
      open: true,
      store: storeObj,
      rating: storeObj.user_rating || 0,
      hoverRating: 0
    });
    setRatingError('');
  };

  // Submit/Modify rating
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (ratingModal.rating < 1 || ratingModal.rating > 5) {
      setRatingError('Please select a rating between 1 and 5 stars.');
      return;
    }

    setRatingLoading(true);
    setRatingError('');

    try {
      await api.post(`/stores/${ratingModal.store.id}/rate`, { rating: ratingModal.rating });
      setNotification(`Successfully rated "${ratingModal.store.name}"!`);
      setRatingModal({ open: false, store: null, rating: 0, hoverRating: 0 });
      loadStores();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setRatingError(err.message || 'Failed to submit rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  // Update Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (!pwLength || !pwUpper || !pwSpecial) {
      setPasswordError('New password does not meet the requirements.');
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

  return (
    <div className="dashboard-container">
      {/* Toast Alert */}
      {notification && (
        <div className="alert-banner success" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, width: 'auto', minWidth: '300px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Welcome, {user ? user.name.split(' ')[0] : 'User'}</h1>
          <p>Find registered stores and submit ratings ranging from 1 to 5 stars.</p>
        </div>
      </div>

      {/* Profile Section + Password Update Split */}
      <div className="profile-section" style={{ marginBottom: '2rem' }}>
        {/* User Card */}
        <div className="user-info-panel">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(139, 92, 246, 0.15)', paddingBottom: '0.5rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserIcon size={18} /> My Account Profile
          </h3>
          <div className="info-item">
            <div className="info-label">Full Name</div>
            <div className="info-val">{user?.name}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Email Address</div>
            <div className="info-val">{user?.email}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Delivery Address</div>
            <div className="info-val">{user?.address}</div>
          </div>
        </div>

        {/* Change Password Panel */}
        <div className="user-info-panel" style={{ background: 'rgba(18, 16, 38, 0.4)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(139, 92, 246, 0.15)', paddingBottom: '0.5rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={18} /> Change Account Password
          </h3>
          
          {passwordError && <div className="alert-banner error">{passwordError}</div>}
          {passwordSuccess && <div className="alert-banner success">{passwordSuccess}</div>}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
                  placeholder="Min 8 chars"
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

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.5rem' }} disabled={passwordLoading || !pwLength || !pwUpper || !pwSpecial || passwordForm.newPassword !== passwordForm.confirmPassword}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Search Bar */}
      <div className="dashboard-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="filter-group">
            <label className="form-label">Store Name</label>
            <div className="input-container">
              <Store className="input-icon" size={16} style={{ top: '50%' }} />
              <input
                type="text"
                className="filter-input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Search by store name..."
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="form-label">Store Location Address</label>
            <div className="input-container">
              <MapPin className="input-icon" size={16} style={{ top: '50%' }} />
              <input
                type="text"
                className="filter-input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Search by address or city..."
                value={filters.address}
                onChange={(e) => setFilters(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
              <Search size={16} /> Search
            </button>
            <button type="button" className="btn-cancel" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }} onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Sorting bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Registered Stores Directory</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort by:</span>
          <button className="table-btn" onClick={() => handleSortChange('name')} style={{ borderColor: sort.sortBy === 'name' ? 'var(--accent-purple)' : 'var(--card-border)' }}>
            Name {sort.sortBy === 'name' && (sort.order === 'ASC' ? '▲' : '▼')}
          </button>
          <button className="table-btn" onClick={() => handleSortChange('address')} style={{ borderColor: sort.sortBy === 'address' ? 'var(--accent-purple)' : 'var(--card-border)' }}>
            Address {sort.sortBy === 'address' && (sort.order === 'ASC' ? '▲' : '▼')}
          </button>
          <button className="table-btn" onClick={() => handleSortChange('overall_rating')} style={{ borderColor: sort.sortBy === 'overall_rating' ? 'var(--accent-purple)' : 'var(--card-border)' }}>
            Overall Rating {sort.sortBy === 'overall_rating' && (sort.order === 'ASC' ? '▲' : '▼')}
          </button>
          <button className="table-btn" onClick={() => handleSortChange('user_rating')} style={{ borderColor: sort.sortBy === 'user_rating' ? 'var(--accent-purple)' : 'var(--card-border)' }}>
            My Rating {sort.sortBy === 'user_rating' && (sort.order === 'ASC' ? '▲' : '▼')}
          </button>
        </div>
      </div>

      {/* Stores Cards Grid */}
      {error && <div className="alert-banner error">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Loading store list...</div>
      ) : stores.length === 0 ? (
        <div className="dashboard-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No stores found matching your search criteria.
        </div>
      ) : (
        <>
          <div className="stores-grid">
            {stores.map((store) => (
              <div className="store-card" key={store.id}>
                <div className="store-header">
                  <div className="store-card-name">{store.name}</div>
                  <div className="store-card-address">
                    <MapPin size={14} style={{ color: 'var(--accent-purple)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{store.address}</span>
                  </div>
                </div>

                <div className="store-rating-summary">
                  <div className="rating-indicator">
                    <span className="rating-label">Overall Rating</span>
                    <span className="rating-val-display overall">
                      <Star size={16} fill={store.overall_rating > 0 ? "currentColor" : "none"} />
                      {store.overall_rating > 0 ? parseFloat(store.overall_rating).toFixed(1) : 'No Ratings'}
                    </span>
                  </div>

                  <div className="rating-indicator" style={{ borderLeft: '1px solid rgba(139, 92, 246, 0.15)', paddingLeft: '1.5rem' }}>
                    <span className="rating-label">My Rating</span>
                    <span className="rating-val-display user-submitted">
                      <Star size={16} fill={store.user_rating > 0 ? "currentColor" : "none"} />
                      {store.user_rating > 0 ? `${store.user_rating} / 5` : 'Not Rated'}
                    </span>
                  </div>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ 
                    background: store.user_rating > 0 ? 'rgba(139, 92, 246, 0.15)' : 'linear-gradient(135deg, var(--accent-purple) 0%, #7c3aed 100%)',
                    border: store.user_rating > 0 ? '1px solid var(--accent-purple)' : 'none',
                    color: store.user_rating > 0 ? 'var(--text-primary)' : '#fff',
                    boxShadow: store.user_rating > 0 ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.3)'
                  }} 
                  onClick={() => openRateModal(store)}
                >
                  <Star size={16} fill={store.user_rating > 0 ? "currentColor" : "none"} />
                  {store.user_rating > 0 ? 'Modify My Rating' : 'Submit Rating'}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="pagination" style={{ justifyContent: 'center' }}>
              <div className="pagination-buttons">
                <button className="btn-page" onClick={() => setMeta(prev => ({ ...prev, page: prev.page - 1 }))} disabled={meta.page === 1}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: meta.totalPages }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    className={`btn-page ${meta.page === p ? 'active' : ''}`}
                    onClick={() => setMeta(prev => ({ ...prev, page: p }))}
                  >
                    {p}
                  </button>
                ))}
                <button className="btn-page" onClick={() => setMeta(prev => ({ ...prev, page: prev.page + 1 }))} disabled={meta.page === meta.totalPages}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* RATINGS SUBMISSION MODAL */}
      {ratingModal.open && ratingModal.store && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2>Rate Store</h2>
              <button className="btn-close" onClick={() => setRatingModal({ open: false, store: null, rating: 0, hoverRating: 0 })}><X size={20} /></button>
            </div>
            <form onSubmit={handleRatingSubmit}>
              <div className="modal-body" style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{ratingModal.store.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Select a rating from 1 to 5 stars</p>

                {ratingError && <div className="alert-banner error" style={{ marginTop: '1rem' }}>{ratingError}</div>}

                <div className="star-rating-picker">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = ratingModal.hoverRating ? star <= ratingModal.hoverRating : star <= ratingModal.rating;
                    return (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn interactive ${isActive ? 'active' : ''}`}
                        onClick={() => setRatingModal(prev => ({ ...prev, rating: star }))}
                        onMouseEnter={() => setRatingModal(prev => ({ ...prev, hoverRating: star }))}
                        onMouseLeave={() => setRatingModal(prev => ({ ...prev, hoverRating: 0 }))}
                      >
                        <Star size={42} fill={isActive ? "currentColor" : "none"} strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-gold)', minHeight: '1.5rem' }}>
                  {ratingModal.rating === 1 && '1.0 - Terribly Poor'}
                  {ratingModal.rating === 2 && '2.0 - Below Average'}
                  {ratingModal.rating === 3 && '3.0 - Good / Average'}
                  {ratingModal.rating === 4 && '4.0 - Very Good'}
                  {ratingModal.rating === 5 && '5.0 - Absolutely Excellent!'}
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'center' }}>
                <button type="button" className="btn-cancel" onClick={() => setRatingModal({ open: false, store: null, rating: 0, hoverRating: 0 })}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={ratingLoading || ratingModal.rating === 0}>
                  {ratingLoading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
