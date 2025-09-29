import express, { NextFunction, Request, Response } from 'express';
import UserActivityController from '../../controller/user_activity';
import { authMiddleware } from '../../middleware/auth_middleware';
import { adminMiddleware } from '../../middleware/admin_middleware';
import { UserRequest } from "../../type/user_request";


const router = express.Router();

/**
 * Secured routes - admin only
 */
router.use((req: Request, res: Response, next: NextFunction) => authMiddleware(<UserRequest>req, res, next));
router.use((req: Request, res: Response, next: NextFunction) => adminMiddleware(<UserRequest>req, res, next));

/**
 * @route GET /api/v1/activity/log
 * @desc Retrieve paginated list of user activity logs
 * @access Admin
 */
router.get('/log', UserActivityController.getActivityLogs);

/**
 * @route POST /api/v1/activity/log
 * @desc Manually log user activity (Admin only)
 * @access Admin
 */
router.post('/log', UserActivityController.logActivity);

export default router;
