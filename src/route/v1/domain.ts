import express, { NextFunction, Request, Response } from 'express'
import DomainController from '../../controller/domain'
import { authMiddleware } from "../../middleware/auth_middleware";
import { UserRequest } from "../../type/user_request";

const router = express.Router()
router.use((req: Request, res: Response, next: NextFunction) => authMiddleware(<UserRequest>req, res, next));
router.get("/", DomainController.getAll)
router.post("/", DomainController.store)
router.put("/:id", DomainController.update)
router.delete("/:id", DomainController.delete)
router.post("/set-default", DomainController.setDefault)

export default router
