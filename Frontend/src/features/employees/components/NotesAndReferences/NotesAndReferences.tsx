import React from 'react';
import { Box, Divider } from '@mui/material';
import { NotesSection } from './NotesSection';
import { ReferencesSection } from './ReferencesSection';

interface NotesAndReferencesProps {
  employeeId: string;
}

export const NotesAndReferences: React.FC<NotesAndReferencesProps> = ({ employeeId }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <NotesSection employeeId={employeeId} />
      <Divider />
      <ReferencesSection employeeId={employeeId} />
    </Box>
  );
};
