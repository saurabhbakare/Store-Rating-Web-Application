import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Users, Store, Star, Search, Plus, Filter, ArrowUpDown, 
  ChevronLeft, ChevronRight, X, Mail, Lock, MapPin, Eye, 
  EyeOff, Check, Shield, User as UserIcon
} from 'lucide-react';

export default function AdminDashboard() {
  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });

  // Tab: 'users' or 'stores'
  const [activeTab, setActiveTab] = useState('users');

  // Listings State
  const [usersList, setUsersList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination & Sorting & Filtering
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sort, setSort] = useState({ sortBy: 'name', order: 'ASC' });

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'addUser', 'addStore', 'viewUser'
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states - Add User
  const [addUserForm, setAddUserForm] = useState({ name: '', email: '', password: '', address: '', role: 'user' });
  const [showAddUserPassword, setShowAddUserPassword] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');

  // Form states - Add Store
  const [addStoreForm, setAddStoreForm] = useState({
    name: '', email: '', address: '',
    ownerName: '', ownerEmail: '', ownerPassword: '', ownerAddress: ''
  });
  const [showAddStorePassword, setShowAddStorePassword] = useState(false);
  const [addStoreLoading, setAddStoreLoading] = useState(false);
  const [addStoreError, setAddStoreError] = useState('');

  // Success notifications
  const [notification, setNotification] = useState('');

  // Password validation checkers
  const [auPwLength, setAuPwLength] = useState(false);
  const [auPwUpper, setAuPwUpper] = useState(false);
  const [auPwSpecial, setAuPwSpecial] = useState(false);
  const [auNameValid, setAuNameValid] = useState(false);

  const [asPwLength, setAsPwLength] = useState(false);
  const [asPwUpper, setAsPwUpper] = useState(false);
  const [asPwSpecial, setAsPwSpecial] = useState(false);
  const [asStoreNameValid, setAsStoreNameValid] = useState(false);
  const [asOwnerNameValid, setAsOwnerNameValid] = useState(false);

  // Run password checkers
  useEffect(() => {
    setAuPwLength(addUserForm.password.length >= 8 && addUserForm.password.length <= 16);
    setAuPwUpper(/[A-Z]/.test(addUserForm.password));
    setAuPwSpecial(/[^A-Za-z0-9\s]/.test(addUserForm.password));
    setAuNameValid(addUserForm.name.trim().length >= 20 && addUserForm.name.trim().length <= 60);
  }, [addUserForm.password, addUserForm.name]);

  useEffect(() => {
    setAsPwLength(addStoreForm.ownerPassword.length >= 8 && addStoreForm.ownerPassword.length <= 16);
    setAsPwUpper(/[A-Z]/.test(addStoreForm.ownerPassword));
    setAsPwSpecial(/[^A-Za-z0-9\s]/.test(addStoreForm.ownerPassword));
    setAsStoreNameValid(addStoreForm.name.trim().length >= 20 && addStoreForm.name.trim().length <= 60);
    setAsOwnerNameValid(addStoreForm.ownerName.trim().length >= 20 && addStoreForm.ownerName.trim().length <= 60);
  }, [addStoreForm.ownerPassword, addStoreForm.name, addStoreForm.ownerName]);

  const loadStats = async () => {
    try {
      const data = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadListings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        name: filters.name,
        email: filters.email,
        address: filters.address,
        sortBy: sort.sortBy,
        order: sort.order,
        page: meta.page,
        limit: meta.limit,
      };

      if (activeTab === 'users') {
        if (filters.role) params.role = filters.role;
        const res = await api.get('/admin/users', params);
        setUsersList(res.data);
        setMeta(res.meta);
      } else {
        const res = await api.get('/admin/stores', params);
        setStoresList(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Error loading records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Reload listings when page, filters, sort, or active tab changes
  useEffect(() => {
    loadListings();
  }, [activeTab, meta.page, sort.sortBy, sort.order]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setMeta(prev => ({ ...prev, page: 1 }));
    loadListings();
  };

  const handleResetFilters = () => {
    setFilters({ name: '', email: '', address: '', role: '' });
    setMeta(prev => ({ ...prev, page: 1 }));
    // Wait for state update is async, so we fetch directly
    setTimeout(() => {
      loadListings();
    }, 50);
  };

  const handleSort = (field) => {
    setSort(prev => {
      const isAsc = prev.sortBy === field && prev.order === 'ASC';
      return {
        sortBy: field,
        order: isAsc ? 'DESC' : 'ASC'
      };
    });
    setMeta(prev => ({ ...prev, page: 1 }));
  };

  // Add User Submission
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setAddUserError('');
    if (!auNameValid) {
      setAddUserError('Name must be 20-60 characters.');
      return;
    }
    if (!auPwLength || !auPwUpper || !auPwSpecial) {
      setAddUserError('Password does not meet the requirements.');
      return;
    }
    if (addUserForm.address.trim().length === 0 || addUserForm.address.length > 400) {
      setAddUserError('Address is required and must not exceed 400 characters.');
      return;
    }

    setAddUserLoading(true);
    try {
      await api.post('/admin/users', addUserForm);
      setNotification('User added successfully!');
      setAddUserForm({ name: '', email: '', password: '', address: '', role: 'user' });
      setActiveModal(null);
      loadStats();
      loadListings();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setAddUserError(err.message || 'Failed to create user.');
    } finally {
      setAddUserLoading(false);
    }
  };

  // Add Store Submission
  const handleAddStoreSubmit = async (e) => {
    e.preventDefault();
    setAddStoreError('');

    if (!asStoreNameValid) {
      setAddStoreError('Store Name must be 20-60 characters.');
      return;
    }
    if (!asOwnerNameValid) {
      setAddStoreError('Owner Name must be 20-60 characters.');
      return;
    }
    if (!asPwLength || !asPwUpper || !asPwSpecial) {
      setAddStoreError('Owner Password does not meet requirements.');
      return;
    }
    if (addStoreForm.address.trim().length === 0 || addStoreForm.address.length > 400) {
      setAddStoreError('Store Address is required.');
      return;
    }
    if (addStoreForm.ownerAddress.trim().length === 0 || addStoreForm.ownerAddress.length > 400) {
      setAddStoreError('Owner Address is required.');
      return;
    }

    setAddStoreLoading(true);
    try {
      await api.post('/admin/stores', addStoreForm);
      setNotification('Store and Owner created successfully!');
      setAddStoreForm({
        name: '', email: '', address: '',
        ownerName: '', ownerEmail: '', ownerPassword: '', ownerAddress: ''
      });
      setActiveModal(null);
      loadStats();
      loadListings();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setAddStoreError(err.message || 'Failed to create store.');
    } finally {
      setAddStoreLoading(false);
    }
  };

  const openUserDetails = (userObj) => {
    setSelectedUser(userObj);
    setActiveModal('viewUser');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setMeta(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="dashboard-container">
      {/* Notifications */}
      {notification && (
        <div className="alert-banner success" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, width: 'auto', minWidth: '300px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>System Administrator</h1>
          <p>Manage and monitor stores, system ratings, and platform users.</p>
        </div>
        <div className="header-actions">
          <button className="btn-action" onClick={() => setActiveModal('addUser')}>
            <Plus size={18} /> Add User
          </button>
          <button className="btn-action" onClick={() => setActiveModal('addStore')} style={{ borderColor: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)' }}>
            <Plus size={18} /> Add Store
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Users</h3>
            <div className="metric-value">{stats.totalUsers}</div>
          </div>
          <div className="metric-icon">
            <Users size={24} />
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Stores</h3>
            <div className="metric-value">{stats.totalStores}</div>
          </div>
          <div className="metric-icon">
            <Store size={24} />
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-info">
            <h3>Submitted Ratings</h3>
            <div className="metric-value">{stats.totalRatings}</div>
          </div>
          <div className="metric-icon">
            <Star size={24} />
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="filter-group">
          <span className="form-label">Search Name</span>
          <input
            type="text"
            className="filter-input"
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <span className="form-label">Search Email</span>
          <input
            type="text"
            className="filter-input"
            placeholder="Search by email..."
            value={filters.email}
            onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <span className="form-label">Search Address</span>
          <input
            type="text"
            className="filter-input"
            placeholder="Search by address..."
            value={filters.address}
            onChange={(e) => setFilters(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>
        {activeTab === 'users' && (
          <div className="filter-group">
            <span className="form-label">Filter Role</span>
            <select
              className="filter-input filter-select"
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="user">Normal User</option>
              <option value="store_owner">Store Owner</option>
            </select>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
            <Search size={16} /> Filter
          </button>
          <button type="button" className="btn-cancel" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }} onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </form>

      {/* Dashboard Listings Panel */}
      <div className="dashboard-panel">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className={`table-btn ${activeTab === 'users' ? 'active' : ''}`}
              style={{
                background: activeTab === 'users' ? 'var(--accent-purple)' : 'transparent',
                color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--card-border)',
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
              onClick={() => { setActiveTab('users'); setMeta(prev => ({ ...prev, page: 1 })); }}
            >
              System Users
            </button>
            <button
              className={`table-btn ${activeTab === 'stores' ? 'active' : ''}`}
              style={{
                background: activeTab === 'stores' ? 'var(--accent-cyan)' : 'transparent',
                color: activeTab === 'stores' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--card-border)',
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
              onClick={() => { setActiveTab('stores'); setMeta(prev => ({ ...prev, page: 1 })); }}
            >
              Registered Stores
            </button>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} - {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} records
          </span>
        </div>

        {error && <div className="alert-banner error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading records...</div>
        ) : activeTab === 'users' ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    <div className="th-content">Name <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSort('email')}>
                    <div className="th-content">Email <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSort('address')}>
                    <div className="th-content">Address <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSort('role')}>
                    <div className="th-content">Role <ArrowUpDown size={14} /></div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No users found matching current filters.</td>
                  </tr>
                ) : (
                  usersList.map((usr) => (
                    <tr key={usr.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{usr.name}</td>
                      <td>{usr.email}</td>
                      <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usr.address}</td>
                      <td>
                        <span className={`badge ${usr.role}`}>
                          {usr.role === 'admin' ? 'Admin' : usr.role === 'store_owner' ? 'Owner' : 'User'}
                        </span>
                      </td>
                      <td>
                        <button className="table-btn" onClick={() => openUserDetails(usr)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    <div className="th-content">Store Name <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSort('email')}>
                    <div className="th-content">Store Email <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSort('address')}>
                    <div className="th-content">Store Address <ArrowUpDown size={14} /></div>
                  </th>
                  <th onClick={() => handleSort('overall_rating')}>
                    <div className="th-content">Overall Rating <ArrowUpDown size={14} /></div>
                  </th>
                  <th>Owner Name</th>
                </tr>
              </thead>
              <tbody>
                {storesList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No stores found matching current filters.</td>
                  </tr>
                ) : (
                  storesList.map((store) => (
                    <tr key={store.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{store.name}</td>
                      <td>{store.email}</td>
                      <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.address}</td>
                      <td style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={16} fill={parseFloat(store.overall_rating) > 0 ? "currentColor" : "none"} />
                          {parseFloat(store.overall_rating).toFixed(1)}
                        </div>
                      </td>
                      <td>{store.owner_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">Page {meta.page} of {meta.totalPages}</span>
            <div className="pagination-buttons">
              <button className="btn-page" onClick={() => handlePageChange(meta.page - 1)} disabled={meta.page === 1}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: meta.totalPages }, (_, idx) => idx + 1).map((p) => (
                <button
                  key={p}
                  className={`btn-page ${meta.page === p ? 'active' : ''}`}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              ))}
              <button className="btn-page" onClick={() => handlePageChange(meta.page + 1)} disabled={meta.page === meta.totalPages}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add User */}
      {activeModal === 'addUser' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="btn-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddUserSubmit}>
              <div className="modal-body">
                {addUserError && <div className="alert-banner error">{addUserError}</div>}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-container">
                    <UserIcon className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Name (Min 20 characters)"
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm(prev => ({ ...prev, name: e.target.value }))}
                      maxLength={60}
                      required
                    />
                  </div>
                  <ul className="validation-helpers">
                    <li className={auNameValid ? 'valid' : addUserForm.name.length > 0 ? 'error' : 'invalid'}>
                      {auNameValid ? <Check size={12} /> : <X size={12} />} Name must be 20-60 characters (Current: {addUserForm.name.length})
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
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
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
                      placeholder="Full Address (Max 400 characters)"
                      value={addUserForm.address}
                      onChange={(e) => setAddUserForm(prev => ({ ...prev, address: e.target.value }))}
                      maxLength={400}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-container">
                    <Lock className="input-icon" />
                    <input
                      type={showAddUserPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter password"
                      value={addUserForm.password}
                      onChange={(e) => setAddUserForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="btn-close"
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                      onClick={() => setShowAddUserPassword(!showAddUserPassword)}
                    >
                      {showAddUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ul className="validation-helpers" style={{ marginTop: '0.5rem' }}>
                    <li className={auPwLength ? 'valid' : addUserForm.password.length > 0 ? 'error' : 'invalid'}>
                      {auPwLength ? <Check size={12} /> : <X size={12} />} 8 to 16 characters long
                    </li>
                    <li className={auPwUpper ? 'valid' : addUserForm.password.length > 0 ? 'error' : 'invalid'}>
                      {auPwUpper ? <Check size={12} /> : <X size={12} />} At least one uppercase letter
                    </li>
                    <li className={auPwSpecial ? 'valid' : addUserForm.password.length > 0 ? 'error' : 'invalid'}>
                      {auPwSpecial ? <Check size={12} /> : <X size={12} />} At least one special character
                    </li>
                  </ul>
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input filter-select"
                    style={{ paddingLeft: '1rem' }}
                    value={addUserForm.role}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="user">Normal User</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={addUserLoading || !auNameValid || !auPwLength || !auPwUpper || !auPwSpecial}>
                  {addUserLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Store */}
      {activeModal === 'addStore' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>Add New Store & Owner</h2>
              <button className="btn-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStoreSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {addStoreError && <div className="alert-banner error" style={{ gridColumn: 'span 2' }}>{addStoreError}</div>}

                {/* Left side: Store Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(139,92,246,0.15)', paddingBottom: '0.4rem', color: 'var(--accent-cyan)' }}>Store Information</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Store Name</label>
                    <div className="input-container">
                      <Store className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Store Name (Min 20 chars)"
                        value={addStoreForm.name}
                        onChange={(e) => setAddStoreForm(prev => ({ ...prev, name: e.target.value }))}
                        maxLength={60}
                        required
                      />
                    </div>
                    <ul className="validation-helpers">
                      <li className={asStoreNameValid ? 'valid' : addStoreForm.name.length > 0 ? 'error' : 'invalid'}>
                        {asStoreNameValid ? <Check size={10} /> : <X size={10} />} Min 20 chars (Current: {addStoreForm.name.length})
                      </li>
                    </ul>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Email</label>
                    <div className="input-container">
                      <Mail className="input-icon" />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="store@storerating.com"
                        value={addStoreForm.email}
                        onChange={(e) => setAddStoreForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Address</label>
                    <div className="input-container">
                      <MapPin className="input-icon" style={{ top: '22px' }} />
                      <textarea
                        className="form-input form-textarea"
                        placeholder="Store Location Address"
                        value={addStoreForm.address}
                        onChange={(e) => setAddStoreForm(prev => ({ ...prev, address: e.target.value }))}
                        maxLength={400}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Right side: Owner Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(139,92,246,0.15)', paddingBottom: '0.4rem', color: 'var(--accent-purple)' }}>Owner Account Details</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Owner Name</label>
                    <div className="input-container">
                      <UserIcon className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Full Name (Min 20 chars)"
                        value={addStoreForm.ownerName}
                        onChange={(e) => setAddStoreForm(prev => ({ ...prev, ownerName: e.target.value }))}
                        maxLength={60}
                        required
                      />
                    </div>
                    <ul className="validation-helpers">
                      <li className={asOwnerNameValid ? 'valid' : addStoreForm.ownerName.length > 0 ? 'error' : 'invalid'}>
                        {asOwnerNameValid ? <Check size={10} /> : <X size={10} />} Min 20 chars (Current: {addStoreForm.ownerName.length})
                      </li>
                    </ul>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Owner Email</label>
                    <div className="input-container">
                      <Mail className="input-icon" />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="owner@example.com"
                        value={addStoreForm.ownerEmail}
                        onChange={(e) => setAddStoreForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Owner Address</label>
                    <div className="input-container">
                      <MapPin className="input-icon" style={{ top: '22px' }} />
                      <textarea
                        className="form-input form-textarea"
                        placeholder="Owner Home Address"
                        value={addStoreForm.ownerAddress}
                        onChange={(e) => setAddStoreForm(prev => ({ ...prev, ownerAddress: e.target.value }))}
                        maxLength={400}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Owner Password</label>
                    <div className="input-container">
                      <Lock className="input-icon" />
                      <input
                        type={showAddStorePassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Set Owner password"
                        value={addStoreForm.ownerPassword}
                        onChange={(e) => setAddStoreForm(prev => ({ ...prev, ownerPassword: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        className="btn-close"
                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                        onClick={() => setShowAddStorePassword(!showAddStorePassword)}
                      >
                        {showAddStorePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <ul className="validation-helpers">
                      <li className={asPwLength ? 'valid' : addStoreForm.ownerPassword.length > 0 ? 'error' : 'invalid'}>
                        {asPwLength ? <Check size={10} /> : <X size={10} />} 8-16 chars
                      </li>
                      <li className={asPwUpper ? 'valid' : addStoreForm.ownerPassword.length > 0 ? 'error' : 'invalid'}>
                        {asPwUpper ? <Check size={10} /> : <X size={10} />} 1 Uppercase
                      </li>
                      <li className={asPwSpecial ? 'valid' : addStoreForm.ownerPassword.length > 0 ? 'error' : 'invalid'}>
                        {asPwSpecial ? <Check size={10} /> : <X size={10} />} 1 Special
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0891b2 100%)', boxShadow: '0 4px 15px rgba(6,182,212,0.3)' }} disabled={addStoreLoading || !asStoreNameValid || !asOwnerNameValid || !asPwLength || !asPwUpper || !asPwSpecial}>
                  {addStoreLoading ? 'Creating...' : 'Register Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View User Details */}
      {activeModal === 'viewUser' && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>User Details Profile</h2>
              <button className="btn-close" onClick={() => { setActiveModal(null); setSelectedUser(null); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="info-item">
                  <div className="info-label">Full Name</div>
                  <div className="info-val">{selectedUser.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">User Email</div>
                  <div className="info-val">{selectedUser.email}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Access Role</div>
                  <div className="info-val" style={{ textTransform: 'capitalize' }}>
                    <span className={`badge ${selectedUser.role}`}>{selectedUser.role}</span>
                  </div>
                </div>
                <div className="info-item detail-span-full">
                  <div className="info-label">Home Address</div>
                  <div className="info-val" style={{ whiteSpace: 'pre-wrap' }}>{selectedUser.address}</div>
                </div>

                {/* If the user is a Store Owner, display Store Rating and details */}
                {selectedUser.role === 'store_owner' && (
                  <div className="detail-span-full" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Store size={16} /> Store Ownership Details
                    </h3>
                    {selectedUser.store_id ? (
                      <div className="detail-grid">
                        <div className="info-item">
                          <div className="info-label">Store Name</div>
                          <div className="info-val" style={{ color: '#fff' }}>{selectedUser.store_name}</div>
                        </div>
                        <div className="info-item">
                          <div className="info-label">Store Email</div>
                          <div className="info-val">{selectedUser.store_email}</div>
                        </div>
                        <div className="info-item">
                          <div className="info-label">Store Overall Rating</div>
                          <div className="info-val" style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
                            <Star size={16} fill={parseFloat(selectedUser.store_rating) > 0 ? "currentColor" : "none"} />
                            {selectedUser.store_rating ? parseFloat(selectedUser.store_rating).toFixed(1) : '0.0'} / 5.0
                          </div>
                        </div>
                        <div className="info-item detail-span-full">
                          <div className="info-label">Store Address</div>
                          <div className="info-val">{selectedUser.store_address}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No store is currently associated with this owner.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { setActiveModal(null); setSelectedUser(null); }}>Close Panel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
