import express, { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../middleware/auth_middleware";
import { UserController } from "../../controller/user";
import { UserRequest } from "../../type/user_request";
import { adminMiddleware } from "../../middleware/admin_middleware";

const router = express.Router();

router.use((req: Request, res: Response, next: NextFunction) => authMiddleware(<UserRequest>req, res, next));
router.use((req: Request, res: Response, next: NextFunction) => adminMiddleware(<UserRequest>req, res, next));


router.get("/", (req: Request, res: Response, next: NextFunction) => UserController.getListUsers(<UserRequest>req, res, next))
router.post("/create", (req: Request, res: Response, next: NextFunction) => UserController.createUser(<UserRequest>req, res, next))
router.delete("/:id", (req: Request, res: Response, next: NextFunction) => UserController.deleteUser(<UserRequest>req, res, next))
router.get("/:id", (req: Request, res: Response, next: NextFunction) => UserController.findUserById(<UserRequest>req, res, next))

export default router;