import { create } from 'zustand';
import { useEffect } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbState {
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  customTitle: null,
  setCustomTitle: (title) => set({ customTitle: title }),
}));

/**
 * Custom hook for pages (e.g., Detail Views) to set a dynamic breadcrumb title.
 * Automatically clears the custom title when the component unmounts.
 */
export function useBreadcrumbTitle(title?: string | null) {
  const setCustomTitle = useBreadcrumbStore((s) => s.setCustomTitle);

  useEffect(() => {
    if (title && title.trim()) {
      setCustomTitle(title.trim());
    }
    return () => {
      setCustomTitle(null);
    };
  }, [title, setCustomTitle]);
}

/**
 * Information Architecture Breadcrumb Resolution
 * Strictly follows side menu hierarchy and site structure rules.
 */
export function getBreadcrumbsForPath(pathname: string, customTitle?: string | null): BreadcrumbItem[] {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const homeItem: BreadcrumbItem = { label: 'Home', path: '/dashboard' };

  // 1. Dashboard
  if (cleanPath === '' || cleanPath === '/' || cleanPath === '/dashboard') {
    return [
      homeItem,
      { label: 'Dashboard' }
    ];
  }

  // 2. Calendar
  if (cleanPath === '/calendar') {
    return [
      homeItem,
      { label: 'Calendar' }
    ];
  }

  // 3. Notifications
  if (cleanPath === '/notifications') {
    return [
      homeItem,
      { label: 'Notifications' }
    ];
  }

  // 4. Document Archive
  if (cleanPath === '/documents/archive' || cleanPath === '/documents') {
    return [
      homeItem,
      { label: 'Document Archive' }
    ];
  }
  if (cleanPath.startsWith('/documents/')) {
    return [
      homeItem,
      { label: 'Document Archive', path: '/documents/archive' },
      { label: customTitle || 'Document Detail' }
    ];
  }

  // 5. Personnel Operations
  const personnelParent: BreadcrumbItem = { label: 'Personnel Operations' };

  if (cleanPath === '/employees/roster' || cleanPath === '/employees') {
    return [
      homeItem,
      personnelParent,
      { label: 'Roster' }
    ];
  }
  if (cleanPath === '/employees/create') {
    return [
      homeItem,
      personnelParent,
      { label: 'Create Employee' }
    ];
  }
  if (cleanPath === '/employees/addresses') {
    return [
      homeItem,
      personnelParent,
      { label: 'Addresses' }
    ];
  }
  if (cleanPath.startsWith('/employees/addresses/') || cleanPath.includes('/addresses')) {
    return [
      homeItem,
      personnelParent,
      { label: 'Addresses', path: '/employees/addresses' },
      { label: customTitle || 'Address Detail' }
    ];
  }
  if (cleanPath.startsWith('/employees/')) {
    return [
      homeItem,
      personnelParent,
      { label: 'Roster', path: '/employees/roster' },
      { label: customTitle || 'Employee Detail' }
    ];
  }

  // 6. Departments
  const deptParent: BreadcrumbItem = { label: 'Departments' };

  if (cleanPath === '/departments/list' || cleanPath === '/departments') {
    return [
      homeItem,
      deptParent,
      { label: 'Department List' }
    ];
  }
  if (cleanPath === '/departments/employees') {
    return [
      homeItem,
      deptParent,
      { label: 'Department Employees' }
    ];
  }
  if (cleanPath === '/departments/professions') {
    return [
      homeItem,
      deptParent,
      { label: 'Professions' }
    ];
  }
  if (cleanPath.startsWith('/departments/')) {
    return [
      homeItem,
      deptParent,
      { label: 'Department List', path: '/departments/list' },
      { label: customTitle || 'Department Detail' }
    ];
  }

  // 7. Financial Management
  const financeParent: BreadcrumbItem = { label: 'Financial Management' };

  if (cleanPath === '/finance/timesheets') {
    return [
      homeItem,
      financeParent,
      { label: 'Timesheets' }
    ];
  }
  if (cleanPath.startsWith('/finance/timesheets/')) {
    return [
      homeItem,
      financeParent,
      { label: 'Timesheets', path: '/finance/timesheets' },
      { label: customTitle || 'Timesheet Detail' }
    ];
  }
  if (cleanPath === '/finance/payrolls') {
    return [
      homeItem,
      financeParent,
      { label: 'Payrolls' }
    ];
  }
  if (cleanPath.startsWith('/finance/payrolls/')) {
    return [
      homeItem,
      financeParent,
      { label: 'Payrolls', path: '/finance/payrolls' },
      { label: customTitle || 'Payroll Detail' }
    ];
  }
  if (cleanPath === '/finance/overtime-types') {
    return [
      homeItem,
      financeParent,
      { label: 'Overtime' }
    ];
  }

  // 8. System Settings
  const settingsParent: BreadcrumbItem = { label: 'System Settings' };

  if (cleanPath === '/settings/users' || cleanPath === '/users') {
    return [
      homeItem,
      settingsParent,
      { label: 'Users' }
    ];
  }
  if (cleanPath.startsWith('/settings/users/') || cleanPath.startsWith('/users/')) {
    return [
      homeItem,
      settingsParent,
      { label: 'Users', path: '/settings/users' },
      { label: customTitle || 'User Detail' }
    ];
  }
  if (cleanPath === '/settings/roles') {
    return [
      homeItem,
      settingsParent,
      { label: 'Roles & Permissions' }
    ];
  }
  if (cleanPath.startsWith('/settings/roles/')) {
    return [
      homeItem,
      settingsParent,
      { label: 'Roles & Permissions', path: '/settings/roles' },
      { label: customTitle || 'Role Detail' }
    ];
  }
  if (cleanPath === '/settings/system-logs' || cleanPath === '/settings/audit-logs') {
    return [
      homeItem,
      settingsParent,
      { label: 'System Logs' }
    ];
  }
  if (cleanPath === '/settings/year-end') {
    return [
      homeItem,
      settingsParent,
      { label: 'Year-End Operations' }
    ];
  }

  // Fallback for unknown paths
  const segments = cleanPath.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [homeItem];
  let currentPath = '';
  segments.forEach((seg, idx) => {
    currentPath += `/${seg}`;
    const formatted = seg.charAt(0).toUpperCase() + seg.slice(1);
    const isLast = idx === segments.length - 1;
    items.push({
      label: isLast ? (customTitle || formatted) : formatted,
      path: isLast ? undefined : currentPath
    });
  });

  return items;
}
