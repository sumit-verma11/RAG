import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { ingestRouter } from './routes/ingest.js';
import { queryRouter } from './routes/query.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendOrigins,
  })
);
app.use(express.json());
app.use(morgan('dev'));
app.use(healthRouter);
app.use(ingestRouter);
app.use(queryRouter);
app.use(errorHandler);

export default app;
