import { useEffect, useState } from 'react';

function WarningsViewer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/warnings')
      .then(res => res.json())
      .then(json => {
        setData(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load warnings:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading warnings...</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>⚠️ User Warnings</h2>
      {data.length === 0 && <p>No warnings found.</p>}

      {data.map((user) => (
        <div
          key={user._id}
		  style={{
  			border: '1px solid #5e3a7c',
  			borderRadius: '10px',
  			margin: '1rem 0',
  			padding: '1.5rem',
  			background: '#3d2a55',
  			color: '#f5f0ff',
  			boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
		  }}

        >
          <h3>User ID: {user.userId}</h3>
          <p>Guild ID: {user.guildId}</p>
          <ul>
            {user.warns.map((warn, index) => (
              <li key={warn._id || index}>
                <p>📝 <strong>Reason:</strong> {warn.reason}</p>
                <p>👮 <strong>Moderator:</strong> {warn.moderatorId}</p>
                <p>🕒 <strong>Time:</strong> {new Date(warn.timestamp).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default WarningsViewer;