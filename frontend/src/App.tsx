import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import CommunityRegisterPage from '@/pages/auth/CommunityRegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Route-level code splitting: everything past login/dashboard loads on demand.
const ApartmentsPage = lazy(() => import('@/pages/apartment/ApartmentsPage'));
const HouseholdsPage = lazy(() => import('@/pages/household/HouseholdsPage'));
const ResidentAssignmentPage = lazy(() => import('@/pages/resident/ResidentAssignmentPage'));
const MeterConfigPage = lazy(() => import('@/pages/meter/MeterConfigPage'));
const UsageLogPage = lazy(() => import('@/pages/usage/UsageLogPage'));
const RegistrationRequestsPage = lazy(() => import('@/pages/superadmin/RegistrationRequestsPage'));
const CommunitiesPage = lazy(() => import('@/pages/superadmin/CommunitiesPage'));
const AuditLogsPage = lazy(() => import('@/pages/superadmin/AuditLogsPage'));
const AdminUserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'));
const BillingPage = lazy(() => import('@/pages/admin/BillingPage'));
const BillingCyclesPage = lazy(() => import('@/pages/admin/BillingCyclesPage'));
const WaterPurchasesPage = lazy(() => import('@/pages/admin/WaterPurchasesPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const MyHouseholdPage = lazy(() => import('@/pages/resident/MyHouseholdPage'));
const UsageHistoryPage = lazy(() => import('@/pages/resident/UsageHistoryPage'));
const MyBillsPage = lazy(() => import('@/pages/resident/MyBillsPage'));

// New: Payments (Resident) + Payment Collection / Revenue / Water Analytics / Reports / Settings (Building Owner)
const PaymentsPage = lazy(() => import('@/pages/resident/PaymentsPage'));
const PaymentCollectionPage = lazy(() => import('@/pages/admin/PaymentCollectionPage'));
const RevenueDashboardPage = lazy(() => import('@/pages/admin/RevenueDashboardPage'));
const AdminWaterAnalyticsPage = lazy(() => import('@/pages/admin/WaterAnalyticsPage'));
const AlertsPage = lazy(() => import('@/pages/admin/AlertsPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const OwnerNotificationsPage = lazy(() => import('@/pages/admin/OwnerNotificationsPage'));

// New: Super Admin — Building Owner / User / Role management, analytics, reports, system health, broadcasts
const BuildingOwnerManagementPage = lazy(() => import('@/pages/superadmin/BuildingOwnerManagementPage'));
const SuperAdminUserManagementPage = lazy(() => import('@/pages/superadmin/UserManagementPage'));
const RoleManagementPage = lazy(() => import('@/pages/superadmin/RoleManagementPage'));
const PlatformAnalyticsPage = lazy(() => import('@/pages/superadmin/PlatformAnalyticsPage'));
const SuperAdminRevenueAnalyticsPage = lazy(() => import('@/pages/superadmin/RevenueAnalyticsPage'));
const SuperAdminWaterAnalyticsPage = lazy(() => import('@/pages/superadmin/WaterAnalyticsPage'));
const SuperAdminReportsPage = lazy(() => import('@/pages/superadmin/SuperAdminReportsPage'));
const SystemHealthPage = lazy(() => import('@/pages/superadmin/SystemHealthPage'));
const GlobalNotificationsPage = lazy(() => import('@/pages/superadmin/GlobalNotificationsPage'));
const SuperAdminSettingsPage = lazy(() => import('@/pages/superadmin/SuperAdminSettingsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner label="Loading..." />}>{children}</Suspense>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register-community" element={<CommunityRegisterPage />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/:portal" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/notifications" element={<LazyPage><NotificationsPage /></LazyPage>} />

                  <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/apartments" element={<LazyPage><ApartmentsPage /></LazyPage>} />
                    <Route path="/households" element={<LazyPage><HouseholdsPage /></LazyPage>} />
                    <Route path="/usage" element={<LazyPage><UsageLogPage /></LazyPage>} />
                    <Route path="/residents" element={<LazyPage><ResidentAssignmentPage /></LazyPage>} />
                    <Route path="/meters" element={<LazyPage><MeterConfigPage /></LazyPage>} />
                    <Route path="/user-management" element={<LazyPage><AdminUserManagementPage /></LazyPage>} />
                    <Route path="/billing" element={<LazyPage><BillingPage /></LazyPage>} />
                    <Route path="/billing-cycles" element={<LazyPage><BillingCyclesPage /></LazyPage>} />
                    <Route path="/water-purchases" element={<LazyPage><WaterPurchasesPage /></LazyPage>} />
                    <Route path="/payment-collection" element={<LazyPage><PaymentCollectionPage /></LazyPage>} />
                    <Route path="/revenue-dashboard" element={<LazyPage><RevenueDashboardPage /></LazyPage>} />
                    <Route path="/water-analytics" element={<LazyPage><AdminWaterAnalyticsPage /></LazyPage>} />
                    <Route path="/alerts" element={<LazyPage><AlertsPage /></LazyPage>} />
                    <Route path="/admin-reports" element={<LazyPage><AdminReportsPage /></LazyPage>} />
                    <Route path="/admin-settings" element={<LazyPage><AdminSettingsPage /></LazyPage>} />
                    <Route path="/owner-notifications" element={<LazyPage><OwnerNotificationsPage /></LazyPage>} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['RESIDENT']} />}>
                    <Route path="/my-household" element={<LazyPage><MyHouseholdPage /></LazyPage>} />
                    <Route path="/usage-history" element={<LazyPage><UsageHistoryPage /></LazyPage>} />
                    <Route path="/my-bills" element={<LazyPage><MyBillsPage /></LazyPage>} />
                    <Route path="/payments" element={<LazyPage><PaymentsPage /></LazyPage>} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                    <Route path="/registration-requests" element={<LazyPage><RegistrationRequestsPage /></LazyPage>} />
                    <Route path="/communities" element={<LazyPage><CommunitiesPage /></LazyPage>} />
                    <Route path="/building-owners" element={<LazyPage><BuildingOwnerManagementPage /></LazyPage>} />
                    <Route path="/platform-users" element={<LazyPage><SuperAdminUserManagementPage /></LazyPage>} />
                    <Route path="/role-management" element={<LazyPage><RoleManagementPage /></LazyPage>} />
                    <Route path="/audit-logs" element={<LazyPage><AuditLogsPage /></LazyPage>} />
                    <Route path="/platform-analytics" element={<LazyPage><PlatformAnalyticsPage /></LazyPage>} />
                    <Route path="/platform-revenue" element={<LazyPage><SuperAdminRevenueAnalyticsPage /></LazyPage>} />
                    <Route path="/platform-water-analytics" element={<LazyPage><SuperAdminWaterAnalyticsPage /></LazyPage>} />
                    <Route path="/platform-reports" element={<LazyPage><SuperAdminReportsPage /></LazyPage>} />
                    <Route path="/system-health" element={<LazyPage><SystemHealthPage /></LazyPage>} />
                    <Route path="/global-notifications" element={<LazyPage><GlobalNotificationsPage /></LazyPage>} />
                    <Route path="/platform-settings" element={<LazyPage><SuperAdminSettingsPage /></LazyPage>} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
