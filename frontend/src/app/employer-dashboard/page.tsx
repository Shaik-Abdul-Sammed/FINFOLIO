'use client';

import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Divider } from '@mui/material';
import { ShieldAlert, TrendingUp, Users } from 'lucide-react';

export default function EmployerDashboard() {
  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#0f172a' }}>
        FINFOLIO Employer Intelligence
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#475569', mb: 4 }}>
        Anonymized Aggregate Workforce Financial Health
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Users size={24} color="#6366f1" style={{ marginRight: '8px' }} />
                <Typography variant="h6" fontWeight="bold">Workforce Resilience</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="primary">72/100</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Average corporate financial health score across 4,200 active employees.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShieldAlert size={24} color="#ef4444" style={{ marginRight: '8px' }} />
                <Typography variant="h6" fontWeight="bold">High Stress Cohort</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="error">14.2%</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Employees operating with less than 2 months of emergency runway.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp size={24} color="#10b981" style={{ marginRight: '8px' }} />
                <Typography variant="h6" fontWeight="bold">Debt-to-Income Avg</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: '#10b981' }}>34%</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Overall organizational debt service ratio. Under the 40% healthy threshold.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          HR Actionable Recommendations
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" paragraph>
          1. <strong>Consider an ESPP (Employee Stock Purchase Plan):</strong> 28% of employees have zero long-term investments. Matching contributions could drive retention.
        </Typography>
        <Typography variant="body1" paragraph>
          2. <strong>Group Health Insurance Top-Up:</strong> Medical emergencies are the #1 cause of sudden wallet withdrawals. Expanding corporate cover by ₹2L/employee is recommended.
        </Typography>
      </Paper>
    </Box>
  );
}
