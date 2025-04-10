require("./sentry");
import express, { Express } from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import router from "../route/root";
import { errorMiddleware } from "../middleware/error_middleware";
import cors from "cors";
import { Sentry } from "./sentry";

const web: Express = express();
if (process.env.NODE_ENV !== "test") {
    Sentry.setupExpressErrorHandler(web);
}

web.use(cors(
    {
        origin: "*",
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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

export { web, Sentry }
