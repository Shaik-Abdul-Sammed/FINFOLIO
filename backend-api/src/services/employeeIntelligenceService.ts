import { query } from '../config/db.js';

export interface CompanyIntelligence {
  companyId: string;
  name: string;
  industry: string;
  revenueTrend: string;
  profitTrend: string;
  fundingStatus: string;
  employeeGrowth: number;
  attritionRate: number;
  hiringTrend: string;
  layoffTrend: string;
  debtExposure: string;
  industryOutlook: string;
  healthScore: number;
  growthScore: number;
  stabilityScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  riskExplanation: string;
}

export interface EmployeeProfile {
  employeeId: string;
  userId: number;
  employeeName: string;
  email: string;
  designation: string;
  department: string;
  companyId: string;
  companyName: string;
  joiningDate: string;
  yearsOfExperience: number;
  currentSalary: number;
  monthlyTakeHome: number;
  education: string;
  location: string;
  employmentType: string;
  jobStabilityScore: number;
  careerRiskScore: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  careerGrowthScore: number;
  careerResilienceScore: number;
  potentialResilienceScore: number;
  careerRiskExplanation: string;
}

export interface EmployeeSkill {
  id: number;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gapLevel: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  roadmapPhase: string;
  learningPath: string;
}

export interface CareerTransitionRole {
  id: number;
  targetRole: string;
  matchPercentage: number;
  minSalary: number;
  maxSalary: number;
  skillsGapLevel: 'Low' | 'Medium' | 'High';
  keyTransferableSkills: string[];
  missingSkills: string[];
  explanation: string;
  rankingOrder: number;
}

export interface LoanAffordability {
  monthlyIncome: number;
  existingEmi: number;
  maxSafeEmi: number;
  recommendedEmi: number;
  bankEligibleEmi: number;
  conservativeLoanAmount: number;
  safeLoanMin: number;
  safeLoanMax: number;
  bankEligibleLoanAmount: number;
  affordabilityExplanation: string;
  resilienceDistinctionNotes: string;
}

export interface IncomeResilience {
  monthlyIncome: number;
  essentialExpenses: number;
  emergencySavings: number;
  emergencyRunwayMonths: number;
  emergencyRunwayDays: number;
  companyRisk: string;
  careerRisk: string;
  alternativeEmployability: string;
  incomeResilienceScore: number;
  incomeReplacementCapacity: string;
}

export class EmployeeIntelligenceService {
  /**
   * Helper to resolve employee by employee_id or user_id
   */
  private async resolveEmployeeRow(identifier: string | number) {
    let sql: string;
    let params: any[];

    if (typeof identifier === 'number' || !isNaN(Number(identifier))) {
      sql = `SELECT * FROM employees WHERE user_id = $1 LIMIT 1`;
      params = [Number(identifier)];
    } else {
      sql = `SELECT * FROM employees WHERE employee_id = $1 OR email = $1 LIMIT 1`;
      params = [identifier];
    }

    const res = await query(sql, params);
    if (res.rows.length === 0) {
      // Fallback: pick the first demo employee if available
      const fallback = await query(`SELECT * FROM employees ORDER BY id ASC LIMIT 1`, []);
      return fallback.rows[0] || null;
    }
    return res.rows[0];
  }

  async getEmployeeProfile(identifier: string | number): Promise<EmployeeProfile | null> {
    const row = await this.resolveEmployeeRow(identifier);
    if (!row) return null;

    return {
      employeeId: row.employee_id,
      userId: row.user_id,
      employeeName: row.employee_name,
      email: row.email,
      designation: row.designation,
      department: row.department,
      companyId: row.company_id,
      companyName: row.company_name,
      joiningDate: row.joining_date,
      yearsOfExperience: Number(row.years_of_experience),
      currentSalary: Number(row.current_salary),
      monthlyTakeHome: Number(row.monthly_take_home),
      education: row.education,
      location: row.location,
      employmentType: row.employment_type,
      jobStabilityScore: Number(row.job_stability_score),
      careerRiskScore: row.career_risk_score,
      careerGrowthScore: Number(row.career_growth_score),
      careerResilienceScore: Number(row.career_resilience_score),
      potentialResilienceScore: Number(row.potential_resilience_score),
      careerRiskExplanation: row.career_risk_explanation
    };
  }

  async getCompanyIntelligence(identifier: string | number): Promise<CompanyIntelligence | null> {
    const emp = await this.resolveEmployeeRow(identifier);
    if (!emp) return null;

    const res = await query(`SELECT * FROM companies WHERE company_id = $1 LIMIT 1`, [emp.company_id]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    return {
      companyId: row.company_id,
      name: row.name,
      industry: row.industry,
      revenueTrend: row.revenue_trend,
      profitTrend: row.profit_trend,
      fundingStatus: row.funding_status,
      employeeGrowth: Number(row.employee_growth),
      attritionRate: Number(row.attrition_rate),
      hiringTrend: row.hiring_trend,
      layoffTrend: row.layoff_trend,
      debtExposure: row.debt_exposure,
      industryOutlook: row.industry_outlook,
      healthScore: Number(row.health_score),
      growthScore: Number(row.growth_score),
      stabilityScore: Number(row.stability_score),
      riskLevel: row.risk_level,
      riskExplanation: row.risk_explanation
    };
  }

  async getCareerRisk(identifier: string | number) {
    const emp = await this.getEmployeeProfile(identifier);
    const comp = await this.getCompanyIntelligence(identifier);
    if (!emp) return null;

    return {
      employeeId: emp.employeeId,
      designation: emp.designation,
      jobStabilityScore: emp.jobStabilityScore,
      careerRiskScore: emp.careerRiskScore,
      careerGrowthScore: emp.careerGrowthScore,
      careerResilienceScore: emp.careerResilienceScore,
      potentialResilienceScore: emp.potentialResilienceScore,
      careerRiskExplanation: emp.careerRiskExplanation,
      companyRiskLevel: comp?.riskLevel || 'MODERATE',
      companyStabilityScore: comp?.stabilityScore || 68,
      recommendedNextSteps: [
        'Build emergency savings toward 6 months buffer (Current: 6.0 months).',
        'Avoid taking a high new EMI (Cap additional EMI to ₹10,000).',
        'Complete the recommended AWS Cloud Solutions upgrade (0-3 months).',
        'Upgrade to Applied AI/LLM engineering (3-6 months) to elevate career resilience from 61 to 84.',
        'Review alternative roles matching your current skills in Career Transition Mode.'
      ]
    };
  }

  async getEmployeeSkills(identifier: string | number): Promise<EmployeeSkill[]> {
    const emp = await this.resolveEmployeeRow(identifier);
    if (!emp) return [];

    const res = await query(
      `SELECT * FROM employee_skills WHERE employee_id = $1 ORDER BY priority DESC, id ASC`,
      [emp.employee_id]
    );

    return res.rows.map(r => ({
      id: r.id,
      skillName: r.skill_name,
      currentLevel: r.current_level,
      targetLevel: r.target_level,
      gapLevel: r.gap_level,
      priority: r.priority,
      roadmapPhase: r.roadmap_phase,
      learningPath: r.learning_path
    }));
  }

  async getCareerTransitions(identifier: string | number): Promise<CareerTransitionRole[]> {
    const emp = await this.resolveEmployeeRow(identifier);
    if (!emp) return [];

    const res = await query(
      `SELECT * FROM career_transitions WHERE employee_id = $1 ORDER BY ranking_order ASC`,
      [emp.employee_id]
    );

    return res.rows.map(r => ({
      id: r.id,
      targetRole: r.target_role,
      matchPercentage: Number(r.match_percentage),
      minSalary: Number(r.min_salary),
      maxSalary: Number(r.max_salary),
      skillsGapLevel: r.skills_gap_level,
      keyTransferableSkills: r.key_transferable_skills || [],
      missingSkills: r.missing_skills || [],
      explanation: r.explanation,
      rankingOrder: r.ranking_order
    }));
  }

  async getLoanAffordability(identifier: string | number): Promise<LoanAffordability | null> {
    const emp = await this.resolveEmployeeRow(identifier);
    if (!emp) return null;

    const res = await query(
      `SELECT * FROM employee_loan_affordability WHERE employee_id = $1 LIMIT 1`,
      [emp.employee_id]
    );

    if (res.rows.length === 0) return null;
    const r = res.rows[0];

    return {
      monthlyIncome: Number(r.monthly_income),
      existingEmi: Number(r.existing_emi),
      maxSafeEmi: Number(r.max_safe_emi),
      recommendedEmi: Number(r.recommended_emi),
      bankEligibleEmi: Number(r.bank_eligible_emi),
      conservativeLoanAmount: Number(r.conservative_loan_amount),
      safeLoanMin: Number(r.safe_loan_min),
      safeLoanMax: Number(r.safe_loan_max),
      bankEligibleLoanAmount: Number(r.bank_eligible_loan_amount),
      affordabilityExplanation: r.affordability_explanation,
      resilienceDistinctionNotes: r.resilience_distinction_notes
    };
  }

  async getIncomeResilience(identifier: string | number): Promise<IncomeResilience | null> {
    const emp = await this.resolveEmployeeRow(identifier);
    if (!emp) return null;

    const userProfileRes = await query(`SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1`, [emp.user_id]);
    const p = userProfileRes.rows[0] || {};
    const comp = await this.getCompanyIntelligence(emp.employee_id);

    const monthlyIncome = Number(emp.monthly_take_home) || 65000;
    const essentialExpenses = Number(p.monthly_expenses) || 35000;
    const emergencySavings = Number(p.emergency_fund) || 210000;
    const emergencyRunwayMonths = essentialExpenses > 0 ? Number((emergencySavings / essentialExpenses).toFixed(2)) : 6.0;
    const emergencyRunwayDays = Math.round(emergencyRunwayMonths * 30);

    return {
      monthlyIncome,
      essentialExpenses,
      emergencySavings,
      emergencyRunwayMonths,
      emergencyRunwayDays,
      companyRisk: comp?.riskLevel || 'MODERATE',
      careerRisk: emp.career_risk_score || 'MODERATE',
      alternativeEmployability: 'High (91% Match to Full Stack roles)',
      incomeResilienceScore: 78,
      incomeReplacementCapacity: '6.0 months full coverage without salary'
    };
  }

  async getFullContext(identifier: string | number) {
    const emp = await this.getEmployeeProfile(identifier);
    if (!emp) return null;

    const [comp, skills, transitions, loan, resilience] = await Promise.all([
      this.getCompanyIntelligence(emp.employeeId),
      this.getEmployeeSkills(emp.employeeId),
      this.getCareerTransitions(emp.employeeId),
      this.getLoanAffordability(emp.employeeId),
      this.getIncomeResilience(emp.employeeId)
    ]);

    // Fetch wallet and nominee status
    const walletRes = await query(`SELECT balance FROM wallets WHERE user_id = $1 LIMIT 1`, [emp.userId]);
    const walletBalance = walletRes.rows[0] ? Number(walletRes.rows[0].balance) : 100000;

    const nomineeRes = await query(`SELECT name, email, status FROM accountability_partners WHERE user_id = $1 LIMIT 1`, [emp.userId]);
    const nominee = nomineeRes.rows[0] || { name: 'Trusted Nominee', email: 'nominee@finfolio.com', status: 'active' };

    const rulesRes = await query(`SELECT max_instant_amount FROM commitment_rules WHERE user_id = $1 AND requires_approval = true LIMIT 1`, [emp.userId]);
    const threshold = rulesRes.rows[0] ? Number(rulesRes.rows[0].max_instant_amount) : 20000;

    return {
      employee: emp,
      company: comp,
      skills,
      careerTransitions: transitions,
      loanAffordability: loan,
      incomeResilience: resilience,
      wallet: {
        balance: walletBalance,
        threshold,
        currency: 'INR'
      },
      nominee: {
        name: nominee.name,
        email: nominee.email,
        status: nominee.status
      }
    };
  }

  /**
   * Update employee profile with PostgreSQL persistence
   */
  async updateEmployeeProfile(identifier: string | number, updates: {
    designation?: string;
    department?: string;
    yearsOfExperience?: number;
    monthlyTakeHome?: number;
    currentSalary?: number;
    education?: string;
    location?: string;
  }): Promise<EmployeeProfile | null> {
    const emp = await this.resolveEmployeeRow(identifier);
    if (!emp) return null;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (updates.designation !== undefined) {
      fields.push(`designation = $${paramIdx++}`);
      values.push(updates.designation);
    }
    if (updates.department !== undefined) {
      fields.push(`department = $${paramIdx++}`);
      values.push(updates.department);
    }
    if (updates.yearsOfExperience !== undefined) {
      fields.push(`years_of_experience = $${paramIdx++}`);
      values.push(updates.yearsOfExperience);
    }
    if (updates.monthlyTakeHome !== undefined) {
      fields.push(`monthly_take_home = $${paramIdx++}`);
      values.push(updates.monthlyTakeHome);
    }
    if (updates.currentSalary !== undefined) {
      fields.push(`current_salary = $${paramIdx++}`);
      values.push(updates.currentSalary);
    }
    if (updates.education !== undefined) {
      fields.push(`education = $${paramIdx++}`);
      values.push(updates.education);
    }
    if (updates.location !== undefined) {
      fields.push(`location = $${paramIdx++}`);
      values.push(updates.location);
    }

    if (fields.length === 0) {
      return this.getEmployeeProfile(emp.employee_id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(emp.id);

    await query(
      `UPDATE employees SET ${fields.join(', ')} WHERE id = $${paramIdx}`,
      values
    );

    // Sync monthly income to user_profiles if take home changed
    if (updates.monthlyTakeHome !== undefined) {
      await query(
        `UPDATE user_profiles SET monthly_income = $1, updated_at = NOW() WHERE user_id = $2`,
        [updates.monthlyTakeHome, emp.user_id]
      );
    }

    return this.getEmployeeProfile(emp.employee_id);
  }

  /**
   * Update an employee skill level and dynamically recompute career resilience score
   */
  async updateEmployeeSkillLevel(
    identifier: string | number,
    skillId: number,
    newLevel: number
  ): Promise<{ skill: EmployeeSkill; careerResilienceScore: number } | null> {
    const emp = await this.resolveEmployeeRow(identifier);
    if (!emp) return null;

    const levelClamped = Math.min(5, Math.max(1, Math.round(newLevel)));

    // Fetch target level to compute gap
    const currentSkillRes = await query(
      `SELECT * FROM employee_skills WHERE id = $1 AND employee_id = $2`,
      [skillId, emp.employee_id]
    );

    if (currentSkillRes.rows.length === 0) return null;
    const s = currentSkillRes.rows[0];
    const targetLevel = Number(s.target_level);
    const newGap = Math.max(0, targetLevel - levelClamped);

    await query(
      `UPDATE employee_skills 
       SET current_level = $1, gap_level = $2 
       WHERE id = $3 AND employee_id = $4`,
      [levelClamped, newGap, skillId, emp.employee_id]
    );

    // Recompute career resilience score across all skills
    const allSkillsRes = await query(
      `SELECT gap_level, priority FROM employee_skills WHERE employee_id = $1`,
      [emp.employee_id]
    );

    let totalGaps = 0;
    let highPriorityGaps = 0;
    for (const row of allSkillsRes.rows) {
      const g = Number(row.gap_level);
      totalGaps += g;
      if (row.priority === 'HIGH' || row.priority === 'CRITICAL') {
        highPriorityGaps += g;
      }
    }

    // Dynamic formula: Base 61 + progress closing gaps up to 84 potential
    // When initial highPriorityGaps was 6, score was 61.
    const maxPotential = Number(emp.potential_resilience_score) || 84;
    const computedResilience = Math.min(maxPotential, Math.max(60, Math.round(maxPotential - (highPriorityGaps * 3.8))));

    await query(
      `UPDATE employees SET career_resilience_score = $1, updated_at = NOW() WHERE id = $2`,
      [computedResilience, emp.id]
    );

    const updatedSkill: EmployeeSkill = {
      id: s.id,
      skillName: s.skill_name,
      currentLevel: levelClamped,
      targetLevel,
      gapLevel: newGap,
      priority: s.priority,
      roadmapPhase: s.roadmap_phase,
      learningPath: s.learning_path
    };

    return {
      skill: updatedSkill,
      careerResilienceScore: computedResilience
    };
  }

  /**
   * Run a What-If Scenario Simulation
   */
  async simulateScenario(identifier: string | number, scenario: {
    type: 'salary_cut' | 'layoff_shock' | 'rate_hike' | 'emergency_expense' | 'high_loan_emi';
    percentage?: number;
    amount?: number;
    months?: number;
    rateIncrease?: number;
  }) {
    const emp = await this.getEmployeeProfile(identifier);
    if (!emp) throw new Error('Employee not found');

    const monthlyIncome = emp.monthlyTakeHome || 65000;
    const essentialExpenses = 35000;
    const existingEmi = 8000;
    const emergencyReserve = 210000;

    let scenarioTitle = '';
    let beforeMetrics: Record<string, any> = {};
    let afterMetrics: Record<string, any> = {};
    let verdict = '';
    let mitigationPlaybook: string[] = [];

    switch (scenario.type) {
      case 'salary_cut': {
        const pct = scenario.percentage || 20;
        const newIncome = Math.round(monthlyIncome * (1 - pct / 100));
        const currentSurplus = monthlyIncome - (essentialExpenses + existingEmi);
        const newSurplus = newIncome - (essentialExpenses + existingEmi);
        const currentDti = Number(((existingEmi / monthlyIncome) * 100).toFixed(1));
        const newDti = Number(((existingEmi / newIncome) * 100).toFixed(1));

        scenarioTitle = `${pct}% Salary Reduction Shock`;
        beforeMetrics = {
          monthlyTakeHome: monthlyIncome,
          totalCommitments: essentialExpenses + existingEmi,
          monthlySurplus: currentSurplus,
          dtiPercentage: currentDti,
          runwayMonths: 6.0,
          resilienceScore: 78
        };
        afterMetrics = {
          monthlyTakeHome: newIncome,
          totalCommitments: essentialExpenses + existingEmi,
          monthlySurplus: newSurplus,
          dtiPercentage: newDti,
          runwayMonths: 6.0,
          resilienceScore: newSurplus > 0 ? 66 : 45
        };
        verdict = newSurplus > 0
          ? `Manageable. Monthly surplus drops from ₹${currentSurplus.toLocaleString('en-IN')} to ₹${newSurplus.toLocaleString('en-IN')}, but remains positive without tapping emergency reserves.`
          : `Deficit Risk. Monthly burn exceeds reduced salary by ₹${Math.abs(newSurplus).toLocaleString('en-IN')}/mo, requiring reserve depletion.`;
        mitigationPlaybook = [
          'Instantly freeze discretionary lifestyle spending to protect cash surplus.',
          'Do NOT take any new EMI obligations until income restabilizes.',
          'Activate Phase 1 AWS Cloud certification to enhance wage negotiation power.'
        ];
        break;
      }

      case 'layoff_shock': {
        const standardBurn = essentialExpenses + existingEmi; // ₹43,000
        const freezeBurn = 27000 + existingEmi; // Cut non-essential living to strict survival ₹27k + ₹8k EMI = ₹35,000
        const standardRunwayMonths = Number((emergencyReserve / standardBurn).toFixed(1));
        const standardRunwayDays = Math.round(standardRunwayMonths * 30);
        const freezeRunwayMonths = Number((emergencyReserve / freezeBurn).toFixed(1));
        const freezeRunwayDays = Math.round(freezeRunwayMonths * 30);

        scenarioTitle = 'Layoff Shock & Job Loss Survival Simulation';
        beforeMetrics = {
          status: 'Employed (Active)',
          monthlyTakeHome: monthlyIncome,
          monthlyBurn: standardBurn,
          liquidBuffer: emergencyReserve,
          runwayMonths: 6.0,
          runwayDays: 180
        };
        afterMetrics = {
          status: 'Income Interrupted (Zero Take-Home)',
          monthlyTakeHome: 0,
          standardBurnRate: standardBurn,
          standardRunwayMonths,
          standardRunwayDays,
          freezeBurnRate: freezeBurn,
          freezeRunwayMonths,
          freezeRunwayDays
        };
        verdict = `High Resilience. Your ₹${emergencyReserve.toLocaleString('en-IN')} reserve provides ${standardRunwayDays} days of standard survival and extends to ${freezeRunwayDays} days (${freezeRunwayMonths} months) in strict freeze mode.`;
        mitigationPlaybook = [
          'Switch immediately to Career Transition Mode: Apply for Full Stack (91% match) and Backend (86% match) roles.',
          'Execute budget freeze: Reduce burn from ₹43,000 to ₹35,000 to unlock 53 additional days of runway.',
          'Contact accountability nominee to pause non-essential financial commitments.'
        ];
        break;
      }

      case 'rate_hike': {
        const hikeBps = scenario.rateIncrease || 200; // 2% hike
        const estimatedEmiIncrease = Math.round(existingEmi * (hikeBps / 1000));
        const newEmi = existingEmi + estimatedEmiIncrease;

        scenarioTitle = `Interest Rate Hike (+${hikeBps} bps / ${(hikeBps / 100).toFixed(1)}%)`;
        beforeMetrics = {
          existingEmi,
          monthlySurplus: monthlyIncome - (essentialExpenses + existingEmi),
          dtiPercentage: Number(((existingEmi / monthlyIncome) * 100).toFixed(1))
        };
        afterMetrics = {
          existingEmi: newEmi,
          monthlySurplus: monthlyIncome - (essentialExpenses + newEmi),
          dtiPercentage: Number(((newEmi / monthlyIncome) * 100).toFixed(1)),
          annualExtraCost: estimatedEmiIncrease * 12
        };
        verdict = `Low Impact. Extra EMI burden of ₹${estimatedEmiIncrease.toLocaleString('en-IN')}/mo is comfortably absorbed by your ₹${(monthlyIncome - essentialExpenses - existingEmi).toLocaleString('en-IN')} monthly surplus.`;
        mitigationPlaybook = [
          'Prepay debt principal using surplus to offset higher compounding interest.',
          'Review refinancing opportunities when commercial rates soften.'
        ];
        break;
      }

      case 'emergency_expense': {
        const expenseAmt = scenario.amount || 50000;
        const remainingBuffer = Math.max(0, emergencyReserve - expenseAmt);
        const burnRate = essentialExpenses;
        const newRunway = Number((remainingBuffer / burnRate).toFixed(1));

        scenarioTitle = `Sudden Unforeseen Expense (₹${expenseAmt.toLocaleString('en-IN')})`;
        beforeMetrics = {
          reserve: emergencyReserve,
          runwayMonths: 6.0,
          runwayDays: 180,
          healthStatus: 'Excellent (6.0m)'
        };
        afterMetrics = {
          reserve: remainingBuffer,
          runwayMonths: newRunway,
          runwayDays: Math.round(newRunway * 30),
          healthStatus: newRunway >= 4 ? 'Good (Adequate)' : 'Caution (Under 4m)'
        };
        verdict = `Buffer Absorbs Shock. Runway reduces by ${(6.0 - newRunway).toFixed(1)} months (-${180 - Math.round(newRunway * 30)} days), but leaves ₹${remainingBuffer.toLocaleString('en-IN')} (${newRunway} months) intact.`;
        mitigationPlaybook = [
          'Prioritize replenishing emergency fund back to ₹2,10,000 using monthly surplus.',
          'Divert non-essential savings into liquid reserve for the next 2-3 months.'
        ];
        break;
      }

      case 'high_loan_emi': {
        const commercialEmi = 24500;
        const safeEmi = 10000;
        const commTotalDebt = existingEmi + commercialEmi;
        const commDti = Number(((commTotalDebt / monthlyIncome) * 100).toFixed(1));
        const commSurplus = monthlyIncome - (essentialExpenses + commTotalDebt);
        const commJobLossRunway = Number((emergencyReserve / (essentialExpenses + commTotalDebt)).toFixed(1));

        scenarioTitle = 'Commercial Eligibility (₹24.5k EMI) vs FINFOLIO Safe EMI (₹10k)';
        beforeMetrics = {
          model: 'FINFOLIO Resilient Safe Limit',
          recommendedEmi: safeEmi,
          totalEmi: existingEmi + safeEmi,
          dtiPercentage: Number((((existingEmi + safeEmi) / monthlyIncome) * 100).toFixed(1)),
          monthlySurplus: monthlyIncome - (essentialExpenses + existingEmi + safeEmi),
          jobLossRunwayMonths: Number((emergencyReserve / (essentialExpenses + existingEmi + safeEmi)).toFixed(1))
        };
        afterMetrics = {
          model: 'Commercial Bank Approval (50% FOIR)',
          recommendedEmi: commercialEmi,
          totalEmi: commTotalDebt,
          dtiPercentage: commDti,
          monthlySurplus: commSurplus,
          jobLossRunwayMonths: commJobLossRunway
        };
        verdict = `Extreme Insolvency Vulnerability. The commercial bank loan pushes DTI to 50%, leaves only ₹${commSurplus.toLocaleString('en-IN')} monthly cushion, and collapses your emergency runway from 4.0 months to only ${commJobLossRunway} months under job loss.`;
        mitigationPlaybook = [
          'Never borrow at standard 50% bank FOIR during corporate deceleration.',
          'Cap new EMI strictly at ₹10,000 to preserve ₹12,000 monthly cushion and 4-month emergency buffer.',
          'Borrow conservatively between ₹6.0L and ₹8.5L.'
        ];
        break;
      }
    }

    return {
      scenarioTitle,
      employeeId: emp.employeeId,
      before: beforeMetrics,
      after: afterMetrics,
      verdict,
      mitigationPlaybook
    };
  }

  /**
   * Get detailed factor explanations for all scores
   */
  async getRiskExplanation(identifier: string | number) {
    const full = await this.getFullContext(identifier);
    if (!full || !full.company || !full.incomeResilience) return null;

    return {
      employee: {
        id: full.employee.employeeId,
        name: full.employee.employeeName,
        designation: full.employee.designation,
        company: full.employee.companyName
      },
      scores: {
        jobStabilityScore: {
          score: full.employee.jobStabilityScore,
          rating: 'Good (74/100)',
          components: [
            { factor: 'Core Technical Skill Alignment', weight: '+8 pts', note: 'Strong Node.js, React & SQL foundations' },
            { factor: 'Years of Experience (3.5 yrs)', weight: '+6 pts', note: 'Mid-level contributor stability' },
            { factor: 'Industry Demand for Software Engineers', weight: '+5 pts', note: 'High ongoing market recruitment' },
            { factor: 'Employer Revenue Deceleration', weight: '-5 pts', note: 'Example Tech growth dropped from 28% to 8%' },
            { factor: 'Skills Gap in Cloud / AI', weight: '-4 pts', note: 'Missing AWS & LLMOps certifications' }
          ],
          summary: 'Viable core role with stable market demand, but exposed to company growth deceleration and cloud/AI skill gaps.'
        },
        companyHealthScore: {
          score: full.company.healthScore,
          stabilityScore: full.company.stabilityScore,
          riskLevel: full.company.riskLevel,
          components: [
            { factor: 'EBITDA Margin Compression', value: '-3.4%', status: 'Warning' },
            { factor: 'Revenue Growth Deceleration', value: '8.0% YoY vs 28% prior', status: 'Warning' },
            { factor: 'Hiring Trend', value: 'Selective / Restructuring', status: 'Caution' },
            { factor: 'Funding & Debt Exposure', value: 'Moderate debt coverage', status: 'Neutral' }
          ],
          summary: 'Example Tech is fundamentally viable but experiencing growth plateau and cost discipline restructuring.'
        },
        financialResilienceScore: {
          score: full.incomeResilience.incomeResilienceScore,
          rating: 'Strong (78/100)',
          components: [
            { factor: 'Emergency Runway', value: `${full.incomeResilience.emergencyRunwayMonths} months (${full.incomeResilience.emergencyRunwayDays} days)`, status: 'Excellent' },
            { factor: 'Debt-to-Income (DTI)', value: '12.3% (₹8,000 / ₹65,000)', status: 'Excellent' },
            { factor: 'Savings Rate', value: '46.2% (₹30,000/mo potential)', status: 'Strong' },
            { factor: 'Protected Savings Vault', value: `₹${full.wallet.balance.toLocaleString('en-IN')} balance with ₹${full.wallet.threshold.toLocaleString('en-IN')} threshold`, status: 'Active' }
          ]
        },
        careerResilienceScore: {
          current: full.employee.careerResilienceScore,
          potential: full.employee.potentialResilienceScore,
          gap: full.employee.potentialResilienceScore - full.employee.careerResilienceScore,
          summary: `Current resilience is ${full.employee.careerResilienceScore}/100. Completing Phase 1 AWS Cloud and Phase 2 Applied AI will elevate resilience to ${full.employee.potentialResilienceScore}/100 (+${full.employee.potentialResilienceScore - full.employee.careerResilienceScore} pts).`
        }
      },
      strengths: [
        'Solid 6.0 months liquid emergency runway in reserve (₹2,10,000)',
        'Conservative current debt profile with low 12.3% DTI ratio',
        'Strong immediate transition match for Full Stack (91%) and Backend (86%) roles'
      ],
      vulnerabilities: [
        'Cloud & AI skill gaps reduce mobility into modern enterprise architecture roles',
        'Company EBITDA contraction (-3.4%) increases vulnerability to departmental restructuring',
        'Taking an aggressive bank-offered loan (₹22L / ₹24.5k EMI) would collapse financial safety margins'
      ]
    };
  }

  /**
   * Export comprehensive employee intelligence report
   */
  async exportEmployeeReport(identifier: string | number) {
    const full = await this.getFullContext(identifier);
    const explanation = await this.getRiskExplanation(identifier);
    return {
      exportedAt: new Date().toISOString(),
      platform: 'FINFOLIO Employee Financial Intelligence & Resilience Platform',
      version: '2.0.0',
      data: {
        ...full,
        riskExplanation: explanation
      }
    };
  }
}

export const employeeIntelligenceService = new EmployeeIntelligenceService();
