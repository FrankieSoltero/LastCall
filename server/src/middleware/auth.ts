import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config();


const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);
/**
 * It checks for the authorization header
 * then extracts the token from the header
 * and finally verifies the token against our supabase db
 * then attatches the userId to the request and continues to the next handler
 * @param req our request
 * @param res our response
 * @param next our next function
 * @returns nothing
 */
export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: 'No Authorization header provided'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: 'No token provided'
            });
        }

        const { data: {user}, error} = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }

        req.userId = user.id;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            error: 'Authentication failed'
        });
    }
}