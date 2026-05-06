import React, { useState, useEffect } from 'react'
import "./AdminDashboard.css"
import Dashboard from '../assets/Employer/DashboardIC.png'
import DashboardInact from '../assets/Employer/Dashboard_Inactive.png'
import UserManagements from '../assets/AdminAssets/UserManage.png'
import UserManagementACT from '../assets/AdminAssets/UserManageActive.png'
import RoleManagementIC from '../assets/AdminAssets/RoleManage.png'
import RoleManagementICACT from '../assets/AdminAssets/RoleManageAct.png'
import JobMonitor from '../assets/AdminAssets/JobMon.png'
import JobMonitorACT from '../assets/AdminAssets/JobMonActive.png'
import Report from '../assets/AdminAssets/AdminReport.png'
import ReportAct from '../assets/AdminAssets/ReportsActive.png'
import ActivityMon from '../assets/AdminAssets/ActivityMon.png'
import ActivityMonAct from '../assets/AdminAssets/ActivityMonAct.png'
import Tickets from '../assets/AdminAssets/Tickets.png'
import TicketsACT from '../assets/AdminAssets/TicketsActive.png'
import Settings from '../assets/AdminAssets/Settings.png'
import SettingsAct from '../assets/AdminAssets/SettingsActive.png'
import Memberships from '../assets/AdminAssets/Membership.png'
import MembershipsAct from '../assets/AdminAssets/MembershipActive.png'
import { EHeader } from '../Components-Employer/EHeader'
import TotalJobs from '../assets/AdminAssets/TotalJobs.png'
import TotalEmployers from '../assets/AdminAssets/TotalEmployers.png'
import TotalJobseekers from '../assets/AdminAssets/TotalJobseeker.png'
import TotalCompanies from '../assets/AdminAssets/TotalCompanies.png'
import ViewMore from '../assets/AdminAssets/ViewMore.png'
import { TotalOverview } from './TotalOverview'
import { AdminExperience } from './AdminExperience'
import { Calendar } from './Calender'
import { useJobs } from '../JobContext'
import { UserManagement } from './UserManagement'
import { ActivityMonitor } from './ActivityMonitor'
import { AdminReports } from './AdminReports'
import { JobMonitoring } from './JobMonitoring'
// import { RolePermission } from './RolePermission'
// import { RoleManagement } from './RoleManagement'
import { Membership } from './Membership'
import api from '../api/axios'


export const AdminDashboard = () => {
    const { jobs, Alluser, currentEmployer } = useJobs();
    const [activetab, setActiveTab] = useState('Dashboard');
    // ADDED:
    const [totalCompanies, setTotalCompanies] = useState(0);
    const [totalEmployers, setTotalEmployers] = useState(0);
    const [overviewLoading, setOverviewLoading] = useState(true);

    useEffect(() => {
        const fetchOverviewCounts = async () => {
            setOverviewLoading(true);
            try {
                const companyRes = await api.get('company/');
                setTotalCompanies(companyRes.data.length);

                const usersRes = await api.get('jobseekers/');
                const employers = usersRes.data.filter(
                    (u) => u.user_type === 'employer' || u.user?.user_type === 'employer'
                );
                setTotalEmployers(employers.length);
            } catch (error) {
                console.error("Overview counts fetch error:", error);
            } finally {
                setOverviewLoading(false);
            }
        };
        fetchOverviewCounts();
    }, []);

    return (
        <>
            <EHeader />
            <div className='AdminContainer'>
                <div className='Admin-Sidebar'>
                    <h2 style={{ textAlign: "center", marginTop: "35px" }}>Adminstrator</h2>
                    <div className='Admin-Sidebar-list'>

                        <div onClick={() => setActiveTab('Dashboard')} className={activetab === 'Dashboard' ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === 'Dashboard' ? <img src={Dashboard} width={15} height={15} alt="dashboard" />
                                    : <img src={DashboardInact} width={20} height={20} alt="dashboard" />}
                                <div className='Enav-item'>Dashboard</div>
                            </div>
                        </div>
                        <div onClick={() => setActiveTab("Job Monitoring")} className={activetab === "Job Monitoring" ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === "Job Monitoring" ? <img src={JobMonitorACT} width={15} height={15} alt="dashboard" />
                                    : <img src={JobMonitor} width={15} height={15} alt="Job Monitoring" />}
                                <div className='Enav-item'>Job Monitoring</div>
                            </div>
                        </div>
                        <div onClick={() => setActiveTab('Activity Monitoring')} className={activetab === "Activity Monitoring" ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === "Activity Monitoring" ? <img src={ActivityMonAct} width={15} height={15} alt="dashboard" />
                                    : <img src={ActivityMon} width={15} height={15} alt="Activity Monitoring" />}
                                <div className='Enav-item'>Activity Monitoring</div>
                            </div>
                        </div>
                        <div onClick={() => setActiveTab('User Management')} className={activetab === "User Management" ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === "User Management" ? <img src={UserManagementACT} width={15} height={15} alt="dashboard" />
                                    : <img src={UserManagements} width={15} height={15} alt="User Management" />}
                                <div className='Enav-item'>User Management</div>
                            </div>
                        </div>
                        <div onClick={() => setActiveTab('Role Management')} className={activetab === "Role Management" ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === "Role Management" ? <img src={RoleManagementICACT} width={15} height={15} alt="dashboard" />
                                    : <img src={RoleManagementIC} width={15} height={15} alt="Role Management" />}
                                <div className='Enav-item'>Role Management</div>
                            </div>
                        </div>

                        <div onClick={() => setActiveTab('Membership')} className={activetab === "Membership" ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === "Membership" ? <img src={MembershipsAct} width={15} height={15} alt="dashboard" />
                                    : <img src={Memberships} width={15} height={15} alt="Membership" />}
                                <div className='Enav-item'>Membership</div>
                            </div>
                        </div>
                        <div onClick={() => setActiveTab('Tickets')} className={activetab === "Tickets" ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === "Tickets" ? <img src={TicketsACT} width={15} height={15} alt="dashboard" />
                                    : <img src={Tickets} width={15} height={15} alt="Tickets" />}
                                <div className='Enav-item'>Tickets</div>
                            </div>
                        </div>
                        <div onClick={() => setActiveTab('Reports')} className={activetab === "Reports" ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === "Reports" ? <img src={ReportAct} width={15} height={15} alt="dashboard" />
                                    : <img src={Report} width={15} height={15} alt="Reports" />}
                                <div className='Enav-item'>Reports</div>
                            </div>
                        </div>
                        <div onClick={() => setActiveTab('settings')} className={activetab === "settings" ? "Admin-Active" : 'Admin-Navbar'}>
                            <div className='Admin-Navbox'>
                                {activetab === "settings" ? <img src={SettingsAct} width={15} height={15} alt="dashboard" />
                                    : <img src={Settings} width={15} height={15} alt="settings" />}
                                <div className='Enav-item'>settings</div>
                            </div>
                        </div>
                    </div>

                </div>
                <div className='Admin-MainSec'>
                    {activetab === 'Dashboard' && (
                        <div>
                            <div className='Admin-Welcome-Container'>
                                <p className='Admin-Welcome-Note' >Welcome Back, Admin</p>
                                <p className='Admin-Welcome-para'>Your team’s success start here. lets make progress together!</p>
                            </div>

                            <div className='Admin-Overview'>
                                <div className='Admin-Overview-Container'>
                                    <div className='Admin-Overview-Data'>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                                            <img src={TotalJobs} width={25} height={25} alt="Jobs" />
                                            <p style={{ fontSize: "24px", fontWeight: "700", color: "#484848" }}>{jobs.length}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: "bold", color: "#484848" }}>All Jobs</p>
                                        </div>
                                    </div>
                                    <div className='Admin-Viewmore'>
                                        <p style={{ fontSize: "14px", fontWeight: "500" }}>View more</p>
                                        <img src={ViewMore} width={30} height={30} alt="Viewmore" />
                                    </div>

                                </div>
                                <div className='Admin-Overview-Container'>
                                    <div className='Admin-Overview-Data'>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <img src={TotalCompanies} width={25} height={25} alt="Jobs" />
                                            <p style={{ fontSize: "24px", fontWeight: "700", color: "#484848" }}>
                                                {overviewLoading ? '...' : totalCompanies}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: "bold", color: "#484848" }}>Total Companies</p>
                                        </div>
                                    </div>
                                    <div className='Admin-Viewmore'>
                                        <p style={{ fontSize: "14px", fontWeight: "500" }}>View more</p>
                                        <img src={ViewMore} width={30} height={30} alt="Viewmore" />
                                    </div>
                                </div>
                                <div className='Admin-Overview-Container'>
                                    <div className='Admin-Overview-Data'>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <img src={TotalEmployers} width={25} height={25} alt="Jobs" />
                                            <p style={{ fontSize: "24px", fontWeight: "700", color: "#484848" }}>
                                                {overviewLoading ? '...' : totalEmployers}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: "bold", color: "#484848" }} >Total Employers</p>
                                        </div>
                                    </div>

                                    <div className='Admin-Viewmore'>
                                        <p style={{ fontSize: "14px", fontWeight: "500" }}>View more</p>
                                        <img src={ViewMore} width={30} height={30} alt="Viewmore" />
                                    </div>

                                </div>
                                <div className='Admin-Overview-Container'>
                                    <div className='Admin-Overview-Data'>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <img src={TotalJobseekers} width={25} height={25} alt="Total Jobseekers" />
                                            <p style={{ fontSize: "24px", fontWeight: "700", color: "#484848" }}>{Alluser.length}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: "bold", color: "#484848" }}>Total Jobseekers</p>
                                        </div>
                                    </div>

                                    <div className='Admin-Viewmore'>
                                        <p style={{ fontSize: "14px", fontWeight: "500" }}>View more</p>
                                        <img src={ViewMore} width={30} height={30} alt="Viewmore" />
                                    </div>

                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                <div className='Admin-Job-Ads-Cont'>
                                    <div className="Admin-jobads-header">
                                        <h2>Your Job Ads</h2>
                                        <div className="Admin-jobads-buttons">
                                            <button className="Admin-view-btn">VIEW ALL</button>
                                            <button className="Admin-create-btn">Create Job Ad +</button>
                                        </div>
                                    </div>
                                    <div className="Admin-job-card">
                                        <div className="Admin-job-left">
                                            <p className="Admin-job-title">Investment ESG Analyst</p>
                                            <span className="Admin-job-under">W1</span>
                                        </div>
                                        <div className="Admin-job-right">
                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">185</p>
                                                <span>New</span>
                                            </div>

                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">0</p>
                                                <span>Waiting</span>
                                            </div>

                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">250</p>
                                                <span>Total</span>
                                            </div>

                                        </div>

                                    </div>
                                    <div className="Admin-job-card">
                                        <div className="Admin-job-left">
                                            <p className="Admin-job-title">Finance Analyst</p>
                                            <span className="Admin-job-under">W1</span>
                                        </div>
                                        <div className="Admin-job-right">
                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">120</p>
                                                <span>New</span>
                                            </div>
                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">20</p>
                                                <span>Waiting</span>
                                            </div>
                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">180</p>
                                                <span>Total</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="Admin-job-card">
                                        <div className="Admin-job-left">
                                            <p className="Admin-job-title">
                                                Marketing Specialist
                                            </p>
                                            <span className="Admin-job-under">
                                                W1
                                            </span>
                                        </div>
                                        <div className="Admin-job-right">
                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">140</p>
                                                <span>New</span>
                                            </div>
                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">15</p>
                                                <span>Waiting</span>
                                            </div>
                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">210</p>
                                                <span>Total</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="Admin-job-card">

                                        <div className="Admin-job-left">
                                            <p className="Admin-job-title">
                                                Software Engineer
                                            </p>
                                            <span className="Admin-job-under">
                                                W1
                                            </span>
                                        </div>

                                        <div className="Admin-job-right">

                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">135</p>
                                                <span>New</span>
                                            </div>
                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">25</p>
                                                <span>Waiting</span>
                                            </div>

                                            <div className="Ads-Count-Cont">
                                                <p className="Ads-Count">200</p>
                                                <span>Total</span>
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                <div className='Admin-Experience'><AdminExperience /></div>


                                <div className='Admin-overview-cont' > <TotalOverview /></div>
                                {/* <div className="Admin-Amount-bal-cont">

                                    <div className="balance-card">
                                        <h3 className="card-title">Account Balance</h3>
                                        <hr className="divider" />
                                        <div className="stats-row">
                                            <div className="stat-item">
                                                <span className="stat-value">264</span>
                                                <span className="stat-label">Purchased</span>
                                            </div>
                                            <div className="stat-item border-left">
                                                <span className="stat-value">250</span>
                                                <span className="stat-label">Remaining</span>
                                            </div>
                                        </div>
                                        <p className="footer-link">
                                            Subscription(s) <a href="#">Expiry Dates</a>
                                        </p>
                                    </div>


                                    <div className="balance-card margin-top">
                                        <h3 className="card-title">Video Resume & CV Database</h3>
                                        <hr className="divider" />
                                        <p className="card-desc">
                                            Buy 1 month Access online or <a href="#">get in touch</a> <br /> with your account Manager
                                        </p>
                                    </div>
                                </div> */}
                            </div>

                            {/* <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                
                                <div className='Adminpending-total'>
                                    <div className="Adminpending-container">
                                        <div className='Adminpending-head'>
                                            <h4>Pending quizs</h4>
                                        </div>
                                        <div className='Adminpending-subhead'>
                                            <p>Applicants By Experience Level</p>
                                        </div><hr />
                                        <div className='Adminquiz-content'>
                                            <p>Which type of work environment do you prefer?</p>
                                        </div><hr />
                                        <div className='Adminquiz-content'>
                                            <p>What type of task do you enjoy the most?</p>
                                        </div><hr />
                                        <div className='Adminquiz-content'>
                                            <p>Which industry are you most interested in working?</p>
                                        </div><hr />
                                        <div className='Adminquiz-content'>
                                            <p>How do you pressure and tight deadlines?</p>
                                        </div>
                                    </div>
                                </div>

                                <div className='Admin-calender'><Calendar /></div>
                            </div> */}
                        </div>
                    )}
                    {activetab === 'Job Monitoring' && <JobMonitoring />}
                    {activetab === 'Activity Monitoring' && (<ActivityMonitor />)}
                    {activetab === 'User Management' && (<UserManagement />)}
                    {activetab === 'Role Management' && (<RoleManagement />)}
                    {activetab === 'Membership' && (<Membership />)}
                    {activetab === 'Tickets' && (<h3>Tickets</h3>)}
                    {activetab === 'Reports' && (<AdminReports />)}
                    {activetab === 'settings' && (<h3>settings</h3>)}
                </div>
            </div>
        </>
    )
}