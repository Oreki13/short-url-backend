import express from 'express';
import healthRoute from './health';
import v1Route from './v1/root';
import { getCsrfToken } from '../middleware/csrf_middleware';

const router = express.Router();

router.use('/health', healthRoute);
router.use('/api/v1', v1Route);
router.get('/csrf-token', getCsrfToken);

export default router;