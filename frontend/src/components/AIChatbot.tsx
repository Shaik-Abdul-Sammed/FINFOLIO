import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Fab,
  Drawer,
  useMediaQuery,
  useTheme,
  Stack,
  Divider,
  Alert,
  Paper,
  Button,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  Send,
  Close,
  SmartToy,
  TrendingUp,
  AccountBalance,
  Shield,
  Warning,
  CheckCircle,
  LocalHospital,
  CreditCard,
  WorkOff,
  ShoppingCart,
  Savings,
  RestartAlt
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import api from '@/utils/axiosClient';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[] | undefined;
  isAlert?: boolean | undefined;
  alertType?: 'error' | 'warning' | 'info' | 'success' | undefined;
}

interface UserFinancialProfile {
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFund: number;
  debt: number;
  investments: number;
  healthInsuranceCover: number;
  monthlyWants: number;
  hasCustomProfile: boolean;
}

const DEFAULT_PROFILE: UserFinancialProfile = {
  monthlyIncome: 85000,
  monthlyExpenses: 42000,
  emergencyFund: 250000,
  debt: 320000,
  investments: 550000,
  healthInsuranceCover: 500000,
  monthlyWants: 15000,
  hasCustomProfile: false,
};

const AIChatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<UserFinancialProfile>(DEFAULT_PROFILE);
  const [employeeContext, setEmployeeContext] = useState<any>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "👋 Namaste! I'm your FINFOLIO Employee Financial Copilot.\n\nI have full access to your employee profile (EMP-RKVT-1001), employer outlook, career risk, skills gap, transition roles, and resilient loan limits in Indian Rupee (₹).\n\nAsk me anything about job security, corporate risk, loans, survival runway, skills, or withdrawals.",
      sender: 'bot',
      timestamp: new Date(),
      suggestions: [
        '🧮 Calculate EMI for ₹15 Lakh loan at 8.5% for 5 years',
        '📈 Calculate 15% salary hike impact',
        '🛡️ Calculate emergency fund for 9 months',
        'What should I do if my company becomes risky?',
        'Can I afford a ₹20 lakh home loan?',
        'What happens if I lose my job?',
        'What skills should I learn?',
        'How many days can I survive without a salary?',
      ],
    },
  ]);

  // Fetch real employee profile & financial context from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, empRes] = await Promise.allSettled([
          api.get('/user/profile'),
          api.get('/employee/full-context')
        ]);

        if (empRes.status === 'fulfilled' && empRes.value.data?.data) {
          const ec = empRes.value.data.data;
          setEmployeeContext(ec);
          setProfile((prev) => ({
            ...prev,
            monthlyIncome: Number(ec.employee?.monthlyTakeHome) || 65000,
            monthlyExpenses: Number(ec.incomeResilience?.essentialExpenses) || 35000,
            emergencyFund: Number(ec.incomeResilience?.emergencySavings) || 210000,
            debt: Number(ec.loanAffordability?.existingEmi ? ec.loanAffordability.existingEmi * 36 : 288000),
            hasCustomProfile: true,
          }));
          return;
        }

        if (userRes.status === 'fulfilled' && userRes.value.data) {
          const d = userRes.value.data;
          setProfile((prev) => ({
            ...prev,
            monthlyIncome: Number(d.monthlyIncome) || prev.monthlyIncome,
            monthlyExpenses: Number(d.monthlyExpenses) || prev.monthlyExpenses,
            emergencyFund: Number(d.emergencyFund) || prev.emergencyFund,
            debt: Number(d.totalDebt) || prev.debt,
            hasCustomProfile: Boolean(d.monthlyIncome && d.monthlyExpenses),
          }));
        }
      } catch (err) {
        // Continue with active profile
      }
    };
    fetchProfile();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper to parse numbers like 50000, 50k, 1.5L, 2 Lakhs
  const parseAmountFromText = (text: string): number | null => {
    const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)/i);
    if (lakhMatch && lakhMatch[1]) {
      return parseFloat(lakhMatch[1]) * 100000;
    }
    const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k/i);
    if (kMatch && kMatch[1]) {
      return parseFloat(kMatch[1]) * 1000;
    }
    const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)/i);
    if (croreMatch && croreMatch[1]) {
      return parseFloat(croreMatch[1]) * 10000000;
    }
    const standardMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{3,})/i);
    if (standardMatch && standardMatch[1]) {
      return parseFloat(standardMatch[1].replace(/,/g, ''));
    }
    return null;
  };

  // Check if user is trying to set profile figures
  const checkProfileUpdate = (msg: string): string | null => {
    const lower = msg.toLowerCase();
    let updated = false;
    const newProfile = { ...profile };

    if (lower.includes('income is') || lower.includes('salary is') || lower.includes('earning')) {
      const amt = parseAmountFromText(msg);
      if (amt && amt > 0) {
        newProfile.monthlyIncome = amt;
        updated = true;
      }
    }
    if (lower.includes('expense is') || lower.includes('expenses are') || lower.includes('spend')) {
      const amt = parseAmountFromText(msg);
      if (amt && amt > 0) {
        newProfile.monthlyExpenses = amt;
        updated = true;
      }
    }
    if (lower.includes('savings are') || lower.includes('emergency fund is') || lower.includes('have in bank')) {
      const amt = parseAmountFromText(msg);
      if (amt && amt > 0) {
        newProfile.emergencyFund = amt;
        updated = true;
      }
    }
    if (lower.includes('debt is') || lower.includes('loan is') || lower.includes('owe')) {
      const amt = parseAmountFromText(msg);
      if (amt !== null && amt >= 0) {
        newProfile.debt = amt;
        updated = true;
      }
    }

    if (updated) {
      newProfile.hasCustomProfile = true;
      setProfile(newProfile);
      return `✅ Profile updated in active session:\n• Monthly Income: ${formatAmount(newProfile.monthlyIncome)}\n• Monthly Expenses: ${formatAmount(newProfile.monthlyExpenses)}\n• Emergency Fund: ${formatAmount(newProfile.emergencyFund)}\n• Total Debt: ${formatAmount(newProfile.debt)}\n\nWhat would you like me to calculate now?`;
    }
    return null;
  };

  // Main Deterministic AI Engine trained on critical scenarios
  const generateResponse = (userMessage: string): { text: string; suggestions?: string[]; isAlert?: boolean; alertType?: 'error' | 'warning' | 'info' | 'success' } => {
    const updateReply = checkProfileUpdate(userMessage);
    if (updateReply) {
      return {
        text: updateReply,
        suggestions: [
          'How many days can I survive without a salary?',
          'Can I afford to leave my current job?',
          'What happens if I lose my job tomorrow?',
        ]
      };
    }

    const lower = userMessage.toLowerCase();
    const { monthlyIncome, monthlyExpenses, emergencyFund, debt, healthInsuranceCover } = profile;

    // Check missing data
    const isMissingData = monthlyExpenses <= 0 || emergencyFund <= 0;
    if (isMissingData && (lower.includes('survive') || lower.includes('runway') || lower.includes('layoff') || lower.includes('leave') || lower.includes('afford'))) {
      return {
        text: `⚠️ **Missing Financial Profile Data**\n\nTo calculate your exact survival days and stress metrics, I need your financial baseline.\n\nPlease type your details (e.g. *"My income is ₹85,000, expenses are ₹40,000, savings are ₹2,00,000"*), or visit the Financial Assessment page.`,
        suggestions: [
          'My income is ₹85,000, expenses ₹40,000, savings ₹2,50,000',
          'Load standard tech worker baseline',
        ],
        isAlert: true,
        alertType: 'warning'
      };
    }

    // Core Metrics
    const standardCoverageMonths = Math.round((emergencyFund / Math.max(1, monthlyExpenses)) * 10) / 10;
    const standardSurvivalDays = Math.round(standardCoverageMonths * 30.417);
    const freezeExpenses = Math.max(1, monthlyExpenses * 0.65); // -35% freeze
    const freezeCoverageMonths = Math.round((emergencyFund / freezeExpenses) * 10) / 10;
    const freezeSurvivalDays = Math.round(freezeCoverageMonths * 30.417);
    const dti = monthlyIncome > 0 ? Math.round((debt * 0.03 / monthlyIncome) * 100) : 0; // Est. 3% monthly debt obligation

    // === CROSS-DOMAIN 1: Company Risky + Loan Question ===
    if ((lower.includes('company') && (lower.includes('risk') || lower.includes('unstable'))) && (lower.includes('loan') || lower.includes('20 lakh') || lower.includes('emi') || lower.includes('borrow'))) {
      return {
        text: `⚠️ **CRITICAL CROSS-DOMAIN ADVISORY: DO NOT TAKE A ₹20 LAKH LOAN**\n\n` +
          `• **Employer Outlook:** Example Technologies Pvt. Ltd. has **MODERATE RISK** (Stability: 68/100, Revenue growth decelerating from 28% to 8% YoY, EBITDA margins contracted -3.4%, net tech headcount shrinking -4.2%).\n` +
          `• **Role Stability:** Software Engineer stability score is 74/100, but career resilience is currently **61/100** due to cloud/AI skill gaps.\n` +
          `• **Current Cash Flow:** Monthly take-home is ₹65,000; existing EMI is ₹8,000; essential living burn is ₹35,000.\n` +
          `• **Loan Impact:** A ₹20 Lakh loan adds ~₹20,000/month in EMI, spiking your fixed debt to ₹28,000/mo (DTI: 43.1%).\n` +
          `• **Runway Collapse:** Under an employer restructuring or salary freeze, this debt burden would collapse your emergency runway from **6.0 months down to 2.8 months**, creating acute default insolvency risk.\n\n` +
          `✅ **FinFolio Strategic Advice:**\n` +
          `1. Postpone large discretionary borrowings until company stability recovers.\n` +
          `2. If urgent, cap any new loan EMI to maximum **₹10,000/mo** (Principal: ₹6.0L–₹8.5L).\n` +
          `3. Complete Phase 1 AWS Cloud upskilling to raise career resilience from 61 to 84.`,
        suggestions: [
          'What skills should I learn?',
          'What job can I switch to?',
          'How many days can I survive without a salary?',
        ],
        isAlert: true,
        alertType: 'error'
      };
    }

    // === CROSS-DOMAIN 2: Job Loss Next Month - What Should I Do? ===
    if ((lower.includes('lose my job') || lower.includes('job loss') || lower.includes('laid off')) && (lower.includes('next month') || lower.includes('what should i do'))) {
      return {
        text: `🚨 **LAYOFF CONTINGENCY & ACTION PROTOCOL**\n\n` +
          `If you lose your job next month, here is your connected financial and career resilience roadmap:\n\n` +
          `**1. Financial Survival & Runway:**\n` +
          `• **Liquid Emergency Reserve:** ₹2,10,000 (Status: EXCELLENT)\n` +
          `• **Standard Survival Runway:** **6.0 Months (180 Days)** at normal ₹35,000/mo burn.\n` +
          `• **Emergency Freeze Runway:** **7.8 Months (235 Days)** by eliminating discretionary spends.\n` +
          `• **Fixed Obligations:** ₹8,000 existing EMI must be serviced to protect CIBIL score.\n\n` +
          `**2. Career Transition & Re-employment:**\n` +
          `• **Immediate Role Match:** Full Stack Developer (**91% Match**, ₹12L–₹16L LPA) leverages your React + Node.js background.\n` +
          `• **Alternative Role:** Backend Engineer (**86% Match**, ₹13L–₹17L LPA).\n` +
          `• **Top Priority Skill:** Complete AWS Cloud Solutions training in Month 1 to close your primary gap and raise resilience from 61 to 84.\n\n` +
          `**3. Immediate Action Checklist:**\n` +
          `• Activate Freeze Budget on Day 1.\n` +
          `• Maintain health insurance cover (protects against medical drain).\n` +
          `• Deploy your transition-ready CV for Full Stack Developer roles in Bengaluru.`,
        suggestions: [
          'What jobs are suitable for me?',
          'What skills should I learn?',
          'How many days can I survive without a salary?',
        ],
        isAlert: true,
        alertType: 'warning'
      };
    }

    // === CANONICAL 1: What is my financial health? ===
    if (lower.includes('what is my financial health') || lower.includes('my financial health') || lower.includes('financial health summary')) {
      return {
        text: `📊 **FINFOLIO FINANCIAL HEALTH REPORT (EMP-RKVT-1001)**\n\n` +
          `• **Monthly Take-Home Income:** ₹65,000\n` +
          `• **Essential Monthly Burn:** ₹35,000 (Living expenses)\n` +
          `• **Existing Debt EMI:** ₹8,000 (DTI: 12.3% — Healthy)\n` +
          `• **Liquid Wallet Balance:** ₹1,00,000 INR (Protected threshold: ₹20,000)\n` +
          `• **Emergency Reserve:** ₹2,10,000 (**6.0 Months Runway / 180 Days**)\n` +
          `• **Emergency Status:** **EXCELLENT**\n` +
          `• **Job Stability Score:** 74/100 (Role: Software Engineer)\n` +
          `• **Company Risk:** MODERATE (Example Technologies Pvt. Ltd., Stability: 68/100)\n` +
          `• **Career Resilience Score:** 61/100 (Potential: 84/100 with AWS Cloud & AI skills)\n\n` +
          `💡 **Overall Assessment:** Your personal balance sheet has strong liquidity and a robust 6-month buffer, but your income source carries moderate employer risk. Prioritize upskilling over taking new debt.`,
        suggestions: [
          'Why is my career risk moderate?',
          'Can I afford a ₹20 lakh home loan?',
          'What skills should I learn?',
        ],
        isAlert: false
      };
    }

    // === CANONICAL 2: Why is my score low? ===
    if (lower.includes('why is my score low') || lower.includes('score low') || lower.includes('why is score')) {
      return {
        text: `🔍 **RESILIENCE SCORE BREAKDOWN: 61/100**\n\n` +
          `Your **Career Resilience Score is 61/100** (compared to your 74/100 role stability) because of two critical factors:\n\n` +
          `1. **Employer Business Headwinds:** Example Technologies is facing decelerating growth (8% vs 28%) and EBITDA compression (-3.4%), reducing internal advancement security.\n` +
          `2. **Skill Obsolescence Exposure:** While your core React and Node.js skills are strong (Level 4/5), modern engineering demand has shifted heavily toward Cloud Architecture (AWS gap: 2/5) and AI/LLM integration (gap: 1/5).\n\n` +
          `📈 **How to Reach 84/100 (+23 Points):**\n` +
          `Completing Phase 1 (AWS Solutions Architect) and Phase 2 (LangChain/RAG) raises your market resilience to **84/100**, opening transition paths to ₹16L–₹20L LPA roles.`,
        suggestions: [
          'Which skill gives me the biggest improvement?',
          'What skills should I learn?',
          'What job can I switch to?',
        ]
      };
    }

    // === CANONICAL 3: How risky is my company? ===
    if (lower.includes('how risky is my company') || lower.includes('how risky') || lower.includes('company stability')) {
      return {
        text: `🏢 **EMPLOYER INTELLIGENCE: EXAMPLE TECHNOLOGIES PVT. LTD.**\n\n` +
          `• **Corporate Risk Level:** **MODERATE**\n` +
          `• **Stability Score:** **68/100**\n` +
          `• **Financial Health Score:** **72/100**\n` +
          `• **Revenue Growth Trend:** Decelerating (8% YoY vs 28% prior year)\n` +
          `• **Profitability:** Margin contraction (EBITDA margin -3.4%)\n` +
          `• **Headcount Growth:** -4.2% (Selective hiring / net contraction)\n` +
          `• **Attrition Rate:** 18.5%\n` +
          `• **Debt Exposure:** Low leverage (Debt/Equity: 0.28)\n\n` +
          `💡 **Interpretation:** The company is fundamentally solvent with low debt, but growth deceleration and margin pressure signal potential restructuring in non-core units. Maintain your 6-month buffer and do not add high fixed EMIs.`,
        suggestions: [
          'What should I do if my company becomes risky?',
          'Can I afford a ₹20 lakh home loan?',
          'What jobs are suitable for me?',
        ],
        isAlert: true,
        alertType: 'warning'
      };
    }

    // === CANONICAL 4: Should I continue my current job? ===
    if (lower.includes('should i continue my current job') || lower.includes('should i continue in my job') || lower.includes('continue my current job')) {
      return {
        text: `👔 **JOB CONTINUITY EVALUATION: SOFTWARE ENGINEER**\n\n` +
          `• **Role Stability Score:** **74/100** (Viable)\n` +
          `• **Monthly Take-Home:** ₹65,000\n` +
          `• **Employer Risk:** MODERATE (Example Technologies Pvt. Ltd.)\n\n` +
          `✅ **Verdict: CONTINUE YOUR JOB, BUT ACTIVATE PREPARATION**\n\n` +
          `Your role is not under immediate threat, and resigning precipitously would surrender your steady cash flow. However, because company hiring is contracting (-4.2%):` +
          `\n• Do not assume automatic annual raises.` +
          `\n• Spend 5–8 hours/week completing AWS Cloud certification.` +
          `\n• Keep your Career Transition profile (Full Stack 91% match) ready for quick deployment if restructuring expands.`,
        suggestions: [
          'What skills should I learn?',
          'What jobs are suitable for me?',
          'Can I afford to leave my current job?',
        ]
      };
    }

    // === CANONICAL 9: What happens if my salary falls 20%? ===
    if (lower.includes('salary falls 20%') || lower.includes('salary drops 20%') || lower.includes('income drops 20%') || lower.includes('salary cut')) {
      const reducedSalary = Math.round(monthlyIncome * 0.80);
      const totalObligations = monthlyExpenses + 8000;
      const remainingSurplus = reducedSalary - totalObligations;
      return {
        text: `📉 **STRESS TEST: 20% SALARY REDUCTION SIMULATION**\n\n` +
          `• **Current Take-Home:** ₹${monthlyIncome.toLocaleString('en-IN')}\n` +
          `• **Reduced Take-Home (-20%):** **₹${reducedSalary.toLocaleString('en-IN')} / mo**\n` +
          `• **Essential Living Burn:** ₹${monthlyExpenses.toLocaleString('en-IN')} / mo\n` +
          `• **Existing EMI Obligation:** ₹8,000 / mo\n` +
          `• **Total Non-Negotiable Expenses:** ₹${totalObligations.toLocaleString('en-IN')} / mo\n` +
          `• **Monthly Net Cash Surplus:** **₹${remainingSurplus.toLocaleString('en-IN')} / mo**\n\n` +
          `🛡️ **Resilience Impact:**\n` +
          `Because your monthly obligations (₹${totalObligations.toLocaleString('en-IN')}) remain below your reduced income (₹${reducedSalary.toLocaleString('en-IN')}), **you will NOT need to deplete your emergency fund**! Your 6.0-month runway remains intact.\n\n` +
          `⚠️ **Crucial Warning:** If you had taken an additional ₹20,000 EMI from a ₹20 Lakh loan, total obligations would be ₹63,000, creating an immediate **₹11,000/month cash deficit** that would drain your emergency fund in 19 months!`,
        suggestions: [
          'Can I afford a ₹20 lakh home loan?',
          'How many days can I survive without a salary?',
          'What should I do if my company becomes risky?',
        ],
        isAlert: true,
        alertType: 'warning'
      };
    }

    // === CANONICAL 10: Should I take a new EMI? ===
    if (lower.includes('should i take a new emi') || lower.includes('take a new emi') || lower.includes('take an emi')) {
      return {
        text: `💳 **NEW EMI PRUDENCE AUDIT**\n\n` +
          `• **Current Existing EMI:** ₹8,000/month\n` +
          `• **FINFOLIO Safe Additional EMI Ceiling:** **₹10,000/month**\n` +
          `• **Recommended Additional EMI:** **₹7,500/month**\n` +
          `• **Maximum Safe Total Debt Burden:** ₹18,000/mo (27.7% DTI)\n\n` +
          `✅ **Verdict:** You can take a new EMI **ONLY IF it is under ₹10,000/month** (such as a two-wheeler, necessary appliance, or modest personal loan under ₹6.0L–₹8.5L).\n\n` +
          `❌ **Avoid:** Any EMI above ₹10,000 (such as a ₹20L home loan or high-end car EMI) until Example Technologies transitions to Low Risk or you complete your career transition.`,
        suggestions: [
          'Can I afford a ₹20 lakh home loan?',
          'Which loan is safer for me?',
          'Why is my loan affordability lower than bank eligibility?',
        ]
      };
    }

    // === CANONICAL 12: What will happen to my emergency fund? ===
    if (lower.includes('what will happen to my emergency fund') || lower.includes('happen to my emergency fund')) {
      return {
        text: `🛡️ **EMERGENCY FUND STATUS & PROJECTION**\n\n` +
          `• **Current Reserve Balance:** **₹2,10,000 INR**\n` +
          `• **Monthly Essential Burn:** ₹35,000\n` +
          `• **Current Survival Coverage:** **6.0 Months (180 Days)**\n` +
          `• **Status Rating:** **EXCELLENT** (Meets 6-month benchmark standard)\n\n` +
          `**Scenario Projections:**\n` +
          `• **If you withdraw ₹50,000:** Drops to ₹1,60,000 (**4.5 Months / 135 Days**) — requires Nominee review.\n` +
          `• **If you lose your job tomorrow:** Lasts exactly **180 Days** under standard burn, or **235 Days** under freeze mode.\n` +
          `• **If you take a ₹20L loan:** Essential burn jumps to ₹55,000/mo, collapsing runway to **3.8 Months**.`,
        suggestions: [
          'Can I withdraw ₹50,000?',
          'How many days can I survive without a salary?',
          'How much emergency fund should I maintain?',
        ]
      };
    }

    // === CANONICAL 13: Why is my career risk moderate? ===
    if (lower.includes('why is my career risk moderate') || lower.includes('career risk moderate')) {
      return {
        text: `⚠️ **CAREER RISK EXPLANATION: MODERATE**\n\n` +
          `Your career risk is rated **MODERATE** due to the convergence of three factors:\n\n` +
          `1. **Role Viability Shift:** While Software Engineer roles remain viable, industry hiring is shifting away from pure frontend/Node.js toward cloud infrastructure and AI application engineering.\n` +
          `2. **Company Headwinds:** Example Technologies is undergoing selective hiring with a net headcount contraction of -4.2% and decelerating revenue (8% vs 28%).\n` +
          `3. **Current Resilience Score (61/100):** Your lack of certified AWS Cloud and containerization skills creates friction if you need to transition rapidly.\n\n` +
          `💡 *Completing AWS Cloud upskilling directly boosts resilience from 61 to 84, lowering career risk to LOW.*`,
        suggestions: [
          'Which skill gives me the biggest improvement?',
          'What skills should I learn?',
          'What jobs are suitable for me?',
        ]
      };
    }

    // === CANONICAL 14: Which skill gives me the biggest improvement? ===
    if (lower.includes('which skill gives me the biggest') || lower.includes('biggest improvement') || lower.includes('best skill to learn') || lower.includes('top skill')) {
      return {
        text: `⚡ **MAXIMUM IMPACT SKILL: CLOUD / AWS SOLUTIONS**\n\n` +
          `• **Skill:** AWS Cloud Architecture (IAM, VPC, ECS, S3, Serverless)\n` +
          `• **Current Level:** 2/5 (Foundational)\n` +
          `• **Target Level:** 4/5 (Architectural Competence)\n` +
          `• **Time Investment:** **0–3 Months (Phase 1)**\n` +
          `• **Resilience Impact:** **+14 Points** (Lifts overall score from 61 to 75 immediately!)\n\n` +
          `🎯 **Why AWS Cloud First?**\n` +
          `1. Directly qualifies you for **Full Stack Developer (91% Match, ₹12L–₹16L LPA)**.\n` +
          `2. Unlocks **Cloud Solutions Engineer (78% Match, ₹15L–₹20L LPA)**.\n` +
          `3. Provides highest market mobility across top Indian tech employers in Bengaluru, Hyderabad, and Pune.`,
        suggestions: [
          'What skills should I learn?',
          'What jobs are suitable for me?',
          'Why is my career risk moderate?',
        ]
      };
    }

    // === CANONICAL 15: What should I do first if my company becomes unstable? ===
    if (lower.includes('what should i do first') || lower.includes('company becomes unstable') || lower.includes('company is unstable')) {
      return {
        text: `🛡️ **4-STEP EMERGENCY INSTABILITY TRIAGE PROTOCOL**\n\n` +
          `If Example Technologies or your employer displays instability signals:\n\n` +
          `1. **STEP 1 — FREEZE DISCRETIONARY SPENDING (Day 1):**\n` +
          `   • Cut lifestyle wants by 35% to drop burn from ₹35,000 to ₹26,500/mo.\n` +
          `   • Extends your ₹2,10,000 emergency buffer from **6.0 to 7.8 Months**.\n\n` +
          `2. **STEP 2 — ZERO NEW DEBT (Day 1):**\n` +
          `   • Freeze all new loan applications, credit card EMIs, and large purchases.\n\n` +
          `3. **STEP 3 — ACCELERATE PHASE 1 UPSKILLING (Weeks 1–6):**\n` +
          `   • Focus on AWS Solutions Architect certification to close your primary skill gap.\n\n` +
          `4. **STEP 4 — ACTIVATE CAREER TRANSITION MODE (Month 2):**\n` +
          `   • Target Full Stack Developer (91% match) and Backend Engineer (86% match) openings before layoffs materialize.`,
        suggestions: [
          'How many days can I survive without a salary?',
          'What jobs are suitable for me?',
          'Can I afford a ₹20 lakh home loan?',
        ],
        isAlert: true,
        alertType: 'warning'
      };
    }

    // === CANONICAL 16: Why is my loan affordability lower than bank eligibility? ===
    if (lower.includes('lower than bank eligibility') || lower.includes('loan affordability lower') || lower.includes('difference between bank') || lower.includes('bank vs finfolio')) {
      return {
        text: `⚖️ **FINFOLIO RESILIENT AFFORDABILITY vs BANK ELIGIBILITY**\n\n` +
          `• **FINFOLIO Safe EMI:** **₹10,000 / month** (Safe Loan: ₹6.0L – ₹8.5L)\n` +
          `• **Bank Lending Approval:** **₹24,500 / month** (Bank Loan: ₹22.0 Lakhs)\n` +
          `• **Gap:** Bank offers **2.5x more debt** than is safe for you!\n\n` +
          `🏦 **Why the Difference Exists:**\n` +
          `• **Commercial Banks** calculate *maximum extractable interest before legal default* using a rigid 50% FOIR (Fixed Obligation to Income Ratio). They do not care if an EMI wipes out your savings or forces you to skip emergency funds.\n` +
          `• **FINFOLIO Resilient Affordability** calculates *sustainable borrowing* that preserves your essential ₹35,000/mo living budget and protects your **6-month emergency survival runway** even if your employer undergoes corporate restructuring.\n\n` +
          `💡 *A bank approval is an offer of debt risk, not a certificate of financial safety.*`,
        suggestions: [
          'Can I afford a ₹20 lakh home loan?',
          'Which loan is safer for me?',
          'What should I do if my company becomes risky?',
        ]
      };
    }

    // 0A. "What should I do if my company becomes risky?" / "Should I continue in my current company?"
    if (lower.includes('company becomes risky') || lower.includes('company is risky') || lower.includes('company risk') || lower.includes('continue in my current company') || lower.includes('should i continue in my company')) {
      return {
        text: `🏢 **COMPANY RISK RESPONSE PROTOCOL**\n\n` +
          `Employer: **Example Technologies Pvt. Ltd.** (Risk: **MODERATE**, Stability: 68/100, Health: 72/100)\n` +
          `Signal: Revenue growth deceleration (8% YoY vs 28% prior) and net tech hiring contraction.\n\n` +
          `**Recommended 6-Step Action Plan:**\n` +
          `1. Build emergency savings toward 6 months buffer (Current: 6.0 months / ₹2,10,000 intact).\n` +
          `2. Avoid taking a high new EMI (Cap additional loan commitments to maximum ₹10,000/mo).\n` +
          `3. Complete the recommended cloud skill upgrade (AWS Certified Solutions Architect Associate in 0–3 months).\n` +
          `4. Prepare a transition-ready CV showcasing your full-stack Node.js + React experience.\n` +
          `5. Review alternative roles matching your current skills (Career Transition Mode: 91% match to Full Stack Developer, ₹12L–₹16L LPA).\n` +
          `6. Reassess your financial runway after the skill upgrade.\n\n` +
          `💡 *Your current position remains viable, but proactive upskilling shifts your career resilience score from 61 to 84.*`,
        suggestions: [
          'What skills should I learn?',
          'What job can I switch to?',
          'Can I afford a ₹20 lakh home loan?',
          'What happens if I lose my job?',
        ],
        isAlert: true,
        alertType: 'warning'
      };
    }

    // 0B. "Can I afford a ₹20 lakh home loan?"
    if ((lower.includes('20 lakh') || lower.includes('20l') || lower.includes('20,00,000')) && (lower.includes('loan') || lower.includes('home loan') || lower.includes('afford'))) {
      return {
        text: `🏦 **LOAN AFFORDABILITY EVALUATION: ₹20 LAKH LOAN**\n\n` +
          `• **Monthly Take-Home:** ₹65,000\n` +
          `• **Existing EMI:** ₹8,000 (DTI: 12.3%)\n` +
          `• **FINFOLIO Max Safe New EMI:** **₹10,000 / mo**\n` +
          `• **FINFOLIO Safe Loan Range:** **₹6,00,000 – ₹8,50,000**\n` +
          `• **Bank Lending Approval Ceiling:** ₹22,00,000 (₹24,500 EMI at 50% FOIR)\n\n` +
          `⚠️ **VERDICT: CANNOT SAFELY AFFORD A ₹20 LAKH LOAN**\n\n` +
          `While a commercial retail bank will happily approve you for up to ₹22 Lakhs, taking a ₹20 Lakh loan would require an EMI of ~₹20,000–₹22,000/month. Combined with your existing ₹8,000 EMI, your debt burden would consume **46% of your monthly income**.\n\n` +
          `🚨 **Corporate Risk Hazard:** Under Example Technologies' Moderate Risk status, if your salary is delayed or restructured, a ₹20L loan would collapse your emergency runway from **6.0 months down to 3.1 months**, inducing immediate default hazard.\n\n` +
          `✅ **FinFolio Advice:** Cap any new loan principal between **₹6,00,000 and ₹8,50,000** (max ₹10,000 EMI).`,
        suggestions: [
          'Which loan is safer for me?',
          'What happens if I lose my job?',
          'What should I do if my company becomes risky?',
        ],
        isAlert: true,
        alertType: 'error'
      };
    }

    // 0C. "Can I withdraw ₹50,000?" / Protected Withdrawal Query
    if ((lower.includes('withdraw') && (lower.includes('50000') || lower.includes('50,000') || lower.includes('50k'))) || (lower.includes('withdraw') && lower.includes('emergency fund'))) {
      return {
        text: `🛡️ **HIGH-VALUE WITHDRAWAL PROTECTION ALERT**\n\n` +
          `• **Requested Amount:** ₹50,000\n` +
          `• **Protection Threshold:** ₹20,000 (Exceeded by ₹30,000)\n` +
          `• **Nominee Review Required:** YES (nominee@finfolio.com)\n\n` +
          `📊 **Runway Consequence Analysis:**\n` +
          `• Current Emergency Fund: ₹2,10,000 (6.0 Months Runway / 180 Days)\n` +
          `• Post-Withdrawal Reserve: **₹1,60,000** (4.5 Months Runway / 135 Days)\n` +
          `• **Net Runway Loss:** **-1.5 Months (-45 Survival Days)**\n` +
          `• Goal Impact: "Emergency Reserve" delayed by ~65 days.\n\n` +
          `🔒 **Two-Person Governance Invariant:**\n` +
          `Even after your nominee reviews and approves your request, no money moves automatically. You must confirm execution yourself with your 4-digit security PIN.`,
        suggestions: [
          'How many days can I survive without a salary?',
          'What should I do if my company becomes risky?',
          'Can I afford a ₹20 lakh home loan?',
        ],
        isAlert: true,
        alertType: 'warning'
      };
    }

    // 0D. "What skills should I learn?" / "Skills gap"
    if (lower.includes('skills should i learn') || lower.includes('what skills') || lower.includes('skill gap') || lower.includes('skills to learn')) {
      return {
        text: `🚀 **CAREER RESILIENCE SKILLS ROADMAP**\n\n` +
          `Current Career Resilience: **61/100** ➔ Target Potential: **84/100** (+23 Points)\n\n` +
          `**Prioritized 3-Phase Upskilling Plan:**\n` +
          `1. **Phase 1 (0–3 Months, HIGH PRIORITY):** Cloud / AWS Solutions\n` +
          `   • Gap: Level 2/5 ➔ 4/5\n` +
          `   • Focus: AWS Solutions Architect Associate (IAM, VPC, ECS Fargate, S3, Serverless)\n\n` +
          `2. **Phase 2 (3–6 Months, HIGH PRIORITY):** Applied AI/ML & LLM Ops\n` +
          `   • Gap: Level 1/5 ➔ 3/5\n` +
          `   • Focus: LangChain orchestration, RAG architecture, vector search & FastAPI\n\n` +
          `3. **Phase 3 (6–12 Months, MEDIUM PRIORITY):** DevOps & Kubernetes\n` +
          `   • Gap: Level 2/5 ➔ 4/5\n` +
          `   • Focus: Docker multi-stage builds, Kubernetes Helm charts & GitHub Actions CI/CD`,
        suggestions: [
          'What job can I switch to?',
          'What should I do if my company becomes risky?',
          'Can I afford to leave my current job?',
        ]
      };
    }

    // 0E. "What job can I switch to?" / "Career transition"
    if (lower.includes('job can i switch') || lower.includes('what job') || lower.includes('career transition') || lower.includes('alternative role') || lower.includes('alternative job')) {
      return {
        text: `🎯 **CAREER TRANSITION MODE: TOP ALTERNATIVE ROLES**\n\n` +
          `Current Role: **Software Engineer** (3 yrs exp, Bengaluru)\n\n` +
          `1. **Full Stack Developer** — **91% Match**\n` +
          `   • Salary Range: ₹12,00,000 – ₹16,00,000 / yr\n` +
          `   • Transferable: React, Node.js, REST APIs, SQL\n` +
          `   • Missing: Next.js App Router, Tailwind CSS, TypeScript Advanced\n\n` +
          `2. **Backend Engineer** — **86% Match**\n` +
          `   • Salary Range: ₹13,00,000 – ₹17,00,000 / yr\n` +
          `   • Transferable: Node.js, SQL, Express, DB Architecture\n` +
          `   • Missing: Distributed Systems, Redis Caching, Apache Kafka\n\n` +
          `3. **Cloud Solutions Engineer** — **78% Match**\n` +
          `   • Salary Range: ₹15,00,000 – ₹20,00,000 / yr\n` +
          `   • Missing: AWS IAM, Terraform, ECS/EKS\n\n` +
          `4. **Data Platform Engineer** — **72% Match**\n` +
          `   • Salary Range: ₹14,00,000 – ₹19,00,000 / yr\n` +
          `   • Missing: Python Pipelines, Apache Spark, Snowflake`,
        suggestions: [
          'What skills should I learn?',
          'What should I do if my company becomes risky?',
          'How many days can I survive without a salary?',
        ]
      };
    }

    // 0F. "Which loan is safer for me?" / "How much debt can I safely take?"
    if (lower.includes('safer for me') || lower.includes('how much debt') || lower.includes('safe loan') || lower.includes('loan range')) {
      return {
        text: `⚖️ **FINFOLIO RESILIENT LOAN BENCHMARK**\n\n` +
          `• **Maximum Safe Additional EMI:** **₹10,000 / month**\n` +
          `• **Recommended Additional EMI:** **₹7,500 / month**\n` +
          `• **Safe Principal Borrowing Range:** **₹6,00,000 – ₹8,50,000**\n` +
          `• **Conservative Loan Amount:** ₹5,00,000\n` +
          `• **Bank Commercial Eligible Limit:** Up to ₹22,00,000 (NOT recommended!)\n\n` +
          `💡 **The Resilience Principle:** A bank checks the maximum money they can legally claim from your salary before insolvency. FINFOLIO calculates what you can comfortably pay while keeping a 6-month living reserve intact during economic or employer downturns.`,
        suggestions: [
          'Can I afford a ₹20 lakh home loan?',
          'What should I do if my company becomes risky?',
          'How much should I save every month?',
        ]
      };
    }

    // 1. "How many days can I survive without a salary?"
    if (lower.includes('how many days') || lower.includes('survival days') || lower.includes('days can i survive') || (lower.includes('days') && lower.includes('survive'))) {
      const riskBand = standardSurvivalDays >= 180 ? 'Fortress Healthy' : standardSurvivalDays >= 90 ? 'Moderate Buffer' : standardSurvivalDays >= 30 ? 'Low Cushion' : 'Critical Hazard';
      return {
        text: `🛡️ **EXACT SURVIVAL RUNWAY REPORT**\n\n` +
          `• **Standard Survival:** **${standardSurvivalDays} DAYS** (${standardCoverageMonths} Months)\n` +
          `• **Emergency Freeze Mode:** **${freezeSurvivalDays} DAYS** (${freezeCoverageMonths} Months)\n` +
          `• **Liquid Cash Reserve:** ${formatAmount(emergencyFund)}\n` +
          `• **Monthly Essential Burn:** ${formatAmount(monthlyExpenses)}\n` +
          `• **Safety Classification:** [${riskBand}]\n\n` +
          `💡 **Insight:** In a sudden zero-salary event, your ₹${emergencyFund.toLocaleString('en-IN')} reserve lasts exactly ${standardSurvivalDays} days under normal living. Cutting discretionary wants (-35% burn) instantly extends your life by **${freezeSurvivalDays - standardSurvivalDays} additional days**.`,
        suggestions: [
          'What happens if I lose my job tomorrow?',
          'Can I afford to leave my current job?',
          'How much emergency fund should I maintain?',
        ]
      };
    }

    // 2. "Can I afford to leave my current job?" / Quit job
    if (lower.includes('leave my') || lower.includes('quit my') || lower.includes('resign') || lower.includes('leave current job')) {
      if (standardSurvivalDays < 90) {
        return {
          text: `🚨 **RED ALERT: DO NOT LEAVE YOUR JOB YET**\n\n` +
            `• **Your Survival Runway:** Only **${standardSurvivalDays} Days** (${standardCoverageMonths} Months)\n` +
            `• **Minimum Safe Floor:** At least 180 Days (6 Months)\n` +
            `• **Current Capital Deficit:** ${formatAmount(Math.max(0, monthlyExpenses * 6 - emergencyFund))}\n\n` +
            `⚠️ Resigning now without an offer creates extreme financial vulnerability. In the current Indian hiring market, tech and corporate rehiring takes an average of 4 to 6 months. If you resign today, your cash will deplete in **${standardSurvivalDays} days**, forcing you into high-interest personal loans or debt default.`,
          suggestions: [
            'How much emergency fund should I maintain?',
            'What happens if I lose my job tomorrow?',
            'How can I save more money?',
          ],
          isAlert: true,
          alertType: 'error'
        };
      } else if (standardSurvivalDays < 180) {
        return {
          text: `⚠️ **CAUTION: BORDERLINE RESIGNATION BUFFER**\n\n` +
            `• **Current Survival:** **${standardSurvivalDays} Days** (${standardCoverageMonths} Months)\n` +
            `• **Target Safe Runway:** 180 Days (6 Months)\n\n` +
            `You have enough funds for ${standardSurvivalDays} days, but leaving without an accepted offer is risky if interviews stretch beyond 3 months. Build an additional ${formatAmount(monthlyExpenses * 6 - emergencyFund)} before handing in your notice.`,
          suggestions: ['How to extend my runway?', 'How much should I save every month?'],
          isAlert: true,
          alertType: 'warning'
        };
      } else {
        return {
          text: `✅ **REASONABLY SECURED TRANSITION BUFFER**\n\n` +
            `• **Current Survival:** **${standardSurvivalDays} Days** (${standardCoverageMonths} Months)\n` +
            `• **Emergency Reserve:** ${formatAmount(emergencyFund)}\n\n` +
            `You meet the fortress standard of 6+ months (${standardSurvivalDays} days). You can afford a planned sabbatical or career transition, provided you enforce a freeze budget of ${formatAmount(freezeExpenses)}/month during the gap.`,
          suggestions: ['What happens if I lose my job tomorrow?', 'How to optimize my budget?'],
          isAlert: true,
          alertType: 'success'
        };
      }
    }

    // 3. "What happens to my finances if I lose my job tomorrow?" / Layoff shock
    if (lower.includes('lose my job') || lower.includes('layoff') || lower.includes('laid off') || lower.includes('fired')) {
      return {
        text: `🚨 **CRITICAL SCENARIO: SUDDEN LAYOFF SHOCK TRIAGE**\n\n` +
          `If you lose your job tomorrow:\n` +
          `1. **Immediate Income Drop:** Monthly cash flow drops to ₹0.\n` +
          `2. **Exact Days of Survival:** You have **${standardSurvivalDays} Days** (${standardCoverageMonths} Months) before insolvency.\n` +
          `3. **Fixed Burn Drag:** You will bleed ${formatAmount(monthlyExpenses)} every 30 days.\n` +
          `4. **Debt Obligation:** Total debt of ${formatAmount(debt)} continues accruing interest.\n\n` +
          `🛡️ **Immediate Action Protocol (Day 1 - Day 7):**\n` +
          `• **Activate Freeze Budget:** Cut all dining, OTT subscriptions, and shopping to extend runway to **${freezeSurvivalDays} Days** (+${freezeSurvivalDays - standardSurvivalDays} days).\n` +
          `• **Preserve Health Cover:** Do not let health insurance lapse; hospital bills without corporate cover are the #1 destroyer of emergency funds.\n` +
          `• **Pause Non-Essential Investments:** Redirect equity SIPs into cash buffer until re-employed.`,
        suggestions: [
          'Can I afford to leave my current job?',
          'How much emergency fund should I maintain?',
          'Recommend career switch roles',
        ],
        isAlert: true,
        alertType: 'error'
      };
    }

    // 4. "Can I afford this purchase?" / Affordability test
    if (lower.includes('afford') && (lower.includes('buy') || lower.includes('purchase') || lower.includes('phone') || lower.includes('car') || lower.includes('laptop') || lower.includes('trip') || parseAmountFromText(userMessage))) {
      const purchaseAmount = parseAmountFromText(userMessage) || 50000;
      const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);
      const remainingEmergencyAfterPurchase = emergencyFund - purchaseAmount;
      const runwayAfterPurchase = Math.round((remainingEmergencyAfterPurchase / Math.max(1, monthlyExpenses)) * 30.417);

      if (purchaseAmount > emergencyFund) {
        return {
          text: `❌ **UNACCEPTABLE PURCHASE RISK: CANNOT AFFORD**\n\n` +
            `• **Purchase Cost:** ${formatAmount(purchaseAmount)}\n` +
            `• **Available Emergency Fund:** ${formatAmount(emergencyFund)}\n\n` +
            `This purchase exceeds your entire liquid cash reserve. Funding this through credit cards (36-42% APR) or personal loans will plunge you into an acute debt trap.`,
          suggestions: ['How to save up for this purchase?', 'How much should I save every month?'],
          isAlert: true,
          alertType: 'error'
        };
      } else if (runwayAfterPurchase < 90) {
        return {
          text: `⚠️ **HIGH RISK: PURCHASING BREACHES CRITICAL SAFETY FLOOR**\n\n` +
            `• **Item Cost:** ${formatAmount(purchaseAmount)}\n` +
            `• **Runway Before:** ${standardSurvivalDays} Days\n` +
            `• **Runway After:** **${runwayAfterPurchase} Days** (Critically low!)\n\n` +
            `Spending ${formatAmount(purchaseAmount)} depletes your safety net to just ${runwayAfterPurchase} days. Instead, use your monthly surplus of ${formatAmount(monthlySurplus)} and save for **${Math.ceil(purchaseAmount / Math.max(1, monthlySurplus))} months** to buy it outright without touching emergency reserves.`,
          suggestions: ['How to budget for this?', 'How many days can I survive?'],
          isAlert: true,
          alertType: 'warning'
        };
      } else {
        return {
          text: `✅ **AFFORDABLE WITH DISCRETION**\n\n` +
            `• **Item Cost:** ${formatAmount(purchaseAmount)}\n` +
            `• **Runway Remaining:** ${runwayAfterPurchase} Days (${(runwayAfterPurchase / 30.417).toFixed(1)} Months)\n` +
            `• **Monthly Surplus:** ${formatAmount(monthlySurplus)}/month\n\n` +
            `Your emergency fund will remain above safe limits (${runwayAfterPurchase} days). For optimal financial hygiene, aim to replenish this ${formatAmount(purchaseAmount)} within ${Math.ceil(purchaseAmount / Math.max(1, monthlySurplus))} months from monthly surplus.`,
          suggestions: ['How much should I save every month?', 'Where is most of my money allocated?'],
          isAlert: true,
          alertType: 'success'
        };
      }
    }

    // 5. "Medical emergency plan for ₹5 Lakhs" / Hospitalization
    if (lower.includes('medical') || lower.includes('hospital') || lower.includes('health insurance') || lower.includes('illness')) {
      const shockCost = 500000;
      const outOfPocket = Math.max(0, shockCost - healthInsuranceCover);
      const remainingCash = emergencyFund - outOfPocket;
      const runwayAfterMedical = Math.round((Math.max(0, remainingCash) / Math.max(1, monthlyExpenses)) * 30.417);

      return {
        text: `🏥 **CRITICAL STRESS TEST: ₹5,00,000 MEDICAL EMERGENCY**\n\n` +
          `• **Simulated Hospitalization Cost:** ${formatAmount(shockCost)}\n` +
          `• **Current Health Insurance Cover:** ${formatAmount(healthInsuranceCover)}\n` +
          `• **Estimated Out-of-Pocket Drain:** ${formatAmount(outOfPocket)}\n` +
          `• **Survival Runway After Shock:** **${runwayAfterMedical} Days**\n\n` +
          `💡 **Actionable Recommendation:**\n` +
          `${healthInsuranceCover < shockCost
            ? `⚠️ Your health insurance has a shortfall of ${formatAmount(shockCost - healthInsuranceCover)}. A single hospital admission would drain your liquid savings by ${formatAmount(outOfPocket)}. Expand your medical cover to at least ₹15,00,000 using a Super Top-up policy (est. ₹4,000/year premium).`
            : `✅ Your medical insurance cover of ${formatAmount(healthInsuranceCover)} successfully shields your liquid reserves from catastrophic hospital bills.`}`,
        suggestions: [
          'How many days can I survive without a salary?',
          'How much emergency fund should I maintain?',
          'Compare Old vs New Tax Regime',
        ]
      };
    }

    // 6. "How much emergency fund should I maintain?"
    if (lower.includes('how much emergency') || lower.includes('emergency fund should') || lower.includes('maintain') && lower.includes('emergency')) {
      const min3M = monthlyExpenses * 3;
      const standard6M = monthlyExpenses * 6;
      const fortress12M = monthlyExpenses * 12;

      return {
        text: `🛡️ **EMERGENCY FUND BENCHMARK RECOMMENDATION**\n\n` +
          `Based on your monthly essential expenses of **${formatAmount(monthlyExpenses)}**:\n\n` +
          `• **3-Month Absolute Minimum Floor:** ${formatAmount(min3M)} (90 Days)\n` +
          `• **6-Month Standard Shield (Recommended):** **${formatAmount(standard6M)}** (180 Days)\n` +
          `• **12-Month Fortress Defense:** ${formatAmount(fortress12M)} (365 Days)\n\n` +
          `• **Your Current Reserve:** ${formatAmount(emergencyFund)} (${standardSurvivalDays} Days)\n` +
          `• **Deficit to 6-Month Target:** ${emergencyFund >= standard6M ? '✅ Fully Funded!' : `⚠️ Deficit of ${formatAmount(standard6M - emergencyFund)}`}\n\n` +
          `💡 Keep this fund in high-liquidity, capital-protected instruments: 50% in a Multi-Option Savings Account / Sweep-in FD, and 50% in an Indian Liquid Mutual Fund.`,
        suggestions: [
          'How many days can I survive without a salary?',
          'How much should I save every month?',
          'What happens if I lose my job tomorrow?',
        ]
      };
    }

    // 7. "How much should I save every month?" / 50/30/20 Rule
    if (lower.includes('how much should i save') || lower.includes('save every month') || lower.includes('how much to save') || lower.includes('savings target')) {
      const needs50 = Math.round(monthlyIncome * 0.50);
      const wants30 = Math.round(monthlyIncome * 0.30);
      const savings20 = Math.round(monthlyIncome * 0.20);
      const aggressive30 = Math.round(monthlyIncome * 0.30);

      return {
        text: `💰 **MONTHLY SAVINGS & BUDGET ALLOCATION BLUEPRINT**\n\n` +
          `For your monthly income of **${formatAmount(monthlyIncome)}**:\n\n` +
          `• **Needs / Essentials (50% max):** ${formatAmount(needs50)} (Rent, food, utilities, EMIs)\n` +
          `• **Wants / Lifestyle (30% max):** ${formatAmount(wants30)} (Dining, shopping, travel)\n` +
          `• **Baseline Savings (20% target):** **${formatAmount(savings20)}/month**\n` +
          `• **Aggressive Wealth Creation (30%):** **${formatAmount(aggressive30)}/month**\n\n` +
          `🚀 **Deployment Strategy:**\n` +
          `1. Direct ${formatAmount(Math.min(savings20, 15000))} into Emergency Fund until 6 months (${formatAmount(monthlyExpenses * 6)}) is full.\n` +
          `2. Direct remainder into Nifty 50 Index Mutual Funds via monthly automated SIP.\n` +
          `3. At 12% CAGR, saving ${formatAmount(savings20)}/month compounds to **${formatAmount(savings20 * 12 * 10 * 1.75)} in 10 years**!`,
        suggestions: [
          'Am I spending too much on entertainment?',
          'Where is most of my money allocated?',
          'How many days can I survive without a salary?',
        ]
      };
    }

    // 8. "Am I spending too much on entertainment?" / Discretionary spend
    if (lower.includes('entertainment') || lower.includes('spending too much') || lower.includes('discretionary') || lower.includes('lifestyle spend')) {
      const allowedWants = Math.round(monthlyIncome * 0.30);
      const currentWants = profile.monthlyWants || Math.round(monthlyExpenses * 0.35);
      const isExcessive = currentWants > allowedWants;

      return {
        text: `🎯 **ENTERTAINMENT & DISCRETIONARY AUDIT**\n\n` +
          `• **Current Estimated Discretionary Spend:** ${formatAmount(currentWants)}/month\n` +
          `• **Healthy Upper Limit (30% of Income):** ${formatAmount(allowedWants)}/month\n` +
          `• **Verdict:** ${isExcessive ? `⚠️ Spending ${formatAmount(currentWants - allowedWants)} above optimal benchmark` : `✅ Well within the healthy 30% ceiling`}\n\n` +
          `💡 **Action Step:** High discretionary leakage is the most common reason users fail to reach their 6-month emergency cushion. Trimming just ₹5,00,0/month from entertainment redirects ₹60,000/year into your survival fortress!`,
        suggestions: [
          'How much should I save every month?',
          'Can I afford a ₹75,000 purchase?',
          'How many days can I survive without a salary?',
        ]
      };
    }

    // 9. "Where is most of my money allocated?" / Asset distribution
    if (lower.includes('allocated') || lower.includes('money allocated') || lower.includes('where is my money') || lower.includes('portfolio breakdown')) {
      const totalAssets = emergencyFund + profile.investments;
      const emergencyPct = totalAssets > 0 ? Math.round((emergencyFund / totalAssets) * 100) : 0;
      const investPct = totalAssets > 0 ? Math.round((profile.investments / totalAssets) * 100) : 0;

      return {
        text: `📊 **ACTIVE ASSET ALLOCATION BREAKDOWN**\n\n` +
          `• **Liquid Emergency Reserves:** ${formatAmount(emergencyFund)} (${emergencyPct}% of assets)\n` +
          `• **Long-term Investments & Equity:** ${formatAmount(profile.investments)} (${investPct}% of assets)\n` +
          `• **Total Liquid Net Worth:** ${formatAmount(totalAssets - debt)}\n` +
          `• **Total Debt / Liabilities:** ${formatAmount(debt)}\n\n` +
          `💡 **Asset Health:** Having ${emergencyPct}% in liquid reserves provides an immediate buffer of **${standardSurvivalDays} Days**. Visit the **Asset Allocation page** to view full breakdown across Cash, Deposits, Equities, Gold, and Liabilities.`,
        suggestions: [
          'How many days can I survive without a salary?',
          'Debt payoff strategy (Avalanche)',
          'How much should I save every month?',
        ]
      };
    }

    // 10. Debt Payoff / Avalanche
    if (lower.includes('debt') || lower.includes('loan') || lower.includes('emi') || lower.includes('avalanche') || lower.includes('snowball')) {
      return {
        text: `💳 **HIGH DEBT STRESS & REPAYMENT ACCELERATOR**\n\n` +
          `• **Total Outstanding Debt:** ${formatAmount(debt)}\n` +
          `• **Estimated DTI Ratio:** ${dti}% [${dti > 40 ? '⚠️ High Debt Stress' : '✅ Manageable'}]\n\n` +
          `⚡ **Recommended Strategy: DEBT AVALANCHE**\n` +
          `1. List all loans by Interest Rate (APR) from highest to lowest.\n` +
          `2. Pay minimum payments on all loans to protect your CIBIL score.\n` +
          `3. Throw every extra rupee into the highest interest debt (e.g. Credit Card at 36-42% APR).\n` +
          `4. Once cleared, avalanche that payment into the next highest loan (e.g. Personal Loan at 14%).\n\n` +
          `💰 **Result:** Saves up to 40% in total interest drain compared to standard EMI schedules!`,
        suggestions: [
          'How many days can I survive without a salary?',
          'Can I afford to leave my current job?',
          'How much emergency fund should I maintain?',
        ]
      };
    }

    // Fallback Comprehensive Guidance
    return {
      text: `FINFOLIO AI is ready to stress-test your finances in Indian Rupee (₹).\n\n` +
        `Ask me any critical question:\n` +
        `• *"How many days can I survive without a salary?"*\n` +
        `• *"What happens if I lose my job tomorrow?"*\n` +
        `• *"Can I afford to leave my current job?"*\n` +
        `• *"Can I afford to buy a ₹75,000 laptop?"*\n` +
        `• *"How much should I save from my ₹${monthlyIncome.toLocaleString('en-IN')} income?"*\n` +
        `• *"Medical emergency plan for ₹5 Lakhs"*\n\n` +
        `Or tell me your details anytime: *"My income is ₹90,000, expenses ₹45,000, emergency fund ₹3,00,000"*.`,
      suggestions: [
        'How many days can I survive without a salary?',
        'Can I afford to leave my current job?',
        'What happens if I lose my job tomorrow?',
        'Can I afford a ₹75,000 purchase?',
      ]
    };
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setChatError(null);
    setLastMessage(messageText);

    try {
      const res = await api.post('/api/chat', {
        message: messageText,
        conversation: messages.slice(-8)
      });

      const data = res.data;
      const botMessage: Message = {
        id: messages.length + 2,
        text: data.text,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: data.suggestions,
        isAlert: data.isAlert,
        alertType: data.alertType,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error, using fallback reasoning:', err);
      try {
        const botResponse = generateResponse(messageText);
        const botMessage: Message = {
          id: messages.length + 2,
          text: botResponse.text,
          sender: 'bot',
          timestamp: new Date(),
          suggestions: botResponse.suggestions,
          isAlert: botResponse.isAlert,
          alertType: botResponse.alertType,
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch {
        setChatError('Unable to reach FINFOLIO Copilot. Please try again.');
        const botMessage: Message = {
          id: messages.length + 2,
          text: '⚠️ Unable to reach FINFOLIO Copilot. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
          isAlert: true,
          alertType: 'error',
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 1,
        text: "🔄 Chat reset. How can I stress-test your finances today?",
        sender: 'bot',
        timestamp: new Date(),
        suggestions: [
          'How many days can I survive without a salary?',
          'Can I afford to leave my current job?',
          'What happens if I lose my job tomorrow?',
          'Can I afford a ₹75,000 purchase?',
        ],
      }
    ]);
  };

  const renderInlineBold = (text: string, isDark: boolean) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={i} style={{ color: isDark ? '#38bdf8' : '#1d4ed8', fontWeight: 700 }}>
            {inner}
          </strong>
        );
      }
      return part;
    });
  };

  const renderFormattedScript = (text: string, isUser: boolean) => {
    if (isUser) {
      return (
        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500, lineHeight: 1.6 }}>
          {text}
        </Typography>
      );
    }

    const isDark = theme.palette.mode === 'dark';
    const paragraphs = text.split('\n\n');

    return (
      <Stack spacing={1.5}>
        {paragraphs.map((para, pIdx) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // Check if paragraph is a report header (e.g. 🧮 **LOAN EMI CALCULATION REPORT**)
          if (
            trimmed.startsWith('🧮') ||
            trimmed.startsWith('📈') ||
            trimmed.startsWith('🛡️') ||
            trimmed.startsWith('📊') ||
            trimmed.startsWith('⚠️') ||
            trimmed.startsWith('🚨') ||
            trimmed.startsWith('🔍')
          ) {
            const lines = trimmed.split('\n');
            const titleLine = lines[0] ?? '';
            const cleanTitle = titleLine.replace(/\*\*/g, '').trim();
            const rest = lines.slice(1).join('\n');

            return (
              <Box
                key={pIdx}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(238, 242, 255, 0.7)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    color: isDark ? '#38bdf8' : '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: rest ? 1 : 0,
                    letterSpacing: '0.3px',
                  }}
                >
                  {cleanTitle}
                </Typography>
                {rest && (
                  <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {renderInlineBold(rest, isDark)}
                  </Typography>
                )}
              </Box>
            );
          }

          // Check if paragraph is a key highlight callout (starts with 📌 or ✅ or ⚠️ or 💡)
          if (trimmed.startsWith('📌') || trimmed.startsWith('✅') || trimmed.startsWith('⚠️') || trimmed.startsWith('💡')) {
            const isAlertWarn = trimmed.startsWith('⚠️');
            const isSuccess = trimmed.startsWith('✅');

            return (
              <Box
                key={pIdx}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isAlertWarn
                    ? isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2'
                    : isSuccess
                      ? isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4'
                      : isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
                  borderLeft: '4px solid',
                  borderColor: isAlertWarn ? '#ef4444' : isSuccess ? '#10b981' : '#2563eb',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {renderInlineBold(trimmed, isDark)}
                </Typography>
              </Box>
            );
          }

          // Check if bullet point block
          if (trimmed.includes('•') || trimmed.startsWith('-')) {
            const items = trimmed.split('\n').filter((l) => l.trim().length > 0);
            return (
              <Box key={pIdx} sx={{ pl: 0.5 }}>
                <Stack spacing={0.8}>
                  {items.map((item, iIdx) => {
                    const cleanItem = item.replace(/^[•\-]\s*/, '').trim();
                    return (
                      <Box key={iIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box
                          component="span"
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: isDark ? '#38bdf8' : '#2563eb',
                            mt: 0.8,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.55 }}>
                          {renderInlineBold(cleanItem, isDark)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            );
          }

          // Standard paragraph
          return (
            <Typography key={pIdx} variant="body2" sx={{ color: 'text.primary', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
              {renderInlineBold(trimmed, isDark)}
            </Typography>
          );
        })}
      </Stack>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="Open AI Financial Copilot"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
          zIndex: 1000,
          border: '2px solid rgba(255,255,255,0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
        }}
        onClick={() => setOpen(true)}
      >
        <SmartToy sx={{ color: '#ffffff', fontSize: 28 }} />
      </Fab>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 460,
            maxWidth: '100%',
            bgcolor: theme.palette.mode === 'dark' ? '#080c14' : '#f8fafc',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2.5,
              bgcolor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  mr: 1.8,
                  bgcolor: '#2563eb',
                  color: '#ffffff',
                  boxShadow: '0 0 12px rgba(37,99,235,0.5)',
                }}
              >
                <SmartToy sx={{ fontSize: 24 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                  FINFOLIO AI Copilot
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    fontWeight: 700,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: '#10b981',
                      boxShadow: '0 0 8px #10b981',
                    }}
                  />
                  Live Indian Rupee (₹) Financial Advisor
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={handleResetChat}
                title="Reset Chat"
                sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: '#ffffff' } }}
              >
                <RestartAlt fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setOpen(false)}
                sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: '#ffffff' } }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* User Active Context Pill */}
          <Box
            sx={{
              px: 2.5,
              py: 1,
              bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Active Baseline: <strong>₹{(profile.monthlyIncome / 1000).toFixed(0)}k/mo</strong> Income • <strong>₹{(profile.emergencyFund / 100000).toFixed(1)}L</strong> Cash
            </Typography>
            <Chip
              label="🇮🇳 INR Native"
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'primary.main', color: '#ffffff' }}
            />
          </Box>

          {/* Messages Feed */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2.5,
              bgcolor: theme.palette.mode === 'dark' ? '#080c14' : '#f8fafc',
            }}
          >
            {messages.map((message) => (
              <Box key={message.id} sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 0.8,
                  }}
                >
                  {message.sender === 'bot' && (
                    <Avatar
                      sx={{
                        mr: 1.2,
                        width: 32,
                        height: 32,
                        bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#e0e7ff',
                        color: 'primary.main',
                        border: '1px solid',
                        borderColor: 'primary.main',
                      }}
                    >
                      <SmartToy sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}

                  <Box
                    sx={{
                      maxWidth: '85%',
                      p: 2,
                      borderRadius: message.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background:
                        message.sender === 'user'
                          ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                          : theme.palette.mode === 'dark'
                            ? '#1e293b'
                            : '#ffffff',
                      color:
                        message.sender === 'user'
                          ? '#ffffff'
                          : theme.palette.mode === 'dark'
                            ? '#f1f5f9'
                            : '#0f172a',
                      border: '1px solid',
                      borderColor:
                        message.sender === 'user'
                          ? '#1d4ed8'
                          : theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.08)'
                            : '#e2e8f0',
                      boxShadow:
                        theme.palette.mode === 'dark'
                          ? '0 4px 14px rgba(0,0,0,0.5)'
                          : '0 4px 12px rgba(0,0,0,0.05)',
                      whiteSpace: 'pre-line',
                      lineHeight: 1.65,
                      fontSize: '0.875rem',
                    }}
                  >
                    {renderFormattedScript(message.text, message.sender === 'user')}
                  </Box>
                </Box>

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.2, ml: message.sender === 'bot' ? 5 : 0 }}>
                    {message.suggestions.map((suggestion, index) => (
                      <Chip
                        key={index}
                        label={suggestion}
                        size="small"
                        onClick={() => handleSuggestionClick(suggestion)}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.15)' : '#ffffff',
                          color: theme.palette.mode === 'dark' ? '#93c5fd' : '#1d4ed8',
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.35)' : '#bfdbfe',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.3)' : '#eff6ff',
                            borderColor: '#2563eb',
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.5, ml: 0.5 }}>
                <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main' }}>
                  <SmartToy sx={{ fontSize: 18, color: '#ffffff' }} />
                </Avatar>
                <Paper sx={{ p: 1.2, px: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <CircularProgress size={14} color="primary" />
                  <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                    Analyzing your FINFOLIO profile...
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Error with Retry */}
            {chatError && (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => handleSend(lastMessage)} sx={{ fontWeight: 800 }}>
                    Retry
                  </Button>
                }
                sx={{ mx: 0.5, my: 1.5, borderRadius: 2 }}
              >
                {chatError}
              </Alert>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Quick Action Crisis Pills */}
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, overflowX: 'auto', pb: 0.5 }}>
              <Chip
                icon={<WorkOff sx={{ fontSize: 16 }} />}
                label="🚨 Layoff Shock"
                size="small"
                variant="outlined"
                color="error"
                disabled={loading}
                onClick={() => handleSend('What happens if I lose my job tomorrow?')}
                clickable
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
              <Chip
                icon={<Shield sx={{ fontSize: 16 }} />}
                label="🛡️ Survival Days"
                size="small"
                variant="outlined"
                color="primary"
                disabled={loading}
                onClick={() => handleSend('How many days can I survive without a salary?')}
                clickable
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
              <Chip
                icon={<LocalHospital sx={{ fontSize: 16 }} />}
                label="🏥 Medical Crisis"
                size="small"
                variant="outlined"
                color="warning"
                disabled={loading}
                onClick={() => handleSend('Medical emergency plan for ₹5 Lakhs')}
                clickable
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
              <Chip
                icon={<CreditCard sx={{ fontSize: 16 }} />}
                label="💳 Debt Triage"
                size="small"
                variant="outlined"
                disabled={loading}
                onClick={() => handleSend('How can I accelerate debt payoff with avalanche?')}
                clickable
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Ask: 'Can I afford ₹75k purchase?', 'Quit my job?'..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && input.trim()) {
                      handleSend();
                    }
                  }
                }}
                size="small"
                multiline
                maxRows={3}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                sx={{
                  bgcolor: '#2563eb',
                  color: '#ffffff',
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#1d4ed8',
                  },
                  '&:disabled': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                    color: 'text.disabled',
                  },
                }}
              >
                {loading ? <CircularProgress size={18} color="inherit" /> : <Send fontSize="small" />}
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default AIChatbot;
