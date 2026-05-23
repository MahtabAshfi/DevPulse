import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import pool from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password){
      return sendError(res, StatusCodes.BAD_REQUEST, "All fields are required");
    }

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0){
      return sendError(res, StatusCodes.BAD_REQUEST, "Email already in use");
    }

    const secureHash = await bcrypt.hash(password, 10);
    const assignedRole = role === 'maintainer' ? 'maintainer' : 'contributor';

    const insertQuery = `
      INSERT INTO users (name, email, password, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, role, created_at, updated_at
    `;
    const result = await pool.query(insertQuery, [name, email, secureHash, assignedRole]);
    
    sendSuccess(res, StatusCodes.CREATED, "User registered successfully", result.rows[0]);
  } catch (error) {
    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Registration failed", error);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const userData = userResult.rows[0];

    if (!userData || !(await bcrypt.compare(password, userData.password))) {
      return sendError(res, StatusCodes.UNAUTHORIZED, "Invalid login credentials provided");
    }

    const payload = { id: userData.id, name: userData.name, role: userData.role };
    const tokenString = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '24h' });

    const { password: _, ...safeProfile } = userData;

    sendSuccess(res, StatusCodes.OK, "Login successful", { token: tokenString, user: safeProfile });
  } catch (error) {
    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Authentication failed", error);
  }
};