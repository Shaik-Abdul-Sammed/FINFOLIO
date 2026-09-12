import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Button,
  Stack,
  Avatar,
  Paper,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  CircularProgress,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Business,
  Work,
  School,
  TrendingUp,
  Warning,
  CheckCircle,
  Security,
  Bolt,
  Speed,
  Psychology,
  AccountBalance,
  ArrowForward,
  Timeline,
  Star,
  VerifiedUser,
  ArrowUpward,
  BadgeOutlined,
  LocationOn,
  Edit,
  Download,
  WhatsApp as WhatsAppIcon,
  CompareArrows,
  Close,
  Calculate,
  AutoAwesome,
  HelpOutline
} from '@mui/icons-material';
import { useCurrency } from '@/context/CurrencyContext';
import {
  employeeService,
  EmployeeProfile,
  CompanyIntelligence,
  EmployeeSkill,
  CareerTransitionRole,
  LoanAffordability,
  IncomeResilience
} from '@/services/employeeService';
import ClientOnly from '@/components/ClientOnly';

const CareerPage: React.FC = () => {
  const { formatAmount } = useCurrency();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [company, setCompany] = useState<CompanyIntelligence | null>(null);
  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [transitions, setTransitions] = useState<CareerTransitionRole[]>([]);
  const [loan, setLoan] = useState<LoanAffordability | null>(null);
  const [resilience, setResilience] = useState<IncomeResilience | null>(null);

  // Modals state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    designation: '',
    department: '',
    yearsOfExperience: 3.5,
    monthlyTakeHome: 65000,
    location: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Explanations & Dialogs
  const [companyRiskOpen, setCompanyRiskOpen] = useState(false);
  const [personalImpactOpen, setPersonalImpactOpen] = useState(false);
  const [skillDetail, setSkillDetail] = useState<EmployeeSkill | null>(null);
  const [compareRolesOpen, setCompareRolesOpen] = useState(false);
  const [transitionPlanRole, setTransitionPlanRole] = useState<CareerTransitionRole | null>(null);
  const [safeEmiExplainOpen, setSafeEmiExplainOpen] = useState(false);

  // Loan calculator tool
  const [calcLoanAmount, setCalcLoanAmount] = useState<number>(800000);
  const [calcTenureYears, setCalcTenureYears] = useState<number>(5);
  const [calcInterestRate, setCalcInterestRate] = useState<number>(10.5);

  // Feedback toast
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, c, s, t, lRes, r] = await Promise.all([
        employeeService.getProfile(),
        employeeService.getCompanyIntelligence(),
        employeeService.getSkills(),
        employeeService.getCareerTransitions(),
        employeeService.getLoanAffordability(),
        employeeService.getIncomeResilience()
      ]);
      setProfile(p);
      setCompany(c);
      setSkills(s);
      setTransitions(t);
      setLoan(lRes.data);
      setResilience(r);
      if (p) {
        setEditForm({
          designation: p.designation,
          department: p.department,
          yearsOfExperience: p.yearsOfExperience,
          monthlyTakeHome: p.monthlyTakeHome,
          location: p.location
        });
      }
    } catch (err) {
      console.error('Failed to load employee intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const updated = await employeeService.updateProfile(editForm);
      setProfile(updated);
      setEditProfileOpen(false);
      setSnackbarMessage('Profile updated in PostgreSQL. Recalculating financial resilience...');
      const [lRes, r] = await Promise.all([
        employeeService.getLoanAffordability(),
        employeeService.getIncomeResilience()
      ]);
      setLoan(lRes.data);
      setResilience(r);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setSnackbarMessage('Error updating profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLevelUpSkill = async (skill: EmployeeSkill) => {
    if (skill.currentLevel >= 5) {
      setSnackbarMessage(`${skill.skillName} is already at mastery level (5/5).`);
      return;
    }
    try {
      const nextLevel = skill.currentLevel + 1;
      const res = await employeeService.updateSkill(skill.id, nextLevel);
      setSkills(prev => prev.map(s => s.id === skill.id ? (res.skill || (res as any).updatedSkill) : s));
      if (profile) {
        setProfile({ ...profile, careerResilienceScore: res.careerResilienceScore });
      }
      setSnackbarMessage(
        `Upgraded ${skill.skillName} to Level ${nextLevel}/5! Career Resilience score dynamically increased to ${res.careerResilienceScore}/100.`
      );
    } catch (err: any) {
      console.error('Failed to update skill level:', err);
      setSnackbarMessage('Failed to update skill: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExportReport = async () => {
    try {
      const report = await employeeService.exportReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FINFOLIO_${report.employee.id}_Resilience_Audit.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSnackbarMessage('Employee Resilience Audit report exported successfully.');
    } catch (err: any) {
      setSnackbarMessage('Failed to export report: ' + err.message);
    }
  };

  const handleShareReport = () => {
    const text = `💼 *FINFOLIO Career & Corporate Intelligence Report*
----------------------------------------
• *Employee:* ${profile?.employeeName || 'Rahul Sharma'} (${profile?.employeeId || 'EMP-RKVT-1001'})
• *Designation:* ${profile?.designation || 'Software Engineer'}
• *Employer:* ${company?.name || 'Example Technologies Pvt. Ltd.'}
• *Company Risk Level:* ${company?.riskLevel || 'MODERATE'}
• *Job Stability Score:* ${profile?.jobStabilityScore || 74}/100
• *Career Resilience Score:* ${resilience?.incomeResilienceScore || 61}/100
• *Take-Home Salary:* ₹${(profile?.monthlyTakeHome || 65000).toLocaleString('en-IN')}/month
----------------------------------------
Platform: FINFOLIO — Indian Employee Financial Resilience Platform`;

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Container>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return theme.palette.success.main;
      case 'MODERATE':
        return theme.palette.warning.main;
      case 'ELEVATED':
      case 'HIGH':
      case 'CRITICAL':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };

  // Loan simulator math
  const monthlyRate = calcInterestRate / (12 * 100);
  const totalMonths = calcTenureYears * 12;
  const simulatedEmi = Math.round(
    (calcLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
  const takeHome = profile?.monthlyTakeHome || 65000;
  const existingEmi = loan?.existingEmi || 8000;
  const simulatedTotalEmi = existingEmi + simulatedEmi;
  const simulatedDti = Math.round((simulatedTotalEmi / takeHome) * 100);
  const safeEmi = loan?.maxSafeEmi || 10000;
  const isSimulatedSafe = simulatedEmi <= safeEmi;

  return (
    <ClientOnly>
      <Head>
        <title>Career & Company Intelligence | FINFOLIO</title>
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 1. EMPLOYEE IDENTITY HEADER */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: '#2563eb',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  RS
                </Avatar>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {profile?.employeeName || 'Rahul Sharma (Demo User)'}
                    </Typography>
                    <Chip
                      icon={<BadgeOutlined sx={{ fontSize: '1rem !important', color: '#fff !important' }} />}
                      label={profile?.employeeId || 'EMP-RKVT-1001'}
                      sx={{
                        bgcolor: 'rgba(37, 99, 235, 0.9)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    />
                    <Tooltip title="Edit Profile Details">
                      <IconButton
                        size="small"
                        onClick={() => setEditProfileOpen(true)}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <strong>{profile?.designation}</strong> • {profile?.department} •{' '}
                    <Business sx={{ fontSize: '1rem', ml: 0.5 }} /> {profile?.companyName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <LocationOn sx={{ fontSize: '0.9rem' }} /> {profile?.location} • {profile?.yearsOfExperience} yrs exp • {profile?.education}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
              >
                <Box sx={{ textAlign: { xs: 'left', md: 'right' }, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Monthly Take-Home</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#38bdf8' }}>
                    {formatAmount(profile?.monthlyTakeHome || 65000)}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: { xs: 'left', md: 'right' }, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Job Stability</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#4ade80' }}>
                    {profile?.jobStabilityScore || 74}/100
                  </Typography>
                </Box>

                <Box sx={{ textAlign: { xs: 'left', md: 'right' }, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Company Risk</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#fbbf24' }}>
                    {company?.riskLevel || 'MODERATE'}
                  </Typography>
                </Box>

                <Tooltip title="Export Complete Intelligence Snapshot">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download />}
                    onClick={handleExportReport}
                    sx={{
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    Export
                  </Button>
                </Tooltip>

                <Tooltip title="Share Career Intelligence Report on WhatsApp">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<WhatsAppIcon />}
                    onClick={handleShareReport}
                    sx={{
                      color: '#fff',
                      borderColor: '#25D366',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': { borderColor: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.15)' }
                    }}
                  >
                    Share (WhatsApp)
                  </Button>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* TABS */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab label="Company Financial Outlook" icon={<Business />} iconPosition="start" />
            <Tab label="Skills Gap & Resilience Roadmap" icon={<Psychology />} iconPosition="start" />
            <Tab label="Career Transition Mode" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Resilient Loan Affordability" icon={<AccountBalance />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* TAB 0: COMPANY FINANCIAL OUTLOOK */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Company Stability Meter</Typography>
                    <Chip
                      label={company?.riskLevel || 'MODERATE'}
                      color={company?.riskLevel === 'MODERATE' ? 'warning' : 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>

                  <Box sx={{ my: 3, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: getRiskColor(company?.riskLevel || 'MODERATE') }}>
                      {company?.healthScore || 72}/100
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      Corporate Health Score
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2">Employment Stability</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{company?.stabilityScore || 68}/100</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={company?.stabilityScore || 68}
                        color="warning"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2">Business Growth Score</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{company?.growthScore || 58}/100</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={company?.growthScore || 58}
                        color="warning"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Stack>

                  <Stack direction="column" spacing={1} sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<HelpOutline />}
                      onClick={() => setCompanyRiskOpen(true)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                      Explain Company Risk
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      startIcon={<Security />}
                      onClick={() => setPersonalImpactOpen(true)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                      How Does This Affect Me?
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Corporate Outlook & Layoff Signals
                  </Typography>

                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>Elevated Organizational Caution</AlertTitle>
                    {company?.riskExplanation}
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Revenue Trend</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{company?.revenueTrend}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Profit & Margin</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{company?.profitTrend}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Headcount Growth</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                          {company?.employeeGrowth}% YoY (Attrition: {company?.attritionRate}%)
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Hiring Status</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{company?.hiringTrend}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Restructuring / Layoffs</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {company?.layoffTrend}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Debt & Funding</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {company?.fundingStatus} • {company?.debtExposure}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 1: SKILLS GAP & RESILIENCE ROADMAP */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ p: 3, borderRadius: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.04), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Career Resilience Score Optimization
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile?.careerRiskExplanation}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center">
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Current</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {profile?.careerResilienceScore || 61}/100
                        </Typography>
                      </Box>
                      <ArrowForward sx={{ color: 'primary.main', fontSize: '2rem' }} />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Target Potential</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                          {profile?.potentialResilienceScore || 84}/100
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* ROADMAP TIMELINE */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Prioritized 3-Tier Upskilling Roadmap
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: 3, borderTop: '4px solid #ef4444' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ef4444' }}>Phase 1: 0–3 Months</Typography>
                    <Chip label="CRITICAL PRIORITY" size="small" color="error" sx={{ fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Cloud / AWS Solutions</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Level: {skills.find(s => s.skillName.includes('AWS') || s.skillName.includes('Cloud'))?.currentLevel || 2}/5 → 4/5
                  </Typography>
                  <Typography variant="body2" sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
                    AWS Certified Solutions Architect Associate: Master VPC networking, IAM least privilege, ECS Fargate containers, and resilient Multi-AZ architecture.
                  </Typography>
                  {(() => {
                    const sk = skills.find(s => s.skillName.includes('AWS') || s.skillName.includes('Cloud'));
                    return sk ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        fullWidth
                        startIcon={<AutoAwesome />}
                        onClick={() => handleLevelUpSkill(sk)}
                        disabled={sk.currentLevel >= 5}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                      >
                        {sk.currentLevel >= 5 ? 'Mastery Reached (5/5)' : `Mark Progress (+1 Level to ${sk.currentLevel + 1}/5)`}
                      </Button>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: 3, borderTop: '4px solid #f59e0b' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f59e0b' }}>Phase 2: 3–6 Months</Typography>
                    <Chip label="HIGH PRIORITY" size="small" color="warning" sx={{ fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Applied AI/ML & LLM Ops</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Level: {skills.find(s => s.skillName.includes('AI') || s.skillName.includes('ML'))?.currentLevel || 1}/5 → 3/5
                  </Typography>
                  <Typography variant="body2" sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
                    Applied Generative AI: LangChain orchestration, RAG vector embeddings, FastAPI microservices, and local model inference for enterprise automation.
                  </Typography>
                  {(() => {
                    const sk = skills.find(s => s.skillName.includes('AI') || s.skillName.includes('ML'));
                    return sk ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        fullWidth
                        startIcon={<AutoAwesome />}
                        onClick={() => handleLevelUpSkill(sk)}
                        disabled={sk.currentLevel >= 5}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, color: '#fff' }}
                      >
                        {sk.currentLevel >= 5 ? 'Mastery Reached (5/5)' : `Mark Progress (+1 Level to ${sk.currentLevel + 1}/5)`}
                      </Button>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: 3, borderTop: '4px solid #3b82f6' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#3b82f6' }}>Phase 3: 6–12 Months</Typography>
                    <Chip label="MEDIUM PRIORITY" size="small" color="info" sx={{ fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>DevOps & Kubernetes</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Level: {skills.find(s => s.skillName.includes('DevOps') || s.skillName.includes('Docker'))?.currentLevel || 2}/5 → 4/5
                  </Typography>
                  <Typography variant="body2" sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
                    Docker multi-stage builds, Kubernetes Helm charts, cluster autoscaling, and automated GitHub Actions CI/CD pipelines.
                  </Typography>
                  {(() => {
                    const sk = skills.find(s => s.skillName.includes('DevOps') || s.skillName.includes('Docker'));
                    return sk ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="info"
                        fullWidth
                        startIcon={<AutoAwesome />}
                        onClick={() => handleLevelUpSkill(sk)}
                        disabled={sk.currentLevel >= 5}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                      >
                        {sk.currentLevel >= 5 ? 'Mastery Reached (5/5)' : `Mark Progress (+1 Level to ${sk.currentLevel + 1}/5)`}
                      </Button>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            </Grid>

            {/* FULL SKILLS INVENTORY TABLE */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Complete Skills Matrix & Competency Gaps
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click "Level Up" to simulate completing certification or course modules live
                    </Typography>
                  </Stack>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Skill Name</strong></TableCell>
                          <TableCell><strong>Current Level</strong></TableCell>
                          <TableCell><strong>Required Level</strong></TableCell>
                          <TableCell><strong>Gap</strong></TableCell>
                          <TableCell><strong>Priority</strong></TableCell>
                          <TableCell><strong>Actionable Learning Path</strong></TableCell>
                          <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {skills.map((s) => (
                          <TableRow key={s.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{s.skillName}</TableCell>
                            <TableCell>{s.currentLevel}/5</TableCell>
                            <TableCell>{s.targetLevel}/5</TableCell>
                            <TableCell>
                              {s.gapLevel === 0 ? (
                                <Chip label="Aligned" size="small" color="success" />
                              ) : (
                                <Chip label={`+${s.gapLevel}`} size="small" color={s.priority === 'HIGH' || s.priority === 'CRITICAL' ? 'error' : 'warning'} />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={s.priority}
                                size="small"
                                color={s.priority === 'HIGH' || s.priority === 'CRITICAL' ? 'error' : s.priority === 'LOW' ? 'default' : 'warning'}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{s.learningPath}</TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Why this skill matters for resilience">
                                  <IconButton size="small" onClick={() => setSkillDetail(s)} color="primary">
                                    <HelpOutline fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => handleLevelUpSkill(s)}
                                  disabled={s.currentLevel >= 5}
                                  sx={{ textTransform: 'none', py: 0.2, px: 1, borderRadius: 1.5, fontSize: '0.75rem' }}
                                >
                                  Level Up (+1)
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 2: CAREER TRANSITION MODE */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert
                severity="info"
                icon={<Security sx={{ fontSize: '2rem' }} />}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
                  <Box>
                    <AlertTitle sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                      CAREER TRANSITION MODE: ACTIVATED
                    </AlertTitle>
                    <Typography variant="body2">
                      FINFOLIO automatically computes transferable role benchmarks when organizational stability score drops below 70.
                      Below are 4 verified alternative career tracks matching your Software Engineer background, sorted by immediate suitability.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CompareArrows />}
                    onClick={() => setCompareRolesOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
                  >
                    Compare All Roles
                  </Button>
                </Stack>
              </Alert>
            </Grid>

            {transitions.map((t) => (
              <Grid item xs={12} md={6} key={t.id}>
                <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          #{t.rankingOrder}. {t.targetRole}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Market Salary: {formatAmount(t.minSalary)} – {formatAmount(t.maxSalary)} / yr
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: t.matchPercentage >= 85 ? 'success.main' : 'primary.main' }}>
                          {t.matchPercentage}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Match Alignment</Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      {t.explanation}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block', mb: 0.5 }}>
                        Transferable Skills:
                      </Typography>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {t.keyTransferableSkills.map((sk) => (
                          <Chip key={sk} label={sk} size="small" color="success" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main', display: 'block', mb: 0.5 }}>
                        Missing / Gap Skills to Acquire:
                      </Typography>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {t.missingSkills.map((sk) => (
                          <Chip key={sk} label={sk} size="small" color="warning" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>

                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<Timeline />}
                      onClick={() => setTransitionPlanRole(t)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                      Build 30-60-90 Day Transition Plan
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* TAB 3: RESILIENT LOAN AFFORDABILITY */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert
                severity="warning"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
                  <Box>
                    <AlertTitle sx={{ fontWeight: 800 }}>
                      BANK ELIGIBILITY VS. FINFOLIO RESILIENT AFFORDABILITY
                    </AlertTitle>
                    <Typography variant="body2">
                      {loan?.resilienceDistinctionNotes}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<HelpOutline />}
                    onClick={() => setSafeEmiExplainOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap', color: '#fff' }}
                  >
                    Explain Safe EMI Math
                  </Button>
                </Stack>
              </Alert>
            </Grid>

            {/* COMPARISON CARDS */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '2px solid #10b981' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <CheckCircle sx={{ color: 'success.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                      FINFOLIO Resilient Safe Limit
                    </Typography>
                  </Stack>

                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1 }}>
                    {formatAmount(loan?.maxSafeEmi || 10000)} / mo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Recommended Additional Monthly EMI
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Safe Loan Principal Range:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatAmount(loan?.safeLoanMin || 600000)} – {formatAmount(loan?.safeLoanMax || 850000)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Conservative Loan Amount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatAmount(loan?.conservativeLoanAmount || 500000)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Post-EMI Discretionary Buffer:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatAmount(22000)} / mo
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Emergency Runway Protection:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                        Full 6.0 Months Intact (₹2,10,000)
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '1px dashed #ef4444', bgcolor: alpha(theme.palette.error.main, 0.02) }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Warning sx={{ color: 'error.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                      Retail Bank Maximum Approval
                    </Typography>
                  </Stack>

                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: 'error.main' }}>
                    {formatAmount(loan?.bankEligibleEmi || 24500)} / mo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Aggressive 50% FOIR Approval Ceiling
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Lender Approved Loan Amount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatAmount(loan?.bankEligibleLoanAmount || 2200000)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total Monthly Debt Burden:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                        {formatAmount(32500)} / mo (50% of take-home)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Post-EMI Discretionary Buffer:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                        ₹0 / mo (Zero cushion)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Runway Depletion in Job Loss:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                        Collapses from 6.0 mos to 3.1 mos
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* INTERACTIVE LOAN COMPARISON SIMULATOR */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Calculate color="primary" /> Interactive Loan Stress-Tester
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Test any prospective loan amount to see whether it falls inside your FINFOLIO Safe Resilience zone or enters the Bank Over-Leverage Hazard zone.
                </Typography>

                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Prospective Loan Principal: {formatAmount(calcLoanAmount)}
                    </Typography>
                    <Slider
                      value={calcLoanAmount}
                      min={200000}
                      max={2500000}
                      step={50000}
                      onChange={(_, v) => setCalcLoanAmount(v as number)}
                      sx={{
                        color: isSimulatedSafe ? 'success.main' : 'error.main'
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                      <Typography variant="caption" color="text.secondary">₹2,00,000</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>Safe Max: ₹8.5L</Typography>
                      <Typography variant="caption" color="text.secondary">₹25,00,000</Typography>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Tenure (Years)"
                          type="number"
                          size="small"
                          fullWidth
                          value={calcTenureYears}
                          onChange={(e) => setCalcTenureYears(Math.max(1, Math.min(30, Number(e.target.value))))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Interest Rate (%)"
                          type="number"
                          size="small"
                          fullWidth
                          value={calcInterestRate}
                          onChange={(e) => setCalcInterestRate(Math.max(5, Math.min(25, Number(e.target.value))))}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: isSimulatedSafe ? 'success.main' : 'error.main',
                        bgcolor: isSimulatedSafe ? alpha(theme.palette.success.main, 0.04) : alpha(theme.palette.error.main, 0.04)
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Simulated Monthly Impact
                        </Typography>
                        <Chip
                          label={isSimulatedSafe ? 'RESILIENT & SAFE' : 'HAZARDOUS OVER-LEVERAGE'}
                          color={isSimulatedSafe ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                      </Stack>

                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">New Loan Monthly EMI:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isSimulatedSafe ? 'success.main' : 'error.main' }}>
                            {formatAmount(simulatedEmi)} / mo
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Total Monthly EMI (Existing + New):</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {formatAmount(simulatedTotalEmi)} / mo
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Debt-to-Income (DTI) Ratio:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: simulatedDti <= 30 ? 'success.main' : 'error.main' }}>
                            {simulatedDti}% (Institutional safe benchmark: ≤ 30%)
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Remaining Monthly Surplus:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: (takeHome - 35000 - simulatedTotalEmi) >= 10000 ? 'success.main' : 'error.main' }}>
                            {formatAmount(Math.max(0, takeHome - 35000 - simulatedTotalEmi))} / mo
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  FinFolio Financial Advisor Recommendation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {loan?.affordabilityExplanation}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* ================= MODALS & DRAWERS ================= */}

        {/* 1. EDIT PROFILE MODAL */}
        <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit Employee Profile</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Designation / Role"
                fullWidth
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
              />
              <TextField
                label="Department"
                fullWidth
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
              <TextField
                label="Years of Experience"
                type="number"
                fullWidth
                value={editForm.yearsOfExperience}
                onChange={(e) => setEditForm({ ...editForm, yearsOfExperience: Number(e.target.value) })}
              />
              <TextField
                label="Monthly Take-Home Salary (₹)"
                type="number"
                fullWidth
                value={editForm.monthlyTakeHome}
                onChange={(e) => setEditForm({ ...editForm, monthlyTakeHome: Number(e.target.value) })}
                helperText="Synchronizes automatically with your financial resilience model and safe EMI calculations."
              />
              <TextField
                label="Location"
                fullWidth
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditProfileOpen(false)} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              sx={{ fontWeight: 700 }}
            >
              {savingProfile ? 'Saving to Database...' : 'Save & Recalculate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 2. EXPLAIN COMPANY RISK MODAL */}
        <Dialog open={companyRiskOpen} onClose={() => setCompanyRiskOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Corporate Health & Risk Breakdown</span>
            <IconButton onClick={() => setCompanyRiskOpen(false)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>{company?.name} (COMP-EX-001)</strong> corporate resilience is evaluated through 4 structural vectors:
            </Typography>
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  1. Profitability & Margin Compression (-3.4% EBITDA)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Operating margins contracted due to rising cloud infrastructure overhead and deferred client enterprise renewals. This increases pressure on non-core departmental budgets.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  2. Revenue Deceleration (8% YoY vs 28% prior cycle)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Top-line growth has plateaued. While the firm remains cash-flow viable, management is transitioning from aggressive expansion to capital conservation mode.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.main' }}>
                  3. Headcount Attrition & Selective Hiring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Attrition sits at 14.5% with selective replacements restricted to mission-critical infrastructure and AI automation roles.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  4. Capital Structure & Solvency
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Series B funded with moderate debt exposure. The company holds sufficient liquidity to navigate near-term market softness without distress liquidation.
                </Typography>
              </Paper>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setCompanyRiskOpen(false)}>Understood</Button>
          </DialogActions>
        </Dialog>

        {/* 3. PERSONAL IMPACT MODAL */}
        <Dialog open={personalImpactOpen} onClose={() => setPersonalImpactOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>How Company Risk Affects You Directly</span>
            <IconButton onClick={() => setPersonalImpactOpen(false)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Your current job stability score is <strong>{profile?.jobStabilityScore || 74}/100</strong>.
              </Alert>
              <Typography variant="body2">
                • <strong>Salary Increment Ceiling</strong>: Due to revenue deceleration (8%), annual appraisal pools will be compressed to 4%–6% instead of industry average 12%.
              </Typography>
              <Typography variant="body2">
                • <strong>Restructuring Insulation</strong>: Engineers with modern Cloud (AWS) and Applied AI skills have 3.2x higher retention priority during departmental re-alignments.
              </Typography>
              <Typography variant="body2">
                • <strong>Emergency Buffer Recommendation</strong>: Keep 6.0 months of essential expenses (₹2,10,000) fully funded to ensure zero forced debt if transition occurs.
              </Typography>
              <Typography variant="body2">
                • <strong>Loan Safeguard</strong>: Avoid bank ceiling loans (₹22.0L) that require ₹24,500/mo EMI. Stay within the safe ₹10,000/mo range to preserve cash flow.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setPersonalImpactOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* 4. SKILL DETAIL MODAL */}
        <Dialog open={Boolean(skillDetail)} onClose={() => setSkillDetail(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Skill Resilience Analysis: {skillDetail?.skillName}</span>
            <IconButton onClick={() => setSkillDetail(null)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {skillDetail && (
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">Competency Gap:</Typography>
                  <Chip
                    label={`Current: ${skillDetail.currentLevel}/5 → Target: ${skillDetail.targetLevel}/5`}
                    color={skillDetail.gapLevel === 0 ? 'success' : 'warning'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">Strategic Priority:</Typography>
                  <Chip label={skillDetail.priority} color={skillDetail.priority === 'HIGH' || skillDetail.priority === 'CRITICAL' ? 'error' : 'default'} />
                </Box>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Recommended Learning Curriculum:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {skillDetail.learningPath}
                  </Typography>
                </Paper>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Closing this skill gap contributes directly to raising your career resilience score towards the {profile?.potentialResilienceScore || 84}/100 target.
                </Alert>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            {skillDetail && (
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => {
                  handleLevelUpSkill(skillDetail);
                  setSkillDetail(null);
                }}
                disabled={skillDetail.currentLevel >= 5}
              >
                Level Up This Skill (+1)
              </Button>
            )}
            <Button onClick={() => setSkillDetail(null)} color="inherit">Close</Button>
          </DialogActions>
        </Dialog>

        {/* 5. COMPARE ROLES MODAL */}
        <Dialog open={compareRolesOpen} onClose={() => setCompareRolesOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Career Transition Match Matrix</span>
            <IconButton onClick={() => setCompareRolesOpen(false)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Target Role</strong></TableCell>
                    <TableCell><strong>Match %</strong></TableCell>
                    <TableCell><strong>Market Salary Range</strong></TableCell>
                    <TableCell><strong>Transferable Skills</strong></TableCell>
                    <TableCell><strong>Skill Gaps to Bridge</strong></TableCell>
                    <TableCell><strong>Suitability</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transitions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{t.targetRole}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${t.matchPercentage}%`}
                          color={t.matchPercentage >= 85 ? 'success' : 'primary'}
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell>{formatAmount(t.minSalary)} – {formatAmount(t.maxSalary)}</TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {t.keyTransferableSkills.slice(0, 3).map(s => (
                            <Chip key={s} label={s} size="small" variant="outlined" color="success" />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {t.missingSkills.map(s => (
                            <Chip key={s} label={s} size="small" variant="outlined" color="warning" />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.skillsGapLevel === 'Low' ? 'Immediate Transfer' : 'Short Roadmap'}
                          size="small"
                          color={t.skillsGapLevel === 'Low' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setCompareRolesOpen(false)}>Done</Button>
          </DialogActions>
        </Dialog>

        {/* 6. TRANSITION PLAN MODAL */}
        <Dialog open={Boolean(transitionPlanRole)} onClose={() => setTransitionPlanRole(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>30-60-90 Day Transition Plan: {transitionPlanRole?.targetRole}</span>
            <IconButton onClick={() => setTransitionPlanRole(null)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {transitionPlanRole && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Match Alignment: {transitionPlanRole.matchPercentage}% • Expected Salary: {formatAmount(transitionPlanRole.minSalary)} – {formatAmount(transitionPlanRole.maxSalary)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {transitionPlanRole.explanation}
                  </Typography>
                </Box>
                <Divider />
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ef4444', mb: 0.5 }}>
                    Days 1–30: Foundation & Core Gap Closing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Focus on: <strong>{transitionPlanRole.missingSkills[0] || 'Cloud & Core Architecture'}</strong>. Build a functional prototype repository demonstrating hands-on architectural competence.
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                    Days 31–60: Production Readiness & Portfolio Validation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Focus on: <strong>{transitionPlanRole.missingSkills[1] || 'Orchestration & Scale'}</strong>. Deploy production CI/CD pipelines, containerize backend microservices, and publish documentation.
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981', mb: 0.5 }}>
                    Days 61–90: Market Benchmarking & Active Applications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Benchmark resume against market job descriptions, leverage transferable skills ({transitionPlanRole.keyTransferableSkills.join(', ')}), and initiate referral interviews.
                  </Typography>
                </Paper>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setTransitionPlanRole(null)}>Close Plan</Button>
          </DialogActions>
        </Dialog>

        {/* 7. SAFE EMI EXPLANATION MODAL */}
        <Dialog open={safeEmiExplainOpen} onClose={() => setSafeEmiExplainOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Why FinFolio Safe EMI is ₹10,000 (Not Bank ₹24,500)</span>
            <IconButton onClick={() => setSafeEmiExplainOpen(false)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Typography variant="body2">
                Traditional retail banks look only at gross lending ceilings, approving up to <strong>50% FOIR (Fixed Obligation to Income Ratio)</strong>. For your take-home of ₹65,000, banks will happily approve a ₹24,500 monthly EMI.
              </Typography>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <strong>The Bank Lending Hazard</strong>: Taking a ₹24,500 EMI would raise your total debt burden to ₹32,500/mo (50% of income), completely wiping out your ₹22,000 monthly discretionary buffer. If an economic shock or restructuring occurs, your emergency runway collapses from 6.0 months to just 3.1 months.
              </Alert>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <strong>The FINFOLIO Resilient Standard</strong>: We cap additional EMI at ₹10,000/mo (approx 15% of net take-home). This gives you ₹6.0L to ₹8.5L in borrowing capacity while ensuring:
                <br />• ₹22,000 monthly living surplus remains untouched.
                <br />• Your full 6.0 months emergency runway remains 100% intact.
                <br />• Total DTI stays below a conservative 27.7%.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setSafeEmiExplainOpen(false)}>Understood</Button>
          </DialogActions>
        </Dialog>

        {/* FEEDBACK SNACKBAR */}
        <Snackbar
          open={Boolean(snackbarMessage)}
          autoHideDuration={5000}
          onClose={() => setSnackbarMessage(null)}
          message={snackbarMessage}
        />
      </Container>
    </ClientOnly>
  );
};

export default CareerPage;
