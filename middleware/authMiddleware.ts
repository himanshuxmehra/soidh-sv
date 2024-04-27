import { NextFunction, Response } from "express";
import { AuthJwtToken } from "../models/global";
import logger from '../config/logger';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'your_default_jwt_secret';

// Authentication middleware
export const authenticateToken = (req: AuthJwtToken, res: Response, next: NextFunction) => {
    if (!req.headers['authorization']) return res.sendStatus(401);
    const token: string = req.headers['authorization']!.split(' ')[1];
    console.log(req.headers);
    console.log(token);
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, jwtSecret, (err: any, user: any) => {
      if (err) {
        logger.error(err);
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  };