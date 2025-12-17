import { Request, Response, NextFunction } from "express";
/**
 * We take in any error from the middle ware and 
 * output an organized error response to the console
 * and to the front end user
 * @param err Error 
 * @param req Request
 * @param res Response
 * @param next Next Function
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('Error', {
        message: err.message,
        stack:err.stack,
        path: req.path,
        method: req.method
    });

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}