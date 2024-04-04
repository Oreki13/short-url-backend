import express, {Express} from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import router from "../route/root";
import {errorMiddleware} from "../middleware/error_middleware";

export const web: Express = express();

web.use(helmet());
web.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
web.use(bodyParser.json())
web.use('/', router)
web.use(errorMiddleware)
