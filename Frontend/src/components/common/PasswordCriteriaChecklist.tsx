// src/components/common/PasswordCriteriaChecklist.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { CheckCircleOutlined, HighlightOffOutlined } from '@mui/icons-material';
import { getPasswordCriteria } from '../../utils/passwordValidation';

interface PasswordCriteriaChecklistProps {
  password: string;
  isDark?: boolean;
}

export const PasswordCriteriaChecklist: React.FC<PasswordCriteriaChecklistProps> = ({
  password,
  isDark = false,
}) => {
  if (!password) return null;

  const criteria = getPasswordCriteria(password);

  const items = [
    { label: '8+ chars', valid: criteria.hasMinLength },
    { label: 'Uppercase', valid: criteria.hasUppercase },
    { label: 'Lowercase', valid: criteria.hasLowercase },
    { label: 'Number', valid: criteria.hasNumber },
    { label: 'Symbol', valid: criteria.hasSpecial },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 12px',
        p: '8px 12px',
        borderRadius: '8px',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.7)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        my: 1,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: item.valid
              ? '#16a34a'
              : isDark
              ? '#64748b'
              : '#94a3b8',
            transition: 'color 0.2s ease',
          }}
        >
          {item.valid ? (
            <CheckCircleOutlined sx={{ fontSize: 14, color: '#16a34a' }} />
          ) : (
            <HighlightOffOutlined sx={{ fontSize: 14, color: isDark ? '#64748b' : '#94a3b8' }} />
          )}
          <Typography
            component="span"
            variant="caption"
            sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'inherit' }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
