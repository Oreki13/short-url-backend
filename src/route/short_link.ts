import express from 'express'
import ShortLinkController from '../controller/short_link'
import {authMiddleware} from "../middleware/auth_middleware";

const router = express.Router()
// @ts-ignore
router.use(authMiddleware);
router.get("/user", ShortLinkController.getAll)
router.post("/user", ShortLinkController.store)

export default router