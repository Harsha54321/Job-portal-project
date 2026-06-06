import React, { useState, useEffect } from 'react';
import './MembershipPlans.css';
import api from '../api/axios';

export const MembershipPlans = ({ onSelectPlan }) => {
    const [activeTab, setActiveTab] = useState('monthly');
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch plans only once on mount — tab switching just changes which price field to read
    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/plans/');
            setPlans(response.data);
        } catch (err) {
            console.error('Error fetching plans:', err);
            setError('Failed to load plans. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Returns the correct price based on active tab
const getPriceForTab = (pricing) => {
    if (activeTab === '6 Months') return pricing.discounted_prices.half_yearly * 6;
    if (activeTab === 'yearly') return pricing.discounted_prices.annual * 12;
    return pricing.total; // monthly — already includes GST
};

    // Returns the correct subtotal for checkout based on active tab
const getSubtotalForTab = (pricing) => {
    if (activeTab === '6 Months') return pricing.discounted_prices.half_yearly * 6;
    if (activeTab === 'yearly') return pricing.discounted_prices.annual * 12;
    return pricing.subtotal;
};
    // Banner color cycles by plan index position
    const getPlanColor = (index) => {
        const colors = ['blue', 'orange', 'purple'];
        return colors[index % colors.length];
    };

    // Parse a feature from the backend into { label, isIncluded }
    const parseFeature = (feat) => {
        const numericValue = parseInt(feat.value);
        const isIncluded = feat.value === 'true' || (!isNaN(numericValue) && numericValue > 0);

        let label = feat.text;
        if (feat.text === 'Jobs Posting') {
            label = `${feat.value} Jobs Posting`;
        } else if (feat.text === 'Highlight Your Job Listing') {
            label = numericValue > 0 ? `${feat.value} Highlight Listings` : 'Highlight Your Job Listing';
        }

        return { label, isIncluded };
    };

    const handleGetStarted = (plan) => {
        const pricing = plan.pricing;
        const price = getPriceForTab(pricing);
        const subtotal = getSubtotalForTab(pricing);

        const planData = {
            id: plan.id,
            name: plan.name,
            price: price,
            subtotal: subtotal,
            cgst: pricing.cgst,
            sgst: pricing.sgst,
            discount_percent: pricing.discount_percent,
            original_price: pricing.original_price,
            savings: pricing.savings,
            duration: activeTab,
            duration_days: pricing.duration_days,
        };

        onSelectPlan(planData, activeTab);
    };

    if (loading) {
        return (
            <div className="MembershipPlans-loading">
                <div className="spinner"></div>
                <p>Loading plans...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="MembershipPlans-error">
                <p>{error}</p>
                <button onClick={fetchPlans}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="MembershipPlans">
            <div className="MembershipPlans-header-box">
                <h2>Employer Membership Plan</h2>
                <p>Find the best plan to attract top talent</p>
            </div>

            {/* Tab switcher */}
            <div className="MembershipPlans-tabs-bar">
                {['monthly', '6 Months', 'yearly'].map((tab) => (
                    <button
                        key={tab}
                        className={`MembershipPlans-tab-item ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'monthly' ? 'Monthly' : tab === '6 Months' ? '6 Months' : 'Yearly'} Plan
                    </button>
                ))}
            </div>

            {/* Plan cards */}
            <div className={`MembershipPlans-grid ${plans.length === 2 ? 'two-cols' : ''}`}>
                {plans.map((plan, index) => {
                    const pricing = plan.pricing;
                    const displayPrice = getPriceForTab(pricing);
                    const tabLabel = activeTab === 'monthly' ? 'month'
                        : activeTab === '6 Months' ? '6 months'
                        : 'year';

                    return (
                        <div key={plan.id} className="MembershipPlans-card">
                            {/* Plan banner */}
                            <div className={`MembershipPlans-banner ${getPlanColor(index)}`}>
                                {plan.name.toUpperCase()}
                            </div>

                            <div className="MembershipPlans-content">
                                {/* Price */}
                                <div className="MembershipPlans-price-box">
                                   <span className="MembershipPlans-amount">
    ₹ {Math.round(
        activeTab === '6 Months' ? pricing.discounted_prices.half_yearly
        : activeTab === 'yearly' ? pricing.discounted_prices.annual
        : pricing.total
    )}
    <small>/{tabLabel}</small>
</span>
                                    {plan.summary ? (
                                        <span className="MembershipPlans-subtitle">{plan.summary}</span>
                                    ) : null}
                                </div>

                                <hr className="MembershipPlans-divider" />

                                {/* Features from backend */}
                                <ul className="MembershipPlans-features-list">
                                    {(plan.features || []).map((feat, i) => {
                                        const { label, isIncluded } = parseFeature(feat);
                                        return (
                                            <li key={i} className={isIncluded ? 'included' : 'excluded'}>
                                                <span className="MembershipPlans-icon">
                                                    {isIncluded ? '✔' : '✘'}
                                                </span>
                                                {label}
                                            </li>
                                        );
                                    })}
                                </ul>

                                <button
                                    className={`MembershipPlans-btn-start ${getPlanColor(index)}`}
                                    onClick={() => handleGetStarted(plan)}
                                >
                                    Get started
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};