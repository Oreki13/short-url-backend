import express from 'express'
import AuthController from '../../controller/auth';
import { authLimiter } from '../../middleware/auth_throttle';

const router = express.Router();

router.post('/login', authLimiter, AuthController.login)
router.get('/verify', AuthController.verify)
router.post('/refresh-token', authLimiter, AuthController.refreshToken)
router.post('/revoke-token', AuthController.revokeToken)
router.post('/logout', AuthController.logout)

export default router