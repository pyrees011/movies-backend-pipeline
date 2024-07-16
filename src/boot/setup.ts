import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import morgan from 'morgan';
import mongoose from 'mongoose';

import logger, { streamOptions } from '../middleware/winston';

// Routes
import moviesRoutes from '../routes/movies.routes';
import authRoutes from '../routes/auth.routes';

// mongodb connection

try {
  mongoose.connect('mongodb://localhost:27017/epita');
  logger.info('MongoDB Connected');
} catch (error) {
  logger.error('Error connecting to DB' + error);
}

const app: express.Application = express();
const PORT: number = parseInt(process.env.PORT) || 3000;

const registerCoreMiddleWare = (): void => {
  try {
    // using our session
    app.use(
      session({
        secret: '1234',
        resave: false,
        saveUninitialized: true,
        cookie: {
          secure: false,
          httpOnly: true,
        },
      }),
    );

    app.use(morgan('combined', { stream: streamOptions }));
    app.use(express.json()); // returning middleware that only parses Json
    app.use(cors({})); // enabling CORS
    app.use(helmet()); // enabling helmet -> setting response headers

    // Route registration
    app.use('/movies', moviesRoutes);
    app.use('/auth', authRoutes);

    logger.http('Done registering all middlewares');
  } catch (err) {
    logger.error('Error thrown while executing registerCoreMiddleWare');
    process.exit(1);
  }
};

const handleError = (): void => {
  process.on('uncaughtException', (err) => {
    logger.error(`UNCAUGHT_EXCEPTION OCCURED : ${JSON.stringify(err.stack)}`);
  });
};

const startApp = (): void => {
  try {
    registerCoreMiddleWare();

    app.listen(PORT, (): void => {
      logger.info('Listening on 127.0.0.1:' + PORT);
    });

    // exit on uncaught exception
    handleError();
  } catch (err) {
    logger.error(
      `startup :: Error while booting the applicaiton ${JSON.stringify(
        err,
        undefined,
        2,
      )}`,
    );
    throw err;
  }
};

export default startApp;
