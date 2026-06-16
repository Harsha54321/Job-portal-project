import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // IMPORT NAVIGATION HOOK
import './AddManagerContact.css'; 

export const AddManagerContact = () => {
  const navigate = useNavigate(); // INITIALIZE NAVIGATE FUNCTION

  const [managerData, setManagerData] = useState({
    name: '',
    email: '',
    phone: '',
    title: 'Need Help? Contact Your Account Manager',
    description: ''
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setManagerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saving Profile Settings:", managerData);
    setIsSaved(true);
    alert("Account Manager settings saved successfully!");
  };

  const handleCancel = () => {
    setManagerData({
      name: '',
      email: '',
      phone: '',
      title: 'Need Help? Contact Your Account Manager',
      description: ''
    });
    setIsSaved(false);
  };

  return (
    <div className="admin-portal-container">
      <div className="admin-form-card">
        
        {/* Header Section with Back Action */}
        <div className="admin-form-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            {/* Interactive Back Arrow Button */}
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="admin-btn-back"
              title="Go Back"
            >
              ← Back
            </button>
            <h2 className="admin-form-title" style={{ margin: 0 }}>Account Manager Profile</h2>
          </div>
          <p className="admin-form-subtitle">Setup the administrative support contact card displayed dynamically on employer dashboards.</p>
        </div>

        {isSaved && (
          <div className="admin-status-alert admin-alert-success">
            <span className="admin-status-dot admin-animate-pulse"></span>
            <span>Live Sync Active: Settings updated for "{managerData.name}".</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-portal-form">
          <div className="admin-form-group">
            <label className="admin-form-label">Manager Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={managerData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g., Use full Name for professional display" 
              className="admin-form-input" 
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group admin-col-6">
              <label className="admin-form-label">Direct Professional Email</label>
              <input 
                type="email" 
                name="email" 
                value={managerData.email} 
                onChange={handleChange} 
                required 
                placeholder="manager@jobportal.com" 
                className="admin-form-input" 
              />
            </div>
            <div className="admin-form-group admin-col-6">
              <label className="admin-form-label">Direct Helpline Phone</label>
              <input 
                type="text" 
                name="phone" 
                value={managerData.phone} 
                onChange={handleChange} 
                required 
                placeholder="+91 91********" 
                className="admin-form-input" 
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Message Box Widget Title</label>
            <input 
              type="text" 
              name="title" 
              value={managerData.title} 
              onChange={handleChange} 
              placeholder="Need Assistance? Message Admin Desk" 
              className="admin-form-input" 
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Quick Message Placeholder / Info Description</label>
            <textarea 
              name="description" 
              value={managerData.description} 
              onChange={handleChange} 
              rows="4" 
              placeholder="Explain response times or standard operational guidelines..." 
              className="admin-form-textarea" 
            />
          </div>

          <div className="admin-form-actions">
            <button type="button" onClick={handleCancel} className="admin-btn-cancel">
              Clear Fields
            </button>
            <button type="submit" className="admin-btn-submit">
              Save Admin Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};