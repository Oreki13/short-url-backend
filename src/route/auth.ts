import express from 'express'
import AuthController from '../controller/auth';

const router = express.Router();

router.post('/login', AuthController.login)
router.get('/verify', AuthController.verify)
router.post('/refresh-token', AuthController.refreshToken)
router.post('/revoke-token', AuthController.revokeToken)
router.post('/logout', AuthController.logout)

export default router