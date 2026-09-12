import { Router } from 'express';
import { handleChat } from '../controllers/chatController.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';

const router = Router();

// POST /api/chat - process queries from FINFOLIO AI Copilot
router.post('/', optionalAuthMiddleware, handleChat);
router.post('/message', optionalAuthMiddleware, handleChat);

export default router;
