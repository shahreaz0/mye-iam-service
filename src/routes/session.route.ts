import express from "express"
import { verifySession } from "supertokens-node/recipe/session/framework/express"
import * as sessionController from "../controllers/session.controller"

const router = express.Router()

router.get(
  "/info",
  verifySession({ checkDatabase: true }),
  sessionController.getSessions
)

router.get("/:userId", sessionController.getAllSessionsForUser)

router.get("/revoke/all/:userId", sessionController.revokeAllSessionsOfAUser)
router.get("/tenants", sessionController.getAllTanents)

export default router
