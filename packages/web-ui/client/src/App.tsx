import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useGitStore } from './store/gitStore'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import BranchesPage from './components/branch/BranchesPage'
import CommitsPage from './components/commit/CommitsPage'
import ChangesPage from './components/changes/ChangesPage'
import SyncPage from './components/sync/SyncPage'

function App() {
  const { initWebSocket, cleanupWebSocket, fetchAll } = useGitStore()

  useEffect(() => {
    // 初始化数据和WebSocket
    fetchAll()
    initWebSocket()

    return () => {
      cleanupWebSocket()
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="commits" element={<CommitsPage />} />
          <Route path="changes" element={<ChangesPage />} />
          <Route path="sync" element={<SyncPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App