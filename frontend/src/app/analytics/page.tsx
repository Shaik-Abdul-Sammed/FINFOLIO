'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

const mockData = [
  { year: 2024, baseSalary: 600000, compoundingWealth: 100000 },
  { year: 2025, baseSalary: 690000, compoundingWealth: 250000 },
  { year: 2026, baseSalary: 793500, compoundingWealth: 450000 },
  { year: 2027, baseSalary: 912525, compoundingWealth: 710000 },
  { year: 2028, baseSalary: 1049403, compoundingWealth: 1050000 },
  { year: 2029, baseSalary: 1206814, compoundingWealth: 1480000 },
  { year: 2030, baseSalary: 1387836, compoundingWealth: 2020000 },
  { year: 2031, baseSalary: 1596011, compoundingWealth: 2690000 },
  { year: 2032, baseSalary: 1835413, compoundingWealth: 3520000 },
  { year: 2033, baseSalary: 2110725, compoundingWealth: 4550000 },
  { year: 2034, baseSalary: 2427334, compoundingWealth: 5820000 },
];

export default function AnalyticsPage() {
  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#0f172a' }}>
        FINFOLIO 10-Year Wealth Projection
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#475569', mb: 4 }}>
        App Router Demo using Recharts Interactive Visualizations
      </Typography>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: 450 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="year" stroke="#94a3b8" />
            <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} stroke="#94a3b8" />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <Tooltip 
              formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area type="monotone" dataKey="baseSalary" stroke="#6366f1" fillOpacity={1} fill="url(#colorSalary)" name="Base Salary" />
            <Area type="monotone" dataKey="compoundingWealth" stroke="#10b981" fillOpacity={1} fill="url(#colorWealth)" name="Compound Wealth" />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
