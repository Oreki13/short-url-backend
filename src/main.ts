import {logger} from "./application/logger";
import {web} from "./application/web";
import dotenv from "dotenv";

const port = process.env.PORT ?? "8080";
dotenv.config();
web.listen(port, ()=>{
    logger.info(`Listening on port ${port}`)
    const test = new Error();
    logger.error("WHOOPPS", new Error("Shomething went wrong"));
})