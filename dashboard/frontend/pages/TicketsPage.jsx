// pages/TicketsPage.jsx
import React, { useEffect, useState } from 'react';
import PanelEditor from './../src/components/PanelEditor';

export default function TicketsPage() {
  const [panels, setPanels] = useState([]);
  const [editingPanel, setEditingPanel] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    fetchPanels();
  }, []);

  const fetchPanels = async () => {
    const res = await fetch('/api/panels');
    const data = await res.json();
    setPanels(data);
  };

  const handleEdit = (panel) => {
    setEditingPanel(panel);
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditingPanel(null);
    setShowEditor(true);
  };

  const handleDelete = async (panelId) => {
    await fetch(`/api/panels/${panelId}`, { method: 'DELETE' });
    fetchPanels();
  };

  const handleSave = async (panelData) => {
    const method = editingPanel ? 'PUT' : 'POST';
    const endpoint = editingPanel ? `/api/panels/${editingPanel._id}` : '/api/panels';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(panelData)
    });

    setShowEditor(false);
    fetchPanels();
  };

  return (
    <div className="tickets-page">
      <h1>Ticket Panels</h1>

      {!showEditor && (
        <>
          <button onClick={handleNew}>+ New Panel</button>
          <ul>
            {panels.map(panel => (
              <li key={panel._id}>
                <strong>{panel.name}</strong> – {panel.embed?.title}
                <button onClick={() => handleEdit(panel)}>Edit</button>
                <button onClick={() => handleDelete(panel._id)}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {showEditor && (
        <PanelEditor
          panel={editingPanel}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}