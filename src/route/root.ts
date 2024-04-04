import express from 'express'
import auth from './auth'
import shortLink from './short_link'

const router = express.Router();

router.use('/auth', auth)
router.use('/short', shortLink)


export default router