/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
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
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import {
  Security,
  Gavel,
  CheckCircle,
  Cancel,
  Refresh,
  Lock,
  VerifiedUser,
  InfoOutlined,
  WarningAmber,
  Shield,
  HourglassEmpty,
  NotificationsActive,
} from '@mui/icons-material';
import {
  accountabilityService,
  PartnerViewRequest,
} from '../services/accountabilityService';
import {
  withdrawalService,
  PartnerNotification,
} from '../services/withdrawalService';

export default function NomineePortal() {
  const [partnerEmail, setPartnerEmail] = useState<string>('nominee@finfolio.com');
  const [inputEmail, setInputEmail] = useState<string>('nominee@finfolio.com');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<number>(0);

  const [inbox, setInbox] = useState<PartnerViewRequest[]>([]);
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);

  // Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState<boolean>(false);
  const [selectedReq, setSelectedReq] = useState<PartnerViewRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'declined'>('approved');
  const [nomineeNotes, setNomineeNotes] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!partnerEmail.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [reqs, notifs] = await Promise.all([
        accountabilityService.getPartnerInbox(partnerEmail.trim()),
        withdrawalService.getNotifications(partnerEmail.trim()).catch(() => []),
      ]);
      setInbox(reqs);
      setNotifications(notifs);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load nominee inbox.');
    } finally {
      setLoading(false);
    }
  }, [partnerEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDecision = (req: PartnerViewRequest, decision: 'approved' | 'declined') => {
    setSelectedReq(req);
    setDecisionType(decision);
    setNomineeNotes('');
    setDecisionModalOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedReq) return;
    setSubmittingDecision(true);
    setError(null);
    try {
      const res = await accountabilityService.recordPartnerDecision(
        selectedReq.id,
        decisionType,
        nomineeNotes.trim(),
        partnerEmail.trim()
      );
      setSuccessMsg(res.message || `Request #${selectedReq.id} marked as ${decisionType}.`);
      setDecisionModalOpen(false);
      setSelectedReq(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const pendingRequests = inbox.filter(r => r.status === 'pending');
  const resolvedRequests = inbox.filter(r => r.status !== 'pending');

  return (
    <>
      <Head>
        <title>Nominee Review Portal | FinFolio</title>
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield sx={{ color: 'primary.main', fontSize: 36 }} />
              Nominee Review Portal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Two-person financial accountability without surrendering ownership.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              label="Nominee Email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              sx={{ width: 230 }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPartnerEmail(inputEmail)}
              sx={{ textTransform: 'none' }}
            >
              Switch
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Refresh />}
              onClick={loadData}
              sx={{ textTransform: 'none' }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Invariant & Security Banner */}
        <Alert
          severity="info"
          icon={<VerifiedUser fontSize="inherit" />}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: '1px solid rgba(14, 165, 233, 0.3)',
            bgcolor: 'rgba(14, 165, 233, 0.08)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            🛡️ Strict Accountability Boundary & Privacy Invariant:
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>1. No Financial Transfer:</strong> Your approval does <em>NOT</em> transfer or withdraw money. It only authorizes the user to proceed. The user must independently confirm and enter their PIN to execute.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>2. Privacy Shield:</strong> This interface is server-sanitized. You can see the withdrawal amount, category, purpose, and calculated consequence on goals. You cannot view the user's total savings balance, income, or unrelated transactions.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {/* Quick Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <HourglassEmpty fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {pendingRequests.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pending Decisions
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CheckCircle fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {resolvedRequests.filter(r => r.status === 'approved' || r.status === 'executed').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Approved / Executed
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <NotificationsActive fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {notifications.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Accountability Alerts
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab
              label={`Pending Requests (${pendingRequests.length})`}
              icon={<Gavel sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              label={`History & Decisions (${resolvedRequests.length})`}
              icon={<Security sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              label={`Alerts & Activity (${notifications.length})`}
              icon={<NotificationsActive sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading sanitized requests for {partnerEmail}...
            </Typography>
          </Box>
        ) : (
          <>
            {/* TAB 0: Pending Requests */}
            {tab === 0 && (
              <Box>
                {pendingRequests.length === 0 ? (
                  <Card sx={{ borderRadius: 3, p: 5, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      No Pending Withdrawal Requests
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      All high-value withdrawal requests have been reviewed. When the user requests a discretionary withdrawal above their ₹20,000 threshold, it will appear here for your mentorship.
                    </Typography>
                  </Card>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Amount (INR)</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reason / Purpose</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Goal Delay Impact</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Runway Impact</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Mentorship Decision</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingRequests.map((req) => (
                          <TableRow key={req.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>#{req.id}</TableCell>
                            <TableCell>
                              <Chip
                                label={req.category.toUpperCase()}
                                size="small"
                                sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.05rem' }}>
                              ₹{req.amount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {req.reason}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Requested {new Date(req.createdAt).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`+${req.estimatedDelayDays} days`}
                                color={req.estimatedDelayDays > 14 ? 'warning' : 'default'}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`-${req.runwayImpactMonths.toFixed(1)} mo`}
                                color={req.runwayImpactMonths > 1 ? 'error' : 'default'}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleOpenDecision(req, 'approved')}
                                  sx={{ textTransform: 'none', fontWeight: 700 }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<Cancel />}
                                  onClick={() => handleOpenDecision(req, 'declined')}
                                  sx={{ textTransform: 'none', fontWeight: 700 }}
                                >
                                  Decline
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* TAB 1: History & Decisions */}
            {tab === 1 && (
              <Box>
                {resolvedRequests.length === 0 ? (
                  <Card sx={{ borderRadius: 3, p: 5, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <Typography variant="body1" color="text.secondary">
                      No resolved requests in history.
                    </Typography>
                  </Card>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Amount (INR)</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Nominee Notes</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Decision Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resolvedRequests.map((req) => (
                          <TableRow key={req.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>#{req.id}</TableCell>
                            <TableCell>{req.category}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              ₹{req.amount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 220 }}>{req.reason}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={
                                  req.status === 'executed'
                                    ? 'EXECUTED BY USER'
                                    : req.status.toUpperCase()
                                }
                                color={
                                  req.status === 'executed'
                                    ? 'success'
                                    : req.status === 'approved'
                                    ? 'info'
                                    : req.status === 'declined'
                                    ? 'error'
                                    : 'default'
                                }
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 220 }}>
                              <Typography variant="body2" color="text.secondary">
                                {req.partnerNotes || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {req.decisionDate ? new Date(req.decisionDate).toLocaleString() : '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* TAB 2: Alerts & Activity Feed */}
            {tab === 2 && (
              <Box>
                {notifications.length === 0 ? (
                  <Card sx={{ borderRadius: 3, p: 5, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <Typography variant="body1" color="text.secondary">
                      No accountability alerts logged yet.
                    </Typography>
                  </Card>
                ) : (
                  <Stack spacing={2}>
                    {notifications.map((notif) => (
                      <Card
                        key={notif.id}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor:
                            notif.type.includes('emergency')
                              ? 'error.light'
                              : notif.type.includes('override')
                              ? 'warning.light'
                              : 'divider',
                          p: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {notif.type.includes('emergency') ? (
                              <WarningAmber color="error" />
                            ) : notif.type.includes('override') ? (
                              <Lock color="warning" />
                            ) : (
                              <InfoOutlined color="primary" />
                            )}
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {notif.title}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notif.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.primary' }}>
                          {notif.message}
                        </Typography>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </>
        )}

        {/* DECISION MODAL */}
        <Dialog
          open={decisionModalOpen}
          onClose={() => !submittingDecision && setDecisionModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {decisionType === 'approved' ? '✅ Authorize Withdrawal' : '⛔ Decline Withdrawal'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedReq && (
              <Box>
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Request <strong>#{selectedReq.id}</strong> • Category: <strong>{selectedReq.category.toUpperCase()}</strong>
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', my: 1 }}>
                    ₹{selectedReq.amount.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>User Stated Purpose:</strong> {selectedReq.reason}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    <Chip
                      size="small"
                      color="warning"
                      label={`Goal Delay: +${selectedReq.estimatedDelayDays} days`}
                    />
                    <Chip
                      size="small"
                      color="error"
                      label={`Runway Impact: -${selectedReq.runwayImpactMonths.toFixed(1)} mo`}
                    />
                  </Box>
                </Paper>

                <Alert severity={decisionType === 'approved' ? 'info' : 'warning'} sx={{ mb: 2, borderRadius: 2 }}>
                  {decisionType === 'approved' ? (
                    <Typography variant="body2">
                      <strong>Remember:</strong> Approving this request does <em>NOT</em> move or deduct funds. It only allows the user to proceed to confirmation with their security PIN.
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      Declining this request keeps the user's funds protected in their wallet. No money will be withdrawn.
                    </Typography>
                  )}
                </Alert>

                <TextField
                  label="Nominee Guidance Notes (Optional)"
                  fullWidth
                  multiline
                  rows={3}
                  value={nomineeNotes}
                  onChange={(e) => setNomineeNotes(e.target.value)}
                  placeholder={
                    decisionType === 'approved'
                      ? 'e.g., Approved for necessary upgrade. Please remember to replenish emergency reserve next month.'
                      : 'e.g., Please reconsider deferring this purchase until your 6-month runway is secured.'
                  }
                  sx={{ mt: 1 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setDecisionModalOpen(false)}
              disabled={submittingDecision}
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDecision}
              disabled={submittingDecision}
              variant="contained"
              color={decisionType === 'approved' ? 'success' : 'error'}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {submittingDecision ? (
                <CircularProgress size={24} color="inherit" />
              ) : decisionType === 'approved' ? (
                'Confirm Approval'
              ) : (
                'Confirm Decline'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
