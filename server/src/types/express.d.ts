/**
 * This extends Express's Request type to have an 
 * optional userId property
 */
import { Request } from "express";
declare global {
    namespace Express {
        interface Request {
            userId?: string
        }
    }
}