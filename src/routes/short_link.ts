import express from 'express'
import AuthHelper from '../helpers/auth'
import ShortLinkController from '../controllers/short_link'

const router = express.Router()

router.all("/*", AuthHelper.accessTokenCheck)
router.get("/user", ShortLinkController.getAll)
router.post("/user", ShortLinkController.store)

export default router