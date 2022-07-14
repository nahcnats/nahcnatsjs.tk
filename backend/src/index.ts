import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import expressSession from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma, logger } from './utils';
import { CORS_ORIGIN } from './constants';

const PORT = process.env.PORT || 4000;

const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
}));
app.use(
    expressSession({
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 *24 *7 // 7 days
        },
        secret: String(process.env.SESSION_SECRET),
        resave: false,
        saveUninitialized: false,
        store: new PrismaSessionStore(
            prisma,
            {
                checkPeriod: 2 * 60 * 1000,  //ms
                dbRecordIdIsSessionId: true,
                dbRecordIdFunction: undefined,
            }
        )
    })
);

// Enable routes

// Listener
const server = app.listen(PORT, async () => {
    logger.info(`Server is listening at http://localhost:${PORT}`);
});

const signal = ["SIGTERM", "SIGINT"];

async function gracefulShutdown(signal: string) {
    process.on(signal, async () => {
        logger.info(`Good bye, got signal ${signal}`);
        server.close();

        process.exit(0);
    });
}

for (let i = 0; i < signal.length; i++) {
    gracefulShutdown(signal[i]);
}