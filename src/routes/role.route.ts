import express from "express"

import * as roleController from "../controllers/role.controller"
import validateResource from "../utils/validate-resource"
import * as roleSchemas from "../schemas/role.schema"

import { verifySession } from "supertokens-node/recipe/session/framework/express"

import UserRoles from "supertokens-node/recipe/userroles"

const router = express.Router()

router.get("/", roleController.getAllRolesHandler)

router.post(
  "/",
  validateResource(roleSchemas.createRoleSchema),
  roleController.createRoleHandler
)

router.get("/", roleController.getAllRolesHandler)

router.post(
  "/update",
  verifySession({
    overrideGlobalClaimValidators: async (globalValidators) => [
      ...globalValidators,
      UserRoles.UserRoleClaim.validators.includes("on"),
    ],
  }),
  validateResource(roleSchemas.assignRoleToUsersSchema),
  roleController.assignRoleToUserHandler
)

router.get(
  "/:role/permissions",
  validateResource(roleSchemas.getPermissionsForRoleSchema),
  roleController.getPermissionsForRoleHandler
)

router.delete("/:role", roleController.deleteRoleHandler)

export default router
