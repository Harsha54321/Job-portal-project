import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AddManagerContact.css';
import DeleteIcon from '../assets/Billing/Delete_icon.png';
import ProfileIcon from "../assets/icon_profile.png";

export const AddManagerContact = () => {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [managers, setManagers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'general',
    title: 'Account Manager',
    description: '',
    is_active: true,
    order: 0
  });

  const departmentOptions = [
    { value: 'support', label: 'Support' },
    { value: 'sales', label: 'Sales' },
    { value: 'billing', label: 'Billing' },
    { value: 'technical', label: 'Technical' },
    { value: 'general', label: 'General' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [managersRes, assignmentsRes] = await Promise.all([
        api.get('/admin/account-managers/'),
        api.get('/admin/employer-assignments/')
      ]);
      setManagers(managersRes.data);
      setAssignments(assignmentsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (editingId) {
        await api.put(`/admin/account-managers/${editingId}/`, formData);
      } else {
        await api.post('/admin/account-managers/', formData);
      }
      await fetchData();
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        department: 'general',
        title: 'Account Manager',
        description: '',
        is_active: true,
        order: 0
      });
      setEditingId(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (manager) => {
    setFormData({
      full_name: manager.full_name,
      email: manager.email,
      phone: manager.phone,
      department: manager.department,
      title: manager.title || 'Account Manager',
      description: manager.description || '',
      is_active: manager.is_active,
      order: manager.order || 0
    });
    setEditingId(manager.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account manager?')) return;
    try {
      await api.delete(`/admin/account-managers/${id}/`);
      await fetchData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/admin/assign-account-manager/', {
        employer_id: parseInt(selectedEmployer),
        account_manager_id: parseInt(selectedManager),
        is_primary: isPrimary
      });
      await fetchData();
      setSelectedEmployer('');
      setSelectedManager('');
      setIsPrimary(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-portal-container">
      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2 className="admin-form-title">
            <img src={ProfileIcon} alt="Profile" className="admin-title-icon" />
            Account Manager Management
          </h2>
          <p className="admin-form-subtitle">
            Create account managers, assign them to employers, and manage contacts
          </p>
        </div>

        {success && (
          <div className="admin-status-alert admin-alert-success">
            <span className="admin-status-dot admin-animate-pulse"></span>
            <span>{editingId ? 'Manager updated successfully!' : 'Operation completed successfully!'}</span>
          </div>
        )}

        {error && (
          <div className="admin-status-alert admin-alert-danger">
            <span>❌ {error}</span>
          </div>
        )}

        {/* ─── Create/Edit Form ─── */}
        <form onSubmit={handleSubmit} className="admin-portal-form">
          <div className="admin-form-row">
            <div className="admin-form-group admin-col-6">
              <label className="admin-form-label">Full Name *</label>
              <input
                type="text"
                name="full_name"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={handleChange}
                className="admin-form-input"
                required
              />
            </div>
            <div className="admin-form-group admin-col-6">
              <label className="admin-form-label">Email *</label>
              <input
                type="email"
                name="email"
                placeholder="manager@jobportal.com"
                value={formData.email}
                onChange={handleChange}
                className="admin-form-input"
                required
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group admin-col-6">
              <label className="admin-form-label">Phone *</label>
              <input
                type="text"
                name="phone"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
                className="admin-form-input"
                required
              />
            </div>
            <div className="admin-form-group admin-col-6">
              <label className="admin-form-label">Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="admin-form-input"
                required
              >
                {departmentOptions.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Title</label>
            <input
              type="text"
              name="title"
              placeholder="Senior Account Manager"
              value={formData.title}
              onChange={handleChange}
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description / Bio</label>
            <textarea
              name="description"
              placeholder="Brief description about the manager..."
              value={formData.description}
              onChange={handleChange}
              className="admin-form-textarea"
              rows="3"
            />
          </div>

          <div className="admin-toggle-row">
            <label className="admin-form-label">Status:</label>
            <label className="admin-clickable-checkbox">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Active
            </label>
          </div>

          <div className="admin-form-actions">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    department: 'general',
                    title: 'Account Manager',
                    description: '',
                    is_active: true,
                    order: 0
                  });
                }}
                className="admin-btn-cancel"
              >
                Cancel Edit
              </button>
            )}
            <button type="submit" className="admin-btn-submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? ' Update Manager' : '+ Create Manager'}
            </button>
          </div>
        </form>

        {/* ─── Assign Section ─── */}
        <div className="admin-assignment-container">
          <div className="admin-assignment-top-row">
            <h3 className="admin-list-title">Account Managers ({managers.length})</h3>
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="admin-btn-submit admin-btn-assign-toggle"
            >
              {showAssign ? 'Hide Assign' : 'Assign to Employer'}
            </button>
          </div>

          {showAssign && (
            <form onSubmit={handleAssign} className="admin-assignment-panel">
              <div className="admin-assignment-inputs-grid">
                <input
                  type="number"
                  placeholder="Employer ID *"
                  title="open user management page to get employer id"
                  value={selectedEmployer}
                  onChange={(e) => setSelectedEmployer(e.target.value)}
                  className="admin-form-input"
                  required
                />
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="admin-form-input"
                  required
                >
                  <option value="">Select Manager *</option>
                  {managers.filter(m => m.is_active).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} - {m.department_display}
                    </option>
                  ))}
                </select>
                <div className="admin-assignment-inline-actions">
                  <label className="admin-clickable-checkbox">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                    />
                    Primary Contact
                  </label>
                  <button type="submit" className="admin-btn-submit" disabled={loading}>
                    Assign
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ─── Manager Card List Display ─── */}
          <div className="admin-managers-card-list">
            {managers.length === 0 ? (
              <p className="admin-no-data-placeholder">
                No account managers created yet. Create one above!
              </p>
            ) : (
              managers.map(manager => (
                <div 
                  key={manager.id} 
                  className={`admin-manager-item-card ${manager.is_active ? 'status-active' : 'status-inactive'}`}
                >
                  <div className="admin-manager-meta-group">
                    <strong className="admin-manager-display-name">{manager.full_name}</strong>
                    <span className="admin-email-text-label">{manager.email}</span>
                    
                    <span className="admin-tag-badge-department">
                      {manager.department_display}
                    </span>
                    
                    <div className="admin-manager-count-inline">
                      <img src={ProfileIcon} alt="Assigned Target Count" className="admin-inline-user-icon" title='users assigned count' />
                      <span className="admin-count-numerical-text">{manager.assigned_employers_count || 0}</span>
                    </div>

                    {!manager.is_active && (
                      <span className="admin-tag-badge-inactive">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="admin-row-action-buttons">
                    <button onClick={() => handleEdit(manager)} className="admin-btn-edit-row">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(manager.id)} className="admin-btn-remove-row">
                      <img src={DeleteIcon} alt="Delete" title='Remove' />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};