import express from 'express';
import * as http from 'node:http';
import dotenv from 'dotenv';
import { setupRoutes } from './router';
import { run } from 'node:test';


dotenv.config();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

export const runServer = async () => {
      const app = express();

      setupRoutes(app);

      const server = http.createServer(app);

      server.listen(PORT, () => {
            console.log(`Server is running at http://${HOST}:${PORT}`);
      });
};

void runServer();