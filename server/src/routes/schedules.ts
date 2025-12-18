import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { error } from 'console';
import { isOrgAdmin } from '../lib/helper';

const router = Router();

/**
 * GET Method 
 * Purpose -> It lists all schedule for an organization
 * Access -> Any approved employee can view
 * Returns -> An Array of Schedules with basic info
 */
router.get('/:orgId/schedules', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId } = req.params;

        const employee = await prisma.employee.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: orgId
                }
            }
        });

        if (!employee || employee.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Access denied' })
        }

        const schedules = await prisma.schedule.findMany({
            where: { organizationId: orgId },
            include: {
                _count: {
                    select: {
                        scheduleDays: true,
                        availability: true
                    }
                }
            },
            orderBy: {
                weekStartDate: 'desc'
            }
        });
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
});

/**
 * GET Method
 * Purpose -> Get single schedule with all its details 
 * Access -> Any approved employee in org
 * Returns -> Full Schedule object with nested data
 */
router.get('/schedules/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        ownerId: true
                    }
                },
                scheduleDays: {
                    include: {
                        shifts: {
                            include: {
                                role: true,
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
                            orderBy: {
                                startTime: 'asc'
                            }
                        }
                    },
                    orderBy: {
                        date: 'asc'
                    }
                },
                availability: {
                    include: {
                        employee: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
        res.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

/**
 * POST Method
 * Purpose -> Create a new weekly schedule
 * Needs to be able to create a schedule of individual days as well
 */
router.post('/:orgId/schedules', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId } = req.params;
        const { weekStartDate, availabilityDeadline, operatingDays } = req.body;

        const isAdmin = await isOrgAdmin(userId, orgId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can create schedules' });
        }

        if (!weekStartDate || !availabilityDeadline) {
            return res.status(400).json({
                error: 'Week start date and availability deadline are required'
            })
        }

        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const daysToCreate = operatingDays && Array.isArray(operatingDays) && operatingDays.length > 0 ? operatingDays : validDays;

        const invalidDays = daysToCreate.filter(day => !validDays.includes(day));

        if (invalidDays.length > 0) {
            return res.status(400).json({
                error: `Invalid days: ${invalidDays.join(', ')} Valid days are: ${validDays.join(', ')}`
            });
        }

        const startDate = new Date(weekStartDate);
        const deadline = new Date(availabilityDeadline);

        if (deadline >= startDate) {
            return res.status(400).json({
                error: 'Availability deadline must be before week start date'
            });
        }

        const dayNameToOffset: { [key: string]: number } = {
            'Monday': 0,
            'Tuesday': 1,
            'Wednesday': 2,
            'Thursday': 3,
            'Friday': 4,
            'Saturday': 5,
            'Sunday': 6
        };

        const scheduleDaysData = daysToCreate.map(dayName => {
            const offset = dayNameToOffset[dayName];
            const date = new Date(startDate.getTime() + offset * 24 * 60 * 60 * 1000);

            return { date }
        });

        const schedule = await prisma.schedule.create({
            data: {
                organizationId: orgId,
                weekStartDate: startDate,
                availabilityDeadline: deadline,
                isPublished: false,
                scheduleDays: {
                    create: scheduleDaysData
                }
            },
            include: {
                scheduleDays: {
                    orderBy: {
                        date: 'asc'
                    }
                }
            }
        });
        res.status(201).json(schedule);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                error: 'A schedule already exists for this week'
            });
        }
        console.error('Error creating schedule:', error);
        res.status(500).json({ error: 'Failed to create schedule' });
    }
});

/**
 * PATCH Method
 * Purpose -> Update the schedule details
 * Access -> Admin/Owner only
 * Body -> { availabilityDeadline?: "2024-12-14", weekStartDate?: "2024-12-16"}
 */
router.patch('/schedules/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { weekStartDate, availabilityDeadline } = req.body;

        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                organization: true
            }
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const isAdmin = await isOrgAdmin(userId, schedule.organizationId);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can update schedules' });
        }

        if (schedule.isPublished) {
            return res.status(400).json({ error: 'Cannot update a published schedule' })
        }

        const newStartDate = weekStartDate ? new Date(weekStartDate) : schedule.weekStartDate;
        const newDeadline = availabilityDeadline ? new Date(availabilityDeadline) : schedule.availabilityDeadline;

        if (newDeadline >= newStartDate) {
            return res.status(400).json({
                error: 'Availability deadline must be before the week start date'
            });
        }

        const updated = await prisma.schedule.update({
            where: { id },
            data: {
                ...(weekStartDate && { weekStartDate: newStartDate }),
                ...(availabilityDeadline && { availabilityDeadline: newDeadline })
            }
        });
        res.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                error: 'A schedule already exists for this week'
            });
        }
        console.error('Failed to update the schedule details:', error);
        res.status(500).json({ error: 'Failed to update the schedule '});
    }
});

/**
 * PATCH Method
 * Purpose -> Add or remove operating days from a schedule
 * Access -> Only Admin/Owner
 * Body -> { addDays?: ["Saturday", "Sunday"], removeDays?: ["Monday"] }
 *
 * IMPORTANT: Cannot modify published schedules
 * IMPORTANT: Cannot remove days that have shifts (must delete shifts first)
 */
router.patch('/schedules/:id/days', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { addDays, removeDays } = req.body;

        // Get the schedule with all its days and shifts
        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                scheduleDays: {
                    include: {
                        shifts: true  // Need to check if days have shifts
                    }
                }
            }
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        // Only admins can update
        const isAdmin = await isOrgAdmin(userId, schedule.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can update schedules' });
        }

        // Business rule: Can't edit published schedules
        if (schedule.isPublished) {
            return res.status(400).json({
                error: 'Cannot modify days of a published schedule'
            });
        }

        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayNameToOffset: { [key: string]: number } = {
            'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
            'Friday': 4, 'Saturday': 5, 'Sunday': 6
        };

        // === REMOVE DAYS ===
        if (removeDays && Array.isArray(removeDays) && removeDays.length > 0) {
            // Validate day names
            const invalidDays = removeDays.filter(day => !validDays.includes(day));
            if (invalidDays.length > 0) {
                return res.status(400).json({
                    error: `Invalid days: ${invalidDays.join(', ')}`
                });
            }

            // Calculate which dates to remove
            const datesToRemove = removeDays.map(dayName => {
                const offset = dayNameToOffset[dayName];
                const date = new Date(schedule.weekStartDate.getTime() + offset * 24 * 60 * 60 * 1000);
                return date.toISOString().split('T')[0];  // Format as "YYYY-MM-DD"
            });

            // Find the ScheduleDays to delete
            const daysToDelete = schedule.scheduleDays.filter(sd => {
                const sdDate = new Date(sd.date).toISOString().split('T')[0];
                return datesToRemove.includes(sdDate);
            });

            // Check if any of these days have shifts
            const daysWithShifts = daysToDelete.filter(sd => sd.shifts.length > 0);
            if (daysWithShifts.length > 0) {
                return res.status(400).json({
                    error: `Cannot remove days that have shifts. Please delete shifts first.`,
                    daysWithShifts: daysWithShifts.map(sd => ({
                        date: sd.date,
                        shiftCount: sd.shifts.length
                    }))
                });
            }

            // Delete the days
            await prisma.scheduleDay.deleteMany({
                where: {
                    id: {
                        in: daysToDelete.map(sd => sd.id)
                    }
                }
            });
        }

        // === ADD DAYS ===
        if (addDays && Array.isArray(addDays) && addDays.length > 0) {
            // Validate day names
            const invalidDays = addDays.filter(day => !validDays.includes(day));
            if (invalidDays.length > 0) {
                return res.status(400).json({
                    error: `Invalid days: ${invalidDays.join(', ')}`
                });
            }

            // Calculate which dates to add
            const datesToAdd = addDays.map(dayName => {
                const offset = dayNameToOffset[dayName];
                const date = new Date(schedule.weekStartDate.getTime() + offset * 24 * 60 * 60 * 1000);
                return { date };
            });

            // Check if any of these days already exist
            const existingDates = schedule.scheduleDays.map(sd =>
                new Date(sd.date).toISOString().split('T')[0]
            );
            const duplicates = datesToAdd.filter(({ date }) => {
                const dateStr = new Date(date).toISOString().split('T')[0];
                return existingDates.includes(dateStr);
            });

            if (duplicates.length > 0) {
                return res.status(400).json({
                    error: 'Some days already exist in this schedule',
                    duplicates: duplicates.map(d => d.date)
                });
            }

            // Create the new days
            await prisma.scheduleDay.createMany({
                data: datesToAdd.map(({ date }) => ({
                    scheduleId: schedule.id,
                    date
                }))
            });
        }

        // Fetch and return the updated schedule
        const updatedSchedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                scheduleDays: {
                    orderBy: {
                        date: 'asc'
                    }
                }
            }
        });

        res.json(updatedSchedule);
    } catch (error) {
        console.error('Error updating schedule days:', error);
        res.status(500).json({ error: 'Failed to update schedule days' });
    }
});

/**
 * POST Method
 * Purpose -> Publish a schedule meaning it is viewable by everyone
 * Access -> Only Admin/Owner
 * Body -> None
 */
router.post('/schedules/:id/publish', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const schedule = await prisma.schedule.findUnique({
            where: { id } 
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const isAdmin = await isOrgAdmin(userId, schedule.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can publish schedules' })
        }

        const published = await prisma.schedule.update({
            where: { id },
            data: {
                isPublished: true,
                publishedAt: new Date()
            }
        });

        /**
         * Email notifications 
         * Push Notifications
         * SMS Notifications 
         * These all go here
         */

        res.json({
            message: 'Schedule published successfully',
            schedule: published
        });
    } catch (error) {
        console.error('Error publishing schedule:', error);
        res.status(500).json({ error: 'Failed to publish schedule' });
    }
});

/**
 * Delet Method
 * Purpose -> Delete a schedule
 * Access -> Only Admin/Owner
 */

router.delete('/schedules/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const schedule = await prisma.schedule.findUnique({
            where: { id }
        });
        
        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' })
        }

        const isAdmin = await isOrgAdmin(userId, schedule.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can delete schedules' })
        }

        await prisma.schedule.delete({
            where: { id }
        });
        res.json({
            message: 'Schedule deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

export default router;