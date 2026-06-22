import React from 'react';
import './AdminExperience.css';

export const AdminExperience = ({ experienceData }) => {
  // If no data, show empty state
  if (!experienceData || experienceData.length === 0) {
    return (
      <div className="admin-exp-card">
        <h3 className="admin-exp-title">Top Experience Levels</h3>
        <p className="admin-exp-subtext">Applicants by Experience Level</p>
        <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
          No experience data available
        </p>
      </div>
    );
  }

  // Color mapping for consistent styling
  const colorMap = {
    'Entry Level': '#4A76FD',
    'Junior Level': '#FFAC5F',
    'Mid Level': '#45CCE1',
    'Senior Level': '#A17DFF'
  };

  return (
    <div className="admin-exp-card">
      <h3 className="admin-exp-title">Top Experience Levels</h3>
      <p className="admin-exp-subtext">Applicants by Experience Level</p>
      <div className="admin-exp-list">
        {experienceData.map((item, index) => (
          <div key={index} className="admin-exp-item">
            {/* ✅ FIX: Label and Percentage in same row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span className="admin-exp-label">{item.label}</span>
              <div>
                <span style={{ fontSize: '12px', color: '#666', marginRight: '10px' }}>
                  {item.count || 0} applicants
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: colorMap[item.label] || '#4A76FD'
                }}>
                  {item.percentage || 0}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="admin-exp-bar-bg">
              <div
                className="admin-exp-bar-fill"
                style={{
                  width: `${item.percentage || 0}%`,
                  backgroundColor: colorMap[item.label] || '#4A76FD'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};