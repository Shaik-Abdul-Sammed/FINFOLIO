import { apiClient } from './apiClient';

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

export interface EmployeeFullContext {
  employee: EmployeeProfile;
  company: CompanyIntelligence;
  skills: EmployeeSkill[];
  careerTransitions: CareerTransitionRole[];
  loanAffordability: LoanAffordability;
  incomeResilience: IncomeResilience;
  wallet: {
    balance: number;
    threshold: number;
    currency: string;
  };
  nominee: {
    name: string;
    email: string;
    status: string;
  };
}

export interface ScenarioSimulationResult {
  scenarioTitle: string;
  employeeId: string;
  before: Record<string, any>;
  after: Record<string, any>;
  verdict: string;
  mitigationPlaybook: string[];
}

export interface RiskExplanationData {
  employee: {
    id: string;
    name: string;
    designation: string;
    company: string;
  };
  scores: {
    jobStabilityScore: {
      score: number;
      rating: string;
      components: Array<{ factor: string; weight: string; note: string }>;
      summary: string;
    };
    companyHealthScore: {
      score: number;
      stabilityScore: number;
      riskLevel: string;
      components: Array<{ factor: string; value: string; status: string }>;
      summary: string;
    };
    financialResilienceScore: {
      score: number;
      rating: string;
      components: Array<{ factor: string; value: string; status: string }>;
    };
    careerResilienceScore: {
      current: number;
      potential: number;
      gap: number;
      summary: string;
    };
  };
  strengths: string[];
  vulnerabilities: string[];
  recommendedPriorities: string[];
}

export const employeeService = {
  async getProfile(): Promise<EmployeeProfile> {
    const res = await apiClient.get('/api/employee/profile');
    return res.data.data;
  },

  async updateProfile(updates: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    const res = await apiClient.put('/api/employee/profile', updates);
    return res.data.data;
  },

  async getCompanyIntelligence(): Promise<CompanyIntelligence> {
    const res = await apiClient.get('/api/employee/company-intelligence');
    return res.data.data;
  },

  async getCareerRisk(): Promise<any> {
    const res = await apiClient.get('/api/employee/career-risk');
    return res.data.data;
  },

  async getSkills(): Promise<EmployeeSkill[]> {
    const res = await apiClient.get('/api/employee/skills');
    return res.data.data;
  },

  async updateSkill(skillId: number, currentLevel: number): Promise<{ skill: EmployeeSkill; careerResilienceScore: number }> {
    const res = await apiClient.put(`/api/employee/skills/${skillId}`, { currentLevel });
    return res.data.data;
  },

  async getCareerTransitions(): Promise<CareerTransitionRole[]> {
    const res = await apiClient.get('/api/employee/career-transitions');
    return res.data.data;
  },

  async getLoanAffordability(): Promise<{ data: LoanAffordability; comparison: any }> {
    const res = await apiClient.get('/api/employee/loan-affordability');
    return res.data;
  },

  async getIncomeResilience(): Promise<IncomeResilience> {
    const res = await apiClient.get('/api/employee/income-resilience');
    return res.data.data;
  },

  async getFullContext(): Promise<EmployeeFullContext> {
    const res = await apiClient.get('/api/employee/full-context');
    return res.data.data;
  },

  async simulateScenario(params: {
    type: 'salary_cut' | 'layoff_shock' | 'rate_hike' | 'emergency_expense' | 'high_loan_emi';
    percentage?: number;
    amount?: number;
    months?: number;
    rateIncrease?: number;
  }): Promise<ScenarioSimulationResult> {
    const res = await apiClient.post('/api/employee/simulate-scenario', params);
    return res.data.data;
  },

  async getRiskExplanation(): Promise<RiskExplanationData> {
    const res = await apiClient.get('/api/employee/risk-explanation');
    return res.data.data;
  },

  async exportReport(): Promise<any> {
    const res = await apiClient.get('/api/employee/export-report');
    return res.data.data;
  },

  async demoReset(): Promise<{ success: boolean; message: string; walletBalance: number; emergencyMonths: number }> {
    const res = await apiClient.post('/api/employee/demo-reset');
    return res.data;
  }
};

