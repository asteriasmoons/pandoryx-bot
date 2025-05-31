import { useEffect, useState } from 'react';

function WarningsViewer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const SERVER_OWNER_ID = 'YOUR_DISCORD_USER_ID_HERE'; // ← REPLACE this with your real ID

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

    fetch('/auth/user', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(err => {
        console.error('Failed to get user info:', err);
      });
  }, []);

  if (loading) return <p>Loading warnings...</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>⚠️ User Warnings</h2>
      {data.length === 0 && <p>No warnings found.</p>}

      {data.map((userDoc) => (
        <div
          key={userDoc._id}
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
          <h3>User ID: {userDoc.userId}</h3>
          <p>Guild ID: {userDoc.guildId}</p>
          <ul>
            {userDoc.warns.map((warn, index) => (
              <li key={warn._id || index}>
                <p>📝 <strong>Reason:</strong> {warn.reason}</p>
                <p>👮 <strong>Moderator:</strong> {warn.moderatorId}</p>
                <p>🕒 <strong>Time:</strong> {new Date(warn.timestamp).toLocaleString()}</p>
              </li>
            ))}
          </ul>

          {user?.id === SERVER_OWNER_ID && (
            <div style={{ marginTop: '1rem' }}>
              <button style={{ marginRight: '0.5rem' }}>✏️ Edit</button>
              <button>🗑️ Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default WarningsViewer;