import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { isOrgAdmin } from '../lib/helper';

const router = Router();

/**
 * GET Method
 * Purpose -> List all roles for an organization
 * Access -> Any APPROVED employee
 * Returns -> Array of roles with counts
 */
router.get('/:orgId/roles', authMiddleware, async (req: Request, res: Response) => {
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

        const roles = await prisma.role.findMany({
            where: {
                organizationId: orgId
            },
            include: {
                _count: {
                    select: {
                        shifts: true,
                        employeeAssignments: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

/**
 * POST Method
 * Purpose -> Create a new role
 * Access -> Only ADMIN/OWNER
 * Body -> { name: "Bartender" }
 *
 * IMPORTANT: Role names must be unique within an organization
 */
router.post('/:orgId/roles', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { orgId } = req.params;
        const { name } = req.body;

        const isAdmin = await isOrgAdmin(userId, orgId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can create roles' });
        }

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Role name is required' });
        }

        const role = await prisma.role.create({
            data: {
                organizationId: orgId,
                name: name.trim()
            }
        });

        res.status(201).json(role);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                error: 'A role with this name already exists in this organization'
            });
        }
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
});

/**
 * PATCH Method
 * Purpose -> Update a role's name
 * Access -> Only ADMIN/OWNER
 * Body -> { name: "Lead Bartender" }
 */
router.patch('/roles/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { name } = req.body;

        const role = await prisma.role.findUnique({
            where: { id }
        });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const isAdmin = await isOrgAdmin(userId, role.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can update roles' });
        }

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Role name cannot be empty' });
        }

        const updated = await prisma.role.update({
            where: { id },
            data: {
                name: name.trim()
            }
        });

        res.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                error: 'A role with this name already exists in this organization'
            });
        }
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

/**
 * DELETE Method
 * Purpose -> Delete a role
 * Access -> Only ADMIN/OWNER
 *
 * IMPORTANT: Cannot delete if role is assigned to any shifts
 * IMPORTANT: Will cascade delete EmployeeRoleAssignments
 */
router.delete('/roles/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        shifts: true
                    }
                }
            }
        });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const isAdmin = await isOrgAdmin(userId, role.organizationId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can delete roles' });
        }

        if (role._count.shifts > 0) {
            return res.status(400).json({
                error: 'Cannot delete role that is assigned to shifts',
                shiftCount: role._count.shifts,
                hint: 'Delete or reassign all shifts with this role first'
            });
        }

        await prisma.role.delete({
            where: { id }
        });

        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Failed to delete role' });
    }
});

export default router;
