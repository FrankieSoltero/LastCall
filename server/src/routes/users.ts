import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

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
        const { id, email, firstName, lastName, phone } = req.body;

        // Validate required fields
        if (!id || !email || !firstName || !lastName || !phone) {
            return res.status(400).json({
                error: 'id, email, phone, firstName, and lastName are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }
        const phoneRegex = /^[\d\s\-\(\)\+\.]+$/
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                error: 'Invalid phone format'
            })
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
                lastName: lastName.trim(),
                phone: phone.trim()
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
/**
 * GET Method
 * Returns the current user profile
 * Error messsage -> Failed to fetch user profile
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                phone: true,
                lastName: true,
                firstName: true,
                shareEmail: true,
                sharePhone: true,
                pushEnabled: true,
                emailEnabled: true,
                createdAt: true,
                updatedAt: true,
                pushToken: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

/**
 * PATCH Method 
 * Updates user profile (firstName, lastName, email, phone)
 */
router.patch('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { firstName, lastName, email, phone } = req.body;

        const updateData: any = {};
        if (firstName !== undefined) {
            if (firstName.trim().length === 0 || firstName.trim().length > 100) {
                return res.status(400).json({
                    error: 'First name must be between 1 and 100 characters'
                });
            }
            updateData.firstName = firstName.trim();
        }

        if (lastName !== undefined) {
            if (lastName.trim().length === 0 || lastName.trim().length > 100) {
                return res.status(400).json({
                    error: 'Last name must be between 1 and 100 characters'
                });
            }
            updateData.lastName = lastName.trim();
        }

        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            if (email.length > 255) {
                return res.status(400).json({
                    error: 'Email must be 255 characters or less'
                });
            }
            updateData.email = email.toLowerCase().trim();
        }

        if (phone !== undefined) {
            const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ error: 'Invalid phone format' });
            }
            updateData.phone = phone.trim();
        }

        // If no fields to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No valid fields provided for update'
            });
        }
        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: updateData,
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                shareEmail: true,
                sharePhone: true,
                pushEnabled: true,
                emailEnabled: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        res.json(updatedUser);
    } catch (error: any) {
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'field';
            return res.status(400).json({
                error: `A user with this ${field} already exists`
            });
        }
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});

/**
 * PATCH method
 * Update privacy settings
 */
router.patch('/me/privacy', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { shareEmail, sharePhone } = req.body;

        const updateData: any = {};

        if (shareEmail !== undefined) {
            if (typeof shareEmail !== 'boolean') {
                return res.status(400).json({
                    error: 'shareEmail must be boolean'
                })
            }
            updateData.shareEmail = shareEmail;
        }
        if (sharePhone !== undefined) {
            if (typeof sharePhone !== 'boolean') {
                return res.status(400).json({
                    error: 'sharePhone must be boolean'
                })
            }
            updateData.sharePhone = sharePhone;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No valid privacy settings provided'
            })
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                shareEmail: true,
                sharePhone: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        res.status(500).json({ error: 'Failed to update privacy settings' });
    }
});
/**
 * PATCH Method
 * Updates notification preferences
 */
router.patch('/me/notifications', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { pushEnabled, emailEnabled } = req.body;

        const updateData: any = {};

        if (pushEnabled !== undefined) {
            if (typeof pushEnabled !== 'boolean') {
                return res.status(400).json({
                    error: 'pushEnabled must be boolean'
                })
            }
            updateData.pushEnabled = pushEnabled;
        }
        if (emailEnabled !== undefined) {
            if (typeof emailEnabled !== 'boolean') {
                return res.status(400).json({
                    error: 'emailEnabled must be boolean'
                })
            }
            updateData.emailEnabled = emailEnabled;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No valid notification preferences provided'
            })
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                pushEnabled: true,
                emailEnabled: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
});
/**
 * DELETE Method
 * Deletes a user account (Cascade deletes all related data)
 */
router.delete('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        await prisma.user.delete({
            where: { id: userId }
        });
        res.json({
            message: 'User account deleted successfully'
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        console.error('Error deleting user account:', error);
        res.status(500).json({ error: 'Failed to delete user account' });
    }
});

/**
 * PATCH Method
 * Updates a users push notification token
 */
router.patch('/me/push-token', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { pushToken } = req.body;

        // Validation
        if (!pushToken || typeof pushToken !== 'string') {
            return res.status(400).json({ error: 'pushToken is required and must be a string' });
        }

        // Validate it's a valid Expo push token (starts with ExponentPushToken[)
        if (!pushToken.startsWith('ExponentPushToken[')) {
            return res.status(400).json({ error: 'Invalid Expo push token format' });
        }

        // Update user's push token
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { pushToken },
            select: {
                id: true,
                pushToken: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating push token:', error);
        res.status(500).json({ error: 'Failed to update push token' });
    }
});

export default router;
