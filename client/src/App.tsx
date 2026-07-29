import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminRoute } from './auth/AdminRoute';
import { NurseRoute } from './auth/NurseRoute';
import { ToastProvider } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { PatientFormPage } from './pages/PatientFormPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminFormOptionsPage } from './pages/AdminFormOptionsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<NurseRoute />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/patients/new" element={<PatientFormPage />} />
                  <Route path="/patients/:id" element={<PatientFormPage />} />
                </Route>
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminUsersPage />} />
                  <Route path="/admin/form-options" element={<AdminFormOptionsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
