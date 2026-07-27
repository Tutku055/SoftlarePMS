import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Login } from '../features/auth/components/Login/Login';

import { Roster } from '../features/employees/Roster';
import { EmployeeDetail } from '../features/employees/EmployeeDetail';
import { EmployeeCreation } from '../features/employees/EmployeeCreation';
import { DepartmentList } from '../features/departments/components/DepartmentList/DepartmentList';
import { DepartmentDetail } from '../features/departments/components/DepartmentDetail/DepartmentDetail';
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

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
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
            element: <div>Dashboard</div>
          },
          {
            path: 'employees/roster',
            element: <Roster />,
          },
          {
            path: 'employees/create',
            element: <EmployeeCreation />,
          },
          {
            path: 'employees/:id',
            element: <EmployeeDetail />,
          },
          {
            path: 'departments/list',
            element: <DepartmentList />,
          },
          {
            path: 'departments/employees',
            element: <DepartmentEmployees />,
          },
          {
            path: 'departments/:id',
            element: <DepartmentDetail />,
          },
          {
            path: 'documents/archive',
            element: <DocumentArchive />,
          },
          {
            path: 'documents/:id',
            element: <DocumentDetail />,
          },
          {
            path: 'settings',
            children: [
              {
                path: 'roles',
                element: <RoleList />,
              },
              {
                path: 'roles/:id',
                element: <RoleDetail />,
              },
            ],
          },
          {
            path: 'finance',
            children: [
              {
                path: 'timesheets',
                element: <TimesheetList />,
              },
              {
                path: 'timesheets/:employeeId',
                element: <TimesheetDetailMatrix />,
              },
              {
                path: 'payrolls',
                element: <PayrollList />,
              },
              {
                path: 'payrolls/:employeeId',
                element: <PayrollDetail />,
              }
            ]
          },
          {
            path: 'users',
            element: <UsersPage />,
          },
          {
            path: 'settings/users',
            element: <UsersPage />,
          },
          {
            path: 'users/:id',
            element: <UserDetail />,
          },
          {
            path: 'settings/users/:id',
            element: <UserDetail />,
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
