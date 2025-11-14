import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import healthRouter from "./routes/health.routes";
import authRouter from "./routes/auth.routes";

export function setupRoutes(app: Application) {

      // Swagger documentation
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

      // OpenAPI JSON export for Postman
      app.get('/api-docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
      });

      // API routes
      app.use(authRouter);
      app.use(healthRouter);

}