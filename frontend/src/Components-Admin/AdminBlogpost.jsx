import React, { useState } from 'react';
import './AdminBlogPost.css';
import Trash from '../assets/AdminAssets/TrashIcon.png';
import Filter from '../assets/AdminAssets/Filter.png';
import Drafts from '../assets/AdminAssets/Draft.png';
import Published from '../assets/AdminAssets/PublishedBlog.png';
import AllPosts from '../assets/AdminAssets/AllPosts.png';
import threedots from '../assets/ThreeDots.png';
import { useJobs } from '../JobContext';
import Searchicon from '../assets/icon_search.png'
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
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');

    const totalPostsCount = blogStats.total;
    const publishedCount = blogStats.published;
    const draftsCount = blogStats.drafts;
    const trashCount = blogStats.trash;

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

    const handlePointTitleChange = (pointIndex, value) => {
        const updatedPoints = [...editedBlogData.points];
        updatedPoints[pointIndex].title = value;
        setEditedBlogData(prev => ({ ...prev, points: updatedPoints }));
    };

    const handleContentTextChange = (pointIndex, contentIndex, value) => {
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

    const handleViewClick = (categoryName, blog) => {
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
        setIsModalOpen(true);
        setOpenMenu(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedBlogData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveChanges = async () => {
        const confirmSave = window.confirm("Sure to save?");
        if (!confirmSave) return;

        try {
            const formData = new FormData();
            
            // Add basic fields
            formData.append('categoryName', editedBlogData.categoryName || '');
            formData.append('title', editedBlogData.title || '');
            formData.append('heading', editedBlogData.heading || '');
            formData.append('desc', editedBlogData.desc || '');
            formData.append('Status', editedBlogData.Status || 'Draft');
            formData.append('date', editedBlogData.date || '');
            formData.append('time', editedBlogData.time || '12:00 PM');
            
            // Convert points to JSON string
            const pointsToSend = (editedBlogData.points || []).map(point => ({
                title: point.title || '',
                content: (point.content || []).map(c => typeof c === 'object' ? (c.text || '') : (c || ''))
            }));
            formData.append('points', JSON.stringify(pointsToSend));
            
            // Only send thumbnail if a new file was selected
            if (thumbnailFile) {
                formData.append('Thumbnail', thumbnailFile);
            }

            const res = await api.put(`blogs/${selectedBlog.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const updatedBlog = res.data;

            // refresh grouped state
            setPublishedBlogs(prevBlogs => {
                const oldCat = selectedBlog.categoryName;
                const newCat = updatedBlog.categoryName;
                let updated = { ...prevBlogs };

                // remove from old category
                updated[oldCat] = (updated[oldCat] || []).filter(b => b.id !== selectedBlog.id);
                if (updated[oldCat].length === 0) delete updated[oldCat];

                // add to new category
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

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setActiveSearch(searchQuery);
    };

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

                            <button
                                className="admin-Blog-li-create-btn"
                                onClick={() => setmode("create")}
                            >
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

                            <button
                                type="submit"
                                style={{ position: 'relative', right: "125px" }}
                                className="admin-Blog-li-filter-btn"
                            >
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
                                    {Object.entries(filteredBlogs).reverse().flatMap(([categoryName, blogList]) =>
                                        blogList.map((blog) => (
                                            <tr key={blog.id}>
                                                <td>
                                                    <div className="admin-Blog-li-title-cell">
                                                        <img src={blog.Thumbnail} alt={blog.title} />
                                                        <span>{blog.title}</span>
                                                    </div>
                                                </td>
                                                <td>{categoryName}</td>
                                                <td>
                                                    {blog.date} <br />
                                                    {blog.time || "12:00 PM"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={
                                                            (blog.Status) === "Published"
                                                                ? "admin-Blog-li-status admin-Blog-li-published"
                                                                : "admin-Blog-li-status admin-Blog-li-draft"
                                                        }
                                                    >
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
                                                            <div onClick={() => handleViewClick(categoryName, blog)} className="admin-Blog-li-dropdown-item">View & Edit</div>
                                                            <div onClick={() => handleDelete(categoryName, blog.id)} className="admin-Blog-li-dropdown-item">Delete</div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <div className="admin-Blog-li-view-more">View more...</div>
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
                                    <img src={thumbnailPreview} alt="preview"
                                        style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                                )}
                                {isEditMode && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setThumbnailFile(file);
                                                setThumbnailPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                )}
                                <label>Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={editedBlogData.title || ''}
                                    onChange={handleInputChange}
                                    readOnly={!isEditMode}
                                    className={!isEditMode ? "readonly-input" : ""}
                                />
                            </div>

                            <div className="modal-input-row">
                                <div className="modal-input-group">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        name="categoryName"
                                        value={editedBlogData.categoryName || ''}
                                        onChange={handleInputChange}
                                        readOnly={!isEditMode}
                                        className={!isEditMode ? "readonly-input" : ""}
                                    />
                                </div>
                                <div className="modal-input-group">
                                    <label>Inner Heading</label>
                                    <input
                                        type="text"
                                        name="heading"
                                        value={editedBlogData.heading || ''}
                                        onChange={handleInputChange}
                                        readOnly={!isEditMode}
                                        className={!isEditMode ? "readonly-input" : ""}
                                    />
                                </div>
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
                                />
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
                                                <input
                                                    type="text"
                                                    value={point.title}
                                                    placeholder="Point Title (e.g., Hook readers instantly)"
                                                    onChange={(e) => handlePointTitleChange(pIndex, e.target.value)}
                                                    readOnly={!isEditMode}
                                                    className={`point-title-input ${!isEditMode ? "readonly-input" : ""}`}
                                                />
                                                {isEditMode && editedBlogData.points.length > 1 && (
                                                    <button type="button" className="remove-main-point-btn" onClick={() => handleRemoveMainPoint(pIndex)}>
                                                        Remove Block
                                                    </button>
                                                )}
                                            </div>

                                            <div className="nested-subcontent-list">
                                                {point.content?.map((text, cIndex) => (
                                                    <div key={cIndex} className="subcontent-item-row">
                                                        <span className="bullet-dot">•</span>
                                                        <textarea
                                                            value={typeof text === 'object' ? text.text : text}
                                                            placeholder="Content detail line..."
                                                            onChange={(e) => handleContentTextChange(pIndex, cIndex, e.target.value)}
                                                            readOnly={!isEditMode}
                                                            rows="2"
                                                            className={`subcontent-textarea ${!isEditMode ? "readonly-input" : ""}`}
                                                        />
                                                        {isEditMode && point.content.length > 1 && (
                                                            <button type="button" className="remove-sub-btn" onClick={() => handleRemoveSubContent(pIndex, cIndex)}>
                                                                ✕
                                                            </button>
                                                        )}
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
                                    <input type="text" name="date" value={editedBlogData.date || ''} onChange={handleInputChange} readOnly={!isEditMode} className={!isEditMode ? "readonly-input" : ""} />
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
                                <button className="modal-save-btn" onClick={handleSaveChanges}>Save Changes</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};