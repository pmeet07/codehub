import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateRepo from './pages/CreateRepo';
import RepoDetail from './pages/RepoDetail';
import { AuthProvider } from './contexts/AuthContext';

import { ThemeProvider } from './contexts/ThemeContext';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';

import AdminRepositories from './pages/admin/Repositories';
import AdminReports from './pages/admin/Reports';
import AdminLogs from './pages/admin/Logs';
import AdminSettings from './pages/admin/Settings';

import Search from './pages/Search';
import AdminPullRequests from './pages/admin/PullRequests';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen dark:bg-github-dark bg-gray-50 dark:text-white text-gray-900 font-sans selection:bg-blue-500/30 transition-colors duration-200">
            <Routes>
              {/* Main Application Routes (with Navbar) */}
              <Route path="/*" element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/new" element={<CreateRepo />} />
                    <Route path="/:username/:repoName" element={<RepoDetail />} />
                  </Routes>
                </>
              } />

              {/* Admin Routes (Separate Layout) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="repositories" element={<AdminRepositories />} />
                <Route path="pull-requests" element={<AdminPullRequests />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="logs" element={<AdminLogs />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
