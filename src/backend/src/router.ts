import { Application } from "express";
import { auth } from "./middleware/auth";
import healthRouter from "./routes/health.routes";

export function setupRoutes(app: Application) {

      app.use(auth);
      app.use(healthRouter);

}