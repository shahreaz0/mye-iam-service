import UserRoles from "supertokens-node/recipe/userroles"
import express from "express"
import { verifySession } from "supertokens-node/recipe/session/framework/express"

import * as userController from "../controllers/user.controller"

const router = express.Router()

router.get("/", userController.getAllUsers)
router.get("/info", verifySession(), userController.getUserInfo)
router.put("/payment-session/:userId", userController.updatePaymentSessionId)
router.delete(
  "/:id",
  verifySession({
    overrideGlobalClaimValidators: async (globalValidators) => [
      ...globalValidators,
      UserRoles.UserRoleClaim.validators.includes("on"),
    ],
  }),
  userController.deleteChildUser
)

export default router
