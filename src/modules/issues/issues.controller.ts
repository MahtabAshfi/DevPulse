import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import pool from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';

export const createIssueRecord = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
      return sendError(res, StatusCodes.BAD_REQUEST, "Missing required fields");
    }
    if (title.length > 150) {
      return sendError(res, StatusCodes.BAD_REQUEST, "Title cannot exceed 150 characters");
    }
    if (description.length < 20) {
      return sendError(res, StatusCodes.BAD_REQUEST, "Description must be at least 20 characters");
    }

    const result = await pool.query(
      'INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, type, req.user?.id]
    );

    return sendSuccess(res, StatusCodes.CREATED, "Issue created successfully", result.rows[0]);
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create issue", error);
  }
};

export const fetchAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort = 'newest', type, status } = req.query;
    
    let baseQuery = 'SELECT * FROM issues';
    const queryParams: unknown[] = [];
    const filters: string[] = [];

    if (type) { 
      queryParams.push(type); 
      filters.push(`type = $${queryParams.length}`); 
    }
    if (status) { 
      queryParams.push(status); 
      filters.push(`status = $${queryParams.length}`); 
    }
    if (filters.length > 0) { 
      baseQuery += ` WHERE ${filters.join(' AND ')}`;
    }

    baseQuery += sort === 'oldest' ? ' ORDER BY created_at ASC' : ' ORDER BY created_at DESC';
    
    const issuesResult = await pool.query(baseQuery, queryParams);
    const issues = issuesResult.rows;

    if (issues.length === 0) { 
      return sendSuccess(res, StatusCodes.OK, "No issues found", []);
    }

    const userIds = [...new Set(issues.map(i => i.reporter_id))];
    const userQuery = await pool.query('SELECT id, name, role FROM users WHERE id = ANY($1)', [userIds]);
    const users = userQuery.rows;

    const formattedIssues = issues.map(issue => {
      const { reporter_id, ...issueData } = issue;
      const reporter = users.find(u => u.id === reporter_id) || null;
      return { ...issueData, reporter };
    });

    return sendSuccess(res, StatusCodes.OK, "Issues retrieved successfully", formattedIssues);
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve issues", error);
  }
};

export const fetchSingleIssue = async (req: Request, res: Response) => {
  try {
    const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    if (issueResult.rows.length === 0) { 
      return sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
    }

    const issue = issueResult.rows[0];
    const userResult = await pool.query('SELECT id, name, role FROM users WHERE id = $1', [issue.reporter_id]);
    
    const { reporter_id, ...issueData } = issue;
    const responseData = { 
      ...issueData, 
      reporter: userResult.rows[0] || null 
    };

    return sendSuccess(res, StatusCodes.OK, "Issue retrieved successfully", responseData);
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch issue", error);
  }
};

export const modifyIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;
    
    const checkIssue = await pool.query('SELECT * FROM issues WHERE id = $1', [id]);
    if (checkIssue.rows.length === 0) {
      return sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
    }

    const issue = checkIssue.rows[0];

    if (req.user?.role !== 'maintainer') {
      if (issue.reporter_id !== req.user?.id) {
        return sendError(res, StatusCodes.FORBIDDEN, "You are not authorized to edit this issue");
      }
      if (issue.status !== 'open') {
        return sendError(res, StatusCodes.CONFLICT, "Cannot edit an issue that is already closed or in progress");
      }
    }

    const updateQuery = `
      UPDATE issues 
      SET title = COALESCE($1, title), 
          description = COALESCE($2, description), 
          type = COALESCE($3, type), 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $4 
      RETURNING *
    `;
    const updatedResult = await pool.query(updateQuery, [title, description, type, id]);
    
    return sendSuccess(res, StatusCodes.OK, "Issue updated successfully", updatedResult.rows[0]);
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update issue", error);
  }
};

export const removeIssue = async (req: Request, res: Response) => {
  try {
    const checkIssue = await pool.query('SELECT id FROM issues WHERE id = $1', [req.params.id]);
    if (checkIssue.rows.length === 0) {
      return sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
    }
    await pool.query('DELETE FROM issues WHERE id = $1', [req.params.id]);
    return sendSuccess(res, StatusCodes.OK, "Issue deleted successfully");
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete issue", error);
  }
};