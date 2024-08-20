import express, {Express} from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import router from "../route/root";
import {errorMiddleware} from "../middleware/error_middleware";
import cors from "cors";

export const web: Express = express();

web.use(cors(
    {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
));
web.use(helmet());
web.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
web.use(bodyParser.json())
web.use('/', router)
web.use(errorMiddleware)
