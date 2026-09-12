import { Request, Response } from 'express';
import { ChatService } from '../services/chatService.js';
import { logger } from '../utils/logger.js';

export const handleChat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 1;
    const { message, conversation } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const response = await ChatService.processMessage(userId, message, conversation || []);
    return res.json({
      success: true,
      ...response
    });
  } catch (error: any) {
    logger.error(`Error processing chat message: ${error.message}`);
    return res.status(500).json({
      error: error.message || 'Unable to reach FINFOLIO Copilot. Please try again.'
    });
  }
};
