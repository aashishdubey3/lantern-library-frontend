import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { PenTool, Send, Loader2 } from 'lucide-react';

export default function Write() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('literature');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const quillRef = useRef(null);
  const navigate = useNavigate();

  // 🔥 THE CLOUDINARY INTERCEPTOR
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      setIsUploadingImage(true);

      const formData = new FormData();
      formData.append('file', file);
      
      // Your specific Unsigned Upload Preset
      formData.append('upload_preset', 'lantern_articles'); 

      try {
        // Your specific Cloudinary Vault URL
        const res = await fetch('https://api.cloudinary.com/v1_1/dfugne8fq/image/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.error?.message || 'Upload failed');
        }

        const imageUrl = data.secure_url;

        // Force Quill to insert the Cloudinary URL at the cursor position
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', imageUrl);
        
        // Move cursor to the next line after the image
        quill.setSelection(range.index + 1);
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploadingImage(false);
      }
    };
  };

  // We use useMemo so Quill doesn't re-render and lose focus every time you type
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link', 'image'], 
        ['clean']
      ],
      handlers: {
        image: imageHandler // Bind our custom Cloudinary function to the default image button
      }
    }
  }), []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert("Title and content are required.");
    
    setIsPublishing(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('https://lantern-library-backend.onrender.com/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, category })
      });

      if (res.ok) {
        navigate('/');
      } else {
        alert("Failed to publish article.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <PenTool size={40} color="var(--lantern-gold)" strokeWidth={1.5} style={{ marginBottom: '15px' }} />
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', margin: '0 0 10px 0' }}>Draft a Manuscript</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Share your thoughts, reviews, or academic research with the archives.</p>
      </div>

      <div className="glass-card animate-cascade-1" style={{ padding: '30px', borderRadius: '16px' }}>
        
        <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Manuscript Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Symbolism of the Green Light in Gatsby..."
              style={{ width: '100%', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Archive Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', fontSize: '1rem', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <option value="literature">Classic Literature</option>
              <option value="philosophy">Philosophy</option>
              <option value="psychology">Psychology</option>
              <option value="technology">Technology & Future</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
              <span>The Text</span>
              {isUploadingImage && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--lantern-gold)', fontSize: '0.8rem' }}><Loader2 size={14} className="lucide-spin" /> Uploading Image...</span>}
            </label>
            
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <ReactQuill 
                ref={quillRef}
                theme="snow" 
                value={content} 
                onChange={setContent} 
                modules={modules}
                placeholder="Write your masterpiece here... Use the image icon above to insert photos."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={isPublishing || isUploadingImage}
              className="lantern-search-btn"
              style={{ 
                padding: '14px 30px', borderRadius: '30px', fontSize: '1.05rem', fontWeight: 'bold', 
                display: 'flex', alignItems: 'center', gap: '10px', opacity: (isPublishing || isUploadingImage) ? 0.7 : 1,
                cursor: (isPublishing || isUploadingImage) ? 'not-allowed' : 'pointer'
              }}
            >
              {isPublishing ? 'Binding Pages...' : 'Publish to Archive'} <Send size={18} />
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}