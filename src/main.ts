import {logger} from "./application/logger";
import {web} from "./application/web";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT ?? "8080";
web.listen(port, ()=>{
    logger.info(`Listening on port ${port}`)
})