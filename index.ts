import express, { Express } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import router from './src/routes/root'
import bodyParser from 'body-parser';
import cors from 'cors';
import pino from 'pino-http'

dotenv.config();

const app: Express = express();
const port = process.env.PORT ?? "8080";
app.use(helmet());
app.use(pino())
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json())
app.use(cors())
app.use('/', router)
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});



