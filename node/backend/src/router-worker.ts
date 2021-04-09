import 'express-ws';
import { Router } from 'express';
import { workerRouter } from './controllers/worker';

const router: Router = Router();

router.use('/', workerRouter);

export default router;
