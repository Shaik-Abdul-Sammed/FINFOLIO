import { Router } from 'express';
import {
  getProfile,
  getCompanyIntelligence,
  getCareerRisk,
  getSkills,
  getCareerTransitions,
  getIncomeResilience,
  getLoanAffordability,
  getFullContext,
  demoReset,
  updateProfile,
  updateSkill,
  simulateScenario,
  getRiskExplanation,
  exportReport
} from '../controllers/employeeController.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';

const router = Router();

// Employee intelligence routes - optionalAuth allows demo viewing while binding to authenticated user when logged in
router.get('/profile', optionalAuthMiddleware, getProfile);
router.put('/profile', optionalAuthMiddleware, updateProfile);
router.get('/company-intelligence', optionalAuthMiddleware, getCompanyIntelligence);
router.get('/career-risk', optionalAuthMiddleware, getCareerRisk);
router.get('/skills', optionalAuthMiddleware, getSkills);
router.put('/skills/:id', optionalAuthMiddleware, updateSkill);
router.get('/career-transitions', optionalAuthMiddleware, getCareerTransitions);
router.get('/income-resilience', optionalAuthMiddleware, getIncomeResilience);
router.get('/loan-affordability', optionalAuthMiddleware, getLoanAffordability);
router.get('/full-context', optionalAuthMiddleware, getFullContext);
router.get('/risk-explanation', optionalAuthMiddleware, getRiskExplanation);
router.get('/export-report', optionalAuthMiddleware, exportReport);
router.post('/simulate-scenario', optionalAuthMiddleware, simulateScenario);
router.post('/demo-reset', demoReset);

export default router;
