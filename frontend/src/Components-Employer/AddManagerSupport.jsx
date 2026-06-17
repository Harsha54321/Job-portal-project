import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './AddManagerSupport.css';

export const AddManagerSupport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [message, setMessage] = useState('');
  const [actionRequired, setActionRequired] = useState(null);
  const [actionButton, setActionButton] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showAllContacts, setShowAllContacts] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/employer/account-managers/');
      const data = response.data;

      setHasAccess(data.has_access);
      setMessage(data.message || '');
      setActionRequired(data.action_required);
      setActionButton(data.action_button);

      if (data.has_access && data.contacts && data.contacts.length > 0) {
        setContacts(data.contacts);
        // Select primary contact or first
        const primary = data.contacts.find(c => c.is_primary);
        setSelectedContact(primary || data.contacts[0]);
        setShowAllContacts(false);
      } else {
        setContacts([]);
        setSelectedContact(null);
        setShowAllContacts(true);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleActionButton = () => {
    switch (actionRequired) {
      case 'upgrade':
      case 'renew':
        navigate('/Job-portal/Employer/Billing');
        break;
      case 'reactivate':
        navigate('/Job-portal/Employer/Billing');
        break;
      case 'contact_support':
        navigate('/Job-portal/Employer/SupportHub');
        break;
      default:
        window.location.reload();
    }
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setShowAllContacts(false);
  };

  const handleBackToList = () => {
    setShowAllContacts(true);
    setSelectedContact(null);
  };

  const handleEmailClick = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handlePhoneClick = (phone) => {
    if (phone) {
      const phoneClean = phone.replace(/\s/g, '');
      window.location.href = `tel:${phoneClean}`;
    }
  };

  if (loading) {
    return (
      <div className="employer-manager-container">
        <div className="employer-manager-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: '#64748b' }}>Loading account managers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employer-manager-container">
        <div className="employer-manager-card">
          <div className="employer-manager-header">
            <h3 className="employer-manager-title">Account Manager</h3>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#dc2626' }}>{error}</p>
            <button
              onClick={fetchContacts}
              className="employer-manager-btn employer-manager-btn-primary"
              style={{ marginTop: '12px' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // NO ACCESS / PLAN ISSUE
  // ──────────────────────────────────────────────

  if (!hasAccess) {
    let icon = '📋';
    let title = 'No Access';

    if (actionRequired === 'upgrade') {
      icon = '⬆️';
      title = 'Upgrade Required';
    } else if (actionRequired === 'reactivate') {
      icon = '⏸️';
      title = 'Plan Cancelled';
    } else if (actionRequired === 'renew') {
      icon = '⏰';
      title = 'Plan Expired';
    }

    return (
      <div className="employer-manager-container">
        <div className="employer-manager-card">
          <div className="employer-manager-header">
            <div className="employer-manager-badge" style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderColor: '#fcd34d'
            }}>
              <span className="badge-dot" style={{ backgroundColor: '#f59e0b' }}></span>
              Action Required
            </div>
            <h3 className="employer-manager-title">Account Manager</h3>
            <p className="employer-manager-subtitle">
              {actionRequired === 'upgrade' ? 'Upgrade to get dedicated support' : 'Get access to your account manager'}
            </p>
          </div>

          <div className="employer-manager-empty">
            <div className="empty-icon">{icon}</div>
            <div className="empty-title">{title}</div>
            <div className="empty-subtitle">{message}</div>

            {actionButton && (
              <button
                onClick={handleActionButton}
                className="employer-manager-btn employer-manager-btn-primary"
                style={{ marginTop: '16px' }}
              >
                {actionButton}
              </button>
            )}

            <button
              onClick={fetchContacts}
              className="employer-manager-btn employer-manager-btn-secondary"
              style={{ marginTop: '10px', fontSize: '12px' }}
            >
              Refresh
            </button>
          </div>

          {/* Plan Status Indicator */}
          <div style={{
            marginTop: '16px',
            padding: '10px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Plan Status:</span>
            <span style={{ fontWeight: '600' }}>
              {actionRequired === 'upgrade' ? '⬆️ Upgrade Needed' :
                actionRequired === 'reactivate' ? '⏸️ Cancelled' :
                  actionRequired === 'renew' ? '⏰ Expired' :
                    '❓ Unknown'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // NO CONTACTS AVAILABLE
  // ──────────────────────────────────────────────

  if (contacts.length === 0) {
    return (
      <div className="employer-manager-container">
        <div className="employer-manager-card">
          <div className="employer-manager-header">
            <div className="employer-manager-badge">
              <span className="badge-dot"></span>
              Account Manager
            </div>
            <h3 className="employer-manager-title">Support Contact Hub</h3>
            <p className="employer-manager-subtitle">Your dedicated account managers are here to help</p>
          </div>
          <div className="employer-manager-empty">
            <div className="empty-icon">👤</div>
            <div className="empty-title">No Account Manager Assigned</div>
            <div className="empty-subtitle">{message || 'Please contact support to get your dedicated account manager.'}</div>
            <button
              onClick={() => navigate('/Job-portal/Employer/SupportHub')}
              className="employer-manager-btn employer-manager-btn-primary"
              style={{ marginTop: '16px' }}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // SHOW SINGLE CONTACT (Default View)
  // ──────────────────────────────────────────────

  if (!showAllContacts && selectedContact) {
    const contact = selectedContact;
    return (
      <div className="employer-manager-container">
        <div className="employer-manager-card">
          <div className="employer-manager-header" style={{ position: 'relative' }}>
            {contacts.length > 1 && (
              <button
                onClick={handleBackToList}
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '4px 0'
                }}
              >
                View All Contacts →
              </button>
            )}
            <div className="employer-manager-badge" style={{ marginTop: '0px' }}>
              <span className="badge-dot"></span>
              {contact.department} Department
              {contact.is_primary && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  backgroundColor: '#2563eb',
                  color: 'white'
                }}>
                  PRIMARY
                </span>
              )}
            </div>
            <h3 className="employer-manager-title">{contact.full_name}</h3>
            <p className="employer-manager-subtitle">{contact.title}</p>
          </div>

          <div className="employer-manager-body">
            {contact.profile_photo && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <img
                  src={contact.profile_photo}
                  alt={contact.full_name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div className="employer-manager-row">
              <span className="label">📧 Email</span>
              <span className="value contact" onClick={() => handleEmailClick(contact.email)}>
                {contact.email}
              </span>
            </div>

            <div className="employer-manager-row">
              <span className="label">📞 Phone</span>
              <span className="value contact" onClick={() => handlePhoneClick(contact.phone)}>
                {contact.phone}
              </span>
            </div>

            {contact.description && (
              <div className="employer-manager-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <span className="label">📝 About</span>
                <span className="value" style={{ fontSize: '13px', fontWeight: '400', color: '#475569' }}>
                  {contact.description}
                </span>
              </div>
            )}
          </div>

          <div className="employer-manager-actions">
            {contacts.length > 1 && (
              <button
                className="employer-manager-btn employer-manager-btn-secondary"
                onClick={handleBackToList}
              >
                All Contacts
              </button>
            )}
            <button
              className="employer-manager-btn employer-manager-btn-primary"
              onClick={() => handleEmailClick(contact.email)}
            >
              ✉️ Send Message
            </button>
          </div>

          {/* Plan Status Indicator */}
          <div style={{
            marginTop: '16px',
            padding: '8px 12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #bbf7d0',
            fontSize: '12px',
            color: '#166534',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Plan Status:</span>
            <span style={{ fontWeight: '600' }}>✅ Active</span>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // SHOW ALL CONTACTS LIST
  // ──────────────────────────────────────────────

  return (
    <div className="employer-manager-container">
      <div className="employer-manager-card" style={{ maxWidth: '550px' }}>
        <div className="employer-manager-header">
          <div className="employer-manager-badge">
            <span className="badge-dot"></span>
            {contacts.filter(c => c.is_primary).length > 0 ? 'Primary Contact' : 'Account Managers'}
          </div>
          <h3 className="employer-manager-title">Support Contact Hub</h3>
          <p className="employer-manager-subtitle">
            {contacts.length} department contact{contacts.length > 1 ? 's' : ''} available
          </p>
        </div>

        <div className="employer-manager-body" style={{ padding: '12px 0', backgroundColor: 'transparent', border: 'none' }}>
          {contacts.map((contact, index) => (
            <div
              key={index}
              onClick={() => handleContactClick(contact)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: contact.is_primary ? '#eff6ff' : '#f8fafc',
                borderRadius: '10px',
                border: contact.is_primary ? '2px solid #2563eb' : '1px solid #e2e8f0',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                {contact.profile_photo ? (
                  <img src={contact.profile_photo} alt={contact.full_name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong>{contact.full_name}</strong>
                  {contact.is_primary && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      PRIMARY
                    </span>
                  )}
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8'
                  }}>
                    {contact.department}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {contact.title}
                </div>
              </div>
              <div style={{ fontSize: '20px', color: '#94a3b8' }}>›</div>
            </div>
          ))}
        </div>

        <button
          onClick={fetchContacts}
          className="employer-manager-btn employer-manager-btn-secondary"
          style={{ width: '100%', marginTop: '12px' }}
        >
          🔄 Refresh
        </button>

        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '6px',
          border: '1px solid #bbf7d0',
          fontSize: '12px',
          color: '#166534',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Plan Status:</span>
          <span style={{ fontWeight: '600' }}>✅ Active</span>
        </div>
      </div>
    </div>
  );
};