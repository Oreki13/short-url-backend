import express from 'express'
import auth from './auth'
import shortLink from './short_link'
import user from "./user";

const router = express.Router();

router.use('/auth', auth)
router.use('/short', shortLink)
router.use('/user', user)


export default router