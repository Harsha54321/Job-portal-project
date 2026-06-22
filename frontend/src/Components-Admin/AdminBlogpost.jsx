import React, { useState, useEffect } from 'react';
import './AdminBlogpost.css';
import Trash from '../assets/AdminAssets/TrashIcon.png';
import Filter from '../assets/AdminAssets/Filter.png';
import Drafts from '../assets/AdminAssets/Draft.png';
import Published from '../assets/AdminAssets/PublishedBlog.png';
import AllPosts from '../assets/AdminAssets/AllPosts.png';
import threedots from '../assets/ThreeDots.png';
import { useJobs } from '../JobContext';
import Searchicon from '../assets/icon_search.png';
import { AdminCreateBlog } from './AdminCreateBlog';
import api from '../api/axios';

export const AdminBlogPost = () => {
    const { publishedBlogs, setPublishedBlogs, blogStats, fetchBlogStats } = useJobs();
    const [openMenu, setOpenMenu] = useState(null);
    const [mode, setmode] = useState("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSearch, setActiveSearch] = useState("");

    const [selectedBlog, setSelectedBlog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedBlogData, setEditedBlogData] = useState({});
    const [editErrors, setEditErrors] = useState({});
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    
    // LIVE CATEGORIES STATE FOR THE EDIT MODAL DROPDOWN
    const [categories, setCategories] = useState([]);

    const totalPostsCount = blogStats.total;
    const publishedCount = blogStats.published;
    const draftsCount = blogStats.drafts;
    const trashCount = blogStats.trash;

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('blog-categories/');
                setCategories(res.data.map(cat => ({ id: cat.name, label: cat.name })));
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const filteredBlogs = Object.entries(publishedBlogs || {}).reduce((acc, [categoryName, blogList]) => {
        const filteredList = blogList.filter(blog => {
            const matchesTitle = blog.title?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryName?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTitle || matchesCategory;
        });

        if (filteredList.length > 0) {
            acc[categoryName] = filteredList;
        }
        return acc;
    }, {});

    // HELPER 1: Checks if a string has at least one letter
    const hasAtLeastOneLetter = (str) => /[a-zA-Z]/.test(str || '');

    // HELPER 2: Gets Today's date in YYYY-MM-DD for the HTML calendar Max limit
    const getTodayYYYYMMDD = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const handlePointTitleChange = (pointIndex, value) => {
        const errorKey = `pointTitle_${pointIndex}`;
        if (editErrors[errorKey]) {
            setEditErrors(prev => ({ ...prev, [errorKey]: '' }));
        }
        const updatedPoints = [...editedBlogData.points];
        updatedPoints[pointIndex].title = value;
        setEditedBlogData(prev => ({ ...prev, points: updatedPoints }));
    };

    const handleContentTextChange = (pointIndex, contentIndex, value) => {
        const errorKey = `pointContent_${pointIndex}_${contentIndex}`;
        if (editErrors[errorKey]) {
            setEditErrors(prev => ({ ...prev, [errorKey]: '' }));
        }
        const updatedPoints = [...editedBlogData.points];
        updatedPoints[pointIndex].content[contentIndex] = value;
        setEditedBlogData(prev => ({ ...prev, points: updatedPoints }));
    };

    const handleAddMainPoint = () => {
        setEditedBlogData(prev => ({
            ...prev,
            points: [...prev.points, { title: "", content: [""] }]
        }));
    };

    const handleRemoveMainPoint = (pointIndex) => {
        const updatedPoints = editedBlogData.points.filter((_, i) => i !== pointIndex);
        setEditedBlogData(prev => ({ ...prev, points: updatedPoints }));
    };

    const handleAddSubContent = (pointIndex) => {
        const updatedPoints = [...editedBlogData.points];
        updatedPoints[pointIndex].content.push("");
        setEditedBlogData(prev => ({ ...prev, points: updatedPoints }));
    };

    const handleRemoveSubContent = (pointIndex, contentIndex) => {
        const updatedPoints = [...editedBlogData.points];
        updatedPoints[pointIndex].content = updatedPoints[pointIndex].content.filter((_, i) => i !== contentIndex);
        setEditedBlogData(prev => ({ ...prev, points: updatedPoints }));
    };

    // OPEN MODAL HANDLER: Instantly grabs the freshest categories from backend
    const handleViewClick = async (categoryName, blog) => {
        try {
            const res = await api.get('blog-categories/');
            setCategories(res.data.map(cat => ({ id: cat.name, label: cat.name })));
        } catch (err) {
            console.error('Failed to refresh categories:', err);
        }

        setSelectedBlog({ ...blog, categoryName });
        setEditedBlogData({
            ...blog,
            categoryName,
            description: blog.desc,
            points: Array.isArray(blog.points) ? [...blog.points] : (blog.points ? [blog.points] : [""])
        });
        setThumbnailPreview(blog.Thumbnail || '');
        setThumbnailFile(null);
        setIsEditMode(false);
        setEditErrors({});
        setIsModalOpen(true);
        setOpenMenu(null);
    };

    const convertToInputDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; 
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (editErrors[name]) {
            setEditErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name === 'date') {
            if (value) {
                const [y, m, d] = value.split('-');
                const dateObj = new Date(y, m - 1, d);
                const options = { month: 'short', day: '2-digit', year: 'numeric' };
                const formattedDate = dateObj.toLocaleDateString('en-US', options).replace(/,/g, '');
                setEditedBlogData(prev => ({ ...prev, [name]: formattedDate }));
            } else {
                setEditedBlogData(prev => ({ ...prev, [name]: '' }));
            }
            return; 
        }

        setEditedBlogData(prev => ({ ...prev, [name]: value }));
    };

    // SAVE VALIDATION (Inner Heading is completely gone)
    const handleSaveChanges = async () => {
        let isCompromised = false;
        const caughtErrors = {};
        const msg = "Numbers and special characters alone are not allowed.";

        // 1. Standard text fields
        const stringFields = ['title', 'categoryName', 'desc']; 
        stringFields.forEach(field => {
            const val = (editedBlogData[field] || '').trim();
            if (!val) {
                caughtErrors[field] = "This field is required.";
                isCompromised = true;
            } else if (!hasAtLeastOneLetter(val)) {
                caughtErrors[field] = msg;
                isCompromised = true;
            }
        });

        // 2. Date check
        if (!editedBlogData.date) {
            caughtErrors.date = "Please select a date.";
            isCompromised = true;
        } else {
            const inputDateObj = new Date(editedBlogData.date);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            if (inputDateObj > endOfToday || inputDateObj.getFullYear() > 9999) {
                caughtErrors.date = "Date cannot be in the future or exceed year 9999.";
                isCompromised = true;
            }
        }

        // 3. Dynamic Points check
        (editedBlogData.points || []).forEach((pt, pIdx) => {
            const tVal = (pt.title || '').trim();
            if (!tVal) {
                caughtErrors[`pointTitle_${pIdx}`] = "Point title is required.";
                isCompromised = true;
            } else if (!hasAtLeastOneLetter(tVal)) {
                caughtErrors[`pointTitle_${pIdx}`] = msg;
                isCompromised = true;
            }

            (pt.content || []).forEach((sub, cIdx) => {
                const sVal = (typeof sub === 'object' ? sub.text : sub || '').trim();
                if (!sVal) {
                    caughtErrors[`pointContent_${pIdx}_${cIdx}`] = "Bullet line is required.";
                    isCompromised = true;
                } else if (!hasAtLeastOneLetter(sVal)) {
                    caughtErrors[`pointContent_${pIdx}_${cIdx}`] = msg;
                    isCompromised = true;
                }
            });
        });

        if (isCompromised) {
            setEditErrors(caughtErrors);
            return; 
        }

        const confirmSave = window.confirm("Are you sure you want to save these changes?");
        if (!confirmSave) return;

        try {
            const formData = new FormData();

            formData.append('categoryName', editedBlogData.categoryName || '');
            formData.append('title', editedBlogData.title || '');
            formData.append('desc', editedBlogData.desc || '');
            formData.append('Status', editedBlogData.Status || 'Draft');
            formData.append('date', editedBlogData.date || '');
            formData.append('time', editedBlogData.time || '12:00 PM');

            const pointsToSend = (editedBlogData.points || []).map(point => ({
                title: point.title || '',
                content: (point.content || []).map(c => typeof c === 'object' ? (c.text || '') : (c || ''))
            }));
            formData.append('points', JSON.stringify(pointsToSend));

            if (thumbnailFile) {
                formData.append('Thumbnail', thumbnailFile);
            }

            const res = await api.put(`blogs/${selectedBlog.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const updatedBlog = res.data;

            setPublishedBlogs(prevBlogs => {
                const oldCat = selectedBlog.categoryName;
                const newCat = updatedBlog.categoryName;
                let updated = { ...prevBlogs };

                updated[oldCat] = (updated[oldCat] || []).filter(b => b.id !== selectedBlog.id);
                if (updated[oldCat].length === 0) delete updated[oldCat];

                updated[newCat] = [...(updated[newCat] || []), updatedBlog];
                return updated;
            });
            fetchBlogStats();

            setIsModalOpen(false);
            setIsEditMode(false);
            setThumbnailFile(null);
            setThumbnailPreview('');
        } catch (err) {
            console.error('Save failed:', err);
            if (err.response?.data) {
                alert(`Failed to save changes: ${JSON.stringify(err.response.data)}`);
            } else {
                alert('Failed to save changes.');
            }
        }
    };

    const handleDelete = async (categoryId, blogId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this post?");
        if (!confirmDelete) return;

        try {
            await api.delete(`blogs/${blogId}/`);
            setPublishedBlogs(prevBlogs => {
                const updated = { ...prevBlogs };
                updated[categoryId] = updated[categoryId].filter(b => b.id !== blogId);
                if (updated[categoryId].length === 0) delete updated[categoryId];
                return updated;
            });
            fetchBlogStats();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete blog post.');
        }
        setOpenMenu(null);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const flattenedBlogs = Object.entries(filteredBlogs).flatMap(([categoryName, blogList]) =>
        blogList.map(blog => ({ ...blog, mappedCategoryName: categoryName }))
    ).sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || "12:00 PM"}`);
        const dateB = new Date(`${b.date} ${b.time || "12:00 PM"}`);
        return dateB - dateA; 
    });

    const indexOfLastBlog = currentPage * itemsPerPage;
    const indexOfFirstBlog = indexOfLastBlog - itemsPerPage;
    const currentBlogs = flattenedBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
    const totalPages = Math.ceil(flattenedBlogs.length / itemsPerPage);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setActiveSearch(searchQuery);
    };

    const hasEditErrors = Object.values(editErrors).some(err => err !== '');

    return (
        <>
            {mode === "list" ? (
                <div className="admin-Blog-li-admin-blog-post">
                    <div className="admin-Blog-li-top-section">
                        <div className="admin-Blog-li-posts-header">
                            <div>
                                <h2>Posts</h2>
                                <p>Manage and organize all blog posts</p>
                            </div>

                            <button className="admin-Blog-li-create-btn" onClick={() => setmode("create")}>
                                + Create New
                            </button>
                        </div>

                        <div className="admin-Blog-li-post-cards">
                            <div className="admin-Blog-li-post-card">
                                <img src={AllPosts} alt="" />
                                <div>
                                    <h3>All Posts</h3>
                                    <span>{totalPostsCount}</span>
                                </div>
                            </div>
                            <div className="admin-Blog-li-post-card">
                                <img src={Published} alt="" />
                                <div>
                                    <h3>Published</h3>
                                    <span>{publishedCount}</span>
                                </div>
                            </div>
                            <div className="admin-Blog-li-post-card">
                                <img src={Drafts} alt="" />
                                <div>
                                    <h3>Drafts</h3>
                                    <span>{draftsCount}</span>
                                </div>
                            </div>
                            <div className="admin-Blog-li-post-card">
                                <img src={Trash} alt="" />
                                <div>
                                    <h3>Trash</h3>
                                    <span>{trashCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-Blog-li-table-section">
                        <form onSubmit={handleSearchSubmit} className="admin-Blog-li-table-actions">
                            <input
                                type="text"
                                placeholder="Search posts by title or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            <button type="submit" style={{ position: 'relative', right: "125px" }} className="admin-Blog-li-filter-btn">
                                <img src={Searchicon} alt="search" />
                            </button>
                        </form>

                        <div className="admin-Blog-li-posts-table-container">
                            <table className="admin-Blog-li-posts-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Categories</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {currentBlogs.length > 0 ? (
                                        currentBlogs.map((blog) => (
                                            <tr key={blog.id}>
                                                <td>
                                                    <div className="admin-Blog-li-title-cell">
                                                        <img src={blog.Thumbnail} alt={blog.title} />
                                                        <span>{blog.title}</span>
                                                    </div>
                                                </td>
                                                <td>{blog.mappedCategoryName}</td>
                                                <td>
                                                    {blog.date} <br />
                                                    {blog.time || "12:00 PM"}
                                                </td>
                                                <td>
                                                    <span className={(blog.Status) === "Published" ? "admin-Blog-li-status admin-Blog-li-published" : "admin-Blog-li-status admin-Blog-li-draft"}>
                                                        {blog.Status}
                                                    </span>
                                                </td>
                                                <td className="admin-Blog-li-menu-dot">
                                                    <img
                                                        src={threedots}
                                                        alt="Menu"
                                                        className="admin-Blog-li-threedots-icon"
                                                        onClick={() => { setOpenMenu(openMenu === blog.id ? null : blog.id); }}
                                                    />
                                                    {openMenu === blog.id && (
                                                        <div className="admin-Blog-li-dropdown-menu">
                                                            <div onClick={() => handleViewClick(blog.mappedCategoryName, blog)} className="admin-Blog-li-dropdown-item">View & Edit</div>
                                                            <div onClick={() => handleDelete(blog.mappedCategoryName, blog.id)} className="admin-Blog-li-dropdown-item">Delete</div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                No posts found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div className="admin-Blog-li-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px 0' }}>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                                    >
                                        &larr; Previous
                                    </button>

                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index + 1}
                                            onClick={() => setCurrentPage(index + 1)}
                                            style={{
                                                padding: '6px 12px',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '4px',
                                                backgroundColor: currentPage === index + 1 ? '#2563eb' : '#ffffff',
                                                color: currentPage === index + 1 ? '#ffffff' : '#334155',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                                    >
                                        Next &rarr;
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <AdminCreateBlog setmode={setmode} />
            )}

            {isModalOpen && (
                <div className="admin-blog-modal-overlay">
                    <div className="admin-blog-modal-content">
                        <div className="admin-blog-modal-header">
                            <h2>{isEditMode ? "Edit Blog Detail" : "View Blog Detail"}</h2>
                            {!isEditMode && (
                                <button className="admin-blog-modal-edit-btn" onClick={() => setIsEditMode(true)}>
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="admin-blog-modal-body">
                            <div className="modal-input-group">
                                <label>Thumbnail Image</label>
                                {thumbnailPreview && (
                                    <img src={thumbnailPreview} alt="preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                                )}
                                {isEditMode && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                                            if (file) {
                                                if (!validTypes.includes(file.type)) {
                                                    alert("Unsupported image format. Please upload a JPG, JPEG, or PNG file.");
                                                    e.target.value = '';
                                                    return;
                                                }
                                                if (file.size > 5 * 1024 * 1024) {
                                                    alert("Image size must be 5MB or less!");
                                                    e.target.value = '';
                                                    return;
                                                }
                                                setThumbnailFile(file);
                                                setThumbnailPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                )}
                            </div>

                            <div className="modal-input-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <label style={{ margin: 0 }}>Title</label>
                                    {isEditMode && <span style={{ fontSize: '12px', color: '#64748b' }}>{(editedBlogData.title || '').length}/30</span>}
                                </div>
                                <input
                                    type="text"
                                    name="title"
                                    value={editedBlogData.title || ''}
                                    onChange={handleInputChange}
                                    readOnly={!isEditMode}
                                    className={!isEditMode ? "readonly-input" : ""}
                                    maxLength="30"
                                    style={{ borderColor: editErrors.title ? '#dc3545' : '' }}
                                />
                                {editErrors.title && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>{editErrors.title}</div>}
                            </div>

                            {/* --- REPLACED PLAIN INPUT & INNER HEADING WITH FULL WIDTH CATEGORY SELECT --- */}
                            <div className="modal-input-group">
                                <label>Category</label>
                                {isEditMode ? (
                                    <select
                                        name="categoryName"
                                        value={editedBlogData.categoryName || ''}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '10px', border: '1px solid', borderColor: editErrors.categoryName ? '#dc3545' : '#cbd5e1', borderRadius: '4px', backgroundColor: '#fff', fontSize: '14px', color: '#333' }}
                                    >
                                        <option value="">Select a Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.label}>{cat.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        name="categoryName"
                                        value={editedBlogData.categoryName || ''}
                                        readOnly
                                        className="readonly-input"
                                        style={{ borderColor: editErrors.categoryName ? '#dc3545' : '' }}
                                    />
                                )}
                                {editErrors.categoryName && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>{editErrors.categoryName}</div>}
                            </div>

                            <div className="modal-input-group">
                                <label>Description</label>
                                <textarea
                                    name="desc"
                                    value={editedBlogData.desc || ''}
                                    onChange={handleInputChange}
                                    readOnly={!isEditMode}
                                    rows="3"
                                    className={!isEditMode ? "readonly-input" : ""}
                                    style={{ borderColor: editErrors.desc ? '#dc3545' : '' }}
                                />
                                {editErrors.desc && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>{editErrors.desc}</div>}
                            </div>

                            <div className="modal-input-group">
                                <div className="modal-section-title-bar">
                                    <label className="section-main-label">Blog Key Points & Elements</label>
                                    {isEditMode && (
                                        <button type="button" className="modal-add-main-point-btn" onClick={handleAddMainPoint}>
                                            + Add New Heading Point
                                        </button>
                                    )}
                                </div>

                                <div className="modal-nested-points-container">
                                    {editedBlogData.points?.map((point, pIndex) => (
                                        <div key={pIndex} className="nested-point-box">
                                            <div className="nested-point-header">
                                                <span className="point-number-badge">Point #{pIndex + 1}</span>
                                                <div style={{ flex: 1 }}>
                                                    <input
                                                        type="text"
                                                        value={point.title}
                                                        placeholder="Point Title (e.g., Hook readers instantly)"
                                                        onChange={(e) => handlePointTitleChange(pIndex, e.target.value)}
                                                        readOnly={!isEditMode}
                                                        className={`point-title-input ${!isEditMode ? "readonly-input" : ""}`}
                                                        style={{ width: '100%', borderColor: editErrors[`pointTitle_${pIndex}`] ? '#dc3545' : '' }}
                                                    />
                                                    {editErrors[`pointTitle_${pIndex}`] && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>{editErrors[`pointTitle_${pIndex}`]}</div>}
                                                </div>
                                                {isEditMode && editedBlogData.points.length > 1 && (
                                                    <button type="button" className="remove-main-point-btn" onClick={() => handleRemoveMainPoint(pIndex)}>
                                                        Remove Block
                                                    </button>
                                                )}
                                            </div>

                                            <div className="nested-subcontent-list">
                                                {point.content?.map((text, cIndex) => (
                                                    <div key={cIndex} style={{ width: '100%' }}>
                                                        <div className="subcontent-item-row">
                                                            <span className="bullet-dot">•</span>
                                                            <textarea
                                                                value={typeof text === 'object' ? text.text : text}
                                                                placeholder="Content detail line..."
                                                                onChange={(e) => handleContentTextChange(pIndex, cIndex, e.target.value)}
                                                                readOnly={!isEditMode}
                                                                rows="2"
                                                                className={`subcontent-textarea ${!isEditMode ? "readonly-input" : ""}`}
                                                                style={{ borderColor: editErrors[`pointContent_${pIndex}_${cIndex}`] ? '#dc3545' : '' }}
                                                            />
                                                            {isEditMode && point.content.length > 1 && (
                                                                <button type="button" className="remove-sub-btn" onClick={() => handleRemoveSubContent(pIndex, cIndex)}>
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                        {editErrors[`pointContent_${pIndex}_${cIndex}`] && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '2px', paddingLeft: '15px', fontWeight: '500' }}>{editErrors[`pointContent_${pIndex}_${cIndex}`]}</div>}
                                                    </div>
                                                ))}
                                                {isEditMode && (
                                                    <button type="button" className="add-sub-line-btn" onClick={() => handleAddSubContent(pIndex)}>
                                                        + Add Description Line
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-input-row">
                                <div className="modal-input-group">
                                    <label>Date</label>
                                    {isEditMode ? (
                                        <input
                                            type="date"
                                            name="date"
                                            max={getTodayYYYYMMDD()}
                                            value={convertToInputDate(editedBlogData.date)}
                                            onChange={handleInputChange}
                                            style={{ borderColor: editErrors.date ? '#dc3545' : '' }}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            name="date"
                                            value={editedBlogData.date || ''}
                                            readOnly
                                            className="readonly-input"
                                        />
                                    )}
                                    {editErrors.date && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>{editErrors.date}</div>}
                                </div>
                                <div className="modal-input-group">
                                    <label>Status</label>
                                    {isEditMode ? (
                                        <select name="Status" value={editedBlogData.Status || 'Published'} onChange={handleInputChange}>
                                            <option value="Published">Published</option>
                                            <option value="Draft">Draft</option>
                                        </select>
                                    ) : (
                                        <input type="text" value={editedBlogData.Status || editedBlogData.status || 'Published'} readOnly className="readonly-input" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="admin-blog-modal-footer">
                            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>Close</button>
                            {isEditMode && (
                                <button
                                    className="modal-save-btn"
                                    onClick={handleSaveChanges}
                                    disabled={hasEditErrors}
                                    style={{
                                        opacity: hasEditErrors ? 0.6 : 1,
                                        cursor: hasEditErrors ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};