import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Login } from '../features/auth/components/Login/Login';
import { ResetPassword } from '../features/auth/components/ResetPassword/ResetPassword';

import { Roster } from '../features/employees/Roster';
import { EmployeeDetail } from '../features/employees/EmployeeDetail';
import { EmployeeCreation } from '../features/employees/EmployeeCreation';
import { AddressList } from '../features/employees/AddressList';
import { EmployeeAddressDetail } from '../features/employees/EmployeeAddressDetail';
import { DepartmentList } from '../features/departments/components/DepartmentList/DepartmentList';
import { DepartmentDetail } from '../features/departments/components/DepartmentDetail/DepartmentDetail';
import { YearEndOperations } from '../features/settings/components/YearEndOperations/YearEndOperations';
import { DepartmentEmployees } from '../features/departments/components/DepartmentEmployees/DepartmentEmployees';
import { DocumentArchive } from '../features/documents/components/DocumentArchive/DocumentArchive';
import { DocumentDetail } from '../features/documents/components/DocumentDetail/DocumentDetail';
import { UsersPage } from '../features/users/UsersPage';
import { UserDetail } from '../features/users/UserDetail';
import { RoleList } from '../features/roles/components/RoleList/RoleList';
import { RoleDetail } from '../features/roles/components/RoleDetail/RoleDetail';
import { TimesheetList } from '../features/finance/components/Timesheets/TimesheetList';
import { TimesheetDetailMatrix } from '../features/finance/components/Timesheets/TimesheetDetailMatrix';
import { PayrollList } from '../features/finance/components/Payrolls/PayrollList';
import { PayrollDetail } from '../features/finance/components/Payrolls/PayrollDetail';
import { OvertimeTypeList } from '../features/finance/components/OvertimeTypes/OvertimeTypeList';
import { ProfessionList } from '../features/professions/components/ProfessionList';
import { SystemLogsPage } from '../features/settings/components/SystemLogs/SystemLogsPage';
import { GeneralSettingsPage } from '../features/settings/pages/GeneralSettingsPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { DashboardView } from '../features/dashboard/components/DashboardView';

import { useLocation } from 'react-router-dom';

const PrivateRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isPasswordChangeRequired = currentUser?.requiresPasswordChange || 
    (useAuthStore.getState().permissions.includes('Users.ChangePassword') && !useAuthStore.getState().permissions.includes('Dashboard.Read'));

  if (isPasswordChangeRequired && currentUser?.id) {
    const requiredPath = `/users/${currentUser.id}`;
    const settingsRequiredPath = `/settings/users/${currentUser.id}`;
    if (location.pathname !== requiredPath && location.pathname !== settingsRequiredPath) {
      return <Navigate to={requiredPath} replace />;
    }
  }

  return <Outlet />;
};

const ProtectedRoute = ({ permission, children }: { permission: string, children: React.ReactNode }) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  
  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: '/',
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />
          },
          {
            path: 'dashboard',
            element: <DashboardView />
          },
          {
            path: 'notifications',
            element: (
              <ProtectedRoute permission="Notifications.Read">
                <NotificationsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'calendar',
            element: (
              <ProtectedRoute permission="Calendar.Read">
                <CalendarPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'employees',
            element: <Navigate to="/employees/roster" replace />
          },
          {
            path: 'employees/roster',
            element: (
              <ProtectedRoute permission="Employees.Read">
                <Roster />
              </ProtectedRoute>
            ),
          },
          {
            path: 'employees/addresses',
            element: (
              <ProtectedRoute permission="EmployeeAddresses.Read">
                <AddressList />
              </ProtectedRoute>
            ),
          },
          {
            path: 'employees/addresses/:id',
            element: (
              <ProtectedRoute permission="EmployeeAddresses.Read">
                <EmployeeAddressDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: 'employees/:id/addresses',
            element: (
              <ProtectedRoute permission="EmployeeAddresses.Read">
                <EmployeeAddressDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: 'employees/create',
            element: (
              <ProtectedRoute permission="Employees.Create">
                <EmployeeCreation />
              </ProtectedRoute>
            ),
          },
          {
            path: 'employees/:id',
            element: (
              <ProtectedRoute permission="Employees.Read">
                <EmployeeDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: 'departments',
            element: <Navigate to="/departments/list" replace />
          },
          {
            path: 'departments/list',
            element: (
              <ProtectedRoute permission="Departments.Read">
                <DepartmentList />
              </ProtectedRoute>
            ),
          },
          {
            path: 'departments/employees',
            element: (
              <ProtectedRoute permission="Departments.Read">
                <DepartmentEmployees />
              </ProtectedRoute>
            ),
          },
          {
            path: 'departments/professions',
            element: (
              <ProtectedRoute permission="Professions.Read">
                <ProfessionList />
              </ProtectedRoute>
            ),
          },
          {
            path: 'departments/:id',
            element: (
              <ProtectedRoute permission="Departments.Read">
                <DepartmentDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: 'documents',
            element: <Navigate to="/documents/archive" replace />
          },
          {
            path: 'documents/archive',
            element: (
              <ProtectedRoute permission="Documents.Read">
                <DocumentArchive />
              </ProtectedRoute>
            ),
          },
          {
            path: 'documents/:id',
            element: (
              <ProtectedRoute permission="Documents.Read">
                <DocumentDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings',
            children: [
              {
                path: 'roles',
                element: (
                  <ProtectedRoute permission="Roles.Read">
                    <RoleList />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'roles/:id',
                element: (
                  <ProtectedRoute permission="Roles.Read">
                    <RoleDetail />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'finance',
            children: [
              {
                path: 'timesheets',
                element: (
                  <ProtectedRoute permission="Timesheets.Read">
                    <TimesheetList />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'timesheets/:employeeId',
                element: (
                  <ProtectedRoute permission="Timesheets.Read">
                    <TimesheetDetailMatrix />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'payrolls',
                element: (
                  <ProtectedRoute permission="Payrolls.Read">
                    <PayrollList />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'payrolls/:employeeId',
                element: (
                  <ProtectedRoute permission="Payrolls.Read">
                    <PayrollDetail />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'overtime-types',
                element: (
                  <ProtectedRoute permission="OvertimeTypes.Read">
                    <OvertimeTypeList />
                  </ProtectedRoute>
                ),
              }
            ]
          },
          {
            path: 'users',
            element: (
              <ProtectedRoute permission="Users.Read">
                <UsersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings/users',
            element: (
              <ProtectedRoute permission="Users.Read">
                <UsersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'users/:id',
            element: (
              <ProtectedRoute permission="Users.Read">
                <UserDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings/users/:id',
            element: (
              <ProtectedRoute permission="Users.Read">
                <UserDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings/year-end',
            element: (
              <ProtectedRoute permission="SystemSettings.YearEndOperations">
                <YearEndOperations />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings/general',
            element: (
              <ProtectedRoute permission="SystemSettings.Manage">
                <GeneralSettingsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings/system-logs',
            element: (
              <ProtectedRoute permission="AuditLogs.Read">
                <SystemLogsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings/audit-logs',
            element: (
              <ProtectedRoute permission="AuditLogs.Read">
                <SystemLogsPage />
              </ProtectedRoute>
            ),
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
