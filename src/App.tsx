/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserAuthProvider } from './auth/user/UserAuthProvider';
import { AdminAuthProvider } from './auth/admin/AdminAuthProvider';
import { Home } from './pages/Home';
import { Categories } from './pages/Categories';
import { Trending } from './pages/Trending';
import { Popular } from './pages/Popular';
import { Latest } from './pages/Latest';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUpload } from './pages/AdminUpload';
import { AdminBulkUpload } from './pages/AdminBulkUpload';
import { AdminEditPrompt } from './pages/AdminEditPrompt';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { ProtectedAdminRoute } from './auth/admin/ProtectedAdminRoute';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <UserAuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/popular" element={<Popular />} />
            <Route path="/latest" element={<Latest />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/admin/upload" 
              element={
                <ProtectedAdminRoute>
                  <AdminUpload />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/admin/bulk-upload" 
              element={
                <ProtectedAdminRoute>
                  <AdminBulkUpload />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/admin/edit/:id" 
              element={
                <ProtectedAdminRoute>
                  <AdminEditPrompt />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedAdminRoute>
                  <AdminAnalytics />
                </ProtectedAdminRoute>
              } 
            />
          </Routes>
          <Toaster theme="dark" position="bottom-right" />
        </BrowserRouter>
      </AdminAuthProvider>
    </UserAuthProvider>
  );
}
