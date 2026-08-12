import React, { type ReactNode } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  iconBgColor,
  iconColor = 'primary.main',
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const defaultBgColor = isDark
    ? 'rgba(99, 102, 241, 0.18)'
    : 'rgba(99, 102, 241, 0.1)';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2.5,
            backgroundColor: iconBgColor || defaultBgColor,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isDark
              ? '0 4px 12px rgba(0,0,0,0.25)'
              : '0 2px 8px rgba(99,102,241,0.08)',
            '& .MuiSvgIcon-root': {
              fontSize: 28,
            },
          }}
        >
          {icon}
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: 'text.primary' }}>
              {title}
            </Typography>
            {badge}
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {actions && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            alignSelf: { xs: 'stretch', sm: 'auto' },
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
};
