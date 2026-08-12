import React, { useState } from 'react';
import { Typography, Box, Skeleton, Divider, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, IconButton, useTheme } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PieChartIcon from '@mui/icons-material/PieChart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { ChartDistributionItemDto } from '../api/dashboardApi';
import { useGetDashboardDistributions } from '../api/dashboardApi';
import { useAuthStore } from '../../../store/useAuthStore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#A9A9A9'];

const calculateTotalCategories = (items: ChartDistributionItemDto[] | undefined): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((acc, item) => {
    if (item.isOther || item.name === 'Other') {
      return acc + (item.subItems ? item.subItems.length : 1);
    }
    return acc + 1;
  }, 0);
};

export const DistributionChartsSection: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canReadDepartments = hasPermission('Departments.Read');
  
  const { data, isLoading, isError } = useGetDashboardDistributions(canReadDepartments);

  if (!canReadDepartments) return null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'background.paper', minWidth: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <PieChartIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.4px', fontSize: '1rem' }}>
          Distributions
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 0, overflowY: 'auto', minHeight: 0, minWidth: 0, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 } }}>
        {isLoading ? (
          <>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}><Skeleton variant="circular" width={120} height={120} /></Box>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}><Skeleton variant="circular" width={120} height={120} /></Box>
          </>
        ) : isError ? (
          <Typography color="error" sx={{ p: 2 }}>Failed to load distributions.</Typography>
        ) : (
          <>
            <Box sx={{ flex: 1, minWidth: 0, borderRight: { xs: 'none', sm: '1px solid' }, borderBottom: { xs: '1px solid', sm: 'none' }, borderColor: 'divider', p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, textAlign: 'center', pt: 0.5, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', color: 'text.secondary' }}>Departments</Typography>
              <Box sx={{ width: '100%', flexGrow: 1, minWidth: 0, minHeight: 0 }}>
                <DonutChart 
                  data={processDistributionData(data?.departmentDistribution)} 
                  totalCount={calculateTotalCategories(data?.departmentDistribution)}
                />
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, textAlign: 'center', pt: 0.5, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', color: 'text.secondary' }}>Professions</Typography>
              <Box sx={{ width: '100%', flexGrow: 1, minWidth: 0, minHeight: 0 }}>
                <DonutChart 
                  data={processDistributionData(data?.professionDistribution)} 
                  totalCount={calculateTotalCategories(data?.professionDistribution)}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

const processDistributionData = (data: ChartDistributionItemDto[] | undefined): ChartDistributionItemDto[] => {
  if (!data || data.length === 0) return [];
  
  // Separate out existing 'Other' if it exists
  const actualDepartments = data.filter(d => !d.isOther && d.name !== 'Other');
  const existingOther = data.find(d => d.isOther || d.name === 'Other');

  // Sort actual departments by value descending
  const sortedData = [...actualDepartments].sort((a, b) => b.value - a.value);
  
  if (sortedData.length <= 3 && !existingOther) {
    return sortedData;
  }
  
  const top3 = sortedData.slice(0, 3);
  const rest = sortedData.slice(3);
  
  let otherValue = rest.reduce((sum, item) => sum + item.value, 0);
  const otherSubItems = rest.flatMap(item => {
    const items = [`${item.name} (${item.value})`];
    if (item.subItems && item.subItems.length > 0) {
      items.push(...item.subItems);
    }
    return items;
  });

  if (existingOther) {
    otherValue += existingOther.value;
    if (existingOther.subItems && existingOther.subItems.length > 0) {
      otherSubItems.push(...existingOther.subItems);
    }
  }

  if (otherValue === 0) {
     return top3;
  }
  
  const rawSubItems = Array.from(new Set(otherSubItems)).filter(Boolean);
  const cleanSubItems = rawSubItems.filter(item => 
    !rawSubItems.some(other => other !== item && other.startsWith(`${item} (`))
  );

  return [
    ...top3,
    {
      name: 'Other',
      value: otherValue,
      isOther: true,
      subItems: cleanSubItems
    }
  ];
};

interface DonutChartProps {
  data: ChartDistributionItemDto[];
  totalCount: number;
}

const CustomLegend: React.FC<{ data: ChartDistributionItemDto[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const actualItems = data
    .filter(p => !p.isOther && p.name !== 'Other')
    .sort((a, b) => b.value - a.value);
  const otherItem = data.find(p => p.isOther || p.name === 'Other');
  const finalPayload = otherItem ? [...actualItems, otherItem] : actualItems;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 1.5, rowGap: 0.5, pt: 1, px: 1 }}>
      {finalPayload.map((entry: any, index: number) => {
        const itemColor = entry.isOther ? '#A9A9A9' : COLORS[data.findIndex(d => d.name === entry.name) % COLORS.length];
        return (
          <Box key={`legend-item-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: itemColor, borderRadius: '2px', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary', lineHeight: 1 }}>
              {entry.name}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

const DonutChart: React.FC<DonutChartProps> = ({ data, totalCount }) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOther, setSelectedOther] = useState<ChartDistributionItemDto | null>(null);

  const handleClick = (entry: any) => {
    if (entry.payload && entry.payload.isOther) {
      setSelectedOther(entry.payload);
      setDialogOpen(true);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedOther(null);
  };

  if (!data || data.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No data available.</Typography>;
  }

  return (
    <Box sx={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: 0,
      '& *:focus': { outline: 'none !important' },
      '& path:focus': { outline: 'none !important' },
      '& .recharts-surface': { outline: 'none !important' },
      '& .recharts-sector': { outline: 'none !important' },
    }}>
      <Box sx={{ width: '100%', height: 180, position: 'relative', flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="56%"
              outerRadius="85%"
              paddingAngle={4}
              dataKey="value"
              onClick={handleClick}
              focusable={false}
              style={{ cursor: data.some(d => d.isOther) ? 'pointer' : 'default', outline: 'none' }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isOther ? '#A9A9A9' : COLORS[index % COLORS.length]}
                  stroke="none"
                  strokeWidth={0}
                  style={{ outline: 'none' }}
                  focusable={false as any}
                />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                fill: theme.palette.text.primary,
                pointerEvents: 'none'
              }}
            >
              {totalCount}
            </text>
            <Tooltip
              cursor={false}
              contentStyle={{ borderRadius: 8, borderColor: theme.palette.divider, backgroundColor: theme.palette.background.paper, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: theme.palette.text.primary, fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <CustomLegend data={data} />

      {/* Dialog for 'Other' sub-items */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleClose} 
        maxWidth="xs" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, pt: 2, px: 3 }}>
          <Typography component="div" variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.5px', fontSize: '1.1rem' }}>
            Other Details
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 } }}>
          <List sx={{ py: 0 }}>
            {selectedOther?.subItems.map((item, idx) => (
              <React.Fragment key={idx}>
                <ListItem sx={{ px: 3, py: 1.5, '&:hover': { bgcolor: 'action.hover' } }}>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item}
                      </Typography>
                    } 
                  />
                </ListItem>
                {idx < (selectedOther?.subItems.length || 0) - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

