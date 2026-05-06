import React from 'react';
import './JobMonitoring.css';
import place from '../assets/opportunity_location.png';
import time from '../assets/opportunity_time.png';
import starIcon from '../assets/Star_icon.png';

export const JobPreviewModal = ({ job, onClose }) => {
  if (!job) return null;

  return (
    <div className="job-preview-overlay" onClick={onClose}>
      <div className="job-preview-modal" onClick={(e) => e.stopPropagation()}>
        {/* Sticky Top Bar */}
        <div className="job-preview-top-bar">
          <button className="job-preview-close" onClick={onClose}>
            ✕ Close Preview
          </button>
        </div>

        <div className="job-preview-content">
          {/* 1. Header Card */}
          <div className="job-preview-header-card">
            <div className="job-preview-header-main">
              <div className="job-preview-title-section">
                <h2 className="job-preview-role">{job.role}</h2>
                <div className="job-preview-company-row">
                  <span className="job-preview-company-name">{job.company}</span>
                  <span className="job-preview-rating">4.3 ★</span>
                  <span className="job-preview-reviews">55k+ reviews</span>
                </div>
                
                <div className="job-preview-meta-grid">
                  <div className="meta-item"><img src={time} className='card-icons' alt="time" /> {job.experience || '2-3 years'}</div>
                  <div className="meta-item">₹ {job.salary || '20,000 - 25,000'}/month</div>
                  <div className="meta-item"><img src={place} className='card-icons' alt="loc" /> {job.location || 'Chennai'}</div>
                </div>

                <div className="job-preview-tags">
                  <span className="tag-outline">{job.type || 'Full-Time'}</span>
                  <span className="tag-outline">General Shift</span>
                </div>
              </div>
              <div className="job-preview-logo-box">
                {job.company.charAt(0)}
              </div>
            </div>
            
            <div className="job-preview-header-footer">
               <span>Posted: 3 days ago</span>
               <span>Openings: {job.openings || 2}</span>
               <span>Applicants: {job.applicants || '100+'}</span>
            </div>
          </div>

          {/* 2. Job Sections */}
          <div className="job-preview-body">
            <section className="job-preview-section">
              <h3 className="section-title">Job highlights</h3>
              <ul className="job-preview-list">
                <li>Candidates With {job.experience || 'Relevant'} Experience Preferred.</li>
                <li>Proven Work Experience As A {job.role} Or In A Similar Role.</li>
                <li>Strong Communication Skills</li>
              </ul>
            </section>

            <section className="job-preview-section">
              <h3 className="section-title">Job description</h3>
              <p className="job-preview-text">
                We Are Looking For A Talented {job.role} To Join Our Growing Team. 
                The Ideal Candidate Should Have A Strong Portfolio Showcasing User-Centric Design Solutions.
              </p>
            </section>

            <section className="job-preview-section">
              <h3 className="section-title">Responsibilities</h3>
              <ul className="job-preview-list">
                {/* Null check using optional chaining */}
                {job.responsibilities?.map((item, index) => (
                  <li key={index}>{item}</li>
                )) || <li>Collaborate with cross-functional teams to define and implement innovative solutions.</li>}
              </ul>
            </section>

            <section className="job-preview-section">
              <h3 className="section-title">Key Skills</h3>
              <div className="job-preview-skills-cloud">
                {/* Defensive mapping to prevent "map of undefined" error */}
                {(job.skills || ['Figma', 'Wireframing', 'UI Design']).map((skill, index) => (
                  <span key={index} className="skill-chip">{skill}</span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};