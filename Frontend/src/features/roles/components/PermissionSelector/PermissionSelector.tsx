import React, { useMemo } from 'react';
import { Box, Typography, Checkbox, FormControlLabel, FormGroup, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMoreRounded } from '@mui/icons-material';
import type { PermissionDto } from '../../types';

interface PermissionGroup {
  name: string;
  permissions: PermissionDto[];
}

export interface PermissionSelectorProps {
  availablePermissions: PermissionDto[];
  selectedPermissionIds: string[];
  onPermissionToggle: (permissionId: string) => void;
  onGroupToggle: (permissionIds: string[], checked: boolean) => void;
  getDisabledState?: (permission: PermissionDto) => { disabled: boolean; reason?: string };
}

export const PermissionSelector: React.FC<PermissionSelectorProps> = ({
  availablePermissions,
  selectedPermissionIds,
  onPermissionToggle,
  onGroupToggle,
  getDisabledState
}) => {
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionGroup> = {};
    
    availablePermissions.forEach(permission => {
      // Example: "Users.Read" -> "Users"
      const parts = permission.name.split('.');
      const groupName = parts.length > 1 ? parts[0] : 'General';
      
      if (!groups[groupName]) {
        groups[groupName] = { name: groupName, permissions: [] };
      }
      groups[groupName].permissions.push(permission);
    });

    // Sort groups alphabetically
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [availablePermissions]);

  if (!availablePermissions || availablePermissions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No assignable permissions found.
      </Typography>
    );
  }

  return (
    <Box>
      {groupedPermissions.map(group => {
        if (group.permissions.length === 0) return null;
        
        const groupPermissionIds = group.permissions.map(p => p.id);
        const checkedCount = group.permissions.filter(p => selectedPermissionIds.includes(p.id)).length;
        const isAllChecked = checkedCount === group.permissions.length && group.permissions.length > 0;
        const isIndeterminate = checkedCount > 0 && checkedCount < group.permissions.length;
        
        const handleGroupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
           onGroupToggle(groupPermissionIds, event.target.checked);
        };

        return (
          <Accordion 
            key={group.name}
            disableGutters 
            elevation={0} 
            sx={{ 
              mb: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              overflow: 'hidden'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreRounded />}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              <FormControlLabel
                onClick={(e) => e.stopPropagation()} 
                onFocus={(e) => e.stopPropagation()}
                control={
                  <Checkbox
                    checked={isAllChecked}
                    indeterminate={isIndeterminate}
                    onChange={handleGroupChange}
                    size="small"
                  />
                }
                label={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{group.name} Module</Typography>}
              />
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1, pb: 2, bgcolor: 'background.paper' }}>
              <FormGroup>
                {group.permissions.map(permission => {
                  const isChecked = selectedPermissionIds.includes(permission.id);
                  const { disabled = false, reason = '' } = getDisabledState ? getDisabledState(permission) : {};
                  
                  return (
                    <FormControlLabel
                      key={permission.id}
                      control={
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={() => onPermissionToggle(permission.id)}
                          disabled={disabled}
                        />
                      }
                      label={
                        <Box sx={{ opacity: disabled && reason ? 0.6 : 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {permission.name} {reason && <Typography component="span" variant="caption" color="text.secondary">({reason})</Typography>}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {permission.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 }, ml: 1 }}
                    />
                  );
                })}
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};
