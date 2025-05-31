import { Routes, Route, NavLink } from 'react-router-dom'
import WarningsViewer from './components/WarningsViewer'

function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <nav
        style={{
          width: '220px',
          background: '#1a1a1a',
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <h2 style={{ color: '#fff', marginBottom: '2rem' }}>📂 Menu</h2>
        <NavLink to="/" className="sidebar-link">🏠 Welcome</NavLink>
        <NavLink to="/warnings" className="sidebar-link">⚠️ Warnings</NavLink>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem' }}>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h1>👋 Welcome to the Pandoryx Dashboard</h1>
                <p style={{ marginTop: '1rem' }}>
                  Use the sidebar to navigate through your moderation tools.
                </p>
              </div>
            }
          />
          <Route path="/warnings" element={<WarningsViewer />} />
        </Routes>
      </main>
    </div>
  )
}

export default App