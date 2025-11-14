import { Router } from "express";
const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
      res.status(200).send({ status: 'OK' });
});

export default healthRouter;