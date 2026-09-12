/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  LinearProgress,
  InputAdornment,
  FormControl,
  Select,
  InputLabel,
  Stack,
  Divider,
  useTheme,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  AccountBalanceWallet,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  CheckCircle,
  AccountBalance,
  HourglassEmpty,
  PlayArrow,
  Cancel as CancelIcon,
  Shield,
  FileDownload,
  Search,
  Savings,
  Lock,
  VerifiedUser,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { useCurrency } from '@/context/CurrencyContext';
import {
  walletService,
  Wallet,
  WalletTransaction,
} from '../services/walletService';
import {
  withdrawalService,
  WithdrawalRequest,
  WithdrawalResponse,
} from '../services/withdrawalService';
import WithdrawalModal from '../components/WithdrawalModal';

const GridTyped = Grid as any;

const depositCategories = [
  'Salary Allocation',
  'Emergency Fund Transfer',
  'Bonus / Incentive',
  'Side Gig / Freelance',
  'Expense Savings Surplus',
  'General Deposit',
];

const withdrawalCategories = [
  'Dining & Restaurants',
  'Entertainment & Events',
  'Gadgets & Tech',
  'Travel & Vacation',
  'Clothing & Lifestyle',
  'Emergency Expense',
  'General Withdrawal',
];

const WalletPage = () => {
  const { currency, currencyInfo, formatAmount } = useCurrency();
  const theme = useTheme();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [totalDeposited, setTotalDeposited] = useState<number>(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [patternAdvisory, setPatternAdvisory] = useState<string | null>(null);

  // Search & Filter state for ledger
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Deposit modal
  const [openDeposit, setOpenDeposit] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [depositCategory, setDepositCategory] = useState<string>('Salary Allocation');
  const [depositReason, setDepositReason] = useState<string>('Monthly personal savings');
  const [depositSubmitting, setDepositSubmitting] = useState<boolean>(false);

  // Withdrawal modal (Consequence-Aware)
  const [openWithdraw, setOpenWithdraw] = useState<boolean>(false);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletData, withdrawalsData] = await Promise.all([
        walletService.getWallet(),
        withdrawalService.getWithdrawals(),
      ]);

      setWallet(walletData.wallet);
      setTransactions(walletData.recentTransactions || []);
      setWithdrawalRequests(withdrawalsData || []);
      setTotalDeposited(walletData.totalDeposited || 0);
      setTotalWithdrawn(walletData.totalWithdrawn || 0);

      // Check emergency patterns
      withdrawalService.getEmergencyPatterns().then(p => {
        if (p?.anomalyDetected && p.warnings.length > 0) {
          setPatternAdvisory(p.warnings[0] || null);
        } else {
          setPatternAdvisory(null);
        }
      }).catch(() => setPatternAdvisory(null));
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please provide a positive deposit amount.');
      return;
    }

    setDepositSubmitting(true);
    setError(null);
    try {
      const res = await walletService.deposit(amountNum, depositCategory, depositReason);
      setSuccessMsg(res.message || `Successfully deposited ₹${amountNum.toLocaleString('en-IN')}`);
      setOpenDeposit(false);
      fetchWalletData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Deposit failed.');
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleWithdrawalSuccess = (res: WithdrawalResponse) => {
    setSuccessMsg(res.message);
    fetchWalletData();
  };

  const [executingReq, setExecutingReq] = useState<WithdrawalRequest | null>(null);
  const [executionStep, setExecutionStep] = useState<'confirm' | 'pin'>('confirm');
  const [executePin, setExecutePin] = useState<string>('1234');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executedResult, setExecutedResult] = useState<{
    amount: number;
    previousBalance: number;
    newBalance: number;
    reason: string;
    id: number;
  } | null>(null);

  const handleStartExecute = (req: WithdrawalRequest) => {
    setExecutingReq(req);
    setExecutionStep('confirm');
    setExecutePin('1234');
  };

  const handleConfirmExecution = async () => {
    if (!executingReq) return;
    setIsExecuting(true);
    setError(null);
    try {
      const prevBal = currentBalance;
      const res = await withdrawalService.executeApproved(executingReq.id, executePin);
      const deducted = res.amountDeducted || executingReq.amount;
      const prev = res.previousBalance !== undefined ? res.previousBalance : prevBal;
      const newBal = res.newBalance !== undefined ? res.newBalance : Math.max(0, prevBal - deducted);

      setExecutedResult({
        amount: deducted,
        previousBalance: prev,
        newBalance: newBal,
        reason: executingReq.reason,
        id: executingReq.id,
      });

      setSuccessMsg(`Withdrawal of ₹${deducted.toLocaleString('en-IN')} executed successfully.`);
      setExecutingReq(null);
      setExecutionStep('confirm');
      fetchWalletData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to execute approved withdrawal');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await withdrawalService.cancelRequest(requestId);
      setSuccessMsg('Withdrawal request cancelled.');
      fetchWalletData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to cancel request');
    }
  };

  const currentBalance = wallet ? wallet.balance : 0;
  const netSavings = Math.round((totalDeposited - totalWithdrawn) * 100) / 100;

  // Virtual Sub-Vault Allocation Breakdown
  const subVaults = [
    { name: 'Emergency Buffer', ratio: 0.40, color: '#0ea5e9', icon: <Shield sx={{ fontSize: 18 }} />, desc: 'Liquid contingency for unexpected life events' },
    { name: 'Taxes & Essential Bills', ratio: 0.30, color: '#f59e0b', icon: <AccountBalance sx={{ fontSize: 18 }} />, desc: 'Fixed commitments, rent, utility & tax reserve' },
    { name: 'Milestone Goals Stash', ratio: 0.20, color: '#10b981', icon: <Savings sx={{ fontSize: 18 }} />, desc: 'Earmarked capital for high-priority targets' },
    { name: 'Discretionary Cash', ratio: 0.10, color: '#a855f7', icon: <Lock sx={{ fontSize: 18 }} />, desc: 'Guilt-free personal flexibility spend' },
  ];

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Reason/Notes', 'Amount', 'Currency', 'Status'];
    const rows = transactions.map(t => [
      t.id,
      `"${new Date(t.createdAt).toISOString()}"`,
      t.type,
      `"${t.category}"`,
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      t.amount,
      currency,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finfolio_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareReceipt = (res: { amount: number; previousBalance?: number; newBalance?: number; reason: string; id?: any }) => {
    const text = `🧾 *FINFOLIO Withdrawal & Payment Receipt*
----------------------------------------
• *Amount Deducted:* -${formatAmount(res.amount)}
• *Purpose:* ${res.reason || 'Protected Withdrawal'}
${res.previousBalance !== undefined ? `• *Previous Balance:* ${formatAmount(res.previousBalance)}\n` : ''}${res.newBalance !== undefined ? `• *New Wallet Balance:* ${formatAmount(res.newBalance)}\n` : ''}• *Nominee Governance:* Verified & Approved
• *Execution Status:* Authenticated via PIN
----------------------------------------
Platform: FINFOLIO — Indian Employee Financial Resilience Engine`;

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    const matchesSearch = !searchQuery || 
      (tx.reason && tx.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);
    return matchesType && matchesCategory && matchesSearch;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            💳 Simulated Savings Wallet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage cash reserves, record deposits, and track intentional withdrawals with an auditable transaction ledger.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => fetchWalletData()}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Notifications */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {patternAdvisory && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setPatternAdvisory(null)}>
          <strong>Notice:</strong> {patternAdvisory}
        </Alert>
      )}

      {/* Hero Wallet Card */}
      <GridTyped container spacing={3} sx={{ mb: 4 }}>
        <GridTyped item xs={12} md={7}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0369a1 100%)',
              color: 'white',
              borderRadius: 4,
              p: 3,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient FinFolio Logo in Background */}
            <Box
              component="img"
              src="/logo.png"
              alt="FinFolio Emblem"
              sx={{
                position: 'absolute',
                right: -20,
                bottom: -30,
                width: 220,
                height: 220,
                opacity: 0.12,
                pointerEvents: 'none',
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  component="img"
                  src="/logo.png"
                  alt="FinFolio"
                  sx={{ width: 40, height: 40, borderRadius: '50%' }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                    FINFOLIO SIMULATED VAULT
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Non-custodial Educational Simulation
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="SIMULATION ACTIVE"
                size="small"
                sx={{
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              />
            </Box>

            <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
              Available Liquidity
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, color: '#f8fafc', my: 1 }}>
              {formatAmount(currentBalance)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Currency: <span style={{ fontWeight: 700 }}>{currency}</span> • Non-negative constraint enforced
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<ArrowUpward />}
                onClick={() => setOpenDeposit(true)}
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' },
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                Deposit Funds
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowDownward />}
                onClick={() => setOpenWithdraw(true)}
                sx={{
                  color: '#f8fafc',
                  borderColor: 'rgba(255,255,255,0.4)',
                  '&:hover': { borderColor: '#f8fafc', backgroundColor: 'rgba(255,255,255,0.08)' },
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                Withdraw Funds
              </Button>
            </Box>
          </Card>
        </GridTyped>

        {/* Breakdown summary cards */}
        <GridTyped item xs={12} md={5}>
          <GridTyped container spacing={2}>
            <GridTyped item xs={6}>
              <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  TOTAL DEPOSITED
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>
                  +{formatAmount(totalDeposited)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Cumulative savings added
                </Typography>
              </Card>
            </GridTyped>
            <GridTyped item xs={6}>
              <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  TOTAL WITHDRAWN
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444', mt: 0.5 }}>
                  -{formatAmount(totalWithdrawn)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Discretionary spending
                </Typography>
              </Card>
            </GridTyped>
            <GridTyped item xs={6}>
              <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  NET RETAINED
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#3b82f6', mt: 0.5 }}>
                  {formatAmount(netSavings)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Total deposits minus outflows
                </Typography>
              </Card>
            </GridTyped>
            <GridTyped item xs={6}>
              <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  TOTAL TRANSACTIONS
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#6366f1', mt: 0.5 }}>
                  {transactions.length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Audited ledger records
                </Typography>
              </Card>
            </GridTyped>
          </GridTyped>
        </GridTyped>
      </GridTyped>

      {/* Virtual Sub-Vault Allocations Card */}
      <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, mb: 4, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWallet color="primary" />
                Virtual Sub-Vault Allocations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rule-based mental accounting partitions your liquid vault into protected purpose-specific reserves.
              </Typography>
            </Box>
            <Chip
              label="Auto-Partitioned"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <GridTyped container spacing={2}>
            {subVaults.map((vault) => {
              const allocatedAmount = currentBalance * vault.ratio;
              return (
                <GridTyped item xs={12} sm={6} md={3} key={vault.name}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: (theme) => alpha(theme.palette.divider, 0.8),
                      bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: vault.color }}>
                          {vault.icon}
                          <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                            {vault.name}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${Math.round(vault.ratio * 100)}%`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            bgcolor: alpha(vault.color, 0.12),
                            color: vault.color,
                          }}
                        />
                      </Box>
                      <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ my: 0.5 }}>
                        {formatAmount(allocatedAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, minHeight: 32 }}>
                        {vault.desc}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={vault.ratio * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: (theme) => alpha(theme.palette.divider, 0.4),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: vault.color,
                          borderRadius: 3,
                        }
                      }}
                    />
                  </Box>
                </GridTyped>
              );
            })}
          </GridTyped>
        </CardContent>
      </Card>

      {/* Transaction Ledger Table */}
      <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, mb: 4, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                📜 Auditable Transaction Ledger
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Immutable records of every simulated balance modification with multi-field search and CSV export.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownload />}
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Export CSV Ledger
            </Button>
          </Box>

          {/* Search and Filters Toolbar */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, mb: 2.5, alignItems: { md: 'center' } }}>
            <TextField
              size="small"
              placeholder="Search by notes, reason, category, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label="All"
                size="small"
                onClick={() => setFilterType('all')}
                color={filterType === 'all' ? 'primary' : 'default'}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Deposits"
                size="small"
                onClick={() => setFilterType('deposit')}
                color={filterType === 'deposit' ? 'success' : 'default'}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Withdrawals"
                size="small"
                onClick={() => setFilterType('withdrawal')}
                color={filterType === 'withdrawal' ? 'error' : 'default'}
                sx={{ fontWeight: 700 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="category-filter-label">Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  label="Category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {Array.from(new Set(transactions.map((t) => t.category))).map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filteredTransactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AccountBalanceWallet sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
                {transactions.length === 0 ? 'No wallet transactions recorded yet' : 'No transactions match the selected filters'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {transactions.length === 0 ? 'Deposit your first funds into your simulated wallet to begin.' : 'Try adjusting your search keywords or clear the category filters.'}
              </Typography>
              {transactions.length === 0 ? (
                <Button variant="contained" onClick={() => setOpenDeposit(true)} sx={{ borderRadius: 2 }}>
                  Make First Deposit
                </Button>
              ) : (
                <Button variant="outlined" size="small" onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterCategory('all'); }} sx={{ borderRadius: 2 }}>
                  Clear Filters
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date &amp; Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason / Notes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Receipt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const isDeposit = tx.type === 'deposit';
                    return (
                      <TableRow key={tx.id} hover>
                        <TableCell>
                          <Chip
                            icon={isDeposit ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                            label={tx.type.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: isDeposit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isDeposit ? '#059669' : '#dc2626',
                              fontWeight: 700,
                            }}
                          />
                          {(tx.category === 'emergency' || tx.reason?.includes('EMERGENCY')) && (
                            <Chip
                              label="EMERGENCY"
                              size="small"
                              color="error"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, ml: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {tx.category.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {tx.reason || '—'}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: isDeposit ? '#10b981' : '#ef4444',
                          }}
                        >
                          {isDeposit ? '+' : '-'}{formatAmount(tx.amount)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={<CheckCircle sx={{ fontSize: '0.9rem !important' }} />}
                            label={tx.status.toUpperCase()}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Share Receipt via WhatsApp">
                            <IconButton
                              size="small"
                              sx={{ color: '#25D366' }}
                              onClick={() => handleShareReceipt({
                                amount: tx.amount,
                                reason: tx.reason || `${isDeposit ? 'Deposit' : 'Withdrawal'} (${tx.category})`,
                                id: tx.id
                              })}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 🛡️ APPROVED BY TRUSTED NOMINEE HERO CARDS */}
      {withdrawalRequests.filter(r => r.status === 'approved').map((req) => {
        const amountToDeduct = req.amount;
        const balanceAfter = Math.max(0, currentBalance - amountToDeduct);
        return (
          <Card
            key={`approved-hero-${req.id}`}
            sx={{
              borderRadius: 3,
              border: '2px solid #10b981',
              bgcolor: alpha('#10b981', 0.04),
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
              mt: 4,
              mb: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <VerifiedUser sx={{ color: '#10b981', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#065f46', letterSpacing: '-0.01em' }}>
                      APPROVED BY TRUSTED NOMINEE
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Withdrawal Request #{req.id} • Category: <strong>{req.category.replace(/_/g, ' ').toUpperCase()}</strong>
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  icon={<CheckCircle sx={{ color: '#ffffff !important' }} />}
                  label="APPROVED • READY FOR EXECUTION"
                  sx={{ bgcolor: '#10b981', color: '#ffffff', fontWeight: 800, px: 1 }}
                />
              </Box>

              {/* Security Invariant Alert */}
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2, bgcolor: alpha('#0284c7', 0.08), color: '#0369a1' }}>
                <strong>Security Invariant:</strong> Nominee approval authorizes the request but does not transfer money. Your wallet balance changes only after you confirm execution and authenticate with your security PIN.
              </Alert>

              {/* Financial Breakdown Grid */}
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={6} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      REQUESTED AMOUNT
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatAmount(req.amount)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: alpha('#10b981', 0.08), borderRadius: 2, border: '1px solid', borderColor: '#10b981' }}>
                    <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 700 }} display="block">
                      APPROVED AMOUNT
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: '#059669' }}>
                      {formatAmount(req.amount)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      CURRENT WALLET BALANCE
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatAmount(currentBalance)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: alpha('#ef4444', 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha('#ef4444', 0.3) }}>
                    <Typography variant="caption" color="error.main" fontWeight={700} display="block">
                      AMOUNT TO BE DEDUCTED
                    </Typography>
                    <Typography variant="h5" fontWeight={900} color="error.main">
                      {formatAmount(amountToDeduct)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (₹0 deducted until employee PIN verification)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: alpha('#059669', 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha('#059669', 0.3) }}>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }} display="block">
                      BALANCE AFTER EXECUTION
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: '#047857' }}>
                      {formatAmount(balanceAfter)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Projected balance in savings wallet)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Purpose, Guidance, and Impact */}
              <Paper sx={{ p: 2.2, bgcolor: 'background.paper', borderRadius: 2, mb: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      PURPOSE / REASON
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {req.reason}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      NOMINEE DECISION
                    </Typography>
                    <Chip size="small" label="APPROVED" color="success" sx={{ fontWeight: 800, mt: 0.5 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      NOMINEE GUIDANCE
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary', mt: 0.4 }}>
                      {req.partnerNotes ? `"${req.partnerNotes}"` : 'Approved by your accountability partner. Ensure you confirm execution only when ready.'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      ESTIMATED GOAL IMPACT
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="warning.main">
                      +{req.estimatedDelayDays} days
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      ESTIMATED RUNWAY IMPACT
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="error.main">
                      -{req.runwayImpactMonths.toFixed(1)} months
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* State Machine Status Progression */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <Chip size="small" label="PENDING (no deduction)" sx={{ opacity: 0.7 }} />
                <Typography variant="caption" color="text.secondary">→</Typography>
                <Chip size="small" label="APPROVED (no deduction)" color="info" sx={{ fontWeight: 700 }} />
                <Typography variant="caption" color="text.secondary">→</Typography>
                <Chip size="small" label="EXECUTION CONFIRMATION (still no deduction)" color="warning" sx={{ fontWeight: 700 }} />
                <Typography variant="caption" color="text.secondary">→</Typography>
                <Chip size="small" label="EXECUTED (deduction completed)" sx={{ opacity: 0.7 }} />
              </Box>

              {/* Execute Action */}
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => handleStartExecute(req)}
                sx={{
                  py: 1.3,
                  px: 3.5,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  borderRadius: 2.5,
                  bgcolor: '#059669',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                  '&:hover': { bgcolor: '#047857' }
                }}
              >
                Execute Approved Withdrawal ({formatAmount(req.amount)}) →
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Accountability Withdrawal Requests */}
      <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, mt: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield color="primary" />
                Accountability Requests & Impact Log
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending mentor reviews, consequence forecasts, and approved withdrawals awaiting execution.
              </Typography>
            </Box>
            <Chip
              label={`${withdrawalRequests.filter(r => r.status === 'pending').length} Pending Review`}
              color={withdrawalRequests.some(r => r.status === 'pending') ? 'warning' : 'default'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          {withdrawalRequests.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No withdrawal requests on record. All your transactions are tracked in the ledger above.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Goal Delay</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Runway Impact</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {withdrawalRequests.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>
                        #{req.id}
                        {req.isEmergency && (
                          <Chip
                            label="EMERGENCY"
                            size="small"
                            color="error"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, ml: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{req.category.replace(/_/g, ' ')}</TableCell>
                      <TableCell sx={{ color: '#64748b', maxWidth: 200 }}>{req.reason}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#ef4444' }}>
                        {formatAmount(req.amount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={`+${req.estimatedDelayDays}d`}
                          color={req.estimatedDelayDays > 14 ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={`-${req.runwayImpactMonths.toFixed(1)}mo`}
                          color={req.runwayImpactMonths > 0.5 ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={req.status.toUpperCase()}
                          size="small"
                          color={
                            req.status === 'executed'
                              ? 'success'
                              : req.status === 'approved'
                              ? 'info'
                              : req.status === 'declined'
                              ? 'error'
                              : req.status === 'pending'
                              ? 'warning'
                              : 'default'
                          }
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {req.status === 'approved' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartExecute(req)}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Execute
                          </Button>
                        )}
                        {req.status === 'pending' && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => handleCancelRequest(req.id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Cancel
                          </Button>
                        )}
                        {req.status === 'executed' && (
                          <Typography variant="caption" color="textSecondary">
                            Completed
                          </Typography>
                        )}
                        {req.status === 'declined' && (
                          <Typography variant="caption" color="error">
                            Declined
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal: Deposit Funds */}
      <Dialog open={openDeposit} onClose={() => setOpenDeposit(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleDepositSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Deposit Funds into Simulated Wallet</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Add simulated funds to advance your savings goals and build your liquidity buffer.
            </Typography>

            {/* Quick Amount Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {[1000, 5000, 10000, 25000].map((amt) => (
                <Button
                  key={amt}
                  variant={depositAmount === amt.toString() ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setDepositAmount(amt.toString())}
                >
                  +₹{amt.toLocaleString('en-IN')}
                </Button>
              ))}
            </Box>

            <TextField
              fullWidth
              required
              type="number"
              label="Deposit Amount (₹)"
              value={depositAmount}
              helperText="Min: ₹1 • Max: ₹1 Cr per deposit"
              inputProps={{ min: 1, max: 10000000 }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, fontWeight: 700, color: 'success.main' }}>₹</Typography>,
              }}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 10000000) {
                  setDepositAmount('10000000');
                } else if (!isNaN(val) && val < 0) {
                  setDepositAmount('0');
                } else {
                  setDepositAmount(e.target.value);
                }
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              select
              fullWidth
              label="Category"
              value={depositCategory}
              onChange={(e) => setDepositCategory(e.target.value)}
              sx={{ mb: 2 }}
            >
              {depositCategories.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Reason / Source"
              value={depositReason}
              onChange={(e) => setDepositReason(e.target.value)}
            />

            {/* Balance Preview */}
            <Box sx={{ mt: 3, p: 2, borderRadius: 2, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                PROJECTED BALANCE
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#15803d' }}>
                ₹{(currentBalance + (parseFloat(depositAmount) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDeposit(false)} disabled={depositSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={depositSubmitting}
              sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
            >
              {depositSubmitting ? 'Depositing...' : 'Confirm Deposit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal: Consequence-Aware Withdrawal */}
      <WithdrawalModal
        open={openWithdraw}
        onClose={() => setOpenWithdraw(false)}
        onSuccess={handleWithdrawalSuccess}
        currentBalance={currentBalance}
      />

      {/* Modal: Approved Withdrawal Execution Confirmation */}
      <Dialog
        open={Boolean(executingReq)}
        onClose={() => !isExecuting && setExecutingReq(null)}
        maxWidth="sm"
        fullWidth
      >
        {executingReq && (
          <Box>
            <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              {executionStep === 'confirm' ? 'CONFIRM WITHDRAWAL' : 'ENTER SECURITY PIN'}
            </DialogTitle>
            <DialogContent dividers>
              {executionStep === 'confirm' ? (
                <>
                  <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                    <strong>Nominee Decision: APPROVED.</strong> Please review the exact financial impact before proceeding to PIN authentication. ₹0 is deducted at this stage.
                  </Alert>

                  <Paper sx={{ p: 2.5, mb: 2, bgcolor: 'background.paper', borderRadius: 2.5, border: '1.5px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nominee Approval:
                      </Typography>
                      <Chip label="APPROVED" size="small" color="success" sx={{ fontWeight: 800 }} />
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={2} sx={{ mb: 1.5 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                          AMOUNT APPROVED
                        </Typography>
                        <Typography variant="h6" fontWeight={900} color="success.main">
                          {formatAmount(executingReq.amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                          CURRENT BALANCE
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                          {formatAmount(currentBalance)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="error.main" fontWeight={700} display="block">
                          AMOUNT THAT WILL BE DEDUCTED
                        </Typography>
                        <Typography variant="h6" fontWeight={900} color="error.main">
                          {formatAmount(executingReq.amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }} display="block">
                          BALANCE AFTER EXECUTION
                        </Typography>
                        <Typography variant="h6" fontWeight={900} sx={{ color: '#047857' }}>
                          {formatAmount(Math.max(0, currentBalance - executingReq.amount))}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        PURPOSE / REASON:
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {executingReq.reason}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        NOMINEE NOTE:
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                        {executingReq.partnerNotes ? `"${executingReq.partnerNotes}"` : 'Approved by your accountability partner.'}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                      <Chip
                        size="small"
                        color="warning"
                        label={`Goal Impact: +${executingReq.estimatedDelayDays} days`}
                        sx={{ fontWeight: 700 }}
                      />
                      <Chip
                        size="small"
                        color="error"
                        label={`Runway Impact: -${executingReq.runwayImpactMonths.toFixed(1)} months`}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                  </Paper>
                </>
              ) : (
                <>
                  <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
                    <strong>Final Authorization Step:</strong> Enter your 4-digit security PIN to authorize atomic deduction of <strong>{formatAmount(executingReq.amount)}</strong> from your savings wallet.
                  </Alert>

                  <Paper sx={{ p: 2.5, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Amount to be deducted:</Typography>
                      <Typography variant="body2" fontWeight={800} color="error.main">{formatAmount(executingReq.amount)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Projected balance:</Typography>
                      <Typography variant="body2" fontWeight={800} color="success.dark">{formatAmount(Math.max(0, currentBalance - executingReq.amount))}</Typography>
                    </Stack>
                  </Paper>

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Enter Security PIN
                  </Typography>
                  <TextField
                    type="password"
                    fullWidth
                    autoFocus
                    value={executePin}
                    onChange={(e) => setExecutePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Enter 4-digit PIN (e.g. 1234)"
                    helperText="Required to verify account ownership before atomic fund deduction (Demo PIN: 1234)"
                    inputProps={{ maxLength: 4 }}
                    sx={{ mb: 1 }}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
              {executionStep === 'confirm' ? (
                <>
                  <Button onClick={() => setExecutingReq(null)} disabled={isExecuting} color="inherit">
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setExecutionStep('pin')}
                    sx={{ textTransform: 'none', fontWeight: 800, px: 3, borderRadius: 2 }}
                  >
                    Confirm &amp; Enter PIN →
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setExecutionStep('confirm')} disabled={isExecuting} color="inherit">
                    ← Back
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={isExecuting || executePin.length < 4}
                    onClick={handleConfirmExecution}
                    startIcon={isExecuting ? <CircularProgress size={18} color="inherit" /> : <Lock />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      px: 3,
                      borderRadius: 2,
                      bgcolor: '#059669',
                      '&:hover': { bgcolor: '#047857' }
                    }}
                  >
                    {isExecuting ? 'Authenticating &amp; Executing...' : 'Authenticate &amp; Execute'}
                  </Button>
                </>
              )}
            </DialogActions>
          </Box>
        )}
      </Dialog>

      {/* 🌟 POST-EXECUTION RESULT DIALOG */}
      <Dialog
        open={Boolean(executedResult)}
        onClose={() => setExecutedResult(null)}
        maxWidth="sm"
        fullWidth
      >
        {executedResult && (
          <Box>
            <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5, color: 'success.main' }}>
              <CheckCircle sx={{ fontSize: 32 }} />
              WITHDRAWAL EXECUTED
            </DialogTitle>
            <DialogContent dividers>
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                The withdrawal has been verified and processed atomically. The exact amount has been deducted from your wallet ledger.
              </Alert>

              <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1.5px solid', borderColor: '#10b981', bgcolor: alpha('#10b981', 0.04), mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="error.main" fontWeight={700} display="block">
                      AMOUNT DEDUCTED
                    </Typography>
                    <Typography variant="h4" fontWeight={900} color="error.main">
                      {formatAmount(executedResult.amount)}
                    </Typography>
                  </Grid>

                  <Divider sx={{ my: 1, width: '100%' }} />

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      PREVIOUS BALANCE
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatAmount(executedResult.previousBalance)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }} display="block">
                      NEW BALANCE
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: '#047857' }}>
                      {formatAmount(executedResult.newBalance)}
                    </Typography>
                  </Grid>

                  <Divider sx={{ my: 1, width: '100%' }} />

                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      PURPOSE
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {executedResult.reason}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      NOMINEE APPROVAL
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="success.main">
                      Approved
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      EXECUTION
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="primary.main">
                      Confirmed by employee
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
              <Button
                variant="outlined"
                color="success"
                startIcon={<WhatsAppIcon />}
                onClick={() => handleShareReceipt(executedResult)}
                sx={{ py: 1.2, fontWeight: 800, borderRadius: 2, flex: 1, borderColor: '#25D366', color: '#128C7E', '&:hover': { borderColor: '#128C7E', bgcolor: 'rgba(37, 211, 102, 0.08)' } }}
              >
                Share Receipt (WhatsApp)
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setExecutedResult(null)}
                sx={{ py: 1.2, fontWeight: 800, borderRadius: 2, flex: 1 }}
              >
                View Updated Ledger →
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Container>
  );
};

export default WalletPage;
