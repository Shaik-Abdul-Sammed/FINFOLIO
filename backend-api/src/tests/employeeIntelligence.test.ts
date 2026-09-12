import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { employeeIntelligenceService } from '../services/employeeIntelligenceService.js';
import { seedDatabase } from '../scripts/seedDatabase.js';

describe('Employee Financial Intelligence & Resilience Platform', () => {
  const employeeId = 'EMP-RKVT-1001';

  beforeAll(async () => {
    await seedDatabase(false);
  });

  afterAll(async () => {
    await seedDatabase(false);
  });

  describe('1. Employee Identity & Profile', () => {
    it('should retrieve employee profile for EMP-RKVT-1001 with correct details', async () => {
      const profile = await employeeIntelligenceService.getEmployeeProfile(employeeId);
      expect(profile).not.toBeNull();
      if (profile) {
        expect(profile.employeeId).toBe(employeeId);
        expect(profile.designation).toBe('Software Engineer');
        expect(profile.department).toBe('Engineering');
        expect(profile.companyName).toBe('Example Technologies Pvt. Ltd.');
        expect(profile.monthlyTakeHome).toBe(65000);
        expect(profile.currentSalary).toBe(780000);
        expect(profile.jobStabilityScore).toBe(74);
        expect(profile.careerRiskScore).toBe('MODERATE');
        expect(profile.careerResilienceScore).toBe(61);
        expect(profile.potentialResilienceScore).toBe(84);
      }
    });

    it('should resolve employee profile by user ID', async () => {
      const demoProfile = await employeeIntelligenceService.getEmployeeProfile(employeeId);
      expect(demoProfile).not.toBeNull();
      if (demoProfile) {
        const byUserId = await employeeIntelligenceService.getEmployeeProfile(demoProfile.userId);
        expect(byUserId).not.toBeNull();
        expect(byUserId?.employeeId).toBe(employeeId);
      }
    });
  });

  describe('2. Company Intelligence Engine', () => {
    it('should retrieve corporate stability, health scores, and layoff signals', async () => {
      const company = await employeeIntelligenceService.getCompanyIntelligence(employeeId);
      expect(company).not.toBeNull();
      if (company) {
        expect(company.name).toBe('Example Technologies Pvt. Ltd.');
        expect(company.industry).toContain('Enterprise Software');
        expect(company.healthScore).toBe(72);
        expect(company.growthScore).toBe(58);
        expect(company.stabilityScore).toBe(68);
        expect(company.riskLevel).toBe('MODERATE');
        expect(company.revenueTrend).toContain('Decelerating');
        expect(company.employeeGrowth).toBe(-4.2);
        expect(company.attritionRate).toBe(18.5);
        expect(company.hiringTrend).toContain('Selective');
        expect(company.layoffTrend).toContain('Moderate restructuring');
        expect(company.riskExplanation).toContain('employment stability is moderately elevated');
      }
    });
  });

  describe('3. Career & Job Security Intelligence', () => {
    it('should compute career risk and resilience improvement targets', async () => {
      const careerRisk = await employeeIntelligenceService.getCareerRisk(employeeId);
      expect(careerRisk).not.toBeNull();
      if (careerRisk) {
        expect(careerRisk.jobStabilityScore).toBe(74);
        expect(careerRisk.careerRiskScore).toBe('MODERATE');
        expect(careerRisk.careerResilienceScore).toBe(61);
        expect(careerRisk.potentialResilienceScore).toBe(84);
        expect(careerRisk.recommendedNextSteps.length).toBeGreaterThanOrEqual(4);
      }
    });
  });

  describe('4. Skills Gap & Roadmap Engine', () => {
    it('should return employee skills with prioritized gap roadmaps', async () => {
      const skills = await employeeIntelligenceService.getEmployeeSkills(employeeId);
      expect(skills.length).toBeGreaterThanOrEqual(7);

      const cloudSkill = skills.find(s => s.skillName.includes('Cloud'));
      expect(cloudSkill).toBeDefined();
      expect(cloudSkill?.currentLevel).toBe(2);
      expect(cloudSkill?.targetLevel).toBe(4);
      expect(cloudSkill?.gapLevel).toBe(2);
      expect(cloudSkill?.priority).toBe('HIGH');
      expect(cloudSkill?.roadmapPhase).toBe('0-3 months');

      const aiSkill = skills.find(s => s.skillName.includes('AI/ML'));
      expect(aiSkill).toBeDefined();
      expect(aiSkill?.gapLevel).toBe(2);
      expect(aiSkill?.priority).toBe('HIGH');
      expect(aiSkill?.roadmapPhase).toBe('3-6 months');

      const devopsSkill = skills.find(s => s.skillName.includes('DevOps'));
      expect(devopsSkill).toBeDefined();
      expect(devopsSkill?.gapLevel).toBe(2);
      expect(devopsSkill?.roadmapPhase).toBe('6-12 months');
    });
  });

  describe('5. Career Transition Mode (Alternative Roles)', () => {
    it('should return ranked alternative roles with match percentage and salary in INR', async () => {
      const transitions = await employeeIntelligenceService.getCareerTransitions(employeeId);
      expect(transitions.length).toBe(4);

      const topRole = transitions[0];
      expect(topRole.targetRole).toBe('Full Stack Developer');
      expect(topRole.matchPercentage).toBe(91);
      expect(topRole.minSalary).toBe(1200000);
      expect(topRole.maxSalary).toBe(1600000);
      expect(topRole.skillsGapLevel).toBe('Low');
      expect(topRole.keyTransferableSkills).toContain('React');
      expect(topRole.keyTransferableSkills).toContain('Node.js');

      const secondRole = transitions[1];
      expect(secondRole.targetRole).toBe('Backend Engineer');
      expect(secondRole.matchPercentage).toBe(86);
    });
  });

  describe('6. Resilient Loan Affordability vs Bank Eligibility', () => {
    it('should differentiate safe borrower affordability from commercial bank limits', async () => {
      const loan = await employeeIntelligenceService.getLoanAffordability(employeeId);
      expect(loan).not.toBeNull();
      if (loan) {
        expect(loan.monthlyIncome).toBe(65000);
        expect(loan.existingEmi).toBe(8000);
        expect(loan.maxSafeEmi).toBe(10000);
        expect(loan.recommendedEmi).toBe(7500);
        expect(loan.bankEligibleEmi).toBe(24500);
        expect(loan.safeLoanMin).toBe(600000);
        expect(loan.safeLoanMax).toBe(850000);
        expect(loan.bankEligibleLoanAmount).toBe(2200000);
        expect(loan.resilienceDistinctionNotes).toContain('Bank eligibility calculates the absolute maximum debt');
      }
    });
  });

  describe('7. Income Resilience & Emergency Runway', () => {
    it('should calculate 6.0 months runway and 78/100 resilience score', async () => {
      const resilience = await employeeIntelligenceService.getIncomeResilience(employeeId);
      expect(resilience).not.toBeNull();
      if (resilience) {
        expect(resilience.monthlyIncome).toBe(65000);
        expect(resilience.essentialExpenses).toBe(35000);
        expect(resilience.emergencySavings).toBe(210000);
        expect(resilience.emergencyRunwayMonths).toBe(6.0);
        expect(resilience.emergencyRunwayDays).toBe(180);
        expect(resilience.incomeResilienceScore).toBe(78);
      }
    });
  });

  describe('8. Comprehensive Context for AI Copilot', () => {
    it('should return complete context bundle with wallet and nominee status', async () => {
      const context = await employeeIntelligenceService.getFullContext(employeeId);
      expect(context).not.toBeNull();
      if (context) {
        expect(context.employee.employeeId).toBe(employeeId);
        expect(context.company?.riskLevel).toBe('MODERATE');
        expect(context.skills.length).toBeGreaterThanOrEqual(7);
        expect(context.careerTransitions.length).toBe(4);
        expect(context.loanAffordability?.maxSafeEmi).toBe(10000);
        expect(context.wallet.currency).toBe('INR');
        expect(context.wallet.threshold).toBe(20000);
        expect(context.nominee.status).toBe('active');
      }
    });
  });

  describe('9. Profile Update & Persistence', () => {
    it('should update employee profile and reflect updated fields', async () => {
      const updated = await employeeIntelligenceService.updateEmployeeProfile(employeeId, {
        designation: 'Senior Software Engineer',
        yearsOfExperience: 4.5
      });
      expect(updated).not.toBeNull();
      expect(updated?.designation).toBe('Senior Software Engineer');
      expect(updated?.yearsOfExperience).toBe(4.5);

      // Revert back for consistency
      await employeeIntelligenceService.updateEmployeeProfile(employeeId, {
        designation: 'Software Engineer',
        yearsOfExperience: 3.5
      });
    });
  });

  describe('10. Skill Progression & Dynamic Career Resilience Recomputation', () => {
    it('should update skill level and recompute career resilience score', async () => {
      const skills = await employeeIntelligenceService.getEmployeeSkills(employeeId);
      const cloudSkill = skills.find(s => s.skillName.includes('Cloud'));
      expect(cloudSkill).toBeDefined();

      if (cloudSkill) {
        const initialLevel = cloudSkill.currentLevel; // 2
        // Progress AWS Cloud to level 4 (closing the gap)
        const result = await employeeIntelligenceService.updateEmployeeSkillLevel(employeeId, cloudSkill.id, 4);
        expect(result).not.toBeNull();
        if (result) {
          expect(result.skill.currentLevel).toBe(4);
          expect(result.skill.gapLevel).toBe(0);
          expect(result.careerResilienceScore).toBeGreaterThanOrEqual(61);
        }

        // Restore back to initial
        await employeeIntelligenceService.updateEmployeeSkillLevel(employeeId, cloudSkill.id, initialLevel);
      }
    });
  });

  describe('11. What-If Scenario Simulations', () => {
    it('should simulate 20% salary cut with exact financial consequences', async () => {
      const sim = await employeeIntelligenceService.simulateScenario(employeeId, {
        type: 'salary_cut',
        percentage: 20
      });
      expect(sim.scenarioTitle).toContain('20% Salary Reduction');
      expect(sim.before.monthlyTakeHome).toBe(65000);
      expect(sim.after.monthlyTakeHome).toBe(52000);
      expect(sim.after.monthlySurplus).toBe(9000);
      expect(sim.verdict).toContain('Manageable');
      expect(sim.mitigationPlaybook.length).toBeGreaterThan(0);
    });

    it('should simulate layoff shock with standard vs freeze runway days', async () => {
      const sim = await employeeIntelligenceService.simulateScenario(employeeId, {
        type: 'layoff_shock'
      });
      expect(sim.scenarioTitle).toContain('Layoff Shock');
      expect(sim.after.standardRunwayDays).toBeGreaterThan(100);
      expect(sim.after.freezeRunwayDays).toBeGreaterThan(sim.after.standardRunwayDays);
      expect(sim.mitigationPlaybook).toContain('Switch immediately to Career Transition Mode: Apply for Full Stack (91% match) and Backend (86% match) roles.');
    });

    it('should simulate sudden emergency expense of ₹50,000', async () => {
      const sim = await employeeIntelligenceService.simulateScenario(employeeId, {
        type: 'emergency_expense',
        amount: 50000
      });
      expect(sim.scenarioTitle).toContain('₹50,000');
      expect(sim.after.reserve).toBe(160000);
      expect(sim.verdict).toContain('Buffer Absorbs Shock');
    });
  });

  describe('12. Factor Explanations for Intelligence Scores', () => {
    it('should return detailed mathematical components for all scores', async () => {
      const explanation = await employeeIntelligenceService.getRiskExplanation(employeeId);
      expect(explanation).not.toBeNull();
      if (explanation) {
        expect(explanation.scores.jobStabilityScore.components.length).toBeGreaterThan(3);
        expect(explanation.scores.companyHealthScore.components.length).toBeGreaterThan(2);
        expect(explanation.strengths.length).toBeGreaterThanOrEqual(3);
        expect(explanation.vulnerabilities.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
