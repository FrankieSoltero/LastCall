import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import organizationsRouter from './routes/organization'
/**
 * This is the set up
 * app -> is our actual backend app that we start with express
 * Port -> Where we are running the server, default is 3000
 * app.use(cors) -> allow for our actual front end app to make requests
 * /health -> this is our health checkpoint to make sure the server is running
 * /api/test-db -> Test our database connection
 * 404 -> our page not found error response
 */
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString() 
    })
});

app.use('/api/test-db', async (_req: Request, res: Response) => {
    try {
        const userCount = await prisma.user.count();
        res.json({
            status: 'success',
            message: 'Database connected',
            userCount
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed'
        })
    }
})

/**
 * Below is our api protected route
 * it forces our auth middleware to run before the route hanlder
 * checks for a valid token, and adds the user id to the request if 
 * everything checks out
 * This allows the route handler to safely use the userId to get user data
 * @returns authenticated user info
 */

app.use('/api/protected', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: {id: req.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'You are authenticated',
            user
        });
    } catch (error) {
        console.error('Protected route error:', error);
        res.status(500).json({ error: 'Failed to fetch user'})
    }
})

app.use('/api/organizations', organizationsRouter);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
    })
})
/**
 * This is our error handler and must be last to catch any error thrown across routes
 * @returns consistent error responses
 */
app.use(errorHandler)

/**
 * This is where the server Starts
 */

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Run a health check at: http://localhost:${PORT}/health`)
    console.log(`Run a health check at: http://localhost:${PORT}/api/test-db`);

    process.on('SIGTERM', async () => {
        console.log("\nTermination Recieved");
        await prisma.$disconnect();
        process.exit(0);
    })

    process.on("SIGINT", async () => {
        console.log("\nSigInt received");
        await prisma.$disconnect();
        process.exit(0);
    })
})