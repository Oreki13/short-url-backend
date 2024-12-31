import express, {NextFunction, Request, Response} from 'express'
import ShortLinkController from '../controller/short_link'
import {authMiddleware} from "../middleware/auth_middleware";
import {UserRequest} from "../type/user_request";

const router = express.Router()
router.use((req: Request, res: Response, next: NextFunction) => authMiddleware(<UserRequest>req, res, next));
router.get("/", ShortLinkController.getAll)
router.post("/", ShortLinkController.store)
router.put("/:id", ShortLinkController.update)
router.delete("/:id", ShortLinkController.delete)

export default router