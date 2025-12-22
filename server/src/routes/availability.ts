import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { isOrgAdmin } from '../lib/helper';

const router = Router();

/**
 * Helper function: Get availability with fallback to general
 * If no org-specific availability exists, use general availability
 */
async function getAvailabilityWithFallback(employeeId: string, userId: string) {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Get org-specific availability
    const orgAvailability = await prisma.availability.findMany({
        where: { employeeId }
    });

    // Get general availability
    const generalAvailability = await prisma.generalAvailability.findMany({
        where: { userId }
    });

    // Create a map of days that have org-specific availability
    const orgDays = new Set(orgAvailability.map(a => a.dayOfWeek));

    // For days without org-specific availability, use general
    const fallbackAvailability = generalAvailability
        .filter(ga => !orgDays.has(ga.dayOfWeek))
        .map(ga => ({
            id: ga.id,
            employeeId,
            dayOfWeek: ga.dayOfWeek,
            status: ga.status,
            startTime: ga.startTime,
            endTime: ga.endTime,
            createdAt: ga.createdAt,
            updatedAt: ga.updatedAt,
            isGeneral: true // Mark as fallback
        }));

    // Combine and sort
    return [...orgAvailability, ...fallbackAvailability].sort((a, b) => {
        return DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek);
    });
}

/**
 * GET Method
 * Purpose -> View all availability for an organization (admin view with fallback)
 * Access -> Only Admin/Owner
 * Returns -> All employees' availability (org-specific + general fallback)
 */
router.get('/organizations/:orgId/availability', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId } = req.params;

        const organization = await prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                employees: {
                    where: { status: 'APPROVED' },
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
            }
        });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const isAdmin = await isOrgAdmin(userId, orgId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can view all availability' });
        }

        // Get availability for each employee (with fallback)
        const allAvailability = await Promise.all(
            organization.employees.map(async (employee) => {
                const availability = await getAvailabilityWithFallback(
                    employee.id,
                    employee.userId
                );

                // Attach employee info to each availability entry
                return availability.map(avail => ({
                    ...avail,
                    employee: {
                        id: employee.id,
                        user: employee.user
                    }
                }));
            })
        );

        // Flatten and sort
        const flattenedAvailability = allAvailability.flat().sort((a, b) => {
            // Sort by last name, then by day
            const lastNameCompare = a.employee.user.lastName.localeCompare(b.employee.user.lastName);
            if (lastNameCompare !== 0) return lastNameCompare;

            const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            return DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek);
        });

        res.json(flattenedAvailability);
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

/**
 * GET Method
 * Purpose -> View my own availability for an organization (with fallback to general)
 * Access -> Any approved employee
 * Returns -> My availability entries for this organization (org-specific + general fallback)
 */
router.get('/organizations/:orgId/availability/me', authMiddleware, async (req: Request, res: Response) => {
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
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get availability with fallback to general
        const availability = await getAvailabilityWithFallback(employee.id, userId);

        res.json(availability);
    } catch (error) {
        console.error('Error fetching my availability', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

/**
 * PUT Method
 * Purpose -> Submit/Update my availability for an organization
 * Access -> Any APPROVED Employee
 * Body -> {
 *  availability: [
 *     { dayOfWeek: "Monday", status: "AVAILABLE", startTime?: "09:00", endTime?: "17:00" },
 *     { dayOfWeek: "Tuesday", status: "UNAVAILABLE" },
 *     { dayOfWeek: "Friday", status: "PREFERRED", startTime?: "18:00", endTime?: "23:00" }
 *   ]
 * }
 */
router.put('/organizations/:orgId/availability', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId } = req.params;
        const { availability } = req.body;

        if (!availability || !Array.isArray(availability) || availability.length === 0) {
            return res.status(400).json({
                error: 'availability array is required'
            });
        }

        const employee = await prisma.employee.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: orgId
                }
            }
        });

        if (!employee || employee.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Access denied' });
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
                        employeeId_dayOfWeek: {
                            employeeId: employee.id,
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
                        dayOfWeek: entry.dayOfWeek,
                        status: entry.status,
                        startTime: startDateTime,
                        endTime: endDateTime
                    }
                })
            })
        )
        res.status(200).json({
            message: 'Availability updated successfully',
            availability: results
        });
    } catch (error) {
        console.error('Error submitting availability:', error);
        res.status(500).json({ error: 'Failed to submit availability' });
    }
});

/**
 * GET Method
 * Purpose -> View a specific employee's availability (admin only)
 * Access -> Admin/Owner only
 * Returns -> Employee's availability (org-specific + general fallback)
 */
router.get('/organizations/:orgId/availability/:employeeId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId, employeeId } = req.params;

        const isAdmin = await isOrgAdmin(userId, orgId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can view employee availability' });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
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
        });

        if (!employee || employee.organizationId !== orgId) {
            return res.status(404).json({ error: 'Employee not found in this organization' });
        }

        const availability = await getAvailabilityWithFallback(employee.id, employee.userId);

        res.json({
            employee: {
                id: employee.id,
                user: employee.user
            },
            availability
        });
    } catch (error) {
        console.error('Error fetching employee availability:', error);
        res.status(500).json({ error: 'Failed to fetch employee availability' });
    }
});

export default router;
