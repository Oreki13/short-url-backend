import express from 'express'
import auth from './auth'
import shortLink from './short_link'
import user from "./user";
import healthRouter from './health';

const router = express.Router();

router.use('/auth', auth)
router.use('/health', healthRouter);
router.use('/short', shortLink)
router.use('/user', user)


export default router