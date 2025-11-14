import express from 'express';
import * as http from 'node:http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { setupRoutes } from './router';

dotenv.config();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

export const createApp = () => {
      const app = express();

      // Middleware
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cookieParser());

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