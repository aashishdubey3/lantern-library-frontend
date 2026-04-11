import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 

export default function Write() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔥 Catch the article if we clicked "Edit" from the Profile page
  const editingArticle = location.state?.article || null;

  // Pre-fill the state if we are editing!
  const [title, setTitle] = useState(editingArticle ? editingArticle.title : '');
  const [content, setContent] = useState(editingArticle ? editingArticle.content : '');
  const [tags, setTags] = useState(editingArticle && editingArticle.tags ? editingArticle.tags.join(', ') : '');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert("Title and content are required.");
    
    setIsPublishing(true);
    const token = localStorage.getItem('token');
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    // If editing, use the PUT route. If new, use the POST route.
    const url = editingArticle 
      ? `https://lantern-library-backend.onrender.com/api/articles/${editingArticle._id}` 
      : 'https://lantern-library-backend.onrender.com/api/articles/create';
      
    const method = editingArticle ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title, content, tags: tagArray })
      });

      if (response.ok) {
        alert(editingArticle ? "✨ Manuscript updated!" : "✨ Manuscript published to the archives!");
        navigate('/profile'); // Send them back to their profile to see it!
      } else {
        alert("Failed to save.");
      }
    } catch (error) {
      alert("Server error.");
    } finally {
      setIsPublishing(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--lantern-gold)', marginBottom: '10px' }}>
          {editingArticle ? 'Revise Manuscript' : 'The Scriptorium'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          {editingArticle ? 'Make your edits below and seal the ink.' : 'Pen your thoughts, reviews, and literary theories.'}
        </p>
      </div>

      <form onSubmit={handlePublish} style={{ background: 'var(--bg-panel)', padding: '30px', borderRadius: '12px', border: '1px solid #2c3e50', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        
        <input 
          type="text" 
          placeholder="Title of your manuscript..." 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '15px', fontSize: '1.5rem', background: 'var(--bg-deep)', color: 'var(--text-main)', border: '1px solid #34495e', borderRadius: '8px', marginBottom: '20px', outline: 'none' }}
        />

        <input 
          type="text" 
          placeholder="Tags (e.g., Sci-Fi, Review, Dune) - separate with commas" 
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          style={{ width: '100%', padding: '12px', fontSize: '1rem', background: 'var(--bg-deep)', color: 'var(--text-main)', border: '1px solid #34495e', borderRadius: '8px', marginBottom: '20px', outline: 'none' }}
        />

        <div style={{ background: '#ecf0f1', color: 'black', borderRadius: '8px', overflow: 'hidden', marginBottom: '25px' }}>
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={setContent} 
            modules={modules}
            style={{ height: '300px', border: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '50px' }}>
          <button 
            type="submit" 
            disabled={isPublishing}
            style={{ padding: '12px 30px', background: 'var(--lantern-gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isPublishing ? 'not-allowed' : 'pointer' }}
          >
            {isPublishing ? 'Sealing the ink...' : (editingArticle ? 'Update Manuscript' : 'Publish to Archives')}
          </button>
        </div>

      </form>
    </div>
  );
}