import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * POST Method
 * Purpose -> Create a new user in the database (called during signup)
 * Access -> Public (no auth required - happens during registration)
 * Body -> { id: string, email: string, firstName: string, lastName: string }
 *
 * IMPORTANT: This is called by the frontend when a user signs up with Supabase
 * The 'id' comes from Supabase Auth and must match
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        console.log("Hit the user create route");
        const { id, email, firstName, lastName } = req.body;

        // Validate required fields
        if (!id || !email || !firstName || !lastName) {
            return res.status(400).json({
                error: 'id, email, firstName, and lastName are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        // Validate field lengths
        if (firstName.trim().length > 100) {
            return res.status(400).json({
                error: 'First name must be 100 characters or less'
            });
        }

        if (lastName.trim().length > 100) {
            return res.status(400).json({
                error: 'Last name must be 100 characters or less'
            });
        }

        if (email.length > 255) {
            return res.status(400).json({
                error: 'Email must be 255 characters or less'
            });
        }

        // Create user in database
        const user = await prisma.user.create({
            data: {
                id,
                email: email.toLowerCase().trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim()
            }
        });

        res.status(201).json(user);
    } catch (error: any) {
        // Handle unique constraint violation (user already exists)
        if (error.code === 'P2002') {
            return res.status(400).json({
                error: 'User with this email already exists'
            });
        }
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

export default router;
