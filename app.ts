import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { authenticateToken } from './middleware/authMiddleware';
import logger from './config/logger';
import mediaRoutes from './routes/mediaRoutes';
import authRoutes from './routes/authRoutes';
import folderRoutes from './routes/folderRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3333;

const corsOptions = {
  origin: '*', // Replace with the IP or domain of your React Native app
  optionsSuccessStatus: 200,
};

//app.use(cors(corsOptions));
//app.use(helmet());

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(
    { method: req.method, path: req.path, query: req.query, body: req.body },
    'Request received',
  );
  next();
});

declare global {
  var __basedir: string;
}
global.__basedir = __dirname;

app.use(express.urlencoded({ extended: false }));

// Serve static files from the 'uploads' folder, including subdirectories
app.use('/uploads', authenticateToken, express.static(path.resolve('./uploads')));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Error occurred');
  res.status(500).json({ error: 'Internal Server Error' });
});

app.use(mediaRoutes);
app.use(authRoutes);
app.use(folderRoutes);

app.get('/', authenticateToken, (err: any, req: Request, res: Response) => {
  logger.info(req);
  logger.error(err);
  return res.sendStatus(200);
});

app.listen(port, () => {
  logger.info({ port }, 'Server is running');
});
