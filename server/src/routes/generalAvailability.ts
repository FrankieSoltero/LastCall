import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/users/me/general-availability
 * Purpose: Get my general (default) availability
 * Access: Any authenticated user
 * Returns: Array of general availability for all days
 */
router.get('/users/me/general-availability', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const availability = await prisma.generalAvailability.findMany({
            where: { userId },
            orderBy: {
                dayOfWeek: 'asc'
            }
        });

        res.json(availability);
    } catch (error) {
        console.error('Error fetching general availability:', error);
        res.status(500).json({ error: 'Failed to fetch general availability' });
    }
});

/**
 * PUT /api/users/me/general-availability
 * Purpose: Set/Update my general (default) availability
 * Access: Any authenticated user
 * Body: {
 *   availability: [
 *     { dayOfWeek: "Monday", status: "AVAILABLE", startTime?: "09:00", endTime?: "17:00" },
 *     { dayOfWeek: "Tuesday", status: "UNAVAILABLE" },
 *     ...
 *   ]
 * }
 */
router.put('/users/me/general-availability', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { availability } = req.body;

        if (!availability || !Array.isArray(availability)) {
            return res.status(400).json({
                error: 'availability array is required'
            });
        }

        // Validation
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const validStatuses = ['AVAILABLE', 'UNAVAILABLE', 'PREFERRED'];
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

        for (const entry of availability) {
            if (!entry.dayOfWeek || !validDays.includes(entry.dayOfWeek)) {
                return res.status(400).json({
                    error: `Invalid dayOfWeek: ${entry.dayOfWeek}. Must be one of: ${validDays.join(', ')}`
                });
            }

            if (!entry.status || !validStatuses.includes(entry.status)) {
                return res.status(400).json({
                    error: `Invalid status: ${entry.status}. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            if (entry.startTime && !timeRegex.test(entry.startTime)) {
                return res.status(400).json({
                    error: `Invalid startTime format for ${entry.dayOfWeek}. Use HH:MM`
                });
            }

            if (entry.endTime && !timeRegex.test(entry.endTime)) {
                return res.status(400).json({
                    error: `Invalid endTime format for ${entry.dayOfWeek}. Use HH:MM`
                });
            }

            if (entry.startTime && entry.endTime) {
                const start = new Date(`1970-01-01T${entry.startTime}:00Z`);
                const end = new Date(`1970-01-01T${entry.endTime}:00Z`);

                if (end <= start) {
                    return res.status(400).json({
                        error: `End time must be after start time for ${entry.dayOfWeek}`
                    });
                }
            }
        }

        // Upsert all availability entries
        const results = await Promise.all(
            availability.map(async (entry) => {
                const startDateTime = entry.startTime ? new Date(`1970-01-01T${entry.startTime}:00Z`) : null;
                const endDateTime = entry.endTime ? new Date(`1970-01-01T${entry.endTime}:00Z`) : null;

                return prisma.generalAvailability.upsert({
                    where: {
                        userId_dayOfWeek: {
                            userId,
                            dayOfWeek: entry.dayOfWeek
                        }
                    },
                    update: {
                        status: entry.status,
                        startTime: startDateTime,
                        endTime: endDateTime
                    },
                    create: {
                        userId,
                        dayOfWeek: entry.dayOfWeek,
                        status: entry.status,
                        startTime: startDateTime,
                        endTime: endDateTime
                    }
                });
            })
        );

        res.json({
            message: 'General availability updated successfully',
            availability: results
        });
    } catch (error) {
        console.error('Error updating general availability:', error);
        res.status(500).json({ error: 'Failed to update general availability' });
    }
});

/**
 * GET /api/users/:userId/general-availability
 * Purpose: Get a specific user's general availability
 * Access: Organization admin (to view their employee's default availability)
 * Returns: User's general availability
 */
router.get('/users/:userId/general-availability', authMiddleware, async (req: Request, res: Response) => {
    try {
        const requesterId = req.userId!;
        const { userId } = req.params;

        // Check if requester has permission (is admin of an org where this user is an employee)
        const sharedOrg = await prisma.organization.findFirst({
            where: {
                AND: [
                    {
                        employees: {
                            some: {
                                userId: requesterId,
                                role: { in: ['OWNER', 'ADMIN'] },
                                status: 'APPROVED'
                            }
                        }
                    },
                    {
                        employees: {
                            some: {
                                userId: userId,
                                status: 'APPROVED'
                            }
                        }
                    }
                ]
            }
        });

        if (!sharedOrg && requesterId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const availability = await prisma.generalAvailability.findMany({
            where: { userId },
            orderBy: {
                dayOfWeek: 'asc'
            }
        });

        res.json(availability);
    } catch (error) {
        console.error('Error fetching user general availability:', error);
        res.status(500).json({ error: 'Failed to fetch general availability' });
    }
});

export default router;
