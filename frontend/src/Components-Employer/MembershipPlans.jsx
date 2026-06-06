import React, { useState, useEffect } from 'react';
import './MembershipPlans.css';
import api from '../api/axios';

export const MembershipPlans = ({ onSelectPlan, plans: externalPlans }) => {
    const [activeTab, setActiveTab] = useState('monthly');
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getPlanColor = (index) => {
        const colors = ['blue', 'orange', 'purple'];
        return colors[index % colors.length];
    };

    useEffect(() => {
        if (externalPlans && externalPlans.length > 0) {
            setPlans(externalPlans);
            setLoading(false);
        } else {
            fetchPlans();
        }
    }, [externalPlans]);

    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/plans/');
            console.log('Fetched plans:', response.data);
            setPlans(response.data);
        } catch (err) {
            console.error('Error fetching plans:', err);
            setError('Failed to load plans. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGetStarted = (plan) => {
        let pricing = plan.pricing;
        let duration = activeTab;
        let priceWithoutTax = 0;  // ← WITHOUT TAX for display reference
        let finalPriceWithTax = 0;  // ← WITH TAX for payment
        let priceBreakdown = null;

        if (activeTab === 'monthly') {
            // Without tax: monthly_price
            priceWithoutTax = pricing.monthly.base_price;
            // With tax: monthly_price + GST
            finalPriceWithTax = pricing.monthly.total;
            duration = 'monthly';
            priceBreakdown = pricing.monthly;
        } else if (activeTab === '6 Months') {
            // Without tax: after discount (before GST)
            priceWithoutTax = pricing.six_months.price_after_discount;
            // With tax: total including GST
            finalPriceWithTax = pricing.six_months.total;
            duration = '6_months';
            priceBreakdown = pricing.six_months;
        } else {
            // Without tax: after discount (before GST)
            priceWithoutTax = pricing.yearly.price_after_discount;
            // With tax: total including GST
            finalPriceWithTax = pricing.yearly.total;
            duration = 'yearly';
            priceBreakdown = pricing.yearly;
        }

        const planData = {
            id: plan.id,
            name: plan.name,
            price: finalPriceWithTax,  // ← Send WITH TAX to backend
            displayPrice: priceWithoutTax,  // ← For UI display
            color: plan.color,
            summary: plan.summary,
            duration: duration,
            price_breakdown: priceBreakdown,
            subtotal: priceBreakdown?.price_after_discount || priceBreakdown?.base_price,
            cgst: priceBreakdown?.cgst || 0,
            sgst: priceBreakdown?.sgst || 0,
            tax_rate: priceBreakdown?.tax_rate || 18
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

            <div className={`MembershipPlans-grid ${plans.length === 2 ? 'two-cols' : ''}`}>
                {plans.map((plan, index) => {
                    let displayPrice = 0;      // ← WITHOUT TAX (what user sees)
                    let tabLabel = 'month';
                    let pricingData = null;
                    let originalPrice = null;
                    let savings = null;

                    if (activeTab === 'monthly') {
                        // Display WITHOUT tax (just monthly price)
                        displayPrice = plan.pricing.monthly.base_price;
                        tabLabel = 'month';
                        pricingData = plan.pricing.monthly;
                        originalPrice = plan.pricing.monthly.base_price;
                    } else if (activeTab === '6 Months') {
                        // Display WITHOUT tax (after discount, before GST)
                        displayPrice = plan.pricing.six_months.price_after_discount;
                        tabLabel = '6 months';
                        pricingData = plan.pricing.six_months;
                        originalPrice = plan.pricing.six_months.base_price;
                        savings = plan.pricing.six_months.savings;
                    } else {
                        // Display WITHOUT tax (after discount, before GST)
                        displayPrice = plan.pricing.yearly.price_after_discount;
                        tabLabel = 'year';
                        pricingData = plan.pricing.yearly;
                        originalPrice = plan.pricing.yearly.base_price;
                        savings = plan.pricing.yearly.savings;
                    }

                    return (
                        <div key={plan.id} className="MembershipPlans-card">
                            <div className={`MembershipPlans-banner ${getPlanColor(index)}`}>
                                {plan.name.toUpperCase()}
                            </div>

                            <div className="MembershipPlans-content">
                                <div className="MembershipPlans-price-box">
                                    <span className="MembershipPlans-amount">
                                        ₹ {Math.round(displayPrice)}
                                        <small>/{tabLabel}</small>
                                    </span>
                                    {pricingData.discount_percent > 0 && (
                                        <div className="MembershipPlans-discount-info">
                                            <span className="MembershipPlans-original-price">
                                                ₹{Math.round(originalPrice)}
                                            </span>
                                            <span className="MembershipPlans-discount-badge">
                                                Save {pricingData.discount_percent}%
                                            </span>
                                        </div>
                                    )}
                                    {/* Show GST info */}
                                    <div className="MembershipPlans-tax-info">
                                        +18% GST
                                    </div>
                                    {plan.summary && (
                                        <span className="MembershipPlans-subtitle">{plan.summary}</span>
                                    )}
                                </div>

                                <hr className="MembershipPlans-divider" />

                                <ul className="MembershipPlans-features-list">
                                    {(plan.features || []).map((feat, i) => {
                                        const isIncluded = feat.included === true || feat.value === 'true';
                                        let displayText = feat.text;

                                        if (feat.text === 'Jobs Posting' && feat.value !== '0') {
                                            displayText = `${feat.value} Jobs Posting`;
                                        } else if (feat.text === 'Highlight Your Job Listing' && feat.value !== '0') {
                                            displayText = `${feat.value} Highlight Listings`;
                                        }

                                        return (
                                            <li key={i} className={isIncluded ? 'included' : 'excluded'}>
                                                <span className="MembershipPlans-icon">
                                                    {isIncluded ? '✔' : '✘'}
                                                </span>
                                                {displayText}
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