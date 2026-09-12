import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  Calculate,
  ContentCopy,
  Download,
  Share,
  RestartAlt,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  Warning,
  ErrorOutline,
  Speed,
  Shield,
  SwapHoriz,
} from '@mui/icons-material';
import api from '@/utils/axiosClient';
import {
  buildRecommendationSummary,
  calculateEmi,
  formatInr,
  getCreditBand,
  getFoirBand,
  normalizeLoanRequest,
  validateLoanRequest,
  type LoanRecommendationRequest,
  type LoanRecommendationResponse,
  type ValidationErrors,
} from '@/utils/loanRecommendation';

// Workaround for MUI v7 Grid typings
const GridTyped = Grid as any;

const initialForm: LoanRecommendationRequest = {
  annualIncome: 1200000,
  monthlyExpenses: 35000,
  existingEmi: 5000,
  desiredLoanAmount: 700000,
  tenureMonths: 60,
  creditScore: 740,
  employmentYears: 4,
  loanType: 'personal_loan',
};

export default function LoanRecommendationPage() {
  const [form, setForm] = useState<LoanRecommendationRequest>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [result, setResult] = useState<LoanRecommendationResponse | null>(null);

  const PROFILE_PRESETS: Array<{ label: string; data: LoanRecommendationRequest }> = [
    {
      label: 'Salaried Starter',
      data: {
        annualIncome: 720000,
        monthlyExpenses: 28000,
        existingEmi: 2000,
        desiredLoanAmount: 300000,
        tenureMonths: 48,
        creditScore: 705,
        employmentYears: 2,
        loanType: 'personal_loan',
      },
    },
    {
      label: 'Home Buyer',
      data: {
        annualIncome: 1800000,
        monthlyExpenses: 52000,
        existingEmi: 6000,
        desiredLoanAmount: 4200000,
        tenureMonths: 240,
        creditScore: 770,
        employmentYears: 7,
        loanType: 'home_loan',
      },
    },
    {
      label: 'Business Expansion',
      data: {
        annualIncome: 2400000,
        monthlyExpenses: 85000,
        existingEmi: 15000,
        desiredLoanAmount: 2500000,
        tenureMonths: 84,
        creditScore: 730,
        employmentYears: 5,
        loanType: 'business_loan',
      },
    },
  ];

  const TENURE_PRESETS = [12, 24, 36, 60, 84, 120, 240];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem('loanRecommendation:lastProfile');
    if (!cached) return;

    try {
      const parsed = JSON.parse(cached) as LoanRecommendationRequest;
      setForm(parsed);
    } catch {
      // Ignore corrupted cache
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('loanRecommendation:lastProfile', JSON.stringify(form));
  }, [form]);

  const currentFoir = useMemo(() => {
    const monthlyIncome = form.annualIncome / 12;
    if (monthlyIncome <= 0) return 0;
    return Number((((form.monthlyExpenses + (form.existingEmi || 0)) / monthlyIncome) * 100).toFixed(1));
  }, [form]);

  const currentCreditBand = useMemo(() => getCreditBand(form.creditScore), [form.creditScore]);
  const currentFoirBand = useMemo(() => getFoirBand(currentFoir), [currentFoir]);

  const estimatedRate = useMemo(() => {
    if (form.creditScore >= 760) return 8.8;
    if (form.creditScore >= 720) return 10.2;
    if (form.creditScore >= 680) return 11.9;
    return 13.8;
  }, [form.creditScore]);

  const estimatedEmi = useMemo(() => {
    return Math.round(calculateEmi(form.desiredLoanAmount, estimatedRate, form.tenureMonths));
  }, [form.desiredLoanAmount, estimatedRate, form.tenureMonths]);

  const stressScenario = useMemo(() => {
    if (!result) return null;
    const stressedRate = result.recommendedInterestRate + 1;
    const stressedEmi = Math.round(calculateEmi(form.desiredLoanAmount, stressedRate, form.tenureMonths));
    const monthlyIncome = form.annualIncome / 12;
    const stressedFoir = monthlyIncome > 0
      ? (((form.monthlyExpenses * 1.1) + (form.existingEmi || 0) + stressedEmi) / monthlyIncome) * 100
      : 100;

    return {
      stressedRate: Number(stressedRate.toFixed(2)),
      stressedEmi,
      stressedFoir: Number(stressedFoir.toFixed(1)),
    };
  }, [form, result]);

  // Refinancing Calculator State
  const [refinanceBalance, setRefinanceBalance] = useState(600000);
  const [currentRate, setCurrentRate] = useState(13.5);
  const [newRate, setNewRate] = useState(9.25);
  const [refinanceTenure, setRefinanceTenure] = useState(48);
  const [closingFeePercent, setClosingFeePercent] = useState(1.0);

  const refinanceCalc = useMemo(() => {
    const currentEmi = calculateEmi(refinanceBalance, currentRate, refinanceTenure);
    const newEmi = calculateEmi(refinanceBalance, newRate, refinanceTenure);
    const monthlySavings = currentEmi - newEmi;
    const upfrontFee = (refinanceBalance * closingFeePercent) / 100;
    const breakEvenMonths = monthlySavings > 0 ? Math.ceil(upfrontFee / monthlySavings) : 0;
    const totalCurrentPayment = currentEmi * refinanceTenure;
    const totalNewPayment = newEmi * refinanceTenure + upfrontFee;
    const netSavings = Math.max(0, totalCurrentPayment - totalNewPayment);

    return {
      currentEmi: Math.round(currentEmi),
      newEmi: Math.round(newEmi),
      monthlySavings: Math.round(monthlySavings),
      upfrontFee: Math.round(upfrontFee),
      breakEvenMonths,
      netSavings: Math.round(netSavings),
      isViable: monthlySavings > 0 && breakEvenMonths <= refinanceTenure,
    };
  }, [refinanceBalance, currentRate, newRate, refinanceTenure, closingFeePercent]);

  const onNumberChange = (key: keyof LoanRecommendationRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    setForm((prev) => ({ ...prev, [key]: Number(rawValue) }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submitRecommendation = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationResult = validateLoanRequest(form);
    setFormErrors(validationResult);
    if (Object.keys(validationResult).length > 0) {
      setError('Please fix form validation errors before generating recommendation.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = normalizeLoanRequest(form);
      const response = await api.post<LoanRecommendationResponse>('/finance/loan-recommendation', payload);
      setResult(response.data);
    } catch (requestError: any) {
      setResult(null);
      setError(requestError?.response?.data?.error || 'Unable to generate recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: LoanRecommendationRequest) => {
    setForm(preset);
    setError('');
    setFormErrors({});
  };

  const resetProfile = () => {
    setForm(initialForm);
    setResult(null);
    setError('');
    setFormErrors({});
  };

  const exportResultAsJson = () => {
    if (!result || typeof window === 'undefined') return;
    const fileName = `loan-recommendation-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify({ profile: form, result }, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    if (!result || typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyState('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(buildRecommendationSummary(result));
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 3000);
    } catch {
      setCopyState('failed');
    }
  };

  const shareOnWhatsApp = () => {
    if (!result) return;
    const summary = buildRecommendationSummary(result);
    const shareText = `📊 *FINFOLIO Loan Underwriting & Affordability Analysis*\n\n${summary}\n\nPlatform: FINFOLIO — Indian Employee Resilience Engine`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  };

  const getDecisionChipColor = (decision: string): 'success' | 'warning' | 'error' => {
    if (decision === 'approved') return 'success';
    if (decision === 'declined') return 'error';
    return 'warning';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Banner */}
      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(14,116,144,0.6), rgba(15,23,42,0.95))'
                : 'linear-gradient(135deg, #0a4f8f 0%, #0d9488 100%)',
            color: '#ffffff',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="800">
                🏛️ Loan Advisor &amp; Institutional Underwriting
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.8, maxWidth: 850 }}>
                Real-world bank underwriting checks using affordability (FOIR), credit behavior (CIBIL), and RBI guidelines exclusively calibrated in Indian Rupees (₹).
              </Typography>
            </Box>
            <Chip
              label="🇮🇳 Indian Rupee (₹) Only"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }}
            />
          </Box>
        </Paper>
      </Box>

      <GridTyped container spacing={3.5}>
        {/* Left Column: Applicant Profile Form */}
        <GridTyped item xs={12} lg={5}>
          <Card sx={{ p: 3, borderRadius: 3.5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight="800" sx={{ mb: 2 }}>
              1. Applicant Profile &amp; Debt Request
            </Typography>

            {/* Presets */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ display: 'block', mb: 1 }}>
                ⚡ Quick Profiles:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {PROFILE_PRESETS.map((preset) => (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    onClick={() => applyPreset(preset.data)}
                    variant="outlined"
                    size="small"
                    clickable
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                ))}
              </Stack>
            </Box>

            <Box component="form" onSubmit={submitRecommendation}>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="loanType-label">Loan Type</InputLabel>
                  <Select
                    labelId="loanType-label"
                    value={form.loanType}
                    label="Loan Type"
                    onChange={(e) => setForm((prev) => ({ ...prev, loanType: e.target.value as any }))}
                  >
                    <MenuItem value="personal_loan">Personal Loan</MenuItem>
                    <MenuItem value="home_loan">Home Loan</MenuItem>
                    <MenuItem value="car_loan">Car Loan</MenuItem>
                    <MenuItem value="education_loan">Education Loan</MenuItem>
                    <MenuItem value="business_loan">Business Loan</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Annual Income"
                  type="number"
                  value={form.annualIncome}
                  onChange={onNumberChange('annualIncome')}
                  error={Boolean(formErrors.annualIncome)}
                  helperText={formErrors.annualIncome}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Monthly Expenses"
                  type="number"
                  value={form.monthlyExpenses}
                  onChange={onNumberChange('monthlyExpenses')}
                  error={Boolean(formErrors.monthlyExpenses)}
                  helperText={formErrors.monthlyExpenses}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Existing EMI Obligations"
                  type="number"
                  value={form.existingEmi}
                  onChange={onNumberChange('existingEmi')}
                  error={Boolean(formErrors.existingEmi)}
                  helperText={formErrors.existingEmi}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Desired Loan Amount"
                  type="number"
                  value={form.desiredLoanAmount}
                  onChange={onNumberChange('desiredLoanAmount')}
                  error={Boolean(formErrors.desiredLoanAmount)}
                  helperText={formErrors.desiredLoanAmount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />

                <GridTyped container spacing={2}>
                  <GridTyped item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tenure (Months)"
                      type="number"
                      value={form.tenureMonths}
                      onChange={onNumberChange('tenureMonths')}
                      error={Boolean(formErrors.tenureMonths)}
                      helperText={formErrors.tenureMonths}
                    />
                  </GridTyped>
                  <GridTyped item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Credit Score (CIBIL)"
                      type="number"
                      value={form.creditScore}
                      onChange={onNumberChange('creditScore')}
                      error={Boolean(formErrors.creditScore)}
                      helperText={formErrors.creditScore}
                    />
                  </GridTyped>
                </GridTyped>

                <TextField
                  fullWidth
                  size="small"
                  label="Employment Stability (Years)"
                  type="number"
                  value={form.employmentYears}
                  onChange={onNumberChange('employmentYears')}
                  error={Boolean(formErrors.employmentYears)}
                  helperText={formErrors.employmentYears}
                />

                {/* Tenure Shortcuts */}
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ display: 'block', mb: 0.8 }}>
                    Tenure Shortcuts:
                  </Typography>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    {TENURE_PRESETS.map((months) => (
                      <Chip
                        key={months}
                        label={`${months}m`}
                        size="small"
                        color={form.tenureMonths === months ? 'primary' : 'default'}
                        variant={form.tenureMonths === months ? 'filled' : 'outlined'}
                        onClick={() => setForm((prev) => ({ ...prev, tenureMonths: months }))}
                        clickable
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Live Underwriter FOIR Preview */}
                <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">
                      Current FOIR (Before New Loan)
                    </Typography>
                    <Chip
                      label={`${currentFoir}% • ${currentFoirBand.label}`}
                      size="small"
                      color={currentFoir > 45 ? 'error' : currentFoir > 35 ? 'warning' : 'success'}
                      sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, currentFoir)}
                    color={currentFoir > 45 ? 'error' : currentFoir > 35 ? 'warning' : 'success'}
                    sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Est. EMI @ {estimatedRate}% APR:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="800" color="primary.main">
                      {formatInr(estimatedEmi)} / mo
                    </Typography>
                  </Box>
                </Paper>

                {/* Action Buttons */}
                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={<Calculate />}
                    sx={{
                      py: 1.2,
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2.5,
                      background: 'linear-gradient(135deg, #0a4f8f 0%, #0d9488 100%)',
                    }}
                  >
                    {loading ? 'Underwriting Analysis...' : 'Get Loan Recommendation'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={resetProfile}
                    startIcon={<RestartAlt />}
                    sx={{ borderRadius: 2.5, textTransform: 'none' }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Card>
        </GridTyped>

        {/* Right Column: Underwriting Results */}
        <GridTyped item xs={12} lg={7}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {!result && !error && (
            <Card sx={{ p: 5, borderRadius: 3.5, border: '1px solid', borderColor: 'divider', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box>
                <Speed sx={{ fontSize: 56, color: 'primary.main', opacity: 0.8, mb: 1.5 }} />
                <Typography variant="h5" fontWeight="800" gutterBottom>
                  Ready for Institutional Underwriting
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto' }}>
                  Click &ldquo;Get Loan Recommendation&rdquo; to simulate commercial bank underwriting guidelines, evaluate debt capacity, and assess default likelihood.
                </Typography>
              </Box>
            </Card>
          )}

          {result && (
            <Card sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid', borderColor: 'divider' }}>
              {/* Result Header & Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h6" fontWeight="800">
                    Underwriting Decision
                  </Typography>
                  <Chip
                    label={result.decision.toUpperCase()}
                    color={getDecisionChipColor(result.decision)}
                    sx={{ fontWeight: 900, letterSpacing: 0.5, px: 1 }}
                  />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopy fontSize="small" />}
                    onClick={copySummary}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    {copyState === 'copied' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Download fontSize="small" />}
                    onClick={exportResultAsJson}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Export
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Share fontSize="small" />}
                    onClick={shareOnWhatsApp}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      bgcolor: '#25D366',
                      color: '#ffffff',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#128C7E' },
                    }}
                  >
                    WhatsApp Share
                  </Button>
                </Stack>
              </Box>

              {/* 4 Key Metrics */}
              <GridTyped container spacing={2} sx={{ mb: 3 }}>
                <GridTyped item xs={6} sm={3}>
                  <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">APPROVAL ODDS</Typography>
                    <Typography variant="h5" fontWeight="900" color="primary.main" sx={{ mt: 0.5 }}>
                      {result.approvalProbability}%
                    </Typography>
                  </Paper>
                </GridTyped>
                <GridTyped item xs={6} sm={3}>
                  <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">RATE OFFERED</Typography>
                    <Typography variant="h5" fontWeight="900" color="text.primary" sx={{ mt: 0.5 }}>
                      {result.recommendedInterestRate}%
                    </Typography>
                  </Paper>
                </GridTyped>
                <GridTyped item xs={6} sm={3}>
                  <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">EXPECTED EMI</Typography>
                    <Typography variant="h5" fontWeight="900" color="success.main" sx={{ mt: 0.5 }}>
                      {formatInr(result.expectedEmi)}
                    </Typography>
                  </Paper>
                </GridTyped>
                <GridTyped item xs={6} sm={3}>
                  <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">MAX ELIGIBLE</Typography>
                    <Typography variant="h5" fontWeight="900" color="secondary.main" sx={{ mt: 0.5 }}>
                      {formatInr(result.maxEligibleLoanAmount)}
                    </Typography>
                  </Paper>
                </GridTyped>
              </GridTyped>

              {/* Affordability & Benchmark Cards */}
              <GridTyped container spacing={2} sx={{ mb: 3 }}>
                <GridTyped item xs={12} sm={6}>
                  <Paper sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1 }}>
                      📊 Affordability Snapshot
                    </Typography>
                    <Stack spacing={0.8} sx={{ fontSize: '0.82rem' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">FOIR After Loan:</Typography>
                        <Typography variant="body2" fontWeight="700">{result.affordability.foirAfterLoan}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Target FOIR Limit:</Typography>
                        <Typography variant="body2" fontWeight="700">{result.affordability.maxAllowedFoir}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Max Affordable EMI:</Typography>
                        <Typography variant="body2" fontWeight="700" color="success.main">{formatInr(result.affordability.maxAffordableEmi)}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </GridTyped>

                <GridTyped item xs={12} sm={6}>
                  <Paper sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1 }}>
                      🏛️ Historical Cohort Signals
                    </Typography>
                    <Stack spacing={0.8} sx={{ fontSize: '0.82rem' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Cohort Default Rate:</Typography>
                        <Typography variant="body2" fontWeight="700">{result.historicalSignals.historicalDefaultRate}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Benchmark Approval Rate:</Typography>
                        <Typography variant="body2" fontWeight="700">{result.historicalSignals.benchmarkApprovalRate}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Sample Size Analysed:</Typography>
                        <Typography variant="body2" fontWeight="700">{result.historicalSignals.sampleSize.toLocaleString('en-IN')}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </GridTyped>
              </GridTyped>

              {/* Stress Scenario */}
              {stressScenario && (
                <Paper sx={{ p: 2.5, borderRadius: 2.5, mb: 3, bgcolor: 'warning.main', color: '#1e293b', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border: '1px solid', borderColor: 'warning.main' }}>
                  <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning fontSize="small" color="warning" /> Stress Scenario (+10% Living Costs, +1% Interest Spike)
                  </Typography>
                  <GridTyped container spacing={2} sx={{ mt: 0.5 }}>
                    <GridTyped item xs={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Stressed EMI</Typography>
                      <Typography variant="subtitle2" fontWeight="800">{formatInr(stressScenario.stressedEmi)}</Typography>
                    </GridTyped>
                    <GridTyped item xs={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Stressed Rate</Typography>
                      <Typography variant="subtitle2" fontWeight="800">{stressScenario.stressedRate}%</Typography>
                    </GridTyped>
                    <GridTyped item xs={4}>
                      <Typography variant="caption" color="text.secondary" display="block">FOIR Under Shock</Typography>
                      <Typography variant="subtitle2" fontWeight="800" color={stressScenario.stressedFoir > 50 ? 'error.main' : 'warning.main'}>
                        {stressScenario.stressedFoir}%
                      </Typography>
                    </GridTyped>
                  </GridTyped>
                </Paper>
              )}

              {/* Key Reasons & Action Plan */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1 }}>
                  Underwriter Findings
                </Typography>
                <Stack spacing={0.8}>
                  {result.reasons.map((reason, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckCircle fontSize="small" color="primary" sx={{ mt: 0.2, fontSize: 16 }} />
                      <Typography variant="body2">{reason}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1 }}>
                  Actionable Next Steps
                </Typography>
                <Stack spacing={0.8}>
                  {result.recommendations.map((rec, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Shield fontSize="small" color="success" sx={{ mt: 0.2, fontSize: 16 }} />
                      <Typography variant="body2">{rec}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Card>
          )}
        </GridTyped>
      </GridTyped>

      {/* Refinancing & Institutional Standards Section */}
      <GridTyped container spacing={3.5} sx={{ mt: 2 }}>
        <GridTyped item xs={12} lg={7}>
          <Card sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SwapHoriz color="primary" />
                <Typography variant="h6" fontWeight="800">
                  Loan Refinancing &amp; Debt Break-Even Calculator
                </Typography>
              </Box>
              <Chip
                label={refinanceCalc.isViable ? 'Refinancing Lucrative' : 'Evaluate Closely'}
                color={refinanceCalc.isViable ? 'success' : 'warning'}
                size="small"
                sx={{ fontWeight: 800 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Calculate net interest savings and breakeven month when switching from high-cost debt to a lower-interest facility in Indian Rupees (₹).
            </Typography>

            <GridTyped container spacing={2} sx={{ mb: 3 }}>
              <GridTyped item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Outstanding Loan Balance"
                  type="number"
                  value={refinanceBalance}
                  onChange={(e) => setRefinanceBalance(Number(e.target.value))}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </GridTyped>
              <GridTyped item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remaining Tenure (Months)"
                  type="number"
                  value={refinanceTenure}
                  onChange={(e) => setRefinanceTenure(Number(e.target.value))}
                />
              </GridTyped>
              <GridTyped item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Current Rate (% p.a.)"
                  type="number"
                  value={currentRate}
                  onChange={(e) => setCurrentRate(Number(e.target.value))}
                />
              </GridTyped>
              <GridTyped item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="New Refinanced Rate (% p.a.)"
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                />
              </GridTyped>
              <GridTyped item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Processing Fee (%)"
                  type="number"
                  value={closingFeePercent}
                  onChange={(e) => setClosingFeePercent(Number(e.target.value))}
                />
              </GridTyped>
            </GridTyped>

            {/* Metric Results */}
            <GridTyped container spacing={2} sx={{ mb: 2 }}>
              <GridTyped item xs={6} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Current EMI</Typography>
                  <Typography variant="subtitle1" fontWeight="800" color="error.main">{formatInr(refinanceCalc.currentEmi)}</Typography>
                </Paper>
              </GridTyped>
              <GridTyped item xs={6} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">New EMI</Typography>
                  <Typography variant="subtitle1" fontWeight="800" color="success.main">{formatInr(refinanceCalc.newEmi)}</Typography>
                </Paper>
              </GridTyped>
              <GridTyped item xs={6} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Monthly Relief</Typography>
                  <Typography variant="subtitle1" fontWeight="800" color="primary.main">+{formatInr(refinanceCalc.monthlySavings)}</Typography>
                </Paper>
              </GridTyped>
              <GridTyped item xs={6} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Break-Even</Typography>
                  <Typography variant="subtitle1" fontWeight="800">{refinanceCalc.breakEvenMonths} Months</Typography>
                </Paper>
              </GridTyped>
            </GridTyped>

            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Net Lifetime Savings (After ₹{refinanceCalc.upfrontFee.toLocaleString('en-IN')} upfront fee):</Typography>
                <Typography variant="h6" fontWeight="900" color="success.main">{formatInr(refinanceCalc.netSavings)}</Typography>
              </Box>
              <Chip label={`Rate Delta: ${(currentRate - newRate).toFixed(2)}%`} color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
            </Paper>
          </Card>
        </GridTyped>

        <GridTyped item xs={12} lg={5}>
          <Card sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight="800" sx={{ mb: 1 }}>
              🏛️ Institutional Underwriting Standards
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              How Indian commercial lenders evaluate debt affordability:
            </Typography>

            <Stack spacing={2} sx={{ mb: 2 }}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="700">Tier-1 Banks (SBI, HDFC, ICICI)</Typography>
                  <Chip label="Max 45-50% FOIR" color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Strict collateral checks and CIBIL &gt; 750 required. Rejects unsecured debt if existing EMIs exceed 50% net monthly income.
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="700">Top NBFCs (Bajaj, Tata Capital)</Typography>
                  <Chip label="Max 55% FOIR" color="primary" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Accommodates variable incentives; prices ~1.5% to 2.5% higher APR with flexible eligibility.
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="700">Fintech / Peer-to-Peer</Typography>
                  <Chip label="Max 60% FOIR" color="warning" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Higher APR (16-24%), recommended only for short-term bridge liquidity or emergency consolidation.
                </Typography>
              </Paper>
            </Stack>

            <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
              <strong>Underwriter Tip:</strong> Prepaying high-cost credit lines 3 months prior to applying for a home loan noticeably reduces your FOIR and unlocks prime lending rates.
            </Alert>
          </Card>
        </GridTyped>
      </GridTyped>
    </Container>
  );
}
