import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AddManagerContact.css';

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
          <h2 className="admin-form-title">👤 Account Manager Management</h2>
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
          <div className="admin-status-alert" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
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

          <div className="admin-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
            <label className="admin-form-label" style={{ marginBottom: 0 }}>Status:</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
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
              {loading ? 'Saving...' : editingId ? '✏️ Update Manager' : '➕ Create Manager'}
            </button>
          </div>
        </form>

        {/* ─── Assign Section ─── */}
        <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Account Managers ({managers.length})</h3>
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="admin-btn-submit"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              {showAssign ? 'Hide Assign' : '🔗 Assign to Employer'}
            </button>
          </div>

          {showAssign && (
            <form onSubmit={handleAssign} style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <input
                  type="number"
                  placeholder="Employer ID *"
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                    />
                    Primary Contact
                  </label>
                  <button type="submit" className="admin-btn-submit" style={{ padding: '10px 24px' }} disabled={loading}>
                    Assign
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ─── Manager List ─── */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {managers.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                No account managers created yet. Create one above!
              </p>
            ) : (
              managers.map(manager => (
                <div key={manager.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: manager.is_active ? '#f8fafc' : '#fef2f2',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${manager.is_active ? '#10b981' : '#ef4444'}`,
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div>
                    <strong>{manager.full_name}</strong>
                    <span style={{ color: '#64748b', marginLeft: '12px' }}>{manager.email}</span>
                    <span style={{
                      marginLeft: '12px',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8'
                    }}>
                      {manager.department_display}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '12px' }}>
                      👥 {manager.assigned_employers_count || 0}
                    </span>
                    {!manager.is_active && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626'
                      }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(manager)} className="admin-btn-cancel" style={{ padding: '4px 12px', fontSize: '12px' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(manager.id)} className="admin-btn-cancel" style={{ padding: '4px 12px', fontSize: '12px', color: '#dc2626' }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ─── Assignments List ─── */}
          {assignments.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '14px', color: '#64748b' }}>📋 Recent Assignments</h4>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {assignments.slice(0, 10).map(assignment => (
                  <div key={assignment.employer_id} style={{
                    fontSize: '13px',
                    color: '#475569',
                    padding: '6px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                  }}>
                    <span>{assignment.employer_name}</span>
                    <span>
                      {assignment.assigned_managers.map((m, idx) => (
                        <span key={m.id} style={{ marginLeft: '8px' }}>
                          {m.name} {m.is_primary && '⭐'}
                          {idx < assignment.assigned_managers.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};