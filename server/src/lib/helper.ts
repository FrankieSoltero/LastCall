import { prisma } from "./prisma";

export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            employees: {
                where: {
                    userId: userId,
                    status: 'APPROVED'
                }
            }
        }
    })

    if (!org) return false;

    return (
        org.ownerId === userId ||
        org.employees.some(emp => emp.role === 'ADMIN' || emp.role === 'OWNER')
    )
}