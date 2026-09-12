import { describe, it, expect } from 'vitest';
import { ChatService } from '../services/chatService.js';

describe('FINFOLIO AI Financial Copilot Reasoning Engine', () => {
  const userId = 1;

  it('1. answers: "What is my employee ID?"', async () => {
    const res = await ChatService.processMessage(userId, 'What is my employee ID?');
    expect(res.text).toContain('EMP-RKVT-1001');
    expect(res.suggestions).toBeDefined();
  });

  it('2. answers: "What company do I work for?"', async () => {
    const res = await ChatService.processMessage(userId, 'What company do I work for?');
    expect(res.text).toMatch(/FinTech India|Example Technologies/i);
  });

  it('3. answers: "How stable is my current job?"', async () => {
    const res = await ChatService.processMessage(userId, 'How stable is my current job?');
    expect(res.text).toMatch(/74\/100|stable/i);
  });

  it('4. answers: "Why is my company risk moderate?"', async () => {
    const res = await ChatService.processMessage(userId, 'Why is my company risk moderate?');
    expect(res.text).toMatch(/MODERATE/i);
    expect(res.text).toMatch(/runway|burn/i);
  });

  it('5. answers: "What skills should I learn?"', async () => {
    const res = await ChatService.processMessage(userId, 'What skills should I learn?');
    expect(res.text).toMatch(/System Design|Kubernetes|Cloud/i);
    expect(res.text).toMatch(/resilience/i);
  });

  it('6. answers: "Which career should I switch to if my current job becomes unstable?"', async () => {
    const res = await ChatService.processMessage(userId, 'Which career should I switch to if my current job becomes unstable?');
    expect(res.text).toMatch(/Cloud Solutions Architect|match/i);
  });

  it('7. answers: "Can I afford a ₹20 lakh loan?"', async () => {
    const res = await ChatService.processMessage(userId, 'Can I afford a ₹20 lakh loan?');
    expect(res.text).toMatch(/20.*Lakh/i);
    expect(res.text).toMatch(/safe emi|resilience ceiling|safe loan/i);
  });

  it('8. answers: "What is my safe EMI?"', async () => {
    const res = await ChatService.processMessage(userId, 'What is my safe EMI?');
    expect(res.text).toMatch(/₹10,000|10000|₹19,500|19500/i);
  });

  it('9. answers: "What happens if I lose my job?"', async () => {
    const res = await ChatService.processMessage(userId, 'What happens if I lose my job?');
    expect(res.text).toMatch(/survive|months|emergency/i);
    expect(res.text).toMatch(/6\.0|180 days/i);
  });

  it('10. answers: "How many months can I survive without my salary?"', async () => {
    const res = await ChatService.processMessage(userId, 'How many months can I survive without my salary?');
    expect(res.text).toMatch(/6\.0.*months|180.*days/i);
  });

  it('11. answers: "What happens if I spend ₹50,000 from my wallet?"', async () => {
    const res = await ChatService.processMessage(userId, 'What happens if I spend ₹50,000 from my wallet?');
    expect(res.text).toMatch(/50,000/i);
    expect(res.text).toMatch(/delay|runway|nominee/i);
  });

  it('12. answers: "Why does FINFOLIO recommend a lower loan amount than the bank?"', async () => {
    const res = await ChatService.processMessage(userId, 'Why does FINFOLIO recommend a lower loan amount than the bank?');
    expect(res.text).toMatch(/bank/i);
    expect(res.text).toMatch(/gross|net|dti|essential/i);
  });

  it('13. answers: "How can I improve my financial resilience?"', async () => {
    const res = await ChatService.processMessage(userId, 'How can I improve my financial resilience?');
    expect(res.text).toMatch(/resilience/i);
    expect(res.text).toMatch(/upskilling|runway|buffer/i);
  });

  it('14. answers: "What should I do first to reduce my career risk?"', async () => {
    const res = await ChatService.processMessage(userId, 'What should I do first to reduce my career risk?');
    expect(res.text).toMatch(/career risk|upskill/i);
  });

  it('15. answers: "If my salary falls by 20%, what happens to my financial position?"', async () => {
    const res = await ChatService.processMessage(userId, 'If my salary falls by 20%, what happens to my financial position?');
    expect(res.text).toMatch(/20%/);
    expect(res.text).toMatch(/Take-Home|essential|expenses/i);
  });

  it('16. answers cross-domain query: "Can I afford a ₹20 lakh loan if my company becomes unstable?"', async () => {
    const res = await ChatService.processMessage(userId, 'Can I afford a ₹20 lakh loan if my company becomes unstable?');
    expect(res.text).toMatch(/unstable|volatility|postpone/i);
    expect(res.text).toMatch(/EMI|loan/i);
  });

  it('17. answers arbitrary typed questions without predefined prompt', async () => {
    const q1 = await ChatService.processMessage(userId, 'Should I take a new loan right now?');
    expect(q1.text.length).toBeGreaterThan(50);

    const q2 = await ChatService.processMessage(userId, 'Is buying an expensive laptop safe for me?');
    expect(q2.text).toMatch(/laptop|purchase/i);

    const q3 = await ChatService.processMessage(userId, 'What is my biggest financial risk?');
    expect(q3.text).toMatch(/risk|exposure|income/i);

    const q4 = await ChatService.processMessage(userId, 'Which is more urgent for me: upskilling or saving more?');
    expect(q4.text).toMatch(/upskilling|saving/i);

    const q5 = await ChatService.processMessage(userId, 'What should I prioritize this month?');
    expect(q5.text).toMatch(/priorit/i);
  });

  it('handles empty message gracefully', async () => {
    const res = await ChatService.processMessage(userId, '   ');
    expect(res.text).toMatch(/please type a question/i);
  });
});
