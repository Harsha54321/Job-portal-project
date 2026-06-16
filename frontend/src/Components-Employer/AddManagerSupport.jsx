import React from 'react';
/* Importing your centralized style file safely */
import '../Components-Admin/AddManagerContact.css'; 

export const AddManagerSupport = () => {
  // Static mock data representing the assigned administrator parameters
  const assignedAdmin = {
    name: "Harsha Vardhan",
    email: "harsha.admin@jobportal.com",
    phone: "+91 98765 43210"
  };

  return (
    <div className="admin-portal-container">
      <div className="admin-form-card" style={{ maxWidth: '400px' }}>
        
        {/* Simplified Clean Header */}
        <div className="admin-form-header" style={{ paddingBottom: '12px', marginBottom: '16px' }}>
          <span className="admin-status-alert admin-alert-success" style={{ display: 'inline-flex', marginBottom: '10px', padding: '4px 12px', fontSize: '11px' }}>
            Account Manager Details
          </span>
          <h3 className="admin-form-title" style={{ fontSize: '18px' }}>Support Contact Hub</h3>
        </div>

        {/* Clean Data Matrix Layout */}
        <div className="admin-portal-form" style={{ gap: '14px', backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: '#94a3b8', fontWeight: '500' }}>Name:</span>
            <span style={{ fontWeight: '600', color: '#334155' }}>{assignedAdmin.name}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: '#94a3b8', fontWeight: '500' }}>Phone Number:</span>
            <span style={{ fontWeight: '600', color: '#2563eb', cursor: 'pointer' }}>{assignedAdmin.phone}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: '#94a3b8', fontWeight: '500' }}>Email Address:</span>
            <span style={{ fontWeight: '600', color: '#2563eb', cursor: 'pointer' }}>{assignedAdmin.email}</span>
          </div>
        </div>

      </div>
    </div>
  );
};