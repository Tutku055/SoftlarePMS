import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Card,
  CardContent,
  Grid,
  useTheme,
} from '@mui/material';
import {
  NotificationsRounded,
  SearchRounded,
  CheckCircleOutlineRounded,
  RefreshRounded,
  WarningAmberRounded,
  TuneRounded,
  InboxRounded,
  MarkEmailReadRounded,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotifications } from './hooks/useNotifications';
import type { NotificationSortOption } from './hooks/useNotifications';
import { NotificationCard } from './components/NotificationCard';
import { NotificationSettingsView } from './components/NotificationSettingsView';
import { NOTIFICATION_TYPE_CONFIG } from './utils/urgencyUtils';

export const NotificationsPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const canAdjustSettings =
    hasPermission('Notifications.AdjustThresholds') || hasPermission('Notifications.Mute');

  const [activeTab, setActiveTab] = useState<number>(0);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    isActionLoading,
    pageNumber,
    totalPages,
    selectedType,
    selectedUrgency,
    selectedStatus,
    searchQuery,
    sortBy,
    stats,
    setPageNumber,
    setSelectedType,
    setSelectedUrgency,
    setSelectedStatus,
    setSearchQuery,
    setSortBy,
    toggleReadStatus,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotifications();

  const handleToggleRead = async (id: string) => {
    try {
      const updated = await toggleReadStatus(id);
      setSnackbarMessage(
        updated.isRead ? 'Notification marked as read.' : 'Notification marked as unread.'
      );
    } catch {
      setSnackbarMessage('Failed to update notification read status.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setSnackbarMessage('All unread notifications marked as read.');
    } catch {
      setSnackbarMessage('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setSnackbarMessage('Notification removed.');
    } catch {
      setSnackbarMessage('Failed to delete notification.');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NotificationsRounded sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} Unread`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              System alerts, document expiry notices, and organizational passive reminders.
            </Typography>
          </Box>
        </Box>

        {/* Header Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshRounded />}
            onClick={() => refetch()}
            disabled={isLoading}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>

          {activeTab === 0 && unreadCount > 0 && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<MarkEmailReadRounded />}
              onClick={handleMarkAllAsRead}
              disabled={isActionLoading || isLoading}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Mark All as Read
            </Button>
          )}
        </Box>
      </Box>

      {/* KPI Stats Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: (theme) => theme.palette.divider,
              bgcolor: (theme) => theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Total Items
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: stats.unread > 0 ? 'primary.main' : (theme) => theme.palette.divider,
              bgcolor: (theme) => theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Unread
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                {stats.unread}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: stats.critical > 0 ? '#EF4444' : (theme) => theme.palette.divider,
              bgcolor: stats.critical > 0 && isDark ? 'rgba(239, 68, 68, 0.08)' : (theme) => theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {stats.critical > 0 && <WarningAmberRounded sx={{ fontSize: 14, color: '#EF4444' }} />}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Critical Urgency
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: stats.critical > 0 ? '#EF4444' : 'text.primary' }}>
                {stats.critical}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: stats.high > 0 ? '#F59E0B' : (theme) => theme.palette.divider,
              bgcolor: stats.high > 0 && isDark ? 'rgba(245, 158, 11, 0.08)' : (theme) => theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                High Urgency
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: stats.high > 0 ? '#F59E0B' : 'text.primary' }}>
                {stats.high}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs (Inbox vs Rules) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newVal) => setActiveTab(newVal)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            icon={<InboxRounded fontSize="small" />}
            iconPosition="start"
            label="My Notifications"
            sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
          />
          {canAdjustSettings && (
            <Tab
              icon={<TuneRounded fontSize="small" />}
              iconPosition="start"
              label="Notification Rules & Settings"
              sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
            />
          )}
        </Tabs>
      </Box>

      {/* TAB 0: Notification Inbox */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Category Filter Chips strictly from Backend Enums */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="All Types"
              clickable
              color={selectedType === 'all' ? 'primary' : 'default'}
              variant={selectedType === 'all' ? 'filled' : 'outlined'}
              onClick={() => setSelectedType('all')}
              sx={{ fontWeight: 600 }}
            />
            {Object.values(NOTIFICATION_TYPE_CONFIG).map((meta) => {
              const isSelected = selectedType === meta.type;
              return (
                <Chip
                  key={meta.type}
                  label={meta.label}
                  clickable
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => setSelectedType(isSelected ? 'all' : meta.type)}
                  sx={{
                    fontWeight: 600,
                    borderColor: isSelected ? undefined : meta.color,
                  }}
                />
              );
            })}
          </Box>

          {/* Search, Status, Urgency & Sort Bar */}
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: (theme) => theme.palette.divider,
              bgcolor: (theme) => theme.palette.background.paper,
            }}
          >
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              {/* Search input */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRounded fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* Status Filter */}
              <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="unread">Unread Only</MenuItem>
                    <MenuItem value="read">Read Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Urgency Filter */}
              <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Urgency</InputLabel>
                  <Select
                    value={selectedUrgency}
                    label="Urgency"
                    onChange={(e) => setSelectedUrgency(e.target.value as any)}
                  >
                    <MenuItem value="all">All Urgencies</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Moderate">Moderate</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort By */}
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value as NotificationSortOption)}
                  >
                    <MenuItem value="date_desc">Newest First</MenuItem>
                    <MenuItem value="date_asc">Oldest First</MenuItem>
                    <MenuItem value="urgency">Urgency (Critical First)</MenuItem>
                    <MenuItem value="remaining_days">Remaining Days</MenuItem>
                    <MenuItem value="type">Notification Type</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>

          {/* Notification Items List */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 2,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                bgcolor: (theme) => theme.palette.background.paper,
              }}
            >
              <CheckCircleOutlineRounded sx={{ fontSize: 56, color: 'text.secondary', mb: 1.5, opacity: 0.6 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mt: 0.5 }}>
                {searchQuery || selectedUrgency !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'No notifications match your active filter criteria. Try resetting your filters.'
                  : "You're all caught up! There are no passive notifications requiring your attention at this time."}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {notifications.map((item) => (
                <NotificationCard
                  key={item.id}
                  notification={item}
                  onToggleRead={handleToggleRead}
                  onDelete={handleDelete}
                  disabled={isActionLoading}
                />
              ))}
            </Stack>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={pageNumber}
                onChange={(_, page) => setPageNumber(page)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1: Rules & Settings */}
      {activeTab === 1 && canAdjustSettings && <NotificationSettingsView />}

      {/* Action Snackbar Toast */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3500}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarMessage(null)}
          severity="info"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
