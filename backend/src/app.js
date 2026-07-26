import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { healthRouter } from './routes/health.js';
import { ingestRouter } from './routes/ingest.js';
import { queryRouter } from './routes/query.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(healthRouter);
app.use(ingestRouter);
app.use(queryRouter);
app.use(errorHandler);

export default app;
