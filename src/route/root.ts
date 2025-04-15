import express from 'express'
import healthRouter from './health';
import v1Router from './v1/root';

const router = express.Router();

router.use('/v1', v1Router)
router.use('/health', healthRouter);


export default router