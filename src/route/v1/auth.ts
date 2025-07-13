import express, { Request, Response, NextFunction } from 'express'
import AuthController from '../../controller/auth';
import { authLimiter } from '../../middleware/auth_throttle';
import { authMiddleware } from "../../middleware/auth_middleware";
import { authActivityMiddleware } from '../../middleware/auth_activity_middleware';
import { UserRequest } from '../../type/user_request';

const router = express.Router();

// Apply auth activity middleware to all auth routes
router.use(authActivityMiddleware);

// Login dan refresh-token sudah dikecualikan dari CSRF di web.ts
router.get('/csrf-token', AuthController.getCsrfToken) // Endpoint untuk mendapatkan CSRF token
router.post('/login', authLimiter, AuthController.login)
router.get('/verify', AuthController.verify)
router.post('/refresh-token', authLimiter, AuthController.refreshToken)
router.post('/revoke-token', AuthController.revokeToken)
router.post('/logout', (req: Request, res: Response, next: NextFunction) => authMiddleware(<UserRequest>req, res, next), AuthController.logout)

export default router