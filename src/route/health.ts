import express from 'express';
import HealthController from '../controller/health_check';

const router = express.Router();

router.get('/', HealthController.check);

export default router;