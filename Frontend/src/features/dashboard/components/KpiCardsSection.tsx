import React from 'react';
import { Typography, Box, Skeleton } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useGetDashboardKpisAndEvents } from '../api/dashboardApi';
import { useAuthStore } from '../../../store/useAuthStore';

export const KpiCardsSection: React.FC = () => {
  const { hasPermission } = useAuthStore();

  const canReadEmployees = hasPermission('Employees.Read');
  const canReadDepartments = hasPermission('Departments.Read');

  const { data, isLoading, isError } = useGetDashboardKpisAndEvents(canReadEmployees);

  if (!canReadEmployees && !canReadDepartments) return null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
      {canReadEmployees && (
        <KpiCard
          title="Active Employees"
          value={data?.activeEmployeesCount}
          icon={<PeopleIcon sx={{ fontSize: 20 }} />}
          iconColor="#6366F1"
          iconBg="rgba(99,102,241,0.12)"
          isLoading={isLoading}
          isError={isError}
        />
      )}
      {canReadDepartments && (
        <KpiCard
          title="Total Departments"
          value={data?.totalDepartmentsCount}
          icon={<BusinessIcon sx={{ fontSize: 20 }} />}
          iconColor="#8B5CF6"
          iconBg="rgba(139,92,246,0.12)"
          isLoading={isLoading}
          isError={isError}
        />
      )}
      {canReadEmployees && (
        <KpiCard
          title="New Hires This Month"
          value={data?.newHiresThisMonthCount}
          icon={<PersonAddIcon sx={{ fontSize: 20 }} />}
          iconColor="#10B981"
          iconBg="rgba(16,185,129,0.12)"
          isLoading={isLoading}
          isError={isError}
          badge={<TrendingUpIcon sx={{ fontSize: 13, color: '#10B981' }} />}
        />
      )}
    </Box>
  );
};

interface KpiCardProps {
  title: string;
  value?: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  isLoading: boolean;
  isError: boolean;
  badge?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, iconColor, iconBg, isLoading, isError, badge }) => (
  <Box
    sx={{
      bgcolor: 'background.paper',
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      p: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        transform: 'translateY(-1px)',
      },
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2.5,
        bgcolor: iconBg,
        color: iconColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', display: 'block' }}>
        {title}
      </Typography>
      {isLoading ? (
        <Skeleton variant="text" width={50} height={32} />
      ) : isError ? (
        <Typography variant="h6" color="error" sx={{ fontWeight: 700 }}>—</Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {value ?? 0}
          </Typography>
          {badge}
        </Box>
      )}
    </Box>
  </Box>
);
