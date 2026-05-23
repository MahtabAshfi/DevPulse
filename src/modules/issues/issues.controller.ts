import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import pool from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';

export const createIssueRecord = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;

    if (!title || !description || !type){
      return sendError(res, StatusCodes.BAD_REQUEST, "Missing required parameters");
    }
    if (title.length > 150){
      return sendError(res, StatusCodes.BAD_REQUEST, "Title exceeds 150 characters");
    }
    if (description.length < 20){
      return sendError(res, StatusCodes.BAD_REQUEST, "Description is too short");
    }

    const result = await pool.query(
      'INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, type, req.user?.id]
    );
    sendSuccess(res, StatusCodes.CREATED, "New issue created successfully", result.rows[0]);
  } catch (error) {
    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create issue", error);
  }
};

export const fetchAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort = 'newest', type, status } = req.query;
    let baseQuery = 'SELECT * FROM issues';
    const queryParams: unknown[] = [];
    const filterConditions: string[] = [];

    if (type){ 
      queryParams.push(type); 
      filterConditions.push(`type = $${queryParams.length}`); 
    }
    if (status){ 
      queryParams.push(status); 
      filterConditions.push(`status = $${queryParams.length}`); 
    }
    if (filterConditions.length > 0){ 
      baseQuery += ` WHERE ${filterConditions.join(' AND ')}`;
    }

    baseQuery += sort === 'oldest' ? ' ORDER BY created_at ASC' : ' ORDER BY created_at DESC';
    const issuesData = (await pool.query(baseQuery, queryParams)).rows;

    if (issuesData.length === 0){ 
      return res.status(StatusCodes.OK).json({ success: true, data: [] });
    }

    const distinctUserIds = [...new Set(issuesData.map(item => item.reporter_id))];
    const userQuery = await pool.query('SELECT id, name, role FROM users WHERE id = ANY($1)', [distinctUserIds]);
    const usersData = userQuery.rows;

    const formattedData = issuesData.map(issue => {
      const { reporter_id, ...cleanIssue } = issue;
      const matchedUser = usersData.find(u => u.id === reporter_id) || null;
      return { ...cleanIssue, reporter: matchedUser };
    });

    res.status(StatusCodes.OK).json({ success: true, data: formattedData });
  } catch (error) {
    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error retrieving dataset", error);
  }
};

export const fetchSingleIssue = async (req: Request, res: Response) => {
  try {
    const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    if (issueResult.rows.length === 0){ 
      return sendError(res, StatusCodes.NOT_FOUND, "Requested issue not found");
    }

    const issue = issueResult.rows[0];
    const userResult = await pool.query('SELECT id, name, role FROM users WHERE id = $1', [issue.reporter_id]);
    const { reporter_id, ...cleanIssue } = issue;

    res.status(StatusCodes.OK).json({ 
      success: true, 
      data: { ...cleanIssue, reporter: userResult.rows[0] || null } 
    });
  } catch (error) {
    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching single issue", error);
  }
};

export const modifyIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;
    
    const existingResult = await pool.query('SELECT * FROM issues WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) return sendError(res, StatusCodes.NOT_FOUND, "Target issue missing");

    const issue = existingResult.rows[0];

    if (req.user?.role !== 'maintainer') {
      if (issue.reporter_id !== req.user?.id) return sendError(res, StatusCodes.FORBIDDEN, "You can't edit another user's issue");
      if (issue.status !== 'open') return sendError(res, StatusCodes.CONFLICT, "Can't edit an issue that's not open");
    }

    const updateQuery = `
      UPDATE issues 
      SET title = COALESCE($1, title), description = COALESCE($2, description), type = COALESCE($3, type), updated_at = CURRENT_TIMESTAMP 
      WHERE id = $4 RETURNING *
    `;
    const updatedRecord = await pool.query(updateQuery, [title, description, type, id]);
    
    sendSuccess(res, StatusCodes.OK, "Issue updated successfully", updatedRecord.rows[0]);
  } catch (error) {
    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Update encountered an error", error);
  }
};

export const removeIssue = async (req: Request, res: Response) => {
  try {
    const checkRecord = await pool.query('SELECT id FROM issues WHERE id = $1', [req.params.id]);
    if (checkRecord.rows.length === 0) return sendError(res, StatusCodes.NOT_FOUND, "Issue not found");

    await pool.query('DELETE FROM issues WHERE id = $1', [req.params.id]);
    sendSuccess(res, StatusCodes.OK, "Issue deleted successfully");
  } catch (error) {
    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete record", error);
  }
};