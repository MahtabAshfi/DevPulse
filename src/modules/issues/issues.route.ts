import { Router } from 'express';
import { createIssueRecord, fetchAllIssues, fetchSingleIssue, modifyIssue, removeIssue } from './issues.controller';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();
router.post('/', authenticateToken, createIssueRecord);
router.get('/', fetchAllIssues);
router.get('/:id', fetchSingleIssue);
router.patch('/:id', authenticateToken, modifyIssue);


export default router;