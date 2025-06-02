// src/pages/PanelEditor.jsx (cleaned and styled)
import { useState } from 'react';
import '/Users/nyxiridessa/pandoryx-bot/dashboard/frontend/PanelEditor.css';

function PanelEditor({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    color: '#5865F2',
    emoji: '',
    categoryId: '',
    transcriptsEnabled: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="panel-editor-container">
      <h2>🎟️ Ticket Panels</h2>
      <div className="panel-editor-form">
        <h3>Create Panel</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
          <div className="form-grid">
            <label>
              Panel Name:
              <input name="name" value={formData.name} onChange={handleChange} required />
            </label>
            <label>
              Embed Title:
              <input name="title" value={formData.title} onChange={handleChange} />
            </label>
            <label>
              Embed Description:
              <textarea name="description" value={formData.description} onChange={handleChange} />
            </label>
            <label>
              Embed Color (hex):
              <input name="color" value={formData.color} onChange={handleChange} type="color" />
            </label>
            <label>
              Emoji (optional):
              <input name="emoji" value={formData.emoji} onChange={handleChange} />
            </label>
            <label>
              Category ID for new tickets:
              <input name="categoryId" value={formData.categoryId} onChange={handleChange} />
            </label>
            <label className="checkbox">
              Enable Transcripts:
              <input name="transcriptsEnabled" type="checkbox" checked={formData.transcriptsEnabled} onChange={handleChange} />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>

      <div className="panel-preview">
        <h3>Live Preview</h3>
        <div className="embed-preview" style={{ borderLeftColor: formData.color }}>
          <div className="embed-title">{formData.title || 'Embed Title'}</div>
          <div className="embed-description">{formData.description || 'Embed description will appear here.'}</div>
        </div>
        <button className="embed-button">
          {formData.emoji && <span>{formData.emoji} </span>}Open Ticket
        </button>
      </div>
    </div>
  );
}

export default PanelEditor;