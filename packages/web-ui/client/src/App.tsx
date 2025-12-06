import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useGitStore } from './store/gitStore'
import { ToastProvider } from './components/common/Toast'
import { ThemeProvider } from './components/common/ThemeProvider'
import NewLayout from './components/layout/NewLayout'
import NewDashboard from './components/dashboard/NewDashboard'
import NewBranchesPage from './components/branch/NewBranchesPage'
import NewCommitsPage from './components/commit/NewCommitsPage'
import NewChangesPage from './components/changes/NewChangesPage'
import SyncPage from './components/sync/SyncPage'
import NewSubmodulesPage from './components/submodule/NewSubmodulesPage'
import TagsPage from './components/tags/TagsPage'
import StashPage from './components/stash/StashPage'
import RemotesPage from './components/remotes/RemotesPage'
import StatsPage from './components/stats/StatsPage'
import HooksPage from './components/hooks/HooksPage'
import ComparePage from './components/compare/ComparePage'
import SettingsPage from './components/settings/SettingsPage'
import CodeSearchPage from './components/search/CodeSearchPage'
import FileBrowserPage from './components/browser/FileBrowserPage'
import BranchGraphPage from './components/graph/BranchGraphPage'
import ReflogPage from './components/reflog/ReflogPage'
import DoctorPage from './components/doctor/DoctorPage'
import CleanupPage from './components/cleanup/CleanupPage'
import ScanPage from './components/scan/ScanPage'
import ToolsPage from './components/tools/ToolsPage'

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
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<NewLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<NewDashboard />} />
              <Route path="branches" element={<NewBranchesPage />} />
              <Route path="commits" element={<NewCommitsPage />} />
              <Route path="changes" element={<NewChangesPage />} />
              <Route path="sync" element={<SyncPage />} />
              <Route path="submodules" element={<NewSubmodulesPage />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="stash" element={<StashPage />} />
              <Route path="remotes" element={<RemotesPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="hooks" element={<HooksPage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="search" element={<CodeSearchPage />} />
              <Route path="browser" element={<FileBrowserPage />} />
              <Route path="graph" element={<BranchGraphPage />} />
              <Route path="reflog" element={<ReflogPage />} />
              <Route path="doctor" element={<DoctorPage />} />
              <Route path="cleanup" element={<CleanupPage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="tools" element={<ToolsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App