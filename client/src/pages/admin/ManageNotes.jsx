import React, { useState, useEffect } from 'react';
import { getAllNotes, createNote, deleteNote } from '../../api/noteApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiPlus, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helpers';

const ManageNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '', price: 0, isFree: false, subject: '', level: 'Class 10', chapterTitle: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchNotes = async () => {
    try {
      const res = await getAllNotes();
      setNotes(res.data.notes || []);
    } catch (err) {
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }
    
    setUploadLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('isFree', formData.isFree);
      data.append('subject', formData.subject);
      data.append('level', formData.level);
      data.append('chapterTitle', formData.chapterTitle);
      data.append('file', selectedFile);
      
      await createNote(data);
      toast.success('Note uploaded successfully');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', price: 0, isFree: false, subject: '', level: 'Class 10', chapterTitle: '' });
      setSelectedFile(null);
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading note');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        toast.success('Note deleted');
        fetchNotes();
      } catch (err) {
        toast.error('Error deleting note');
      }
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Notes</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Upload Note
        </button>
      </div>

      <div className="card-glass" style={{ padding: '1.5rem' }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Title</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Price</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>File Info</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(note => (
                <tr key={note._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0' }}>{note.title}</td>
                  <td style={{ padding: '1rem 0' }}>{note.isFree ? 'Free' : formatPrice(note.price)}</td>
                  <td style={{ padding: '1rem 0' }}>PDF</td>
                  <td style={{ padding: '1rem 0', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleDelete(note._id)} className="btn btn-sm btn-danger" style={{ padding: '0.5rem' }}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload New Note">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title (e.g. PDF 1: Formula Sheet or Chapter Notes)</label>
            <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. PDF 1: Handwritten Topper Notes" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input type="text" className="form-input" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="e.g. Mathematics or Physics" />
            </div>
            <div className="form-group">
              <label className="form-label">Chapter / Topic</label>
              <input type="text" className="form-input" value={formData.chapterTitle} onChange={e => setFormData({...formData, chapterTitle: e.target.value})} placeholder="e.g. Chapter 1: Real Numbers" />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="2" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief overview of the PDF"></textarea>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Price</label>
              <input type="number" className="form-input" disabled={formData.isFree} value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                <span>Is Free</span>
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">PDF File</label>
            <input type="file" accept=".pdf" className="form-input" required onChange={e => setSelectedFile(e.target.files[0])} />
            {selectedFile && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={uploadLoading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploadLoading}>
              {uploadLoading ? 'Uploading...' : 'Upload Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageNotes;
