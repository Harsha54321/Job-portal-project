import React, { useMemo, useState, useEffect, useCallback } from 'react';
import './FindTalent.css';
import { useJobs } from '../JobContext';
import { ProfileCard } from './ProfileCard';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const FindTalent = ({ onUpgradeClick }) => {
  const normalizeValue = (value) => {
    if (!value || typeof value !== "string") return null;
    let cleaned = value.trim().toLowerCase();
    cleaned = cleaned.replace(/\s+/g, " ");
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
  };

  const isValidValue = (value) => {
    if (!value) return false;
    const cleaned = value.trim();
    if (cleaned.length < 2) return false;
    if (!/^[a-zA-Z\s]+$/.test(cleaned)) return false;
    if (/^(.)\1+$/.test(cleaned)) return false;
    return true;
  };

  // Get data from JobContext
  const { Alluser, setAlluser } = useJobs();
  const navigate = useNavigate();

  // Combined access state
  const [accessState, setAccessState] = useState({
    canAccess: false,
    isExpired: false,
    isCancelled: false,
    isFeatureEnabled: false,
    planName: null,
    message: null,
    subscriptionStatus: null
  });
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [loadingJobseekers, setLoadingJobseekers] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // States for Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedEdu, setSelectedEdu] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [maxExp, setMaxExp] = useState(10);

  // States for "View More" toggles
  const [showAllLangs, setShowAllLangs] = useState(false);
  const [showAllEdu, setShowAllEdu] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [filterSearch, setFilterSearch] = useState({ lang: '', edu: '', skill: '' });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    languages: [],
    education: [],
    skills: [],
    experience: 10
  });

  // ============================================
  // 1. CHECK ACCESS - MAIN FUNCTION
  // ============================================
  const checkCandidateSearchAccess = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous checks
    if (isChecking && !forceRefresh) return;

    try {
      setIsChecking(true);
      if (forceRefresh) setLoadingAccess(true);

      console.log('🔍 Checking Candidate Search access...');

      const subscriptionResponse = await api.get('/subscription/');
      const subscription = subscriptionResponse.data;
      const plan = subscription?.plan;

      console.log('📊 Subscription data:', {
        status: subscription?.status,
        is_expired: subscription?.is_expired,
        plan_name: plan?.name,
        candidate_search: plan?.Candidate_Search
      });

      // Check all conditions
      const isExpired = subscription?.is_expired === true;
      const isCancelled = subscription?.status === 'cancelled';
      const isActive = subscription?.status === 'active';
      const isFeatureEnabled = plan?.Candidate_Search === true;

      // ✅ Access ONLY if active AND not expired AND feature enabled
      const canAccess = isActive && !isExpired && isFeatureEnabled;

      let message = '';
      let subscriptionStatus = subscription?.status || 'unknown';

      if (isCancelled) {
        message = `Your ${plan?.name || 'current'} plan has been cancelled. Please reactivate to access Candidate Search.`;
      } else if (isExpired) {
        message = `Your ${plan?.name || 'current'} plan has expired. Please renew to access Candidate Search.`;
      } else if (!isFeatureEnabled) {
        message = `Candidate Search is not included in your ${plan?.name || 'current'} plan. Upgrade to unlock candidate search.`;
      } else if (!isActive) {
        message = `Your subscription is not active. Please contact support.`;
      }

      // 🔴 If access was revoked, clear the data IMMEDIATELY
      if (accessState.canAccess && !canAccess) {
        console.log('🔴 Access revoked - clearing candidate data');
        setAlluser([]);
        setHasData(false);
      }

      setAccessState({
        canAccess,
        isExpired,
        isCancelled,
        isFeatureEnabled,
        planName: plan?.name,
        message,
        subscriptionStatus
      });

      // Only fetch data if can access
      if (canAccess && !hasData) {
        await fetchJobseekers();
      } else if (!canAccess) {
        setLoadingAccess(false);
        setLoadingJobseekers(false);
      } else if (canAccess && hasData) {
        setLoadingAccess(false);
        setLoadingJobseekers(false);
      }

    } catch (error) {
      console.error('❌ Error checking candidate search access:', error);
      setAccessState({
        canAccess: false,
        isExpired: false,
        isCancelled: false,
        isFeatureEnabled: false,
        planName: null,
        message: 'Unable to verify access. Please try again.',
        subscriptionStatus: 'error'
      });
      setLoadingAccess(false);
      setLoadingJobseekers(false);
    } finally {
      setIsChecking(false);
    }
  }, [accessState.canAccess, hasData, isChecking, setAlluser]);

  // ============================================
  // 2. FETCH JOBSEEKERS
  // ============================================
  const fetchJobseekers = async () => {
    try {
      setLoadingJobseekers(true);
      console.log('🔵 Fetching jobseekers...');

      const res = await api.get("/jobseekers/");
      const jobseekersOnly = res.data.filter(
        item => item.user?.user_type === "jobseeker"
      );

      console.log('✅ Jobseekers fetched:', jobseekersOnly.length);
      setAlluser(jobseekersOnly);
      setHasData(true);
    } catch (err) {
      console.error("❌ Error fetching jobseekers:", err);
      setAlluser([]);
      setHasData(false);
    } finally {
      setLoadingJobseekers(false);
      setLoadingAccess(false);
    }
  };

  // ============================================
  // 3. REFRESH ACCESS (called from parent)
  // ============================================
  const refreshAccess = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await checkCandidateSearchAccess(true);
  }, [checkCandidateSearchAccess]);

  // ============================================
  // 4. HANDLE UPGRADE/REACTIVATE
  // ============================================
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick(refreshAccess);
    } else {
      navigate('/Job-portal/Employer/Dashboard', {
        state: { targetTab: 'Billing' }
      });
    }
  };

  const handleGoBack = () => {
    navigate('/Job-portal/Employer/Dashboard', {
      state: { targetTab: 'Dashboard' }
    });
  };

  // ============================================
  // 5. EFFECTS - MULTIPLE TRIGGERS
  // ============================================

  // 5a. Initial check on mount
  useEffect(() => {
    const userType = sessionStorage.getItem('user_type');
    if (userType !== 'employer') {
      navigate('/Job-portal/jobseeker/');
      return;
    }
    checkCandidateSearchAccess(true);
  }, []);

  // 5b. Poll every 30 seconds (catches cancellation/expiry)
  useEffect(() => {
    const interval = setInterval(() => {
      checkCandidateSearchAccess(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [checkCandidateSearchAccess]);

  // 5c. Check on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab visible - re-checking access');
        checkCandidateSearchAccess(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkCandidateSearchAccess]);

  // 5d. Check on page focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('🎯 Page focused - re-checking access');
      checkCandidateSearchAccess(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkCandidateSearchAccess]);

  // 5e. Check on navigation
  useEffect(() => {
    const handlePopState = () => {
      console.log('↩️ Navigation - re-checking access');
      checkCandidateSearchAccess(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [checkCandidateSearchAccess]);

  // ============================================
  // 6. FILTER LOGIC (unchanged)
  // ============================================
  const jobseekersOnly = useMemo(() => {
    if (!Alluser || Alluser.length === 0) return [];
    return Alluser.filter(user => {
      const userType = user.user?.user_type ||
        user.user_type ||
        user.role ||
        user.profile?.user_type;
      return userType !== 'employer';
    });
  }, [Alluser]);

  const filterOptions = useMemo(() => {
    const languages = new Map();
    const education = new Map();
    const skills = new Map();

    if (!Alluser || Alluser.length === 0) {
      return { languages: [], education: [], skills: [] };
    }

    const processArray = (arr, key, map) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        const raw = item[key];
        if (!raw) return;
        const normalized = normalizeValue(raw);
        if (isValidValue(normalized)) {
          map.set(normalized.toLowerCase(), normalized);
        }
      });
    };

    Alluser.forEach(user => {
      processArray(user.profile?.languages, "name", languages);
      processArray(user.profile?.educations, "degree", education);
      processArray(user.profile?.skills, "name", skills);
      processArray(user.languages, "name", languages);
      processArray(user.educations, "degree", education);
      processArray(user.skills, "name", skills);
    });

    return {
      languages: Array.from(languages.values()).sort(),
      education: Array.from(education.values()).sort(),
      skills: Array.from(skills.values()).sort(),
    };
  }, [Alluser]);

  const handleFilterChange = (value, state, setState) => {
    setState(
      state.includes(value)
        ? state.filter(i => i !== value)
        : [...state, value]
    );
  };

  const handleApplyFilters = () => {
    const term = searchTerm.toLowerCase().trim();
    let newLangs = [...selectedLanguages];
    let newEdu = [...selectedEdu];
    let newSkills = [...selectedSkills];

    if (term) {
      filterOptions.languages.forEach(l => {
        if (l.toLowerCase() === term && !newLangs.includes(l)) newLangs.push(l);
      });
      filterOptions.education.forEach(e => {
        if (e.toLowerCase() === term && !newEdu.includes(e)) newEdu.push(e);
      });
      filterOptions.skills.forEach(s => {
        if (s.toLowerCase() === term && !newSkills.includes(s)) newSkills.push(s);
      });
    }

    setSelectedLanguages(newLangs);
    setSelectedEdu(newEdu);
    setSelectedSkills(newSkills);
    setAppliedFilters({
      search: term,
      languages: newLangs,
      education: newEdu,
      skills: newSkills,
      experience: maxExp
    });
  };

  const handleSearchClick = () => handleApplyFilters();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleApplyFilters();
  };

  const getVisibleItemsWithSearch = (items, showAll, searchKey) => {
    if (!items || items.length === 0) return [];
    const filtered = items.filter(item =>
      item.toLowerCase().includes(filterSearch[searchKey].toLowerCase())
    );
    return (showAll || filterSearch[searchKey]) ? filtered : filtered.slice(0, 5);
  };

  const filteredTalent = useMemo(() => {
    if (!Alluser || Alluser.length === 0) return [];
    return Alluser.filter((user) => {
      const userType = user.user?.user_type || user.user_type || user.role || user.profile?.user_type;
      if (userType === 'employer') return false;

      const userSkills = user.profile?.skills?.map(s => s.name) ||
        user.skills?.map(s => s.name) || [];
      const userLanguages = user.profile?.languages?.map(l => l.name) ||
        user.languages?.map(l => l.name) || [];
      const userEducation = user.profile?.educations?.map(e => e.degree) ||
        user.educations?.map(e => e.degree) || [];

      const searchLower = appliedFilters.search.toLowerCase().trim();
      let matchesSearch = true;
      if (searchLower) {
        const searchableText = [
          user.full_name || '',
          user.current_job_title || user.profile?.current_job_title || '',
          user.current_company || user.profile?.current_company || '',
          ...userSkills,
          ...userEducation
        ].join(' ').toLowerCase();
        matchesSearch = searchableText.includes(searchLower);
      }

      const normalizeArray = (arr) => arr.map(item => normalizeValue(item));

      const matchesLanguage =
        appliedFilters.languages.length === 0 ||
        normalizeArray(userLanguages).some(lang =>
          appliedFilters.languages.map(normalizeValue).includes(lang)
        );

      const matchesEducation =
        appliedFilters.education.length === 0 ||
        normalizeArray(userEducation).some(edu =>
          appliedFilters.education.map(normalizeValue).includes(edu)
        );

      const matchesSkills =
        appliedFilters.skills.length === 0 ||
        appliedFilters.skills.every(skill =>
          normalizeArray(userSkills).includes(normalizeValue(skill))
        );

      let expNumber = 0;
      if (user.total_experience_years !== undefined) {
        expNumber = parseFloat(user.total_experience_years) || 0;
      } else if (user.profile?.total_experience_years) {
        expNumber = parseFloat(user.profile.total_experience_years) || 0;
      }

      const matchesExperience = expNumber <= appliedFilters.experience;

      return matchesSearch && matchesLanguage && matchesEducation && matchesSkills && matchesExperience;
    });
  }, [appliedFilters, Alluser]);

  const clearFilters = () => {
    setSelectedLanguages([]);
    setSelectedEdu([]);
    setSelectedSkills([]);
    setMaxExp(10);
    setSearchTerm('');
    setShowAllLangs(false);
    setShowAllEdu(false);
    setShowAllSkills(false);
    setFilterSearch({ lang: '', edu: '', skill: '' });
    setAppliedFilters({
      search: '',
      languages: [],
      education: [],
      skills: [],
      experience: 10
    });
  };

  // ============================================
  // 7. RENDER LOGIC
  // ============================================

  // Case 1: Loading
  if (loadingAccess || loadingJobseekers) {
    return (
      <div className="talent-page-container">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="spinner" style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <p style={{ color: "#64748b" }}>
            {loadingAccess ? 'Checking access permissions...' : 'Loading jobseekers...'}
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Case 2: No Access - FULL LOCK PAGE
  if (!accessState.canAccess) {
    const isExpired = accessState.isExpired;
    const isCancelled = accessState.isCancelled;
    const isFeatureDisabled = !accessState.isFeatureEnabled && !isExpired && !isCancelled;

    return (
      <div className="talent-page-container">
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          maxWidth: "550px",
          margin: "40px auto"
        }}>
          <div style={{ fontSize: "72px", marginBottom: "20px" }}>
            {isCancelled ? '🚫' : isExpired ? '⏰' : '🔒'}
          </div>
          <h2 style={{ color: "#1e293b", marginBottom: "15px", fontSize: "28px" }}>
            {isCancelled ? 'Plan Cancelled' : isExpired ? 'Access Expired' : 'Feature Locked'}
          </h2>
          <p style={{ color: "#64748b", marginBottom: "25px", lineHeight: "1.6", fontSize: "16px" }}>
            {accessState.message}
          </p>

          <div style={{
            background: isCancelled ? "#fee2e2" : isExpired ? "#fee2e2" : "#fef9ec",
            border: isCancelled ? "1px solid #fecaca" : isExpired ? "1px solid #fecaca" : "1px solid #fde68a",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "30px",
            fontSize: "14px",
            color: isCancelled ? "#991b1b" : isExpired ? "#991b1b" : "#92400e",
            textAlign: "left"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "20px" }}>
                {isCancelled ? '⚠️' : isExpired ? '⚠️' : '💡'}
              </span>
              <strong style={{ fontSize: "15px" }}>
                {isCancelled ? 'What you lost:' : isExpired ? 'What you lose:' : 'Upgrade to unlock:'}
              </strong>
            </div>
            <ul style={{ margin: "10px 0 0 20px", padding: 0 }}>
              <li style={{ marginBottom: "8px" }}>✓ Search and filter through 1000+ jobseekers</li>
              <li style={{ marginBottom: "8px" }}>✓ Directly contact potential candidates</li>
              <li style={{ marginBottom: "8px" }}>✓ Advanced filtering by skills, experience, and education</li>
              <li style={{ marginBottom: "8px" }}>✓ Save candidate searches and get alerts</li>
            </ul>
          </div>

          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleUpgrade}
              style={{
                padding: "12px 30px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {isCancelled ? 'Reactivate Plan Now' : isExpired ? 'Renew Plan Now' : 'Upgrade Plan Now'}
            </button>
            <button
              onClick={handleGoBack}
              style={{
                padding: "12px 30px",
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Go to Dashboard
            </button>
          </div>

          <p style={{ marginTop: "20px", fontSize: "13px", color: "#94a3b8" }}>
            {isCancelled
              ? 'Contact support or reactivate your plan to restore access.'
              : isExpired
                ? 'Renew your plan to restore access.'
                : 'Contact your administrator to upgrade your plan.'
            }
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // 8. Case 3: Has Access - Show Full Content
  // ============================================
  return (
    <div className="talent-page-container">
      {/* Plan Status Indicator */}
      <div style={{
        textAlign: "right",
        padding: "10px 20px",
        fontSize: "12px",
        color: "#64748b",
        borderBottom: "1px solid #e2e8f0"
      }}>
        Plan: {accessState.planName} • Status: Active
      </div>

      {/* Search Section */}
      <section className="FindTalent-search-section">
        <div className="FindTalent-search-wrapper">
          <input
            type="text"
            placeholder="Search by Skills, Education, or Job Title"
            className="FindTalent-search-input"
            value={searchTerm}
            onChange={(e) => {
              const newValue = e.target.value;
              setSearchTerm(newValue);

              if (newValue.trim() === '') {
                setSelectedLanguages([]);
                setSelectedEdu([]);
                setSelectedSkills([]);
                setAppliedFilters({
                  search: '',
                  languages: [],
                  education: [],
                  skills: [],
                  experience: maxExp
                });
              }
            }}
            onKeyPress={handleKeyPress}
          />
          <button
            className="FindTalent-search-button"
            onClick={handleSearchClick}
          >
            Search
          </button>
        </div>
        <h1 style={{ marginTop: "40px" }} className="FindTalent-results-title">
          {loadingJobseekers
            ? "Loading jobseekers..."
            : `Jobseekers based on your search (${filteredTalent.length})`
          }
        </h1>
      </section>

      <div className="FindTalent-layout-body">
        {/* Filters Sidebar */}
        <div className="FindTalent-filters-sidebar">
          <div className="FindTalent-filter-top">
            <button className="FindTalent-filter-label" onClick={handleApplyFilters}>Apply filters</button>
            <span className="FindTalent-clear-btn" onClick={clearFilters}>
              Clear all
            </span>
          </div>

          {/* Languages Filter */}
          {filterOptions.languages.length > 0 && (
            <div className="FindTalent-filter-category">
              <h3>Languages</h3>
              <input
                type="text"
                placeholder="Search languages..."
                className="FindTalent-filter-search-input"
                value={filterSearch.lang}
                onChange={(e) => setFilterSearch({ ...filterSearch, lang: e.target.value })}
                style={{ width: '100%', padding: '5px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '3px' }}
              />
              {getVisibleItemsWithSearch(filterOptions.languages, showAllLangs, 'lang').map(lang => (
                <div key={lang} className="FindTalent-checkbox-item">
                  <input
                    type="checkbox"
                    id={`lang-${lang}`}
                    checked={selectedLanguages.includes(lang)}
                    onChange={() => handleFilterChange(lang, selectedLanguages, setSelectedLanguages)}
                  />
                  <label htmlFor={`lang-${lang}`}>{lang}</label>
                </div>
              ))}
              {filterOptions.languages.length > 5 && (
                <span className="FindTalent-view-more-link" onClick={() => setShowAllLangs(!showAllLangs)}>
                  {showAllLangs ? "View Less" : `View More (${filterOptions.languages.length - 5}+)`}
                </span>
              )}
            </div>
          )}

          {/* Experience Filter */}
          <div className="FindTalent-filter-category">
            <h3>Experience (Max: {maxExp} years)</h3>
            <input
              type="range"
              min="0"
              max="20"
              value={maxExp}
              className="FindTalent-exp-slider"
              onChange={(e) => setMaxExp(parseInt(e.target.value))}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#64748b',
              marginTop: '4px'
            }}>
              <span>0 yrs</span>
              <span>20 yrs</span>
            </div>
          </div>

          {/* Education Filter */}
          {filterOptions.education.length > 0 && (
            <div className="FindTalent-filter-category">
              <h3>Education</h3>
              <input
                type="text"
                placeholder="Search education..."
                className="FindTalent-filter-search-input"
                value={filterSearch.edu}
                onChange={(e) => setFilterSearch({ ...filterSearch, edu: e.target.value })}
                style={{ width: '100%', padding: '5px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '3px' }}
              />
              {getVisibleItemsWithSearch(filterOptions.education, showAllEdu, 'edu').map(edu => (
                <div key={edu} className="FindTalent-checkbox-item">
                  <input
                    type="checkbox"
                    id={`edu-${edu}`}
                    checked={selectedEdu.includes(edu)}
                    onChange={() => handleFilterChange(edu, selectedEdu, setSelectedEdu)}
                  />
                  <label htmlFor={`edu-${edu}`}>{edu}</label>
                </div>
              ))}
              {filterOptions.education.length > 5 && (
                <span className="FindTalent-view-more-link" onClick={() => setShowAllEdu(!showAllEdu)}>
                  {showAllEdu ? "View Less" : `View More (${filterOptions.education.length - 5}+)`}
                </span>
              )}
            </div>
          )}

          {/* Skills Filter */}
          {filterOptions.skills.length > 0 && (
            <div className="FindTalent-filter-category">
              <h3>Skills</h3>
              <input
                type="text"
                placeholder="Search skills..."
                className="FindTalent-filter-search-input"
                value={filterSearch.skill}
                onChange={(e) => setFilterSearch({ ...filterSearch, skill: e.target.value })}
                style={{ width: '100%', padding: '5px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '3px' }}
              />
              {getVisibleItemsWithSearch(filterOptions.skills, showAllSkills, 'skill').map(skill => (
                <div key={skill} className="FindTalent-checkbox-item">
                  <input
                    type="checkbox"
                    id={`skill-${skill}`}
                    checked={selectedSkills.includes(skill)}
                    onChange={() => handleFilterChange(skill, selectedSkills, setSelectedSkills)}
                  />
                  <label htmlFor={`skill-${skill}`}>{skill}</label>
                </div>
              ))}
              {filterOptions.skills.length > 5 && (
                <span className="FindTalent-view-more-link" onClick={() => setShowAllSkills(!showAllSkills)}>
                  {showAllSkills ? "View Less" : `View More (${filterOptions.skills.length - 5}+)`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Talent List */}
        <div className="FindTalent-talent-list">
          {loadingJobseekers ? (
            <div className="FindTalent-no-results">
              <h3>Loading jobseekers...</h3>
              <p>Please wait while we fetch the data</p>
            </div>
          ) : filteredTalent.length > 0 ? (
            filteredTalent.map((user, index) => (
              <ProfileCard
                key={user.id || index}
                user={user}
                showActions={true}
              />
            ))
          ) : (
            <div className="FindTalent-no-results">
              <h3>No job seekers found</h3>
              <p>Try adjusting your filters or search term</p>
              <button className="FindTalent-clear-filters-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            </div>
          )}

          {filteredTalent.length > 0 && filteredTalent.length >= 10 && (
            <button className="FindTalent-load-more-btn">Load More</button>
          )}
        </div>
      </div>
    </div>
  );
};