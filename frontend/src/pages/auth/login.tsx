'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  Link,
  useTheme,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Shield,
  Bolt,
  ArrowForward,
  WorkOutline,
  SupervisorAccount,
  PersonOutline,
  AutoAwesome,
  EditNote,
  Login as LoginIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/axiosClient';

type RoleType = 'employee' | 'nominee' | 'demo' | 'guest';

interface RolePersona {
  id: RoleType;
  title: string;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  color: 'primary' | 'secondary' | 'warning' | 'info' | 'success';
  icon: React.ReactNode;
  credentials?: { email: string; pin: string };
  targetRoute: string;
}

export default function Login() {
  const theme = useTheme();
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', pin: '' });
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleType | null>(null);
  const [error, setError] = useState('');

  const personas: RolePersona[] = [
    {
      id: 'employee',
      title: 'Employee / Salaried',
      name: 'Rahul Sharma',
      subtitle: 'EMP-RKVT-1001 • Software Engineer',
      description: 'Career resilience, salary runway defense & safe EMI stress testing.',
      badge: '💼 Employee Portal',
      color: 'primary',
      icon: <WorkOutline sx={{ fontSize: 26 }} />,
      credentials: { email: 'demo@finfolio.com', pin: '1234' },
      targetRoute: '/dashboard'
    },
    {
      id: 'nominee',
      title: 'Trusted Nominee',
      name: 'Priya Sharma',
      subtitle: 'Accountability & Governance Partner',
      description: 'Dual-key authorization portal: review & co-approve high-value withdrawals (> ₹20,000).',
      badge: '🛡️ Nominee Portal',
      color: 'secondary',
      icon: <SupervisorAccount sx={{ fontSize: 26 }} />,
      credentials: { email: 'nominee@finfolio.com', pin: '1234' },
      targetRoute: '/nominee'
    },
    {
      id: 'demo',
      title: 'Full Demo User',
      name: 'Platform Showcase',
      subtitle: 'Pre-seeded ₹1,00,000 Wallet • 6.0m Buffer',
      description: 'Instant full-access sandbox: Wallet, Goals, Tax, Debt & AI Financial Copilot.',
      badge: '⚡ Instant Showcase',
      color: 'warning',
      icon: <Bolt sx={{ fontSize: 26 }} />,
      credentials: { email: 'demo@finfolio.com', pin: '1234' },
      targetRoute: '/dashboard'
    },
    {
      id: 'guest',
      title: 'Guest Explorer',
      name: 'Anonymous Session',
      subtitle: 'No Account or Credentials Needed',
      description: 'Explore FINFOLIO immediately in an isolated ephemeral session without email or PIN.',
      badge: '👤 Guest Sandbox',
      color: 'info',
      icon: <PersonOutline sx={{ fontSize: 26 }} />,
      targetRoute: '/dashboard'
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'pin') {
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLoginSubmit = async (
    credentials: { email: string; pin: string },
    targetRoute?: string,
    roleId?: RoleType
  ) => {
    setLoading(true);
    if (roleId) setActiveRole(roleId);
    setError('');

    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;

      const userData = user
        ? {
            id: user.id?.toString() || '1',
            email: user.email || credentials.email,
            name: user.name || 'User',
            isGuest: user.isGuest || false
          }
        : {
            id: '1',
            email: credentials.email,
            name: 'User',
            isGuest: false
          };

      login(token, userData);

      const redirectUrl = targetRoute || (router.query.redirect as string) || '/dashboard';
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
      setActiveRole(null);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setActiveRole('guest');
    setError('');

    try {
      const response = await api.post('/auth/guest');
      const { token, user } = response.data;

      const userData = {
        id: user.id?.toString() || '0',
        email: user.email || null,
        name: user.name || 'Guest User',
        isGuest: user.isGuest || true
      };

      login(token, userData);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Guest login error:', err);
      setError(err.response?.data?.error || err.message || 'Guest login failed');
    } finally {
      setLoading(false);
      setActiveRole(null);
    }
  };

  const handleRoleLogin = async (persona: RolePersona) => {
    if (persona.id === 'guest') {
      await handleGuestLogin();
    } else if (persona.credentials) {
      setFormData(persona.credentials);
      await handleLoginSubmit(persona.credentials, persona.targetRoute, persona.id);
    }
  };

  const handleAutofillOnly = (persona: RolePersona, e: React.MouseEvent) => {
    e.stopPropagation();
    if (persona.credentials) {
      setFormData(persona.credentials);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email && !formData.pin) {
      setError('Please provide your email address and PIN, or select a 1-Click Role Login above.');
      return;
    }
    await handleLoginSubmit(formData);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4.5 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 20px 40px rgba(0,0,0,0.5)'
            : '0 20px 40px rgba(15, 23, 42, 0.08)',
          background: theme.palette.mode === 'dark' ? '#111827' : '#ffffff'
        }}
      >
        {/* Brand Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="FINFOLIO Logo"
              sx={{ width: 40, height: 40, borderRadius: '10px', objectFit: 'cover' }}
            />
            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: 'primary.main' }}>
              FINFOLIO
            </Typography>
          </Stack>

          <Typography variant="h4" component="h1" fontWeight="800" gutterBottom sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem' } }}>
            Welcome to FINFOLIO
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540, mx: 'auto', fontSize: '0.95rem' }}>
            Unified Financial Resilience, Career Intelligence &amp; Two-Person Governance
          </Typography>
        </Box>

        {/* Feature Highlights Banner */}
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mb: 3.5, gap: 0.8 }}>
          <Chip
            size="small"
            label="🇮🇳 Strictly INR (₹)"
            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}
          />
          <Chip
            size="small"
            icon={<Lock sx={{ fontSize: 14 }} />}
            label="4-Digit PIN Security"
            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.08), color: 'success.main' }}
          />
          <Chip
            size="small"
            icon={<Shield sx={{ fontSize: 14 }} />}
            label="Two-Person Dual Governance"
            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.secondary.main, 0.08), color: 'secondary.main' }}
          />
          <Chip
            size="small"
            icon={<Bolt sx={{ fontSize: 14 }} />}
            label="Layoff Runway Engine"
            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.warning.main, 0.08), color: 'warning.main' }}
          />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 1-CLICK ROLE-BASED LOGIN BUTTONS */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.8 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome sx={{ color: 'warning.main', fontSize: 20 }} />
              1-Click Instant Persona Logins
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Select role to test workflows instantly
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            {personas.map((persona) => {
              const isCurrentLoading = activeRole === persona.id;

              // Color accents
              const borderColors: Record<RoleType, string> = {
                employee: theme.palette.primary.main,
                nominee: '#9333ea',
                demo: '#f59e0b',
                guest: '#0ea5e9'
              };
              const bgGradients: Record<RoleType, string> = {
                employee: alpha(theme.palette.primary.main, 0.04),
                nominee: alpha('#9333ea', 0.04),
                demo: alpha('#f59e0b', 0.04),
                guest: alpha('#0ea5e9', 0.04)
              };

              return (
                <Grid item xs={12} sm={6} key={persona.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      border: '1.5px solid',
                      borderColor: activeRole === persona.id ? borderColors[persona.id] : 'divider',
                      bgcolor: bgGradients[persona.id],
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: borderColors[persona.id],
                        boxShadow: `0 6px 20px ${alpha(borderColors[persona.id], 0.15)}`,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2.2, flex: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2.2 } }}>
                      {/* Top row: Badge & Autofill icon */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                        <Chip
                          size="small"
                          label={persona.badge}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: alpha(borderColors[persona.id], 0.12),
                            color: borderColors[persona.id]
                          }}
                        />
                        {persona.credentials && (
                          <Tooltip title="Autofill credentials into form below">
                            <Button
                              size="small"
                              startIcon={<EditNote sx={{ fontSize: 16 }} />}
                              onClick={(e) => handleAutofillOnly(persona, e)}
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.72rem',
                                py: 0.2,
                                px: 1,
                                color: 'text.secondary',
                                minWidth: 0,
                                '&:hover': { color: borderColors[persona.id] }
                              }}
                            >
                              Autofill
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>

                      {/* Role Info */}
                      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.2 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: alpha(borderColors[persona.id], 0.1),
                            color: borderColors[persona.id],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {persona.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={800} noWrap>
                            {persona.title}
                          </Typography>
                          <Typography variant="caption" fontWeight={700} color="text.primary" display="block" noWrap>
                            {persona.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {persona.subtitle}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', minHeight: 40, mb: 1.8 }}>
                        {persona.description}
                      </Typography>

                      {/* Credentials / Target hint */}
                      {persona.credentials ? (
                        <Box
                          sx={{
                            px: 1.2,
                            py: 0.6,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.common.black, 0.03),
                            border: '1px dashed',
                            borderColor: 'divider',
                            mb: 1.8,
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span><strong>Login:</strong> {persona.credentials.email}</span>
                          <span><strong>PIN:</strong> {persona.credentials.pin}</span>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            px: 1.2,
                            py: 0.6,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.common.black, 0.03),
                            border: '1px dashed',
                            borderColor: 'divider',
                            mb: 1.8,
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            textAlign: 'center'
                          }}
                        >
                          ⚡ Instant Ephemeral Token • Zero Setup
                        </Box>
                      )}

                      <Box sx={{ mt: 'auto' }}>
                        {/* Action Button */}
                        <Button
                          fullWidth
                          variant="contained"
                          size="medium"
                          disabled={loading}
                          onClick={() => handleRoleLogin(persona)}
                          startIcon={isCurrentLoading ? <CircularProgress size={16} color="inherit" /> : <LoginIcon sx={{ fontSize: 18 }} />}
                          sx={{
                            py: 1,
                            borderRadius: 2,
                            fontWeight: 800,
                            textTransform: 'none',
                            fontSize: '0.88rem',
                            bgcolor: borderColors[persona.id],
                            color: '#ffffff',
                            '&:hover': {
                              bgcolor: borderColors[persona.id],
                              filter: 'brightness(0.92)'
                            }
                          }}
                        >
                          {isCurrentLoading
                            ? `Signing in as ${persona.title}...`
                            : `Login as ${persona.title} →`}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Divider sx={{ my: 3.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ px: 1.5, letterSpacing: '0.04em' }}>
            OR SIGN IN MANUALLY WITH EMAIL &amp; PIN
          </Typography>
        </Divider>

        {/* Manual Credentials Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                helperText="Use your registered email or click Autofill on any role above"
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                name="pin"
                label="4-Digit PIN"
                type={showPin ? 'text' : 'password'}
                id="pin"
                inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                value={formData.pin}
                onChange={handleChange}
                disabled={loading}
                helperText="4-digit PIN (Default: 1234)"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle PIN visibility"
                        onClick={() => setShowPin(!showPin)}
                        edge="end"
                        size="small"
                      >
                        {showPin ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            endIcon={loading && !activeRole ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
            disabled={loading}
            sx={{
              py: 1.3,
              mt: 2,
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.98rem'
            }}
          >
            {loading && !activeRole ? 'Authenticating...' : 'Sign In with Credentials'}
          </Button>

          <Divider sx={{ my: 2.5 }} />

          {/* Bottom Actions */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" sx={{ fontWeight: 700, textDecoration: 'none', color: 'primary.main' }}>
                Create Account
              </Link>
            </Typography>

            <Button
              size="small"
              component={Link}
              href="/assessment"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: 'text.secondary',
                fontSize: '0.82rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              ⚡ Check Runway First? Run 360° Assessment →
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}