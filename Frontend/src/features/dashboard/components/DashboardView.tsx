import React from 'react';
import { Box, Typography } from '@mui/material';
import { KpiCardsSection } from './KpiCardsSection';
import { TodayEventsSection } from './TodayEventsSection';
import { NotificationsPanel } from './NotificationsPanel';
import { DistributionChartsSection } from './DistributionChartsSection';
import { ExpenseChartsSection } from './ExpenseChartsSection';

export const DashboardView: React.FC = () => {

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: { xs: 'auto', lg: 'calc(100vh - 130px)' },
        maxHeight: { lg: 'calc(100vh - 130px)' },
        overflow: 'hidden',
      }}
    >
      {/* Page Title */}
      <Box sx={{ flexShrink: 0 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: 'text.primary', lineHeight: 1 }}
        >
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* KPI Row */}
      <Box sx={{ flexShrink: 0 }}>
        <KpiCardsSection />
      </Box>

      {/* Main Grid */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '300px 1fr 1fr' },
          gap: 2,
          overflowY: { xs: 'auto', lg: 'hidden' },
          overflowX: 'hidden',
        }}
      >
        {/* Column 1: Today's Events */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <TodayEventsSection />
        </Box>

        {/* Column 2: Notifications + Distribution */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ flex: '0 0 42%', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
            <NotificationsPanel />
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
            <DistributionChartsSection />
          </Box>
        </Box>

        {/* Column 3: Financial Charts */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <ExpenseChartsSection />
        </Box>
      </Box>
    </Box>
  );
};
