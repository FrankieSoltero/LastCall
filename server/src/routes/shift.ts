import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { isOrgAdmin } from '../lib/helper';

const router = Router();

/**
 * Method GET 
 * Purpose -> List all shifts for a schedule
 * Access -> Any Approved employee can view
 * Returns -> Array of Shifts grouped by day
 */

router.get('/schedules/:scheduleId/shifts', authMiddleware, async (req: Request, res: Response) => {
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

        const shifts = await prisma.shift.findMany({
            where: {
                scheduleDay: {
                    scheduleId: scheduleId
                }
            },
            include: {
                scheduleDay: {
                    select: {
                        id: true,
                        date: true
                    }
                },
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
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
                { scheduleDay: { date: 'asc' } },
                { startTime: 'asc' }
            ]
        });
        res.json(shifts);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ error: 'Failed to fetch shifts' });
    }
});

/**
 * POST Method
 * Purpose -> Create a new shift on a specific day
 * Access -> Admin/Owner
 * Body: {
 *  roleId: uuid,
 *  startTime: "17:00",
 *  endTime?: "23:00",
 *  employeeId?: uuid
 * }
 */

router.post('/schedule-days/:scheduleDayId/shifts', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { scheduleDayId } = req.params;
        const { roleId, startTime, endTime, employeeId } = req.body;

        if (!roleId || !startTime) {
            return res.status(400).json({
                error: 'Role ID and Start Time are required'
            })
        }

        const scheduleDay = await prisma.scheduleDay.findUnique({
            where: { id: scheduleDayId },
            include: {
                schedule: {
                    include: {
                        organization: true
                    }
                }
            }
        });

        if (!scheduleDay) {
            return res.status(404).json({ error: 'Schedule day not found' });
        }

        const isAdmin = await isOrgAdmin(userId, scheduleDay.schedule.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: "Only admins can create shifts" });
        }

        if (scheduleDay.schedule.isPublished) {
            return res.status(400).json({
                error: 'Cannot create shifts on a published schedule'
            });
        }

        const role = await prisma.role.findFirst({
            where: {
                id: roleId,
                organizationId: scheduleDay.schedule.organizationId
            }
        });

        if (!role) {
            return res.status(404).json({
                error: 'Role not found in this organization'
            })
        }

        if (employeeId) {
            const employee = await prisma.employee.findFirst({
                where: {
                    id: employeeId,
                    organizationId: scheduleDay.schedule.organizationId,
                    status: 'APPROVED'
                },
                include: {
                    roleAssignments: {
                        where: {
                            roleId: roleId
                        }
                    }
                }
            });

            if (!employee) {
                return res.status(404).json({ error: "Employee not found or not approved" });
            }

            if (employee.roleAssignments.length === 0) {
                return res.status(400).json({
                    error: 'Employee is not qualified for this role',
                    hint: 'Assign employee to this role first by using the assign button in the employee section'
                });
            }
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            return res.status(400).json({
                error: 'Invalid startTime format. Use HH:MM',
                examples: ['09:00', '17:30', '23:45']
            });
        }

        if (endTime && !timeRegex.test(endTime)) {
            return res.status(400).json({
                error: 'Invalid endTime format. Use HH:MM',
                examples: ['09:00', '17:30', '23:45']
            });
        }

        const startDateTime = new Date(`1970-01-01T${startTime}:00Z`);
        const endDateTime = endTime ? new Date(`1970-01-01T${endTime}:00Z`) : null;

        if (endDateTime && endDateTime <= startDateTime) {
            return res.status(400).json({
                error: 'End time must be after start time'
            })
        }
        const shift = await prisma.shift.create({
            data: {
                scheduleDayId,
                roleId,
                startTime: startDateTime,
                ...(endDateTime && { endTime: endDateTime }),
                ...(employeeId && { employeeId })
            },
            include: {
                scheduleDay: {
                    select: {
                        id: true,
                        date: true
                    }
                },
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
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
            }
        });

        res.status(201).json(shift);
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ error: 'Failed to create shift' });
    }
});

/**
 * PATCH Method
 * Purpose -> Update a shift (change time, role, or assign/reassign employee)
 * Access -> Admin/Owner only
 * Body -> { startTime?, endTime?, roleId?, employeeId? }
 */
router.patch('/shifts/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { startTime, endTime, roleId, employeeId } = req.body;

        const shift = await prisma.shift.findUnique({
            where: { id },
            include: {
                scheduleDay: {
                    include: {
                        schedule: {
                            include: {
                                organization: true
                            }
                        }
                    }
                }
            }
        });

        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        const isAdmin = await isOrgAdmin(userId, shift.scheduleDay.schedule.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can update shifts' });
        }

        if (shift.scheduleDay.schedule.isPublished) {
            return res.status(400).json({
                error: 'Cannot update shifts on a published schedule'
            });
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (startTime && !timeRegex.test(startTime)) {
            return res.status(400).json({ error: 'Invalid startTime format. Use HH:MM' });
        }
        if (endTime && !timeRegex.test(endTime)) {
            return res.status(400).json({ error: 'Invalid endTime format. Use HH:MM' });
        }

        if (roleId) {
            const role = await prisma.role.findFirst({
                where: {
                    id: roleId,
                    organizationId: shift.scheduleDay.schedule.organizationId
                }
            });

            if (!role) {
                return res.status(404).json({ error: 'Role not found in this organization' });
            }
        }

        if (employeeId) {
            const finalRoleId = roleId || shift.roleId;

            const employee = await prisma.employee.findFirst({
                where: {
                    id: employeeId,
                    organizationId: shift.scheduleDay.schedule.organizationId,
                    status: 'APPROVED'
                },
                include: {
                    roleAssignments: {
                        where: {
                            roleId: finalRoleId
                        }
                    }
                }
            });

            if (!employee) {
                return res.status(404).json({ error: 'Employee not found or not approved' });
            }

            if (employee.roleAssignments.length === 0) {
                return res.status(400).json({
                    error: 'Employee is not qualified for this role'
                });
            }
        }

        const updateData: any = {};
        if (startTime) {
            updateData.startTime = new Date(`1970-01-01T${startTime}:00Z`);
        }
        if (endTime !== undefined) {
            updateData.endTime = endTime ? new Date(`1970-01-01T${endTime}:00Z`) : null;
        }
        if (roleId) {
            updateData.roleId = roleId;
        }
        if (employeeId !== undefined) {
            updateData.employeeId = employeeId;
        }

        const finalStartTime = updateData.startTime || shift.startTime;
        const finalEndTime = updateData.endTime !== undefined ? updateData.endTime : shift.endTime;

        if (finalEndTime && finalEndTime <= finalStartTime) {
            return res.status(400).json({
                error: 'End time must be after start time'
            });
        }

        const updated = await prisma.shift.update({
            where: { id },
            data: updateData,
            include: {
                scheduleDay: {
                    select: {
                        id: true,
                        date: true
                    }
                },
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
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
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ error: 'Failed to update shift' });
    }
});

/**
 * DELETE Method
 * Purpose -> Delete a shift
 * Access -> Admin/Owner only
 */
router.delete('/shifts/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const shift = await prisma.shift.findUnique({
            where: { id },
            include: {
                scheduleDay: {
                    include: {
                        schedule: true
                    }
                }
            }
        });

        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        const isAdmin = await isOrgAdmin(userId, shift.scheduleDay.schedule.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can delete shifts' });
        }

        if (shift.scheduleDay.schedule.isPublished) {
            return res.status(400).json({
                error: 'Cannot delete shifts from a published schedule'
            });
        }

        await prisma.shift.delete({
            where: { id }
        });

        res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({ error: 'Failed to delete shift' });
    }
});

export default router;