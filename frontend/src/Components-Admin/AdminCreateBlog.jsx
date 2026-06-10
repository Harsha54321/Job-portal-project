import React, { useState, useEffect } from 'react';
import './AdminCreateBlog.css';
import { AdminHeader } from './AdminHeader';
import { useJobs } from '../JobContext';
import api from '../api/axios';

export const AdminCreateBlog = ({ setmode }) => {
  const { publishedBlogs, setPublishedBlogs } = useJobs();
  const [categories, setCategories] = useState([]);

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

  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    blogTitle: '',
    blogDescription: '',
    selectedCategory: '',
    thumbnail: null,  // Store File object, NOT preview URL
    previewUrl: '',
    modalHeading: '',
    modalDescription: ''
  });

  const [pointsList, setPointsList] = useState([]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData((prev) => ({
      ...prev,
      modalHeading: '',
      modalDescription: ''
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        thumbnail: file,  // Store the actual File object
        previewUrl: URL.createObjectURL(file)  // Only for preview
      }));
    }
  };

  const handleSavePoints = (e) => {
    e.preventDefault();
    const { modalHeading, modalDescription } = formData;

    if (modalHeading.trim() !== '' && modalDescription.trim() !== '') {
      const bulletPoints = modalDescription
        .split('\n')
        .filter(item => item.trim() !== '');

      const newPoint = {
        title: modalHeading.trim(),
        content: bulletPoints
      };

      setPointsList([...pointsList, newPoint]);
      closeModal();
    }
  };

  const handleDeletePoint = (indexToRemove) => {
    setPointsList(pointsList.filter((_, index) => index !== indexToRemove));
  };

  const handleAddNewCategory = async () => {
    const formattedName = newCategoryName.trim();
    if (formattedName === '') return;

    const isDuplicate = categories.some(
      (cat) => cat.label.toLowerCase() === formattedName.toLowerCase()
    );
    if (isDuplicate) {
      alert("This category name already exists!");
      return;
    }

    try {
      const res = await api.post('blog-categories/', { name: formattedName });
      setCategories(prev => [...prev, { id: res.data.name, label: res.data.name }]);
      setNewCategoryName('');
      setIsAdding(false);
    } catch (err) {
      console.error('Category create failed:', err);
      alert('Failed to create category.');
    }
  };

  const handleDeleteCategory = async (categoryId, categoryLabel) => {
    const confirm = window.confirm(`Delete "${categoryLabel}" category and ALL its blogs?`);
    if (!confirm) return;

    try {
      const res = await api.get('blog-categories/');
      const match = res.data.find(c => c.name === categoryLabel);
      if (match) {
        await api.delete(`blog-categories/${match.id}/`);
      }
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setPublishedBlogs(prev => {
        const updated = { ...prev };
        delete updated[categoryLabel];
        return updated;
      });
      if (formData.selectedCategory === categoryId) {
        setFormData(prev => ({ ...prev, selectedCategory: '' }));
      }
    } catch (err) {
      console.error('Category delete failed:', err);
      alert('Failed to delete category.');
    }
  };

  const handleSaveDraft = async () => {
    const { selectedCategory, blogTitle, blogDescription, thumbnail } = formData;
    const isAnyFieldFilled = selectedCategory || blogTitle.trim() || blogDescription.trim() || thumbnail || pointsList.length > 0;

    if (!isAnyFieldFilled) { 
      alert("No content to save as draft!"); 
      setmode('list'); 
      return; 
    }

    if (!selectedCategory) {
      alert("Please select a category!");
      return;
    }

    const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory);
    const fullCategoryName = selectedCategoryObj ? selectedCategoryObj.label : 'Unknown';
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    const formattedDate = new Date().toLocaleDateString('en-US', options).replace(/,/g, '');
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const formDataToSend = new FormData();
    formDataToSend.append('categoryName', fullCategoryName);
    formDataToSend.append('title', blogTitle.trim() || 'Untitled Draft');
    formDataToSend.append('desc', blogDescription.trim());
    formDataToSend.append('date', formattedDate);
    formDataToSend.append('time', formattedTime);
    formDataToSend.append('Status', 'Draft');
    formDataToSend.append('points', JSON.stringify(pointsList));
    
    // ✅ CRITICAL: Send the actual File object, not the preview URL
    if (thumbnail) {
      formDataToSend.append('Thumbnail', thumbnail);
    } else {
      alert("Please upload a thumbnail image!");
      return;
    }

    try {
      const res = await api.post('blogs/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newBlog = res.data;

      setPublishedBlogs(prev => ({
        ...prev,
        [fullCategoryName]: [...(prev[fullCategoryName] || []), newBlog]
      }));

      alert("Draft saved successfully!");
      setmode('list');
    } catch (err) {
      console.error('Draft save failed:', err);
      alert('Failed to save draft.');
    }
  };

  const handlePublishPost = async () => {
    const { selectedCategory, blogTitle, blogDescription, thumbnail } = formData;

    if (!selectedCategory) { 
      alert("Please select a category first!"); 
      return; 
    }
    if (!blogTitle.trim() || !blogDescription.trim()) { 
      alert("Title and description are required!"); 
      return; 
    }
    if (!thumbnail) {
      alert("Please upload a thumbnail image!");
      return;
    }

    const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory);
    const fullCategoryName = selectedCategoryObj ? selectedCategoryObj.label : 'Unknown';
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    const formattedDate = new Date().toLocaleDateString('en-US', options).replace(/,/g, '');
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const formDataToSend = new FormData();
    formDataToSend.append('categoryName', fullCategoryName);
    formDataToSend.append('title', blogTitle.trim());
    formDataToSend.append('desc', blogDescription.trim());
    formDataToSend.append('date', formattedDate);
    formDataToSend.append('time', formattedTime);
    formDataToSend.append('Status', 'Published');
    formDataToSend.append('points', JSON.stringify(pointsList));
    
    // ✅ CRITICAL: Send the actual File object
    formDataToSend.append('Thumbnail', thumbnail);

    try {
      const res = await api.post('blogs/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newBlog = res.data;

      setPublishedBlogs(prev => ({
        ...prev,
        [fullCategoryName]: [...(prev[fullCategoryName] || []), newBlog]
      }));

      // Reset form
      setFormData({ 
        blogTitle: '', 
        blogDescription: '', 
        selectedCategory: '', 
        thumbnail: null, 
        previewUrl: '', 
        modalHeading: '', 
        modalDescription: '' 
      });
      setPointsList([]);
      
      alert("Post published successfully!");
      setmode('list');
    } catch (err) {
      console.error('Publish failed:', err);
      alert('Failed to publish post.');
    }
  };

  return (
    <>
      <div className="Admin-Blog-Cr-page-title-div">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: "0" }}>Create New Blog</h2>
          <button type="button" onClick={() => { setmode('list') }} className="Admin-Blog-back-btn">Back to List</button>
        </div>
        <p>Add a new blog post. Fill in the details below and publish your post.</p>
      </div>

      <div className="Admin-Blog-Cr-content-grid">
        <div className="Admin-Blog-Cr-form-column">
          <div className="Admin-Blog-Cr-card-panel">
            <div className="Admin-Blog-Cr-form-group">
              <label htmlFor="blogTitle">Blog Title<span className="Admin-Blog-Cr-required">*</span></label>
              <input
                type="text"
                id="blogTitle"
                placeholder="Enter blog title"
                value={formData.blogTitle}
                onChange={handleInputChange}
              />
            </div>

            <div className="Admin-Blog-Cr-form-group">
              <label htmlFor="blogDescription">Description<span className="Admin-Blog-Cr-required">*</span></label>
              <div className="Admin-Blog-Cr-text-editor-container">
                <textarea
                  id="blogDescription"
                  placeholder="Enter your blog content here..."
                  rows="10"
                  value={formData.blogDescription}
                  onChange={handleInputChange}
                ></textarea>
                <div className="Admin-Blog-Cr-editor-footer">
                  <span>Word count: {formData.blogDescription.split(/\s+/).filter(Boolean).length}</span>
                </div>
              </div>
            </div>

            {/* Points Section */}
            <div className="Admin-Blog-Cr-form-group Admin-Blog-Cr-points-group" style={{ fontFamily: 'Arial, sans-serif' }}>
              <div style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>
                Points<span className="Admin-Blog-Cr-required" style={{ color: 'red', marginLeft: '4px' }}>*</span>
              </div>

              <button
                type="button"
                onClick={openModal}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
              >
                + Add Heading & Description
              </button>

              {pointsList.length > 0 && (
                <div className="Admin-Blog-Cr-points-display" style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                  {pointsList.map((item, index) => (
                    <div key={index} style={{ marginBottom: '25px', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => handleDeletePoint(index)}
                        style={{ position: 'absolute', right: '0', top: '0', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Delete Section
                      </button>

                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: '0 0 10px 0' }}>
                        {index + 1}. {item.title}
                      </h3>

                      <ul style={{ paddingLeft: '20px', margin: '0', listStyleType: 'disc' }}>
                        {item.content.map((subPoint, subIndex) => (
                          <li key={subIndex} style={{ color: '#555', marginBottom: '6px', fontSize: '14px', lineHeight: '1.5' }}>
                            {subPoint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              <p className="Admin-Blog-Cr-field-instruction" style={{ color: '#666', fontSize: '13px', marginTop: '10px' }}>
                Points are hand-crafted key highlights of your content.
              </p>

              {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                  <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '500px', maxWidth: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Add New Section</h2>

                    <form onSubmit={handleSavePoints}>
                      <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="modalHeading" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Heading</label>
                        <input
                          type="text"
                          id="modalHeading"
                          placeholder="e.g., Hook readers instantly"
                          value={formData.modalHeading}
                          onChange={handleInputChange}
                          required
                          style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="modalDescription" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                        <textarea
                          id="modalDescription"
                          rows="6"
                          placeholder="Start strong...&#10;Use formulas...&#10;Deliver intent..."
                          value={formData.modalDescription}
                          onChange={handleInputChange}
                          required
                          style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={closeModal}
                          style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Save Points
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions Row */}
            <div className="Admin-Blog-Cr-form-actions-row">
              <button type="button" className="Admin-Blog-Cr-btn Admin-Blog-Cr-btn-secondary-save" onClick={handleSaveDraft}>Save Draft</button>
              <button
                type="button"
                className="Admin-Blog-Cr-btn Admin-Blog-Cr-btn-publish"
                onClick={handlePublishPost}
              >
                Publish Post
              </button>
            </div>
          </div>
        </div>

        <div className="Admin-Blog-Cr-sidebar-column">
          <div className="Admin-Blog-Cr-card-panel Admin-Blog-Cr-widget-card">
            <h3>Categories</h3>
            <hr className="Admin-Blog-Cr-divider" />

            <div className="Admin-Blog-Cr-categories-list">
              {categories.map((category) => (
                <label className="Admin-Blog-Cr-checkbox-item" key={category.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <input
                      type="radio"
                      name="blog-category"
                      checked={formData.selectedCategory === category.id}
                      onChange={() => setFormData(prev => ({ ...prev, selectedCategory: category.id }))}
                    />
                    <span style={{ marginLeft: '6px' }}>{category.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id, category.label)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                    title="Delete category"
                  >
                    ✕
                  </button>
                </label>
              ))}
            </div>

            {isAdding ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Enter New Category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '4px', flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
                >
                  close
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="Admin-Blog-Cr-add-category-btn"
                onClick={() => setIsAdding(true)}
                style={{ marginTop: '10px' }}
              >
                + Add New Category
              </button>
            )}
          </div>

          <div className="Admin-Blog-Cr-card-panel Admin-Blog-Cr-widget-card">
            <h3>Thumbnail Image</h3>
            <hr className="Admin-Blog-Cr-divider" />

            <input
              type="file"
              id='thumbnailUpload'
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            <label
              htmlFor='thumbnailUpload'
              className="Admin-Blog-Cr-upload-dropzone"
              style={{ display: 'block', cursor: 'pointer', border: '2px dashed #cbd5e1', padding: '20px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' }}
            >
              {formData.previewUrl ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={formData.previewUrl}
                    alt="Thumbnail Preview"
                    style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <p style={{ fontSize: '12px', color: '#2563eb', marginTop: '5px', fontWeight: 'bold' }}>
                    Change Image
                  </p>
                </div>
              ) : (
                <>
                  <p className="Admin-Blog-Cr-upload-text" style={{ fontWeight: '500', margin: '5px 0' }}>
                    Click to upload image
                  </p>
                  <p className="Admin-Blog-Cr-upload-hint" style={{ fontSize: '12px', color: '#64748b' }}>
                    Recommended Size : 1200x630px
                  </p>
                </>
              )}
            </label>
          </div>
        </div>
      </div>
    </>
  );
};