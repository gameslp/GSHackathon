import express from 'express';
import * as http from 'node:http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import { setupRoutes } from './router';
import { RESOURCE_UPLOAD_DIR, THUMBNAIL_UPLOAD_DIR, SUBMISSION_UPLOAD_DIR } from './lib/uploads';

dotenv.config();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

export const createApp = () => {
      const app = express();

      const allowedOrigins =
            (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3001,http://localhost:3000')
                  .split(',')
                  .map((origin) => origin.trim())
                  .filter(Boolean);

      const corsOptions: CorsOptions = {
            origin: (origin, callback) => {
                  if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                  } else {
                        callback(new Error('Not allowed by CORS'));
                  }
            },
            credentials: true,
      };

      // Middleware
      app.use(cors(corsOptions));
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cookieParser());
      app.use('/uploads/resources', express.static(RESOURCE_UPLOAD_DIR));
      app.use('/uploads/thumbnails', express.static(THUMBNAIL_UPLOAD_DIR));
      app.use('/uploads/submissions', express.static(SUBMISSION_UPLOAD_DIR));

      setupRoutes(app);

      return app;
};

export const runServer = async () => {
      const app = createApp();
      const server = http.createServer(app);

      server.listen(PORT, () => {
            console.log(`Server is running at http://${HOST}:${PORT}`);
      });
};

// Only run server if this is the main module
if (require.main === module) {
      void runServer();
}
