import { Request, Response } from 'express';
import { employeeIntelligenceService } from '../services/employeeIntelligenceService.js';
import { seedDatabase } from '../scripts/seedDatabase.js';
import { logger } from '../utils/logger.js';

function getIdentifier(req: Request): string | number {
  if (req.query.employeeId && typeof req.query.employeeId === 'string') {
    return req.query.employeeId;
  }
  const userId = (req as any).userId;
  if (userId) {
    return userId;
  }
  return 'EMP-RKVT-1001';
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const profile = await employeeIntelligenceService.getEmployeeProfile(identifier);
    if (!profile) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    res.json({ success: true, data: profile });
    return;
  } catch (error: any) {
    logger.error('Failed to get employee profile:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const getCompanyIntelligence = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const company = await employeeIntelligenceService.getCompanyIntelligence(identifier);
    if (!company) {
      res.status(404).json({ error: 'Company intelligence not found' });
      return;
    }
    res.json({ success: true, data: company });
    return;
  } catch (error: any) {
    logger.error('Failed to get company intelligence:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const getCareerRisk = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const careerRisk = await employeeIntelligenceService.getCareerRisk(identifier);
    if (!careerRisk) {
      res.status(404).json({ error: 'Career risk profile not found' });
      return;
    }
    res.json({ success: true, data: careerRisk });
    return;
  } catch (error: any) {
    logger.error('Failed to get career risk:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const getSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const skills = await employeeIntelligenceService.getEmployeeSkills(identifier);
    res.json({ success: true, count: skills.length, data: skills });
    return;
  } catch (error: any) {
    logger.error('Failed to get employee skills:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const getCareerTransitions = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const transitions = await employeeIntelligenceService.getCareerTransitions(identifier);
    res.json({
      success: true,
      mode: 'Career Transition Mode',
      count: transitions.length,
      data: transitions
    });
    return;
  } catch (error: any) {
    logger.error('Failed to get career transitions:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const getIncomeResilience = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const resilience = await employeeIntelligenceService.getIncomeResilience(identifier);
    if (!resilience) {
      res.status(404).json({ error: 'Income resilience profile not found' });
      return;
    }
    res.json({ success: true, data: resilience });
    return;
  } catch (error: any) {
    logger.error('Failed to get income resilience:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const getLoanAffordability = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const affordability = await employeeIntelligenceService.getLoanAffordability(identifier);
    if (!affordability) {
      res.status(404).json({ error: 'Loan affordability not found' });
      return;
    }
    res.json({
      success: true,
      data: affordability,
      comparison: {
        maxSafeEmi: affordability.maxSafeEmi,
        bankEligibleEmi: affordability.bankEligibleEmi,
        conservativeLoanAmount: affordability.conservativeLoanAmount,
        safeLoanRange: {
          min: affordability.safeLoanMin,
          max: affordability.safeLoanMax
        },
        bankEligibleLoanAmount: affordability.bankEligibleLoanAmount,
        distinction: affordability.resilienceDistinctionNotes
      }
    });
    return;
  } catch (error: any) {
    logger.error('Failed to get loan affordability:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const getFullContext = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const context = await employeeIntelligenceService.getFullContext(identifier);
    if (!context) {
      res.status(404).json({ error: 'Context not found' });
      return;
    }
    res.json({ success: true, data: context });
    return;
  } catch (error: any) {
    logger.error('Failed to get employee full context:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const demoReset = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Performing DEMO RESET of all platform state...');
    await seedDatabase(false);
    res.json({
      success: true,
      message: 'DEMO RESET complete: Employee, company, wallet (₹1,00,000), emergency fund (₹2,10,000), nominee, skills, and loan metrics restored to pristine hackathon configuration.',
      employeeId: 'EMP-RKVT-1001',
      companyId: 'COMP-EX-001',
      walletBalance: 100000,
      emergencyMonths: 6.0,
      nomineeThreshold: 20000,
    });
    return;
  } catch (error: any) {
    logger.error('Failed to perform DEMO RESET:', error);
    res.status(500).json({ error: 'Failed to reset demo state', details: error.message });
    return;
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const updates = req.body;
    const updated = await employeeIntelligenceService.updateEmployeeProfile(identifier, updates);
    if (!updated) {
      res.status(404).json({ error: 'Employee profile not found' });
      return;
    }
    res.json({
      success: true,
      message: 'Employee profile updated successfully',
      data: updated
    });
    return;
  } catch (error: any) {
    logger.error('Failed to update employee profile:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const updateSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const skillId = parseInt(req.params.id as string, 10);
    const { currentLevel } = req.body;

    if (isNaN(skillId) || currentLevel === undefined) {
      res.status(400).json({ error: 'Valid skill ID and currentLevel (1-5) are required' });
      return;
    }

    const result = await employeeIntelligenceService.updateEmployeeSkillLevel(identifier, skillId, Number(currentLevel));
    if (!result) {
      res.status(404).json({ error: 'Skill or employee not found' });
      return;
    }

    res.json({
      success: true,
      message: `Skill level updated to ${result.skill.currentLevel}/5. Career resilience score updated to ${result.careerResilienceScore}/100.`,
      data: result
    });
    return;
  } catch (error: any) {
    logger.error('Failed to update employee skill:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const simulateScenario = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const { type, percentage, amount, months, rateIncrease } = req.body;

    if (!type) {
      res.status(400).json({ error: 'Scenario type is required (e.g. salary_cut, layoff_shock, rate_hike, emergency_expense, high_loan_emi)' });
      return;
    }

    const simParams: {
      type: 'salary_cut' | 'layoff_shock' | 'rate_hike' | 'emergency_expense' | 'high_loan_emi';
      percentage?: number;
      amount?: number;
      months?: number;
      rateIncrease?: number;
    } = { type };

    if (percentage !== undefined && percentage !== null && percentage !== '') simParams.percentage = Number(percentage);
    if (amount !== undefined && amount !== null && amount !== '') simParams.amount = Number(amount);
    if (months !== undefined && months !== null && months !== '') simParams.months = Number(months);
    if (rateIncrease !== undefined && rateIncrease !== null && rateIncrease !== '') simParams.rateIncrease = Number(rateIncrease);

    const result = await employeeIntelligenceService.simulateScenario(identifier, simParams);

    res.json({
      success: true,
      data: result
    });
    return;
  } catch (error: any) {
    logger.error('Failed to simulate scenario:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const getRiskExplanation = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const explanation = await employeeIntelligenceService.getRiskExplanation(identifier);
    if (!explanation) {
      res.status(404).json({ error: 'Risk explanation not found' });
      return;
    }
    res.json({
      success: true,
      data: explanation
    });
    return;
  } catch (error: any) {
    logger.error('Failed to get risk explanation:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

export const exportReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    const report = await employeeIntelligenceService.exportEmployeeReport(identifier);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=finfolio-employee-report-${Date.now()}.json`);
    res.json(report);
    return;
  } catch (error: any) {
    logger.error('Failed to export employee report:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};

