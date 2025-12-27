import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import organizationsRouter from './routes/organization';
import schedulesRouter from './routes/schedules';
import employeeRouter from './routes/employee';
import shiftRouter from './routes/shift';
import availabilityRouter from './routes/availability';
import generalAvailabilityRouter from './routes/generalAvailability';
import rolesRouter from './routes/roles';
import usersRouter from './routes/users';
import helmet from 'helmet';
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

/**
 * Validate required environment variables on startup
 * This prevents the server from starting with missing configuration
 */
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ FATAL ERROR: Missing required environment variable: ${envVar}`);
        console.error('Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }
}

const app = express();



const PORT = process.env.PORT || 3000;

// CORS configuration - allows all origins for mobile app API
app.use(cors({
    origin: '*',
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500  // Increased for development - TODO: optimize frontend requests
})

/**
 * Security middleware
 * - JSON body parser with size limit to prevent memory exhaustion attacks
 * - Helmet adds security headers to protect against common vulnerabilities
 */
app.use(express.json({ limit: '10mb' }));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true }
}));


app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    })
});
app.use('/api', limiter);

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
        console.log(req.userId);
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true
            }
        });
        console.log(user);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Protected route error:', error);
        res.status(500).json({ error: 'Failed to fetch user' })
    }
})

// Public routes (no auth required)
app.use('/api/users', usersRouter);

// Protected routes (require auth)
app.use('/api/organizations', organizationsRouter);
app.use('/api/organizations', employeeRouter);
app.use('/api', employeeRouter);
app.use('/api/organizations', schedulesRouter);
app.use('/api', schedulesRouter);
app.use('/api', shiftRouter);
app.use('/api', availabilityRouter);
app.use('/api', generalAvailabilityRouter);
app.use('/api/organizations', rolesRouter);
app.use('/api', rolesRouter);

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