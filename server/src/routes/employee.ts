import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';
import { isOrgAdmin } from '../lib/helper';

const router = Router();


router.get('/:orgId/employees', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId } = req.params;

        const hasAccess = await isOrgAdmin(userId, orgId);

        if (!hasAccess) {
            const employee = await prisma.employee.findUnique({
                where: {
                    userId_organizationId: {
                        userId,
                        organizationId: orgId
                    }
                }
            })
            if (!employee || employee.status !== 'APPROVED') {
                return res.status(403).json({ error: 'Access Denied' })
            }
        }

        const employees = await prisma.employee.findMany({
            where: { organizationId: orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: [
                { status: 'asc' },
                { createdAt: 'desc' }
            ]
        })

        res.json(employees)
    } catch (error) {
        console.error('Error fetching employees', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
})
/**
 * GET Method
 * Purpose -> Gets a single employee for employee role validation
 * Returns -> Employee record with the user id, first and last name, and email
 */
router.get('/:orgId/employee', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId } = req.params;

        const employee = await prisma.employee.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: orgId
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!employee) {
            return res.status(403).json({ error: 'Access Denied' });
        }

        return res.json(employee);

    } catch (error) {
        console.error('Error fetching employee', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
})

/**
 * POST Method this is where invite links are created
 * Body requires the amount of days until expiration
 */

router.post('/:orgId/employees/invite', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId } = req.params;
        const { expiresInDays = 7 } = req.body;

        const isAdmin = await isOrgAdmin(userId, orgId);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admin and owners can create invite links' });
        }

        // Validate expiresInDays (1-30 days)
        if (expiresInDays < 1 || expiresInDays > 30) {
            return res.status(400).json({
                error: 'Invite link expiration must be between 1 and 30 days'
            });
        }

        // Clean up expired invite links for this organization
        await prisma.inviteLink.deleteMany({
            where: {
                organizationId: orgId,
                expiresAt: { lt: new Date() }
            }
        });

        const token = crypto.randomBytes(32).toString('hex');

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const inviteLink = await prisma.inviteLink.create({
            data: {
                organizationId: orgId,
                token,
                expiresAt,
                createdById: userId
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
        res.status(201).json({
            ...inviteLink,
            inviteUrl: `${process.env.FRONTEND_URL || 'exp://localhost:8081'}/invite/${token}`
        });
    } catch (error) {
        console.error('Error creating invite link:', error);
        res.status(500).json({ error: 'failed to create invite link' })
    }
});

/**
 * POST Method -> this is where someone can join an organization via an invite token
 * Second Post Method -> Changes the Role Assignment for an employee -> Frankie -> Bartender new role
 */

router.post('/invite/:token', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { token } = req.params;

        const invite = await prisma.inviteLink.findUnique({
            where: { token },
            include: {
                organization: true
            }
        })

        if (!invite) {
            return res.status(404).json({ error: 'Invalid invite link' })
        }

        if (new Date() > invite.expiresAt) {
            return res.status(400).json({ error: 'Invite link has expired' })
        }

        const existingEmployee = await prisma.employee.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: invite.organizationId
                }
            }
        })

        if (existingEmployee) {
            return res.status(400).json({
                error: 'You are already a member of this organization',
                status: existingEmployee.status
            })
        }

        const employee = await prisma.employee.create({
            data: {
                userId,
                organizationId: invite.organizationId,
                role: 'EMPLOYEE',
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        })

        res.status(201).json({
            message: 'Request sent! Waiting for admin approval',
            employee
        })
    } catch (error) {
        console.error('Error joining organization:', error)
        res.status(500).json({ error: 'Failed to join organization' })
    }
})

router.post('/:orgId/employees/:employeeId/roles', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!
        const { orgId, employeeId } = req.params
        const { roleId } = req.body

        // Check if user is admin/owner
        const isAdmin = await isOrgAdmin(userId, orgId)
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins and owners can assign roles' })
        }

        // Verify the role belongs to this organization
        const role = await prisma.role.findFirst({
            where: {
                id: roleId,
                organizationId: orgId
            }
        })

        if (!role) {
            return res.status(404).json({ error: 'Role not found in this organization' })
        }

        // Verify employee belongs to this organization
        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                organizationId: orgId
            }
        })

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found in this organization' })
        }

        // Create the assignment
        const assignment = await prisma.employeeRoleAssignment.create({
            data: {
                employeeId,
                roleId
            },
            include: {
                role: true
            }
        })

        res.status(201).json(assignment)
    } catch (error: any) {
        // Handle duplicate assignment
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Employee already assigned to this role' })
        }
        console.error('Error assigning role:', error)
        res.status(500).json({ error: 'Failed to assign role' })
    }
})
/**
 * PATCH Method this updates the employee, could be approval -> role change -> etc
 */
router.patch('/:orgId/employees/:employeeId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!
        const { orgId, employeeId } = req.params
        const { status, role } = req.body

        const isAdmin = await isOrgAdmin(userId, orgId)
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins and owners can update employees' })
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                organization: true
            }
        })

        if (!employee || employee.organizationId !== orgId) {
            return res.status(404).json({ error: 'Employee not found' })
        }

        if (employee.role === 'OWNER') {
            return res.status(400).json({ error: 'Cannot modify the organization owner' })
        }

        if (role && !['OWNER', 'ADMIN', 'EMPLOYEE'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' })
        }
        if (status && !['PENDING', 'APPROVED', 'DENIED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' })
        }

        // Update employee
        const updated = await prisma.employee.update({
            where: { id: employeeId },
            data: {
                ...(status && {
                    status,
                    ...(status === 'APPROVED' && { approvedAt: new Date() })
                }),
                ...(role && { role })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        })

        res.json(updated)
    } catch (error) {
        console.error('Error updating employee:', error)
        res.status(500).json({ error: 'Failed to update employee' })
    }
})


/**
 * DELETE Methods
 * Method one deletes an Employee outright
 * Method two deletes an Employees Role assignment
 */
router.delete('/:orgId/employees/:employeeId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!
        const { orgId, employeeId } = req.params  // ← Get BOTH params

        // Check if user is admin/owner
        const isAdmin = await isOrgAdmin(userId, orgId)
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins and owners can remove employees' })
        }

        // Get the EMPLOYEE being removed
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        })

        if (!employee || employee.organizationId !== orgId) {
            return res.status(404).json({ error: 'Employee not found' })
        }

        // Can't remove the owner
        if (employee.role === 'OWNER') {
            return res.status(400).json({ error: 'Cannot remove the organization owner' })
        }

        // Delete EMPLOYEE
        await prisma.employee.delete({
            where: { id: employeeId }
        })

        res.json({ message: 'Employee removed successfully' })
    } catch (error) {
        console.error('Error removing employee:', error)
        res.status(500).json({ error: 'Failed to remove employee' })
    }
})

router.delete('/:orgId/employees/:employeeId/roles/:roleId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!
        const { orgId, employeeId, roleId } = req.params

        // Check if user is admin/owner
        const isAdmin = await isOrgAdmin(userId, orgId)
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins and owners can remove role assignments' })
        }

        // Find and delete the assignment
        await prisma.employeeRoleAssignment.deleteMany({
            where: {
                employeeId,
                roleId
            }
        })

        res.json({ message: 'Role assignment removed' })
    } catch (error) {
        console.error('Error removing role assignment:', error)
        res.status(500).json({ error: 'Failed to remove role assignment' })
    }
})


export default router