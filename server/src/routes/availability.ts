import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { isOrgAdmin } from '../lib/helper';

const router = Router();

/**
 * GET Method 
 * Purpose -> View All availability submissions for a schedule (admin view)
 * Access -> Only Admin/Owner
 * Returns -> All Employees availability
 */
router.get('/schedules/:scheduleId/availability', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { scheduleId } = req.params;

        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
            include: {
                organization: true
            }
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const isAdmin = await isOrgAdmin(userId, schedule.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can view all availability' });
        }

        const availability = await prisma.availability.findMany({
            where: {
                scheduleId: scheduleId
            },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { employee: { user: { lastName: 'asc' } } },
                { dayOfWeek: 'asc' }
            ]
        });

        res.json(availability);
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Failed to fetch availbility' });
    }
});

/**
 * GET Method
 * Purpose -> View my own availability
 * Access -> Any Approved employee
 * Returns -> My Availability entries for this week
 */
router.get('/schedules/:scheduleId/availability/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { scheduleId } = req.params;

        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId }
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const employee = await prisma.employee.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: schedule.organizationId
                }
            }
        });

        if (!employee || employee.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Access Denied' });
        }

        const availability = await prisma.availability.findMany({
            where: {
                scheduleId: scheduleId,
                employeeId: employee.id
            },
            orderBy: {
                dayOfWeek: 'asc'
            }
        });

        res.json(availability);
    } catch (error) {
        console.error('Error fetching my availability', error);
        res.status(500).json({ error: 'Failed to fetch availabity' });
    }
});

/**
 * POST Method 
 * Purpose -> Submit/Update my availability for the week
 * Access -> Any APPROVED Employee
 * Body -> {
 *  availability: [
 *     { dayOfWeek: "Monday", status: "AVAILABLE", startTime?: "09:00", endTime?: "17:00" },
 *     { dayOfWeek: "Tuesday", status: "UNAVAILABLE" },
 *     { dayOfWeek: "Friday", status: "PREFERRED", startTime?: "18:00", endTime?: "23:00" }
 *   ]
 * }
 */
router.post('/schedules/:scheduleId/availability', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { scheduleId } = req.params;
        const { availability } = req.body;

        if (!availability || !Array.isArray(availability) || availability.length === 0) {
            return res.status(400).json({
                error: 'availability array is required'
            });
        }

        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId }
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const now = new Date();

        if (now > schedule.availabilityDeadline) {
            return res.status(400).json({
                error: 'Availability deadline has passed',
                deadline: schedule.availabilityDeadline
            });
        }

        const employee = await prisma.employee.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: schedule.organizationId
                }
            }
        });

        if (!employee || employee.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Access Denied' });
        }

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
                })
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

        const results = await Promise.all(
            availability.map(async (entry) => {
                const startDateTime = entry.startTime ? new Date(`1970-01-01T${entry.startTime}:00Z`) : null;
                const endDateTime = entry.endTime ? new Date(`1970-01-01T${entry.endTime}:00Z`) : null;

                return prisma.availability.upsert({
                    where: {
                        employeeId_scheduleId_dayOfWeek: {
                            employeeId: employee.id,
                            scheduleId: scheduleId,
                            dayOfWeek: entry.dayOfWeek
                        }
                    },
                    update: {
                        status: entry.status,
                        startTime: startDateTime,
                        endTime: endDateTime
                    },
                    create: {
                        employeeId: employee.id,
                        scheduleId: scheduleId,
                        dayOfWeek: entry.dayOfWeek,
                        status: entry.status,
                        startTime: startDateTime,
                        endTime: endDateTime
                    }
                })
            })
        )
        res.status(201).json({
            message: 'Availability submitted successfully',
            availability: results
        });
    } catch (error) {
        console.error('Error submitting availability:', error);
        res.status(500).json({ error: 'Failed to submit availability' });
    }
});

/**
 * PATCH Method
 * Purpose -> Update a single availability entry
 * Access -> Employee who owns it OR admin
 * Body -> { status?: "AVAILABLE", startTime?: "09:00", endTime?: "17:00" }
 *
 * IMPORTANT: Can't update after deadline (unless admin)
 */
router.patch('/availability/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { status, startTime, endTime } = req.body;

        const availability = await prisma.availability.findUnique({
            where: { id },
            include: {
                employee: true,
                schedule: true
            }
        });

        if (!availability) {
            return res.status(404).json({ error: 'Availability entry not found' });
        }

        const isAdmin = await isOrgAdmin(userId, availability.schedule.organizationId);
        const isOwner = availability.employee.userId === userId;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check deadline (only for non-admins)
        if (!isAdmin) {
            const now = new Date();
            if (now > availability.schedule.availabilityDeadline) {
                return res.status(400).json({
                    error: 'Availability deadline has passed'
                });
            }
        }

        // Validate status if provided
        if (status && !['AVAILABLE', 'UNAVAILABLE', 'PREFERRED'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be AVAILABLE, UNAVAILABLE, or PREFERRED'
            });
        }

        // Validate times if provided
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (startTime && !timeRegex.test(startTime)) {
            return res.status(400).json({ error: 'Invalid startTime format. Use HH:MM' });
        }
        if (endTime && !timeRegex.test(endTime)) {
            return res.status(400).json({ error: 'Invalid endTime format. Use HH:MM' });
        }

        // Build update data
        const updateData: any = {};
        if (status) updateData.status = status;
        if (startTime !== undefined) {
            updateData.startTime = startTime ? new Date(`1970-01-01T${startTime}:00Z`) : null;
        }
        if (endTime !== undefined) {
            updateData.endTime = endTime ? new Date(`1970-01-01T${endTime}:00Z`) : null;
        }

        // Validate times
        const finalStartTime = updateData.startTime !== undefined ? updateData.startTime : availability.startTime;
        const finalEndTime = updateData.endTime !== undefined ? updateData.endTime : availability.endTime;

        if (finalStartTime && finalEndTime && finalEndTime <= finalStartTime) {
            return res.status(400).json({
                error: 'End time must be after start time'
            });
        }

        // Update the entry
        const updated = await prisma.availability.update({
            where: { id },
            data: updateData
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
});

/**
 * DELETE Method
 * Purpose -> Delete an availability entry
 * Access -> Employee who owns it OR admin
 *
 * IMPORTANT: Can't delete after deadline (unless admin)
 */
router.delete('/availability/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const availability = await prisma.availability.findUnique({
            where: { id },
            include: {
                employee: true,
                schedule: true
            }
        });

        if (!availability) {
            return res.status(404).json({ error: 'Availability entry not found' });
        }

        const isAdmin = await isOrgAdmin(userId, availability.schedule.organizationId);
        const isOwner = availability.employee.userId === userId;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check deadline (only for non-admins)
        if (!isAdmin) {
            const now = new Date();
            if (now > availability.schedule.availabilityDeadline) {
                return res.status(400).json({
                    error: 'Availability deadline has passed'
                });
            }
        }

        await prisma.availability.delete({
            where: { id }
        });

        res.json({ message: 'Availability deleted successfully' });
    } catch (error) {
        console.error('Error deleting availability:', error);
        res.status(500).json({ error: 'Failed to delete availability' });
    }
});

export default router;
