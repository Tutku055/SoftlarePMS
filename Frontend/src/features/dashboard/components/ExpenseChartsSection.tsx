import React, { useState } from 'react';
import { Typography, Box, Skeleton, Divider, Dialog, DialogTitle, DialogContent, IconButton, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ExpenseDepartmentDto } from '../api/dashboardApi';
import { useGetDashboardExpenseCharts } from '../api/dashboardApi';
import { useAuthStore } from '../../../store/useAuthStore';

// Dynamic color generator for currencies, 'Other' is always grey
const getColor = (currency: string, index: number) => {
  if (currency === 'Other') return '#A9A9A9';
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  return colors[index % colors.length];
};

export const ExpenseChartsSection: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canManageCompensations = hasPermission('Compensations.Manage');
  
  const { data, isLoading, isError } = useGetDashboardExpenseCharts(canManageCompensations);

  if (!canManageCompensations) return null;

  const allCompanyCurrencies = new Set<string>();
  if (data?.monthlyExpenses) {
    data.monthlyExpenses.forEach(d => {
      Object.keys(d.expensesByCurrency || {}).forEach(c => allCompanyCurrencies.add(c));
    });
  }
  if (data?.hourlyExpenses) {
    data.hourlyExpenses.forEach(d => {
      Object.keys(d.expensesByCurrency || {}).forEach(c => allCompanyCurrencies.add(c));
    });
  }
  const globalCurrencies = Array.from(allCompanyCurrencies);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      borderRadius: 3, 
      border: '1px solid', 
      borderColor: 'divider', 
      overflow: 'hidden', 
      bgcolor: 'background.paper', 
      boxShadow: theme => theme.palette.mode === 'light' ? '0px 4px 20px rgba(0, 0, 0, 0.03)' : '0px 4px 20px rgba(0, 0, 0, 0.2)',
      minWidth: 0 
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <AttachMoneyIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.4px', fontSize: '1rem' }}>
          Financial Expenses
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 } }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
          </Box>
        ) : isError ? (
          <Typography color="error">Failed to load financial data.</Typography>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flexGrow: 1, 
            justifyContent: (Boolean(data?.monthlyExpenses?.length) && Boolean(data?.hourlyExpenses?.length)) ? 'space-evenly' : 'center',
            gap: (Boolean(data?.monthlyExpenses?.length) && Boolean(data?.hourlyExpenses?.length)) ? 3 : 0,
            height: '100%'
          }}>
            {Boolean(data?.monthlyExpenses?.length) && (
              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', display: 'inline-block' }} />
                  Monthly Employees
                </Typography>
                <Box sx={{ flex: 1, minHeight: 180 }}>
                  <ExpenseBarChart data={processExpenseData(data?.monthlyExpenses)} currencies={globalCurrencies} />
                </Box>
              </Box>
            )}
            
            {Boolean(data?.monthlyExpenses?.length) && Boolean(data?.hourlyExpenses?.length) && <Divider sx={{ my: 0 }} />}
            
            {Boolean(data?.hourlyExpenses?.length) && (
              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main', display: 'inline-block' }} />
                  Hourly Employees
                </Typography>
                <Box sx={{ flex: 1, minHeight: 180 }}>
                  <ExpenseBarChart data={processExpenseData(data?.hourlyExpenses)} currencies={globalCurrencies} />
                </Box>
              </Box>
            )}
            
            {!Boolean(data?.monthlyExpenses?.length) && !Boolean(data?.hourlyExpenses?.length) && (
               <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', m: 'auto' }}>
                 No expense data available.
               </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

interface ChartDepartmentData {
  departmentName: string;
  expensesByCurrency: Record<string, number>;
  isOther?: boolean;
  subDepartments?: ExpenseDepartmentDto[];
}

const processExpenseData = (data: ExpenseDepartmentDto[] | undefined): ChartDepartmentData[] => {
  if (!data || data.length === 0) return [];

  // Sort by total expenses across all currencies
  const calculateTotal = (item: ExpenseDepartmentDto) => 
    Object.values(item.expensesByCurrency || {}).reduce((sum, val) => sum + val, 0);

  const actualDepartments = data.filter(d => d.departmentName !== 'Other');
  const existingOther = data.find(d => d.departmentName === 'Other');

  const sortedData = [...actualDepartments].sort((a, b) => calculateTotal(b) - calculateTotal(a));

  if (sortedData.length <= 4 && !existingOther) {
    return sortedData.map(d => ({ ...d }));
  }

  const top3 = sortedData.slice(0, 3);
  const rest = sortedData.slice(3);

  const otherExpenses: Record<string, number> = {};
  
  if (existingOther) {
      Object.entries(existingOther.expensesByCurrency || {}).forEach(([cur, val]) => {
          otherExpenses[cur] = (otherExpenses[cur] || 0) + val;
      });
  }

  rest.forEach(dept => {
    Object.entries(dept.expensesByCurrency || {}).forEach(([cur, val]) => {
      otherExpenses[cur] = (otherExpenses[cur] || 0) + val;
    });
  });

  if (Object.keys(otherExpenses).length === 0) {
     return top3.map(d => ({ ...d }));
  }

  return [
    ...top3.map(d => ({ ...d })),
    {
      departmentName: 'Other',
      expensesByCurrency: otherExpenses,
      isOther: true,
      subDepartments: rest
    }
  ];
};

interface ExpenseBarChartProps {
  data: ChartDepartmentData[];
  currencies: string[];
}

const ExpenseBarChart: React.FC<ExpenseBarChartProps> = ({ data, currencies }) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOther, setSelectedOther] = useState<ChartDepartmentData | null>(null);

  if (!data || data.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No data available.</Typography>;
  }

  // Transform data for Recharts: { departmentName: 'IT', USD: 45000, EUR: 12000, Other: 3000 }
  const chartData = data.map(d => ({
    departmentName: d.departmentName,
    isOther: d.isOther,
    subDepartments: d.subDepartments,
    ...d.expensesByCurrency
  }));

  const handleBarClick = (entry: any) => {
    if (entry && entry.isOther && entry.subDepartments) {
      setSelectedOther(entry);
      setDialogOpen(true);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedOther(null);
  };

  return (
    <Box sx={{
      height: '100%',
      minHeight: 180,
      width: '100%',
      minWidth: 0,
      position: 'relative',
      overflow: 'hidden',
      '& *:focus': { outline: 'none !important' },
      '& .recharts-surface': { outline: 'none !important' },
      '& .recharts-active-bar': { outline: 'none !important' },
    }}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
          <XAxis dataKey="departmentName" stroke={theme.palette.text.secondary} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke={theme.palette.text.secondary} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} width={45} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={false}
            contentStyle={{ borderRadius: 8, borderColor: theme.palette.divider, backgroundColor: theme.palette.background.paper, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            itemStyle={{ color: theme.palette.text.primary, fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {currencies.map((currency, index) => (
            <Bar
              key={currency}
              dataKey={currency}
              fill={getColor(currency, index)}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              isAnimationActive={false}
              focusable={false as any}
              onClick={(data) => handleBarClick(data)}
              style={{ cursor: chartData.some(d => d.isOther) ? 'pointer' : 'default' }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Dialog for 'Other' sub-departments */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleClose} 
        maxWidth="sm" 
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
            Other Departments Details
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 } }}>
           <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', pb: 1, pt: 1, px: 3, bgcolor: 'action.hover' }}>
             <Box sx={{ flex: 1 }}><Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>Department</Typography></Box>
             {currencies.map(c => (
               <Box key={c} sx={{ width: 70, textAlign: 'right' }}>
                 <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>{c}</Typography>
               </Box>
             ))}
           </Box>
           <Box sx={{ py: 0 }}>
             {selectedOther?.subDepartments?.map((dept, idx) => (
               <Box key={idx}>
                 <Box sx={{ px: 3, py: 1.5, display: 'flex', '&:hover': { bgcolor: 'action.hover' } }}>
                   <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                     <Typography variant="body2" sx={{ fontWeight: 500 }}>{dept.departmentName}</Typography>
                   </Box>
                   {currencies.map(c => (
                     <Box key={c} sx={{ width: 70, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                       <Typography variant="body2" color="text.secondary">
                         {dept.expensesByCurrency[c]?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '-'}
                       </Typography>
                     </Box>
                   ))}
                 </Box>
                 {idx < (selectedOther?.subDepartments?.length || 0) - 1 && <Divider />}
               </Box>
             ))}
             {(!selectedOther?.subDepartments || selectedOther.subDepartments.length === 0) && (
               <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No detailed data available.</Typography>
             )}
           </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
