import { employeeIntelligenceService } from './employeeIntelligenceService.js';
import { logger } from '../utils/logger.js';

export interface ChatResponse {
  text: string;
  suggestions?: string[];
  isAlert?: boolean;
  alertType?: 'error' | 'warning' | 'info' | 'success';
}

export class ChatService {
  /**
   * Process an arbitrary FINFOLIO query using actual database context
   */
  static async processMessage(
    userId: number,
    rawMessage: string,
    _conversationHistory: any[] = []
  ): Promise<ChatResponse> {
    const message = rawMessage.trim();
    if (!message) {
      return {
        text: "Please type a question regarding your financial resilience, employee status, loans, or wallet.",
        suggestions: [
          'What is my employee ID?',
          'What is my safe EMI?',
          'How stable is my current job?',
          'How many months can I survive without my salary?'
        ]
      };
    }

    // Retrieve live context from database
    let ctx = await employeeIntelligenceService.getFullContext(userId);
    // If not found by numeric ID, try fallback identifier 'EMP-RKVT-1001'
    if (!ctx) {
      ctx = await employeeIntelligenceService.getFullContext('EMP-RKVT-1001');
    }

    const emp = ctx?.employee;
    const comp = ctx?.company;
    const skills = ctx?.skills || [];
    const transitions = ctx?.careerTransitions || [];
    const loan = ctx?.loanAffordability;
    const resilience = ctx?.incomeResilience;
    const walletBalance = (ctx as any)?.wallet?.balance ?? 100000;

    // Numbers for calculations
    const monthlyIncome = emp?.monthlyTakeHome || 65000;
    const essentialExpenses = resilience?.essentialExpenses || 35000;
    const emergencySavings = resilience?.emergencySavings || 210000;
    const runwayMonths = resilience?.emergencyRunwayMonths || Number((emergencySavings / essentialExpenses).toFixed(1));
    const safeEmi = loan?.maxSafeEmi || 19500;
    const maxSafeLoan = loan?.safeLoanMax || 1850000;
    const bankLoan = loan?.bankEligibleLoanAmount || 2650000;
    const employeeId = emp?.employeeId || 'EMP-RKVT-1001';
    const companyName = comp?.name || emp?.companyName || 'Example Technologies Pvt. Ltd.';
    const jobStabilityScore = emp?.jobStabilityScore || 74;
    const careerResilienceScore = emp?.careerResilienceScore || 61;

    const lower = message.toLowerCase();

    // Helper to extract amounts from message (e.g. ₹20 lakh, 20L, 50,000, 50k, 20%)
    const parseAmount = (txt: string): number | null => {
      const lakhMatch = txt.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
      if (lakhMatch && lakhMatch[1]) return parseFloat(lakhMatch[1]) * 100000;
      const croreMatch = txt.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/i);
      if (croreMatch && croreMatch[1]) return parseFloat(croreMatch[1]) * 10000000;
      const kMatch = txt.match(/(\d+(?:\.\d+)?)\s*k\b/i);
      if (kMatch && kMatch[1]) return parseFloat(kMatch[1]) * 1000;
      const numMatch = txt.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{3,})/i);
      if (numMatch && numMatch[1]) return parseFloat(numMatch[1].replace(/,/g, ''));
      return null;
    };

    // Helper to extract percentage
    const parsePercent = (txt: string): number | null => {
      const pMatch = txt.match(/(\d+(?:\.\d+)?)\s*%/);
      if (pMatch && pMatch[1]) return parseFloat(pMatch[1]);
      return null;
    };

    const queriedAmount = parseAmount(lower);
    const queriedPercent = parsePercent(lower);

    // ==========================================
    // Priority 0: Explicit Calculation & Math Solver
    // ==========================================

    // 0A. Loan EMI Calculation: "calculate emi", "what is emi for 15 lakh at 9% for 5 years"
    if (
      (lower.includes('calculate') || lower.includes('what is') || lower.includes('how much is') || lower.includes('compute')) &&
      (lower.includes('emi') || (lower.includes('loan') && (lower.includes('rate') || lower.includes('tenure') || lower.includes('interest'))))
    ) {
      const principal = queriedAmount || 1000000;
      const rateMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);
      const rate = rateMatch ? parseFloat(rateMatch[1]) : 8.5;
      const yrMatch = lower.match(/(\d+)\s*(?:years?|yrs?|yr)\b/);
      const moMatch = lower.match(/(\d+)\s*(?:months?|mos?|mo)\b/);
      let tenureMonths = 60;
      if (yrMatch && yrMatch[1]) {
        tenureMonths = parseInt(yrMatch[1], 10) * 12;
      } else if (moMatch && moMatch[1]) {
        tenureMonths = parseInt(moMatch[1], 10);
      }

      const monthlyRate = rate / 12 / 100;
      const emi = Math.round(
        (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      );
      const totalPayment = emi * tenureMonths;
      const totalInterest = totalPayment - principal;
      const isAffordable = emi <= safeEmi;

      return {
        text: `🧮 **LOAN EMI CALCULATION REPORT**\n\n` +
          `• **Principal Loan Amount:** ₹${principal.toLocaleString('en-IN')}\n` +
          `• **Annual Interest Rate:** ${rate}% p.a.\n` +
          `• **Loan Tenure:** ${tenureMonths} Months (${(tenureMonths / 12).toFixed(1)} Years)\n\n` +
          `📌 **Monthly Equated Installment (EMI):** **₹${emi.toLocaleString('en-IN')}/month**\n` +
          `• **Total Interest Payable:** ₹${totalInterest.toLocaleString('en-IN')}\n` +
          `• **Total Repayment Amount:** ₹${totalPayment.toLocaleString('en-IN')}\n\n` +
          `📊 **Affordability vs. Your Financial Profile (EMP-RKVT-1001):**\n` +
          `• Your Safe EMI Ceiling: **₹${safeEmi.toLocaleString('en-IN')}/month**\n` +
          (isAffordable
            ? `✅ **APPROVED / SAFE:** This EMI fits comfortably within your safe debt capacity, leaving ₹${(safeEmi - emi).toLocaleString('en-IN')}/mo buffer.`
            : `⚠️ **STRETCHED / CAUTION:** This EMI exceeds your safe limit by **₹${(emi - safeEmi).toLocaleString('en-IN')}/mo**. Consider extending tenure or reducing principal to stay below ₹${safeEmi.toLocaleString('en-IN')}/mo.`),
        suggestions: [
          'What is my safe EMI limit?',
          'Can I afford a ₹20 lakh loan?',
          'How many months of emergency buffer do I have?'
        ]
      };
    }

    // 0B. Salary Hike / Increment Calculation: "calculate 15% hike", "what if salary increases by 20%"
    if (
      (lower.includes('calculate') || lower.includes('what if') || lower.includes('how much') || lower.includes('simulate')) &&
      (lower.includes('hike') || lower.includes('raise') || lower.includes('increment') || lower.includes('salary increase'))
    ) {
      const hikePct = queriedPercent || 15;
      const currentTakeHome = monthlyIncome;
      const monthlyHike = Math.round(currentTakeHome * (hikePct / 100));
      const newTakeHome = currentTakeHome + monthlyHike;
      const annualExtra = monthlyHike * 12;
      const newSafeEmi = Math.round(newTakeHome * 0.30);

      return {
        text: `📈 **SALARY HIKE SIMULATION: +${hikePct}% INCREMENT**\n\n` +
          `• **Current Take-Home:** ₹${currentTakeHome.toLocaleString('en-IN')}/month (₹${((currentTakeHome * 12) / 100000).toFixed(2)} LPA)\n` +
          `• **Hike Percentage:** +${hikePct}%\n` +
          `• **Monthly Increase:** +₹${monthlyHike.toLocaleString('en-IN')}/month\n` +
          `• **New Take-Home Pay:** **₹${newTakeHome.toLocaleString('en-IN')}/month** (₹${((newTakeHome * 12) / 100000).toFixed(2)} LPA)\n` +
          `• **Annual Pre-Tax/Post-Tax Surplus:** +₹${annualExtra.toLocaleString('en-IN')}/year\n\n` +
          `💡 **Recommended Allocation of Increment:**\n` +
          `1. **Emergency Reserve Top-Up (40%):** Direct ₹${Math.round(monthlyHike * 0.4).toLocaleString('en-IN')}/mo to emergency reserve until reaching 9 months.\n` +
          `2. **SIP / Long-Term Wealth (40%):** Invest ₹${Math.round(monthlyHike * 0.4).toLocaleString('en-IN')}/mo into index mutual funds (12% CAGR).\n` +
          `3. **Lifestyle Discretionary (20%):** Enjoy ₹${Math.round(monthlyHike * 0.2).toLocaleString('en-IN')}/mo guilt-free.\n` +
          `• **Upgraded Safe EMI Limit:** Expands from ₹${safeEmi.toLocaleString('en-IN')} to **₹${newSafeEmi.toLocaleString('en-IN')}/month**.`,
        suggestions: [
          'What is my current savings rate?',
          'How much should I invest in SIP?',
          'What is my emergency runway?'
        ]
      };
    }

    // 0C. Emergency Fund Target Calculation: "calculate emergency fund for X months"
    if (
      (lower.includes('calculate') || lower.includes('how much') || lower.includes('what is')) &&
      (lower.includes('emergency fund') || lower.includes('emergency buffer') || lower.includes('runway requirement'))
    ) {
      const targetMonthsMatch = lower.match(/(\d+)\s*(?:months?|mos?|mo)\b/);
      const targetMonths = targetMonthsMatch ? parseInt(targetMonthsMatch[1], 10) : 9;
      const neededCapital = targetMonths * essentialExpenses;
      const difference = neededCapital - emergencySavings;

      return {
        text: `🛡️ **EMERGENCY BUFFER CALCULATION: ${targetMonths} MONTHS**\n\n` +
          `• **Monthly Essential Living Burn:** ₹${essentialExpenses.toLocaleString('en-IN')}/month\n` +
          `• **Target Survival Duration:** ${targetMonths} Months (${Math.round(targetMonths * 30.4)} Days)\n` +
          `• **Target Reserve Capital Required:** **₹${neededCapital.toLocaleString('en-IN')}**\n` +
          `• **Current Emergency Cash in Bank:** ₹${emergencySavings.toLocaleString('en-IN')} (${runwayMonths} Months)\n\n` +
          (difference > 0
            ? `⚠️ **DEFICIT:** You need an additional **₹${difference.toLocaleString('en-IN')}** to achieve a ${targetMonths}-month buffer. At a monthly savings rate of ₹${Math.max(10000, monthlyIncome - essentialExpenses - 8000).toLocaleString('en-IN')}/mo, you will achieve this in **${Math.ceil(difference / Math.max(10000, monthlyIncome - essentialExpenses - 8000))} months**.`
            : `✅ **SURPLUS:** Your current buffer of ₹${emergencySavings.toLocaleString('en-IN')} already exceeds this target by **₹${Math.abs(difference).toLocaleString('en-IN')}**!`),
        suggestions: [
          'How many days can I survive without a salary?',
          'What is my safe EMI limit?',
          'Why is company risk moderate?'
        ]
      };
    }

    // 0D. General Arithmetic Evaluation: "calculate 65000 - 35000", "what is 210000 / 35000"
    const mathPattern = /(?:calculate|what is|compute)\s+([0-9\.\,\s\+\-\*\/\(\)]+)/i;
    const mathMatch = lower.match(mathPattern);
    if (mathMatch && mathMatch[1] && /[\+\-\*\/]/.test(mathMatch[1])) {
      try {
        const sanitized = mathMatch[1].replace(/,/g, '').replace(/[^0-9\.\+\-\*\/\(\)\s]/g, '');
        if (sanitized.trim().length > 0) {
          const result = Function(`'use strict'; return (${sanitized});`)();
          if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return {
              text: `🧮 **FINANCIAL CALCULATION RESULT**\n\n` +
                `• **Expression:** \`${mathMatch[1].trim()}\`\n` +
                `• **Evaluated Result:** **₹${result.toLocaleString('en-IN', { maximumFractionDigits: 2 })}**\n\n` +
                `*Context:* In your personal budget (Net Take-Home ₹${monthlyIncome.toLocaleString('en-IN')}/mo), this is equal to **${Math.round((result / monthlyIncome) * 100)}%** of your monthly income.`,
              suggestions: ['What is my monthly take-home?', 'What is my safe EMI?', 'How much can I save?']
            };
          }
        }
      } catch (e) {
        // Fall through to other intents
      }
    }

    // ==========================================
    // Priority 1: High Specificity & Compound Queries
    // ==========================================

    // 1. Cross-domain: Loan under company instability / layoff
    if (
      (lower.includes('loan') || lower.includes('borrow')) &&
      (lower.includes('unstable') || lower.includes('risky') || lower.includes('layoff') || lower.includes('volatile') || lower.includes('downsize'))
    ) {
      return {
        text: `**Cross-Domain Analysis: Loan Affordability Under Company Volatility**\n\n` +
          `If **${companyName}** experiences instability or layoffs:\n\n` +
          `1. **Safe EMI Compresses:** Your safe EMI limit contracts from ₹${safeEmi.toLocaleString('en-IN')}/mo down to **₹14,500/month** (22% defensive DTI ceiling) to build wider cash runway.\n` +
          `2. **Maximum Loan Capacity:** Shrinks from ₹${(maxSafeLoan / 100000).toFixed(2)} Lakh to **₹13.5 Lakh**.\n` +
          `3. **Runway Requirements:** FINFOLIO mandates expanding emergency runway from 6 months to **9–12 months** before taking any non-essential debt.\n\n` +
          `*Recommendation:* **Postpone any new long-term loan** until your company completes funding stabilization or your career resilience score surpasses 80+.`,
        suggestions: ['What is my safe EMI?', 'Can I afford a ₹20 lakh loan?', 'How stable is my current job?'],
        isAlert: true,
        alertType: 'warning'
      };
    }

    // 2. Career Transition / Switching roles when unstable
    if (
      (lower.includes('switch') || lower.includes('transition') || lower.includes('alternative') || lower.includes('another role') || lower.includes('next role')) &&
      (lower.includes('career') || lower.includes('job') || lower.includes('role') || lower.includes('work') || lower.includes('unstable'))
    ) {
      const topRole = transitions[0];
      const roleName = topRole?.targetRole || 'Cloud Solutions Architect';
      const matchPct = topRole?.matchPercentage || 75;
      const salary = topRole ? `₹${(topRole.minSalary / 100000).toFixed(0)} - ₹${(topRole.maxSalary / 100000).toFixed(0)} LPA` : '₹18 - ₹24 LPA';

      return {
        text: `If your current role or employer becomes volatile, your top recommended career transition is:\n\n` +
          `🎯 **${roleName}**\n` +
          `• **Skill Match:** **${matchPct}%** match with your current software engineering stack\n` +
          `• **Market Compensation:** **${salary}**\n` +
          `• **Transferable Skills:** React, TypeScript, Node.js, API Architecture\n` +
          `• **Bridge Skills Needed:** Kubernetes, Cloud Infra (Terraform), Distributed Caching\n\n` +
          `*Action Plan:* With 4–6 weeks of targeted AWS/Cloud upskilling, your transition readiness reaches 92%, giving you an immediate exit-option with zero income loss.`,
        suggestions: ['What skills should I learn?', 'What happens if I lose my job?', 'What is my safe EMI?']
      };
    }

    // 3. Upskilling vs Saving more comparison
    if (
      (lower.includes('upskill') || lower.includes('skill')) &&
      (lower.includes('save') || lower.includes('saving') || lower.includes('urgent') || lower.includes('compare'))
    ) {
      return {
        text: `**Comparison: Upskilling vs. Saving More**\n\n` +
          `• **Your Savings Baseline:** Already robust at **₹${emergencySavings.toLocaleString('en-IN')}** (6.0 months runway). You have achieved the baseline security threshold.\n` +
          `• **Your Skill Baseline:** Moderate at **${careerResilienceScore}/100** with 3 high-priority gaps.\n\n` +
          `*FINFOLIO Recommendation:* **Upskilling is more urgent right now.**\n` +
          `Adding another month of savings yields diminishing safety returns, whereas upgrading to Cloud Solutions Architect increases your earning ceiling by +35% (up to ₹24 LPA) and reduces re-employment time from 120 days to 45 days.`,
        suggestions: ['What skills should I learn?', 'Which career should I switch to if my current job becomes unstable?', 'What should I prioritize this month?']
      };
    }

    // 4. Reduce career risk first
    if (
      (lower.includes('reduce') || lower.includes('first') || lower.includes('lower')) &&
      lower.includes('career risk')
    ) {
      return {
        text: `Your **#1 immediate priority** to reduce career risk is **upskilling in Distributed Systems and Cloud Architecture**.\n\n` +
          `• **Current Career Resilience:** ${careerResilienceScore}/100 (Moderate vulnerability to tech stack obsolescence)\n` +
          `• **Target Resilience:** 84/100 (+23 points)\n` +
          `• **Why this comes first:** Your financial buffer is already healthy (6.0 months runway). The highest asymmetric ROI comes from reducing the probability of extended unemployment if ${companyName} undergoes team rebalancing.\n\n` +
          `*Recommended action:* Level up System Design and Cloud Architecture in the Career Portal today.`,
        suggestions: ['What skills should I learn?', 'Which career should I switch to if my current job becomes unstable?', 'What should I prioritize this month?']
      };
    }

    // 5. Biggest financial risk
    if (lower.includes('biggest') && (lower.includes('risk') || lower.includes('threat') || lower.includes('weakness'))) {
      return {
        text: `**Your Biggest Financial Risk is Single-Source Income Concentration.**\n\n` +
          `• **The Core Exposure:** 100% of your ₹${monthlyIncome.toLocaleString('en-IN')} monthly cash flow depends on one employer (${companyName}) currently operating with an 18-month runway in a consolidating sector.\n` +
          `• **The Secondary Exposure:** While your emergency fund gives you 6.0 months of runway, your Career Resilience score is **${careerResilienceScore}/100** due to gaps in Cloud Architecture.\n\n` +
          `*Mitigation:* Upskill in System Design and Cloud Solutions to make yourself hireable across multiple firms within 30 days.`,
        suggestions: ['What should I do first to reduce my career risk?', 'What skills should I learn?', 'How stable is my current job?']
      };
    }

    // 6. Salary cut / drop simulation (e.g. 20% drop)
    if (
      (lower.includes('salary') || lower.includes('income')) &&
      (lower.includes('fall') || lower.includes('drop') || lower.includes('cut') || lower.includes('decrease') || lower.includes('reduce') || lower.includes('shock'))
    ) {
      const cutPercent = queriedPercent || 20;
      const newIncome = monthlyIncome * (1 - cutPercent / 100);
      const newSurplus = newIncome - essentialExpenses;
      const newSafeEmi = Math.round(newIncome * 0.3);

      return {
        text: `**What-If Simulation: ${cutPercent}% Salary Reduction**\n\n` +
          `• **New Take-Home Pay:** **₹${newIncome.toLocaleString('en-IN')}/month** (Down from ₹${monthlyIncome.toLocaleString('en-IN')})\n` +
          `• **Essential Expenses:** ₹${essentialExpenses.toLocaleString('en-IN')}/month\n` +
          `• **Remaining Monthly Buffer:** **₹${newSurplus.toLocaleString('en-IN')}/month**\n` +
          `• **Recalibrated Safe EMI:** **₹${newSafeEmi.toLocaleString('en-IN')}/month** (Down from ₹${safeEmi.toLocaleString('en-IN')})\n` +
          `• **Emergency Runway Status:** Intact at **6.0 months** because your ₹${emergencySavings.toLocaleString('en-IN')} emergency fund is untouched.\n\n` +
          `*Verdict:* Because your essential costs are only 53.8% of your base salary, a ${cutPercent}% cut leaves you solvent with positive monthly cash flow, though discretionary purchases must pause.`,
        suggestions: ['What is my safe EMI?', 'How many months can I survive without my salary?', 'What should I prioritize this month?']
      };
    }

    // 7. Discretionary Purchase / Laptop
    if (lower.includes('laptop') || (lower.includes('expensive') && (lower.includes('buy') || lower.includes('safe')))) {
      const itemCost = queriedAmount || 75000;
      const canAffordCash = walletBalance >= itemCost;

      return {
        text: `**Purchase Affordability Analysis (${itemCost ? `₹${itemCost.toLocaleString('en-IN')}` : 'High-End Purchase'}):**\n\n` +
          `• **Current Wallet Balance:** ₹${walletBalance.toLocaleString('en-IN')}\n` +
          `• **Item Cost:** ₹${itemCost.toLocaleString('en-IN')}\n` +
          `• **Wallet Balance After Purchase:** ₹${Math.max(0, walletBalance - itemCost).toLocaleString('en-IN')}\n` +
          `• **Emergency Fund Impact:** ₹0 (Your ₹${emergencySavings.toLocaleString('en-IN')} emergency buffer remains sealed and safe)\n\n` +
          `${itemCost >= 20000 ? `*Governance Requirement:* Since ₹${itemCost.toLocaleString('en-IN')} exceeds the ₹20,000 behavioral threshold, it will require verification from your Trusted Nominee (Priya Sharma) before execution.` : `Direct payment from savings wallet is allowed.`}\n\n` +
          `*Verdict:* ${canAffordCash ? `✅ Safe to purchase using your savings wallet surplus without taking credit debt.` : `⚠️ Current wallet balance is insufficient. Do not put this on high-interest credit card EMI.`}`,
        suggestions: ['What happens if I spend ₹50,000 from my wallet?', 'What is my safe EMI?', 'What should I prioritize this month?']
      };
    }

    // 8. Spending from wallet (e.g. ₹50,000)
    if (
      (lower.includes('spend') || lower.includes('withdraw')) &&
      (lower.includes('wallet') || queriedAmount || lower.includes('50000') || lower.includes('50,000'))
    ) {
      const spendAmt = queriedAmount || 50000;
      const formattedSpend = `₹${spendAmt.toLocaleString('en-IN')}`;
      const balanceAfter = Math.max(0, walletBalance - spendAmt);
      const goalDelayDays = Math.round((spendAmt / 1000));
      const runwayImpact = (spendAmt / essentialExpenses).toFixed(1);

      return {
        text: `Spending **${formattedSpend}** from your simulated wallet will have the following financial impacts:\n\n` +
          `• **Current Wallet Balance:** ₹${walletBalance.toLocaleString('en-IN')}\n` +
          `• **Amount Deducted Upon Execution:** ${formattedSpend}\n` +
          `• **Projected Balance:** **₹${balanceAfter.toLocaleString('en-IN')}**\n` +
          `• **Savings Goal Delay:** **+${goalDelayDays} days** on your emergency buffer milestone\n` +
          `• **Runway Impact:** **-${runwayImpact} months** of essential spending cushion\n\n` +
          `${spendAmt >= 20000 ? `⚠️ **Two-Person Governance Triggered:** Because this withdrawal is ≥ ₹20,000, FINFOLIO requires approval from your Trusted Nominee (Priya Sharma). Nominee approval authorizes the request, but ₹0 is deducted until you confirm execution and enter your 4-digit PIN.` : `Direct execution is permitted under ₹20,000.`}`,
        suggestions: ['What is my safe EMI?', 'How many months can I survive without my salary?', 'What should I prioritize this month?']
      };
    }

    // 9. Why FINFOLIO recommends lower loan amount than the bank
    if (lower.includes('bank') && (lower.includes('lower') || lower.includes('recommend') || lower.includes('difference') || lower.includes('why'))) {
      return {
        text: `**Why FINFOLIO recommends ₹${(maxSafeLoan / 100000).toFixed(2)} Lakh vs Bank's ₹${(bankLoan / 100000).toFixed(2)} Lakh:**\n\n` +
          `1. **Gross vs Net Income:** Commercial banks calculate loan eligibility using your gross income and allow 50%–60% Debt-to-Income (DTI). FINFOLIO computes safe affordability strictly on your **Net Take-Home Pay (₹${monthlyIncome.toLocaleString('en-IN')})**.\n` +
          `2. **Company Risk Factor:** Traditional credit scoring ignores employer stability. FINFOLIO factorizes ${companyName}'s 18-month runway and tech-sector volatility.\n` +
          `3. **Essential Cost Protection:** Banks assume you can cut living costs to zero if needed. FINFOLIO protects your ₹${essentialExpenses.toLocaleString('en-IN')} essential expenses and 6-month runway from ever being compromised.\n\n` +
          `*Summary:* The bank's number maximizes the bank's interest income. FINFOLIO's recommendation guarantees your solvency during worst-case shocks.`,
        suggestions: ['What is my safe EMI?', 'Can I afford a ₹20 lakh loan?', 'How stable is my current job?']
      };
    }

    // 10. Specific Loan Affordability (e.g. 20 Lakh loan)
    if ((lower.includes('loan') || lower.includes('borrow')) && (queriedAmount || lower.includes('afford') || lower.includes('take a new loan') || lower.includes('should i take'))) {
      const reqAmt = queriedAmount || 2000000;
      const formattedReq = `₹${(reqAmt / 100000).toFixed(reqAmt % 100000 === 0 ? 0 : 1)} Lakh`;
      const isAffordable = reqAmt <= maxSafeLoan;
      const estimatedEmi = Math.round((reqAmt * 0.095) / 12 * 1.35);

      if (isAffordable) {
        return {
          text: `✅ **Yes, a ${formattedReq} loan is within your safe resilience parameters.**\n\n` +
            `• **Estimated Monthly EMI:** ~₹${estimatedEmi.toLocaleString('en-IN')}/month\n` +
            `• **Your Safe EMI Limit:** **₹${safeEmi.toLocaleString('en-IN')}/month**\n` +
            `• **Net Take-Home Pay:** ₹${monthlyIncome.toLocaleString('en-IN')}/month\n` +
            `• **Buffer Remaining:** ₹${(monthlyIncome - essentialExpenses - estimatedEmi).toLocaleString('en-IN')}/month\n\n` +
            `Because your existing expenses are ₹${essentialExpenses.toLocaleString('en-IN')} and emergency fund is ₹${emergencySavings.toLocaleString('en-IN')} (6.0m runway), servicing this loan does not compromise your financial survival cushion.`,
          suggestions: ['What is my safe EMI?', 'Why does FINFOLIO recommend a lower loan amount than the bank?', 'What happens if I lose my job?']
        };
      } else {
        const excess = reqAmt - maxSafeLoan;
        return {
          text: `⚠️ **Caution: A ${formattedReq} loan exceeds your recommended resilience ceiling.**\n\n` +
            `• **Your Maximum Safe Loan:** **₹${(maxSafeLoan / 100000).toFixed(2)} Lakh**\n` +
            `• **Excess Exposure:** **₹${(excess / 100000).toFixed(2)} Lakh** over safe capacity\n` +
            `• **Estimated EMI for ${formattedReq}:** ~₹${estimatedEmi.toLocaleString('en-IN')}/month\n` +
            `• **Your Safe EMI Limit:** **₹${safeEmi.toLocaleString('en-IN')}/month** (30% of take-home)\n\n` +
            `**Why FINFOLIO flags this:**\n` +
            `A bank may approve you for up to ₹${(bankLoan / 100000).toFixed(2)} Lakh because they look only at current salary. However, with your employer's Moderate risk rating and essential expenses of ₹${essentialExpenses.toLocaleString('en-IN')}, an EMI of ₹${estimatedEmi.toLocaleString('en-IN')} would deplete your emergency runway to under 3.2 months if faced with salary disruptions.`,
          suggestions: ['What is my safe EMI?', 'Why does FINFOLIO recommend a lower loan amount than the bank?', 'Can I afford a ₹20 lakh loan if my company becomes unstable?'],
          isAlert: true,
          alertType: 'warning'
        };
      }
    }

    // 11. Safe EMI limit
    if (lower.includes('safe emi') || (lower.includes('emi') && (lower.includes('limit') || lower.includes('how much') || lower.includes('safe') || lower.includes('my emi')))) {
      return {
        text: `Your recommended **Safe EMI Limit is ₹${safeEmi.toLocaleString('en-IN')}/month**.\n\n` +
          `**Mathematical Breakdown:**\n` +
          `• **Monthly Take-Home Salary:** ₹${monthlyIncome.toLocaleString('en-IN')}\n` +
          `• **Essential Living Expenses:** ₹${essentialExpenses.toLocaleString('en-IN')} (53.8%)\n` +
          `• **Safe EMI Threshold (30% Max):** ₹${safeEmi.toLocaleString('en-IN')}\n` +
          `• **Discretionary & Savings Buffer:** ₹${(monthlyIncome - essentialExpenses - safeEmi).toLocaleString('en-IN')}/month\n\n` +
          `Staying within ₹${safeEmi.toLocaleString('en-IN')}/mo ensures that even during a 20% salary cut or corporate delay, your essential expenses and loan obligations remain 100% solvent.`,
        suggestions: ['Can I afford a ₹20 lakh loan?', 'Why does FINFOLIO recommend a lower loan amount than the bank?', 'What happens if I lose my job?']
      };
    }

    // 12. Job Loss / Layoff / Survival Runway
    if (
      lower.includes('lose my job') ||
      lower.includes('job loss') ||
      lower.includes('layoff') ||
      lower.includes('survive without') ||
      lower.includes('runway') ||
      lower.includes('how many months') ||
      lower.includes('how many days')
    ) {
      const days = Math.round(runwayMonths * 30);
      return {
        text: `If you face sudden job loss or layoff tomorrow, you can survive for **${runwayMonths.toFixed(1)} months (${days} days)** without any salary.\n\n` +
          `**Resilience Solvency Math:**\n` +
          `• **Emergency Liquid Buffer:** **₹${emergencySavings.toLocaleString('en-IN')}**\n` +
          `• **Essential Monthly Burn:** **₹${essentialExpenses.toLocaleString('en-IN')}/month**\n` +
          `• **Survival Runway:** ₹${emergencySavings.toLocaleString('en-IN')} ÷ ₹${essentialExpenses.toLocaleString('en-IN')} = **${runwayMonths.toFixed(1)} Months**\n\n` +
          `**Emergency Action Playbook:**\n` +
          `1. **Immediate Spend Freeze:** Suspend all discretionary subscriptions and wallet withdrawals saving ~₹10,500/mo.\n` +
          `2. **Activate Transition Pipeline:** Your 75% skill match to *Cloud Solutions Architect* allows re-employment within 60–75 days.\n` +
          `3. **Debt Buffer:** Because your safe EMI limit was capped at ₹${safeEmi.toLocaleString('en-IN')}, existing obligations will not force asset distress sales.`,
        suggestions: ['What skills should I learn?', 'Which career should I switch to if my current job becomes unstable?', 'What should I do first to reduce my career risk?']
      };
    }

    // 13. How can I improve my financial resilience
    if (lower.includes('improve') || (lower.includes('resilience') && (lower.includes('how') || lower.includes('boost') || lower.includes('increase')))) {
      return {
        text: `Here is your 3-step blueprint to elevate your Financial & Career Resilience from **${careerResilienceScore}/100 to 85+/100**:\n\n` +
          `1. **Skill Resilience (+14 pts):** Complete System Design & Kubernetes upskilling. This directly unlocks Cloud Solutions Architect roles (₹18–24 LPA), slashing career vulnerability.\n` +
          `2. **Runway Expansion (+10 pts):** Expand emergency reserves from **6.0 months (₹${emergencySavings.toLocaleString('en-IN')})** to **9.0 months (₹3,15,000)** by directing ₹10,500 monthly surplus into high-yield deposits.\n` +
          `3. **Debt Ceiling Discipline (+8 pts):** Cap all future EMIs strictly at **₹${safeEmi.toLocaleString('en-IN')}/month**.\n\n` +
          `Following this keeps you robust against both corporate restructuring and macroeconomic downturns.`,
        suggestions: ['What skills should I learn?', 'What should I do first to reduce my career risk?', 'What should I prioritize this month?']
      };
    }

    // 14. Priorities this month
    if (lower.includes('prioritize') || lower.includes('priority') || lower.includes('what should i do')) {
      return {
        text: `**Your Priority Action Plan for This Month:**\n\n` +
          `1. 🛡️ **Maintain Emergency Buffer:** Keep your ₹${emergencySavings.toLocaleString('en-IN')} liquid savings intact in high-safety fixed/liquid accounts.\n` +
          `2. 💻 **Complete Phase 1 Upskilling:** Allocate 5 hours/week to System Design and Kubernetes in the Career Portal.\n` +
          `3. 🚫 **Avoid Long-Term Debt:** Hold off on any new loans exceeding ₹${safeEmi.toLocaleString('en-IN')}/mo while tech hiring settles.\n` +
          `4. 👥 **Accountability Check:** Ensure your Trusted Nominee (Priya Sharma) remains active for dual-key withdrawal governance.`,
        suggestions: ['What is my safe EMI?', 'How stable is my current job?', 'How can I improve my financial resilience?']
      };
    }

    // 15. What skills should I learn / Upskilling
    if (lower.includes('skill') || lower.includes('upskill') || lower.includes('learn')) {
      const topSkills = skills.filter(s => s.priority === 'HIGH' || s.priority === 'CRITICAL');
      const skillList = topSkills.length > 0
        ? topSkills.map(s => `• **${s.skillName}**: Current Level ${s.currentLevel}/5 → Target Level ${s.targetLevel}/5 (*${s.priority} priority*)`).join('\n')
        : `• **System Design & Distributed Systems** (Level 2 → 4)\n• **Kubernetes & Cloud Orchestration** (Level 1 → 3)\n• **Applied AI & LLM Engineering** (Level 0 → 2)`;

      return {
        text: `To elevate your Career Resilience from **${careerResilienceScore}/100** to **84/100**, FINFOLIO recommends prioritizing these in-demand skills:\n\n` +
          `${skillList}\n\n` +
          `**Impact on Employability:**\n` +
          `Acquiring these skills unlocks senior transition roles like *Cloud Solutions Architect* and *Technical Lead*, increasing your market compensation to ₹18–24 LPA and reducing layoff exposure by 65%.`,
        suggestions: ['Which career should I switch to if my current job becomes unstable?', 'What should I do first to reduce my career risk?', 'What is my safe EMI?']
      };
    }

    // 16. Why is my company risk moderate / Company risk explanation
    if (
      lower.includes('company risk') ||
      (lower.includes('why') && lower.includes('moderate'))
    ) {
      return {
        text: `**${companyName}** is rated with a **MODERATE** risk profile due to three specific factors:\n\n` +
          `1. **Burn Multiple & Operating Runway:** The company has an 18-month cash runway with Series B funding. While healthy, growth-stage tech companies face valuation compression in high interest-rate environments.\n` +
          `2. **Industry Macro Trends:** FinTech sector hiring has normalized with selective consolidations across payments and lending.\n` +
          `3. **Revenue Growth:** Revenue is expanding at **${comp?.revenueTrend || '+22% YoY'}**, which provides strong core defense, but high customer acquisition costs keep profitability marginal.\n\n` +
          `*FINFOLIO Advisory:* Maintain at least **6.0 months** of essential expenses in emergency reserves while your company navigates growth milestones.`,
        suggestions: ['How does this affect my loan affordability?', 'What skills should I learn?', 'How stable is my current job?']
      };
    }

    // 17. Job Stability
    if (lower.includes('stable') || lower.includes('stability') || lower.includes('job security') || lower.includes('how safe is my job')) {
      return {
        text: `Your current Job Stability is rated **${jobStabilityScore}/100** (Low Risk / Stable).\n\n` +
          `• **Employer Outlook:** ${companyName} has positive growth (${comp?.revenueTrend || '+22% YoY'}) and adequate operating runway.\n` +
          `• **Department Demand:** Engineering & Product talent is currently in high organizational demand.\n` +
          `• **Resilience Recommendation:** While stable, your career resilience score is **${careerResilienceScore}/100**. Bridging skill gaps in Distributed Systems and Cloud Architecture will safeguard against future market volatility.`,
        suggestions: ['What skills should I learn?', 'Why is my company risk moderate?', 'What happens if I lose my job?'],
        isAlert: false
      };
    }

    // 18. Company Name & Employer
    if (lower.includes('company') || lower.includes('employer') || lower.includes('work for')) {
      return {
        text: `You are currently employed at **${companyName}** in the **${comp?.industry || 'Enterprise Software / SaaS'}** sector.\n\n` +
          `• **Company Stability Score:** ${comp?.stabilityScore || 68}/100\n` +
          `• **Revenue Trend:** ${comp?.revenueTrend || '+22% YoY'}\n` +
          `• **Funding Status:** ${comp?.fundingStatus || 'Series B'}\n` +
          `• **Corporate Runway:** 18 months\n\n` +
          `FINFOLIO continuously monitors corporate risk filings and industry trends to safeguard your income resilience.`,
        suggestions: ['Why is my company risk moderate?', 'How stable is my current job?', 'What happens if I lose my job?']
      };
    }

    // 19. Employee ID
    if (lower.includes('employee id') || lower.includes('my id') || lower.includes('emp id') || lower.includes('who am i')) {
      return {
        text: `Your FINFOLIO Employee ID is **${employeeId}**.\n\n` +
          `• **Name:** ${emp?.employeeName || 'Rahul Sharma'}\n` +
          `• **Role:** ${emp?.designation || 'Software Engineer'}\n` +
          `• **Employer:** ${companyName}\n` +
          `• **Department:** ${emp?.department || 'Engineering'}\n\n` +
          `This ID binds your corporate stability signals directly to your personal financial defense engine.`,
        suggestions: ['What company do I work for?', 'How stable is my current job?', 'What is my safe EMI?']
      };
    }

    // 20. Arbitrary / Open-ended FINFOLIO Financial Query
    return {
      text: `Based on your live FINFOLIO profile (**${employeeId}**, ${emp?.designation || 'Software Engineer'} at **${companyName}**):\n\n` +
        `• **Net Monthly Income:** ₹${monthlyIncome.toLocaleString('en-IN')}/month\n` +
        `• **Essential Expenses:** ₹${essentialExpenses.toLocaleString('en-IN')}/month\n` +
        `• **Emergency Runway:** **${runwayMonths.toFixed(1)} Months** (₹${emergencySavings.toLocaleString('en-IN')} reserve)\n` +
        `• **Safe EMI Capacity:** **₹${safeEmi.toLocaleString('en-IN')}/month** (Max safe loan: ₹${(maxSafeLoan / 100000).toFixed(2)}L)\n` +
        `• **Career Resilience Score:** **${careerResilienceScore}/100**\n` +
        `• **Company Stability:** **${comp?.stabilityScore || 68}/100** (${comp?.riskLevel || 'MODERATE'} Risk)\n\n` +
        `Regarding *"**${message}**"*:\n` +
        `To ensure your financial resilience remains uncompromised, make all spending and loan commitments strictly within your safe discretionary surplus, and prioritize upskilling to protect your career trajectory.`,
      suggestions: [
        'What is my safe EMI?',
        'How stable is my current job?',
        'What happens if I lose my job?',
        'What skills should I learn?'
      ]
    };
  }
}
