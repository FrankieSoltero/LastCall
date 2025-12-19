import { Router, Request, Response} from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Below Our the two get routes we have
 * First one gets all the routes the user has access to
 * the seond one gets a single organization with details
 */

router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!

        const organizations = await prisma.organization.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    {
                        employees: {
                            some: {
                                userId: userId,
                                status: 'APPROVED'
                            }
                        }
                    }
                ]
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                _count: {
                    select: {
                        employees: true,
                        schedules: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(organizations)
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const organization = await prisma.organization.findUnique({
            where: {id},
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                employees: {
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
                },
                roles: true,
                schedules: {
                    orderBy: {
                        weekStartDate: 'desc'
                    },
                    take: 5
                }
            }
        });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const hasAccess = organization.ownerId === userId || organization.employees.some(emp => emp.userId === userId && emp.status === 'APPROVED');

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied'})
        }

        res.json(organization)
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({ error: 'Failed to fetch organization'})
    }
})

/**
 * POST Route
 * Below we have the post route to create a new organization
 * it requires a name and a description for the organization
 */

router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { name, description } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Organization name is required'});
        }

        if (name.trim().length > 255) {
            return res.status(400).json({ error: 'Organization name must be 255 characters or less' });
        }

        if (description && description.trim().length > 1000) {
            return res.status(400).json({ error: 'Description must be 1000 characters or less' });
        }

        const organization = await prisma.organization.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                ownerId: userId,
                employees: {
                    create: {
                        userId: userId,
                        role: 'OWNER',
                        status: 'APPROVED',
                        approvedAt: new Date()
                    }
                }
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        res.status(201).json(organization);
    } catch (error) {
        console.error('Error creating organization', error);
        res.status(500).json({ error: 'Failed to create organization'});
    }
});

/**
 * PATCH Method
 * Updates an organization can only be done by an owner
 * Needs a name and description in the body
 */

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { name, description } = req.body;

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        if (organization.ownerId !== userId) {
            return res.status(403).json({error: 'Only the owner can update this organization'})
        }

        if (name !== undefined && name.trim().length === 0) {
            return res.status(400).json({ error: 'Organization name cannot be empty' });
        }

        if (name && name.trim().length > 255) {
            return res.status(400).json({ error: 'Organization name must be 255 characters or less' });
        }

        if (description && description.trim().length > 1000) {
            return res.status(400).json({ error: 'Description must be 1000 characters or less' });
        }

        const updated = await prisma.organization.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(description !== undefined && { description: description?.trim() || null})
            },
            include: {
                owner: {
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
        console.error('Error updating organization:', error);
        res.status(500).json({ error: 'Failed to update organization' });
    }
})

/**
 * DELETE Method
 * Below is our delete method which deletes an organization
 * and can only be done by an owner
 */

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const organization = await prisma.organization.findUnique({
            where: {id}
        });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' })
        }

        if (organization.ownerId !== userId) {
            return res.status(403).json({ error: 'Only the owner can delete this organization' })
        }

        await prisma.organization.delete({
            where: {id}
        })

        res.json({ message: 'Organization deleted successfully' })
    } catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({ error: 'Failed to delete organization' })
    }
})

export default router
