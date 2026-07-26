import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { healthRouter } from './routes/health.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(healthRouter);

export default app;
